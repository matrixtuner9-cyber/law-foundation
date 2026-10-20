'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const A = require('../lib/apns.js');

const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
const p8 = privateKey.export({ type: 'pkcs8', format: 'pem' });
const TOK = 'ab'.repeat(32);
const cfgIn = { keyId: 'abc123def4', teamId: 'TEAM123456', topic: 'ps.mithaq.mithaqPortal', p8 };

test('آيفون: التحقق من إعدادات Apple، ولا يُعاد المفتاح للمتصفح', () => {
  const r = A.cleanCfg(cfgIn);
  assert.equal(r.cfg.keyId, 'ABC123DEF4'); assert.equal(r.cfg.teamId, 'TEAM123456');
  assert.deepEqual(Object.keys(A.pubCfg(r.cfg)).sort(), ['configured', 'keyId', 'savedAt', 'teamId', 'topic']);
  assert.equal(A.pubCfg(null).configured, false);
  assert.match(A.cleanCfg({ ...cfgIn, keyId: 'x' }).error, /Key ID/);
  assert.match(A.cleanCfg({ ...cfgIn, topic: 'bad' }).error, /Bundle/);
  assert.match(A.cleanCfg({ ...cfgIn, p8: 'hello' }).error, /p8/);
  // تعديل الأرقام دون إعادة رفع المفتاح يبقي المفتاح المحفوظ
  assert.equal(A.cleanCfg({ ...cfgIn, p8: '' }, r.cfg).cfg.p8, p8.trim());
});

test('آيفون: الإرسال بتوقيع ES256 صحيح وترويسات APNs، وحذف الرمز المنتهي', async () => {
  const cfg = A.cleanCfg(cfgIn).cfg, calls = [];
  let reply = { status: 200, body: '' };
  const apns = A.createApns({ getCfg: async () => cfg, transport: async x => { calls.push(x); return reply }, subtle: crypto.webcrypto.subtle });
  assert.deepEqual(await apns.send({ token: TOK, env: 'prod' }, { title: 'رسالة من المحامي', body: 'موعد الجلسة غداً', tag: 'mq-1' }), { ok: true });
  const c = calls[0];
  assert.equal(c.host, 'api.push.apple.com'); assert.equal(c.path, '/3/device/' + TOK);
  assert.equal(c.headers['apns-topic'], 'ps.mithaq.mithaqPortal'); assert.equal(c.headers['apns-push-type'], 'alert'); assert.equal(c.headers['apns-collapse-id'], 'mq-1');
  const body = JSON.parse(c.body); assert.equal(body.aps.alert.title, 'رسالة من المحامي'); assert.equal(body.aps.sound, 'default');
  const [h, cl, sig] = c.headers.authorization.slice(7).split('.');
  assert.deepEqual(JSON.parse(Buffer.from(h, 'base64url')), { alg: 'ES256', kid: 'ABC123DEF4' });
  assert.equal(JSON.parse(Buffer.from(cl, 'base64url')).iss, 'TEAM123456');
  assert.ok(crypto.verify('sha256', Buffer.from(h + '.' + cl), { key: publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(sig, 'base64url')));
  // نفس الرمز يُعاد استخدامه، وجهاز الاختبار يذهب لخادم sandbox
  await apns.send({ token: TOK, env: 'sandbox' }, { title: 't', body: 'b' });
  assert.equal(calls[1].host, 'api.sandbox.push.apple.com'); assert.equal(calls[1].headers.authorization, c.headers.authorization);
  reply = { status: 410, body: '{"reason":"Unregistered"}' };
  const g = await apns.send({ token: TOK, env: 'prod' }, { title: 't', body: 'b' });
  assert.equal(g.ok, false); assert.equal(g.gone, true); assert.equal(g.reason, 'Unregistered');
  reply = { status: 403, body: '{"reason":"InvalidProviderToken"}' };
  assert.equal((await apns.send({ token: TOK }, { title: 't' })).gone, false);
  assert.equal((await A.createApns({ getCfg: async () => null, transport: async () => reply }).send({ token: TOK }, {})).reason, 'not_configured');
});

test('آيفون: سجل الأجهزة — الهاتف لموكل واحد، وحد خمسة أجهزة', () => {
  let m = A.addDevice({}, 'c1', TOK, 'prod', 'x');
  m = A.addDevice(m, 'c1', TOK, 'sandbox', 'y');
  assert.equal(m.c1.length, 1); assert.equal(m.c1[0].env, 'sandbox');
  m = A.addDevice(m, 'c2', TOK, 'prod', 'z');
  assert.equal(m.c1, undefined); assert.equal(m.c2.length, 1);
  for (let i = 0; i < 7; i++) m = A.addDevice(m, 'c2', String(i).repeat(64), 'prod', 'z');
  assert.equal(m.c2.length, 5);
  m = A.dropDevice(m, '6'.repeat(64)); assert.equal(m.c2.length, 4);
  assert.equal(A.okToken('zz'), false); assert.equal(A.okToken(TOK), true);
});
