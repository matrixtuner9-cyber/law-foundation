// اختبارات الصياغة بالصوت: إخفاء الهوية قبل الإرسال، المراجع من مصادر موثقة فقط، المفتاح لا يُعاد، والصلاحيات
'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const AI = require('../lib/ai-draft');

const CASE = { no: '2214/2026', court: 'صلح نابلس', type: 'عمالية', subject: 'مطالبة بحقوق عمالية', role: 'مدعى عليه', client: 'شركة الزيتون للتجارة العامة', opponents: ['أحمد محمود الشكعة'], lawyer: 'سامر عبد الله' };
const DICT = 'موكلنا شركة الزيتون للتجارة العامة دفع لأحمد محمود الشكعة كامل أجوره وإجازته السنوية، وهاتفه 0599123456، ونطلب رد الدعوى.';

function fakeClaude(captured, draftInput) {
  return async (url, opt) => {
    const b = JSON.parse(opt.body); captured.push(b);
    assert.equal(opt.headers['x-api-key'], 'sk-ant-test-key-1234567890abcdef');
    const name = b.tools[0].name;
    const input = name === 'plan_research' ? { queries: ['قانون العمل'], keywords: ['الإجازة', 'الأجور'] } : draftInput;
    return { ok: true, status: 200, json: async () => ({ content: [{ type: 'tool_use', name, input }] }) };
  };
}
const LAWS = { search: () => ({ items: [{ id: 'L1' }] }), get: () => ({ title: 'قانون العمل رقم (7) لسنة 2000', ref: '7/2000', content: 'المادة (1): تعاريف\nالمادة (74): يستحق العامل إجازة سنوية مدفوعة الأجر\nالمادة (9): أحكام أخرى' }) };

