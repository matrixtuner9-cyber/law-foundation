// «المقتفي» (معهد الحقوق – جامعة بيرزيت): قاعدة الأحكام النظامية. الوصول مقصور على المشتركين،
// فيُدخل مدير المكتب بيانات اشتراك المكتب في الإعدادات (تُحفظ على الخادم ولا تُعرض).
// يبحث المحامي بنفسه (طلب لكل ضغطة)، لا جلب آلي ولا مجدول ولا سحب جماعي. حدود طلبات لكل مستخدم كما في «البحث في الأحكام».
// هذا الملف: محلّلات الصفحات (دوال صِرفة تُختبر على عيّنات) + عميل الجلسة. نسخة مطابقة في cloud/src/muqtafi.js (ESM).
'use strict';
const BASE = 'http://muqtafi.birzeit.edu';
const abs = u => !u ? '' : /^https?:/.test(u) ? u : BASE + (u.startsWith('/') ? '' : '/courtjudgments/') + u;
const unent = s => String(s || '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const strip = h => unent(String(h || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|tr|li|h\d)>/gi, '\n').replace(/<[^>]+>/g, '')).replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
const span = (h, id) => { const m = h.match(new RegExp('id="[^"]*' + id + '"[^>]*>([^<]*)<')); return m ? unent(m[1]).trim() : '' };
const toIso = d => { const m = String(d || '').match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/); return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : '' };

/* صفحة النتائج: جدول GridView1؛ لكل حكم بطاقة ونص كامل (HTML) وصورة PDF */
function parseResults(html) {
  const h = String(html || '');
  const total = Number(span(h, 'lblResultCount').replace(/\D/g, '')) || 0;
  const narrow = /تضييق معايير البحث/.test(h);
  const results = [];
  for (const m of h.matchAll(/<tr class="text_without_bg">([\s\S]*?)<\/tr>/g)) {
    const row = m[1], id = (row.match(/CJID=(\d+)/) || [])[1]; if (!id) continue;
    const tds = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(x => strip(x[1]));
    const t = tds[1] || '', nm = t.match(/رقم\s*(\d+)\s*لسنة\s*(\d{4})/), dm = t.match(/بتاريخ\s*([\d/]+)/);
    results.push({ id: Number(id), title: t.replace(/\s+/g, ' ').trim(), no: nm ? nm[1] : '', year: nm ? nm[2] : '', date: toIso(dm && dm[1]), court: tds[2] || '', city: tds[3] || '', litigation: tds[4] || '', field: tds[5] || '',
      cardUrl: `${BASE}/courtjudgments/ViewCJCard.aspx?CJID=${id}`, textUrl: `${BASE}/courtjudgments/CJFullText.aspx?CJID=${id}`, pdfUrl: `${BASE}/courtjudgments/ShowDoc.aspx?ID=${id}` });
  }
  return { total, narrow, results, loginRequired: isLogin(h) };
}

