// صلاحيات المستخدمين: الأدوار الجاهزة (مدخل بيانات، محاسب، طباعة فقط…) والصلاحيات المخصّصة، مفروضة في الخادم
'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const P = require('../lib/perms');

const ROOT = path.resolve(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mq-perms-'));
const PORT = 19000 + Math.floor(Math.random() * 900), BASE = `http://127.0.0.1:${PORT}`;
let srv, admin = '';
const req = async (p, { method = 'GET', body, cookie = admin } = {}) => {
  const r = await fetch(BASE + p, { method, headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: r.status, j: await r.json().catch(() => ({})), r };
};
const login = async (username, password) => { const l = await req('/api/auth/login', { method: 'POST', body: { username, password }, cookie: '' }); assert.equal(l.status, 200, JSON.stringify(l.j)); return (l.r.headers.get('set-cookie') || '').split(';')[0] };
const boot = c => req('/api/admin/bootstrap', { cookie: c }).then(r => r.j);
const save = (c, changes, deleted) => req('/api/admin/state', { method: 'POST', body: { v: 2, changes, ...(deleted ? { deleted } : {}) }, cookie: c });
const mkUser = (username, role, perms) => req('/api/users', { method: 'POST', body: { name: username, username, role, password: 'Pass12345', ...(perms ? { perms } : {}) } }).then(r => { assert.equal(r.status, 201, JSON.stringify(r.j)); return r.j });

before(async () => {
  srv = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), MQ_DATA: path.join(TMP, 'data'), MQ_BACKUP: 'off', MQ_BACKUP_DIR: path.join(TMP, 'bk') }, stdio: ['ignore', 'pipe', 'pipe'] });
  srv.stderr.on('data', d => process.stderr.write('[srv] ' + d));
  for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE + '/api/health')).ok) break } catch (e) {} await new Promise(r => setTimeout(r, 200)) }
  const s = await req('/api/auth/setup', { method: 'POST', body: { username: 'admin', name: 'المدير', password: 'Test12345' }, cookie: '' });
  admin = (s.r.headers.get('set-cookie') || '').split(';')[0];
  const r = await save(admin, { clients: [{ id: 'c1', name: 'موكل', payments: [{ id: 'p1', amount: 500 }] }], cases: [{ id: 'k1', no: '1/2026', client: 'c1', subject: 'مطالبة', fee: 3000, paid: 500 }] });
  assert.equal(r.status, 200, JSON.stringify(r.j));
});
after(async () => { if (srv && srv.exitCode === null) { const g = new Promise(r => srv.once('exit', r)); srv.kill(); await g } try { fs.rmSync(TMP, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch (e) {} });

test('الأدوار الجاهزة وصلاحياتها', () => {
  assert.deepEqual(P.permsOf({ role: 'data_entry' }), ['view_all', 'clients', 'cases', 'docs']);
  assert.deepEqual(P.permsOf({ role: 'print_only' }), ['view_all', 'print']);
  assert.ok(P.can({ role: 'accountant' }, 'finance') && P.can({ role: 'accountant' }, 'finance_view') && !P.can({ role: 'accountant' }, 'cases'));
  assert.ok(P.can({ role: 'admin', perms: [] }, 'manage'), 'المدير له كل شيء دائماً');
  assert.ok(P.can({ role: 'viewer', perms: ['finance'] }, 'finance_view'), 'تسجيل الأتعاب يتضمن رؤيتها');
  assert.equal(P.clean(['view_all', 'clients', 'cases', 'docs'], 'data_entry'), null, 'مطابق للدور = حسب الدور');
  assert.deepEqual(P.clean(['view_all', 'clients', 'x'], 'data_entry'), ['view_all', 'clients']);
  // الواجهة تحمل نسخة مطابقة
  const src = fs.readFileSync(path.join(ROOT, 'admin.js'), 'utf8');
  const PI = Function('return ' + /const PERM_INFO=(\{[^;]+\});/.exec(src)[1])();
  assert.deepEqual(Object.keys(PI), P.ALL);
  for (const k of P.ALL) assert.equal(PI[k], P.PERMS[k].label);
  const PALL = Object.keys(PI), RP = Function('PALL', 'return ' + /const ROLE_PERMS=(\{[^;]+\});/.exec(src)[1])(PALL);
  for (const r of Object.keys(P.ROLES)) assert.deepEqual([...RP[r]].sort(), P.permsOf({ role: r }).sort(), r);
});

test('مدخل البيانات: يُدخل ويعدّل، لا يرى الأتعاب ولا يمسحها، ولا يحذف ولا يراسل ولا يحلّل', async () => {
  await mkUser('entry1', 'data_entry'); const c = await login('entry1', 'Pass12345');
  const b = await boot(c);
  assert.equal(b.state.cases[0].fee, undefined, 'الأتعاب مخفية'); assert.equal(b.state.clients[0].payments, undefined);
  assert.deepEqual(b.user.perms, ['view_all', 'clients', 'cases', 'docs']);
  let r = await save(c, { cases: [{ ...b.state.cases[0], subject: 'مطالبة مالية' }] }); assert.equal(r.status, 200, JSON.stringify(r.j));
  const a = (await boot(admin)).state.cases[0]; assert.equal(a.subject, 'مطالبة مالية'); assert.equal(a.fee, 3000, 'الأتعاب بقيت'); assert.equal(a.paid, 500);
  assert.equal((await boot(admin)).state.clients[0].payments.length, 1, 'الدفعات بقيت');
  r = await save(c, { cases: [{ id: 'k2', no: '2/2026', client: 'c1', subject: 'جديدة' }] }); assert.equal(r.status, 200, 'إضافة قضية');
  r = await save(c, { cases: [{ id: 'k3', no: '3/2026', client: 'c1', fee: 900 }] }); assert.equal(r.status, 200);
  assert.equal((await boot(admin)).state.cases.find(x => x.id === 'k3').fee, undefined, 'من لا يرى الأتعاب لا يسجّلها');
  await mkUser('fv1', 'viewer', ['view_all', 'cases', 'finance_view']); const fv = await login('fv1', 'Pass12345');
  r = await save(fv, { cases: [{ id: 'k4', no: '4/2026', client: 'c1', fee: 900 }] }); assert.equal(r.status, 403); assert.match(r.j.error, /الأتعاب/);
  r = await save(c, {}, { cases: ['k2'] }); assert.equal(r.status, 403); assert.match(r.j.error, /الحذف/);
  assert.equal((await req('/api/admin/messages', { method: 'POST', body: { client: 'c1', text: 'مرحبا' }, cookie: c })).status, 403);
  assert.equal((await req('/api/admin/misbar/analyze', { method: 'POST', body: {}, cookie: c })).status, 403);
  assert.equal((await req('/api/users', { cookie: c })).status, 403);
});

test('المحاسب يسجّل الأتعاب والدفعات ولا يعدّل بيانات القضية؛ الطباعة فقط لا يحفظ شيئاً', async () => {
  await mkUser('acc1', 'accountant'); const c = await login('acc1', 'Pass12345');
  const b = await boot(c); assert.equal(b.state.cases[0].fee, 3000);
  const k = b.state.cases.find(x => x.id === 'k1'), cl = b.state.clients[0];
  let r = await save(c, { cases: [{ ...k, paid: 1500 }], clients: [{ ...cl, payments: [...cl.payments, { id: 'p2', amount: 1000 }] }] }); assert.equal(r.status, 200, JSON.stringify(r.j));
  const k2 = (await boot(c)).state.cases.find(x => x.id === 'k1');
  r = await save(c, { cases: [{ ...k2, subject: 'تغيير' }] }); assert.equal(r.status, 403); assert.match(r.j.error, /القضايا/);
  await mkUser('print1', 'print_only'); const pc = await login('print1', 'Pass12345');
  const pb = await boot(pc); assert.equal(pb.state.cases[0].fee, undefined);
  assert.equal((await save(pc, { cases: [{ ...pb.state.cases[0], subject: 'x' }] })).status, 403);
});

test('صلاحيات مخصّصة لمستخدم: مدخل بيانات يحذف، وتغيير الدور يعيدها لصلاحيات الدور', async () => {
  const u = await mkUser('entry2', 'data_entry', ['view_all', 'clients', 'cases', 'docs', 'delete']);
  assert.equal(u.custom, true); assert.ok(u.perms.includes('delete'));
  const c = await login('entry2', 'Pass12345');
  assert.equal((await save(c, {}, { cases: ['k2'] })).status, 200);
  // تعديل الصلاحيات يُنهي جلسته فتُطبَّق فوراً
  let r = await req('/api/users/' + u.id, { method: 'POST', body: { perms: ['view_all', 'print'] } }); assert.equal(r.status, 200); assert.deepEqual(r.j.perms, ['view_all', 'print']);
  assert.equal((await req('/api/admin/bootstrap', { cookie: c })).status, 401);
  r = await req('/api/users/' + u.id, { method: 'POST', body: { role: 'secretary' } }); assert.equal(r.j.custom, false); assert.ok(r.j.perms.includes('messages'));
  const audit = (await req('/api/audit?action=user.update')).j; assert.ok(audit.some(a => (a.detail.fields || []).some(f => f.f === 'perms')));
});