test('إخفاء الهوية: لا تصل الأسماء والهواتف لخدمة الصياغة، وتعود في الناتج', async () => {
  const sent = [];
  const draftInput = { title: 'لائحة جوابية', sections: [{ heading: 'الوقائع', paragraphs: ['دفع [الموكل] لـ[الخصم 1] أجوره كاملة استناداً إلى [R1]، وهاتفه [هاتف 1].', 'وتنص المادة 999 [R7] على…'] }],
    references: [{ id: 'R1', used_for: 'الإجازة السنوية' }, { id: 'R7', used_for: 'مختلق' }], unverified: [{ need: 'نص يحدد مدة التقادم' }] };
  const d = AI.createDrafter({ getKey: () => 'sk-ant-test-key-1234567890abcdef', laws: LAWS, fetchImpl: fakeClaude(sent, draftInput) });
  const r = await d({ docType: 'لائحة جوابية', dictation: DICT, case: CASE, web: false }, { id: 'u1', username: 'l1' }, { rulings: [] });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const wire = JSON.stringify(sent);
  for (const secret of ['شركة الزيتون', 'الشكعة', '0599123456', 'سامر']) assert.ok(!wire.includes(secret), 'تسرّب: ' + secret);
  const p = r.body.sections[0].paragraphs;
  assert.match(p[0], /شركة الزيتون للتجارة العامة/); assert.match(p[0], /أحمد محمود الشكعة/); assert.match(p[0], /0599123456/);
  assert.match(p[0], /\[R1\]/); assert.doesNotMatch(p[1], /\[R7\]/); assert.match(p[1], /يحتاج تحقق/);
  assert.equal(r.body.references.length, 1); assert.equal(r.body.references[0].title, 'قانون العمل رقم (7) لسنة 2000'); assert.deepEqual(r.body.references[0].arts, ['المادة (74)']);
  assert.deepEqual(r.body.unverified, ['نص يحدد مدة التقادم']);
  /* المراجع المتاحة أُرسلت بنصها في طلب الصياغة */
  assert.match(JSON.stringify(sent[1]), /المادة \(74\)/);
});
test('لائحة الخصم: الاستخراج من نص بعد إخفاء الأسماء، والرد بنداً بنداً يصل للصياغة', async () => {
  const sent = [];
  const fetchImpl = async (u, opt) => { const b = JSON.parse(opt.body); sent.push(b); const name = b.tools[0].name;
    const input = name === 'extract_pleading' ? { doc_type: 'لائحة دعوى', claims: [{ text: 'عمل [الخصم 1] لدى [الموكل] براتب 3500' }], requests: ['الإلزام بالدفع'] }
      : name === 'plan_research' ? { queries: [], keywords: [] } : { title: 'لائحة جوابية', sections: [{ heading: 'الرد', paragraphs: ['ينكر [الموكل] ذلك.'] }], references: [], unverified: [] };
    return { ok: true, status: 200, json: async () => ({ content: [{ type: 'tool_use', name, input }] }) } };
  const ex = AI.createExtractor({ getKey: () => 'k', fetchImpl });
  const r = await ex({ text: 'لائحة دعوى: عمل أحمد محمود الشكعة لدى شركة الزيتون للتجارة العامة براتب 3500 شيكل منذ 2015 وحتى نهاية 2024، وفُصل تعسفياً.', case: CASE }, { id: 'x' });
  assert.equal(r.status, 200); assert.ok(!JSON.stringify(sent[0]).includes('الشكعة'));
  assert.match(r.body.claims[0], /أحمد محمود الشكعة/); assert.match(r.body.claims[0], /شركة الزيتون/);
  const d = AI.createDrafter({ getKey: () => 'k', fetchImpl });
  const r2 = await d({ docType: 'لائحة جوابية', dictation: '', case: CASE, web: false, claims: [{ text: r.body.claims[0], response: 'الراتب 3000 بموجب الكشوف' }] }, { id: 'y' });
  assert.equal(r2.status, 200, JSON.stringify(r2.body));
  const draftReq = JSON.stringify(sent[sent.length - 1]);
  assert.match(draftReq, /رد المحامي: الراتب 3000/); assert.ok(!draftReq.includes('الشكعة')); assert.match(draftReq, /الدفوع الشكلية أولاً/);
});
test('بلا مفتاح: رسالة واضحة، وإملاء قصير يُرفض قبل أي اتصال', async () => {
  const d0 = AI.createDrafter({ getKey: () => '', fetchImpl: () => { throw new Error('no call') } });
  const r0 = await d0({ docType: 'x', dictation: DICT }, { id: 'u' }); assert.equal(r0.status, 400); assert.ok(r0.body.needKey);
  const d1 = AI.createDrafter({ getKey: () => 'sk-ant-x', fetchImpl: () => { throw new Error('no call') } });
  assert.equal((await d1({ docType: 'لائحة', dictation: 'قصير' }, { id: 'u' })).status, 400);
});
test('مفتاح مرفوض لدى المزوّد يُبلَّغ بوضوح', async () => {
  const d = AI.createDrafter({ getKey: () => 'sk-ant-bad', fetchImpl: async () => ({ ok: false, status: 401, json: async () => ({}) }) });
  const r = await d({ docType: 'لائحة جوابية', dictation: DICT, case: CASE, web: false }, { id: 'u3' }); assert.equal(r.status, 400); assert.match(r.body.error, /مفتاح/);
});

test('مساعد القضية: الملخص لا يبحث عن مراجع، والسؤال يُجاب من المراجع فقط، والأسماء مخفية', async () => {
  const sent = [];
  const fetchImpl = async (u, opt) => { const b = JSON.parse(opt.body); sent.push(b); const name = b.tools[0].name;
    const input = name === 'plan_research' ? { queries: ['قانون العمل'], keywords: ['الإجازة'] } : { sections: [{ heading: 'الجواب', items: ['يستحق [الخصم 1] إجازة [R1].', 'والمادة 500 [R9].'] }], unverified: ['مدة التقادم'] };
    return { ok: true, status: 200, json: async () => ({ content: [{ type: 'tool_use', name, input }] }) } };
  const as = AI.createAssistant({ getKey: () => 'k', laws: LAWS, fetchImpl });
  const b = await as({ mode: 'brief', case: CASE, history: 'الجلسات:\n- 2026-10-14: تقديم لائحة جوابية من شركة الزيتون للتجارة العامة' }, { id: 'a1' });
  assert.equal(b.status, 200, JSON.stringify(b.body)); assert.equal(sent.length, 1, 'الملخص طلب واحد بلا بحث'); assert.ok(!JSON.stringify(sent).includes('شركة الزيتون'));
  sent.length = 0;
  const q = await as({ mode: 'question', question: 'هل يستحق أحمد محمود الشكعة بدل الإجازة السنوية؟', case: CASE, web: false }, { id: 'a1' });
  assert.equal(q.status, 200); assert.equal(sent.length, 2); assert.ok(!JSON.stringify(sent).includes('الشكعة'));
  assert.match(JSON.stringify(sent[1]), /المادة \(74\)/);
  const it = q.body.sections[0].items; assert.match(it[0], /أحمد محمود الشكعة/); assert.match(it[0], /\[R1\]/); assert.match(it[1], /يحتاج تحقق/);
  assert.equal(q.body.references.length, 1); assert.match(q.body.references[0].text, /إجازة سنوية/);
  assert.equal((await as({ mode: 'question', question: 'قصير' }, { id: 'a1' })).status, 400);
  assert.equal((await as({ mode: 'hack' }, { id: 'a1' })).status, 400);
});

