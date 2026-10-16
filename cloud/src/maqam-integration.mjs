/*
 * Maqam judgment search — portable, server-side ES module.
 * (النسخة المرفقة كما وصلت؛ التعديلات: User-Agent يعرّف ميثاق بصدق، وبلا خيار cache لأن Workers لا يدعمه. نسخة مطابقة في office/lib/maqam-integration.mjs)
 * Source: https://maqam.najah.edu/judgments/
 *
 * Requires: Node.js 20+ and `npm install cheerio` in the host application.
 * Never import this file into a browser component: Maqam's HTML must be fetched
 * on the server, where you can enforce your application's own authentication.
 *
 * import { searchJudgments, getJudgment, collectJudgments, buildDownload } from './maqam-integration.mjs';
 * const page = await searchJudgments({ q: 'مطالبة مالية', court: 5, page: 1 });
 * const judgment = await getJudgment(page.results[0].maqamId);
 * const bundle = await collectJudgments({ q: 'مطالبة مالية' }, { pages: 2, fullText: true });
 * const file = buildDownload(bundle, 'html'); // { body, contentType, filename }
 *
 * This module does not contain credentials, bypass access restrictions, or
 * save user data. Verify Maqam's terms and attribute every result to its source.
 */
import { load } from 'cheerio';

export const MAQAM_BASE = 'https://maqam.najah.edu';
export const MAQAM_SEARCH = `${MAQAM_BASE}/judgments/search/`;
const USER_AGENT = 'Mithaq-LawOffice/2.0 (user-initiated judgment search)';
const FILTERS = ['court', 'litigation_type', 'section', 'subject', 'branch'];
const LIMIT_PAGES = 5;

const clean = (value) => String(value ?? '')
  .replace(/[\u200e\u200f\u00a0]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function positiveNumber(value, fallback = null) {
  if (value === '' || value === null || value === undefined) return fallback;
  const num = Number(value);
  return Number.isSafeInteger(num) && num > 0 ? num : fallback;
}

/** Build a safe, fixed-origin Maqam search URL. Unsupported keys are ignored. */
export function buildSearchUrl(input = {}) {
  const params = new URLSearchParams();
  params.set('order_by', input.order_by === 'date' ? 'date' : 'relevance');
  if (input.q && String(input.q).trim()) params.set('q', String(input.q).trim().slice(0, 200));
  for (const key of FILTERS) {
    const id = positiveNumber(input[key]);
    if (id !== null) params.set(key, String(id));
  }
  const year = String(input.year ?? '').trim();
  if (/^\d{4}$/.test(year)) params.set('year', year);
  const caseNumber = String(input.number ?? '').trim();
  if (/^\d{1,12}$/.test(caseNumber)) params.set('number', caseNumber);
  const page = positiveNumber(input.page, 1);
  if (page > 1) params.set('page', String(page));
  return `${MAQAM_SEARCH}?${params.toString()}`;
}

async function fetchPage(url, timeoutMs = 25000) {
  let response;
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'ar,en;q=0.8',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    throw new Error(`تعذر الاتصال بموقع مقام: ${error instanceof Error ? error.message : 'انتهت المهلة'}`);
  }
  const html = await response.text();
  return { status: response.status, html };
}

