// «استيراد حكم برابطه» من موسوعة مقام (جامعة النجاح): صفحة حكم واحدة يطلبها المحامي بنفسه، تُقرأ ويُستخرج منها
// المحكمة والرقم والتاريخ والتصنيف والنص والمواد المذكورة لتُعرض في نموذج الإضافة للمراجعة. لا بحث آلي ولا جمع جماعي.
// نسخة مطابقة في cloud/src/maqam.js (ESM)
'use strict';
const HOST = 'maqam.najah.edu';
const MONTHS = { 'يناير': 1, 'فبراير': 2, 'مارس': 3, 'أبريل': 4, 'ابريل': 4, 'مايو': 5, 'يونيو': 6, 'يوليو': 7, 'أغسطس': 8, 'اغسطس': 8, 'سبتمبر': 9, 'أكتوبر': 10, 'اكتوبر': 10, 'نوفمبر': 11, 'ديسمبر': 12 };
const COURTS = [[/الدستورية/, 'المحكمة الدستورية العليا'], [/النقض/, 'محكمة النقض'], [/العدل العليا|الإدارية العليا/, 'المحكمة العليا'], [/الإدارية/, 'المحكمة الإدارية'],
  [/الشرعية العليا/, 'المحكمة الشرعية العليا'], [/استئناف.*شرعي|الشرعية.*استئناف/, 'محكمة الاستئناف الشرعية'], [/الجنايات الكبرى/, 'محكمة الجنايات الكبرى'],
  [/استئناف/, 'محكمة الاستئناف'], [/بداية/, 'محكمة البداية'], [/صلح/, 'محكمة الصلح'], [/العليا/, 'المحكمة العليا']];
const FIELDS = [[/^حقوق/, 'مدني'], [/^جزاء|^جزائي/, 'جزائي'], [/عمل|عمال/, 'عمالي'], [/إدار/, 'إداري'], [/دستور/, 'دستوري'], [/تنفيذ/, 'تنفيذ'], [/إيجار|مأجور/, 'إيجارات'], [/أراض|عقار/, 'أراضٍ وعقارات'], [/ضريب/, 'ضريبي'], [/تأمين/, 'تأمين'], [/شرعي|أحوال/, 'أحوال شخصية'], [/تجار/, 'تجاري']];

/* يقبل رابط حكم واحد فقط: https://maqam.najah.edu/judgments/{رقم}/ */
function judgmentUrl(raw) {
  let u; try { u = new URL(String(raw || '').trim()) } catch (e) { return null }
  if (!/^https?:$/.test(u.protocol) || u.hostname.replace(/^www\./, '') !== HOST) return null;
  const m = u.pathname.match(/^\/judgments\/(\d{1,9})\/?$/); if (!m) return null;
  return `https://${HOST}/judgments/${m[1]}/`;
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', lrm: '', rlm: '', zwnj: '', zwj: '' };
const decode = s => String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, k) => k[0] === '#' ? String.fromCodePoint(k[1] === 'x' || k[1] === 'X' ? parseInt(k.slice(2), 16) : +k.slice(1)) : (ENT[k.toLowerCase()] ?? m)).replace(/[‎‏]/g, '');
const strip = s => decode(String(s).replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h\d|tr)>/gi, '\n').replace(/<[^>]+>/g, ''));
const clean = s => s.split('\n').map(l => l.replace(/[ \t ]+/g, ' ').trim()).filter((l, i, a) => l || (a[i - 1] && a[i - 1].trim())).join('\n').replace(/\n{3,}/g, '\n\n').trim();

