// خادم تحديثات المسبار المكتبي: misbar.<الدومين>/updates — للنسخ المرخّصة فقط (الترخيص نفسه رمز الدخول).
// - /updates/check?v=<الحالي>&e=<Electron>  → أحدث إصدار مسموح لهذا المكتب (القناة، الطرح التدريجي، الإيقاف، الحد الأقصى)
// - /updates/file/<الإصدار>                 → الحزمة الموقّعة من R2 (مع دعم Range للاستكمال)
// الحزمة وبيانات الإصدار موقّعة بمفتاح المورّد الخاص على جهازه؛ التطبيق يتحقق قبل التطبيق، فهذا الخادم لا يستطيع دسّ شيفرة.
import { verifyLicense, parseToken, normFp } from './ai-gateway.js';

const VER_RE = /^\d{1,3}\.\d{1,3}\.\d{1,4}$/;
const SLUG_RE = /^[a-z][a-z0-9-]{2,30}$/;
const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const fail = (status, msg) => json(status, { error: { message: msg, type: 'misbar_updates' } });
export const cmpVer = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0) ? 1 : -1; return 0 };
export const r2Key = v => `updates/misbar-${v}.mqp`;

/* موقع المكتب في الطرح التدريجي: ثابت لكل مكتب وإصدار (0–99) */
export async function bucket(slug, version) {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(slug + '|' + version)));
  return ((h[0] << 8) | h[1]) % 100;
}

async function auth(req, env, now) {
  const tok = parseToken(req); if (!tok) return { err: fail(401, 'يلزم ترخيص المسبار') };
  const lic = await verifyLicense(tok.code, tok.fp, env.LICENSE_PUB, now, { needAi: false });
  if (!lic.ok) return { err: fail(401, lic.error) };
  if (lic.payload.id && await env.DB.prepare('SELECT 1 FROM ai_revoked WHERE id = ?').bind(String(lic.payload.id)).first()) return { err: fail(401, 'أُبطل هذا الترخيص') };
  return { slug: lic.payload.slug, fp: normFp(tok.fp) };
}

/* أحدث إصدار مسموح لهذا المكتب أعلى من current */
export async function eligible(env, slug, current, electron = 0) {
  const o = await env.DB.prepare('SELECT channel, hold, max_version FROM update_offices WHERE slug = ?').bind(slug).first();
  if (o && o.hold) return null;
  const chans = o && o.channel === 'beta' ? ['stable', 'beta'] : ['stable'];
  const rows = (await env.DB.prepare(`SELECT * FROM app_releases WHERE status = 'active' AND uploaded = 1 AND channel IN (${chans.map(() => '?').join(',')})`).bind(...chans).all()).results || [];
  rows.sort((a, b) => cmpVer(b.version, a.version));
  for (const r of rows) {
    if (cmpVer(r.version, current) <= 0) break;
    if (o && o.max_version && cmpVer(r.version, o.max_version) > 0) continue;
    // التجريبي يصل لمكاتب beta كاملاً؛ والمستقر حسب نسبة الطرح
    if (r.channel === 'stable' && !(o && o.channel === 'beta') && (await bucket(slug, r.version)) >= Number(r.rollout || 0)) continue;
    return r;
  }
  return null;
}

export async function handle(req, env, path, { now = new Date() } = {}) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return fail(405, 'GET فقط');
  const a = await auth(req, env, now); if (a.err) return a.err;
  const u = new URL(req.url), stamp = now.toISOString().slice(0, 19).replace('T', ' ');
  if (path === '/updates/check') {
    const cur = VER_RE.test(u.searchParams.get('v') || '') ? u.searchParams.get('v') : '0.0.0', el = parseInt(u.searchParams.get('e') || '0', 10) || 0;
    const r = await eligible(env, a.slug, cur, el);
    await env.DB.prepare(`INSERT INTO update_seen(slug, fp, version, electron, offered, last_check) VALUES(?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug, fp) DO UPDATE SET version = excluded.version, electron = excluded.electron, offered = excluded.offered, last_check = excluded.last_check`).bind(a.slug, a.fp, cur, el, r ? r.version : null, stamp).run();
    if (!r) return json(200, { update: false, current: cur });
    return json(200, { update: true, version: r.version, size: r.size, sha256: r.sha256, sig: r.sig, min_electron: r.min_electron, notes: r.notes || '', channel: r.channel, url: '/updates/file/' + r.version });
  }
  const m = /^\/updates\/file\/(\d{1,3}\.\d{1,3}\.\d{1,4})$/.exec(path);
  if (m) {
    const v = m[1];
    const rel = await env.DB.prepare("SELECT * FROM app_releases WHERE version = ? AND status = 'active' AND uploaded = 1").bind(v).first();
    if (!rel) return fail(404, 'الإصدار غير متاح');
    // لا يُنزَّل إلا ما يُعرض على هذا المكتب (أو أقدم منه)
    const best = await eligible(env, a.slug, '0.0.0');
    if (!best || cmpVer(v, best.version) > 0) return fail(403, 'هذا الإصدار غير متاح لمكتبك بعد');
    const range = req.headers.get('range');
    const obj = await env.MEDIA.get(r2Key(v), range ? { range: req.headers } : {});
    if (!obj) return fail(404, 'ملف الإصدار غير موجود');
    if (!range) await env.DB.prepare('UPDATE update_seen SET downloaded = ?, last_download = ? WHERE slug = ? AND fp = ?').bind(v, stamp, a.slug, a.fp).run();
    const h = new Headers({ 'content-type': 'application/octet-stream', 'cache-control': 'no-store', 'accept-ranges': 'bytes', 'x-mq-sha256': rel.sha256 });
    if (range && obj.range) { const off = obj.range.offset || 0, len = obj.range.length != null ? obj.range.length : obj.size - off; h.set('content-range', `bytes ${off}-${off + len - 1}/${obj.size}`); h.set('content-length', String(len)); return new Response(req.method === 'HEAD' ? null : obj.body, { status: 206, headers: h }) }
    h.set('content-length', String(obj.size));
    return new Response(req.method === 'HEAD' ? null : obj.body, { status: 200, headers: h });
  }
  return fail(404, 'غير موجود');
}

