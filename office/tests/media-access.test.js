'use strict';
/* ملفات المحادثات والأحكام: لا تُقرأ إلا بجلسة موظف مخوّل أو برابط موقّع ساري يبطل بتجديد رمز الموكل */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');

const ROOT = path.resolve(__dirname, '..'), TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mq-media-'));
const PORT = 24000 + Math.floor(Math.random() * 4000), BASE = `http://127.0.0.1:${PORT}`;
let server, admin, client;
const req = async (u, o = {}) => { const r = await fetch(BASE + u, o); return { status: r.status, body: await r.json().catch(() => ({})), r } };
const asAdmin = (u, o = {}) => req(u, { ...o, headers: { cookie: admin, ...(o.headers || {}) } });
const post = b => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) });

before(async () => {
  server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), MQ_BIND: '127.0.0.1', MQ_EDITION: 'connected', MQ_DATA: path.join(TMP, 'data'), MQ_BACKUP: 'off' }, stdio: ['ignore', 'ignore', 'pipe'] });
  let err = ''; server.stderr.on('data', b => { err += b });
  let up = false; for (let i = 0; i < 80 && !up; i++) { try { up = (await fetch(BASE + '/api/health')).ok } catch (e) {} if (!up) await new Promise(r => setTimeout(r, 120)) }
  assert.ok(up, 'server did not start: ' + err);
  const s = await req('/api/auth/setup', post({ username: 'admin', name: 'Admin', password: 'Test12345' }));
  assert.equal(s.status, 200); admin = s.r.headers.get('set-cookie').split(';')[0];
  const seed = require('../data.js');
  assert.equal((await asAdmin('/api/admin/state', post({ ...seed, mzLog: [] }))).status, 200);
  client = (await asAdmin('/api/admin/bootstrap')).body.state.clients.find(c => c.portal);
  assert.ok(client && client.code);
});
after(async () => { if (server && server.exitCode === null) { const g = new Promise(r => server.once('exit', r)); server.kill(); await g } fs.rmSync(TMP, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }) });

test('ملف موكل: ممنوع بلا تفويض، متاح بالرابط الموقّع وبجلسة الموظف، ويبطل بتجديد الرمز', async () => {
  const data = Buffer.from('%PDF-1.7 private client document');
  const up = await asAdmin('/api/admin/file?client=' + encodeURIComponent(client.id) + '&name=test.pdf', { method: 'POST', headers: { 'content-type': 'application/pdf' }, body: data });
  assert.equal(up.status, 201, JSON.stringify(up.body));
  const signed = new URL(up.body.file, BASE), bare = signed.pathname;
  assert.match(signed.search, /^\?e=\d{10}&s=[\w-]{32}$/);
  assert.equal((await fetch(BASE + bare)).status, 403);
  assert.equal((await fetch(BASE + bare, { headers: { 'x-client': client.code } })).status, 403);
  assert.equal(await (await fetch(signed)).text(), data.toString());
  const bad = new URL(signed); bad.searchParams.set('s', 'A'.repeat(32)); assert.equal((await fetch(bad)).status, 403);
  const old = new URL(signed); old.searchParams.set('e', '1000000000'); assert.equal((await fetch(old)).status, 403);
  assert.equal((await fetch(BASE + bare, { headers: { cookie: admin } })).status, 200);
  assert.equal((await asAdmin('/api/users', post({ username: 'external1', name: 'Outside counsel', role: 'external', cases: [], password: 'External123' }))).status, 201);
  const ext = (await req('/api/auth/login', post({ username: 'external1', password: 'External123' }))).r.headers.get('set-cookie').split(';')[0];
  assert.equal((await fetch(BASE + bare, { headers: { cookie: ext } })).status, 403, 'محامٍ خارجي غير مكلّف');
  const msgs = await req('/api/portal/messages', { headers: { 'x-client': client.code } });
  const m = msgs.body.find(x => x.file);
  assert.ok(m.file.includes('?e=')); assert.equal(m.by, undefined, 'لا يصل اسم مستخدم الموظف للموكل');
  const rot = await asAdmin('/api/admin/client-code', post({ client: client.id }));
  assert.equal(rot.status, 200);
  assert.equal((await fetch(signed)).status, 403, 'الرابط القديم يبطل بتجديد الرمز');
  const fresh = (await req('/api/portal/messages', { headers: { 'x-client': rot.body.clients[0].code } })).body.find(x => x.file);
  assert.equal((await fetch(BASE + fresh.file)).status, 200);
});

test('ملف حكم: ممنوع للعامة، متاح للموظف المخوّل', async () => {
  const up = await asAdmin('/api/admin/ruling-file?name=r.pdf', { method: 'POST', headers: { 'content-type': 'application/pdf' }, body: Buffer.from('%PDF-1.7 ruling') });
  assert.equal(up.status, 201); assert.match(up.body.file, /^\/api\/media\/[a-f0-9]{12}\.pdf$/);
  assert.equal((await fetch(BASE + up.body.file)).status, 403);
  assert.equal((await fetch(BASE + up.body.file, { headers: { cookie: admin } })).status, 200);
  assert.equal((await fetch(BASE + '/api/media/../server.js', { headers: { cookie: admin } })).status, 404);
});
