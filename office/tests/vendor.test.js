// «إدارة نسخ المسبار»: المكاتب، إصدار الترخيص والتحقق منه، التجديد والإبطال (مع السحابة)، المدفوعات والمستحق، النسخ الاحتياطي، وحماية الجلسة
'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const L = require('../lib/license');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mq-vendor-'));
const DIR = path.join(TMP, 'act'), USB = path.join(TMP, 'usb');
execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'activator.js'), 'init', '--dir', DIR], { stdio: 'pipe' });
process.env.MQ_VENDOR_DIR = DIR; process.env.MQ_OPS_TOKEN = 'test-ops-token';
const Vm = require('../tools/vendor/vendor.js');
const V = Vm.create(Vm.open());
const cloudCalls = [];
const fakeCloud = async (url, o) => { cloudCalls.push({ url, method: o.method, auth: o.headers.authorization, body: o.body && JSON.parse(o.body) });
  if (/\/_ops\/ai\/usage/.test(url)) return new Response(JSON.stringify([{ slug: 'najah-law', month: '2026-10', requests: 4, tokens_in: 900, tokens_out: 300 }]), { status: 200 });
  return new Response(JSON.stringify({ ok: true, url: 'https://najah-law.palgaz.net/login.html?setup=abc' }), { status: 200 }) };
let srv, BASE;
const FP = L.fingerprint({ id: 'vendor-test', mac: [] });

