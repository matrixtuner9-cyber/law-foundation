// يطبع بنية الاستجابة فقط (أسماء الحقول والأنواع) دون القيم الشخصية
const fs = require('fs'), out = [];
const shape = (v, d = 0) => v === null ? 'null' : Array.isArray(v) ? `[${v.length}] ` + (v.length && d < 2 ? shape(v[0], d + 1) : '') : typeof v === 'object' ? '{' + Object.keys(v).map(k => k + ':' + (d < 2 ? shape(v[k], d + 1) : typeof v[k])).join(', ') + '}' : typeof v;
(async () => {
  const fd = new URLSearchParams({ lawyer_name: '', office_city_id: '', page: '1', membership_status_id: '' });
  const r = await fetch('https://eservices.palestinebar.ps/pba_membership/api/all_lawyer', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8', origin: 'https://palestinebar.ps', referer: 'https://palestinebar.ps/ar/lawyers', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Mithaq-Directory' }, body: fd });
  const txt = await r.text(); out.push('status ' + r.status + ' len ' + txt.length);
  let j; try { j = JSON.parse(txt) } catch (e) { out.push('notjson ' + txt.slice(0, 300)); throw e }
  out.push('top keys: ' + Object.keys(j).join(', '));
  const L = j.lawyers || (j.data && (j.data.lawyers || j.data.data || j.data)) || [];
  for (const k of Object.keys(j)) if (k !== 'lawyers' && k !== 'data') out.push(k + ' = ' + JSON.stringify(j[k]).slice(0, 300));
  if (j.data && !Array.isArray(j.data)) out.push('data keys: ' + Object.keys(j.data).join(', ') + ' :: ' + JSON.stringify(Object.fromEntries(Object.entries(j.data).filter(([k, v]) => !Array.isArray(v)))).slice(0, 400));
  out.push('lawyers on page: ' + (Array.isArray(L) ? L.length : typeof L));
  if (Array.isArray(L) && L.length) out.push('lawyer shape: ' + shape(L[0]));
})().catch(e => out.push('ERR ' + e.message)).finally(() => fs.writeFileSync('D:\\Mithaq\\tools\\bar_shape.txt', out.join('\n'), 'utf8'));
