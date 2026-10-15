// اختبارات «استيراد حكم برابطه»: قبول رابط حكم واحد فقط، وقراءة بنية صفحة الحكم (نموذج مصطنع لا ينسخ محتوى الموقع)
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../lib/maqam');

test('يقبل رابط حكم واحد في مقام فقط', () => {
  assert.equal(M.judgmentUrl('https://maqam.najah.edu/judgments/5158'), 'https://maqam.najah.edu/judgments/5158/');
  assert.equal(M.judgmentUrl('http://www.maqam.najah.edu/judgments/12/'), 'https://maqam.najah.edu/judgments/12/');
  for (const bad of ['https://maqam.najah.edu/judgments/', 'https://maqam.najah.edu/judgments/?page=2', 'https://maqam.najah.edu/judgments/search/?q=x', 'https://evil.example/judgments/1/', 'https://maqam.najah.edu.evil.example/judgments/1/', 'file:///etc/passwd', 'javascript:alert(1)', ''])
    assert.equal(M.judgmentUrl(bad), null, bad);
});

const HTML = `<!doctype html><html><head><title>القضية رقم &lrm;10&rlm;/&lrm;2020&rlm; المنعقدة في محكمة النقض بتاريخ &lrm;2021-03-04&rlm;</title></head><body>
<div class="col-lg-9"><div class="card"><div class="card-body"><dl class="row mb-0">
<dt class="col-md-3">السنة</dt><dd class="col-md-9">2020</dd><dt class="col-md-3">الرقم</dt><dd class="col-md-9">10</dd>
<dt class="col-md-3">تاريخ الفصل</dt><dd class="col-md-9">4 مارس، 2021</dd><dt class="col-md-3">المحكمة</dt><dd class="col-md-9">محكمة النقض</dd>
<dt class="col-md-3">نوع التقاضي</dt><dd class="col-md-9">طعون حقوقية</dd>
<dt class="col-md-3">التصنيفات</dt><dd class="col-md-9"><ul><li><a href="#">حقوق</a> - <a href="#">إجراءات</a> - <a href="#">تبليغ</a></li></ul></dd></dl></div></div>
<div class="card"><div class="card-body"><h4 class="card-title text-center">النص</h4><p><strong>نص تجريبي</strong></p><p>السطر&nbsp;الثاني &amp; الثالث</p></div></div></div>
<div class="col-lg-3"><a href="/media/uploads/x.doc" class="btn"> <i></i> النص الكامل </a><h4>النصوص القانونية المذكورة في الحكم</h4><ul><li><a><b>المادة رقم 1 من قانون تجريبي</b></a></li></ul></div></body></html>`;

test('يستخرج المحكمة والرقم والتاريخ والتصنيف والنص والمواد', () => {
  const r = M.parse(HTML, 'https://maqam.najah.edu/judgments/1/');
  assert.equal(r.court, 'محكمة النقض');
  assert.equal(r.no, 'طعون حقوقية 10/2020');
  assert.equal(r.date, '2021-03-04');
  assert.equal(r.field, 'مدني');
  assert.deepEqual(r.keywords, ['إجراءات', 'تبليغ']);
  assert.equal(r.text, 'نص تجريبي\nالسطر الثاني & الثالث');
  assert.deepEqual(r.cited, ['المادة رقم 1 من قانون تجريبي']);
  assert.equal(r.fullText, 'https://maqam.najah.edu/media/uploads/x.doc');
  assert.equal(r.srcUrl, 'https://maqam.najah.edu/judgments/1/');
});

test('التاريخ من «تاريخ الفصل» إن غاب من العنوان، وصفحة بلا نص تُرفض', () => {
  const r = M.parse(HTML.replace(/بتاريخ[^<]*/, ''), 'u');
  assert.equal(r.date, '2021-03-04');
  assert.equal(M.parse('<html><title>x</title></html>', 'u'), null);
});

test('الجلب: رابط غير صالح لا يرسل أي طلب، والأخطاء تعود برسالة واضحة', async () => {
  let calls = 0; const f = async () => { calls++; return { status: 200, text: async () => HTML } };
  assert.equal((await M.fetchJudgment('https://example.com/x', f)).status, 400); assert.equal(calls, 0);
  const ok = await M.fetchJudgment('https://maqam.najah.edu/judgments/1/', f); assert.equal(ok.ok, true); assert.equal(calls, 1);
  assert.equal((await M.fetchJudgment('https://maqam.najah.edu/judgments/2/', async () => ({ status: 404 }))).status, 404);
  assert.equal((await M.fetchJudgment('https://maqam.najah.edu/judgments/3/', async () => ({ status: 302 }))).status, 502);
  assert.equal((await M.fetchJudgment('https://maqam.najah.edu/judgments/4/', async () => { throw new Error('net') })).status, 502);
});
