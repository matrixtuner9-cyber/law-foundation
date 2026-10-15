// اختبارات اعتماد النماذج القانونية: الاعتماد من صلاحية المدير فقط وبشروطه الكاملة، والمحامي يحرر ويرسل للمراجعة
'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const ROOT = path.resolve(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mq-ll-'));
const PORT = 20000 + Math.floor(Math.random() * 1000), BASE = `http://127.0.0.1:${PORT}`;
let srv, admin = '', lawyer = '';
const req = async (p, cookie, { method = 'GET', body } = {}) => {
  const r = await fetch(BASE + p, { method, headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: r.status, j: await r.json().catch(() => ({})), r };
};
const save = (cookie, recs) => req('/api/admin/state', cookie, { method: 'POST', body: { v: 2, changes: { lawforms: recs } } });
const get = async id => ((await req('/api/admin/bootstrap', admin)).j.state.lawforms || []).find(r => r.id === id);
before(async () => {
  srv = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), MQ_DATA: path.join(TMP, 'data'), MQ_BACKUP: 'off' }, stdio: ['ignore', 'pipe', 'pipe'] });
  for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE + '/api/health')).ok) break } catch (e) {} await new Promise(r => setTimeout(r, 200)) }
  const s = await req('/api/auth/setup', '', { method: 'POST', body: { username: 'admin', name: 'المدير', password: 'Test12345' } });
  admin = (s.r.headers.get('set-cookie') || '').split(';')[0];
  assert.equal((await req('/api/users', admin, { method: 'POST', body: { name: 'محامٍ', username: 'lawyer1', role: 'lawyer', password: 'Lawyer123' } })).status, 201);
  const l = await req('/api/auth/login', '', { method: 'POST', body: { username: 'lawyer1', password: 'Lawyer123' } });
  lawyer = (l.r.headers.get('set-cookie') || '').split(';')[0];
});
after(async () => { if (srv && srv.exitCode === null) { const g = new Promise(r => srv.once('exit', r)); srv.kill(); await g } try { fs.rmSync(TMP, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch (e) {} });

const D = { id: 'MQ-PS-002', kind: 'B', body: 'اتفاق أتعاب {الاسم}', version: '1.0', jur: ['WB'], status: 'review' };
test('المحامي يحرر النموذج ويرسله للمراجعة', async () => {
  assert.equal((await save(lawyer, [D])).status, 200);
  assert.equal((await get('MQ-PS-002')).status, 'review');
});
test('المحامي لا يستطيع اعتماد نموذج', async () => {
  const cur = await get('MQ-PS-002');
  const r = await save(lawyer, [{ ...cur, status: 'internal', approvedBy: 'محامٍ', barNo: '123' }]);
  assert.equal(r.status, 403);
  assert.equal((await get('MQ-PS-002')).status, 'review');
});
test('المدير لا يعتمد دون المعتمِد ورقم المزاولة والاختصاص والإصدار', async () => {
  const cur = await get('MQ-PS-002');
  assert.equal((await save(admin, [{ ...cur, status: 'internal' }])).status, 403);
  assert.equal((await save(admin, [{ ...cur, status: 'internal', approvedBy: 'المدير', barNo: '77', jur: [] }])).status, 403);
  const ok = await save(admin, [{ ...cur, status: 'internal', approvedBy: 'المدير', barNo: '77' }]);
  assert.equal(ok.status, 200, JSON.stringify(ok.j));
  assert.equal((await get('MQ-PS-002')).status, 'internal');
});
test('المحامي لا يغيّر نص نموذج معتمد مع إبقائه معتمداً، لكن يستطيع إعادته للمراجعة', async () => {
  const cur = await get('MQ-PS-002');
  assert.equal((await save(lawyer, [{ ...cur, body: cur.body + ' تعديل' }])).status, 403);
  assert.equal((await save(lawyer, [{ ...cur, notes: 'ملاحظة فقط' }])).status, 200, 'تعديل الملاحظات مسموح');
  const c2 = await get('MQ-PS-002');
  assert.equal((await save(lawyer, [{ ...c2, body: c2.body + ' تعديل', status: 'review' }])).status, 200);
  assert.equal((await get('MQ-PS-002')).status, 'review');
});
test('«نموذج رسمي محقق» للمراجع الرسمية فقط ومع نسخة الأصل ومصدرها وتاريخها', async () => {
  const A = { id: 'MQ-PS-214', kind: 'A', version: '2025', jur: ['WB'], status: 'official' };
  assert.equal((await save(admin, [A])).status, 403, 'دون نسخة الأصل');
  assert.equal((await save(admin, [{ ...A, id: 'MQ-PS-002x', kind: 'B', official: { file: '/api/media/aaaaaaaaaaaa.pdf', src: 'https://www.mne.gov.ps/forms.aspx', retrieved: '2026-10-16' } }])).status, 403, 'مسودة لا تصبح رسمية');
  const ok = await save(admin, [{ ...A, official: { file: '/api/media/aaaaaaaaaaaa.pdf', src: 'https://www.mne.gov.ps/forms.aspx', retrieved: '2026-10-16' } }]);
  assert.equal(ok.status, 200);
  assert.equal((await get('MQ-PS-214')).status, 'official');
});
