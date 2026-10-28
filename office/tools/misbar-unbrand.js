// إزالة إشارات جهة النشر «منشورات عدالة / مركز عدالة / adaleh.info» من مستندات قائمة في قاعدة مِسْبار (العنوان والنص والموضوع)،
// مع تحديث فهرس البحث، وكتابة SQL مطابق للسحابة. أرقام المستندات لا تتغير، وكلمة «العدالة» في متن الحكم لا تُمس.
// الاستعمال: node tools/misbar-unbrand.js --db <mithaq-lawindex.db> [--src JO_CASSATION] [--sql out.sql] [--dry]
'use strict';
const fs = require('fs'), { DatabaseSync } = require('node:sqlite');
const { norm, CHUNK } = require('../lib/misbar');
const { unbrandLines: fix, BRAND_RX: RX } = require('./jo-adaleh-build');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d };
const DB = arg('db'), SRC = arg('src', 'JO_CASSATION'), SQL = arg('sql', ''), DRY = process.argv.includes('--dry');
if (!DB) { console.error('الاستعمال: --db <قاعدة> [--src JO_CASSATION] [--sql out.sql] [--dry]'); process.exit(2) }

const ftsTitle = d => norm((d.title || '') + ' ' + (d.case_no || '') + ' ' + (d.subject || ''));
const q = v => v == null ? 'NULL' : "'" + String(v).replace(/'/g, "''") + "'";

const db = new DatabaseSync(DB, { readOnly: DRY });
const rows = db.prepare('SELECT id,title,case_no,subject,body FROM docs WHERE src=?').all(SRC).filter(r => RX.test(r.title) || RX.test(r.subject) || RX.test(r.body));
const out = SQL ? fs.openSync(SQL, 'w') : null, skipped = [];
if (!DRY) db.exec('BEGIN');
for (const r of rows) {
  const n = { ...r, title: fix(r.title), subject: fix(r.subject), body: fix(r.body) };
  if (DRY) { console.log(r.id, JSON.stringify(String(r.body).match(new RegExp('.{0,40}(' + RX.source + ').{0,40}', 'gi')))); continue }
  db.prepare("INSERT INTO fts(fts,rowid,title,body) VALUES('delete',?,?,?)").run(r.id, ftsTitle(r), norm(r.body));
  db.prepare('UPDATE docs SET title=?, subject=?, body=? WHERE id=?').run(n.title, n.subject, n.body, r.id);
  db.prepare('INSERT INTO fts(rowid,title,body) VALUES(?,?,?)').run(r.id, ftsTitle(n), norm(n.body));
  if (out) {
    if (String(r.body).length > CHUNK) { skipped.push(r.id); continue } /* نص مقسّم في السحابة: يُعاد استيراده بـ misbar-append --replace */
    fs.writeSync(out, `UPDATE docs SET title=${q(n.title)}, subject=${q(n.subject)}, body=${q(n.body)} WHERE id=${r.id};\nDELETE FROM fts WHERE rowid=${r.id};\nINSERT INTO fts(rowid,title,body) VALUES(${r.id},${q(ftsTitle(n))},${q(norm(n.body))});\n`);
  }
}
if (!DRY) db.exec('COMMIT');
if (out) fs.closeSync(out);
console.log(JSON.stringify({ src: SRC, fixed: rows.length, ids: rows.map(r => r.id), sqlSkippedLong: skipped, dry: DRY }));
