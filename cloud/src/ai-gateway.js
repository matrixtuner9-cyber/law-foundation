// الخادم الوسيط لعقل المسبار (misbar.palgaz.net): نسخ المكاتب لا تحمل مفاتيح DeepSeek/Claude إطلاقاً.
// - المكتب يرسل «رمز الوسيط»: mqgw:<بصمة الجهاز>:<كود الترخيص الموقّع MQ1...> بدل المفتاح.
// - الوسيط يتحقق من التوقيع (Ed25519 بالمفتاح العام LICENSE_PUB)، والبصمة، وتاريخ الانتهاء، ورصيد المكتب الشهري،
//   ثم يمرّر الطلب كما هو بمفتاح المورّد (أسرار Cloudflare) ويسجّل الاستهلاك لكل مكتب في القاعدة المركزية.
// - المعرّف الموحّد للمكتب: slug في الترخيص (هو نفسه عنوانه السحابي إن وُجد).

const PROVIDERS = {
  '/deepseek/chat/completions': { url: 'https://api.deepseek.com/chat/completions', key: 'DEEPSEEK_API_KEY', models: /^deepseek-(chat|reasoner)$/ },
  '/anthropic/v1/messages': { url: 'https://api.anthropic.com/v1/messages', key: 'ANTHROPIC_API_KEY', models: /^claude-[a-z0-9.-]+$/ },
};
const MAX_BODY = 600 * 1024, MAX_OUT = 8000;
const SLUG_RE = /^[a-z][a-z0-9-]{2,30}$/;

const json = (status, obj, extra = {}) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra } });
/* أخطاء بصيغة يفهمها المسبار (يعرض رسالة عربية حسب رمز الحالة) */
const fail = (status, msg) => json(status, { error: { message: msg, type: 'misbar_gateway' } });

const b64uBytes = s => { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); s += '='.repeat((4 - s.length % 4) % 4); const bin = atob(s); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a };
const pemDer = pem => b64uBytes(String(pem).replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, ''));
export const normFp = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

let keyCache = null;
async function pubKey(pem) {
  if (keyCache && keyCache.pem === pem) return keyCache.key;
  const key = await crypto.subtle.importKey('spki', pemDer(pem), { name: 'Ed25519' }, false, ['verify']);
  keyCache = { pem, key }; return key;
}

/* التحقق من كود الترخيص: MQ1.<payload>.<sig> — نفس صيغة office/lib/license.js */
export async function verifyLicense(code, fp, pem, now = new Date()) {
  const m = /^MQ1\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(String(code || '').trim());
  if (!m) return { ok: false, error: 'صيغة الترخيص غير صحيحة' };
  if (!pem) return { ok: false, error: 'الوسيط غير مجهّز بمفتاح التحقق' };
  let good = false;
  try { good = await crypto.subtle.verify('Ed25519', await pubKey(pem), b64uBytes(m[2]), new TextEncoder().encode('MQ1.' + m[1])) } catch (e) { good = false }
  if (!good) return { ok: false, error: 'الترخيص غير صالح' };
  let p; try { p = JSON.parse(new TextDecoder().decode(b64uBytes(m[1]))) } catch (e) { return { ok: false, error: 'الترخيص تالف' } }
  if (normFp(p.fp) !== normFp(fp)) return { ok: false, error: 'الترخيص صادر لجهاز آخر' };
  if (p.exp && now.toISOString().slice(0, 10) > p.exp) return { ok: false, error: 'انتهت مدة الترخيص في ' + p.exp };
  if (!SLUG_RE.test(String(p.slug || ''))) return { ok: false, error: 'الترخيص بلا معرّف مكتب' };
  if (!(Number(p.ai) > 0)) return { ok: false, error: 'هذا الترخيص لا يشمل عقل المسبار الواعي' };
  return { ok: true, payload: p };
}

