/* ── مِسْبار | Misbar AI: عقل التحليل والاستنباط القانوني ──
   صفحة مستقلة داخل المِسْبار: البحث في التشريعات والقرارات (فلسطين أساس، الأردن ومصر للمقارنة والاستئناس)، قارئ المصادر،
   وأدوات التحليل واستقصاء الثغرات وإعداد الخطط عبر «مِسْبار» الذي يستشهد من القاعدة نفسها.
   القاعدة محلية للقراءة فقط (/api/admin/misbar/*) وتعمل دون إنترنت. لا يُعتمد أي استنتاج قبل مراجعة المحامي.
   تحل محل: «التشريعات الفلسطينية» و«البحث في الأحكام» و«مصادر الأحكام» (تشريعات المكتب المدخلة يدوياً تبقى من داخل المسبار). */
(function(){
'use strict';
if(typeof V==='undefined'||typeof NAV==='undefined')return;
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const can2=w=>!!(window.MQ&&MQ.user&&({admin:{write:1,manage:1},lawyer:{write:1}}[MQ.user.role]||{})[w]);
const SRC=[['','كل المصادر — كل الدول'],['PS_JUDGMENT','فلسطين · أحكام'],['PS_LEGISLATION','فلسطين · تشريعات'],['JO_LEGISLATION','الأردن · تشريعات'],['JO_CASSATION','الأردن · تمييز'],['EG_LEGISLATION','مصر · تشريعات'],['EG_CASSATION','مصر · نقض']];
const COURTS=['','محكمة النقض','محكمة استئناف رام الله','محكمة استئناف القدس','محكمة العدل العليا','المحكمة الدستورية العليا','محكمة جرائم الفساد','محكمة التمييز الأردنية'];
const STATUS=[['','كل الحالات'],['in_force','ساري'],['partial','ساري في الضفة الغربية فقط'],['suspended','موقوف النفاذ'],['repealed','ملغى / غير ساري']];
/* أدوات المحامي: كل أداة تفتح «مِسْبار» بالنمط المناسب، ومراجعه من قاعدة المسبار */
const TOOLS=[
 ['draft','🎙','صياغة اللوائح بالصوت','أملِ الوقائع والطلبات فيصوغ اللائحة مستشهداً من القاعدة'],
 ['question','◇','السؤال القانوني','جواب موثّق بالمراجع، أو «لم أجد» صراحة'],
 ['gaps','⌕','تحليل المستند واستقصاء الثغرات','الثغرات والدفوع والبينات الناقصة وخطة الاستقصاء'],
 ['appeal','⚖','أسباب الطعن','أسباب الطعن المحتملة والمهل الواجب التحقق منها'],
 ['defences','⛨','الدفوع الشكلية والمهل','الاختصاص والتقادم والتبليغ وسبق الفصل'],
 ['similar','≋','أحكام مشابهة','الأقرب إلى وقائع القضية من الأحكام المنشورة'],
 ['contract','▣','مراجعة عقد','البنود المجحفة والغموض والحقوق والالتزامات'],
 ['opponent','⇆','تحليل مستند الخصم','ما يريد إثباته وكيف يُرد عليه'],
 ['brief','◷','ملخص وخطة قبل الجلسة','أين وصلت الدعوى والمطلوب والنواقص'],
 ['translate','⇄','الترجمة القانونية','ترجمة دقيقة تحفظ الترقيم والمصطلحات'],
 ['minutes','◉','محضر اجتماع','القرارات والمسؤوليات والمواعيد']];
const LAB={task:'search',provider:'',q:'',facts:'',doc:'',docName:'',lang:'en',consent:false,busy:false,res:null,err:'',ai:null,src:''};
/* مهام مختبر التحليل (المراجع من القاعدة فقط) */
/* علامة الميزان المميزة: تُستعمل حيثما ذُكر مِسْبار */
const MK='<img src="misbar-emblem.webp" alt="" class="mb-mk" width="20" height="19">';
const LABT=[['search',MK,'عقل مِسْبار','اسأل بلغتك فيبحث بالمصطلحات القانونية ويجيب من القاعدة بالمراجع'],['legal_question','◇','السؤال القانوني','النصوص المنطبقة والمبادئ والثغرات وما يلزم إثباته'],['gaps','⌕','الثغرات والدفوع','استقصاء الثغرات والدفوع وخطة قابلة للتنفيذ'],['document','▤','تحليل المستند','الالتزامات والتناقضات والعيوب والنصوص ذات الصلة'],['appeal','⚖','أسباب الطعن','أسباب الطعن المحتملة في الحكم والمهل الواجب التحقق منها'],['contract','▣','مراجعة عقد','المخاطر والشروط المجحفة والغموض والتوصيات'],['hearing','◷','ملخص قبل الجلسة','الوقائع والطلبات والبينات والأسئلة المتوقعة'],['minutes','◉','محضر اجتماع','القرارات والمسؤوليات والمواعيد من التفريغ النصي'],['translate','⇄','الترجمة القانونية','ترجمة دقيقة تحفظ الترقيم والمصطلحات']];
const MB={view:'search',kind:'',number:'',ltype:'',date_from:'',date_to:'',country:'',q:'',src:'',year_from:'',year_to:'',court:'',case_no:'',status:'',has_text:'',sort:'relevance',page:1,data:null,busy:false,err:'',open:null,doc:null,docBusy:false,fs:17,stats:null,statsErr:''};
try{const f=Number(localStorage.getItem('mq_mb_fs'));if(f>=14&&f<=24)MB.fs=f}catch(x){}

/* ── القائمة: المسبار بدل الشاشات القديمة ── */
for(const v of ['laws','maqamsearch','sources']){const i=NAV.findIndex(n=>n[0]===v);if(i>=0)NAV.splice(i,1)}
{const i=NAV.findIndex(n=>n[0]==='dash');NAV.splice(i+1,0,['misbar','عقل القانون'])}
window.MQ_misbarMark=MK;
if(window.NAV_ICON)NAV_ICON.misbar='<svg viewBox="0 0 24 24" class="mb-navmk"><image href="misbar-emblem.webp" x="0" y="0" width="24" height="24" preserveAspectRatio="xMidYMid meet"/></svg>';
const nc0=window.navCount;if(typeof nc0==='function')window.navCount=v=>v==='misbar'?'':nc0(v);

async function call(path,p){
 const r=await fetch('/api/admin/misbar/'+path+'?'+new URLSearchParams(p).toString(),{credentials:'same-origin'});
 if(r.status===401){location.replace('/login.html');throw new Error('انتهت الجلسة')}
 const j=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(j.error||'تعذّر الاتصال بخادم المكتب'),{code:j.code});return j;
}
function params(page){const p={page:String(page||1),sort:MB.sort};if(MB.country)p.country=MB.country;if(kindOf())p.kind=kindOf();
 const k=kindOf(),keys=['q','src','has_text',...(k==='law'?['number','ltype','status','year_from','year_to']:k==='ruling'?['court','case_no','ltype','date_from','date_to']:['year_from','year_to'])];
 for(const x of keys)if(String(MB[x]||'').trim())p[x]=String(MB[x]).trim();return p}
const hasQuery=()=>['q','kind','number','ltype','date_from','date_to','country','src','year_from','year_to','court','case_no','status'].some(k=>String(MB[k]||'').trim());
async function run(page){
 readForm();if(!hasQuery()){toast('اكتب عبارة البحث أو اختر مصدراً أو رقم قضية');return}
 if(MB.busy)return;MB.busy=true;MB.err='';MB.page=page||1;paint();
 try{MB.data=await call('search',params(MB.page))}catch(x){MB.err=x.message;MB.data=null}
 MB.busy=false;paint();
 const r=document.getElementById('mbRes');if(r&&page>1)r.scrollIntoView({block:'start',behavior:'smooth'});
}
async function loadStats(){if(MB.stats||MB.statsErr)return;try{MB.stats=await call('stats',{})}catch(x){MB.statsErr=x.code==='NO_INDEX'?'قاعدة المسبار غير مثبتة على هذا الخادم بعد. يثبّتها الدعم الفني.':x.message}if(S.view==='misbar'){paintHead();const f=document.getElementById('mbForm');if(f&&MB.stats){readForm();const t=document.createElement('div');t.innerHTML=form();f.replaceWith(t.firstElementChild)}}}

/* ── العرض ── */
/* أعلام الدول (SVG لأن أعلام الرموز التعبيرية لا تظهر في ويندوز) */
const FLAG={
 PS:'<svg viewBox="0 0 30 20" class="fl"><rect width="30" height="6.67" fill="#111"/><rect y="6.67" width="30" height="6.67" fill="#fff"/><rect y="13.33" width="30" height="6.67" fill="#149954"/><path d="M0 0L11 10L0 20Z" fill="#E4312B"/></svg>',
 JO:'<svg viewBox="0 0 30 20" class="fl"><rect width="30" height="6.67" fill="#111"/><rect y="6.67" width="30" height="6.67" fill="#fff"/><rect y="13.33" width="30" height="6.67" fill="#007A3D"/><path d="M0 0L15 10L0 20Z" fill="#CE1126"/><path d="M4.6 8.2l.5 1.2 1.2-.4-.6 1.1 1.1.6-1.2.2.1 1.3-.9-.9-.9.9.1-1.3-1.2-.2 1.1-.6-.6-1.1 1.2.4z" fill="#fff"/></svg>',
 EG:'<svg viewBox="0 0 30 20" class="fl"><rect width="30" height="6.67" fill="#CE1126"/><rect y="6.67" width="30" height="6.67" fill="#fff"/><rect y="13.33" width="30" height="6.67" fill="#111"/><path d="M15 7.6c-1 0-1.6.7-1.6 1.6v2.3l1.6 1 1.6-1V9.2c0-.9-.6-1.6-1.6-1.6z" fill="#C09300"/></svg>'};
const fmtN=n=>Number(n||0).toLocaleString('en-US');
const badge=r=>`<span class="mb-src ${r.primary?'ps':'cmp'}">${e(r.source)}</span>`;
function statusPill(r){if(!r.status_code&&!r.status)return '';const c=r.status_code==='in_force'||r.status_code==='partial'?'ok':r.status_code==='suspended'?'warn':r.status_code==='repealed'?'bad':'';return `<span class="mb-st ${c}">${e(r.status||'')}</span>`}
const cleanT=t=>String(t||'').replace(/\s*[-–|]\s*(ويكي\s*مصدر|Lawyer Egypt.*|منشورات قانونية)\s*$/,'');
const hl=(t,q)=>{let h=e(t);const ws=String(q||'').replace(/["()]/g,' ').split(/\s+/).filter(w=>w.length>2).slice(0,6);
 for(const w of ws){const core=w.replace(/^(?:وال|بال|كال|فال|لل|ال)/,'');if(core.length<2)continue;
  const rx=core.split('').map(c=>({'ا':'[اأإآ]','أ':'[اأإآ]','إ':'[اأإآ]','آ':'[اأإآ]','ي':'[يى]','ى':'[يى]','ه':'[هة]','ة':'[هة]'}[c]||c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))).join('[\\u064B-\\u0652\\u0640]*');
  try{h=h.replace(new RegExp('('+rx+')','g'),'<mark>$1</mark>')}catch(x){}}return h};
function head(){
 const st=MB.stats;
 return `<header class="mb-top"><div class="mb-hero" role="img" aria-label="مِسْبار | Misbar AI: عقل التحليل والاستنباط القانوني"><button type="button" class="mb-x" data-act="mbClose" aria-label="العودة إلى الرئيسية">✕ العودة إلى الرئيسية</button><canvas class="mb-fx" aria-hidden="true"></canvas><b class="mb-sub">مِسْبارُ القانونِ التحليليّ</b></div>
  <div class="mb-stats" id="mbStats">${st?[['PS','فلسطين','مرجع أساسي'],['JO','الأردن','للمقارنة والاستئناس'],['EG','مصر','للمقارنة والاستئناس']].map(([c,n,t])=>{const ss=st.sources.filter(x=>x.src.startsWith(c+'_'));return `<button class="mb-flag ${MB.country===c?'on':''}" data-act="mbCountry" data-v="${c}" title="${n} — ${t}: ${ss.map(x=>x.label.split(' · ')[1]+' '+fmtN(x.n)).join('، ')}">${FLAG[c]}<span>${n}</span></button>`}).join(''):MB.statsErr?`<span class="mb-warn">${e(MB.statsErr)}</span>`:'<span class="m">…</span>'}</div></header>`}
function side(){
 const it=(v,ic,t,act='mbView')=>`<button class="${MB.view===v?'on':''}" data-act="${act}" data-v="${v}"><i>${ic}</i>${t}</button>`;
 return `<aside class="mb-side" aria-label="أقسام المسبار"><div class="mb-brand"><img src="misbar-emblem.webp" alt="" width="96" height="91"><b>مِسْبار</b><small>Misbar AI · عقل التحليل والاستنباط القانوني</small></div>
  <div class="g">الاستقصاء القضائي</div>${it('search','⌕','البحث في التشريعات والقرارات')}${it('tools','✦','التحليل واستخلاص النتائج')}${it('local','⛁','المسبار المحلي · دون إنترنت')}
  <div class="g">مختبر التحليل</div>${LABT.map(([m,ic,t])=>`<button class="${MB.view==='tools'&&LAB.task===m?'on':''}" data-act="mbLab" data-v="${m}"><i>${ic}</i>${t}</button>`).join('')}
  <div class="g">أدوات القضية</div>${TOOLS.filter(([m])=>['draft','defences','similar','opponent','brief'].includes(m)).map(([m,ic,t])=>`<button data-act="mbTool" data-v="${m}"><i>${ic}</i>${t}</button>`).join('')}
  <div class="g">مراجع المكتب</div><button data-act="nav" data-v="rulings"><i>§</i>الاجتهادات القضائية</button><button data-act="nav" data-v="laws"><i>✎</i>تشريعات المكتب</button><button data-act="nav" data-v="legalShelf"><i>❏</i>مكتبتي القانونية</button>
  <div class="mb-note">المراجع الفلسطينية أساسية؛ الأردنية والمصرية للمقارنة والاستئناس. لا يُعتمد أي استنتاج قبل مراجعة المحامي.</div></aside>`}
/* نوع المرجع يحدد الفلاتر: التشريع (رقمه، نوعه، حالة سريانه، سنته) والحكم (المحكمة، رقم القضية، نوع الدعوى، تاريخ القرار) */
const kindOf=()=>MB.kind||(MB.src?(/JUDGMENT|CASSATION/.test(MB.src)?'ruling':'law'):'');
function srcOpts(){return SRC.filter(([v])=>!v||((true)&&(!MB.kind||(MB.kind==='ruling')===/JUDGMENT|CASSATION/.test(v))))}
function form(){
 const opt=(arr,v)=>arr.map(([k,t])=>`<option value="${k}" ${v===k?'selected':''}>${t}</option>`).join('');
 const st=MB.stats||{},k=kindOf(),c=MB.country;
 const vals=(arr,cur,all)=>`<option value="">${all}</option>`+(arr||[]).filter(x=>!c||x.country===c).reduce((a,x)=>{if(!a.some(y=>y.v===x.v))a.push(x);return a},[]).slice(0,40).map(x=>`<option value="${e(x.v)}" ${cur===x.v?'selected':''}>${e(x.v)}</option>`).join('');
 const courts=(st.courts&&st.courts.length?vals(st.courts,MB.court,'جميع المحاكم'):COURTS.map(x=>`<option value="${e(x)}" ${MB.court===x?'selected':''}>${x||'جميع المحاكم'}</option>`).join(''));
 const common=`<label>الدولة والمصدر<select class="field" id="mbSrcSel">${opt(srcOpts(),MB.src)}</select></label>`;
 const lawF=`<label>رقم التشريع<input class="field mono" id="mbNum" value="${e(MB.number)}" inputmode="numeric" maxlength="6" placeholder="مثال: 7"></label>
   <label>نوع التشريع<select class="field" id="mbLtype">${vals(st.lawTypes,MB.ltype,'جميع الأنواع')}</select></label>
   <label>حالة السريان<select class="field" id="mbStatus">${opt(STATUS,MB.status)}</select></label>
   <label>سنة الإصدار من<input class="field mono" id="mbY1" value="${e(MB.year_from)}" inputmode="numeric" maxlength="4" placeholder="1950"></label>
   <label>حتى سنة<input class="field mono" id="mbY2" value="${e(MB.year_to)}" inputmode="numeric" maxlength="4" placeholder="${new Date().getFullYear()}"></label>`;
 const rulF=`<label>المحكمة<select class="field" id="mbCourt">${courts}</select></label>
   <label>رقم القضية / الطعن<input class="field mono" id="mbCase" value="${e(MB.case_no)}" placeholder="690/2023" maxlength="12"></label>
   <label>نوع الدعوى<select class="field" id="mbLtype">${vals(st.caseTypes,MB.ltype,'جميع الأنواع')}</select></label>
   <label>تاريخ القرار من<input class="field mono" type="date" id="mbD1" value="${e(MB.date_from)}"></label>
   <label>إلى<input class="field mono" type="date" id="mbD2" value="${e(MB.date_to)}"></label>`;
 const allF=`<label>من سنة<input class="field mono" id="mbY1" value="${e(MB.year_from)}" inputmode="numeric" maxlength="4" placeholder="1950"></label>
   <label>حتى سنة<input class="field mono" id="mbY2" value="${e(MB.year_to)}" inputmode="numeric" maxlength="4" placeholder="${new Date().getFullYear()}"></label>`;
 return `<form class="mb-form" id="mbForm" autocomplete="off">
  <div class="mb-qrow"><input class="field mb-q" id="mbQ" value="${e(MB.q)}" placeholder="${k==='ruling'?'ابحث في الأحكام: موضوع النزاع، مبدأ، عبارة من التسبيب…':k==='law'?'ابحث في التشريعات: اسم القانون، موضوعه، أو نص مادة…':'ابحث بالكلمات أو بعبارة بين علامتي تنصيص: “عدم كفاية الرصيد”، إخلاء المأجور…'}" maxlength="300" aria-label="عبارة البحث">
   <button class="btn mb-go" id="mbGo" ${MB.busy?'disabled':''}>⌕ بحث قانوني</button><button type="button" class="btn mb-smart" data-act="mbSmart" title="اسأل بلغتك فيبحث بالمصطلحات القانونية ويجيب من القاعدة">${MK} عقل مِسْبار</button></div>
  <div class="mb-kind" role="tablist" aria-label="نوع المرجع">${[['','الكل','⌕'],['law','التشريعات والقوانين','§'],['ruling','الأحكام والقرارات القضائية','⚖']].map(([v,t,i])=>`<button type="button" role="tab" aria-selected="${k===v}" class="${k===v?'on':''}" data-act="mbKind" data-v="${v}"><i>${i}</i>${t}</button>`).join('')}</div>
  <div class="mb-f">${common}${k==='law'?lawF:k==='ruling'?rulF:allF}
   <label>توافر النص<select class="field" id="mbText"><option value="">جميع النتائج</option><option value="1" ${MB.has_text==='1'?'selected':''}>النصوص المتاحة فقط</option></select></label>
   <label>الترتيب<select class="field" id="mbSort"><option value="relevance" ${MB.sort==='relevance'?'selected':''}>الأقرب للبحث</option><option value="year_desc" ${MB.sort==='year_desc'?'selected':''}>الأحدث</option><option value="year_asc" ${MB.sort==='year_asc'?'selected':''}>الأقدم</option></select></label>
   <button type="button" class="btn sm mb-clear" data-act="mbClear">مسح</button>
  </div></form>`}
function results(){
 if(MB.busy)return `<div class="mb-empty">جارٍ البحث…</div>`;
 if(MB.err)return `<div class="mb-empty bad">${e(MB.err)}</div>`;
 const d=MB.data;if(!d)return `<div class="mb-empty"><b>أدخل عبارة بحث أو رقماً وسنة.</b><span>تظهر هنا الأحكام والتشريعات مع بياناتها، ويُعرض المستند الذي تختاره في القارئ بجانبها.</span></div>`;
 if(!d.total)return `<div class="mb-empty"><b>لا نتائج.</b><span>جرّب كلمات أقل أو أعم، أو أزل بعض الفلاتر.</span></div>`;
 const f=d.facets&&d.facets.src?`<div class="mb-fc">${Object.entries(d.facets.src).map(([k,n])=>`<button class="mb-chip sm ${MB.src===k?'on':''}" data-act="mbSrc" data-v="${k}">${e((SRC.find(s=>s[0]===k)||[,k])[1])} <b>${fmtN(n)}</b></button>`).join('')}</div>`:'';
 return `<div class="mb-rh"><b>نتائج البحث</b><span class="m">النتائج: ${fmtN(d.total)} — صفحة ${d.page} من ${fmtN(d.pages)}</span></div>${f}
  <ol class="mb-list">${d.results.map(r=>`<li class="${MB.open===r.id?'on':''}"><button class="mb-it" data-act="mbOpen" data-v="${r.id}">
   <div class="mb-tags">${badge(r)}${statusPill(r)}${r.has_text?'':'<span class="mb-st">النص غير متوفر</span>'}</div>
   <b class="mb-t">${hl(cleanT(r.title),MB.q)}</b>
   <div class="mb-meta">${[r.court,r.case_no&&('رقم '+r.case_no),r.date||r.year,r.ltype].filter(Boolean).map(e).join(' · ')}</div>
   ${r.excerpt?`<p class="mb-x">${hl(r.excerpt,MB.q)}</p>`:''}</button></li>`).join('')}</ol>
  ${d.pages>1?`<div class="mb-pg">${d.page>1?`<button class="btn sm" data-act="mbPage" data-v="${d.page-1}">→ السابق</button>`:''}<span class="m">${d.page} / ${fmtN(d.pages)}</span>${d.page<d.pages?`<button class="btn sm" data-act="mbPage" data-v="${d.page+1}">التالي ←</button>`:''}</div>`:''}`}
/* النص بفقرات، وعناوين المواد بارزة */
function bodyHtml(t,q){const parts=String(t||'').split(/\n+/).map(s=>s.trim()).filter(Boolean);
 /* زر «🔗 ربط» بجانب كل مادة: يربطها بقضية أو أكثر (case-refs.js) */
 const R=window.MQREFS,d=MB.doc,can=R&&d&&d.kind==='law'&&(typeof window.MQ_can!=='function'||window.MQ_can('cases'));
 const linked=n=>{try{return (typeof cases!=='undefined'?cases:[]).filter(k=>(Array.isArray(k.lawRefs)?k.lawRefs:[]).some(r=>String(r.docId)===String(d.id)&&r.art===n)).length}catch(_){return 0}};
 return parts.map(p=>{if(/^(?:المادة|مادة|الماده)\s*[(\d٠-٩]/.test(p)&&p.length<90){let extra='';if(can){const a=R.splitArticles(p)[0];if(a){const n=linked(a.n);extra=`<button type="button" class="cr-art" data-act="crLinkArt" data-v="${d.id}|${e(a.n)}" title="ربط ${e(a.label)} بقضية">🔗 ربط</button>${n?`<span class="cr-on">✓ مربوطة بـ ${n}</span>`:''}`}}return `<h4>${hl(p,q)}${extra}</h4>`}return `<p>${hl(p,q)}</p>`}).join('')}
function reader(){
 const d=MB.doc;
 if(MB.docBusy)return `<div class="mb-empty">جارٍ فتح المستند…</div>`;
 if(!d)return `<div class="mb-empty"><b>قارئ المصادر داخل التطبيق</b><span>اختر مستنداً من نتائج البحث لعرضه هنا.</span></div>`;
 const m=d.meta||{};
 return `<div class="mb-doc-h"><div class="mb-tags">${badge(d)}${statusPill(d)}</div><h2>${e(cleanT(d.title))}</h2>
  <div class="mb-meta">${[d.court,d.case_no&&('رقم '+d.case_no),d.date||d.year,d.ltype,d.subject].filter(Boolean).map(e).join(' · ')}</div>
  ${d.primary?'':`<div class="mb-cmp">مرجع ${d.country==='JO'?'أردني':'مصري'} للمقارنة والاستئناس، وليس ملزماً أمام المحاكم الفلسطينية.${m.note?' '+e(m.note):''}</div>`}
  ${d.body?`<div class="mb-find" role="search"><span class="mb-find-i" aria-hidden="true">⌕</span><input id="mbFind" type="search" placeholder="ابحث في نص ${d.kind==='law'?'التشريع':'الحكم'}… (Enter للتالي)" aria-label="البحث في النص" autocomplete="off"><span class="mb-find-n" id="mbFindN"></span><button type="button" class="btn sm" data-act="mbFindStep" data-v="-1" aria-label="السابق">▲</button><button type="button" class="btn sm" data-act="mbFindStep" data-v="1" aria-label="التالي">▼</button></div>`:''}
  <div class="mb-tools"><button class="btn sm" data-act="mbFs" data-v="-1">A−</button><button class="btn sm" data-act="mbFs" data-v="0">افتراضي</button><button class="btn sm" data-act="mbFs" data-v="1">A+</button>
   <button class="btn sm" data-act="mbCopy">نسخ</button><button class="btn sm" data-act="mbPrint">طباعة A4</button>
   ${d.kind==='ruling'&&can2('write')?'<button class="btn sm" data-act="mbSaveRuling">حفظ في الاجتهادات</button>':''}
   ${window.MQREFS&&(typeof window.MQ_can!=='function'||window.MQ_can('cases'))?`<button class="btn sm pri" data-act="crLinkDoc" data-v="${d.id}" title="ربط ${d.kind==='law'?'التشريع كاملاً':'الحكم'} بقضية أو أكثر؛ ولربط مادة بعينها اضغط «🔗 ربط» بجانبها، أو ظلّل فقرة">🔗 ربط بقضية</button>`:''}
   ${d.kind==='ruling'&&d.body?`<button class="btn sm" data-act="mbLocDissect" data-v="${d.id}" title="تقسيم الحكم إلى أطرافه وأسبابه ومنطوقه والمواد التي استند إليها، على الجهاز دون إنترنت">⛁ تشريح دون إنترنت</button>`:''}
   ${d.kind==='ruling'&&d.body&&can2('write')&&window.MQ_judgOpen?`<button class="btn sm pri" data-act="mbJudg" data-v="${d.id}" title="تشريح الحكم: وقائعه ومسائله وتسبيبه والمبدأ منه، ومقارنته بقضية من قضاياك">⚖️ تشريح الحكم</button>`:''}
   ${can2('write')&&d.body?`<button class="btn sm pri" data-act="mbAnalyze">${d.kind==='ruling'?'تحليل الحكم وأسباب الطعن':'تحليل النص'}</button>`:''}
</div></div>
  <div class="mb-body" style="font-size:${MB.fs}px">${d.body?bodyHtml(d.body,MB.q):`<p class="m">النص الكامل غير متوفر في القاعدة لهذا ${d.kind==='law'?'التشريع':'الحكم'}.</p>`}</div>
  ${(d.cites||[]).length?`<div class="mb-cites"><b>التشريعات المستشهد بها في الحكم (${d.cites.length})</b><ul>${d.cites.map(c=>`<li><button class="link" data-act="mbFind" data-v="${e(c.title)}">${e(c.title)}</button>${c.text?`<small>${e(c.text.slice(0,240))}${c.text.length>240?'…':''}</small>`:''}</li>`).join('')}</ul></div>`:''}
  ${m.classifications&&m.classifications.length?`<div class="mb-cites"><b>التصنيف</b><ul>${m.classifications.map(c=>`<li>${e(c)}</li>`).join('')}</ul></div>`:''}`}
async function loadAi(){if(LAB.ai)return;try{LAB.ai=await call('ai',{})}catch(x){LAB.ai={error:x.message}}if(S.view==='misbar'&&MB.view==='tools'){const el=document.getElementById('mbLab');if(el)el.innerHTML=labView()}}
function labView(){
 const ai=LAB.ai,T=LABT.find(t=>t[0]===LAB.task)||LABT[0],needDoc=['document','appeal','contract','translate'].includes(LAB.task);
 return `<div class="mb-h"><div><h1>مختبر التحليل القانوني واستخلاص النتائج</h1><p class="m">اختر المهمة، ثم أدخل السؤال أو الوقائع أو المستند. المحلل يسترجع مقتطفات موثّقة من قاعدة المسبار ويضع رقم المرجع [M…] بجانب كل ادعاء؛ ويجب تدقيق صلتها وحجيتها قبل الاعتماد.</p></div></div>
  <div class="mb-tabs">${LABT.map(([m,ic,t])=>`<button type="button" class="${LAB.task===m?'on':''}" data-act="mbLab" data-v="${m}"><i>${ic}</i> ${t}</button>`).join('')}</div>
  <p class="mb-tdesc">${e(T[3])}</p>
  <form class="mb-labf" id="mbLabForm" autocomplete="off">
   ${LAB.task==='search'?`<label class="wide">سؤال البحث<input class="field" id="mbLq" value="${e(LAB.q)}" placeholder="مثال: ما شروط إخلاء المأجور لعدم دفع الأجرة؟ أو: مدة الطعن بالنقض في الأحكام الحقوقية" maxlength="1200"></label>`:
   `<div class="mb-two2"><label>${LAB.task==='minutes'?'التفريغ النصي للاجتماع':LAB.task==='translate'?'ملاحظات (اختياري)':'وقائع القضية'}<textarea class="field" id="mbLf" rows="7" placeholder="${LAB.task==='minutes'?'ألصق تفريغ الاجتماع…':'أطراف القضية، التسلسل الزمني، المطالبات، البينات… (احذف الأسماء والبيانات الشخصية)'}">${e(LAB.facts)}</textarea></label>
    <label>${LAB.task==='translate'?'لغة الترجمة':'السؤال القانوني أو هدف التحليل'}${LAB.task==='translate'?`<select class="field" id="mbLlang">${[['en','الإنجليزية'],['he','العبرية'],['fr','الفرنسية'],['ar','العربية']].map(([v,t])=>`<option value="${v}" ${LAB.lang===v?'selected':''}>${t}</option>`).join('')}</select>`:`<textarea class="field" id="mbLq" rows="7" placeholder="ما المسألة المتنازع عليها؟ ما أسباب الطعن الممكنة؟">${e(LAB.q)}</textarea>`}</label></div>
   ${needDoc||LAB.task==='gaps'||LAB.task==='legal_question'?`<label class="wide">${needDoc?'نص الحكم أو العقد أو المستند':'نص مستند (اختياري)'}<textarea class="field" id="mbLd" rows="8" placeholder="ألصق النص هنا أو استورد ملفاً نصياً…">${e(LAB.doc)}</textarea></label>
   <div class="mb-labrow"><label class="mb-file">استيراد مستند نصي (txt / docx)<input type="file" id="mbLfile" accept=".txt,.docx,.md"></label>${LAB.docName?`<span class="m">${e(LAB.docName)}</span>`:''}</div>`:''}`}
   <div class="mb-labrow">
    <label class="mb-consent"><input type="checkbox" id="mbLc" ${LAB.consent?'checked':''}> أوافق على إرسال النص المدخل والمقتطفات المسترجعة إلى عقل المسبار الواعي، بعد حذف البيانات الشخصية والسرية.</label>
   </div>
   <div class="mb-labrow"><button class="btn mb-go" id="mbLgo" ${LAB.busy?'disabled':''}>${LAB.busy?'جارٍ التحليل…':MK+' '+(LAB.task==='search'?'عقل مِسْبار':'استخراج النتائج القانونية')}</button>${LAB.busy?'<span class="m">يبحث في القاعدة ثم يحلل…</span>':''}</div>
  </form>
  ${ai&&ai.error?`<div class="mb-empty bad">${e(ai.error)}</div>`:ai&&!ai.deepseek.configured&&!ai.claude.configured?`<div class="mb-cmp">لم يُضبط مفتاح عقل المسبار الواعي بعد. ${ai.canManage?'<button type="button" class="btn sm" data-act="aiKeysGo">ضبطه من الإعدادات</button>':'يضبطه مدير المكتب من الإعدادات.'}</div>`:''}
  ${LAB.err?`<div class="mb-empty bad">${e(LAB.err)}</div>`:''}
  ${LAB.res?labResult():''}`}
/* تحويل نص التحليل إلى فقرات: العناوين (#، أرقام، **) ونقاط، ومراجع [M123] قابلة للفتح */
function labHtml(t){const ref=x=>x.replace(/\[M(\d+)\]/g,(m,id)=>`<button type="button" class="mb-ref" data-act="mbRefOpen" data-v="${id}">[M${id}]</button>`).replace(/\(يحتاج تحقق\)/g,'<mark class="mb-unv">(يحتاج تحقق)</mark>');
 const lines=String(t||'').split(/\n/);let out='',ul=false;const close=()=>{if(ul){out+='</ul>';ul=false}};
 for(let raw of lines){let l=raw.trim();if(!l){close();continue}
  if(/^#{1,4}\s/.test(l)||/^\*\*[^*]{3,80}\*\*:?$/.test(l)||/^(أولاً|ثانياً|ثالثاً|رابعاً|خامساً|سادساً|سابعاً|ثامناً)[:：\s]/.test(l)){close();out+=`<h4>${ref(e(l.replace(/^#+\s*/,'').replace(/\*\*/g,'')))}</h4>`;continue}
  if(/^([-•*]|\d+[.)])\s/.test(l)){if(!ul){out+='<ul>';ul=true}out+=`<li>${ref(e(l.replace(/^([-•*]|\d+[.)])\s+/,'')).replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>'))}</li>`;continue}
  close();out+=`<p>${ref(e(l)).replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>')}</p>`}
 close();return out}
function labResult(){const r=LAB.res;
 return `<section class="mb-labres" id="mbLabRes"><div class="mb-rh"><b>حصيلة التحليل والمراجع</b><span class="m">${r.queries&&r.queries.length?'بحث في القاعدة عن: '+r.queries.map(e).join('، '):''}</span></div>
  <div class="mb-body mb-ana">${labHtml(r.analysis)}</div>
  ${r.refs&&r.refs.length?`<div class="mb-cites"><b>المراجع المسترجعة (${r.refs.length})${r.refs.some(x=>x.cited)?' — المستشهد بها معلّمة':''}</b><ul>${r.refs.map(x=>`<li class="${x.cited?'cited':''}"><button type="button" class="mb-ref" data-act="mbRefOpen" data-v="${x.id}">[${x.ref}]</button> ${e(x.title)} <small>${e(x.source)}${x.primary?'':' — للمقارنة والاستئناس'}${x.case_no?' · رقم '+e(x.case_no):''}${x.year?' · '+e(x.year):''}${x.status?' · '+e(x.status):''}</small></li>`).join('')}</ul></div>`:''}
  <div class="mb-cmp">تحليل آلي من المراجع المرفقة فقط؛ راجع كل مرجع بنصه الكامل قبل الاستشهاد به. لا يُعتمد قبل مراجعة المحامي.</div>
  <div class="mb-tools"><button class="btn sm" data-act="mbLabCopy">نسخ التحليل</button><button class="btn sm" data-act="mbLabPrint">طباعة تقرير A4</button>${(S.view==='case'||S.bagCase)&&typeof A.asSave==='function'?'':''}</div></section>`}
function toolsView(){setTimeout(loadAi,0);return `<section class="mb-card" id="mbLab">${labView()}</section>`}
V.misbar=()=>{setTimeout(loadStats,0);
 const enter=!!MB._enter;MB._enter=false;
 return `<div class="mb-wrap${enter?' mb-enter':''}">${head()}<div class="mb-grid">${side()}<main class="mb-main">${MB.view==='local'?localView():MB.view==='tools'?toolsView():`
  <section class="mb-card"><div class="mb-h"><div><h1>البحث القانوني المتقدم</h1><p class="m">استقصاء التشريعات والقرارات المحلية والمقارنة</p></div></div>${form()}</section>
  <section class="mb-card mb-resw" id="mbRes">${results()}</section>`}</main></div></div>`};

/* إعادة رسم داخل المسبار دون إعادة بناء الصفحة كلها (يمنع الرمش واختفاء الهيدر) */
function mbRender(){const w=document.querySelector('.mb-wrap');if(S.view!=='misbar'||!w)return render();
 const t=document.createElement('div');t.innerHTML=V.misbar();const nw=t.querySelector('.mb-wrap');if(!nw)return render();
 const os=w.querySelector('.mb-side'),ns=nw.querySelector('.mb-side'),om=w.querySelector('.mb-main'),nm=nw.querySelector('.mb-main');
 if(os&&ns)os.replaceWith(ns);if(om&&nm)om.replaceWith(nm);paintHead()}
function paint(){if(S.view!=='misbar')return;const r=document.getElementById('mbRes');if(r)r.innerHTML=results();const g=document.getElementById('mbGo');if(g)g.disabled=MB.busy;paintReader()}
/* القارئ: نافذة منبثقة تملأ الشاشة */
function paintReader(){let ov=document.getElementById('mbReader');if(!MB.doc&&!MB.docBusy){if(ov)ov.remove();document.body.classList.remove('mb-rd');return}
 if(!ov){ov=document.createElement('div');ov.id='mbReader';ov.className='mb-rov';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');document.body.appendChild(ov)}
 document.body.classList.add('mb-rd');ov.innerHTML=`<div class="mb-rbox"><button type="button" class="mb-rx" data-act="mbReaderClose" aria-label="إغلاق">✕</button>${reader()}</div>`}
function paintHead(){const s=document.getElementById('mbStats');if(s){const t=document.createElement('div');t.innerHTML=head();s.replaceWith(t.querySelector('#mbStats'))}}
function readForm(){const g=id=>document.getElementById(id);if(!g('mbQ'))return;const v=id=>g(id)?g(id).value:'';MB.q=v('mbQ');MB.src=v('mbSrcSel');MB.has_text=v('mbText');MB.sort=v('mbSort')||'relevance';const k=kindOf();
 if(k==='law'){MB.number=v('mbNum');MB.ltype=v('mbLtype');MB.status=v('mbStatus');MB.year_from=v('mbY1');MB.year_to=v('mbY2')}else if(k==='ruling'){MB.court=v('mbCourt');MB.case_no=v('mbCase');MB.ltype=v('mbLtype');MB.date_from=v('mbD1');MB.date_to=v('mbD2')}else{MB.year_from=v('mbY1');MB.year_to=v('mbY2')}}

/* ── الأفعال ── */
document.addEventListener('submit',ev=>{if(ev.target.id!=='mbForm')return;ev.preventDefault();ev.stopImmediatePropagation();run(1)},true);
document.addEventListener('change',ev=>{if(S.view!=='misbar')return;
 if(ev.target.id==='mbSrcSel'){const was=kindOf();readForm();MB.kind='';MB.country=MB.src?MB.src.slice(0,2):'';document.querySelectorAll('.mb-flag').forEach(b=>b.classList.toggle('on',b.dataset.v===MB.country));if(!MB.src){mbRender();if(hasQuery())run(1);return}if(kindOf()!==was){mbRender();if(hasQuery())run(1);return}}
 if(['mbSrcSel','mbCourt','mbStatus','mbText','mbSort','mbLtype','mbD1','mbD2'].includes(ev.target.id)&&MB.data){run(1)}});
A.mbView=v=>{readForm();MB.view=v==='tools'?'tools':v==='local'?'local':'search';mbRender()};
A.mbSrc=v=>{readForm();MB.src=MB.src===v?'':v;if(MB.view!=='search'){MB.view='search';mbRender()}const s=document.getElementById('mbSrcSel');if(s)s.value=MB.src;if(hasQuery())run(1);else{MB.data=null;paint()}document.querySelectorAll('.mb-chip').forEach(b=>b.classList.toggle('on',b.dataset.v===MB.src))};
A.mbPage=v=>run(Number(v)||1);
/* تبديل نوع المرجع: تتغير الفلاتر، وتُفرَّغ الخاصة بالنوع الآخر */
A.mbKind=v=>{readForm();const was=kindOf();MB.kind=v==='law'||v==='ruling'?v:'';if(MB.src&&MB.kind&&(MB.kind==='ruling')!==/JUDGMENT|CASSATION/.test(MB.src))MB.src='';
 if(kindOf()!==was)Object.assign(MB,{number:'',ltype:'',status:'',court:'',case_no:'',date_from:'',date_to:''});MB.view='search';mbRender();if(hasQuery())run(1)};
A.mbCountry=v=>{readForm();MB.country=MB.country===v?'':v;if(MB.country&&MB.src&&!MB.src.startsWith(MB.country+'_'))MB.src='';MB.view='search';mbRender();document.querySelectorAll('.mb-flag').forEach(b=>b.classList.toggle('on',b.dataset.v===MB.country));if(hasQuery())run(1);else{MB.data=null;paint()}};
A.mbClear=()=>{Object.assign(MB,{q:'',kind:'',number:'',ltype:'',date_from:'',date_to:'',country:'',src:'',year_from:'',year_to:'',court:'',case_no:'',status:'',has_text:'',sort:'relevance',data:null,err:'',open:null,doc:null});mbRender()};
A.mbOpen=async v=>{const id=Number(v);if(!id)return;MB.open=id;MB.docBusy=true;MB.doc=null;
 document.querySelectorAll('.mb-list li').forEach(li=>li.classList.toggle('on',li.querySelector('[data-v="'+id+'"]')!=null));
 paintReader();
 try{MB.doc=await call('doc',{id})}catch(x){toast(x.message);MB.doc=null}MB.docBusy=false;paintReader();
 const b=document.querySelector('#mbReader .mb-rbox');if(b)b.scrollTop=0};
/* البحث داخل نص القارئ: يتجاهل التشكيل والهمزات والتاء المربوطة، مع عدّاد وتنقل */
const FIND={i:0,n:0,t:0};
const arRx=w=>w.split('').map(c=>({'ا':'[اأإآٱ]','أ':'[اأإآٱ]','إ':'[اأإآٱ]','آ':'[اأإآٱ]','ي':'[يى]','ى':'[يى]','ه':'[هة]','ة':'[هة]','و':'[وؤ]','ء':'[ءئؤ]'}[c]||c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))).join('[\\u064B-\\u0652\\u0670\\u0640]*');
function findApply(q,keep){const box=document.querySelector('#mbReader .mb-body');if(!box||!MB.doc||!MB.doc.body)return;
 /* النص من جديد بلا تظليل البحث العام حتى لا تنقسم العبارة بين عناصر */
 box.innerHTML=bodyHtml(MB.doc.body,String(q||'').trim().length>=2?'':MB.q);
 const term=String(q||'').replace(/[\u064B-\u0652\u0640]/g,'').trim();FIND.n=0;
 if(term.length>=2){const rx=new RegExp(term.split(/\s+/).map(arRx).join('[\\u064B-\\u0652\\u0670\\u0640]*\\s+')+'[\\u064B-\\u0652\\u0670\\u0640]*','g');
  const tw=document.createTreeWalker(box,NodeFilter.SHOW_TEXT),nodes=[];while(tw.nextNode())nodes.push(tw.currentNode);
  for(const nd of nodes){const tx=nd.nodeValue;rx.lastIndex=0;if(!rx.test(tx))continue;rx.lastIndex=0;const fr=document.createDocumentFragment();let last=0,m;
   while((m=rx.exec(tx))){if(!m[0])break;fr.appendChild(document.createTextNode(tx.slice(last,m.index)));const mk=document.createElement('mark');mk.className='mb-hit';mk.textContent=m[0];fr.appendChild(mk);last=m.index+m[0].length;FIND.n++}
   fr.appendChild(document.createTextNode(tx.slice(last)));nd.replaceWith(fr)}}
 FIND.i=keep?Math.min(FIND.i,Math.max(0,FIND.n-1)):0;findShow()}
function findShow(){const hits=[...document.querySelectorAll('#mbReader mark.mb-hit')];hits.forEach((h,k)=>h.classList.toggle('cur',k===FIND.i));
 const n=document.getElementById('mbFindN'),q=(document.getElementById('mbFind')||{}).value||'';if(n)n.textContent=q.trim().length<2?'':FIND.n?`${FIND.i+1} / ${FIND.n}`:'لا نتائج';
 const c=hits[FIND.i];if(c){const box=document.querySelector('#mbReader .mb-rbox'),hd=box.querySelector('.mb-doc-h');const top=c.getBoundingClientRect().top-box.getBoundingClientRect().top+box.scrollTop-(hd?hd.offsetHeight:0)-90;box.scrollTo({top,behavior:'smooth'})}}
A.mbFindStep=v=>{if(!FIND.n)return;FIND.i=(FIND.i+Number(v)+FIND.n)%FIND.n;findShow()};
document.addEventListener('input',ev=>{if(ev.target.id!=='mbFind')return;clearTimeout(FIND.t);FIND.t=setTimeout(()=>findApply(ev.target.value),180)});
document.addEventListener('keydown',ev=>{if(ev.target.id!=='mbFind')return;if(ev.key==='Enter'){ev.preventDefault();A.mbFindStep(ev.shiftKey?-1:1)}else if(ev.key==='Escape'){ev.stopPropagation();ev.target.value='';findApply('')}},true);
/* Ctrl+F داخل القارئ يفتح البحث في النص */
document.addEventListener('keydown',ev=>{if(!(ev.ctrlKey||ev.metaKey)||ev.key.toLowerCase()!=='f')return;const f=document.getElementById('mbFind');if(!f)return;ev.preventDefault();f.focus();f.select()});
A.mbReaderClose=()=>{MB.doc=null;MB.docBusy=false;paintReader()};
/* لمراجع القضية (case-refs.js): المستند المفتوح، وإعادة رسم القارئ بعد الربط، والبحث بموضوع قضية */
window.MQ_mbDoc=()=>MB.doc;
window.MQ_mbRepaint=()=>{const box=document.querySelector('#mbReader .mb-rbox'),top=box?box.scrollTop:0;paintReader();const b2=document.querySelector('#mbReader .mb-rbox');if(b2)b2.scrollTop=top;if(S.view!=='misbar'&&typeof render==='function')render()};
window.MQ_mbSearch=q=>{MB.q=String(q||'');MB.view='search';A.nav('misbar');setTimeout(()=>{if(MB.q.trim())run(1)},60)};
/* المسبار شاشة كاملة فوق المِسْبار: زر العودة وEsc يعيدان إلى الشاشة السابقة */
let prevView='dash';
const nav0=A.nav;A.nav=v=>{if(v==='misbar'&&S.view!=='misbar'){prevView=S.view||'dash';MB._enter=true}if(v!=='misbar'){MB.doc=null;paintReader()}return nav0(v)};
A.mbClose=()=>{MB.doc=null;paintReader();A.nav(prevView&&prevView!=='misbar'?prevView:'dash')};
document.addEventListener('keydown',ev=>{if(ev.key!=='Escape'||S.view!=='misbar')return;if(document.getElementById('modal')&&document.getElementById('modal').innerHTML.trim())return;if(MB.doc||MB.docBusy)A.mbReaderClose();else A.mbClose()});
const dn0=window.drawNav;if(typeof dn0==='function')window.drawNav=function(){const r=dn0.apply(this,arguments);document.body.classList.toggle('mb-on',S.view==='misbar');if(S.view!=='misbar'){const ov=document.getElementById('mbReader');if(ov)ov.remove();document.body.classList.remove('mb-rd')}return r};

A.mbFs=v=>{const n=Number(v);MB.fs=n===0?17:Math.max(14,Math.min(24,MB.fs+n*1.5));try{localStorage.setItem('mq_mb_fs',String(MB.fs))}catch(x){}const b=document.querySelector('.mb-body');if(b)b.style.fontSize=MB.fs+'px'};
A.mbFind=v=>{const t=String(v||'').replace(/^المادة رقم\s*\d+\s*من\s*/,'');MB.q='"'+t.replace(/["()]/g,' ').replace(/\s+/g,' ').trim()+'"';MB.src='PS_LEGISLATION';MB.view='search';mbRender();run(1)};
const docText=d=>[d.title,[d.court,d.case_no&&('رقم '+d.case_no),d.date||d.year].filter(Boolean).join(' · '),'',d.body||''].join('\n');
A.mbCopy=()=>{const d=MB.doc;if(!d)return;navigator.clipboard.writeText(docText(d)).then(()=>toast('نُسخ النص'),()=>toast('تعذّر النسخ في هذا المتصفح'))};
A.mbPrint=()=>{const d=MB.doc;if(!d)return;
 if(window.MQP&&MQP.open&&MQP.B){const B=MQP.B;MQP.open({label:d.title,build(){return {title:d.title,sub:[d.source,d.court,d.case_no&&('رقم '+d.case_no),d.date||d.year,d.status].filter(Boolean).join(' · '),file:'مسبار - '+String(d.title).slice(0,60),blocks:[...(d.primary?[]:[B.box('مرجع للمقارنة والاستئناس، وليس ملزماً أمام المحاكم الفلسطينية.')]),...String(d.body||'').split(/\n+/).filter(Boolean).map(t=>B.p(e(t))),B.box('وثيقة عمل من «مِسْبار» تتطلب التحقق من النص الأصلي والحجية والنفاذ قبل الاستناد إليها.')]}}});return}
 const w=window.open('','_blank');if(!w)return;w.document.write(`<!doctype html><html dir="rtl" lang="ar"><meta charset="utf-8"><title>${e(d.title)}</title><body style="font-family:serif;line-height:2;padding:20mm">${'<h2>'+e(d.title)+'</h2>'+String(d.body||'').split(/\n+/).map(p=>'<p>'+e(p)+'</p>').join('')}</body></html>`);w.document.close();w.print()};
/* حفظ حكم في مكتبة الاجتهادات برابطه (من مراجع مِسْبار) */
A.mbSaveUrl=async v=>{try{const r=await call('search',{url:String(v||''),per:'5',facets:'0'});const x=(r.results||[])[0];if(!x)return toast('المرجع غير موجود في قاعدة المسبار');MB.doc=await call('doc',{id:x.id});A.mbSaveRuling()}catch(x){toast(x.message)}};
A.mbSaveRuling=()=>{const d=MB.doc;if(!d||!window.MQ_rulingForm)return;
 const court=/النقض/.test(d.court)?'محكمة النقض':/الدستورية/.test(d.court)?'المحكمة الدستورية العليا':/العدل العليا/.test(d.court)?'المحكمة العليا':/استئناف/.test(d.court)?'محكمة الاستئناف':'أخرى';
 const iso=(d.date||'').match(/^\d{4}-\d{2}-\d{2}$/)?d.date:'';
 MQ_rulingForm({court,no:d.case_no||'',date:iso,field:'',keywords:[],text:String(d.body||'').slice(0,200000),src:d.source+(d.primary?'':' (للاستئناس)'),srcUrl:d.url||'',principle:'',summary:'',outcome:'',
  notes:[d.court&&court==='أخرى'?'المحكمة: '+d.court:'',(d.meta&&d.meta.classifications||[]).length?'التصنيف: '+d.meta.classifications.join('؛ '):'',(d.cites||[]).length?'النصوص المذكورة: '+d.cites.map(c=>c.title).join('؛ '):''].filter(Boolean).join(' · ').slice(0,1500)})};
/* فتح المساعد بنمط محدد، مع تعبئة النص المختار من القارئ عند الحاجة */
function openTool(mode,text){if(!can2('write'))return toast('أدوات التحليل متاحة للمحامين ومدير المكتب');
 if(typeof A.asOpen!=='function')return toast('مِسْبار غير متاح');
 const k=S.view==='case'?S.caseId:(S.bagCase||'');A.asOpen(k,{dataset:{mode}});
 if(text){let n=0;const t=setInterval(()=>{const q=document.getElementById('asQ');if(q||++n>40){clearInterval(t);if(q){q.value=String(text).slice(0,100000);q.dispatchEvent(new Event('input',{bubbles:true}))}}},100)}}
A.mbSmart=()=>{readForm();LAB.task='search';if(MB.q.trim())LAB.q=MB.q.trim();LAB.res=null;LAB.err='';MB.view='tools';mbRender()};
A.mbLab=v=>{labKeep();LAB.task=LABT.some(t=>t[0]===v)?v:'search';LAB.res=null;LAB.err='';MB.view='tools';mbRender()};
A.mbProv=v=>{labKeep();LAB.provider=v;const el=document.getElementById('mbLab');if(el)el.innerHTML=labView()};
function labKeep(){const g=id=>document.getElementById(id);if(g('mbLq'))LAB.q=g('mbLq').value;if(g('mbLf'))LAB.facts=g('mbLf').value;if(g('mbLd'))LAB.doc=g('mbLd').value;if(g('mbLlang'))LAB.lang=g('mbLlang').value;if(g('mbLc'))LAB.consent=g('mbLc').checked}
document.addEventListener('submit',async ev=>{if(ev.target.id!=='mbLabForm')return;ev.preventDefault();ev.stopImmediatePropagation();if(LAB.busy)return;labKeep();
 LAB.busy=true;LAB.err='';LAB.res=null;const el=document.getElementById('mbLab');if(el)el.innerHTML=labView();
 try{const r=await fetch('/api/admin/misbar/analyze',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({task:LAB.task,question:LAB.q,facts:LAB.facts,document:LAB.doc,lang:LAB.lang,consent:LAB.consent,provider:LAB.provider||undefined,src:MB.src||undefined})});
  if(r.status===401){location.replace('/login.html');return}const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'تعذّر التحليل');LAB.res=j}catch(x){LAB.err=x.message}
 LAB.busy=false;const el2=document.getElementById('mbLab');if(el2){el2.innerHTML=labView();const rs=document.getElementById('mbLabRes');if(rs)rs.scrollIntoView({block:'start',behavior:'smooth'})}},true);
document.addEventListener('change',async ev=>{if(ev.target.id!=='mbLfile')return;const f=ev.target.files[0];if(!f)return;labKeep();if(f.size>5*1024*1024){toast('الملف أكبر من 5 ميغابايت');return}
 try{const nm=f.name.toLowerCase();if(nm.endsWith('.docx')){if(typeof window.MQ_docxText!=='function')throw new Error('قراءة docx غير متاحة هنا؛ الصق النص');LAB.doc=await MQ_docxText(await f.arrayBuffer())}else LAB.doc=await f.text();LAB.docName=f.name;const d=document.getElementById('mbLd');if(d)d.value=LAB.doc;toast('استُورد النص')}catch(x){toast(x.message)}});
A.mbRefOpen=v=>A.mbOpen(v);
A.mbLabCopy=()=>{const r=LAB.res;if(!r)return;navigator.clipboard.writeText(r.analysis+'\n\nالمراجع:\n'+(r.refs||[]).map(x=>`[${x.ref}] ${x.title} — ${x.source}${x.url?' — '+x.url:''}`).join('\n')).then(()=>toast('نُسخ التحليل'),()=>toast('تعذّر النسخ'))};
A.mbLabPrint=()=>{const r=LAB.res;if(!r||!window.MQP||!MQP.B)return;const B=MQP.B;MQP.open({label:'تحليل المسبار',build(){return {title:'مِسْبار — '+((LABT.find(t=>t[0]===r.task)||[])[2]||'تحليل'),sub:(LAB.q||LAB.facts||'').slice(0,120),file:'misbar-analysis',blocks:[{html:`<div class="mb-print">${labHtml(r.analysis)}</div>`},...(r.refs&&r.refs.length?[B.h('المراجع'),...r.refs.map(x=>B.p(e(`[${x.ref}] ${x.title} — ${x.source}${x.primary?'':' (للمقارنة والاستئناس)'}${x.case_no?' · رقم '+x.case_no:''}${x.year?' · '+x.year:''}`)))]:[]),B.box('تحليل آلي من مراجع قاعدة المسبار فقط؛ لا يُعتمد قبل مراجعة المحامي.')]}}})};
A.mbTool=v=>{v=String(v||'question');if(v==='draft'){if(!can2('write'))return toast('الصياغة متاحة للمحامين ومدير المكتب');const k=S.view==='case'?S.caseId:(S.bagCase||'');return typeof A.aiOpen==='function'?A.aiOpen(k):toast('الصياغة غير متاحة')}openTool(v)};
A.mbAnalyze=()=>{const d=MB.doc;if(!d)return;openTool(d.kind==='ruling'?'appeal':'gaps',docText(d))};

const css=document.createElement('style');css.textContent=`
.mb-wrap{--mbN:#0E2236;--mbN2:#16314A;--mbG:#C9A24A;--mbG2:#F3D58A;margin:-6px 0 0}
body.mb-on .mb-wrap{position:fixed;inset:0;z-index:200;overflow:auto;margin:0;padding:0 16px 24px;background:radial-gradient(circle at 50% 0,#FBF6EA,#F1E8D6 60%,#EADFC8)}
body.mb-on .mb-wrap.mb-enter{animation:mbIn .28s ease-out}
body.mb-on{overflow:hidden}body.mb-on .app>.main>.top,body.mb-on .top{display:none!important}body.mb-on .modal-bg{z-index:220}body.mb-on .toast{z-index:240}
@keyframes mbIn{from{opacity:0}to{opacity:1}}
body.mb-on .mb-top{position:sticky;top:0;z-index:5;margin:0 -16px;border-radius:0 0 18px 18px;border-top:0}
.mb-x{position:absolute;top:12px;left:14px;z-index:3;font:inherit;font-size:13px;font-weight:700;padding:7px 14px;border-radius:999px;border:1px solid rgb(243 213 138 / .7);background:rgb(11 27 43 / .72);color:#F3D58A;cursor:pointer;backdrop-filter:blur(4px)}.mb-x:hover{background:#C9A24A;color:#0B1B2B}
.mb-resw{margin-top:16px}
body.mb-rd{overflow:hidden}
.mb-rov{position:fixed;inset:0;z-index:210;background:rgb(6 14 24 / .72);backdrop-filter:blur(6px);display:grid;place-items:center;padding:2.5vh 2.5vw;animation:mbFade .2s ease-out}
@keyframes mbFade{from{opacity:0}to{opacity:1}}
.mb-rbox{position:relative;width:min(1180px,100%);height:100%;overflow:auto;border-radius:22px;background:#FFFDF7;border:1px solid #C9A24A;box-shadow:0 0 0 1px rgb(243 213 138 / .35),0 30px 90px rgb(0 0 0 / .5),0 0 40px rgb(201 162 74 / .25);animation:mbUp .28s cubic-bezier(.2,.8,.2,1)}
@keyframes mbUp{from{transform:translateY(24px) scale(.98);opacity:0}to{transform:none;opacity:1}}
.mb-rx{position:sticky;top:12px;float:left;margin:12px;z-index:3;width:40px;height:40px;border-radius:50%;border:1px solid #C9A24A;background:#0E2236;color:#F3D58A;font-size:18px;cursor:pointer}
.mb-rbox .mb-doc-h{position:sticky;top:0;z-index:2;padding:22px 34px 14px;background:linear-gradient(110deg,#0B1B2B,#1B3654);border-bottom:3px solid #C9A24A;color:#E8EEF2}
.mb-rbox .mb-doc-h h2{color:#F3D58A;font-size:24px;margin:10px 0 6px}.mb-rbox .mb-doc-h .mb-meta{color:#C9D4DB}
.mb-rbox .mb-doc-h .btn{background:rgb(255 255 255 / .06);color:#F2E6C4;border:1px solid rgb(201 162 74 / .6)}.mb-rbox .mb-doc-h .btn.pri{background:linear-gradient(180deg,#F3D58A,#C9A24A);color:#0B1B2B;border:0}
.mb-rbox .mb-cmp{background:rgb(255 255 255 / .08);color:#F2E6C4}
.mb-rbox .mb-body{max-width:860px;margin:0 auto;padding:26px 34px 10px;border:0;font-family:'Amiri','Traditional Arabic',serif;line-height:2.15;color:#1b2733}
.mb-rbox .mb-body h4{text-align:center;color:#8A6A25;border-top:1px solid #eadcb8;padding-top:14px;margin-top:20px}
.mb-rbox .mb-cites{max-width:860px;margin:12px auto 30px}
.mb-rbox .mb-empty{padding:120px 20px}
.mb-find{display:flex;align-items:center;gap:6px;margin:12px 0 2px;padding:5px 6px 5px 10px;border-radius:12px;background:rgb(255 255 255 / .07);border:1px solid rgb(201 162 74 / .55);max-width:640px}
.mb-find-i{color:#F3D58A;font-size:16px}.mb-find input{flex:1;min-width:0;background:transparent;border:0;outline:0;color:#fff;font:inherit;font-size:14.5px;padding:6px 2px}.mb-find input::placeholder{color:#9fb0bf}
.mb-find-n{color:#F3D58A;font-size:12.5px;white-space:nowrap;min-width:52px;text-align:center}
.mb-find .btn{padding:4px 10px!important;min-width:0}
mark.mb-hit{background:#FFE58A;color:inherit;border-radius:3px;padding:0 1px;box-shadow:0 0 0 1px #E2C25C}mark.mb-hit.cur{background:#F2A93B;box-shadow:0 0 0 2px #C77A10,0 0 12px rgb(242 169 59 / .7)}
.mb-top{border-radius:16px;overflow:hidden;background:#0B1B2B;border:1px solid rgb(201 162 74 / .55);box-shadow:0 8px 24px rgb(11 27 43 / .22)}
.mb-hero{position:relative;overflow:hidden;aspect-ratio:1436/250;width:100%;background:#0B1B2B url(misbar-hero.webp) center/cover no-repeat}
.mb-sub{position:absolute;z-index:2;left:73.9%;top:85%;transform:translate(-50%,-50%);color:#F3D58A;font-size:clamp(11px,1.45vw,17px);font-weight:700;letter-spacing:.02em;white-space:nowrap;text-shadow:0 0 6px rgb(243 213 138 / .6),0 1px 2px #000}
.mb-fx{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none}
.mb-brand{text-align:center;padding:6px 6px 10px;border-bottom:1px solid rgb(201 162 74 / .3);margin-bottom:4px}.mb-brand img{width:96px;height:auto;border-radius:50%;animation:mbNeon 2.4s ease-in-out infinite;box-shadow:0 0 0 2px #F3D58A,0 0 16px 4px rgb(243 213 138 / .85),0 0 36px 10px rgb(201 162 74 / .45)}
@keyframes mbNeon{0%,100%{box-shadow:0 0 0 2px #E9C46A,0 0 12px 3px rgb(243 213 138 / .7),0 0 28px 8px rgb(201 162 74 / .35)}50%{box-shadow:0 0 0 2px #FFF1C2,0 0 22px 6px rgb(243 213 138 / 1),0 0 52px 16px rgb(201 162 74 / .6)}}
@media (prefers-reduced-motion:reduce){.mb-brand img{animation:none}}
.mb-brand b{display:block;font-size:26px;color:var(--mbG2);letter-spacing:.02em;margin-top:2px}.mb-brand small{display:block;color:#C9D4DB;font-size:12px}
.mb-stats{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;padding:10px 12px;border-top:2px solid var(--mbG)}
.mb-chip{border:1px solid rgb(201 162 74 / .55);background:rgb(255 255 255 / .06);color:#F2E6C4;border-radius:999px;padding:4px 10px;font:inherit;font-size:12px;cursor:pointer}.mb-chip b{color:var(--mbG2)}.mb-chip.on{background:var(--mbG);color:#0B1B2B}.mb-chip.on b{color:#0B1B2B}
.mb-flag{position:relative;display:inline-flex;align-items:center;gap:10px;padding:6px 16px 6px 8px;font-size:14px!important;border-radius:999px;border:1px solid rgb(201 162 74 / .55);background:linear-gradient(180deg,rgb(255 255 255 / .09),rgb(255 255 255 / .02));color:#F2E6C4;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;transition:transform .2s,box-shadow .2s,background .2s}
.mb-flag .fl{width:36px;height:24px;border-radius:4px;box-shadow:0 1px 4px rgb(0 0 0 / .5),inset 0 0 0 1px rgb(255 255 255 / .15);transform-origin:right center;animation:mbWave 3.2s ease-in-out infinite}
.mb-flag:nth-child(2) .fl{animation-delay:-.6s}.mb-flag:nth-child(3) .fl{animation-delay:-1.2s}.mb-flag:nth-child(4) .fl{animation-delay:-1.8s}.mb-flag:nth-child(5) .fl{animation-delay:-2.4s}
.mb-flag::after{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(105deg,transparent 30%,rgb(255 241 194 / .35) 45%,transparent 60%);background-size:250% 100%;animation:mbShine 5s linear infinite;pointer-events:none}
.mb-flag:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgb(201 162 74 / .35)}
.mb-flag.on{background:linear-gradient(180deg,#F3D58A,#C9A24A);color:#0B1B2B;border-color:#F3D58A;box-shadow:0 0 18px rgb(243 213 138 / .55)}
@keyframes mbWave{0%,100%{transform:perspective(60px) rotateY(0) skewY(0)}50%{transform:perspective(60px) rotateY(-14deg) skewY(-2deg)}}
@keyframes mbShine{from{background-position:150% 0}to{background-position:-100% 0}}
@media (prefers-reduced-motion:reduce){.mb-flag .fl,.mb-flag::after{animation:none}}
.mb-fc .mb-chip{background:#FBF6EA;color:#5a4a26;border-color:#e4d3a6}.mb-fc .mb-chip b{color:#8A6A25}.mb-fc .mb-chip.on{background:#0E2236;color:#F3D58A}
.mb-warn{color:#ffd9a0;font-size:13px}
.mb-grid{display:grid;grid-template-columns:250px minmax(0,1fr);gap:16px;margin-top:14px;align-items:start}
.mb-side{position:sticky;top:10px;background:linear-gradient(180deg,#0E2236,#0B1B2B);border-radius:16px;padding:12px 10px;border:1px solid rgb(201 162 74 / .35)}
.mb-side .g{color:var(--mbG);font-size:12px;font-weight:800;margin:12px 8px 6px}
.mb-side button{display:flex;gap:8px;align-items:center;width:100%;text-align:start;background:transparent;border:0;color:#E8EEF2;padding:9px 10px;border-radius:10px;font:inherit;font-size:14px;cursor:pointer}
.mb-side button i{font-style:normal;color:var(--mbG2);width:18px;text-align:center}.mb-side button:hover{background:rgb(255 255 255 / .07)}
.mb-side button.on{background:rgb(201 162 74 / .16);box-shadow:inset -3px 0 0 var(--mbG)}
.mb-note{margin:14px 4px 4px;padding:10px;border:1px solid rgb(201 162 74 / .35);border-radius:12px;color:#C9D4DB;font-size:12px;line-height:1.8}
.mb-card{background:var(--panel);border:1px solid #e3d5b5;border-radius:16px;padding:16px;box-shadow:0 6px 18px rgb(83 65 42 / .07)}
.mb-h h1{margin:0;font-size:24px}.mb-qrow{display:flex;gap:10px;margin-top:10px}.mb-q{flex:1;font-size:16px;padding:12px 14px}
.mb-go{background:linear-gradient(180deg,#D9B45C,#B38B49)!important;color:#0B1B2B!important;border:0!important;font-weight:800;padding:0 22px}
.mb-mk{width:20px;height:auto;vertical-align:-4px;border-radius:50%;box-shadow:0 0 0 1px rgb(233 196 106 / .8),0 0 6px rgb(243 213 138 / .6)}
.mb-side .mb-mk,.mb-tabs .mb-mk{width:18px}
.mb-krow{display:grid;grid-template-columns:minmax(180px,240px) 1fr auto auto;gap:8px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line,#eee4cf)}.mb-kname{display:flex;flex-direction:column;gap:2px}.mb-kname small{color:#8a7a5a;font-size:11.5px}.mb-kprov{display:flex;flex-direction:column;gap:4px;margin-top:12px;max-width:320px;font-size:12.5px;color:#7a6a4c}
@media(max-width:700px){.mb-krow{grid-template-columns:1fr}}
svg.mb-navmk{border-radius:50%;filter:drop-shadow(0 0 3px rgb(243 213 138 / .7))}
.mb-kind{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.mb-kind button{display:flex;align-items:center;gap:8px;font:inherit;font-size:14px;font-weight:700;padding:9px 16px;border-radius:12px;border:1px solid #e4d3a6;background:#FBF6EA;color:#5a4a26;cursor:pointer;transition:all .2s}
.mb-kind button i{font-style:normal;color:#B38B49;font-size:16px}.mb-kind button.on{background:linear-gradient(160deg,#16314A,#0B1B2B);color:#F3D58A;border-color:#C9A24A;box-shadow:0 4px 14px rgb(11 27 43 / .25)}.mb-kind button.on i{color:#F3D58A}
.mb-f{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:12px;align-items:end}.mb-f label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#7a6a4c}.mb-clear{height:40px}
.mb-two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;margin-top:16px;align-items:start}
.mb-rh{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:8px}.mb-rh b{font-size:18px}
.mb-fc{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.mb-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}
.mb-it{display:block;width:100%;text-align:start;background:transparent;border:0;border-bottom:1px solid #eee4cf;padding:12px 6px;font:inherit;cursor:pointer;border-radius:10px}
.mb-list li.on .mb-it,.mb-it:hover{background:#FBF6EA}.mb-list li.on .mb-it{box-shadow:inset -3px 0 0 var(--mbG)}
.mb-t{display:block;color:#13304d;font-size:15.5px;line-height:1.7;margin:4px 0}.mb-meta{color:#8a7a5a;font-size:12.5px}.mb-x{margin:6px 0 0;color:#3d4a57;font-size:13.5px;line-height:1.9}
.mb-tags{display:flex;gap:6px;flex-wrap:wrap}.mb-src{font-size:11.5px;padding:2px 9px;border-radius:999px;background:#F3E7C8;color:#6b5320}.mb-src.cmp{background:#E8EEF3;color:#3c536b}
.mb-st{font-size:11.5px;padding:2px 9px;border-radius:999px;background:#eee;color:#555}.mb-st.ok{background:#E2F3E8;color:#1E7A4C}.mb-st.warn{background:#FFF1D6;color:#8A5A00}.mb-st.bad{background:#FBE3E3;color:#A33}
mark{background:#F3D58A;color:#0B1B2B!important;font-weight:700;padding:0 2px;border-radius:4px;text-shadow:none!important}
.mb-pg{display:flex;gap:10px;justify-content:center;align-items:center;margin-top:12px}
.mb-empty{padding:30px 10px;text-align:center;color:#7a6a4c;display:flex;flex-direction:column;gap:6px}.mb-empty.bad{color:#A33}
.mb-reader{position:sticky;top:10px;max-height:calc(100vh - 30px);overflow:auto}
.mb-doc-h h2{font-size:19px;line-height:1.7;margin:8px 0 4px;color:#13304d}.mb-tools{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}
.mb-cmp{margin-top:8px;padding:8px 10px;border-radius:10px;background:#EEF3F7;color:#3c536b;font-size:13px}
.mb-body{border-top:1px solid #eee4cf;padding-top:10px;line-height:2.1;color:#1d2b38}.mb-body p{margin:0 0 8px}.mb-body h4{margin:14px 0 4px;color:#8A6A25;font-size:1em}
.mb-cites{margin-top:12px;padding:10px 12px;border-radius:12px;background:#FBF6EA;border:1px solid #eadcb8}.mb-cites ul{margin:6px 0 0;padding-inline-start:18px}.mb-cites li{margin-bottom:6px}.mb-cites small{display:block;color:#7a6a4c}
.mb-smart{border:1px solid var(--mbG)!important;color:#8A6A25!important;background:#FBF6EA!important;white-space:nowrap}
.mb-tabs{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.mb-tabs button{font:inherit;font-size:13px;padding:7px 12px;border-radius:999px;border:1px solid #e4d3a6;background:#FBF6EA;color:#5a4a26;cursor:pointer}.mb-tabs button i{font-style:normal;color:#B38B49}.mb-tabs button.on{background:#0E2236;color:#F3D58A;border-color:#0E2236}
.mb-tdesc{margin:8px 0 0;color:#7a6a4c;font-size:13px}
.mb-labf{margin-top:10px}.mb-labf label{display:flex;flex-direction:column;gap:4px;font-size:12.5px;color:#7a6a4c;margin-top:10px}.mb-labf textarea{line-height:1.8;resize:vertical}.mb-two2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.mb-labrow{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:12px}.mb-consent{flex-direction:row!important;align-items:flex-start;gap:8px!important;font-size:12.5px;color:#5a4a26!important;max-width:720px}.mb-consent input{margin-top:4px}
.mb-prov{display:flex;gap:6px;align-items:center;font-size:12.5px;color:#7a6a4c}.mb-chip.off{opacity:.45;cursor:not-allowed}
.mb-key{margin-top:12px;border:1px dashed #e4d3a6;border-radius:12px;padding:8px 12px}.mb-key summary{cursor:pointer;color:#8A6A25;font-weight:700}.mb-keyrow{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:8px}.mb-keyrow input{flex:1;min-width:220px}
.mb-labres{margin-top:16px;border-top:2px solid var(--mbG);padding-top:10px}.mb-ana h4{color:#0E2236;margin:14px 0 4px}.mb-ana ul{margin:4px 0 8px;padding-inline-start:20px}.mb-ana li{margin-bottom:4px}
.mb-ref{font:inherit;font-size:12px;border:1px solid #d9b45c;background:#FFF8E1;color:#8A6A25;border-radius:6px;padding:0 5px;cursor:pointer;vertical-align:baseline}.mb-ref:hover{background:#F3D58A}
.mb-unv{background:#FFE4E4;color:#A33;padding:0 4px;border-radius:4px}.mb-cites li.cited{font-weight:600}
.mb-tgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin-top:12px}
.mb-tool{display:flex;flex-direction:column;gap:6px;text-align:start;padding:16px;border-radius:16px;cursor:pointer;font:inherit;background:linear-gradient(160deg,#16314A,#0B1B2B);border:1px solid rgb(201 162 74 / .55);color:#C9D4DB;box-shadow:0 6px 16px rgb(11 27 43 / .18)}
.mb-tool i{font-style:normal;font-size:22px;color:var(--mbG2)}.mb-tool b{color:#F2D58C;font-size:16px}.mb-tool span{font-size:12.5px;line-height:1.7}.mb-tool:hover{box-shadow:0 0 0 1px var(--mbG2),0 0 20px rgb(233 196 106 / .3)}
.mb-princ{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;justify-content:center}.mb-princ span{font-size:12px;color:#8A6A25;border:1px solid #e4d3a6;border-radius:999px;padding:3px 10px;background:#FBF6EA}
@media(max-width:1100px){.mb-rbox .mb-doc-h,.mb-rbox .mb-body{padding-inline:18px}}
.mb-print h4{color:#333;margin:10px 0 2px}
@media(max-width:820px){.mb-two2{grid-template-columns:1fr}.mb-grid{grid-template-columns:1fr}.mb-side{position:static;display:flex;flex-wrap:wrap;gap:4px}.mb-side .g,.mb-note{width:100%}.mb-side button{width:auto}.mb-qrow{flex-direction:column}.mb-go{height:44px}}
@media print{.mb-side,.mb-top,.mb-card,.mb-tools,.mb-rx{display:none!important}.mb-rov{position:static;background:none;padding:0}.mb-rbox{height:auto;box-shadow:none;border:0}}`;document.head.appendChild(css);
/* ── «العقل المفكّر»: شبكة عُقد ذهبية تتصل وتنبض كأنها تفكّر، ورموز قانونية تتطاير عبر الهيدر ── */
const GLYPHS=['⚖','§','¶','∴','✒','⚑','✦','≡','Ⅰ','Ⅱ','ق','م','?','✓'];
function startFx(){const cv=document.querySelector('.mb-fx');if(!cv||cv._on)return;cv._on=1;
 const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const ctx=cv.getContext('2d');let W=0,H=0,dpr=Math.min(2,window.devicePixelRatio||1);
 const size=()=>{const r=cv.getBoundingClientRect();W=r.width;H=r.height;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)};size();
 const R=(a,b)=>a+Math.random()*(b-a);
 const nodes=Array.from({length:Math.round(Math.max(26,W/34))},()=>({x:R(0,W),y:R(0,H),vx:R(-.25,.25),vy:R(-.18,.18),r:R(1,2.4),p:R(0,6.28)}));
 const glyphs=[];const spawn=()=>glyphs.push({g:GLYPHS[Math.floor(Math.random()*GLYPHS.length)],x:R(0,W),y:H+20,vy:R(.25,.7),vx:R(-.2,.2),s:R(13,26),a:0,life:0,max:R(260,520),rot:R(-.3,.3)});
 for(let i=0;i<10;i++){spawn();glyphs[i].y=R(0,H);glyphs[i].life=R(0,200)}
 /* «ومضات تفكير»: نبضة تسري على وصلة بين عقدتين */
 const sparks=[];let t=0,raf=0;
 function frame(){if(!document.body.contains(cv)){cancelAnimationFrame(raf);return}
  if(t%30===0){const r=cv.getBoundingClientRect();if(Math.abs(r.width-W)>1||Math.abs(r.height-H)>1)size()}
  ctx.clearRect(0,0,W,H);t++;
  for(const n of nodes){n.x+=n.vx;n.y+=n.vy;n.p+=.04;if(n.x<0||n.x>W)n.vx*=-1;if(n.y<0||n.y>H)n.vy*=-1}
  const D=Math.min(150,W/7);
  for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy);
   if(d<D){ctx.strokeStyle=`rgba(243,213,138,${(1-d/D)*.35})`;ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();if(Math.random()<.0009&&sparks.length<14)sparks.push({a,b,k:0})}}
  for(const n of nodes){const g=.55+.45*Math.sin(n.p);ctx.fillStyle=`rgba(255,233,168,${.5+.4*g})`;ctx.shadowColor='rgba(243,213,138,.9)';ctx.shadowBlur=8*g;ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,6.283);ctx.fill()}
  ctx.shadowBlur=0;
  for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];s.k+=.025;if(s.k>=1){sparks.splice(i,1);continue}const x=s.a.x+(s.b.x-s.a.x)*s.k,y=s.a.y+(s.b.y-s.a.y)*s.k;
   const gr=ctx.createRadialGradient(x,y,0,x,y,9);gr.addColorStop(0,'rgba(255,248,220,.95)');gr.addColorStop(1,'rgba(243,213,138,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y,9,0,6.283);ctx.fill()}
  if(t%45===0&&glyphs.length<22)spawn();
  ctx.textAlign='center';ctx.textBaseline='middle';
  for(let i=glyphs.length-1;i>=0;i--){const g=glyphs[i];g.life++;g.y-=g.vy;g.x+=g.vx+Math.sin((g.life+i*30)/40)*.25;
   const f=g.life<60?g.life/60:g.life>g.max-80?Math.max(0,(g.max-g.life)/80):1;if(g.life>g.max||g.y<-30){glyphs.splice(i,1);continue}
   ctx.save();ctx.translate(g.x,g.y);ctx.rotate(g.rot*Math.sin(g.life/90));ctx.font=`700 ${g.s}px Amiri, serif`;ctx.fillStyle=`rgba(243,213,138,${.55*f})`;ctx.shadowColor='rgba(201,162,74,.9)';ctx.shadowBlur=12*f;ctx.fillText(g.g,0,0);ctx.restore()}
  if(!reduce)raf=requestAnimationFrame(frame)}
 frame()}
