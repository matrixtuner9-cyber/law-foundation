/* عروض المِسْبار — الواجهة. لا يُرسل شيء تلقائياً: زر القناة يفتح الرسالة في تطبيقها ويُسجَّل التواصل. */
'use strict';
const $ = s => document.querySelector(s);
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const api = async (u, o) => { const r = await fetch(u, o && o.body ? { method: o.method || 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(o.body) } : o); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || r.status); return j };
const toast = m => { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 2600) };
const store = { get: (k, d) => { try { const v = localStorage.getItem('offers.' + k); return v == null ? d : JSON.parse(v) } catch { return d } }, set: (k, v) => { try { localStorage.setItem('offers.' + k, JSON.stringify(v)) } catch { } } };

const CATS = [['', 'الكل', ''], ['intro', 'تعريف', '✦'], ['feature', 'المزايا', '⚖'], ['demo', 'عرض ودعوة', '🖥'], ['offer', 'العروض', '🎁'], ['follow', 'متابعة', '↺'], ['custom', 'قوالبي', '✎']];
const STAGES = [['', '— لم يُحدَّد —'], ['sent', 'أُرسل'], ['replied', 'ردّ'], ['interested', 'مهتم'], ['demo', 'حُدِّد عرض'], ['trial', 'في التجربة'], ['client', 'مشترك'], ['later', 'لاحقاً'], ['notint', 'غير مهتم']];
const STAGE_L = Object.fromEntries(STAGES);
const S = { tab: 'send', facets: null, settings: {}, stats: {}, tpls: [], q: '', list: 'dir', filters: store.get('filters', { city: '', status: 'محامي مزاول', mobile: '1', fresh: '' }), rows: [], total: 0, sel: null, tpl: store.get('tpl', 'intro'), tone: store.get('tone', 's'), cat: '', text: '', edited: false, queue: store.get('queue', null), mobile: '' };

/* ── بناء الرسالة ── */
function shortName(n) { const p = String(n || '').trim().split(/\s+/); return p.length > 2 ? p[0] + ' ' + p[p.length - 1] : p.join(' ') }
function vars() {
  const s = S.settings, l = S.sel || {};
  return { 'الاسم': l.name ? shortName(l.name) : '', 'المدينة': l.city || '', 'المكتب': l.office || '', 'المرسل': s.sender || '', 'الصفة': s.role || '', 'الجهة': s.company || '', 'هاتف_المرسل': s.phone || '', 'بريد_المرسل': s.email || '', 'الرابط': s.link || '', 'العرض': s.offer || '', 'انتهاء_العرض': s.offerEnd || '', 'الموعد': '' };
}
function build() {
  const t = S.tpls.find(x => x.id === S.tpl) || { formal: '', short: '' }, v = vars(), s = S.settings, short = S.tone === 's';
  const fill = str => String(str || '').replace(/\{الموعد_ب\}/g, v['الموعد'] ? ' بتاريخ ' + v['الموعد'] : '').replace(/\{([^{}\n]+)\}/g, (m, k) => (k in v) ? (v[k] || (k === 'الرابط' ? '' : '[' + k.replace(/_/g, ' ') + ']')) : m);
  const body = fill(short ? t.short : t.formal).replace(/[ \t]+$/gm, '').trim();
  const name = v['الاسم'] || '[الاسم]', me = v['المرسل'] || '[اسمك]', co = v['الجهة'];
  const optF = s.optoutLine ? '\n\nإن كنتم لا ترغبون في تلقي رسائل منا، يكفي الرد بكلمة «إيقاف».' : '';
  const optS = s.optoutLine ? '\n(للإيقاف: أرسل «إيقاف»)' : '';
  if (short) return `أستاذ/ة ${name}، تحية طيبة،\nمعك ${me}${co ? ' من ' + co : ''}.\n\n${body}${s.phone && !/\{هاتف_المرسل\}/.test(t.short) ? '\n' + s.phone : ''}${optS}`.replace(/\n{3,}/g, '\n\n').trim();
  return `حضرة الأستاذ/ة ${name} المحترم/ة،\nتحية طيبة وبعد،\nمعكم ${me}${v['الصفة'] ? '، ' + v['الصفة'] : ''}${co ? ' — ' + co : ''}.\n\n${body}\n\nمع خالص التقدير،\n${me}${co ? '\n' + co : ''}${s.phone ? '\n' + s.phone : ''}${s.email ? '\n' + s.email : ''}${s.link ? '\n' + s.link : ''}${optF}`.replace(/\n{3,}/g, '\n\n').trim();
}
const missing = t => [...new Set((String(t).match(/\[[^\]\n]{2,30}\]/g) || []))];
function refreshText(force) { if (force || !S.edited) { S.text = build(); S.edited = false } const ta = $('#msg'); if (ta) { ta.value = S.text; msgMeta() } }