/* لوحة المورّد (/_ops/updates/* برمز OPS_TOKEN) */
export async function ops(req, env, p) {
  const M = req.method;
  if (p === '/_ops/updates/releases' && M === 'GET') return json(200, (await env.DB.prepare('SELECT * FROM app_releases ORDER BY created_at DESC').all()).results);
  if (p === '/_ops/updates/release' && M === 'POST') {
    const b = await req.json().catch(() => ({})), v = String(b.version || '');
    if (!VER_RE.test(v)) return json(400, { error: 'version' });
    const ex = await env.DB.prepare('SELECT * FROM app_releases WHERE version = ?').bind(v).first();
    const st = ['active', 'paused', 'withdrawn'].includes(b.status) ? b.status : (ex ? ex.status : 'paused');
    const ro = b.rollout != null ? Math.max(0, Math.min(100, Math.round(+b.rollout || 0))) : (ex ? ex.rollout : 0);
    const ch = b.channel === 'beta' ? 'beta' : b.channel === 'stable' ? 'stable' : (ex ? ex.channel : 'stable');
    if (!ex) {
      if (!/^[a-f0-9]{64}$/.test(String(b.sha256 || '')) || !(b.size > 0) || !b.sig) return json(400, { error: 'sha256/size/sig' });
      await env.DB.prepare('INSERT INTO app_releases(version, channel, size, sha256, sig, min_electron, notes, rollout, status) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(v, ch, Math.round(b.size), b.sha256, String(b.sig), Math.max(0, parseInt(b.min_electron || 0, 10) || 0), String(b.notes || '').slice(0, 2000), ro, st).run();
    } else {
      await env.DB.prepare('UPDATE app_releases SET status = ?, rollout = ?, channel = ?, notes = COALESCE(?, notes) WHERE version = ?').bind(st, ro, ch, b.notes != null ? String(b.notes).slice(0, 2000) : null, v).run();
    }
    return json(200, await env.DB.prepare('SELECT * FROM app_releases WHERE version = ?').bind(v).first());
  }
  const up = /^\/_ops\/updates\/upload\/(\d{1,3}\.\d{1,3}\.\d{1,4})$/.exec(p);
  if (up && M === 'PUT') {
    const rel = await env.DB.prepare('SELECT * FROM app_releases WHERE version = ?').bind(up[1]).first();
    if (!rel) return json(400, { error: 'سجّل الإصدار أولاً' });
    const obj = await env.MEDIA.put(r2Key(up[1]), req.body, { httpMetadata: { contentType: 'application/octet-stream' }, sha256: rel.sha256 });
    if (!obj || obj.size !== rel.size) return json(400, { error: 'الحجم غير مطابق' });
    await env.DB.prepare('UPDATE app_releases SET uploaded = 1 WHERE version = ?').bind(up[1]).run();
    return json(200, { ok: true, version: up[1], size: obj.size });
  }
  if (p === '/_ops/updates/office' && M === 'POST') {
    const b = await req.json().catch(() => ({})), slug = String(b.slug || '');
    if (!SLUG_RE.test(slug)) return json(400, { error: 'slug' });
    const mv = VER_RE.test(String(b.max_version || '')) ? b.max_version : null;
    await env.DB.prepare('INSERT INTO update_offices(slug, channel, hold, max_version, note) VALUES(?, ?, ?, ?, ?) ON CONFLICT(slug) DO UPDATE SET channel = excluded.channel, hold = excluded.hold, max_version = excluded.max_version, note = excluded.note')
      .bind(slug, b.channel === 'beta' ? 'beta' : 'stable', b.hold ? 1 : 0, mv, String(b.note || '').slice(0, 200)).run();
    return json(200, { ok: true });
  }
  if (p === '/_ops/updates/offices' && M === 'GET') {
    const seen = (await env.DB.prepare('SELECT * FROM update_seen ORDER BY last_check DESC').all()).results;
    const conf = (await env.DB.prepare('SELECT * FROM update_offices').all()).results;
    return json(200, { seen, offices: conf });
  }
  return null;
}
