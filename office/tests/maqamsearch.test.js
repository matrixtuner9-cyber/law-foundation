// اختبارات شاشة «البحث في مقام»: طبقة الخادم فوق السكريبت المرفق، بصفحات مصطنعة وجلب مُستبدل (لا اتصال بمقام)
// التشغيل: node --test office/tests
'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { createService, filtersOf } = require('../lib/maqam-search');

const SEARCH = `<html><body><ul class="list-unstyled mb-0">
<li><a href="/judgments/10318/"><strong>القضية رقم 12/2020 المنعقدة في محكمة النقض بتاريخ 2021-03-04</strong></a>
 <a class="badge" href="/judgments/search/?court=5">محكمة النقض</a><a class="badge" href="/judgments/search/?litigation_type=2">طعون حقوقية</a><a class="badge" href="/judgments/search/?subject=44&amp;order_by=relevance">مطالبة مالية</a>
 <div class="my-1 text-muted">مقتطف تجريبي عن مطالبة مالية</div></li>
<li><a href="/judgments/10319/"><strong>القضية رقم 7/2019 بتاريخ 2020-01-02</strong></a><a class="badge" href="/judgments/search/?court=6">محكمة الاستئناف</a></li>
<li><a href="/judgments/10318/">مكرر</a></li><li><a href="/other/1/">ليس حكماً</a></li></ul>
<ul class="pagination"><li class="page-item"><a class="page-link" aria-label="Page 1 of 3">1</a></li><li class="page-item"><a class="page-link" aria-label="Page 3 of 3">3</a></li><li class="page-item active"><span class="page-link">2</span></li></ul></body></html>`;
const JUDG = (id) => `<html><body><ol class="breadcrumb"><li class="breadcrumb-item active"><b title="حكم تجريبي ${id}">حكم</b></li></ol>
<div class="col-lg-9"><div class="card bg-light border-0"><dl class="row"><dt>الرقم</dt><dd>12</dd><dt>السنة</dt><dd>2020</dd><dt>تاريخ الفصل</dt><dd>2021-03-04</dd><dt>المحكمة</dt><dd>محكمة النقض</dd><dt>نوع التقاضي</dt><dd>طعون حقوقية</dd></dl></div>
<div class="card"><h4 class="card-title">النص</h4><div class="card-body"><p>الفقرة الأولى من نص الحكم التجريبي الطويل بما يكفي.</p><p>الفقرة الثانية من النص التجريبي &amp; أخرى.</p></div></div>
<div class="card bg-light"><ul class="list-unstyled"><li><a href="/judgments/search/?branch=1">حقوق</a></li><li><a href="/judgments/search/?subject=44">مطالبة مالية</a></li></ul></div></div></body></html>`;

let calls, realFetch;
const stub = (over = {}) => { calls = []; globalThis.fetch = async (url, opts) => {
  calls.push(String(url));
  if (over.fail) throw new Error('net');
  const m = String(url).match(/\/judgments\/(\d+)\/$/);
  if (m) return { status: over.judgStatus || 200, text: async () => JUDG(m[1]) };
  return { status: over.status || 200, text: async () => SEARCH };
} };
before(() => { realFetch = globalThis.fetch });
after(() => { globalThis.fetch = realFetch });

const U = { id: 'u1', username: 'ali' };
const sp = s => new URLSearchParams(s);

test('البحث: يمرّر الفلاتر المسموحة فقط ويحلّل النتائج والصفحات', async () => {
  stub(); const audits = []; const run = createService({ audit: e => audits.push(e) });
  const r = await run('search', sp('q=مطالبة&court=5&year=2020&evil=1&page=2&order_by=date&subject=abc'), U);
  assert.equal(r.status, 200); assert.equal(r.body.ok, true);
  assert.equal(r.body.results.length, 2, 'المكرر وغير الحكم يُستبعدان');
  const a = r.body.results[0];
  assert.deepEqual([a.maqamId, a.number, a.year, a.decisionDate, a.court, a.courtId, a.litigationType, a.subject, a.subjectId], [10318, '12', '2020', '2021-03-04', 'محكمة النقض', 5, 'طعون حقوقية', 'مطالبة مالية', 44]);
  assert.equal(a.snippet, 'مقتطف تجريبي عن مطالبة مالية'); assert.equal(a.sourceUrl, 'https://maqam.najah.edu/judgments/10318/');
  assert.equal(r.body.page, 2); assert.equal(r.body.totalPages, 3);
  const u = new URL(calls[0]); assert.equal(u.origin, 'https://maqam.najah.edu'); assert.equal(u.pathname, '/judgments/search/');
  assert.equal(u.searchParams.get('court'), '5'); assert.equal(u.searchParams.get('year'), '2020'); assert.equal(u.searchParams.get('page'), '2'); assert.equal(u.searchParams.get('order_by'), 'date');
  assert.equal(u.searchParams.has('evil'), false); assert.equal(u.searchParams.has('subject'), false, 'قيمة غير رقمية تُهمل');
  assert.equal(audits[0].action, 'maqam.search'); assert.equal(audits[0].username, 'ali');
});

test('filtersOf: يقص العبارة ويتجاهل المفاتيح الغريبة والفارغة', () => {
  const f = filtersOf(sp('q=' + 'x'.repeat(500) + '&junk=1&year='));
  assert.equal(f.q.length, 200); assert.deepEqual(Object.keys(f), ['q']);
});

