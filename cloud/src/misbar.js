// مولّد تلقائياً من office/lib/misbar.js — لا تعدّله يدوياً
// مِسْبار | Misbar AI — عقل التحليل والاستنباط القانوني: نواة البحث في قاعدة التشريعات والقرارات (فلسطين، الأردن، مصر).
// قاعدة القراءة فقط تُبنى بـ tools/misbar-build.js من ملفات المصادر، وتُقرأ هنا عبر محوّل db = { all(q,...a) } (متزامن أو وعد).
// المكتب: node:sqlite على ملف mithaq-lawindex.db · السحابة: D1 (نسخة مطابقة في cloud/src/misbar.js بصيغة ESM).


/* المصادر: الفلسطيني مرجع أساسي، والأردني والمصري للمقارنة والاستئناس فقط */
const SOURCES = {
  PS_LEGISLATION: { label: 'فلسطين · تشريعات', country: 'PS', kind: 'law', primary: true },
  PS_JUDGMENT: { label: 'فلسطين · أحكام', country: 'PS', kind: 'ruling', primary: true },
  JO_LEGISLATION: { label: 'الأردن · تشريعات', country: 'JO', kind: 'law' },
  JO_CASSATION: { label: 'الأردن · تمييز', country: 'JO', kind: 'ruling' },
  EG_LEGISLATION: { label: 'مصر · تشريعات', country: 'EG', kind: 'law' },
};
const STATUS = { in_force: 'ساري', partial: 'ساري في الضفة الغربية', suspended: 'موقوف النفاذ', repealed: 'ملغى / غير ساري' };
const SORTS = ['relevance', 'year_desc', 'year_asc'];

/* تطبيع عربي موحّد للفهرسة والاستعلام: بلا تشكيل ولا تطويل، توحيد الألف والياء والتاء المربوطة، الأرقام الهندية،
   ونزع أدوات التعريف والعطف والجر الملتصقة (وال، بال، كال، فال، لل، ال) من الكلمات الطويلة حتى تطابق «بالشيك» كلمة «شيك». */
const PREF = /^(?:وال|بال|كال|فال|لل|ال)(?=[ء-ي]{3,})/;
function norm(s) {
  return String(s ?? '').toLowerCase().replace(/[ً-ْٰـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x660))
    .split(/[^0-9a-zء-ي]+/).filter(Boolean).map(w => w.length > 4 ? w.replace(PREF, '') : w).join(' ');
}
/* كلمات لا تفيد البحث */
const STOP = new Set(['في', 'من', 'على', 'الى', 'عن', 'او', 'ان', 'ما', 'لا', 'مع', 'هل', 'هو', 'هي', 'ذلك', 'التي', 'الذي', 'تم', 'قد', 'كل', 'اي', 'بين', 'او']);
/* استعلام FTS5 آمن: كل كلمة بين علامتي تنصيص، و«*» للبادئة. عبارة بين علامتي تنصيص تبقى عبارة. */
function ftsQuery(q, mode = 'all') {
  const raw = String(q ?? '').slice(0, 300), parts = [];
  raw.replace(/"([^"]{2,120})"/g, (_, ph) => { const n = norm(ph); if (n) parts.push('"' + n + '"'); return ' ' });
  const rest = raw.replace(/"[^"]*"/g, ' ');
  for (const w of norm(rest).split(' ')) if (w && !STOP.has(w) && (w.length > 1 || /\d/.test(w))) parts.push('"' + w + '"' + (w.length >= 3 && !/^\d+$/.test(w) ? '*' : ''));
  const uniq = [...new Set(parts)].slice(0, 16);
  return uniq.length ? uniq.join(mode === 'any' ? ' OR ' : ' AND ') : '';
}
const int = (v, a, b, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.min(b, Math.max(a, n)) : d };
const clip = (s, n) => String(s ?? '').trim().slice(0, n);

