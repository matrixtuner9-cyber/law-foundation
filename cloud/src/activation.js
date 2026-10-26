// التفعيل عبر الإنترنت لنسخ المسبار المكتبية (misbar.<الدومين>/activate)
// - المكتب يُدخل معرّفه وكلمة مرور التفعيل (يصدرهما المورّد من «إدارة نسخ المسبار») مرة واحدة على الجهاز الرئيسي.
// - الخادم يتحقق (PBKDF2، قفل بعد محاولات خاطئة، حد الأجهزة) ثم يوقّع ترخيصاً لبصمة الجهاز بمفتاح التفعيل (السر ACT_PRIV).
//   مفتاح المورّد الخاص لا يغادر جهازه؛ والتحديثات لا تقبل إلا مفتاح المورّد، فتسرّب مفتاح التفعيل لا يسمح بدسّ شيفرة.
// - /activate/refresh: التجديد التلقائي (تمديد، تغيير الباقة) والإبطال، بالترخيص الحالي نفسه حتى لو انتهى.
import { verifyLicense, parseToken, normFp } from './ai-gateway.js';

const SLUG_RE = /^[a-z][a-z0-9-]{2,30}$/;
const ITER = 100000, MAX_FAILS = 8, LOCK_MS = 15 * 60e3;
const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const fail = (status, msg) => json(status, { error: { message: msg, type: 'misbar_activation' } });
const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const b64u = b => { let s = ''; for (const x of new Uint8Array(b)) s += String.fromCharCode(x); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') };
const b64uStr = str => b64u(enc.encode(str));
const fmtFp = fp => (normFp(fp).match(/.{4}/g) || []).join('-');
const today = now => now.toISOString().slice(0, 10);
const stamp = now => now.toISOString().slice(0, 19).replace('T', ' ');

export async function hashPw(pw, saltHex, iter = ITER) {
  const key = await crypto.subtle.importKey('raw', enc.encode(String(pw)), 'PBKDF2', false, ['deriveBits']);
  const salt = new Uint8Array(saltHex.match(/../g).map(h => parseInt(h, 16)));
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256));
}
const eqHex = (a, b) => { if (!a || !b || a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0 };
/* كلمة المرور تُطبَّع: بلا مسافات أو شرطات، وبأحرف كبيرة (تُكتب كما تُقرأ) */
export const normPw = s => String(s || '').toUpperCase().replace(/[\s-]+/g, '');

let privCache = null;
async function privKey(pem) {
  if (privCache && privCache.pem === pem) return privCache.key;
  const b = atob(String(pem).replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, '')); const der = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) der[i] = b.charCodeAt(i);
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'Ed25519' }, false, ['sign']);
  privCache = { pem, key }; return key;
}
/* نفس صيغة office/lib/license.js: MQ1.<payload>.<sig> */
export async function signLicense(payload, pem) {
  const body = b64uStr(JSON.stringify(payload));
  return 'MQ1.' + body + '.' + b64u(await crypto.subtle.sign('Ed25519', await privKey(pem), enc.encode('MQ1.' + body)));
}
const payloadOf = (a, d, now) => ({ v: 2, fp: fmtFp(d.fp), office: a.name, slug: a.slug, edition: a.edition, users: a.users, exp: a.exp || '', ai: a.edition === 'private' ? 0 : Number(a.ai || 0), iat: today(now), id: d.id, src: 'online' });
const rid = () => hex(crypto.getRandomValues(new Uint8Array(4)));

