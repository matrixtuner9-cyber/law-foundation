'use strict';
/* إشعارات آيفون (Apple Push Notification service) لتطبيق الموكل
   - مصادقة بالمفتاح (.p8) وتوقيع ES256 عبر WebCrypto، فيعمل نفس الملف في خادم المكتب والسحابة
   - المفتاح يُحفظ في مخزن المكتب ولا يُعاد للمتصفح أبداً
   - النقل يُمرَّر من الخارج: HTTP/2 في خادم المكتب (Node) و fetch في السحابة */

const HOSTS = { prod: 'api.push.apple.com', sandbox: 'api.sandbox.push.apple.com' };
const enc = s => new TextEncoder().encode(s);
const b64u = bytes => { let s = ''; const a = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes); for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') };
const b64uJson = o => b64u(enc(JSON.stringify(o)));

function pemDer(p8) {
  const body = String(p8 || '').replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\s+/g, '');
  const bin = atob(body), out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** يتحقق من إعدادات Apple ويعيد نسخة نظيفة أو رسالة خطأ */
function cleanCfg(b, prev) {
  const keyId = String(b.keyId || '').trim().toUpperCase(), teamId = String(b.teamId || '').trim().toUpperCase(), topic = String(b.topic || '').trim();
  let p8 = String(b.p8 || '').trim();
  if (!/^[A-Z0-9]{10}$/.test(keyId)) return { error: 'رقم المفتاح (Key ID) من 10 أحرف وأرقام إنجليزية.' };
  if (!/^[A-Z0-9]{10}$/.test(teamId)) return { error: 'رقم الفريق (Team ID) من 10 أحرف وأرقام إنجليزية.' };
  if (!/^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/.test(topic)) return { error: 'معرّف التطبيق (Bundle ID) غير صحيح، مثل ps.mithaq.mithaqPortal' };
  if (!p8 && prev && prev.p8) p8 = prev.p8;
  if (!/-----BEGIN PRIVATE KEY-----[\s\S]+-----END PRIVATE KEY-----/.test(p8)) return { error: 'ارفع ملف المفتاح ‎.p8‎ كما نزّلته من حساب Apple.' };
  if (p8.length > 4000) return { error: 'ملف المفتاح غير صالح.' };
  return { cfg: { keyId, teamId, topic, p8, savedAt: new Date().toISOString() } };
}

/** ما يجوز عرضه للمتصفح: بلا المفتاح */
const pubCfg = c => c && c.p8 ? { configured: true, keyId: c.keyId, teamId: c.teamId, topic: c.topic, savedAt: c.savedAt } : { configured: false };

/** رمز الجهاز من iOS: سلسلة سداسية عشرية */
const okToken = t => /^[0-9a-f]{64,200}$/i.test(String(t || ''));

/** نص الإشعار: عنوان ونص وصوت، ومعرّف يجمع رسائل المكتب في مجموعة واحدة */
function notification({ title, body, tag }) {
  return { aps: { alert: { title: String(title || '').slice(0, 120), body: String(body || '').slice(0, 300) }, sound: 'default', 'thread-id': 'mithaq', 'interruption-level': 'active' }, tag: tag || undefined };
}

/**
 * createApns({ getCfg, transport, subtle })
 * transport({ host, path, headers, body }) → { status, body }
 */
function createApns({ getCfg, transport, subtle, now = () => Date.now() }) {
  const S = subtle || globalThis.crypto.subtle;
  let jwt = null; // { token, at, keyId }

  async function token(cfg) {
    const t = Math.floor(now() / 1000);
    if (jwt && jwt.keyId === cfg.keyId + cfg.teamId && t - jwt.at < 45 * 60) return jwt.token; // Apple: جدّد بين 20 و60 دقيقة
    const key = await S.importKey('pkcs8', pemDer(cfg.p8), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
    const head = b64uJson({ alg: 'ES256', kid: cfg.keyId }), claims = b64uJson({ iss: cfg.teamId, iat: t });
    const sig = await S.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc(head + '.' + claims));
    jwt = { token: head + '.' + claims + '.' + b64u(sig), at: t, keyId: cfg.keyId + cfg.teamId };
    return jwt.token;
  }

  /** يرسل إشعاراً لجهاز واحد. gone=true يعني أن الرمز لم يعد صالحاً فيُحذف */
  async function send(device, msg) {
    const cfg = await getCfg();
    if (!cfg || !cfg.p8) return { ok: false, reason: 'not_configured' };
    if (!okToken(device.token)) return { ok: false, gone: true, reason: 'BadDeviceToken' };
    let auth;
    try { auth = await token(cfg) } catch (e) { return { ok: false, reason: 'BadKey' } }
    const host = HOSTS[device.env === 'sandbox' ? 'sandbox' : 'prod'];
    const headers = { authorization: 'bearer ' + auth, 'apns-topic': cfg.topic, 'apns-push-type': 'alert', 'apns-priority': '10', 'apns-expiration': String(Math.floor(now() / 1000) + 86400), 'content-type': 'application/json' };
    if (msg.tag) headers['apns-collapse-id'] = String(msg.tag).slice(0, 64);
    let r;
    try { r = await transport({ host, path: '/3/device/' + device.token, headers, body: JSON.stringify(notification(msg)) }) } catch (e) { return { ok: false, reason: 'network' } }
    if (r.status === 200) return { ok: true };
    if (!r.status) return { ok: false, reason: 'network' };
    let reason = '';
    try { reason = JSON.parse(r.body || '{}').reason || '' } catch (e) {}
    if (reason === 'ExpiredProviderToken' || reason === 'InvalidProviderToken') jwt = null;
    return { ok: false, status: r.status, reason: reason || 'status_' + r.status, gone: r.status === 410 || reason === 'BadDeviceToken' || reason === 'Unregistered' || reason === 'DeviceTokenNotForTopic' };
  }

  return { send };
}

/** سجل أجهزة الآيفون: { [clientId]: [{ token, env, at }] } */
function addDevice(map, client, token, env, at) {
  const list = (map[client] = (map[client] || []).filter(d => d.token !== token));
  list.push({ token, env: env === 'sandbox' ? 'sandbox' : 'prod', at });
  // رمز الجهاز لا يخص إلا موكلاً واحداً: إن سجّل موكل آخر دخوله من نفس الهاتف نحذفه من غيره
  for (const k of Object.keys(map)) if (k !== client) { map[k] = map[k].filter(d => d.token !== token); if (!map[k].length) delete map[k] }
  if (list.length > 5) list.splice(0, list.length - 5);
  return map;
}
function dropDevice(map, token) {
  for (const k of Object.keys(map)) { map[k] = map[k].filter(d => d.token !== token); if (!map[k].length) delete map[k] }
  return map;
}

/** النقل عبر fetch (السحابة) */
const fetchTransport = async ({ host, path, headers, body }) => {
  const r = await fetch('https://' + host + path, { method: 'POST', headers, body });
  return { status: r.status, body: await r.text() };
};

module.exports = { createApns, cleanCfg, pubCfg, okToken, notification, addDevice, dropDevice, fetchTransport, HOSTS };
