'use strict';
/* «مكتبتي القانونية»: الملف محمي، والمراجع تُحفظ مع الأحكام دون تداخل، وبإصدارات تمنع الكتابة فوق الأحدث */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), { spawn } = require('node:child_process');
const ROOT = path.resolve(__dirname, '..'), TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mq-shelf-'));
const PORT = 22000 + Math.floor(Math.random() * 2000), BASE = 'http://127.0.0.1:' + PORT;
let proc, cookie = '';
const call = async (u, method = 'GET', body, ck = cookie) => { const r = await fetch(BASE + u, { method, headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(ck ? { cookie: ck } : {}) }, body: body ? JSON.stringify(body) : undefined }); return { r, status: r.status, data: await r.clone().json().catch(() => ({})) } };
const save = (changes, deleted) => call('/api/admin/state', 'POST', { v: 2, changes, ...(deleted ? { deleted } : {}) });
const shelf = async () => (await call('/api/admin/bootstrap')).data.state;
before(async () => {
  proc = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), MQ_BIND: '127.0.0.1', MQ_DATA: path.join(TMP, 'data'), MQ_BACKUP: 'off' }, stdio: ['ignore', 'ignore', 'pipe'] });
  let up = false; for (let i = 0; i < 80 && !up; i++) { try { up = (await fetch(BASE + '/api/health')).ok } catch (e) {} if (!up) await new Promise(r => setTimeout(r, 150)) }
  assert.ok(up, 'service did not start');
  const s = await call('/api/auth/setup', 'POST', { name: 'Admin', username: 'admin', password: 'Test12345' });
  assert.equal(s.status, 200); cookie = (s.r.headers.get('set-cookie') || '').split(';')[0];
});
after(async () => { if (proc && proc.exitCode === null) { const g = new Promise(r => proc.once('exit', r)); proc.kill(); await g } fs.rmSync(TMP, { force: true, recursive: true, maxRetries: 10, retryDelay: 100 }) });
const article = { id: 'legal-article-1', referenceType: 'article', authorityType: 'قانون', natureType: 'مادة قانونية', title: 'المادة 17 من قانون الاختبار', articleNumber: '17', lawName: 'قانون الاختبار', text: 'نص مادة لأغراض الاختبار', source: 'مصدر تجريبي', srcUrl: 'https://example.org/law' };
test('ملفات الشاشتين الجديدتين محمية بالدخول', async () => {
  for (const f of ['/legal-shelf.js', '/ready-templates-palestine.js']) {
    assert.equal((await call(f, 'GET', undefined, '')).status, 401);
    assert.equal((await call(f)).status, 200);
  }
  assert.match(await (await call('/legal-shelf.js')).r.text(), /مكتبتي القانونية/);
});
test('المادة والحكم يُحفظان معاً دون تداخل', async () => {
  const r = await save({ legalRefs: [article], rulings: [{ id: 'rl-1', court: 'محكمة النقض', no: '101/2025', principle: 'مبدأ تجريبي' }] });
  assert.equal(r.status, 200); assert.equal(r.data.changed, 2);
  const b = await shelf();
  assert.equal(b.legalRefs.length, 1); assert.equal(b.legalRefs[0].articleNumber, '17'); assert.equal(b.rulings[0].no, '101/2025');
});
test('تعديل قديم يُرفض كتعارض ولا يكتب فوق الأحدث', async () => {
  const orig = (await shelf()).legalRefs[0];
  assert.equal((await save({ legalRefs: [{ ...orig, notes: 'الأحدث' }] })).status, 200);
  const stale = await save({ legalRefs: [{ ...orig, notes: 'قديم' }] });
  assert.equal(stale.data.conflicts.length, 1);
  assert.equal((await shelf()).legalRefs[0].notes, 'الأحدث');
});
test('المطّلع لا يحفظ، وغياب السجل لا يحذفه، والحذف الصريح يحذفه', async () => {
  assert.equal((await call('/api/users', 'POST', { name: 'Viewer', username: 'viewer', password: 'Viewer123', role: 'viewer' })).status, 201);
  const cv = ((await call('/api/auth/login', 'POST', { username: 'viewer', password: 'Viewer123' }, '')).r.headers.get('set-cookie') || '').split(';')[0];
  assert.equal((await call('/api/admin/state', 'POST', { v: 2, changes: { legalRefs: [{ ...article, id: 'legal-2' }] } }, cv)).status, 403);
  await save({ legalRefs: [] }); assert.equal((await shelf()).legalRefs.length, 1);
  assert.equal((await save({}, { legalRefs: ['legal-article-1'] })).status, 200);
  assert.equal((await shelf()).legalRefs.length, 0);
});
