// التفعيل: البصمة، التوقيع والتحقق، الربط بالجهاز، الانتهاء، والخادم المقفل كلياً قبل التفعيل
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), crypto = require('node:crypto');
const L = require('../lib/license');
const ROOT = path.join(__dirname, '..');
const keys = () => { const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519'); return { pub: publicKey.export({ type: 'spki', format: 'pem' }), priv: privateKey.export({ type: 'pkcs8', format: 'pem' }) } };

test('البصمة: ثابتة لنفس الجهاز، تتغير بتغير المعرّف، وتتجاهل الكروت الافتراضية وترتيبها', () => {
  const a = L.fingerprint({ id: 'guid-1', mac: ['aa:bb:cc:dd:ee:01'] });
  assert.match(a, /^[A-Z2-9]{4}(-[A-Z2-9]{4}){4}$/);
  assert.equal(a, L.fingerprint({ id: 'guid-1', mac: ['aa:bb:cc:dd:ee:01'] }));
  assert.notEqual(a, L.fingerprint({ id: 'guid-2', mac: ['aa:bb:cc:dd:ee:01'] }));
  assert.deepEqual(L.macs({ 'vEthernet (WSL)': [{ mac: '00:15:5d:00:00:01' }], Ethernet: [{ mac: 'AA:BB:CC:00:00:02' }], 'Wi-Fi': [{ mac: 'aa:bb:cc:00:00:01' }], lo: [{ mac: '00:00:00:00:00:00', internal: true }] }), ['aa:bb:cc:00:00:01', 'aa:bb:cc:00:00:02']);
  assert.equal(typeof L.fingerprint(), 'string', 'تعمل على الجهاز الحقيقي');
});

test('الكود: صحيح لنفس البصمة فقط، والتلاعب والمفتاح الآخر والانتهاء مرفوضة', () => {
  const k = keys(), fp = 'ABCD-EFGH-JKLM-NPQR-STUV';
  const code = L.sign({ v: 1, fp, office: 'مكتب الاختبار', edition: 'private', users: 3, exp: '2030-01-01' }, k.priv);
  assert.match(code, /^MQ1\./);
  const ok = L.verify(code, { fp: 'abcdefghjklmnpqrstuv', pub: k.pub }); assert.equal(ok.ok, true); assert.equal(ok.payload.office, 'مكتب الاختبار');
  assert.equal(L.verify(code, { fp: 'ABCD-EFGH-JKLM-NPQR-STUW', pub: k.pub }).ok, false, 'جهاز آخر');
  assert.equal(L.verify(code, { fp, pub: keys().pub }).ok, false, 'مفتاح آخر');
  const parts = code.split('.'); const forged = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64')); forged.users = 500;
  const t = 'MQ1.' + Buffer.from(JSON.stringify(forged)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') + '.' + parts[2];
  assert.equal(L.verify(t, { fp, pub: k.pub }).ok, false, 'تعديل الحمولة يُبطل التوقيع');
  const ex = L.verify(code, { fp, pub: k.pub, now: new Date('2031-01-01') }); assert.equal(ex.ok, false); assert.equal(ex.expired, true);
  assert.equal(L.verify('xyz', { fp, pub: k.pub }).ok, false);
  assert.equal(L.verify(code, { fp, pub: '' }).ok, false, 'نسخة بلا مفتاح تحقق لا تقبل شيئاً');
});

test('createLicense: يحفظ الكود الصحيح فقط، والحالة بعد التفعيل', () => {
  const k = keys(), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mq-lic-')), fp = 'AAAA-BBBB-CCCC-DDDD-EEEE';
  const lic = L.createLicense({ dataDir: dir, pub: k.pub, fp });
  assert.equal(lic.status().ok, false);
  assert.equal(lic.activate(L.sign({ fp: 'ZZZZ-BBBB-CCCC-DDDD-EEEE', office: 'x' }, k.priv)).ok, false); assert.ok(!fs.existsSync(lic.file));
  const r = lic.activate(L.sign({ fp, office: 'مكتب', edition: 'private', users: 2 }, k.priv)); assert.equal(r.ok, true); assert.equal(r.office, 'مكتب');
  assert.equal(L.createLicense({ dataDir: dir, pub: k.pub, fp }).status().ok, true, 'يبقى مفعّلاً بعد إعادة التشغيل');
  assert.equal(L.createLicense({ dataDir: dir, pub: k.pub, fp: 'QQQQ-BBBB-CCCC-DDDD-EEEE' }).status().ok, false, 'نسخ المجلد إلى جهاز آخر يقفله');
  assert.equal(L.createLicense({ dataDir: dir, enforce: false }).status().ok, true, 'النسخ غير الموزّعة لا تشترط التفعيل');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('المُفعِّل: init ثم issue يصدر كوداً صالحاً ويسجّله', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mq-act-')), tool = path.join(ROOT, 'tools', 'activator.js');
  execFileSync(process.execPath, [tool, 'init', '--dir', dir], { stdio: 'pipe' });
  const fp = L.fingerprint({ id: 'x', mac: [] });
  const code = execFileSync(process.execPath, [tool, 'issue', '--dir', dir, '--fp', fp, '--office', 'مكتب النجاح', '--users', '4', '--exp', '2040-01-01'], { encoding: 'utf8' }).trim();
  const v = L.verify(code, { fp, pub: fs.readFileSync(path.join(dir, 'license.pub'), 'utf8') }); assert.equal(v.ok, true); assert.equal(v.payload.users, 4);
  assert.match(fs.readFileSync(path.join(dir, 'issued.csv'), 'utf8'), /مكتب النجاح/);
  assert.throws(() => execFileSync(process.execPath, [tool, 'issue', '--dir', dir, '--fp', 'bad', '--office', 'x'], { stdio: 'pipe' }));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('الخادم المقفل: قبل التفعيل لا صفحة ولا API سوى التفعيل، وبعده يعمل', async () => {
  const k = keys(), TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mq-lsrv-')), PORT = 23000 + Math.floor(Math.random() * 1000), B = `http://127.0.0.1:${PORT}`;
  const srv = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), MQ_DATA: path.join(TMP, 'data'), MQ_BACKUP: 'off', MQ_LICENSE: '1', MQ_LICENSE_PUB: k.pub }, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    let st; for (let i = 0; i < 60; i++) { try { const r = await fetch(B + '/api/license/status'); if (r.ok) { st = await r.json(); break } } catch (e) {} await new Promise(r => setTimeout(r, 200)) }
    assert.equal(st.ok, false); assert.match(st.fp, /^[A-Z2-9]{4}(-[A-Z2-9]{4}){4}$/);
    const home = await fetch(B + '/', { redirect: 'manual' }); assert.equal(home.status, 302); assert.equal(home.headers.get('location'), '/activate');
    for (const p of ['/api/health', '/api/auth/status', '/api/admin/bootstrap', '/api/portal/login', '/login.html', '/app.js']) {
      const r = await fetch(B + p, { redirect: 'manual' }); assert.ok([302, 403].includes(r.status), p + ' ' + r.status);
    }
    assert.match(await (await fetch(B + '/activate')).text(), /تفعيل المِسْبار/); assert.equal((await fetch(B + '/misbar-banner.webp')).status, 200, 'الشعار يظهر قبل التفعيل');
    const bad = await fetch(B + '/api/license/activate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: L.sign({ fp: 'AAAA-AAAA-AAAA-AAAA-AAAA', office: 'x' }, k.priv) }) });
    assert.equal(bad.status, 400);
    const good = await fetch(B + '/api/license/activate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: L.sign({ fp: st.fp, office: 'مكتب', edition: 'private', users: 5 }, k.priv) }) });
    assert.equal(good.status, 200);
    assert.equal((await fetch(B + '/api/health')).status, 200, 'يعمل بعد التفعيل');
    assert.equal((await fetch(B + '/api/auth/status')).status, 200);
  } finally { if (srv.exitCode === null) { const g = new Promise(r => srv.once('exit', r)); srv.kill(); await g } fs.rmSync(TMP, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) }
});
