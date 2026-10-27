// تحويل «موسوعة أحكام محكمة النقض» (برنامج VB6 قديم: low.mdb) إلى مستندات مِسْبار: مصدر EG_CASSATION.
// المدخل: مجلد JSONL مصدَّر من جداول low.mdb (naqd_export.ps1، النص محوّل من Windows-1256 إلى UTF-8).
// المخرج: eg_naqd.jsonl — مستند واحد لكل طعن: بيانات النشر + المبادئ المختصرة + نص الحكم الكامل كما ورد حرفياً.
// الاستعمال: node tools/eg-naqd-build.js --raw E:\misbar-import\naqd\raw --out E:\maqam\eg-naqd\eg_naqd.jsonl
'use strict';
const fs = require('fs'), path = require('path');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d };

/* أرقام هندية → عربية، ومسافات موحّدة */
const digits = s => String(s ?? '').replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x660));
/* تنظيف خفيف لا يمسّ النص: أسطر ويندوز، وعلامات «?» الناتجة عن رموز غير قابلة للتحويل في أول النص، والأسطر الفارغة المتكررة */
const tidy = s => String(s ?? '').replace(/\r\n?/g, '\n').replace(/^\?+/, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
const oneLine = s => tidy(s).replace(/\s+/g, ' ').trim();
const dmy = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? `${+m[3]}/${+m[2]}/${m[1]}` : '' };

/* «الطعن رقم 1808 لسنة 50 ق» بصيغه المتنوعة (رقما، رقن، اسنة، سنة، ق/القضائية) */
const APPEAL_RX = /الطعن(?:ان|ون)?\s*(?:رقم|رقما|رقمى|رقمي|رقن|رقما)?\s*([0-9][0-9\s،,.\-و/]*?)\s*(?:ا?لسنة|سنة|اسنة)\s*([0-9]{1,3})\s*(?:ق|القضائية)?/;
function appealOf(s) {
  const m = APPEAL_RX.exec(digits(s)); if (!m) return null;
  const nos = m[1].split(/[\s،,.\-و/]+/).filter(x => /^\d+$/.test(x));
  return nos.length ? { nos, jy: String(+m[2]) } : null;
}
const keyOf = (no, jy) => `${+no}/${+jy}`;
/* تاريخ صالح فقط: في المصدر تواريخ مدخلة خطأً مثل 0193-04-01 */
const okDate = s => /^(19[3-9]\d|20[0-3]\d)-\d{2}-\d{2}$/.test(s || '') ? s : '';

function read(dir, t) { const f = path.join(dir, t + '.jsonl'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l)) : [] }