test('الحكم: النص الكامل والبيانات، ورقم غير صالح لا يرسل أي طلب', async () => {
  stub(); const run = createService();
  const bad = await run('judgment', sp('id=abc'), U); assert.equal(bad.status, 400); assert.equal(calls.length, 0);
  const r = await run('judgment', sp('id=10318'), U);
  assert.equal(r.status, 200); assert.equal(r.body.judgment.number, '12'); assert.equal(r.body.judgment.court, 'محكمة النقض');
  assert.equal(r.body.judgment.bodyText, 'الفقرة الأولى من نص الحكم التجريبي الطويل بما يكفي.\n\nالفقرة الثانية من النص التجريبي & أخرى.');
  assert.equal(r.body.judgment.branch, 'حقوق'); assert.equal(calls[0], 'https://maqam.najah.edu/judgments/10318/');
});

test('أخطاء مقام تعود برسالة واضحة دون انهيار الخادم', async () => {
  const run = createService();
  stub({ fail: true }); let r = await run('search', sp('q=x'), U); assert.equal(r.status, 502); assert.match(r.body.error, /تعذر الاتصال بالموقع المصدر/);
  stub({ status: 503 }); r = await run('search', sp('q=x'), U); assert.equal(r.status, 502); assert.match(r.body.error, /503/);
  stub({ status: 404 }); r = await run('search', sp('q=x'), U); assert.equal(r.status, 200); assert.deepEqual(r.body.results, []);
  stub({ judgStatus: 404 }); r = await run('judgment', sp('id=5'), U); assert.equal(r.status, 502);
});

test('حد الطلبات لكل مستخدم: 30 بحثاً في الدقيقة ثم 429 مع زمن الانتظار، ومستخدم آخر لا يتأثر', async () => {
  stub(); const run = createService();
  for (let i = 0; i < 30; i++) assert.equal((await run('search', sp('q=a'), U)).status, 200);
  const r = await run('search', sp('q=a'), U); assert.equal(r.status, 429); assert.ok(r.body.retry > 0 && r.body.retry <= 60);
  assert.equal((await run('search', sp('q=a'), { id: 'u2', username: 'sara' })).status, 200);
});

test('التنزيل: html وcsv وjson بصفحات محدودة، والنص الكامل صفحتان كحد أقصى ومرة كل دقيقتين', async () => {
  stub(); const run = createService();
  let r = await run('download', sp('q=x&format=csv&pages=9'), U);
  assert.equal(r.status, 200); assert.match(r.file.contentType, /text\/csv/); assert.ok(r.file.body.startsWith('﻿"رقم الحكم في المصدر"')); assert.match(r.file.filename, /^maqam-results-\d{4}-\d{2}-\d{2}\.csv$/);
  assert.ok(calls.length <= 3, 'الصفحات تتوقف عند آخر صفحة (3) رغم طلب 9: ' + calls.length);
  r = await run('download', sp('q=x&format=html'), U); assert.match(r.file.body, /<html lang="ar" dir="rtl">/); assert.match(r.file.body, /المصدر: <a href="https:\/\/maqam\.najah\.edu\/judgments\/10318\//);
  r = await run('download', sp('q=x&format=nope'), U); assert.match(r.file.contentType, /text\/html/, 'صيغة مجهولة ترجع إلى html');
  stub(); r = await run('download', sp('q=x&format=json&full=1&pages=5'), U);
  assert.equal(r.status, 200); const j = JSON.parse(r.file.body); assert.equal(j.fullText, true); assert.equal(j.results[0].bodyText.includes('الفقرة الأولى'), true);
  assert.ok(calls.filter(c => /\/judgments\/search\//.test(c)).length <= 2, 'النص الكامل يحدّ الصفحات بصفحتين');
  const again = await run('download', sp('q=x&format=json&full=1'), U); assert.equal(again.status, 429);
  const sum = await run('download', sp('q=x&format=json'), U); assert.equal(sum.status, 429, 'سقف 4 تنزيلات لكل 10 دقائق');
});

test('إجراء مجهول يعيد 404', async () => { stub(); assert.equal((await createService()('nothing', sp(''), U)).status, 404) });

/* ── على الخادم الحقيقي: الجلسة إلزامية، وإضافة ملف الشاشة لقائمة السماح ── */
const ROOT = path.resolve(__dirname, '..'), TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mq-ms-'));
const PORT = 20000 + Math.floor(Math.random() * 1000), BASE = `http://127.0.0.1:${PORT}`;
let srv, cookie = '';
test('الخادم: بلا جلسة 401، ومعها رقم حكم غير صالح 400، وملف الشاشة يُقدَّم', async () => {
  srv = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), MQ_DATA: path.join(TMP, 'data'), MQ_BACKUP: 'off', MQ_BACKUP_DIR: path.join(TMP, 'bk') }, stdio: ['ignore', 'pipe', 'pipe'] });
  for (let i = 0; i < 60; i++) { try { if ((await realFetch(BASE + '/api/health')).ok) break } catch (e) {} await new Promise(r => setTimeout(r, 200)) }
  try {
    assert.equal((await realFetch(BASE + '/api/admin/maqam/search?q=x')).status, 401);
    const s = await realFetch(BASE + '/api/auth/setup', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'admin', name: 'مدير', password: 'Test12345' }) });
    assert.equal(s.status, 200); cookie = (s.headers.get('set-cookie') || '').split(';')[0];
    const h = { cookie };
    const bad = await realFetch(BASE + '/api/admin/maqam/judgment?id=abc', { headers: h }); assert.equal(bad.status, 400);
    const js = await realFetch(BASE + '/maqamsearch.js', { headers: h }); assert.equal(js.status, 200); assert.match(await js.text(), /V\.maqamsearch/);
    assert.equal((await realFetch(BASE + '/api/admin/maqam/other', { headers: h })).status, 404);
  } finally { if (srv.exitCode === null) { const gone = new Promise(r => srv.once('exit', r)); srv.kill(); await gone } try { fs.rmSync(TMP, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch (e) {} }
});
