// البحث المباشر في مصادر التشريعات الفلسطينية على الإنترنت (من شاشة «التشريعات الفلسطينية»).
// يبحث المحامي بنفسه: طلب واحد لكل ضغطة بحث أو فتح تشريع؛ لا جلب آلي ولا مجدول ولا نسخ جماعي.
// الواجهة لا تعرض اسم المصدر؛ المعرّف الخارجي مرمّز (s1:رقم).
// بلا مكتبات خارجية (تعمل في Node وفي Cloudflare Workers). نسخة مطابقة في cloud/src/law-sources.js
'use strict';

const UA = 'Mithaq-Law-Office/2.0 (legal research by a law office; one request per user action)';
const LIMITS = { search: [30, 60e3], item: [30, 60e3], items: [4, 600e3] };
const MAX_BUSY = 3, ITEMS_MAX = 20, CACHE_MS = 10 * 60e3;

/* المصادر: كل مصدر = محوّل بحث + محوّل تشريع. المفعّل الآن مصدر واحد عام النشر بنص كامل منظم بالمواد.
   مصادر أخرى معتمدة فُحصت ولم تُفعّل: المرجع الإلكتروني للتشريعات المدمجة (محمي بتحدٍّ ضد البرامج، فلا يُتجاوز)،
   وبحث موقع ديوان الجريدة الرسمية (أخبار وأعداد PDF لا سجلات تشريع)، ومنظومة جامعية أخرى (غير متاحة وقت الفحص). */
