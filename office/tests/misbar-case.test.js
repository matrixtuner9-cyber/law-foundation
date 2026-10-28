'use strict';
const test = require('node:test'), assert = require('node:assert');
const { redactor, chunks, createCaseBrain } = require('../lib/misbar-case');
const { norm } = require('../lib/misbar');

test('redactor hides IDs, phones, IBAN, emails and long numbers, and restores them', () => {
  const R = redactor();
  const src = 'هوية الموكل 401234567 وهاتفه 0599-123-456 و +970 59 123 4567 والحساب PS92 PALS 0000 0000 0400 1234 5678 9 والبريد a.b@x.ps وبطاقة ٤٥٣٢١٢٣٤٥٦٧٨٩٠١٢ والقضية 1187/2025 بتاريخ 2025-11-03 وقيمتها 186000';
  const out = R.redact(src);
  for (const s of ['401234567', '0599-123-456', 'PALS', 'a.b@x.ps', '4532123456789012', '123 4567']) assert.ok(!out.includes(s), 'leaked ' + s + ' in ' + out);
  for (const s of ['1187/2025', '2025-11-03', '186000']) assert.ok(out.includes(s), 'over-redacted ' + s);
  assert.match(out, /\[هوية-1\]/); assert.match(out, /\[هاتف-1\]/); assert.match(out, /\[حساب-1\]/); assert.match(out, /\[بريد-1\]/);
  assert.equal(R.redact('مرة ثانية 401234567'), 'مرة ثانية [هوية-1]', 'same value → same token');
  assert.ok(R.restore('الموكل [هوية-1]').includes('401234567'));
  assert.equal(R.counts()['هوية'], 1);
});

test('chunks splits long text on paragraph boundaries within size', () => {
  const t = Array.from({ length: 30 }, (_, i) => 'فقرة رقم ' + i + ' ' + 'نص '.repeat(40)).join('\n\n');
  const c = chunks(t, 500);
  assert.ok(c.length > 5); assert.ok(c.every(x => x.length <= 500));
  assert.equal(c.join('\n').replace(/\s+/g, ''), t.replace(/\s+/g, ''));
});

function setup({ reply, getDoc } = {}) {
  const store = new Map();
  const kv = { get: (k, d = null) => store.has(k) ? JSON.parse(store.get(k)) : d, set: (k, v) => store.set(k, JSON.stringify(v)) };
  const S = { cases: [{ id: 'k1', no: '1187/2025', court: 'ct2', type: 'حقوقية · مطالبة مالية', subject: 'مطالبة بقيمة توريدات', client: 'c1', opps: ['o1'], role: 'مدعية', stage: 'بينات المدعية' }, { id: 'k2', client: 'c1' }],
    clients: [{ id: 'c1', name: 'شركة البناء' }], opponents: [{ id: 'o1', name: 'مقاول' }], hearings: [{ id: 'h1', k: 'k1', date: '2026-09-08', purpose: 'سماع الشهود', result: 'تأجيل' }],
    deadlines: [{ k: 'k1', title: 'إيداع قائمة البينات', due: '2026-10-13' }], docs: [{ id: 'd1', k: 'k1', title: 'عقد التوريد', kind: 'بينة خطية', file: '/api/media/x.pdf' }, { id: 'd9', k: 'k2', title: 'غيره' }] };
  const sent = [];
  const analyzer = { connect: async () => ({ provider: 'deepseek', usage: { in: 1, out: 1 },
    research: async () => ({ queries: ['عقد توريد'], refs: [{ id: 77, title: 'قانون المخالفات', source: 'فلسطين · تشريعات', primary: true, excerpt: 'نص' }] }),
    call: async a => { sent.push(a); return { text: reply || JSON.stringify({ findings: [{ kind: 'gap', title: 'لا سند استلام', fact: 'التسليم', evidence: ['D1.1', 'D7.1'], law: ['M77', 'M999'], conclusion: 'يحتاج إثبات', risk: 'رد الدعوى', reply: 'طلب سندات التسليم', urgency: 'high', due: '2026-10-13', owner: 'المحامي' }] }) } } }) };
  const audits = [];
  const brain = createCaseBrain({ kv, state: () => S, courts: () => [{ id: 'ct2', name: 'بداية نابلس' }], analyzer, system: 'SYS', norm, getDoc, audit: x => audits.push(x), match: require('../mizan/match').match });
  const me = { id: 'u1', username: 'lawyer1', name: 'محامٍ', cases: ['k1'] };
  const can = w => w === 'write';
  const who = { user_id: 'u1', username: 'lawyer1' };
  const call = (a, M, body, q = {}) => brain.handle(a, M, q, async () => body, me, can, who);
  return { kv, S, sent, audits, call, brain };
}

