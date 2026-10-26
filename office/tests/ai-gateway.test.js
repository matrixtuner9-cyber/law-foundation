// الخادم الوسيط لعقل المسبار: ترخيص موقّع بدل المفتاح، ورصيد شهري لكل مكتب، وإيقاف وإبطال — ومسار نسخة المكتب إليه
'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { pathToFileURL } = require('url');
const { DatabaseSync } = require('node:sqlite');
const L = require('../lib/license');
const OFF = path.join(__dirname, '..');
const CLOUD = [path.join(OFF, '..', 'cloud'), path.join(OFF, '..', 'cloud-deploy')].find(d => fs.existsSync(path.join(d, 'src', 'ai-gateway.js')));

const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
const PUB = publicKey.export({ type: 'spki', format: 'pem' }), PRIV = privateKey.export({ type: 'pkcs8', format: 'pem' });
const FP = 'ABCD-EFGH-JKLM-NPQR-STUV';
const lic = (o = {}) => L.sign({ v: 2, fp: FP, office: 'مكتب الاختبار', slug: 'test-law', edition: 'connected', users: 5, exp: '2099-12-31', ai: 1000, id: 'a1b2c3d4', ...o }, PRIV);
const tok = (code, fp = FP) => 'mqgw:' + fp + ':' + code;

