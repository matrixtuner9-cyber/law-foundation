// التحديث التلقائي: الحزمة الموقّعة، والإقلاع والرجوع التلقائي، وخادم التحديثات (الترخيص والطرح التدريجي)، والنشر من برنامج المورّد
'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto'), zlib = require('zlib'), { pathToFileURL } = require('url');
const { DatabaseSync } = require('node:sqlite');
const P = require('../lib/update-pack'), U = require('../lib/updater'), L = require('../lib/license');
const OFF = path.join(__dirname, '..');
const CLOUD = [path.join(OFF, '..', 'cloud'), path.join(OFF, '..', 'cloud-deploy')].find(d => fs.existsSync(path.join(d, 'src', 'updates.js')));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mq-upd-'));
test.after(() => fs.rmSync(TMP, { recursive: true, force: true }));

const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
const PUB = publicKey.export({ type: 'spki', format: 'pem' }), PRIV = privateKey.export({ type: 'pkcs8', format: 'pem' });

/* تطبيق صغير بهيئة المسبار */
function fakeApp(dir, mark) {
  for (const [f, c] of Object.entries({ 'package.json': JSON.stringify({ name: 'mithaq', version: '1.0.0' }), 'server.js': '// ' + mark, 'electron/main.js': '// main ' + mark, 'lib/x.js': 'module.exports=' + JSON.stringify(mark), 'data/mithaq.db': 'SECRET', 'tools/activator.js': 'x', 'edition.json': '{}' })) {
    fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), c);
  }
  return dir;
}
const release = (pk, v, extra = {}) => { const m = { version: v, sha256: pk.sha256, size: pk.size, min_electron: 0, ...extra }; m.sig = P.signRelease(m, PRIV); return m };

test('الحزمة: تُفك كما هي برقم الإصدار الجديد، بلا بيانات المكتب ولا أدوات المورّد، وترفض التلاعب', () => {
  const app = fakeApp(path.join(TMP, 'app1'), 'v2');
  const pk = P.pack(app, '1.0.5');
  const out = path.join(TMP, 'out1'), head = P.unpack(pk.buf, out);
  assert.equal(head.version, '1.0.5');
  assert.equal(JSON.parse(fs.readFileSync(path.join(out, 'package.json'), 'utf8')).version, '1.0.5');
  assert.equal(fs.readFileSync(path.join(out, 'lib/x.js'), 'utf8'), 'module.exports="v2"');
  for (const f of ['data/mithaq.db', 'tools/activator.js', 'edition.json']) assert.ok(!fs.existsSync(path.join(out, f)), 'لا يُشحن ' + f);
  // التوقيع
  const m = release(pk, '1.0.5');
  assert.ok(P.verifyRelease(m, PUB));
  assert.ok(!P.verifyRelease({ ...m, sha256: '0'.repeat(64) }, PUB), 'بصمة معدّلة');
  assert.ok(!P.verifyRelease({ ...m, version: '9.9.9' }, PUB), 'رقم معدّل');
  const other = crypto.generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'pem' });
  assert.ok(!P.verifyRelease({ ...m, sig: P.signRelease(m, other) }, PUB), 'مفتاح غير المورّد');
  // ملف معدّل داخل الحزمة
  const raw = zlib.gunzipSync(pk.buf); raw[raw.length - 3] ^= 1;
  assert.throws(() => P.unpack(zlib.gzipSync(raw), path.join(TMP, 'out2')), /تالف/);
  // مسار يخرج عن المجلد
  const head2 = Buffer.from(JSON.stringify({ version: '1.0.6', files: [{ p: '../evil.js', size: 1, sha: P.sha256(Buffer.from('x')) }] })), len = Buffer.alloc(4); len.writeUInt32BE(head2.length);
  assert.throws(() => P.unpack(zlib.gzipSync(Buffer.concat([Buffer.from('MQP1'), len, head2, Buffer.from('x')])), path.join(TMP, 'out3')), /غير مسموح/);
  assert.ok(!fs.existsSync(path.join(TMP, 'evil.js')));
  assert.throws(() => P.pack(app, '1.5'), /1\.0\.5/);
});

