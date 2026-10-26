// قراءة بطاقة الهوية: استخراج الحقول من نص القارئ المحلي وفحص خانة التحقق
'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { parse, idValid } = require('../id-card.js');
// رقم صالح الخانة مولَّد للاختبار (ليس لشخص حقيقي)
const withCheck = b => { for (let d = 0; d < 10; d++) if (idValid(b + d)) return b + d };
const ID = withCheck('40123456'), ID2 = withCheck('85274196');

test('خانة التحقق', () => {
  assert.equal(idValid(ID), true);
  assert.equal(idValid(ID.slice(0, 8) + ((+ID[8] + 1) % 10)), false);
  assert.equal(idValid('000000000'), false);
  assert.equal(idValid('12345'), false);
});

test('بطاقة بتسميات منفصلة وأرقام عربية', () => {
  const ar = s => s.replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  const t = `السلطة الوطنية الفلسطينية
بطاقة هوية
رقم الهوية: ${ar(ID)}
الاسم: محمد
اسم الأب: أحمد
اسم الجد: خليل
اسم العائلة: الشريف
اسم الأم: فاطمة
تاريخ الميلاد: ${ar('14/03/1985')}
مكان الميلاد: نابلس
الجنس: ذكر
الديانة: مسلم`;
  const p = parse(t);
  assert.equal(p.idNo, ID); assert.equal(p.idOk, true);
  assert.equal(p.name, 'محمد أحمد خليل الشريف');
  assert.equal(p.dob, '1985-03-14'); assert.equal(p.pob, 'نابلس'); assert.equal(p.sex, 'ذكر');
  assert.deepEqual(p.warnings, []);
});

test('الاسم الرباعي في سطر واحد، والقيمة في السطر التالي، ورقم بمسافات', () => {
  const sp = ID2.replace(/(\d{3})(?=\d)/g, '$1 ');
  const p = parse(`State of Palestine\nالاسم الرباعي\nسارة يوسف عبد الله عودة\nرقم الهوية ${sp}\nتاريخ الميلاد 1992/7/3\nمكان الإقامة رام الله البيرة`);
  assert.equal(p.idNo, ID2); assert.ok(p.idOk);
  assert.equal(p.name, 'سارة يوسف عبد الله عودة');
  assert.equal(p.dob, '1992-07-03');
  assert.equal(p.residence, 'رام الله البيرة');
});

test('رقم لا يطابق الخانة يُقرأ مع تنبيه، ويُفضَّل الرقم الصالح إن وُجد غيره', () => {
  const bad = ID.slice(0, 8) + ((+ID[8] + 1) % 10);
  let p = parse(`رقم الهوية ${bad}\nالاسم: علي\nاسم العائلة: حسن`);
  assert.equal(p.idNo, bad); assert.equal(p.idOk, false);
  assert.ok(p.warnings.some(w => /خانة التحقق/.test(w)));
  assert.ok(p.warnings.some(w => /أقل من رباعي/.test(w)));
  p = parse(`رقم البطاقة ${bad}\n${ID}`);
  assert.equal(p.idNo, ID);
});

test('صورة غير مقروءة: تنبيهات بلا اختراع بيانات', () => {
  const p = parse('~~ || ..');
  assert.equal(p.idNo, ''); assert.equal(p.name, '');
  assert.equal(p.warnings.length, 2);
});