function d1() {
  const db = new DatabaseSync(':memory:');
  const schema = path.join(CLOUD || '', 'schema', '0002_ai_gateway.sql');
  db.exec(fs.readFileSync(schema, 'utf8'));
  return { raw: db, prepare: q => { const st = db.prepare(q); return { bind: (...a) => ({ first: async () => st.get(...a) || null, run: async () => st.run(...a), all: async () => ({ results: st.all(...a) }) }) } } };
}
function fakeFetch() {
  const calls = [];
  const f = async (url, o) => { calls.push({ url, headers: o.headers, body: JSON.parse(o.body) }); return new Response(JSON.stringify({ choices: [{ message: { content: 'نص' } }], usage: { prompt_tokens: 300, completion_tokens: 200 } }), { status: 200 }) };
  f.calls = calls; return f;
}
const reqDS = (token, body = { model: 'deepseek-chat', max_tokens: 99999, messages: [] }) => new Request('https://ai.palgaz.net/deepseek/chat/completions', { method: 'POST', headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' }, body: JSON.stringify(body) });

test('الوسيط: يقبل الترخيص الصحيح ويمرّر بمفتاح المورّد ويحسب الاستهلاك ويوقف عند نفاد الرصيد', { skip: !CLOUD && 'مجلد السحابة غير موجود' }, async () => {
  const G = await import(pathToFileURL(path.join(CLOUD, 'src', 'ai-gateway.js')).href);
  const DB = d1(), env = { LICENSE_PUB: PUB, DEEPSEEK_API_KEY: 'sk-real-secret', ANTHROPIC_API_KEY: 'sk-ant-real', DB }, F = fakeFetch();
  let r = await G.handle(reqDS(tok(lic())), env, '/deepseek/chat/completions', { fetchImpl: F });
  assert.equal(r.status, 200);
  assert.equal(F.calls[0].url, 'https://api.deepseek.com/chat/completions');
  assert.equal(F.calls[0].headers.authorization, 'Bearer sk-real-secret', 'المزوّد يرى مفتاح المورّد لا الترخيص');
  assert.equal(F.calls[0].body.max_tokens, 8000, 'سقف المخرجات');
  assert.equal(r.headers.get('x-mq-office'), 'test-law');
  assert.equal(r.headers.get('x-mq-ai-used'), '500');
  r = await G.handle(reqDS(tok(lic())), env, '/deepseek/chat/completions', { fetchImpl: F }); assert.equal(r.status, 200);
  r = await G.handle(reqDS(tok(lic())), env, '/deepseek/chat/completions', { fetchImpl: F });
  assert.equal(r.status, 402, 'نفد الرصيد (1000)'); assert.match((await r.json()).error.message, /انتهى رصيد/);
  assert.equal(F.calls.length, 2, 'لا يُرسل للمزوّد بعد نفاد الرصيد');
  // رفع الرصيد من لوحة المورّد
  await G.ops(new Request('https://x/_ops/ai/office', { method: 'POST', body: JSON.stringify({ slug: 'test-law', monthly_tokens: 5000 }) }), env, '/_ops/ai/office');
  r = await G.handle(reqDS(tok(lic())), env, '/deepseek/chat/completions', { fetchImpl: F }); assert.equal(r.status, 200);
  const usage = await (await G.ops(new Request('https://x/_ops/ai/usage'), env, '/_ops/ai/usage')).json();
  assert.equal(usage[0].slug, 'test-law'); assert.equal(usage[0].requests, 3); assert.equal(usage[0].tokens_in + usage[0].tokens_out, 1500);
  // إيقاف المكتب، ثم إبطال الترخيص
  await G.ops(new Request('https://x/_ops/ai/office', { method: 'POST', body: JSON.stringify({ slug: 'test-law', status: 'suspended' }) }), env, '/_ops/ai/office');
  assert.equal((await G.handle(reqDS(tok(lic())), env, '/deepseek/chat/completions', { fetchImpl: F })).status, 402);
  await G.ops(new Request('https://x/_ops/ai/office', { method: 'POST', body: JSON.stringify({ slug: 'test-law', status: 'active', monthly_tokens: 5000 }) }), env, '/_ops/ai/office');
  await G.ops(new Request('https://x/_ops/ai/revoke', { method: 'POST', body: JSON.stringify({ id: 'a1b2c3d4' }) }), env, '/_ops/ai/revoke');
  assert.equal((await G.handle(reqDS(tok(lic())), env, '/deepseek/chat/completions', { fetchImpl: F })).status, 401);
});

test('الوسيط: يرفض الترخيص المزوّر والمنتهي ولجهاز آخر وبلا تحليل وبلا رمز والنموذج غير المسموح', { skip: !CLOUD && 'مجلد السحابة غير موجود' }, async () => {
  const G = await import(pathToFileURL(path.join(CLOUD, 'src', 'ai-gateway.js')).href);
  const env = { LICENSE_PUB: PUB, DEEPSEEK_API_KEY: 'k', DB: d1() }, F = fakeFetch(), go = (t, b) => G.handle(reqDS(t, b), env, '/deepseek/chat/completions', { fetchImpl: F });
  const good = lic(), parts = good.split('.');
  const forged = parts[0] + '.' + Buffer.from(JSON.stringify({ fp: FP, slug: 'test-law', ai: 999999999 })).toString('base64url') + '.' + parts[2];
  assert.equal((await go(tok(forged))).status, 401, 'حمولة معدّلة');
  assert.equal((await go(tok(good, 'ZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZ'))).status, 401, 'جهاز آخر');
  assert.equal((await go(tok(lic({ exp: '2020-01-01' })))).status, 401, 'منتهي');
  assert.equal((await go(tok(lic({ ai: 0 })))).status, 401, 'بلا تحليل');
  assert.equal((await go(tok(lic({ slug: '' })))).status, 401, 'بلا معرّف مكتب');
  assert.equal((await go('sk-anything')).status, 401, 'بلا رمز وسيط');
  assert.equal((await go(tok(good), { model: 'gpt-x', messages: [] })).status, 400, 'نموذج غير مسموح');
  // ترخيص من مفتاح آخر (ليس مفتاح المورّد)
  const other = crypto.generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'pem' });
  assert.equal((await go(tok(L.sign({ fp: FP, slug: 'test-law', ai: 100 }, other)))).status, 401);
  assert.equal(F.calls.length, 0, 'لم يصل أي طلب مرفوض إلى المزوّد');
});

test('نسخة المكتب: رمز الوسيط يذهب إلى الخادم الوسيط لا إلى المزوّد، والمفتاح المحلي يذهب مباشرة', async () => {
  process.env.MQ_AI_GATEWAY = 'https://ai.example.test/';
  const AI = require('../lib/misbar-ai.js'); const seen = [];
  const F = async (url, o) => { seen.push({ url, h: o.headers }); return new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }], usage: {} }), { status: 200 }) };
  await AI.callDeepSeek('mqgw:' + FP + ':' + lic(), { system: 's', user: 'u' }, F);
  await AI.callDeepSeek('sk-local', { system: 's', user: 'u' }, F);
  assert.equal(seen[0].url, 'https://ai.example.test/deepseek/chat/completions');
  assert.equal(seen[1].url, 'https://api.deepseek.com/chat/completions');
  const G = async () => new Response(JSON.stringify({ error: { message: 'انتهى رصيد عقل المسبار الواعي لهذا الشهر' } }), { status: 402 });
  await assert.rejects(AI.callDeepSeek('mqgw:' + FP + ':' + lic(), { system: 's', user: 'u' }, G), /انتهى رصيد/);
  delete process.env.MQ_AI_GATEWAY;
});
