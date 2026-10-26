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

function setup({ reply } = {}) {
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
  const brain = createCaseBrain({ kv, state: () => S, courts: () => [{ id: 'ct2', name: 'بداية نابلس' }], analyzer, system: 'SYS', norm, audit: x => audits.push(x) });
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