test('case brain: access, enable gate, doc text, run with redaction and trust chain, decide', async () => {
  const t = setup();
  assert.equal((await t.call('get', 'GET', null, { k: 'k2' })).status, 403, 'user not on case');
  const g = await t.call('get', 'GET', null, { k: 'k1' });
  assert.equal(g.status, 200); assert.equal(g.body.enabled, false); assert.equal(g.body.docs.length, 1);
  const blocked = await t.call('run', 'POST', { k: 'k1', task: 'brain' });
  assert.equal(blocked.status, 409); assert.equal(t.sent.length, 0, 'nothing sent before enabling');
  assert.equal((await t.call('doctext', 'POST', { k: 'k1', doc: 'd9', text: 'x'.repeat(50) })).status, 404, 'doc of another case');
  const dt = await t.call('doctext', 'POST', { k: 'k1', doc: 'd1', text: 'عقد توريد بين الطرفين. هوية المورد 401234567 وهاتفه 0599123456.\n\nالتسليم خلال شهر.', via: 'pdf' });
  assert.equal(dt.status, 200); assert.equal(dt.body.docs[0].hasText, true);
  await t.call('enable', 'POST', { k: 'k1', on: true });
  const r = await t.call('run', 'POST', { k: 'k1', task: 'brain', note: 'ركز على التسليم' });
  assert.equal(r.status, 200, JSON.stringify(r.body)); assert.equal(r.body.added, 1);
  const msg = t.sent[0].user;
  assert.ok(!msg.includes('401234567') && !msg.includes('0599123456'), 'sensitive numbers hidden');
  assert.match(msg, /\[هوية-1\]/); assert.match(msg, /\[D1\.1\]/); assert.match(msg, /\[M77\]/); assert.match(t.sent[0].system, /^SYS/);
  const f = r.body.findings[0];
  assert.equal(f.kind, 'gap'); assert.equal(f.status, 'proposed'); assert.equal(f.urgency, 'high');
  assert.deepEqual(f.evidence.map(x => x.doc), ['d1'], 'unknown doc tag dropped');
  assert.deepEqual(f.law.map(x => x.id), [77], 'unknown ref dropped'); assert.equal(f.unverified, true, 'invented ref flags unverified');
  assert.equal(r.body.sends.length, 1); assert.equal(r.body.sends[0].hidden['هوية'], 1);
  assert.ok(t.audits.some(a => a.action === 'misbar.case_run'));
  /* إعادة التشغيل تستبدل المقترح السابق؛ المعتمد يبقى */
  const d = await t.call('decide', 'POST', { k: 'k1', id: f.id, status: 'approved' });
  assert.equal(d.body.findings[0].status, 'approved'); assert.equal(d.body.findings[0].decidedBy, 'lawyer1');
  const r2 = await t.call('run', 'POST', { k: 'k1', task: 'brain' });
  assert.equal(r2.body.findings.filter(x => x.task === 'brain').length, 2);
  const r3 = await t.call('run', 'POST', { k: 'k1', task: 'brain' });
  assert.equal(r3.body.findings.filter(x => x.task === 'brain').length, 2, 'older proposed superseded'); assert.equal(r3.body.superseded, 1);
});