function parse(html, url) {
  const h = String(html);
  const title = clean(strip((h.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || ''));
  const dl = {}; const dlBlock = (h.match(/<dl[^>]*>([\s\S]*?)<\/dl>/i) || [])[1] || '';
  for (const m of dlBlock.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi)) dl[clean(strip(m[1]))] = m[2];
  const txt = k => dl[k] ? clean(strip(dl[k])).replace(/\n/g, ' ') : '';
  const year = txt('السنة'), num = txt('الرقم'), courtRaw = txt('المحكمة'), lit = txt('نوع التقاضي');
  const cls = dl['التصنيفات'] ? [...dl['التصنيفات'].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map(m => clean(strip(m[1])).replace(/\s*-\s*/g, ' - ')) : [];
  let date = (title.match(/(\d{4}-\d{2}-\d{2})/) || [])[1] || '';
  if (!date) { const d = txt('تاريخ الفصل').match(/(\d{1,2})\s+(\S+?)،?\s+(\d{4})/); if (d && MONTHS[d[2]]) date = `${d[3]}-${String(MONTHS[d[2]]).padStart(2, '0')}-${d[1].padStart(2, '0')}` }
  const a = h.search(/<h4[^>]*>\s*النص\s*<\/h4>/), b = h.indexOf('<div class="col-lg-3"', a);
  const text = a >= 0 ? clean(strip(h.slice(h.indexOf('</h4>', a) + 5, b > a ? b : undefined))).slice(0, 200000) : '';
  const side = b > 0 ? h.slice(b) : '';
  const full = (side.match(/<a[^>]+href="([^"]+)"[^>]*>[\s\S]{0,120}?النص الكامل/) || [])[1];
  const citedBlock = (side.match(/النصوص القانونية المذكورة في الحكم[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/) || [])[1] || '';
  const cited = [...citedBlock.matchAll(/<b>([\s\S]*?)<\/b>/gi)].map(m => clean(strip(m[1]))).filter(Boolean).slice(0, 40);
  const court = (COURTS.find(([re]) => re.test(courtRaw)) || [null, 'أخرى'])[1];
  const top = cls.length ? cls[0].split(' - ')[0] : lit;
  const field = (FIELDS.find(([re]) => re.test(top || '') || re.test(lit || '')) || [null, ''])[1];
  const keywords = [...new Set(cls.flatMap(c => c.split(' - ').slice(1)).map(s => s.trim()).filter(Boolean))].slice(0, 12);
  if (!num || !text) return null;
  return {
    court, courtName: courtRaw, no: `${lit ? lit + ' ' : ''}${num}/${year}`.trim(), date, field, keywords, text,
    classifications: cls, cited, src: 'مقام · جامعة النجاح', srcUrl: url, fullText: (() => { try { return full ? new URL(decode(full), url).href : '' } catch (e) { return '' } })(),
  };
}

/* الجلب: طلب واحد بمهلة وحد للحجم، دون اتباع تحويل لموقع آخر */
async function fetchJudgment(raw, fetchImpl) {
  const url = judgmentUrl(raw); if (!url) return { error: 'الرابط يجب أن يكون لصفحة حكم واحدة في مقام، مثل: https://maqam.najah.edu/judgments/5158/', status: 400 };
  let r; const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 15000);
  try { r = await fetchImpl(url, { redirect: 'manual', signal: ac.signal, headers: { 'accept-language': 'ar', 'user-agent': 'Mithaq-LawOffice/2.0 (import single judgment by link)' } }) }
  catch (e) { return { error: 'تعذّر الوصول إلى موقع مقام. حاول لاحقاً.', status: 502 } } finally { clearTimeout(t) }
  if (r.status === 404) return { error: 'لم يُعثر على هذا الحكم في مقام.', status: 404 };
  if (r.status !== 200) return { error: 'ردّ موقع مقام برمز ' + r.status + '. قد يحتاج الحكم تسجيل دخول في الموقع نفسه.', status: 502 };
  const html = await r.text(); if (html.length > 3e6) return { error: 'الصفحة أكبر من المتوقع.', status: 502 };
  const out = parse(html, url); if (!out) return { error: 'لم نتمكن من قراءة بيانات الحكم من الصفحة.', status: 422 };
  return { ok: true, ruling: out };
}

module.exports = { judgmentUrl, parse, fetchJudgment };
