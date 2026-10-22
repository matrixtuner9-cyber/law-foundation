// تذكير الموكل بالجلسات التي يُطلب حضوره فيها: يبدأ قبل الجلسة بـ48 ساعة، وتذكير كل 8 ساعات حتى موعدها (6 تذكيرات كحد أقصى).
// منطق خالص بلا قاعدة بيانات؛ نسخة مطابقة في cloud/src/hearing-alerts.js (وحدة ES). أي تعديل هنا يُنقل هناك.
const WINDOW_H = 48, EVERY_H = 8, TZ = 'Asia/Hebron';
function tzOffsetMin(ms, tz = TZ) {
  try { const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(new Date(ms)).find(x => x.type === 'timeZoneName'); const m = /GMT([+-]\d{1,2})(?::(\d{2}))?/.exec(p && p.value || ''); if (m) return (+m[1]) * 60 + Math.sign(+m[1] || 1) * (+(m[2] || 0)) } catch (e) {}
  return 180;
}
/* وقت الجلسة المحلي (فلسطين) إلى لحظة UTC */
function hearingMs(h, tz = TZ) {
  const d = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(h.date || '')); if (!d) return NaN;
  const t = /^(\d{1,2}):(\d{2})/.exec(String(h.time || '09:00')) || [0, 9, 0];
  const naive = Date.UTC(+d[1], +d[2] - 1, +d[3], +t[1], +t[2]);
  return naive - tzOffsetMin(naive, tz) * 60000;
}
const dmy = s => { const [y, m, d] = String(s).slice(0, 10).split('-'); return `${+d}/${+m}/${y}` };
const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
function plan(state, { now = Date.now(), sent = {}, courts = [], tz = TZ } = {}) {
  const out = [];
  if (!state) return out;
  const cases = state.cases || [], clients = state.clients || [];
  for (const h of state.hearings || []) {
    if (!h || !h.attend || h.result) continue;
    const k = cases.find(x => x.id === h.k); if (!k || k.status === 'منتهية') continue;
    const cl = clients.find(x => x.id === k.client); if (!cl) continue;
    const at = hearingMs(h, tz); if (!isFinite(at)) continue;
    const left = (at - now) / 3600000; if (left <= 0 || left > WINDOW_H) continue;
    const slot = Math.min(Math.floor((WINDOW_H - left) / EVERY_H), Math.floor(WINDOW_H / EVERY_H) - 1);
    const key = `h:${h.id}:${h.date}T${h.time || ''}:${slot}`; if (sent[key]) continue;
    const court = (courts.find(c => c.id === k.court) || {}).name || '';
    const day = DAYS[new Date(Date.UTC(+h.date.slice(0, 4), +h.date.slice(5, 7) - 1, +h.date.slice(8, 10))).getUTCDay()];
    const when = left < 12 ? 'بعد نحو ' + Math.max(1, Math.round(left)) + ' ساعات' : 'بعد نحو ' + Math.round(left) + ' ساعة';
    const text = `تذكير بموعد جلسة: جلسة قضيتكم رقم ${k.no} يوم ${day} ${dmy(h.date)} الساعة ${h.time || ''}${court ? ' في ' + court : ''}${h.purpose ? ' — ' + h.purpose : ''}. حضوركم شخصياً مطلوب، يرجى الحضور قبل الموعد بنصف ساعة مع إبراز الهوية. (${when})`;
    out.push({ key, client: cl.id, k: k.id, hearing: h.id, slot, text });
  }
  return out;
}
/* حذف سجلات الإرسال الأقدم من 7 أيام */
function prune(sent, now = Date.now()) { const o = {}; for (const [k, v] of Object.entries(sent || {})) if (now - v < 7 * 86400000) o[k] = v; return o }
module.exports = { plan, prune, hearingMs, tzOffsetMin, WINDOW_H, EVERY_H };
