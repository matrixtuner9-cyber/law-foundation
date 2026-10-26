/* ── شاشة «المراسلات» بقالب واتساب ويب: قائمة المحادثات + المحادثة، بألوان واتساب وبنيته ──
   تجمع مراسلات كل الموكلين في مكان واحد، وتعيد استخدام فقاعات الحقيبة وشريط الكتابة والتسجيل والرفع نفسه،
   فلا يتغير منطق الإرسال. يُطبَّق القالب نفسه على المراسلات داخل حقيبة الموكل وشاشة بوابة الموكل. */
(function(){
'use strict';
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const nz=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[ً-ْـ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').trim();
const B=()=>window.MQ_bag||{};
const W={q:'',f:'all',search:'',searchOn:false};
S.chatOpen=S.chatOpen||false;

/* قائمة الملاحة: «المراسلات» بعد «العملاء»، وعدّاد غير المقروء عليها */
{const i=NAV.findIndex(n=>n[0]==='clients');NAV.splice(i<0?2:i+1,0,['chats','المراسلات'])}
const unreadAll=()=>Object.values(messages).flat().filter(m=>m.unread).length;
const nc0=window.navCount;window.navCount=v=>v==='chats'?(unreadAll()||''):v==='portal'?'':nc0(v);
if(window.NAV_ICON)NAV_ICON.chats='<svg viewBox="0 0 24 24"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19.1z"/><path d="M9 10h6M9 13h4"/></svg>';

const AV=['#00a884','#53bdeb','#ff8f6b','#a682ff','#ffbc38','#25d366','#e26ab6','#06cf9c','#7f66ff','#fc9775'];
const avColor=id=>{let h=0;for(const ch of String(id))h=(h*31+ch.charCodeAt(0))>>>0;return AV[h%AV.length]};
const avatar=(c,size)=>`<span class="wa-av" style="background:${avColor(c.id)};${size?`width:${size}px;height:${size}px;font-size:${Math.round(size*.42)}px`:''}">${e((c.name||'؟').trim()[0])}</span>`;
const todayIso=()=>typeof iso==='function'?iso(TODAY):new Date().toISOString().slice(0,10);
function when(at){const d=String(at||'').slice(0,10);if(!d)return '';const t=todayIso();if(d===t)return String(at).slice(11,16);
 const y=new Date(t+'T00:00:00');y.setDate(y.getDate()-1);if(d===y.toISOString().slice(0,10))return 'أمس';
 const df=(Date.parse(t)-Date.parse(d))/864e5;if(df<7)return ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][new Date(d+'T00:00:00').getDay()];
 return d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4)}
const TICK='<svg viewBox="0 0 16 11" width="16" height="11"><path fill="currentColor" d="M11.07.65 10.4 0 4.6 5.83 2.03 3.27l-.67.66 3.24 3.25zM15.33.65 14.66 0 8.86 5.83l-.63-.63-.67.66 1.3 1.3z"/></svg>';
function preview(m){if(!m)return '<i>لا رسائل بعد — ابدأ المحادثة</i>';
 const me=m.f==='me',tick=me?`<span class="wa-tk ${m.seen?'seen':''}">${TICK}</span>`:'';
 const body=m.type==='voice'?'🎤 رسالة صوتية ('+MQ.dur(m.dur)+')':m.type==='image'?'📷 '+(m.t?e(m.t):'صورة'):m.type==='file'?'📄 '+e(m.name||'مستند'):m.type==='notice'?'🔔 '+e(m.t):e(m.t);
 return tick+body}

function rows(){const q=nz(W.q);
 return clients.map(c=>{const ms=messages[c.id]||[],last=ms[ms.length-1],un=ms.filter(m=>m.unread).length,ks=cases.filter(k=>k.client===c.id);
  return {c,last,un,ks,ms,at:last?last.at:''}})
 .filter(r=>{if(W.f==='unread'&&!r.un)return false;if(W.f==='voice'&&!r.ms.some(m=>m.type==='voice'))return false;if(W.f==='files'&&!r.ms.some(m=>m.type==='image'||m.type==='file'))return false;if(W.f==='portal'&&!r.c.portal)return false;
  if(W.f==='all'&&!r.last&&!q)return false;
  if(!q)return true;return nz([r.c.name,r.c.phone,r.c.code,...r.ks.map(k=>k.no+' '+(k.subject||'')),...r.ms.slice(-30).map(m=>m.t||m.name||'')].join(' ')).includes(q)})
 .sort((a,b)=>(b.un?1:0)-(a.un?1:0)||String(b.at).localeCompare(String(a.at))||a.c.name.localeCompare(b.c.name,'ar'))}

function listHtml(){const rs=rows();
 const chip=(v,t)=>`<button type="button" class="wa-chip ${W.f===v?'on':''}" data-act="waF" data-v="${v}">${t}</button>`;
 return `<div class="wa-lh"><h2>المراسلات</h2><span class="wa-lh-i"><button type="button" class="wa-ib" data-act="waNew" title="محادثة جديدة مع موكل">${ICO.newChat}</button></span></div>
  <div class="wa-sr"><span class="wa-sr-i">${ICO.search}</span><input type="search" id="waQ" placeholder="ابحث باسم الموكل أو رقم القضية أو نص الرسالة" value="${e(W.q)}" autocomplete="off"></div>
  <div class="wa-chips">${chip('all','الكل')}${chip('unread','غير مقروءة'+(unreadAll()?' '+unreadAll():''))}${chip('voice','صوتية')}${chip('files','مرفقات')}${chip('portal','كل موكلي البوابة')}</div>
  <div class="wa-items" role="list">${rs.length?rs.map(r=>`<button type="button" role="listitem" class="wa-it ${S.chatOpen&&S.clientId===r.c.id?'on':''} ${r.un?'un':''}" data-act="waOpen" data-v="${e(r.c.id)}">
   ${avatar(r.c)}<span class="wa-it-b"><span class="wa-it-t"><b>${e(r.c.name)}</b><time>${e(when(r.at))}</time></span>
   <span class="wa-it-m"><span class="wa-pv">${preview(r.last)}</span>${r.un?`<span class="wa-bd">${r.un}</span>`:''}</span>
   ${r.ks.length?`<span class="wa-it-k">${r.ks.slice(0,3).map(k=>`<span>⚖ ${e(k.no)}</span>`).join('')}${r.ks.length>3?`<span>+${r.ks.length-3}</span>`:''}</span>`:''}</span></button>`).join('')
   :`<div class="wa-empty-l">${W.q?'لا نتائج لـ«'+e(W.q)+'»':W.f==='all'?'لا محادثات بعد. اضغط ✎ لبدء محادثة مع موكل.':'لا محادثات في هذا التصنيف.'}</div>`}</div>`}

function headHtml(c){const ks=cases.filter(k=>k.client===c.id);
 const st=c.portal?(c.last?(typeof diff==='function'&&diff(c.last)===0?'نشط اليوم في البوابة':'آخر دخول للبوابة '+(typeof dmy==='function'?dmy(String(c.last).slice(0,10)):c.last)):'لم يدخل البوابة بعد'):'البوابة غير مفعّلة · القناة المفضلة: '+e(c.ch||'');
 return `<header class="wa-ch">
  <button type="button" class="wa-ib wa-back" data-act="waBack" title="رجوع" aria-label="رجوع إلى المحادثات">${ICO.back}</button>
  <button type="button" class="wa-ch-id" data-act="openClient" data-v="${e(c.id)}" title="فتح حقيبة الموكل">${avatar(c,40)}<span><b>${e(c.name)}</b><small>${st}</small></span></button>
  <span class="wa-ch-k">${ks.map(k=>`<button type="button" class="wa-kc" data-act="openCase" data-v="${e(k.id)}" title="${e(k.subject||'')}">⚖ ${e(k.no)}</button>`).join('')}</span>
  <span class="wa-ch-a"><button type="button" class="wa-ib ${W.searchOn?'on':''}" data-act="waSearch" title="بحث في المحادثة">${ICO.search}</button><button type="button" class="wa-ib" data-act="openClient" data-v="${e(c.id)}" title="حقيبة الموكل">${ICO.bag}</button></span>
 </header>${W.searchOn?`<div class="wa-insr"><input type="search" id="waIn" placeholder="ابحث داخل المحادثة…" value="${e(W.search)}" autocomplete="off"><small id="waInN"></small></div>`:''}`}

function chatHtml(){const c=S.chatOpen&&C(S.clientId);
 if(!c)return `<div class="wa-intro"><div class="wa-intro-ic">${ICO.chats}</div><h2>مراسلات المِسْبار</h2><p>اختر محادثة من القائمة لعرض رسائل الموكل وتسجيلاته الصوتية ومرفقاته والرد عليه.<br>يصل الرد إلى تطبيق الموكل فوراً، وتُحفظ المراسلات في ملف قضيته.</p><small>🔒 المراسلات محفوظة على خادم المكتب ولا تمر عبر واتساب.</small></div>`;
 const body=(B().bagBody?B().bagBody(c,'msgs'):'');
 return headHtml(c)+body}

/* الشاشة */
V.chats=()=>`<div class="wa-app wa-skin ${S.chatOpen&&S.clientId?'open':''}" id="waApp"><aside class="wa-list" id="waList">${listHtml()}</aside><section class="wa-chat" id="waChat">${chatHtml()}</section></div>`;

function drawList(){const l=document.getElementById('waList');if(!l)return;const q=document.getElementById('waQ'),had=q&&document.activeElement===q,pos=q?q.selectionStart:0;l.innerHTML=listHtml();if(had){const n=document.getElementById('waQ');n.focus();n.setSelectionRange(pos,pos)}}
function applyInSearch(){const th=document.getElementById('th');if(!th)return;const q=nz(W.search);let n=0;
 th.querySelectorAll('.bc').forEach(b=>{const hit=q&&nz(b.textContent).includes(q);b.classList.toggle('wa-hit',!!hit);b.classList.toggle('wa-dim',!!q&&!hit);if(hit)n++});
 const o=document.getElementById('waInN');if(o)o.textContent=q?n+' نتيجة':'';const f=th.querySelector('.wa-hit');if(f)f.scrollIntoView({block:'center'})}

A.waOpen=v=>{S.view='chats';S.clientId=v;S.chatOpen=true;S.bagTab='msgs';W.search='';W.searchOn=false;render();const t=document.getElementById('bagT');if(t&&innerWidth>900)t.focus()};
A.waBack=()=>{S.chatOpen=false;render()};
A.waF=v=>{W.f=v;drawList()};
A.waSearch=()=>{W.searchOn=!W.searchOn;W.search='';render();setTimeout(()=>{const i=document.getElementById('waIn');if(i)i.focus()},0)};
A.waNew=()=>{W.f='portal';W.q='';drawList();const q=document.getElementById('waQ');if(q){q.placeholder='اكتب اسم الموكل لبدء محادثة…';q.focus()}};
A.chats=()=>{S.view='chats';render()};
document.addEventListener('input',ev=>{if(ev.target.id==='waQ'){W.q=ev.target.value;drawList()}else if(ev.target.id==='waIn'){W.search=ev.target.value;applyInSearch()}});
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&S.view==='chats'&&W.searchOn){W.searchOn=false;W.search='';render()}});

