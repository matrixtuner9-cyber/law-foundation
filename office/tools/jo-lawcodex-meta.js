// إثراء التشريعات الأردنية (JO_LEGISLATION) في قاعدة مِسْبار ببيانات ديوان التشريع والرأي من نسخة LawCodex (مجلد jo-master/ar بصيغة Markdown):
// رقم التشريع، وتاريخ النشر في الجريدة الرسمية، ورقم العدد والصفحة، وتاريخ بدء النفاذ، وقائمة التشريعات المعدِّلة وسنة آخر تعديل،
// وتصحيح العنوان حين ينقصه حرف (علامة تنصيص ضاعت عند الجمع الأول). نص المواد لا يُمس، وأرقام المستندات لا تتغير.
// الاستعمال: node tools/jo-lawcodex-meta.js --db <mithaq-lawindex.db> --dir E:\maqam\jo-master\jo-master\ar [--sql out.sql] [--dry]
'use strict';
const fs = require('fs'), path = require('path');

/* واجهة الملف (front matter) بصيغة YAML البسيطة التي يكتبها LawCodex: مفتاح: قيمة، وقوائم بأسطر «- …» */
function frontMatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(String(text)); const fm = {}; let key = null;
  if (!m) return fm;
  const un = v => { v = String(v).trim(); const q = /^'(.*)'$/s.exec(v) || /^"(.*)"$/s.exec(v); return q ? q[1].replace(/''/g, "'") : v };
  for (const l of m[1].split(/\r?\n/)) {
    const kv = /^([a-z_]+):\s*(.*)$/.exec(l);
    if (kv) { key = kv[1]; fm[key] = kv[2] === '' ? [] : un(kv[2]); continue }
    const it = /^\s*-\s+(.*)$/.exec(l); if (it && key) { if (!Array.isArray(fm[key])) fm[key] = []; fm[key].push(un(it[1])) }
  }
  return fm;
}
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.md') ? [path.join(d, e.name)] : []);
const isoDate = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : '';

/* من واجهة ملف واحد ← الحقول التي تُحدَّث في المستند */
function fieldsOf(fm) {
  const num = /^\d{1,6}$/.test(String(fm.number || '')) && String(fm.number) !== '0' ? String(Number(fm.number)) : '';
  const amended = Array.isArray(fm.amended_by) ? fm.amended_by.map(s => String(s).replace(/\s+/g, ' ').trim()).filter(Boolean) : [];
  const meta = {
    gazette_number: fm.gazette_number ? String(fm.gazette_number) : '', gazette_page: fm.gazette_page ? String(fm.gazette_page) : '',
    in_force_from: isoDate(fm.in_force_from), last_amended: /^\d{4}$/.test(String(fm.last_amended || '')) ? String(fm.last_amended) : '',
    amended_by: amended, retrieved: isoDate(fm.retrieved)
  };
  for (const k of Object.keys(meta)) if (meta[k] === '' || (Array.isArray(meta[k]) && !meta[k].length)) delete meta[k];
  return { id: String(fm.identifier || ''), title: String(fm.title || '').trim(), number: num, date: isoDate(fm.date), meta };
}

/* العنوان الجديد يُعتمد فقط إن كان هو القديم نفسه بحرف ناقص أو زائد في الطرفين (علامة تنصيص)، لا عنواناً مختلفاً */
function betterTitle(oldT, newT) {
  const a = String(oldT || '').trim(), b = String(newT || '').trim();
  if (!b || a === b) return a;
  const strip = s => s.replace(/^["'«»\s]+|["'«»\s]+$/g, '');
  return strip(a) === strip(b) || b.startsWith(a) && b.length - a.length <= 2 ? b : a;
}

function run({ db, dir, sql = '', dry = false, norm }) {
  const out = sql ? fs.openSync(sql, 'w') : null, q = v => v == null ? 'NULL' : "'" + String(v).replace(/'/g, "''") + "'";
  const rows = new Map(db.prepare("SELECT id, ext_id, title, case_no, subject, number, date, meta FROM docs WHERE src='JO_LEGISLATION'").all().map(r => [String(r.ext_id), r]));
  const st = { files: 0, matched: 0, number: 0, date: 0, gazette: 0, amended: 0, titles: 0, missing: [] };
  const ftsTitle = d => norm((d.title || '') + ' ' + (d.case_no || '') + ' ' + (d.subject || ''));
  if (!dry) db.exec('BEGIN');
  for (const f of walk(dir)) {
    st.files++;
    const F = fieldsOf(frontMatter(fs.readFileSync(f, 'utf8'))), r = rows.get(F.id);
    if (!r) { st.missing.push(F.id); continue }
    st.matched++;
    let meta = {}; try { meta = JSON.parse(r.meta || '{}') || {} } catch {}
    const title = betterTitle(r.title, F.title), number = F.number || r.number || '', date = F.date || r.date || '';
    const newMeta = { ...meta, ...F.meta };
    if (F.number && !r.number) st.number++; if (F.date && !r.date) st.date++; if (F.meta.gazette_number) st.gazette++; if (F.meta.amended_by) st.amended++;
    const titleChanged = title !== r.title; if (titleChanged) st.titles++;
    if (dry) continue;
    /* الفهرس بلا محتوى: الحذف يحتاج القيم المطبَّعة نفسها التي فُهرست (العنوان والنص بعد norm) */
    const nb = titleChanged ? norm(db.prepare('SELECT body FROM docs WHERE id=?').get(r.id).body) : '';
    if (titleChanged) db.prepare("INSERT INTO fts(fts,rowid,title,body) VALUES('delete',?,?,?)").run(r.id, ftsTitle(r), nb);
    db.prepare('UPDATE docs SET title=?, number=?, date=?, meta=? WHERE id=?').run(title, number, date, JSON.stringify(newMeta), r.id);
    if (titleChanged) db.prepare('INSERT INTO fts(rowid,title,body) VALUES(?,?,?)').run(r.id, ftsTitle({ ...r, title }), nb);
    if (out) fs.writeSync(out, `UPDATE docs SET title=${q(title)}, number=${q(number)}, date=${q(date)}, meta=${q(JSON.stringify(newMeta))} WHERE id=${r.id};\n`);
  }
  if (!dry) db.exec('COMMIT');
  if (out) fs.closeSync(out);
  return st;
}

if (require.main === module) {
  const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d };
  const DB = arg('db'), DIR = arg('dir'), SQL = arg('sql', ''), DRY = process.argv.includes('--dry');
  if (!DB || !DIR) { console.error('الاستعمال: --db <قاعدة> --dir <jo-master/ar> [--sql out.sql] [--dry]'); process.exit(2) }
  const { DatabaseSync } = require('node:sqlite'), { norm } = require('../lib/misbar');
  const db = new DatabaseSync(DB, { readOnly: DRY });
  const st = run({ db, dir: DIR, sql: SQL, dry: DRY, norm });
  /* تحديث العنوان يمر عبر الفهرس، أما title في السحابة فيُحدَّث بالـSQL؛ صفوف FTS للعناوين المصححة تُعاد في السحابة بإعادة استيراد المصدر */
  console.log(JSON.stringify({ ...st, missing: st.missing.length, missingSample: st.missing.slice(0, 5), dry: DRY }));
}
module.exports = { frontMatter, fieldsOf, betterTitle, run };
