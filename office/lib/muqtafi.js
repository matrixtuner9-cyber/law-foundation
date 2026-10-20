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

module.exports = { BASE, parseResults, parseFullText, parseCard, hiddenFields, loginBody, toRuling, isLogin, strip };