test('case brain: «تعديل» يحفظ ما نُفّذ ويقترح تصحيح بيان مسموح فقط', async () => {
  const t = setup({ reply: JSON.stringify({ findings: [
    { kind: 'contradiction', title: 'صفة الموكل خاطئة', reply: 'تصحيح الصفة', fix: { field: 'role', value: 'مدعى عليه' } },
    { kind: 'gap', title: 'حقل غير مسموح', fix: { field: "fee", value: "999" } }] }) });
  await t.call('enable', 'POST', { k: 'k1', on: true });
  const r = await t.call('run', 'POST', { k: 'k1', task: 'brain' });
  const [a, b] = r.body.findings.sort((x, y) => x.title.localeCompare(y.title));
  const fx = [a, b].find(x => x.title === 'صفة الموكل خاطئة'), bad = [a, b].find(x => x !== fx);
  assert.deepEqual(fx.suggest, { field: 'role', value: 'مدعى عليه' }); assert.equal(bad.suggest, undefined, 'fee is not fixable from here');
  assert.equal((await t.call('decide', 'POST', { k: 'k1', id: fx.id, status: 'fixed', note: '' })).status, 400, 'note required');
  const d = await t.call('decide', 'POST', { k: 'k1', id: fx.id, status: 'fixed', note: 'صُحّحت الصفة', actions: ['صفة الموكل: مدعي ← مدعى عليه', ''] });
  const g = d.body.findings.find(x => x.id === fx.id);
  assert.equal(g.status, 'fixed'); assert.deepEqual(g.fix.actions, ['صفة الموكل: مدعي ← مدعى عليه']); assert.equal(g.suggest.field, 'role');
  assert.ok(t.audits.some(x => x.action === 'misbar.finding_fixed'));
  /* المعالَج يصل لعقل القضية في الصياغة حتى لا يُعاد طرحه */
  await t.call('run', 'POST', { k: 'k1', task: 'draft', dtype: Object.keys(require('../lib/misbar-case').DRAFTS)[0] });
  assert.match(t.sent.at(-1).user, /\[عُولج: صُحّحت الصفة\]/);
  const u = await t.call('decide', 'POST', { k: 'k1', id: fx.id, status: 'proposed' });
  assert.equal(u.body.findings.find(x => x.id === fx.id).fix, undefined, 'undo clears the fix record');
});

test('case brain: hearing report restores hidden values and keeps citations', async () => {
  const t = setup({ reply: '## الجلسة السابقة\n- سُمع شاهدان [D1.1] بخصوص المورد [هوية-1]\n- النص [M77] و[M5]' });
  await t.call('doctext', 'POST', { k: 'k1', doc: 'd1', text: 'المورد هويته 401234567 وقد سلّم البضاعة.' });
  await t.call('enable', 'POST', { k: 'k1', on: true });
  const r = await t.call('run', 'POST', { k: 'k1', task: 'hearing' });
  assert.equal(r.status, 200);
  const f = r.body.findings[0];
  assert.equal(f.kind, 'report'); assert.ok(f.text.includes('401234567'), 'restored for the lawyer');
  assert.deepEqual(f.law.map(x => x.id), [77]); assert.equal(f.evidence[0].doc, 'd1');
});

test('case brain: read-only user cannot change anything', async () => {
  const t = setup();
  const r = await t.brain.handle('enable', 'POST', {}, async () => ({ k: 'k1', on: true }), { id: 'u2', username: 'v', cases: ['k1'] }, () => false, { username: 'v' });
  assert.equal(r.status, 403);
});

test('case brain: fact map sorts by date, demotes unproven "proven" facts, keeps contradictions', async () => {
  const reply = JSON.stringify({ facts: [
    { date: '2025-12-01', fact: 'المطالبة بالسداد', party: 'الموكل', status: 'proven', evidence: ['D1.1'], importance: 'high' },
    { date: '2025-11-03', fact: 'توقيع العقد', party: 'الموكل', status: 'proven', evidence: ['D1.1'] },
    { date: '', fact: 'تسليم البضاعة كاملة', party: 'الموكل', status: 'proven', evidence: ['D5.1'], need: 'سندات الاستلام' },
    { date: '2025-11-20', fact: 'الخصم يدعي نقص الكمية', party: 'الخصم', status: 'disputed', evidence: [] }],
    contradictions: [{ title: 'تاريخ الاستحقاق', a: 'المطالبة 1/12', b: 'الفاتورة 15/12', evidence: ['D1.1'], risk: 'عدم حلول الأجل', reply: 'كشف الحساب' }] });
  const t = setup({ reply });
  await t.call('doctext', 'POST', { k: 'k1', doc: 'd1', text: 'عقد توريد موقّع في 3/11/2025 والمطالبة في 1/12/2025.' });
  await t.call('enable', 'POST', { k: 'k1', on: true });
  const r = await t.call('run', 'POST', { k: 'k1', task: 'facts' });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const m = r.body.findings[0];
  assert.equal(m.kind, 'factmap');
  assert.deepEqual(m.facts.map(f => f.date), ['2025-11-03', '2025-11-20', '2025-12-01', '']);
  const undated = m.facts[3];
  assert.equal(undated.status, 'claimed', 'proven without real evidence is demoted'); assert.equal(undated.downgraded, true); assert.equal(undated.need, 'سندات الاستلام');
  assert.equal(m.contradictions.length, 1); assert.equal(m.contradictions[0].evidence[0].doc, 'd1');
  assert.match(m.title, /4 واقعة — 2 مثبتة · 1 بلا دليل · 1 متنازع عليها · 1 تعارض/);
});