/* ── التحميل ── */
async function load() {
  [S.settings, S.facets, S.tpls, S.stats] = await Promise.all([api('/api/settings'), api('/api/facets'), api('/api/templates'), api('/api/stats')]);
  if (!S.settings.sender) S.tab = 'settings';
  render(); if (S.tab === 'send') search();
}
async function reloadTpls() { S.tpls = await api('/api/templates') }
function drawToday() { const st = S.stats || {}, el = $('#today'); el.textContent = `اليوم ${st.today || 0} / ${st.limit || 40}` + (st.due ? ` · للمتابعة ${st.due}` : ''); el.className = 'today' + ((st.today || 0) >= (st.limit || 40) ? ' over' : '') }

function render() {
  $('#tabs').innerHTML = [['send', 'رسالة جديدة'], ['history', 'سجل التواصل'], ['settings', 'الإعدادات']].map(([k, l]) => `<button class="${S.tab === k ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('');
  drawToday();
  $('#main').innerHTML = S.tab === 'send' ? sendView() : S.tab === 'history' ? '<div id="hist">جارٍ التحميل…</div>' : settingsView();
  if (S.tab === 'send') { drawList(); drawSel(); drawTpls(); refreshText(); }
  if (S.tab === 'history') drawHistory();
}

/* ── رسالة جديدة: ثلاثة أعمدة ── */
function sendView() {
  const f = S.filters, fc = S.facets || { cities: [], statuses: [] };
  const q = S.queue;
  return `${q ? `<div class="qbar">الحملة <b>${q.i + 1} / ${q.ids.length}</b> <span class="muted" style="color:#c9d1e0">${e(q.label || '')}</span>
     <span style="flex:1"></span><button class="btn sm" data-act="qprev">→ السابق</button><button class="btn sm gold" data-act="qnext">التالي ←</button><button class="btn sm" data-act="qstop">إنهاء الحملة</button></div>` : ''}
  <div class="grid3">
  <section class="panel"><h2><span class="n">1</span>المستلم</h2>
    <div class="pills">${[['dir', 'دليل النقابة'], ['fav', 'المفضّلون'], ['due', 'للمتابعة'], ['recent', 'الأخيرة'], ['camp', 'حملة جديدة']].map(([k, l]) => `<button class="pill ${S.list === k ? 'on' : ''}" data-list="${k}">${l}</button>`).join('')}</div>
    ${S.list === 'camp' ? campView() : `
    <input class="field" id="q" placeholder="الاسم، رقم العضوية، الهاتف، المكتب…" value="${e(S.q)}" autocomplete="off">
    ${S.list === 'dir' ? `<div class="row" style="margin-top:8px">
      <select class="field" id="fCity"><option value="">كل المدن</option>${fc.cities.map(c => `<option ${f.city === c.c ? 'selected' : ''} value="${e(c.c)}">${e(c.c)} (${c.n})</option>`).join('')}</select>
      <select class="field" id="fStatus"><option value="">كل الحالات</option>${fc.statuses.filter(s => s.s && !/متوف|مشطوب|^محامي موقوف$/.test(s.s)).map(s => `<option ${f.status === s.s ? 'selected' : ''} value="${e(s.s)}">${e(s.s)} (${s.n})</option>`).join('')}</select></div>
    <div class="row" style="margin-top:6px"><label class="ck"><input type="checkbox" id="fMobile" ${f.mobile === '1' ? 'checked' : ''}> جوال فقط</label>
      <label class="ck"><input type="checkbox" id="fFresh" ${f.fresh ? 'checked' : ''}> لم يُراسل خلال 30 يوماً</label></div>` : ''}
    <div class="muted" id="cnt" style="margin-top:6px"></div><div class="list" id="list"></div>`}
    <div id="sel"></div>
  </section>
  <section class="panel"><h2><span class="n">2</span>القالب</h2>
    <div class="pills">${[['f', 'صيغة رسمية (بريد)'], ['s', 'مختصرة (واتساب)']].map(([k, l]) => `<button class="pill ${S.tone === k ? 'on' : ''}" data-tone="${k}">${l}</button>`).join('')}</div>
    <div class="pills">${CATS.map(([k, l, i]) => `<button class="pill ${S.cat === k ? 'on' : ''}" data-cat="${k}">${i ? i + ' ' : ''}${l}</button>`).join('')}</div>
    <div class="tpls" id="tpls"></div>
    <div class="btns"><button class="btn sm" data-act="tplNew">+ قالب جديد</button><button class="btn sm" data-act="tplEdit">تعديل القالب المختار</button></div>
  </section>
  <section class="panel"><h2><span class="n">3</span>الرسالة والإرسال</h2>
    <div class="to" id="to"></div>
    <div class="row" style="justify-content:space-between"><span class="muted">نص الرسالة — يمكن التعديل قبل الإرسال</span><button class="btn sm" data-act="rebuild">إعادة بناء من القالب</button></div>
    <textarea class="msg" id="msg"></textarea>
    <div class="row" style="justify-content:space-between"><span class="muted" id="len"></span><span class="warn" id="miss"></span></div>
    <div class="btns">
      <button class="btn wa" data-send="whatsapp">واتساب</button><button class="btn" data-send="sms">رسالة SMS</button><button class="btn" data-send="email">بريد</button><button class="btn" data-send="call">اتصال</button><button class="btn" data-send="copy">نسخ</button>
    </div>
    <p class="muted">تُفتح الرسالة في التطبيق المختار لتراجعها وترسلها بنفسك، ويُسجَّل التواصل في سجل المحامي. أرسل على مهل (الحد اليومي في الإعدادات) حتى لا يُحظر رقمك في واتساب.</p>
  </section></div>`;
}
function campView() {
  const f = S.filters, fc = S.facets || { cities: [], statuses: [] };
  return `<div class="card"><h3>حملة: قائمة تُراسلها واحداً واحداً</h3>
    <div class="form" style="margin-top:8px">
      <label>المدينة<select class="field" id="cCity"><option value="">كل المدن</option>${fc.cities.map(c => `<option ${f.city === c.c ? 'selected' : ''} value="${e(c.c)}">${e(c.c)} (${c.n})</option>`).join('')}</select></label>
      <label>الحالة<select class="field" id="cStatus"><option value="">كل الحالات المسموح مراسلتها</option>${fc.statuses.filter(s => s.s && !/متوف|مشطوب|^محامي موقوف$/.test(s.s)).map(s => `<option ${f.status === s.s ? 'selected' : ''} value="${e(s.s)}">${e(s.s)} (${s.n})</option>`).join('')}</select></label>
      <label>من لم يُراسل منذ<select class="field" id="cFresh"><option value="">أي وقت (ومن لم يُراسل أبداً)</option><option value="3650">لم يُراسل أبداً</option><option value="30">30 يوماً</option><option value="90">90 يوماً</option></select></label>
      <label>عدد الرسائل في الحملة<input class="field" id="cN" type="number" min="1" max="200" value="${Math.min(200, Number(S.settings.dailyLimit) || 40)}"></label>
    </div>
    <label class="ck" style="margin-top:6px"><input type="checkbox" id="cMobile" checked> جوال صالح لواتساب فقط</label>
    <div class="btns"><button class="btn pri" data-act="campStart">ابدأ الحملة</button></div>
    <p class="muted">تُستبعد تلقائياً حالات: متوفى، مشطوب، موقوف، ومن طلب عدم مراسلته.</p></div>`;
}
let qTimer = 0;
async function search() {
  if (S.tab !== 'send' || S.list === 'camp') return;
  const f = S.filters, p = new URLSearchParams({ q: S.q, limit: 60 });
  if (S.list === 'dir') { if (f.city) p.set('city', f.city); if (f.status) p.set('status', f.status); if (f.mobile === '1') p.set('mobile', '1'); if (f.fresh) p.set('fresh', '30') }
  if (S.list === 'fav') p.set('fav', '1');
  if (S.list === 'due') { p.set('due', '1'); p.set('sort', 'next') }
  if (S.list === 'recent') { p.set('contacted', '1'); p.set('sort', 'recent') }
  const d = await api('/api/dir?' + p);
  S.rows = d.rows; S.total = d.total; drawList();
}
const stageTag = r => r.optout ? '<span class="tag no">لا يُراسل</span>' : r.stage ? `<span class="tag ${/interested|demo|trial|client/.test(r.stage) ? 'int' : r.stage === 'notint' ? 'no' : 'sent'}">${e(STAGE_L[r.stage] || r.stage)}${r.count ? ' ·' + r.count : ''}</span>` : '';
function drawList() {
  const el = $('#list'); if (!el) return;
  $('#cnt').textContent = S.total ? `${S.total.toLocaleString('ar')} محامياً${S.total > S.rows.length ? ' — يظهر أول ' + S.rows.length : ''}` : (S.list === 'dir' ? 'لا نتائج — غيّر البحث أو الفلاتر' : 'لا أحد هنا بعد');
  el.innerHTML = S.rows.map(r => `<div class="it ${S.sel && S.sel.mno === r.mno ? 'on' : ''}" data-mno="${e(r.mno)}"><b>${r.fav ? '★ ' : ''}${e(r.name)}${stageTag(r)}${r.next_at ? `<span class="tag due">متابعة ${e(r.next_at)}</span>` : ''}</b>
    <small>${e([r.city, r.status, r.mobile ? '📱' : (r.phones[0] ? '☎' : 'بلا هاتف'), r.last_at ? 'آخر تواصل ' + r.last_at.slice(0, 10) : ''].filter(Boolean).join(' · '))}</small></div>`).join('');
}
async function pick(mno) {
  const d = await api('/api/lawyer/' + encodeURIComponent(mno)); S.sel = d; S.mobile = d.mobile || ''; S.edited = false;
  drawList(); drawSel(); drawTpls(); refreshText(true);
}
function drawSel() {
  const el = $('#sel'); if (!el) return; const l = S.sel;
  if (!l) { el.innerHTML = '<p class="muted" style="margin-top:12px">ابحث في دليل النقابة (أكثر من 18 ألف محامٍ) واختر المحامي، أو ابدأ «حملة جديدة».</p>'; return }
  const mobiles = l.phones.map(p => ({ p, wa: waNumber(p) }));
  el.innerHTML = `<div class="card"><div class="row" style="justify-content:space-between"><h3>${e(l.name)}</h3><button class="btn sm" data-act="fav">${l.fav ? '★ مفضّل' : '☆ مفضّل'}</button></div>
    <div class="muted">${e([l.mno, l.status, l.city].filter(Boolean).join(' · '))}</div>
    ${l.office ? `<div>${e(l.office)}${l.address ? ' — <span class="muted">' + e(l.address) + '</span>' : ''}</div>` : ''}
    <div class="chips">${mobiles.map(m => `<span class="chip ${m.wa && m.wa === S.mobile ? 'on' : ''}" data-phone="${e(m.wa || '')}" title="${m.wa ? 'جوال (واتساب)' : 'أرضي'}">${m.wa ? '📱' : '☎'} ${e(m.p)}</span>`).join('') || '<span class="muted">لا هاتف في الدليل</span>'}${l.email ? `<span class="chip">✉ ${e(l.email)}</span>` : ''}</div>
    ${l.never ? `<div class="warn">حالة «${e(l.status)}» — لا تُرسل لها عروض.</div>` : ''}
    <div class="form" style="margin-top:6px">
      <label>المرحلة<select class="field" id="stage">${STAGES.map(([k, t]) => `<option value="${k}" ${l.stage === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      <label>تاريخ المتابعة<input class="field" type="date" id="nextAt" value="${e(l.next_at)}"></label></div>
    <label class="muted" style="display:block;margin-top:6px">ملاحظة<textarea class="field" id="note" rows="2">${e(l.note)}</textarea></label>
    <div class="row" style="margin-top:6px"><label class="ck" style="color:var(--bad)"><input type="checkbox" id="optout" ${l.optout ? 'checked' : ''}> طلب عدم مراسلته (لا يظهر في الحملات)</label></div>
    ${l.log && l.log.length ? `<div class="hist">${l.log.map(x => `<div>${e(x.at)} · ${e(chName(x.channel))} · ${e((S.tpls.find(t => t.id === x.tpl) || {}).title || x.tpl)}</div>`).join('')}</div>` : '<div class="muted">لم يُراسل بعد.</div>'}
  </div>`;
}
const chName = c => ({ whatsapp: 'واتساب', sms: 'SMS', email: 'بريد', call: 'اتصال', copy: 'نسخ' })[c] || c;
function drawTpls() {
  const el = $('#tpls'); if (!el) return;
  const list = S.tpls.filter(t => !S.cat || t.cat === S.cat || (S.cat === 'custom' && t.custom));
  el.innerHTML = list.map(t => `<div class="tp ${S.tpl === t.id ? 'on' : ''}" data-tpl="${e(t.id)}"><b>${e(t.title)}</b><small>${e((CATS.find(c => c[0] === t.cat) || ['', 'قوالبي'])[1])}${t.custom ? ' · مخصص' : ''}</small></div>`).join('') || '<p class="muted">لا قوالب في هذا التصنيف.</p>';
  const to = $('#to'); if (to) to.innerHTML = S.sel ? `إلى: <b>${e(S.sel.name)}</b> ${S.mobile ? '· ' + e(S.mobile) : ''}${S.sel.email ? ' · ' + e(S.sel.email) : ''}` : 'اختر المحامي من القائمة (أو اكتب الرسالة واختره لاحقاً)';
}
function msgMeta() { const t = $('#msg').value, m = missing(t); $('#len').textContent = t.length + ' حرفاً'; $('#miss').textContent = m.length ? 'ينقص: ' + m.join(' ') : '' }
function waNumber(p) { let d = String(p || '').replace(/[^\d+]/g, ''); if (!d) return ''; if (d.startsWith('+')) d = d.slice(1); else if (d.startsWith('00')) d = d.slice(2); if (/^(970|972)5\d{8}$/.test(d)) return d; if (/^05\d{8}$/.test(d)) return (/^05[69]/.test(d) ? '970' : '972') + d.slice(1); if (/^5\d{8}$/.test(d)) return (/^5[69]/.test(d) ? '970' : '972') + d; return '' }

/* ── الإرسال ── */
async function doSend(ch) {
  const l = S.sel, text = $('#msg').value.trim();
  if (ch === 'copy') { try { await navigator.clipboard.writeText(text) } catch { const ta = $('#msg'); ta.select(); document.execCommand('copy') } toast('نُسخت الرسالة'); }
  if (!l) return ch === 'copy' ? null : toast('اختر المحامي أولاً');
  if (l.optout) return toast('هذا المحامي طلب عدم مراسلته');
  if (l.never) return toast('لا تُرسل عروض لحالة «' + l.status + '»');
  const m = missing(text); if (m.length && ch !== 'call' && !confirm('في الرسالة حقول ناقصة: ' + m.join(' ') + '\nأترسلها كما هي؟')) return;
  const st = S.stats || {}; if (ch !== 'copy' && (st.today || 0) >= (st.limit || 40) && !confirm(`وصلت الحد اليومي (${st.limit}). الإكثار من الرسائل قد يعرّض رقمك للحظر. أتتابع؟`)) return;
  const td = new Date(), tds = td.getFullYear() + '-' + String(td.getMonth() + 1).padStart(2, '0') + '-' + String(td.getDate()).padStart(2, '0'); const prev = (l.log || []).find(x => x.at.slice(0, 10) === tds); if (prev && ch !== 'copy' && !confirm('راسلت هذا المحامي اليوم. أترسل مرة أخرى؟')) return;
  const phone = S.mobile || waNumber(l.phones[0]) || '', tel = l.phones[0] || '';
  let url = '';
  if (ch === 'whatsapp') { if (!phone) return toast('لا رقم جوال صالح لواتساب'); url = (S.settings.waMode === 'web' ? 'https://wa.me/' : 'whatsapp://send?phone=') + phone + (S.settings.waMode === 'web' ? '?text=' : '&text=') + encodeURIComponent(text) }
  if (ch === 'sms') { if (!tel) return toast('لا رقم هاتف'); url = 'sms:' + (phone ? '+' + phone : tel) + '?body=' + encodeURIComponent(text) }
  if (ch === 'email') { if (!l.email) return toast('لا بريد إلكتروني في الدليل'); const t = S.tpls.find(x => x.id === S.tpl); url = 'mailto:' + l.email + '?subject=' + encodeURIComponent('المِسْبار — ' + (t ? t.title : 'نظام إدارة مكاتب المحاماة')) + '&body=' + encodeURIComponent(text) }
  if (ch === 'call') { if (!tel) return toast('لا رقم هاتف'); url = 'tel:' + (phone ? '+' + phone : tel) }
  if (url) window.open(url, '_blank');
  if (ch === 'copy' && !confirm('سجّل هذه الرسالة كأنها أُرسلت لهذا المحامي؟')) return;
  try { const r = await api('/api/log', { body: { mno: l.mno, channel: ch, tpl: S.tpl, tone: S.tone, text } }); S.stats = r.stats; drawToday(); await pick(l.mno); toast('سُجّل التواصل'); if (S.queue && ch !== 'call') setTimeout(() => qMove(1), 600) } catch (er) { toast(er.message) }
}

/* ── الحملة ── */
async function campStart() {
  const p = new URLSearchParams({ limit: Math.min(200, Number($('#cN').value) || 40) });
  const city = $('#cCity').value, status = $('#cStatus').value, fresh = $('#cFresh').value;
  if (city) p.set('city', city); if (status) p.set('status', status); if (fresh) p.set('fresh', fresh); if ($('#cMobile').checked) p.set('mobile', '1');
  if (fresh === '3650') p.set('stage', 'none');
  const d = await api('/api/dir?' + p);
  if (!d.rows.length) return toast('لا أحد يطابق هذه الشروط');
  S.queue = { ids: d.rows.map(r => r.mno), i: 0, label: [city || 'كل المدن', status || '', fresh === '3650' ? 'لم يُراسل أبداً' : fresh ? 'لم يُراسل منذ ' + fresh + ' يوماً' : ''].filter(Boolean).join(' · ') + ` (من ${d.total})` };
  store.set('queue', S.queue); S.list = 'dir'; render(); search(); pick(S.queue.ids[0]);
}
function qMove(k) { const q = S.queue; if (!q) return; q.i = Math.max(0, Math.min(q.ids.length - 1, q.i + k)); store.set('queue', q); render(); search(); pick(q.ids[q.i]); if (k > 0 && q.i === q.ids.length - 1) toast('آخر اسم في الحملة') }

/* ── السجل ── */
async function drawHistory() {
  const [rows, st] = await Promise.all([api('/api/history?limit=300'), api('/api/stats')]); S.stats = st; drawToday();
  const sg = Object.fromEntries((st.stages || []).map(x => [x.s, x.n]));
  $('#hist').innerHTML = `<div class="kpis">${[['اليوم', st.today], ['آخر 7 أيام', st.week], ['كل الرسائل', st.total], ['محامون رُوسلوا', st.people], ['مهتمون', (sg.interested || 0) + (sg.demo || 0) + (sg.trial || 0)], ['مشتركون', sg.client || 0], ['للمتابعة اليوم', st.due], ['طلبوا عدم المراسلة', st.optout]].map(([l, n]) => `<div class="kpi"><b>${(n || 0).toLocaleString('ar')}</b>${l}</div>`).join('')}</div>
   <div class="row" style="margin-bottom:10px"><a class="btn" href="/api/export.csv" download>تصدير قائمة المتابعة (Excel/CSV)</a></div>
   <table><thead><tr><th>الوقت</th><th>المحامي</th><th>القناة</th><th>القالب</th><th>النص</th></tr></thead><tbody>${rows.map(r => `<tr><td>${e(r.at)}</td><td><a href="#" data-open="${e(r.mno)}">${e(r.name)}</a></td><td>${e(chName(r.channel))}</td><td>${e((S.tpls.find(t => t.id === r.tpl) || {}).title || r.tpl)}</td><td class="muted">${e(String(r.text).slice(0, 120))}…</td></tr>`).join('') || '<tr><td colspan="5" class="muted">لا تواصل بعد.</td></tr>'}</tbody></table>`;
}

/* ── الإعدادات ── */
function settingsView() {
  const s = S.settings, m = (S.facets || {}).meta || {};
  const f = (k, l, ph = '', type = 'text') => `<label>${l}<input class="field" data-set="${k}" type="${type}" value="${e(s[k] ?? '')}" placeholder="${e(ph)}"></label>`;
  return `<div class="panel"><h2>بيانات المرسل والعرض</h2>
    ${!s.sender ? '<p class="warn">أدخل اسمك أولاً — يظهر في التحية والتوقيع.</p>' : ''}
    <div class="form">${f('sender', 'اسم المرسل', 'مثال: سعيد …')}${f('role', 'الصفة (اختياري)', 'مثال: مسؤول المبيعات')}${f('company', 'الجهة')}${f('phone', 'هاتف التواصل', '059…')}${f('email', 'البريد')}${f('link', 'رابط (موقع أو فيديو تعريفي)', 'https://…')}
      ${f('offer', 'نص العرض الحالي {العرض}', 'مثال: شهر تجربة مجاناً')}${f('offerEnd', 'انتهاء العرض {انتهاء_العرض}', 'مثال: 30/11/2026')}${f('dailyLimit', 'الحد اليومي للرسائل', '40', 'number')}
      <label>فتح واتساب في<select class="field" data-set="waMode"><option value="app" ${s.waMode !== 'web' ? 'selected' : ''}>تطبيق واتساب على الجهاز</option><option value="web" ${s.waMode === 'web' ? 'selected' : ''}>واتساب ويب (المتصفح)</option></select></label></div>
    <label class="ck" style="margin-top:10px"><input type="checkbox" data-set="optoutLine" ${s.optoutLine ? 'checked' : ''}> أضف سطر «للإيقاف أرسل: إيقاف» إلى الرسائل</label>
    <div class="btns"><button class="btn pri" data-act="saveSet">حفظ</button></div></div>
  <div class="panel" style="margin-top:14px"><h2>دليل النقابة</h2>
    <p class="muted">النسخة الحالية: ${(m.total || 0).toLocaleString('ar')} محامياً${m.fetchedAt ? ' — جُمعت ' + e(String(m.fetchedAt).slice(0, 10)) : ''}${m.importedAt ? ' — استُوردت ' + e(m.importedAt) : ''}<br>المصدر: ${e(m.file || '')}</p>
    <div class="form"><label>مسار ملف الدليل lawyers.json (من بيانات المِسْبار)<input class="field" id="barPath" value="${e(s.bar_path || m.file || '')}" placeholder="D:\\Misbar Data\\data\\bar\\lawyers.json"></label></div>
    <div class="btns"><button class="btn" data-act="importBar">تحديث الدليل من الملف</button></div>
    <p class="muted">التحديث لا يمسّ سجل التواصل ولا المراحل ولا قائمة «لا يُراسل».</p></div>
  <div class="panel" style="margin-top:14px"><h2>القوالب</h2><div class="btns"><button class="btn" data-act="tplNew">+ قالب جديد</button><button class="btn" data-act="tplReset">استعادة نصوص القوالب الأصلية</button></div>
    <p class="muted">المتغيرات: {الاسم} {المدينة} {المكتب} {المرسل} {الصفة} {الجهة} {هاتف_المرسل} {بريد_المرسل} {الرابط} {العرض} {انتهاء_العرض} {الموعد_ب}</p></div>`;
}
function tplModal(t) {
  t = t || { id: '', cat: 'custom', title: '', formal: '', short: '' };
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="box"><h2 style="margin-top:0">${t.id ? 'تعديل قالب' : 'قالب جديد'}</h2>
    <div class="form"><label>العنوان<input class="field" id="tTitle" value="${e(t.title)}"></label><label>التصنيف<select class="field" id="tCat">${CATS.filter(c => c[0]).map(([k, l]) => `<option value="${k}" ${t.cat === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
    <label class="muted" style="display:block;margin-top:8px">الصيغة الرسمية (بعد التحية والتعريف، قبل الختام)<textarea class="field" id="tFormal" rows="7">${e(t.formal)}</textarea></label>
    <label class="muted" style="display:block;margin-top:8px">الصيغة المختصرة (واتساب)<textarea class="field" id="tShort" rows="4">${e(t.short)}</textarea></label>
    <p class="muted">المتغيرات: {الاسم} {المدينة} {المكتب} {المرسل} {الجهة} {هاتف_المرسل} {الرابط} {العرض} {انتهاء_العرض} {الموعد_ب}</p>
    <div class="btns"><button class="btn pri" id="tSave">حفظ</button>${t.id ? `<button class="btn" id="tDel">${t.custom ? 'حذف' : 'إخفاء'}</button>` : ''}<button class="btn" id="tX">إلغاء</button></div></div>`;
  document.body.appendChild(m);
  m.querySelector('#tX').onclick = () => m.remove();
  m.querySelector('#tSave').onclick = async () => { try { const r = await api('/api/templates', { body: { id: t.id || undefined, title: $('#tTitle').value, cat: $('#tCat').value, formal: $('#tFormal').value, short: $('#tShort').value } }); await reloadTpls(); S.tpl = r.id; store.set('tpl', S.tpl); m.remove(); render(); search(); toast('حُفظ القالب') } catch (er) { toast(er.message) } };
  const d = m.querySelector('#tDel'); if (d) d.onclick = async () => { if (!confirm('متأكد؟')) return; await api('/api/templates/' + encodeURIComponent(t.id), { method: 'DELETE' }); await reloadTpls(); S.tpl = 'intro'; m.remove(); render(); search() };
}

/* ── الأحداث ── */
document.addEventListener('click', async ev => {
  const b = ev.target.closest('[data-tab],[data-list],[data-mno],[data-tpl],[data-tone],[data-cat],[data-send],[data-act],[data-phone],[data-open]'); if (!b) return;
  const d = b.dataset;
  if (d.tab) { S.tab = d.tab; render(); if (S.tab === 'send') search(); return }
  if (d.list) { S.list = d.list; S.q = ''; render(); search(); return }
  if (d.mno) return pick(d.mno);
  if (d.open) { ev.preventDefault(); S.tab = 'send'; render(); search(); return pick(d.open) }
  if (d.tpl) { S.tpl = d.tpl; store.set('tpl', S.tpl); drawTpls(); return refreshText(true) }
  if (d.tone) { S.tone = d.tone; store.set('tone', S.tone); document.querySelectorAll('[data-tone]').forEach(x => x.classList.toggle('on', x.dataset.tone === S.tone)); return refreshText(true) }
  if (d.cat !== undefined && b.matches('[data-cat]')) { S.cat = d.cat; document.querySelectorAll('[data-cat]').forEach(x => x.classList.toggle('on', x.dataset.cat === S.cat)); return drawTpls() }
  if (d.phone !== undefined && b.matches('[data-phone]')) { if (d.phone) { S.mobile = d.phone; drawSel(); drawTpls() } return }
  if (d.send) return doSend(d.send);
  const a = d.act;
  if (a === 'rebuild') return refreshText(true);
  if (a === 'fav' && S.sel) { await api('/api/contact', { body: { mno: S.sel.mno, fav: !S.sel.fav } }); return pick(S.sel.mno) }
  if (a === 'tplNew') return tplModal();
  if (a === 'tplEdit') return tplModal(S.tpls.find(t => t.id === S.tpl));
  if (a === 'tplReset') { if (confirm('تُعاد نصوص القوالب الجاهزة كما كانت (قوالبك المخصصة لا تُمس).')) { await api('/api/templates/reset', { body: {} }); await reloadTpls(); toast('استُعيدت القوالب') } return }
  if (a === 'saveSet') { const body = {}; document.querySelectorAll('[data-set]').forEach(x => body[x.dataset.set] = x.type === 'checkbox' ? x.checked : x.value.trim()); S.settings = await api('/api/settings', { body }); S.stats = await api('/api/stats'); drawToday(); return toast('حُفظت الإعدادات') }
  if (a === 'importBar') { const pth = $('#barPath').value.trim(); try { await api('/api/settings', { body: { bar_path: pth } }); const r = await api('/api/import', { body: { path: pth } }); S.facets = await api('/api/facets'); toast('استُورد ' + r.total.toLocaleString('ar') + ' محامياً'); render() } catch (er) { toast(er.message) } return }
  if (a === 'campStart') return campStart();
  if (a === 'qnext') return qMove(1);
  if (a === 'qprev') return qMove(-1);
  if (a === 'qstop') { S.queue = null; store.set('queue', null); return render() }
});
document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.id === 'q') { S.q = t.value; clearTimeout(qTimer); qTimer = setTimeout(search, 220) }
  if (t.id === 'msg') { S.text = t.value; S.edited = true; msgMeta() }
});
document.addEventListener('change', async ev => {
  const t = ev.target, f = S.filters;
  if (['fCity', 'fStatus', 'fMobile', 'fFresh'].includes(t.id)) { f.city = $('#fCity').value; f.status = $('#fStatus').value; f.mobile = $('#fMobile').checked ? '1' : ''; f.fresh = $('#fFresh').checked ? '30' : ''; store.set('filters', f); return search() }
  if (S.sel && ['stage', 'nextAt', 'note', 'optout'].includes(t.id)) {
    const body = { mno: S.sel.mno }; if (t.id === 'stage') body.stage = t.value; if (t.id === 'nextAt') body.next_at = t.value; if (t.id === 'note') body.note = t.value;
    if (t.id === 'optout') { if (t.checked && !confirm('لن يظهر هذا المحامي في الحملات، ولن يُسمح بمراسلته. متابعة؟')) { t.checked = false; return } body.optout = t.checked }
    await api('/api/contact', { body }); S.stats = await api('/api/stats'); drawToday(); const keep = S.sel.mno; await search(); await pick(keep); toast('حُفظ')
  }
});
load().catch(er => { $('#main').innerHTML = '<p class="warn">تعذّر التحميل: ' + e(er.message) + '</p>' });
