// إزالة إشارات جهة النشر «منشورات عدالة / مركز عدالة / adaleh.info» وإعلانات مدوّنات مكاتب المحاماة من مستندات قائمة في قاعدة مِسْبار (العنوان والنص والموضوع)،
// مع تحديث فهرس البحث، وكتابة SQL مطابق للسحابة. أرقام المستندات لا تتغير، وكلمة «العدالة» في متن الحكم لا تُمس.
// الاستعمال: node tools/misbar-unbrand.js --db <mithaq-lawindex.db> [--src JO_CASSATION] [--sql out.sql] [--dry]
'use strict';
const fs = require('fs'), { DatabaseSync } = require('node:sqlite');
const { norm, CHUNK } = require('../lib/misbar');
const { unbrandLines, BRAND_RX } = require('./jo-adaleh-build');
const { cleanBody, cleanTitle } = require('./jo-ads-clean');
/* أحكام منقولة من مدوّنات مكاتب المحاماة: تُنظَّف من الإعلانات أيضاً (بيانات التواصل وقائمة المقالات الأخرى وعبارات الدعاية في العنوان) */
const ADS = /العبادي|alabbadi|bit\.ly|By mohammad|Read More|Section Title|عقاركو/i;
const isAd = r => /^abbadi-/.test(r.ext_id || '') || ADS.test(r.body) || ADS.test(r.title);
const RX = { test: s => BRAND_RX.test(s) };
const fixer = r => { const ad = isAd(r); return {
  title: ad ? cleanTitle(unbrandLines(r.title)) : unbrandLines(r.title), subject: unbrandLines(r.subject), body: ad ? cleanBody(unbrandLines(r.body)) : unbrandLines(r.body) } };
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d };
const DB = arg('db'), SRC = arg('src', 'JO_CASSATION'), SQL = arg('sql', ''), DRY = process.argv.includes('--dry');
if (!DB) { console.error('الاستعمال: --db <قاعدة> [--src JO_CASSATION] [--sql out.sql] [--dry]'); process.exit(2) }

const ftsTitle = d => norm((d.title || '') + ' ' + (d.case_no || '') + ' ' + (d.subject || ''));
const q = v => v == null ? 'NULL' : "'" + String(v).replace(/'/g, "''") + "'";

const db = new DatabaseSync(DB, { readOnly: DRY });
const rows = db.prepare('SELECT id,ext_id,title,case_no,subject,body FROM docs WHERE src=?').all(SRC).filter(r => RX.test(r.title) || RX.test(r.subject) || RX.test(r.body) || isAd(r))
  .filter(r => { const n = fixer(r); return n.title !== r.title || n.subject !== (r.subject ?? '') || n.body !== r.body });
const out = SQL ? fs.openSync(SQL, 'w') : null, skipped = [];
if (!DRY) db.exec('BEGIN');
for (const r of rows) {
  const n = { ...r, ...fixer(r) };
  if (DRY) { if (process.argv.includes('--show')) console.log('\n#' + r.id, '|', r.title, '→', n.title, '| طول', r.body.length, '→', n.body.length); continue }
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