test('الإقلاع: التحديث المنتظر يُطبَّق، والإصدار الذي يتعطّل مرتين يُرجَع عنه ولا يُعرض ثانية', () => {
  const dir = path.join(TMP, 'updates');
  fakeApp(path.join(dir, '1.0.5'), 'a'); fakeApp(path.join(dir, '1.0.6'), 'b');
  assert.equal(U.select(dir, '1.0.4'), null, 'لا شيء منتظر: الشيفرة المشحونة');
  fs.writeFileSync(path.join(dir, 'state.json'), JSON.stringify({ pending: '1.0.5' }));
  let r = U.select(dir, '1.0.4'); assert.equal(r.version, '1.0.5');
  assert.deepEqual(U.confirm(dir), { justUpdated: '1.0.5', reverted: null });
  r = U.select(dir, '1.0.4'); assert.equal(r.version, '1.0.5'); U.confirm(dir);
  // 1.0.6 منتظر لكنه يتعطّل قبل أن يعمل خادمه
  const s = U.read(dir); s.pending = '1.0.6'; fs.writeFileSync(path.join(dir, 'state.json'), JSON.stringify(s));
  assert.equal(U.select(dir, '1.0.4').version, '1.0.6'); // محاولة 1 (لا confirm)
  assert.equal(U.select(dir, '1.0.4').version, '1.0.6'); // محاولة 2
  r = U.select(dir, '1.0.4'); assert.equal(r.version, '1.0.5', 'رجوع للسابق');
  assert.equal(U.confirm(dir).reverted, '1.0.6');
  assert.ok(U.read(dir).bad.includes('1.0.6'));
  // فشل صريح (تعذّر تشغيل الخادم): رجوع في التشغيل التالي
  U.fail(dir); r = U.select(dir, '1.0.4'); assert.equal(r, null, 'لا سابق لـ1.0.5: الشيفرة المشحونة');
  // مثبّت أحدث من التحديث المنزّل: يعمل المثبّت
  const s2 = U.read(dir); s2.current = '1.0.6'; s2.bad = []; s2.tries = 0; fs.writeFileSync(path.join(dir, 'state.json'), JSON.stringify(s2));
  assert.equal(U.select(dir, '1.1.0'), null);
});

test('المحدِّث: يفحص برمز الترخيص، ويرفض التوقيع أو الملف المغشوش، وينزّل ويجهّز للتطبيق', async () => {
  const dir = path.join(TMP, 'upd2'), pk = P.pack(fakeApp(path.join(TMP, 'app2'), 'new'), '1.0.7');
  let meta = release(pk, '1.0.7', { notes: 'جديد' }), body = pk.buf; const seen = [];
  const F = async (url, o) => { seen.push({ url, auth: o.headers.authorization });
    if (url.includes('/updates/check')) return new Response(JSON.stringify({ update: true, ...meta, url: '/updates/file/1.0.7' }), { status: 200 });
    return new Response(body, { status: 200 }) };
  const mk = tok => U.create({ dir, current: '1.0.4', electron: 44, token: () => tok, gateway: 'https://u.test/', pub: PUB, fetchImpl: F });
  assert.equal((await mk('').run()).status, 'idle', 'بلا ترخيص لا فحص'); assert.equal(seen.length, 0);
  // توقيع مغشوش
  meta = { ...release(pk, '1.0.7'), sig: release(pk, '1.0.8').sig };
  let s = await mk('mqgw:X:Y').run(); assert.equal(s.status, 'error'); assert.match(s.error, /توقيع/);
  // ملف مختلف عن بصمته
  meta = release(pk, '1.0.7'); body = Buffer.concat([pk.buf, Buffer.from('x')]);
  s = await mk('mqgw:X:Y').run(); assert.equal(s.status, 'error'); assert.match(s.error, /بصمته/);
  assert.equal(U.read(dir).pending, undefined);
  // سليم
  body = pk.buf; s = await mk('mqgw:X:Y').run();
  assert.equal(s.status, 'ready'); assert.equal(s.pending, '1.0.7');
  assert.equal(seen.at(-1).url, 'https://u.test/updates/file/1.0.7'); assert.equal(seen.at(-1).auth, 'Bearer mqgw:X:Y');
  assert.match(seen.at(-2).url, /\/updates\/check\?v=1\.0\.4&e=44$/);
  assert.equal(U.select(dir, '1.0.4').version, '1.0.7');
  // يتطلب Electron أحدث: لا يُنزَّل، يُطلب مثبّت
  meta = release(pk, '1.0.9', { min_electron: 50 });
  assert.equal((await U.create({ dir, current: '1.0.7', electron: 44, token: () => 't', gateway: 'https://u.test', pub: PUB, fetchImpl: F }).run()).status, 'installer');
});

