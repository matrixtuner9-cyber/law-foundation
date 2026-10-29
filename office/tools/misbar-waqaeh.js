#!/usr/bin/env node
'use strict';
/* الوقائع الفلسطينية (الجريدة الرسمية) في قاعدة مِسْبار، من ملفات نصية مصدرها «المقتفي» (معهد الحقوق، جامعة بيرزيت):
   texts/<السنة>/<issue_165 | special_42m>/id_<رقم المقتفي>.txt — في رأس كل ملف: Source URL, Year, Issue/index, Title.
   لكل ملف:
     • تشريع موجود في القاعدة (بالعنوان كاملاً، أو بالنوع والرقم والسنة مع تشابه العنوان): يبقى رقمه كما هو،
       ويُضاف إليه العدد وتاريخ النشر؛ ويُملأ نصه إن كان بعنوانه فقط، ويُستبدل إن كان مستخرجاً آلياً من PDF (نص الوقائع أنظف)؛
       ولا يُمسّ نص كامل من مصدر آخر.
     • غير موجود: يُضاف تشريعاً فلسطينياً جديداً برقم بعد أكبر رقم في القاعدة.
     • تطابق غير مؤكد (أكثر من مرشح ولا يرجح أحدها): لا يُدمج، ويُكتب في تقرير للمراجعة.
   النص يُنقل كما هو حرفياً (إزالة سطور الرأس فقط).
   الاستعمال: node tools/misbar-waqaeh.js --db <قاعدة> --dir <…/texts> [--dry] [--report out.json] */
const fs = require('fs'), path = require('path'), { DatabaseSync } = require('node:sqlite');
const { norm, scrub } = require('../lib/misbar');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d };
const DB = arg('db'), DIR = arg('dir'), DRY = process.argv.includes('--dry'), REPORT = arg('report', '');
if (!DB || !DIR) { console.error('الاستعمال: --db <قاعدة> --dir <مجلد texts>'); process.exit(2) }