const vm0=V.misbar;V.misbar=function(){const h=vm0.apply(this,arguments);setTimeout(startFx,30);return h};
/* الإعدادات: مفاتيح عقل المسبار الواعي ومزوّده (المكان الوحيد الذي تُذكر فيه أسماء المزوّدين) */
if(typeof V.settings==='function'){const vs0=V.settings;V.settings=function(){const h=vs0.apply(this,arguments);if(!can2('manage'))return h;setTimeout(keysLoad,0);
 return h+`<section class="panel" id="aiKeys" style="margin-top:16px"><header><h2>${MK} مِسْبار: مفاتيح عقل المسبار الواعي</h2></header><div class="bd" id="aiKeysBd">جارٍ التحميل…</div></section>`}}
async function keysLoad(){const bd=document.getElementById('aiKeysBd');if(!bd)return;let ai;try{ai=await call('ai',{})}catch(x){bd.textContent=x.message;return}LAB.ai=ai;
 const row=(id,name,st,ph,hint)=>`<div class="mb-krow"><div class="mb-kname"><b>${name}</b><span class="mb-st ${st.configured?'ok':''}">${st.configured?'مضبوط ···'+e(st.last4):'غير مضبوط'}</span><small>${hint}</small></div>
  <input class="field mono" id="k_${id}" type="password" dir="ltr" autocomplete="off" placeholder="${ph}"><button type="button" class="btn sm pri" data-act="aiKeySave" data-v="${id}">حفظ</button>${st.configured?`<button type="button" class="btn sm" data-act="aiKeyDel" data-v="${id}">إزالة</button>`:'<span></span>'}</div>`;
 bd.innerHTML=`<p class="m">مِسْبار يستعمل خدمة ذكاء اصطناعي خارجية للتحليل والصياغة فقط؛ البحث في التشريعات والقرارات محلي ولا يحتاجها. المفاتيح تُحفظ في الخادم ولا تُعرض بعد حفظها.</p>
  ${row('deepseek','DeepSeek',ai.deepseek,'sk-…','platform.deepseek.com')}${row('claude','Claude (Anthropic)',ai.claude,'sk-ant-…','console.anthropic.com')}
  <label class="mb-kprov">المزوّد المفضّل للتحليل<select class="field" id="k_provider"><option value="">تلقائي (المتاح أولاً)</option><option value="deepseek" ${ai.provider==='deepseek'?'selected':''}>DeepSeek</option><option value="claude" ${ai.provider==='claude'?'selected':''}>Claude</option></select></label>
  <p class="m">صياغة اللوائح والمساعد في القضايا يستعملان مفتاح Claude.</p>`}
