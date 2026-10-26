// أدوات المكتب: حاسبة المدد، التفقيط، الهجري، عدّاد النص
'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const T = require('../office-tools.js');

test('حاسبة المدد: تقويمية وأيام عمل وأشهر، والامتداد عند العطلة، والفرق', () => {
  assert.equal(T.addPeriod('2026-10-26', 30), '2026-11-25');
  assert.equal(T.addPeriod('2026-10-26', 15, { unit: 'days', work: true }), '2026-11-12', 'دون أيام الجمعة');
  assert.equal(T.addPeriod('2026-10-26', 10, { work: true, sat: true }), '2026-11-09', 'دون الجمعة والسبت');
  assert.equal(T.addPeriod('2026-01-31', 1, { unit: 'months' }), '2026-02-28', 'آخر الشهر');
  assert.equal(T.addPeriod('2024-02-29', 1, { unit: 'years' }), '2025-02-28');
  assert.deepEqual(T.rollForward('2026-10-30'), { date: '2026-10-31', moved: 1 }, 'الجمعة ← السبت');
  assert.deepEqual(T.rollForward('2026-10-30', { sat: true, holidays: ['2026-11-01'] }), { date: '2026-11-02', moved: 3 });
  const d = T.diff('2025-03-15', '2026-10-26'); assert.equal(d.days, 590); assert.equal(d.y, 1); assert.equal(d.m, 7); assert.equal(d.d, 11);
});
test('التفقيط بالعملات', () => {
  assert.equal(T.tafqeet(5250, 'ILS'), 'فقط خمسة آلاف ومئتان وخمسون شيكل لا غير');
  assert.equal(T.tafqeet('1,200.50', 'JOD'), 'فقط ألف ومئتان دينار أردني وخمسمائة فلس لا غير');
  assert.equal(T.words(2000000), 'مليونان');
  assert.equal(T.words(21), 'واحد وعشرون');
  assert.equal(T.tafqeet(T.toLatinDigits('١٥٠٠'), 'USD'), 'فقط ألف وخمسمائة دولار أمريكي لا غير');
});
test('الهجري والميلادي ذهاباً وإياباً', () => {
  const h = T.toHijri('2026-10-26'); assert.equal(h.y, 1448);
  assert.equal(T.fromHijri(h.y, h.m, h.d), '2026-10-26');
  assert.equal(T.fromHijri(1447, 9, 1), (() => { for (let i = 0; i < 400; i++) { const d = new Date(2026, 0, 1 + i), s = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'), x = T.toHijri(s); if (x.y === 1447 && x.m === 9 && x.d === 1) return s } })());
});
test('عدّاد النص والأرقام', () => {
  const c = T.countText('بسم الله\nالرحمن الرحيم'); assert.equal(c.words, 4); assert.equal(c.lines, 2);
  assert.equal(T.toArabicDigits('12/3'), '١٢/٣'); assert.equal(T.toLatinDigits('١٢٣۴'), '1234');
});