test('case brain: drafting uses the case brain, splits review notes, and supersedes only same draft type', async () => {
  const t = setup({ reply: 'لدى محكمة بداية نابلس الموقرة\nالمدعي: [هوية-1]\n1. وقّع الطرفان العقد [D1.1] وفق [M77].\n=== ملاحظات للمراجعة ===\n- تحقق من مهلة تقديم اللائحة' });
  await t.call('doctext', 'POST', { k: 'k1', doc: 'd1', text: 'هوية المدعي 401234567 وعقد التوريد موقّع.' });
  await t.call('enable', 'POST', { k: 'k1', on: true });
  assert.equal((await t.call('run', 'POST', { k: 'k1', task: 'draft' })).status, 400, 'type required');
  const v = t.kv.get('mbc:k1'); v.findings = [{ id: 'g1', task: 'brain', kind: 'missing_evidence', status: 'approved', title: 'لا سند استلام', reply: 'طلب السندات', at: '2026-10-01' }]; t.kv.set('mbc:k1', v);
  const r = await t.call('run', 'POST', { k: 'k1', task: 'draft', dtype: 'claim' });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const d = r.body.findings.find(f => f.kind === 'draft');
  assert.equal(d.dtype, 'claim'); assert.match(d.text, /401234567/); assert.ok(!d.text.includes('ملاحظات'));
  assert.match(d.notes, /مهلة/); assert.deepEqual(d.law.map(x => x.id), [77]);
  assert.match(t.sent.at(-1).user, /خلاصة عقل القضية/); assert.match(t.sent.at(-1).user, /لا سند استلام/);
  await t.call('run', 'POST', { k: 'k1', task: 'draft', dtype: 'answer' });
  const r3 = await t.call('run', 'POST', { k: 'k1', task: 'draft', dtype: 'claim' });
  const ds = r3.body.findings.filter(f => f.kind === 'draft');
  assert.deepEqual(ds.map(x => x.dtype).sort(), ['answer', 'claim']);
  assert.ok(r3.body.drafts.evidence_list);
});

test('case brain: point-by-point rebuttal of the opponent pleading', async () => {
  const reply = JSON.stringify({ summary: 'مطالبة بقيمة بضاعة', formal: [{ defense: 'عدم الاختصاص القيمي', basis: 'القيمة', law: ['M77'], strength: 'محتمل' }],
    points: [{ n: '1', claim: 'تعاقد الطرفان', position: 'تسليم جزئي', reply: 'العقد لم يحدد الكميات [هوية-1]', law: ['M77'], evidence: ['D1.1'], needed: 'سندات الاستلام' }, { n: '2', claim: 'سُلّمت البضاعة', position: 'إنكار', reply: 'لا سند استلام', law: ['M404'] }],
    requests: [{ request: 'إلزام المدعى عليه بالمبلغ', reply: 'يُرد لعدم الإثبات', law: [] }], notes: ['تحقق من مهلة اللائحة الجوابية'] });
  const t = setup({ reply });
  await t.call('enable', 'POST', { k: 'k1', on: true });
  assert.equal((await t.call('run', 'POST', { k: 'k1', task: 'rebut', doc: 'd1' })).status, 400, 'needs read text');
  await t.call('doctext', 'POST', { k: 'k1', doc: 'd1', text: 'لائحة دعوى. 1- تعاقد الطرفان على توريد بضاعة والمدعى عليه هويته 401234567. 2- سُلّمت البضاعة كاملة ولم يدفع الثمن. الطلبات: إلزام المدعى عليه بالمبلغ.' });
  const r = await t.call('run', 'POST', { k: 'k1', task: 'rebut', doc: 'd1' });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const f = r.body.findings[0];
  assert.equal(f.kind, 'rebuttal'); assert.equal(f.doc, 'd1'); assert.equal(f.points.length, 2);
  assert.match(f.points[0].reply, /401234567/, 'hidden values restored'); assert.equal(f.points[1].unverified, true, 'unknown ref → unverified');
  assert.equal(f.formal[0].law[0].id, 77); assert.equal(f.requests.length, 1); assert.deepEqual(f.notes, ['تحقق من مهلة اللائحة الجوابية']);
  const sent = t.sent.at(-1).user; assert.match(sent, /لائحة الخصم «عقد التوريد»/); assert.ok(!sent.includes('401234567'));
});