/* رسالة جديدة أثناء فتح الشاشة: تحديث القائمة والمحادثة المفتوحة دون فقدان ما يُكتب */
window.MQ_chatMsg=m=>{drawList();if(S.chatOpen&&S.clientId===m.client){B().refreshThread&&B().refreshThread();if(m.from==='client'&&MQ.read)setTimeout(()=>{MQ.read(m.client);drawList()},1200)}};

/* «بوابة الموكل» وأيقونات الرسائل في الشريط العلوي تفتح المراسلات؛ و«مراسلة الموكل» من القضية تفتح محادثته */
const bag0=A.bag;A.bag=v=>{if(S.view==='chats'){A.waOpen(v);return}bag0(v)};
const r0=render;render=function(){r0();
 document.querySelectorAll('#topIcons [data-act="nav"][data-v="portal"]').forEach(b=>{b.dataset.v='chats';if(/الرسائل|بوابة/.test(b.title||''))b.title=b.title.includes('الجديدة')?'الرسائل الجديدة':'المراسلات'});
 const bell=document.getElementById('tbBell');if(bell){const n=unreadAll();bell.textContent=n||'';bell.hidden=!n}
 if(S.view==='chats'){const th=document.getElementById('th');if(th&&W.search)applyInSearch();document.body.classList.add('wa-on')}else document.body.classList.remove('wa-on');
 if(S.view==='portal'){const t=document.querySelector('#page .thread');if(t&&!t.dataset.wa){t.dataset.wa='1';const sec=t.closest('section');if(sec){sec.classList.add('wa-skin','wa-portal');const hd=sec.querySelector('header');if(hd&&!hd.querySelector('[data-act="waOpen"]'))hd.insertAdjacentHTML('beforeend',`<button type="button" class="btn sm wa-go" data-act="waOpen" data-v="${e(S.pc)}">فتح المحادثة كاملة</button>`)}
  if(B().thread){t.innerHTML=B().thread(S.pc);t.scrollTop=t.scrollHeight}}}
};

