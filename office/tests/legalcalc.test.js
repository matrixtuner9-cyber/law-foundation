// اختبارات الحاسبات القانونية: الأرقام تطابق نصوص قانون التأمين 20/2005 وقانون العمل 7/2000 وجدول الرسوم 6/2023
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../lib/legal-calc');

test('حوادث الطرق: م152 بسقف م153، م155 مثلا معدل الأجور، م156 حد سنتين، م157 خصم، م168 خصم المستعجل', () => {
  const r = C.insurance({ disability: 20, nights: 10, operations: 1, monthlyWage: 5000, sectorAvgWage: 2000, tempDays: 800, age: 40, workEndAge: 60, discountPct: 0, functionalDisability: 20, medical: 1500, advancePaid: 1000, accidentDate: '2022-01-01', today: '2026-01-01' });
  const by = Object.fromEntries(r.lines.map(l => [l.k, l.amount]));
  assert.equal(by.disab, 1000); assert.equal(by.nights, 400); assert.equal(by.ops, 500); assert.equal(r.moral, 1900);
  assert.equal(r.wageUsed, 4000, 'سقف مثلي معدل الأجور'); assert.ok(Math.abs(by.temp - 4000 / 30 * 730) < 1);
  assert.equal(by.future, 4000 * 12 * 20 * 0.2); assert.equal(by.medical, 1500); assert.equal(by.advance, -1000);
  assert.ok(r.notes.some(n => /سنتين/.test(n))); assert.ok(r.warnings.some(w => /م159/.test(w)));
  const cap = C.insurance({ disability: 100, nights: 200 }); assert.equal(cap.moral, 10000); assert.ok(cap.lines.some(l => l.k === 'cap'));
  const min = C.insurance({ disability: 0 }); assert.equal(min.moral, 500);
  const d = C.insurance({ died: true, dependantsShare: 40 }); assert.equal(d.lines[0].amount, 3000);
  const disc = C.insurance({ disability: 10, monthlyWage: 1000, age: 55, workEndAge: 60, discountPct: 3 }); const f = disc.lines.find(l => l.k === 'future'); assert.ok(f.amount < 6000 && f.amount > 5000); assert.match(f.est, /تقدير/);
});
test('عمالية: م45 مع الكسور، م42/2 الاستقالة، م46 الإشعار، م47 سقف سنتين، م74 سنتان فقط، م119/120 الإصابة', () => {
  const r = C.labour({ monthlyWage: 3000, start: '2015-01-01', end: '2024-12-31', termination: 'arbitrary', unusedLeaveYears: 3, minWage: 1880 });
  const by = Object.fromEntries(r.lines.map(l => [l.k, l.amount]));
  assert.ok(Math.abs(r.years - 10) < 0.01); assert.ok(Math.abs(by.eos - 30000) < 30); assert.equal(by.notice, 3000); assert.ok(Math.abs(by.arb - 2 * 3000 * r.years) < 30); assert.equal(C.labour({ monthlyWage: 3000, years: 15, termination: 'arbitrary' }).lines.find(l => l.k === 'arb').amount, 72000, 'سقف أجر سنتين');
  assert.equal(by.leave, 3000 / 30 * 7 * 3 * 2, 'ثلاثة أسابيع بعد خمس سنوات، وسنتان فقط'); assert.ok(r.notes.some(n => /سنتين/.test(n)));
  const res = C.labour({ monthlyWage: 3000, years: 4, termination: 'resignation' }); assert.equal(res.lines[0].amount, 4000); assert.ok(!res.lines.some(l => l.k === 'notice'));
  const res7 = C.labour({ monthlyWage: 3000, years: 7, termination: 'resignation' }); assert.equal(res7.lines[0].amount, 14000);
  const short = C.labour({ monthlyWage: 3000, years: 0.5, termination: 'dismissal' }); assert.ok(!short.lines.some(l => l.k === 'eos')); assert.ok(short.notes[0].includes('م45'));
  const low = C.labour({ monthlyWage: 1500, years: 2, minWage: 1880 }); assert.ok(low.warnings[0].includes('م89'));
  const inj = C.labour({ monthlyWage: 3000, years: 2, termination: 'agreed', injury: true, injuryTempDays: 200, injuryDisability: 50, age: 30 });
  const ib = Object.fromEntries(inj.lines.map(l => [l.k, l.amount])); assert.equal(ib.inj_temp, 0.75 * 100 * 180); assert.equal(ib.inj_perm, Math.max(100 * 3500, 0.8 * 3000 * 12 * 30) * 0.5);
});
test('رسوم: صلح 1% بين 30 و100، بداية 1% ثم 0.5% بسقف 1000، الاستئناف النصف، والإعدادات قابلة للتعديل', () => {
  assert.equal(C.fees({ value: 2000 }).total, 30); assert.equal(C.fees({ value: 9000 }).total, 90);
  const f = C.fees({ value: 100000, appeal: true, execution: true }); assert.equal(f.lines[0].amount, 850); assert.equal(f.lines[1].amount, 425); assert.equal(f.lines[2].amount, 1000);
  assert.equal(C.fees({ value: 500000 }).total, 1000); assert.equal(C.fees({ value: 100000 }, { firstMax: 2500 }).total, 850);
  assert.equal(C.interest({ principal: 10000, ratePct: 9, from: '2025-01-01', to: '2026-01-01' }).amount, 900);
});