test('مراجعة عقد وتحليل مستند وأحكام مشابهة: النص تُخفى أسماؤه، والملف يُرسل كمستند، والأحكام من المكتبة فقط', async () => {
  const sent = [];
  const fetchImpl = async (u, opt) => { const b = JSON.parse(opt.body); sent.push(b); const name = b.tools[0].name;
    const input = name === 'plan_research' ? { queries: [], keywords: ['فصل تعسفي'] } : { sections: [{ heading: 'نقض 12/2019', items: ['المبدأ [R1].'] }] };
    return { ok: true, status: 200, json: async () => ({ content: [{ type: 'tool_use', name, input }] }) } };
  let webCalls = 0; const lawSearch = async () => { webCalls++; return { status: 500, body: {} } };
  const as = AI.createAssistant({ getKey: () => 'k', fetchImpl, lawSearch });
  assert.equal((await as({ mode: 'contract', case: CASE }, { id: 'r1' })).status, 400, 'بلا مستند');
  const c = await as({ mode: 'contract', case: CASE, web: false, text: 'عقد عمل بين شركة الزيتون للتجارة العامة والسيد أحمد محمود الشكعة براتب شهري قدره 3000 شيكل لمدة سنة قابلة للتجديد.' }, { id: 'r1' });
  assert.equal(c.status, 200, JSON.stringify(c.body)); assert.ok(!JSON.stringify(sent).includes('الشكعة')); assert.match(JSON.stringify(sent[1]), /البنود الناقصة|بنود ناقصة/);
  sent.length = 0;
  const o = await as({ mode: 'opponent', case: CASE, web: false, file: { name: 'x.pdf', type: 'application/pdf', data: 'JVBERi0x' } }, { id: 'r1' });
  assert.equal(o.status, 200); assert.equal(sent[1].messages[0].content[0].type, 'document');
  assert.equal((await as({ mode: 'opponent', case: CASE, file: { name: 'x.exe', type: 'application/x-msdownload', data: 'AA' } }, { id: 'r1' })).status, 400);
  sent.length = 0;
  const rulings = Array.from({ length: 10 }, (_, i) => ({ court: 'نقض', no: `${i}/2019`, principle: 'الفصل التعسفي يوجب التعويض', summary: 'ملخص ' + i }));
  assert.equal((await as({ mode: 'similar', case: CASE }, { id: 'r1' }, { rulings: [] })).status, 400, 'مكتبة فارغة: لا اتصال');
  const r = await as({ mode: 'similar', case: CASE }, { id: 'r1' }, { rulings });
  assert.equal(r.status, 200); assert.equal(webCalls, 0, 'الأحكام المشابهة من المكتبة فقط');
  assert.equal((JSON.stringify(sent[1]).match(/حكم قضائي: نقض/g) || []).length, 8); assert.equal(r.body.references[0].kind, 'ruling');
});

