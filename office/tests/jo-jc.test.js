'use strict';
/* مبادئ المكتب الفني (jc.jo): النص حرفي، وأرقام القرارات بكل صيغها، وكل رقم يفتح القرار في التمييز الأردني */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const J = require('../tools/jo-jc-build.js');
test('أرقام القرارات بالأرقام الهندية والسنة أولاً', () => {
  assert.equal(J.normRef('٥٣٤٤ /2023'), '5344/2023'); assert.equal(J.normRef('(٢٠٢٢/٧٥٣٧)'), '7537/2022'); assert.equal(J.normRef('4112-2018'), '4112/2018'); assert.equal(J.normRef('12/87'), '');
});
test('التحويل: نص حرفي بلا بقايا الصفحة، والعنوان من الكلمات المفتاحية، والقرارات روابط', () => {
  const t = 'مصلحة الطعن / غرامة المثلي /حجية الأمر المقضي فيه. يمتد أثر ثبوت الفروقات الضريبية في الدعوى الحقوقية إلى التعويض المدني المتمثل بغرامة المثلي موضوع هذه الدعوى. تمييز جزاء رقم (911/2023)';
  const d = J.convert({ id: 3, url: 'https://www.jc.jo/x/3', text: '> ' + t + ' كيف تقيم محتوى الصفحة ممتاز', refs: ['911/2023', '٩١١ /2023'] });
  assert.equal(d.body, t); assert.equal(d.src, 'JO_CASSATION'); assert.equal(d.ext_id, 'jc-3');
  assert.equal(d.title, 'مبدأ المكتب الفني: مصلحة الطعن / غرامة المثلي / حجية الأمر المقضي فيه');
  assert.deepEqual(d.cites, [{ title: 'قرار تمييز رقم 911/2023', text: '', case: '911/2023' }]); assert.equal(d.case_no, '911/2023'); assert.equal(d.year, 2023); assert.equal(d.meta.principle, true);
});
