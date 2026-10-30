// مِسْبار | Misbar AI — عقل التحليل والاستنباط القانوني: نواة البحث في قاعدة التشريعات والقرارات (فلسطين، الأردن، مصر).
// قاعدة القراءة فقط تُبنى بـ tools/misbar-build.js من ملفات المصادر، وتُقرأ هنا عبر محوّل db = { all(q,...a) } (متزامن أو وعد).
// المكتب: node:sqlite على ملف mithaq-lawindex.db · السحابة: D1 (نسخة مطابقة في cloud/src/misbar.js بصيغة ESM).
'use strict';

/* المصادر: الفلسطيني مرجع أساسي، والأردني والمصري للمقارنة والاستئناس فقط */
const SOURCES = {
  PS_LEGISLATION: { label: 'فلسطين · تشريعات', country: 'PS', kind: 'law', primary: true },
  PS_JUDGMENT: { label: 'فلسطين · أحكام', country: 'PS', kind: 'ruling', primary: true },
  JO_LEGISLATION: { label: 'الأردن · تشريعات', country: 'JO', kind: 'law' },
  JO_CASSATION: { label: 'الأردن · تمييز', country: 'JO', kind: 'ruling' },
  EG_LEGISLATION: { label: 'مصر · تشريعات', country: 'EG', kind: 'law' },
  EG_CASSATION: { label: 'مصر · نقض', country: 'EG', kind: 'ruling' },
  EG_CONSTITUTIONAL: { label: 'مصر · الدستورية العليا', country: 'EG', kind: 'ruling' },
};
const STATUS = { in_force: 'ساري', partial: 'ساري في الضفة الغربية', suspended: 'موقوف النفاذ', repealed: 'ملغى / غير ساري' };
const SORTS = ['relevance', 'year_desc', 'year_asc', 'date_desc'];
/* النصوص الطويلة تُقسَّم في السحابة (حدّ D1 لطول العبارة): الجزء الأول في docs.body والباقي في body_parts،
   وفهرس FTS يحمل صفاً لكل جزء بمعرّف rowid = id + k*CHUNK_BASE؛ قاعدة المكتب لا تحتاج التقسيم لكنها تقبل الصيغة نفسها */
const CHUNK = 30000, CHUNK_BASE = 100000000;

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
  for (const w of norm(rest).split(' ')) if (w && !STOP.has(w) && (w.length > 1 || /\d/.test(w))) parts.push('"' + w + '"' + (w.length >= 3 && (!/^\d+$/.test(w) || w.length === 4) ? '*' : ''));
  const uniq = [...new Set(parts)].slice(0, 16);
  return uniq.length ? uniq.join(mode === 'any' ? ' OR ' : ' AND ') : '';
}
const int = (v, a, b, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.min(b, Math.max(a, n)) : d };
const clip = (s, n) => String(s ?? '').trim().slice(0, n);