test('رسالة للموكل ومحضر اجتماع وترجمة: بلا بحث عن مراجع، والإملاء القصير يُرفض، واللغة تصل', async () => {
  const sent = [];
  const fetchImpl = async (u, opt) => { const b = JSON.parse(opt.body); sent.push(b); const name = b.tools[0].name;
    return { ok: true, status: 200, json: async () => ({ content: [{ type: 'tool_use', name, input: { sections: [{ heading: '', items: ['Dear [الموكل], the hearing was adjourned.'] }] } }] }) } };
  const as = AI.createAssistant({ getKey: () => 'k', fetchImpl });
  assert.equal((await as({ mode: 'minutes', question: 'قصير', case: CASE }, { id: 'm1' })).status, 400);
  const m = await as({ mode: 'minutes', question: 'حضر الموكل شركة الزيتون للتجارة العامة واتفقنا على تقديم كشوف الرواتب خلال أسبوع', case: CASE }, { id: 'm1' });
  assert.equal(m.status, 200); assert.equal(sent.length, 1); assert.match(JSON.stringify(sent[0]), /ملاحظات الاجتماع كما أملاها/); assert.ok(!JSON.stringify(sent).includes('الزيتون'));
  sent.length = 0;
  const t = await as({ mode: 'translate', lang: 'he', text: 'تُعتبر هذه الوكالة سارية المفعول.', case: CASE }, { id: 'm1' });
  assert.equal(t.status, 200); assert.equal(t.body.lang, 'he'); assert.match(JSON.stringify(sent[0]), /إلى العبرية/); assert.equal(sent.length, 1);
  assert.match(t.body.sections[0].items[0], /شركة الزيتون للتجارة العامة/);
  const c = await as({ mode: 'client_msg', case: CASE, history: 'الجلسات:\n- 2026-11-02: سماع الشهود' }, { id: 'm1' });
  assert.equal(c.status, 200);
});

test('أحكام النقض والاستئناف المنشورة: بحث حي بدل المكتبة الفارغة، والمقتطفات من نص الحكم، ولا اتصال بدون web', async () => {
  const sent = [], calls = [];
  const fetchImpl = async (u, opt) => { const b = JSON.parse(opt.body); sent.push(b); const name = b.tools[0].name;
    const input = name === 'plan_research' ? { queries: ['قانون التجارة'], keywords: ['شيك', 'كفالة'], ruling_queries: ['شيك بدون رصيد كفالة'] } : { sections: [{ heading: 'نقض حقوق 10/2019', items: ['المبدأ [R1].', 'حكم مختلق [R5].'] }], unverified: [] };
    return { ok: true, status: 200, json: async () => ({ content: [{ type: 'tool_use', name, input }] }) } };
  const rulingSearch = async (q, user, max) => { calls.push([q, max]); return [{ id: 7001, title: 'محكمة النقض حقوق 10/2019', date: '2019-05-01', url: 'https://maqam.najah.edu/judgments/7001/', text: 'مقدمة لا علاقة لها بالموضوع وهي فقرة طويلة بما يكفي لتتجاوز الحد الأدنى.\n\nإن الكفالة في الشيك لا تنشئ التزاماً مستقلاً على الكفيل ما لم يوقّع صراحة على صفحة الشيك وفق ما استقر عليه اجتهاد هذه المحكمة.\n\nوعليه تقرر المحكمة قبول الطعن شكلاً.' }] };
  const as = AI.createAssistant({ getKey: () => 'k', fetchImpl, rulingSearch });
  const r = await as({ mode: 'similar', case: CASE }, { id: 'w1' }, { rulings: [] });
  assert.equal(r.status, 200, JSON.stringify(r.body)); assert.deepEqual(calls[0], ['شيك بدون رصيد كفالة', 5]);
  assert.match(JSON.stringify(sent[1]), /الكفالة في الشيك لا تنشئ/); assert.ok(!JSON.stringify(sent[1]).includes('مقدمة لا علاقة'), 'المقتطف الأقرب للمسألة فقط');
  assert.equal(r.body.references.length, 1); assert.equal(r.body.references[0].url, 'https://maqam.najah.edu/judgments/7001/'); assert.equal(r.body.references[0].origin, 'web');
  assert.match(r.body.sections[0].items[1], /يحتاج تحقق/);
  const off = await as({ mode: 'similar', case: CASE, web: false }, { id: 'w1' }, { rulings: [] }); assert.equal(off.status, 400);
  const q = await as({ mode: 'question', question: 'هل تلزم الكفالة في الشيك الكفيل؟', case: CASE, web: false }, { id: 'w1' }, { rulings: [] }); assert.equal(q.status, 200); assert.equal(calls.length, 1, 'web=false: لا بحث حي');
  const down = AI.createAssistant({ getKey: () => 'k', fetchImpl, rulingSearch: async () => { throw new Error('502') } });
  assert.equal((await down({ mode: 'question', question: 'هل تلزم الكفالة في الشيك الكفيل؟', case: CASE }, { id: 'w2' })).status, 200, 'تعطل المصدر لا يوقف المساعد');
});

