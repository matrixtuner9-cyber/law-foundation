// تحويل أحكام المحكمة الدستورية العليا المصرية (والمحكمة العليا قبلها) من eg_scc_rules.jsonl (موقع sccourt.gov.eg) إلى مستندات مِسْبار.
// مصدر جديد EG_CONSTITUTIONAL («مصر · الدستورية العليا»)، يُضاف بـ misbar-append.
// الاستعمال: node tools/eg-scc-build.js --in E:\maqam\eg-scc-v1\data\eg_scc_rules.jsonl --out eg_scc_docs.jsonl
// النص الكامل للحكم يُنقل حرفياً كما نشرته المحكمة، وقبله بطاقة الدعوى (الطلبات والمنطوق والتشريع محل الطعن) من المصدر نفسه.
'use strict';
const fs = require('fs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d };
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s };
const txt = s => String(s ?? '').replace(/\uFEFF/g, '').replace(/\r/g, '').trim();

function convert(r) {
  const no = String(r.case_number || '').trim(), y = String(r.case_year || '').trim(), type = txt(r.case_type);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(r.rule_date || '') ? r.rule_date : '';
  const court = /المحكمة العليا/.test(r.case_info || '') ? 'المحكمة العليا (مصر)' : 'المحكمة الدستورية العليا المصرية';
  const full = txt(r.full_text), ward = txt(r.rule_warding);
  const card = [txt(r.case_info), r.law && 'التشريع محل الدعوى: ' + txt(r.law), r.requests && 'الطلبات: ' + txt(r.requests), ward && 'المنطوق: ' + ward, r.disagree_reason && 'الأسباب: ' + txt(r.disagree_reason).replace(/^\s*-\s*/, '')].filter(Boolean).join('\n\n');
  const body = full ? card + '\n\n— نص الحكم —\n\n' + full : [card, r.subject && 'الوقائع: ' + txt(r.subject)].filter(Boolean).join('\n\n');
  const title = `الدستورية العليا — الدعوى ${no} لسنة ${y} ق${type ? ' «' + type + '»' : ''}${date ? ' — جلسة ' + date : ''}${ward ? ' — ' + ward : ''}`;
  return {
    src: 'EG_CONSTITUTIONAL', country: 'EG', kind: 'ruling', ext_id: 'scc-' + (r.rule_id ?? r.id), title: clip(title, 200), year: date ? Number(date.slice(0, 4)) : null, number: no,
    court, case_no: no && y ? `${no}/${y}ق` : '', date, ltype: type, subject: txt(r.law), status: '', status_code: '', url: r.file_path || r.source_url || '', file_url: '', body, cites: [],
    meta: { origin: 'المحكمة الدستورية العليا — sccourt.gov.eg', full_text: !!full, case_info: txt(r.case_info) }
  };
}

if (require.main === module) {
  const IN = arg('in'), OUT = arg('out', 'eg_scc_docs.jsonl');
  if (!IN) { console.error('الاستعمال: --in eg_scc_rules.jsonl --out docs.jsonl'); process.exit(2) }
  const rows = fs.readFileSync(IN, 'utf8').split('\n').filter(l => l.trim()).map(l => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean);
  const seen = new Set(), out = [];
  for (const r of rows) { const d = convert(r); if (seen.has(d.ext_id)) continue; seen.add(d.ext_id); out.push(d) }
  fs.writeFileSync(OUT, out.map(d => JSON.stringify(d)).join('\n') + '\n');
  console.log(JSON.stringify({ in: rows.length, out: out.length, fullText: out.filter(d => d.meta.full_text).length }));
}
module.exports = { convert };
