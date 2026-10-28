#!/usr/bin/env node
'use strict';
/* قياس جودة المسبار المحلي على مجموعة أسئلة معروفة الإجابة: Recall@10 وMRR للمواد والأحكام.
   الاستعمال: node tools/misbar-eval/run.js --db <مسار mithaq-lawindex.db> [--q questions.json] [--json out.json]
   يُشغَّل قبل أي تعديل على الخوارزمية وبعده؛ التحسين الحقيقي يرفع الأرقام ولا يكسر سؤالاً كان ناجحاً. */
const path = require('path'), fs = require('fs');
const M = require('../../lib/misbar'), L = require('../../lib/misbar-local');

function args() { const a = process.argv.slice(2), o = {}; for (let i = 0; i < a.length; i++) if (a[i].startsWith('--')) o[a[i].slice(2)] = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true; return o }

/* ترتيب النتائج كما يراها المحامي: المواد المذكورة، ثم مواد التشريعات بالترتيب، ثم الأحكام */
function ranked(b) {
  const out = [];
  for (const c of b.citations || []) if (c.found) out.push({ kind: 'article', lawId: c.lawId, n: c.article });
  for (const l of b.laws || []) for (const a of l.articles || []) out.push({ kind: 'article', lawId: l.lawId, n: a.n });
  for (const r of b.rulings || []) out.push({ kind: 'ruling', case_no: r.case_no, id: r.id });
  return out;
}

async function evaluate(misbar, questions, { k = 10 } = {}) {
  const loc = L.createLocal({ misbar });
  const lawIds = {}; for (const x of L.LAWS) { const r = await loc.resolveLaw(x.key); if (r) lawIds[x.key] = r.id }
  const rows = [];
  for (const q of questions) {
    const t0 = Date.now(); const r = await loc.analyze({ text: q.q, region: q.region || '', eventDate: q.eventDate || '' }); const ms = Date.now() - t0;
    const list = r.status === 200 ? ranked(r.body).slice(0, k) : [];
    const want = [...(q.articles || []).map(s => { const [key, n] = s.split(':'); return { kind: 'article', key, lawId: lawIds[key], n, label: s } }), ...(q.rulings || []).map(no => ({ kind: 'ruling', case_no: no, label: 'حكم ' + no }))];
    const hits = want.map(w => { const i = list.findIndex(x => x.kind === w.kind && (w.kind === 'article' ? x.lawId === w.lawId && x.n === w.n : x.case_no === w.case_no)); return { ...w, rank: i < 0 ? null : i + 1 } });
    const found = hits.filter(h => h.rank);
    rows.push({ id: q.id, q: q.q, ms, recall: want.length ? found.length / want.length : 1, rr: found.length ? 1 / Math.min(...found.map(h => h.rank)) : 0, hits, missingLaw: hits.filter(h => h.kind === 'article' && !h.lawId).map(h => h.key) });
  }
  const avg = f => rows.length ? rows.reduce((a, r) => a + f(r), 0) / rows.length : 0;
  return { k, n: rows.length, recall: avg(r => r.recall), mrr: avg(r => r.rr), ms: Math.round(avg(r => r.ms)), rows };
}

async function main() {
  const o = args(); if (!o.db) { console.error('الاستعمال: node tools/misbar-eval/run.js --db mithaq-lawindex.db [--q questions.json] [--json out.json]'); process.exit(2) }
  const qs = JSON.parse(fs.readFileSync(o.q || path.join(__dirname, 'questions.json'), 'utf8'));
  const res = await evaluate(M.createMisbar(M.openFile(o.db)), qs.questions, { k: Number(o.k) || 10 });
  for (const r of res.rows) console.log(`${r.recall === 1 ? '✔' : r.recall > 0 ? '◐' : '✘'} ${r.id} R=${r.recall.toFixed(2)} RR=${r.rr.toFixed(2)} ${r.ms}ms  ${r.q}\n     ${r.hits.map(h => h.label + (h.rank ? ' @' + h.rank : ' — لم يظهر')).join(' · ')}${r.missingLaw.length ? '  (قانون غير موجود في القاعدة: ' + r.missingLaw.join(',') + ')' : ''}`);
  console.log(`\nRecall@${res.k} = ${(res.recall * 100).toFixed(1)}%   MRR = ${res.mrr.toFixed(3)}   متوسط الزمن ${res.ms}ms   (${res.n} سؤالاً${qs.reviewed ? '' : '، بذرة لم يراجعها المحامون بعد'})`);
  if (o.json) fs.writeFileSync(o.json, JSON.stringify({ at: new Date().toISOString(), ...res }, null, 1));
}
if (require.main === module) main().catch(e => { console.error(e); process.exit(1) });
module.exports = { evaluate, ranked };
