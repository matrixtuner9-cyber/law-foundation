// إضافة مصدر جديد إلى قاعدة مِسْبار القائمة دون إعادة بنائها: أرقام المستندات الحالية لا تتغيّر
// (المراجع المربوطة بالقضايا [M123] تبقى صحيحة)، والمستندات الجديدة تأخذ أرقاماً بعد أكبر رقم موجود.
// الاستعمال: node tools/misbar-append.js --db <mithaq-lawindex.db> --jsonl <docs.jsonl> --src EG_CASSATION [--sql <d1.sql>] [--replace]
//   --sql: يكتب ملف SQL بالأرقام نفسها لاستيراده في D1 (السحابة) على دفعات، بالتقسيم نفسه للنصوص الطويلة.
//   --replace: يحذف مستندات المصدر السابقة (وصفوف الفهرس) قبل الإضافة؛ بدونها يرفض إن كان المصدر موجوداً.
//   --merge: يضيف إلى مصدر موجود دون حذف شيء، ويتخطى المستندات الموجودة سلفاً (بالمعرّف ext_id) فتبقى أرقامها كما هي.
'use strict';
const fs = require('fs'), { DatabaseSync } = require('node:sqlite');
const { norm, scrub, CHUNK, CHUNK_BASE } = require('../lib/misbar');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d };
const has = k => process.argv.includes('--' + k);
const DB = arg('db'), JL = arg('jsonl'), SRC = arg('src'), SQL = arg('sql', ''), REPLACE = has('replace'), MERGE = has('merge');
if (REPLACE && MERGE) { console.error('--replace و--merge لا يجتمعان'); process.exit(2) }
if (!DB || !JL || !SRC) { console.error('الاستعمال: --db <قاعدة> --jsonl <ملف> --src <المصدر> [--sql out.sql] [--replace]'); process.exit(2) }

const clean = s => String(s ?? '').replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
let docs = fs.readFileSync(JL, 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l)).filter(d => d.src === SRC);
if (!docs.length) { console.error('لا مستندات للمصدر', SRC); process.exit(3) }
const ftsTitle = d => norm((d.title || '') + ' ' + (d.case_no || '') + ' ' + (d.subject || ''));