/* مقتطف حول أول تطابق: يُطبَّع النص حرفاً حرفاً مع حفظ موضع كل حرف في الأصل، فيقع المقتطف على الكلمة نفسها */
const CH = { 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ى': 'ي', 'ة': 'ه', 'ؤ': 'و', 'ئ': 'ي' };
function snippetAt(body, q, len = 260) {
  const text = String(body || '').replace(/\s+/g, ' ').trim(); if (!text) return { hit: false, text: '' };
  const ws = norm(String(q || '').replace(/"/g, ' ')).split(' ').filter(w => w.length > 1 && !STOP.has(w)).sort((a, b) => b.length - a.length);
  let flat = '', map = [];
  for (let i = 0; i < text.length && flat.length < 400000; i++) {
    let c = text[i]; if (/[ً-ْٰـ]/.test(c)) continue;
    c = CH[c] || c.toLowerCase(); if (c >= '٠' && c <= '٩') c = String(c.charCodeAt(0) - 0x660);
    flat += c; map.push(i);
  }
  let at = -1;
  for (const w of ws) { const i = flat.indexOf(w); if (i >= 0) { at = map[i]; break } }
  if (at < 0) return { hit: false, text: text.slice(0, len) + (text.length > len ? ' …' : '') };
  let s = Math.max(0, at - Math.floor(len / 3)); if (s > 0) { const sp = text.indexOf(' ', s); if (sp > 0 && sp < at) s = sp + 1 }
  return { hit: true, text: (s > 0 ? '… ' : '') + text.slice(s, s + len) + (s + len < text.length ? ' …' : '') };
}
const snippet = (body, q, len) => snippetAt(body, q, len).text;

/* إزالة روابط مصدر الجمع (maqam.najah.edu) من كل نص يخرج من القاعدة، مع عبارة «شاهد التعديل/الحكم:» التي تسبقها؛ النص القانوني نفسه لا يُمس */
const SCRUB_RX = /[ \t]*(?:شاهد\s+[\u0621-\u064A]+\s*[:：]\s*)?(?:https?:\/\/)?(?:www\.)?maqam\.najah\.edu[^\s،,)\]]*/gi;
/* عبارات دعاية أقحمها موقع الجمع في ذيل بعض الأحكام الأردنية والمصرية («محامي من الأردن»، «إسأل محامي، إستشر محامي»، «lawyer jordan»، «محاكم عربية»):
   يُحذف السطر إن كان كله من كلماتها، وتُحذف «محاكم عربية» الملحقة بآخر سطر الإحالة؛ نص الحكم نفسه لا يُمس */
const SPAM_W = new Set('محامي محامين المحامين محاماه افضل في من الاردن اردني اسال استشر قانون فريق المختصين محاكم عربيه مكتب شركه lawyer lawyers jordan jordanian law firm'.split(' '));
const spamN = w => w.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
const spamLine = l => { if (!/محام|lawyer|law firm|محاكم عربية/i.test(l)) return false; const ws = l.split(/[\s،,|=\-–•*:.]+/).filter(Boolean); return ws.length > 0 && ws.every(w => SPAM_W.has(spamN(w))) };
const unspam = t => /محام|lawyer|law firm|محاكم عربية/i.test(t) ? t.split('\n').filter(l => !spamLine(l)).map(l => l.replace(/([)\/\d]\s*)محاكم عربية\s*$/, '$1').replace(/\s+$/, '')).join('\n').replace(/\n{3,}/g, '\n\n').trim() : t;
const scrub = s => s == null ? s : unspam(String(s).replace(SCRUB_RX, ''));
const cleanRow = r => r && ({ ...r, url: '', file_url: r.file_url === undefined ? undefined : '' });
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
  /* تاريخ القرار (للأحكام): من / إلى بصيغة YYYY-MM-DD */
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(f.date_from || ''))) { w.push("d.date>=?"); a.push(f.date_from) }
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(f.date_to || ''))) { w.push("d.date<>'' AND d.date<=?"); a.push(f.date_to) }
  if (f.url && /^https?:\/\//.test(String(f.url))) { w.push('d.url=?'); a.push(clip(f.url, 400)) }
  /* عدد من الوقائع الفلسطينية (الجريدة الرسمية): «165» أو «ممتاز 42» — كل ما نُشر فيه */
  if (f.gazette && /^[\u0621-\u064A0-9 ()]{1,24}$/.test(String(f.gazette).trim())) { w.push("json_extract(d.meta,'$.gazette_number')=?"); a.push(String(f.gazette).trim()) }
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
    /* مع عبارة بحث: صفوف FTS (صف لكل جزء من نص طويل) تُجمع على معرّف المستند، والترتيب بأفضل bm25 بين الأجزاء */
    const from = fq ? `(SELECT DISTINCT (fts.rowid % ${CHUNK_BASE}) fid FROM fts WHERE fts MATCH ?) f CROSS JOIN docs d ON d.id=f.fid` : 'docs d';
    const fromRank = fq ? `(SELECT fid, MIN(rk) rk FROM (SELECT (rowid % ${CHUNK_BASE}) fid, rank rk FROM fts WHERE fts MATCH ? AND rank MATCH 'bm25(4.0, 1.0)') GROUP BY fid) f CROSS JOIN docs d ON d.id=f.fid` : 'docs d';
    const cond = w, args = (fq ? [fq] : []).concat(a);
    const W = cond.length ? ' WHERE ' + cond.join(' AND ') : '';
    /* الترتيب بالصلة: bm25 مع وزن أكبر للعنوان، ثم الفلسطيني أولاً */
    const order = sort === 'relevance' && fq ? 'f.rk + (CASE d.country WHEN \'PS\' THEN -2.0 ELSE 0 END)' : sort === 'year_asc' ? 'd.year ASC, d.id' : sort === 'date_desc' ? "COALESCE(NULLIF(d.date,''), d.year || '-00-00') DESC, d.id DESC" : 'd.year DESC, d.id DESC';
    const [cnt] = await all(`SELECT COUNT(DISTINCT d.id) n FROM ${from}${W}`, ...args);
    let total = Number(cnt?.n || 0);
    const rows = total ? await all(`SELECT ${COLS}, json_extract(d.meta,'$.articles_n') arts_n, json_extract(d.meta,'$.subject_auto.conf') subj_auto, substr(d.body,1,20000) body FROM ${sort === 'relevance' && fq ? fromRank : from}${W} ORDER BY ${order} LIMIT ? OFFSET ?`, ...args, per, (page - 1) * per) : [];
    /* اسم التشريع في عنوانه: كل كلمات البحث في العنوان نفسه لا في النص فقط، و«قانون الشركات» يطابق أيضاً «قرار بقانون … بشأن الشركات».
       الترتيب: الاسم المطابق تماماً، ثم غير المعدِّل، ثم الساري، ثم الأحدث — فيأتي القانون النافذ قبل ما ذكره أو عدّله */
    if (fq && page === 1 && sort === 'relevance') {
      const nq = norm(q).replace(/^ال/, ''), rest = /^قانون\s+\S/.test(String(q).trim()) ? ftsQuery(String(q).trim().replace(/^قانون\s+/, ''), 'all') : '';
      const sel = `SELECT ${COLS}, json_extract(d.meta,'$.articles_n') arts_n, json_extract(d.meta,'$.subject_auto.conf') subj_auto, substr(d.body,1,20000) body FROM (SELECT DISTINCT (rowid % ${CHUNK_BASE}) fid FROM fts WHERE fts MATCH ?) f CROSS JOIN docs d ON d.id=f.fid${W} LIMIT 40`;
      let th = []; for (const m of [fq, rest].filter(Boolean)) { try { th.push(...await all(sel, '{title} : (' + m + ')', ...a)) } catch {} }
      const core = t => { let c = String(t || '').replace(/[ًٌٍَُِّْـ]/g, '').replace(/\s*رقم\s*[(\[]?\s*\d+\s*[)\]]?\s*(?:لسن[ةه]|لعام)\s*\d{4}\s*م?\.?/, ' '); c = c.replace(/^\s*(?:قرار\s*بقانون|قانون)\s*(?:بشأن|بشان)\s*/, 'قانون '); return norm(c) };
      const seen = new Set(), sc = th.filter(r => !seen.has(r.id) && seen.add(r.id)).map(r => { const c = core(r.title), t = String(r.title); return { r, s: (c === norm(q) || c === nq ? 0 : c.startsWith(norm(q)) ? 4 : 10) + (/تعديل|بتعديل|معدل|المعدل/.test(t) ? 6 : 0) + (r.status_code === 'repealed' || /ملغ/.test(r.status || '') ? 3 : 0) + (r.country === 'PS' ? 0 : 20) + c.length / 200 - (Number(r.year) || 0) / 10000 } }).sort((x, y) => x.s - y.s).slice(0, 4);
      for (const { r } of sc.reverse()) { const i = rows.findIndex(x => Number(x.id) === Number(r.id)); if (i >= 0) rows.splice(i, 1); rows.unshift(r) }
      if (rows.length > per) rows.length = per;
    }
    /* عنوان التشريع بنوعه ورقمه وسنته («قانون السلطة القضائية رقم 1 لسنة 2002»): التشريع نفسه أولاً، وإن لم تطابقه كل كلمات البحث في الفهرس */
    const tm = fq && page === 1 && sort === 'relevance' ? /^(.*?)\s*رقم\s*[(\[]?\s*(\d+)\s*[)\]]?\s*لسن[ةه]\s*(\d{4})/.exec(String(q).replace(/[ًٌٍَُِّْـ]/g, '')) : null;
    if (tm) {
      const head = norm(tm[1]).split(' ').filter(x => x.length > 2), rx = new RegExp('رقم\\s*[(\\[]?\\s*' + tm[2] + '\\s*[)\\]]?\\s*لسن[ةه]\\s*' + tm[3]);
      let ex = []; try { ex = await all(`SELECT ${COLS}, json_extract(d.meta,'$.articles_n') arts_n, json_extract(d.meta,'$.subject_auto.conf') subj_auto, substr(d.body,1,20000) body FROM docs d WHERE ${(w.length ? w.join(' AND ') + ' AND ' : '')}d.title LIKE ? AND d.title LIKE ? LIMIT 80`, ...a, '%' + tm[2] + '%', '%' + tm[3] + '%') } catch { ex = [] }
      ex = ex.filter(r => { const t = scrub(r.title).replace(/[ًٌٍَُِّْـ]/g, ''), m = rx.exec(t); if (!m) return false; const before = ' ' + norm(t.slice(0, m.index)) + ' '; return head.length && head.every(x => before.includes(' ' + x + ' ') || before.includes(' ' + x)) }).slice(0, 3);
      for (const r of ex.reverse()) { const i = rows.findIndex(x => Number(x.id) === Number(r.id)); if (i >= 0) rows.splice(i, 1); else total++; rows.unshift(r) }
      if (rows.length > per) rows.length = per;
    }
    const facets = {};
    if (total && f.facets !== '0') {
      for (const r of await all(`SELECT d.src k, COUNT(DISTINCT d.id) n FROM ${from}${W} GROUP BY d.src`, ...args)) (facets.src ||= {})[r.k] = Number(r.n);
    }
    const pre = rows.map(r => { const { body, ...x } = cleanRow(r); return { r, x, body: body || '', sn: snippetAt(scrub(body), q) } });
    /* المطابقة قد تكون في جزء لاحق من نص طويل: نجلب بقية النصوص لهذه النتائج كلها باستعلامين فقط
       (لا استعلامين لكل نتيجة: في السحابة لكل طلب حدّ لعدد الاستعلامات، وكان البحث في القوانين الطويلة يتجاوزه) */
    const miss = fq ? pre.filter(p => !p.sn.hit && p.body.length >= 20000) : [];
    if (miss.length) {
      const ids = miss.map(p => p.r.id), ph = ids.map(() => '?').join(',');
      let rest = [], parts = [];
      try { rest = await all(`SELECT id, substr(body, 20001) rest FROM docs WHERE id IN (${ph})`, ...ids) } catch { rest = [] }
      try { parts = await all(`SELECT id, txt FROM body_parts WHERE id IN (${ph}) ORDER BY id, n`, ...ids) } catch { parts = [] }
      for (const p of miss) {
        const id = Number(p.r.id), more = String((rest.find(x => Number(x.id) === id) || {}).rest || ''), tail = parts.filter(x => Number(x.id) === id).map(x => x.txt).join('');
        p.sn = snippetAt(scrub(p.body + more + tail), q);
      }
    }
    const results = pre.map(p => ({ ...p.x, source: SOURCES[p.r.src]?.label || p.r.src, primary: !!SOURCES[p.r.src]?.primary, excerpt: p.sn.text }));
    return { results, total, page, pages: Math.ceil(total / per), per, sort, query: fq, facets };
  }
  async function fullBody(id, first) {
    let parts = []; try { parts = await all('SELECT txt FROM body_parts WHERE id=? ORDER BY n', id) } catch { parts = [] }
    return parts.length ? String(first || '') + parts.map(p => p.txt).join('') : String(first || '');
  }
  async function doc(id) {
    const n = int(id, 1, 1e9, 0); if (!n) return null;
    const [r] = await all(`SELECT ${COLS}, d.file_url, d.body, d.cites, d.meta FROM docs d WHERE d.id=?`, n);
    if (!r) return null;
    r.body = scrub(await fullBody(n, r.body)); r.title = scrub(r.title);
    const j = s => { try { return JSON.parse(s || 'null') } catch { return null } };
    return { ...cleanRow(r), cites: (j(r.cites) || []).map(c => ({ title: scrub(c.title), text: scrub(c.text) })), meta: j(r.meta) || {}, source: SOURCES[r.src]?.label || r.src, primary: !!SOURCES[r.src]?.primary };
  }
  async function stats() {
    const rows = await all('SELECT src, COUNT(*) n, SUM(has_text) t, MIN(year) y1, MAX(year) y2 FROM docs GROUP BY src');
    const meta = Object.fromEntries((await all('SELECT k, v FROM meta').catch(() => [])).map(r => [r.k, r.v]));
    /* قيم الفلاتر الفعلية: أنواع التشريعات وأنواع الدعاوى والمحاكم بحسب الدولة */
    const lt = await all("SELECT country, kind, ltype v, COUNT(*) n FROM docs WHERE ltype<>'' GROUP BY country, kind, ltype HAVING n>=3 ORDER BY n DESC");
    const ct = await all("SELECT country, court v, COUNT(*) n FROM docs WHERE kind='ruling' AND court<>'' GROUP BY country, court ORDER BY n DESC");
    /* التصنيف الموضوعي للتشريعات الفلسطينية: الباب (قبل «›») وعدده */
    let sj = []; try { sj = await all("SELECT CASE WHEN instr(subject,' › ')>0 THEN substr(subject,1,instr(subject,' › ')-1) ELSE subject END v, COUNT(*) n FROM docs WHERE src='PS_LEGISLATION' AND subject<>'' GROUP BY v HAVING n>=2 ORDER BY v") } catch { sj = [] }
    const pick = (arr, c, k) => arr.filter(r => (!c || r.country === c) && (!k || r.kind === k)).map(r => ({ v: r.v, n: Number(r.n), country: r.country }));
    return { sources: rows.map(r => ({ src: r.src, label: SOURCES[r.src]?.label || r.src, n: Number(r.n), texts: Number(r.t), from: r.y1, to: r.y2 })), lawTypes: pick(lt, '', 'law'), lawSubjects: sj.map(r => ({ v: r.v, n: Number(r.n) })), caseTypes: pick(lt, '', 'ruling'), courts: pick(ct, '', ''), version: meta.version || '', built: meta.built || '' };
  }
  /* مقتطفات موثّقة للتحليل: أفضل النتائج ذات النص، مع نص كافٍ للاستشهاد */
  /* titleHas: كلمات يجب أن ترد في عنوان المرجع (لاختيار قانون بعينه)، snip: عبارة اختيار المقطع من النص (المسألة لا اسم القانون) */
  async function excerpts(q, { n = 8, src, chars = 2400, titleHas = '', snip = '' } = {}) {
    const r = await search({ q, src, has_text: '1', per: Math.min(30, n * (titleHas ? 6 : 2)), facets: '0', mode: 'any' });
    const need = norm(titleHas).split(/\s+/).filter(w => w.length > 2 && !['قانون', 'رقم', 'لسنه', 'بشان', 'المواد', 'مواد'].includes(w));
    const pool = need.length ? r.results.filter(x => { const t = norm(x.title || ''); return need.filter(w => t.includes(w)).length >= Math.min(2, need.length) }) : r.results;
    const out = [];
    for (const x of pool.slice(0, n)) { const d = await doc(x.id); if (d && d.body) out.push({ ref: 'M' + d.id, id: d.id, src: d.src, source: d.source, primary: d.primary, title: d.title, year: d.year, court: d.court, case_no: d.case_no, status: d.status, url: d.url, excerpt: snippet(d.body, snip || q, chars) }) }
    return out;
  }
  /* تشريعات أو أحكام بكلمات العنوان وحده (لا بنصها): لتحديد قانون بعينه من اسمه */
  async function byTitle(q, src, n = 50) {
    const ws = [...new Set(norm(q).split(' ').filter(w => w && !STOP.has(w)))].slice(0, 10); if (!ws.length) return [];
    const m = ws.map(w => 'title : "' + w + '"' + (/^\d+$/.test(w) ? '*' : '')).join(' AND '); /* الأرقام ببادئة: «2024» تطابق «2024م» */
    const rows = await all(`SELECT d.id, d.title, d.status, d.status_code, d.year FROM (SELECT DISTINCT (rowid % ${CHUNK_BASE}) fid FROM fts WHERE fts MATCH ?) f CROSS JOIN docs d ON d.id=f.fid WHERE d.has_text=1${src ? ' AND d.src=?' : ''} LIMIT ?`, ...(src ? [m, src, n] : [m, n]));
    return rows.map(r => ({ ...r, title: scrub(r.title) }));
  }
  /* تشريع بنوعه ورقمه وسنته من عنوانه مباشرة (بلا فهرس): «قرار بقانون رقم (24) لسنة 2024» بأي تباعد */
  async function byNumber(kind, no, year, src = 'PS_LEGISLATION') {
    const n = String(no || '').replace(/\D/g, ''), y = String(year || '').replace(/\D/g, ''); if (!n) return [];
    const rows = await all(`SELECT d.id, d.title, d.status, d.status_code, d.year, d.has_text FROM docs d WHERE d.src=? AND d.title LIKE ? ${y ? 'AND d.title LIKE ?' : ''} LIMIT 60`, ...(y ? [src, '%' + n + '%', '%' + y + '%'] : [src, '%' + n + '%']));
    const rx = new RegExp('رقم\\s*\\(?\\s*' + n + '\\s*\\)?\\s*' + (y ? 'لسن[ةه]\\s*' + y : ''));
    const kindRx = kind === 'decree' ? /^\s*(?:ال)?قرار\s*بقانون/ : kind === 'order' ? /^\s*(?:ال)?[أا]مر/ : kind === 'law' ? /^\s*(?:ال)?قانون/ : /./;
    return rows.filter(r => { const t = scrub(r.title).replace(/[ًٌٍَُِّْـ]/g, ''); const m = rx.exec(t); return m && kindRx.test(t) && t.slice(0, m.index).replace(/\d/g, '').length === t.slice(0, m.index).length }).map(r => ({ ...r, title: scrub(r.title) }));
  }
  /* هل الاقتباس موجود حرفياً (بعد التطبيع) في نص المرجع المخزّن؟ */
  async function verifyQuote(id, quote) {
    const d = await doc(id); if (!d) return { ok: false, error: 'المرجع غير موجود' };
    if (!d.body) return { ok: false, error: 'لا يوجد نص مخزّن لهذا المرجع' };
    const q = norm(quote); if (q.length < 8) return { ok: false, error: 'الاقتباس قصير جداً' };
    return { ok: norm(d.body).includes(q), title: d.title, src: d.src, comparative: !d.primary };
  }
  /* أعداد الوقائع الفلسطينية (الجريدة الرسمية) كما رُبطت بها التشريعات: العدد، تاريخه، وعدد ما نُشر فيه */
  async function gazettes() {
    const rows = await all("SELECT json_extract(meta,'$.gazette_number') g, MIN(json_extract(meta,'$.gazette_date')) d, COUNT(*) n FROM docs WHERE src='PS_LEGISLATION' AND json_extract(meta,'$.gazette_name') IS NOT NULL AND json_extract(meta,'$.gazette_number') IS NOT NULL GROUP BY g");
    const num = g => { const m = /(\d+)/.exec(g); return m ? Number(m[1]) : 0 };
    return rows.map(r => ({ g: String(r.g), date: r.d || '', year: Number(String(r.d || '').slice(0, 4)) || null, n: Number(r.n), special: /ممتاز/.test(String(r.g)) })).sort((a, b) => (b.date || '').localeCompare(a.date || '') || num(b.g) - num(a.g));
  }
  /* مواد بعينها من تشريع فلسطيني بنصها الحرفي كما في القاعدة (أساس النماذج القانونية):
     law = جزء مميز من عنوان التشريع، n = أرقام المواد مفصولة بفاصلة. يُختار أطول نص يطابق العنوان (القانون الأصلي لا تعديلاته) */
  async function articles(p) {
    const law = String(p.law || '').trim().slice(0, 200), want = String(p.n || '').split(',').map(x => x.trim()).filter(Boolean).slice(0, 40);
    if (law.length < 4 || !want.length) return null;
    const [r] = await all("SELECT d.id, d.title, d.status, d.body FROM docs d WHERE d.src='PS_LEGISLATION' AND d.title LIKE ? ORDER BY length(d.body) DESC LIMIT 1", '%' + law + '%');
    if (!r) return null;
    /* فاصل المواد في المسبار المحلي (المكتب فقط؛ نسخة السحابة تُبنى دونه فلا تُعرض فيها نصوص المواد) */
    let splitArticles; try { splitArticles = require('./misbar-' + 'local').splitArticles } catch { return null }
    const body = scrub(await fullBody(r.id, r.body)), arts = splitArticles(body), first = new Map();
    for (const a of arts) if (!first.has(a.n)) first.set(a.n, a);
    return { id: r.id, title: scrub(r.title), status: STATUS[r.status] || r.status || '', arts: want.map(n => { const a = first.get(n); return a ? { n, label: a.label, text: a.text } : { n, missing: true } }) };
  }
  /* واجهة HTTP موحّدة: action = search | doc | stats | verify | gazettes | articles */
  async function handle(action, params, me) {
    const who = { user_id: me?.id, user_name: me?.name };
    try {
      if (action === 'search') { const r = await search(params); audit && audit({ ...who, action: 'misbar.search', entity: 'misbar', detail: { q: clip(params.q, 120), n: r.total } }); return { status: 200, body: r } }
      if (action === 'doc') { const d = await doc(params.id); if (!d) return { status: 404, body: { error: 'المستند غير موجود' } }; audit && audit({ ...who, action: 'misbar.doc', entity: 'misbar', entity_id: String(d.id) }); return { status: 200, body: d } }
      if (action === 'stats') return { status: 200, body: await stats() };
      if (action === 'gazettes') return { status: 200, body: { items: await gazettes() } };
      if (action === 'articles') { const r = await articles(params); return r ? { status: 200, body: r } : { status: 404, body: { error: 'التشريع غير موجود في القاعدة' } } }
      if (action === 'verify') return { status: 200, body: await verifyQuote(params.id, params.quote) };
      return { status: 404, body: { error: 'غير موجود' } };
    } catch (e) {
      const m = String(e && e.message || e);
      if (/no such table|SQLITE_CANTOPEN|unable to open/i.test(m)) return { status: 503, body: { error: 'قاعدة المسبار غير مثبتة على هذا الخادم بعد', code: 'NO_INDEX' } };
      if (/fts5|MATCH|syntax/i.test(m)) return { status: 400, body: { error: 'صيغة البحث غير مفهومة؛ جرّب كلمات أبسط' } };
      throw e;
    }
  }
  return { gazettes, articles, search, doc, stats, excerpts, verifyQuote, byTitle, byNumber, handle };
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

/* محوّل خادم المكتب: يفتح ملف القاعدة للقراءة فقط عند أول استعمال */
function openFile(file) {
  let d = null;
  return {
    all(q, ...a) {
      if (!d) { const { DatabaseSync } = require('node:sqlite'); d = new DatabaseSync(file, { readOnly: true }) }
      return d.prepare(q).all(...a);
    },
    close() { if (d) { d.close(); d = null } },
  };
}

module.exports = { SOURCES, STATUS, CHUNK, CHUNK_BASE, norm, ftsQuery, snippet, scrub, createMisbar, adapters, openFile };
