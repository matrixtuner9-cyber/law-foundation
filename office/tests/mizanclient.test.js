'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path');
process.env.MQ_DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'mq-mz-'));
const vault = require('../mizan/vault.js'), { match } = require('../mizan/match.js');

test('ميزان: حساب الموكل يُحفظ مشفّراً بموافقة موثّقة فقط، ولا تظهر كلمة المرور في الملف، ويُحذف', () => {
  assert.throws(() => vault.saveClient('c1', '400123456', 'secret', null), /موافقة الموكل/);
  vault.saveClient('c1', '400123456', 'secret', { by: 'admin', at: '2026-10-21 00:30', how: 'إقرار موقّع' });
  const raw = fs.readFileSync(path.join(vault.DIR, 'clients', 'c1.json'), 'utf8');
  assert.ok(!raw.includes('secret'));
  assert.equal(vault.loadClient('c1').password, 'secret'); assert.equal(vault.infoClient('c1').consent.how, 'إقرار موقّع'); assert.deepEqual(vault.listClients(), ['c1']);
  vault.saveClient('../x', 'a', 'b', { by: 'a' }); assert.ok(fs.existsSync(path.join(vault.DIR, 'clients', 'x.json')), 'المعرّف يُنظَّف فلا يخرج الملف من مجلد الموكلين'); vault.forgetClient('x');
  vault.forgetClient('c1'); assert.equal(vault.infoClient('c1'), null);
});

test('ميزان: المطابقة برقم القضية في ميزان أولاً ثم برقم الدعوى، والموكل برقم هويته في ميزان', () => {
  const st = { cases: [{ id: 'k1', no: '512/2026', mzRef: '4471/2026' }, { id: 'k2', no: '88/2026' }], clients: [{ id: 'c1', idNo: '1', mz: { idNo: '400123456' } }], hearings: [{ k: 'k1', date: '2026-10-30' }] };
  const r = match([{ caseNo: '٤٤٧١/٢٠٢٦', sessions: [{ date: '2026-10-30' }, { date: '2026-11-20' }] }, { caseNo: '999/2026', parties: [{ idNo: '400123456' }] }, { caseNo: '88/2026' }, { caseNo: '1/2020' }], st);
  assert.deepEqual(r.summary, { total: 4, matched: 2, newForClient: 1, unknown: 1, newSessions: 1 });
  assert.equal(r.matched[0].caseId, 'k1'); assert.equal(r.matched[0].by, 'رقم ميزان'); assert.equal(r.newForClient[0].clientId, 'c1');
});

test('ميزان: ارتباط درجات التقاضي — تحديث برقم الاستئناف أو ملف التنفيذ أو رقم الأساس لدى النيابة يذهب إلى القضية نفسها', () => {
  const st = { cases: [{ id: 'k1', no: '120/2024', track: [{ lvl: 'صلح', no: '120/2024' }, { lvl: 'استئناف', no: '77/2025' }, { lvl: 'تنفيذ', no: '9001/2026' }] }, { id: 'k2', no: '15/2026', prosBase: '3344/2025' }], clients: [], hearings: [] };
  const r = match([{ caseNo: '77/2025' }, { caseNo: '9001/2026' }, { caseNo: '3344/2025' }], st);
  assert.deepEqual(r.matched.map(m => m.caseId + ':' + m.by), ['k1:رقم في درجة تقاضٍ أخرى', 'k1:رقم في درجة تقاضٍ أخرى', 'k2:رقم الأساس لدى النيابة']);
});
