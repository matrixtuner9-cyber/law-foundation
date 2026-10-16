// «ميثاق خاص»: قاطع الاتصال الخارجي، اكتشاف النسخة، والخادم في الوضع الخاص (لا بوابة ولا بحث خارجي ولا استماع إلا للجهاز نفسه)
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), net = require('node:net');
const Edition = require('../lib/edition'), Egress = require('../lib/egress');

test('النسخة: متصلة افتراضياً، وخاصة بـ MQ_EDITION أو MQ_OFFLINE أو ملف edition.json', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mq-ed-'));
  assert.equal(Edition.detect({}, dir), 'connected');
  assert.equal(Edition.detect({ MQ_EDITION: 'private' }, dir), 'private');
  assert.equal(Edition.detect({ MQ_OFFLINE: '1' }, dir), 'private');
  fs.writeFileSync(path.join(dir, 'edition.json'), '{"edition":"private"}');
  assert.equal(Edition.detect({}, dir), 'private');
  assert.equal(Edition.detect({ MQ_EDITION: 'connected' }, dir), 'connected', 'الفرض بالمتغير يغلب الملف');
  const p = Edition.load({}, dir); assert.equal(p.name, 'ميثاق خاص'); assert.equal(p.offline, true);
  assert.ok(Object.values(p.features).every(v => v === false));
  assert.ok(Object.values(Edition.load({}, os.tmpdir()).features).every(v => v === true));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('isLoopback: الجهاز نفسه فقط', () => {
  for (const h of ['localhost', '127.0.0.1', '127.5.5.5', '::1', '[::1]', '::ffff:127.0.0.1', 'app.localhost']) assert.equal(Egress.isLoopback(h), true, h);
  for (const h of ['example.com', '8.8.8.8', '192.168.1.11', '10.0.0.1', '::ffff:8.8.8.8', 'localhost.evil.com', '127.0.0.1.nip.io', '0.0.0.0']) assert.equal(Egress.isLoopback(h), false, h);
});

test('القاطع يمنع fetch وhttps وDNS والمقابس وUDP للخارج، ويسمح بالجهاز نفسه', async () => {
  const log = []; const g = Egress.install({ onBlock: x => log.push(x.what) });
  try {
    await assert.rejects(fetch('https://example.com/'), e => e.code === 'MQ_OFFLINE');
    await new Promise(r => require('https').get('https://example.com/', () => r()).on('error', e => { assert.equal(e.code, 'MQ_OFFLINE'); r() }));
    await new Promise(r => require('dns').lookup('example.com', e => { assert.ok(e); r() }));
    await assert.rejects(require('dns').promises.lookup('example.com'));
    await new Promise(r => net.connect(443, '93.184.216.34').on('error', e => { assert.equal(e.code, 'MQ_OFFLINE'); r() }));
    await new Promise(r => { const u = require('dgram').createSocket('udp4'); u.send(Buffer.from('x'), 53, '8.8.8.8', e => { assert.equal(e.code, 'MQ_OFFLINE'); u.close(); r() }) });
    const srv = require('http').createServer((q, s) => s.end('ok')); await new Promise(r => srv.listen(0, '127.0.0.1', r));
    assert.equal(await (await fetch(`http://127.0.0.1:${srv.address().port}/`)).text(), 'ok');
    assert.equal(await (await fetch(`http://localhost:${srv.address().port}/`)).text(), 'ok');
    srv.close();
    assert.deepEqual([...new Set(log)].sort(), ['dns', 'fetch', 'tcp', 'udp']);
  } finally { g.restore() }
});

const ROOT = path.resolve(__dirname, '..');
async function boot(env) {
  const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mq-pv-')), PORT = 21000 + Math.floor(Math.random() * 1000), B = `http://127.0.0.1:${PORT}`;
  const srv = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), MQ_DATA: path.join(TMP, 'data'), MQ_BACKUP: 'off', ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = ''; srv.stdout.on('data', d => out += d);
  for (let i = 0; i < 60; i++) { try { if ((await fetch(B + '/api/health')).ok) break } catch (e) {} await new Promise(r => setTimeout(r, 200)) }
  const s = await fetch(B + '/api/auth/setup', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'admin', name: 'مدير', password: 'Test12345' }) });
  const cookie = (s.headers.get('set-cookie') || '').split(';')[0];
  const req = (p, o = {}) => fetch(B + p, { ...o, headers: { cookie, 'content-type': 'application/json', ...(o.headers || {}) } });
  const stop = async () => { if (srv.exitCode === null) { const g = new Promise(r => srv.once('exit', r)); srv.kill(); await g } try { fs.rmSync(TMP, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch (e) {} };
  return { B, PORT, req, stop, out: () => out };
}
const lanIp = () => Object.values(os.networkInterfaces()).flat().find(i => i && i.family === 'IPv4' && !i.internal)?.address;

test('الخادم في «ميثاق خاص»: الإصدار، رفض كل ما يحتاج الإنترنت، الخطوط محلية، ولا استماع إلا لـ 127.0.0.1', async () => {
  const S = await boot({ MQ_EDITION: 'private' });
  try {
    const ed = await (await S.req('/api/edition')).json(); assert.equal(ed.id, 'private'); assert.equal(ed.offline, true);
    assert.equal((await (await S.req('/api/auth/status')).json()).edition.name, 'ميثاق خاص');
    assert.equal((await (await S.req('/api/admin/bootstrap')).json()).edition.id, 'private');
    for (const [p, m] of [['/api/portal/login', 'POST'], ['/api/portal/push-key', 'GET'], ['/api/admin/maqam/search?q=x', 'GET'], ['/api/admin/ruling-import', 'POST'], ['/api/mizan/run', 'POST'], ['/api/mizan/credentials', 'POST'], ['/api/bar/refresh', 'POST']]) {
      const r = await S.req(p, { method: m, body: m === 'POST' ? '{}' : undefined }); assert.equal(r.status, 403, p); assert.equal((await r.json()).offline, true, p);
    }
    assert.equal((await S.req('/api/mizan/status')).status, 200, 'حالة ميزان المحلية تبقى للقراءة');
    assert.equal((await S.req('/portal/')).status, 404); assert.equal((await S.req('/p/MQ-ABC123')).status, 404);
    const f = await fetch(S.B + '/fonts/fonts.css'); assert.equal(f.status, 200); assert.ok(!(await f.text()).includes('googleapis'));
    assert.equal((await fetch(S.B + '/fonts/cairo-arabic.woff2')).headers.get('content-type'), 'font/woff2');
    assert.equal((await fetch(S.B + '/fonts/../server.js')).status, 404);
    const idx = await (await S.req('/')).text(); assert.ok(!/fonts\.googleapis|fonts\.gstatic/.test(idx)); assert.ok(idx.includes('edition.js'));
    assert.equal((await fetch(S.B + '/edition.js')).status, 200, 'edition.js عام لصفحة الدخول');
    const ip = lanIp();
    if (ip) await new Promise((res, rej) => { const c = net.connect(S.PORT, ip); c.on('connect', () => { c.destroy(); rej(new Error('الخادم الخاص يقبل اتصالاً من الشبكة: ' + ip)) }); c.on('error', () => res()) });
    assert.match(S.out(), /ميثاق خاص/);
  } finally { await S.stop() }
});

test('الخادم في «ميثاق متصل»: لم يتغير شيء (البوابة والإشعارات تعمل)', async () => {
  const S = await boot({ MQ_EDITION: 'connected' });
  try {
    assert.equal((await (await S.req('/api/edition')).json()).id, 'connected');
    assert.equal((await S.req('/api/portal/push-key')).status, 200);
    assert.notEqual((await S.req('/api/portal/login', { method: 'POST', body: '{}' })).status, 403);
    assert.equal((await S.req('/api/admin/maqam/judgment?id=abc')).status, 400);
    const ip = lanIp();
    if (ip) await new Promise((res, rej) => { const c = net.connect(S.PORT, ip); c.on('connect', () => { c.destroy(); res() }); c.on('error', rej) });
  } finally { await S.stop() }
});
