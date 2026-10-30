'use strict';
/* عملة الأتعاب: لكل موكل عملته، والمجاميع لكل عملة على حدة دون تحويل، والتفقيط بالعملة نفسها */
const { test } = require('node:test');
const assert = require('node:assert/strict');
global.MQTOOLS = require('../office-tools.js');
const CUR = require('../currency.js');
test('تطبيع رموز العملات القديمة والجديدة', () => {
  assert.equal(CUR.norm('₪'), 'ILS'); assert.equal(CUR.norm(''), 'ILS'); assert.equal(CUR.norm('JOD'), 'JOD'); assert.equal(CUR.norm('دينار أردني'), 'JOD'); assert.equal(CUR.norm('USD'), 'USD');
  assert.equal(CUR.fmt(8000, 'JOD'), '8,000 د.أ'); assert.equal(CUR.fmt(1500), '1,500 ₪');
});
test('المجاميع لكل عملة على حدة ولا تُجمع الدنانير مع الشواكل', () => {
  const t = CUR.totals([{ fee: 6000, paid: 3000 }, { fee: 8000, paid: 2000, cur: 'JOD' }, { fee: 4000, paid: 4000, cur: '₪' }]);
  assert.deepEqual(t.map(x => [x.cur, x.fee, x.paid, x.due]), [['ILS', 10000, 7000, 3000], ['JOD', 8000, 2000, 6000]]);
  assert.equal(CUR.join(t, 'due'), '3,000 ₪ · 6,000 د.أ');
});
test('التفقيط بعملة الأتعاب', () => {
  assert.match(CUR.words(2500, 'JOD'), /دينار أردني/);
  assert.match(CUR.words(100, 'USD'), /دولار/);
});
