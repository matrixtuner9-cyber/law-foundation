// التشريعات المصرية من نسخة LawCodex (مجلد eg-master/ar): قوانين وقرارات بقوانين «كما صدرت» في الجريدة الرسمية من موقع محكمة النقض
// (عبر أرشيف الإنترنت)، والدستور 2014 بتعديلات 2019 من الهيئة العامة للاستعلامات.
//  • القوانين الموجودة في القاعدة سلفاً (بالرقم والسنة) لا تُكرر، وتبقى كما هي.
//  • الجديدة تُكتب docs.jsonl لمصدر EG_LEGISLATION وتُضاف بـ misbar-append --merge، مع علامة «النص كما صدر — غير مدمج فيه التعديلات».
//  • الدستور: يُستبدل نص المستند الموجود في مكانه (الرقم نفسه) بنسخة الاستعلامات المعدّلة 2019، مع تحديث الفهرس (--apply).
// النص يُنقل حرفياً؛ تُزال علامات Markdown فقط (# في العناوين).
// الاستعمال: node tools/eg-lawcodex-build.js --db <قاعدة> --dir E:\maqam\eg-master\eg-master\ar --out eg_lc_docs.jsonl [--apply] [--sql out.sql]
'use strict';
const fs = require('fs'), path = require('path');

