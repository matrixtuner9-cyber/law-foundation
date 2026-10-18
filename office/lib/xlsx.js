// قارئ Excel (xlsx) مصغّر بلا مكتبات خارجية: يفك ملف ZIP ويقرأ أول ورقة كجدول نصوص.
// يكفي لملفات البيانات البسيطة (نصوص وأرقام). يُستخدم لاستيراد دليل المحامين.
'use strict';
const zlib = require('zlib');

function unzip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break }
  if (eocd < 0) throw new Error('الملف ليس بصيغة Excel (xlsx) صالحة.');
  const n = buf.readUInt16LE(eocd + 10); let p = buf.readUInt32LE(eocd + 16); const files = {};
  for (let k = 0; k < n; k++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('ملف Excel تالف.');
    const method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20), nlen = buf.readUInt16LE(p + 28), xlen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nlen).toString('utf8');
    const lnl = buf.readUInt16LE(off + 26), lxl = buf.readUInt16LE(off + 28), data = buf.slice(off + 30 + lnl + lxl, off + 30 + lnl + lxl + csize);
    files[name] = () => method === 0 ? data : method === 8 ? zlib.inflateRawSync(data, { maxOutputLength: 200 * 1024 * 1024 }) : (() => { throw new Error('ضغط غير مدعوم') })();
    p += 46 + nlen + xlen + clen;
  }
  return files;
}
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const dec = s => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, k) => k[0] === '#' ? String.fromCodePoint(k[1] === 'x' || k[1] === 'X' ? parseInt(k.slice(2), 16) : +k.slice(1)) : (ENT[k] ?? m));
const NS = '(?:\\w+:)?'; /* بعض البرامج تكتب العناصر ببادئة مثل <x:row> */
const re = (src, f = 'g') => new RegExp(src.replace(/~/g, NS), f);
const textOf = x => dec([...x.matchAll(re('<~t(?:\\s[^>]*)?>([\\s\\S]*?)</~t>'))].map(m => m[1]).join(''));
const colIdx = ref => { const L = ref.replace(/\d+/g, ''); let n = 0; for (const c of L) n = n * 26 + (c.charCodeAt(0) - 64); return n - 1 };

/* يعيد صفوف أول ورقة: مصفوفة من مصفوفات نصوص */
function readSheet(buf, maxRows = 200000) {
  const z = unzip(buf), get = n => z[n] ? z[n]().toString('utf8') : null;
  const shared = []; const ss = get('xl/sharedStrings.xml');
  if (ss) for (const m of ss.matchAll(re('<~si>([\\s\\S]*?)</~si>'))) shared.push(textOf(m[1]));
  let sheet = 'xl/worksheets/sheet1.xml';
  const wb = get('xl/workbook.xml'), rels = get('xl/_rels/workbook.xml.rels');
  if (wb && rels) { const rid = (wb.match(re('<~sheet\\b[^>]*r:id="([^"]+)"', '')) || [])[1]; const t = rid && (rels.match(new RegExp(`<Relationship\\b[^>]*Id="${rid}"[^>]*Target="([^"]+)"`)) || rels.match(new RegExp(`<Relationship\\b[^>]*Target="([^"]+)"[^>]*Id="${rid}"`)) || [])[1]; if (t) sheet = 'xl/' + t.replace(/^\/?xl\//, '').replace(/^\//, '') }
  const xml = get(sheet); if (!xml) throw new Error('لم يُعثر على ورقة البيانات في الملف.');
  const rows = [];
  for (const r of xml.matchAll(re('<~row\\b[^>]*>([\\s\\S]*?)</~row>'))) {
    const row = [];
    for (const c of r[1].matchAll(re('<~c\\b([^>]*?)(?:/>|>([\\s\\S]*?)</~c>)'))) {
      const attrs = c[1], body = c[2] || '', ref = (attrs.match(/\br="([A-Z]+\d+)"/) || [])[1], t = (attrs.match(/\bt="([^"]+)"/) || [])[1];
      let v = '';
      if (t === 'inlineStr') v = textOf(body);
      else { const raw = (body.match(re('<~v>([\\s\\S]*?)</~v>', '')) || [])[1]; v = raw == null ? '' : t === 's' ? (shared[+raw] ?? '') : dec(raw) }
      row[ref ? colIdx(ref) : row.length] = String(v).trim();
    }
    rows.push(Array.from(row, x => x ?? ''));
    if (rows.length >= maxRows) break;
  }
  return rows;
}

/* دليل المحامين: الأعمدة بالإنجليزية أو العربية (name/الاسم، phone/الهاتف، email/البريد، segment/الصفة، city/المدينة، mno/رقم العضوية) */
const COLS = { name: /^(name|الاسم|اسم المحامي|الاسم الكامل)$/i, phone: /^(phone|mobile|الهاتف|الجوال|رقم الهاتف|رقم الجوال)$/i, email: /^(email|e-mail|البريد|البريد الإلكتروني)$/i,
  status: /^(segment|status|الصفة|الحالة|التصنيف)$/i, city: /^(city|المدينة|المحافظة)$/i, mno: /^(mno|member|رقم العضوية|العضوية)$/i };
function lawyersFromRows(rows) {
  if (!rows.length) throw new Error('الملف فارغ.');
  const head = rows[0].map(h => String(h).trim()), idx = {};
  for (const [k, re] of Object.entries(COLS)) idx[k] = head.findIndex(h => re.test(h));
  if (idx.name < 0) throw new Error('لم يُعثر على عمود الاسم (name أو الاسم) في الصف الأول.');
  const out = [], seen = new Set();
  rows.slice(1).forEach(r => {
    const name = String(r[idx.name] || '').replace(/\s+/g, ' ').trim(); if (!name) return;
    const phones = idx.phone < 0 ? [] : String(r[idx.phone] || '').split(/[,;/،]| و /).map(x => x.replace(/[^\d+]/g, '')).map(x => /^5\d{8}$/.test(x) ? '0' + x : x).filter(x => x.length >= 7);
    const key = name + '|' + phones.join(','); if (seen.has(key)) return; seen.add(key);
    out.push({ mno: idx.mno >= 0 && r[idx.mno] ? String(r[idx.mno]).trim() : '', name, status: idx.status >= 0 ? String(r[idx.status] || '').trim() : '', phones,
      email: idx.email >= 0 ? String(r[idx.email] || '').trim().toLowerCase() : '', info: idx.city >= 0 && r[idx.city] ? { 'المدينة': String(r[idx.city]).trim() } : {} });
  });
  /* بلا رقم عضوية: معرّف داخلي ثابت مرتب أبجدياً (يظهر في الواجهة «—») */
  const coll = new Intl.Collator('ar');
  out.filter(l => !l.mno).sort((a, b) => coll.compare(a.name, b.name)).forEach((l, i) => { l.mno = 'L' + String(i + 1).padStart(5, '0') });
  return out;
}
module.exports = { readSheet, lawyersFromRows, unzip };