export async function handle(req, env, path, { now = new Date() } = {}) {
  if (req.method !== 'POST') return fail(405, 'POST فقط');
  if (!env.ACT_PRIV) return fail(503, 'خادم التفعيل غير مجهّز بعد؛ استعمل التفعيل اليدوي');
  const b = await req.json().catch(() => ({}));
  const ip = req.headers.get('cf-connecting-ip') || '';

  if (path === '/activate') {
    const slug = String(b.slug || '').trim().toLowerCase(), fp = normFp(b.fp);
    if (!SLUG_RE.test(slug) || fp.length !== 20) return fail(400, 'بيانات التفعيل غير مكتملة');
    const a = await env.DB.prepare('SELECT * FROM act_accounts WHERE slug = ?').bind(slug).first();
    const bad = 'معرّف المكتب أو كلمة مرور التفعيل غير صحيحة';
    if (!a || !a.hash) { await crypto.subtle.digest('SHA-256', enc.encode(slug)); return fail(401, bad) }
    if (a.locked_until > now.getTime()) return fail(429, `أُوقف التفعيل مؤقتاً بعد محاولات خاطئة متكررة. حاول بعد ${Math.ceil((a.locked_until - now.getTime()) / 60e3)} دقيقة.`);
    if (!eqHex(await hashPw(normPw(b.password), a.salt, a.iter || ITER), a.hash)) {
      const f = (a.fails || 0) + 1, lock = f >= MAX_FAILS ? now.getTime() + LOCK_MS : 0;
      await env.DB.prepare('UPDATE act_accounts SET fails = ?, locked_until = ? WHERE slug = ?').bind(lock ? 0 : f, lock, slug).run();
      return fail(401, bad);
    }
    if (a.fails) await env.DB.prepare('UPDATE act_accounts SET fails = 0, locked_until = 0 WHERE slug = ?').bind(slug).run();
    if (a.status !== 'active') return fail(403, 'حساب التفعيل لهذا المكتب موقوف؛ تواصل مع المورّد');
    if (a.exp && today(now) > a.exp) return fail(403, 'انتهى اشتراك هذا المكتب في ' + a.exp + '؛ تواصل مع المورّد للتجديد');
    let d = await env.DB.prepare('SELECT * FROM act_devices WHERE slug = ? AND fp = ?').bind(slug, fp).first();
    if (d && d.status === 'revoked') return fail(403, 'أُلغي تفعيل هذا الجهاز من المورّد؛ تواصل معه لإعادة تفعيله');
    if (!d) {
      const used = (await env.DB.prepare("SELECT COUNT(*) n FROM act_devices WHERE slug = ? AND status = 'active'").bind(slug).first()).n;
      if (used >= a.seats) return fail(409, `فُعِّل المسبار على ${used} ${used === 1 ? 'جهاز' : 'أجهزة'} لهذا المكتب، وهو الحد المسموح. لنقل الترخيص إلى هذا الجهاز تواصل مع المورّد لإلغاء تفعيل الجهاز القديم.\nأجهزة فريق العمل لا تحتاج تفعيلاً: اختر «فريق عمل مكتب قائم» عند تثبيتها.`);
      d = { id: rid(), slug, fp };
      await env.DB.prepare("INSERT INTO act_devices(id, slug, fp, device, version, ip, status, activated_at, last_seen) VALUES(?, ?, ?, ?, ?, ?, 'active', ?, ?)").bind(d.id, slug, fp, String(b.device || '').slice(0, 80), String(b.version || '').slice(0, 20), ip, stamp(now), stamp(now)).run();
    } else {
      await env.DB.prepare('UPDATE act_devices SET device = ?, version = ?, ip = ?, last_seen = ? WHERE id = ?').bind(String(b.device || d.device || '').slice(0, 80), String(b.version || d.version || '').slice(0, 20), ip, stamp(now), d.id).run();
    }
    const p = payloadOf(a, d, now);
    return json(200, { ok: true, code: await signLicense(p, env.ACT_PRIV), office: a.name, exp: p.exp });
  }

  if (path === '/activate/refresh') {
    const tok = parseToken(req); if (!tok) return fail(401, 'يلزم ترخيص المسبار');
    const lic = await verifyLicense(tok.code, tok.fp, (env.LICENSE_PUB || '') + '\n' + (env.ACTIVATION_PUB || ''), now, { needAi: false, ignoreExp: true });
    if (!lic.ok) return fail(401, lic.error);
    const slug = lic.payload.slug, fp = normFp(tok.fp);
    if (lic.payload.id && await env.DB.prepare('SELECT 1 FROM ai_revoked WHERE id = ?').bind(String(lic.payload.id)).first()) return json(200, { status: 'revoked', message: 'أُبطل ترخيص هذا الجهاز من المورّد' });
    const d = await env.DB.prepare('SELECT * FROM act_devices WHERE slug = ? AND fp = ?').bind(slug, fp).first();
    if (!d) return json(200, { status: 'manual' }); // ترخيص يدوي من المورّد: يُجدَّد يدوياً
    if (d.status === 'revoked') return json(200, { status: 'revoked', message: 'أُلغي تفعيل هذا الجهاز من المورّد' });
    const a = await env.DB.prepare('SELECT * FROM act_accounts WHERE slug = ?').bind(slug).first();
    if (!a || a.status !== 'active') return json(200, { status: 'suspended', message: 'حساب هذا المكتب موقوف لدى المورّد' }); // يبقى الترخيص المحلي حتى انتهائه
    await env.DB.prepare('UPDATE act_devices SET last_seen = ?, version = COALESCE(?, version), ip = ? WHERE id = ?').bind(stamp(now), b.version ? String(b.version).slice(0, 20) : null, ip, d.id).run();
    const p = payloadOf(a, d, now), cur = lic.payload;
    // يُعاد التوقيع فقط إذا تغيّر شيء في الباقة (لا يتغير الكود كل مرة)
    const same = ['office', 'edition', 'users', 'exp', 'ai'].every(k => String(cur[k] ?? '') === String(p[k] ?? '')) && cur.id === p.id;
    return json(200, same ? { status: 'active' } : { status: 'active', code: await signLicense(p, env.ACT_PRIV), exp: p.exp });
  }
  return fail(404, 'غير موجود');
}

