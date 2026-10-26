// التفعيل عبر الإنترنت: اسم المكتب (معرّفه) + كلمة مرور التفعيل التي يعطيها المورّد → ترخيص موقّع لهذا الجهاز.
// والتجديد التلقائي: يسأل خادم المسبار دورياً، فيصل التمديد أو تغيير الباقة دون إدخال أي كود، ويُطبَّق الإبطال.
// لا يحتاج الإنترنت إلا عند التفعيل والتجديد؛ الترخيص يُتحقق منه محلياً بلا إنترنت حتى تاريخ انتهائه.
'use strict';
const os = require('os');
const SERVER = () => String(process.env.MQ_ACTIVATION_SERVER || process.env.MQ_UPDATE_SERVER || 'https://misbar.palgaz.net').replace(/\/+$/, '');
const SLUG_RE = /^[a-z][a-z0-9-]{2,30}$/;

function create({ license, version = '', fetchImpl = fetch, log = () => {} }) {
  async function post(path, body, headers = {}) {
    let r;
    try { r = await fetchImpl(SERVER() + path, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body || {}) }) }
    catch (e) { throw new Error('تعذّر الاتصال بخادم المسبار. تأكد من اتصال الإنترنت، أو استعمل التفعيل اليدوي.') }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error((j.error && j.error.message) || j.error || ('خادم التفعيل ' + r.status)), { status: r.status });
    return j;
  }
  /* التفعيل أول مرة */
  async function activate({ slug, password, device }) {
    slug = String(slug || '').trim().toLowerCase();
    if (!SLUG_RE.test(slug)) throw new Error('معرّف المكتب: كما وصلك من المورّد، أحرف لاتينية صغيرة وأرقام و-');
    if (String(password || '').trim().length < 6) throw new Error('أدخل كلمة مرور التفعيل');
    const j = await post('/activate', { slug, password: String(password).trim(), fp: license.fp, device: String(device || os.hostname()).slice(0, 80), version });
    const r = license.activate(j.code);
    if (!r.ok) throw new Error(r.error || 'الترخيص المستلم غير صالح لهذا الجهاز');
    log('license.online', { slug, exp: r.exp }); return r;
  }
  /* التجديد: يُرسل الترخيص الحالي (حتى لو انتهى) ويستلم الأحدث، أو يُبلَّغ بالإبطال */
  async function refresh() {
    const code = license.code(); if (!code) return { status: 'none' };
    const j = await post('/activate/refresh', { version }, { authorization: 'Bearer mqgw:' + license.fp + ':' + code });
    if (j.status === 'revoked') { license.revokeLocal(j.message || 'أُبطل ترخيص هذا الجهاز من المورّد'); log('license.revoked', { message: j.message }); return j }
    if (j.code && j.code !== code) { const r = license.activate(j.code); if (r.ok) log('license.renewed', { exp: r.exp }); return { ...j, renewed: r.ok } }
    return j;
  }
  return { activate, refresh, server: SERVER };
}
module.exports = { create, SLUG_RE };
