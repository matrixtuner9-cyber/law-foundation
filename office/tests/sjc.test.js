'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const S = require('../lib/sjc.js');
const fx = n => fs.readFileSync(path.join(__dirname, 'fixtures', 'sjc', n), 'utf8');

test('مبادئ المكتب الفني: التصنيفات من النموذج، وجسم البحث، وتحليل النتائج', () => {
  const cls = S.parseClasses(fx('form.html'));
  assert.deepEqual(cls.map(c => c.id + ':' + c.name), ['7:عمل', '11:قانون التأمين', '19:القانون التجاري', '69:قانون الشركات']);
  const b = S.searchBody(fx('form.html'), { cls: '19', q: 'حساب جاري', inText: true });
  assert.equal(b.get('__VIEWSTATE'), 'VS+1'); assert.equal(b.get('cmbMainClassification'), '19'); assert.equal(b.get('SearchText'), 'حساب جاري'); assert.equal(b.get('Stype'), 'Radio2'); assert.equal(b.get('btnSearch'), 'بحث');
  assert.equal(S.searchBody(fx('form.html'), { cls: 'x' }).get('cmbMainClassification'), '0');
  const r = S.parseResults(fx('results.html'));
  assert.equal(r.length, 3); assert.deepEqual(r[0], { id: 391, no: '2022/219', year: '2022', title: 'تعتبر الاعمال التي تقدمها الشركة الطاعنة في مجال الاتصالات للمطعون ضده غير التاجر هي اعمال مختلطة', pdfUrl: 'https://www.courts.gov.ps/TechnicalOffice/JudicialPrincipl.aspx?Id=391' });
  assert.match(r[2].title, /^اغلاق الحساب الجاري\/ ترصد/);
  const x = S.toRuling(r[1], cls[2]);
  assert.equal(x.court, 'محكمة النقض'); assert.equal(x.no, 'مبدأ 2021/100'); assert.equal(x.field, 'تجاري'); assert.match(x.principle, /دفاتر التجار/); assert.deepEqual(x.keywords, ['القانون التجاري']); assert.equal(x.srcUrl, r[1].pdfUrl);
  assert.equal(S.idFromUrl('https://www.courts.gov.ps/TechnicalOffice/JudicialPrincipl.aspx?Id=391'), 391); assert.equal(S.idFromUrl('https://courts.gov.ps/x'), 0);
});

test('مبادئ المكتب الفني: الخدمة → البحث والوثيقة بحدود وسجل، ورفض ما ليس PDF', async () => {
  const log = [], audits = [];
  const res = (status, body, h = {}) => ({ status, headers: { get: k => h[k] || null }, text: async () => body, arrayBuffer: async () => (typeof body === 'string' ? new TextEncoder().encode(body) : body).buffer });
  const fetchImpl = async (url, init = {}) => { log.push((init.method || 'GET') + ' ' + url);
    if (url === S.SEARCH && init.method === 'POST') { const b = new URLSearchParams(init.body); log.push('Q=' + b.get('SearchText') + ' C=' + b.get('cmbMainClassification') + ' VS=' + b.get('__VIEWSTATE')); return res(200, fx('results.html')) }
    if (url === S.SEARCH) return res(200, fx('form.html'), { 'set-cookie': 'ASP.NET_SessionId=s1; path=/' });
    if (url.endsWith('Id=391')) return res(200, '%PDF-1.7 fake'); if (url.endsWith('Id=5')) return res(200, '<html>no</html>'); return res(404, '') };
  const svc = S.createService({ audit: a => audits.push(a), fetchImpl }), u = { id: 1, username: 'law' };
  const c = await svc('classes', {}, u); assert.equal(c.body.classes.length, 4);
  assert.equal((await svc('search', {}, u)).status, 400);
  const s = await svc('search', { cls: '19', q: 'حساب' }, u); assert.equal(s.status, 200); assert.equal(s.body.results.length, 3); assert.equal(s.body.cls.name, 'القانون التجاري'); assert.equal(s.body.rulings[0].field, 'تجاري');
  assert.ok(log.includes('Q=حساب C=19 VS=VS+1'));
  const p = await svc('pdf', { id: 391 }, u); assert.equal(p.status, 200); assert.equal(p.file.contentType, 'application/pdf'); assert.equal(p.file.filename, 'sjc-principle-391.pdf');
  assert.equal((await svc('pdf', { id: 5 }, u)).status, 404); assert.equal((await svc('pdf', { id: 'x' }, u)).status, 400);
  assert.deepEqual(audits.map(a => a.action), ['sjc.search', 'sjc.pdf']);
  for (let i = 0; i < 19; i++) await svc('search', { q: 'x' }, u); assert.equal((await svc('search', { q: 'x' }, u)).status, 429);
});