const db = new DatabaseSync(DB);
let old = db.prepare('SELECT id,ext_id,title,case_no,subject,body FROM docs WHERE src=?').all(SRC);
let skipped = 0;
if (MERGE) { const have = new Set(old.map(r => String(r.ext_id))); const n0 = docs.length; docs = docs.filter(d => !have.has(String(d.ext_id))); skipped = n0 - docs.length; old = [] }
/* عند الاستبدال يحتفظ المستند نفسه (ext_id) برقمه السابق حتى تبقى المراجع المربوطة به صحيحة */
const keep = new Map(old.map(r => [String(r.ext_id), r.id]));
if (old.length && !REPLACE && !MERGE) { console.error(`المصدر ${SRC} موجود (${old.length} مستند). استعمل --replace لاستبداله.`); process.exit(4) }
const qSql = v => v === null || v === undefined ? 'NULL' : typeof v === 'number' || typeof v === 'bigint' ? String(v) : "'" + String(v).replace(/'/g, "''") + "'";
const sqlOut = SQL ? fs.openSync(SQL, 'w') : null;
const W = s => sqlOut && fs.writeSync(sqlOut, s + '\n');

db.exec('BEGIN');
/* حذف السابق: الفهرس بلا محتوى (contentless) يحتاج القيم الأصلية نفسها لأمر delete */
for (const r of old) {
  db.prepare("INSERT INTO fts(fts,rowid,title,body) VALUES('delete',?,?,?)").run(r.id, ftsTitle(r), norm(r.body));
  W(`DELETE FROM body_parts WHERE id=${r.id};`);
}
if (old.length) {
  db.prepare('DELETE FROM docs WHERE src=?').run(SRC);
  /* في D1 قد يكون النص مقسّماً: صفوف الفهرس الإضافية تُحذف بأرقامها (id + k*CHUNK_BASE) */
  for (const r of old) { const parts = Math.max(1, Math.ceil(String(r.body || '').length / CHUNK)); for (let k = 0; k < parts + 2; k++) W(`DELETE FROM fts WHERE rowid=${r.id + k * CHUNK_BASE};`) }
  W(`DELETE FROM docs WHERE src=${qSql(SRC)};`);
}
let next = Number(db.prepare('SELECT COALESCE(MAX(id),0) m FROM docs').get().m) + 1;
const ins = db.prepare('INSERT INTO docs(id,src,country,kind,ext_id,title,year,number,court,case_no,date,ltype,subject,status,status_code,url,file_url,body,has_text,cites,meta) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
const fins = db.prepare('INSERT INTO fts(rowid,title,body) VALUES(?,?,?)');
const cols = ['id', 'src', 'country', 'kind', 'ext_id', 'title', 'year', 'number', 'court', 'case_no', 'date', 'ltype', 'subject', 'status', 'status_code', 'url', 'file_url', 'body', 'has_text', 'cites', 'meta'];
let first = Infinity, maxId = 0, chunked = 0;
for (const d of docs) {
  const body = scrub(clean(d.body)), id = keep.get(String(d.ext_id)) || next++; first = Math.min(first, id); maxId = Math.max(maxId, id);
  const row = { id, src: SRC, country: d.country || '', kind: d.kind || '', ext_id: String(d.ext_id), title: d.title || '', year: d.year ?? null, number: d.number || '', court: d.court || '', case_no: d.case_no || '',
    date: d.date || '', ltype: d.ltype || '', subject: d.subject || '', status: d.status || '', status_code: d.status_code || '', url: d.url || '', file_url: d.file_url || '', body, has_text: body.length > 200 ? 1 : 0,
    cites: JSON.stringify(d.cites || []), meta: JSON.stringify(d.meta || {}) };
  ins.run(...cols.map(c => row[c]));
  const t = ftsTitle(row); fins.run(id, t, norm(body));
  if (sqlOut) {
    const parts = []; for (let i = 0; i < Math.max(1, body.length); i += CHUNK) parts.push(body.slice(i, i + CHUNK)); if (parts.length > 1) chunked++;
    W(`INSERT INTO docs(${cols.join(',')}) VALUES(${cols.map(c => qSql(c === 'body' ? parts[0] : row[c])).join(',')});`);
    parts.forEach((pt, k) => { if (k) W(`INSERT INTO body_parts(id,n,txt) VALUES(${id},${k},${qSql(pt)});`); W(`INSERT INTO fts(rowid,title,body) VALUES(${id + k * CHUNK_BASE},${qSql(k ? '' : t)},${qSql(norm(pt))});`) });
  }
}
const total = Number(db.prepare('SELECT COUNT(*) n FROM docs').get().n), top = Number(db.prepare('SELECT MAX(id) m FROM docs').get().m);
const version = new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + top;
db.prepare('INSERT OR REPLACE INTO meta(k,v) VALUES(?,?)').run('version', version);
db.prepare('INSERT OR REPLACE INTO meta(k,v) VALUES(?,?)').run('built', new Date().toISOString());
db.exec('COMMIT');
W(`INSERT OR REPLACE INTO meta(k,v) VALUES('version',${qSql(version)});`);
W(`INSERT OR REPLACE INTO meta(k,v) VALUES('built',${qSql(new Date().toISOString())});`);
if (sqlOut) fs.closeSync(sqlOut);
db.close();
console.log(JSON.stringify({ src: SRC, mode: MERGE ? 'merge' : REPLACE ? 'replace' : 'new', removed: old.length, skipped, added: docs.length, ids: [first, maxId], total, version, chunked, sql: SQL || null }));