A.aiKeySave=async v=>{const i=document.getElementById('k_'+v);const key=(i&&i.value||'').trim();if(!key)return toast('الصق المفتاح أولاً');
 try{const r=await fetch(v==='claude'?'/api/admin/ai/key':'/api/admin/misbar/dskey',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'تعذّر الحفظ');toast('حُفظ المفتاح');keysLoad()}catch(x){toast(x.message)}};
A.aiKeyDel=async v=>{if(!confirm('إزالة المفتاح؟'))return;try{await fetch(v==='claude'?'/api/admin/ai/key':'/api/admin/misbar/dskey',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key:''})});keysLoad()}catch(x){toast(x.message)}};
document.addEventListener('change',async ev=>{if(ev.target.id!=='k_provider')return;try{const r=await fetch('/api/admin/misbar/provider',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({provider:ev.target.value})});if(!r.ok)throw new Error('تعذّر الحفظ');toast('حُفظ المزوّد المفضّل')}catch(x){toast(x.message)}});
if(typeof A.aiKeysGo!=='function')A.aiKeysGo=()=>A.nav('settings');
window.MQ_misbar=MB;
/* ── النتائج تمرّ فوق الهيدر الثابت بأرضية بيج مصمتة: بلا شفافية ولا ضبابية ولا توهّج، لتبقى الصفحة والنصوص واضحة ── */
{const css=document.createElement('style');css.textContent=`
body.mb-on .mb-wrap .mb-top{z-index:1}
body.mb-on .mb-wrap .mb-grid{position:relative;z-index:3}
/* أرضية بيج مصمتة للمحتوى الذي يمرّ فوق الهيدر: لا يظهر الهيدر من الفراغات بين البطاقات */
.mb-wrap .mb-grid{background:#F8F6F0;border-radius:18px 18px 0 0;box-shadow:0 0 0 18px #F8F6F0}
html.night .mb-wrap .mb-grid{background:var(--bg);box-shadow:0 0 0 18px var(--bg)}
.mb-wrap .mb-card{background:#FBF6EA;-webkit-backdrop-filter:none;backdrop-filter:none;border:1px solid #E5D9BC;box-shadow:0 6px 18px rgb(11 27 43 / .08)}
.mb-wrap .mb-side{background:#0E2236;-webkit-backdrop-filter:none;backdrop-filter:none;box-shadow:0 6px 18px rgb(0 0 0 / .15)}
html.night .mb-wrap .mb-card{background:#14213A;border-color:#2A3A55}
.mb-wrap .mb-t{font-weight:700;color:#0F2A45;text-shadow:none}
html.night .mb-wrap .mb-t{color:#F3E9CF}
/* مقتطف النتيجة: خلفية بيج غامق فاتحة ونص داكن واضح (منفصل عن زر الإغلاق الذي يحمل الصنف نفسه) */
.mb-wrap p.mb-x,.mb-wrap p.mb-x:hover{position:static;display:block;margin:8px 0 2px;padding:9px 14px;border-radius:12px;border:1px solid #D2BD8F;background:#E9DCBE;color:#2B2416;font-weight:400;font-size:13.5px;line-height:1.95;cursor:inherit;-webkit-backdrop-filter:none;backdrop-filter:none;box-shadow:none}
html.night .mb-wrap p.mb-x{background:#3A3324;border-color:#5C4E2E;color:#F2E6C4}
.mb-los{margin-top:14px}.mb-los>h3,.mb-los summary h3{display:inline;font-size:15.5px;margin:0;color:var(--ink,#2B2416)}.mb-los summary{cursor:pointer;padding:4px 0}.mb-los>h3{display:block;margin-bottom:8px}
.mb-loa,.mb-lol,.mb-lor{border:1px solid #e8dcc0;border-radius:12px;padding:10px 12px;margin:8px 0;background:#FFFDF8}.mb-loa.miss{background:#FBF3EF;border-color:#ebcfc3}.mb-lor.cmp{background:#F4F7FA;border-color:#d6e0ea}
.mb-lol>.mb-loa{background:#fff}.mb-loh{display:flex;flex-wrap:wrap;align-items:center;gap:6px}.mb-loh .mb-ref{margin-inline-start:auto}
.mb-loq{margin:8px 0 4px;padding:8px 12px;border-inline-start:3px solid #C9A24A;background:#FBF6EA;line-height:1.95;white-space:normal}
.mb-lox{margin:6px 0;line-height:1.9}.mb-low{font-size:12px;color:#7a6a4c;margin-top:4px}.mb-locs{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0}
.mb-chip{font-size:12px;padding:3px 9px;border-radius:999px;background:#F3EBD8;color:#5a4a2c;border:1px solid #e4d3a6}.mb-chip.on{background:#2F4A3A;color:#F5EBD2;border-color:#2F4A3A}
.mb-st{font-size:11.5px;padding:2px 8px;border-radius:999px;background:#E7F0E8;color:#2f5b3c}.mb-st.bad{background:#F6E3DE;color:#8a3a2b}
.mb-lot{width:100%;border-collapse:collapse;font-size:13.5px}.mb-lot th,.mb-lot td{border-bottom:1px solid #eee2c8;padding:6px 8px;text-align:start;vertical-align:top}.mb-lot th{white-space:nowrap;color:#6b5a3a;font-weight:600}
.mb-lofb{display:inline-flex;gap:4px;margin-inline-start:auto}.mb-lofb+.mb-lofb{margin-inline-start:0}.mb-lofb button{font:inherit;font-size:14px;line-height:1;padding:4px 7px;border-radius:8px;border:1px solid #e4d3a6;background:#FBF6EA;cursor:pointer;opacity:.75}.mb-lofb button:hover{opacity:1}.mb-lofb button.on{background:#2F4A3A;border-color:#2F4A3A;opacity:1}.mb-loa.pin{border-color:#C9A24A;box-shadow:0 0 0 1px #C9A24A inset}
.mb-lod{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:7px 0;border-bottom:1px dashed #eadfc6}.mb-lod .btn{margin-inline-start:auto}.mb-lod.add .field{flex:1;min-width:140px}.mb-learn{background:#F1EEDF;color:#4b4026}
.mb-lom{margin:6px 0;padding-inline-start:18px;line-height:1.9}.mb-lopre{white-space:normal;line-height:1.95;background:#FFFDF8;border:1px solid #eee2c8;border-radius:10px;padding:10px 12px;max-height:520px;overflow:auto}
html.night .mb-loa,html.night .mb-lol,html.night .mb-lor,html.night .mb-lopre{background:#2A261D;border-color:#4A4130}html.night .mb-loq{background:#332D21}html.night .mb-lor.cmp{background:#232A31}
@media (max-width:700px){.mb-lot td:nth-child(4){min-width:180px}}`;document.head.appendChild(css)}
/* تشريح الحكم من القارئ: اختيار القضية ثم الانتقال إلى تبويب المسبار فيها */
A.mbJudg=v=>{const d=MB.doc;if(!d||String(d.id)!==String(v)||!window.MQ_judgOpen)return;
 const list=(typeof cases!=='undefined'?cases:[]).filter(k=>k.status!=='closed'&&k.status!=='مغلقة');
 if(!list.length)return toast('لا توجد قضايا لربط التشريح بها');
 const m=document.getElementById('modal');if(!m)return;
 m.innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog" aria-label="تشريح الحكم"><div class="head"><h1 style="font-size:17px">تشريح الحكم</h1></div><div class="body"><p class="m">اختر القضية التي يُقارَن بها الحكم. يُرسَل نص الحكم (وهو من القاعدة العامة) وملف القضية بعد إخفاء الهويات.</p><select class="field" id="mbJgCase">${list.map(k=>`<option value="${e(k.id)}">${e(k.no)} — ${e(k.subject||k.type||'')}</option>`).join('')}</select></div><div class="foot"><button class="btn" data-act="close">إلغاء</button><button class="btn pri" data-act="mbJudgGo" data-v="${e(String(d.id))}">متابعة</button></div></div></div>`};
A.mbJudgGo=v=>{const sel=document.getElementById('mbJgCase'),k=sel&&sel.value,d=MB.doc;if(!k||!d)return;
 window.MQ_judgOpen(k,v,cleanT(d.title));A.close();A.openCase(k);S.caseTab='misbar';render()};
/* ── المسبار المحلي: بحث وتحليل وتشريح على الجهاز من القاعدة المحلية، دون إنترنت ودون إرسال أي نص ── */
const LOC={mode:'research',text:'',k:'',rtext:'',rid:null,busy:false,res:null,err:'',kind:'',fb:{},dict:null,pinDraft:null};
const LOCM=[['research','⌕','بحث قانوني','اكتب سؤالك أو وقائع المسألة: يستخرج المواد التي ذكرتها بنصها، ويحدد الموضوعات والتشريعات المعنية وأقرب موادها، ويجلب الأحكام الفلسطينية الأقرب ثم الأردنية والمصرية للمقارنة.'],['case','❏','تحليل قضية','اختر قضية: يقرأ ملفها ونصوص مستنداتها المقروءة على هذا الجهاز، ويرتّب التواريخ ويحسب المدد بينها، ويستخرج المبالغ والأرقام والمواد المذكورة، ثم يبحث في القاعدة كما في البحث القانوني.'],['ruling','§','تشريح حكم','افتح حكماً من القاعدة واضغط «تشريح دون إنترنت»، أو الصق نص حكم: يقسّمه إلى الهيئة والأطراف والحكم المطعون فيه وأسباب الطعن وأسباب المحكمة والمنطوق، مع نصوص المواد التي استند إليها.'],['dict','✎','قاموس المكتب','علّم المسبار خبرة مكتبك: مرادفات يستعملها المحامون (فيبحث بالكلمتين معاً)، ومواد تُثبَّت لموضوع معيّن فتظهر أولاً كلما سُئل عنه. ويتعلّم أيضاً من زرّي 👍 و👎 بجانب كل نتيجة: ما قيّمه المكتب مفيداً يتقدّم في الأسئلة المشابهة، وما قيّمه غير ذي صلة يختفي.']];
function locKeep(){const g=id=>document.getElementById(id);if(g('mbLoT'))LOC.text=g('mbLoT').value;if(g('mbLoK'))LOC.k=g('mbLoK').value;if(g('mbLoR'))LOC.rtext=g('mbLoR').value}
function localView(){const M=LOCM.find(x=>x[0]===LOC.mode)||LOCM[0];
 const cs=(typeof cases!=='undefined'?cases:[]).filter(k=>!/مغلق|closed/.test(String(k.status||'')));
 if(LOC.mode==='dict')return `<section class="mb-card" id="mbLoc"><div class="mb-h"><div><h1>المسبار المحلي · دون إنترنت</h1></div></div><div class="mb-tabs">${LOCM.map(([m,ic,t])=>`<button type="button" class="${LOC.mode===m?'on':''}" data-act="mbLocMode" data-v="${m}"><i>${ic}</i> ${t}</button>`).join('')}</div><p class="mb-tdesc">${e(M[3])}</p>${dictView()}</section>`;
 const form=LOC.mode==='research'?`<label class="wide">السؤال أو الوقائع<textarea class="field" id="mbLoT" rows="7" maxlength="200000" placeholder="مثال: فصل صاحب العمل الموكل بتاريخ 3/2/2024 دون إشعار ولم يدفع مكافأة نهاية الخدمة؛ هل يستحق تعويضاً عن الفصل التعسفي وفق المادة 42 من قانون العمل الفلسطيني؟">${e(LOC.text)}</textarea></label>
   <div class="mb-labrow"><label class="mb-file">استيراد مستند نصي (txt / docx)<input type="file" id="mbLoFile" accept=".txt,.docx,.md"></label></div>`
  :LOC.mode==='case'?`<label class="wide">القضية<select class="field" id="mbLoK"><option value="">— اختر القضية —</option>${cs.map(k=>`<option value="${e(k.id)}" ${LOC.k===k.id?'selected':''}>${e(k.no||'قيد التسجيل')} — ${e(k.subject||k.type||'')}</option>`).join('')}</select></label>`
  :`${LOC.rid?`<div class="mb-cmp">الحكم المختار من القاعدة: <b>${e(LOC.rtitle||'#'+LOC.rid)}</b> <button type="button" class="btn sm" data-act="mbLocClearR">إلغاء</button></div>`:`<label class="wide">نص الحكم<textarea class="field" id="mbLoR" rows="8" placeholder="الصق نص الحكم كاملاً، أو افتح حكماً من «البحث» واضغط «تشريح دون إنترنت»">${e(LOC.rtext)}</textarea></label>`}`;
 return `<section class="mb-card" id="mbLoc"><div class="mb-h"><div><h1>المسبار المحلي · دون إنترنت</h1><p class="m">يعمل كله على هذا الجهاز من قاعدة المسبار المحلية؛ لا يُرسل أي نص خارج الجهاز ولا يستخدم الذكاء الاصطناعي. لا يكتب رأياً من عنده: يعرض النصوص كما هي ويحسب المدد والمبالغ، ويبيّن سبب ظهور كل نتيجة.</p></div></div>
  <div class="mb-tabs">${LOCM.map(([m,ic,t])=>`<button type="button" class="${LOC.mode===m?'on':''}" data-act="mbLocMode" data-v="${m}"><i>${ic}</i> ${t}</button>`).join('')}</div>
  <p class="mb-tdesc">${e(M[3])}</p>
  <form class="mb-labf" id="mbLocForm" autocomplete="off">${form}
   <div class="mb-labrow"><button class="btn mb-go" id="mbLoGo" ${LOC.busy?'disabled':''}>${LOC.busy?'جارٍ التحليل على الجهاز…':'⛁ '+(LOC.mode==='ruling'?'تشريح الحكم':'تحليل على الجهاز')}</button>${LOC.busy?'<span class="m">يبحث في القاعدة المحلية…</span>':''}</div>
  </form>
  ${LOC.err?`<div class="mb-empty bad">${e(LOC.err)}</div>`:''}
  ${LOC.res?(LOC.kind==='dissect'?locDissect(LOC.res,true):locResult(LOC.res,true)):''}</section>`}
const locOpen=(id,t)=>`<button type="button" class="mb-ref" data-act="mbRefOpen" data-v="${id}">${e(t||'فتح النص')}</button>`;
const locQ=t=>`<blockquote class="mb-loq">${e(t).replace(/\n/g,'<br>')}</blockquote>`;
const dd=n=>n==null?'—':n===0?'اليوم نفسه':n<0?`بعد ${-n} يوماً`:`${n} يوماً`;
const fbBtns=(key,ui,title)=>ui?`<span class="mb-lofb">${[[1,'👍','مفيدة لهذا السؤال'],[-1,'👎','ليست ذات صلة — لا تُظهرها في الأسئلة المشابهة']].map(([v,ic,t])=>`<button type="button" class="${LOC.fb[key]===v?'on':''}" data-act="mbLocFb" data-v="${e(key+'|'+v)}" title="${t}" aria-label="${t}" aria-pressed="${LOC.fb[key]===v}">${ic}</button>`).join('')}</span>`:'';
function locResult(r,ui){
 const sec=(t,body,n)=>body?`<section class="mb-los"><h3>${t}${n!=null?` <small>(${n})</small>`:''}</h3>${body}</section>`:'';
 const cits=(r.citations||[]).map(c=>`<div class="mb-loa ${c.found?'':'miss'}"><div class="mb-loh"><b>${e(c.label||('المادة '+c.article))}</b> ${c.lawTitle?`من ${e(c.lawTitle)}`:''} ${c.status?`<span class="mb-st">${e(c.status)}</span>`:''}${c.repealed?'<span class="mb-st bad">ملغاة</span>':''}${ui&&c.lawId?locOpen(c.lawId,'التشريع كاملاً'):''}</div>${c.found?locQ(c.text):`<p class="m">${e(c.note||'')}</p>`}<small class="m">وردت في نصك: «${e(c.ctx)}»</small></div>`).join('');
 const laws=(r.laws||[]).map(l=>`<div class="mb-lol"><div class="mb-loh"><b>${e(l.title)}</b> <span class="mb-st">${e(l.status||'')}</span>${l.topic?`<span class="mb-chip">${e(l.topic)}</span>`:''}${ui?locOpen(l.lawId,'التشريع كاملاً'):''}</div>${(l.articles||[]).map(a=>`<div class="mb-loa ${a.pinned?'pin':''}"><div class="mb-loh"><b>${e(a.label)}</b> <small class="m">${e(a.why)}</small>${ui?`<span class="mb-lofb"><button type="button" data-act="mbLocPin" data-v="${e(l.lawId+'|'+a.n+'|'+a.label+'|'+l.title)}" title="تثبيت هذه المادة لموضوع في قاموس المكتب">📌</button></span>`:''}${fbBtns('A:'+l.lawId+':'+a.n,ui)}</div>${locQ(a.text)}</div>`).join('')||'<p class="m">لم تُطابَق مادة بعينها مع كلمات نصك؛ افتح التشريع كاملاً.</p>'}</div>`).join('');
 const rul=(arr,cmp)=>(arr||[]).map(x=>`<div class="mb-lor ${cmp?'cmp':''}"><div class="mb-loh"><b>${e(x.title)}</b>${fbBtns('R:'+x.id,ui)}${ui?locOpen(x.id,'نص الحكم'):''}</div><div class="m">${e([x.court,x.case_no&&'رقم '+x.case_no,x.date,x.source].filter(Boolean).join(' · '))}${cmp?' — للمقارنة والاستئناس، غير ملزم أمام المحاكم الفلسطينية':''}</div>${x.excerpt?`<p class="mb-lox">${e(x.excerpt)}</p>`:''}${(x.cites||[]).length?`<div class="mb-locs">${x.cites.map(c=>`<span class="mb-chip">${e(c)}</span>`).join('')}</div>`:''}<div class="mb-low">ظهر بسبب: ${(x.why||[]).map(e).join(' · ')}</div></div>`).join('');
 const tl=(r.timeline||[]).length?`<table class="mb-lot"><thead><tr><th>التاريخ</th><th>عن السابق</th><th>حتى اليوم</th><th>السياق</th></tr></thead><tbody>${r.timeline.map(t=>`<tr><td class="mono">${e(t.date)}${t.times>1?` <small>×${t.times}</small>`:''}</td><td>${dd(t.sincePrev)}</td><td>${t.fromToday<0?'بعد '+(-t.fromToday)+' يوماً':t.fromToday+' يوماً'}</td><td>${e(t.ctx)}</td></tr>`).join('')}</tbody></table>`:'';
 const am=(r.amounts||[]).length?`<ul class="mb-lom">${r.amounts.map(a=>`<li><b class="mono">${Number(a.value).toLocaleString('en')}</b> ${e(a.currency)} — <small class="m">${e(a.ctx)}</small></li>`).join('')}</ul><p class="m">المجموع الحسابي لما ورد: ${Object.entries(r.amountTotals||{}).map(([c,v])=>Number(v).toLocaleString('en')+' '+e(c)).join(' · ')} (قد يتكرر المبلغ نفسه في النص)</p>`:'';
 const ci=r.caseInfo?`<div class="mb-cmp">قُرئ ملف القضية و${r.caseInfo.read} من ${r.caseInfo.docs} مستنداً${(r.caseInfo.unread||[]).length?` — لم تُقرأ بعد: ${r.caseInfo.unread.map(e).join('، ')} (اقرأها من تبويب المسبار في القضية)`:''}.</div>`:'';
 return `<section class="mb-labres" id="mbLocRes"><div class="mb-rh"><b>${e(r.title||'حصيلة التحليل المحلي')}</b><span class="m">${r.ms!=null?(r.ms<1000?'استغرق أقل من ثانية على الجهاز':'استغرق '+(r.ms/1000).toFixed(1)+' ث على الجهاز'):''}</span></div>
  <div class="mb-cmp">${e(r.notice||'')}</div>${ci}${(()=>{const L=r.learned||{},p=[];if(L.pinned)p.push(L.pinned+' مادة مثبّتة في قاموس المكتب');if(L.boosted)p.push('رُفعت '+L.boosted+' نتيجة قيّمها المكتب مفيدة');if(L.hidden)p.push('أُخفيت '+L.hidden+' نتيجة قيّمها المكتب غير ذات صلة');if((L.synonyms||[]).length)p.push('بُحث أيضاً بمرادفات القاموس: '+L.synonyms.join('، '));return p.length?`<div class="mb-cmp mb-learn">✎ ما تعلّمه المسبار من مكتبك: ${p.map(e).join(' · ')}</div>`:''})()}
  ${(r.topics||[]).length?`<div class="mb-locs">${r.topics.map(t=>`<span class="mb-chip on" title="${e('الكلمات: '+t.hits.join('، '))}">${e(t.label)}</span>`).join('')}<small class="m"> كلمات البحث: ${e((r.keyterms&&r.keyterms.terms||[]).join('، '))}</small></div>`:''}
  ${sec('المواد المذكورة في النص',cits,(r.citations||[]).length)}${sec('التشريعات المعنية وأقرب موادها',laws)}${sec('أحكام فلسطينية',rul(r.rulings),(r.rulings||[]).length)}${sec('للمقارنة والاستئناس (الأردن ومصر)',rul(r.comparative,true),(r.comparative||[]).length)}
  ${sec('التسلسل الزمني والمدد',tl,(r.timeline||[]).length)}${sec('المبالغ',am)}${sec('أرقام دعاوى وطلبات وردت',(r.caseNos||[]).length?`<ul>${r.caseNos.map(c=>`<li><b class="mono">${e(c.no)}</b> ${e(c.kind)} — <small class="m">${e(c.ctx)}</small></li>`).join('')}</ul>`:'')}
  ${ui?`<div class="mb-tools"><button class="btn sm" data-act="mbLocCopy">نسخ التقرير</button><button class="btn sm" data-act="mbLocPrint">طباعة A4</button></div>`:''}</section>`}
function locDissect(r,ui){const pre=t=>`<div class="mb-lopre">${e(t).replace(/\n/g,'<br>')}</div>`;
 const sec=(t,b,open)=>b?`<details class="mb-los" ${open?'open':''}><summary><h3>${t}</h3></summary>${b}</details>`:'';
 const parties=(r.parties||[]).length?`<table class="mb-lot"><tbody>${r.parties.map(p=>`<tr><th>${e(p.role)}</th><td>${e(p.name)}</td></tr>`).join('')}${(r.counsel||[]).length?`<tr><th>الوكلاء</th><td>${r.counsel.map(e).join(' · ')}</td></tr>`:''}${r.panel?`<tr><th>الهيئة</th><td>${e(r.panel)}</td></tr>`:''}${r.appealed?`<tr><th>الحكم المطعون فيه</th><td>${e(r.appealed)}</td></tr>`:''}</tbody></table>`:'';
 const cits=[...(r.citations||[]).filter(c=>c.found).map(c=>`<div class="mb-loa"><div class="mb-loh"><b>${e(c.label)}</b> من ${e(c.lawTitle)}${c.repealed?'<span class="mb-st bad">ملغاة</span>':''}</div>${locQ(c.text)}</div>`),...(r.dbCites||[]).filter(c=>!(r.citations||[]).some(x=>x.found&&c.title.includes('رقم '+x.article+' من'))).map(c=>`<div class="mb-loa"><div class="mb-loh"><b>${e(c.title)}</b> <small class="m">مسجّلة في القاعدة لهذا الحكم</small></div>${c.text?locQ(c.text):''}</div>`)].join('');
 return `<section class="mb-labres" id="mbLocRes"><div class="mb-rh"><b>${e(r.title||'تشريح الحكم')}</b>${ui&&r.id?locOpen(r.id,'النص الكامل'):''}</div>
  <div class="m">${e([r.court,r.case_no&&'رقم '+r.case_no,r.date,r.source].filter(Boolean).join(' · '))}${r.primary===false?' — للمقارنة والاستئناس، غير ملزم أمام المحاكم الفلسطينية':''}</div>
  <div class="mb-cmp">${e(r.notice||'')}</div>
  ${(r.result||[]).length?`<div class="mb-locs"><b>النتيجة (تصنيف آلي):</b> ${r.result.map(x=>`<span class="mb-chip on">${e(x)}</span>`).join('')}</div>`:''}
  ${sec('الأطراف والهيئة',parties,true)}
  ${!r.judgmentLike&&!r.id?`<div class="mb-cmp">يبدو هذا النص ملخص وقائع لا حكماً كاملاً (لا أطراف ولا «لذلك»)؛ التشريح يناسب نص الحكم كما صدر. ${ui?'<button type="button" class="btn sm" data-act="mbLocToResearch">ابحث فيه بحثاً قانونياً ←</button>':''}</div>`:''}
  ${r.operative?sec('المنطوق',pre(r.operative)+(r.closing?`<p class="m">${e(r.closing)}</p>`:''),true):r.opGuess?sec('ما قضت به المحكمة (مستخرج من النص)',pre(r.opGuess),true):'<p class="m">لم يُعثر على «لذلك» أو «لهذه الأسباب» لتحديد المنطوق؛ راجع النص الكامل.</p>'}
  ${sec('أسباب الطعن كما وردت',r.grounds?pre(r.grounds):'')}${sec('أسباب المحكمة وتسبيبها',r.reasoning?pre(r.reasoning):'')}
  ${sec('المواد التي استند إليها الحكم',cits,true)}
  ${sec('التواريخ الواردة في الحكم',(r.dates||[]).length?`<table class="mb-lot"><tbody>${r.dates.map(t=>`<tr><td class="mono">${e(t.date)}</td><td>${dd(t.sincePrev)}</td><td>${e(t.ctx)}</td></tr>`).join('')}</tbody></table>`:'')}
  ${ui?`<div class="mb-tools"><button class="btn sm" data-act="mbLocCopy">نسخ التشريح</button><button class="btn sm" data-act="mbLocPrint">طباعة A4</button></div>`:''}</section>`}
function locText(){const r=LOC.res;if(!r)return'';const L=[];
 if(LOC.kind==='dissect'){L.push(r.title||'تشريح الحكم',[r.court,r.case_no,r.date].filter(Boolean).join(' · '),'');if((r.result||[]).length)L.push('النتيجة (تصنيف آلي): '+r.result.join('، '),'');for(const p of r.parties||[])L.push(p.role+': '+p.name);if(r.appealed)L.push('الحكم المطعون فيه: '+r.appealed);L.push('');if(r.operative)L.push('المنطوق:',r.operative,'');for(const c of (r.citations||[]).filter(c=>c.found))L.push(c.label+' من '+c.lawTitle+':',c.text,'');return L.join('\n')}
 if(r.title)L.push(r.title,'');
 for(const c of r.citations||[])L.push((c.label||'المادة '+c.article)+(c.lawTitle?' من '+c.lawTitle:'')+':',c.found?c.text:'('+(c.note||'غير موجودة')+')','');
 for(const l of r.laws||[]){L.push(l.title+' — '+(l.status||''));for(const a of l.articles||[])L.push(a.label+': '+a.text);L.push('')}
 if((r.rulings||[]).length){L.push('أحكام فلسطينية:');for(const x of r.rulings)L.push('- '+x.title+(x.excerpt?'\n  '+x.excerpt:''));L.push('')}
 if((r.comparative||[]).length){L.push('للمقارنة والاستئناس:');for(const x of r.comparative)L.push('- '+x.source+': '+x.title);L.push('')}
 if((r.timeline||[]).length){L.push('التسلسل الزمني:');for(const t of r.timeline)L.push(`- ${t.date} (عن السابق: ${dd(t.sincePrev)}): ${t.ctx}`);L.push('')}
 L.push(r.notice||'');return L.join('\n')}
A.mbLocMode=v=>{locKeep();LOC.mode=LOCM.some(m=>m[0]===v)?v:'research';LOC.err='';mbRender()};
A.mbLocClearR=()=>{LOC.rid=null;LOC.rtitle='';mbRender()};
A.mbLocToResearch=()=>{locKeep();LOC.text=LOC.rtext;LOC.mode='research';LOC.res=null;mbRender();setTimeout(locRun,30)};
A.mbLocDissect=v=>{const d=MB.doc;LOC.mode='ruling';LOC.rid=Number(v);LOC.rtitle=d&&String(d.id)===String(v)?cleanT(d.title):'';MB.doc=null;MB.docBusy=false;paintReader();MB.view='local';if(S.view!=='misbar'){A.nav('misbar')}else mbRender();setTimeout(locRun,30)};
async function locPost(a,b){const r=await fetch('/api/admin/misbar/local/'+a,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify(b)});
 if(r.status===401){location.replace('/login.html');throw new Error('انتهت الجلسة')}const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(r.status===404?'المسبار المحلي متاح في تطبيق المكتب على الجهاز.':j.error||'تعذّر التحليل');return j}
