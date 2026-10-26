// مراجع القضية: تقسيم التشريع إلى مواد، الرمز المميز، الاستشهاد، الربط بعدة قضايا دون تكرار، والنص الحرفي
'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const R = require('../case-refs.js');
const LAW = { id: 501, kind: 'law', title: 'قانون المخالفات المدنية رقم (36) لسنة 1944', ltype: 'قانون', number: '36', year: 1944, status: 'ساري', source: 'فلسطين · تشريعات', primary: true,
  body: 'قانون المخالفات المدنية\nمادة (1)\nيسمى هذا القانون قانون المخالفات المدنية.\nالمادة 2\nفي هذا القانون:\n(أ) تعني عبارة «المحكمة» ...\nمادة (32) مكرر\nلا تُسمع الدعوى بعد مرور ثلاث سنوات.\nوتبدأ المدة من تاريخ العلم بالضرر.\nالمادة ٣٣\nنص المادة الثالثة والثلاثين.' };
const RUL = { id: 902, kind: 'ruling', title: 'نقض حقوق', court: 'محكمة النقض الفلسطينية', case_no: '1234/2019', date: '2020-05-12', source: 'فلسطين · أحكام', primary: true, body: 'وحيث إن الطعن مقدم في الميعاد.\nوحيث إن التقادم لا يسري إلا من تاريخ العلم.' };

test('تقسيم التشريع إلى مواد بنصوصها الكاملة (أرقام عربية وهندية ومكرر)', () => {
  const a = R.splitArticles(LAW.body);
  assert.deepEqual(a.map(x => x.n), ['1', '2', '32 مكرر', '33']);
  assert.equal(a[2].text, 'مادة (32) مكرر\nلا تُسمع الدعوى بعد مرور ثلاث سنوات.\nوتبدأ المدة من تاريخ العلم بالضرر.', 'النص حرفياً دون اختصار');
  assert.equal(R.articleAt(LAW.body, 'وتبدأ المدة من تاريخ العلم').n, '32 مكرر', 'المقطع المظلّل يُنسب لمادته');
});

test('الرمز المميز والاستشهاد', () => {
  const art = R.fromDoc(LAW, { art: R.splitArticles(LAW.body)[3] });
  assert.equal(art.kind, 'article'); assert.equal(R.refCode(art), 'م 33 · ق 36/1944');
  assert.equal(R.citation(art), 'المادة (33) من قانون المخالفات المدنية رقم (36) لسنة 1944');
  assert.equal(R.refCode(R.fromDoc(LAW)), 'ق 36/1944');
  const ex = R.fromDoc(LAW, { excerpt: 'وتبدأ المدة من تاريخ العلم بالضرر.' });
  assert.equal(ex.kind, 'excerpt'); assert.equal(ex.art, '32 مكرر'); assert.equal(R.refCode(ex), 'م 32 مكرر · ق 36/1944 · مقطع');
  const ru = R.fromDoc(RUL);
  assert.equal(R.refCode(ru), 'نقض 1234/2019'); assert.equal(R.citation(ru), 'حكم محكمة النقض الفلسطينية رقم 1234/2019 الصادر بتاريخ 12/5/2020');
  assert.equal(ru.text, RUL.body, 'نص الحكم كاملاً');
  assert.equal(R.refCode({ kind: 'article', art: '5', ltype: 'قرار بقانون', number: '8', year: 2014 }), 'م 5 · ق.ب 8/2014');
});

test('الربط بعدة قضايا: رقم تسلسلي لكل قضية، ولا تكرار، ومن ربط ومتى', () => {
  const cases = [{ id: 'k1', refs: [] }, { id: 'k2' }, { id: 'k3', refs: [{ n: 4, kind: 'law', src: 'misbar', docId: 9, text: 'x' }] }];
  const art = R.fromDoc(LAW, { art: R.splitArticles(LAW.body)[2] });
  let r = R.linkRef(cases, ['k1', 'k2', 'k3', 'nope'], { ...art, issue: 'التقادم', note: 'سقوط الحق' }, { by: 'imad', at: '2026-10-27 01:30' });
  assert.deepEqual(r.added, ['k1', 'k2', 'k3']);
  assert.equal(cases[0].refs[0].n, 1); assert.equal(cases[2].refs[1].n, 5, 'يكمل ترقيم القضية');
  assert.equal(cases[0].refs[0].code, 'م 32 مكرر · ق 36/1944'); assert.equal(cases[0].refs[0].by, 'imad'); assert.equal(cases[0].refs[0].issue, 'التقادم');
  r = R.linkRef(cases, ['k1'], art); assert.deepEqual(r.skipped, ['k1'], 'المادة نفسها لا تتكرر');
  r = R.linkRef(cases, ['k1'], R.fromDoc(LAW, { art: R.splitArticles(LAW.body)[3] })); assert.deepEqual(r.added, ['k1'], 'مادة أخرى من التشريع نفسه تُربط');
  assert.equal(cases[0].refs[1].n, 2);
});
