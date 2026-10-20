// التشريعات الفلسطينية: مكتبة يدخلها المكتب يدوياً أو باستيراد ملف (لا جلب تلقائي من أي مصدر خارجي).
// منطق مشترك بين خادم المكتب (node:sqlite) والسحابة (SQLite داخل Durable Object): db = { all(q,...a), run(q,...a), tx(fn) }
// الجدول منفصل عن سجلات المزامنة لأن نصوص التشريعات كبيرة؛ البحث والفلترة والترقيم تتم في الخادم.
// نسخة السحابة من office/lib/laws.js (المنطق نفسه حرفياً؛ عدّل الاثنين معاً)

const TYPES = ['قانون', 'قرار بقانون', 'مرسوم', 'قرار', 'نظام', 'تعميم', 'اتفاقية', 'تعديل'];
const SOURCES = ['الجريدة الرسمية الفلسطينية', 'مجلس الوزراء', 'المجلس التشريعي', 'رئيس دولة فلسطين', 'ديوان الفتوى والتشريع', 'وزارة العدل', 'محكمة النقض', 'المحكمة الدستورية العليا', 'السلطة القضائية'];
const STATUSES = ['ساري', 'معدل', 'ملغي', 'مقترح'];
const SORTS = ['relevance', 'year_desc', 'year_asc', 'title', 'added'];
const LIM = { title: 500, summary: 8000, content: 2 * 1024 * 1024, tags: 30, tag: 60, batch: 2000 };

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS laws(id TEXT PRIMARY KEY, data TEXT NOT NULL, ntitle TEXT NOT NULL, nsum TEXT NOT NULL, norm TEXT NOT NULL, dkey TEXT NOT NULL,
    type TEXT, source TEXT, status TEXT, year INTEGER, added_at TEXT, updated_at TEXT, updated_by TEXT)`,
  'CREATE INDEX IF NOT EXISTS laws_year ON laws(year)',
  'CREATE INDEX IF NOT EXISTS laws_dkey ON laws(dkey)',
];

/* تطبيع عربي للبحث: بلا تشكيل ولا تطويل، وتوحيد الألف والياء والتاء المربوطة */
const norm = s => String(s ?? '').toLowerCase().replace(/[ً-ْٰـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
  .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x660)).replace(/\s+/g, ' ').trim();
const likeEsc = s => s.replace(/[\\%_]/g, c => '\\' + c);
const clip = (s, n) => String(s ?? '').trim().slice(0, n);

/* أسماء الأعمدة المقبولة عند الاستيراد (عربي/إنجليزي)، كما في السكريبت المرفق */
const ALIASES = {
  title: ['titleAr', 'title_ar', 'العنوان', 'عنوان التشريع', 'اسم التشريع', 'الاسم'],
  titleEn: ['title', 'titleEn', 'title_en', 'العنوان الإنجليزي'],
  ref: ['referenceNumber', 'reference_number', 'ref', 'رقم المرجع', 'الرقم', 'رقم التشريع', 'number'],
  type: ['type', 'النوع', 'نوع التشريع'],
  source: ['source', 'المصدر', 'مصدر التشريع', 'الجهة'],
  status: ['status', 'الحالة', 'حالة التشريع'],
  issueDate: ['issueDate', 'issue_date', 'تاريخ الإصدار', 'تاريخ الاصدار', 'تاريخ الصدور'],
  publishDate: ['publishDate', 'publish_date', 'تاريخ النشر', 'تاريخ الاعتماد'],
  year: ['year', 'السنة', 'سنة الإصدار', 'العام'],
  summary: ['summary', 'الملخص', 'ملخص التشريع', 'الوصف'],
  content: ['content', 'المحتوى', 'النص', 'نص التشريع', 'التفاصيل'],
  tags: ['tags', 'الوسوم', 'الكلمات المفتاحية', 'وسوم', 'كلمات مفتاحية'],
};
const filled = v => v !== undefined && v !== null && String(v).trim() !== '';
function pick(row, field) {
  const keys = Object.keys(row);
  for (const a of ALIASES[field]) {
    if (filled(row[a])) return row[a];
    const k = keys.find(x => x.trim().toLowerCase() === a.toLowerCase()); if (k && filled(row[k])) return row[k];
  }
  return undefined;
}
const parseTags = v => (Array.isArray(v) ? v : String(v ?? '').split(/[,،;|\n]/)).map(t => clip(t, LIM.tag)).filter(Boolean).slice(0, LIM.tags);
function parseDate(v) {
  if (!filled(v)) return '';
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/); if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  const n = Number(s); if (Number.isFinite(n) && n > 20000 && n < 80000) return new Date(Date.UTC(1899, 11, 30) + n * 864e5).toISOString().slice(0, 10); // تاريخ Excel التسلسلي
  return null; // صيغة غير مفهومة
}

/* يتحقق من سجل واحد ويعيد {rec} أو {error} */
function validate(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return { error: 'صف غير صالح' };
  const title = clip(pick(row, 'title'), LIM.title), type = String(pick(row, 'type') ?? '').trim(), source = String(pick(row, 'source') ?? '').trim();
  const status = String(pick(row, 'status') ?? 'ساري').trim(), summary = clip(pick(row, 'summary'), LIM.summary);
  const content = String(pick(row, 'content') ?? '').replace(/\r\n?/g, '\n').trim();
  if (!title) return { error: 'العنوان مطلوب' };
  if (!TYPES.includes(type)) return { error: `نوع غير صالح «${type}». المسموح: ${TYPES.join('، ')}` };
  if (!SOURCES.includes(source)) return { error: `مصدر غير صالح «${source}». المسموح: ${SOURCES.join('، ')}` };
  if (!STATUSES.includes(status)) return { error: `حالة غير صالحة «${status}». المسموح: ${STATUSES.join('، ')}` };
  if (!summary) return { error: 'الملخص مطلوب' };
  if (!content) return { error: 'المحتوى (نص التشريع) مطلوب' };
  if (content.length > LIM.content) return { error: 'نص التشريع أطول من المسموح (2 ميغابايت)' };
  const issueDate = parseDate(pick(row, 'issueDate')), publishDate = parseDate(pick(row, 'publishDate'));
  if (issueDate === null) return { error: 'تاريخ الإصدار بصيغة غير مفهومة (استخدم YYYY-MM-DD أو DD/MM/YYYY)' };
  if (publishDate === null) return { error: 'تاريخ النشر بصيغة غير مفهومة (استخدم YYYY-MM-DD أو DD/MM/YYYY)' };
  let year = pick(row, 'year');
  if (filled(year)) { year = parseInt(String(year).trim(), 10); if (!(year >= 1800 && year <= 2100)) return { error: 'السنة يجب أن تكون بين 1800 و2100' } }
  else year = issueDate ? +issueDate.slice(0, 4) : null;
  return { rec: { title, titleEn: clip(pick(row, 'titleEn'), LIM.title), ref: clip(pick(row, 'ref'), 80), type, source, status, issueDate, publishDate, year, summary, content, tags: parseTags(pick(row, 'tags')) } };
}
const dkeyOf = r => norm(r.title) + '|' + norm(r.ref);
const searchText = r => norm([r.title, r.titleEn, r.ref, r.type, r.source, r.summary, r.content, (r.tags || []).join(' ')].join(' '));

function createLaws(db, { randomId, now }) {
  for (const q of SCHEMA) db.run(q);
  const row = r => [JSON.stringify(r), norm(r.title), norm(r.summary), searchText(r), dkeyOf(r), r.type, r.source, r.status, r.year ?? null];
  const insert = (r, by) => db.run('INSERT INTO laws(id,data,ntitle,nsum,norm,dkey,type,source,status,year,added_at,updated_at,updated_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)', r.id, ...row(r), r.addedAt, r.updatedAt, by);
  const update = (r, by) => db.run('UPDATE laws SET data=?,ntitle=?,nsum=?,norm=?,dkey=?,type=?,source=?,status=?,year=?,updated_at=?,updated_by=? WHERE id=?', ...row(r), r.updatedAt, by, r.id);
  const get = id => { const x = db.all('SELECT data FROM laws WHERE id=?', String(id))[0]; return x ? JSON.parse(x.data) : null };
  const brief = r => { const { content, ...b } = r; return { ...b, chars: (content || '').length } };

  function where(p) {
    const w = [], a = [];
    const words = norm(p.q).split(' ').filter(Boolean).slice(0, 8);
    for (const t of words) { w.push("norm LIKE ? ESCAPE '\\'"); a.push('%' + likeEsc(t) + '%') }
    if (TYPES.includes(p.type)) { w.push('type=?'); a.push(p.type) }
    if (SOURCES.includes(p.source)) { w.push('source=?'); a.push(p.source) }
    if (STATUSES.includes(p.status)) { w.push('status=?'); a.push(p.status) }
    const y1 = +p.yearFrom, y2 = +p.yearTo;
    if (y1 >= 1800 && y1 <= 2100) { w.push('year>=?'); a.push(y1) }
    if (y2 >= 1800 && y2 <= 2100) { w.push('year<=?'); a.push(y2) }
    return { sql: w.length ? ' WHERE ' + w.join(' AND ') : '', args: a, words };
  }
  /* مقتطف حول أول تطابق في النص حين لا يظهر في العنوان أو الملخص */
  function snippet(r, words) {
    if (!words.length) return '';
    const t = r.content || '', n = norm(t); let at = -1, w0 = '';
    for (const w of words) { const i = n.indexOf(w); if (i >= 0 && (at < 0 || i < at)) { at = i; w0 = w } }
    if (at < 0 || norm(r.title + ' ' + r.summary).includes(w0)) return '';
    /* التطبيع يحذف التشكيل فقد يختلف الموضع قليلاً؛ المقتطف تقريبي بما يكفي للعرض */
    const s = Math.max(0, at - 90), e = Math.min(t.length, at + w0.length + 140);
    return (s ? '… ' : '') + t.slice(s, e).replace(/\s+/g, ' ').trim() + (e < t.length ? ' …' : '');
  }

  function search(p) {
    const page = Math.max(1, parseInt(p.page, 10) || 1), size = Math.min(100, Math.max(1, parseInt(p.pageSize, 10) || 20));
    const sort = SORTS.includes(p.sort) ? p.sort : 'relevance', W = where(p);
    const total = db.all('SELECT COUNT(*) n FROM laws' + W.sql, ...W.args)[0].n;
    let order = 'year DESC, ntitle', oa = [];
    if (sort === 'year_asc') order = 'year IS NULL, year ASC, ntitle';
    else if (sort === 'year_desc') order = 'year IS NULL, year DESC, ntitle';
    else if (sort === 'title') order = 'ntitle';
    else if (sort === 'added') order = 'added_at DESC';
    else if (W.words.length) { const q = likeEsc(W.words.join(' ')); order = "CASE WHEN ntitle LIKE ? ESCAPE '\\' THEN 0 WHEN ntitle LIKE ? ESCAPE '\\' THEN 1 WHEN nsum LIKE ? ESCAPE '\\' THEN 2 ELSE 3 END, year IS NULL, year DESC, ntitle"; oa = [q + '%', '%' + q + '%', '%' + q + '%'] }
    else order = 'year IS NULL, year DESC, ntitle';
    const rows = db.all(`SELECT data FROM laws${W.sql} ORDER BY ${order} LIMIT ? OFFSET ?`, ...W.args, ...oa, size, (page - 1) * size);
    const items = rows.map(x => { const r = JSON.parse(x.data); const hit = snippet(r, W.words); return { ...brief(r), ...(hit ? { hit } : {}) } });
    return { items, total, page, pageSize: size, pages: Math.max(1, Math.ceil(total / size)) };
  }
  function facets() {
    const by = col => Object.fromEntries(db.all(`SELECT ${col} k, COUNT(*) n FROM laws GROUP BY ${col}`).map(x => [x.k, x.n]));
    const yr = db.all('SELECT MIN(year) a, MAX(year) b FROM laws WHERE year IS NOT NULL')[0] || {};
    return { total: db.all('SELECT COUNT(*) n FROM laws')[0].n, type: by('type'), source: by('source'), status: by('status'), yearMin: yr.a ?? null, yearMax: yr.b ?? null };
  }
  function save(input, by) {
    const v = validate(input); if (v.error) return { error: v.error };
    const id = input.id ? String(input.id) : null, at = now();
    if (id) {
      const old = get(id); if (!old) return { error: 'التشريع غير موجود (ربما حُذف).', status: 404 };
      if (input._v != null && +input._v !== (old._v || 1)) return { error: 'عدّل زميل هذا التشريع قبلك. أعد فتحه لترى آخر نسخة.', status: 409, rec: old };
      const r = { ...old, ...v.rec, id, _v: (old._v || 1) + 1, updatedAt: at, updatedBy: by };
      update(r, by); return { rec: r, created: false };
    }
    const dup = db.all('SELECT id FROM laws WHERE dkey=?', dkeyOf(v.rec))[0];
    if (dup) return { error: 'هذا التشريع موجود مسبقاً بنفس العنوان والرقم.', status: 409, id: dup.id };
    const r = { id: randomId(), ...v.rec, _v: 1, addedAt: at, addedBy: by, updatedAt: at, updatedBy: by };
    insert(r, by); return { rec: r, created: true };
  }
  function remove(id) { const r = get(id); if (!r) return null; db.run('DELETE FROM laws WHERE id=?', String(id)); return r }
  function clear() { const n = db.all('SELECT COUNT(*) n FROM laws')[0].n; db.run('DELETE FROM laws'); return n }

  /* استيراد دفعة: الصفوف الصالحة تُضاف، والمكرر (نفس العنوان والرقم) يُتخطى أو يُحدَّث حسب الاختيار */
  function importMany(records, mode, by) {
    if (!Array.isArray(records) || !records.length) return { error: 'لم تُرسل أي سجلات.' };
    if (records.length > LIM.batch) return { error: `الحد الأقصى ${LIM.batch} سجل في الدفعة الواحدة.` };
    const errors = [], at = now(); let added = 0, updated = 0, dups = 0; const seen = new Set();
    db.tx(() => {
      records.forEach((row, i) => {
        const v = validate(row); if (v.error) { errors.push({ row: i + 1, message: v.error }); return }
        const k = dkeyOf(v.rec); if (seen.has(k)) { dups++; return } seen.add(k);
        const ex = db.all('SELECT id FROM laws WHERE dkey=?', k)[0];
        if (ex) {
          if (mode !== 'update') { dups++; return }
          const old = get(ex.id); update({ ...old, ...v.rec, _v: (old._v || 1) + 1, updatedAt: at, updatedBy: by }, by); updated++; return;
        }
        insert({ id: randomId(), ...v.rec, _v: 1, addedAt: at, addedBy: by, updatedAt: at, updatedBy: by }, by); added++;
      });
    });
    return { total: records.length, added, updated, duplicates: dups, failed: errors.length, errors: errors.slice(0, 200) };
  }
  /* التصدير بأسماء أعمدة السكريبت المرفق نفسها، فيُعاد استيراده هنا أو هناك */
  function exportAll() {
    return db.all('SELECT data FROM laws ORDER BY year IS NULL, year DESC, ntitle').map(x => { const r = JSON.parse(x.data);
      return { titleAr: r.title, title: r.titleEn || '', referenceNumber: r.ref || '', type: r.type, source: r.source, status: r.status, issueDate: r.issueDate || '', publishDate: r.publishDate || '', year: r.year ?? '', summary: r.summary, content: r.content, tags: r.tags || [] } });
  }

  /* واجهة HTTP موحدة: يعيد {status, body} أو {file} */
  async function handle(action, M, params, bodyFn, me, can, who, audit) {
    const deny = { status: 403, body: { error: 'إدارة مكتبة التشريعات من صلاحية مدير المكتب.' } };
    if (action === 'search' && M === 'GET') return { status: 200, body: { ...search(params), facets: facets() } };
    if (action === 'item' && M === 'GET') { const r = get(params.id); return r ? { status: 200, body: { rec: r } } : { status: 404, body: { error: 'التشريع غير موجود.' } } }
    /* عدة تشريعات كاملة بترتيب الطلب (لاستخراجها في صفحة مستقلة) */
    if (action === 'items' && M === 'GET') {
      const ids = [...new Set(String(params.ids || '').split(',').map(s => s.trim()).filter(Boolean))].slice(0, 200);
      const recs = ids.map(get).filter(Boolean);
      audit({ ...who, action: 'laws.extract', entity: 'laws', detail: { n: recs.length } });
      return { status: 200, body: { recs } };
    }
    if (action === 'meta' && M === 'GET') return { status: 200, body: { types: TYPES, sources: SOURCES, statuses: STATUSES, aliases: ALIASES, limits: { batch: LIM.batch }, facets: facets(), canManage: can('manage') } };
    if (action === 'export' && M === 'GET') {
      const all = exportAll(); audit({ ...who, action: 'laws.export', entity: 'laws', detail: { n: all.length } });
      return { file: { body: JSON.stringify({ format: 'mithaq-laws', version: 1, exportedAt: now(), count: all.length, records: all }, null, 1), contentType: 'application/json; charset=utf-8', filename: 'mithaq-laws-' + now().slice(0, 10) + '.json' } };
    }
    if (M !== 'POST') return { status: 404, body: { error: 'غير موجود' } };
    if (!can('manage')) return deny;
    const b = await bodyFn();
    if (action === 'save') {
      const r = save(b.rec || {}, me.username); if (r.error) return { status: r.status || 400, body: { error: r.error, ...(r.rec ? { rec: r.rec } : {}), ...(r.id ? { id: r.id } : {}) } };
      audit({ ...who, action: r.created ? 'laws.create' : 'laws.update', entity: 'laws', entity_id: r.rec.id, detail: { label: r.rec.title } });
      return { status: 200, body: { rec: r.rec } };
    }
    if (action === 'delete') {
      if (b.all) {
        if (b.confirm !== 'حذف الكل') return { status: 400, body: { error: 'اكتب «حذف الكل» للتأكيد.' } };
        const n = clear(); audit({ ...who, action: 'laws.clear', entity: 'laws', detail: { n } }); return { status: 200, body: { ok: true, n } };
      }
      const r = remove(b.id); if (!r) return { status: 404, body: { error: 'التشريع غير موجود.' } };
      audit({ ...who, action: 'laws.delete', entity: 'laws', entity_id: r.id, detail: { label: r.title } }); return { status: 200, body: { ok: true } };
    }
    if (action === 'import') {
      const recs = Array.isArray(b) ? b : Array.isArray(b.records) ? b.records : [];
      const r = importMany(recs, b.mode === 'update' ? 'update' : 'skip', me.username); if (r.error) return { status: 400, body: { error: r.error } };
      audit({ ...who, action: 'laws.import', entity: 'laws', detail: { total: r.total, added: r.added, updated: r.updated, duplicates: r.duplicates, failed: r.failed, file: String(b.file || '').slice(0, 120) } });
      return { status: 200, body: r };
    }
    return { status: 404, body: { error: 'غير موجود' } };
  }
  return { search, facets, get, save, remove, clear, importMany, exportAll, handle };
}

export { createLaws, validate, norm, TYPES, SOURCES, STATUSES, ALIASES };