const nz = s => String(s || '').replace(/[ً-ْـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[^ء-ي0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
const KIND = t => /^قرار بقانون/.test(t) ? 'qb' : /^قانون/.test(t) ? 'law' : /^نظام/.test(t) ? 'reg' : /^مرسوم/.test(t) ? 'dec' : /^قرار/.test(t) ? 'cab' : /^تعليمات/.test(t) ? 'ins' : /^امر/.test(t) ? 'ord' : 'oth';
const LTYPE = { qb: 'قرار بقانون', law: 'قانون', reg: 'نظام', dec: 'مرسوم رئاسي', cab: 'قرار', ins: 'تعليمات', ord: 'أمر', oth: 'أخرى' };
const numYear = t => { const m = /رقم\s*(\d+)\s*لسنه\s*(\d{4})/.exec(t); return m ? { no: m[1], year: Number(m[2]) } : null };
const keyOf = t => { const n = nz(t), y = numYear(n); return y ? KIND(n) + ':' + y.no + ':' + y.year : null };
const words = t => new Set(nz(t).split(' ').filter(w => w.length > 2 && !/^\d+$/.test(w)));
const sim = (a, b) => { const A = words(a), B = words(b); if (!A.size || !B.size) return 0; let s = 0; for (const w of A) if (B.has(w)) s++; return s / Math.min(A.size, B.size) };

/* قراءة ملف: رأس المقتفي ثم النص */
function parse(p, y, issueDir) {
  const raw = fs.readFileSync(p, 'utf8').replace(/^﻿/, '').replace(/\r/g, '');
  const lines = raw.split('\n'), hdr = {}; let i = 0;
  for (; i < Math.min(lines.length, 12); i++) {
    const m = /^(Source URL|Source|Year|Issue\/index|Title):\s*(.*)$/.exec(lines[i]); if (m) { hdr[m[1]] = m[2].trim(); continue }
    if (/^For authoritative legal verification/.test(lines[i])) { i++; break }
  }
  const body = lines.slice(i).join('\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const iss = hdr['Issue/index'] || '', dm = /(\d{1,2})-(\d{1,2})-(\d{4})/.exec(iss);
  const date = dm ? `${dm[3]}-${dm[2].padStart(2, '0')}-${dm[1].padStart(2, '0')}` : '';
  const sp = /^special_(\d+)(m*)$/.exec(issueDir), is = /^issue_(\d+)$/.exec(issueDir);
  const gazette = is ? String(Number(is[1])) : sp ? 'ممتاز ' + sp[1] + (sp[2].length > 1 ? ' (' + sp[2].length + ')' : '') : issueDir;
  const id = (/id=(\d+)/.exec(hdr['Source URL'] || '') || /(\d+)/.exec(path.basename(p)) || [])[1];
  return { p, id, year: Number(hdr.Year) || Number(y), title: scrub(hdr.Title || ''), url: hdr['Source URL'] || '', issueText: iss, gazette, date, body };
}

const files = [];
for (const y of fs.readdirSync(DIR)) { const yd = path.join(DIR, y); if (!fs.statSync(yd).isDirectory()) continue;
  for (const iss of fs.readdirSync(yd)) { const idir = path.join(yd, iss); if (!fs.statSync(idir).isDirectory()) continue;
    for (const f of fs.readdirSync(idir)) if (/\.txt$/i.test(f)) files.push(parse(path.join(idir, f), y, iss)) } }

const db = new DatabaseSync(DB);
const rows = db.prepare("SELECT id,ext_id,title,case_no,subject,year,date,body,meta,has_text FROM docs WHERE src='PS_LEGISLATION'").all();
const byT = new Map(), byK = new Map(), byExt = new Set(rows.map(r => String(r.ext_id)));
for (const r of rows) { const t = nz(r.title); if (!byT.has(t)) byT.set(t, []); byT.get(t).push(r); const k = keyOf(r.title); if (k) { if (!byK.has(k)) byK.set(k, []); byK.get(k).push(r) } }

function match(x) {
  const ex = byT.get(nz(x.title)) || [];
  if (ex.length === 1) return { r: ex[0], how: 'title' };
  const cands = ex.length > 1 ? ex : (byK.get(keyOf(x.title)) || []);
  if (!cands.length) return { r: null };
  /* أكثر من مرشح، أو مرشح بالرقم فقط: يرجح من يشابه العنوان وتطابق سنته */
  const sc = cands.map(r => ({ r, s: sim(x.title, r.title) + (Number(r.year) === x.year ? 0.2 : 0) + (r.date && r.date === x.date ? 0.5 : 0) })).sort((a, b) => b.s - a.s);
  if (sc[0].s >= 0.75 && (sc.length === 1 || sc[0].s - sc[1].s >= 0.25)) return { r: sc[0].r, how: ex.length > 1 ? 'title+date' : 'number', s: +sc[0].s.toFixed(2) };
  /* المرشحون الأعلى نسخ مكررة في القاعدة للتشريع نفسه (العنوان المطبّع واحد): يُربط العدد بها كلها، ويُملأ نص أقدمها رقماً */
  const top = sc.filter(c => c.s >= 0.75 && sc[0].s - c.s < 0.25);
  if (top.length > 1 && new Set(top.map(c => nz(c.r.title))).size === 1 && sim(x.title, top[0].r.title) >= 0.75) { const all = top.map(c => c.r).sort((a, b) => a.id - b.id); return { r: all[0], dupes: all.slice(1), how: 'dupes' } }
  /* لا مرشح يشبه العنوان (نوع آخر يحمل الرقم والسنة نفسيهما، مثل قرار وزير مقابل قرار مجلس الوزراء): تشريع مختلف يُضاف */
  if (sc[0].s < 0.75 && !ex.length) return { r: null, distinct: true };
  return { r: null, unsure: sc.slice(0, 3).map(c => ({ id: c.r.id, title: c.r.title, s: +c.s.toFixed(2) })) };
}

const ftsTitle = d => norm((d.title || '') + ' ' + (d.case_no || '') + ' ' + (d.subject || ''));
const upd = db.prepare('UPDATE docs SET body=?, has_text=?, meta=?, date=CASE WHEN date IS NULL OR date=\'\' THEN ? ELSE date END WHERE id=?');
const updMeta = db.prepare('UPDATE docs SET meta=?, date=CASE WHEN date IS NULL OR date=\'\' THEN ? ELSE date END WHERE id=?');
const del = db.prepare("INSERT INTO fts(fts,rowid,title,body) VALUES('delete',?,?,?)"), ins = db.prepare('INSERT INTO fts(rowid,title,body) VALUES(?,?,?)');
const add = db.prepare('INSERT INTO docs(id,src,country,kind,ext_id,title,year,number,court,case_no,date,ltype,subject,status,status_code,url,body,cites,has_text,file_url,meta) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
let next = Number(db.prepare('SELECT MAX(id) m FROM docs').get().m) + 1;
const st = { files: files.length, gazetteOnly: 0, filled: 0, replacedPdf: 0, added: 0, unsure: 0, skippedSame: 0, empty: 0, dupes: 0, distinct: 0 }, unsure = [], touched = new Set();
const gz = x => ({ gazette_name: 'الوقائع الفلسطينية', gazette_number: x.gazette, gazette_date: x.date, gazette_issue: x.issueText, gazette_src: 'المقتفي — معهد الحقوق، جامعة بيرزيت', gazette_url: x.url });

if (!DRY) db.exec('BEGIN');
for (const x of files) {
  if (x.body.length < 30) { st.empty++; continue }
  if (byExt.has('mq' + x.id)) { st.skippedSame++; continue }
  const m = match(x);
  if (m.unsure) { st.unsure++; unsure.push({ file: x.p, title: x.title, gazette: x.gazette, date: x.date, candidates: m.unsure }); continue }
  if (m.r) {
    const r = m.r; if (touched.has(r.id)) { st.skippedSame++; continue } touched.add(r.id);
    let meta = {}; try { meta = JSON.parse(r.meta || '{}') } catch {}
    Object.assign(meta, gz(x));
    const len = String(r.body || '').length, fromPdf = meta.text_src === 'pdf';
    for (const d of m.dupes || []) { if (touched.has(d.id)) continue; touched.add(d.id); let dm = {}; try { dm = JSON.parse(d.meta || '{}') } catch {} Object.assign(dm, gz(x)); st.dupes++; if (!DRY) updMeta.run(JSON.stringify(dm), x.date, d.id) }
    if (len >= 200 && !fromPdf) { st.gazetteOnly++; if (!DRY) updMeta.run(JSON.stringify(meta), x.date, r.id); continue }
    meta.text_src = 'waqaeh'; meta.text_url = x.url; meta.text_at = new Date().toISOString().slice(0, 10); delete meta.text_src_prev;
    if (fromPdf) st.replacedPdf++; else st.filled++;
    if (!DRY) { const t = ftsTitle(r); del.run(r.id, t, norm(r.body || '')); upd.run(x.body, x.body.length > 200 ? 1 : 0, JSON.stringify(meta), x.date, r.id); ins.run(r.id, t, norm(x.body)) }
    continue;
  }
  if (m.distinct) st.distinct++;
  const n = nz(x.title), k = KIND(n), ny = numYear(n);
  const meta = { ...gz(x), type: LTYPE[k], text_src: 'waqaeh', text_url: x.url, text_at: new Date().toISOString().slice(0, 10) };
  const row = [next, 'PS_LEGISLATION', 'PS', 'law', 'mq' + x.id, x.title, ny ? ny.year : x.year, ny ? ny.no : '', '', '', x.date, LTYPE[k], '', '', '', x.url, x.body, '[]', x.body.length > 200 ? 1 : 0, '', JSON.stringify(meta)];
  if (!DRY) { add.run(...row); ins.run(next, ftsTitle({ title: x.title }), norm(x.body)) }
  byExt.add('mq' + x.id); next++; st.added++;
}
if (!DRY) {
  const version = new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + (next - 1) + '-w' + (st.added + st.filled + st.replacedPdf + st.gazetteOnly);
  db.prepare('INSERT OR REPLACE INTO meta(k,v) VALUES(?,?)').run('version', version);
  db.prepare('INSERT OR REPLACE INTO meta(k,v) VALUES(?,?)').run('built', new Date().toISOString());
  db.exec('COMMIT');
}
db.close();
if (REPORT) fs.writeFileSync(REPORT, JSON.stringify({ at: new Date().toISOString(), dry: DRY, ...st, unsure }, null, 1));
console.log(JSON.stringify({ ...st, dry: DRY }));