const S1 = 'https://maqam.najah.edu';

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const dec = s => String(s || '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, k) => k[0] === '#' ? String.fromCodePoint(k[1] === 'x' || k[1] === 'X' ? parseInt(k.slice(2), 16) : +k.slice(1)) : (ENT[k] ?? m));
const text = h => dec(String(h || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>\s*<p[^>]*>/gi, '\n').replace(/<[^>]+>/g, '')).replace(/[ \t ]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
const one = s => text(s).replace(/\s+/g, ' ').trim();
function dlPairs(html) {
  const out = {}; const re = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/g; let m;
  while ((m = re.exec(html))) { const k = one(m[1]); if (k && !(k in out)) out[k] = m[2] }
  return out;
}

/* تحويل التصنيف إلى قوائم الشاشة */
function mapType(sub, main, title) {
  const t = [sub, main, title].join(' ');
  if (/قرار\s*بقانون/.test(t)) return 'قرار بقانون';
  if (/مرسوم/.test(t)) return 'مرسوم';
  if (/تعليمات/.test(t)) return 'تعليمات';
  if (/نظام/.test(sub || '') || /^نظام/.test(title || '')) return 'نظام';
  if (/اتفاقي|معاهد/.test(t)) return 'اتفاقية';
  if (/تعديل/.test(sub || '')) return 'تعديل';
  if (/قانون/.test(sub || '') || /^قانون/.test(title || '')) return 'قانون';
  return 'قرار';
}
function mapSource(type, sub, title, year) {
  const t = [sub, title].join(' ');
  if (/مجلس الوزراء/.test(t)) return 'مجلس الوزراء';
  if (/القضاء الأعلى|السلطة القضائية|مجلس القضاء/.test(t)) return 'السلطة القضائية';
  if (/الدستورية/.test(t)) return 'المحكمة الدستورية العليا';
  if (/النقض/.test(t)) return 'محكمة النقض';
  if (/وزير العدل|وزارة العدل/.test(t)) return 'وزارة العدل';
  if (type === 'قرار بقانون' || type === 'مرسوم' || /رئيس/.test(t)) return 'رئيس دولة فلسطين';
  if (type === 'قانون' && +year >= 1996) return 'المجلس التشريعي';
  if (type === 'نظام') return 'مجلس الوزراء';
  return 'جهة أخرى';
}
function mapStatus(raw) { return /ملغ/.test(raw) ? 'ملغي' : /معدل/.test(raw) ? 'معدل' : /ساري|نافذ/.test(raw) ? 'ساري' : 'غير محدد' }

/* ── المصدر 1 ── */
function s1SearchUrl(q, page) { const u = new URL(S1 + '/legislation/search/'); u.searchParams.set('q', q); if (page > 1) u.searchParams.set('page', String(page)); return u.href }
function s1ParseSearch(html, page) {
  const items = []; const re = /<li class="py-2 border-bottom">([\s\S]*?)<\/li>/g; let m;
  while ((m = re.exec(html))) {
    const b = m[1], a = b.match(/<a href="\/legislation\/(\d+)\/[^"]*"><strong>([\s\S]*?)<\/strong><\/a>/); if (!a) continue;
    const kv = dlPairs(b), badges = k => [...String(kv[k] || '').matchAll(/<span[^>]*>([\s\S]*?)<\/span>/g)].map(x => one(x[1])).filter(Boolean);
    const kind = badges('نوع التشريع'), subj = badges('التصينف الموضوعي'), st = badges('حالة التشريع').join(' '), n = +(badges('عدد المواد')[0] || 0);
    const snip = (b.match(/<div class="my-1 text-muted">([\s\S]*?)<\/div>/) || [])[1] || '';
    const title = one(a[2]), year = (title.match(/لسنة\s*(\d{4})/) || [])[1] || '';
    const type = mapType(kind[1], kind[0], title);
    items.push({ id: 's1:' + a[1], title, kind: kind.filter(Boolean).join(' / '), type, subject: [...new Set(subj)].join(' / '), statusRaw: st, status: mapStatus(st), articles: n, year: year ? +year : null, hit: one(snip).replace(/^\.\.\.\s*/, '… ') });
  }
  const pm = html.match(/Page \d+ of (\d+)/); const pages = pm ? +pm[1] : (items.length ? page : 0);
  return { items, page, pages: Math.max(pages, items.length ? page : 0) };
}
function s1ParseItem(html, id) {
  const kv = dlPairs(html.slice(0, html.indexOf('</dl>') + 5));
  const g = k => one(kv[k] || '');
  const title = g('العنوان'); if (!title) throw Object.assign(new Error('تعذّر قراءة التشريع من المصدر.'), { status: 502 });
  const year = +g('السنة') || +((title.match(/لسنة\s*(\d{4})/) || [])[1]) || null, no = g('الرقم');
  const kindMain = g('نوع التشريع'), kindSub = g('نوع تشريع - فرعي'), subj = [g('التصينف الموضوعي'), g('تصنيف موضوعي - فرعي')].filter(Boolean);
  const statusRaw = g('حالة التشريع'), type = mapType(kindSub, kindMain, title);
  /* المواد: عناوين الأبواب والفصول (h5/h6) ثم أزواج «المادة (n)» ونصها */
  const body = html.slice(html.indexOf('</dl>') + 5, html.search(/<div class="col-md-3">\s*<a href="\/media\//) > 0 ? html.search(/<div class="col-md-3">\s*<a href="\/media\//) : undefined);
  const parts = []; const re = /<h5[^>]*>([\s\S]*?)<\/h5>|<h6[^>]*>([\s\S]*?)<\/h6>|<dt[^>]*>\s*<a href="\/legislation\/\d+\/item\/\d+\/">([\s\S]*?)<\/a>[\s\S]*?<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/g; let m, arts = 0;
  while ((m = re.exec(body))) {
    if (m[1] || m[2]) parts.push({ h: one(m[1] || m[2]).replace(/\s*\n\s*/g, ' - ') });
    else { arts++; parts.push({ a: one(m[3]), t: text(m[4]) }) }
  }
  const content = parts.map(p => p.h ? '— ' + p.h + ' —' : p.a + ': ' + p.t).join('\n');
  const hasPdf = /href="\/media\/[^"]+\.pdf"/i.test(html);
  return {
    id, title, year, no, ref: no && year ? `${no}/${year}` : no, kind: [kindMain, kindSub].filter(Boolean).join(' / '), type,
    source: mapSource(type, kindSub, title, year), subject: subj.join(' / '), statusRaw, status: mapStatus(statusRaw), articles: arts, parts, content, hasPdf,
    summary: [kindSub || kindMain, subj.join(' / '), statusRaw, arts ? arts + ' مادة' : ''].filter(Boolean).join(' · '),
  };
}

function createLimiter() {
  const hits = new Map();
  return (key, kind) => {
    const [max, win] = LIMITS[kind], k = kind + '|' + key, now = Date.now();
    const a = (hits.get(k) || []).filter(t => now - t < win);
    if (a.length >= max) { hits.set(k, a); return Math.ceil((win - (now - a[0])) / 1000) }
    a.push(now); hits.set(k, a);
    if (hits.size > 2000) for (const [kk, v] of hits) if (!v.some(t => now - t < 600e3)) hits.delete(kk);
    return 0;
  };
}

/* سجل جاهز للاستيراد إلى مكتبة المكتب (بأسماء أعمدة الاستيراد نفسها) */
const toLibrary = x => ({ titleAr: x.title, referenceNumber: x.ref || '', type: x.type, source: x.source, status: x.status, year: x.year || '', summary: x.summary || x.title, content: x.content || x.title, tags: String(x.subject || '').split(' / ').filter(Boolean) });

function createLawSearch({ audit, fetchImpl = fetch } = {}) {
  const limit = createLimiter(), cache = new Map(); let busy = 0;
  async function get(url) {
    const c = cache.get(url); if (c && Date.now() - c.at < CACHE_MS) return c.html;
    const ac = new AbortController(), t = setTimeout(() => ac.abort(), 25000);
    let r; try { r = await fetchImpl(url, { headers: { 'user-agent': UA, 'accept-language': 'ar' }, redirect: 'follow', signal: ac.signal }) }
    catch (e) { throw Object.assign(new Error('تعذّر الوصول إلى مصادر التشريعات. تحقق من اتصال الإنترنت.'), { status: 502 }) }
    finally { clearTimeout(t) }
    if (r.status === 404) throw Object.assign(new Error('التشريع غير موجود في المصدر.'), { status: 404 });
    if (!r.ok) throw Object.assign(new Error('المصدر لا يستجيب الآن (' + r.status + '). حاول لاحقاً.'), { status: 502 });
    const html = await r.text();
    cache.set(url, { at: Date.now(), html }); if (cache.size > 200) cache.delete(cache.keys().next().value);
    return html;
  }
  const parseId = v => { const m = String(v || '').match(/^s1:(\d{1,7})$/); return m ? +m[1] : null };
  async function item(id) { const n = parseId(id); if (!n) throw Object.assign(new Error('رقم التشريع غير صحيح.'), { status: 400 }); return s1ParseItem(await get(`${S1}/legislation/${n}/`), id) }

  return async function run(action, p, user) {
    const key = String(user && (user.id || user.username) || 'anon'), who = { user_id: user && user.id, username: user && user.username };
    const deny = kind => { const w = limit(key, kind); return w ? { status: 429, body: { error: `طلبات كثيرة. حاول بعد ${w} ثانية.`, retry: w } } : null };
    if (busy >= MAX_BUSY) return { status: 429, body: { error: 'الخادم مشغول بطلبات بحث أخرى. حاول بعد لحظات.' } };
    busy++;
    try {
      if (action === 'search') {
        const q = String(p.q || '').replace(/\s+/g, ' ').trim().slice(0, 120), page = Math.min(500, Math.max(1, parseInt(p.page, 10) || 1));
        if (q.length < 2) return { status: 400, body: { error: 'اكتب كلمتين أو كلمة من حرفين على الأقل.' } };
        const d = deny('search'); if (d) return d;
        const r = s1ParseSearch(await get(s1SearchUrl(q, page)), page);
        audit && audit({ ...who, action: 'lawsearch.search', entity: 'laws', detail: { q: q.slice(0, 120), page, n: r.items.length } });
        return { status: 200, body: { ok: true, q, ...r } };
      }
      if (action === 'item') {
        const d = deny('item'); if (d) return d;
        const x = await item(p.id);
        audit && audit({ ...who, action: 'lawsearch.item', entity: 'laws', entity_id: String(p.id), detail: { label: x.title.slice(0, 120) } });
        return { status: 200, body: { ok: true, item: x, rec: toLibrary(x) } };
      }
      if (action === 'items') {
        const ids = [...new Set(String(p.ids || '').split(',').map(s => s.trim()).filter(Boolean))];
        if (!ids.length || ids.length > ITEMS_MAX) return { status: 400, body: { error: `اختر من 1 إلى ${ITEMS_MAX} تشريعاً للاستخراج من المصادر.` } };
        const d = deny('items'); if (d) return d;
        const out = [];
        for (const id of ids) { const fresh = !cache.has(`${S1}/legislation/${parseId(id)}/`); out.push(await item(id)); if (fresh) await new Promise(r => setTimeout(r, 400)) } // تمهّل بين الطلبات
        audit && audit({ ...who, action: 'lawsearch.extract', entity: 'laws', detail: { n: out.length } });
        return { status: 200, body: { ok: true, items: out } };
      }
      return { status: 404, body: { error: 'غير موجود' } };
    } catch (e) { return { status: e.status || 500, body: { error: e.status ? e.message : 'تعذّر إتمام البحث في المصادر.' } } }
    finally { busy-- }
  };
}

module.exports = { createLawSearch, s1ParseSearch, s1ParseItem, toLibrary, mapType, mapStatus };
