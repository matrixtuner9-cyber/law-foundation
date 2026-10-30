'use strict';
/* التقويم القضائي: لا تمديد تلقائي للميعاد؛ يُنبَّه إن صادف آخره راحة أسبوعية أو عطلة معتمدة أو العطلة القضائية مع يوم الامتداد المحتمل،
   والعطل الهجرية المقترحة محسوبة لا مكتوبة يدوياً، ونقطة الحفظ تنظّف المدخلات وتحصرها بالمدير. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
function load() {
  const sb = { console, Date, Intl, Promise, String, Number, Math, JSON, Array, Set, setTimeout, fetch: () => Promise.resolve({ ok: false }), document: { createElement: () => ({ style: {} }), head: { appendChild() {} }, addEventListener() {} } };
  sb.window = sb; vm.createContext(sb); vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'legal-calendar.js'), 'utf8'), sb); return sb.MQ_CAL;
}
test('آخر يوم يصادف جمعة أو عطلة معتمدة: يبقى كما هو ويُذكر يوم الامتداد', () => {
  const C = load(); C.CAL.rest = [5]; C.CAL.holidays = [{ date: '2026-11-15', name: 'ذكرى إعلان الاستقلال' }];
  const a = C.due('2026-10-03', 30); // 2026-11-02 الاثنين
  assert.equal(a.end, '2026-11-02'); assert.equal(a.check.off, false); assert.equal(a.ext, null);
  const b = C.due('2026-10-14', 30); // 2026-11-13 جمعة
  assert.equal(b.end, '2026-11-13'); assert.equal(b.check.weekly, 'الجمعة'); assert.equal(b.ext, '2026-11-14');
  const c = C.due('2026-10-16', 30); // 2026-11-15 الأحد عطلة
  assert.equal(c.check.holiday, 'ذكرى إعلان الاستقلال'); assert.equal(c.ext, '2026-11-16');
  assert.match(C.note(c.end), /الأحوط التقديم قبل/);
});
test('جمعة تليها عطلة: الامتداد إلى أول يوم عمل بعدهما', () => {
  const C = load(); C.CAL.rest = [5, 6]; C.CAL.holidays = [{ date: '2026-11-15', name: 'عطلة' }];
  assert.equal(C.nextWork('2026-11-13'), '2026-11-16');
});
test('العطلة القضائية تُنبَّه ولا تُعدّ يوم عطلة', () => {
  const C = load(); C.CAL.recess = [{ from: '2026-07-15', to: '2026-08-31', note: 'العطلة القضائية 2026' }];
  const r = C.check('2026-08-04'); assert.equal(r.off, false); assert.equal(r.recess, 'العطلة القضائية 2026');
  assert.match(C.note('2026-08-04'), /العطلة القضائية 2026/);
});
test('العطل المقترحة: ميلادية ثابتة وهجرية محسوبة لكل سنة', () => {
  const C = load(), s = C.suggest(2027);
  assert.ok(s.some(x => x.date === '2027-11-15'));
  const fitr = s.filter(x => /عيد الفطر/.test(x.name)), adha = s.filter(x => /عيد الأضحى/.test(x.name));
  assert.equal(fitr.length, 3); assert.equal(adha.length, 4);
  assert.ok(fitr[0].date >= '2027-03-05' && fitr[0].date <= '2027-03-12', fitr[0].date);
});
