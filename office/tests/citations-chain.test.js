'use strict';
/* استشهادان متتاليان: «المادة 105 من مجلة الأحكام العدلية والمادة 52 من قانون الأصول» — لكلٍّ قانونه، فلا تُنسب الأولى إلى قانون الثانية */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { citations } = require('../lib/misbar-local');
test('كل مادة تُنسب إلى قانونها في الاستشهادات المتتالية', () => {
  const c = citations('استناداً إلى المادة 105 من مجلة الأحكام العدلية والمادة 52 من قانون أصول المحاكمات المدنية والتجارية');
  assert.equal(c.find(x => x.article === '105').law, 'majalla');
  assert.equal(c.find(x => x.article === '52').law, 'usul');
  const d = citations('المادة 215 من قانون التجارة والمادة 3 منه');
  assert.equal(d[0].law, d[1].law);
});