test('case brain: change detection after analysis, today board, client message without legal research', async () => {
  const t = setup({ reply: 'عزيزي الموكل، [D1.1] عُقدت الجلسة وتأجلت إلى 2026-11-02 لسماع الشهود.\n## المطلوب\nإحضار سندات الاستلام [M77].' });
  await t.call('enable', 'POST', { k: 'k1', on: true });
  const r = await t.call('run', 'POST', { k: 'k1', task: 'client' });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const m = r.body.findings[0]; assert.equal(m.kind, 'client_msg'); assert.ok(!/\[M77\]|\[D1\.1\]|##/.test(m.text), 'no internal refs in client text');
  assert.ok(!/المراجع القانونية/.test(t.sent.at(-1).user), 'no legal research sent for client message');
  assert.deepEqual(r.body.changes, []);
  t.S.hearings.push({ id: 'h9', k: 'k1', date: '2026-11-02', purpose: 'سماع الشهود' });
  t.S.docs.push({ id: 'd5', k: 'k1', title: 'محضر الجلسة' });
  const g = await t.call('get', 'GET', null, { k: 'k1' });
  assert.ok(g.body.changes.some(x => /جلسة جديدة/.test(x)) && g.body.changes.some(x => /مستند جديد: «محضر الجلسة»/.test(x)), JSON.stringify(g.body.changes));
  const td = await t.brain.handle('today', 'GET', {}, async () => ({}), { id: 'u1', username: 'lawyer1', cases: ['k1'] }, w => w === 'write', { username: 'lawyer1' });
  assert.equal(td.status, 200); assert.equal(td.body.cases[0].id, 'k1'); assert.equal(td.body.cases[0].pending, 1); assert.ok(td.body.cases[0].changes >= 2);
});

test('mizan import: extraction restores hidden IDs for matching, normalises dates, and matches to office clients', async () => {
  const reply = JSON.stringify({ records: [
    { caseNo: '1187/2025', court: 'محكمة بداية نابلس', type: 'حقوقية', subject: 'مطالبة', status: 'بينات', parties: [{ name: 'شركة البناء', idNo: '[هوية-1]', role: 'مدعي' }], sessions: [{ date: '2026-11-02', time: '10:00', purpose: 'سماع شهود' }, { date: '14/12/2026', purpose: 'مرافعة' }, { date: 'غداً' }] },
    { caseNo: '55/2026', court: 'صلح رام الله', parties: [{ name: 'سعيد', idNo: '[هوية-2]', role: 'مدعى عليه' }] }] });
  const t = setup({ reply });
  t.S.clients.push({ id: 'c7', name: 'سعيد', idNo: '987654321' });
  const call = (a, b) => t.brain.handle(a, 'POST', {}, async () => b, { id: 'u1', username: 'lawyer1', cases: ['k1'] }, w => w === 'write', { username: 'lawyer1' });
  assert.equal((await call('mzx', { text: 'x'.repeat(60) })).status, 400, 'consent required');
  const r = await call('mzx', { text: 'رقم الدعوى 1187/2025 المدعي شركة البناء هوية 401234567 والمدعى عليه سعيد هوية 987654321 الجلسة القادمة 2/11/2026', consent: true, source: 'صورة' });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.ok(!t.sent.at(-1).user.includes('401234567'), 'IDs hidden from AI');
  const [a, b] = r.body.records;
  assert.equal(a.parties[0].idNo, '401234567', 'restored locally'); assert.deepEqual(a.sessions.map(s => s.date), ['2026-11-02', '2026-12-14']);
  const m = await call('mzmatch', { records: r.body.records });
  assert.equal(m.status, 200); assert.equal(m.body.matched[0].caseId, 'k1'); assert.equal(m.body.matched[0].newSessions.length, 2);
  assert.equal(m.body.newForClient[0].clientId, 'c7'); assert.equal(b.parties[0].idNo, '987654321');
});

test('case brain: judgment dissection verifies quotes verbatim, flags comparative rulings, hides ids', async () => {
  const body = 'حكم محكمة النقض. الوقائع: تعاقد الطرفان على توريد بضاعة وهوية المدعي 401234567 وسُلّمت البضاعة ناقصة. المبدأ: لا يُلزم المشتري بالثمن عن بضاعة لم تُسلَّم. ' + 'تفصيل '.repeat(60);
  const reply = JSON.stringify({ summary: 'نقض لعدم التسليم', court: 'محكمة النقض', facts: [{ fact: 'سُلّمت ناقصة', quote: 'سُلّمت البضاعة ناقصة' }, { fact: 'واقعة مختلقة', quote: 'عبارة ليست في الحكم أبداً' }],
    issues: [{ issue: 'الثمن عن بضاعة غير مسلّمة', holding: 'لا يلزم', reasoning: 'انتفاء المقابل', law: ['المادة 5'], quote: 'لا يُلزم المشتري بالثمن' }], principle: 'لا ثمن دون تسليم',
    use: { supports: [{ point: 'عدم التسليم', why: 'مطابق' }], distinguish: [{ point: 'الحكم أردني', why: 'غير ملزم' }] }, notes: [] });
  const t = setup({ reply, getDoc: async id => id === '55' ? { id: 55, title: 'نقض أردني 12/2020', body, source: 'الأردن · محكمة التمييز', primary: false, court: 'التمييز', case_no: '12/2020' } : null });
  await t.call('enable', 'POST', { k: 'k1', on: true });
  assert.equal((await t.call('run', 'POST', { k: 'k1', task: 'judgment' })).status, 400, 'needs a ruling');
  assert.equal((await t.call('run', 'POST', { k: 'k1', task: 'judgment', ruling: '9' })).status, 404);
  const r = await t.call('run', 'POST', { k: 'k1', task: 'judgment', ruling: '55' });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const f = r.body.findings[0];
  assert.equal(f.kind, 'judgment'); assert.equal(f.ruling, 55); assert.equal(f.comparative, true);
  assert.equal(f.facts[0].quote.found, true); assert.equal(f.facts[1].quote.found, false, 'fabricated quote flagged');
  assert.equal(f.issues[0].quote.found, true); assert.equal(f.quotesBad, 1); assert.equal(f.unverified, true);
  assert.ok(f.notes.some(n => /استئناس/.test(n)), 'comparative note added');
  const sent = t.sent.at(-1).user; assert.ok(!sent.includes('401234567'), 'ids hidden'); assert.match(sent, /الحكم المطلوب تشريحه/);
  const again = await t.call('run', 'POST', { k: 'k1', task: 'judgment', ruling: '55' });
  assert.equal(again.body.findings.filter(x => x.kind === 'judgment' && x.status === 'proposed').length, 1, 'earlier proposal superseded');
});

test('case brain: judgment dissection of a case document needs read text', async () => {
  const reply = JSON.stringify({ summary: 'ملخص', issues: [{ issue: 'م', holding: 'ق', reasoning: 'ت', law: [], quote: '' }], facts: [], use: {}, notes: [] });
  const t = setup({ reply });
  await t.call('enable', 'POST', { k: 'k1', on: true });
  assert.equal((await t.call('run', 'POST', { k: 'k1', task: 'judgment', doc: 'd1' })).status, 400);
  await t.call('doctext', 'POST', { k: 'k1', doc: 'd1', text: 'نص حكم طويل. '.repeat(40) });
  const r = await t.call('run', 'POST', { k: 'k1', task: 'judgment', doc: 'd1' });
  assert.equal(r.status, 200, JSON.stringify(r.body)); assert.equal(r.body.findings[0].doc, 'd1'); assert.equal(r.body.findings[0].comparative, false);
});

test('case brain: plain text of the case for the local engine, without enabling or redaction', async () => {
  const t = setup();
  await t.call('doctext', 'POST', { k: 'k1', doc: 'd1', text: 'عقد توريد بين الطرفين وهوية المورد 401234567 ومدة التسليم ثلاثون يوماً من تاريخ 1/3/2025.' });
  const r = await t.call('plain', 'GET', null, { k: 'k1' });
  assert.equal(r.status, 200); assert.match(r.body.text, /401234567/); assert.match(r.body.text, /==== مستند: عقد التوريد ====/);
  assert.equal(r.body.read, 1); assert.equal(t.sent.length, 0, 'nothing sent');
  assert.equal((await t.call('plain', 'GET', null, { k: 'k2' })).status, 403);
});
