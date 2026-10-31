// تحويل مبادئ المكتب الفني لمحكمة التمييز الأردنية (موقع المجلس القضائي jc.jo) إلى مستندات مِسْبار.
// تُدمج في المصدر JO_CASSATION («الأردن · تمييز») بـ misbar-append --merge، ولكل مبدأ قائمة القرارات التي استُقي منها
// (cites بحقل case) فيفتح المحامي القرار الكامل حين يكون في القاعدة.
// الاستعمال: node tools/jo-jc-build.js --in E:\maqam\jc-principles-v1\data\jo_jc_principles.jsonl --out jo_jc_docs.jsonl
// نص المبدأ يُنقل حرفياً كما نشره المجلس القضائي؛ يُزال فقط ما ليس منه (رمز «>» في أوله وذيل «كيف تقيم محتوى الصفحة»).
'use strict';
const fs = require('fs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d };
const AR = s => String(s || '').replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x660));
const clean = s => String(s || '').replace(/\uFEFF/g, '').replace(/^\s*>\s*/, '').split('كيف تقيم محتوى الصفحة')[0].replace(/\s+/g, ' ').trim();

/* «٥٣٤٤ /2023» و«(2022/7537)» و«4112/2018» ← «5344/2023» */
function normRef(x) {
  const m = /(\d{1,6})\s*[-/]\s*(\d{1,6})/.exec(AR(x)); if (!m) return '';
  let a = m[1], b = m[2];
  if (/^(19|20)\d{2}$/.test(a) && !/^(19|20)\d{2}$/.test(b)) [a, b] = [b, a];
  if (!/^(19|20)\d{2}$/.test(b)) return '';
  return `${Number(a)}/${b}`;
}
/* العنوان: الكلمات المفصولة بـ / في أول المبدأ، وإلا أول جملة، ولا يُقصّ في منتصف كلمة */
function heading(t) {
  t = t.replace(/^[\d٠-٩]{1,2}\s*[-–.)]\s*/, '');
  const m = /^((?:[^/.\d]{2,70}\/){1,8}[^/.\d]{2,70}?)(?=\s*[.:]|\s+\d|\s+(?:من المقرر|إن|ان|يستفاد|استقر)\s)/.exec(t);
  let h = m ? m[1] : t.split(/(?<=[.؛])\s/)[0];
  if (h.length > 160) { h = h.slice(0, 160); h = h.slice(0, h.lastIndexOf(' ')) + '…' }
  return h.replace(/\s*\/\s*/g, ' / ').trim();
}
function convert(r) {
  const text = clean(r.text);
  const refs = [...new Set((r.refs || []).map(normRef).filter(Boolean))];
  const first = refs[0] || '';
  return {
    src: 'JO_CASSATION', country: 'JO', kind: 'ruling', ext_id: 'jc-' + r.id,
    title: 'مبدأ المكتب الفني: ' + heading(text), year: first ? Number(first.split('/')[1]) : null, number: first.split('/')[0] || '',
    court: 'محكمة التمييز — المكتب الفني (المجلس القضائي)', case_no: first, date: '', ltype: 'مبدأ', subject: '', status: '', status_code: '',
    url: r.url || '', file_url: '', body: text,
    cites: refs.map(c => ({ title: 'قرار تمييز رقم ' + c, text: '', case: c })),
    meta: { origin: 'المجلس القضائي الأردني — مبادئ ودراسات المكتب الفني (jc.jo)', principle: true, refs },
  };
}
if (require.main === module) {
  const IN = arg('in'), OUT = arg('out', 'jo_jc_docs.jsonl');
  if (!IN) { console.error('الاستعمال: --in jo_jc_principles.jsonl --out docs.jsonl'); process.exit(2) }
  const rows = fs.readFileSync(IN, 'utf8').split('\n').filter(l => l.trim()).map(l => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean);
  const seenId = new Set(), seenText = new Set(), out = []; let dup = 0, short = 0;
  for (const r of rows) {
    if (seenId.has(r.id)) continue; seenId.add(r.id);
    const d = convert(r); if (d.body.length < 120) { short++; continue }
    if (seenText.has(d.body)) { dup++; continue } seenText.add(d.body); out.push(d);
  }
  fs.writeFileSync(OUT, out.map(x => JSON.stringify(x)).join('\n') + '\n');
  console.log(JSON.stringify({ in: rows.length, out: out.length, duplicates: dup, short, noRefs: out.filter(x => !x.cites.length).length }));
}
module.exports = { convert, normRef, heading, clean };
