// «البحث في مقام»: طبقة الخادم فوق السكريبت المرفق (lib/maqam-integration.mjs).
// يبحث المحامي بنفسه (طلب لكل ضغطة بحث) في صفحات الأحكام العامة؛ لا جلب آلي ولا مجدول ولا تخزين لنتائج مقام.
// الحماية: جلسة موظف إلزامية (في الخادم)، حدود طلبات لكل مستخدم، سقف للطلبات المتزامنة، وتنزيل النص الكامل محدود.
// نسخة مطابقة في cloud/src/maqam-search.js (ESM)
'use strict';
const KEYS = ['q', 'court', 'litigation_type', 'section', 'subject', 'branch', 'year', 'number', 'order_by', 'page'];
const LIMITS = { search: [30, 60e3], judgment: [20, 60e3], download: [4, 600e3], full: [1, 120e3] };
const MAX_BUSY = 3;

let impl = null;
async function load() {
  if (impl) return impl;
  try { impl = await import('./maqam-integration.mjs') }
  catch (e) { throw Object.assign(new Error('مكوّن البحث في مقام غير مثبّت على هذا الخادم (cheerio). شغّل: npm install'), { status: 501 }) }
  return impl;
}

function createLimiter() {
  const hits = new Map();
  return (key, kind) => {
    const [max, win] = LIMITS[kind], k = kind + '|' + key, now = Date.now();
    const a = (hits.get(k) || []).filter(t => now - t < win);
    if (a.length >= max) { hits.set(k, a); return Math.ceil((win - (now - a[0])) / 1000) }
    a.push(now); hits.set(k, a);
    if (hits.size > 2000) for (const [kk, v] of hits) if (!v.some(t => now - t < 600e3)) hits.delete(kk);
    return 0;
  };
}

function filtersOf(sp) {
  const f = {}; for (const k of KEYS) { const v = sp.get(k); if (v !== null && v !== '') f[k] = v }
  if (f.q) f.q = f.q.slice(0, 200);
  return f;
}

/* action: search | judgment | download. يعيد { status, body } أو { status, file } — ولا يرمي إلا لأخطاء البرمجة */
function createService({ audit, now = () => Date.now() } = {}) {
  const limit = createLimiter(); let busy = 0;
  return async function run(action, sp, user) {
    const key = String(user && (user.id || user.username) || 'anon');
    const who = { user_id: user && user.id, username: user && user.username };
    const deny = kind => { const wait = limit(key, kind); return wait ? { status: 429, body: { error: `طلبات بحث كثيرة. حاول بعد ${wait} ثانية.`, retry: wait } } : null };
    if (busy >= MAX_BUSY) return { status: 429, body: { error: 'الخادم مشغول بطلبات بحث أخرى. حاول بعد لحظات.' } };
    busy++;
    try {
      const M = await load();
      if (action === 'search') {
        const d = deny('search'); if (d) return d;
        const f = filtersOf(sp), r = await M.searchJudgments(f);
        audit && audit({ ...who, action: 'maqam.search', entity: 'maqam', detail: { q: (f.q || '').slice(0, 120), page: r.page, n: r.results.length } });
        return { status: 200, body: { ok: true, ...r } };
      }
      if (action === 'judgment') {
        const d = deny('judgment'); if (d) return d;
        const id = Number(sp.get('id')); if (!Number.isSafeInteger(id) || id <= 0) return { status: 400, body: { error: 'رقم الحكم غير صحيح.' } };
        const j = await M.getJudgment(id);
        audit && audit({ ...who, action: 'maqam.judgment', entity: 'maqam', entity_id: String(id), detail: { no: j.number, year: j.year } });
        return { status: 200, body: { ok: true, judgment: j } };
      }
      if (action === 'download') {
        const d = deny('download'); if (d) return d;
        const full = sp.get('full') === '1', fmt = ['html', 'csv', 'json'].includes(sp.get('format')) ? sp.get('format') : 'html';
        let pages = Math.min(Math.max(Number(sp.get('pages')) || 1, 1), 5);
        if (full) { const d2 = deny('full'); if (d2) return d2; pages = Math.min(pages, 2) }
        const f = filtersOf(sp), bundle = await M.collectJudgments(f, { pages, fullText: full }), file = M.buildDownload(bundle, fmt);
        audit && audit({ ...who, action: 'maqam.download', entity: 'maqam', detail: { q: (f.q || '').slice(0, 120), format: fmt, pages, full, n: bundle.results.length, failed: bundle.failures.length } });
        return { status: 200, file };
      }
      return { status: 404, body: { error: 'not found' } };
    } catch (e) {
      audit && audit({ ...who, action: 'maqam.error', entity: 'maqam', detail: { action, error: String(e.message).slice(0, 160) } });
      return { status: e.status || 502, body: { error: e.message || 'تعذر تنفيذ البحث' } };
    } finally { busy-- }
  };
}

module.exports = { createService, filtersOf, KEYS };
