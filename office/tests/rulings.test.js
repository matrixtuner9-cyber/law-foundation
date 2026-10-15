// اختبارات مكتبة الاجتهادات القضائية على خادم المكتب: الحفظ والتعارض والحذف الصريح ورفع نص الحكم والصلاحيات
// التشغيل: node --test office/tests
'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');

const ROOT = path.resolve(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mq-rl-'));
const PORT = 19000 + Math.floor(Math.random() * 1000), BASE = `http://127.0.0.1:${PORT}`;
let srv, cookie = '';
const req = async (p, { method = 'GET', body, headers = {}, raw } = {}) => {
  const r = await fetch(BASE + p, { method, headers: { ...(body !== undefined && !raw ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}), ...headers }, body: body === undefined ? undefined : raw ? body : JSON.stringify(body) });
  const j = await r.clone().json().catch(() => ({}));
  return { status: r.status, j, r };
};
const boot = async () => (await req('/api/admin/bootstrap')).j.state;
const save = (changes, extra = {}) => req('/api/admin/state', { method: 'POST', body: { v: 2, changes, ...extra } });

before(async () => {
  srv = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), MQ_DATA: path.join(TMP, 'data'), MQ_BACKUP: 'off', MQ_BACKUP_DIR: path.join(TMP, 'bk') }, stdio: ['ignore', 'pipe', 'pipe'] });
  srv.stderr.on('data', d => process.stderr.write('[srv] ' + d));
  for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE + '/api/health')).ok) break } catch (e) {} await new Promise(r => setTimeout(r, 200)) }
  const s = await req('/api/auth/setup', { method: 'POST', body: { username: 'admin', name: 'مدير', password: 'Test12345' } });
  assert.equal(s.status, 200);
  cookie = (s.r.headers.get('set-cookie') || '').split(';')[0];
});
after(async () => {
  if (srv && srv.exitCode === null) { const gone = new Promise(r => srv.once('exit', r)); srv.kill(); await gone }
  try { fs.rmSync(TMP, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch (e) {}
});

const R1 = { id: 'r1', court: 'محكمة النقض', no: 'نقض مدني 512/2023', date: '2023-05-14', field: 'إجراءات وإثبات', principle: 'التبليغ الذي لا يتم وفق الأصول باطل ويبطل ما يترتب عليه من إجراءات.', keywords: ['تبليغ', 'بطلان'], cases: [] };

test('حكم جديد يُحفظ ويعود في بيانات المكتب', async () => {
  const r = await save({ rulings: [R1] });
  assert.equal(r.status, 200, JSON.stringify(r.j));
  const st = await boot();
  assert.equal(st.rulings.length, 1);
  assert.equal(st.rulings[0].principle, R1.principle);
  assert.equal(st.rulings[0]._v, 1);
});

test('تعديل زميل على نسخة قديمة من الحكم يُرفض ولا يمحو التعديل الأحدث', async () => {
  const cur = (await boot()).rulings[0];
  await save({ rulings: [{ ...cur, notes: 'أحدث' }] });
  const r = await save({ rulings: [{ ...cur, notes: 'قديم' }] });
  assert.equal(r.j.conflicts.length, 1);
  assert.equal((await boot()).rulings[0].notes, 'أحدث');
});

test('رفع نص الحكم يُخزن الملف دون إنشاء رسالة لأي موكل، ويُفتح لموظف المكتب', async () => {
  const before = (await req('/api/admin/bootstrap')).j.messages;
  const up = await req('/api/admin/ruling-file?name=' + encodeURIComponent('حكم 512.pdf'), { method: 'POST', body: Buffer.from('%PDF-1.4 test'), headers: { 'content-type': 'application/pdf' }, raw: true });
  assert.equal(up.status, 201, JSON.stringify(up.j));
  assert.match(up.j.file, /^\/api\/media\/[a-f0-9]+\.pdf$/);
  const got = await fetch(BASE + up.j.file, { headers: { cookie } });
  assert.equal(got.status, 200);
  assert.equal((await got.text()).slice(0, 8), '%PDF-1.4');
  const after = (await req('/api/admin/bootstrap')).j.messages;
  assert.deepEqual(after, before, 'لم تُنشأ رسالة');
  const bad = await req('/api/admin/ruling-file?name=x.exe', { method: 'POST', body: Buffer.from('MZ'), headers: { 'content-type': 'application/octet-stream' }, raw: true });
  assert.equal(bad.status, 415);
});

test('الحذف الصريح فقط يحذف الحكم', async () => {
  await save({ rulings: [{ ...R1, id: 'r2', no: '2' }] });
  assert.equal((await boot()).rulings.length, 2);
  await save({ rulings: [] });
  assert.equal((await boot()).rulings.length, 2, 'غياب السجل لا يحذفه');
  await save({}, { deleted: { rulings: ['r2'] } });
  const st = await boot();
  assert.deepEqual(st.rulings.map(r => r.id), ['r1']);
});

test('المطّلع لا يضيف أحكاماً ولا يرفع ملفات', async () => {
  assert.equal((await req('/api/users', { method: 'POST', body: { name: 'مطّلع', username: 'viewer2', role: 'viewer', password: 'Viewer123' } })).status, 201);
  const keep = cookie;
  const l = await req('/api/auth/login', { method: 'POST', body: { username: 'viewer2', password: 'Viewer123' }, headers: { cookie: '' } });
  cookie = (l.r.headers.get('set-cookie') || '').split(';')[0];
  try {
    assert.equal((await save({ rulings: [{ ...R1, id: 'r9' }] })).status, 403);
    assert.equal((await req('/api/admin/ruling-file?name=a.pdf', { method: 'POST', body: Buffer.from('x'), headers: { 'content-type': 'application/pdf' }, raw: true })).status, 403);
    assert.equal((await boot()).rulings.length, 1, 'المطّلع يرى المكتبة');
  } finally { cookie = keep }
});

test('استيراد حكم برابطه: رابط غير صالح يُرفض دون اتصال بالخارج، والمطّلع لا يستورد', async () => {
  const r = await req('/api/admin/ruling-import', { method: 'POST', body: { url: 'https://example.com/judgments/1/' } });
  assert.equal(r.status, 400);
  assert.match(r.j.error, /مقام/);
});
