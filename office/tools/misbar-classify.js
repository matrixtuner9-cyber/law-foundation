#!/usr/bin/env node
'use strict';
/* فرز التشريعات الفلسطينية وفهرستها:
   • عدد المواد لكل تشريع من نصه نفسه (meta.articles_n).
   • تشريع بلا تصنيف موضوعي (المضاف من الوقائع مثلاً) يُصنَّف آلياً بأقرب التشريعات المصنّفة إليه في كلمات عنوانه
     (تصنيف «مقام»: الباب › الفرع)، ويُعلَّم meta.subject_auto حتى يظهر للمحامي أنه آلي. ما لا يُعرف تصنيفه بثقة يُترك.
   • يُحدَّث فهرس البحث للمستند الذي تغيّر تصنيفه (العنوان المفهرس يشمل التصنيف). أرقام المستندات والنصوص لا تُمس.
   الاستعمال: node tools/misbar-classify.js --db <قاعدة> [--dry] [--report out.json] */
const fs = require('fs'), { DatabaseSync } = require('node:sqlite');
const { norm } = require('../lib/misbar'), { splitArticles } = require('../lib/misbar-local');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d };
const DB = arg('db'), DRY = process.argv.includes('--dry'), REPORT = arg('report', '');
if (!DB) { console.error('الاستعمال: --db <قاعدة>'); process.exit(2) }
/* كلمات لا تدل على الموضوع */
const GEN = new Set('قانون قرار بقانون رقم لسنه بشان بشأن تعديل بتعديل معدل وتعديلاته مرسوم رئاسي نظام تعليمات لائحه صادر صادره عن وزير وزاره مجلس الوزراء رييس دوله فلسطين الفلسطينيه الوطنيه السلطه رقم المواد احكام بعض الاحكام العامه الخاصه تشكيل تعيين السيد السيده ' .split(' '));
const words = t => [...new Set(norm(t).split(' ').filter(w => w.length > 2 && !/\d/.test(w) && !GEN.has(w)))];

const db = new DatabaseSync(DB, { readOnly: DRY });
const rows = db.prepare("SELECT id,title,case_no,subject,body,meta FROM docs WHERE src='PS_LEGISLATION'").all();
const lab = rows.filter(r => r.subject), unl = rows.filter(r => !r.subject);
/* فهرس مقلوب للكلمات مع وزن الندرة */
const df = new Map(), idx = new Map();
lab.forEach((r, i) => { for (const w of words(r.title)) { df.set(w, (df.get(w) || 0) + 1); (idx.get(w) || idx.set(w, []).get(w)).push(i) } });
const N = lab.length, idf = w => Math.log(1 + N / (df.get(w) || N));
function guess(title) {
  const ws = words(title); if (!ws.length) return null;
  const sc = new Map(); for (const w of ws) for (const i of idx.get(w) || []) sc.set(i, (sc.get(i) || 0) + idf(w));
  const top = [...sc].sort((a, b) => b[1] - a[1]).slice(0, 7); if (!top.length) return null;
  const vote = new Map(); for (const [i, s] of top) { const k = lab[i].subject; vote.set(k, (vote.get(k) || 0) + s) }
  const [best, bs] = [...vote].sort((a, b) => b[1] - a[1])[0], tot = [...vote.values()].reduce((a, b) => a + b, 0), self = ws.reduce((a, w) => a + idf(w), 0);
  /* ثقة: الفائز أغلب الأصوات، وتطابقه بكلمات وازنة من العنوان */
  const conf = bs / tot, cover = top[0][1] / self, tw = new Set(words(lab[top[0][0]].title)), shared = ws.filter(w => tw.has(w)).length;
  /* كلمة واحدة مشتركة («سلطة»، «ديوان»، «حماية») لا تكفي لعنوان فيه أكثر من كلمة دالّة */
  if (ws.length > 1 && shared < 2) return null;
  return conf >= 0.55 && cover >= 0.45 ? { subject: best, conf: +conf.toFixed(2), cover: +cover.toFixed(2), like: lab[top[0][0]].title } : null;
}
const ft = d => norm((d.title || '') + ' ' + (d.case_no || '') + ' ' + (d.subject || ''));
const upd = db.prepare('UPDATE docs SET subject=?, meta=? WHERE id=?'), updMeta = db.prepare('UPDATE docs SET meta=? WHERE id=?');
const del = db.prepare("INSERT INTO fts(fts,rowid,title,body) VALUES('delete',?,?,?)"), ins = db.prepare('INSERT INTO fts(rowid,title,body) VALUES(?,?,?)');
const st = { laws: rows.length, hadSubject: lab.length, classified: 0, left: 0, counted: 0 }, sample = [], cats = {};
if (!DRY) db.exec('BEGIN');
for (const r of rows) {
  let meta = {}; try { meta = JSON.parse(r.meta || '{}') } catch {}
  const n = String(r.body || '').length > 50 ? splitArticles(r.body).length : 0; let ch = false;
  if (meta.articles_n !== n) { meta.articles_n = n; ch = true; st.counted++ }
  if (!r.subject) {
    const g = guess(r.title);
    if (g) { st.classified++; cats[g.subject.split(' › ')[0]] = (cats[g.subject.split(' › ')[0]] || 0) + 1; if (sample.length < 30) sample.push(r.title.slice(0, 90) + '  ⟵  ' + g.subject + ' (' + g.conf + ')');
      meta.subject_auto = { conf: g.conf, like: g.like.slice(0, 120) };
      if (!DRY) { del.run(r.id, ft(r), norm(r.body || '')); upd.run(g.subject, JSON.stringify(meta), r.id); ins.run(r.id, ft({ ...r, subject: g.subject }), norm(r.body || '')) } continue }
    st.left++;
  }
  if (ch && !DRY) updMeta.run(JSON.stringify(meta), r.id);
}
if (!DRY) db.exec('COMMIT');
db.close();
if (REPORT) fs.writeFileSync(REPORT, JSON.stringify({ ...st, cats, sample }, null, 1));
console.log(JSON.stringify(st)); console.log(sample.join('\n'));
