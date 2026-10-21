'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { addMonths, schedule, summary, instState, addPayment } = require('../settlements.js');

test('إضافة الأشهر تحافظ على اليوم وتقصّ آخر الشهر', () => {
  assert.equal(addMonths('2026-01-15', 1), '2026-02-15');
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
  assert.equal(addMonths('2028-01-31', 1), '2028-02-29');
  assert.equal(addMonths('2026-11-30', 3), '2027-02-28');
  assert.equal(addMonths('2026-12-10', 12), '2027-12-10');
});

test('جدول الأقساط: المجموع يساوي الإجمالي والباقي الكسري في الأخير', () => {
  const s = schedule({ total: 1000, down: 100, n: 7, first: '2026-02-01', step: 1, date: '2026-01-10' });
  assert.equal(s.length, 8);
  assert.equal(s[0].label, 'الدفعة الأولى'); assert.equal(s[0].due, '2026-01-10');
  const sum = s.reduce((a, x) => a + x.amount, 0);
  assert.equal(Math.round(sum * 100) / 100, 1000);
  assert.equal(s[1].amount, 128.57); assert.equal(s[7].amount, 128.58);
  assert.equal(s[7].due, '2026-08-01');
});

test('دفعة أولى تساوي الإجمالي: لا أقساط بعدها', () => {
  const s = schedule({ total: 500, down: 500, n: 4, first: '2026-02-01', date: '2026-01-01' });
  assert.equal(s.length, 1);
});

test('حالة القسط والملخص وشرط الحلول', () => {
  const ag = { accel: true, accelN: 2, installments: schedule({ total: 300, down: 0, n: 3, first: '2026-01-01', step: 1, date: '2025-12-20' }) };
  assert.equal(instState(ag.installments[0], '2026-02-15'), 'late');
  assert.equal(instState(ag.installments[2], '2026-03-01'), 'due');
  assert.equal(instState(ag.installments[2], '2026-02-01'), 'wait');
  let s = summary(ag, '2026-02-15');
  assert.equal(s.late, 2); assert.equal(s.lateAmt, 200); assert.equal(s.accel, true); assert.equal(s.status, 'late');
  addPayment(ag.installments[0], 100, '2026-03-05');
  addPayment(ag.installments[1], 40, '2026-03-05');
  s = summary(ag, '2026-02-15');
  assert.equal(s.paid, 140); assert.equal(s.rem, 160); assert.equal(s.late, 1); assert.equal(s.accel, false);
  assert.equal(instState(ag.installments[1], '2026-02-15'), 'late');
  assert.equal(s.pct, 47);
});

test('تسجيل دفعة: يرفض الأكبر من المتبقي والصفر، ويحفظ السجل', () => {
  const x = { id: 'i1', due: '2026-01-01', amount: 100, paid: 0 };
  assert.equal(addPayment(x, 0, '2026-01-02').ok, false);
  assert.equal(addPayment(x, 150, '2026-01-02').ok, false);
  assert.equal(addPayment(x, 60, '2026-01-02', 'نقداً').ok, true);
  assert.equal(addPayment(x, 40, '2026-01-03').ok, true);
  assert.equal(x.pays.length, 2); assert.equal(instState(x, '2026-06-01'), 'paid');
});

test('اتفاقية مسددة بالكامل تصير منتهية، والفارغة تُعرف', () => {
  const ag = { installments: [{ id: 'a', due: '2026-01-01', amount: 50, paid: 50 }] };
  assert.equal(summary(ag, '2026-05-01').status, 'done');
  assert.equal(summary({ installments: [] }, '2026-05-01').status, 'empty');
});