/* ── مسارات الخادم ── */
const ROOT = path.resolve(__dirname, '..'), TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mq-ai-'));
const PORT = 22000 + Math.floor(Math.random() * 1000), BASE = `http://127.0.0.1:${PORT}`;
let srv, admin = '', lawyer = '';
const req = async (p, cookie, { method = 'GET', body } = {}) => { const r = await fetch(BASE + p, { method, headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), cookie }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: r.status, j: await r.json().catch(() => ({})), r } };
before(async () => {
  srv = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, ANTHROPIC_API_KEY: '', PORT: String(PORT), MQ_DATA: path.join(TMP, 'data'), MQ_BACKUP: 'off' }, stdio: ['ignore', 'pipe', 'pipe'] });
  for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE + '/api/health')).ok) break } catch (e) {} await new Promise(r => setTimeout(r, 200)) }
  const s = await req('/api/auth/setup', '', { method: 'POST', body: { username: 'admin', name: 'المدير', password: 'Test12345' } }); admin = (s.r.headers.get('set-cookie') || '').split(';')[0];
  await req('/api/users', admin, { method: 'POST', body: { name: 'محامٍ', username: 'lawyer1', role: 'lawyer', password: 'Lawyer123' } });
  lawyer = ((await req('/api/auth/login', '', { method: 'POST', body: { username: 'lawyer1', password: 'Lawyer123' } })).r.headers.get('set-cookie') || '').split(';')[0];
});
after(async () => { if (srv && srv.exitCode === null) { const g = new Promise(r => srv.once('exit', r)); srv.kill(); await g } try { fs.rmSync(TMP, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch (e) {} });

test('المفتاح: المدير فقط يضبطه، ولا يُعاد أبداً (آخر 4 خانات فقط)، ومسجّل في التدقيق', async () => {
  assert.equal((await req('/api/admin/ai/status', lawyer)).j.configured, false);
  assert.equal((await req('/api/admin/ai/key', lawyer, { method: 'POST', body: { key: 'sk-ant-abcdefghijklmnopqrstuvwxyz' } })).status, 403);
  assert.equal((await req('/api/admin/ai/key', admin, { method: 'POST', body: { key: 'not-a-key' } })).status, 400);
  const k = 'sk-ant-api03-abcdefghijklmnopqrstuvwxyzWXYZ';
  assert.equal((await req('/api/admin/ai/key', admin, { method: 'POST', body: { key: k } })).status, 200);
  const st = await req('/api/admin/ai/status', lawyer);
  assert.equal(st.j.configured, true); assert.equal(st.j.last4, 'WXYZ'); assert.ok(!JSON.stringify(st.j).includes('abcdefghij'));
  const a = JSON.stringify((await req('/api/audit?limit=50', admin)).j); assert.ok(a.includes('ai.key_set')); assert.ok(!a.includes('abcdefghij'));
});
test('الصياغة تتطلب صلاحية الكتابة، وملف الواجهة مسجّل', async () => {
  await req('/api/users', admin, { method: 'POST', body: { name: 'مطلع', username: 'viewer1', role: 'viewer', password: 'Viewer123' } });
  const v = ((await req('/api/auth/login', '', { method: 'POST', body: { username: 'viewer1', password: 'Viewer123' } })).r.headers.get('set-cookie') || '').split(';')[0];
  assert.equal((await req('/api/admin/ai/draft', v, { method: 'POST', body: { docType: 'لائحة', dictation: DICT } })).status, 403);
  assert.equal((await req('/api/admin/ai/assist', v, { method: 'POST', body: { mode: 'brief' } })).status, 403);
  assert.equal((await fetch(BASE + '/aidraft.js', { headers: { cookie: admin } })).status, 200);
  for (const f of ['calc.js', 'calc-engine.js']) assert.equal((await fetch(BASE + '/' + f, { headers: { cookie: admin } })).status, 200, f);
  assert.equal((await req('/api/admin/ai/calc', v, { method: 'POST', body: { kind: 'labour', text: 'x'.repeat(40) } })).status, 403);
  assert.match(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), /aidraft\.js[\s\S]*calc-engine\.js[\s\S]*calc\.js/);
});

test('النماذج التي لا تدعم إجبار الأداة: يُرسل tool_choice auto مع تعليمة صريحة، ويُعاد الطلب مرة إذا أجاب النموذج نصاً', async () => {
  const sent = []; let n = 0;
  const fetchImpl = async (u, opt) => { const b = JSON.parse(opt.body); sent.push(b); n++;
    const tool = b.tools[0].name;
    if (n === 1) return new Response(JSON.stringify({ content: [{ type: 'text', text: 'سأجيب هنا نصاً' }] }), { status: 200 });
    return new Response(JSON.stringify({ content: [{ type: 'tool_use', name: tool, input: { kind: 'labour', fields: { monthlyWage: 3000 }, missing: [] } }] }), { status: 200 }) };
  const ex = AI.createCalcExtractor({ getKey: async () => 'sk-ant-test', fetchImpl });
  const r = await ex({ kind: 'labour', text: 'عمل موكلنا منذ 2016 براتب 3000 شيكل وفُصل بلا إشعار' }, { id: 1 });
  assert.equal(r.status, 200); assert.equal(r.body.fields.monthlyWage, 3000);
  assert.equal(sent.length, 2); assert.deepEqual(sent[0].tool_choice, { type: 'auto' }); assert.match(sent[0].system, /أجب حصراً باستدعاء الأداة «extract_calc»/);
  assert.equal(sent[1].messages.length, 3); assert.equal(sent[1].messages[2].role, 'user'); assert.match(sent[1].messages[2].content, /استدعِ الأداة «extract_calc»/);
});

test('استخراج المبدأ من نص حكم: مبدأ وملخص وكلمات ونتيجة ومواد، ويرفض النص القصير ويطلب المفتاح', async () => {
  const sent = [];
  const fetchImpl = async (u, opt) => { const b = JSON.parse(opt.body); sent.push(b); return new Response(JSON.stringify({ content: [{ type: 'tool_use', name: 'extract_ruling', input: { principle: 'عقد العمل محدد المدة يتحول إلى غير محدد المدة إذا تضمن شرط الإنهاء بالإرادة المنفردة.', summary: 'طعن بالنقض على حكم استئنافي…', keywords: ['عقد عمل', 'محدد المدة', ' '], outcome: 'رد الطعن', articles: ['المادة 24 من قانون العمل رقم 7 لسنة 2000'] } }] }), { status: 200 }) };
  const ex = AI.createRulingExtractor({ getKey: async () => 'sk-ant-test', fetchImpl });
  assert.equal((await AI.createRulingExtractor({ getKey: async () => '', fetchImpl })({ text: 'x'.repeat(300) }, { id: 1 })).body.needKey, true);
  assert.equal((await ex({ text: 'قصير' }, { id: 1 })).status, 400);
  const r = await ex({ text: 'تقدم الطاعن بهذا الطعن '.repeat(30), court: 'محكمة النقض', no: 'دعوى 520/2016' }, { id: 1 });
  assert.equal(r.status, 200); assert.match(r.body.principle, /^عقد العمل/); assert.deepEqual(r.body.keywords, ['عقد عمل', 'محدد المدة']); assert.equal(r.body.outcome, 'رد الطعن'); assert.equal(r.body.articles.length, 1);
  assert.equal(sent[0].tools[0].name, 'extract_ruling'); assert.match(sent[0].messages[0].content, /المحكمة: محكمة النقض · رقم الحكم: دعوى 520\/2016/);
});
