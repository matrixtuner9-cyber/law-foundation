'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const W = require('../lib/webpush.js'), ece = require('http_ece');
const S = crypto.webcrypto.subtle;

// اشتراك متصفح حقيقي الشكل: مفتاح ECDH للمتصفح وسر المصادقة
const ua = crypto.createECDH('prime256v1'); ua.generateKeys();
const auth = crypto.randomBytes(16);
const sub = { endpoint: 'https://web.push.apple.com/QGv3xyz', keys: { p256dh: ua.getPublicKey().toString('base64url'), auth: auth.toString('base64url') } };

test('إشعارات الويب: التشفير aes128gcm يفكّه المتصفح، وتوقيع VAPID صحيح', async () => {
  const vapid = await W.makeVapid(S), calls = [];
  const wp = W.createWebPush({ getVapid: async () => vapid, subtle: S, fetch: async (u, o) => { calls.push({ u, o }); return { status: 201 } } });
  const payload = { title: 'رسالة من المحامي', body: 'موعد الجلسة غداً الساعة 9', tag: 'mq-12', url: './' };
  assert.deepEqual(await wp.send(sub, payload), { ok: true, status: 201 });
  const { u, o } = calls[0];
  assert.equal(u, sub.endpoint); assert.equal(o.headers['content-encoding'], 'aes128gcm'); assert.equal(o.headers.urgency, 'high'); assert.equal(o.headers.topic, 'mq-12');
  const plain = ece.decrypt(Buffer.from(o.body), { version: 'aes128gcm', privateKey: ua, authSecret: auth.toString('base64url') });
  assert.deepEqual(JSON.parse(plain.toString('utf8')), payload);
  const m = /^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/.exec(o.headers.authorization);
  assert.ok(m); assert.equal(m[4], vapid.publicKey);
  const claims = JSON.parse(Buffer.from(m[2], 'base64url'));
  assert.equal(claims.aud, 'https://web.push.apple.com'); assert.match(claims.sub, /^mailto:/); assert.ok(claims.exp > Date.now() / 1000);
  const pub = await S.importKey('raw', W.unb64u(vapid.publicKey), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  assert.ok(await S.verify({ name: 'ECDSA', hash: 'SHA-256' }, pub, W.unb64u(m[3]), new TextEncoder().encode(m[1] + '.' + m[2])));
});

test('إشعارات الويب: اشتراك منتهٍ يُحذف، وعناوين غير معروفة مرفوضة', async () => {
  const vapid = await W.makeVapid(S);
  const wp = W.createWebPush({ getVapid: async () => vapid, subtle: S, fetch: async () => ({ status: 410 }) });
  assert.equal((await wp.send(sub, { title: 't' })).gone, true);
  assert.equal(W.okSub(sub), true);
  assert.equal(W.okSub({ ...sub, endpoint: 'https://evil.example.com/x' }), false);
  assert.equal(W.okSub({ ...sub, endpoint: 'http://fcm.googleapis.com/x' }), false);
  assert.equal(W.okSub({ ...sub, endpoint: 'https://fcm.googleapis.com/fcm/send/abc' }), true);
  assert.equal(W.okSub({ ...sub, keys: { p256dh: 'abc', auth: sub.keys.auth } }), false);
  const none = W.createWebPush({ getVapid: async () => null, subtle: S, fetch: async () => ({ status: 201 }) });
  assert.equal((await none.send(sub, {})).reason, 'not_configured');
  let m = W.addSub({}, 'c1', sub); m = W.addSub(m, 'c2', sub);
  assert.equal(m.c1, undefined); assert.equal(m.c2.length, 1);
  assert.deepEqual(W.dropSub(m, sub.endpoint), {});
});
