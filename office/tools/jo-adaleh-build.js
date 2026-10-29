// تحويل أحكام التمييز الأردنية من «منشورات مركز عدالة» (jo_adaleh.jsonl من سكربت jo_adaleh_cassation) إلى مستندات مِسْبار.
// تُضاف إلى المصدر نفسه JO_CASSATION («الأردن · تمييز») بصيغة misbar-append --merge.
// الاستعمال: node tools/jo-adaleh-build.js --in "E:\maqam\محاكم التمييز\data\jo_adaleh.jsonl" --out jo_adaleh_docs.jsonl
// النص القانوني يُنقل حرفياً: المبادئ كاملة كما هي، والتشريعات المستشهد بها كاملة. لا تلخيص ولا اقتطاع.
'use strict';
const fs = require('fs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d };

const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s };
/* «المادة 13 من قانون … لسنة 1982 المادة 826 من …» → قائمة مراجع، بصيغة «المادة رقم 13 من …» التي يقرؤها المسبار المحلي */
function citesOf(refs) {
  const out = [], seen = new Set();
  for (const part of String(refs || '').split(/\s(?=(?:المادة|المادتين|المواد|الفقرة|البند)\s)/)) {
    const t = part.replace(/\s+/g, ' ').trim(); if (!t) continue;
    const m = /^المادة\s+(\d+)\s+من\s+(.+)$/.exec(t);
    const title = m ? `المادة رقم ${m[1]} من ${m[2].trim()}` : t;
    if (!seen.has(title)) { seen.add(title); out.push({ title, text: '' }) }
  }
  return out;
}
/* إزالة إشارات جهة النشر (منشورات عدالة / مركز عدالة / adaleh.info) من النص المخزَّن؛ كلمة «العدالة» في متن المبدأ لا تُمس:
   الإزالة فقط حين تأتي بعد «منشورات» أو «مركز» أو بعد شرطة مائلة في إسناد القرار، أو في أول حقل الموضوعات */
function unbrand(s, { topic = false } = {}) {
  let t = String(s || '');
  /* الرابط بصيغه كلها، ومنها صيغة Markdown المزخرفة «++**[https://adaleh.info](…)**++» */
  t = t.replace(/[+*_~]*\[?\s*(?:https?:\/\/)?(?:www\.)?adaleh\.info[^\]\s)]*(?:\s*\])?(?:\([^)]*\))?[+*_~]*/gi, '');
  t = t.replace(/(?:منش\S{3,5}\s+)?مركز\s+عدالة(?:\s+للمعلومات\s+القانونية)?\s*[\/—–-]?\s*/g, '');
  t = t.replace(/منش\S{1,3}ات\s+عدالة\s*\/?\s*/g, '');
  t = t.replace(/(\/\s*)عدالة\s+(?=[\u0621-\u064A])/g, '$1');
  if (topic) t = t.replace(/^\s*عدالة\s+(?=[\u0621-\u064A])/, '');
  return t.replace(/\/\s*\/+/g, '/').replace(/\/\s*([)\]])/g, '$1').replace(/[ \t]{2,}/g, ' ').trim();
}
/* للنصوص الطويلة القائمة: تنظيف الأسطر التي فيها الإشارة فقط، فتبقى بقية النص بمسافاته وأسطره كما هي */
const BRAND_RX = /منش\S{1,3}ات\s+(?:مركز\s+)?عدالة|مركز\s+عدالة|adaleh\.info/i;
/* السطر الذي لم يبقَ منه بعد إزالة الإشارة إلا زخرفة أو ترقيم يُحذف كله */
const unbrandLines = s => String(s ?? '').split('\n').flatMap(l => { if (!BRAND_RX.test(l)) return [l]; const u = unbrand(l); return /^[\s+*_~\[\]()،,.:\/-]*$/.test(u) ? [] : [u] }).join('\n');
const branchOf = court => /جزائي/.test(court) ? 'جزائي' : /اداري|إداري/.test(court) ? 'إداري' : /حقوقي/.test(court) ? 'حقوقي' : '';

function convert(r) {
  const court = String(r.court || '').trim(), no = String(r.case_number || '').trim(), y = Number(r.case_year) || null;
  const principles = unbrand(String(r.principles || '').replace(/^[\s_\-–—]+/, ''));
  const refs = unbrand(r.legislation_refs), topics = unbrand(r.topics, { topic: true });
  const date = /^\d{4}-\d{2}-\d{2}$/.test(r.decision_date || '') ? r.decision_date : '';
  const body = [unbrand(r.title), refs && 'التشريعات المستشهد بها: ' + refs, topics && 'الموضوعات: ' + topics, principles && 'المبادئ:\n' + principles].filter(Boolean).join('\n\n');
  const head = [court.replace(/الاردنية/, 'الأردنية'), no && y ? `رقم ${no}/${y}` : '', r.panel ? `(${r.panel})` : '', date ? 'تاريخ ' + date : ''].filter(Boolean).join(' ');
  return {
    src: 'JO_CASSATION', country: 'JO', kind: 'ruling', ext_id: 'jtm-' + (r.item_id ?? r.id), title: clip(head + (topics ? ' — ' + topics : ''), 200), year: y, number: no,
    court: 'محكمة التمييز الأردنية', case_no: no && y ? `${no}/${y}` : '', date, ltype: branchOf(court), subject: [unbrand(r.subject), topics].filter((v, i, a) => v && a.indexOf(v) === i).join(' › '), status: '', status_code: '',
    url: '', file_url: '', body, cites: citesOf(refs),
    meta: { court_full: court, panel: r.panel || '', principles: Number(r.principles_count) || 0 }
  };
}

if (require.main === module) {
  const IN = arg('in'), OUT = arg('out', 'jo_adaleh_docs.jsonl');
  if (!IN) { console.error('الاستعمال: --in jo_adaleh.jsonl --out docs.jsonl'); process.exit(2) }
  const rows = fs.readFileSync(IN, 'utf8').split('\n').filter(l => l.trim()).map(l => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean);
  const seen = new Set(), out = [];
  for (const r of rows) { const d = convert(r); if (seen.has(d.ext_id)) continue; seen.add(d.ext_id); out.push(d) }
  fs.writeFileSync(OUT, out.map(d => JSON.stringify(d)).join('\n') + '\n');
  console.log(JSON.stringify({ in: rows.length, out: out.length, withText: out.filter(d => d.body.length > 200).length, cites: out.reduce((a, d) => a + d.cites.length, 0) }));
}
module.exports = { convert, citesOf, unbrand, unbrandLines, BRAND_RX };