const ind = s => String(s ?? '').replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x660));
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.md') ? [path.join(d, e.name)] : []);
function parse(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(String(text)); const fm = {};
  for (const l of (m ? m[1] : '').split(/\r?\n/)) { const kv = /^([a-z_]+):\s*(.*)$/.exec(l); if (kv) fm[kv[1]] = kv[2].trim().replace(/^"(.*)"$/s, '$1').replace(/^'(.*)'$/s, '$1') }
  let body = (m ? m[2] : String(text)).replace(/\r/g, '');
  body = body.replace(/^\s*#\s+[^\n]*\n+/, '');            /* العنوان الأول مكرر في title */
  body = body.replace(/^#{1,6}\s+/gm, '').replace(/\n{3,}/g, '\n\n').trim();
  return { fm, body };
}
/* «قانون رقم ١٤٩ لسنة ١٩٥٧» ← { no: 149, year: 1957 } */
function numYear(s) { const m = /رقم\s*\(?\s*(\d+)\s*\)?\s*لسن[ةه]\s*(\d{4})/.exec(ind(s)); return m ? { no: Number(m[1]), year: Number(m[2]) } : null }

function convert(file, root) {
  const { fm, body } = parse(fs.readFileSync(file, 'utf8')), rel = path.relative(root, file).replace(/\\/g, '/');
  const ny = numYear(fm.identifier) || numYear(fm.title) || (() => { const b = /(\d{4})-(\d+)\.md$/.exec(rel); return b ? { no: Number(b[2]), year: Number(b[1]) } : null })();
  const isConst = fm.type === 'constitution';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(fm.published || fm.date || '') ? (fm.published || fm.date) : '';
  return {
    src: 'EG_LEGISLATION', country: 'EG', kind: 'law', ext_id: 'lc-' + rel.replace(/\.md$/, '').replace(/[^0-9a-z]+/gi, '-'),
    title: String(fm.title || '').trim(), year: isConst ? 2014 : ny ? ny.year : (date ? Number(date.slice(0, 4)) : null), number: isConst ? '' : ny ? String(ny.no) : '',
    court: '', case_no: '', date, ltype: isConst ? 'دستور' : fm.type === 'decree_law' ? 'قرار بقانون' : 'قانون', subject: '',
    status: isConst ? 'ساري (بتعديلات 2019)' : '', status_code: isConst ? 'in_force' : '', url: '', file_url: '', body, cites: [],
    meta: isConst
      ? { origin: 'الهيئة العامة للاستعلامات — sis.gov.eg', last_amended: fm.last_amended || '', note: 'دستور 2014 بتعديلات 2019 (مواد 248–254 مجلس الشيوخ)' }
      : { origin: 'بوابة محكمة النقض المصرية (cc.gov.eg) عبر أرشيف الإنترنت', gazette: fm.gazette || '', version: 'as_published',
          note: 'النص كما صدر في الجريدة الرسمية، غير مدمج فيه التعديلات اللاحقة، وحالة السريان غير مؤكدة — يُراجع قبل الاستناد إليه' },
    _key: ny ? ny.no + '/' + ny.year : '', _const: isConst
  };
}

function plan({ db, dir }) {
  const have = new Set(), rows = db.prepare("SELECT id, title, year, number FROM docs WHERE src='EG_LEGISLATION'").all();
  for (const r of rows) { const ny = numYear(r.title); const no = r.number || (ny && ny.no), y = r.year || (ny && ny.year); if (no && y) have.add(Number(no) + '/' + Number(y)); if (ny) have.add(ny.no + '/' + ny.year) }
  const constRow = rows.find(r => /^دستور\s+جمهورية\s+مصر/.test(r.title)) || null;
  const docs = [], skipped = []; let constDoc = null;
  for (const f of walk(dir)) { const d = convert(f, dir); if (d._const) { constDoc = d; continue } if (d._key && have.has(d._key)) { skipped.push(d._key); continue } docs.push(d) }
  return { docs, skipped, constDoc, constRow };
}

if (require.main === module) {
  const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d };
  const DB = arg('db'), DIR = arg('dir'), OUT = arg('out', 'eg_lc_docs.jsonl'), SQL = arg('sql', ''), APPLY = process.argv.includes('--apply');
  if (!DB || !DIR) { console.error('الاستعمال: --db <قاعدة> --dir <eg-master/ar> --out docs.jsonl [--apply] [--sql out.sql]'); process.exit(2) }
  const { DatabaseSync } = require('node:sqlite'), { norm, scrub } = require('../lib/misbar');
  const db = new DatabaseSync(DB, { readOnly: !APPLY });
  const p = plan({ db, dir: DIR }), strip = ({ _key, _const, ...d }) => d;
  fs.writeFileSync(OUT, p.docs.map(d => JSON.stringify(strip(d))).join('\n') + '\n');
  let constDone = null;
  if (p.constDoc && p.constRow && APPLY) {
    /* استبدال نص الدستور في مكانه: الفهرس بلا محتوى، فالحذف بالقيم المطبَّعة نفسها */
    const r = db.prepare('SELECT id, title, case_no, subject, body FROM docs WHERE id=?').get(p.constRow.id), c = strip(p.constDoc), body = scrub(c.body);
    const ft = d => norm((d.title || '') + ' ' + (d.case_no || '') + ' ' + (d.subject || ''));
    db.exec('BEGIN');
    db.prepare("INSERT INTO fts(fts,rowid,title,body) VALUES('delete',?,?,?)").run(r.id, ft(r), norm(r.body));
    db.prepare('UPDATE docs SET title=?, year=?, date=?, ltype=?, status=?, status_code=?, body=?, has_text=1, meta=? WHERE id=?').run(c.title, c.year, c.date, c.ltype, c.status, c.status_code, body, JSON.stringify(c.meta), r.id);
    db.prepare('INSERT INTO fts(rowid,title,body) VALUES(?,?,?)').run(r.id, ft({ ...r, title: c.title }), norm(body));
    db.exec('COMMIT');
    if (SQL) fs.writeFileSync(SQL, `-- الدستور المصري: نص طويل؛ في السحابة يُعاد بتقسيم misbar-append (المستند ${r.id})\n`);
    constDone = { id: r.id, before: r.body.length, after: body.length };
  }
  console.log(JSON.stringify({ new: p.docs.length, skippedExisting: p.skipped.length, constitution: constDone || (p.constRow ? 'dry' : 'no existing constitution'), out: OUT }));
}
module.exports = { parse, convert, plan, numYear };
