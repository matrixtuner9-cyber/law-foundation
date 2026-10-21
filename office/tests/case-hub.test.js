'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { events, facts } = require('../case-hub.js');
const { caseChecks } = require('../case-wizard.js');
const data = {
  clients: [{ id: 'c1', name: 'عماد سليم', fee: 5000, paid: 2000, portal: true, last: '2026-10-20', payments: [{ id: 'p1', date: '2026-10-01', amount: 2000, method: 'نقداً' }] },
    { id: 'c2', name: 'شركة النور', fee: 9000, paid: 0, payments: [{ id: 'p2', date: '2026-10-02', amount: 500, k: 'k3' }, { id: 'p3', date: '2026-10-03', amount: 700, k: 'k2' }] }],
  cases: [{ id: 'k1', no: '8000', client: 'c1', court: 'ct1', status: 'نشطة', notes: [{ id: 'n1', at: '2026-10-21 10:00', text: 'اتصل الموكل' }] },
    { id: 'k2', no: '12/2026', client: 'c2', court: 'ct1', status: 'نشطة' }, { id: 'k3', no: '13/2026', client: 'c2', court: 'ct2', status: 'نشطة' }],
  hearings: [{ k: 'k1', date: '2026-10-10', purpose: 'سماع' }, { k: 'k1', date: '2026-11-02', time: '09:30', purpose: 'بينات' }, { k: 'k2', date: '2026-11-01', purpose: 'خاص بغيرها' }],
  deadlines: [{ k: 'k1', due: '2026-10-25', title: 'إيداع' }],
  docs: [{ id: 'd1', k: 'k1', date: '2026-10-05', title: 'عقد' }, { id: 'd2', k: 'k1', date: '2026-10-06', title: 'لائحة', aiDraft: true, text: 'نص' }],
  messages: { c1: [{ id: 'm1', f: 'them', type: 'voice', at: '2026-10-21 09:00', unread: true }], c2: [{ id: 'm2', f: 'them', type: 'text', t: 'عن القضية الأولى', at: '2026-10-20 08:00', k: 'k2' }, { id: 'm3', f: 'them', type: 'text', t: 'عام', at: '2026-10-19 08:00' }] },
  mzLog: [{ k: 'k1', at: '2026-10-12 08:15', t: 'تأكيد موعد' }]
};
test('ملف القضية الموحّد: كل أحداث القضية من مصادرها، الأحدث أولاً، دون أحداث قضايا أخرى', () => {
  const ev = events(data.cases[0], data, '2026-10-21');
  assert.deepEqual([...new Set(ev.map(x => x.type))].sort(), ['deadline', 'doc', 'draft', 'hearing', 'msg', 'mz', 'note', 'pay'].sort());
  assert.ok(!JSON.stringify(ev).includes('خاص بغيرها'));
  assert.equal(ev[0].at, '2026-11-02 09:30');
  assert.ok(ev.find(x => x.type === 'hearing' && x.warn), 'جلسة سابقة بلا قرار تُعلَّم');
  assert.ok(ev.find(x => x.type === 'msg').unread);
});
test('موكل له قضيتان: الرسائل والدفعات المربوطة بقضية لا تظهر في الأخرى، وغير المربوطة تظهر «للموكل»', () => {
  const e2 = events(data.cases[1], data, '2026-10-21'), e3 = events(data.cases[2], data, '2026-10-21');
  assert.ok(e2.some(x => x.text === 'عن القضية الأولى')); assert.ok(!e3.some(x => x.text === 'عن القضية الأولى'));
  assert.ok(e3.find(x => x.text === 'عام').shared);
  assert.ok(e2.some(x => /700/.test(x.title)) && !e2.some(x => /500/.test(x.title)));
  assert.ok(!e3.some(x => x.type === 'pay' && /700/.test(x.title)));
});
test('رأس القضية: الجلسة القادمة وأقرب مهلة والمتبقي والرسائل غير المقروءة والجلسات بلا قرار', () => {
  const f = facts(data.cases[0], data, '2026-10-21');
  assert.equal(f.next.date, '2026-11-02'); assert.equal(f.deadline.due, '2026-10-25'); assert.equal(f.due, 3000); assert.equal(f.unread, 1); assert.equal(f.pending, 1);
  assert.equal(facts(data.cases[1], data, '2026-10-21').feeShared, true);
});
test('قضية جديدة: رقم مكرر لنفس الموكل، أو لموكل آخر في المحكمة نفسها، أو خصم هو موكل لدينا', () => {
  assert.equal(caseChecks({ no: '8000', court: 'ct1', client: 'c1', opponent: 'x' }, data)[0].level, 'bad');
  assert.match(caseChecks({ no: '8000', court: 'ct1', client: 'c2', opponent: 'x' }, data)[0].text, /لموكل آخر: عماد سليم/);
  assert.equal(caseChecks({ no: '8000', court: 'ct9', client: 'c2', opponent: 'x' }, data)[0].level, 'warn');
  assert.match(caseChecks({ no: '', court: 'ct1', client: 'c1', opponent: 'شركة  النور' }, data)[0].text, /تضارب/);
  assert.deepEqual(caseChecks({ no: 'قيد التسجيل', court: 'ct1', client: 'c1', opponent: 'خصم جديد' }, data), []);
});
