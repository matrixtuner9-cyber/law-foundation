'use strict';
/* إشعارات الويب (Web Push) بلا مكتبات: VAPID (RFC 8292) وتشفير المحتوى aes128gcm (RFC 8291) عبر WebCrypto
   يعمل نفس الملف في السحابة (Cloudflare) وفي Node. المفتاح الخاص يُحفظ في مخزن المكتب ولا يُعاد للمتصفح. */

const te = new TextEncoder();
const b64u = bytes => { let s = ''; const a = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes); for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') };
const unb64u = s => { s = String(s || '').replace(/-/g, '+').replace(/_/g, '/'); const bin = atob(s + '='.repeat((4 - s.length % 4) % 4)), out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out };
const cat = (...parts) => { const n = parts.reduce((a, p) => a + p.length, 0), out = new Uint8Array(n); let o = 0; for (const p of parts) { out.set(p, o); o += p.length } return out };

/** خدمات الإشعارات المعروفة فقط: يمنع استخدام الخادم لإرسال طلبات إلى عناوين عشوائية */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^android\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)notify\.windows\.com$/, /^web\.push\.apple\.com$/, /(^|\.)push\.apple\.com$/];
function okSub(s) {
  if (!s || typeof s.endpoint !== 'string' || !s.keys || typeof s.keys.p256dh !== 'string' || typeof s.keys.auth !== 'string') return false;
  if (s.endpoint.length > 1000 || s.keys.p256dh.length > 200 || s.keys.auth.length > 64) return false;
  let u; try { u = new URL(s.endpoint) } catch (e) { return false }
  if (u.protocol !== 'https:' || !PUSH_HOSTS.some(r => r.test(u.hostname))) return false;
  try { return unb64u(s.keys.p256dh).length === 65 && unb64u(s.keys.auth).length === 16 } catch (e) { return false }
}

/** مفتاحا VAPID للمكتب: { publicKey (b64url raw 65), jwk (خاص) } */
async function makeVapid(subtle) {
  const S = subtle || globalThis.crypto.subtle;
  const k = await S.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  return { publicKey: b64u(await S.exportKey('raw', k.publicKey)), jwk: await S.exportKey('jwk', k.privateKey) };
}

async function vapidAuth(S, vapid, endpoint, sub, now) {
  const key = await S.importKey('jwk', vapid.jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const head = b64u(te.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = b64u(te.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(now / 1000) + 12 * 3600, sub })));
  const sig = await S.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, te.encode(head + '.' + claims));
  return `vapid t=${head}.${claims}.${b64u(sig)}, k=${vapid.publicKey}`;
}

async function hkdf(S, salt, ikm, info, len) {
  const k = await S.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await S.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, k, len * 8));
}

/** يشفّر نص الإشعار لاشتراك متصفح واحد (RFC 8291) */
async function encrypt(S, keys, text, rand) {
  const uaPub = unb64u(keys.p256dh), auth = unb64u(keys.auth);
  const eph = await S.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPub = new Uint8Array(await S.exportKey('raw', eph.publicKey));
  const ua = await S.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await S.deriveBits({ name: 'ECDH', public: ua }, eph.privateKey, 256));
  const ikm = await hkdf(S, auth, shared, cat(te.encode('WebPush: info\0'), uaPub, asPub), 32);
  const salt = rand(16);
  const cek = await hkdf(S, salt, ikm, te.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(S, salt, ikm, te.encode('Content-Encoding: nonce\0'), 12);
  const ck = await S.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(await S.encrypt({ name: 'AES-GCM', iv: nonce }, ck, cat(te.encode(text), new Uint8Array([2]))));
  const rs = new Uint8Array([0, 0, 16, 0]); // 4096
  return cat(salt, rs, new Uint8Array([asPub.length]), asPub, ct);
}

/**
 * createWebPush({ getVapid, fetch, subtle, sub })
 * send(subscription, payloadObject) → { ok, status, gone }
 */
function createWebPush({ getVapid, fetch: f, subtle, sub = 'mailto:office@mithaq.ps', now = () => Date.now(), rand }) {
  const S = subtle || globalThis.crypto.subtle;
  const rnd = rand || (n => globalThis.crypto.getRandomValues(new Uint8Array(n)));
  const doFetch = f || ((u, o) => fetch(u, o));
  async function send(s, payload, opts = {}) {
    if (!okSub(s)) return { ok: false, gone: true, reason: 'bad_subscription' };
    const vapid = await getVapid();
    if (!vapid) return { ok: false, reason: 'not_configured' };
    const body = await encrypt(S, s.keys, JSON.stringify(payload), rnd);
    let r;
    try {
      r = await doFetch(s.endpoint, { method: 'POST', body, headers: { authorization: await vapidAuth(S, vapid, s.endpoint, sub, now()), 'content-encoding': 'aes128gcm', 'content-type': 'application/octet-stream', ttl: String(opts.ttl || 86400), urgency: opts.urgency || 'high', ...(payload && payload.tag ? { topic: String(payload.tag).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) } : {}) } });
    } catch (e) { return { ok: false, reason: 'network' } }
    if (r.status >= 200 && r.status < 300) return { ok: true, status: r.status };
    return { ok: false, status: r.status, gone: r.status === 404 || r.status === 410, reason: 'status_' + r.status };
  }
  return { send };
}

/** سجل الاشتراكات: { [clientId]: [{ endpoint, keys }] } */
function addSub(map, client, s) {
  const x = { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } };
  for (const k of Object.keys(map)) { map[k] = map[k].filter(y => y.endpoint !== x.endpoint); if (!map[k].length) delete map[k] }
  const list = (map[client] = map[client] || []); list.push(x);
  if (list.length > 5) list.splice(0, list.length - 5);
  return map;
}
function dropSub(map, endpoint) {
  for (const k of Object.keys(map)) { map[k] = map[k].filter(y => y.endpoint !== endpoint); if (!map[k].length) delete map[k] }
  return map;
}

module.exports = { createWebPush, makeVapid, encrypt, okSub, addSub, dropSub, b64u, unb64u };