test.before(async () => { srv = await Vm.serve(V, { port: 0, fetchImpl: fakeCloud }); BASE = 'http://127.0.0.1:' + srv.address().port });
test.after(() => { srv && srv.close(); try { V.db.close() } catch (e) {} fs.rmSync(TMP, { recursive: true, force: true }) });
const call = (p, b, m, vk = Vm.KEY) => fetch(BASE + p, { method: m || (b ? 'POST' : 'GET'), headers: { 'x-vk': vk, 'content-type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }).then(async r => ({ s: r.status, j: await r.json().catch(() => ({})) }));

test('الحماية: بلا مفتاح الجلسة يُرفض، والصفحة تحمل المفتاح', async () => {
  assert.equal((await call('/api/summary', null, null, 'wrong')).s, 403);
  const html = await (await fetch(BASE + '/')).text(); assert.ok(html.includes(Vm.KEY));
});

test('مكتب جديد: المعرّف يُتحقق منه ولا يتكرر ولا يكون محجوزاً', async () => {
  assert.equal((await call('/api/offices', { name: 'مكتب', slug: 'AB' })).s, 400);
  assert.equal((await call('/api/offices', { name: 'مكتب', slug: 'misbar' })).s, 400, 'محجوز');
  const r = await call('/api/offices', { name: 'مكتب النجاح للمحاماة', slug: 'najah-law', phone: '0599111222', kind: 'both', price: 1200, currency: '₪', cycle: 'yearly' });
  assert.equal(r.s, 200); assert.equal(r.j.slug, 'najah-law');
  const u = await call('/api/offices', { slug: 'najah-law', name: 'مكتب النجاح', kind: 'both', price: 1200 }); assert.equal(u.j.name, 'مكتب النجاح', 'تعديل لا إنشاء');
  assert.equal((await call('/api/offices')).j.length, 1);
});

test('إصدار ترخيص: كود صالح للبصمة فيه المعرّف والرصيد، ويُرفض لبصمة خاطئة', async () => {
  assert.equal((await call('/api/licenses', { slug: 'najah-law', fp: 'bad' })).s, 400);
  const r = await call('/api/licenses', { slug: 'najah-law', fp: FP, device: 'الجهاز الرئيسي', edition: 'connected', users: 3, exp: '2030-01-01', ai: 1500000 });
  assert.equal(r.s, 200, JSON.stringify(r.j));
  const v = L.verify(r.j.code, { fp: FP, pub: fs.readFileSync(path.join(DIR, 'license.pub'), 'utf8') });
  assert.equal(v.ok, true); assert.equal(v.payload.slug, 'najah-law'); assert.equal(v.payload.ai, 1500000); assert.equal(v.payload.users, 3);
  const o = (await call('/api/offices/najah-law')).j; assert.equal(o.licenses.length, 1); assert.equal(o.licenses[0].state, 'active');
  const p = (await call('/api/licenses', { slug: 'najah-law', fp: FP, edition: 'private', ai: 999 })).j;
  assert.equal(L.verify(p.code, { fp: FP, pub: fs.readFileSync(path.join(DIR, 'license.pub'), 'utf8') }).payload.ai, 0, 'الخاصة بلا عقل المسبار');
});

test('التجديد يصدر كوداً جديداً ويبطل القديم، والإبطال يصل إلى السحابة', async () => {
  const o = (await call('/api/offices/najah-law')).j, old = o.licenses.find(l => l.edition === 'connected');
  const r = await call(`/api/licenses/${old.id}/renew`, { exp: '2031-06-30' }); assert.equal(r.s, 200);
  const o2 = (await call('/api/offices/najah-law')).j;
  assert.equal(o2.licenses.find(l => l.id === old.id).state, 'revoked');
  const nw = o2.licenses.find(l => l.id === r.j.id); assert.equal(nw.exp, '2031-06-30'); assert.equal(nw.ai, 1500000, 'يحتفظ بالرصيد'); assert.equal(nw.renewed_from, old.id);
  const rv = await call(`/api/licenses/${nw.id}/revoke`, {}); assert.equal(rv.j.cloud, 'ok');
  const c = cloudCalls.find(x => /\/_ops\/ai\/revoke$/.test(x.url)); assert.equal(c.body.id, nw.id); assert.equal(c.auth, 'Bearer test-ops-token');
});

test('المدفوعات والمستحق، واللوحة تعرض المستحقات', async () => {
  assert.equal((await call('/api/payments', { slug: 'najah-law', amount: -5 })).s, 400);
  await call('/api/payments', { slug: 'najah-law', amount: 500, currency: '₪', method: 'نقداً' });
  const o = (await call('/api/offices/najah-law')).j;
  assert.equal(o.balance.due, 1200); assert.equal(o.balance.paid, 500); assert.equal(o.balance.remaining, 700);
  const s = (await call('/api/summary')).j; assert.equal(s.owed[0].remaining, 700); assert.ok(s.backupDue, 'تذكير بالنسخ');
  const id = o.payments[0].id; await call('/api/payments/' + id, null, 'DELETE');
  assert.equal((await call('/api/offices/najah-law')).j.balance.paid, 0);
});

test('عقل المسبار والسحابة عبر لوحة المشغّل', async () => {
  const a = await call('/api/ai?month=2026-10'); assert.equal(a.s, 200); assert.equal(a.j.rows[0].name, 'مكتب النجاح');
  await call('/api/ai/office', { slug: 'najah-law', status: 'suspended', monthly_tokens: 0 });
  assert.ok(cloudCalls.some(x => /\/_ops\/ai\/office$/.test(x.url) && x.body.status === 'suspended'));
  const l = await call('/api/cloud/setup-link', { slug: 'najah-law' }); assert.match(l.j.url, /setup=/);
  assert.ok(cloudCalls.every(x => x.url.startsWith('https://test.palgaz.net/_ops/')));
});

test('النسخ الاحتياطي: السجل ومفتاح التوقيع إلى قرص خارجي', async () => {
  assert.equal((await call('/api/backup', { dir: path.join(TMP, 'nope') })).s, 400);
  fs.mkdirSync(USB);
  const r = await call('/api/backup', { dir: USB }); assert.equal(r.s, 200, JSON.stringify(r.j));
  for (const f of ['vendor.db', 'activator-private.pem', 'license.pub', 'manifest.json']) assert.ok(fs.existsSync(path.join(r.j.dir, f)), f);
  assert.equal((await call('/api/summary')).j.backupDue, false);
});
