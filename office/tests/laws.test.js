// اختبارات مكتبة التشريعات: الإضافة والاستيراد للمدير فقط، البحث بالتطبيع العربي، الفلاتر والترقيم، التكرار، التعارض، التصدير والحذف
'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const ROOT = path.resolve(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mq-lg-'));
const PORT = 21000 + Math.floor(Math.random() * 1000), BASE = `http://127.0.0.1:${PORT}`;
let srv, admin = '', lawyer = '';
const req = async (p, cookie, { method = 'GET', body } = {}) => {
  const r = await fetch(BASE + p, { method, headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
  const t = await r.text(); let j = {}; try { j = JSON.parse(t) } catch (e) {}
  return { status: r.status, j, t, r };
};
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

/* بيانات اختبار وهمية صراحة (ليست تشريعات حقيقية) */
const ROWS = [
  { 'العنوان': 'قانون تجريبي أول للإجازات', 'النوع': 'قانون', 'المصدر': 'المجلس التشريعي', 'الملخص': 'ملخص تجريبي', 'المحتوى': 'المادة 1: نص تجريبي.\nالمادة 2: يستحق العامل إجازة سنوية مدفوعة الأجر.', 'رقم المرجع': '1/2001', 'تاريخ الإصدار': '15/03/2001', 'الوسوم': 'عمل، تجربة' },
  { titleAr: 'قرار بقانون تجريبي ثانٍ', type: 'قرار بقانون', source: 'رئيس دولة فلسطين', status: 'معدل', summary: 'ملخص الثاني', content: 'نص الثاني', referenceNumber: '2/2018', year: 2018 },
  { titleAr: 'نوع خاطئ', type: 'لائحة', source: 'المجلس التشريعي', summary: 's', content: 'c' },
  { titleAr: 'بلا محتوى', type: 'نظام', source: 'مجلس الوزراء', summary: 's' },
  { 'العنوان': 'قانون تجريبي أول للإجازات', 'النوع': 'قانون', 'المصدر': 'المجلس التشريعي', 'الملخص': 'مكرر', 'المحتوى': 'مكرر', 'رقم المرجع': '1/2001' },
];
let firstId;

test('المكتبة فارغة في البداية (لا بيانات تُزرع تلقائياً)', async () => {
  const r = await req('/api/admin/laws/search', lawyer);
  assert.equal(r.status, 200); assert.equal(r.j.total, 0); assert.equal(r.j.facets.total, 0);
});
test('المحامي لا يستورد ولا يضيف', async () => {
  assert.equal((await req('/api/admin/laws/import', lawyer, { method: 'POST', body: { records: ROWS } })).status, 403);
  assert.equal((await req('/api/admin/laws/save', lawyer, { method: 'POST', body: { rec: ROWS[1] } })).status, 403);
});
test('المدير يستورد: الصالح يُضاف، والخاطئ يُرفض بسببه، والمكرر يُتخطى', async () => {
  const r = await req('/api/admin/laws/import', admin, { method: 'POST', body: { records: ROWS, file: 'test.xlsx' } });
  assert.equal(r.status, 200);
  assert.deepEqual([r.j.added, r.j.failed, r.j.duplicates], [2, 2, 1]);
  assert.match(r.j.errors[0].message, /نوع غير صالح/); assert.equal(r.j.errors[0].row, 3);
  assert.match(r.j.errors[1].message, /المحتوى/);
});
test('البحث يتجاهل الهمزات والتاء المربوطة ويجد الكلمة داخل النص مع مقتطف', async () => {
  const r = await req('/api/admin/laws/search?q=' + encodeURIComponent('اجازه سنويه'), lawyer);
  assert.equal(r.j.total, 1); firstId = r.j.items[0].id;
  assert.match(r.j.items[0].hit, /إجازة سنوية/);
  assert.equal(r.j.items[0].content, undefined, 'نتائج البحث بلا النص الكامل');
  assert.equal(r.j.items[0].issueDate, '2001-03-15'); assert.equal(r.j.items[0].year, 2001);
});
test('الفلاتر والترتيب والترقيم', async () => {
  assert.equal((await req('/api/admin/laws/search?type=' + encodeURIComponent('قرار بقانون'), lawyer)).j.total, 1);
  assert.equal((await req('/api/admin/laws/search?status=' + encodeURIComponent('معدل'), lawyer)).j.total, 1);
  assert.equal((await req('/api/admin/laws/search?yearFrom=2010', lawyer)).j.total, 1);
  assert.equal((await req('/api/admin/laws/search?yearTo=2005', lawyer)).j.total, 1);
  const s = await req('/api/admin/laws/search?sort=year_asc&pageSize=1&page=2', lawyer);
  assert.equal(s.j.pages, 2); assert.equal(s.j.items[0].year, 2018);
  const f = (await req('/api/admin/laws/meta', lawyer)).j;
  assert.equal(f.facets.type['قانون'], 1); assert.equal(f.canManage, false);
});
test('عرض تشريع كامل، والتعديل بنسخة قديمة يُرفض كتعارض', async () => {
  const it = (await req('/api/admin/laws/item?id=' + firstId, lawyer)).j.rec;
  assert.match(it.content, /المادة 2/);
  const base = { id: firstId, _v: it._v, titleAr: it.title, type: it.type, source: it.source, summary: 'ملخص معدّل', content: it.content, referenceNumber: it.ref };
  assert.equal((await req('/api/admin/laws/save', admin, { method: 'POST', body: { rec: base } })).status, 200);
  const again = await req('/api/admin/laws/save', admin, { method: 'POST', body: { rec: base } });
  assert.equal(again.status, 409);
});
test('استخراج عدة تشريعات كاملة بترتيب الطلب (للصفحة المستقلة)', async () => {
  const all = (await req('/api/admin/laws/search?sort=year_asc', lawyer)).j.items.map(x => x.id);
  const r = await req('/api/admin/laws/items?ids=' + [...all].reverse().join(',') + ',nope', lawyer);
  assert.equal(r.status, 200); assert.deepEqual(r.j.recs.map(x => x.id), [...all].reverse());
  assert.ok(r.j.recs.every(x => typeof x.content === 'string' && x.content.length));
});
test('إضافة يدوية مكررة تُرفض مع رقم الموجود', async () => {
  const r = await req('/api/admin/laws/save', admin, { method: 'POST', body: { rec: { titleAr: 'قانون تجريبي أول للإجازات', type: 'قانون', source: 'المجلس التشريعي', summary: 'x', content: 'y', referenceNumber: '1/2001' } } });
  assert.equal(r.status, 409); assert.equal(r.j.id, firstId);
});
test('التصدير بأسماء أعمدة السكريبت المرفق، ويُعاد استيراده كمكرر', async () => {
  const r = await req('/api/admin/laws/export', lawyer);
  assert.equal(r.status, 200); assert.match(r.r.headers.get('content-disposition'), /attachment/);
  assert.equal(r.j.count, 2); assert.ok(r.j.records[0].titleAr && 'referenceNumber' in r.j.records[0]);
  const back = await req('/api/admin/laws/import', admin, { method: 'POST', body: { records: r.j.records } });
  assert.deepEqual([back.j.added, back.j.duplicates], [0, 2]);
});
test('الحذف للمدير، وحذف الكل يحتاج تأكيداً مكتوباً، وكله في سجل التدقيق', async () => {
  assert.equal((await req('/api/admin/laws/delete', lawyer, { method: 'POST', body: { id: firstId } })).status, 403);
  assert.equal((await req('/api/admin/laws/delete', admin, { method: 'POST', body: { id: firstId } })).status, 200);
  assert.equal((await req('/api/admin/laws/delete', admin, { method: 'POST', body: { all: true, confirm: 'نعم' } })).status, 400);
  const c = await req('/api/admin/laws/delete', admin, { method: 'POST', body: { all: true, confirm: 'حذف الكل' } });
  assert.equal(c.j.n, 1);
  assert.equal((await req('/api/admin/laws/search', lawyer)).j.total, 0);
  const a = (await req('/api/audit?limit=200', admin)).j;
  const acts = JSON.stringify(a);
  for (const x of ['laws.import', 'laws.update', 'laws.delete', 'laws.clear', 'laws.export']) assert.ok(acts.includes(x), x);
});
test('ملف الشاشة مسموح ومسجّل في الصفحة', async () => {
  const r = await fetch(BASE + '/legislation.js', { headers: { cookie: admin } });
  assert.equal(r.status, 200);
  assert.match(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), /legislation\.js/);
});
