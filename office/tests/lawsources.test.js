// اختبارات محوّل مصادر التشريعات على الإنترنت بصفحات مصغّرة مطابقة لبنية المصادر (بلا اتصال فعلي)
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const L = require('../lib/law-sources');

const SEARCH = `<ul class="list-unstyled mb-0"><li class="py-2 border-bottom">
 <a href="/legislation/1/?h=العمل"><strong>قانون العمل الفلسطيني رقم (7) لسنة 2000م</strong></a>
 <dl class="row mb-0"><dt class="col-md-2 mb-0">نوع التشريع</dt><dd class="col-md-10 mb-0"><span class="badge badge-secondary">قانون خاص</span> / <span class="badge badge-secondary">قانون عادي</span></dd>
 <dt class="col-md-2 mb-0">التصينف الموضوعي</dt><dd class="col-md-10 mb-0"><span class="badge badge-secondary">العمل</span></dd>
 <dt class="col-md-2 mb-0">حالة التشريع</dt><dd class="col-md-10 mb-0"><span class="badge badge-secondary">ساري النفاذ في الضفة الغربية وغزة</span></dd>
 <dt class="col-md-2 mb-0">عدد المواد</dt><dd class="col-md-10 mb-0"><span class="badge badge-secondary">141</span></dd></dl>
 <div class="my-1 text-muted">...قانون <span class="badge badge-warning mx-1">العمل</span> الفلسطيني</div></li></ul>
 <ul class="pagination"><li><a class="page-link" aria-label="Page 2 of 12" title="Page 2 of 12" href="?q=x&amp;page=2"> 2 </a></li></ul>`;
const ITEM = `<div class="card-body"><dl class="row mb-0"><dt class="col-md-3 text-md-right">العنوان</dt><dd class="col-md-9"> قانون العمل الفلسطيني رقم (7) لسنة 2000م </dd>
 <dt>السنة</dt><dd>2000</dd><dt>الرقم</dt><dd>7</dd><dt>نوع التشريع</dt><dd>قانون خاص</dd><dt>نوع تشريع - فرعي</dt><dd> قانون عادي </dd>
 <dt>التصينف الموضوعي</dt><dd> العمل </dd><dt>تصنيف موضوعي - فرعي</dt><dd> العلاقات بين العمال وأرباب العمل </dd><dt>حالة التشريع</dt><dd>ساري النفاذ في الضفة الغربية وغزة</dd></dl></div>
 <div class="card-body"><h5 class="text-center"> الباب الاول <br />تعاريف وأحكام عامة </h5><dl class="row">
 <dt class="col-md-3 text-md-right"><a href="/legislation/1/item/1/"> المادة (1) </a><br><span class="badge">42 حكم قضائي</span></dt><dd class="col-md-9"><p>لغايات تطبيق أحكام هذا القانون:<br>الوزارة: وزارة العمل.</p></dd>
 <dt class="col-md-3 text-md-right"><a href="/legislation/1/item/2/"> المادة (2) </a></dt><dd class="col-md-9"><p>حق العمل<br>العمل حق لكل مواطن &amp; قادر عليه.</p></dd></dl></div>
 <div class="col-md-3"><a href="/media/uploads/x.pdf" class="btn">النص الكامل</a></div>`;

test('تحليل نتائج البحث من المصدر الأول', () => {
  const r = L.s1ParseSearch(SEARCH, 1);
  assert.equal(r.items.length, 1); assert.equal(r.pages, 12);
  const x = r.items[0];
  assert.deepEqual([x.id, x.type, x.status, x.articles, x.year], ['s1:1', 'قانون', 'ساري', 141, 2000]);
  assert.match(x.hit, /العمل/);
});
test('تحليل تشريع كامل: البيانات والأبواب والمواد', () => {
  const x = L.s1ParseItem(ITEM, 's1:1');
  assert.equal(x.ref, '7/2000'); assert.equal(x.source, 'المجلس التشريعي'); assert.equal(x.articles, 2);
  assert.equal(x.parts[0].h, 'الباب الاول - تعاريف وأحكام عامة');
  assert.match(x.content, /المادة \(2\): حق العمل\nالعمل حق لكل مواطن & قادر عليه\./);
  const rec = L.toLibrary(x); assert.equal(rec.titleAr, x.title); assert.ok(rec.summary && rec.content);
});
test('المصدر الثاني: التصنيفات المضمّنة والحالة والجهة', () => {
  const x = L.s2Item({ id: 5, title: { rendered: 'قرار بقانون رقم (27) لسنة 2020م بتعديل قانون الأسلحة' }, content: { rendered: '<p>بعد الاطلاع</p><p>مادة (1)</p><p>يُعدل…</p>' },
    _embedded: { 'wp:term': [[{ taxonomy: 'text-type-categories', name: 'قرار بقانون' }], [{ taxonomy: 'status-categories', name: 'المعمول به' }], [{ taxonomy: 'institution-categories', name: 'رئيس السلطة الوطنية الفلسطينية' }]] } }, true);
  assert.deepEqual([x.id, x.type, x.status, x.source, x.ref], ['s2:5', 'قرار بقانون', 'ساري', 'رئيس دولة فلسطين', '27/2020']);
  assert.equal(x.articles, 1); assert.ok(x.parts.some(p => p.a));
});
test('الخدمة: طلب واحد لكل بحث، والهمزة تُجرّب عند انعدام النتائج، وحدود الطلبات', async () => {
  const urls = [];
  const fetchImpl = async u => { urls.push(String(u)); const html = /q=%D8%A7%D9%84%D8%A3/.test(String(u)) ? SEARCH : '<ul></ul>'; return { ok: true, status: 200, text: async () => html } };
  const audit = []; const run = L.createLawSearch({ audit: e => audit.push(e.action), fetchImpl });
  const r = await run('search', { q: 'الاسلحة', src: 's1' }, { id: 'u1' });
  assert.equal(r.status, 200); assert.equal(r.body.q2, 'الأسلحة'); assert.equal(r.body.items.length, 1); assert.equal(urls.length, 2);
  assert.equal((await run('search', { q: 'ا', src: 's1' }, { id: 'u1' })).status, 400);
  assert.equal((await run('item', { id: 'x:1' }, { id: 'u1' })).status, 400);
  assert.equal((await run('items', { ids: Array.from({ length: 21 }, (_, i) => 's1:' + i).join(',') }, { id: 'u1' })).status, 400);
  assert.deepEqual(audit, ['lawsearch.search']);
});
test('المصدر لا يستجيب: رسالة واضحة دون انهيار', async () => {
  const run = L.createLawSearch({ fetchImpl: async () => { throw new Error('offline') } });
  const r = await run('search', { q: 'العمل', src: 's1' }, { id: 'u2' });
  assert.equal(r.status, 502); assert.match(r.body.error, /تعذّر الوصول/);
});