function build(dir) {
  const files = fs.readdirSync(dir).filter(f => /\.jsonl$/.test(f)).map(f => f.replace(/\.jsonl$/, ''));
  const rows = Object.fromEntries(files.map(t => [t, read(dir, t)]));
  /* تصنيف الجداول من بنيتها: مبادئ (a5 موضوع، a6 مبدأ، a7 رقم الطعن) · نصوص كاملة (a4 نص طويل) · فهارس (T1/t1 + t5) */
  const PR = files.filter(t => rows[t].length && 'a7' in rows[t][0] && 'a5' in rows[t][0]);
  const FT = files.filter(t => rows[t].length && 'a4' in rows[t][0] && !('a5' in rows[t][0]) && typeof rows[t][0].a4 === 'string');
  const IX = files.filter(t => rows[t].length && ('t5' in rows[t][0]) && ('T1' in rows[t][0] || 't1' in rows[t][0]));

  /* الفهرس: (جدول النص الكامل، رقم القاعدة، التاريخ) → رقم الطعن والموضوع */
  const idx = new Map();
  for (const t of IX) for (const r of rows[t]) {
    const k = `${r.t5}|${String(r.T3 ?? '').trim()}|${r.T2 || ''}`; const a = appealOf(r.T1 || r.t1 || '');
    const cur = idx.get(k) || { topics: new Set(), appeal: null }; if (r.T4) cur.topics.add(oneLine(r.T4)); if (a && !cur.appeal) cur.appeal = a; idx.set(k, cur);
  }

  const docs = new Map(); // key → doc
  const byDateRule = new Map(); // `${date}|${rule}` → key (للربط حين يغيب رقم الطعن من النص)
  const get = (key) => { if (!docs.has(key)) docs.set(key, { key, appeal: null, date: '', rule: '', page: '', part: '', topics: new Set(), principles: [], texts: [], tables: new Set() }); return docs.get(key) };

  /* 1) المبادئ المختصرة */
  let nPr = 0;
  for (const t of PR) for (const r of rows[t]) {
    const a = appealOf(r.a9 || '') || (r.a7 ? { nos: [String(r.a7)], jy: String(+digits(r.a8 || '')) } : null);
    const key = a && a.jy !== 'NaN' ? keyOf(a.nos[0], a.jy) : `d${r.a2}|${r.a3}`;
    const d = get(key); d.appeal = d.appeal || a; d.date = d.date || okDate(r.a2); d.rule = d.rule || String(r.a3 ?? ''); d.page = d.page || String(r.a4 ?? ''); d.part = d.part || oneLine(r.a10 || '');
    if (r.a5) d.topics.add(oneLine(r.a5));
    const p = tidy(r.a6 || ''); if (p && !d.principles.includes(p)) d.principles.push(p);
    d.tables.add(t); nPr++;
    if (r.a2 && r.a3 != null) byDateRule.set(`${r.a2}|${r.a3}`, key);
  }
  /* 2) الأحكام بنصها الكامل */
  let nFt = 0, viaIdx = 0, viaRule = 0, orphan = 0;
  for (const t of FT) for (const r of rows[t]) {
    const text = tidy(r.a4 || ''); if (text.length < 40) continue;
    const ix = idx.get(`${t}|${r.a2}|${r.a3}`);
    let a = appealOf(text.slice(0, 1500));
    if (!a && ix && ix.appeal) { a = ix.appeal; viaIdx++ }
    let key = a ? keyOf(a.nos[0], a.jy) : byDateRule.get(`${r.a3}|${r.a2}`);
    if (!a && key) viaRule++;
    if (!key) { key = `d${r.a3}|${r.a2}|${t}`; orphan++ }
    const d = get(key); d.appeal = d.appeal || a; d.ftDate = d.ftDate || okDate(r.a3); d.rule = d.rule || String(r.a2 ?? '');
    if (ix) for (const x of ix.topics) d.topics.add(x);
    if (!d.texts.includes(text)) d.texts.push(text);
    d.tables.add(t); nFt++;
  }

  /* 3) مستند مِسْبار لكل طعن */
  const out = [];
  for (const d of docs.values()) {
    d.date = d.ftDate || d.date; /* تاريخ الجلسة من نص الحكم الكامل أوثق من فهرس المبادئ */
    const a = d.appeal, nos = a ? a.nos.join(' و') : '', jy = a ? a.jy : '';
    const year = /^\d{4}/.test(d.date) ? +d.date.slice(0, 4) : null;
    const label = a ? `${a.nos.length > 1 ? 'الطعنان رقما' : 'الطعن رقم'} ${nos} لسنة ${jy} ق` : 'طعن غير مرقّم في المصدر';
    /* الموضوعات بلا تكرار إملائي (تأمين/تامين، إيجار/ايجار) */
    const tk = new Set(), topics = [...d.topics].filter(Boolean).filter(t => { const k = t.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ''); return tk.has(k) ? false : tk.add(k) });
    const pub = [d.part && `الجزء ${d.part}`, d.page && `ص ${d.page}`, d.rule && `القاعدة ${d.rule}`].filter(Boolean).join(' — ');
    const body = [
      'محكمة النقض المصرية — المواد المدنية',
      `${label}${d.date ? ' — جلسة ' + dmy(d.date) : ''}`,
      pub && `مجموعة الأحكام: ${pub}`,
      topics.length && `الموضوع: ${topics.join(' — ')}`,
      d.principles.length && ('المبادئ القانونية:\n' + d.principles.map((p, i) => (d.principles.length > 1 ? `${i + 1}. ` : '') + p).join('\n')),
      d.texts.length && ('نص الحكم:\n' + d.texts.join('\n\n— — —\n\n')),
    ].filter(Boolean).join('\n\n');
    const first = d.principles[0] || (d.texts[0] || '').split('\n').map(s => s.trim()).find(s => s.length > 25 && !/^(جلسة|برئاسة|برياسة|\(|الطعن)/.test(s)) || '';
    const head = first.length > 140 ? first.slice(0, 137) + '…' : first;
    out.push({
      src: 'EG_CASSATION', country: 'EG', kind: 'ruling', ext_id: 'eg-naqd-' + (a ? `${jy}-${a.nos[0]}` : d.key.replace(/[^0-9a-z]+/gi, '-')),
      title: `نقض مدني — ${label}${d.date ? ' — جلسة ' + dmy(d.date) : ''}${topics.length ? ' — ' + topics.slice(0, 3).join('، ') : ''}${head ? ': ' + head : ''}`,
      year, number: a ? a.nos[0] : '', court: 'محكمة النقض المصرية', case_no: a ? `${a.nos[0]}/${jy}ق` : '', date: d.date, ltype: 'مدني',
      subject: topics.join(' | '), status: '', status_code: '', url: '', file_url: '', body,
      meta: { origin: 'موسوعة أحكام محكمة النقض (low.mdb)', part: d.part, page: d.page, rule: d.rule, principles: d.principles.length, full_text: d.texts.length > 0, tables: [...d.tables], appeals: a ? a.nos : [], judicial_year: jy, note: 'مرجع مصري للمقارنة والاستئناس' },
    });
  }
  out.sort((x, y) => String(x.date).localeCompare(String(y.date)) || String(x.ext_id).localeCompare(String(y.ext_id)));
  /* ext_id فريد */
  const seen = new Map(); for (const d of out) { const n = seen.get(d.ext_id) || 0; seen.set(d.ext_id, n + 1); if (n) d.ext_id += '-' + (n + 1) }
  const stats = { principles_rows: nPr, fulltext_rows: nFt, docs: out.length, with_full_text: out.filter(d => d.meta.full_text).length, with_principles: out.filter(d => d.meta.principles).length,
    both: out.filter(d => d.meta.full_text && d.meta.principles).length, no_appeal: out.filter(d => !d.number).length, linked_via_index: viaIdx, linked_via_rule: viaRule, orphan_fulltext: orphan,
    years: [Math.min(...out.map(d => d.year || 9999)), Math.max(...out.map(d => d.year || 0))], tables: { PR, FT, IX } };
  return { docs: out, stats };
}

if (require.main === module) {
  const RAW = arg('raw'), OUT = arg('out');
  if (!RAW || !OUT) { console.error('الاستعمال: --raw <مجلد JSONL> --out <eg_naqd.jsonl>'); process.exit(2) }
  const { docs, stats } = build(RAW);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, docs.map(d => JSON.stringify(d)).join('\n') + '\n');
  console.log(JSON.stringify(stats, null, 1));
}
module.exports = { build, appealOf };
