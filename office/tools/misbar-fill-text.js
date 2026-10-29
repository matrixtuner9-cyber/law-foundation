// تعبئة نص تشريعات مسجّلة في قاعدة مِسْبار بعنوانها فقط، من نص مستخرج من ملف PDF الجريدة الرسمية (pdf_bulk.jsonl).
// أرقام المستندات لا تتغيّر (المراجع المربوطة بالقضايا تبقى صحيحة)، ولا يُمسّ أي مستند له نص سلفاً.
// الاستعمال: node tools/misbar-fill-text.js --db <mithaq-lawindex.db> --jsonl <pdf_bulk.jsonl> [--min 200] [--dry] [--refresh]
// --refresh: يستبدل أيضاً نصاً عُبّئ سابقاً من PDF بهذه الأداة (meta.text_src='pdf') بعد تحسين الاستخراج؛ ولا يمس غيره.
// كل نص يُعلَّم في meta بمصدره: text_src = 'pdf' مع رابط الملف، فيظهر للمستخدم أنه مستخرج آلياً من الأصل المنشور.
'use strict';
const fs = require('fs'), { DatabaseSync } = require('node:sqlite');
const { norm, scrub } = require('../lib/misbar');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d };
const DB = arg('db'), JL = arg('jsonl'), MIN = Number(arg('min', 200)), DRY = process.argv.includes('--dry'), REFRESH = process.argv.includes('--refresh');
if (!DB || !JL) { console.error('الاستعمال: --db <قاعدة> --jsonl <ملف>'); process.exit(2) }
const clean = s => String(s ?? '').replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
const ftsTitle = d => norm((d.title || '') + ' ' + (d.case_no || '') + ' ' + (d.subject || ''));
const recs = new Map();
for (const l of fs.readFileSync(JL, 'utf8').split('\n')) { if (!l.trim()) continue; try { const r = JSON.parse(l); if (r.id && r.text && r.text.length >= MIN) recs.set(Number(r.id), r) } catch {} }
const db = new DatabaseSync(DB);
const get = db.prepare('SELECT id,src,title,case_no,subject,body,meta,file_url FROM docs WHERE id=?');
const upd = db.prepare('UPDATE docs SET body=?, has_text=?, meta=? WHERE id=?');
const del = db.prepare("INSERT INTO fts(fts,rowid,title,body) VALUES('delete',?,?,?)"), ins = db.prepare('INSERT INTO fts(rowid,title,body) VALUES(?,?,?)');
let filled = 0, skippedHasText = 0, missing = 0;
if (!DRY) db.exec('BEGIN');
for (const [id, r] of recs) {
  const d = get.get(id); if (!d) { missing++; continue }
  let meta = {}; try { meta = JSON.parse(d.meta || '{}') } catch {}
  if (d.src !== 'PS_LEGISLATION' || (String(d.body || '').length >= 50 && !(REFRESH && meta.text_src === 'pdf'))) { skippedHasText++; continue }
  const body = scrub(clean(r.text));
  meta.text_src = 'pdf'; meta.text_url = d.file_url || r.url || ''; meta.text_at = new Date().toISOString().slice(0, 10);
  if (!DRY) { const t = ftsTitle(d); del.run(id, t, norm(d.body || '')); upd.run(body, body.length > 200 ? 1 : 0, JSON.stringify(meta), id); ins.run(id, t, norm(body)) }
  filled++;
}
if (!DRY) {
  const top = Number(db.prepare('SELECT MAX(id) m FROM docs').get().m), version = new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + top + '-t' + filled;
  db.prepare('INSERT OR REPLACE INTO meta(k,v) VALUES(?,?)').run('version', version);
  db.prepare('INSERT OR REPLACE INTO meta(k,v) VALUES(?,?)').run('built', new Date().toISOString());
  db.exec('COMMIT');
}
db.close();
console.log(JSON.stringify({ candidates: recs.size, filled, skippedHasText, missing, dry: DRY }));
