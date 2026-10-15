// مطابقة بيانات ميزان مع بيانات المكتب: القضايا برقم الدعوى والسنة، والموكلون برقم الهوية
const AR = '٠١٢٣٤٥٦٧٨٩', FA = '۰۱۲۳۴۵۶۷۸۹';
const digits = s => String(s || '').replace(/[٠-٩]/g, d => AR.indexOf(d)).replace(/[۰-۹]/g, d => FA.indexOf(d));
const caseKey = no => { const m = digits(no).match(/(\d{1,7})\s*[\/\\\-]\s*(\d{4})/); return m ? `${+m[1]}/${m[2]}` : digits(no).replace(/\s+/g, '') };
const idKey = id => digits(id).replace(/\D/g, '');
const loose = s => digits(s).replace(/[إأآا]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim();

/**
 * records: [{ caseNo, court, type, subject, status, parties:[{name,idNo,role}], sessions:[{date:'YYYY-MM-DD',time,purpose,result}], ref }]
 * st: { cases, clients, hearings }
 */
function match(records, st) {
  const res = { matched: [], newForClient: [], unknown: [], summary: {} };
  for (const r of records) {
    const key = caseKey(r.caseNo);
    const kase = st.cases.find(k => caseKey(k.no) === key && (!r.court || !k.courtName || loose(k.courtName).includes(loose(r.court).split(' ').slice(-1)[0])));
    const ids = (r.parties || []).map(p => idKey(p.idNo)).filter(Boolean);
    const client = st.clients.find(c => ids.includes(idKey(c.idNo)));
    if (kase) {
      const known = new Set(st.hearings.filter(h => h.k === kase.id).map(h => h.date));
      const newSessions = (r.sessions || []).filter(s => s.date && !known.has(s.date));
      const changes = [];
      if (r.ref && kase.mz !== r.ref) changes.push({ field: 'mz', from: kase.mz, to: r.ref });
      if (r.status && r.status !== kase.stage) changes.push({ field: 'stage', from: kase.stage, to: r.status });
      res.matched.push({ caseId: kase.id, caseNo: kase.no, by: 'رقم الدعوى', newSessions, changes, record: r });
    } else if (client) res.newForClient.push({ clientId: client.id, clientName: client.name, by: 'رقم الهوية', record: r });
    else res.unknown.push({ record: r });
  }
  res.summary = { total: records.length, matched: res.matched.length, newForClient: res.newForClient.length, unknown: res.unknown.length,
    newSessions: res.matched.reduce((n, m) => n + m.newSessions.length, 0) };
  return res;
}
module.exports = { match, caseKey, idKey };
