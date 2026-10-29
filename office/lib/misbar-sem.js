'use strict';
/* ── البحث الدلالي على الجهاز (اختياري): نموذج ترميز صغير متعدد اللغات (multilingual-e5-small) يعمل دون إنترنت،
   ومتجهات مواد التشريعات الأساسية مبنية سلفاً بأداة tools/misbar-sem-build.js.
   لا يُستعمل وحده أبداً: نتائجه تُدمج مع البحث النصي بترتيب تبادلي (RRF) داخل misbar-local.
   إن غاب النموذج أو المتجهات أو مكتبة التشغيل، أو لم تطابق المتجهاتُ القاعدةَ، يتعطّل بصمت ويبقى البحث النصي كما هو. ── */
const fs = require('fs'), path = require('path'), crypto = require('crypto');

const FILE_IDX = 'lawsem.json', FILE_VEC = 'lawsem.i8';

/* بصمة نصوص التشريعات المرمَّزة: تتغيّر إن تغيّر نص أي منها فتُعاد بناء المتجهات */
function fingerprint(docs) { const h = crypto.createHash('sha1'); for (const d of docs) h.update(d.id + ':' + String(d.body || '').length + ';'); return h.digest('hex').slice(0, 16) }

/* تكميم 8 بت لكل متجه مع معامل تحجيم: ربع الحجم، والفرق في الترتيب مهمل */
function quantize(vecs, dim) {
  const q = new Int8Array(vecs.length * dim), scale = new Float32Array(vecs.length);
  vecs.forEach((v, i) => { let m = 0; for (let j = 0; j < dim; j++) m = Math.max(m, Math.abs(v[j])); const s = m / 127 || 1; scale[i] = s; for (let j = 0; j < dim; j++) q[i * dim + j] = Math.round(v[j] / s) });
  return { q, scale };
}

function createSem({ dir, log = () => {} } = {}) {
  let idx = null, Q = null, ext = null, state = 'off', why = '', checked = false;
  const qcache = new Map();
  try {
    if (dir && fs.existsSync(path.join(dir, FILE_IDX)) && fs.existsSync(path.join(dir, FILE_VEC))) {
      idx = JSON.parse(fs.readFileSync(path.join(dir, FILE_IDX), 'utf8'));
      const buf = fs.readFileSync(path.join(dir, FILE_VEC)); Q = new Int8Array(buf.buffer, buf.byteOffset, buf.length);
      if (Q.length !== idx.keys.length * idx.dim) { idx = null; why = 'ملف المتجهات لا يطابق فهرسه' } else state = 'idle';
    } else why = 'لا توجد متجهات مبنية';
  } catch (e) { idx = null; why = 'تعذّر تحميل المتجهات: ' + e.message }

  async function load() {
    if (ext || state === 'off') return ext;
    try {
      const T = await import('@huggingface/transformers');
      T.env.allowRemoteModels = false; T.env.allowLocalModels = true; T.env.localModelPath = path.join(dir, 'models') + path.sep;
      if (T.env.backends && T.env.backends.onnx && T.env.backends.onnx.wasm) T.env.backends.onnx.wasm.numThreads = 1;
      ext = await T.pipeline('feature-extraction', idx.model, { dtype: idx.dtype || 'q8', local_files_only: true });
      state = 'ready';
    } catch (e) { state = 'off'; why = 'تعذّر تشغيل النموذج: ' + e.message; log('misbar-sem: ' + why) }
    return ext;
  }
  /* المتجهات تخص نسخة نصوص بعينها: يُتحقق مرة واحدة أن تشريعاتها في القاعدة بالنصوص نفسها */
  async function verify(getDoc) {
    if (checked) return state !== 'off'; checked = true;
    try { const docs = []; for (const id of idx.laws) { const d = await getDoc(id); if (!d) throw new Error('تشريع مفقود ' + id); docs.push(d) }
      if (fingerprint(docs) !== idx.fp) { state = 'off'; why = 'نصوص التشريعات تغيّرت منذ بناء المتجهات؛ أعد بناءها'; log('misbar-sem: ' + why) }
    } catch (e) { state = 'off'; why = e.message }
    return state !== 'off';
  }
  async function embedQuery(text) {
    const t = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 600);
    if (qcache.has(t)) return qcache.get(t);
    const o = await ext(['query: ' + t], { pooling: 'mean', normalize: true }); const v = Float32Array.from(o.tolist()[0]);
    if (qcache.size > 200) qcache.delete(qcache.keys().next().value); qcache.set(t, v); return v;
  }
  /* أقرب المواد في المعنى: [{ lawId, n, s }] مرتبة تنازلياً */
  async function search(text, { k = 30, getDoc } = {}) {
    if (!idx || state === 'off') return [];
    if (getDoc && !(await verify(getDoc))) return [];
    if (!(await load())) return [];
    const qv = await embedQuery(text), dim = idx.dim, n = idx.keys.length, out = new Array(n);
    for (let i = 0; i < n; i++) { let s = 0; const o = i * dim; for (let j = 0; j < dim; j++) s += qv[j] * Q[o + j]; out[i] = { i, s: s * idx.scale[i] } }
    out.sort((a, b) => b.s - a.s);
    return out.slice(0, k).map(x => ({ lawId: idx.keys[x.i][0], n: idx.keys[x.i][1], s: +x.s.toFixed(4) }));
  }
  return { search, info: () => ({ state, why, model: idx && idx.model, articles: idx ? idx.keys.length : 0, built: idx && idx.built }), available: () => !!idx && state !== 'off' };
}

module.exports = { createSem, quantize, fingerprint, FILE_IDX, FILE_VEC };