/* D1 وR2 وهميّان */
function d1() {
  const db = new DatabaseSync(':memory:');
  for (const f of ['0002_ai_gateway.sql', '0003_updates.sql']) db.exec(fs.readFileSync(path.join(CLOUD, 'schema', f), 'utf8'));
  return { raw: db, prepare: q => { const st = db.prepare(q); return { all: async () => ({ results: st.all() }), first: async () => st.get() || null, bind: (...a) => ({ first: async () => st.get(...a) || null, run: async () => st.run(...a), all: async () => ({ results: st.all(...a) }) }) } } };
}
function r2() {
  const m = new Map();
  return { m, async put(k, body, o) { const b = Buffer.from(await new Response(body).arrayBuffer()); if (o && o.sha256 && P.sha256(b) !== o.sha256) throw new Error('sha'); m.set(k, b); return { size: b.length } },
    async get(k, o) { const b = m.get(k); if (!b) return null; let off = 0, len = b.length; if (o && o.range) { const x = /bytes=(\d+)-(\d*)/.exec(o.range.get('range')); off = +x[1]; len = (x[2] ? +x[2] : b.length - 1) - off + 1 } return { size: b.length, range: o && o.range ? { offset: off, length: len } : undefined, body: b.subarray(off, off + len) } } };
}

test('خادم التحديثات: الترخيص، والطرح التدريجي، ومكاتب التجربة، والإيقاف، وحماية الملف', { skip: !CLOUD && 'مجلد السحابة غير موجود' }, async () => {
  const S = await import(pathToFileURL(path.join(CLOUD, 'src', 'updates.js')).href);
  const env = { LICENSE_PUB: PUB, DB: d1(), MEDIA: r2() };
  const FP = 'ABCD-EFGH-JKLM-NPQR-STUV';
  const tok = (o = {}) => 'mqgw:' + FP + ':' + L.sign({ v: 2, fp: FP, slug: 'najah-law', edition: 'connected', exp: '2099-01-01', ai: 0, id: 'aa11bb22', ...o }, PRIV);
  const get = (p, t = tok(), h = {}) => S.handle(new Request('https://misbar.palgaz.net' + p, { headers: { authorization: 'Bearer ' + t, ...h } }), env, new URL('https://x' + p).pathname);
  const op = (p, b, m = 'POST') => S.ops(new Request('https://x' + p, { method: m, body: b == null ? undefined : Buffer.isBuffer(b) ? b : JSON.stringify(b) }), env, p);

  const pk = P.pack(fakeApp(path.join(TMP, 'app3'), 'c'), '1.0.5'), meta = release(pk, '1.0.5');
  assert.equal((await op('/_ops/updates/upload/1.0.5', pk.buf, 'PUT')).status, 400, 'يُسجَّل قبل الرفع');
  await op('/_ops/updates/release', { ...meta, notes: 'n' });
  assert.equal((await op('/_ops/updates/upload/1.0.5', pk.buf, 'PUT')).status, 200);
  // الترخيص: بلا رمز، منتهٍ، مُبطل
  assert.equal((await get('/updates/check?v=1.0.4', 'sk-x')).status, 401);
  assert.equal((await get('/updates/check?v=1.0.4', tok({ exp: '2020-01-01' }))).status, 401);
  // متوقف: لا يُعرض
  let j = await (await get('/updates/check?v=1.0.4&e=44')).json(); assert.equal(j.update, false);
  assert.equal((await get('/updates/file/1.0.5')).status, 404);
  // يُطرح بنسبة 0%: لا يصل؛ 100%: يصل
  await op('/_ops/updates/release', { version: '1.0.5', status: 'active', rollout: 0 });
  assert.equal((await (await get('/updates/check?v=1.0.4')).json()).update, false);
  assert.equal((await get('/updates/file/1.0.5')).status, 403, 'لا ينزّل ما لم يُعرض عليه');
  // مكتب تجربة يستلم أولاً
  await op('/_ops/updates/office', { slug: 'najah-law', channel: 'beta' });
  j = await (await get('/updates/check?v=1.0.4&e=44')).json(); assert.equal(j.update, true); assert.equal(j.version, '1.0.5');
  assert.ok(P.verifyRelease(j, PUB), 'التوقيع يصل كما هو');
  // التنزيل كاملاً وجزئياً
  let r = await get('/updates/file/1.0.5'); assert.equal(r.status, 200); const got = Buffer.from(await r.arrayBuffer()); assert.equal(P.sha256(got), meta.sha256);
  r = await get('/updates/file/1.0.5', tok(), { range: 'bytes=10-19' }); assert.equal(r.status, 206); assert.equal(r.headers.get('content-range'), `bytes 10-19/${pk.size}`); assert.equal(Buffer.from(await r.arrayBuffer()).length, 10);
  // الإيقاف لمكتب
  await op('/_ops/updates/office', { slug: 'najah-law', channel: 'beta', hold: 1 });
  assert.equal((await (await get('/updates/check?v=1.0.4')).json()).update, false);
  await op('/_ops/updates/office', { slug: 'najah-law', channel: 'stable', hold: 0 });
  await op('/_ops/updates/release', { version: '1.0.5', rollout: 100 });
  assert.equal((await (await get('/updates/check?v=1.0.4')).json()).update, true);
  assert.equal((await (await get('/updates/check?v=1.0.5')).json()).update, false, 'محدَّث');
  // الطرح التدريجي ثابت لكل مكتب ويقارب النسبة
  const bs = await Promise.all(Array.from({ length: 400 }, (_, i) => S.bucket('office-' + i, '1.0.5')));
  const in25 = bs.filter(b => b < 25).length; assert.ok(in25 > 60 && in25 < 140, 'قرابة الربع: ' + in25);
  assert.equal(await S.bucket('najah-law', '1.0.5'), await S.bucket('najah-law', '1.0.5'));
  // إبطال الترخيص يوقف التحديثات
  env.DB.raw.exec("INSERT INTO ai_revoked(id, at) VALUES('aa11bb22', 'now')");
  assert.equal((await get('/updates/check?v=1.0.4')).status, 401);
  const seen = await (await op('/_ops/updates/offices', null, 'GET')).json();
  assert.equal(seen.seen[0].slug, 'najah-law'); assert.equal(seen.seen[0].downloaded, '1.0.5');
});

