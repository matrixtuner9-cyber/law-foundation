// تنظيف قاعدة مِسْبار القائمة من روابط مصدر الجمع (maqam.najah.edu) دون إعادة بنائها كاملة:
// يحدّث نص المستندات المتأثرة وفهرس البحث (FTS) محلياً، ويكتب ملف SQL مكافئاً لقاعدة السحابة (D1، بنصوص مقسّمة).
// الاستعمال: node tools/misbar-scrub.js --db mithaq-lawindex.db [--sql scrub-d1.sql]
'use strict';
const fs = require('fs'), { DatabaseSync } = require('node:sqlite');
const { norm, scrub, CHUNK, CHUNK_BASE } = require('../lib/misbar');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d };
const DB = arg('db', 'mithaq-lawindex.db'), SQL = arg('sql', '');
const db = new DatabaseSync(DB);
const q = v => v === null || v === undefined ? 'NULL' : typeof v === 'number' || typeof v === 'bigint' ? String(v) : "'" + String(v).replace(/'/g, "''") + "'";
const rows = db.prepare("SELECT id, title, case_no, subject, body FROM docs WHERE body LIKE '%maqam.najah%' OR title LIKE '%maqam.najah%'").all();
console.log('affected', rows.length);
const parts = s => { const p = []; for (let i = 0; i < Math.max(1, s.length); i += CHUNK) p.push(s.slice(i, i + CHUNK)); return p };
const out = SQL ? fs.openSync(SQL, 'w') : null, w = s => out && fs.writeSync(out, s + '\n');
const ftsDel = db.prepare("INSERT INTO fts(fts, rowid, title, body) VALUES('delete', ?, ?, ?)"), ftsIns = db.prepare('INSERT INTO fts(rowid, title, body) VALUES(?, ?, ?)');
const upd = db.prepare('UPDATE docs SET title = ?, body = ? WHERE id = ?');
db.exec('BEGIN');
for (const r of rows) {
  const oldBody = String(r.body || ''), newBody = scrub(oldBody), newTitle = scrub(r.title || '');
  const tOld = norm(r.title + ' ' + (r.case_no || '') + ' ' + (r.subject || '')), tNew = norm(newTitle + ' ' + (r.case_no || '') + ' ' + (r.subject || ''));
  /* المحلي: صف FTS واحد لكل مستند بنصه الكامل */
  ftsDel.run(r.id, tOld, norm(oldBody)); ftsIns.run(r.id, tNew, norm(newBody)); upd.run(newTitle, newBody, r.id);
  /* السحابة: النص مقسّم أجزاءً؛ نحذف صفوف الأجزاء القديمة ونكتب الجديدة */
  const po = parts(oldBody), pn = parts(newBody);
  po.forEach((pt, k) => w(`INSERT INTO fts(fts,rowid,title,body) VALUES('delete',${r.id + k * CHUNK_BASE},${q(k ? '' : tOld)},${q(norm(pt))});`));
  w(`DELETE FROM body_parts WHERE id=${r.id};`);
  w(`UPDATE docs SET title=${q(newTitle)}, body=${q(pn[0])} WHERE id=${r.id};`);
  pn.forEach((pt, k) => { if (k) w(`INSERT INTO body_parts(id,n,txt) VALUES(${r.id},${k},${q(pt)});`); w(`INSERT INTO fts(rowid,title,body) VALUES(${r.id + k * CHUNK_BASE},${q(k ? '' : tNew)},${q(norm(pt))});`) });
}
db.exec('COMMIT');
const left = db.prepare("SELECT COUNT(*) n FROM docs WHERE body LIKE '%maqam.najah%'").get().n;
const hits = db.prepare("SELECT COUNT(*) n FROM fts WHERE fts MATCH 'maqam'").get().n;
console.log('left in bodies', left, 'fts hits for maqam', hits);
if (out) { fs.closeSync(out); console.log('SQL', SQL, fs.statSync(SQL).size, 'bytes') }
db.close();
