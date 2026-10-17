// الواجهة الأمامية: يحدد المكتب من النطاق الفرعي (<مكتب>.palgaz.net) ويمرر الطلب لـ Durable Object الخاص به.
// عمليات مزود الخدمة (/_ops) محمية برمز سري، ولا تمر لأي مكتب إلا عبرها.
import crypto from 'node:crypto';
import { norm, opsSig } from './office.js';
export { Office } from './office.js';

const RESERVED = new Set(['www', 'admin', 'ops', 'api', 'app', 'portal', 'mail', 'static', 'office', 'support', 'status']);
const SLUG_RE = /^[a-z][a-z0-9-]{2,30}$/;
const cache = new Map(); // سجل المكاتب في الذاكرة لدقيقة
const page = (title, body, status = 404) => new Response(`<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><body style="font-family:Cairo,Tahoma,sans-serif;background:#F5F0E6;color:#121B2E;display:grid;place-items:center;min-height:100vh;margin:0"><div style="text-align:center;padding:24px"><h1 style="font-size:24px">${title}</h1><p style="color:#5D6375">${body}</p></div>`, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
const json = (code, obj) => new Response(JSON.stringify(obj), { status: code, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

function hostInfo(host, env) {
  host = String(host || '').toLowerCase().split(':')[0];
  for (const base of String(env.BASE_DOMAINS || 'palgaz.net').split(',').map(x => x.trim()).filter(Boolean)) {
    if (host === base || host === 'www.' + base) return { base, root: true };
    if (host.endsWith('.' + base)) { const sub = host.slice(0, -base.length - 1); return { base, sub } }
  }
  return { base: null };
}

async function office(env, slug) {
  const c = cache.get(slug); if (c && Date.now() - c.at < 60e3) return c.v;
  const v = await env.DB.prepare('SELECT slug, name, status FROM offices WHERE slug = ?').bind(slug).first();
  cache.set(slug, { at: Date.now(), v }); return v;
}
const stub = (env, slug) => env.OFFICE.get(env.OFFICE.idFromName(slug));
const forward = (env, slug, req, path, asOps = false) => {
  const u = new URL(req.url); if (path) u.pathname = path;
  const r = new Request(u, req); r.headers.set('x-mq-office', slug);
  r.headers.delete('x-mq-ops'); if (asOps) r.headers.set('x-mq-ops', opsSig(env)); // لا يستطيع الزائر انتحال طلب مشغّل
  return stub(env, slug).fetch(r);
};
/* عمليات المشغّل تُقبل فقط على نطاقات الإدارة المحددة، لا على نطاقات المكاتب */
const opsHost = (req, u, env) => String(env.OPS_HOSTS || 'test.palgaz.net').toLowerCase().split(',').map(x => x.trim()).includes(String(req.headers.get('host') || u.host).toLowerCase().split(':')[0]);

function opsAuthorized(req, env) {
  if (!env.OPS_TOKEN) return false;
  const got = String(req.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''), want = env.OPS_TOKEN;
  const a = crypto.createHash('sha256').update(got).digest(), b = crypto.createHash('sha256').update(want).digest();
  return crypto.timingSafeEqual(a, b);
}

async function ops(req, env, u) {
  if (!opsAuthorized(req, env)) return json(404, { error: 'not found' });
  const p = u.pathname, M = req.method;
  if (p === '/_ops/offices' && M === 'GET') return json(200, (await env.DB.prepare('SELECT * FROM offices ORDER BY created_at').all()).results);
  if (p === '/_ops/offices' && M === 'POST') {
    const b = await req.json().catch(() => ({})), slug = String(b.slug || '').toLowerCase();
    if (!SLUG_RE.test(slug) || RESERVED.has(slug)) return json(400, { error: 'اسم المكتب في الرابط: 3–31 حرفاً لاتينياً صغيراً أو أرقاماً أو -، ويبدأ بحرف.' });
    if (await env.DB.prepare('SELECT 1 FROM offices WHERE slug = ?').bind(slug).first()) return json(409, { error: 'exists' });
    await env.DB.prepare("INSERT INTO offices(slug, name, status, created_at) VALUES(?, ?, 'active', datetime('now'))").bind(slug, String(b.name || slug).slice(0, 120)).run();
    cache.delete(slug);
    const r = await forward(env, slug, new Request(new URL('/_ops/init', u), { method: 'POST', body: JSON.stringify(b) }), null, true);
    return json(201, { slug, init: await r.json() });
  }
  const m = /^\/_ops\/offices\/([a-z0-9-]+)(\/.*)$/.exec(p);
  if (m) {
    const [, slug, rest] = m;
    if (!(await env.DB.prepare('SELECT 1 FROM offices WHERE slug = ?').bind(slug).first())) return json(404, { error: 'no such office' });
    if (rest === '/status' && M === 'POST') {
      const { status } = await req.json().catch(() => ({}));
      if (!['active', 'suspended'].includes(status)) return json(400, { error: 'status' });
      await env.DB.prepare('UPDATE offices SET status = ? WHERE slug = ?').bind(status, slug).run(); cache.delete(slug);
      return json(200, { ok: true, slug, status });
    }
    const map = { '/info': '/_ops/info', '/setup-link': '/_ops/setup-link', '/import': '/_ops/import', '/media': '/_ops/media', '/export': '/_ops/export', '/backup': '/_ops/backup', '/reset-password': '/_ops/reset-password' };
    if (!map[rest]) return json(404, { error: 'unknown op' });
    const r = await forward(env, slug, req, map[rest], true);
    if (rest === '/setup-link' && r.ok) { const j = await r.json(); return json(200, { ...j, url: `https://${slug}.${String(env.BASE_DOMAINS || 'palgaz.net').split(',')[0].trim()}/login.html?setup=${j.token}` }) }
    return r;
  }
  /* دليل المحامين المشترك: يُستورد على دفعات من نتيجة جامع الصفحة العامة */
  if (p === '/_ops/bar/import' && M === 'POST') {
    const b = await req.json().catch(() => ({}));
    const pick = (info, re, not) => { const k = Object.keys(info || {}).find(k => re.test(k) && !(not && not.test(k))); return k ? info[k] : '' };
    const stmts = [];
    if (b.reset) stmts.push(env.DB.prepare('DELETE FROM bar_dir'));
    for (const l of b.lawyers || []) {
      const city = pick(l.info, /مدين/), off = pick(l.info, /اسم|مكتب/, /عنوان/), address = pick(l.info, /عنوان/);
      const phones = (l.phones || []).map(x => String(x).replace(/[^\d+]/g, '')).filter(Boolean);
      stmts.push(env.DB.prepare('INSERT OR REPLACE INTO bar_dir(mno, name, status, city, office, address, phones, email, page, norm) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(String(l.mno), l.name || '', l.status || '', city || '', off || '', address || '', JSON.stringify(phones), l.email || '', l.page || null,
          [norm(l.name), norm(l.mno), phones.map(x => x.replace(/\D/g, '')).join(' '), norm(off), norm(l.email)].join(' | ')));
    }
    if (b.meta) stmts.push(env.DB.prepare("INSERT INTO meta(key, value) VALUES('bar_meta', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(JSON.stringify(b.meta)));
    if (stmts.length) await env.DB.batch(stmts);
    return json(200, { ok: true, n: (b.lawyers || []).length, total: (await env.DB.prepare('SELECT COUNT(*) n FROM bar_dir').first()).n });
  }
  return json(404, { error: 'unknown op' });
}

/* نسخ احتياطي يومي مشفّر لكل مكتب نشط إلى R2 (يتطلب السر BACKUP_KEY) */
async function backupAll(env) {
  const rows = (await env.DB.prepare("SELECT slug FROM offices WHERE status = 'active'").all()).results || [], out = [];
  for (const { slug } of rows) {
    try { const r = await forward(env, slug, new Request('https://internal/_ops/backup', { method: 'POST' }), null, true); out.push({ slug, ...(await r.json()) }) }
    catch (e) { out.push({ slug, ok: false, error: String(e.message || e) }) }
  }
  console.log('[backup]', JSON.stringify(out));
  return out;
}

export default {
  async scheduled(event, env, ctx) { ctx.waitUntil(backupAll(env)) },
  async fetch(req, env) {
    const u = new URL(req.url), h = hostInfo(req.headers.get('host') || u.host, env);
    const secure = r => { if (u.protocol !== 'https:') return r; const x = new Response(r.body, r); x.headers.set('Strict-Transport-Security', 'max-age=31536000'); return x };
    if (u.pathname.startsWith('/_ops/')) return opsHost(req, u, env) ? ops(req, env, u) : json(404, { error: 'not found' });
    if (!h.base) return page('غير موجود', 'هذا العنوان غير مرتبط بأي مكتب.');
    if (h.root) {
      const r = await env.ASSETS.fetch(new Request(new URL('/site/index.html', u)));
      return secure(r.ok ? r : page('ميثاق', 'نظام إدارة مكاتب المحاماة', 200));
    }
    const slug = h.sub;
    if (!SLUG_RE.test(slug) || RESERVED.has(slug)) return page('غير موجود', 'هذا العنوان غير مرتبط بأي مكتب.');
    const o = await office(env, slug);
    if (!o) return page('غير موجود', 'لا يوجد مكتب بهذا العنوان. تأكد من الرابط الذي وصلك من مكتب المحاماة.');
    if (o.status !== 'active') return u.pathname.startsWith('/api/') ? json(403, { error: 'الخدمة موقوفة مؤقتاً لهذا المكتب.' }) : page('الخدمة موقوفة مؤقتاً', 'تواصل مع مكتب المحاماة.', 403);
    return secure(await forward(env, slug, req));
  },
};