test('برنامج المورّد: حزم الإصدار وتوقيعه ورفعه متوقفاً، ثم الطرح', async () => {
  const DIR = path.join(TMP, 'act');
  require('child_process').execFileSync(process.execPath, [path.join(OFF, 'tools', 'activator.js'), 'init', '--dir', DIR], { stdio: 'pipe' });
  process.env.MQ_VENDOR_DIR = DIR; process.env.MQ_OPS_TOKEN = 't';
  delete require.cache[require.resolve('../tools/vendor/vendor.js')];
  const Vm = require('../tools/vendor/vendor.js'), V = Vm.create(Vm.open());
  const calls = [];
  const F = async (url, o) => { calls.push({ url, method: o.method, ct: o.headers['content-type'], body: o.body }); return new Response(JSON.stringify({ ok: true }), { status: 200 }) };
  const app = fakeApp(path.join(TMP, 'app4'), 'd');
  await assert.rejects(V.publish({ version: '1.0', appDir: app }, F), /1\.0\.5/);
  const r = await V.publish({ version: '1.0.5', appDir: app, notes: 'تحسينات' }, F);
  assert.equal(r.status, 'paused');
  const reg = JSON.parse(calls[0].body); assert.match(calls[0].url, /\/_ops\/updates\/release$/); assert.equal(reg.status, 'paused'); assert.equal(reg.rollout, 0);
  assert.ok(P.verifyRelease(reg, fs.readFileSync(path.join(DIR, 'license.pub'), 'utf8')), 'موقّع بمفتاح المورّد');
  assert.equal(calls[1].method, 'PUT'); assert.equal(calls[1].ct, 'application/octet-stream'); assert.equal(P.sha256(calls[1].body), reg.sha256);
  await assert.rejects(V.publish({ version: '1.0.5', appDir: app }, F), /أكبر/);
  await V.releaseSet('1.0.5', { status: 'active', rollout: 25 }, F);
  assert.deepEqual(JSON.parse(calls.at(-1).body), { version: '1.0.5', status: 'active', rollout: 25 });
  V.db.close();
});