function dictView(){const d=LOC.dict;if(!d){setTimeout(locDictLoad,0);return '<p class="m">جارٍ تحميل قاموس المكتب…</p>'}
 const P=LOC.pinDraft;
 return `<section class="mb-los"><h3>المرادفات <small>(${d.syn.length})</small></h3><p class="m">إذا ورد أحد الطرفين في السؤال يبحث المسبار بالآخر أيضاً. مثال: «شيك راجع» ⇄ «شيك بدون رصيد».</p>
  ${d.syn.map((x,i)=>`<div class="mb-lod"><b>${e(x.a)}</b> ⇄ <b>${e(x.b)}</b><button type="button" class="btn sm" data-act="mbLocSynDel" data-v="${i}" aria-label="حذف">✕</button></div>`).join('')}
  <div class="mb-lod add"><input class="field" id="mbSynA" placeholder="كلمة أو عبارة" maxlength="80"> ⇄ <input class="field" id="mbSynB" placeholder="مرادفها" maxlength="80"><button type="button" class="btn sm pri" data-act="mbLocSynAdd">إضافة</button></div></section>
  <section class="mb-los"><h3>مواد مثبّتة لموضوعات <small>(${d.pins.length})</small></h3><p class="m">إذا وردت كل كلمات العبارة في السؤال تظهر المادة أولاً. لتثبيت مادة: اضغط 📌 بجانبها في نتيجة أي بحث.</p>
  ${P?`<div class="mb-lod add"><span>تثبيت <b>${e(P.label)}</b> من ${e(P.title)} لكل سؤال فيه:</span><input class="field" id="mbPinP" value="${e(P.phrase)}" maxlength="120"><button type="button" class="btn sm pri" data-act="mbLocPinSave">تثبيت</button><button type="button" class="btn sm" data-act="mbLocPinCancel">إلغاء</button></div>`:''}
  ${d.pins.map((x,i)=>`<div class="mb-lod">«${e(x.phrase)}» ← <b>${e(x.label||('المادة ('+x.n+')'))}</b> من ${e(x.title)}<button type="button" class="btn sm" data-act="mbLocPinDel" data-v="${i}" aria-label="حذف">✕</button></div>`).join('')||(P?'':'<p class="m">لا مواد مثبّتة بعد.</p>')}</section>
  ${d.at?`<p class="m">آخر تعديل: ${e(String(d.at).slice(0,16).replace('T',' '))}${d.by?' — '+e(d.by):''}</p>`:''}`}
