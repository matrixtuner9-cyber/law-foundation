// التواصل مع محامٍ: تحويل الأرقام لواتساب وصياغة الرسالة
'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { waNumber, bare, compose } = require('../lawyer-contact.js');

test('أرقام الجوال إلى صيغة واتساب الدولية', () => {
  assert.equal(waNumber('0599369032'), '970599369032');
  assert.equal(waNumber('0568123456'), '970568123456');
  assert.equal(waNumber('0522123456'), '972522123456', 'جوال إسرائيلي (القدس)');
  assert.equal(waNumber('+970-599-369-032'), '970599369032');
  assert.equal(waNumber('00972541234567'), '972541234567');
  assert.equal(waNumber('092330000'), '', 'الهاتف الأرضي لا يصلح لواتساب');
  assert.equal(waNumber(''), '');
});

test('اسم المحامي دون اللقب للبحث في الدليل', () => {
  assert.equal(bare('المحامي رامي حسونة'), 'رامي حسونة');
  assert.equal(bare('المحامية دعاء شتيه'), 'دعاء شتيه');
  assert.equal(bare('الأستاذ سامر'), 'سامر');
});

test('صياغة الرسالة بتفاصيل القضية وسبب التواصل', () => {
  global.MQ = { user: { name: 'سامر عبد الله' }, settings: { officeName: 'مكتب الميثاق' } };
  const t = compose({}, { name: 'رامي حسونة', no: '1187/2025', court: 'محكمة بداية نابلس', subject: 'مطالبة مالية', next: '22/6/2026 الساعة 10:00', reason: 'settle' });
  assert.match(t, /^الزميل\/ة الأستاذ\/ة رامي حسونة المحترم\/ة،/);
  assert.match(t, /المحامي سامر عبد الله من مكتب الميثاق/);
  assert.match(t, /القضية رقم 1187\/2025 لدى محكمة بداية نابلس \(مطالبة مالية\)/);
  assert.match(t, /الجلسة القادمة بتاريخ 22\/6\/2026/);
  assert.match(t, /التسوية الودية/);
  const f = compose({}, { name: 'دعاء شتيه', no: '5/2026' });
  assert.match(f, /الأستاذ\/ة دعاء شتيه/);
  assert.doesNotMatch(f, /الجلسة القادمة/);
  delete global.MQ;
});

test('مركز التواصل: باقة القوالب بصيغتين، وتعبئة القضية والجلسة، والحقول الناقصة', () => {
  const { build, missing, TPL, CATS } = require('../lawyer-contact.js');
  assert.ok(TPL.length >= 20, 'باقة واسعة'); assert.equal(CATS.length, 6);
  for (const t of TPL) assert.ok(CATS.some(c => c[0] === t.cat) && t.f && t.s, t.id);
  const ctx = { name: 'رامي حسونة', me: 'سامر عبد الله', office: 'مكتب الميثاق', no: '1187/2025', court: 'محكمة بداية نابلس', subject: 'مطالبة مالية', next: '2/11/2026 الساعة 10:00' };
  const f = build('adjourn', ctx);
  assert.match(f, /^الزميل\/ة الأستاذ\/ة رامي حسونة المحترم\/ة،\nتحية طيبة وبعد،/);
  assert.match(f, /بخصوص القضية رقم 1187\/2025 لدى محكمة بداية نابلس \(مطالبة مالية\)\./);
  assert.match(f, /تأجيل الجلسة بتاريخ 2\/11\/2026 الساعة 10:00/);
  assert.match(f, /مع وافر الاحترام،\nسامر عبد الله\nمكتب الميثاق$/);
  const s = build('adjourn', { ...ctx, tone: 's' });
  assert.ok(s.length < f.length / 2, 'المختصرة أقصر'); assert.match(s, /^الأستاذ\/ة رامي حسونة، تحية طيبة،/);
  const o = build('offer', ctx); assert.deepEqual(missing(o), ['[أساس العرض]', '[التاريخ]']);
  assert.match(o, /بدون إقرار بأي مسؤولية/);
  const o2 = build('offer', { ...ctx, vals: { 'العرض': 'دفع 5000 شيكل على قسطين', 'التاريخ': '15/11/2026' } }); assert.deepEqual(missing(o2), []);
  const g = build('congrats', { me: 'سامر', vals: { 'المناسبة': 'نيل الإجازة' } });
  assert.doesNotMatch(g, /القضية/, 'بلا قضية لا يُذكر سطرها'); assert.match(g, /\[اسم الزميل\]/);
});
