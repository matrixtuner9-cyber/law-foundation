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
    const name = b.tool_choice.name;
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
  assert.equal((await fetch(BASE + '/aidraft.js', { headers: { cookie: admin } })).status, 200);
  assert.match(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), /aidraft\.js/);
});
