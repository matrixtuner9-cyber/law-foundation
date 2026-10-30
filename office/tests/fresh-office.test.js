'use strict';
/* التنصيب الجديد يبدأ مكتباً فارغاً (البيانات التجريبية بـ MQ_DEMO=1 فقط)، و«البدء من مكتب فارغ» يتطلب كلمة «حذف» ويحذف السجلات والرسائل */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), { spawn } = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
const start = async (demo) => {
  const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mq-fresh-')), PORT = 24000 + Math.floor(Math.random() * 3000), BASE = 'http://127.0.0.1:' + PORT;
  const proc = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), MQ_BIND: '127.0.0.1', MQ_DATA: path.join(TMP, 'data'), MQ_BACKUP: 'off', MQ_DEMO: demo ? '1' : '' }, stdio: ['ignore', 'ignore', 'pipe'] });
  let up = false; for (let i = 0; i < 80 && !up; i++) { try { up = (await fetch(BASE + '/api/health')).ok } catch (e) {} if (!up) await new Promise(r => setTimeout(r, 150)) }
  const s = await fetch(BASE + '/api/auth/setup', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'A', username: 'admin', password: 'Test12345' }) });
  const ck = (s.headers.get('set-cookie') || '').split(';')[0];
  const call = async (u, body) => { const r = await fetch(BASE + u, { method: body ? 'POST' : 'GET', headers: { cookie: ck, ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, data: await r.json().catch(() => ({})) } };
  return { call, stop: async () => { const g = new Promise(r => proc.once('exit', r)); proc.kill(); await g; fs.rmSync(TMP, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }) } };
};
test('التنصيب الجديد بلا موكلين ولا قضايا ولا رسائل', async () => {
  const s = await start(false);
  try { const b = (await s.call('/api/admin/bootstrap')).data; assert.equal(b.state.clients.length, 0); assert.equal(b.state.cases.length, 0); assert.equal(b.messages.length, 0) } finally { await s.stop() }
});
test('البدء من مكتب فارغ يتطلب «حذف» ثم يحذف كل شيء', async () => {
  const s = await start(true);
  try {
    const b0 = (await s.call('/api/admin/bootstrap')).data; assert.equal(b0.state, null);
    assert.equal((await s.call('/api/admin/state', { v: 2, changes: { clients: [{ id: 'cx', name: 'موكل' }] } })).status, 200);
    assert.equal((await s.call('/api/admin/fresh-start', { confirm: 'نعم' })).status, 400);
    const r = await s.call('/api/admin/fresh-start', { confirm: 'حذف' }); assert.equal(r.status, 200); assert.ok(r.data.records >= 1);
    const b = (await s.call('/api/admin/bootstrap')).data; assert.equal(b.state.clients.length, 0); assert.equal(b.messages.length, 0);
  } finally { await s.stop() }
});