/* مقتطف حول أول تطابق: يُطبَّع النص حرفاً حرفاً مع حفظ موضع كل حرف في الأصل، فيقع المقتطف على الكلمة نفسها */
const CH = { 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ى': 'ي', 'ة': 'ه', 'ؤ': 'و', 'ئ': 'ي' };
function snippet(body, q, len = 260) {
  const text = String(body || '').replace(/\s+/g, ' ').trim(); if (!text) return '';
  const ws = norm(String(q || '').replace(/"/g, ' ')).split(' ').filter(w => w.length > 1 && !STOP.has(w)).sort((a, b) => b.length - a.length);
  let flat = '', map = [];
  for (let i = 0; i < text.length && flat.length < 400000; i++) {
    let c = text[i]; if (/[ً-ْٰـ]/.test(c)) continue;
    c = CH[c] || c.toLowerCase(); if (c >= '٠' && c <= '٩') c = String(c.charCodeAt(0) - 0x660);
    flat += c; map.push(i);
  }
  let at = -1;
  for (const w of ws) { const i = flat.indexOf(w); if (i >= 0) { at = map[i]; break } }
  if (at < 0) return text.slice(0, len) + (text.length > len ? ' …' : '');
  let s = Math.max(0, at - Math.floor(len / 3)); if (s > 0) { const sp = text.indexOf(' ', s); if (sp > 0 && sp < at) s = sp + 1 }
  return (s > 0 ? '… ' : '') + text.slice(s, s + len) + (s + len < text.length ? ' …' : '');
}

const COLS = 'd.id,d.src,d.country,d.kind,d.ext_id,d.title,d.year,d.number,d.court,d.case_no,d.date,d.ltype,d.subject,d.status,d.status_code,d.url,d.has_text';
/* يبني شروط البحث من الفلاتر */
function where(f) {
  const w = [], a = [];
  const src = String(f.src || '').split(',').filter(s => SOURCES[s]);
  if (src.length) { w.push('d.src IN (' + src.map(() => '?').join(',') + ')'); a.push(...src) }
  if (f.country && /^(PS|JO|EG)$/.test(f.country)) { w.push('d.country=?'); a.push(f.country) }
  if (f.kind === 'law' || f.kind === 'ruling') { w.push('d.kind=?'); a.push(f.kind) }
  const y1 = int(f.year_from || f.year, 1800, 2100, 0), y2 = int(f.year_to || f.year, 1800, 2100, 0);
  if (y1) { w.push('d.year>=?'); a.push(y1) } if (y2) { w.push('d.year<=?'); a.push(y2) }
  if (f.court) { w.push('d.court LIKE ?'); a.push('%' + clip(f.court, 60) + '%') }
  if (f.ltype) { w.push('d.ltype LIKE ?'); a.push('%' + clip(f.ltype, 60) + '%') }
  if (f.subject) { w.push('d.subject LIKE ?'); a.push('%' + clip(f.subject, 80) + '%') }
  if (f.case_no && /^[0-9]{1,7}(\/[0-9]{2,4})?$/.test(String(f.case_no).trim())) { const c = String(f.case_no).trim(); if (c.includes('/')) { w.push('d.case_no=?'); a.push(c) } else { w.push('d.case_no LIKE ?'); a.push(c + '/%') } }
  if (f.number && /^[0-9]{1,6}$/.test(String(f.number).trim())) { w.push('d.number=?'); a.push(String(f.number).trim()) }
  if (f.status && STATUS[f.status]) { if (f.status === 'in_force') { w.push("d.status_code IN ('in_force','partial')") } else { w.push('d.status_code=?'); a.push(f.status) } }
  if (f.has_text === '1') w.push('d.has_text=1');
  return { w, a };
}

/* createMisbar(db): db.all(sql, ...args) يعيد مصفوفة صفوف (أو وعداً بها) */
function createMisbar(db, { audit } = {}) {
  const all = async (q, ...a) => await db.all(q, ...a);
  async function search(f = {}) {
    const q = clip(f.q, 300), fq = ftsQuery(q, f.mode === 'any' ? 'any' : 'all');
    const { w, a } = where(f);
    if (!fq && !w.length) return { results: [], total: 0, page: 1, pages: 0, facets: {} };
    const per = int(f.per, 5, 50, 20), page = int(f.page, 1, 10000, 1);
    const sort = SORTS.includes(f.sort) ? f.sort : (fq ? 'relevance' : 'year_desc');
    const from = fq ? 'fts JOIN docs d ON d.id=fts.rowid' : 'docs d';
    const cond = (fq ? ['fts MATCH ?'] : []).concat(w), args = (fq ? [fq] : []).concat(a);
    const W = cond.length ? ' WHERE ' + cond.join(' AND ') : '';
    /* الترتيب بالصلة: bm25 مع وزن أكبر للعنوان، ثم الفلسطيني أولاً */
    const order = sort === 'relevance' && fq ? 'bm25(fts,4.0,1.0) + (CASE d.country WHEN \'PS\' THEN -2.0 ELSE 0 END)' : sort === 'year_asc' ? 'd.year ASC, d.id' : 'd.year DESC, d.id DESC';
    const [cnt] = await all(`SELECT COUNT(*) n FROM ${from}${W}`, ...args);
    const total = Number(cnt?.n || 0);
    const rows = total ? await all(`SELECT ${COLS}, substr(d.body,1,20000) body FROM ${from}${W} ORDER BY ${order} LIMIT ? OFFSET ?`, ...args, per, (page - 1) * per) : [];
    const facets = {};
    if (total && f.facets !== '0') {
      for (const r of await all(`SELECT d.src k, COUNT(*) n FROM ${from}${W} GROUP BY d.src`, ...args)) (facets.src ||= {})[r.k] = Number(r.n);
    }
    const results = rows.map(r => { const { body, ...x } = r; return { ...x, source: SOURCES[r.src]?.label || r.src, primary: !!SOURCES[r.src]?.primary, excerpt: snippet(body, q) } });
    return { results, total, page, pages: Math.ceil(total / per), per, sort, query: fq, facets };
  }
  async function doc(id) {
    const n = int(id, 1, 1e9, 0); if (!n) return null;
    const [r] = await all(`SELECT ${COLS}, d.file_url, d.body, d.cites, d.meta FROM docs d WHERE d.id=?`, n);
    if (!r) return null;
    const j = s => { try { return JSON.parse(s || 'null') } catch { return null } };
    return { ...r, cites: j(r.cites) || [], meta: j(r.meta) || {}, source: SOURCES[r.src]?.label || r.src, primary: !!SOURCES[r.src]?.primary };
  }
  async function stats() {
    const rows = await all('SELECT src, COUNT(*) n, SUM(has_text) t, MIN(year) y1, MAX(year) y2 FROM docs GROUP BY src');
    const meta = Object.fromEntries((await all('SELECT k, v FROM meta').catch(() => [])).map(r => [r.k, r.v]));
    return { sources: rows.map(r => ({ src: r.src, label: SOURCES[r.src]?.label || r.src, n: Number(r.n), texts: Number(r.t), from: r.y1, to: r.y2 })), version: meta.version || '', built: meta.built || '' };
  }
  /* مقتطفات موثّقة للتحليل: أفضل النتائج ذات النص، مع نص كافٍ للاستشهاد */
  async function excerpts(q, { n = 8, src, chars = 2400 } = {}) {
    const r = await search({ q, src, has_text: '1', per: Math.min(20, n * 2), facets: '0', mode: 'any' });
    const out = [];
    for (const x of r.results.slice(0, n)) { const d = await doc(x.id); if (d && d.body) out.push({ ref: 'M' + d.id, id: d.id, src: d.src, source: d.source, primary: d.primary, title: d.title, year: d.year, court: d.court, case_no: d.case_no, status: d.status, url: d.url, excerpt: snippet(d.body, q, chars) }) }
    return out;
  }
  /* هل الاقتباس موجود حرفياً (بعد التطبيع) في نص المرجع المخزّن؟ */
  async function verifyQuote(id, quote) {
    const d = await doc(id); if (!d) return { ok: false, error: 'المرجع غير موجود' };
    if (!d.body) return { ok: false, error: 'لا يوجد نص مخزّن لهذا المرجع' };
    const q = norm(quote); if (q.length < 8) return { ok: false, error: 'الاقتباس قصير جداً' };
    return { ok: norm(d.body).includes(q), title: d.title, src: d.src, comparative: !d.primary };
  }
  /* واجهة HTTP موحّدة: action = search | doc | stats | verify */
  async function handle(action, params, me) {
    const who = { user_id: me?.id, user_name: me?.name };
    try {
      if (action === 'search') { const r = await search(params); audit && audit({ ...who, action: 'misbar.search', entity: 'misbar', detail: { q: clip(params.q, 120), n: r.total } }); return { status: 200, body: r } }
      if (action === 'doc') { const d = await doc(params.id); if (!d) return { status: 404, body: { error: 'المستند غير موجود' } }; audit && audit({ ...who, action: 'misbar.doc', entity: 'misbar', entity_id: String(d.id) }); return { status: 200, body: d } }
      if (action === 'stats') return { status: 200, body: await stats() };
      if (action === 'verify') return { status: 200, body: await verifyQuote(params.id, params.quote) };
      return { status: 404, body: { error: 'غير موجود' } };
    } catch (e) {
      const m = String(e && e.message || e);
      if (/no such table|SQLITE_CANTOPEN|unable to open/i.test(m)) return { status: 503, body: { error: 'قاعدة المسبار غير مثبتة على هذا الخادم بعد', code: 'NO_INDEX' } };
      if (/fts5|MATCH|syntax/i.test(m)) return { status: 400, body: { error: 'صيغة البحث غير مفهومة؛ جرّب كلمات أبسط' } };
      throw e;
    }
  }
  return { search, doc, stats, excerpts, verifyQuote, handle };
}

/* بدائل بنفس واجهة البحث القديم للصياغة والمساعد: lawSearch(action, params) و rulingSearch(q, user, max) */
function adapters(m) {
  const lawSearch = async (action, p = {}) => {
    try {
      if (action === 'search') {
        const r = await m.search({ q: p.q, kind: 'law', has_text: '1', per: 6, facets: '0', mode: 'any' });
        return { status: 200, body: { items: r.results.map(x => ({ id: x.id, title: x.title + (x.primary ? '' : ' (' + x.source + ' — للمقارنة)'), articles: 1 })) } };
      }
      if (action === 'item') { const d = await m.doc(p.id); return d ? { status: 200, body: { item: { title: d.title + (d.primary ? '' : ' (' + d.source + ' — للمقارنة والاستئناس)'), ref: d.status || '', content: d.body } } } : { status: 404, body: {} } }
    } catch (e) { return { status: 503, body: { error: String(e.message || e) } } }
    return { status: 404, body: {} };
  };
  const rulingSearch = async (q, user, max = 3) => {
    let r; try { r = await m.search({ q, kind: 'ruling', has_text: '1', per: max * 2, facets: '0', mode: 'any' }) } catch (e) { return [] }
    const ps = r.results.filter(x => x.primary), pick = (ps.length >= max ? ps : [...ps, ...r.results.filter(x => !x.primary)]).slice(0, max), out = [];
    for (const x of pick) { const d = await m.doc(x.id); if (d && d.body) out.push({ id: 'M' + d.id, title: (d.court ? d.court + ' ' : '') + (d.case_no || d.title) + (d.primary ? '' : ' (' + d.source + ' — للاستئناس)'), date: d.date || String(d.year || ''), url: d.url, text: d.body }) }
    return out;
  };
  return { lawSearch, rulingSearch };
}


export { SOURCES, STATUS, norm, ftsQuery, snippet, createMisbar, adapters };
