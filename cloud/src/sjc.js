// «مبادئ قضائية» – المكتب الفني في مجلس القضاء الأعلى (courts.gov.ps): مصدر عام بلا تسجيل دخول،
// مبادئ محكمة النقض (2021 فصاعداً) مصنّفة حسب القانون، ولكل مبدأ وثيقة PDF.
// يبحث المحامي بنفسه (طلب لكل ضغطة)؛ لا جلب آلي ولا سحب جماعي. نسخة مطابقة في cloud/src/sjc.js (ESM).
// نسخة السحابة — تُولَّد من office/lib/sjc.js
const BASE = 'https://www.courts.gov.ps/TechnicalOffice/';
const SEARCH = BASE + 'SearchJudicialPrincipl.aspx';
const UA = 'Mithaq-LawOffice/2.0 (user-initiated search)';
const unent = s => String(s || '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#43;/g, '+');
const clean = s => unent(String(s || '').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

/* قائمة التصنيفات من نموذج البحث نفسه (تتغير مع الموقع) */
function parseClasses(html) {
  const sel = String(html || '').match(/<select name="cmbMainClassification"[\s\S]*?<\/select>/); if (!sel) return [];
  return [...sel[0].matchAll(/<option[^>]*value="(\d+)"[^>]*>([^<]*)<\/option>/g)].map(m => ({ id: m[1], name: clean(m[2]) })).filter(c => c.id !== '0' && c.name);
}
function hiddenFields(html) { const f = {}; for (const m of String(html || '').matchAll(/<input type="hidden" name="([^"]+)"[^>]*value="([^"]*)"/g)) f[m[1]] = unent(m[2]); return f }
function searchBody(formHtml, f = {}) {
  return new URLSearchParams({ ...hiddenFields(formHtml), cmbMainClassification: /^\d+$/.test(f.cls || '') ? f.cls : '0', cmbSubClassification: '0', SearchText: String(f.q || '').slice(0, 200), Stype: f.inText ? 'Radio2' : 'Radio1', btnSearch: 'بحث' });
}
/* النتائج: رقم المبدأ (سنة/تسلسل) وعنوانه ورابط وثيقته */
function parseResults(html) {
  const out = [];
  for (const m of String(html || '').matchAll(/رقم المبدأ\s*:\s*([\d/]+)\s*<\/H4>\s*<H5[^>]*>\s*المبدأ\s*:\s*<a href="\s*JudicialPrincipl\.aspx\?Id=(\d+)\s*"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const no = m[1].trim(), [year] = no.split('/');
    out.push({ id: Number(m[2]), no, year, title: clean(m[3]), pdfUrl: `${BASE}JudicialPrincipl.aspx?Id=${m[2]}` });
  }
  return out;
}
const pdfUrl = id => `${BASE}JudicialPrincipl.aspx?Id=${Number(id)}`;
const idFromUrl = u => { const m = String(u || '').match(/^https?:\/\/(?:www\.)?courts\.gov\.ps\/TechnicalOffice\/JudicialPrincipl\.aspx\?Id=(\d+)/i); return m ? Number(m[1]) : 0 };

/* تحويل مبدأ إلى سجل في مكتبة الاجتهادات: المبدأ جاهز، والنص الكامل في وثيقة PDF تُرفق بالسجل */
function toRuling(p, cls) {
  const FIELDS = [[/عمل|اصابة عمل/, 'عمالي'], [/تجاري|الشركات/, 'تجاري'], [/ضريب/, 'ضريبي'], [/تأمين/, 'تأمين'], [/المالكين والمستاجرين/, 'إيجارات'], [/الاموال غير المنقولة|الأراضي|الطوابق|قسمة/, 'أراضٍ وعقارات'], [/الاداري|الخدمة المدنية|دعاوى الدولة/, 'إداري'], [/تنفيذ/, 'تنفيذ']];
  const name = cls && cls.name || '';
  return { sjcId: p.id, court: 'محكمة النقض', no: 'مبدأ ' + p.no, date: '', year: p.year, field: (FIELDS.find(([re]) => re.test(name)) || [null, 'مدني'])[1],
    principle: p.title, summary: '', keywords: [name].filter(Boolean), classifications: name, text: '',
    src: 'المكتب الفني – مجلس القضاء الأعلى', srcUrl: p.pdfUrl, pdfUrl: p.pdfUrl, extracted: true,
    notes: 'المبدأ كما نشره المكتب الفني' + (name ? ' ضمن تصنيف «' + name + '»' : '') + '. النص الكامل في الوثيقة المرفقة (PDF).' };
}

const LIMITS = { search: [20, 60e3], pdf: [10, 60e3] };
function createService({ audit, fetchImpl = (...a) => fetch(...a), timeout = 20000 } = {}) {
  const hits = new Map(); let busy = 0, classes = null;
  const limit = (key, kind) => { const [max, win] = LIMITS[kind], k = kind + '|' + key, now = Date.now(), a = (hits.get(k) || []).filter(t => now - t < win); if (a.length >= max) { hits.set(k, a); return Math.ceil((win - (now - a[0])) / 1000) } a.push(now); hits.set(k, a); return 0 };
  async function req(url, init = {}) {
    const ac = new AbortController(), t = setTimeout(() => ac.abort(), timeout);
    try { return await fetchImpl(url, { ...init, redirect: 'manual', signal: ac.signal, headers: { 'user-agent': UA, 'accept-language': 'ar', ...(init.headers || {}) } }) }
    catch (e) { throw Object.assign(new Error('تعذّر الوصول إلى موقع مجلس القضاء الأعلى. حاول لاحقاً.'), { status: 502 }) }
    finally { clearTimeout(t) }
  }
  async function form() {
    const r = await req(SEARCH); const html = await r.text();
    if (r.status !== 200 || !/cmbMainClassification/.test(html)) throw Object.assign(new Error('صفحة «مبادئ قضائية» غير متاحة الآن أو تغيّرت.'), { status: 502 });
    classes = parseClasses(html); return { html, cookie: (r.headers.get('set-cookie') || '').split(';')[0] };
  }
  return async function run(action, input, user) {
    const key = String(user && (user.id || user.username) || 'anon'), who = { user_id: user && user.id, username: user && user.username };
    if (busy >= 2) return { status: 429, body: { error: 'الخادم مشغول بطلبات أخرى. حاول بعد لحظات.' } };
    busy++;
    try {
      if (action === 'classes') { if (!classes) await form(); return { status: 200, body: { ok: true, classes } } }
      if (action === 'search') {
        const w = limit(key, 'search'); if (w) return { status: 429, body: { error: `طلبات بحث كثيرة. حاول بعد ${w} ثانية.`, retry: w } };
        const f = input || {}; if (!String(f.q || '').trim() && !/^\d+$/.test(f.cls || '')) return { status: 400, body: { error: 'اكتب كلمة البحث أو اختر تصنيفاً.' } };
        const { html, cookie } = await form();
        const r = await req(SEARCH, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', ...(cookie ? { cookie } : {}) }, body: searchBody(html, f).toString() });
        const results = parseResults(await r.text()), cls = classes.find(c => c.id === String(f.cls || ''));
        audit && audit({ ...who, action: 'sjc.search', entity: 'sjc', detail: { q: String(f.q || '').slice(0, 120), cls: cls ? cls.name : '', n: results.length } });
        return { status: 200, body: { ok: true, results, cls: cls || null, rulings: results.map(p => toRuling(p, cls)) } };
      }
      if (action === 'pdf') {
        const w = limit(key, 'pdf'); if (w) return { status: 429, body: { error: `طلبات كثيرة. حاول بعد ${w} ثانية.`, retry: w } };
        const id = Number(input && input.id); if (!Number.isSafeInteger(id) || id <= 0) return { status: 400, body: { error: 'رقم المبدأ غير صحيح.' } };
        const r = await req(pdfUrl(id)); const buf = new Uint8Array(await r.arrayBuffer());
        if (r.status !== 200 || buf.length < 5 || String.fromCharCode(...buf.slice(0, 5)) !== '%PDF-') return { status: 404, body: { error: 'لم يُعثر على وثيقة هذا المبدأ.' } };
        if (buf.length > 8 * 1024 * 1024) return { status: 413, body: { error: 'الوثيقة أكبر من 8 ميغابايت.' } };
        audit && audit({ ...who, action: 'sjc.pdf', entity: 'sjc', entity_id: String(id), detail: { bytes: buf.length } });
        return { status: 200, file: { body: buf, contentType: 'application/pdf', filename: `sjc-principle-${id}.pdf` } };
      }
      return { status: 404, body: { error: 'not found' } };
    } catch (e) {
      audit && audit({ ...who, action: 'sjc.error', entity: 'sjc', detail: { action, error: String(e.message).slice(0, 160) } });
      return { status: e.status || 502, body: { error: e.message || 'تعذّر الاتصال بالموقع' } };
    } finally { busy-- }
  };
}

export { BASE, SEARCH, parseClasses, parseResults, searchBody, hiddenFields, toRuling, pdfUrl, idFromUrl, createService };
