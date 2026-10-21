'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const L = require('../lib/legal-pages.js');
test('صفحتا الخصوصية والدعم: اسم المكتب ووسائل التواصل، مع تهريب النص', () => {
  const p = L.privacyPage({ name: 'مكتب <سعد>', phone: '09-233-0000', city: 'نابلس' });
  assert.ok(p.includes('مكتب &lt;سعد&gt;') && !p.includes('<سعد>'));
  assert.ok(p.includes('09-233-0000') && p.includes('Privacy Policy'));
  assert.ok(L.supportPage({ name: 'مكتب' }).includes('/privacy'));
});
test('ملف ربط الروابط: معرّف التطبيق من إعداد الإشعارات أو المتغير، ومسار روابط الدعوة فقط', () => {
  const ids = L.appIdsFrom({ teamId: 'ABCDE12345', topic: 'ps.mithaq.mithaqPortal' }, 'ZZZZZ99999.ps.mithaq.mithaqPortal, bad id');
  assert.deepEqual(ids.slice(0, 2), ['ABCDE12345.ps.mithaq.mithaqPortal', 'ZZZZZ99999.ps.mithaq.mithaqPortal']);
  const j = JSON.parse(L.aasa(ids));
  assert.deepEqual(j.applinks.details[0].appIDs, ['ABCDE12345.ps.mithaq.mithaqPortal', 'ZZZZZ99999.ps.mithaq.mithaqPortal']);
  assert.equal(j.applinks.details[0].components[0]['/'], '/p/*');
  assert.deepEqual(JSON.parse(L.aasa([])).applinks.details, []);
});