async function locDictLoad(){try{LOC.dict=await locPost('dict',{})}catch(x){LOC.dict={syn:[],pins:[]};toast(x.message)}const el=document.getElementById('mbLoc');if(el&&LOC.mode==='dict')el.outerHTML=localView()}
async function locDictSave(){try{LOC.dict=await locPost('dict-save',{syn:LOC.dict.syn,pins:LOC.dict.pins});toast('حُفظ قاموس المكتب')}catch(x){toast(x.message)}const el=document.getElementById('mbLoc');if(el)el.outerHTML=localView()}
A.mbLocSynAdd=()=>{const a=(document.getElementById('mbSynA')||{}).value||'',b=(document.getElementById('mbSynB')||{}).value||'';if(!a.trim()||!b.trim())return toast('اكتب الكلمة ومرادفها');LOC.dict.syn.push({a:a.trim(),b:b.trim()});locDictSave()};
A.mbLocSynDel=v=>{LOC.dict.syn.splice(Number(v),1);locDictSave()};
A.mbLocPinDel=v=>{LOC.dict.pins.splice(Number(v),1);locDictSave()};
A.mbLocPin=v=>{const [lawId,n,label,...t]=String(v).split('|'),r=LOC.res||{};LOC.pinDraft={lawId:Number(lawId),n,label,title:t.join('|'),phrase:((r.topics||[])[0]||{}).label||((r.keyterms||{}).terms||[]).slice(0,3).join(' ')};LOC.mode='dict';mbRender()};
A.mbLocPinCancel=()=>{LOC.pinDraft=null;mbRender()};
A.mbLocPinSave=()=>{const P=LOC.pinDraft,ph=((document.getElementById('mbPinP')||{}).value||'').trim();if(!P)return;if(!ph)return toast('اكتب عبارة الموضوع');if(!LOC.dict)return;LOC.dict.pins.push({phrase:ph,lawId:P.lawId,n:P.n,title:P.title,label:P.label});LOC.pinDraft=null;locDictSave()};
A.mbLocFb=async v=>{const i=String(v).lastIndexOf('|'),key=v.slice(0,i),vote=Number(v.slice(i+1)),r=LOC.res;if(!r)return;const nv=LOC.fb[key]===vote?0:vote;
 try{await locPost('feedback',{key,vote:nv,terms:r.qterms||(r.keyterms||{}).terms||[]});LOC.fb[key]=nv;document.querySelectorAll(`[data-act="mbLocFb"][data-v^="${CSS.escape(key)}|"]`).forEach(b=>{const on=Number(b.dataset.v.slice(b.dataset.v.lastIndexOf('|')+1))===nv;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});toast(nv===1?'سجّل المسبار أنها مفيدة لهذا النوع من الأسئلة':nv===-1?'لن تظهر في الأسئلة المشابهة':'أُلغي التقييم')}catch(x){toast(x.message)}};