/* لوحة المورّد: /_ops/act/* */
export async function ops(req, env, p, { now = new Date() } = {}) {
  const M = req.method;
  if (p === '/_ops/act/account' && M === 'GET') {
    const slug = new URL(req.url).searchParams.get('slug') || '';
    const a = await env.DB.prepare('SELECT slug, name, seats, edition, users, exp, ai, status, created_at, updated_at, (hash IS NOT NULL) has_pw FROM act_accounts WHERE slug = ?').bind(slug).first();
    const devices = (await env.DB.prepare('SELECT * FROM act_devices WHERE slug = ? ORDER BY activated_at').bind(slug).all()).results;
    return json(200, { account: a, devices });
  }
  if (p === '/_ops/act/account' && M === 'POST') {
    const b = await req.json().catch(() => ({})), slug = String(b.slug || '');
    if (!SLUG_RE.test(slug)) return json(400, { error: 'slug' });
    const ex = await env.DB.prepare('SELECT * FROM act_accounts WHERE slug = ?').bind(slug).first();
    const v = {
      name: String(b.name || (ex && ex.name) || slug).slice(0, 120),
      seats: Math.max(1, Math.min(50, parseInt(b.seats ?? (ex ? ex.seats : 1), 10) || 1)),
      edition: ['connected', 'private'].includes(b.edition) ? b.edition : (ex ? ex.edition : 'connected'),
      users: Math.max(1, Math.min(500, parseInt(b.users ?? (ex ? ex.users : 5), 10) || 5)),
      exp: b.exp === '' ? '' : /^\d{4}-\d{2}-\d{2}$/.test(String(b.exp || '')) ? b.exp : (ex ? ex.exp || '' : ''),
      ai: Math.max(0, Math.round(+(b.ai ?? (ex ? ex.ai : 0)) || 0)),
      status: ['active', 'suspended'].includes(b.status) ? b.status : (ex ? ex.status : 'active'),
    };
    let salt = ex && ex.salt, hash = ex && ex.hash;
    if (b.password) { const pw = normPw(b.password); if (pw.length < 8) return json(400, { error: 'كلمة المرور قصيرة' }); salt = hex(crypto.getRandomValues(new Uint8Array(16))); hash = await hashPw(pw, salt) }
    if (ex) await env.DB.prepare('UPDATE act_accounts SET name = ?, seats = ?, edition = ?, users = ?, exp = ?, ai = ?, status = ?, salt = ?, hash = ?, iter = ?, fails = 0, locked_until = 0, updated_at = ? WHERE slug = ?').bind(v.name, v.seats, v.edition, v.users, v.exp, v.ai, v.status, salt, hash, ITER, stamp(now), slug).run();
    else await env.DB.prepare('INSERT INTO act_accounts(slug, name, seats, edition, users, exp, ai, status, salt, hash, iter, updated_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(slug, v.name, v.seats, v.edition, v.users, v.exp, v.ai, v.status, salt, hash, ITER, stamp(now)).run();
    return json(200, { ok: true, slug, ...v, has_pw: !!hash });
  }
  if (p === '/_ops/act/device' && M === 'POST') {
    const b = await req.json().catch(() => ({}));
    const d = await env.DB.prepare('SELECT * FROM act_devices WHERE id = ?').bind(String(b.id || '')).first();
    if (!d) return json(404, { error: 'device' });
    if (b.status === 'revoked') {
      await env.DB.prepare("UPDATE act_devices SET status = 'revoked' WHERE id = ?").bind(d.id).run();
      await env.DB.prepare("INSERT OR IGNORE INTO ai_revoked(id, at) VALUES(?, datetime('now'))").bind(d.id).run();
    } else if (b.status === 'delete') {
      // حذف الجهاز يحرّر مقعده؛ ترخيصه يبقى مُبطلاً
      await env.DB.prepare("INSERT OR IGNORE INTO ai_revoked(id, at) VALUES(?, datetime('now'))").bind(d.id).run();
      await env.DB.prepare('DELETE FROM act_devices WHERE id = ?').bind(d.id).run();
    } else return json(400, { error: 'status' });
    return json(200, { ok: true });
  }
  return null;
}
