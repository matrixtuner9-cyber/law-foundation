// التفعيل عبر الإنترنت: حساب المكتب وكلمة المرور، حد الأجهزة، القفل بعد المحاولات الخاطئة، التجديد والإبطال التلقائيان،
// وشاشة التفعيل في خادم المكتب (من أول تشغيل حتى فتح النظام)
'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto'), http = require('http'), { spawn } = require('child_process'), { pathToFileURL } = require('url');
const { DatabaseSync } = require('node:sqlite');
const L = require('../lib/license');
const OFF = path.join(__dirname, '..');
const CLOUD = [path.join(OFF, '..', 'cloud'), path.join(OFF, '..', 'cloud-deploy')].find(d => fs.existsSync(path.join(d, 'src', 'activation.js')));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mq-act-'));
test.after(() => fs.rmSync(TMP, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }));

const kp = () => { const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519'); return { pub: publicKey.export({ type: 'spki', format: 'pem' }), priv: privateKey.export({ type: 'pkcs8', format: 'pem' }) } };
const VENDOR = kp(), ACT = kp();
function d1() {
  const db = new DatabaseSync(':memory:');
  for (const f of ['0002_ai_gateway.sql', '0004_activation.sql']) db.exec(fs.readFileSync(path.join(CLOUD, 'schema', f), 'utf8'));
  return { raw: db, prepare: q => { const st = db.prepare(q); return { all: async () => ({ results: st.all() }), first: async () => st.get() || null, bind: (...a) => ({ first: async () => st.get(...a) || null, run: async () => st.run(...a), all: async () => ({ results: st.all(...a) }) }) } } };
}
const ENV = () => ({ DB: d1(), ACT_PRIV: ACT.priv, ACTIVATION_PUB: ACT.pub, LICENSE_PUB: VENDOR.pub });
const FP1 = 'ABCD-EFGH-JKLM-NPQR-STUV', FP2 = 'ZZZZ-YYYY-XXXX-WWWW-VVVV';
const PUBS = [VENDOR.pub, ACT.pub];

test('خادم التفعيل: كلمة المرور، القفل، حد الأجهزة، التجديد، الإبطال', { skip: !CLOUD && 'مجلد السحابة غير موجود' }, async () => {
  const A = await import(pathToFileURL(path.join(CLOUD, 'src', 'activation.js')).href);
  const G = await import(pathToFileURL(path.join(CLOUD, 'src', 'ai-gateway.js')).href);
  const env = ENV();
  const op = (p, b, m = 'POST') => A.ops(new Request('https://x' + p, { method: m, body: m === 'GET' ? undefined : JSON.stringify(b) }), env, p.split('?')[0]).then(r => r.json());
  const act = (b, ip = '1.1.1.1') => A.handle(new Request('https://misbar.palgaz.net/activate', { method: 'POST', headers: { 'cf-connecting-ip': ip }, body: JSON.stringify(b) }), env, '/activate');
  const refresh = code => A.handle(new Request('https://misbar.palgaz.net/activate/refresh', { method: 'POST', headers: { authorization: 'Bearer mqgw:' + L.verify(code, { fp: L.verify(code, { pub: PUBS, fp: FP1 }).ok ? FP1 : FP2, pub: PUBS }).payload.fp + ':' + code }, body: '{}' }), env, '/activate/refresh').then(r => r.json());

  await op('/_ops/act/account', { slug: 'najah-law', name: 'مكتب النجاح', password: 'K7MP-3QXR-9TWD', seats: 1, users: 3, exp: '2030-12-31', ai: 1500000 });
  // كلمة مرور خاطئة، ثم صحيحة بأحرف صغيرة ومسافات (تُطبَّع)
  let r = await act({ slug: 'najah-law', password: 'WRONG-PASS-1234', fp: FP1 }); assert.equal(r.status, 401);
  r = await act({ slug: 'nobody-here', password: 'K7MP-3QXR-9TWD', fp: FP1 }); assert.equal(r.status, 401, 'مكتب غير موجود: نفس الرسالة');
  r = await act({ slug: 'najah-law', password: 'k7mp 3qxr 9twd', fp: FP1, device: 'الجهاز الرئيسي', version: '1.0.6' });
  assert.equal(r.status, 200); const j = await r.json();
  const v = L.verify(j.code, { fp: FP1, pub: PUBS }); assert.equal(v.ok, true);
  assert.equal(v.payload.slug, 'najah-law'); assert.equal(v.payload.exp, '2030-12-31'); assert.equal(v.payload.users, 3); assert.equal(v.payload.ai, 1500000); assert.equal(v.payload.src, 'online');
  assert.equal(L.verify(j.code, { fp: FP1, pub: VENDOR.pub }).ok, false, 'موقّع بمفتاح التفعيل لا بمفتاح المورّد');
  // يعمل مع عقل المسبار (الخادم الوسيط يقبل المفتاحين)
  assert.equal((await G.verifyLicense(j.code, FP1, VENDOR.pub + '\n' + ACT.pub)).ok, true);
  // نفس الجهاز مرة أخرى: مسموح؛ جهاز ثانٍ: تجاوز الحد
  assert.equal((await act({ slug: 'najah-law', password: 'K7MP3QXR9TWD', fp: FP1 })).status, 200);
  r = await act({ slug: 'najah-law', password: 'K7MP3QXR9TWD', fp: FP2 }); assert.equal(r.status, 409); assert.match((await r.json()).error.message, /الحد المسموح/);
  // التجديد: بلا تغيير لا كود جديد؛ تمديد من المورّد يصل تلقائياً
  assert.deepEqual(await refresh(j.code), { status: 'active' });
  await op('/_ops/act/account', { slug: 'najah-law', exp: '2032-06-30' });
  const rf = await refresh(j.code); assert.equal(rf.status, 'active'); assert.equal(L.verify(rf.code, { fp: FP1, pub: PUBS }).payload.exp, '2032-06-30');
  // ترخيص منتهٍ يتجدد أيضاً (التجديد لا يشترط صلاحية التاريخ)
  const old = L.verify(j.code, { fp: FP1, pub: PUBS }).payload;
  const expired = L.sign({ ...old, exp: '2020-01-01' }, ACT.priv);
  assert.equal(L.verify(expired, { fp: FP1, pub: PUBS }).ok, false);
  assert.ok((await refresh(expired)).code, 'يستلم ترخيصاً ساري');
  // إلغاء تفعيل الجهاز: التجديد يُبلغ بالإبطال، وعقل المسبار يرفضه، والمقعد يتحرر
  const dev = (await op('/_ops/act/account?slug=najah-law', null, 'GET')).devices[0];
  assert.equal(dev.device, 'الجهاز الرئيسي'); assert.equal(dev.version, '1.0.6');
  await op('/_ops/act/device', { id: dev.id, status: 'revoked' });
  assert.equal((await refresh(j.code)).status, 'revoked');
  assert.equal((await act({ slug: 'najah-law', password: 'K7MP3QXR9TWD', fp: FP1 })).status, 403, 'الجهاز المُلغى لا يعيد التفعيل بنفسه');
  assert.equal((await act({ slug: 'najah-law', password: 'K7MP3QXR9TWD', fp: FP2 })).status, 200, 'المقعد تحرر لجهاز جديد');
  // كلمة مرور جديدة توقف القديمة
  await op('/_ops/act/account', { slug: 'najah-law', password: 'NEWP-ASSW-ORD2' });
  assert.equal((await act({ slug: 'najah-law', password: 'K7MP3QXR9TWD', fp: FP2 })).status, 401);
  // القفل بعد 8 محاولات خاطئة
  for (let i = 0; i < 8; i++) await act({ slug: 'najah-law', password: 'bad-bad-bad', fp: FP2 });
  r = await act({ slug: 'najah-law', password: 'NEWP-ASSW-ORD2', fp: FP2 }); assert.equal(r.status, 429);
  // حساب موقوف
  env.DB.raw.exec("UPDATE act_accounts SET locked_until = 0, status = 'suspended'");
  assert.equal((await act({ slug: 'najah-law', password: 'NEWP-ASSW-ORD2', fp: FP2 })).status, 403);
});

/* خادم تفعيل وهمي محلي يمرّر الطلبات إلى activation.js نفسه */
async function fakeCloud(env, A) {
  const srv = http.createServer(async (req, res) => {
    let b = ''; for await (const c of req) b += c;
    const r = await A.handle(new Request('https://misbar.palgaz.net' + req.url, { method: req.method, headers: req.headers, body: req.method === 'POST' ? b : undefined }), env, req.url);
    res.writeHead(r.status, { 'content-type': 'application/json' }); res.end(await r.text());
  });
  await new Promise(ok => srv.listen(0, '127.0.0.1', ok)); return srv;
}

test('شاشة التفعيل في نسخة المكتب: مغلقة حتى التفعيل باسم المكتب وكلمة المرور، ثم تُبطَل من المورّد', { skip: !CLOUD && 'مجلد السحابة غير موجود' }, async () => {
  const A = await import(pathToFileURL(path.join(CLOUD, 'src', 'activation.js')).href);
  const env = ENV(); const cloud = await fakeCloud(env, A);
  await A.ops(new Request('https://x/_ops/act/account', { method: 'POST', body: JSON.stringify({ slug: 'test-office', name: 'مكتب الاختبار', password: 'AAAA-BBBB-CCCC', exp: '2031-01-01' }) }), env, '/_ops/act/account');
  const PORT = 19900 + Math.floor(Math.random() * 90), BASE = `http://127.0.0.1:${PORT}`, DATA = path.join(TMP, 'office');
  const srv = spawn(process.execPath, ['server.js'], { cwd: OFF, env: { ...process.env, PORT: String(PORT), MQ_DATA: DATA, MQ_BACKUP: 'off', MQ_BACKUP_DIR: path.join(TMP, 'bk'), MQ_LICENSE: '1', MQ_LICENSE_PUB: VENDOR.pub, MQ_ACTIVATION_PUB: ACT.pub, MQ_ACTIVATION_SERVER: 'http://127.0.0.1:' + cloud.address().port }, stdio: ['ignore', 'pipe', 'pipe'] });
  srv.stderr.on('data', d => process.stderr.write('[srv] ' + d));
  try {
    for (let i = 0; i < 60; i++) { try { await fetch(BASE + '/api/license/status'); break } catch (e) {} await new Promise(r => setTimeout(r, 200)) }
    let r = await fetch(BASE + '/', { redirect: 'manual' }); assert.equal(r.status, 302); assert.equal(r.headers.get('location'), '/activate');
    const page = await (await fetch(BASE + '/activate')).text(); assert.match(page, /معرّف المكتب/); assert.match(page, /كلمة مرور التفعيل/);
    assert.equal((await fetch(BASE + '/api/auth/me')).status, 403, 'لا شيء قبل التفعيل');
    const st = await (await fetch(BASE + '/api/license/status')).json(); assert.equal(st.ok, false); assert.match(st.fp, /^[A-Z2-9]{4}(-[A-Z2-9]{4}){4}$/);
    const post = b => fetch(BASE + '/api/license/online', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }).then(async r => ({ s: r.status, j: await r.json() }));
    let x = await post({ slug: 'test-office', password: 'WRONG-WRONG' }); assert.equal(x.s, 400); assert.match(x.j.error, /غير صحيحة/);
    x = await post({ slug: 'test-office', password: 'aaaa-bbbb-cccc', device: 'جهاز الاختبار' }); assert.equal(x.s, 200, JSON.stringify(x.j)); assert.equal(x.j.office, 'مكتب الاختبار'); assert.equal(x.j.exp, '2031-01-01');
    assert.ok(fs.existsSync(path.join(DATA, 'license.key')));
    assert.notEqual((await fetch(BASE + '/api/auth/me')).status, 403, 'فُتح النظام');
    // التجديد الدوري يطبّق الإبطال (نستدعيه مباشرة بنفس المكتبة)
    const dev = (await (await A.ops(new Request('https://x/_ops/act/account?slug=test-office'), env, '/_ops/act/account')).json()).devices[0];
    assert.equal(dev.device, 'جهاز الاختبار');
    await A.ops(new Request('https://x/_ops/act/device', { method: 'POST', body: JSON.stringify({ id: dev.id, status: 'revoked' }) }), env, '/_ops/act/device');
    process.env.MQ_ACTIVATION_SERVER = 'http://127.0.0.1:' + cloud.address().port;
    const lic = L.createLicense({ dataDir: DATA, pub: PUBS }), Act = require('../lib/activation').create({ license: lic });
    assert.equal((await Act.refresh()).status, 'revoked');
    assert.ok(!fs.existsSync(path.join(DATA, 'license.key')) && fs.existsSync(path.join(DATA, 'license.revoked')));
    // (خادم المكتب يطبّقه بنفسه في فحصه الدوري؛ هنا نتحقق من أثره على الملفات والملاحظة)
    assert.match(lic.note(), /أُبطل|أُلغي/);
  } finally { srv.kill(); cloud.close(); delete process.env.MQ_ACTIVATION_SERVER }
});
