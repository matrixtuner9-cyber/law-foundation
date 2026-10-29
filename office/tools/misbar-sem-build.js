#!/usr/bin/env node
'use strict';
/* بناء متجهات البحث الدلالي لمواد التشريعات الأساسية (LAWS في lib/misbar-local.js) من قاعدة مِسْبار.
   الاستعمال: node tools/misbar-sem-build.js --db <mithaq-lawindex.db> --out <مجلد misbar-sem> [--model Xenova/multilingual-e5-small] [--dtype q8]
   النموذج يُنزَّل مرة واحدة إلى <out>/models (يلزم إنترنت عند البناء فقط)، ثم يعمل التطبيق دون إنترنت.
   يُعاد البناء كلما تغيّر نص أحد هذه التشريعات في القاعدة (التطبيق يكتشف ذلك ويعطّل البحث الدلالي حتى إعادة البناء). */
const fs = require('fs'), path = require('path');
const M = require('../lib/misbar'), L = require('../lib/misbar-local'), S = require('../lib/misbar-sem');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d };
const DB = arg('db'), OUT = arg('out'), MODEL = arg('model', 'Xenova/multilingual-e5-small'), DTYPE = arg('dtype', 'q8');
if (!DB || !OUT) { console.error('الاستعمال: --db <قاعدة> --out <مجلد>'); process.exit(2) }

/* نص المادة كما يُرمَّز: اسم التشريع ورقم المادة ثم متنها (أول 1400 حرف) */
const passage = (title, a) => 'passage: ' + title + ' — ' + a.label + ': ' + a.text.replace(/\s+/g, ' ').slice(0, 1400);

(async () => {
  fs.mkdirSync(path.join(OUT, 'models'), { recursive: true });
  const T = await import('@huggingface/transformers');
  T.env.cacheDir = path.join(OUT, 'models'); T.env.localModelPath = path.join(OUT, 'models') + path.sep;
  const misbar = M.createMisbar(M.openFile(DB)), loc = L.createLocal({ misbar });
  const keys = [], texts = [], laws = [], docs = [];
  for (const x of L.LAWS) {
    const r = await loc.resolveLaw(x.key); if (!r || laws.includes(r.id)) continue;
    const d = await misbar.doc(r.id); laws.push(r.id); docs.push(d);
    for (const a of L.splitArticles(d.body)) if (!a.repealed && a.text.length > 15) { keys.push([r.id, a.n]); texts.push(passage(x.title, a)) }
  }
  console.log('تشريعات', laws.length, 'مواد', keys.length);
  const ext = await T.pipeline('feature-extraction', MODEL, { dtype: DTYPE });
  const vecs = [], t0 = Date.now();
  for (let i = 0; i < texts.length; i += 16) {
    const o = await ext(texts.slice(i, i + 16), { pooling: 'mean', normalize: true }); for (const row of o.tolist()) vecs.push(row);
    if (i % 1600 === 0) console.log('  ', i, '/', texts.length, Math.round((Date.now() - t0) / 1000) + 's');
  }
  const dim = vecs[0].length, { q, scale } = S.quantize(vecs, dim);
  /* النموذج المنزَّل محفوظ في <out>/models/<اسم النموذج>/ وهو المسار نفسه الذي يقرأ منه التطبيق دون إنترنت */
  fs.writeFileSync(path.join(OUT, S.FILE_VEC), Buffer.from(q.buffer));
  fs.writeFileSync(path.join(OUT, S.FILE_IDX), JSON.stringify({ model: MODEL, dtype: DTYPE, dim, built: new Date().toISOString(), laws, fp: S.fingerprint(docs), keys, scale: Array.from(scale, x => +x.toPrecision(6)) }));
  console.log(JSON.stringify({ articles: keys.length, dim, seconds: Math.round((Date.now() - t0) / 1000), out: OUT }));
})().catch(e => { console.error(e); process.exit(1) });