/* الرمز: mqgw:<fp>:<code> (في Authorization: Bearer لـ DeepSeek، أو x-api-key لـ Claude) */
export function parseToken(req) {
  const raw = String(req.headers.get('x-api-key') || req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  const m = /^mqgw:([A-Za-z0-9-]{20,29}):(MQ1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.exec(raw);
  return m ? { fp: m[1], code: m[2] } : null;
}

const month = now => now.toISOString().slice(0, 7);

export async function handle(req, env, path, { fetchImpl = fetch, now = new Date() } = {}) {
  if (path === '/health') return json(200, { ok: true, service: 'misbar-ai-gateway' });
  const prov = PROVIDERS[path];
  if (!prov) return fail(404, 'غير موجود');
  if (req.method !== 'POST') return fail(405, 'POST فقط');
  const tok = parseToken(req); if (!tok) return fail(401, 'يلزم ترخيص المسبار لاستعمال عقل المسبار الواعي');
  const lic = await verifyLicense(tok.code, tok.fp, env.LICENSE_PUB, now);
  if (!lic.ok) return fail(401, lic.error);
  const p = lic.payload, slug = p.slug;
  // إيقاف أو تعديل رصيد مكتب من لوحة المورّد، وإبطال ترخيص بعينه
  if (p.id && await env.DB.prepare('SELECT 1 FROM ai_revoked WHERE id = ?').bind(String(p.id)).first()) return fail(401, 'أُبطل هذا الترخيص؛ تواصل مع المورّد');
  const o = await env.DB.prepare('SELECT status, monthly_tokens FROM ai_offices WHERE slug = ?').bind(slug).first();
  if (o && o.status === 'suspended') return fail(402, 'خدمة عقل المسبار الواعي موقوفة لهذا المكتب؛ تواصل مع المورّد');
  const limit = Number(o && o.monthly_tokens > 0 ? o.monthly_tokens : p.ai), mon = month(now);
  const u = await env.DB.prepare('SELECT tokens_in, tokens_out FROM ai_usage WHERE slug = ? AND month = ?').bind(slug, mon).first();
  const used = u ? Number(u.tokens_in || 0) + Number(u.tokens_out || 0) : 0;
  if (used >= limit) return fail(402, `انتهى رصيد عقل المسبار الواعي لهذا الشهر (${limit.toLocaleString('en')} وحدة)؛ يتجدد أول الشهر أو تواصل مع المورّد`, { });
  // الطلب: حجم محدود، ونموذج مسموح، وسقف للمخرجات
  const text = await req.text(); if (text.length > MAX_BODY) return fail(413, 'الطلب أكبر من المسموح');
  let body; try { body = JSON.parse(text) } catch (e) { return fail(400, 'طلب غير صالح') }
  if (!prov.models.test(String(body.model || ''))) return fail(400, 'نموذج غير مسموح');
  if (!(body.max_tokens > 0) || body.max_tokens > MAX_OUT) body.max_tokens = MAX_OUT;
  body.stream = false;
  const key = env[prov.key]; if (!key) return fail(503, 'الوسيط غير مجهّز بمفتاح المزوّد');
  const headers = { 'content-type': 'application/json' };
  if (prov.key === 'ANTHROPIC_API_KEY') { headers['x-api-key'] = key; headers['anthropic-version'] = req.headers.get('anthropic-version') || '2023-06-01' } else headers.authorization = 'Bearer ' + key;
  const r = await fetchImpl(prov.url, { method: 'POST', headers, body: JSON.stringify(body) });
  const out = await r.text();
  let tin = 0, tout = 0;
  try { const j = JSON.parse(out); const us = j.usage || {}; tin = Number(us.prompt_tokens || us.input_tokens || 0); tout = Number(us.completion_tokens || us.output_tokens || 0) } catch (e) {}
  await env.DB.prepare(`INSERT INTO ai_usage(slug, month, requests, tokens_in, tokens_out, updated_at) VALUES(?, ?, 1, ?, ?, datetime('now'))
    ON CONFLICT(slug, month) DO UPDATE SET requests = requests + 1, tokens_in = tokens_in + excluded.tokens_in, tokens_out = tokens_out + excluded.tokens_out, updated_at = excluded.updated_at`).bind(slug, mon, tin, tout).run();
  return new Response(out, { status: r.status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-mq-ai-used': String(used + tin + tout), 'x-mq-ai-limit': String(limit), 'x-mq-office': slug } });
}

/* لوحة المورّد (عبر /_ops المحمية برمز OPS_TOKEN) */
export async function ops(req, env, p) {
  if (p === '/_ops/ai/usage' && req.method === 'GET') {
    const mon = new URL(req.url).searchParams.get('month') || month(new Date());
    return json(200, (await env.DB.prepare('SELECT u.*, o.status, o.monthly_tokens FROM ai_usage u LEFT JOIN ai_offices o ON o.slug = u.slug WHERE u.month = ? ORDER BY (u.tokens_in + u.tokens_out) DESC').bind(mon).all()).results);
  }
  if (p === '/_ops/ai/office' && req.method === 'POST') {
    const b = await req.json().catch(() => ({})), slug = String(b.slug || '');
    if (!SLUG_RE.test(slug)) return json(400, { error: 'slug' });
    const st = ['active', 'suspended'].includes(b.status) ? b.status : 'active', mt = Math.max(0, Math.round(+b.monthly_tokens || 0)) || null;
    await env.DB.prepare('INSERT INTO ai_offices(slug, status, monthly_tokens, note) VALUES(?, ?, ?, ?) ON CONFLICT(slug) DO UPDATE SET status = excluded.status, monthly_tokens = excluded.monthly_tokens, note = excluded.note').bind(slug, st, mt, String(b.note || '').slice(0, 200)).run();
    return json(200, { ok: true, slug, status: st, monthly_tokens: mt });
  }
  if (p === '/_ops/ai/revoke' && req.method === 'POST') {
    const b = await req.json().catch(() => ({})); if (!/^[a-f0-9]{8}$/.test(String(b.id || ''))) return json(400, { error: 'id' });
    await env.DB.prepare("INSERT OR IGNORE INTO ai_revoked(id, at) VALUES(?, datetime('now'))").bind(b.id).run();
    return json(200, { ok: true, revoked: b.id });
  }
  return null;
}