/** Parse a saved Maqam search page (also useful in offline tests). */
export function parseSearchPage(html, requestedPage = 1) {
  const $ = load(html);
  const results = [];
  const seen = new Set();

  $('ul.list-unstyled.mb-0 > li').each((_, element) => {
    const row = $(element);
    const href = row.find("a[href^='/judgments/']").first().attr('href') ?? '';
    const match = href.match(/^\/judgments\/(\d+)\//);
    if (!match) return;
    const maqamId = Number(match[1]);
    if (seen.has(maqamId)) return;
    seen.add(maqamId);

    const title = clean(row.find('strong').first().text() || row.find("a[href^='/judgments/']").first().text());
    const caseMatch = title.match(/القضية\s+رقم\s+(\d+)\s*\/\s*(\d{4})/);
    const dateMatch = title.match(/بتاريخ\s*(\d{4}-\d{2}-\d{2})/);
    const facets = {};
    row.find("a.badge[href^='/judgments/search/']").each((__, anchor) => {
      const link = $(anchor);
      const query = (link.attr('href') ?? '').split('?')[1]?.replace(/&amp;/g, '&') ?? '';
      const params = new URLSearchParams(query);
      const name = clean(link.text());
      if (!name) return;
      if (params.has('branch')) facets.branch ??= { id: Number(params.get('branch')), name };
      else if (params.has('subject')) facets.subject ??= { id: Number(params.get('subject')), name };
      else if (params.has('section')) facets.section ??= { id: Number(params.get('section')), name };
      else if (params.has('court')) facets.court ??= { id: Number(params.get('court')), name };
      else if (params.has('litigation_type')) {
        facets.litigation_type ??= { id: Number(params.get('litigation_type')), name };
      }
    });

    results.push({
      maqamId,
      title,
      number: caseMatch?.[1] ?? null,
      year: caseMatch?.[2] ?? null,
      decisionDate: dateMatch?.[1] ?? null,
      court: facets.court?.name ?? null,
      courtId: facets.court?.id ?? null,
      litigationType: facets.litigation_type?.name ?? null,
      litigationTypeId: facets.litigation_type?.id ?? null,
      section: facets.section?.name ?? null,
      sectionId: facets.section?.id ?? null,
      subject: facets.subject?.name ?? null,
      subjectId: facets.subject?.id ?? null,
      branch: facets.branch?.name ?? null,
      branchId: facets.branch?.id ?? null,
      snippet: clean(row.find('div.my-1.text-muted').first().text()) || null,
      sourceUrl: `${MAQAM_BASE}/judgments/${maqamId}/`,
    });
  });

  let totalPages = 1;
  $('ul.pagination a[aria-label]').each((_, anchor) => {
    const label = $(anchor).attr('aria-label') ?? '';
    const pages = Number(label.match(/Page\s+\d+\s+of\s+(\d+)/i)?.[1]);
    if (Number.isSafeInteger(pages) && pages > totalPages) totalPages = pages;
  });
  const current = positiveNumber(clean($('ul.pagination li.page-item.active .page-link').first().text()), requestedPage);
  return { results, page: current, totalPages: Math.max(current, totalPages) };
}

/** Run a live search; returns a page of summaries and the original source URL. */
export async function searchJudgments(filters = {}) {
  const page = positiveNumber(filters.page, 1);
  const sourceUrl = buildSearchUrl({ ...filters, page });
  const { status, html } = await fetchPage(sourceUrl);
  // Maqam occasionally renders an error page for a no-result filter combination.
  if (status === 404 || (status === 500 && html.includes('VariableDoesNotExist'))) {
    return { results: [], page, totalPages: 1, sourceUrl };
  }
  if (status !== 200) throw new Error(`تعذر البحث في موقع مقام (رمز ${status})`);
  const parsed = parseSearchPage(html, page);
  return { ...parsed, sourceUrl };
}

/** Parse a saved judgment page. Only plain text is returned, never unsafe HTML. */
export function parseJudgmentPage(html, maqamId) {
  const $ = load(html);
  const breadcrumb = $('ol.breadcrumb li.breadcrumb-item.active b').first();
  const title = clean(breadcrumb.attr('title') || breadcrumb.text()) || `الحكم رقم ${maqamId}`;
  const metadata = {};
  let key = '';
  $('div.card.bg-light.border-0 dl.row').first().children().each((_, node) => {
    if (node.type !== 'tag') return;
    const tag = node.tagName.toLowerCase();
    if (tag === 'dt') key = clean($(node).text());
    else if (tag === 'dd' && key) metadata[key] = clean($(node).text());
  });
  const body = $('h4.card-title')
    .filter((_, el) => clean($(el).text()) === 'النص')
    .first().closest('div.card').find('div.card-body').first();
  const paragraphs = body.find('p, li, blockquote').map((_, el) => clean($(el).text())).get().filter(Boolean);
  const bodyText = paragraphs.length ? paragraphs.join('\n\n') : clean(body.text());
  if (bodyText.length < 30) throw new Error(`النص الكامل للحكم ${maqamId} غير متاح على موقع مقام`);

  const classification = {};
  body.closest('div.col-lg-9').find('div.card.bg-light ul.list-unstyled a[href^="/judgments/search/"]')
    .each((_, el) => {
      const url = new URL($(el).attr('href'), MAQAM_BASE);
      const params = url.searchParams;
      const name = clean($(el).text());
      if (params.has('branch')) classification.branch ??= name;
      else if (params.has('subject')) classification.subject ??= name;
      else if (params.has('section')) classification.section ??= name;
    });

  return {
    maqamId,
    title,
    number: metadata['الرقم'] ?? null,
    year: metadata['السنة'] ?? null,
    decisionDate: metadata['تاريخ الفصل'] ?? null,
    court: metadata['المحكمة'] ?? null,
    litigationType: metadata['نوع التقاضي'] ?? null,
    section: classification.section ?? null,
    subject: classification.subject ?? null,
    branch: classification.branch ?? null,
    bodyText,
    sourceUrl: `${MAQAM_BASE}/judgments/${maqamId}/`,
  };
}

/** Fetch one judgment, with its complete text and metadata. */
export async function getJudgment(id) {
  const maqamId = positiveNumber(id);
  if (maqamId === null) throw new Error('رقم الحكم غير صحيح');
  const { status, html } = await fetchPage(`${MAQAM_BASE}/judgments/${maqamId}/`);
  if (status !== 200) throw new Error(`تعذر جلب الحكم ${maqamId} (رمز ${status})`);
  return parseJudgmentPage(html, maqamId);
}

/**
 * Gather 1–5 pages (max 100 summaries); optionally fetch their full text.
 * Failed full-text fetches are reported in `failures`; summary links remain.
 */
export async function collectJudgments(filters = {}, options = {}) {
  const pages = Math.min(positiveNumber(options.pages, 1), LIMIT_PAGES);
  const startingPage = positiveNumber(filters.page, 1);
  const fullText = options.fullText === true;
  const results = [];
  const seen = new Set();
  const failures = [];
  let totalPages = 1;
  let sourceUrl = buildSearchUrl(filters);
  let fetchedPages = 0;

  for (let page = startingPage; page < startingPage + pages; page += 1) {
    const batch = await searchJudgments({ ...filters, page });
    if (fetchedPages === 0) sourceUrl = batch.sourceUrl;
    fetchedPages += 1;
    totalPages = batch.totalPages;
    for (const result of batch.results) {
      if (seen.has(result.maqamId) || results.length >= 100) continue;
      seen.add(result.maqamId);
      results.push(result);
    }
    if (page >= totalPages || results.length >= 100) break;
  }

  if (fullText && results.length) {
    let next = 0;
    const workers = Math.min(2, results.length);
    await Promise.all(Array.from({ length: workers }, async () => {
      while (next < results.length) {
        const index = next++;
        try {
          const detail = await getJudgment(results[index].maqamId);
          results[index] = { ...results[index], ...detail };
        } catch (error) {
          failures.push({ maqamId: results[index].maqamId, reason: error instanceof Error ? error.message : 'تعذر جلب النص' });
        }
      }
    }));
  }

  return { results, totalPages, fetchedPages, startingPage, sourceUrl, failures, fullText };
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Generate an offline, print-ready, single-file Arabic HTML results page. */
export function toStandaloneHtml(bundle) {
  const items = bundle.results ?? [];
  const cards = items.map((result, index) => {
    const badges = [result.court, result.litigationType, result.section, result.subject, result.branch]
      .filter(Boolean).map((label) => `<span class="badge">${escapeHtml(label)}</span>`).join(' ');
    const body = result.bodyText
      ? `<div class="body">${escapeHtml(result.bodyText)}</div>`
      : result.snippet ? `<p class="excerpt">${escapeHtml(result.snippet)}</p>` : '';
    const sourceUrl = `${MAQAM_BASE}/judgments/${Number(result.maqamId)}/`;
    return `<article><h2>${index + 1}. ${escapeHtml(result.title)}</h2>
<div class="badges">${badges}</div>
<p class="meta">رقم القضية: ${escapeHtml(result.number ?? '—')} / ${escapeHtml(result.year ?? '—')} · تاريخ الفصل: ${escapeHtml(result.decisionDate ?? '—')}</p>
${body}
<p class="source">المصدر: <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">${sourceUrl}</a></p></article>`;
  }).join('\n');

  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>نتائج البحث في الأحكام القضائية – مقام</title>
<style>
:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#f7f9f8;color:#1c2826;font:15px/1.95 system-ui,"Segoe UI",Tahoma,sans-serif}
main{max-width:960px;margin:auto;padding:30px 20px 70px}header{border-bottom:3px solid #0b6b53;padding-bottom:16px;margin-bottom:22px}h1{font-size:1.6rem;margin:0}header p{color:#526560;margin:3px 0;font-size:.86rem}
button{background:#0b6b53;color:white;border:0;border-radius:8px;padding:10px 18px;cursor:pointer;margin-bottom:20px}
article{background:white;border:1px solid #dce7e3;border-radius:13px;padding:18px 20px;margin-bottom:14px;break-inside:avoid}
h2{font-size:1rem;margin:0 0 8px}.badges{display:flex;gap:6px;flex-wrap:wrap}.badge{background:#ecf5f1;border-radius:999px;padding:2px 9px;color:#185d49;font-size:.76rem}
.meta,.source{color:#66766e;font-size:.8rem}.source{overflow-wrap:anywhere}.source a{color:#0b6b53}.excerpt{background:#fffbeb;border-right:3px solid #d4a729;padding:8px 12px;border-radius:6px}
.body{white-space:pre-wrap;margin:16px 0;line-height:2;border-top:1px solid #e4ece8;padding-top:15px}
@media print{body{background:white}button{display:none}main{padding:0}article{box-shadow:none}}
</style></head><body><main>
<header><h1>نتائج البحث في الأحكام القضائية</h1>
<p>المصدر: موسوعة مقام القانونية – جامعة النجاح الوطنية</p>
<p>عدد النتائج: ${items.length} · صفحات جُلبت: ${Number(bundle.fetchedPages ?? 1)} · تاريخ التحميل: ${escapeHtml(new Date().toLocaleString('ar-EG'))}</p>
${bundle.failures?.length ? `<p>تعذّر جلب النص الكامل لـ ${bundle.failures.length} حكم؛ الروابط الأصلية متاحة أدناه.</p>` : ''}
</header><button type="button" onclick="window.print()">طباعة / حفظ PDF</button>
${cards || '<p>لا توجد نتائج مطابقة.</p>'}
<footer><p>يرجى الرجوع إلى النص الأصلي للتحقق من الحكم. هذا الملف مستقل ويعمل دون اتصال بالإنترنت.</p></footer>
</main></body></html>`;
}

/** Excel-compatible, UTF-8 BOM CSV. */
export function toCsv(bundle) {
  const columns = ['رقم مقام', 'عنوان الحكم', 'رقم القضية', 'السنة', 'تاريخ الفصل', 'المحكمة', 'نوع التقاضي', 'القسم', 'الموضوع', 'الفرع', 'الرابط', 'مقتطف', 'النص الكامل'];
  const cell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = [columns.map(cell).join(',')];
  for (const item of bundle.results ?? []) {
    lines.push([
      item.maqamId, item.title, item.number, item.year, item.decisionDate,
      item.court, item.litigationType, item.section, item.subject, item.branch,
      item.sourceUrl, item.snippet, item.bodyText,
    ].map(cell).join(','));
  }
  return `\uFEFF${lines.join('\r\n')}`;
}

/** Produce response-ready content for a server-side download endpoint. */
export function buildDownload(bundle, format = 'html') {
  const date = new Date().toISOString().slice(0, 10);
  if (format === 'html') return { body: toStandaloneHtml(bundle), contentType: 'text/html; charset=utf-8', filename: `maqam-results-${date}.html` };
  if (format === 'csv') return { body: toCsv(bundle), contentType: 'text/csv; charset=utf-8', filename: `maqam-results-${date}.csv` };
  if (format === 'json') return {
    body: JSON.stringify({ source: `${MAQAM_BASE}/judgments/`, generatedAt: new Date().toISOString(), ...bundle }, null, 2),
    contentType: 'application/json; charset=utf-8', filename: `maqam-results-${date}.json`,
  };
  throw new Error('الصيغة غير مدعومة. استخدم html أو csv أو json');
}
