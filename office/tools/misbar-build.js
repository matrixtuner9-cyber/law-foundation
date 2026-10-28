// بناء قاعدة مِسْبار (mithaq-lawindex.db) من ملفات المصادر الأصلية في مجلد واحد (افتراضياً E:\maqam).
// الاستعمال: node tools/misbar-build.js --src E:\maqam --out E:\...\mithaq-lawindex.db [--sql out.sql] [--limit 50]
// لا جلب من الإنترنت: يقرأ الملفات المنزّلة فقط. الملفات الأصلية لا تُعدَّل.
'use strict';
const fs = require('fs'), path = require('path'), { DatabaseSync } = require('node:sqlite');
const { norm, scrub, CHUNK, CHUNK_BASE } = require('../lib/misbar');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d };
const SRC = arg('src', 'E:\\maqam'), OUT = arg('out', 'mithaq-lawindex.db'), SQL = arg('sql', ''), LIMIT = Number(arg('limit', 0)) || 0;
const P = (...a) => path.join(SRC, ...a);
const exists = f => fs.existsSync(f) && fs.statSync(f).size > 0;
const jsonl = f => exists(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(l => l.trim()).map(l => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean) : [];
const J = v => { if (Array.isArray(v) || (v && typeof v === 'object')) return v; try { return JSON.parse(v || 'null') } catch { return null } };
const NOWY = new Date().getFullYear();
const yr = v => { const m = String(v ?? '').match(/(1[89]\d\d|20\d\d)/); const n = m ? Number(m[1]) : null; return n && n <= NOWY ? n : null };
const clean = s => String(s ?? '').replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
const log = (...a) => console.log(...a);

const docs = [];
const add = d => { if (!d.title && !d.body) return; d.body = scrub(clean(d.body)); d.cites = (d.cites || []).map(c => ({ ...c, title: scrub(c.title), text: scrub(c.text) })); d.has_text = d.body.length > 200 ? 1 : 0; docs.push(d) };
const cap = (arr) => LIMIT ? arr.slice(0, LIMIT) : arr;

/* 1) الأحكام الفلسطينية: data/judgments.jsonl (مع التشريعات المستشهد بها) */
{
  const rows = cap(jsonl(P('data', 'judgments.jsonl')));
  for (const j of rows) {
    const date = (String(j.title || '').match(/بتاريخ\s+(\d{4}-\d{2}-\d{2})/) || [])[1] || '';
    const cites = (J(j.cited_legislation) || []).map(c => ({ title: c.title, url: c.url, text: String(c.text || '').slice(0, 600) }));
    const cls = (J(j.classifications) || []).map(p => Array.isArray(p) ? p.join(' › ') : String(p));
    add({ src: 'PS_JUDGMENT', country: 'PS', kind: 'ruling', ext_id: String(j.id), title: j.title, year: yr(j.year), number: j.case_number || '', court: j.court || '',
      case_no: j.case_number && yr(j.year) ? `${j.case_number}/${yr(j.year)}` : '', date, ltype: j.litigation_type || '', subject: cls.join(' | '), status: '', status_code: '',
      url: j.url, file_url: j.full_text_file_url || '', body: j.full_text || '', cites, meta: { classifications: cls } });
  }
  log('PS_JUDGMENT', rows.length);
}
/* 2) التشريعات الفلسطينية: legislation/data/legislation.json (حالة السريان والمواد) */
{
  const f = P('legislation', 'data', 'legislation.json');
  const rows = cap(exists(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : []);
  const code = s => /ملغ/.test(s) ? 'repealed' : /موقوف/.test(s) ? 'suspended' : /الضفة الغربية وغزة/.test(s) ? 'in_force' : /الضفة الغربية|قطاع غزة/.test(s) ? 'partial' : /ساري/.test(s) ? 'in_force' : '';
  let majalla = false;
  for (const l of rows) {
    const arts = J(l.articles) || [];
    let body = l.content_text || arts.map(a => (a.label || '') + '\n' + (a.text || '')).join('\n\n');
    if (String(l.id) === '158' && body.length < 1000 && exists(P('legalstation', 'Majallat_AlAhkam_AlAdliya.txt'))) { body = fs.readFileSync(P('legalstation', 'Majallat_AlAhkam_AlAdliya.txt'), 'utf8'); majalla = true }
    add({ src: 'PS_LEGISLATION', country: 'PS', kind: 'law', ext_id: String(l.id), title: l.title, year: yr(l.year), number: String(l.number || ''), court: '', case_no: '',
      date: l.publication_date || '', ltype: l.legislation_subtype || l.legislation_type || '', subject: [l.subject, l.subject_sub].filter(Boolean).join(' › '),
      status: l.status || '', status_code: code(l.status || ''), url: l.url, file_url: l.full_text_file_url || '', body, cites: [],
      meta: { type: l.legislation_type, articles: Number(l.articles_count) || arts.length || 0, publication: l.publication_status || '' } });
  }
  log('PS_LEGISLATION', rows.length, majalla ? '(+ نص مجلة الأحكام العدلية)' : '');
}
/* 3) التشريعات الأردنية: من فهرس mithaq_search (العنوان: «الاسم | النوع | الحالة») */
{
  const f = P('mithaq_search', 'mithaq_search.db'); let n = 0;
  if (exists(f)) {
    const d = new DatabaseSync(f, { readOnly: true });
    for (const r of d.prepare("SELECT external_id, title, year, url, body FROM docs WHERE source='JO_LEGISLATION'" + (LIMIT ? ' LIMIT ' + LIMIT : '')).all()) {
      const [t, type, st] = String(r.title).split('|').map(s => s.trim());
      add({ src: 'JO_LEGISLATION', country: 'JO', kind: 'law', ext_id: r.external_id, title: t, year: yr(r.year), number: '', court: '', case_no: '', date: '', ltype: type || '',
        subject: '', status: st || '', status_code: st === 'ساري' ? 'in_force' : st ? 'repealed' : '', url: r.url, file_url: '', body: String(r.body || '').replace(/^#+\s*/gm, '').replace(/\*\*/g, ''), cites: [], meta: { origin: 'lob.gov.jo' } });
      n++;
    }
    d.close();
  }
  log('JO_LEGISLATION', n);
}
/* 4) التمييز الأردني: jordan_search.db + مبادئ المكتب الفني (بلا تكرار للرابط) */
{
  const seen = new Set(); let n = 0;
  const strip = s => String(s || '').replace(/^[\s\S]{0,200}?MainContent_DivContent"[^>]*>/, '').replace(/<[^>]+>/g, ' ').trim();
  const titleOf = (t, body) => clip1(t) || clip1(String(body).split('\n').map(s => s.trim()).find(s => s.length > 8) || '');
  function clip1(s) { s = String(s || '').trim(); return s.length > 160 ? s.slice(0, 157) + '…' : s }
  const f = P('jordan_search.db');
  if (exists(f)) {
    const d = new DatabaseSync(f, { readOnly: true });
    for (const r of d.prepare('SELECT id,url,title,source,topic,branch,case_refs,ref_year_max,content_text FROM judgments' + (LIMIT ? ' LIMIT ' + LIMIT : '')).all()) {
      if (seen.has(r.url)) continue; seen.add(r.url);
      const body = strip(r.content_text);
      add({ src: 'JO_CASSATION', country: 'JO', kind: 'ruling', ext_id: String(r.id), title: titleOf(r.title, body), year: yr(r.ref_year_max), number: '', court: 'محكمة التمييز الأردنية',
        case_no: String(r.case_refs || '').split(/[,،]/)[0].trim(), date: '', ltype: r.branch || '', subject: r.topic || '', status: '', status_code: '', url: r.url, file_url: '', body,
        cites: [], meta: { origin: r.source, case_refs: r.case_refs } });
      n++;
    }
    d.close();
  }
  for (const r of cap(jsonl(P('jordan-tamyiz', 'jordan_tamyiz_principles.jsonl')))) {
    if (seen.has(r.url)) continue; seen.add(r.url);
    const body = strip(r.content_text), refs = J(r.case_refs) || String(r.case_refs || '').split(',');
    const years = refs.map(x => yr(String(x).split('/')[1])).filter(Boolean);
    add({ src: 'JO_CASSATION', country: 'JO', kind: 'ruling', ext_id: 'jc-' + r.id, title: titleOf(r.title, body), year: years.length ? Math.max(...years) : null, number: '', court: 'محكمة التمييز الأردنية',
      case_no: String(refs[0] || '').trim(), date: '', ltype: '', subject: '', status: '', status_code: '', url: r.url, file_url: '', body, cites: [], meta: { origin: 'المجلس القضائي الأردني · المكتب الفني', case_refs: refs.join(', ') } });
    n++;
  }
  log('JO_CASSATION', n);
}
/* 5) التشريعات المصرية: أحدث نسخة متوفرة (v3 ثم v2 ثم v1) */
{
  const f = ['eg-laws-v3', 'eg-laws-v2', 'eg-laws'].map(x => P(x, 'eg_laws.jsonl')).find(exists);
  const rows = cap(f ? jsonl(f) : []);
  for (const l of rows) {
    const st = l.status || '';
    add({ src: 'EG_LEGISLATION', country: 'EG', kind: 'law', ext_id: l.id, title: String(l.title || '').replace(/\s*\|\s*منشورات قانونية\s*$/, '').replace(/\s*-\s*Lawyer Egypt.*$/i, ''), year: yr(l.year), number: String(l.number || ''), court: '', case_no: '', date: '',
      ltype: l.category || '', subject: l.law_name || '', status: st, status_code: /ملغ|غير ساري/.test(st) ? 'repealed' : /ساري/.test(st) ? 'in_force' : '', url: l.source_url || l.text_url, file_url: '', body: l.text || '', cites: [],
      meta: { origin: l.source, last_amendment: l.last_amendment || '', note: 'مصدر غير رسمي — يُراجع النص في الجريدة الرسمية' } });
  }
  log('EG_LEGISLATION', rows.length, f ? path.basename(path.dirname(f)) : '');
}

/* 6) أحكام محكمة النقض المصرية (المواد المدنية): eg-naqd/eg_naqd.jsonl من tools/eg-naqd-build.js — مبادئ ونص كامل حرفي */
{
  const rows = cap(jsonl(P('eg-naqd', 'eg_naqd.jsonl')));
  for (const d of rows) add({ ...d, src: 'EG_CASSATION', country: 'EG', kind: 'ruling', cites: [] });
  log('EG_CASSATION', rows.length);
}

/* 7) التمييز الأردني من منشورات مركز عدالة: «محاكم التمييز/data/jo_adaleh.jsonl» — المبادئ والتشريعات حرفياً، في المصدر نفسه JO_CASSATION */
{
  const { convert } = require('./jo-adaleh-build');
  const rows = cap(jsonl(P('محاكم التمييز', 'data', 'jo_adaleh.jsonl')));
  for (const r of rows) add(convert(r));
  log('JO_CASSATION (عدالة)', rows.length);
}
/* 8) المحكمة الدستورية العليا المصرية: eg-scc-v1/data/eg_scc_rules.jsonl — النص الكامل حرفياً */
{
  const { convert } = require('./eg-scc-build');
  const rows = cap(jsonl(P('eg-scc-v1', 'data', 'eg_scc_rules.jsonl')));
  for (const r of rows) add(convert(r));
  log('EG_CONSTITUTIONAL', rows.length);
}

/* إزالة إشارات جهة النشر (منشورات عدالة) من أحكام التمييز الأردنية القادمة من المصادر الأخرى أيضاً */
{ const { unbrandLines, BRAND_RX } = require('./jo-adaleh-build'), { cleanBody, cleanTitle } = require('./jo-ads-clean'); let n = 0;
  const ADS = /العبادي|alabbadi|bit\.ly|By mohammad|Read More|Section Title|عقاركو/i;
  for (const d of docs) if (d.src === 'JO_CASSATION') { const ad = /^abbadi-/.test(d.ext_id) || ADS.test(d.body) || ADS.test(d.title);
    if (!ad && !BRAND_RX.test(d.body) && !BRAND_RX.test(d.title)) continue;
    d.body = unbrandLines(d.body); d.title = unbrandLines(d.title); if (ad) { d.body = cleanBody(d.body); d.title = cleanTitle(d.title); d.has_text = d.body.length > 200 ? 1 : 0 } n++ }
  log('JO_CASSATION تنظيف إشارات النشر والإعلانات', n) }

/* الكتابة */
if (fs.existsSync(OUT)) fs.unlinkSync(OUT);
const db = new DatabaseSync(OUT);
db.exec(`PRAGMA journal_mode=OFF; PRAGMA synchronous=OFF; PRAGMA page_size=4096;
CREATE TABLE docs(id INTEGER PRIMARY KEY, src TEXT NOT NULL, country TEXT, kind TEXT, ext_id TEXT, title TEXT, year INTEGER, number TEXT, court TEXT, case_no TEXT, date TEXT,
  ltype TEXT, subject TEXT, status TEXT, status_code TEXT, url TEXT, file_url TEXT, body TEXT, has_text INTEGER, cites TEXT, meta TEXT, UNIQUE(src, ext_id));
CREATE INDEX docs_src_year ON docs(src, year);
CREATE INDEX docs_case ON docs(case_no);
CREATE TABLE meta(k TEXT PRIMARY KEY, v TEXT);
CREATE TABLE body_parts(id INTEGER, n INTEGER, txt TEXT, PRIMARY KEY(id, n));
CREATE VIRTUAL TABLE fts USING fts5(title, body, content='', tokenize='unicode61 remove_diacritics 2');`);
const ins = db.prepare('INSERT OR IGNORE INTO docs(src,country,kind,ext_id,title,year,number,court,case_no,date,ltype,subject,status,status_code,url,file_url,body,has_text,cites,meta) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
const fins = db.prepare('INSERT INTO fts(rowid,title,body) VALUES(?,?,?)');
db.exec('BEGIN');
let k = 0;
for (const d of docs) {
  const r = ins.run(d.src, d.country, d.kind, d.ext_id, d.title || '', d.year, d.number || '', d.court || '', d.case_no || '', d.date || '', d.ltype || '', d.subject || '', d.status || '', d.status_code || '', d.url || '', d.file_url || '', d.body, d.has_text, JSON.stringify(d.cites || []), JSON.stringify(d.meta || {}));
  if (r.changes) { fins.run(Number(r.lastInsertRowid), norm(d.title + ' ' + (d.case_no || '') + ' ' + (d.subject || '')), norm(d.body)); k++ }
}
const version = new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + k;
db.prepare('INSERT INTO meta VALUES(?,?)').run('version', version);
db.prepare('INSERT INTO meta VALUES(?,?)').run('built', new Date().toISOString());
db.exec("COMMIT; INSERT INTO fts(fts) VALUES('optimize');");
for (const r of db.prepare('SELECT src, COUNT(*) n, SUM(has_text) t FROM docs GROUP BY src').all()) log(' ', r.src, r.n, 'بنص:', r.t);
db.exec('VACUUM'); db.close();
log('OK', OUT, (fs.statSync(OUT).size / 1048576).toFixed(1) + 'MB', 'version', version);

/* اختياري: ملف SQL للاستيراد في D1 على دفعات (السحابة) */
if (SQL) {
  const d2 = new DatabaseSync(OUT, { readOnly: true }), out = fs.openSync(SQL, 'w');
  const q = v => v === null || v === undefined ? 'NULL' : typeof v === 'number' || typeof v === 'bigint' ? String(v) : "'" + String(v).replace(/'/g, "''") + "'";
  fs.writeSync(out, `DROP TABLE IF EXISTS fts; DROP TABLE IF EXISTS docs; DROP TABLE IF EXISTS meta;
CREATE TABLE docs(id INTEGER PRIMARY KEY, src TEXT NOT NULL, country TEXT, kind TEXT, ext_id TEXT, title TEXT, year INTEGER, number TEXT, court TEXT, case_no TEXT, date TEXT, ltype TEXT, subject TEXT, status TEXT, status_code TEXT, url TEXT, file_url TEXT, body TEXT, has_text INTEGER, cites TEXT, meta TEXT, UNIQUE(src, ext_id));
CREATE INDEX docs_src_year ON docs(src, year); CREATE INDEX docs_case ON docs(case_no);
CREATE TABLE meta(k TEXT PRIMARY KEY, v TEXT);
CREATE TABLE body_parts(id INTEGER, n INTEGER, txt TEXT, PRIMARY KEY(id, n));
CREATE VIRTUAL TABLE fts USING fts5(title, body, content='', tokenize='unicode61 remove_diacritics 2');\n`);
  const cols = ['id', 'src', 'country', 'kind', 'ext_id', 'title', 'year', 'number', 'court', 'case_no', 'date', 'ltype', 'subject', 'status', 'status_code', 'url', 'file_url', 'body', 'has_text', 'cites', 'meta'];
  /* حدّ D1 لطول العبارة الواحدة: النص الطويل يُقسَّم أجزاءً (الأول في docs.body والباقي في body_parts) وصف FTS لكل جزء */
  let chunked = 0;
  for (const r of d2.prepare('SELECT * FROM docs ORDER BY id').iterate()) {
    const body = String(r.body || ''), parts = []; for (let i = 0; i < Math.max(1, body.length); i += CHUNK) parts.push(body.slice(i, i + CHUNK));
    if (parts.length > 1) chunked++;
    fs.writeSync(out, `INSERT INTO docs(${cols.join(',')}) VALUES(${cols.map(c => q(c === 'body' ? parts[0] : r[c])).join(',')});\n`);
    const t = norm(r.title + ' ' + (r.case_no || '') + ' ' + (r.subject || ''));
    parts.forEach((pt, k) => {
      if (k) fs.writeSync(out, `INSERT INTO body_parts(id,n,txt) VALUES(${r.id},${k},${q(pt)});\n`);
      fs.writeSync(out, `INSERT INTO fts(rowid,title,body) VALUES(${r.id + k * CHUNK_BASE},${q(k ? '' : t)},${q(norm(pt))});\n`);
    });
  }
  log('chunked docs', chunked);
  for (const r of d2.prepare('SELECT * FROM meta').all()) fs.writeSync(out, `INSERT INTO meta VALUES(${q(r.k)},${q(r.v)});\n`);
  fs.closeSync(out); d2.close();
  log('SQL', SQL, (fs.statSync(SQL).size / 1048576).toFixed(1) + 'MB');
}