async function locRun(){locKeep();if(LOC.busy||LOC.mode==='dict')return;LOC.fb={};
 const m=LOC.mode;let a='analyze',b;
 if(m==='research'){if(LOC.text.replace(/\s/g,'').length<15)return toast('اكتب السؤال أو الوقائع');b={text:LOC.text}}
 else if(m==='case'){if(!LOC.k)return toast('اختر القضية');b={k:LOC.k}}
 else{a='dissect';if(LOC.rid)b={id:LOC.rid};else{if(LOC.rtext.replace(/\s/g,'').length<200)return toast('الصق نص الحكم كاملاً');b={text:LOC.rtext}}}
 LOC.busy=true;LOC.err='';LOC.res=null;const box=()=>document.getElementById('mbLoc');if(box())box().outerHTML=localView();
 try{LOC.res=await locPost(a,b);LOC.kind=a}catch(x){LOC.err=x.message}
 LOC.busy=false;const el=box();if(el){el.outerHTML=localView();const rs=document.getElementById('mbLocRes');if(rs)rs.scrollIntoView({block:'start',behavior:'smooth'})}}
document.addEventListener('submit',ev=>{if(ev.target.id!=='mbLocForm')return;ev.preventDefault();locRun()},true);
document.addEventListener('change',async ev=>{if(ev.target.id!=='mbLoFile')return;const f=ev.target.files[0];if(!f)return;locKeep();if(f.size>5*1024*1024)return toast('الملف أكبر من 5 ميغابايت');
 try{const nm=f.name.toLowerCase();LOC.text=nm.endsWith('.docx')?(typeof window.MQ_docxText==='function'?await MQ_docxText(await f.arrayBuffer()):(()=>{throw new Error('قراءة docx غير متاحة هنا؛ الصق النص')})()):await f.text();const t=document.getElementById('mbLoT');if(t)t.value=LOC.text;toast('استُورد النص')}catch(x){toast(x.message)}});
A.mbLocCopy=()=>{const t=locText();if(t)navigator.clipboard.writeText(t).then(()=>toast('نُسخ التقرير'),()=>toast('تعذّر النسخ'))};
A.mbLocPrint=()=>{const r=LOC.res;if(!r||!window.MQP||!MQP.B)return;MQP.open({label:'المسبار المحلي',build(){return {title:'مِسْبار — '+(LOC.kind==='dissect'?'تشريح حكم':'تحليل محلي'),sub:String(r.title||LOC.text||'').slice(0,120),file:'misbar-local',blocks:[{html:`<div class="mb-print">${LOC.kind==='dissect'?locDissect(r,false):locResult(r,false)}</div>`}]}}})};
})();