/* النص الكامل: أقسام ثابتة بعلامات <a name="…"> */
const SECTIONS = [['judges', 'الديباجة'], ['facts', 'الأسباب والوقائع'], ['reasoning', 'التسبيب'], ['verdict', 'منطوق الحكم'], ['conclusions', 'الخاتمة']];
function parseFullText(html) {
  const h = String(html || ''), out = { sections: {}, laws: [] };
  const head = h.match(/<center><span[^>]*>([\s\S]*?)<\/span><\/center>/); out.header = head ? strip(head[1]).replace(/\n+/g, ' · ') : '';
  for (let i = 0; i < SECTIONS.length; i++) {
    const [k] = SECTIONS[i], a = h.indexOf(`<a name="${k}">`); if (a < 0) continue;
    let end = h.length; for (let j = i + 1; j < SECTIONS.length; j++) { const b = h.indexOf(`<a name="${SECTIONS[j][0]}">`); if (b > a) { end = Math.min(end, b) } }
    out.sections[k] = strip(h.slice(a, end).replace(/<a name="[^"]*"><\/a>/g, '').replace(/<span[^>]*><font[^>]*><b>[^<]*<\/b><\/font><\/span>/, '').replace(/<font[^>]*><b>[^<]*<\/b><\/font>/, '')).replace(/^\s*(الديباجة|الأسباب والوقائع|التسبيب|منطوق الحكم|الخاتمة)\s*\n?/, '').trim();
  }
  const dm = h.match(/بتاريخ\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*<br>/g); out.decided = dm ? (() => { const p = dm[dm.length - 1].match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); return `${p[3]}-${p[2].padStart(2, '0')}-${p[1].padStart(2, '0')}` })() : '';
  for (const m of h.matchAll(/<a href="[^"]*getLegForJ\.aspx\?id=(\d+)(?:#A\d+_(\d+))?">\s*([^<]+)<\/a>/g)) out.laws.push({ legId: Number(m[1]), article: m[2] ? Number(m[2]) : null, text: unent(m[3]).replace(/\s+/g, ' ').trim() });
  out.text = SECTIONS.map(([k, t]) => out.sections[k] ? `${t}\n${out.sections[k]}` : '').filter(Boolean).join('\n\n');
  out.loginRequired = isLogin(h);
  return out;
}

/* بطاقة الحكم: رأس البطاقة + المبادئ القانونية + النصوص القانونية المذكورة + الأحكام ذات العلاقة + مسارات الكشاف */
function parseCard(html) {
  const h = String(html || ''), out = {
    court: span(h, 'lblCourtType'), city: span(h, 'FormView1_Label2'), domain: span(h, 'lblDomain'), no: span(h, 'lblCJNum'), year: span(h, 'lblCJYear'),
    date: toIso(span(h, 'CJ_Main_DecDateLabel')), litigation: span(h, 'FormView1_Label14'), principles: [], laws: [], related: [], paths: [],
  };
  const grid = (id) => { const s = h.indexOf(`id="ctl00_ContentPlaceHolder1_${id}"`); if (s < 0) return ''; const e = h.indexOf('</table>', s); return h.slice(s, e) };
  for (const m of grid('GridView1').matchAll(/<tr[^>]*>\s*<td[^>]*>\s*(\d+)-\s*<\/td><td[^>]*>([\s\S]*?)<\/td><td[^>]*>([\s\S]*?)<\/td>/g)) out.principles.push({ n: Number(m[1]), text: strip(m[2]), shared: Number(strip(m[3]).replace(/\D/g, '')) || 0 });
  for (const m of grid('GridView2').matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const tds = [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(x => x[1]);
    if (tds.length < 3 || !/srlLbl/.test(tds[0])) continue;
    const lm = tds[1].match(/getLegForJ\.aspx\?id=(\d+)(?:#A\d+_(\d+))?/);
    out.laws.push({ text: strip(tds[1]), kind: strip(tds[2]), linked: Number(strip(tds[3] || '').replace(/\D/g, '')) || 0, legId: lm ? Number(lm[1]) : null, article: lm && lm[2] ? Number(lm[2]) : null });
  }
  for (const m of grid('GridView4').matchAll(/<a[^>]*href="[^"]*CJID=(\d+)"[^>]*>([^<]+)<\/a>/g)) out.related.push({ id: Number(m[1]), title: unent(m[2]).trim() });
  const pi = h.indexOf('المسارات التالية في الكشاف');
  if (pi > 0) for (const m of h.slice(pi).matchAll(/<td class="text_without_bg">((?:\s*<a href="[^"]*KashafBrowser[^"]*">[^<]*<\/a>&gt;\s*)+)<\/td>/g)) out.paths.push([...m[1].matchAll(/>([^<]+)<\/a>/g)].map(x => unent(x[1]).trim()).join(' > '));
  out.loginRequired = isLogin(h);
  return out;
}

const isLogin = h => /Login1\$UserName/.test(h) && !/GridView1|FormView1|<a name="judges">/.test(h);

/* صفحة دخول ASP.NET: الحقول المخفية (ViewState …) تُنسخ من الصفحة نفسها */
function hiddenFields(html) {
  const f = {}; for (const m of String(html || '').matchAll(/<input type="hidden" name="([^"]+)"[^>]*value="([^"]*)"/g)) f[m[1]] = unent(m[2]);
  return f;
}
const loginBody = (html, user, pass) => new URLSearchParams({ ...hiddenFields(html), 'ctl00$LoginView1$LogInCont1$Login1$UserName': user, 'ctl00$LoginView1$LogInCont1$Login1$Password': pass, 'ctl00$LoginView1$LogInCont1$Login1$RememberMe': 'on', 'ctl00$LoginView1$LogInCont1$Login1$LoginButton': 'دخول' });

/* تحويل حكم من المقتفي إلى سجل في «مكتبة الاجتهادات» */
const COURTS = [[/النقض/, 'محكمة النقض'], [/العدل العليا|الإدارية العليا/, 'المحكمة العليا'], [/الدستورية/, 'المحكمة الدستورية العليا'], [/استئناف|الإستئناف/, 'محكمة الاستئناف'], [/بداية/, 'محكمة البداية'], [/صلح/, 'محكمة الصلح'], [/العليا/, 'المحكمة العليا']];
const FIELDS = [[/عمل|عمال/, 'عمالي'], [/تجار/, 'تجاري'], [/ضريب/, 'ضريبي'], [/تأمين/, 'تأمين'], [/إيجار|مأجور/, 'إيجارات'], [/أراض|عقار|طابو/, 'أراضٍ وعقارات'], [/جزاء|جزائي|جنايات|جنح/, 'جزائي'], [/إدار/, 'إداري'], [/دستور/, 'دستوري'], [/تنفيذ/, 'تنفيذ'], [/حقوق|مدني/, 'مدني']];
function toRuling(r, card, full) {
  const pick = (L, ...xs) => (L.find(([re]) => xs.some(x => x && re.test(x))) || [null, ''])[1];
  const court = pick(COURTS, card.court, r.court) || 'أخرى', fieldTxt = [r.field, card.domain, ...(card.paths || [])].filter(Boolean).join(' ');
  return {
    muqtafiId: r.id, title: `${court} ${card.litigation || r.litigation || ''} ${card.no || r.no}/${card.year || r.year}`.replace(/\s+/g, ' ').trim(), court, courtName: `${card.court || r.court} – ${card.city || r.city}`,
    no: `${card.litigation || r.litigation || ''} ${card.no || r.no}/${card.year || r.year}`.trim(), date: card.date || r.date || full.decided || '',
    field: pick(FIELDS, fieldTxt) || '', keywords: [...new Set((card.paths || []).flatMap(p => p.split(' > ')).filter(w => w && !/^(حقوق|جزاء|إداري|مدني)$/.test(w)))].slice(0, 8),
    classifications: (card.paths || []).join(' | '), principle: (card.principles || []).map(p => `${p.n}- ${p.text}`).join('\n'), summary: full.sections && full.sections.verdict ? full.sections.verdict.slice(0, 600) : '',
    text: String(full.text || '').slice(0, 200000), laws: card.laws || [], related: card.related || [],
    src: 'المقتفي · معهد الحقوق – جامعة بيرزيت', srcUrl: r.cardUrl || `${BASE}/courtjudgments/ViewCJCard.aspx?CJID=${r.id}`, pdfUrl: r.pdfUrl, extracted: true,
  };
}

/* ── عميل الجلسة ──
   كوكي الجلسة (ASP.NET_SessionId + .ASPXAUTH) يبقى في ذاكرة الخادم فقط. تسجيل الدخول بحساب المكتب عند الحاجة، وإعادته مرة واحدة إذا انتهت الجلسة. */
const UA = 'Mithaq-LawOffice/2.0 (office subscriber; user-initiated search)';
const COURT_TYPES = { 1: 'النقض', 5: 'الإستئناف', 6: 'العدل العليا', 11: 'العليا بصفتها الدستورية', 13: 'النقض-هيئة عامة', 14: 'العليا-هيئة عامة', 15: 'جرائم الفساد', 16: 'البداية بصفتها الاستئنافية', 17: 'العليا', 18: 'الدستورية' };
const DOMAINS = { 1: 'جزاء', 2: 'حقوق', 3: 'إداري', 4: 'دستوري', 5: 'تنفيذ', 6: 'فساد' };
const CASE_TYPES = { 1: 'دعوى', 4: 'طلب', 7: 'اعتراض' };
const REGIONS = { 1: 'الضفة الغربية', 2: 'قطاع غزة' };
const MATCH = { any: '1', phrase: '2', all: '3' };
const F = 'ctl00$ContentPlaceHolder1$';

/* نموذج البحث: يُنسخ ViewState من صفحة النموذج ثم تُرسل الحقول بأسمائها في الموقع */
function searchBody(formHtml, f = {}) {
  const b = new URLSearchParams(hiddenFields(formHtml)), d = (s, i) => { const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? String(Number(m[i])) : '' };
  const set = (k, v) => b.set(F + k, v == null ? '' : String(v));
  set('txtCJ_NumNo', /^\d{1,7}$/.test(f.number || '') ? f.number : ''); set('txtCJ_NumYr', /^\d{4}$/.test(f.year || '') ? f.year : '');
  set('ddlDomains', DOMAINS[f.domain] ? f.domain : '0'); set('ddlCourtType', COURT_TYPES[f.court] ? f.court : '0'); set('ddlRegion', REGIONS[f.region] ? f.region : '0'); set('ddlCaseType', CASE_TYPES[f.caseType] ? f.caseType : '0');
  set('DDDayFrom', d(f.from, 3)); set('DDMonthFrom', d(f.from, 2)); set('DDYearFrom', d(f.from, 1)); set('DDDayTo', d(f.to, 3)); set('DDMonthTo', d(f.to, 2)); set('DDYearTo', d(f.to, 1));
  set('ddlSeachFor', MATCH[f.match] || '1'); set('txtSearch', String(f.q || '').slice(0, 200));
  const inn = f.in && typeof f.in === 'object' ? f.in : { judgment: true };
  if (inn.judgment !== false) set('chkSearchJudgment', 'on'); if (inn.principles) set('cbSearchPrinciples', 'on'); if (inn.commentary) set('chkSearchCommentary', 'on');
  set('Button1', 'بحث'); b.delete('__EVENTTARGET'); b.delete('__EVENTARGUMENT'); b.set('__EVENTTARGET', ''); b.set('__EVENTARGUMENT', '');
  return b;
}

function createClient({ getCred, fetchImpl = (...a) => fetch(...a), timeout = 20000 } = {}) {
  let jar = new Map();
  const cookieHeader = () => [...jar].map(([k, v]) => k + '=' + v).join('; ');
  const eat = res => { const raw = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [res.headers.get('set-cookie')].filter(Boolean); for (const c of raw.flatMap(x => x.split(/,(?=\s*[\w.]+=)/))) { const m = c.match(/^\s*([^=;]+)=([^;]*)/); if (m) { if (m[2] === '' || /expires=Thu, 01-Jan-1970/i.test(c)) jar.delete(m[1]); else jar.set(m[1], m[2]) } } };
  async function req(url, init = {}) {
    const ac = new AbortController(), t = setTimeout(() => ac.abort(), timeout);
    try {
      let u = url, hops = 0, r;
      while (hops++ < 4) {
        r = await fetchImpl(u, { ...init, redirect: 'manual', signal: ac.signal, headers: { 'user-agent': UA, 'accept-language': 'ar', cookie: cookieHeader(), ...(init.headers || {}) } });
        eat(r);
        const loc = r.headers.get('location');
        if ([301, 302, 303, 307].includes(r.status) && loc) { u = new URL(loc, u).href; init = { method: 'GET' }; continue }
        break;
      }
      return { status: r.status, url: u, html: await r.text() };
    } catch (e) { throw Object.assign(new Error('تعذّر الوصول إلى موقع المقتفي. حاول لاحقاً.'), { status: 502 }) }
    finally { clearTimeout(t) }
  }
  const loginPage = h => /Login1\$UserName/.test(h);
  async function login() {
    const cred = await getCred(); if (!cred || !cred.user || !cred.pass) throw Object.assign(new Error('لم تُضبط بيانات اشتراك المقتفي بعد. يضيفها مدير المكتب من شاشة «البحث في المقتفي».'), { status: 400, needCred: true });
    jar = new Map();
    const p = await req(`${BASE}/index.aspx?mid=1`);
    if (!loginPage(p.html)) throw Object.assign(new Error('صفحة دخول المقتفي تغيّرت ولم يُعثر على نموذج الدخول.'), { status: 502 });
    const r = await req(`${BASE}/index.aspx?mid=1`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: loginBody(p.html, cred.user, cred.pass).toString() });
    if (loginPage(r.html) && !/تسجيل خروج/.test(r.html)) throw Object.assign(new Error('رفض المقتفي بيانات الاشتراك (اسم المستخدم أو كلمة المرور). راجعها من إعدادات المكتب.'), { status: 401, badCred: true });
    return true;
  }
  /* يجلب صفحة محمية؛ إن أعادت صفحة الدخول يسجّل الدخول مرة ويعيد المحاولة */
  async function get(url, init) {
    if (!jar.size) await login();
    let r = await req(url, init);
    if (loginPage(r.html) && !/GridView1|FormView1|<a name="judges">/.test(r.html)) { await login(); r = await req(url, init) }
    return r;
  }
  async function search(f) {
    const form = await get(`${BASE}/courtjudgments/CJSearch.aspx?mid=1`);
    if (!/txtSearch/.test(form.html)) throw Object.assign(new Error('نموذج البحث في المقتفي تغيّر. أبلغ الدعم.'), { status: 502 });
    const r = await req(`${BASE}/courtjudgments/CJSearch.aspx?mid=1`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: searchBody(form.html, f).toString() });
    const out = parseResults(r.html);
    if (out.loginRequired) throw Object.assign(new Error('انتهت جلسة المقتفي. أعد المحاولة.'), { status: 502 });
    return out;
  }
  async function judgment(id) {
    const [c, t] = await Promise.all([get(`${BASE}/courtjudgments/ViewCJCard.aspx?CJID=${id}`), get(`${BASE}/courtjudgments/CJFullText.aspx?CJID=${id}`)]);
    const card = parseCard(c.html), full = parseFullText(t.html);
    if (!card.no && !full.text) throw Object.assign(new Error('لم يُعثر على هذا الحكم في المقتفي.'), { status: 404 });
    return { card, full };
  }
  return { login, search, judgment, get, _jar: () => jar, _reset: () => { jar = new Map() } };
}

/* ── خدمة الخادم: الحدود والسجل. أفعال: status | cred | search | judgment ── */
const LIMITS = { search: [20, 60e3], judgment: [30, 60e3] };
function createService({ audit, getCred, setCred, can, client } = {}) {
  const hits = new Map(); let busy = 0, cl = client;
  const limit = (key, kind) => { const [max, win] = LIMITS[kind], k = kind + '|' + key, now = Date.now(), a = (hits.get(k) || []).filter(t => now - t < win); if (a.length >= max) { hits.set(k, a); return Math.ceil((win - (now - a[0])) / 1000) } a.push(now); hits.set(k, a); return 0 };
  return async function run(action, input, user) {
    const key = String(user && (user.id || user.username) || 'anon'), who = { user_id: user && user.id, username: user && user.username };
    cl ||= createClient({ getCred });
    if (action === 'status') { const c = await getCred(); return { status: 200, body: { configured: !!(c && c.user && c.pass), user: c && c.user ? c.user : '', canManage: !!(can && can(user, 'manage')), courts: COURT_TYPES, domains: DOMAINS, caseTypes: CASE_TYPES, regions: REGIONS } } }
    if (action === 'cred') {
      if (!(can && can(user, 'manage'))) return { status: 403, body: { error: 'ضبط اشتراك المقتفي لمدير المكتب فقط.' } };
      const u = String(input.user || '').trim().slice(0, 80), p = String(input.pass || '').slice(0, 200);
      if (u && !p) return { status: 400, body: { error: 'اكتب كلمة المرور.' } };
      await setCred(u && p ? { user: u, pass: p } : null); cl._reset();
      audit && audit({ ...who, action: u ? 'muqtafi.cred_set' : 'muqtafi.cred_removed', entity: 'settings', detail: u ? { user: u } : {} });
      if (!u) return { status: 200, body: { ok: true, configured: false } };
      try { await cl.login(); audit && audit({ ...who, action: 'muqtafi.login_ok', entity: 'settings', detail: { user: u } }); return { status: 200, body: { ok: true, configured: true, user: u, verified: true } } }
      catch (e) { return { status: 200, body: { ok: true, configured: true, user: u, verified: false, warning: e.message } } }
    }
    if (busy >= 2) return { status: 429, body: { error: 'الخادم مشغول بطلبات بحث أخرى. حاول بعد لحظات.' } };
    busy++;
    try {
      if (action === 'search') {
        const w = limit(key, 'search'); if (w) return { status: 429, body: { error: `طلبات بحث كثيرة. حاول بعد ${w} ثانية.`, retry: w } };
        const f = input || {}; if (!String(f.q || '').trim() && !f.number && !f.year && !f.court && !f.domain && !f.from) return { status: 400, body: { error: 'اكتب عبارة البحث أو حدّد المحكمة أو رقم القضية.' } };
        const r = await cl.search(f);
        audit && audit({ ...who, action: 'muqtafi.search', entity: 'muqtafi', detail: { q: String(f.q || '').slice(0, 120), court: f.court || '', n: r.results.length, total: r.total } });
        return { status: 200, body: { ok: true, ...r } };
      }
      if (action === 'judgment') {
        const w = limit(key, 'judgment'); if (w) return { status: 429, body: { error: `طلبات كثيرة. حاول بعد ${w} ثانية.`, retry: w } };
        const id = Number(input && input.id); if (!Number.isSafeInteger(id) || id <= 0) return { status: 400, body: { error: 'رقم الحكم غير صحيح.' } };
        const { card, full } = await cl.judgment(id), ruling = toRuling({ id, court: card.court, city: card.city, no: card.no, year: card.year, litigation: card.litigation }, card, full);
        audit && audit({ ...who, action: 'muqtafi.judgment', entity: 'muqtafi', entity_id: String(id), detail: { no: card.no, year: card.year, court: card.court } });
        return { status: 200, body: { ok: true, card, full, ruling } };
      }
      return { status: 404, body: { error: 'not found' } };
    } catch (e) {
      audit && audit({ ...who, action: 'muqtafi.error', entity: 'muqtafi', detail: { action, error: String(e.message).slice(0, 160) } });
      return { status: e.status || 502, body: { error: e.message || 'تعذّر الاتصال بالمقتفي', ...(e.needCred ? { needCred: true } : {}), ...(e.badCred ? { badCred: true } : {}) } };
    } finally { busy-- }
  };
}

/* رابط حكم في المقتفي (بطاقة أو نص كامل أو PDF) → رقم الحكم */
const idFromUrl = u => { const m = String(u || '').match(/^https?:\/\/muqtafi\.birzeit\.edu\/courtjudgments\/(?:ViewCJCard|CJFullText|ShowDoc|CourtJCard)\.aspx\?(?:CJID|ID|id)=J?(\d+)/i); return m ? Number(m[1]) : 0 };

module.exports = { BASE, parseResults, parseFullText, parseCard, hiddenFields, loginBody, searchBody, toRuling, isLogin, strip, createClient, createService, idFromUrl, COURT_TYPES, DOMAINS, CASE_TYPES, REGIONS };