const ICO={search:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
 back:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
 bag:'<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/></svg>',
 newChat:'<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19.1z"/><path d="M12 8v6M9 11h6"/></svg>',
 chats:'<svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19.1z"/><path d="M9 10h6M9 13h4"/></svg>'};

const css=document.createElement('style');css.textContent=`
/* ألوان واتساب (فاتح) — والوضع الليلي */
:root{--wa-green:#00a884;--wa-badge:#25d366;--wa-me:#d9fdd3;--wa-them:#ffffff;--wa-ink:#111b21;--wa-meta:#667781;--wa-bg:#efeae2;--wa-panel:#ffffff;--wa-head:#f0f2f5;--wa-hover:#f5f6f6;--wa-on:#f0f2f5;--wa-line:#e9edef;--wa-seen:#53bdeb;--wa-icon:#54656f;--wa-chip:#f0f2f5;--wa-chip-on:#e7fce3;--wa-chip-on-ink:#008069}
html.night{--wa-me:#005c4b;--wa-them:#202c33;--wa-ink:#e9edef;--wa-meta:#8696a0;--wa-bg:#0b141a;--wa-panel:#111b21;--wa-head:#202c33;--wa-hover:#202c33;--wa-on:#2a3942;--wa-line:#222d34;--wa-icon:#aebac1;--wa-chip:#202c33;--wa-chip-on:#0a332c;--wa-chip-on-ink:#00a884}
.wa-app{display:grid;grid-template-columns:minmax(300px,30%) 1fr;height:calc(100vh - 150px);min-height:520px;border:1px solid var(--wa-line);border-radius:12px;overflow:hidden;background:var(--wa-panel);color:var(--wa-ink);box-shadow:0 6px 18px rgba(11,20,26,.08);font-size:14.5px}
.wa-app button{font:inherit;color:inherit}
.wa-list{display:flex;flex-direction:column;min-height:0;background:var(--wa-panel);border-inline-end:1px solid var(--wa-line)}
.wa-lh{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 8px}.wa-lh h2{margin:0;font-size:22px;font-weight:700;color:var(--wa-ink)}
.wa-ib{background:transparent;border:0;border-radius:50%;width:40px;height:40px;display:inline-grid;place-items:center;color:var(--wa-icon);cursor:pointer}.wa-ib:hover,.wa-ib.on{background:color-mix(in srgb,var(--wa-ink) 9%,transparent)}
.wa-sr{margin:0 12px 6px;display:flex;align-items:center;gap:10px;background:var(--wa-head);border-radius:8px;padding:0 12px;color:var(--wa-meta)}
.wa-sr input{flex:1;min-width:0;border:0;background:transparent;padding:9px 0;color:var(--wa-ink);font:inherit;outline:0}
.wa-chips{display:flex;gap:8px;padding:4px 12px 10px;overflow-x:auto;scrollbar-width:none}
.wa-chip{border:0;background:var(--wa-chip);color:var(--wa-meta)!important;padding:6px 12px;border-radius:999px;white-space:nowrap;cursor:pointer;font-size:13.5px}
.wa-chip.on{background:var(--wa-chip-on);color:var(--wa-chip-on-ink)!important;font-weight:600}
.wa-items{flex:1;overflow-y:auto;min-height:0}
.wa-it{display:flex;align-items:center;gap:12px;width:100%;text-align:start;border:0;background:transparent;padding:0 12px 0 0;cursor:pointer}
.wa-it:hover{background:var(--wa-hover)}.wa-it.on{background:var(--wa-on)}
.wa-av{flex:none;width:49px;height:49px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:700;font-size:20px}
.wa-it .wa-av{margin-block:8px}
.wa-it-b{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;border-bottom:1px solid var(--wa-line);padding:11px 0 11px 14px}
.wa-it-t{display:flex;justify-content:space-between;gap:8px;align-items:baseline}.wa-it-t b{font-weight:500;font-size:16px;color:var(--wa-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wa-it-t time{font-size:12px;color:var(--wa-meta);flex:none}.wa-it.un .wa-it-t time{color:var(--wa-badge);font-weight:600}
.wa-it-m{display:flex;justify-content:space-between;gap:8px;align-items:center}
.wa-pv{color:var(--wa-meta);font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:3px}.wa-pv i{font-style:normal;opacity:.8}
.wa-it.un .wa-pv{color:var(--wa-ink)}
.wa-tk{color:var(--wa-meta);display:inline-flex;flex:none}.wa-tk.seen{color:var(--wa-seen)}
.wa-bd{flex:none;background:var(--wa-badge);color:#fff;font-size:12px;font-weight:700;min-width:20px;height:20px;padding:0 6px;border-radius:999px;display:grid;place-items:center}
.wa-it-k{display:flex;gap:6px;flex-wrap:wrap}.wa-it-k span{font-size:11.5px;color:var(--wa-meta);background:var(--wa-head);border-radius:6px;padding:1px 6px;font-family:ui-monospace,monospace}
.wa-empty-l{padding:30px 20px;text-align:center;color:var(--wa-meta)}
.wa-chat{display:flex;flex-direction:column;min-height:0;min-width:0;background:var(--wa-bg)}
.wa-ch{display:flex;align-items:center;gap:10px;background:var(--wa-head);padding:8px 16px;min-height:60px;border-inline-start:1px solid var(--wa-line)}
.wa-ch-id{display:flex;align-items:center;gap:12px;border:0;background:transparent;cursor:pointer;min-width:0;text-align:start;padding:0}
.wa-ch-id>span{display:flex;flex-direction:column;min-width:0}.wa-ch-id b{font-weight:500;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.wa-ch-id small{color:var(--wa-meta);font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wa-ch-k{display:flex;gap:6px;flex-wrap:wrap;margin-inline-start:auto;justify-content:flex-end}
.wa-kc{border:1px solid var(--wa-line);background:var(--wa-panel);border-radius:999px;padding:3px 10px;font-size:12px;cursor:pointer;font-family:ui-monospace,monospace}.wa-kc:hover{border-color:var(--wa-green);color:var(--wa-green)!important}
.wa-ch-a{display:flex;gap:2px}
.wa-back{display:none}
.wa-insr{display:flex;align-items:center;gap:10px;background:var(--wa-head);padding:6px 16px;border-top:1px solid var(--wa-line)}.wa-insr input{flex:1;border:0;border-radius:8px;padding:8px 12px;background:var(--wa-panel);color:var(--wa-ink);font:inherit;outline:0}.wa-insr small{color:var(--wa-meta)}
.wa-chat>.panel.chat{flex:1;display:flex;flex-direction:column;min-height:0;margin:0;border:0;border-radius:0;box-shadow:none}
.wa-chat .th{flex:1;min-height:0;max-height:none!important;overflow-y:auto}
.wa-chat .chat-note{margin:0;font-size:12px}
.wa-skin .bc.wa-hit{outline:2px solid #ffd279;outline-offset:1px}.wa-skin .bc.wa-dim{opacity:.35}
.wa-intro{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px;padding:30px;background:var(--wa-head);border-bottom:6px solid var(--wa-green);color:var(--wa-meta)}
.wa-intro-ic{color:var(--wa-green);opacity:.85}.wa-intro h2{margin:0;font-size:28px;font-weight:300;color:var(--wa-ink)}.wa-intro p{margin:0;line-height:1.8;max-width:460px}.wa-intro small{margin-top:16px}
/* المحادثة نفسها (هنا وفي الحقيبة وشاشة البوابة) */
.wa-skin .th{background-color:var(--wa-bg)!important}
.wa-skin .bc{background:var(--wa-them)!important;color:var(--wa-ink)!important;border:0!important;box-shadow:0 1px .5px rgba(11,20,26,.13)!important}
.wa-skin .bc.me{background:var(--wa-me)!important}
.wa-skin .bc.t-notice{background:#fff5c4!important;color:#54460c!important}html.night .wa-skin .bc.t-notice{background:#3b3416!important;color:#f4e6a3!important}
.wa-skin .bc.me:not(.bc.me+.bc.me)::before{background:var(--wa-me)}.wa-skin .bc.them:not(.bc.them+.bc.them)::before{background:var(--wa-them)}
.wa-skin .bc-read{border-color:color-mix(in srgb,var(--wa-ink) 12%,transparent)!important}
.wa-skin .composer{background:var(--wa-head)!important;border:0!important}
.wa-skin .composer textarea{background:var(--wa-panel)!important;color:var(--wa-ink)!important;border:0!important;border-radius:8px!important;box-shadow:none!important}
.wa-skin .composer .ib{border:0!important;box-shadow:none!important;background:transparent;color:var(--wa-icon);border-radius:50%}
.wa-skin .composer .ib.pri,.wa-skin .composer [data-act="recStart"]{background:var(--wa-green)!important;color:#fff!important;border-radius:50%}
.wa-skin .chat-note{background:var(--wa-head)!important;color:var(--wa-meta)!important}
.wa-skin .th-day span{background:var(--wa-them)!important;color:var(--wa-meta)!important;border:0!important;box-shadow:0 1px .5px rgba(11,20,26,.13)}
.wa-skin .bc-case{background:color-mix(in srgb,var(--wa-ink) 7%,transparent)!important;border-color:transparent!important}
.wa-portal .thread{padding:12px;border-radius:8px;background:var(--wa-bg);display:flex;flex-direction:column;gap:2px}.wa-portal .thread .bc{align-self:flex-start}.wa-portal .thread .bc.me{align-self:flex-end}.wa-go{margin-inline-start:8px;background:var(--wa-green)!important;color:#fff!important;border-color:var(--wa-green)!important}
.wa-portal .thread .bc{margin-bottom:4px}
/* الهاتف: القائمة أولاً، والمحادثة بملء الشاشة عند فتحها */
@media (max-width:900px){
 .wa-app{grid-template-columns:1fr;height:calc(100vh - 120px);height:calc(100dvh - 120px);border-radius:10px}
 .wa-app .wa-chat{display:none}.wa-app.open .wa-list{display:none}.wa-app.open .wa-chat{display:flex}
 .wa-back{display:inline-grid}.wa-ch{padding:6px 6px;gap:4px}.wa-ch-k{display:none}
 .wa-app .wa-av{width:44px;height:44px}
}`;document.head.appendChild(css);
})();
