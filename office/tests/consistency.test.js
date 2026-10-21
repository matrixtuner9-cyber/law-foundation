'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { checks } = require('../consistency.js');
const { facts } = require('../case-hub.js');
const T = '2026-10-21';
const base = () => ({
  clients: [{ id: 'c1', name: 'عماد سليم', fee: 5000, paid: 2000, payments: [{ id: 'p1', amount: 1200, k: 'k1' }] },
    { id: 'c2', name: 'شركة النور', fee: 100, paid: 300 }, { id: 'c3', name: 'سامي خالد' }],
  opponents: [{ id: 'o1', name: 'شركة النور' }, { id: 'o2', name: 'خصم غير محدد' }, { id: 'o3', name: 'بلدية رام الله' }],
  cases: [{ id: 'k1', no: '12/2026', court: 'ct1', client: 'c1', opps: ['o1'], status: 'نشطة', fee: 1000, opened: '2026-09-01' },
    { id: 'k2', no: '12/2026', court: 'ct1', client: 'c2', opps: ['o3'], status: 'نشطة', opened: '2026-09-01' },
    { id: 'k3', no: 'قيد التسجيل', court: 'ct2', client: 'c1', opps: ['o2'], status: 'نشطة', subject: 'إخلاء', opened: '2026-08-01' },
    { id: 'k4', no: '5/2025', court: 'ct2', client: 'zz', opps: ['o3'], status: 'نشطة' }],
  hearings: [{ k: 'k1', date: '2026-10-01' }, { k: 'k2', date: '2026-11-05', result: '' }],
  deadlines: [{ k: 'k2', due: '2026-10-10', title: 'إيداع البينات' }],
  messages: { c1: [{ id: 'm1', f: 'them', type: 'file', name: 'عقد.pdf' }, { id: 'm2', f: 'them', type: 'image', k: 'k1' }] }
});
test('فحص الاتساق يكشف الثغرات والتناقضات الأساسية', () => {
  const codes = r => r.map(x => x.code + ':' + (x.k || x.client));
  const r = codes(checks(base(), T));
  for (const c of ['case.noClient:k4', 'case.conflict:k1', 'case.dupNo:k2', 'case.unregistered:k3', 'case.noOpp:k3', 'case.noNext:k1', 'case.noResult:k1',
    'case.lateDeadline:k2', 'case.overpaid:k1', 'client.overpaid:c2', 'client.noCase:c3', 'client.untagged:c1']) assert.ok(r.includes(c), c + ' مفقود: ' + r.join(' '));
  assert.ok(!r.includes('case.noNext:k2'), 'قضية لها جلسة قادمة لا تُعلَّم');
  const all = checks(base(), T); assert.equal(all[0].level, 'bad', 'الأخطر أولاً');
});
test('بيانات سليمة: لا تنبيهات خطيرة، والقضية المنتهية لا تُطالَب بجلسة', () => {
  const d = { clients: [{ id: 'c1', name: 'أ', fee: 10, paid: 5 }], opponents: [{ id: 'o1', name: 'ب ج د' }],
    cases: [{ id: 'k1', no: '1/2026', court: 'x', client: 'c1', opps: ['o1'], status: 'نشطة' }, { id: 'k2', no: '2/2026', court: 'x', client: 'c1', opps: ['o1'], status: 'منتهية' }],
    hearings: [{ k: 'k1', date: '2026-12-01' }], deadlines: [], messages: {} };
  assert.deepEqual(checks(d, T), []);
});
test('أتعاب القضية: تُحسب من دفعاتها المربوطة إن سُجّلت لها أتعاب، وإلا تبقى على مستوى الموكل', () => {
  const d = base(); d.clients[0].payments.push({ id: 'p2', amount: 300, k: 'k3' });
  const f1 = facts(d.cases[0], d, T); assert.equal(f1.fee, 1000); assert.equal(f1.paid, 1200); assert.equal(f1.due, 0); assert.ok(f1.caseFee);
  const f3 = facts(d.cases[2], d, T); assert.equal(f3.fee, 5000); assert.equal(f3.paid, 2000); assert.ok(f3.feeShared);
});
test('البحث بالاسم في القوائم: كلمات بأي ترتيب، ويتجاهل الهمزات والتاء المربوطة والتشكيل', () => {
  const { match } = require('../searchsel.js');
  assert.ok(match('شركة الزيتون للتجارة العامة', 'الزيتون شركه'));
  assert.ok(match('أحمد يوسف الشكعة', 'احمد الشكعه'));
  assert.ok(match('محكمة بداية نابلس', 'بدايه'));
  assert.ok(!match('محكمة صلح رام الله', 'نابلس'));
  assert.ok(match('1187/2025 · شركة', '١١٨٧'));
});
