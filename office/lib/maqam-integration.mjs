/*
 * (النسخة الموحدة المرفقة؛ التعديلات: User-Agent يعرّف ميثاق بصدق، والنصوص العربية بلا اسم الموقع. نسخة مطابقة في cloud/src/maqam-integration.mjs)
 * Maqam judgment search — portable, server-side ES module.
 * Source: https://maqam.najah.edu/judgments/
 *
 * Requires: Node.js 20+ and `npm install cheerio` in the host application.
 * Never import this file into a browser component: Maqam's HTML must be fetched
 * on the server, where you can enforce your application's own authentication.
 *
 * import { collectJudgments, normalizeLocalJudgment, searchLocalJudgments,
 *          buildPrintHtml, buildWhatsAppUrl } from './maqam-integration.mjs';
 * const bundle = await collectJudgments({ q: 'مطالبة مالية' }, { pages: 1, fullText: true });
 * const records = bundle.results.map(normalizeLocalJudgment);
 * // Persist records with your app's database (e.g. PostgreSQL via Drizzle).
 * const local = searchLocalJudgments(records, { q: 'المطالبة المالية', mode: 'all' });
 * const printable = buildPrintHtml(local.results, { template: 'brief' });
 * const shareUrl = buildWhatsAppUrl(local.results);
 *
 * This module does NOT save to disk/database by itself or bypass access
 * restrictions. For persistence, inject your own store into importToArchive()
 * or save normalized records in your existing app's database. Verify Maqam's
 * terms and attribute every judgment to its original source.
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
      cache: 'no-store',
    });
  } catch (error) {
    throw new Error(`تعذر الاتصال بالموقع المصدر: ${error instanceof Error ? error.message : 'انتهت المهلة'}`);
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
  if (status !== 200) throw new Error(`تعذر البحث في الموقع المصدر (رمز ${status})`);
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
  if (bodyText.length < 30) throw new Error(`النص الكامل للحكم ${maqamId} غير متاح على الموقع المصدر`);

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
<title>نتائج البحث في الأحكام القضائية</title>
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
<p>المصدر: الموسوعة القانونية – جامعة النجاح الوطنية</p>
<p>عدد النتائج: ${items.length} · صفحات جُلبت: ${Number(bundle.fetchedPages ?? 1)} · تاريخ التحميل: ${escapeHtml(new Date().toLocaleString('ar-EG'))}</p>
${bundle.failures?.length ? `<p>تعذّر جلب النص الكامل لـ ${bundle.failures.length} حكم؛ الروابط الأصلية متاحة أدناه.</p>` : ''}
</header><button type="button" onclick="window.print()">طباعة / حفظ PDF</button>
${cards || '<p>لا توجد نتائج مطابقة.</p>'}
<footer><p>يرجى الرجوع إلى النص الأصلي للتحقق من الحكم. هذا الملف مستقل ويعمل دون اتصال بالإنترنت.</p></footer>
</main></body></html>`;
}

/** Excel-compatible, UTF-8 BOM CSV. */
export function toCsv(bundle) {
  const columns = ['رقم الحكم في المصدر', 'عنوان الحكم', 'رقم القضية', 'السنة', 'تاريخ الفصل', 'المحكمة', 'نوع التقاضي', 'القسم', 'الموضوع', 'الفرع', 'الرابط', 'مقتطف', 'النص الكامل'];
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

// The functions below never fetch from Maqam except importToArchive() and
// importOneToArchive(). Search, print and WhatsApp use ONLY records you pass in.
const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
function asciiDigits(value) {
  return String(value ?? '').replace(/[٠-٩۰-۹]/g, (char) => {
    const index = arabicDigits.indexOf(char);
    return String(index < 0 ? persianDigits.indexOf(char) : index);
  });
}

/** Normalize Arabic letters, diacritics and Arabic/Persian digits for local search. */
export function normalizeArabic(value) {
  return asciiDigits(value).normalize('NFKC')
    .replace(/[\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[ىی]/g, 'ي').replace(/ة/g, 'ه').replace(/[کگ]/g, 'ك')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

function dateFromRecord(item) {
  const value = asciiDigits(item.decisionDateIso ?? item.decisionDate ?? '');
  const candidate = value.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0]
    ?? asciiDigits(item.title).match(/بتاريخ\s*(\d{4}-\d{2}-\d{2})/)?.[1];
  if (!candidate) return null;
  const parsed = new Date(`${candidate}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === candidate ? candidate : null;
}

/** Prepare a public judgment for storage in YOUR application's database. */
export function normalizeLocalJudgment(item) {
  const maqamId = positiveNumber(item?.maqamId);
  if (!maqamId || maqamId > 10000000) throw new Error('معرّف الحكم غير صحيح');
  const title = clean(item.title);
  const bodyText = String(item.bodyText ?? '');
  const searchTitle = normalizeArabic(title);
  const searchBody = normalizeArabic(bodyText.slice(0, 250000));
  const searchText = normalizeArabic([
    title, item.number, item.year, item.court, item.litigationType,
    item.section, item.subject, item.branch, item.snippet, bodyText.slice(0, 250000),
  ].filter(Boolean).join(' '));
  return {
    ...item,
    maqamId,
    title,
    bodyText: bodyText || null,
    sourceUrl: `${MAQAM_BASE}/judgments/${maqamId}/`,
    decisionDateIso: dateFromRecord(item),
    searchTitle,
    searchBody,
    searchText,
    indexedAt: item.indexedAt ?? new Date().toISOString(),
  };
}

/**
 * Search records read from YOUR local database; never contacts Maqam.
 * mode=all|any|exact; field=all|title|body; sort=relevance|newest|oldest|added.
 * For very large archives, use a PostgreSQL GIN full-text index instead of
 * loading the entire table into memory (see this bundle's README).
 */
export function searchLocalJudgments(records, filters = {}) {
  if (!Array.isArray(records)) throw new TypeError('السجلات المحلية يجب أن تكون مصفوفة');
  const q = normalizeArabic(filters.q ?? '').slice(0, 160);
  const words = [...new Set(q.split(' ').filter(Boolean))].slice(0, 12);
  const variants = words.map((word) => word.startsWith('ال') && word.length > 4
    ? [word, word.slice(2)] : [word]);
  const withoutArticles = (value) => value.replace(/(^| )ال(?=[\p{L}]{3,})/gu, '$1');
  const mode = ['all', 'any', 'exact'].includes(filters.mode) ? filters.mode : 'all';
  const field = ['all', 'title', 'body'].includes(filters.field) ? filters.field : 'all';
  const sort = ['relevance', 'newest', 'oldest', 'added'].includes(filters.sort) ? filters.sort : 'relevance';
  const facets = {
    court: ['courtId', 'court'], litigation_type: ['litigationTypeId', 'litigationType'],
    section: ['sectionId', 'section'], subject: ['subjectId', 'subject'], branch: ['branchId', 'branch'],
  };
  const from = /^\d{4}-\d{2}-\d{2}$/.test(asciiDigits(filters.from ?? '')) ? asciiDigits(filters.from) : null;
  const to = /^\d{4}-\d{2}-\d{2}$/.test(asciiDigits(filters.to ?? '')) ? asciiDigits(filters.to) : null;
  const matches = [];

  for (const input of records) {
    const item = input.searchText !== undefined ? input : normalizeLocalJudgment(input);
    const text = field === 'title' ? item.searchTitle : field === 'body' ? item.searchBody : item.searchText;
    const hasWord = (choices) => choices.some((word) => text.includes(word));
    if (q && !(mode === 'exact' ? withoutArticles(text).includes(withoutArticles(q))
      : mode === 'any' ? variants.some(hasWord) : variants.every(hasWord))) continue;
    if (filters.full === true || filters.full === '1') {
      if (!item.bodyText || item.bodyText.length < 100) continue;
    }
    if (filters.year && asciiDigits(item.year ?? '') !== asciiDigits(filters.year)) continue;
    if (filters.number && asciiDigits(item.number ?? '') !== asciiDigits(filters.number)) continue;
    const iso = item.decisionDateIso ?? dateFromRecord(item);
    if (from && (!iso || iso < from)) continue;
    if (to && (!iso || iso > to)) continue;
    let rejected = false;
    for (const [key, [idKey, nameKey]] of Object.entries(facets)) {
      const filter = filters[key];
      if (filter === undefined || filter === null || filter === '') continue;
      if (/^\d+$/.test(asciiDigits(filter))) {
        if (Number(item[idKey]) !== Number(asciiDigits(filter))) rejected = true;
      } else if (normalizeArabic(item[nameKey]) !== normalizeArabic(filter)) rejected = true;
    }
    if (rejected) continue;
    const titleText = item.searchTitle ?? normalizeArabic(item.title);
    const body = item.searchBody ?? normalizeArabic(item.bodyText);
    const rank = q ? (withoutArticles(titleText).includes(withoutArticles(q)) ? 10 : 0)
      + variants.reduce((score, choices) => score
        + (choices.some((word) => titleText.includes(word)) ? 5 : 0)
        + (choices.some((word) => body.includes(word)) ? 1 : 0), 0) : 0;
    matches.push({ item, rank, iso: iso ?? '', indexedAt: item.indexedAt ?? '' });
  }

  matches.sort((a, b) => {
    if (sort === 'added') return b.indexedAt.localeCompare(a.indexedAt) || b.item.maqamId - a.item.maqamId;
    if (sort === 'relevance' && q && b.rank !== a.rank) return b.rank - a.rank;
    if (sort === 'oldest') return (a.iso || '9999').localeCompare(b.iso || '9999') || a.item.maqamId - b.item.maqamId;
    return b.iso.localeCompare(a.iso) || b.item.maqamId - a.item.maqamId;
  });
  const pageSize = Math.min(positiveNumber(filters.pageSize, 12), 100);
  const total = matches.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(positiveNumber(filters.page, 1), totalPages);
  return { results: matches.slice((page - 1) * pageSize, page * pageSize).map(({ item }) => item), total, page, pageSize, totalPages };
}

/**
 * Extract up to five pages and persist them via an injected storage adapter.
 * `storage.upsertMany(records)` must save/upsert by (userId, maqamId) in the
 * host app's database. The module deliberately does not create shared tables.
 */
export async function importToArchive(filters = {}, options = {}, storage) {
  if (typeof storage?.upsertMany !== 'function') throw new Error('يلزم توفير storage.upsertMany لحفظ الأحكام محليًا');
  const bundle = await collectJudgments(filters, options);
  const records = bundle.results.map(normalizeLocalJudgment);
  if (records.length) await storage.upsertMany(records);
  return { ...bundle, saved: records.length, records };
}

/** Import one decision into the same adapter, including its full text. */
export async function importOneToArchive(id, storage) {
  if (typeof storage?.upsertMany !== 'function') throw new Error('يلزم توفير storage.upsertMany');
  const record = normalizeLocalJudgment(await getJudgment(id));
  await storage.upsertMany([record]);
  return record;
}

/** In-memory adapter for testing only; it is NOT persistent across restarts. */
export function createMemoryArchive() {
  const data = new Map();
  return {
    async upsertMany(records) {
      for (const item of records) {
        const existing = data.get(item.maqamId);
        data.set(item.maqamId, { ...existing, ...item,
          bodyText: item.bodyText || existing?.bodyText || null,
          searchBody: item.bodyText ? item.searchBody : existing?.searchBody ?? '',
          searchText: item.bodyText ? item.searchText : [item.searchText, existing?.searchBody].filter(Boolean).join(' '),
        });
      }
    },
    async list() { return [...data.values()]; },
    async getById(id) { return data.get(Number(id)) ?? null; },
  };
}

/** WhatsApp shares a citation and the ORIGINAL public URL, never private notes. */
export function buildWhatsAppMessage(items, options = {}) {
  if (!Array.isArray(items) || !items.length) throw new Error('اختر حكمًا واحدًا على الأقل');
  const intro = String(options.introduction ?? '').trim().slice(0, 400);
  const citations = items.slice(0, 5).map((item, index) => {
    const id = positiveNumber(item.maqamId);
    if (!id) throw new Error('معرّف الحكم غير صحيح');
    return [
      `${index + 1}. ${clean(item.title).slice(0, 250)}`,
      item.court ? `المحكمة: ${clean(item.court)}` : null,
      item.number && item.year ? `رقم القضية: ${item.number}/${item.year}` : null,
      item.decisionDateIso || item.decisionDate ? `تاريخ القرار: ${item.decisionDateIso ?? item.decisionDate}` : null,
      `المصدر: ${MAQAM_BASE}/judgments/${id}/`,
    ].filter(Boolean).join('\n');
  });
  return ['⚖️ مراجع قضائية فلسطينية', intro || null, ...citations,
    'المرجع: الموسوعة القانونية – جامعة النجاح. راجع النص الأصلي قبل الاستشهاد.'].filter(Boolean).join('\n\n');
}

export function buildWhatsAppUrl(items, options = {}) {
  const phone = asciiDigits(options.phone ?? '').replace(/[^0-9]/g, '');
  if (phone && (phone.length < 8 || phone.length > 15)) throw new Error('رقم واتساب الدولي غير صحيح');
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildWhatsAppMessage(items, options))}`;
}

/** Offline, A4-printable HTML: brief legal memo, complete decisions, or citations. */
export function buildPrintHtml(items, options = {}) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 10) {
    throw new Error('اختر من حكم واحد إلى عشرة أحكام للطباعة');
  }
  const template = ['brief', 'full', 'list'].includes(options.template) ? options.template : 'brief';
  const heading = template === 'full' ? 'ملف الأحكام القضائية'
    : template === 'list' ? 'كشف مراجع الأحكام القضائية' : 'مذكرة استشهاد بأحكام قضائية';
  const source = (item) => `${MAQAM_BASE}/judgments/${positiveNumber(item.maqamId)}/`;
  const citation = (item) => [item.court ?? 'المحكمة', item.number && item.year
    ? `رقم ${item.number}/${item.year}` : `حكم ${item.maqamId}`, item.decisionDateIso ?? item.decisionDate]
    .filter(Boolean).map(escapeHtml).join(' · ');
  let content;
  if (template === 'list') {
    content = `<table><thead><tr><th>#</th><th>رقم القضية</th><th>المحكمة</th><th>التاريخ</th><th>التصنيف</th></tr></thead><tbody>${items.map((item, i) =>
      `<tr><td>${i + 1}</td><td>${escapeHtml(item.number && item.year ? `${item.number}/${item.year}` : item.maqamId)}</td><td>${escapeHtml(item.court ?? '—')}</td><td>${escapeHtml(item.decisionDateIso ?? item.decisionDate ?? '—')}</td><td>${escapeHtml(item.branch ?? item.subject ?? '—')}</td></tr>`).join('')}</tbody></table>`;
    content += `<p class="source">المصادر: ${items.map((item, i) => `${i + 1}. ${escapeHtml(source(item))}`).join('<br>')}</p>`;
  } else if (template === 'full') {
    content = items.map((item, i) => `<article class="full ${i ? 'new-page' : ''}"><h2>${escapeHtml(item.title)}</h2>
<p class="meta">${citation(item)}</p><div class="body">${escapeHtml(item.bodyText || item.snippet || 'النص الكامل غير محفوظ محليًا؛ راجع المصدر الأصلي.')}</div>
<p class="source">المصدر: ${escapeHtml(source(item))}</p></article>`).join('\n');
  } else {
    content = items.map((item, i) => `<article class="brief"><h2>${i + 1}. ${citation(item)}</h2>
<p>${escapeHtml(item.title)}</p><blockquote>«${escapeHtml(String(item.bodyText || item.snippet || 'راجع الحكم الأصلي').replace(/\s+/g, ' ').slice(0, 470))}»</blockquote>
<p class="source">المصدر: ${escapeHtml(source(item))}</p></article>`).join('\n');
  }
  const note = String(options.note ?? '').trim().slice(0, 1800);
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${heading}</title><style>
@page{size:A4;margin:16mm}*{box-sizing:border-box}body{font:14px/2 system-ui,"Segoe UI",Tahoma,sans-serif;color:#172b25;background:#f6f9f7;margin:0}
main{max-width:210mm;margin:auto;padding:25px;background:#fff;min-height:297mm}header{border-bottom:3px solid #0b6b53;padding-bottom:15px}header h1{text-align:center;font-size:21px;margin:14px 0 0}
.meta,.source,footer{color:#596a65;font-size:11px}.source{overflow-wrap:anywhere}.toolbar{max-width:210mm;margin:14px auto}.toolbar button{background:#0b6b53;color:white;border:0;border-radius:7px;padding:9px 18px;cursor:pointer}
article{padding:16px 0;border-bottom:1px solid #e0e8e3}article.brief{break-inside:avoid}article h2{font-size:15px;color:#0b6b53;margin:0}.body{white-space:pre-wrap;line-height:2.2}blockquote{border-right:3px solid #9bb8a9;margin:10px 0;padding:8px 12px;background:#f7faf7}
table{width:100%;border-collapse:collapse;margin:20px 0;font-size:12px;text-align:right}td,th{border:1px solid #d6e1da;padding:7px}th{background:#0b6b53;color:white}
footer{border-top:1px solid #ddd;margin-top:28px;padding-top:10px}.new-page{break-before:page}
@media print{body{background:white}main{padding:0;max-width:none;min-height:0}.toolbar{display:none}}
</style></head><body><div class="toolbar"><button type="button" onclick="window.print()">طباعة / حفظ PDF</button></div><main>
<header><strong>${escapeHtml(options.office ?? 'مكتب المحاماة')}</strong><h1>${heading}</h1>
${options.caseRef ? `<p>مرجع الملف: ${escapeHtml(options.caseRef)}</p>` : ''}
${options.recipient ? `<p>إلى: ${escapeHtml(options.recipient)}</p>` : ''}
<p class="meta">تاريخ الإعداد: ${escapeHtml(new Date().toISOString().slice(0, 10))} · عدد الأحكام: ${items.length}</p></header>
${note ? `<blockquote>${escapeHtml(note)}</blockquote>` : ''}${content}
<footer>المصدر: الموسوعة القانونية – جامعة النجاح الوطنية. يرجى مطابقة النص مع الحكم الأصلي.
${options.preparedBy ? `<br>إعداد: ${escapeHtml(options.preparedBy)}` : ''}</footer></main></body></html>`;
}
