#!/usr/bin/env node
// تحويل مبادئ محكمة النقض المصرية من «الموسوعة التشريعية والقضائية المصرية — محمد حماد» (eg_hamad_principles.jsonl)
// إلى مستندات مِسْبار للمصدر EG_CASSATION («مصر · نقض») بصيغة misbar-append --merge.
// كل طعن (رقمه وسنته القضائية وجلسته) مستند واحد يجمع مبادئه كلها حرفياً كما وردت، دون تلخيص ولا اقتطاع.
// يُستبعد الطعن الموجود سلفاً في القاعدة (بالرقم والسنة القضائية) إن مُرّرت --db.
// الاستعمال: node tools/eg-hamad-build.js --in eg_hamad_principles.jsonl --out eg_hamad_docs.jsonl [--db mithaq-lawindex.db] [--min 150]
'use strict';
const fs = require('fs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d };
const IN = arg('in'), OUT = arg('out'), DB = arg('db'), MIN = Number(arg('min', 150));
if (!IN || !OUT) { console.error('الاستعمال: --in <jsonl> --out <jsonl> [--db <قاعدة>]'); process.exit(2) }
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s };
const iso = d => { const m = /(\d{4})\/(\d{1,2})\/(\d{1,2})/.exec(d || ''); return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : '' };
const kindOf = c => /جنائ/.test(c) ? 'جنائي' : /أحوال|شخصية/.test(c) ? 'أحوال شخصية' : /عمال/.test(c) ? 'عمالي' : /تجار|اقتصاد/.test(c) ? 'تجاري' : /إدار/.test(c) ? 'إداري' : 'مدني';

const have = new Set();
if (DB) {
  const { DatabaseSync } = require('node:sqlite'), db = new DatabaseSync(DB, { readOnly: true });
  for (const r of db.prepare("SELECT case_no, meta FROM docs WHERE src='EG_CASSATION'").all()) {
    const m = /^(\d+)\/(\d+)ق/.exec(r.case_no || ''); if (m) have.add(Number(m[1]) + '/' + Number(m[2]));
    try { const j = JSON.parse(r.meta || '{}'); for (const a of j.appeals || []) if (j.judicial_year) have.add(Number(a) + '/' + Number(j.judicial_year)) } catch {}
  }
  db.close();
}
const groups = new Map(); let rows = 0, short = 0, dup = 0;
for (const l of fs.readFileSync(IN, 'utf8').split('\n')) {
  if (!l.trim()) continue; let x; try { x = JSON.parse(l) } catch { continue } rows++;
  const p = String(x.principle || '').trim(); if (p.length < MIN) { short++; continue }
  const no = Number(x.petition_number), yr = Number(x.petition_year); if (!no || !yr) { short++; continue }
  const k = no + '/' + yr; if (have.has(k)) { dup++; continue }
  const g = groups.get(k + '|' + (x.session_date || '')) || { x, items: [] }; g.items.push(x); groups.set(k + '|' + (x.session_date || ''), g);
}
const out = [];
for (const { x, items } of groups.values()) {
  const no = Number(x.petition_number), yr = Number(x.petition_year), circuit = String(x.circuit || '').trim(), kind = kindOf(circuit);
  const topics = [...new Set(items.map(i => String(i.topics || '').trim()).filter(Boolean))];
  const head = `نقض ${kind} — الطعن رقم ${no} لسنة ${yr} ق${x.session_date ? ' — جلسة ' + x.session_date : ''}`;
  const body = [`محكمة النقض المصرية — ${circuit || 'الدوائر ' + kind}`, '', `الطعن رقم ${no} لسنة ${yr} ق${x.session_date ? ' — جلسة ' + x.session_date : ''}`, '',
    ...(topics.length ? ['الموضوعات: ' + topics.join(' · '), ''] : []), items.length > 1 ? 'المبادئ القانونية:' : 'المبدأ القانوني:',
    ...items.map((i, n) => (items.length > 1 ? (n + 1) + '- ' : '') + String(i.principle).trim())].join('\n');
  out.push({ src: 'EG_CASSATION', country: 'EG', kind: 'ruling', ext_id: 'egh-' + no + '-' + yr + (x.session_date ? '-' + iso(x.session_date) : ''),
    title: clip(head + (topics[0] ? ' — ' + topics[0] : ''), 220), year: Number(String(x.session_date || '').slice(0, 4)) || null, number: String(no), court: 'محكمة النقض المصرية',
    case_no: `${no}/${yr}ق`, date: iso(x.session_date), ltype: kind, subject: clip(topics.join(' · '), 300), status: '', status_code: '', url: x.source_url || '', file_url: '', body, cites: [],
    meta: { origin: 'الموسوعة التشريعية والقضائية المصرية — محمد حماد', principles: items.length, full_text: false, appeals: [String(no)], judicial_year: String(yr), circuit, note: 'مرجع مصري للمقارنة والاستئناس', urls: items.map(i => i.source_url).filter(Boolean) } });
}
fs.writeFileSync(OUT, out.map(d => JSON.stringify(d)).join('\n') + '\n');
console.log(JSON.stringify({ rows, short, existing: dup, docs: out.length, principles: out.reduce((a, d) => a + d.meta.principles, 0) }));
