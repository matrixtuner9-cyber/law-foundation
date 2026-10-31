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
const SRC=[['','كل المصادر — كل الدول'],['PS_JUDGMENT','فلسطين · أحكام'],['PS_LEGISLATION','فلسطين · تشريعات'],['JO_LEGISLATION','الأردن · تشريعات'],['JO_CASSATION','الأردن · تمييز'],['EG_LEGISLATION','مصر · تشريعات'],['EG_CASSATION','مصر · نقض'],['EG_CONSTITUTIONAL','مصر · الدستورية العليا']];
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
const MB={view:'search',gazette:'',kind:'',number:'',ltype:'',date_from:'',date_to:'',country:'PS',/* فلسطين افتراضياً؛ الأردن ومصر للمقارنة بضغطة */q:'',src:'',year_from:'',year_to:'',court:'',case_no:'',status:'',has_text:'',sort:'relevance',page:1,data:null,busy:false,err:'',open:null,doc:null,docBusy:false,fs:17,stats:null,statsErr:''};
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
 const k=kindOf(),keys=['q','src','has_text',...(k==='law'?['number','ltype','subject','status','year_from','year_to']:k==='ruling'?['court','case_no','ltype','date_from','date_to']:['year_from','year_to'])];
 for(const x of keys)if(String(MB[x]||'').trim())p[x]=String(MB[x]).trim();if(MB.gazette)p.gazette=MB.gazette;return p}
const hasQuery=()=>['q','gazette','subject','kind','number','ltype','date_from','date_to','country','src','year_from','year_to','court','case_no','status'].some(k=>String(MB[k]||'').trim());
async function run(page){
 /* تصفية عدد الوقائع تخص قائمة العدد وصفحاتها فقط؛ أي بحث جديد يبدأ دونها */
 if((page||1)===1&&!MB._gzKeep)MB.gazette='';MB._gzKeep=false;
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
  <div class="g">الاستقصاء القضائي</div><button class="${MB.view==='search'||MB.view==='local'?'on':''}" data-act="mbView" data-v="search"><i>⌕</i>البحث القانوني</button>${it('gazette','📰','الوقائع الفلسطينية')}
  <div class="g">مختبر التحليل</div>${LABT.map(([m,ic,t])=>`<button class="${MB.view==='tools'&&LAB.task===m?'on':''}" data-act="mbLab" data-v="${m}"><i>${ic}</i>${t}</button>`).join('')}
  <div class="g">أدوات القضية</div>${TOOLS.filter(([m])=>['draft','defences','similar','opponent','brief'].includes(m)).map(([m,ic,t])=>`<button data-act="mbTool" data-v="${m}"><i>${ic}</i>${t}</button>`).join('')}
  <div class="g">مراجع المكتب</div><button data-act="nav" data-v="rulings"><i>❏</i>مكتبة المكتب <small style="display:block;opacity:.7;font-size:11px">ما حفظه المكتب: أحكام وتشريعات ومبادئ</small></button>
  <div class="mb-note">المراجع الفلسطينية أساسية؛ الأردنية والمصرية للمقارنة والاستئناس. لا يُعتمد أي استنتاج قبل مراجعة المحامي.</div></aside>`}
/* نوع المرجع يحدد الفلاتر: التشريع (رقمه، نوعه، حالة سريانه، سنته) والحكم (المحكمة، رقم القضية، نوع الدعوى، تاريخ القرار) */
const kindOf=()=>MB.kind||(MB.src?(/JUDGMENT|CASSATION/.test(MB.src)?'ruling':'law'):'');
function srcOpts(){const CN={PS:'فلسطين',JO:'الأردن',EG:'مصر'};return SRC.filter(([v])=>!v||((!MB.country||v.startsWith(MB.country+'_'))&&(!MB.kind||(MB.kind==='ruling')===/JUDGMENT|CASSATION/.test(v)))).map(([v,l])=>!v&&CN[MB.country]?[v,'كل مصادر '+CN[MB.country]]:[v,l])}
function form(){
 const opt=(arr,v)=>arr.map(([k,t])=>`<option value="${k}" ${v===k?'selected':''}>${t}</option>`).join('');
 const st=MB.stats||{},k=kindOf(),c=MB.country;
 const vals=(arr,cur,all)=>`<option value="">${all}</option>`+(arr||[]).filter(x=>!c||x.country===c).reduce((a,x)=>{if(!a.some(y=>y.v===x.v))a.push(x);return a},[]).slice(0,40).map(x=>`<option value="${e(x.v)}" ${cur===x.v?'selected':''}>${e(x.v)}</option>`).join('');
 const courts=(st.courts&&st.courts.length?vals(st.courts,MB.court,'جميع المحاكم'):COURTS.map(x=>`<option value="${e(x)}" ${MB.court===x?'selected':''}>${x||'جميع المحاكم'}</option>`).join(''));
 const common=`<label>الدولة والمصدر<select class="field" id="mbSrcSel">${opt(srcOpts(),MB.src)}</select></label>`;
 const lawF=`<label>رقم التشريع<input class="field mono" id="mbNum" value="${e(MB.number)}" inputmode="numeric" maxlength="6" placeholder="مثال: 7"></label>
   <label>نوع التشريع<select class="field" id="mbLtype">${vals(st.lawTypes,MB.ltype,'جميع الأنواع')}</select></label>
   ${(st.lawSubjects||[]).length?`<label>التصنيف الموضوعي<select class="field" id="mbSubj"><option value="">جميع الموضوعات</option>${st.lawSubjects.map(x=>`<option value="${e(x.v)}" ${MB.subject===x.v?'selected':''}>${e(x.v)} (${x.n})</option>`).join('')}</select></label>`:''}
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
  <div class="mb-qrow"><input class="field mb-q" id="mbQ" value="${e(MB.q)}" placeholder="${!k?'اكتب أي شيء: رقم مادة، اسم قانون، رقم قضية، عبارة، أو سؤالك ووقائعه…':k==='ruling'?'ابحث في الأحكام: موضوع النزاع، مبدأ، عبارة من التسبيب…':k==='law'?'ابحث في التشريعات: اسم القانون، موضوعه، أو نص مادة…':'ابحث بالكلمات أو بعبارة بين علامتي تنصيص: “عدم كفاية الرصيد”، إخلاء المأجور…'}" maxlength="3000" aria-label="عبارة البحث">
   <button class="btn mb-go" id="mbGo" ${MB.busy?'disabled':''}>⌕ بحث قانوني</button></div>
  <div class="mb-kind" role="tablist" aria-label="نوع المرجع">${[['','الكل','⌕'],['law','التشريعات والقوانين','§'],['ruling','الأحكام والقرارات القضائية','⚖']].map(([v,t,i])=>`<button type="button" role="tab" aria-selected="${k===v}" class="${k===v?'on':''}" data-act="mbKind" data-v="${v}"><i>${i}</i>${t}</button>`).join('')}</div>
  <div class="mb-f">${common}${k==='law'?lawF:k==='ruling'?rulF:allF}
   <label>توافر النص<select class="field" id="mbText"><option value="">جميع النتائج</option><option value="1" ${MB.has_text==='1'?'selected':''}>النصوص المتاحة فقط</option></select></label>
   <label>الترتيب<select class="field" id="mbSort"><option value="relevance" ${MB.sort==='relevance'?'selected':''}>الأقرب للبحث</option><option value="year_desc" ${MB.sort==='year_desc'?'selected':''}>الأحدث</option><option value="year_asc" ${MB.sort==='year_asc'?'selected':''}>الأقدم</option></select></label>
   <button type="button" class="btn sm mb-clear" data-act="mbClear">مسح</button>
  </div></form>`}
function results(){
 if(MB.busy)return `<div class="mb-empty">جارٍ البحث…</div>`;
 if(MB.err)return `<div class="mb-empty bad">${e(MB.err)}</div>`;
 const d=MB.data;if(!d)return emptyHome();
 if(!d.total)return `<div class="mb-empty"><b>لا نتائج.</b><span>جرّب كلمات أقل أو أعم، أو أزل بعض الفلاتر.</span></div>`;
 const f=d.facets&&d.facets.src?`<div class="mb-fc">${Object.entries(d.facets.src).map(([k,n])=>`<button class="mb-chip sm ${MB.src===k?'on':''}" data-act="mbSrc" data-v="${k}">${e((SRC.find(s=>s[0]===k)||[,k])[1])} <b>${fmtN(n)}</b></button>`).join('')}</div>`:'';
 const AF=[['number','رقم التشريع'],['subject','التصنيف'],['ltype','النوع'],['status','الحالة'],['court','المحكمة'],['case_no','رقم الدعوى']].filter(([k])=>String(MB[k]||'').trim()).map(([k,t])=>`<button type="button" class="mb-chip sm on" data-act="mbFOff" data-v="${k}" title="إلغاء هذا القيد">${t}: ${e(MB[k])} ✕</button>`).join('');
 return `${AF?`<div class="mb-af"><span class="m">النتائج مقيّدة بـ:</span>${AF}</div>`:''}<div class="mb-rh"><b>${MB.gazette?'الوقائع الفلسطينية — العدد '+e(MB.gazette):'نتائج البحث'}</b><span class="m">النتائج: ${fmtN(d.total)} — صفحة ${d.page} من ${fmtN(d.pages)}</span>${MB.gazette?'<button class="mb-chip sm on" data-act="mbGzOff" title="إلغاء تصفية العدد">العدد '+e(MB.gazette)+' ✕</button> <button class="btn sm ghost" data-act="mbView" data-v="gazette">📰 كل الأعداد</button>':''}</div>${f}
  <ol class="mb-list">${d.results.map(r=>`<li class="${MB.open===r.id?'on':''}"><button class="mb-it" data-act="mbOpen" data-v="${r.id}">
   <div class="mb-tags">${badge(r)}${statusPill(r)}${r.has_text?'':'<span class="mb-st">النص غير متوفر</span>'}</div>
   <b class="mb-t">${hl(cleanT(r.title),MB.q)}</b>
   ${r.kind==='law'&&(r.ltype||r.subject||r.arts_n)?`<div class="mb-ix">${r.ltype?`<span><small>نوع التشريع</small><b>${e(r.ltype)}</b></span>`:''}${r.subject?`<span class="sj"><small>التصنيف الموضوعي${r.subj_auto?' (آلي)':''}</small><b>${String(r.subject).split(' › ').map(e).join(' <i>›</i> ')}</b></span>`:''}${r.arts_n?`<span><small>عدد المواد</small><b>${fmtN(r.arts_n)}</b></span>`:''}</div>`:''}
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
  ${d.kind==='law'&&(d.number||m.gazette_number||m.last_amended||m.in_force_from)?`<div class="mb-meta">${[d.number&&('رقم '+d.number+(d.year?' لسنة '+d.year:'')),d.date&&('نُشر '+d.date),m.gazette_number&&!m.gazette_name&&('الجريدة الرسمية عدد '+m.gazette_number+(m.gazette_page?' ص '+m.gazette_page:'')),m.in_force_from&&('يُعمل به من '+m.in_force_from),m.last_amended&&('آخر تعديل '+m.last_amended+((m.amended_by||[]).length?' ('+m.amended_by.length+' تشريعاً معدِّلاً)':''))].filter(Boolean).map(e).join(' · ')}</div>`:''}
  ${m.gazette_name?`<div class="mb-meta mb-gz">📰 منشور في ${e(m.gazette_name)} — العدد ${e(m.gazette_number)}${m.gazette_date?' بتاريخ '+e(m.gazette_date):''} <button class="btn sm ghost" data-act="mbGz" data-v="${e(m.gazette_number)}">كل ما نُشر في هذا العدد</button></div>`:''}
  ${m.title_only&&!d.body?`<div class="mb-cmp">نُشر في الوقائع بعنوانه، ولا يتوفر نصه في القاعدة؛ يُرجع إلى العدد المطبوع.</div>`:''}
  ${m.text_src==='pdf'?`<div class="mb-cmp mb-pdfsrc">ⓘ النص مستخرج آلياً من ملف PDF المنشور للجريدة الرسمية (${e(m.text_at||'')})؛ قد يختلف ترتيب بعض الأرقام والتواريخ عن الأصل، فقابل ما تقتبسه بالأصل المنشور قبل اعتماده.</div>`:''}
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
/* ── الوقائع الفلسطينية: الأعداد بالسنة، وكل عدد يُفتح بما نُشر فيه ── */
function gazetteView(){
 if(!MB.gzList&&!MB.gzBusy){MB.gzBusy=true;call('gazettes',{}).then(r=>{MB.gzList=r.items||[]}).catch(x=>{MB.gzErr=x.message;MB.gzList=[]}).finally(()=>{MB.gzBusy=false;if(MB.view==='gazette')mbRender()})}
 const L=MB.gzList,head=`<div class="mb-h"><div><h1>الوقائع الفلسطينية</h1><p class="m">الجريدة الرسمية لدولة فلسطين — كل عدد بما نُشر فيه من قوانين وقرارات بقانون وأنظمة ومراسيم وقرارات</p></div></div>`;
 if(!L)return `<section class="mb-card">${head}<div class="mb-empty">جارٍ تحميل أعداد الوقائع…</div></section>`;
 if(!L.length)return `<section class="mb-card">${head}<div class="mb-empty"><b>لا أعداد في قاعدة هذا الجهاز بعد.</b><span>${e(MB.gzErr||'تظهر الأعداد بعد تحديث قاعدة التشريعات.')}</span></div></section>`;
 const by=new Map();for(const x of L){const y=x.year||'غير مؤرخ';if(!by.has(y))by.set(y,[]);by.get(y).push(x)}
 const tot=L.reduce((a,x)=>a+x.n,0),yrs=[...by.keys()].filter(y=>typeof y==='number');
 return `<section class="mb-card">${head}
  <div class="mb-gzbar"><span class="m">${fmtN(L.length)} عدداً · ${fmtN(tot)} تشريعاً وقراراً${yrs.length?' · من '+Math.min(...yrs)+' إلى '+Math.max(...yrs):''}</span>
   <label class="mb-gzgo">افتح العدد رقم <input class="field" id="mbGzQ" inputmode="numeric" placeholder="مثال: 168" style="width:110px"></label><button class="btn sm" data-act="mbGzGo">افتح</button></div>
  ${[...by].map(([y,xs],i)=>`<details class="mb-gzy" ${i<2?'open':''}><summary><b>${e(y)}</b><span>${xs.length} ${xs.length>10?'عدداً':'أعداد'} · ${fmtN(xs.reduce((a,x)=>a+x.n,0))} تشريعاً وقراراً</span></summary>
   <div class="mb-gzg">${xs.map(x=>`<button class="mb-gzi ${x.special?'sp':''}" data-act="mbGz" data-v="${e(x.g)}" title="عرض كل ما نُشر في ${x.special?'':'العدد '}${e(x.g)}"><b>${x.special?e(x.g):'العدد '+e(x.g)}</b><small>${e(x.date||'')}</small><i>${x.n}</i></button>`).join('')}</div></details>`).join('')}
 </section>`}
A.mbFOff=k=>{MB[k]='';const ids={subject:'mbSubj',number:'mbNum',ltype:'mbLtype',status:'mbStatus',court:'mbCourt',case_no:'mbCase'};const el=document.getElementById(ids[k]);if(el)el.value='';run(1)};
A.mbGzGo=()=>{const el=document.getElementById('mbGzQ'),v=String(el&&el.value||'').trim().replace(/[٠-٩]/g,d=>String(d.charCodeAt(0)-0x660));if(!v)return;const hit=(MB.gzList||[]).find(x=>x.g===v||x.g===String(Number(v)));if(hit)A.mbGz(hit.g);else toast('لا يوجد في القاعدة عدد بهذا الرقم')};
function toolsView(){setTimeout(loadAi,0);return `<section class="mb-card" id="mbLab">${labView()}</section>`}
/* البحث الموحّد: الأدوات المتقدمة تحت الصندوق، وشاشة البداية باختصارات وآخر عمليات البحث */
const ADV=[['case','❏','تحليل قضية'],['ruling','§','تشريح حكم'],['gaps','◎','اكتشف ما فاتك'],['ref','⌗','أرقام ومحاكم وتنبيهات'],['dict','✎','قاموس المكتب']];
function advRow(){return `<div class="mb-adv"><span class="m">أدوات متقدمة:</span>${ADV.map(([m,ic,t])=>`<button type="button" class="mb-advb" data-act="mbAdv" data-v="${m}"><i>${ic}</i>${t}</button>`).join('')}</div>`}
A.mbAdv=v=>{readForm();LOC.mode=v;LOC.res=null;LOC.err='';MB.view='local';mbRender()};
const RK='mq.mb.recent';
function recent(){try{return JSON.parse(localStorage.getItem(RK)||'[]')}catch(x){return []}}
function remember(q){try{const r=[q,...recent().filter(x=>x!==q)].slice(0,8);localStorage.setItem(RK,JSON.stringify(r))}catch(x){}}
const QUICK=['مجلة الأحكام العدلية','قانون أصول المحاكمات المدنية والتجارية','قانون البينات','قانون العمل','قانون المالكين والمستأجرين','قانون التنفيذ','قانون الإجراءات الجزائية','قانون العقوبات'];
function emptyHome(){const r=recent();return `<div class="mb-home"><div><h3>اختصارات</h3><div class="mb-chips">${QUICK.map(x=>`<button type="button" data-act="mbQuick" data-v="${e(x)}">${e(x)}</button>`).join('')}</div></div>
 ${r.length?`<div><h3>آخر ما بحثت عنه</h3><div class="mb-chips rc">${r.map(x=>`<button type="button" data-act="mbQuick" data-v="${e(x)}">${e(x.length>70?x.slice(0,70)+'…':x)}</button>`).join('')}</div></div>`:''}
 <p class="m">أمثلة: «م 105 مجلة» · «نقض 123/2020» · «إخلاء المأجور» · أو الصق وقائع القضية وسؤالك كاملاً.</p></div>`}
A.mbQuick=v=>{const q=document.getElementById('mbQ');if(q)q.value=v;const f=document.getElementById('mbForm');if(f)f.requestSubmit()};
V.misbar=()=>{setTimeout(loadStats,0);
 const enter=!!MB._enter;MB._enter=false;
 return `<div class="mb-wrap${enter?' mb-enter':''}">${head()}<div class="mb-grid">${side()}<main class="mb-main">${MB.view==='local'?localView():MB.view==='tools'?toolsView():MB.view==='gazette'?gazetteView():`
  <section class="mb-card"><div class="mb-h"><div><h1>البحث القانوني</h1><p class="m">صندوق واحد لكل شيء: المسبار يفهم ما كتبت — مادة أو قانون أو رقم قضية أو عبارة أو وقائع كاملة</p></div></div>${form()}${advRow()}</section>
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
 if(k==='law'){MB.number=v('mbNum');MB.ltype=v('mbLtype');MB.subject=v('mbSubj');MB.status=v('mbStatus');MB.year_from=v('mbY1');MB.year_to=v('mbY2')}else if(k==='ruling'){MB.court=v('mbCourt');MB.case_no=v('mbCase');MB.ltype=v('mbLtype');MB.date_from=v('mbD1');MB.date_to=v('mbD2')}else{MB.year_from=v('mbY1');MB.year_to=v('mbY2')}}

/* ── الأفعال ── */
document.addEventListener('submit',ev=>{if(ev.target.id!=='mbForm')return;ev.preventDefault();ev.stopImmediatePropagation();MB.gazette='';
 /* رقم التشريع من بحث سابق لا يقيّد بحثاً جديداً بعبارة مختلفة لا تذكره */
 readForm();const q=String(MB.q||'').trim();if(MB.number&&q&&q!==MB._lastQ&&!new RegExp('(^|\\D)'+MB.number+'(\\D|$)').test(q.replace(/[٠-٩]/g,d=>d.charCodeAt(0)-0x660))){MB.number='';const n=document.getElementById('mbNum');if(n)n.value=''}MB._lastQ=q;if(q)remember(q);
 const qn=q.replace(/[٠-٩]/g,d=>String(d.charCodeAt(0)-0x660)),words=qn.split(/\s+/).filter(Boolean).length;
 /* وقائع أو سؤال أو استشهاد بمادة: يُحال إلى التحليل المحلي (يستخرج المواد بنصها ويجلب الأحكام الأقرب) */
 if(words>=8||/[؟?]/.test(qn)||/(^|\s)(م|م\.|المادة|مادة)\s*\(?\d+/.test(qn)){LOC.mode='research';LOC.text=q;LOC.res=null;LOC.err='';MB.view='local';mbRender();setTimeout(()=>locRun(),60);return}
 /* رقم قضية/حكم: 123/2020 */
 const cn=/^(?:[^\d]{0,25})?(\d{1,6})\s*\/\s*((?:19|20)\d{2})$/.exec(qn);if(cn&&words<=4){MB.kind='ruling';MB.case_no=cn[1]+'/'+cn[2];MB.q='';mbRender();run(1);return}
 run(1)},true);
document.addEventListener('change',ev=>{if(S.view!=='misbar')return;
 if(ev.target.id==='mbSrcSel'){const was=kindOf();readForm();MB.kind='';MB.country=MB.src?MB.src.slice(0,2):MB.country;document.querySelectorAll('.mb-flag').forEach(b=>b.classList.toggle('on',b.dataset.v===MB.country));if(!MB.src){mbRender();if(hasQuery())run(1);return}if(kindOf()!==was){mbRender();if(hasQuery())run(1);return}}
 if(['mbSrcSel','mbCourt','mbStatus','mbText','mbSort','mbLtype','mbD1','mbD2'].includes(ev.target.id)&&MB.data){run(1)}});
A.mbView=v=>{readForm();MB.view=v==='tools'?'tools':v==='local'?'local':v==='gazette'?'gazette':'search';if(v==='gazette'){MB.doc=null;MB.open=null;paintReader()}mbRender()};
A.mbSrc=v=>{readForm();MB.src=MB.src===v?'':v;if(MB.view!=='search'){MB.view='search';mbRender()}const s=document.getElementById('mbSrcSel');if(s)s.value=MB.src;if(hasQuery())run(1);else{MB.data=null;paint()}document.querySelectorAll('.mb-chip').forEach(b=>b.classList.toggle('on',b.dataset.v===MB.src))};
A.mbPage=v=>run(Number(v)||1);
/* تبديل نوع المرجع: تتغير الفلاتر، وتُفرَّغ الخاصة بالنوع الآخر */
A.mbKind=v=>{readForm();const was=kindOf();MB.kind=v==='law'||v==='ruling'?v:'';if(MB.src&&MB.kind&&(MB.kind==='ruling')!==/JUDGMENT|CASSATION/.test(MB.src))MB.src='';
 if(kindOf()!==was)Object.assign(MB,{number:'',ltype:'',status:'',court:'',case_no:'',date_from:'',date_to:''});MB.view='search';mbRender();if(hasQuery())run(1)};
A.mbCountry=v=>{readForm();MB.country=MB.country===v?'':v;if(MB.country&&MB.src&&!MB.src.startsWith(MB.country+'_'))MB.src='';MB.view='search';mbRender();document.querySelectorAll('.mb-flag').forEach(b=>b.classList.toggle('on',b.dataset.v===MB.country));if(hasQuery())run(1);else{MB.data=null;paint()}};
A.mbGz=v=>{Object.assign(MB,{gazette:String(v||''),q:'',kind:'',number:'',ltype:'',status:'',court:'',case_no:'',date_from:'',date_to:'',year_from:'',year_to:'',src:'PS_LEGISLATION',has_text:'',sort:'relevance',view:'search',doc:null,open:null,docBusy:false,_gzKeep:true});paintReader();mbRender();run(1).then(()=>{const r=document.getElementById('mbRes');if(r)r.scrollIntoView({block:'start',behavior:'smooth'})})};
A.mbGzOff=()=>{MB.gazette='';if(hasQuery())run(1);else{MB.data=null;mbRender()}};
A.mbClear=()=>{Object.assign(MB,{subject:'',gazette:'',q:'',kind:'',number:'',ltype:'',date_from:'',date_to:'',country:'PS',src:'',year_from:'',year_to:'',court:'',case_no:'',status:'',has_text:'',sort:'relevance',data:null,err:'',open:null,doc:null});mbRender()};
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
const nav0=A.nav;A.nav=v=>{if(v==='misbar'&&S.view!=='misbar'){prevView=S.view||'dash';MB._enter=true;/* دخول جديد للمسبار: يبدأ ببحث فارغ لا بنتائج البحث السابق */Object.assign(MB,{q:'',gazette:'',subject:'',number:'',ltype:'',status:'',court:'',case_no:'',date_from:'',date_to:'',year_from:'',year_to:'',page:1,data:null,err:'',open:null,doc:null,view:'search'})}if(v!=='misbar'){MB.doc=null;paintReader()}return nav0(v)};
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
.mb-adv{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:10px}.mb-advb{border:1px solid #E4D3A6;background:#FBF6EA;color:#5A4A22;border-radius:99px;padding:5px 12px;font:inherit;font-size:13px;cursor:pointer}.mb-advb i{font-style:normal;margin-inline-end:5px;color:#A07A28}.mb-advb:hover{background:#F3E6C4}
.mb-home{display:grid;gap:16px;padding:6px 2px}.mb-home h3{margin:0 0 8px;font-size:14px;color:#5A4A22}.mb-chips{display:flex;flex-wrap:wrap;gap:6px}.mb-chips button{border:1px solid #D9C690;background:#fff;border-radius:10px;padding:7px 12px;font:inherit;font-size:13.5px;cursor:pointer;color:#0F2A44}.mb-chips button:hover{border-color:#A07A28;background:#FFFAEE}.mb-chips.rc button{color:#4A5563;font-size:12.5px}
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
.mb-list>li{list-style:none;margin:0 0 14px;padding-bottom:12px;border-bottom:1px dashed #e4d3a6}.mb-list .mb-t{display:flex;gap:10px;align-items:center;margin:6px 0 6px;padding:9px 14px 9px 12px;border-radius:12px;background:linear-gradient(135deg,#0E2236 0%,#16324d 70%,#1d3f5f 100%);color:#F7E7BC;font-size:15.5px;line-height:1.6;border-right:5px solid #C9A24A;box-shadow:0 4px 12px rgb(14 34 54/.28),inset 0 1px 0 rgb(255 255 255/.06);text-shadow:0 1px 0 rgb(0 0 0/.35)}.mb-list .mb-t::before{content:'§';flex:0 0 26px;height:26px;display:grid;place-items:center;border-radius:50%;background:radial-gradient(circle at 35% 30%,#F3D58A,#C9A24A 70%);color:#0E2236;font-weight:800;font-size:14px;box-shadow:0 0 0 2px rgb(243 213 138/.35),0 0 10px rgb(243 213 138/.55)}.mb-list .mb-it:hover .mb-t,.mb-list li.on .mb-t{box-shadow:0 0 0 2px rgb(201 162 74/.55),0 0 18px rgb(243 213 138/.6)}.mb-list .mb-t,.mb-list .mb-it .mb-t{color:#F7E7BC!important;-webkit-text-fill-color:#F7E7BC!important;opacity:1!important}.mb-list .mb-t .mbp-c header .m{display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;font-size:12px}.mbp-g{align-items:start}.mbp details summary{cursor:pointer;font-size:12px;font-weight:700;color:#8A6A25;padding:4px 0;list-style:none}.mbp details summary::before{content:'▸ ';}.mbp details[open] summary::before{content:'▾ '}.mbp details blockquote{margin:6px 0 0}.mb-af{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 8px;padding:6px 10px;border-radius:10px;background:#FFF4D6;border:1px dashed #D9B45A}.mb-ix{display:flex;flex-wrap:wrap;gap:6px 14px;margin:4px 2px 6px}.mb-ix span{display:flex;flex-direction:column;gap:1px;padding:4px 10px;border-radius:9px;background:#F7F1E2;border:1px solid #EADBB4}.mb-ix small{font-size:10.5px;color:#8a7a5c}.mb-ix b{font-size:12.5px;color:#0E2236}.mb-ix .sj b i{color:#C9A24A;font-style:normal}mark{background:#F3D58A;color:#0B1B2B!important;-webkit-text-fill-color:#0B1B2B!important}mark{background:#F3D58A;color:#0B1B2B!important;font-weight:700;padding:0 2px;border-radius:4px;text-shadow:none!important}
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
.aqx{padding:18px 20px!important}
.aqx-hd{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 18px;padding-bottom:12px;border-bottom:1px solid #E4D3A6}
.aqx-hd h1{margin:0;font-size:30px}.aqx-pr{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}.aqx-pr li{font-size:12px;color:#5d5136;background:#FBF6EA;border:1px solid #EADBB4;border-radius:999px;padding:3px 11px}.aqx-pr li:before{content:"✓ ";color:#2A8C8A;font-weight:900}
.aqx-tabs{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr));gap:0!important;margin:14px 0 0!important;border:1px solid #DCC99A;border-radius:12px;overflow:hidden;background:#FFFCF4}
.aqx-tabs button{border:0!important;border-inline-start:1px solid #E9DCB8!important;border-radius:0!important;margin:0!important;padding:10px 6px!important;justify-content:center;white-space:nowrap;font-size:13.5px;background:transparent}.aqx-tabs button:first-child{border-inline-start:0!important}
.aqx-tabs button.on{background:#0E2236!important;color:#F3D58A!important;box-shadow:inset 0 -3px 0 #C9A24A}
.aqx-desc{margin:8px 2px 14px!important;font-size:12.5px;color:#7a6a4c;padding-inline-start:20px;position:relative}.aqx-desc:before{content:"ⓘ";position:absolute;inset-inline-start:0;color:#B8892E}
.aqx-grid{display:grid;gap:16px;align-items:stretch}.aqx-grid.two{grid-template-columns:minmax(0,7fr) minmax(0,5fr)}.aqx-grid.one{grid-template-columns:1fr}
.aqx-card{border:1px solid #DCC99A;border-radius:14px;background:#FFFEFA;padding:0 14px 14px;margin:0!important;min-width:0;box-shadow:0 2px 10px rgba(14,34,54,.05)}
.aqx-ch{display:flex;align-items:center;gap:10px;margin:0 -14px 12px;padding:10px 14px;border-bottom:1px solid #E9DCB8;background:linear-gradient(180deg,#FBF6EA,#F6EFDD);border-radius:14px 14px 0 0}
.aqx-ch i{flex:0 0 26px;height:26px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-weight:900;font-size:13px;color:#0E2236;background:radial-gradient(circle at 35% 30%,#F3D58A,#C9A24A 70%)}.aqx-ch b{color:#0E2236;font-size:14.5px}.aqx-ch small{color:#8a7a5c;font-size:11.5px;margin-inline-start:auto}
.aqx-in{display:flex;flex-direction:column}.aqx-in>label.wide{margin-top:0!important;font-size:0!important;gap:0!important;flex:1;display:flex}.aqx-in>label.wide>*{font-size:14px}.aqx-in>label.wide textarea{flex:1;min-height:150px}.aqx-in>label.wide select{font-size:14px}
.aqx-out .mbg-hl>b{display:none}.aqx-out .mbg-hl{justify-content:flex-start}
.aqx-meta{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;align-items:end;margin-top:10px;padding-top:10px;border-top:1px dashed #E4D3A6}.aqx-meta2{grid-template-columns:repeat(2,minmax(0,1fr))}
.aqx-meta label{margin-top:0!important}.aqx-meta>small{grid-column:1/-1;font-size:11.5px;line-height:1.7}
.aqx-meta .mb-file input{font-size:11.5px;max-width:100%}
.aqx-act{display:grid!important;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px!important;padding-top:12px;border-top:1px solid #E9DCB8}.aqx-act .btn{justify-content:center;min-height:42px;font-size:14px}.aqx-act>span{grid-column:1/-1}.aqx-act:not(:has(.mb-insp))>.btn{grid-column:1/-1}
.aqx-out{display:flex;flex-direction:column;position:static!important;background:#0E2236;border-color:#0E2236;padding:0}
.aqx-out .aqx-ch{margin:0;background:linear-gradient(180deg,#16314A,#0E2236);border-bottom-color:rgba(243,213,138,.25)}.aqx-out .aqx-ch b{color:#F3D58A}.aqx-out .aqx-ch small{color:#B9C3CE}
.aqx-out .mbg-hd{flex:1;margin:0!important;border-radius:0 0 14px 14px!important;animation:none!important}.aqx-out .mb-lwait{min-height:0}
.aqx-res{margin-top:16px;border:1px solid #DCC99A;border-radius:14px;padding:0 14px 14px;background:#FFFEFA}.aqx-res>.mb-labres{margin-top:0}
@media (max-width:1100px){.aqx-tabs{grid-template-columns:repeat(3,minmax(0,1fr))}.aqx-tabs button:nth-child(4){border-inline-start:0!important}.aqx-tabs button:nth-child(n+4){border-top:1px solid #E9DCB8!important}}
@media (max-width:980px){.aqx-grid.two{grid-template-columns:1fr}.aqx-meta{grid-template-columns:1fr 1fr}}
.aq-t{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;line-height:1.2}
.aq-n,.aq-m{background:linear-gradient(100deg,#8A6A25 0%,#B8892E 25%,#E9C46A 45%,#B8892E 60%,#0E2236 85%,#8A6A25 100%);background-size:240% 100%;-webkit-background-clip:text;background-clip:text;color:transparent!important;-webkit-text-fill-color:transparent;animation:aqShine 5s ease-in-out infinite;font-weight:900;filter:drop-shadow(0 2px 6px rgba(201,162,74,.35))}
.aq-m{animation-delay:.4s}.aq-d{font-style:normal;color:#C9A24A;animation:aqPulse 2.4s ease-in-out infinite}
.aq-off{font-size:.42em;font-weight:700;color:#1f6b69;background:#E6F4F1;border:1px solid #9ED3C8;border-radius:999px;padding:3px 12px;position:relative;padding-inline-start:24px}
.aq-off:before{content:"";position:absolute;inset-inline-start:10px;top:50%;width:8px;height:8px;margin-top:-4px;border-radius:50%;background:#2A8C8A;box-shadow:0 0 0 0 rgba(42,140,138,.6);animation:aqDot 1.8s ease-out infinite}
@keyframes aqShine{0%,100%{background-position:100% 0}50%{background-position:0 0}}@keyframes aqPulse{50%{opacity:.35;transform:scale(.85)}}@keyframes aqDot{to{box-shadow:0 0 0 9px rgba(42,140,138,0)}}
@media (prefers-reduced-motion:reduce){.aq-n,.aq-m,.aq-d,.aq-off:before{animation:none}}
.mb-lsplit{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:18px;align-items:start}.mb-lsplit>.mb-labf{min-width:0}
.mb-lside{position:sticky;top:10px;min-width:0}.mb-lside .mbg-hd{margin-top:10px;animation:mbLsIn .45s ease-out both}.mb-lside .mbg-kpi{grid-template-columns:repeat(auto-fill,minmax(130px,1fr))}
@keyframes mbLsIn{from{opacity:0;transform:translateX(-14px)}}
.mb-lside .mbg-k{animation:mbLsIn .4s ease-out both}.mb-lside .mbg-k:nth-child(2){animation-delay:.05s}.mb-lside .mbg-k:nth-child(3){animation-delay:.1s}.mb-lside .mbg-k:nth-child(4){animation-delay:.15s}.mb-lside .mbg-k:nth-child(5){animation-delay:.2s}.mb-lside .mbg-k:nth-child(6){animation-delay:.25s}.mb-lside .mbg-k:nth-child(7){animation-delay:.3s}
.mb-lwait{min-height:260px;display:flex;flex-direction:column;gap:6px}.mb-lgh{display:flex;flex-wrap:wrap;gap:10px;margin-top:auto;padding-top:14px}.mb-lgh span{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;font-size:19px;color:#F3D58A;background:rgb(201 162 74/.14);border:1px solid rgb(243 213 138/.25);animation:mbLgh 2.6s ease-in-out infinite;animation-delay:calc(var(--i)*.22s)}
@keyframes mbLgh{0%,100%{opacity:.45;transform:none}50%{opacity:1;transform:translateY(-3px);box-shadow:0 0 14px rgb(243 213 138/.35)}}
@media (max-width:980px){.mb-lsplit{grid-template-columns:1fr}.mb-lside{position:static}}
@media (prefers-reduced-motion:reduce){.mb-lside .mbg-hd,.mb-lside .mbg-k,.mb-lgh span{animation:none}}
.mb-labf{margin-top:10px}.mb-labf label{display:flex;flex-direction:column;gap:4px;font-size:12.5px;color:#7a6a4c;margin-top:10px}.mb-labf textarea{line-height:1.8;resize:vertical}.mb-two2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.mb-labrow{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:12px}.mb-consent{flex-direction:row!important;align-items:flex-start;gap:8px!important;font-size:12.5px;color:#5a4a26!important;max-width:720px}.mb-consent input{margin-top:4px}
.mb-gzbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin:6px 0 12px}.mb-gzgo{display:flex;gap:6px;align-items:center;font-size:13px}.mb-gzy{border:1px solid #e9dcb8;border-radius:12px;margin:8px 0;background:#fffdf7}.mb-gzy summary{cursor:pointer;padding:10px 14px;display:flex;gap:12px;align-items:baseline;list-style:none}.mb-gzy summary b{font-size:17px;color:#0E2236}.mb-gzy summary span{font-size:12.5px;color:#7a6a4c}.mb-gzg{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;padding:0 12px 12px}.mb-gzi{display:grid;grid-template-columns:1fr auto;gap:2px 8px;text-align:right;border:1px solid #e4d3a6;background:#FBF6EA;border-radius:10px;padding:8px 10px;cursor:pointer;font:inherit}.mb-gzi:hover{background:#0E2236;color:#F3D58A}.mb-gzi b{font-size:13.5px}.mb-gzi small{grid-column:1;font-size:11.5px;opacity:.75}.mb-gzi i{grid-row:1/3;grid-column:2;align-self:center;font-style:normal;font-weight:700;color:#8A6A25;background:#fff;border-radius:999px;padding:2px 8px;font-size:12px}.mb-gzi.sp{border-color:#b98b2c;background:#f7ecd2}.mb-gz{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.mb-prov{display:flex;gap:6px;align-items:center;font-size:12.5px;color:#7a6a4c}.mb-chip.off{opacity:.45;cursor:not-allowed}
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
.mb-loctx{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin-top:6px}.mb-loctx label{display:flex;flex-direction:column;gap:4px;font-size:13px;min-width:180px}.mb-loctx small{flex-basis:100%}
.mb-lov{list-style:none;margin:6px 0;padding:0;display:flex;flex-direction:column;gap:4px}.mb-lov li{font-size:12.5px;padding:4px 8px;border-radius:8px;line-height:1.7}.mb-lov li.bad{background:#F6E3DE;color:#7a2f22}.mb-lov li.warn{background:#FBF0D6;color:#6b4c0e}.mb-lov li.info{background:#EEF3F7;color:#3c536b}.mb-lov .mb-ref{margin-inline-start:6px}
.mb-ctxb{background:#F4EEDD;color:#4b4026}.mb-dlt td{vertical-align:top}.mb-dlt input{max-width:170px}
html.night .mb-lov li.bad{background:#4a2721;color:#f3c9bf}html.night .mb-lov li.warn{background:#4a3b17;color:#f3dfa6}html.night .mb-lov li.info{background:#22313f;color:#c9d9e8}
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
const LOC={region:'',eventDate:'',gtext:'',mode:'research',text:'',k:'',rtext:'',rid:null,busy:false,res:null,err:'',kind:'',fb:{},dict:null,pinDraft:null};
const LOCM=[['research','⌕','بحث قانوني','اكتب سؤالك أو وقائع المسألة: يستخرج المواد التي ذكرتها بنصها، ويحدد الموضوعات والتشريعات المعنية وأقرب موادها، ويجلب الأحكام الفلسطينية الأقرب ثم الأردنية والمصرية للمقارنة.'],['case','❏','تحليل قضية','اختر قضية: يقرأ ملفها ونصوص مستنداتها المقروءة على هذا الجهاز، ويرتّب التواريخ ويحسب المدد بينها، ويستخرج المبالغ والأرقام والمواد المذكورة، ثم يبحث في القاعدة كما في البحث القانوني.'],['ruling','§','تشريح حكم','افتح حكماً من القاعدة واضغط «تشريح دون إنترنت»، أو الصق نص حكم: يقسّمه إلى الهيئة والأطراف والحكم المطعون فيه وأسباب الطعن وأسباب المحكمة والمنطوق، مع نصوص المواد التي استند إليها.'],['gaps','◎','اكتشف ما فاتك','الصق مذكرتك أو لائحتك كاملة: يستخرج ما استشهدت به، ويقارنه بما استشهدت به الأحكام الفلسطينية الأقرب لموضوعك، ويعرض ما لم تذكره: مواد وأحكام ودفوع، بنصوصها، بوصفها فرصاً للفحص لا استنتاجات.'],['ref','⌗','أرقام ومحاكم وتنبيهات','قيم يحسب بها المحامي (الحد الأدنى للأجور، رسوم المحاكم، الفائدة) بنص مصدرها حرفياً، ودليل المحاكم والاختصاص المكاني من تشريعاتها، وتنبيه حين تُعدَّل مادة أو قانون ربطته بإحدى قضاياك بعد ربطه. كله من القاعدة المحلية دون إنترنت.'],['dict','✎','قاموس المكتب','علّم المسبار خبرة مكتبك: مرادفات يستعملها المحامون (فيبحث بالكلمتين معاً)، ومواد تُثبَّت لموضوع معيّن فتظهر أولاً كلما سُئل عنه. ويتعلّم أيضاً من زرّي 👍 و👎 بجانب كل نتيجة: ما قيّمه المكتب مفيداً يتقدّم في الأسئلة المشابهة، وما قيّمه غير ذي صلة يختفي.']];
function locKeep(){const g=id=>document.getElementById(id);if(g('mbLoT'))LOC.text=g('mbLoT').value;if(g('mbLoK'))LOC.k=g('mbLoK').value;if(g('mbLoR'))LOC.rtext=g('mbLoR').value;if(g('mbLoG'))LOC.gtext=g('mbLoG').value;if(g('mbLoReg'))LOC.region=g('mbLoReg').value;if(g('mbLoEv'))LOC.eventDate=g('mbLoEv').value}
function localView(){const M=LOCM.find(x=>x[0]===LOC.mode)||LOCM[0];
 /* البحث والقضية: النموذج يميناً وحصيلة التحليل يساره في الأعلى */
 const split=(LOC.mode==='research'||LOC.mode==='case')&&!(LOC.res&&(LOC.kind==='dissect'||LOC.kind==='gaps')),H={};
 const body=LOC.res?(LOC.kind==='dissect'?locDissect(LOC.res,true):LOC.kind==='gaps'?locGaps(LOC.res,true):locResult(LOC.res,true,split?H:null)):'';
 const cs=(typeof cases!=='undefined'?cases:[]).filter(k=>!/مغلق|closed/.test(String(k.status||'')));
 if(LOC.mode==='ref')return `<section class="mb-card" id="mbLoc"><div class="mb-h"><div><h1 class="aq-t"><span class="aq-n">عقل القانون</span><i class="aq-d">—</i><span class="aq-m">مسبار</span><small class="aq-off">دون إنترنت</small></h1></div></div><div class="mb-tabs">${LOCM.map(([m,ic,t])=>`<button type="button" class="${LOC.mode===m?'on':''}" data-act="mbLocMode" data-v="${m}"><i>${ic}</i> ${t}${m==='ref'&&LOC.alerts&&LOC.alerts.alerts.length?` <b class="mbr-badge">${LOC.alerts.alerts.length}</b>`:''}</button>`).join('')}</div><p class="mb-tdesc">${e(M[3])}</p>${refView()}</section>`;
 if(LOC.mode==='dict')return `<section class="mb-card" id="mbLoc"><div class="mb-h"><div><h1 class="aq-t"><span class="aq-n">عقل القانون</span><i class="aq-d">—</i><span class="aq-m">مسبار</span><small class="aq-off">دون إنترنت</small></h1></div></div><div class="mb-tabs">${LOCM.map(([m,ic,t])=>`<button type="button" class="${LOC.mode===m?'on':''}" data-act="mbLocMode" data-v="${m}"><i>${ic}</i> ${t}</button>`).join('')}</div><p class="mb-tdesc">${e(M[3])}</p>${dictView()}${learnedView()}</section>`;
 const form=LOC.mode==='research'?`<label class="wide">السؤال أو الوقائع<textarea class="field" id="mbLoT" rows="6" maxlength="200000" placeholder="مثال: فصل صاحب العمل الموكل بتاريخ 3/2/2024 دون إشعار ولم يدفع مكافأة نهاية الخدمة؛ هل يستحق تعويضاً عن الفصل التعسفي وفق المادة 42 من قانون العمل الفلسطيني؟">${e(LOC.text)}</textarea></label>
   <div class="mb-loctx aqx-meta"><label class="mb-file">استيراد مستند (txt / docx)<input type="file" id="mbLoFile" accept=".txt,.docx,.md"></label><label>مكان الواقعة<select class="field" id="mbLoReg">${[['','غير محدد'],['wb','الضفة الغربية'],['gaza','قطاع غزة']].map(([v,t])=>`<option value="${v}" ${LOC.region===v?'selected':''}>${t}</option>`).join('')}</select></label><label>تاريخ الواقعة أو نشوء الحق<input class="field" type="date" id="mbLoEv" value="${e(LOC.eventDate)}"></label><small class="m">لفحص سريان النصوص: هل عُدّلت أو أُلغيت بعد هذا التاريخ، وهل تسري في منطقة الواقعة. إن تُرك التاريخ فارغاً يُؤخذ أقدم تاريخ في النص.</small></div>`
  :LOC.mode==='gaps'?`<label class="wide">المذكرة أو اللائحة كاملة<textarea class="field" id="mbLoG" rows="9" maxlength="200000" placeholder="الصق نص مذكرتك أو لائحتك كما كتبتها، بما فيها المواد والأحكام التي استشهدت بها">${e(LOC.gtext)}</textarea></label>
   <div class="mb-loctx aqx-meta"><label class="mb-file">استيراد (txt / docx)<input type="file" id="mbLoGFile" accept=".txt,.docx,.md"></label><label>مكان الواقعة<select class="field" id="mbLoReg">${[['','غير محدد'],['wb','الضفة الغربية'],['gaza','قطاع غزة']].map(([v,t])=>`<option value="${v}" ${LOC.region===v?'selected':''}>${t}</option>`).join('')}</select></label><label>تاريخ الواقعة أو نشوء الحق<input class="field" type="date" id="mbLoEv" value="${e(LOC.eventDate)}"></label></div>`
  :LOC.mode==='case'?`<label class="wide">القضية<select class="field" id="mbLoK"><option value="">— اختر القضية —</option>${cs.map(k=>`<option value="${e(k.id)}" ${LOC.k===k.id?'selected':''}>${e(k.no||'قيد التسجيل')} — ${e(k.subject||k.type||'')}</option>`).join('')}</select></label>   <div class="mb-loctx aqx-meta aqx-meta2"><label>مكان الواقعة<select class="field" id="mbLoReg">${[['','غير محدد'],['wb','الضفة الغربية'],['gaza','قطاع غزة']].map(([v,t])=>`<option value="${v}" ${LOC.region===v?'selected':''}>${t}</option>`).join('')}</select></label><label>تاريخ الواقعة أو نشوء الحق<input class="field" type="date" id="mbLoEv" value="${e(LOC.eventDate)}"></label><small class="m">لفحص سريان النصوص: هل عُدّلت أو أُلغيت بعد هذا التاريخ، وهل تسري في منطقة الواقعة. إن تُرك التاريخ فارغاً يُؤخذ أقدم تاريخ في النص.</small></div>`
  :`${LOC.rid?`<div class="mb-cmp">الحكم المختار من القاعدة: <b>${e(LOC.rtitle||'#'+LOC.rid)}</b> <button type="button" class="btn sm" data-act="mbLocClearR">إلغاء</button></div>`:`<label class="wide">نص الحكم<textarea class="field" id="mbLoR" rows="8" placeholder="الصق نص الحكم كاملاً، أو افتح حكماً من «البحث» واضغط «تشريح دون إنترنت»">${e(LOC.rtext)}</textarea></label>`}`;
 const step=(n,t,sub)=>`<div class="aqx-ch"><i>${n}</i><b>${t}</b>${sub?`<small>${sub}</small>`:''}</div>`;
 const inT={research:['السؤال أو الوقائع','اكتب كما تتكلم؛ يُفهم المصطلح القانوني المقابل'],case:['ملف القضية','يُقرأ ملفها ومستنداتها المقروءة على الجهاز'],gaps:['المذكرة أو اللائحة','الصقها كاملة كما كتبتها'],ruling:['نص الحكم','من القاعدة أو ملصقاً كاملاً']}[LOC.mode]||['المدخلات',''];
 return `<section class="mb-card aqx" id="mbLoc"><header class="aqx-hd"><h1 class="aq-t"><span class="aq-n">عقل القانون</span><i class="aq-d">—</i><span class="aq-m">مسبار</span><small class="aq-off">دون إنترنت</small></h1>
   <ul class="aqx-pr"><li>على هذا الجهاز وحده</li><li>نصوص حرفية بلا ذكاء اصطناعي</li><li>سبب ظهور كل نتيجة</li></ul></header>
  <div class="mb-tabs aqx-tabs">${LOCM.map(([m,ic,t])=>`<button type="button" class="${LOC.mode===m?'on':''}" data-act="mbLocMode" data-v="${m}"><i>${ic}</i> ${t}</button>`).join('')}</div>
  <p class="mb-tdesc aqx-desc">${e(M[3])}</p>
  <div class="aqx-grid ${split?'two':'one'}" id="mbLocTop"><form class="mb-labf aqx-card aqx-in" id="mbLocForm" autocomplete="off">${step(1,inT[0],inT[1])}${form}
   <div class="mb-labrow aqx-act"><button class="btn mb-go" id="mbLoGo" ${LOC.busy?'disabled':''}>${LOC.busy?'جارٍ التحليل على الجهاز…':'⛁ '+(LOC.mode==='ruling'?'تشريح الحكم':LOC.mode==='gaps'?'اكتشف ما فاتك':'ابحث واستقصِ')}</button>${LOC.mode==='case'||LOC.mode==='research'?`<button type="button" class="btn mb-go mb-insp" data-act="mbLocInspect" ${LOC.busy?'disabled':''} title="دورة كاملة: استخراج المسائل، بحث لكل مسألة مع إعادة محدودة، فحص السريان والمواعيد، مقارنة الأدلة بالمستندات، ثم خريطة المسألة">⟳ ${LOC.mode==='case'?'افحص ملف القضية':'حلّل ومحّص'}</button>`:''}${LOC.busy?`<span class="m">${LOC.kind==='inspect'?'دورة الفحص تعمل على الجهاز: مسائل ← بحث ← تمحيص ← أدلة…':'يبحث في القاعدة المحلية…'}</span>`:''}</div>
  </form>
  ${split?`<aside class="mbg mb-lside aqx-card aqx-out">${step(2,'حصيلة التحليل','تنقلك كل بطاقة إلى تفصيلها')}${H.hd||`<div class="mbg-hd mb-lwait"><div class="mbg-hl"><b>${LOC.busy?'جارٍ التحليل على الجهاز…':'حصيلة التحليل المحلي'}</b><span class="m">دون إنترنت</span></div><p class="mbg-note">${LOC.busy?'تُقرأ النصوص من القاعدة المحلية الآن.':'اكتب السؤال أو الوقائع ثم «ابحث واستقصِ»؛ تظهر هنا الحصيلة: التشريعات والمواد والأحكام والمواعيد، وكلٌّ منها ينقلك إلى تفصيله.'}</p><div class="mb-lgh">${['§','¶','⚖','⇄','⌁','⏱'].map((i,n)=>`<span style="--i:${n}">${i}</span>`).join('')}</div></div>`}</aside>`:''}</div>
  ${LOC.err?`<div class="mb-empty bad">${e(LOC.err)}</div>`:''}
  ${body?`<div class="aqx-res">${mmView(LOC.res,LOC.kind)}${step(split?3:2,'التفاصيل الكاملة','كل خلية في الخريطة تنقلك إلى تفصيلها هنا: النصوص بحروفها · الأحكام · المواعيد')}${body}</div>`:''}</section>`}
const locOpen=(id,t)=>`<button type="button" class="mb-ref" data-act="mbRefOpen" data-v="${id}">${e(t||'فتح النص')}</button>`;
const locQ=t=>`<blockquote class="mb-loq">${e(t).replace(/\n/g,'<br>')}</blockquote>`;
const dd=n=>n==null?'—':n===0?'اليوم نفسه':n<0?`بعد ${-n} يوماً`:`${n} يوماً`;
const fbBtns=(key,ui,title)=>ui?`<span class="mb-lofb">${[[1,'👍','مهم ومرتبط — قدّمه في الأسئلة المشابهة'],[2,'⚖','مخالف يستحق الدراسة — يُعرض في «الرأي المعارض» ولا يُخفى'],[-1,'👎','غير مرتبط — لا تُظهره في الأسئلة المشابهة']].map(([v,ic,t])=>`<button type="button" class="${LOC.fb[key]===v?'on':''}" data-act="mbLocFb" data-v="${e(key+'|'+v)}" title="${t}" aria-label="${t}" aria-pressed="${LOC.fb[key]===v}">${ic}</button>`).join('')}</span>`:'';
const VL={bad:['⛔','bad'],warn:['⚠','warn'],info:['ⓘ','info']};
const vflags=(v,ui)=>v&&(v.flags||[]).length?`<ul class="mb-lov">${v.flags.map(f=>`<li class="${(VL[f.level]||VL.info)[1]}"><span>${(VL[f.level]||VL.info)[0]}</span> ${e(f.text)}${ui&&f.note&&f.note.instId?` ${locOpen(f.note.instId,'فتح '+(f.note.label||'أداة التعديل'))}`:f.note&&f.note.instNoText?' <small>(أداة التعديل مسجّلة في القاعدة بلا نص)</small>':f.note&&f.note.no?' <small>(أداة التعديل غير موجودة في القاعدة)</small>':''}</li>`).join('')}</ul>`:'';
const addDays=(iso,n,y)=>{const d=new Date(iso+'T00:00:00Z');if(isNaN(d))return null;if(y)d.setUTCFullYear(d.getUTCFullYear()+y);else d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const dlCalc=(x,from)=>{if(!x.days||!from)return '';const end=addDays(from,x.days,x.years);if(!end)return '';const left=Math.round((Date.parse(end)-Date.parse(new Date().toISOString().slice(0,10)))/864e5);return `آخر يوم: <b class="mono">${end}</b> — ${left<0?`انقضى منذ ${-left} يوماً`:left===0?'اليوم آخر يوم':`باقٍ ${left} يوماً`}`+(window.MQ_CAL&&!x.years?MQ_CAL.note(end):'')};
document.addEventListener('input',ev=>{const t=ev.target;if(!t||!t.dataset||!t.dataset.dl||!LOC.res)return;const x=(LOC.res.deadlines||[]).find(d=>d.id===t.dataset.dl);const o=document.getElementById('dlo_'+t.dataset.dl);if(x&&o)o.innerHTML=dlCalc(x,t.value)});
function locList(r,ui){
 const sec=(t,body,n)=>body?`<section class="mb-los"><h3>${t}${n!=null?` <small>(${n})</small>`:''}</h3>${body}</section>`:'';
 const cits=(r.citations||[]).map(c=>`<div class="mb-loa ${c.found?'':'miss'}"><div class="mb-loh"><b>${e(c.label||('المادة '+c.article))}</b> ${c.lawTitle?`من ${e(c.lawTitle)}`:''} ${c.status?`<span class="mb-st">${e(c.status)}</span>`:''}${c.repealed?'<span class="mb-st bad">ملغاة</span>':''}${ui&&c.lawId?locOpen(c.lawId,'التشريع كاملاً'):''}</div>${c.found?vflags(c.valid,ui)+locQ(c.text):`<p class="m">${e(c.note||'')}</p>`}<small class="m">وردت في نصك: «${e(c.ctx)}»</small></div>`).join('');
 const laws=(r.laws||[]).map(l=>`<div class="mb-lol"><div class="mb-loh"><b>${e(l.title)}</b> <span class="mb-st">${e(l.status||'')}</span>${l.topic?`<span class="mb-chip">${e(l.topic)}</span>`:''}${ui?locOpen(l.lawId,'التشريع كاملاً'):''}</div>${vflags(l.valid,ui)}${(l.articles||[]).map(a=>`<div class="mb-loa ${a.pinned?'pin':''}"><div class="mb-loh"><b>${e(a.label)}</b> <small class="m">${e(a.why)}</small>${ui?`<span class="mb-lofb"><button type="button" data-act="mbLocPin" data-v="${e(l.lawId+'|'+a.n+'|'+a.label+'|'+l.title)}" title="تثبيت هذه المادة لموضوع في قاموس المكتب">📌</button></span>`:''}${fbBtns('A:'+l.lawId+':'+a.n,ui)}</div>${vflags(a.valid&&{flags:a.valid.flags.filter(f=>f.note)},ui)}${locQ(a.text)}</div>`).join('')||'<p class="m">لم تُطابَق مادة بعينها مع كلمات نصك؛ افتح التشريع كاملاً.</p>'}</div>`).join('');
 const rul=(arr,cmp)=>(arr||[]).map(x=>`<div class="mb-lor ${cmp?'cmp':''}"><div class="mb-loh"><b>${e(x.title)}</b>${fbBtns('R:'+x.id,ui)}${ui?locOpen(x.id,'نص الحكم'):''}</div><div class="m">${e([x.court,x.case_no&&'رقم '+x.case_no,x.date,x.source].filter(Boolean).join(' · '))}${cmp?' — للمقارنة والاستئناس، غير ملزم أمام المحاكم الفلسطينية':''}</div>${x.excerpt?`<p class="mb-lox">${e(x.excerpt)}</p>`:''}${(x.cites||[]).length?`<div class="mb-locs">${x.cites.map(c=>`<span class="mb-chip">${e(c)}</span>`).join('')}</div>`:''}<div class="mb-low">ظهر بسبب: ${(x.why||[]).map(e).join(' · ')}</div></div>`).join('');
 const tl=(r.timeline||[]).length?`<table class="mb-lot"><thead><tr><th>التاريخ</th><th>عن السابق</th><th>حتى اليوم</th><th>السياق</th></tr></thead><tbody>${r.timeline.map(t=>`<tr><td class="mono">${e(t.date)}${t.times>1?` <small>×${t.times}</small>`:''}</td><td>${dd(t.sincePrev)}</td><td>${t.fromToday<0?'بعد '+(-t.fromToday)+' يوماً':t.fromToday+' يوماً'}</td><td>${e(t.ctx)}</td></tr>`).join('')}</tbody></table>`:'';
 const am=(r.amounts||[]).length?`<ul class="mb-lom">${r.amounts.map(a=>`<li><b class="mono">${Number(a.value).toLocaleString('en')}</b> ${e(a.currency)} — <small class="m">${e(a.ctx)}</small></li>`).join('')}</ul><p class="m">المجموع الحسابي لما ورد: ${Object.entries(r.amountTotals||{}).map(([c,v])=>Number(v).toLocaleString('en')+' '+e(c)).join(' · ')} (قد يتكرر المبلغ نفسه في النص)</p>`:'';
 const X=r.ctx||{},reg={wb:'الضفة الغربية',gaza:'قطاع غزة'}[X.region]||'غير محدد';
 const ctxb=`<div class="mb-cmp mb-ctxb"><b>فحص السريان:</b> مكان الواقعة: ${e(reg)} · تاريخ الواقعة: ${X.eventDate?`<b class="mono">${e(X.eventDate)}</b>${X.eventFrom==='text'?' (أقدم تاريخ في النص؛ إن لم يكن تاريخ نشوء الحق فاكتبه في الحقل أعلاه)':''}`:'غير محدد (لن يُفحص التعديل الزمني)'}</div>`;
 const jur=r.jurisdiction?`<div class="mb-loa"><div class="mb-loh"><b>الاختصاص القيمي</b> <small class="m">من ${e(r.jurisdiction.lawTitle)}</small></div>${r.jurisdiction.verdict?`<p><b>${e(r.jurisdiction.verdict)}</b></p>`:''}${r.jurisdiction.note?`<p class="m">${e(r.jurisdiction.note)}</p>`:''}${vflags(r.jurisdiction.valid,ui)}<details><summary>نص المادتين</summary>${r.jurisdiction.articles.map(a=>`<b>${e(a.label)}</b>${locQ(a.text)}`).join('')}</details></div>`:'';
 const lastDate=((r.timeline||[]).slice(-1)[0]||{}).date||'';
 const dls=(r.deadlines||[]).length?`<table class="mb-lot mb-dlt"><thead><tr><th>الميعاد</th><th>المدة كما في النص</th><th>من تاريخ (التبليغ أو الصدور)</th><th>النتيجة</th></tr></thead><tbody>${r.deadlines.map(x=>`<tr><td><b>${e(x.label)}</b><br><small class="m">${e(x.articleLabel)} من ${e(x.lawTitle)}</small>${vflags(x.valid&&{flags:x.valid.flags.filter(f=>f.note||f.level==='bad')},ui)}<details><summary>نص المادة</summary>${locQ(x.text)}</details></td><td>${x.days?(x.years?x.years+' سنة':x.days+' يوماً'):'<span class="m">لم تُطابَق المدة في النص المخزّن؛ اقرأ المادة</span>'}</td><td>${x.days&&ui?`<input type="date" class="field" data-dl="${e(x.id)}" value="${e(lastDate)}">`:''}</td><td id="dlo_${e(x.id)}">${dlCalc(x,lastDate)}</td></tr>`).join('')}</tbody></table>${r.countRule?`<details><summary>كيف تُحسب المواعيد: ${e(r.countRule.label)} من ${e(r.countRule.lawTitle)}</summary>${locQ(r.countRule.text)}</details>`:''}<p class="m">الحساب تقويمي تقريبي لا يُحسب فيه يوم التبليغ؛ والعطل الرسمية وبدء الميعاد من التبليغ أو الصدور يُراجع في النص.</p>`:'';
 const tr=r.timeRule?`<div class="mb-loa"><div class="mb-loh"><b>سريان القانون من حيث الزمان: ${e(r.timeRule.label)}</b> <small class="m">من ${e(r.timeRule.lawTitle)}</small></div><p class="m">في النتائج نصوص من هذا القانون عُدّلت بعد تاريخ الواقعة؛ هذه المادة تحدد أيّ النصين يسري على الإجراءات.</p>${locQ(r.timeRule.text)}</div>`:'';
 const ci=r.caseInfo?`<div class="mb-cmp">قُرئ ملف القضية و${r.caseInfo.read} من ${r.caseInfo.docs} مستنداً${(r.caseInfo.unread||[]).length?` — لم تُقرأ بعد: ${r.caseInfo.unread.map(e).join('، ')} (اقرأها من تبويب المسبار في القضية)`:''}.</div>`:'';
 return `<section class="mb-labres" id="mbLocRes"><div class="mb-rh"><b>${e(r.title||'حصيلة التحليل المحلي')}</b><span class="m">${r.ms!=null?(r.ms<1000?'استغرق أقل من ثانية على الجهاز':'استغرق '+(r.ms/1000).toFixed(1)+' ث على الجهاز'):''}</span></div>
  <div class="mb-cmp">${e(r.notice||'')}</div>${ci}${(()=>{const L=r.learned||{},p=[];if(L.pinned)p.push(L.pinned+' مادة مثبّتة في قاموس المكتب');if(L.boosted)p.push('رُفعت '+L.boosted+' نتيجة قيّمها المكتب مفيدة');if(L.hidden)p.push('أُخفيت '+L.hidden+' نتيجة قيّمها المكتب غير ذات صلة');if((L.synonyms||[]).length)p.push('بُحث أيضاً بمرادفات القاموس: '+L.synonyms.join('، '));return p.length?`<div class="mb-cmp mb-learn">✎ ما تعلّمه المسبار من مكتبك: ${p.map(e).join(' · ')}</div>`:''})()}
  ${(r.topics||[]).length?`<div class="mb-locs">${r.topics.map(t=>`<span class="mb-chip on" title="${e('الكلمات: '+t.hits.join('، '))}">${e(t.label)}</span>`).join('')}<small class="m"> كلمات البحث: ${e((r.keyterms&&r.keyterms.terms||[]).join('، '))}</small></div>`:''}
  ${ctxb}${locPen(r,false)}${sec('المواد المذكورة في النص',cits,(r.citations||[]).length)}${sec('التشريعات المعنية وأقرب موادها',laws)}${sec('أحكام فلسطينية',rul(r.rulings),(r.rulings||[]).length)}${sec('للمقارنة والاستئناس (الأردن ومصر)',rul(r.comparative,true),(r.comparative||[]).length)}
  ${sec('الاختصاص والمواعيد وسريان القانون',jur+tr+dls)}
  ${sec('التسلسل الزمني والمدد',tl,(r.timeline||[]).length)}${sec('المبالغ',am)}${sec('أرقام دعاوى وطلبات وردت',(r.caseNos||[]).length?`<ul>${r.caseNos.map(c=>`<li><b class="mono">${e(c.no)}</b> ${e(c.kind)} — <small class="m">${e(c.ctx)}</small></li>`).join('')}</ul>`:'')}
  ${ui?`<div class="mb-tools"><button class="btn sm" data-act="mbLocCopy">نسخ التقرير</button><button class="btn sm" data-act="mbLocPrint">طباعة A4</button></div>`:''}</section>`}
/* لوحة النتائج الهندسية للتحليل المحلي: مخطط ترابط بين المواد والأحكام، ومساران متمايزان للتشريع والقضاء. النصوص القانونية تُعرض كاملة كما هي */
const BN=s=>String(s||'').replace(/[ً-ْـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/[()\[\]«»"'.,،:\-–\s]/g,'').replace(/م$/,'');
const BTIER=c=>{c=String(c||'');return /نقض|العليا|عليا|تمييز|الدستورية/.test(c)?['top','نقض / عليا']:/استئناف/.test(c)?['app','استئناف']:/بداية|صلح|ابتدائ|جزئ/.test(c)?['first','أول درجة']:['oth','محكمة']};
const BYEAR=x=>{const m=String(x.date||'').match(/(19|20)\d\d/)||String(x.title||'').match(/(19|20)\d\d/);return m?+m[0]:null};
const BCN=c=>{const m=String(c||'').match(/(?:الماده|المادة|مادة|ماده)\s*(?:رقم\s*)?\(?\s*(\d+)/);return m?m[1]:null};
function locLinks(r){
 const laws=r.laws||[],R=[...(r.rulings||[]).map((x,i)=>({x,id:'mbgR'+i,cmp:false})),...(r.comparative||[]).map((x,i)=>({x,id:'mbgC'+i,cmp:true}))];
 const A={},E=[],LN=laws.map(l=>BN(l.title));
 laws.forEach((l,li)=>(l.articles||[]).forEach((a,ai)=>{A[li+':'+a.n]='mbgA'+li+'_'+ai}));
 R.forEach(rr=>{rr.links=[];(rr.x.cites||[]).forEach(c=>{const n=BCN(c),nc=BN(c);const li=LN.findIndex(t=>t&&nc.includes(t));if(li<0)return;const to=n&&A[li+':'+n]||'mbgL'+li;rr.links.push({c,to});E.push({from:rr.id,to,cmp:rr.cmp})})});
 const back={};E.forEach(x=>{(back[x.to]=back[x.to]||[]).push(x.from)});
 return {R,E,back};
}
/* ══ خريطة الاستدلال القانوني (Misbar Legal Knowledge Graph) ══
   طبقات تُقرأ من اليمين: المسألة ← التشريعات وموادها ← الأحكام ← الاستنباط (مؤيد / مخالف / يتطلب تحققاً).
   لون الخط لغة قانونية مبنية على بيانات فعلية فقط:
     ذهبي متصل  = استناد مسجّل في القاعدة (الحكم ذكر المادة مع اسم قانونها)
     أخضر مزرق  = تحقّق منه المكتب (قيّمه مهماً أو ربطه بقضية)
     أحمر متقطع = اتجاه مخالف: وسمه المكتب مخالفاً، أو طبّق المادة نفسها بنتيجة معاكسة لأحكام أخرى
     رمادي منقّط = صلة مقترحة بالكلمات أو بالمعنى لم يتحقق منها شيء
   «مخطط فكر المحامي»: الرحلة كاملة من الوقائع إلى المسائل والنصوص والأحكام والحجج وما يلزم التحقق منه.
   تخطيط محسوب بالكامل (لا قياس للصفحة): بطاقات ثابتة الارتفاع، ترتيب الأحكام بمركز ثقل موادها لتقليل التقاطع، وتجميع الخطوط الواردة إلى المادة نفسها في حزمة. */
const RG={info:{},view:'map',z:1,x:0,y:0,hide:{},depth:2};
const RGT={cite:['يستند إلى','استناد مسجّل في القاعدة','#B8892E'],ok:['تحقّق منه المكتب','قيّمه مكتبك مهماً أو ربطه بقضية','#2A8C8A'],opp:['اتجاه مخالف','وسمه المكتب مخالفاً، أو نتيجة معاكسة لأحكام طبّقت المادة نفسها','#B0503A'],sug:['صلة مقترحة','بالكلمات أو بالمعنى — لم يُتحقق منها','#8E98A3'],amd:['يعدّل','عُدّلت المادة بتشريع لاحق — من فحص السريان في القاعدة','#7A5AB8']};
const rgOc=x=>Array.isArray(x.outcome)?x.outcome.join('، '):String(x.outcome||'');
function rgShort(t,n){t=String(t||'').replace(/\s+/g,' ').trim();return t.length>n?t.slice(0,n-1)+'…':t}
/* المحرّك: أعمدة من اليمين، عقد ثابتة الارتفاع، خطوط منحنية مع حزم */
function rgEngine(spec){
 const CW=246,GAP=136,PAD=34,TOP=74,cols=spec.cols,W=PAD*2+cols.length*CW+(cols.length-1)*GAP;
 const colX=ci=>W-PAD-(ci+1)*CW-ci*GAP,P={};
 const hs=cols.map((c,ci)=>spec.nodes.filter(n=>n.col===ci).reduce((s,n)=>s+(n.h||56)+(n.gap||10),0));
 const H=Math.max(...hs,220)+TOP+40;
 cols.forEach((c,ci)=>{let y=TOP+(H-TOP-40-hs[ci])/2;for(const n of spec.nodes.filter(n=>n.col===ci)){const h=n.h||56;P[n.id]={x:colX(ci)+(n.ind||0),y,w:CW-(n.ind||0),h,n};y+=h+(n.gap||10)}});
 /* حزم: خطوط من النوع نفسه إلى العقدة نفسها من ثلاثة مصادر فأكثر تلتقي في نقطة قبلها ثم جذع واحد بعددها */
 const groups={};spec.edges.forEach((ed,i)=>{if(!P[ed.from]||!P[ed.to])return;const k=ed.to+'|'+ed.type;(groups[k]=groups[k]||[]).push(i)});
 const side=(a,b)=>{const A=P[a],B=P[b];return A.x>B.x?[A.x,A.y+A.h/2,B.x+B.w,B.y+B.h/2]:[A.x+A.w,A.y+A.h/2,B.x,B.y+B.h/2]};
 const curve=(x1,y1,x2,y2)=>{const dx=Math.max(40,Math.abs(x2-x1)*.5)*(x2<x1?-1:1);return `M${x1.toFixed(1)},${y1.toFixed(1)} C${(x1+dx).toFixed(1)},${y1.toFixed(1)} ${(x2-dx).toFixed(1)},${y2.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`};
 let paths='',badges='',k=0;const done=new Set();
 let pk=0;const ep=(ed,d,cls,lab)=>{const n=k,id='rgE'+(k++);RG.info[id]=ed.info||{};RG.info[id].type=ed.type;
  /* نبضة ضوء تسري على الخط من المصدر إلى الهدف: ذهبية للاستناد، فيروزية لما تحقّق منه المكتب، حمراء للمخالف؛ لا نبض للمقترح غير المتحقق منه */
  const live=ed.type!=='sug'&&pk++<90,dur=(3.4+(n%5)*.45).toFixed(2),beg=(-(n*.73)%3.4).toFixed(2);
  return `<g class="rg-e ${ed.type} ${cls||''}" style="--d:${Math.min(n*.035,1.2).toFixed(3)}s" data-rge="${id}" data-rg="${ed.from} ${ed.to}"><path class="hit" d="${d}"/><path class="ln" id="${id}" d="${d}"${ed.type==="cite"||ed.type==="ok"?' pathLength="1"':''} marker-end="url(#rgM-${ed.type})"/><path class="fl" d="${d}"/>${live?`<circle class="rg-pk" r="${cls==='trunk'?4.2:cls==='bun'?2.4:3.2}"><animateMotion dur="${dur}s" begin="${beg}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines=".45 0 .55 1"><mpath href="#${id}"/></animateMotion></circle>`:''}${lab?`<text dy="-5"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${e(lab)}</textPath></text>`:''}</g>`};
 for(const [key,idx] of Object.entries(groups)){
  const es=idx.map(i=>spec.edges[i]);
  if(es.length>=3){const [to,type]=key.split('|'),B=P[to],from0=P[es[0].from],dir=from0.x>B.x?1:-1,bx=dir>0?B.x+B.w+58:B.x-58,by=B.y+B.h/2,tx=dir>0?B.x+B.w:B.x;
   for(const ed of es){const A=P[ed.from],sx=dir>0?A.x:A.x+A.w;paths+=ep(ed,curve(sx,A.y+A.h/2,bx,by),'bun',null)}
   paths+=ep({from:es.map(x=>x.from).join(' '),to,type,info:{bundle:es.map(x=>x.info||{}),label:RGT[type][0],toTitle:B.n.title}},`M${bx},${by} L${tx},${by}`,'trunk',null);
   badges+=`<g class="rg-bdg ${type}" transform="translate(${bx},${by})" data-rg="${es.map(x=>x.from).join(' ')} ${to}"><circle class="rg-ring" r="13"/><circle r="13"/><text dy="4">${es.length}</text></g>`;idx.forEach(i=>done.add(i))}}
 spec.edges.forEach((ed,i)=>{if(done.has(i)||!P[ed.from]||!P[ed.to])return;const [x1,y1,x2,y2]=side(ed.from,ed.to);paths+=ep(ed,curve(x1,y1,x2,y2),'',ed.label||RGT[ed.type][0])});
 const heads=cols.map((c,ci)=>`<div class="rg-ch" style="--d:${(ci*.22).toFixed(2)}s;left:${colX(ci)}px;width:${CW}px"><i>${ci+1}</i><b>${e(c.t)}</b>${c.s?`<small>${e(c.s)}</small>`:''}</div>`).join('');
 const nodes=spec.nodes.map(n=>{const p=P[n.id];const ci=n.col,ri=spec.nodes.filter(z=>z.col===ci).indexOf(n);return `<div class="rg-n ${n.kind} ${n.cls||''}" data-rgn="${n.id}" style="--d:${(ci*.22+ri*.045).toFixed(3)}s;left:${p.x}px;top:${p.y}px;width:${p.w}px;height:${p.h}px" title="${e(n.tip||n.title)}">${n.ic?`<i class="ic">${n.ic}</i>`:''}<div class="tx"><b>${e(n.title)}</b>${n.sub?`<span>${e(n.sub)}</span>`:''}</div>${n.badge?`<em>${e(n.badge)}</em>`:''}${n.go?`<button type="button" class="rg-go" data-mbgo="${n.go}" title="اذهب إلى تفصيله في اللوحة">↗</button>`:''}${n.open?`<button type="button" class="rg-go" data-act="mbRefOpen" data-v="${n.open}" title="افتح النص كاملاً">⌕</button>`:''}</div>`}).join('');
 const mk=Object.entries(RGT).map(([t,[, ,c]])=>`<marker id="rgM-${t}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" fill="${c}"/></marker>`).join('');
 return {W,H,html:`<div class="rg-cv" style="width:${W}px;height:${H}px">${heads}<svg class="rg-s" width="${W}" height="${H}" style="width:${W}px;height:${H}px" viewBox="0 0 ${W} ${H}"><defs>${mk}<filter id="rgGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${paths}${badges}</svg>${nodes}</div>`};
}
/* بيانات الخريطة من نتيجة التحليل نفسها */
function rgMapSpec(r,L){
 const laws=r.laws||[],R=L.R,nodes=[],edges=[],topics=(r.topics||[]).map(t=>t.label);
 nodes.push({id:'rgQ',col:0,kind:'q',ic:'◉',title:topics.slice(0,2).join(' · ')||'المسألة',sub:rgShort(r.title||((r.keyterms||{}).terms||r.qterms||[]).join('، '),90),h:96,tip:r.title});
 const artId={};let amdN=0;
 laws.forEach((l,li)=>{nodes.push({id:'rgL'+li,col:1,kind:'law',ic:'§',title:rgShort(l.title.replace(/\s*رقم\s*\(?\d+\)?\s*لسن[ةه]\s*\d+م?\.?$/,''),40),sub:(l.articles||[]).length+' مادة'+(l.topic?' · '+l.topic:''),go:'mbgL'+li,h:52,gap:6,tip:l.title});
  edges.push({from:'rgQ',to:'rgL'+li,type:/استندت إليه/.test(l.topic||'')?'cite':'sug',label:/استندت إليه/.test(l.topic||'')?'استندت إليه الأحكام':'موضوع المسألة',info:{a:'المسألة',b:l.title,why:/استندت إليه/.test(l.topic||'')?'أضيف لأن أحكاماً معروضة استندت إلى مواده كما سجّلتها القاعدة.':'اختير لأن كلمات السؤال تطابق موضوع «'+(l.topic||'')+'».'}});
  (l.articles||[]).forEach((a,ai)=>{const id='rgA'+li+'_'+ai;artId['mbgA'+li+'_'+ai]=id;
   const ok=a.pinned||a.liked,sem=a.sem,rel=a.relied;
   nodes.push({id,col:1,kind:'art',ind:18,cls:(ok?'ok ':'')+(sem?'sem':''),title:a.label,sub:rgShort(a.text,58),badge:rel?rel+' ⚖':(a.pinned?'📌':''),go:'mbgA'+li+'_'+ai,h:50,gap:(ai===l.articles.length-1?16:6),tip:a.label+' — '+rgShort(a.text,300)});
   if(ok)edges.push({from:'rgA'+li+'_'+ai,to:'rgQ',type:'ok',label:a.pinned?'مثبّتة في قاموس المكتب':'قيّمها المكتب مهمة',info:{a:a.label,b:'المسألة',why:a.pinned?'ثبّتها مكتبك لهذا الموضوع في قاموس المسبار.':'قيّمها مكتبك «مهمة» في أسئلة مشابهة ('+a.liked+').',art:a.text}});
   else if(sem)edges.push({from:'rgA'+li+'_'+ai,to:'rgQ',type:'sug',label:'قريبة في المعنى',info:{a:a.label,b:'المسألة',why:'وجدها البحث الدلالي على الجهاز؛ لم تتطابق كلماتها مع السؤال. تحقّق من انطباقها.',art:a.text}});
   /* «يعدّل»: التشريع المعدِّل كما سجّله فحص السريان في القاعدة (لا تقدير)، عقدة صغيرة تحت المادة */
   ((a.valid&&a.valid.notes)||[]).filter(n=>n.type==='amended'&&n.label).slice(0,2).forEach((n,ni)=>{if(amdN>=8)return;amdN++;const aid=id+'_m'+ni;
    nodes.push({id:aid,col:1,kind:'amd',ind:36,ic:'✎',title:n.label,sub:n.byArticle?'بموجب مادته ('+n.byArticle+')':'تعديل مسجّل',h:40,gap:6,open:n.instId||'',tip:(n.instTitle||n.label)+(n.year?' — '+n.year:'')});
    edges.push({from:aid,to:id,type:'amd',label:'يعدّل',info:{a:n.instTitle||n.label,b:a.label,why:'سجّلت القاعدة أن '+a.label+' عُدّلت بموجب '+(n.byArticle?'المادة ('+n.byArticle+') من ':'')+n.label+'. تأكد من النص الساري وقت الواقعة قبل الاستشهاد بها.',art:a.text,id:n.instId||''}})})})});
 /* ترتيب الأحكام بمركز ثقل المواد التي تستند إليها: يقلّل تقاطع الخطوط */
 const order={};nodes.filter(n=>n.col===1).forEach((n,i)=>order[n.id]=i);
 const tgt=q=>(q.links||[]).map(x=>artId[x.to]||(x.to.startsWith('mbgL')?'rgL'+x.to.slice(4):null)).filter(Boolean);
 const bc=q=>{const t=tgt(q);return t.length?t.reduce((s,x)=>s+(order[x]||0),0)/t.length:1e6+(q.cmp?1e3:0)};
 const RS=[...R].sort((a,b)=>bc(a)-bc(b));
 const split={};((r.opposing||{}).split||[]).forEach(s=>{(s.for||[]).forEach(x=>split[x.id]={cite:s.cite,side:'لصالح الطاعن أو المتهم',other:(s.against||[]).length});(s.against||[]).forEach(x=>split[x.id]={cite:s.cite,side:'بالرد أو الإدانة',other:(s.for||[]).length})});
 const bk={ok:[],opp:[],sug:[]};
 const rid={};
 RS.forEach(q=>{const x=q.x,[tc,tl]=BTIER(x.court),yr=BYEAR(x),id='rgR_'+q.id;rid[x.id]=id;
  nodes.push({id,col:2,kind:'rul',cls:(q.cmp?'cmp':'rg-t-'+tc)+(x.contra?' opp':'')+(x.liked||x.linked?' ok':''),ic:'⚖',title:(q.cmp?(/أردن|تمييز/.test(x.court+(x.source||''))?'الأردن':'مصر'):tl)+(x.case_no?' · '+x.case_no:'')+(yr?' · '+yr:''),sub:rgShort(rgOc(x)||x.court||'',44),go:q.id,open:x.id,h:52,gap:8,tip:x.title});
  const t=tgt(q);
  q.links.forEach(lk=>{const to=artId[lk.to]||(lk.to.startsWith('mbgL')?'rgL'+lk.to.slice(4):null);if(!to)return;
   edges.push({from:id,to,type:q.cmp?'sug':'cite',info:{a:x.title,b:(nodes.find(n=>n.id===to)||{}).tip,why:(q.cmp?'حكم مقارن (غير ملزم) ذكر المادة. ':'')+'سجّلت القاعدة أن الحكم استند إلى: «'+lk.c+'»'+((x.why||[]).some(w=>/^المادة|ماده/.test(w))?'، وتحقّق المسبار من ورود رقم المادة مع اسم قانونها في نص الحكم.':'.'),ex:x.excerpt,id:x.id,art:((laws[+lk.to.slice(4).split('_')[0]]||{}).articles||[])[+lk.to.split('_')[1]]?.text}})});
  if(x.liked||x.linked)bk.ok.push([id,{a:x.title,b:'يدعم الحجة',why:[x.liked?'قيّمه مكتبك «مهماً» ×'+x.liked:'',x.linked?'ربطه مكتبك بقضية ×'+x.linked:''].filter(Boolean).join(' · '),ex:x.excerpt,id:x.id}]);
  if(x.contra||split[x.id])bk.opp.push([id,{a:x.title,b:'اتجاه مخالف',why:[x.contra?'وسمه مكتبك «مخالفاً يستحق الدراسة» ×'+x.contra:'',split[x.id]?'طبّق '+split[x.id].cite+' وانتهى '+split[x.id].side+'، بينما انتهت '+split[x.id].other+' أحكام أخرى طبّقت المادة نفسها إلى النتيجة المعاكسة (تصنيف المنطوق آلي).':''].filter(Boolean).join(' · '),ex:x.excerpt,id:x.id}]);
  if(!q.cmp&&!t.length&&!(x.liked||x.linked))bk.sug.push([id,{a:x.title,b:'يتطلب تحققاً',why:'وُجد بمطابقة كلمات السؤال ('+(x.why||[]).join('، ')+')، ولم تسجّل القاعدة استناده إلى مادة من المواد المعروضة، ولم يقيّمه المكتب. اقرأه قبل الاعتماد عليه.',ex:x.excerpt,id:x.id}])});
 const B=[['ok','✓','يدعم الحجة','ما تحقّق منه مكتبك'],['opp','⚔','اتجاه مخالف','ما قد يُحتجّ به ضدك'],['sug','?','يتطلب تحققاً','صلة لم يتحقق منها شيء']];
 B.forEach(([t,ic,ti,su])=>{nodes.push({id:'rgB_'+t,col:3,kind:'bk '+t,ic,title:ti,sub:su,badge:String(bk[t].length),go:t==='opp'?'mbgOpp':'',h:76,gap:26});bk[t].forEach(([from,info])=>edges.push({from,to:'rgB_'+t,type:t,label:'',info}))});
 /* الحجج والدفوع: مقاطع حرفية من الأحكام المعروضة نفسها — ما اشترطته المحاكم، وما ورد فيها من دفوع وما ردّت به */
 [['req','▤','ما اشترطته المحاكم','شروط وإثبات وردت حرفياً',r.requisites,'mbgReq'],['def','⛨','الدفوع وما رُدّ به','دفوع أُثيرت في الأحكام نفسها',r.defenses,'mbgDef']].forEach(([k,ic,ti,su,xs,go])=>{xs=(xs||[]).filter(x=>rid[x.id]);if(!xs.length)return;
  nodes.push({id:'rgP_'+k,col:3,kind:'arg '+k,ic,title:ti,sub:su,badge:String(xs.length),go,h:70,gap:18});
  const seen=new Set();xs.forEach(x=>{if(seen.has(x.id))return;seen.add(x.id);edges.push({from:rid[x.id],to:'rgP_'+k,type:'cite',label:'ورد في نصه',info:{a:x.title,b:ti,why:'مقطع منقول حرفياً من نص هذا الحكم. صلته بوقائعك يقدّرها المحامي.',ex:x.text,id:x.id}})})});
 return {cols:[{t:'المسألة',s:'من كلمات سؤالك'},{t:'التشريعات والمواد',s:'نصوص مطابقة'},{t:'الأحكام والاجتهادات',s:'مرتبة بموادها'},{t:'الاستنباط',s:'مؤيد · مخالف · يتطلب تحققاً'}],nodes,edges};
}
/* مخطط فكر المحامي: من الوقائع إلى ما يلزم فعله */
function rgJourneySpec(r,L){
 const nodes=[],edges=[],I=r.inspect,laws=r.laws||[];
 const facts=[...(r.topics||[]).map(t=>({t:t.label,s:(t.hits||[]).slice(0,3).join('، ')})),...(r.dates||[]).slice(0,2).map(d=>({t:'تاريخ '+d.date,s:rgShort(d.ctx,40)}))].slice(0,5);
 nodes.push({id:'jF',col:0,kind:'q',ic:'✎',title:'الوقائع',sub:rgShort(r.title||((r.keyterms||{}).terms||r.qterms||[]).join('، '),80),h:80,gap:14});
 facts.forEach((f,i)=>nodes.push({id:'jF'+i,col:0,kind:'fact',ind:16,title:f.t,sub:f.s,h:46,gap:6}));
 const iss=I?I.issues:(r.topics||[]).map(t=>({label:t.label,laws:[],found:true}));
 iss.slice(0,6).forEach((x,i)=>{nodes.push({id:'jI'+i,col:1,kind:'iss',cls:x.found===false?'nf':'',ic:'◈',title:x.label,sub:x.found===false?'لم يجد المسبار مراجع':(x.rulings!=null?x.rulings+' حكم':''),h:52,gap:10});edges.push({from:'jF'+Math.min(i,Math.max(0,facts.length-1)),to:'jI'+i,type:facts.length?'cite':'sug',label:'',info:{a:'الوقائع',b:x.label,why:'مسألة استُخرجت من كلمات الوقائع'+((x.facts||[]).length?': «'+x.facts.slice(0,2).join('»، «')+'»':'')+'.'}})});
 laws.forEach((l,li)=>{nodes.push({id:'jL'+li,col:2,kind:'law',ic:'§',title:rgShort(l.title.replace(/\s*رقم\s*\(?\d+\)?\s*لسن[ةه]\s*\d+م?\.?$/,''),40),sub:'م '+(l.articles||[]).map(a=>a.n).slice(0,6).join('، '),go:'mbgL'+li,h:52,gap:8,tip:l.title});
  const i=iss.findIndex(x=>(x.laws||[]).some(z=>z.title===l.title)||(l.topic&&x.label===l.topic));edges.push({from:'jI'+Math.max(0,i),to:'jL'+li,type:i>=0?'cite':'sug',label:'',info:{a:(iss[Math.max(0,i)]||{}).label,b:l.title,why:i>=0?'المسألة تحكمها مواد هذا التشريع كما وُجدت في القاعدة.':'صلة بالموضوع العام.'}})});
 const P=(r.rulings||[]),grp={};P.forEach(x=>{const k=(Array.isArray(x.outcome)?x.outcome[0]:x.outcome)||'منطوق غير مصنّف';(grp[k]=grp[k]||[]).push(x)});
 Object.entries(grp).forEach(([k,xs],gi)=>{nodes.push({id:'jR'+gi,col:3,kind:'rul',ic:'⚖',title:k,sub:xs.slice(0,3).map(x=>x.case_no).filter(Boolean).join(' · '),badge:String(xs.length),go:'mbgRul',h:52,gap:8});
  laws.forEach((l,li)=>{const n=xs.filter(x=>(x.cites||[]).some(c=>BN(c).includes(BN(l.title)))).length;if(n)edges.push({from:'jL'+li,to:'jR'+gi,type:'cite',label:n+' حكم',info:{a:l.title,b:k,why:n+' من هذه الأحكام استند إلى مواد هذا التشريع كما سجّلتها القاعدة.'}})})});
 const A=[['jQ','◈','ما اشترطته المحاكم',(r.requisites||[]).length,'mbgReq','cite'],['jD','⛨','الدفوع المحتملة',(r.defenses||[]).length,'mbgDef','opp'],['jP','⚑','العقوبات في النصوص',(r.penalties||[]).length,'mbgPen','cite'],['jT','⏱','المواعيد',(r.deadlines||[]).length,'mbgTools','cite']].filter(a=>a[3]);
 A.forEach(([id,ic,t,n,go,ty])=>{nodes.push({id,col:4,kind:'arg '+ty,ic,title:t,badge:String(n),go,h:56,gap:12});
  if(id==='jQ'||id==='jD'){const src=(id==='jQ'?r.requisites:r.defenses)||[];Object.entries(grp).forEach(([k,xs],gi)=>{const c=src.filter(q=>xs.some(x=>x.id===q.id)).length;if(c)edges.push({from:'jR'+gi,to:id,type:ty,label:'',info:{a:k,b:t,why:c+' جملة من هذه الأحكام نفسها، تُعرض حرفياً في قسمها.'}})})}
  else laws.forEach((l,li)=>{const ok=id==='jP'?(r.penalties||[]).some(p=>p.lawId===l.lawId):(r.deadlines||[]).some(d=>d.lawId===l.lawId);if(ok)edges.push({from:'jL'+li,to:id,type:'cite',label:'',info:{a:l.title,b:t,why:'وردت في مواد هذا التشريع كما هي.'}})})});
 const todo=[...((I&&I.evidence)||[]).filter(x=>x.status==='missing').slice(0,3).map(x=>'دليل ناقص: '+x.label),...(r.opposing&&r.opposing.split.length?['ادرس الاتجاه المخالف ('+r.opposing.split.length+')']:[]),...(iss.filter(x=>x.found===false).map(x=>'لا مرجع لمسألة: '+x.label))].slice(0,5);
 nodes.push({id:'jN',col:5,kind:'next',ic:'➜',title:'ما يلزم التحقق منه',sub:todo.length?todo.length+' بند':'لا بنود مفتوحة',h:70,gap:10});
 todo.forEach((t,i)=>nodes.push({id:'jN'+i,col:5,kind:'todo',title:t,h:42,gap:6}));
 A.forEach(a=>edges.push({from:a[0],to:'jN',type:a[5]==='opp'?'opp':'sug',label:'',info:{a:a[2],b:'ما يلزم التحقق منه',why:'اقرأ النصوص في قسمها ثم قرّر؛ لا استنتاج آلياً هنا.'}}));
 return {cols:[{t:'الوقائع',s:'من نصك'},{t:'المسائل',s:'مستخرجة'},{t:'النصوص',s:'تشريعات ومواد'},{t:'الأحكام',s:'بحسب منطوقها'},{t:'الحجج',s:'شروط · دفوع · عقوبات · مواعيد'},{t:'الخطوة التالية',s:'للمحامي'}],nodes,edges};
}
function locGraph(r,L){
 if(!(r.laws||[]).length&&!L.R.length)return'';RG.info={};
 const map=RG.view!=='journey',S0=map?rgMapSpec(r,L):rgJourneySpec(r,L),D=map?Math.min(RG.depth||2,S0.cols.length):S0.cols.length;
 /* التفرّع التدريجي: تبدأ الخريطة من المسألة وتُفتح طبقة بعد طبقة */
 const S=map&&D<S0.cols.length?(()=>{const nodes=S0.nodes.filter(n=>n.col<D),ids=new Set(nodes.map(n=>n.id));return {cols:S0.cols.slice(0,D),nodes,edges:S0.edges.filter(x=>ids.has(x.from)&&ids.has(x.to))}})():S0;
 const G=rgEngine(S);RG.last=r;RG.lastL=L;
 const cnt={};S.edges.forEach(x=>cnt[x.type]=(cnt[x.type]||0)+1);
 return `<div class="rg ${map?'map':'jr'}" id="rgWrap" data-w="${G.W}" data-h="${G.H}">
 <div class="rg-top"><div class="rg-tabs"><button type="button" class="${map?'on':''}" data-rgv="map">⌁ خريطة الاستدلال القانوني</button><button type="button" class="${map?'':'on'}" data-rgv="journey">✎ مخطط فكر المحامي</button></div>
  <div class="rg-leg">${Object.entries(RGT).map(([t,[a,b]])=>`<button type="button" class="rg-lg ${t} ${RG.hide[t]?'off':''}" data-rgt="${t}" title="${e(b)} — انقر لإخفائها أو إظهارها"><svg width="34" height="10"><line x1="1" y1="5" x2="33" y2="5"/></svg>${e(a)} <b>${cnt[t]||0}</b></button>`).join('')}</div>
  ${map?`<div class="rg-steps">${S0.cols.map((c,i)=>`<button type="button" class="${i<D?'on':''}" data-rgd="${i+1}" title="${i<D?'إخفاء ما بعدها':'افتح حتى هذه الطبقة'}"><i>${i+1}</i>${e(c.t)}</button>`).join('<span>←</span>')}${D<S0.cols.length?`<button type="button" class="nx" data-rgd="${D+1}">افتح «${e(S0.cols[D].t)}» ›</button>`:''}</div>`:''}
  <div class="rg-tools"><button type="button" data-rgz="1" title="تكبير">＋</button><button type="button" data-rgz="-1" title="تصغير">－</button><button type="button" data-rgz="0" title="ملاءمة">⟲</button><button type="button" data-rgz="fs" title="ملء الشاشة">⤢</button></div></div>
 <div class="rg-vp" tabindex="0" aria-label="${map?'خريطة الاستدلال القانوني':'مخطط فكر المحامي'}">${G.html}<div class="rg-pop" hidden></div></div>
 <p class="rg-note m">${map?'كل خط يحمل معناه: الذهبي استناد مسجّل في القاعدة، والأخضر ما تحقّق منه مكتبك، والأحمر اتجاه مخالف، والرمادي صلة مقترحة لم يُتحقق منها. انقر عقدة لعزل علاقاتها، وانقر خطاً لتعرف لماذا يرتبط.':'الرحلة من وقائعك إلى ما يلزم فعله، من نتائج القاعدة نفسها وبلا استنتاج آلي؛ كل عقدة تنقلك إلى نصوصها الحرفية.'} السحب للتحريك، و Ctrl + العجلة للتكبير.</p></div>`}
/* التفاعل: ملاءمة الحجم، التحريك والتكبير، التركيز، بطاقة «لماذا يرتبط؟» */
function rgApply(w){const cv=w.querySelector('.rg-cv');if(cv)cv.style.transform=`translate(${RG.x}px,${RG.y}px) scale(${RG.z})`}
function rgFit(w){const vp=w.querySelector('.rg-vp');if(!vp)return;const W=+w.dataset.w,H=+w.dataset.h,z=Math.min(1,(vp.clientWidth-8)/W);RG.z=Math.max(.72,z);RG.x=W*RG.z<=vp.clientWidth?(vp.clientWidth-W*RG.z)/2:vp.clientWidth-W*RG.z-4;RG.y=0;vp.style.height=Math.min(Math.max(H*RG.z+10,320),window.innerHeight*.82)+'px';rgApply(w)}
function rgFocus(w,id){const sv=w.querySelector('.rg-s');w.querySelectorAll('.on-f').forEach(n=>n.classList.remove('on-f'));if(!id){w.classList.remove('focus');RG.f=null;return}
 RG.f=id;w.classList.add('focus');const near=new Set([id]);w.querySelectorAll('[data-rg]').forEach(g=>{const k=g.dataset.rg.split(' ');if(k.includes(id)){g.classList.add('on-f');k.forEach(x=>near.add(x))}});
 w.querySelectorAll('[data-rg]').forEach(g=>{const k=g.dataset.rg.split(' ');if(k.includes(id))return;if(g.classList.contains('trunk')&&k.some(x=>near.has(x)))g.classList.add('on-f')});
 w.querySelectorAll('.rg-n').forEach(n=>{if(near.has(n.dataset.rgn))n.classList.add('on-f')});void sv}
function rgPop(w,id,ev){const I=RG.info[id],p=w.querySelector('.rg-pop');if(!I||!p)return;const T=RGT[I.type]||RGT.sug;
 const one=x=>`<div class="rg-pr"><div class="rg-pab"><span>${e(rgShort(x.a,90))}</span><i>⟵ ${e(T[0])} ⟵</i><span>${e(rgShort(x.b,90))}</span></div><p class="rg-why">${e(x.why||'')}</p>${x.ex?`<blockquote class="rg-ex">${e(x.ex)}</blockquote>`:''}${x.art?`<details class="rg-art"><summary>نص المادة كما هو</summary><div>${e(x.art)}</div></details>`:''}${x.id?`<button type="button" class="mb-ref" data-act="mbRefOpen" data-v="${x.id}">افتح الحكم كاملاً</button>`:''}</div>`;
 p.innerHTML=`<header class="${I.type}"><b>لماذا يرتبط؟</b><span>${e(T[0])} — ${e(T[1])}</span><button type="button" class="x" data-rgx>✕</button></header><div class="rg-pb">${I.bundle?`<p class="rg-why">${I.bundle.length} صلات من النوع نفسه إلى «${e(rgShort(I.toTitle,70))}»:</p>`+I.bundle.map(one).join(''):one(I)}</div>`;
 p.hidden=false;const vp=w.querySelector('.rg-vp').getBoundingClientRect();let x=ev.clientX-vp.left+12,y=ev.clientY-vp.top+12;x=Math.min(x,vp.width-p.offsetWidth-8);y=Math.min(y,vp.height-p.offsetHeight-8);p.style.left=Math.max(8,x)+'px';p.style.top=Math.max(8,y)+'px'}
(()=>{let drag=null;
 const W=()=>document.getElementById('rgWrap');
 new MutationObserver(()=>{const w=W();if(w&&!w.dataset.fit){w.dataset.fit='1';requestAnimationFrame(()=>{rgFit(w);w.classList.add('in')})}}).observe(document.body,{childList:true,subtree:true});
 window.addEventListener('resize',()=>{const w=W();if(w)rgFit(w)});
 document.addEventListener('click',ev=>{const w=W();if(!w||!w.contains(ev.target))return;const t=ev.target;
  const dp=t.closest('[data-rgd]');if(dp){RG.depth=+dp.dataset.rgd;const h=document.getElementById('mbgMap');if(h&&RG.last){h.innerHTML=locGraph(RG.last,RG.lastL)}return}
  const v=t.closest('[data-rgv]');if(v){RG.view=v.dataset.rgv;const h=document.getElementById('mbgMap');if(h&&RG.last){h.innerHTML=locGraph(RG.last,RG.lastL)}return}
  const lg=t.closest('[data-rgt]');if(lg){const k=lg.dataset.rgt;RG.hide[k]=!RG.hide[k];lg.classList.toggle('off',RG.hide[k]);w.classList.toggle('h-'+k,RG.hide[k]);return}
  const z=t.closest('[data-rgz]');if(z){const k=z.dataset.rgz;if(k==='fs'){const el=w;(document.fullscreenElement?document.exitFullscreen():el.requestFullscreen&&el.requestFullscreen()).then?.(()=>setTimeout(()=>rgFit(w),120))}else if(k==='0')rgFit(w);else{RG.z=Math.min(2.4,Math.max(.3,RG.z*(k==='1'?1.2:1/1.2)));rgApply(w)}return}
  if(t.closest('[data-rgx]')){w.querySelector('.rg-pop').hidden=true;return}
  if(t.closest('.rg-pop')||t.closest('.rg-go'))return;
  const ed=t.closest('[data-rge]');if(ed){rgPop(w,ed.dataset.rge,ev);rgFocus(w,null);ed.classList.add('on-f');w.classList.add('focus');return}
  const n=t.closest('[data-rgn]');w.querySelector('.rg-pop').hidden=true;if(n){rgFocus(w,RG.f===n.dataset.rgn?null:n.dataset.rgn);return}
  rgFocus(w,null)});
 document.addEventListener('pointerdown',ev=>{const w=W();if(!w)return;const vp=ev.target.closest&&ev.target.closest('.rg-vp');if(!vp||ev.target.closest('.rg-n,.rg-pop,[data-rge],button'))return;drag={x:ev.clientX-RG.x,y:ev.clientY-RG.y,m:0};vp.setPointerCapture(ev.pointerId);vp.classList.add('drag')});
 document.addEventListener('pointermove',ev=>{if(!drag)return;const w=W();if(!w)return;RG.x=ev.clientX-drag.x;RG.y=ev.clientY-drag.y;rgApply(w)});
 document.addEventListener('pointerup',()=>{if(!drag)return;drag=null;const v=document.querySelector('.rg-vp.drag');if(v)v.classList.remove('drag')});
 document.addEventListener('wheel',ev=>{const vp=ev.target.closest&&ev.target.closest('.rg-vp');if(!vp||!ev.ctrlKey)return;ev.preventDefault();const w=W(),b=vp.getBoundingClientRect(),mx=ev.clientX-b.left,my=ev.clientY-b.top,z0=RG.z,z1=Math.min(2.4,Math.max(.3,z0*(ev.deltaY<0?1.12:1/1.12)));RG.x=mx-(mx-RG.x)*z1/z0;RG.y=my-(my-RG.y)*z1/z0;RG.z=z1;rgApply(w)},{passive:false});
 /* تمرير المؤشر على عقدة يُحيي خطوطها: يسري فيها الضوء ويشتد لونها */
 let hv=null;document.addEventListener('mouseover',ev=>{const n=ev.target.closest&&ev.target.closest('.rg [data-rgn]'),id=n?n.dataset.rgn:null;if(id===hv)return;const w=W();if(!w)return;w.querySelectorAll('.rg-e.hv,.rg-n.hv').forEach(x=>x.classList.remove('hv'));w.classList.toggle('hov',!!id);hv=id;if(!id)return;
  w.querySelectorAll('.rg-e[data-rg]').forEach(g=>{const k=g.dataset.rg.split(' ');if(k.includes(id)){g.classList.add('hv');k.forEach(z=>{const m=w.querySelector('[data-rgn="'+z+'"]');if(m)m.classList.add('hv')})}})});
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape'){const w=W();if(w){rgFocus(w,null);const p=w.querySelector('.rg-pop');if(p)p.hidden=true}}});
 const css=document.createElement('style');css.textContent=`
.rg{--ink:#0E2236;--gold:#C9A24A;--gold2:#F3D58A;--ivory:#FBF7EC;margin:14px 0;border:1px solid #E7D6A8;border-radius:18px;background:#fff;box-shadow:0 10px 30px rgb(14 34 54/.08);overflow:hidden}
.rg-top{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;padding:10px 14px;background:linear-gradient(135deg,#0E2236,#16324d 70%,#1d3f5f);border-bottom:3px solid var(--gold)}
.rg-tabs{display:flex;gap:6px}.rg-tabs button{font:inherit;font-size:13.5px;font-weight:700;border:1px solid rgb(243 213 138/.4);background:transparent;color:#E9DDBB;border-radius:999px;padding:6px 14px;cursor:pointer}.rg-tabs button.on{background:linear-gradient(135deg,#F3D58A,#C9A24A);color:#0E2236;border-color:#F3D58A;box-shadow:0 0 14px rgb(243 213 138/.45)}
.rg-leg{display:flex;flex-wrap:wrap;gap:6px}.rg-lg{display:flex;align-items:center;gap:6px;font:inherit;font-size:12px;color:#F2E6C4;background:rgb(255 255 255/.06);border:1px solid rgb(255 255 255/.12);border-radius:999px;padding:3px 10px;cursor:pointer}.rg-lg b{color:#F3D58A}.rg-lg.off{opacity:.35;text-decoration:line-through}
.rg-lg svg line{stroke-width:3;stroke-linecap:round}.rg-lg.cite line{stroke:#D8B25A}.rg-lg.ok line{stroke:#3FB3AF}.rg-lg.opp line{stroke:#E0705A;stroke-dasharray:6 4}.rg-lg.sug line{stroke:#A9B2BC;stroke-dasharray:1 4}
.rg-tools{display:flex;gap:4px}.rg-tools button{width:30px;height:30px;border-radius:8px;border:1px solid rgb(243 213 138/.35);background:rgb(255 255 255/.06);color:#F3D58A;font-size:15px;cursor:pointer}.rg-tools button:hover{background:rgb(243 213 138/.18)}
.rg-vp{position:relative;overflow:hidden;cursor:grab;touch-action:none;background-color:var(--ivory);background-image:radial-gradient(rgb(201 162 74/.22) 1px,transparent 1.2px),radial-gradient(1200px 400px at 85% 0,rgb(243 213 138/.18),transparent 70%);background-size:22px 22px,auto;min-height:320px}
.rg-vp.drag{cursor:grabbing}.rg-cv{position:absolute;top:0;left:0;transform-origin:0 0}
.rg-ch{position:absolute;top:14px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:6px 10px;border-radius:12px;background:rgb(255 255 255/.75);border:1px solid #EADBB4;backdrop-filter:blur(2px)}.rg-ch i{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-weight:800;font-size:12px;color:#0E2236;background:radial-gradient(circle at 35% 30%,#F3D58A,#C9A24A 70%);box-shadow:0 0 8px rgb(243 213 138/.6)}.rg-ch b{color:#0E2236;font-size:13.5px}.rg-ch small{color:#8a7a5c;font-size:11px;width:100%}
.rg svg.rg-s{position:absolute;top:0;left:0;overflow:visible;pointer-events:none;fill:initial;stroke:none;max-width:none!important}.rg svg.rg-s text{stroke-width:4px}.rg .rg-lg svg{width:34px!important;height:10px!important;fill:none}.rg-s .rg-e,.rg-s .rg-bdg{pointer-events:auto;cursor:pointer}
.rg-e .hit{fill:none;stroke:transparent;stroke-width:14}.rg-e .ln{fill:none;stroke-width:2.2;stroke-linecap:round;transition:opacity .25s,stroke-width .25s}.rg-e .fl{fill:none;stroke-width:2.2;stroke-linecap:round;opacity:0;stroke-dasharray:3 16}
.rg-e.cite .ln{stroke:#C9A24A}.rg-e.cite .fl{stroke:#FFF1C2}.rg-e.ok .ln{stroke:#2A8C8A}.rg-e.ok .fl{stroke:#C9F1EE}.rg-e.opp .ln{stroke:#B0503A;stroke-dasharray:7 5}.rg-e.sug .ln{stroke:#8E98A3;stroke-dasharray:2 5;stroke-width:2}.rg-e.amd .ln{stroke:#7A5AB8;stroke-dasharray:9 3 2 3;stroke-width:2.2}.rg-e.amd text{fill:#4b3480}.rg.h-amd .rg-e.amd,.rg.h-amd .rg-n.amd{display:none}.rg-lg.amd line{stroke:#9B7FE0;stroke-dasharray:6 2 1 2}.rg-n.amd{background:#F3EEFB!important;border-color:#B9A6E3!important}.rg-n.amd .ic{color:#6A4BB0}.rg-n.amd b{font-size:12px}.rg-n.arg{background:#F2FAF7!important;border-color:#9ED3C8!important}.rg-n.arg.def{background:#FBF4E8!important;border-color:#E2C38A!important}.rg-steps{display:flex;flex-wrap:wrap;align-items:center;gap:4px}.rg-steps span{color:#C9A24A;font-size:12px}.rg-steps button{font:inherit;font-size:12px;cursor:pointer;border-radius:99px;padding:3px 10px;border:1px solid rgb(255 255 255/.18);background:rgb(255 255 255/.05);color:#C8D3DE;display:inline-flex;gap:5px;align-items:center}.rg-steps button i{font-style:normal;width:17px;height:17px;border-radius:50%;display:grid;place-items:center;background:rgb(255 255 255/.12);font-size:10.5px}.rg-steps button.on{background:#C9A24A;color:#0B1B2B;border-color:#C9A24A}.rg-steps button.on i{background:#0B1B2B;color:#F3D58A}.rg-steps button.nx{background:#F3D58A;color:#0B1B2B;border-color:#F3D58A;font-weight:700;animation:rgNx 2s ease-in-out infinite}@keyframes rgNx{50%{box-shadow:0 0 0 5px rgb(243 213 138/.25)}}
.rg-e.trunk .ln{stroke-width:5.5}.rg-e.bun .ln{stroke-width:1.6;opacity:.75}
.rg-e text{font-size:11px;font-weight:700;fill:#5b4a22;opacity:0;transition:opacity .2s;paint-order:stroke;stroke:#FBF7EC;stroke-width:4px}.rg-e.ok text{fill:#1f6b69}.rg-e.opp text{fill:#8a3a2a}.rg-e.sug text{fill:#5d6670}
.rg-e:hover .ln{stroke-width:3.4;filter:url(#rgGlow)}.rg-e:hover text{opacity:1}
.rg-bdg circle{fill:#0E2236;stroke:#F3D58A;stroke-width:2;filter:url(#rgGlow)}.rg-bdg text{fill:#F3D58A;font-size:11.5px;font-weight:800;text-anchor:middle}.rg-bdg.ok circle{stroke:#3FB3AF}.rg-bdg.opp circle{stroke:#E0705A}.rg-bdg.sug circle{stroke:#A9B2BC}
.rg.in .rg-e .ln{animation:rgDraw 1.1s ease-out both}.rg.in .rg-e.opp .ln,.rg.in .rg-e.sug .ln{animation:rgFade .9s ease-out both}
@keyframes rgDraw{from{stroke-dasharray:1 1;stroke-dashoffset:1}to{stroke-dasharray:1 0;stroke-dashoffset:0}}@keyframes rgFade{from{opacity:0}}@keyframes rgFlow{to{stroke-dashoffset:-38}}
.rg.focus .rg-e{opacity:.08}.rg.focus .rg-n{opacity:.28;filter:saturate(.4)}.rg.focus .rg-bdg{opacity:.15}
.rg.focus .rg-e.on-f,.rg.focus .rg-bdg.on-f{opacity:1}.rg.focus .rg-e.on-f .ln{stroke-width:3.6;filter:url(#rgGlow)}.rg.focus .rg-e.on-f .fl{opacity:.95;animation:rgFlow 1.2s linear infinite}.rg.focus .rg-e.on-f text{opacity:1}.rg.focus .rg-n.on-f{opacity:1;filter:none}
.rg.h-cite .rg-e.cite,.rg.h-cite .rg-bdg.cite,.rg.h-ok .rg-e.ok,.rg.h-ok .rg-bdg.ok,.rg.h-opp .rg-e.opp,.rg.h-opp .rg-bdg.opp,.rg.h-sug .rg-e.sug,.rg.h-sug .rg-bdg.sug{display:none}
.rg-n{position:absolute;display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:12px;background:#fff;border:1px solid #E4D3A6;box-shadow:0 3px 10px rgb(14 34 54/.08);cursor:pointer;transition:transform .18s,box-shadow .18s,opacity .25s;overflow:hidden}
.rg-n:hover{transform:translateY(-2px);box-shadow:0 0 0 2px rgb(201 162 74/.45),0 8px 20px rgb(14 34 54/.14)}
.rg.in .rg-n{animation:rgPop .5s cubic-bezier(.2,.8,.3,1.2) both}@keyframes rgPop{from{opacity:0;transform:scale(.92)}}
.rg-n .ic{flex:0 0 26px;height:26px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-weight:800;font-size:13px;color:#0E2236;background:radial-gradient(circle at 35% 30%,#F3D58A,#C9A24A 70%)}
.rg-n .tx{min-width:0;flex:1;display:flex;flex-direction:column;gap:1px}.rg-n .tx b{font-size:12.8px;color:#0E2236;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rg-n .tx span{font-size:11px;color:#7a6a4c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rg-n em{font-style:normal;font-size:11.5px;font-weight:800;color:#8A6A25;background:#FBF1D6;border-radius:999px;padding:1px 8px;white-space:nowrap}
.rg-n .rg-go{border:0;background:transparent;color:#B8892E;font-size:14px;cursor:pointer;padding:0 2px;opacity:.55}.rg-n:hover .rg-go{opacity:1}
.rg-n.q{background:linear-gradient(135deg,#0E2236,#1d3f5f);border:2px solid #C9A24A;box-shadow:0 0 0 4px rgb(243 213 138/.25),0 0 28px rgb(243 213 138/.45);border-radius:18px;align-items:flex-start}.rg-n.q .tx b{color:#F3D58A;font-size:14.5px;white-space:normal}.rg-n.q .tx span{color:#D9C79A;white-space:normal;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical}
.rg-n.law{background:linear-gradient(135deg,#0E2236,#16324d 70%,#1d3f5f);border:0;border-right:5px solid #C9A24A}.rg-n.law .tx b{color:#F7E7BC}.rg-n.law .tx span{color:#d9c79a}.rg-n.law em{background:rgb(243 213 138/.15);color:#F3D58A}
.rg-n.art{border-right:4px solid #C9A24A;background:linear-gradient(90deg,#fff,#FFFCF4)}.rg-n.art.ok{border-right-color:#2A8C8A;box-shadow:0 0 0 1px rgb(42 140 138/.35),0 3px 10px rgb(14 34 54/.08)}.rg-n.art.sem{border-right-style:dashed}
.rg-n.rul{border-right:4px solid #1D3A57}.rg-n.rul.rg-t-app{border-right-color:#2D7A78}.rg-n.rul.rg-t-first{border-right-color:#6B7A8C}.rg-n.rul.cmp{border:1px dashed #BDB6A8;background:#FAF8F3}.rg-n.rul .ic{background:radial-gradient(circle at 35% 30%,#dfe8f2,#9DB2C8 70%)}
.rg-n.rul.ok{box-shadow:0 0 0 2px rgb(42 140 138/.45),0 3px 10px rgb(14 34 54/.08)}.rg-n.rul.opp{box-shadow:0 0 0 2px rgb(176 80 58/.45),0 3px 10px rgb(14 34 54/.08)}
.rg-n.bk{border-radius:16px;border:0;color:#fff;align-items:center}.rg-n.bk .tx b{color:#fff;font-size:14px}.rg-n.bk .tx span{color:rgb(255 255 255/.8)}.rg-n.bk em{background:rgb(255 255 255/.18);color:#fff;font-size:14px}
.rg-n.bk.ok{background:linear-gradient(135deg,#1f6b69,#2A8C8A);box-shadow:0 0 22px rgb(42 140 138/.35)}.rg-n.bk.opp{background:linear-gradient(135deg,#7A2E1C,#B0503A);box-shadow:0 0 22px rgb(176 80 58/.35)}.rg-n.bk.sug{background:linear-gradient(135deg,#55606b,#8E98A3)}.rg-n.bk .ic{background:rgb(255 255 255/.92)}
.rg-n.fact{border-right:4px solid #C9A24A}.rg-n.iss{border-right:4px solid #2D7A78}.rg-n.iss.nf{border-right-color:#B0503A;opacity:.85}.rg-n.arg{border-right:4px solid #C9A24A}.rg-n.arg.opp{border-right-color:#B0503A}.rg-n.next{background:linear-gradient(135deg,#C9A24A,#F3D58A);border:0}.rg-n.next .tx b,.rg-n.next .tx span{color:#0E2236}.rg-n.todo{background:#FFF8E6;border-style:dashed}.rg-n.todo .tx b{white-space:normal;font-size:12px}
.rg-pop{position:absolute;z-index:5;width:min(440px,92%);max-height:70%;overflow:auto;background:#fff;border-radius:14px;box-shadow:0 18px 50px rgb(14 34 54/.28);border:1px solid #E4D3A6;animation:rgPop .25s ease-out}
.rg-pop header{position:sticky;top:0;display:flex;flex-wrap:wrap;gap:4px 10px;align-items:baseline;padding:10px 14px;color:#fff;background:linear-gradient(135deg,#0E2236,#1d3f5f);border-bottom:3px solid #C9A24A}.rg-pop header.ok{border-bottom-color:#2A8C8A}.rg-pop header.opp{border-bottom-color:#B0503A}.rg-pop header.sug{border-bottom-color:#8E98A3}
.rg-pop header b{color:#F3D58A;font-size:14.5px}.rg-pop header span{font-size:12px;color:#D9C79A;flex:1}.rg-pop .x{border:0;background:transparent;color:#F3D58A;font-size:15px;cursor:pointer}
.rg-pb{padding:10px 14px}.rg-pr{padding:8px 0;border-bottom:1px dashed #E4D3A6}.rg-pr:last-child{border:0}.rg-pab{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:12.5px;font-weight:700;color:#0E2236}.rg-pab i{font-style:normal;color:#B8892E;font-size:11.5px}
.rg-why{font-size:12.8px;color:#3a2f1a;margin:6px 0;line-height:1.7}.rg-ex{margin:6px 0;padding:8px 12px;border-right:3px solid #C9A24A;background:#FBF6EA;font-size:12.5px;line-height:1.8;border-radius:8px}
.rg-art summary{cursor:pointer;font-size:12px;color:#8A6A25;font-weight:700}.rg-art div{white-space:pre-wrap;font-size:12.5px;line-height:1.8;background:#FFFCF4;border:1px solid #EADBB4;border-radius:8px;padding:8px 10px;margin-top:4px;max-height:220px;overflow:auto}
.rg-note{padding:8px 14px;margin:0;background:#FFFCF4;border-top:1px solid #EADBB4;font-size:12px}
.rg:fullscreen{border-radius:0;display:flex;flex-direction:column}.rg:fullscreen .rg-vp{flex:1;height:auto!important}
/* الحياة في المخطط: دخول متتابع عموداً بعد عمود، ونبضات ضوء تسري في الخطوط، ولمعان على العقد الرئيسة، وحلقات تنبض حول الحزم */
.rg.in .rg-n{animation-delay:var(--d,0s)}.rg.in .rg-ch{animation:rgDown .55s ease-out both;animation-delay:var(--d,0s)}@keyframes rgDown{from{opacity:0;transform:translateY(-10px)}}
.rg.in .rg-e .ln{animation-delay:calc(.45s + var(--d,0s))}
.rg-pk{fill:#FFF3C9;filter:url(#rgGlow);opacity:0;pointer-events:none;transition:opacity .4s}.rg.in .rg-pk{opacity:.95;transition-delay:1.6s}.rg-e.ok .rg-pk{fill:#BFF3EE}.rg-e.opp .rg-pk{fill:#FFC9BC}
.rg.hov .rg-e:not(.hv) .rg-pk{opacity:.18}.rg.hov .rg-e:not(.hv) .ln{opacity:.35}.rg-e.hv .ln{stroke-width:3.4;filter:url(#rgGlow)}.rg-e.hv .fl{opacity:.95;animation:rgFlow 1.1s linear infinite}.rg-e.hv text{opacity:1}.rg-e.hv .rg-pk{r:4.6}
.rg.hov .rg-n.hv{box-shadow:0 0 0 2px rgb(201 162 74/.6),0 0 18px rgb(243 213 138/.55)}
.rg-ring{fill:none!important;stroke:#F3D58A;stroke-width:2;animation:rgRing 2.4s ease-out infinite;filter:none!important}.rg-bdg.ok .rg-ring{stroke:#3FB3AF}.rg-bdg.opp .rg-ring{stroke:#E0705A}
@keyframes rgRing{from{r:13;opacity:.9}to{r:26;opacity:0}}
.rg-n.q:before,.rg-n.law:before,.rg-n.next:before,.rg-n.bk:before{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgb(255 241 194/.28) 50%,transparent 65%);background-size:250% 100%;background-position:150% 0;animation:rgShine 5.5s ease-in-out infinite;animation-delay:calc(2s + var(--d,0s));pointer-events:none}
@keyframes rgShine{0%,55%{background-position:150% 0}100%{background-position:-60% 0}}
.rg.in .rg-n.q{animation:rgPop .5s cubic-bezier(.2,.8,.3,1.2) both,rgBreath 3.2s ease-in-out infinite;animation-delay:var(--d,0s),1s}@keyframes rgBreath{0%,100%{box-shadow:0 0 0 4px rgb(243 213 138/.22),0 0 22px rgb(243 213 138/.35)}50%{box-shadow:0 0 0 7px rgb(243 213 138/.12),0 0 40px rgb(243 213 138/.7)}}
.rg-ch i{animation:rgDot 2.8s ease-in-out infinite;animation-delay:var(--d,0s)}@keyframes rgDot{0%,100%{box-shadow:0 0 6px rgb(243 213 138/.5)}50%{box-shadow:0 0 16px rgb(243 213 138/1)}}
.rg-vp{animation:rgDrift 40s linear infinite}@keyframes rgDrift{to{background-position:220px 110px,0 0}}
.rg-tabs button.on{position:relative;overflow:hidden}.rg-tabs button.on:after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgb(255 255 255/.35) 50%,transparent 65%);background-size:250% 100%;animation:rgShine 4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.rg.in .rg-e .ln,.rg.in .rg-n,.rg.focus .rg-e.on-f .fl,.rg.in .rg-n.q,.rg-n:before,.rg-ch i,.rg-vp,.rg-ring,.rg-tabs button:after,.rg.in .rg-ch{animation:none}.rg-pk{display:none}}
@media print{.rg-pk,.rg-ring{display:none}}
@media print{.rg-top .rg-tools,.rg-tabs{display:none}}`;document.head.appendChild(css)})();

function locYears(L){
 const ys=L.R.map(q=>({q,y:BYEAR(q.x)})).filter(o=>o.y);if(ys.length<2)return'';
 let a=Math.min(...ys.map(o=>o.y)),b=Math.max(...ys.map(o=>o.y));if(a===b){a--;b++}
 const W=600,px=y=>20+(y-a)/(b-a)*(W-40),cnt={};
 const dots=ys.map(o=>{const k=o.y,i=cnt[k]=(cnt[k]||0)+1;return `<circle class="${o.q.cmp?'cmp':BTIER(o.q.x.court)[0]}" cx="${W-px(o.y)}" cy="${40-i*9}" r="4" data-mbgo="${o.q.id}" data-lk="${o.q.id}"><title>${e(o.q.x.title)}</title></circle>`}).join('');
 const ticks=[a,Math.round((a+b)/2),b].filter((v,i,s)=>s.indexOf(v)===i).map(y=>`<text x="${W-px(y)}" y="60">${y}</text>`).join('');
 return `<svg class="mbm-yr" viewBox="0 0 ${W} 66" role="img" aria-label="توزيع الأحكام على السنوات"><line x1="20" y1="44" x2="${W-20}" y2="44"/>${dots}${ticks}</svg>`;
}
function locPen(r,ui,L){if(!(r.penQ||r.penShow))return'';const P=r.penalties||[];
 const id=p=>{const li=(r.laws||[]).findIndex(l=>l.lawId===p.lawId),ai=li<0?-1:(r.laws[li].articles||[]).findIndex(a=>String(a.n)===String(p.n));return ai>=0?'mbgA'+li+'_'+ai:''};
 const KC={'الإعدام':'k0','الأشغال الشاقة المؤبدة':'k1','الأشغال الشاقة المؤقتة':'k2','الاعتقال':'k2','الحبس':'k3','السجن':'k3','الغرامة':'k4'};
 const card=p=>{const g=ui?id(p):'';return `<article class="mbp-c"><header><b>${e(p.label)}</b><span class="m">من ${e(p.lawTitle)}</span>${p.from==='cite'?'<span class="mbg-tag you">✎ وردت في نصك</span>':''}${g?`<button type="button" class="mbg-go g" data-mbgo="${g}">§ المادة كاملة</button>`:ui?locOpen(p.lawId,'التشريع كاملاً'):''}</header>
  ${(p.kinds||[]).length||(p.measures||[]).length?`<div class="mbp-k">${(p.kinds||[]).map(k=>`<span class="mbp-kind ${KC[k]||''}">${e(k)}</span>`).join('')}${(p.measures||[]).map(m=>`<span class="mbp-m">${e(m)}</span>`).join('')}</div>`:''}
  <details class="mbp-t"><summary>نص العقوبة كما ورد في المادة</summary>${p.clauses.map(c=>`<blockquote>${e(c)}</blockquote>`).join('')}</details>
  ${(p.refs||[]).map(x=>`<details class="mbp-ref"><summary>تحيل المادة إلى ${e(x.label)} من القانون نفسه</summary><div>${(x.kinds||[]).length||(x.measures||[]).length?`<div class="mbp-k">${(x.kinds||[]).map(k=>`<span class="mbp-kind ${KC[k]||''}">${e(k)}</span>`).join('')}${(x.measures||[]).map(m=>`<span class="mbp-m">${e(m)}</span>`).join('')}</div>`:''}${x.clauses.map(c=>`<blockquote>${e(c)}</blockquote>`).join('')}</div></details>`).join('')}</article>`};
 return `<section class="mbp" id="mbgPen"><h4><i>⚖</i>العقوبة في النصوص <small>${P.length?P.length+' مادة':''}</small></h4>${P.length?`<div class="mbp-g">${P.map(card).join('')}</div><p class="m mbp-n">الأنواع والمقادير مقروءة آلياً من النص للتتبّع فقط؛ المعتمد هو نص المادة كاملاً، وتُراجع ظروف التشديد والتخفيف والتكرار في القانون نفسه.</p>`:'<p class="m">لم يُعثر في المواد المطابقة على نص عقوبة؛ افتح التشريع كاملاً أو اذكر الجريمة بدقة أكبر.</p>'}</section>`}
/* خريطة القضية: مخطط شعاعي يربط موضوع المسألة بما وُجد في القاعدة؛ كل عقدة تنقل إلى قسمها، والأعداد من النتائج نفسها */
function locInspect(r){const I=r.inspect;if(!I)return'';/* هدف خلية «الإثبات» في الخريطة */
 const ST={doc:['✓','مرفق في القضية','ok'],text:['◌','مذكور في النص بلا مرفق','warn'],missing:['✗','غير موجود','bad']};
 return `<section class="mbi" id="mbgInsp"><div class="mbi-log"><h4><i>⟳</i>دورة الفحص <small>${(r.ms/1000).toFixed(1)} ث على الجهاز · دون إنترنت ودون نموذج لغوي</small></h4><ol>${I.log.map((x,i)=>`<li><b>${i+1}. ${e(x.step)}</b><span>${e(x.text)}</span></li>`).join('')}</ol></div>
 <div class="mbi-g">
  <div class="mbg-pnl mbi-iss"><h4><i>◉</i>المسائل المستخرجة <small>من كلمات الوقائع نفسها</small></h4>${I.issues.map(x=>`<article class="mbi-i ${x.found?'':'nf'}"><header><b>${e(x.label)}</b><span class="mbg-tag ${x.found?'':'bad'}">${x.found?`${x.laws.reduce((s,l)=>s+l.n.length,0)} مادة · ${x.rulings} حكم`:'لم يجد المسبار مراجع'}</span>${x.attempts>1?`<span class="mbg-tag">أُعيد البحث ×${x.attempts-1}</span>`:''}</header>${x.facts.length?`<ul class="mbi-f">${x.facts.slice(0,4).map(f=>`<li>«${e(f)}»</li>`).join('')}</ul>`:''}${x.laws.length?`<div class="mbi-l">${x.laws.map(l=>`<span>${e(l.title.replace(/\s*رقم\s*\(?\d+\)?\s*لسن[ةه]\s*\d+م?\.?$/,''))}${l.n.length?' م'+l.n.join('،'):''}</span>`).join('')}</div>`:''}</article>`).join('')}${I.questions.length?`<div class="mbi-q"><b>أسئلة وردت في النص:</b><ul>${I.questions.map(q=>`<li>${e(q)}</li>`).join('')}</ul></div>`:''}${I.notFound.length?`<div class="mbr-warn">لم يجد المسبار مراجع لـ: ${I.notFound.map(e).join('، ')} — بعد إعادة البحث بكلمات الموضوع. لم يكتب بديلاً.</div>`:''}</div>
  <div class="mbg-pnl mbi-ev"><h4><i>▤</i>الأدلة المعتادة للموضوع مقابل مستندات القضية <small>قائمة تحقق عامة، لا نص قانوني</small></h4>${I.evidence.length?`<ul class="mbi-e">${I.evidence.map(x=>`<li class="${ST[x.status][2]}"><i>${ST[x.status][0]}</i><b>${e(x.label)}</b><span>${e(ST[x.status][1])}${x.doc?': '+e(x.doc):''}</span><small>${e(x.issue)}</small></li>`).join('')}</ul>`:'<p class="m">لا قائمة أدلة مهندَسة لهذا الموضوع بعد.</p>'}</div>
 </div></section>`}
function locOpposing(r,ui){const O=r.opposing;if(!O||(!O.split.length&&!O.contra.length))return'';
 const rl=x=>`${ui?`<button type="button" class="mbg-go" data-act="mbRefOpen" data-v="${x.id}">${e(x.case_no||'')}</button>`:e(x.case_no||'')} <small class="m">${e([x.court,x.date].filter(Boolean).join(' · '))} — ${e(x.outcome||'')}</small>`;
 return `<section class="mbg-pnl mbo" id="mbgOpp"><h4><i>⚔</i>الرأي المعارض <small>ما قد يُحتجّ به في الاتجاه الآخر — من الأحكام نفسها، وتصنيف المنطوق آلي</small></h4>
 ${O.split.map(x=>`<div class="mbo-s"><b>§ ${e(x.cite)}</b><div class="mbo-c"><div class="f"><span>انتهت لصالح الطاعن أو المتهم (${x.for.length})</span>${x.for.map(y=>`<div>${rl(y)}</div>`).join('')}</div><div class="a"><span>انتهت بالرد أو الإدانة (${x.against.length})</span>${x.against.map(y=>`<div>${rl(y)}</div>`).join('')}</div></div></div>`).join('')}
 ${O.contra.length?`<h5>أحكام وسمها مكتبك «مخالفة تستحق الدراسة»</h5>${O.contra.map(x=>`<article class="mbq d"><blockquote class="mbg-ex">${e(x.excerpt||x.title)}</blockquote><footer><span class="m">${e([x.court,x.case_no&&'رقم '+x.case_no,x.date].filter(Boolean).join(' · '))} · وسمه المكتب ×${x.contra}</span>${ui?locOpen(x.id,'نص الحكم كاملاً'):''}</footer></article>`).join('')}`:''}
 <p class="m">المادة نفسها طبّقتها أحكام انتهت إلى نتائج مختلفة: اقرأ وقائع كل منها لتعرف متى تُقبل الحجة ومتى تُرد. لا تقدير هنا لموقف قضيتك.</p></section>`}
function locCaseMap(r){
 const nArt=(r.laws||[]).reduce((s,l)=>s+(l.articles||[]).length,0)+(r.citations||[]).filter(c=>c.found).length;
 const short=t=>String(t||'').replace(/^(قانون|قرار بقانون|قرار مجلس الوزراء)\s*/,'').replace(/\s*رقم\s*\(?\d+\)?\s*لسن[ةه]\s*\d+م?\.?$/,'');
 const N=[
  ['mbgLaws','§','التشريعات',(r.laws||[]).length+' تشريع · '+nArt+' مادة',(r.laws||[]).slice(0,3).map(l=>short(l.title)+' · م'+(l.articles||[]).slice(0,3).map(a=>a.n).join('،')),'g','r1'],
  ['mbgRul','⚖','الأحكام الفلسطينية',(r.rulings||[]).length+' حكم',(r.outcomes||[]).slice(0,3).map(o=>o.label+' ×'+o.n),'n','r2'],
  ['mbgPen','⚑','العقوبات في النصوص',(r.penalties||[]).length?(r.penalties||[]).length+' مادة':'لا نص عقوبة',(r.penalties||[]).slice(0,3).map(p=>p.label+(p.measures[0]?': '+p.measures[0]:'')),'p','r3'],
  ['mbgReq','◈','ما اشترطته المحاكم',(r.requisites||[]).length?(r.requisites||[]).length+' موضع في الأحكام':'لم يرد',(r.requisites||[]).slice(0,2).map(q=>q.text.slice(0,70)+'…'),'q','l1'],
  ['mbgDef','⛨','دفوع وردت في الأحكام',(r.defenses||[]).length?(r.defenses||[]).length+' موضع في الأحكام':'لم يرد',(r.defenses||[]).slice(0,2).map(q=>q.text.slice(0,70)+'…'),'d','l2'],
  ['mbgTools','⏱','المواعيد والاختصاص',(r.deadlines||[]).length?(r.deadlines||[]).length+' ميعاد':'—',(r.deadlines||[]).slice(0,3).map(d=>d.label),'t','l3'],
  ['mbgCmp','⇄','للمقارنة والاستئناس',(r.comparative||[]).length?(r.comparative||[]).length+' حكم أردني ومصري':'—',(r.comparative||[]).slice(0,2).map(x=>x.title.slice(0,60)),'s','b1'],
 ];
 const topic=(r.topics||[]).map(t=>t.label).slice(0,3);
 const node=([id,ic,t,c,items,cls,pos])=>`<button type="button" class="mbcm-n ${cls} ${pos} ${/^(—|لم يرد|لا نص)/.test(c)?'empty':''}" data-mbgo="${id}" data-mbcm="${pos}"><i>${ic}</i><b>${e(t)}</b><span class="c">${e(c)}</span>${items.length?`<ul>${items.map(x=>`<li>${e(x)}</li>`).join('')}</ul>`:''}</button>`;
 return `<div class="mbcm" id="mbcmWrap"><div class="mbm-h"><b>خريطة المسألة</b><span class="m">ترابط ما وُجد في القاعدة المحلية حول سؤالك؛ كل عقدة تنقلك إلى تفصيلها بنصوصه الحرفية. لا استنتاج فيها: الأعداد والعناوين من النتائج نفسها</span></div>
 <div class="mbcm-g"><svg class="mbcm-w" aria-hidden="true"></svg>
  <div class="mbcm-col r">${N.filter(n=>n[6][0]==='r').map(node).join('')}</div>
  <div class="mbcm-col c"><div class="mbcm-c" data-mbcm="c"><small>الموضوع القانوني</small>${topic.map(t=>`<b>${e(t)}</b>`).join('')||'<b>المسألة</b>'}<em>${e(String(r.title||'').slice(0,90))}</em></div>${N.filter(n=>n[6][0]==='b').map(node).join('')}</div>
  <div class="mbcm-col l">${N.filter(n=>n[6][0]==='l').map(node).join('')}</div>
 </div></div>`}
/* رسم الخطوط بعد العرض: من مركز الدائرة إلى حافة كل بطاقة، بألوان البطاقات */
function locMapWire(){const w=document.getElementById('mbcmWrap');if(!w)return;const g=w.querySelector('.mbcm-g'),svg=w.querySelector('.mbcm-w'),c=w.querySelector('.mbcm-c');if(!g||!svg||!c)return;
 const R=g.getBoundingClientRect(),cr=c.getBoundingClientRect(),cx=cr.left+cr.width/2-R.left,cy=cr.top+cr.height/2-R.top;svg.setAttribute('viewBox',`0 0 ${R.width} ${R.height}`);svg.setAttribute('width',R.width);svg.setAttribute('height',R.height);
 const COL={g:'#C9A24A',n:'#1D3A57',p:'#B0503A',q:'#2D7A78',d:'#7A2E1C',t:'#D9713F',s:'#8C8577'};let d='';
 w.querySelectorAll('.mbcm-n').forEach(n=>{const b=n.getBoundingClientRect(),pos=n.dataset.mbcm,cls=[...n.classList].find(k=>COL[k])||'g';let x,y;
  if(pos[0]==='r'){x=b.left-R.left;y=b.top+b.height/2-R.top}else if(pos[0]==='l'){x=b.right-R.left;y=b.top+b.height/2-R.top}else{x=b.left+b.width/2-R.left;y=b.top-R.top}
  const mx=(cx+x)/2;d+=`<path d="M${cx},${cy} C${mx},${cy} ${mx},${y} ${x},${y}" stroke="${COL[cls]}" ${cls==='s'?'stroke-dasharray="6 5"':''}/><circle cx="${x}" cy="${y}" r="4" fill="${COL[cls]}"/>`});
 svg.innerHTML=d}
document.addEventListener('click',ev=>{if(ev.target.closest&&ev.target.closest('[data-act="mbLocMode"],[data-act="mbLocPin"],[data-act="mbLocFb"]'))setTimeout(locMapWire,80)});
window.addEventListener('resize',()=>locMapWire());
(()=>{const mo=new MutationObserver(()=>{const w=document.getElementById('mbcmWrap');if(!w||w.dataset.wired)return;w.dataset.wired='1';requestAnimationFrame(locMapWire);if(window.ResizeObserver)new ResizeObserver(()=>locMapWire()).observe(w)});mo.observe(document.body,{childList:true,subtree:true})})();
function locQuotes(r,ui){
 const card=(q,i,cls)=>`<article class="mbq ${cls}" ><blockquote class="mbg-ex">${e(q.text)}</blockquote><footer><span class="m">${e([q.court,q.case_no&&'رقم '+q.case_no,q.date].filter(Boolean).join(' · '))}</span>${ui?locOpen(q.id,'نص الحكم كاملاً'):''}</footer></article>`;
 const req=(r.requisites||[]).length?`<section class="mbg-pnl mbq-p q" id="mbgReq"><h4><i>◈</i>ما اشترطته المحاكم <small>جمل من الأحكام نفسها تذكر الأركان أو الشروط — كما وردت</small></h4>${r.requisites.map((q,i)=>card(q,i,'q')).join('')}</section>`:'';
 const def=(r.defenses||[]).length?`<section class="mbg-pnl mbq-p d" id="mbgDef"><h4><i>⛨</i>دفوع وردت في الأحكام <small>جمل من الأحكام تذكر دفعاً أو انتفاء ركن — للفحص لا للاعتماد</small></h4>${r.defenses.map((q,i)=>card(q,i,'d')).join('')}</section>`:'';
 return req||def?`<div class="mbq-g">${req}${def}</div>`:''}
function locBoard(r,H){
 const L=locLinks(r),back=L.back,ui=true;
 const goChip=(id,t,cls)=>`<button type="button" class="mbg-go ${cls||''}" data-mbgo="${id}" data-lk="${id}">${e(t)}</button>`;
 const nArt=(r.laws||[]).reduce((s,l)=>s+(l.articles||[]).length,0),cf=(r.citations||[]).filter(c=>c.found).length;
 const kpi=[['§','تشريعات',(r.laws||[]).length,'mbgLaws','g'],['¶','مادة مطابقة',nArt+cf,'mbgLaws','g'],['⚖','حكم فلسطيني',(r.rulings||[]).length,'mbgRul','n'],['⇄','للمقارنة',(r.comparative||[]).length,'mbgCmp','s'],['⌁','صلة موثّقة',L.E.length,'mbgMap','l'],['⏱','ميعاد',(r.deadlines||[]).length,'mbgTools','t'],...((r.penQ||r.penShow)&&(r.penalties||[]).length?[['⚖','نص عقوبة',(r.penalties||[]).length,'mbgPen','p']]:[])].filter(k=>k[2]||k[4]!=='t');
 const X=r.ctx||{},reg={wb:'الضفة الغربية',gaza:'قطاع غزة'}[X.region]||'غير محدد';
 const LRN=(()=>{const Lr=r.learned||{},p=[];if(Lr.pinned)p.push(Lr.pinned+' مادة مثبّتة');if(Lr.boosted)p.push('رُفعت '+Lr.boosted+' نتيجة مفيدة');if(Lr.hidden)p.push('أُخفيت '+Lr.hidden+' غير ذات صلة');if((Lr.synonyms||[]).length)p.push('مرادفات القاموس: '+Lr.synonyms.join('، '));if((Lr.lay||[]).length)p.push('فُهم السؤال أيضاً بمعنى: '+Lr.lay.join('، '));if(Lr.sem&&(Lr.sem.added||Lr.sem.agreed))p.push('البحث الدلالي: '+(Lr.sem.added?'أضاف '+Lr.sem.added+' مادة قريبة المعنى':'')+(Lr.sem.added&&Lr.sem.agreed?' و':'')+(Lr.sem.agreed?'أكّد '+Lr.sem.agreed:''));return p})();
 /* المواد التي ذكرها المستخدم */
 const cits=(r.citations||[]).map((c,i)=>`<article class="mbg-art cite ${c.found?'':'miss'}" id="mbgQ${i}"><div class="mbg-num"><span>${e(c.article||'?')}</span><small>مادة</small></div><div class="mbg-ab"><div class="mbg-ah"><b>${e(c.label||('المادة '+c.article))}</b> ${c.lawTitle?`<span class="mbg-of">من ${e(c.lawTitle)}</span>`:''} ${c.status?`<span class="mb-st">${e(c.status)}</span>`:''}${c.repealed?'<span class="mb-st bad">ملغاة</span>':''}<span class="mbg-tag you">✎ وردت في نصك</span>${c.lawId?locOpen(c.lawId,'التشريع كاملاً'):''}</div>${c.found?vflags(c.valid,ui)+`<details class="mbg-tx" open><summary>النص الكامل للمادة</summary>${locQ(c.text)}</details>`:`<p class="m">${e(c.note||'')}</p>`}<small class="m">السياق في نصك: «${e(c.ctx)}»</small></div></article>`).join('');
 const laws=(r.laws||[]).map((l,li)=>{const bad=/ملغ/.test(l.status||''),lb=back['mbgL'+li]||[];return `<section class="mbg-law ${bad?'bad':''}" id="mbgL${li}" data-lk="mbgL${li}"><header class="mbg-lh"><div class="mbg-seal">§</div><div class="mbg-lt"><b>${e(l.title)}</b><div class="mbg-meta"><span class="mb-st ${bad?'bad':''}">${e(l.status||'')}</span>${l.topic?`<span class="mbg-tag">${e(l.topic)}</span>`:''}<span class="mbg-tag">${(l.articles||[]).length} مادة مطابقة</span>${lb.length?`<span class="mbg-tag lk">⚖ ${lb.length} استناد للقانون عموماً</span>`:''}</div></div>${locOpen(l.lawId,'التشريع كاملاً')}</header>${vflags(l.valid,ui)}
  <div class="mbg-rail">${(l.articles||[]).map((a,ai)=>{const id='mbgA'+li+'_'+ai,bk=back[id]||[];return `<article class="mbg-art ${a.pinned?'pin':''}" id="${id}" data-lk="${id}"><div class="mbg-num"><span>${e(a.n)}</span><small>مادة</small></div><div class="mbg-ab"><div class="mbg-ah"><b>${e(a.label)}</b>${a.pinned?'<span class="mbg-tag pin">📌 مثبّتة</span>':''}${a.sem?'<span class="mbg-tag sem" title="وجدها البحث الدلالي على الجهاز: قريبة في المعنى من سؤالك وإن اختلفت كلماتها؛ تحقّق من انطباقها">≈ قريبة في المعنى</span>':''}<span class="mbg-sp"></span><span class="mb-lofb"><button type="button" data-act="mbLocPin" data-v="${e(l.lawId+'|'+a.n+'|'+a.label+'|'+l.title)}" title="تثبيت هذه المادة لموضوع في قاموس المكتب">📌</button></span>${fbBtns('A:'+l.lawId+':'+a.n,ui)}</div><div class="mbg-why">◇ ${e(a.why)}</div>${vflags(a.valid&&{flags:a.valid.flags.filter(f=>f.note)},ui)}<details class="mbg-tx" open><summary>النص الكامل للمادة</summary>${locQ(a.text)}</details>${bk.length?`<div class="mbg-lks"><span>استندت إليها:</span>${bk.map(q=>{const rr=L.R.find(z=>z.id===q);return goChip(q,'⚖ '+(rr.x.case_no||rr.x.title)+(BYEAR(rr.x)?' · '+BYEAR(rr.x):''),rr.cmp?'cmp':BTIER(rr.x.court)[0])}).join('')}</div>`:''}</div></article>`}).join('')||'<p class="m">لم تُطابَق مادة بعينها مع كلمات نصك؛ افتح التشريع كاملاً.</p>'}</div></section>`}).join('');
 const rul=q=>{const x=q.x,[tc,tl]=BTIER(x.court),yr=BYEAR(x);return `<article class="mbg-rul ${q.cmp?'cmp':tc}" id="${q.id}" data-lk="${q.id}"><header class="mbg-rh"><div class="mbg-court"><i>⚖</i><span>${q.cmp?(/أردن|تمييز/.test(x.court+x.source)?'الأردن':/مصر|النقض المصرية/.test(x.court+x.source)?'مصر':'مقارنة'):tl}</span></div><div class="mbg-rt"><b>${e(x.title)}</b><div class="mbg-meta">${x.court?`<span>${e(x.court)}</span>`:''}${x.case_no?`<span class="mono">رقم ${e(x.case_no)}</span>`:''}${x.date?`<span class="mono">${e(x.date)}</span>`:''}${x.source?`<span>${e(x.source)}</span>`:''}</div></div>${yr?`<div class="mbg-yr">${yr}</div>`:''}</header>
  ${q.cmp?'<div class="mbg-warn">للمقارنة والاستئناس — غير ملزم أمام المحاكم الفلسطينية</div>':''}${x.excerpt?`<blockquote class="mbg-ex">${e(x.excerpt)}</blockquote>`:''}
  ${(x.cites||[]).length?`<div class="mbg-lks"><span>المواد التي استند إليها:</span>${x.cites.map(c=>{const ln=q.links.find(z=>z.c===c);return ln?goChip(ln.to,'§ '+c,'g'):`<span class="mbg-cite">§ ${e(c)}</span>`}).join('')}</div>`:''}
  <footer class="mbg-rf"><span class="mbg-why">◇ ظهر بسبب: ${(x.why||[]).map(e).join(' · ')}</span>${fbBtns('R:'+x.id,ui)}${locOpen(x.id,'نص الحكم كاملاً')}</footer></article>`};
 const PR=L.R.filter(q=>!q.cmp),CR=L.R.filter(q=>q.cmp);
 /* الأدوات: الاختصاص، المواعيد، الزمن، المبالغ */
 const lastDate=((r.timeline||[]).slice(-1)[0]||{}).date||'';
 const dls=(r.deadlines||[]).map(x=>`<div class="mbg-dl"><div class="mbg-dlh"><b>⏱ ${e(x.label)}</b><span class="mbg-dur">${x.days?(x.years?x.years+' سنة':x.days+' يوماً'):'المدة في نص المادة'}</span></div><small class="m">${e(x.articleLabel)} من ${e(x.lawTitle)}</small>${vflags(x.valid&&{flags:x.valid.flags.filter(f=>f.note||f.level==='bad')},ui)}${x.days?`<label class="mbg-dli">من تاريخ التبليغ أو الصدور <input type="date" class="field" data-dl="${e(x.id)}" value="${e(lastDate)}"></label><div class="mbg-dlo" id="dlo_${e(x.id)}">${dlCalc(x,lastDate)}</div>`:''}<details class="mbg-tx"><summary>النص الكامل للمادة</summary>${locQ(x.text)}</details></div>`).join('');
 const jur=r.jurisdiction?`<div class="mbg-dl"><div class="mbg-dlh"><b>⚑ الاختصاص القيمي</b></div><small class="m">من ${e(r.jurisdiction.lawTitle)}</small>${r.jurisdiction.verdict?`<p class="mbg-verdict">${e(r.jurisdiction.verdict)}</p>`:''}${r.jurisdiction.note?`<p class="m">${e(r.jurisdiction.note)}</p>`:''}${vflags(r.jurisdiction.valid,ui)}<details class="mbg-tx"><summary>النص الكامل للمادتين</summary>${r.jurisdiction.articles.map(a=>`<b>${e(a.label)}</b>${locQ(a.text)}`).join('')}</details></div>`:'';
 const tr=r.timeRule?`<div class="mbg-dl"><div class="mbg-dlh"><b>⧗ سريان القانون من حيث الزمان</b></div><small class="m">${e(r.timeRule.label)} من ${e(r.timeRule.lawTitle)}</small><p class="m">في النتائج نصوص عُدّلت بعد تاريخ الواقعة؛ هذه المادة تحدد أيّ النصين يسري.</p><details class="mbg-tx" open><summary>النص الكامل للمادة</summary>${locQ(r.timeRule.text)}</details></div>`:'';
 const cr=r.countRule?`<details class="mbg-tx"><summary>كيف تُحسب المواعيد: ${e(r.countRule.label)} من ${e(r.countRule.lawTitle)}</summary>${locQ(r.countRule.text)}</details>`:'';
 const tl=(r.timeline||[]).length?`<ol class="mbg-tl">${r.timeline.map(t=>`<li>${t.sincePrev!=null?`<span class="mbg-gap">${dd(t.sincePrev)}</span>`:''}<div class="mbg-tld"><b class="mono">${e(t.date)}</b>${t.times>1?` <small>×${t.times}</small>`:''}<small class="m">${t.fromToday<0?'بعد '+(-t.fromToday)+' يوماً':'منذ '+t.fromToday+' يوماً'}</small></div><div class="mbg-tlc">${e(t.ctx)}</div></li>`).join('')}</ol>`:'';
 const am=(r.amounts||[]).length?`<div class="mbg-amts">${r.amounts.map(a=>`<div class="mbg-amt"><b class="mono">${Number(a.value).toLocaleString('en')}</b><span>${e(a.currency)}</span><small class="m">${e(a.ctx)}</small></div>`).join('')}</div><p class="m">المجموع الحسابي لما ورد: ${Object.entries(r.amountTotals||{}).map(([c,v])=>Number(v).toLocaleString('en')+' '+e(c)).join(' · ')} (قد يتكرر المبلغ نفسه في النص)</p>`:'';
 const cn=(r.caseNos||[]).length?`<div class="mbg-cns">${r.caseNos.map(c=>`<span class="mbg-cn"><b class="mono">${e(c.no)}</b> ${e(c.kind)}<small class="m">${e(c.ctx)}</small></span>`).join('')}</div>`:'';
 const panel=(ic,t,b,n)=>b?`<section class="mbg-pnl"><h4><i>${ic}</i>${t}${n?` <small>${n}</small>`:''}</h4>${b}</section>`:'';
 const tools=jur+tr+dls?panel('⚑','الاختصاص والمواعيد وسريان القانون',`<div class="mbg-dls">${jur}${tr}${dls}</div>${cr}${dls?'<p class="m">الحساب تقويمي تقريبي لا يُحسب فيه يوم التبليغ؛ والعطل الرسمية وبدء الميعاد يُراجع في النص.</p>':''}`):'';
 const hd=`<header class="mbg-hd"><div class="mbg-hl"><b>${e(r.title||'حصيلة التحليل المحلي')}</b><span class="m">${r.ms!=null?(r.ms<1000?'⚡ أقل من ثانية على الجهاز':'⚡ '+(r.ms/1000).toFixed(1)+' ث على الجهاز'):''} · دون إنترنت</span></div>
  <div class="mbg-q">${(r.topics||[]).map(t=>`<span class="mbg-topic" title="${e('الكلمات: '+t.hits.join('، '))}">◉ ${e(t.label)}</span>`).join('')}${(r.keyterms&&r.keyterms.terms||[]).map(k=>`<span class="mbg-kw">${e(k)}</span>`).join('')}</div>
  <div class="mbg-kpi">${kpi.map(([ic,t,n,go,c])=>`<button type="button" class="mbg-k ${c}" data-mbgo="${go}"><i>${ic}</i><b>${n}</b><span>${t}</span></button>`).join('')}</div>
  <div class="mbg-ctx"><span>⌖ ${e(reg)}</span><span>◷ ${X.eventDate?`تاريخ الواقعة <b class="mono">${e(X.eventDate)}</b>${X.eventFrom==='text'?' (أقدم تاريخ في النص)':''}`:'تاريخ الواقعة غير محدد — لن يُفحص التعديل الزمني'}</span>${r.caseInfo?`<span>▤ قُرئ ${r.caseInfo.read} من ${r.caseInfo.docs} مستنداً${(r.caseInfo.unread||[]).length?' — لم تُقرأ: '+r.caseInfo.unread.map(e).join('، '):''}</span>`:''}${LRN.length?`<span class="lrn">✎ ${LRN.map(e).join(' · ')}</span>`:''}</div>
  ${r.notice?`<div class="mbg-note">${e(r.notice)}</div>`:''}</header>`;
 /* في وضع اللوحة تنتقل الحصيلة إلى جانب النموذج (H.hd) وتبقى بقية اللوحة تحته */
 if(H)H.hd=hd;
 return `<section class="mb-labres mbg" id="mbLocRes">
 ${H?'':hd}
 ${locInspect(r)}
 ${locCaseMap(r)}
 ${locPen(r,true)}
 ${locQuotes(r,true)}
 ${locOpposing(r,true)}
 <div id="mbgMap">${locGraph(r,L)}</div>
 <div class="mbg-lanes">
  <div class="mbg-lane leg" id="mbgLaws"><div class="mbg-lnh"><i>§</i><b>التشريعات</b><small>النصوص كاملة كما هي في القاعدة</small></div>${cits?`<div class="mbg-grp"><h5>المواد المذكورة في نصك <small>(${(r.citations||[]).length})</small></h5><div class="mbg-rail">${cits}</div></div>`:''}${laws||(!cits?'<p class="m mbg-empty">لم يُطابَق تشريع.</p>':'')}</div>
  <div class="mbg-lane jud" id="mbgRul"><div class="mbg-lnh"><i>⚖</i><b>الأحكام القضائية</b><small>${PR.length} فلسطيني${CR.length?' · '+CR.length+' للمقارنة':''}</small></div>${locYears(L)}<div class="mbg-legend"><span class="top">نقض / عليا</span><span class="app">استئناف</span><span class="first">أول درجة</span>${CR.length?'<span class="cmp">مقارنة</span>':''}</div>
   ${PR.map(rul).join('')||'<p class="m mbg-empty">لا أحكام فلسطينية مطابقة.</p>'}
   ${CR.length?`<div class="mbg-grp cmp" id="mbgCmp"><h5>⇄ للمقارنة والاستئناس (الأردن ومصر) <small>(${CR.length})</small></h5>${CR.map(rul).join('')}</div>`:''}</div>
 </div>
 <div class="mbg-tools" id="mbgTools">${tools}${panel('◷','التسلسل الزمني والمدد',tl,(r.timeline||[]).length)}${panel('¤','المبالغ',am)}${panel('#','أرقام دعاوى وطلبات وردت',cn)}</div>
 <div class="mb-tools"><button class="btn sm" data-act="mbLocCopy">نسخ التقرير</button><button class="btn sm" data-act="mbLocPrint">طباعة A4</button></div></section>`;
}
/* ═══ «خريطة العقل القانوني»: خلاصة بصرية مترابطة فوق التفاصيل ═══
   تحليل القضية يُرسم بمنطق القياس القضائي الذي يفكر به المحامي: الوقائع ← المسألة ← القاعدة ← القضاء ← الإثبات ← الإجراء،
   خلايا متصلة بمسار واحد، كل خلية تلخّص ما وُجد وتنقل إلى تفصيله. وتحتها «أسئلة المستشار»: ما يُسأل عادة في هذا النوع من المسائل،
   ودفوع الخصم وأسئلتك كما وردت في نصك مقرونة بما وُجد لها أو بأنه لم يوجد. تشريح الحكم يُرسم عموداً فقرياً من الهيئة إلى المنطوق
   مع «رحلة الدعوى» زمنياً وفحص حسابي لمواعيد الطعن من تواريخ النص، و«اكتشف ما فاتك» دائرتين متقاطعتين: ما ذكرته وما استندت إليه الأحكام.
   كل ما فيها مستخرج من النتائج نفسها أو قائمة تحقق عامة معلنة؛ لا رأي ولا تقدير. */
const MM_ACC=/قُبل الطعن|نُقض|أُلغي|البراءة/,MM_REJ=/رُدّ الطعن|رُدّ الطلب|عدم القبول|الإدانة/;
/* قائمة تحقق المستشار بحسب الموضوع: أسئلة يطرحها محامٍ متمرّس قبل أن يبني موقفه، مع النموذج الذي يخدمها إن وُجد */
const MM_ASK={
 cheque:[['هل يُطلب تنفيذ الشيك مباشرة لدى دائرة التنفيذ بوصفه ورقة تجارية بدل إقامة دعوى؟','t27'],['هل قُدّم الشيك للوفاء خلال ميعاد تقديمه، وهل وُثّق الرجوع بإشعار البنك؟'],['هل يُسلك الطريق الجزائي (شيك بلا رصيد) إلى جانب المطالبة الحقوقية، وما أثر ذلك على التفاوض؟','t22'],['هل يُخشى تهريب أموال المدين فيُطلب حجز تحفظي؟','t17']],
 contract:[['هل أُنذر المدين عدلياً قبل المطالبة، وتاريخ تبليغ الإنذار ثابت؟','t2'],['هل في العقد شرط تحكيم أو اختصاص مكاني أو شرط جزائي؟'],['هل الالتزام مقابل بالتزام لم يُنفّذ من جهتك (الدفع بعدم التنفيذ)؟'],['هل يُخشى تهريب أموال المدين فيُطلب حجز تحفظي؟','t17']],
 labour:[['هل حُسبت مدة الخدمة والأجر الأخير بدقة، وهل الأجر ثابت بقسائم أو كشوف؟'],['هل وُجّه إشعار أو إنذار قبل الإنهاء، ومتى؟','t31'],['هل تُطالب بكل البنود: المكافأة، بدل الإشعار، الإجازات، الفصل التعسفي؟','t30']],
 rent:[['هل الحالة من حالات الإخلاء المحصورة في المادة 4 من قانون المالكين والمستأجرين؟','t33'],['هل أُنذر المستأجر بواسطة الكاتب العدل ومضت خمسة عشر يوماً؟','t32'],['هل عقد الإيجار مكتوب وما مدته وأجرته وتاريخه؟']],
 accident:[['هل وثيقة التأمين سارية، ومن الجهة الملزمة: شركة التأمين أم الصندوق؟'],['هل التقرير الطبي النهائي ونسبة العجز صادرة؟'],['هل المخطط المروري وضبط الشرطة مرفقان؟']],
 tort:[['هل عناصر المسؤولية الثلاثة ثابتة: الخطأ والضرر والعلاقة السببية؟'],['هل الضرر مقدّر بخبرة أو مستندات مالية؟'],['هل طُلبت المعاينة أو إثبات الحالة قبل زوال المعالم؟','t19']],
 penal:[['ما الوصف الجرمي الأدق، وهل الواقعة جناية أم جنحة؟'],['هل اتُّخذت صفة المدعي بالحق المدني؟','t26'],['هل في الإجراءات (القبض، التفتيش، الاستجواب) ما يُدفع ببطلانه؟']],
 crimproc:[['هل في الإجراءات (القبض، التفتيش، الاستجواب، التبليغ) ما يُدفع ببطلانه؟'],['هل يُطلب الإفراج بالكفالة؟','t23']],
 exec:[['هل السند تنفيذي فعلاً ومبلّغ للمدين؟','t27'],['هل يُطلب حجز ما للمدين لدى الغير أو حبسه؟','t29']],
 land:[['هل الأرض مسجّلة (طابو) أم خاضعة للتسوية أو غير مسجّلة؟'],['هل سند التسجيل وكشف الحدود والمخطط مرفقة؟'],['هل يُخشى التصرف بالعقار فيُطلب وضع إشارة حجز أو منع تصرف؟','t17']],
 personal:[['هل عقد الزواج وشهادات الميلاد مرفقة؟'],['ما القانون المطبّق بحسب المنطقة (الضفة أو غزة)؟']],
 companies:[['هل عقد التأسيس والنظام وشهادة التسجيل محدّثة لدى السجل؟','t43'],['من المفوض بالتوقيع وهل تصرّف ضمن صلاحياته؟']],
 appeal:[['متى بدأ ميعاد الطعن: من صدور الحكم أم من تبليغه؟'],['هل تتوافر بيانات لائحة الطعن كاملة؟','t7']],
 limitation:[['ما تاريخ نشوء الحق بالضبط، وهل انقطع التقادم بمطالبة أو إقرار؟']],
 urgent:[['ما وجه الاستعجال، وهل يُخشى فوات الوقت فعلاً؟','t16']],
 notary:[['هل الوكالة سارية، وهل عُزل الوكيل أو توفي الموكل؟'],['هل الوكالة تشمل التصرف المطلوب صراحة؟','t45']]
};
const MM_GEN=[['هل الخصومة صحيحة: صفة المدعي والمدعى عليه ومصلحتهما؟'],['هل المحكمة مختصة قيمياً ونوعياً ومكانياً؟'],['ما البينة على كل واقعة جوهرية، وعلى من عبء إثباتها؟']];
const mmSent=t=>String(t||'').replace(/\r/g,'').split(/(?<=[.؛؟!?])\s+|\n+/).map(x=>x.replace(/\s+/g,' ').trim()).filter(x=>x.length>8);
/* دفوع الخصم وأسئلة المحامي كما وردت في النص */
function mmVoice(src){const S=mmSent(src);
 return {opp:S.filter(s=>/(?:يدفع|تدفع|دفع|يدّعي|تدّعي|يدعي|تدعي|ينكر|تنكر|يتمسك|تتمسك|يزعم|تزعم)\s+(?:ال)?(?:خصم|مدعى عليه|مدعى عليها|مدعي|مدعية|مشتكى عليه|مستأنف|طاعن|المدعى|المدعي)?/.test(s)&&!/[؟?]$/.test(s)).slice(0,4),
  ask:S.filter(s=>/[؟?]$/.test(s)).slice(0,5)}}
/* ربط دفع أو سؤال بما وُجد في النتائج: كلمات مفتاحية → خلية */
function mmLink(s,r){const n=String(s);
 if(/اختصاص|مختص/.test(n))return r.jurisdiction?['⚑','الاختصاص القيمي: '+(r.jurisdiction.verdict||'انظر الخلية'),'mbgTools']:['⚑','لم يُحسم الاختصاص القيمي آلياً: لا مبلغ بالدينار في النص','mbgTools'];
 if(/ميعاد|مدة|تقادم|مرور الزمن/.test(n))return (r.deadlines||[]).length?['⏱',(r.deadlines||[]).length+' ميعاد بنصه في خلية الإجراء','mbgTools']:['⏱','لم تُطابق مواعيد','mbgTools'];
 if(/بين[ةه]|بينات|إثبات|اثبات|دليل/.test(n))return (r.requisites||[]).length?['▤',(r.requisites||[]).length+' مقطعاً مما اشترطته المحاكم في الإثبات','mbgReq']:['▤','لم تُستخرج شروط إثبات من الأحكام','mmEvid'];
 if(/فائد|فوائد/.test(n)){const hit=(r.laws||[]).some(L=>(L.articles||[]).some(a=>/فائد|فوائد/.test(a.text||'')));return hit?['§','وُجدت مادة تذكر الفائدة ضمن التشريعات','mbgLaws']:['∅','لم تُطابق مادة عن الفائدة؛ ابحث عنها مستقلة: «الفائدة القانونية على الدين التجاري»','']}
 if(/مواصفات|مطابق|عيب|معيب/.test(n))return ['§','مسألة مطابقة المبيع وعيوبه: ابحثها مستقلة ليُطابَق نصها («خيار العيب» في المجلة)',''];
 if(/تبليغ|تبلغ/.test(n))return ['§','راجع صحة التبليغ في قانون الأصول','mbgLaws'];
 return null}
function mmCell(o){return `<button type="button" class="mm-cell ${o.cls||''} ${o.n?'':'empty'}" ${o.go?`data-mbgo="${o.go}"`:''} style="--d:${o.i}"><span class="mm-ix">${o.i+1}</span><header><i>${o.ic}</i><b>${o.t}</b><em>${o.n==null?'':o.n}</em></header><div class="mm-cb">${o.body||`<p class="mm-none">${o.none||'لم يُعثر على شيء هنا'}</p>`}</div><small class="mm-q">${o.q}</small></button>`}
function mmCase(r){
 const src=LOC.mode==='case'?'':(LOC.text||''),V=mmVoice(src+'\n'+(r.inspect?(r.inspect.issues||[]).flatMap(i=>i.facts||[]).join('\n'):''));
 const tl=r.timeline||[],am=r.amounts||[],tops=r.topics||[],laws=r.laws||[],ruls=r.rulings||[],cits=r.citations||[];
 const span=tl.length>1?Math.round((new Date(tl[tl.length-1].date)-new Date(tl[0].date))/864e5):null;
 const tot=Object.entries(r.amountTotals||{});
 const acc=ruls.filter(x=>(x.outcome||[]).some(o=>MM_ACC.test(o))).length,rej=ruls.filter(x=>(x.outcome||[]).some(o=>MM_REJ.test(o))).length,oth=ruls.length-acc-rej;
 const tiers={top:0,app:0,first:0,oth:0};ruls.forEach(x=>tiers[BTIER(x.court)[0]]++);
 const ev=r.inspect&&r.inspect.evidence||[],evOk=ev.filter(x=>x.status==='doc').length,evTx=ev.filter(x=>x.status==='text').length,evMiss=ev.filter(x=>x.status==='missing').length;
 const nArt=laws.reduce((s,l)=>s+(l.articles||[]).length,0)+cits.filter(c=>c.found).length;
 const spark=tl.length?`<div class="mm-spark">${tl.map((t,i)=>{const x=span?Math.round((new Date(t.date)-new Date(tl[0].date))/864e5/span*100):50;return `<i style="inset-inline-start:${x}%" title="${e(t.date)}"></i>`}).join('')}<span></span></div>`:'';
 const cells=[
  {ic:'◷',t:'الوقائع',n:tl.length+am.length||null,go:'mbgTools',q:'ماذا حدث، ومتى، وبكم؟',none:'لا تواريخ ولا مبالغ في النص',
   body:tl.length||am.length?`${spark}<ul class="mm-ul">${tl.length?`<li><b class="mono">${e(tl[0].date)}</b>${tl.length>1?` ← <b class="mono">${e(tl[tl.length-1].date)}</b> <small>(${span} يوماً)</small>`:''}</li>`:''}${tot.map(([c,v])=>`<li><b class="mono">${Number(v).toLocaleString('en')}</b> ${e(c)} <small>مجموع ما ورد</small></li>`).join('')}${tl.length?`<li><small>أقدم واقعة منذ ${tl[0].fromToday} يوماً</small></li>`:''}</ul>`:''},
  {ic:'◉',t:'المسألة',n:tops.length||null,go:'mbgMap',q:'ما الذي يتنازع عليه الطرفان قانوناً؟',none:'لم يُتعرّف على موضوع؛ أضف كلمات الوقائع',
   body:tops.length?`<div class="mm-chips">${tops.map(t=>`<span class="mm-topic">${e(t.label)}</span>`).join('')}</div>${(r.inspect&&(r.inspect.issues||[]).length)?`<ul class="mm-ul">${r.inspect.issues.slice(0,4).map(i=>`<li>${i.found?'✓':'∅'} ${e(i.label)}</li>`).join('')}</ul>`:''}`:''},
  {ic:'§',t:'القاعدة',n:nArt||null,go:'mbgLaws',q:'ما النص الذي يحكم المسألة؟',none:'لم يُطابَق تشريع',cls:'law',
   body:laws.length||cits.length?`<ul class="mm-ul">${cits.filter(c=>c.found).slice(0,2).map(c=>`<li class="you">✎ ${e(c.label)} <small>${e(c.lawTitle||'')}</small></li>`).join('')}${laws.slice(0,3).map(l=>`<li class="${/ملغ/.test(l.status||'')?'bad':''}"><b>${e(String(l.title).replace(/\s*(?:رقم|لسنة).*$/,''))}</b> ${(l.articles||[]).slice(0,4).map(a=>`<span class="mm-n">${e(a.n)}</span>`).join('')}</li>`).join('')}</ul>`:''},
  {ic:'⚖',t:'القضاء',n:ruls.length||null,go:'mbgRul',q:'كيف فصلت المحاكم في مثلها؟',none:'لا أحكام فلسطينية مطابقة',cls:'jud',
   body:ruls.length?`<div class="mm-tiers">${[['top','نقض/عليا'],['app','استئناف'],['first','أول درجة']].filter(([k])=>tiers[k]).map(([k,t])=>`<span class="mt-${k}"><b>${tiers[k]}</b>${t}</span>`).join('')}</div>${acc+rej?`<div class="mm-bal" title="في الأحكام المطابقة: الطعون المقبولة مقابل المردودة"><span class="acc" style="flex:${acc||.001}">${acc} قُبل</span><span class="rej" style="flex:${rej||.001}">${rej} رُدّ</span>${oth?`<span class="oth" style="flex:${oth}">${oth}</span>`:''}</div><small class="mm-bl">نتيجة الطعن في الأحكام الأقرب (تصنيف آلي للمنطوق)</small>`:''}`:''},
  {ic:'▤',t:'الإثبات',n:ev.length||(r.requisites||[]).length||null,go:ev.length?'mbgInsp':'mbgReq',q:'بماذا تُثبت كل واقعة؟',cls:'evd',
   none:'شغّل «افحص ملف القضية» لمقارنة مستنداتك بقائمة الأدلة',
   body:ev.length?`<div class="mm-ev"><span class="ok"><b>${evOk}</b>مرفق</span><span class="tx"><b>${evTx}</b>مذكور فقط</span><span class="miss"><b>${evMiss}</b>ناقص</span></div><ul class="mm-ul">${ev.filter(x=>x.status!=='doc').slice(0,3).map(x=>`<li class="${x.status}">${x.status==='missing'?'✗':'◐'} ${e(x.label)}</li>`).join('')}</ul>`:(r.requisites||[]).length?`<p class="mm-p">${(r.requisites||[]).length} مقطعاً من أحكام تبيّن ما اشترطته المحاكم في الإثبات</p>`:''},
  {ic:'⚑',t:'الإجراء',n:((r.deadlines||[]).length+(r.jurisdiction?1:0))||null,go:'mbgTools',q:'أين تُرفع، ومتى، وبأي ميعاد؟',none:'لا اختصاص ولا مواعيد مطابقة',cls:'proc',
   body:r.jurisdiction||(r.deadlines||[]).length?`${r.jurisdiction&&r.jurisdiction.claim!=null?`<div class="mm-jur"><span>${Number(r.jurisdiction.claim).toLocaleString('en')}</span><i class="${r.jurisdiction.claim>r.jurisdiction.limit?'over':''}" style="--p:${Math.min(100,Math.round(r.jurisdiction.limit/Math.max(r.jurisdiction.claim,r.jurisdiction.limit)*100))}%"></i><b>${r.jurisdiction.claim>r.jurisdiction.limit?'البداية':'الصلح'}</b></div><small class="mm-bl">حد الصلح ${Number(r.jurisdiction.limit||0).toLocaleString('en')} دينار (المادة 39)</small>`:''}<div class="mm-chips">${(r.deadlines||[]).slice(0,4).map(d=>`<span class="mm-dl">⏱ ${d.days?d.days+' يوماً':''} <small>${e(d.label.replace(/^ميعاد\s*/,''))}</small></span>`).join('')}</div>`:''}
 ];
 /* أسئلة المستشار */
 const ids=[...new Set([...tops.map(t=>t.id),...((r.inspect&&r.inspect.issues)||[]).map(i=>i.id)])];
 const asks=[...ids.flatMap(id=>(MM_ASK[id]||[]).map(a=>[...a,id])),...MM_GEN.map(a=>[...a,''])].filter((a,i,A)=>A.findIndex(b=>b[0]===a[0])===i).slice(0,8);
 const opp=V.opp.map(s=>({s,l:mmLink(s,r)})),ask=V.ask.map(s=>({s,l:mmLink(s,r)}));
 const voice=(arr,ic,t,cls)=>arr.length?`<div class="mm-voice ${cls}"><h5><i>${ic}</i>${t}</h5>${arr.map(x=>`<div class="mm-vi"><q>${e(x.s)}</q>${x.l?`<span class="mm-ans ${x.l[2]?'':'none'}" ${x.l[2]?`data-mbgo="${x.l[2]}"`:''}><i>${x.l[0]}</i>${e(x.l[1])}</span>`:`<span class="mm-ans none"><i>∅</i>لم يُربط بنتيجة؛ ابحث فيه مستقلاً</span>`}</div>`).join('')}</div>`:'';
 const done=LOC.mmDone||(LOC.mmDone={});
 const sum=[tops.length?`المسألة: <b>${e(tops.map(t=>t.label).join('، '))}</b>`:'',laws.length?`تحكمها نصوص من <b>${laws.length}</b> تشريع`:'لم يُطابَق تشريع',ruls.length?`وفي مثلها <b>${ruls.length}</b> حكماً فلسطينياً${acc+rej?` (قُبل الطعن في ${acc} ورُدّ في ${rej})`:''}`:'',r.jurisdiction&&r.jurisdiction.verdict?`والاختصاص القيمي: <b>${r.jurisdiction.claim>r.jurisdiction.limit?'محكمة البداية':'محكمة الصلح'}</b>`:''].filter(Boolean).join('، ');
 return `<section class="mm" id="mmMap">
  <header class="mm-hd"><div><h3><i>✦</i> خريطة العقل القانوني</h3><p>من الواقعة إلى الإجراء كما يفكر المحامي: كل خلية تلخّص ما وُجد وتنقلك إلى تفصيله</p></div><span class="mm-ms">${r.ms!=null?(r.ms/1000).toFixed(1)+' ث على الجهاز':''}</span></header>
  <p class="mm-sum">${sum}.</p>
  <div class="mm-flow"><svg class="mm-wire" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true"><path d="M250 50 H150 H50 V150 H150 H250"/></svg>${cells.map((c,i)=>mmCell({...c,i})).join('')}</div>
  <div class="mm-low">
   <section class="mm-coun"><h4><i>❖</i> أسئلة المستشار <small>ما يسأله محامٍ متمرّس قبل بناء موقفه في هذا النوع من المسائل — علّم ما تحققت منه</small></h4>
    <ol>${asks.map((a,i)=>{const k=a[0].slice(0,40);return `<li class="${done[k]?'ok':''}"><label><input type="checkbox" data-mmk="${e(k)}" ${done[k]?'checked':''}><span>${e(a[0])}</span></label>${a[1]&&typeof TPL!=='undefined'&&TPL[a[1]]?`<button type="button" class="mm-tpl" data-act="mmTpl" data-v="${a[1]}">✎ ${e(TPL[a[1]].name)}</button>`:''}</li>`}).join('')}</ol>
    <small class="mm-bl">قائمة تحقق عامة بحسب موضوع المسألة، لا تحليل لوقائعك.</small></section>
   <div class="mm-side">${voice(opp,'⚔','دفوع الخصم كما وردت في نصك','opp')}${voice(ask,'؟','أسئلتك وما وُجد لها','ask')}
    ${!opp.length&&!ask.length?`<div class="mm-voice tip"><h5><i>💡</i>اجعل المسبار يجيبك</h5><p>اكتب في الوقائع دفوع الخصم بصيغة «يدفع المدعى عليه بأن…»، وأسئلتك منتهية بعلامة «؟»؛ فتظهر هنا مربوطة بما وُجد لها.</p></div>`:''}
    ${(r.defenses||[]).length?`<div class="mm-voice def" id="mmEvid"><h5><i>⛨</i>ما ردّت به المحاكم في دفوع مشابهة</h5><p>${(r.defenses||[]).length} مقطعاً من أحكام الأقرب — في التفاصيل تحت «الأحكام»</p></div>`:''}</div>
  </div></section>`}
/* ── تشريح الحكم: عمود فقري من الهيئة إلى المنطوق، ورحلة الدعوى زمنياً ── */
function mmDissect(r){
 const res=r.result||[],acc=res.some(o=>MM_ACC.test(o)),rej=res.some(o=>MM_REJ.test(o));
 const apl=(r.parties||[]).filter(p=>/طاعن|مستأنف|مستدع|معترض|مدع(?!ى)/.test(p.role)&&!/ضد|عليه|عليها/.test(p.role)),res2=(r.parties||[]).filter(p=>!apl.includes(p));
 const vert=[['⚖','المحكمة والهيئة',r.court?`${e(r.court)}${r.panel?`<small>${e(r.panel)}</small>`:''}`:'',r.court],['⚐','الحكم المطعون فيه',e(r.appealed||''),r.appealed],['✎','أسباب الطعن',e(String(r.grounds||'').slice(0,280))+(String(r.grounds||'').length>280?'…':''),r.found&&r.found.grounds],['☷','تعليل المحكمة',e(String(r.reasoning||'').replace(/^المحكم[ةه]\s*/,'').slice(0,320))+(String(r.reasoning||'').length>320?'…':''),r.found&&r.found.reasoning],['◆','المنطوق',e(r.operative||r.opGuess||''),r.operative||r.opGuess]];
 /* رحلة الدعوى: التواريخ بترتيبها مع وصف مختصر من سياقها، وفحص حسابي لميعاد الطعن بين «صدور حكم» و«تقديم طعن» */
 const ds=(r.dates||[]).slice().sort((a,b)=>a.date.localeCompare(b.date)),lab=c=>/تبل[غّ]/.test(c)?['nt','تبليغ']:/(?:تقدم|تقدّم|قدّم|قدم)\S*\s+(?:\S+\s+){0,4}(?:بهذا\s+)?(?:ال)?(?:طعن|استئناف|اعتراض)/.test(c)?['up','تقديم طعن']:/أصدرت|حكمها|القاضي|قضت|قرارها|الصادر/.test(c)?['jd','صدور حكم']:/أقام|أقيمت|سجل|الدعوى رقم/.test(c)?['fl','إقامة دعوى']:/توريد|عقد|اتفق|تسليم/.test(c)?['fc','واقعة']:['oth','تاريخ'];
 const J=ds.map(d=>({...d,k:lab(d.ctx)})),chk=[];
 const lim=/النقض|العليا/.test(r.court||'')?[40,'227','النقض']:/استئناف/.test(r.court||'')?[30,'205','الاستئناف']:null;
 /* فحص واحد: أول «تقديم طعن» بعد آخر «صدور حكم» يسبقه */
 {const u=J.findIndex((x,i)=>x.k[0]==='up'&&J.slice(0,i).some(y=>y.k[0]==='jd'));if(u>=0&&lim){const j=J.slice(0,u).reverse().find(x=>x.k[0]==='jd'),g=Math.round((new Date(J[u].date)-new Date(j.date))/864e5);chk.push({g,ok:g<=lim[0],from:j.date,to:J[u].date})}}
 const cites=r.citations||[];
 const total=ds.length>1?Math.round((new Date(ds[ds.length-1].date)-new Date(ds[0].date))/864e5):null;
 return `<section class="mm mm-dis" id="mmMap">
  <header class="mm-hd"><div><h3><i>✦</i> تشريح الحكم</h3><p>${e(r.title||'')}</p></div><span class="mm-res ${acc?'acc':rej?'rej':''}">${res.length?res.map(e).join(' · '):'لم تُصنّف النتيجة'}</span></header>
  <div class="mm-dgrid">
   <div class="mm-spine">
    ${(r.parties||[]).length?`<div class="mm-vs"><div class="a"><small>${e((apl[0]||{}).role||'الطرف الأول')}</small>${apl.map(p=>`<b>${e(p.name)}</b>`).join('')||'—'}</div><span>⟷</span><div class="b"><small>${e((res2[0]||{}).role||'الطرف الثاني')}</small>${res2.map(p=>`<b>${e(p.name)}</b>`).join('')||'—'}</div></div>${(r.counsel||[]).length?`<small class="mm-bl">الوكلاء: ${r.counsel.map(e).join('، ')}</small>`:''}`:''}
    ${vert.map(([ic,t,b,ok],i)=>`<div class="mm-vert ${ok?'':'miss'} ${i===4?'op':''}" style="--d:${i}"><i>${ic}</i><div><b>${t}</b>${ok?`<p>${b}</p>`:'<p class="mm-none">لم يُعثر على هذا القسم في النص</p>'}</div></div>`).join('')}
   </div>
   <aside class="mm-jr"><h4><i>◷</i> رحلة الدعوى ${total!=null?`<small>${total} يوماً من أول تاريخ إلى آخره</small>`:''}</h4>
    ${J.length?`<ol class="mm-trip">${J.map((d,i)=>`<li class="${d.k[0]}"><span class="mono">${e(d.date)}</span><b>${d.k[1]}</b><small>${e(d.ctx.slice(0,90))}…</small>${i&&d.sincePrev!=null?`<em>+${Math.round((new Date(d.date)-new Date(J[i-1].date))/864e5)} يوماً</em>`:''}</li>`).join('')}</ol>`:'<p class="mm-none">لا تواريخ في النص</p>'}
    ${chk.length?chk.map(c=>`<div class="mm-chk ${c.ok?'ok':'bad'}"><b>${c.ok?'✓':'⚠'} ${c.g} يوماً</b> بين صدور الحكم (${e(c.from)}) وتقديم الطعن (${e(c.to)}) — ميعاد ${lim[2]} ${lim[0]} يوماً (المادة ${lim[1]} من قانون الأصول)<small>حساب من تواريخ النص لا يستبعد يوم الصدور ولا يعرف تاريخ التبليغ؛ للتحقق فقط.</small></div>`).join(''):''}
    ${cites.length?`<h4><i>§</i> النصوص التي استند إليها <small>${cites.length}</small></h4><div class="mm-chips">${cites.map(c=>`<span class="mm-cite ${c.found?'':'miss'}">${e(c.label||('المادة '+c.article))} <small>${e(String(c.lawTitle||c.phrase||'').replace(/\s*(?:رقم|لسنة).*$/,''))}</small></span>`).join('')}</div>`:''}
    <div class="mm-voice tip"><h5><i>❖</i>كيف تقرأه كمحامٍ</h5><p>${acc?'الطعن قُبل: ابحث في التعليل عن الخطأ الذي عابته المحكمة على الحكم المطعون فيه؛ هو ما تستشهد به.':rej?'الطعن رُدّ: التعليل يبيّن لماذا لم تُنتج أسباب الطعن أثرها؛ تجنّب الصياغة نفسها أو استند إليه إن كنت في موقع المطعون ضده.':'حدّد المبدأ الذي قرره التعليل وما إذا كان قاطعاً في المسألة أم مرتبطاً بوقائعها.'}</p></div>
   </aside>
  </div></section>`}
/* ── اكتشف ما فاتك: دائرتان متقاطعتان، ثم ما ذكرته وما فاتك وما لم تتطرق إليه ── */
function mmGaps(r){
 const C=r.cited||[],M=r.missed||[],U=r.unseenRulings||[],D=r.defenses||[],cov=r.coveredCount||0;
 const bad=C.filter(c=>!c.found||c.repealed||(c.valid&&(c.valid.flags||[]).some(f=>f.level!=='info'))),amd=C.filter(c=>c.valid&&(c.valid.flags||[]).some(f=>f.level==='info'));
 const opp=U.filter(x=>/يعارض/.test(x.stance||'')),sup=U.filter(x=>/يؤيد|يدعم/.test(x.stance||''));
 const sc=Math.max(0,Math.min(100,Math.round((C.filter(c=>c.found).length+cov)/Math.max(1,C.length+M.length+D.length)*100)));
 return `<section class="mm mm-gap" id="mmMap">
  <header class="mm-hd"><div><h3><i>✦</i> خريطة ما فاتك</h3><p>ما بنيت عليه مذكرتك مقابل ما بنت عليه الأحكام الأقرب لموضوعها</p></div><div class="mm-cov" style="--p:${sc}"><b>${sc}%</b><small>تغطية</small></div></header>
  <div class="mm-venn"><svg viewBox="0 0 320 170" aria-hidden="true"><circle cx="205" cy="85" r="72" class="you"/><circle cx="115" cy="85" r="72" class="crt"/></svg>
   <div class="v you"><b>${C.length}</b><span>ذكرتَه</span></div><div class="v both"><b>${cov}</b><span>مشترك</span></div><div class="v crt"><b>${M.length}</b><span>فاتك</span></div></div>
  <div class="mm-g3">
   <section class="mm-gc you"><h4><i>✎</i> ما ذكرتَه <small>${C.length}</small></h4>${C.map(c=>{const f=!c.found?['bad','لم يُعثر عليها']:c.repealed?['bad','ملغاة']:(c.valid&&(c.valid.flags||[]).some(x=>x.level!=='info'))?['warn','تنبيه سريان']:(c.valid&&(c.valid.flags||[]).length)?['info','معدّلة']:['ok','سليمة'];return `<div class="mm-gi ${f[0]}"><b>${e(c.label||('المادة '+c.article))}</b><small>${e(c.lawTitle||c.phrase||'')}</small><em>${f[1]}</em></div>`}).join('')||'<p class="mm-none">لم تُستخرج مواد من المذكرة</p>'}</section>
   <section class="mm-gc crt"><h4><i>✗</i> ما فاتك <small>${M.length}</small></h4>${M.slice(0,8).map(m=>`<div class="mm-gi miss"><b>${e(m.label||m.cite||('المادة '+(m.article||m.n||'')))}</b><small>${e(m.lawTitle||'')}</small>${m.count||m.n?`<em>${e(m.count||'')} حكم</em>`:''}</div>`).join('')||'<p class="mm-none">لم تفُتك مادة استندت إليها الأحكام الأقرب — أو لم تُطابق أحكام كافية</p>'}</section>
   <section class="mm-gc def"><h4><i>⛨</i> دفوع لم تتطرق إليها <small>${D.length}</small></h4>${D.map(d=>`<div class="mm-gi def"><b>${e(d.label)}</b><small>${(d.articles||[]).map(a=>e(a.label)).join('، ')}</small></div>`).join('')||'<p class="mm-none">لا</p>'}</section>
  </div>
  ${U.length?`<div class="mm-unseen"><h4><i>⚖</i> أحكام قريبة لم تذكرها <small>${U.length}${opp.length?` · ${opp.length} قد يعارض`:''}${sup.length?` · ${sup.length} قد يؤيد`:''}</small></h4><div class="mm-chips">${U.map(x=>`<button type="button" class="mm-ur ${/يعارض/.test(x.stance||'')?'opp':/يؤيد|يدعم/.test(x.stance||'')?'sup':''}" data-act="mbRefOpen" data-v="${x.id}"><b class="mono">${e(x.case_no||'')}</b> ${e(x.court||'')}${x.stance?`<small>${e(x.stance)}</small>`:''}</button>`).join('')}</div></div>`:''}
  ${bad.length||amd.length?`<div class="mm-voice tip warn"><h5><i>⚠</i>قبل تقديم المذكرة</h5><p>${bad.length?`${bad.length} من المواد التي ذكرتها لم يُعثر عليها أو عليها تنبيه سريان — تحقّق من رقمها وقانونها. `:''}${amd.length?`${amd.length} مادة معدّلة: استشهد بنصها بعد التعديل الساري وقت الواقعة.`:''}</p></div>`:''}
 </section>`}
function mmView(r,kind){try{return kind==='dissect'?mmDissect(r):kind==='gaps'?mmGaps(r):mmCase(r)}catch(x){console.error(x);return ''}}
A.mmTpl=v=>{S.tpl=v;S.tplVals={};if(LOC.k)S.tplCase=LOC.k;A.nav('tpls')};
document.addEventListener('change',ev=>{const t=ev.target;if(!t||!t.dataset||!t.dataset.mmk)return;const d=LOC.mmDone||(LOC.mmDone={});d[t.dataset.mmk]=t.checked;const li=t.closest('li');if(li)li.classList.toggle('ok',t.checked)});
(function(){const st=document.createElement('style');st.textContent=`
.mm{--mg:#0F2A44;--mgl:#1E4166;--au:#C9A24A;--aul:#F3D58A;--pa:#FBF6EA;--ln:#E4D3A6;margin:6px 0 18px;padding:18px;border-radius:18px;background:radial-gradient(120% 140% at 100% 0,#14304F 0,#0B1B2B 58%,#0A1724 100%);color:#E8EEF4;box-shadow:0 18px 40px rgb(11 27 43 / .28);position:relative;overflow:hidden}
.mm::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgb(201 162 74 / .06) 1px,transparent 1px),linear-gradient(90deg,rgb(201 162 74 / .06) 1px,transparent 1px);background-size:28px 28px;pointer-events:none}
.mm>*{position:relative}
.mm-hd{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:6px}.mm-hd h3{margin:0;font-size:21px;color:var(--aul);display:flex;align-items:center;gap:8px}.mm-hd h3 i{font-style:normal;color:var(--au);animation:mmSpin 9s linear infinite}.mm-hd p{margin:2px 0 0;font-size:12.5px;color:#9FB2C6}
.mm-ms{font-size:11.5px;color:#9FB2C6;border:1px solid #2B4A6B;border-radius:99px;padding:3px 10px;white-space:nowrap}
.mm-sum{margin:6px 0 14px;padding:10px 14px;border-radius:12px;background:rgb(255 255 255 / .05);border:1px solid rgb(201 162 74 / .25);font-size:14px;line-height:1.9;color:#DCE5EE}.mm-sum b{color:var(--aul)}
.mm-flow{position:relative;display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:minmax(190px,auto);gap:22px 26px}
.mm-wire{position:absolute!important;inset:0;width:100%!important;height:100%!important;display:block!important;overflow:visible;pointer-events:none;z-index:0}.mm-wire path{fill:none;stroke:var(--aul);stroke-width:3;vector-effect:non-scaling-stroke;stroke-dasharray:8 8;opacity:.95;filter:drop-shadow(0 0 4px rgb(243 213 138 / .6));animation:mmFlow 1.6s linear infinite}
.mm-flow>.mm-cell:nth-child(5){grid-row:2;grid-column:3}.mm-flow>.mm-cell:nth-child(6){grid-row:2;grid-column:2}.mm-flow>.mm-cell:nth-child(7){grid-row:2;grid-column:1}
.mm-cell{z-index:1;position:relative;text-align:start;font:inherit;color:inherit;cursor:pointer;display:flex;flex-direction:column;gap:6px;padding:14px 14px 10px;border-radius:16px;background:linear-gradient(160deg,rgb(30 65 102 / .92),rgb(15 42 68 / .95));border:1px solid rgb(201 162 74 / .45);clip-path:polygon(14px 0,calc(100% - 14px) 0,100% 14px,100% calc(100% - 14px),calc(100% - 14px) 100%,14px 100%,0 calc(100% - 14px),0 14px);transition:transform .25s,box-shadow .25s,border-color .25s;animation:mmIn .55s both;animation-delay:calc(var(--d) * 90ms)}
.mm-cell:hover{transform:translateY(-3px);border-color:var(--aul);box-shadow:0 12px 26px rgb(0 0 0 / .35),0 0 0 1px rgb(243 213 138 / .35) inset}
.mm-cell.empty{opacity:.62;background:linear-gradient(160deg,rgb(30 65 102 / .55),rgb(15 42 68 / .6));border-style:dashed}
.mm-ix{position:absolute;top:8px;inset-inline-end:12px;font-size:11px;color:#7F96AE;font-weight:700}
.mm-cell header{display:flex;align-items:center;gap:8px}.mm-cell header i{font-style:normal;width:30px;height:30px;display:grid;place-items:center;border-radius:9px;background:rgb(201 162 74 / .18);color:var(--aul);font-size:16px}.mm-cell header b{font-size:15.5px;color:#fff}.mm-cell header em{font-style:normal;margin-inline-start:auto;margin-inline-end:18px;font-size:22px;font-weight:800;color:var(--aul);font-variant-numeric:tabular-nums}
.mm-cell.law header i{background:rgb(120 180 255 / .16);color:#A9CFFF}.mm-cell.jud header i{background:rgb(240 160 120 / .16);color:#F6C3A6}.mm-cell.evd header i{background:rgb(120 220 170 / .15);color:#9FE3C0}.mm-cell.proc header i{background:rgb(255 255 255 / .1);color:#fff}
.mm-cb{flex:1;font-size:12.8px;line-height:1.7;color:#D4DEE8}.mm-none{margin:0;color:#8EA2B7;font-size:12.5px}.mm-q{font-size:11.5px;color:#8EA2B7;border-top:1px dashed rgb(201 162 74 / .3);padding-top:6px;font-style:italic}
.mm-ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:3px}.mm-ul li small{color:#8EA2B7}.mm-ul li.you{color:var(--aul)}.mm-ul li.bad{color:#F19C8C;text-decoration:line-through}.mm-ul li.missing{color:#F4B1A3}.mm-ul li.text{color:#F3D58A}
.mm-n{display:inline-block;min-width:24px;text-align:center;margin-inline-start:3px;padding:0 5px;border-radius:6px;background:rgb(169 207 255 / .15);color:#CFE4FF;font-size:11.5px;font-weight:700}
.mm-chips{display:flex;flex-wrap:wrap;gap:5px}.mm-topic{padding:3px 10px;border-radius:99px;background:rgb(201 162 74 / .2);color:var(--aul);font-weight:700;font-size:12.5px}
.mm-dl{padding:3px 8px;border-radius:8px;background:rgb(255 255 255 / .08);font-size:12px}.mm-dl small{color:#9FB2C6}
.mm-spark{position:relative;height:16px;margin:2px 0 6px}.mm-spark span{position:absolute;inset:7px 0 auto;height:2px;background:linear-gradient(90deg,transparent,var(--au),transparent)}.mm-spark i{position:absolute;top:3px;width:10px;height:10px;margin-inline-start:-5px;border-radius:50%;background:var(--aul);box-shadow:0 0 0 3px rgb(243 213 138 / .2);z-index:1}
.mm-tiers{display:flex;gap:6px;margin-bottom:6px}.mm-tiers span{flex:1;text-align:center;padding:4px 2px;border-radius:9px;background:rgb(255 255 255 / .06);font-size:11px;color:#B9C8D7}.mm-tiers b{display:block;font-size:17px;color:#fff}.mm-tiers .mt-top b{color:#F6C3A6}.mm-tiers .mt-app b{color:#A9CFFF}
.mm-bal{display:flex;height:22px;border-radius:99px;overflow:hidden;font-size:11px;font-weight:700}.mm-bal span{display:grid;place-items:center;white-space:nowrap;overflow:hidden;min-width:0}.mm-bal .acc{background:#2F7D4A}.mm-bal .rej{background:#9E3B2E}.mm-bal .oth{background:#4C5D70}
.mm-bl{display:block;font-size:11px;color:#8EA2B7;margin-top:4px}
.mm-ev{display:flex;gap:6px;margin-bottom:6px}.mm-ev span{flex:1;text-align:center;padding:4px;border-radius:9px;font-size:11px}.mm-ev b{display:block;font-size:17px}.mm-ev .ok{background:rgb(47 125 74 / .35)}.mm-ev .tx{background:rgb(201 162 74 / .25)}.mm-ev .miss{background:rgb(158 59 46 / .4)}
.mm-p{margin:0}
.mm-jur{display:flex;align-items:center;gap:8px;font-weight:800}.mm-jur span{font-variant-numeric:tabular-nums;color:#fff}.mm-jur b{color:var(--aul)}.mm-jur i{flex:1;height:8px;border-radius:99px;background:linear-gradient(90deg,#2F7D4A 0 var(--p),#9E3B2E var(--p) 100%)}.mm-jur i:not(.over){background:#2F7D4A}
.mm-low{display:grid;grid-template-columns:1.25fr 1fr;gap:16px;margin-top:18px}
.mm-coun,.mm-voice{background:var(--pa);color:#1F2A36;border-radius:14px;padding:14px;border:1px solid var(--ln)}
.mm-coun h4,.mm-voice h5,.mm-jr h4,.mm-gc h4,.mm-unseen h4{margin:0 0 8px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:15px}.mm-coun h4 small,.mm-jr h4 small,.mm-gc h4 small,.mm-unseen h4 small{font-weight:400;color:#7A6A45;font-size:11.5px}.mm-coun h4 i,.mm-voice h5 i{font-style:normal;color:#A07A28}
.mm-coun ol{margin:0;padding:0;list-style:none;counter-reset:q;display:flex;flex-direction:column;gap:6px}.mm-coun li{counter-increment:q;display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:7px 10px;border-radius:10px;background:#fff;border:1px solid #EFE3C6;transition:background .2s}
.mm-coun li label{display:flex;gap:8px;align-items:flex-start;flex:1;min-width:220px;cursor:pointer;font-size:13.5px;line-height:1.7}.mm-coun li label::before{content:counter(q);flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:#0F2A44;color:#F3D58A;font-size:11.5px;font-weight:700}.mm-coun li input{margin-top:5px;accent-color:#2F7D4A}
.mm-coun li.ok{background:#EEF7F0;border-color:#B9DCC4}.mm-coun li.ok span{color:#5C7A63;text-decoration:line-through}
.mm-tpl{border:1px solid #C9A24A;background:#FFF8E6;color:#7A5A12;border-radius:99px;padding:3px 10px;font:inherit;font-size:11.5px;cursor:pointer}.mm-tpl:hover{background:#F3D58A}
.mm-side{display:flex;flex-direction:column;gap:10px}.mm-voice h5{font-size:14px}.mm-voice p{margin:0;font-size:13px;line-height:1.8}
.mm-vi{padding:8px 0;border-top:1px dashed #E6D8B6}.mm-vi:first-of-type{border-top:0;padding-top:0}.mm-vi q{display:block;font-size:13px;line-height:1.75;color:#33404E}.mm-vi q::before,.mm-vi q::after{color:#C9A24A}
.mm-ans{display:inline-flex;gap:6px;align-items:center;margin-top:5px;padding:4px 10px;border-radius:10px;background:#0F2A44;color:#E8EEF4;font-size:12.3px;cursor:pointer;line-height:1.6}.mm-ans i{font-style:normal;color:#F3D58A}.mm-ans.none{background:#F4E9E6;color:#8A3A2A;cursor:default}.mm-ans.none i{color:#8A3A2A}
.mm-voice.opp{border-inline-start:4px solid #9E3B2E}.mm-voice.ask{border-inline-start:4px solid #2B5B8A}.mm-voice.def{border-inline-start:4px solid #2F7D4A}.mm-voice.tip{background:rgb(255 255 255 / .07);color:#DCE5EE;border-color:rgb(201 162 74 / .35)}.mm-voice.tip.warn{background:#FFF4E5;color:#6B4A12;border-color:#E9C27A}
/* تشريح */
.mm-res{padding:6px 14px;border-radius:99px;font-weight:800;font-size:13px;background:#4C5D70;white-space:nowrap}.mm-res.acc{background:#2F7D4A}.mm-res.rej{background:#9E3B2E}
.mm-dgrid{display:grid;grid-template-columns:1.35fr 1fr;gap:18px;margin-top:10px}
.mm-spine{position:relative;padding-inline-start:26px;display:flex;flex-direction:column;gap:10px}.mm-spine::before{content:"";position:absolute;inset-inline-start:10px;top:58px;bottom:16px;width:3px;border-radius:3px;background:linear-gradient(var(--au),#7A5A12)}
.mm-vs{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;margin-inline-start:-26px;padding:10px;border-radius:14px;background:rgb(255 255 255 / .06);border:1px solid rgb(201 162 74 / .3)}.mm-vs>span{color:var(--aul);font-size:20px}.mm-vs div{display:flex;flex-direction:column;gap:2px}.mm-vs small{color:#9FB2C6;font-size:11px}.mm-vs b{font-size:13px;color:#fff}.mm-vs .b{text-align:end}
.mm-vert{position:relative;display:flex;gap:10px;padding:10px 12px;border-radius:12px;background:linear-gradient(160deg,rgb(30 65 102 / .85),rgb(15 42 68 / .9));border:1px solid rgb(201 162 74 / .35);animation:mmIn .5s both;animation-delay:calc(var(--d) * 90ms)}
.mm-vert::before{content:"";position:absolute;inset-inline-start:-21px;top:16px;width:12px;height:12px;border-radius:50%;background:var(--aul);box-shadow:0 0 0 4px rgb(243 213 138 / .2)}
.mm-vert>i{font-style:normal;width:28px;height:28px;flex:none;display:grid;place-items:center;border-radius:8px;background:rgb(201 162 74 / .18);color:var(--aul)}.mm-vert b{color:#fff;font-size:14px}.mm-vert p{margin:3px 0 0;font-size:12.8px;line-height:1.85;color:#D4DEE8;white-space:pre-line}.mm-vert small{display:block;color:#9FB2C6}
.mm-vert.miss{opacity:.55;border-style:dashed}.mm-vert.op{background:linear-gradient(160deg,#3A2E10,#2A210B);border-color:var(--au)}.mm-vert.op p{color:#FCEBC0;font-weight:700}
.mm-jr{display:flex;flex-direction:column;gap:10px}.mm-jr h4{color:var(--aul)}.mm-jr h4 small{color:#9FB2C6!important}
.mm-trip{list-style:none;margin:0;padding:0;position:relative}.mm-trip li{position:relative;display:grid;grid-template-columns:auto 1fr;gap:0 10px;padding:6px 0 10px 0;padding-inline-start:18px;border-inline-start:2px solid #2B4A6B}.mm-trip li::before{content:"";position:absolute;inset-inline-start:-7px;top:9px;width:12px;height:12px;border-radius:50%;background:#7F96AE}
.mm-trip li.jd::before{background:#F3D58A}.mm-trip li.up::before{background:#9FE3C0}.mm-trip li.fl::before{background:#A9CFFF}.mm-trip li.nt::before{background:#F6C3A6}
.mm-trip .mono{font-size:12px;color:#fff;font-weight:700}.mm-trip b{font-size:12.5px;color:var(--aul)}.mm-trip small{grid-column:1/-1;color:#8EA2B7;font-size:11.3px;line-height:1.6}.mm-trip em{grid-column:1/-1;font-style:normal;font-size:11px;color:#9FE3C0}
.mm-chk{padding:9px 12px;border-radius:12px;font-size:12.6px;line-height:1.7}.mm-chk.ok{background:rgb(47 125 74 / .3);border:1px solid #2F7D4A}.mm-chk.bad{background:rgb(158 59 46 / .35);border:1px solid #9E3B2E}.mm-chk b{color:#fff}.mm-chk small{display:block;color:#B9C8D7;font-size:11px}
.mm-cite{padding:4px 9px;border-radius:9px;background:rgb(169 207 255 / .14);color:#CFE4FF;font-size:12px}.mm-cite small{color:#9FB2C6}.mm-cite.miss{background:rgb(158 59 46 / .3)}
/* ما فاتك */
.mm-cov{--p:0;width:74px;height:74px;border-radius:50%;display:grid;place-content:center;text-align:center;background:conic-gradient(#C9A24A calc(var(--p) * 1%),rgb(255 255 255 / .1) 0);position:relative}.mm-cov::before{content:"";position:absolute;inset:7px;border-radius:50%;background:#0F2236}.mm-cov b,.mm-cov small{position:relative}.mm-cov b{font-size:18px;color:var(--aul)}.mm-cov small{font-size:10.5px;color:#9FB2C6}
.mm-venn{position:relative;max-width:420px;margin:4px auto 12px}.mm-venn svg{width:100%!important;height:auto!important;aspect-ratio:320/170;display:block}.mm-venn circle{fill-opacity:.22;stroke-width:2}.mm-venn .you{fill:#A9CFFF;stroke:#A9CFFF}.mm-venn .crt{fill:#F6C3A6;stroke:#F6C3A6}
.mm-venn .v{position:absolute;top:50%;transform:translate(50%,-50%);text-align:center}.mm-venn .v b{display:block;font-size:30px;font-weight:800;color:#fff;line-height:1}.mm-venn .v span{font-size:12px;color:#DCE5EE}.mm-venn .v.you{right:24%}.mm-venn .v.both{right:50%}.mm-venn .v.crt{right:76%}.mm-venn .v.both b{color:var(--aul)}
.mm-g3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.mm-gc{background:var(--pa);color:#1F2A36;border-radius:14px;padding:12px;border-top:4px solid #2B5B8A}.mm-gc.crt{border-top-color:#9E3B2E}.mm-gc.def{border-top-color:#2F7D4A}.mm-gc .mm-none{color:#7A6A45}
.mm-gi{display:grid;grid-template-columns:1fr auto;gap:0 8px;padding:7px 9px;border-radius:9px;background:#fff;border:1px solid #EFE3C6;margin-bottom:5px}.mm-gi b{font-size:13px}.mm-gi small{grid-column:1;color:#7A8592;font-size:11.3px}.mm-gi em{grid-row:1/3;grid-column:2;align-self:center;font-style:normal;font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;background:#EEF7F0;color:#2F7D4A}
.mm-gi.bad em{background:#FCEDEA;color:#9E3B2E}.mm-gi.warn em{background:#FFF4E5;color:#9A5A07}.mm-gi.info em{background:#EAF2FB;color:#2B5B8A}.mm-gi.miss{border-color:#EBC3BA}
.mm-unseen{margin-top:12px}.mm-unseen h4{color:var(--aul)}.mm-ur{font:inherit;cursor:pointer;padding:6px 10px;border-radius:10px;border:1px solid #2B4A6B;background:rgb(255 255 255 / .06);color:#E8EEF4;font-size:12.3px;display:flex;flex-direction:column;align-items:flex-start}.mm-ur small{font-size:11px;color:#9FB2C6}.mm-ur.opp{border-color:#9E3B2E;background:rgb(158 59 46 / .22)}.mm-ur.sup{border-color:#2F7D4A;background:rgb(47 125 74 / .22)}
.mm-unseen .mm-chips{gap:6px}.mm-gap .mm-voice.tip{margin-top:12px}
@keyframes mmIn{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}@keyframes mmFlow{to{stroke-dashoffset:-26}}@keyframes mmSpin{to{transform:rotate(360deg)}}
@media(max-width:900px){.mm-flow{grid-template-columns:1fr}.mm-flow>.mm-cell:nth-child(n){grid-row:auto;grid-column:auto}.mm-wire{display:none}.mm-flow{padding-inline-start:16px;border-inline-start:2px dashed rgb(201 162 74 / .5)}.mm-low,.mm-dgrid,.mm-g3{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){.mm *{animation:none!important}}
@media print{.mm{background:#fff!important;color:#000!important;box-shadow:none}.mm::before,.mm-wire{display:none}.mm-cell,.mm-vert{background:#fff!important;color:#000!important;clip-path:none;border:1px solid #999}.mm-cell *,.mm-vert *{color:#000!important}}
`;document.head.appendChild(st)})();

function locResult(r,ui,H){return ui?locBoard(r,H):locList(r,ui)}
/* التتبّع: تمرير المؤشر يُبرز المرتبطات، والنقر ينقل إلى البطاقة */
(()=>{if(window.__mbgBound)return;window.__mbgBound=1;
 const rel=id=>{const s=new Set([id]);document.querySelectorAll('.mbg [data-lk]').forEach(n=>{const k=n.dataset.lk.split(' ');if(k.length>1&&k.includes(id))k.forEach(z=>s.add(z))});return s};
 let cur=null;const clr=()=>{const b=document.querySelector('.mbg.lk-on');if(b)b.classList.remove('lk-on');document.querySelectorAll('.mbg .lk-hi').forEach(n=>n.classList.remove('lk-hi'));cur=null};
 document.addEventListener('mouseover',ev=>{const t=ev.target.closest&&ev.target.closest('.mbg [data-lk]');if(!t){if(cur)clr();return}const id=t.dataset.mbgo||t.id||t.dataset.lk.split(' ')[0];if(id===cur)return;clr();cur=id;const s=rel(id),b=t.closest('.mbg');b.classList.add('lk-on');b.querySelectorAll('[data-lk]').forEach(n=>{const k=n.dataset.lk.split(' ');if(k.length>1?k.every(z=>s.has(z)):s.has(k[0]))n.classList.add('lk-hi')})});
 document.addEventListener('click',ev=>{const t=ev.target.closest&&ev.target.closest('[data-mbgo]');if(!t)return;const el=document.getElementById(t.dataset.mbgo);if(!el)return;ev.preventDefault();el.scrollIntoView({behavior:'smooth',block:'center'});el.classList.remove('mbg-flash');void el.offsetWidth;el.classList.add('mbg-flash')});
 const css=document.createElement('style');css.textContent=`
.mbg{--lg:#B8892E;--lg2:#F6ECD3;--lg3:#FFFCF4;--jn:#1D3A57;--jn2:#E8EFF6;--jn3:#F7FAFD;--ap:#2D7A78;--fi:#6B7A8C;--cm:#8C8577;border-top:0;padding-top:0}
.mbg-hd{background:linear-gradient(135deg,#0E2236,#16314A 70%,#22405E);color:#EFE6CF;border-radius:16px;padding:16px 18px;margin-top:14px;position:relative;overflow:hidden}
.mbg-hd:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgb(201 162 74/.07) 1px,transparent 1px),linear-gradient(90deg,rgb(201 162 74/.07) 1px,transparent 1px);background-size:22px 22px;pointer-events:none}
.mbg-hd>*{position:relative}.mbg-hl{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;align-items:baseline}.mbg-hl b{font-size:17px;color:#F3D58A}.mbg-hd .m{color:#B9C3CE!important}
.mbg-q{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.mbg-topic{background:#C9A24A;color:#0B1B2B;border-radius:999px;padding:3px 11px;font-size:12.5px;font-weight:700}.mbg-kw{border:1px solid rgb(243 213 138/.35);color:#E9DDBD;border-radius:6px;padding:2px 8px;font-size:12px;font-family:ui-monospace,monospace}
.mbg-kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px;margin-top:12px}
.mbg-k{font:inherit;display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:8px;align-items:center;text-align:start;background:rgb(255 255 255/.06);border:1px solid rgb(255 255 255/.12);border-radius:12px;padding:8px 10px;color:#EFE6CF;cursor:pointer;transition:.15s}
.mbg-k:hover{background:rgb(255 255 255/.12);transform:translateY(-1px)}.mbg-k i{grid-row:span 2;font-style:normal;font-size:20px;width:34px;height:34px;border-radius:9px;display:grid;place-items:center;background:rgb(201 162 74/.18);color:#F3D58A}
.mbg-k b{font-size:20px;line-height:1.1;font-family:ui-monospace,monospace}.mbg-k span{font-size:11.5px;color:#B9C3CE}.mbg-k.n i{background:rgb(120 170 220/.18);color:#AFCFEF}.mbg-k.s i{background:rgb(255 255 255/.1);color:#D6D0C2}.mbg-k.l i{background:rgb(90 190 170/.18);color:#9EE0D2}.mbg-k.t i{background:rgb(240 140 90/.18);color:#F4BC9A}
.mbg-ctx{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:12px;font-size:12.5px;color:#D3DAE2;border-top:1px dashed rgb(255 255 255/.15);padding-top:9px}.mbg-ctx b{color:#F3D58A}.mbg-ctx .lrn{color:#CFE7C9}
.mbg-note{margin-top:8px;font-size:12.5px;color:#B9C3CE;line-height:1.8}
.mbm{margin-top:14px;border:1px solid #E3D7BC;border-radius:16px;background:#FFFEFA;padding:10px 12px;background-image:radial-gradient(#ECE2CA 1px,transparent 1px);background-size:16px 16px}
.mbm-h{display:flex;flex-wrap:wrap;gap:8px;align-items:baseline}.mbm-h b{color:#0E2236}.mbm-h .m{font-size:12px}.mbm-s text{direction:rtl;unicode-bidi:plaintext}.mbm-s{width:100%;height:auto;display:block;margin-top:4px;font-family:inherit}
.mbm-lane{font-size:15px;font-weight:700;fill:#8A6A25;text-anchor:start}.mbm-lane.r{fill:#1D3A57}.mbm-ax{stroke:#C9A24A;stroke-width:2}.mbm-ax.r{stroke:#1D3A57}
.mbm-e{fill:none;stroke:#C9A24A;stroke-width:1.6;opacity:.55;transition:.15s}.mbm-e.cmp{stroke:#8C8577;stroke-dasharray:5 4}
.mbm-n{cursor:pointer}.mbm-n text{font-size:13px;text-anchor:start;fill:#2B2416}.mbm-n.law rect{fill:#F6ECD3;stroke:#B8892E;stroke-width:1.4}.mbm-n.law text{font-weight:700;fill:#5E4512}.mbm-n.law.bad rect{fill:#F8E4DF;stroke:#B0503A}
.mbm-n.art rect{fill:#FFFCF4;stroke:#E2CF9F}.mbm-n.art circle{fill:#B8892E}.mbm-n.art line{stroke:#E2CF9F;stroke-width:2}.mbm-n.art.pin rect{stroke:#B8892E;stroke-width:2}
.mbm-n.rul rect{fill:#F2F6FA;stroke:#9DB2C8}.mbm-n.rul .tier{fill:#6B7A8C;stroke:none}.mbm-n.rul.top .tier{fill:#1D3A57}.mbm-n.rul.app .tier{fill:#2D7A78}.mbm-n.rul.cmp rect{fill:#F4F2EE;stroke:#BDB6A8;stroke-dasharray:4 3}.mbm-n.rul.cmp .tier{fill:#8C8577}
.mbm-n:hover rect{filter:brightness(.96)}.mbm-none{font-size:12px;fill:#9a8b6c;text-anchor:middle}
.mbg.lk-on .mbm-e{opacity:.12}.mbg.lk-on .mbm-e.lk-hi{opacity:1;stroke-width:3}.mbg.lk-on .mbm-n{opacity:.35}.mbg.lk-on .mbm-n.lk-hi{opacity:1}
.mbg.lk-on .mbg-art.lk-hi,.mbg.lk-on .mbg-rul.lk-hi{box-shadow:0 0 0 2px #C9A24A,0 8px 22px rgb(14 34 54/.12)}
.mbg-lanes{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;align-items:start}
.mbg-lane{border-radius:16px;padding:10px;min-width:0}.mbg-lane.leg{background:linear-gradient(180deg,#FBF4E2,#FFFCF4 180px)}.mbg-lane.jud{background:linear-gradient(180deg,#E9F0F7,#F7FAFD 180px)}
.mbg-lnh{display:flex;align-items:center;gap:8px;padding:4px 4px 10px;border-bottom:2px solid var(--lg);margin-bottom:10px}.mbg-lane.jud .mbg-lnh{border-color:var(--jn)}
.mbg-lnh i{font-style:normal;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:var(--lg);color:#fff;font-size:16px}.mbg-lane.jud .mbg-lnh i{background:var(--jn)}.mbg-lnh b{font-size:16px}.mbg-lnh small{margin-inline-start:auto;color:#7a6a4c;font-size:12px}
.mbg-grp h5{margin:4px 2px 8px;font-size:13.5px;color:#5E4512}.mbg-grp.cmp{margin-top:14px;padding-top:8px;border-top:1px dashed #BDB6A8}.mbg-grp.cmp h5{color:#5d574b}
.mbg-law{background:#fff;border:1px solid #E6D4A8;border-radius:14px;margin-bottom:12px;overflow:hidden;box-shadow:0 2px 0 #EFE2C2}.mbg-law.bad{border-color:#E2B4A6}
.mbg-lh{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;background:linear-gradient(90deg,#F6ECD3,#FFFCF4);border-bottom:1px solid #EADBB4}.mbg .mbg-lh{background:linear-gradient(135deg,#0E2236,#16324d 70%,#1d3f5f)!important;border-bottom:3px solid #C9A24A!important;box-shadow:0 4px 12px rgb(14 34 54/.25)}.mbg .mbg-lt b{color:#F7E7BC!important;font-size:15.5px;text-shadow:0 1px 0 rgb(0 0 0/.35)}.mbg .mbg-lh .m,.mbg .mbg-lh small{color:#d9c79a!important}.mbg .mbg-ah b,.mbg .mbg-rt b{display:inline-block;padding:4px 12px;border-radius:9px;background:linear-gradient(135deg,#0E2236,#1b3a58);color:#F7E7BC!important;border-right:4px solid #C9A24A;box-shadow:0 3px 8px rgb(14 34 54/.25)}.mbg .mbg-art:hover .mbg-ah b,.mbg .mbg-rul:hover .mbg-rt b{box-shadow:0 0 0 2px rgb(201 162 74/.5),0 0 14px rgb(243 213 138/.55)}@keyframes mbflow{to{stroke-dashoffset:-24}}.mbg svg .mbm-e{stroke-width:2.2;opacity:.8;stroke-dasharray:7 5;animation:mbflow 1.6s linear infinite;filter:drop-shadow(0 0 2px rgb(243 213 138/.75))}.mbg svg .mbm-e.cmp{animation:none;filter:none;opacity:.55}.mbg.lk-on svg .mbm-e{opacity:.1}.mbg svg .mbm-e.lk-hi{opacity:1;stroke:#E8B93E;stroke-width:3.4;filter:drop-shadow(0 0 5px #F3D58A)}.mbg svg.mbcm-w path{stroke-width:3;opacity:.9;stroke-dasharray:8 6;animation:mbflow 1.8s linear infinite;filter:drop-shadow(0 0 3px rgb(243 213 138/.7))}@media (prefers-reduced-motion:reduce){.mbg svg .mbm-e,.mbg svg.mbcm-w path{animation:none}}
.mbg-seal{flex:none;width:38px;height:38px;border-radius:10px;background:#0E2236;color:#F3D58A;display:grid;place-items:center;font-size:20px;box-shadow:inset 0 0 0 2px #C9A24A}
.mbg-lt{flex:1;min-width:0}.mbg-lt b{color:#3E2F0E;line-height:1.6}.mbg-meta{display:flex;flex-wrap:wrap;gap:5px 10px;margin-top:4px;font-size:12px;color:#6b5a3a;align-items:center}
.mbg-tag{font-size:11.5px;padding:1px 8px;border-radius:999px;background:#F3EBD8;color:#5a4a2c;border:1px solid #e4d3a6;white-space:nowrap}.mbg-tag.lk{background:#E8EFF6;color:#1D3A57;border-color:#C9D6E4}.mbg-tag.you{background:#0E2236;color:#F3D58A;border-color:#0E2236}.mbg-tag.pin{background:#C9A24A;color:#0B1B2B;border-color:#C9A24A}
.mbg-rail{position:relative;padding:8px 10px 4px}.mbg-rail:before{content:"";position:absolute;inset-inline-start:33px;top:10px;bottom:10px;width:2px;background:repeating-linear-gradient(#D9C28A 0 6px,transparent 6px 10px)}
.mbg-art{position:relative;display:flex;gap:10px;margin-bottom:10px;border-radius:12px;transition:box-shadow .2s}
.mbg-num{flex:none;width:48px;height:48px;border-radius:50%;background:#fff;border:2px solid var(--lg);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:1;color:#5E4512;box-shadow:0 0 0 4px #FFFCF4}
.mbg-num span{font-weight:800;font-size:16px;line-height:1;font-family:ui-monospace,monospace}.mbg-num small{font-size:9.5px;color:#8a7a5a}
.mbg-art.pin .mbg-num{background:#C9A24A;color:#0B1B2B}.mbg-art.cite .mbg-num{border-style:dashed;border-color:#0E2236;color:#0E2236}.mbg-art.miss .mbg-num{border-color:#B0503A;color:#B0503A}
.mbg-ab{flex:1;min-width:0;background:var(--lg3);border:1px solid #EADBB4;border-radius:12px;padding:8px 11px}.mbg-art.miss .mbg-ab{background:#FBF3EF;border-color:#ebcfc3}
.mbg-ah{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.mbg-ah b{color:#3E2F0E}.mbg-of{font-size:12.5px;color:#6b5a3a}.mbg-sp{flex:1}.mbg-ah .mb-ref{margin-inline-start:auto}
.mbg-why{font-size:12px;color:#7a6a4c;margin-top:3px}
.mbg-tx{margin-top:6px}.mbg-tx summary{cursor:pointer;font-size:12px;color:#8A6A25;font-weight:600;list-style:none}.mbg-tx summary:before{content:"▾ "}.mbg-tx:not([open]) summary:before{content:"◂ "}
.mbg-tx .mb-loq{margin:6px 0;padding:8px 12px;line-height:1.95;border:0;border-inline-start:4px solid var(--lg);background:#fff;border-radius:0 8px 8px 0;font-size:14px;color:#2B2416}
.mbg-lks{display:flex;flex-wrap:wrap;gap:5px;align-items:center;margin-top:8px;font-size:12px;color:#6b5a3a}
.mbg-go{font:inherit;font-size:12px;border-radius:7px;padding:2px 8px;cursor:pointer;border:1px solid #9DB2C8;background:#F2F6FA;color:#1D3A57}.mbg-go:hover{filter:brightness(.95)}
.mbg-go.top{border-color:#1D3A57;background:#1D3A57;color:#fff}.mbg-go.app{border-color:#2D7A78;background:#E4F2F1;color:#1d5654}.mbg-go.cmp{border-style:dashed;background:#F4F2EE;color:#5d574b;border-color:#BDB6A8}.mbg-go.g{border-color:#C9A24A;background:#FBF4E2;color:#5E4512}
.mbg-cite{font-size:12px;border:1px dotted #C9B98F;border-radius:7px;padding:2px 8px;color:#6b5a3a;background:#fff}
.mbm-yr{width:100%;height:auto;display:block;margin:0 0 4px}.mbm-yr line{stroke:#9DB2C8;stroke-width:2}.mbm-yr text{font-size:12px;fill:#55687c;text-anchor:middle;font-family:ui-monospace,monospace}.mbm-yr circle{fill:#6B7A8C;cursor:pointer}.mbm-yr circle.top{fill:#1D3A57}.mbm-yr circle.app{fill:#2D7A78}.mbm-yr circle.cmp{fill:#fff;stroke:#8C8577;stroke-width:1.5}.mbm-yr circle.lk-hi{r:6}
.mbg-legend{display:flex;flex-wrap:wrap;gap:10px;font-size:11.5px;color:#55687c;margin:0 4px 10px}.mbg-legend span:before{content:"";display:inline-block;width:10px;height:10px;border-radius:3px;margin-inline-end:4px;vertical-align:-1px;background:#6B7A8C}
.mbg-legend .top:before{background:#1D3A57}.mbg-legend .app:before{background:#2D7A78}.mbg-legend .cmp:before{background:#fff;border:1px dashed #8C8577}
.mbg-rul{position:relative;background:#fff;border:1px solid #CFDCE8;border-radius:14px;margin-bottom:12px;overflow:hidden;transition:box-shadow .2s;border-inline-start:6px solid var(--fi)}
.mbg-rul.top{border-inline-start-color:var(--jn)}.mbg-rul.app{border-inline-start-color:var(--ap)}.mbg-rul.cmp{border:1px dashed #BDB6A8;border-inline-start:6px solid var(--cm);background:#FBFAF7}
.mbg-rh{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;background:linear-gradient(90deg,#EEF3F8,#fff)}.mbg-rul.cmp .mbg-rh{background:linear-gradient(90deg,#F1EFEA,#FBFAF7)}
.mbg-court{flex:none;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:62px;padding:5px 6px;border-radius:10px;background:var(--fi);color:#fff;font-size:11px;font-weight:700}
.mbg-court i{font-style:normal;font-size:17px}.mbg-rul.top .mbg-court{background:var(--jn)}.mbg-rul.app .mbg-court{background:var(--ap)}.mbg-rul.cmp .mbg-court{background:#fff;color:#5d574b;border:1px dashed #8C8577}
.mbg-rt{flex:1;min-width:0}.mbg-rt b{color:#13293F;line-height:1.6}.mbg-rt .mbg-meta{color:#55687c}.mbg-rt .mbg-meta span+span:before{content:"· ";color:#9DB2C8}
.mbg-yr{flex:none;font-family:ui-monospace,monospace;font-weight:800;font-size:15px;color:#1D3A57;background:#E8EFF6;border-radius:8px;padding:4px 8px}
.mbg-warn{margin:0 12px;font-size:12px;color:#6b5a3a;background:#F4F2EE;border-radius:8px;padding:4px 8px}
.mbg-ex{margin:8px 12px;padding:8px 12px 8px 12px;background:var(--jn3);border-radius:10px;line-height:1.95;color:#1f3347;position:relative;font-size:14px}.mbg-ex:before{content:"❝";position:absolute;inset-inline-end:8px;top:-4px;font-size:28px;color:#C9D6E4}
.mbg-rul .mbg-lks{padding:0 12px}.mbg-rf{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px 12px;margin-top:6px;border-top:1px solid #E5ECF3;background:#FAFCFE}.mbg-rf .mbg-why{flex:1;margin:0}
.mbg-tools{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px;margin-top:16px}
.mbg-pnl{border:1px solid #E3D7BC;border-radius:14px;background:#FFFEFA;padding:10px 12px;min-width:0}.mbg-pnl:first-child:has(.mbg-dls){grid-column:1/-1}
.mbg-pnl h4{display:flex;align-items:center;gap:8px;margin:0 0 10px;color:#0E2236;font-size:14.5px}.mbg-pnl h4 i{font-style:normal;width:26px;height:26px;border-radius:7px;display:grid;place-items:center;background:#0E2236;color:#F3D58A;font-size:13px}.mbg-pnl h4 small{color:#7a6a4c}
.mbg-dls{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px}.mbg-dl{border:1px solid #EADBB4;border-radius:12px;padding:9px 11px;background:#fff;border-top:4px solid #D9713F}
.mbg-dlh{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:space-between}.mbg-dur{font-family:ui-monospace,monospace;font-weight:800;color:#A24E22;background:#FCEDE3;border-radius:8px;padding:2px 8px}
.mbg-dli{display:flex;flex-direction:column;gap:3px;font-size:12px;color:#6b5a3a;margin-top:8px}.mbg-dlo{margin-top:6px;font-size:13px}.mbg-verdict{font-weight:700;color:#13293F;margin:6px 0}
.mbg-tl{list-style:none;margin:0;padding:0;position:relative}.mbg-tl:before{content:"";position:absolute;inset-inline-start:6px;top:6px;bottom:6px;width:2px;background:#C9A24A}
.mbg-tl li{position:relative;padding:0 0 12px;padding-inline-start:26px}.mbg-tl li:after{content:"";position:absolute;inset-inline-start:1px;top:7px;width:12px;height:12px;border-radius:50%;background:#fff;border:3px solid #0E2236}
.mbg-gap{display:inline-block;font-size:11px;color:#8A6A25;background:#FBF4E2;border-radius:6px;padding:0 6px;margin-bottom:3px}.mbg-tld{display:flex;gap:8px;align-items:baseline}.mbg-tlc{font-size:13px;color:#3b3325;line-height:1.8}
.mbg-amts{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}.mbg-amt{border:1px solid #EADBB4;border-radius:10px;padding:8px 10px;background:#fff;display:flex;flex-direction:column}.mbg-amt b{font-size:18px;color:#0E2236}.mbg-amt span{font-size:12px;color:#8A6A25}
.mbg-cns{display:flex;flex-direction:column;gap:6px}.mbg-cn{display:flex;flex-wrap:wrap;gap:6px;align-items:baseline;border-inline-start:3px solid #1D3A57;padding:2px 8px}
.mbg-empty{padding:10px}.mbg-flash{animation:mbgf 1.4s ease}@keyframes mbgf{0%,40%{box-shadow:0 0 0 3px #C9A24A,0 0 0 9px rgb(201 162 74/.25)}100%{box-shadow:none}}
.mbp{margin-top:14px;border:1px solid #E6B9A8;border-radius:16px;background:linear-gradient(180deg,#FCEFEA,#FFFBF8 120px);padding:12px 14px}.mbp h4{display:flex;align-items:center;gap:8px;margin:0 0 10px;color:#7A2E1C;font-size:15px}.mbp h4 i{font-style:normal;width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:#7A2E1C;color:#FCE3D8}.mbp h4 small{color:#9a6a5a}.mbp-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:10px}.mbp-c{background:#fff;border:1px solid #EBCFC3;border-top:4px solid #B0503A;border-radius:12px;padding:9px 12px;min-width:0}.mbp-c header{display:flex;flex-wrap:wrap;gap:6px;align-items:baseline}.mbp-c header b{color:#5a1f12}.mbp-c header .mbg-go,.mbp-c header .mb-ref{margin-inline-start:auto}.mbp-k{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.mbp-kind{font-size:12px;font-weight:700;border-radius:999px;padding:2px 10px;background:#6B7A8C;color:#fff}.mbp-kind.k0{background:#1a1a1a}.mbp-kind.k1{background:#7A1E12}.mbp-kind.k2{background:#B0503A}.mbp-kind.k3{background:#C77A2A}.mbp-kind.k4{background:#2D7A78}.mbp-m{font-size:12.5px;font-weight:700;border:1px solid #E6B9A8;background:#FFF4EF;color:#7A2E1C;border-radius:8px;padding:2px 9px}.mbp-t small,.mbp-ref small{display:block;font-size:11.5px;color:#9a6a5a;margin-top:4px}.mbp blockquote{margin:5px 0;padding:7px 11px;border-inline-start:4px solid #B0503A;background:#FFF8F5;border-radius:0 8px 8px 0;line-height:1.95;font-size:14px;color:#2B2416}.mbp-ref{margin-top:8px;padding-top:6px;border-top:1px dashed #EBCFC3}.mbp-n{font-size:12px;margin:8px 0 0}.mbg-k.p i{background:rgb(230 120 100/.22);color:#F7B9A6}html.night .mbp{background:#2B1E1A;border-color:#5a3328}html.night .mbp-c{background:#2A231F;border-color:#5a3328}html.night .mbp blockquote{background:#33261F;color:#EDE3CC}html.night .mbp h4,html.night .mbp-c header b{color:#F7C9B8}html.night .mbp-m{background:#3a2620;color:#F7C9B8;border-color:#5a3328}.mbr{display:flex;flex-direction:column;gap:14px;margin-top:12px}.mbr-sec{border:1px solid #E3D7BC;border-radius:14px;padding:12px 14px;background:#FFFEFA}.mbr-sec h3{margin:0 0 10px;font-size:15px;color:#0E2236;display:flex;align-items:center;gap:8px}.mbr-badge{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:#B0503A;color:#fff;font-size:11.5px}.mbr-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px}.mbr-c{border:1px solid #EADBB4;border-top:4px solid #C9A24A;border-radius:12px;padding:9px 12px;background:#fff;min-width:0}.mbr-c.miss{opacity:.6}.mbr-c header{display:flex;gap:6px;align-items:center}.mbr-c header .mb-ref{margin-inline-start:auto}.mbr-vals{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}.mbr-v{border:1px solid #E4D3A6;background:#FBF4E2;border-radius:10px;padding:4px 10px}.mbr-v b{font-size:17px;color:#0E2236}.mbr-v small{color:#7a6a4c}.mbr-warn{font-size:12.5px;background:#FBF0D6;color:#6b4c0e;border-radius:8px;padding:6px 9px;margin:6px 0 0}.mbr-ok{background:#E7F0E8;color:#2f5b3c;border-radius:8px;padding:8px 10px;margin:0}.mbr-office{margin-top:12px;border-top:1px dashed #E3D7BC;padding-top:10px}.mbr-office h4{margin:0 0 6px;font-size:13.5px;color:#5E4512}.mbr-f{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px}.mbr-f label,.mbr-office label.wide{display:flex;flex-direction:column;gap:4px;font-size:12.5px;color:#7a6a4c}.mbr-case{border:1px solid #EBCFC3;border-inline-start:5px solid #B0503A;border-radius:12px;padding:8px 12px;margin-bottom:8px;background:#fff}.mbr-case header{display:flex;align-items:center;gap:8px}.mbr-case header .btn{margin-inline-start:auto}.mbr-al{margin-top:6px}.mbr-hit{border-inline-start:3px solid #1D3A57;padding:4px 10px;margin:8px 0}#mbrQ{flex:1;min-width:200px}html.night .mbr-sec,html.night .mbr-c,html.night .mbr-case{background:#2A261D;border-color:#4A4130}html.night .mbr-sec h3{color:#F3D58A}html.night .mbr-v{background:#332D21;border-color:#4A4130}html.night .mbr-v b{color:#F3D58A}.mbcm{margin-top:14px;border:1px solid #D9C9A4;border-radius:18px;padding:12px 14px;background:radial-gradient(ellipse at center,#FFFDF7,#F6EEDC 70%,#EFE4CC)}.mbcm-g{position:relative;display:grid;grid-template-columns:1fr 1.05fr 1fr;gap:18px 26px;margin-top:10px;align-items:stretch}.mbcm-w{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0}.mbcm-w path{fill:none;stroke-width:2.4;opacity:.85}.mbcm-col{display:flex;flex-direction:column;gap:14px;justify-content:space-between;position:relative;z-index:1}.mbcm-col.c{align-items:center;justify-content:center;gap:22px}.mbcm-c{width:230px;height:230px;border-radius:50%;background:#0E2236;border:4px solid #C9A24A;box-shadow:0 0 0 8px rgb(201 162 74/.18),0 12px 30px rgb(14 34 54/.35);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:18px;color:#F3D58A;gap:3px}.mbcm-c small{color:#B9C3CE;font-size:11.5px;margin-bottom:4px}.mbcm-c b{font-size:15px;line-height:1.4}.mbcm-c em{font-style:normal;font-size:10.5px;color:#C9D2DC;line-height:1.5;margin-top:6px;max-height:48px;overflow:hidden}.mbcm-n{font:inherit;text-align:start;display:grid;grid-template-columns:1fr auto;grid-template-areas:"t i" "c i" "u u";column-gap:10px;background:#fff;border:1.6px solid #C9A24A;border-radius:14px;padding:9px 12px;cursor:pointer;box-shadow:0 3px 8px rgb(14 34 54/.1);transition:.15s;color:#2B2416;min-width:0}.mbcm-n:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgb(14 34 54/.16)}.mbcm-n i{grid-area:i;font-style:normal;font-size:20px;width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:#FBF4E2;color:#C9A24A;align-self:start}.mbcm-n b{grid-area:t;font-size:14.5px}.mbcm-n .c{grid-area:c;font-size:12.5px;color:#6b5a3a}.mbcm-n ul{grid-area:u;margin:6px 0 0;padding:6px 0 0;border-top:1px dashed #EADBB4;list-style:none;font-size:11.5px;color:#5a4a2c;line-height:1.6}.mbcm-n li{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mbcm-n li:before{content:"◂ ";color:#C9A24A}.mbcm-n.n{border-color:#1D3A57}.mbcm-n.n i{background:#E8EFF6;color:#1D3A57}.mbcm-n.p{border-color:#B0503A}.mbcm-n.p i{background:#FCEFEA;color:#B0503A}.mbcm-n.q{border-color:#2D7A78}.mbcm-n.q i{background:#E4F2F1;color:#2D7A78}.mbcm-n.d{border-color:#7A2E1C}.mbcm-n.d i{background:#F8E4DF;color:#7A2E1C}.mbcm-n.t{border-color:#D9713F}.mbcm-n.t i{background:#FCEDE3;color:#D9713F}.mbcm-n.s{border-style:dashed;border-color:#8C8577}.mbcm-n.s i{background:#F4F2EE;color:#8C8577}.mbcm-n.b1{width:100%}.mbcm-n.empty{opacity:.5}@media (max-width:900px){.mbcm-g{grid-template-columns:1fr}.mbcm-w{display:none}.mbcm-col.c{order:-1}.mbcm-c{width:200px;height:200px}}html.night .mbcm{background:#221F18;border-color:#4A4130}html.night .mbcm-n{background:#2A261D;color:#EDE3CC}html.night .mbcm-n .c,html.night .mbcm-n li{color:#C9BFA8}.mbq-g{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}.mbq-p.q{border-top:4px solid #2D7A78}.mbq-p.d{border-top:4px solid #7A2E1C}.mbq-p h4 small{font-weight:400;font-size:11.5px}.mbq{margin-bottom:8px}.mbq .mbg-ex{margin:0}.mbq footer{display:flex;gap:8px;align-items:center;padding:4px 12px;font-size:12px}.mbq footer .mb-ref{margin-inline-start:auto}.mbq.q .mbg-ex{background:#EEF6F5;border-inline-start:4px solid #2D7A78}.mbq.d .mbg-ex{background:#FBF0EC;border-inline-start:4px solid #7A2E1C}@media (max-width:900px){.mbq-g{grid-template-columns:1fr}.mbcm{overflow-x:auto}.mbcm-s{min-width:760px}}html.night .mbcm{background:#221F18;border-color:#4A4130}html.night .mbcm-n rect{fill:#2A261D}html.night .mbcm-n text{fill:#EDE3CC}html.night .mbq.q .mbg-ex{background:#1E2E2D}html.night .mbq.d .mbg-ex{background:#2B1E1A}.mb-insp{background:#0E2236!important;color:#F3D58A!important;border-color:#0E2236!important}.mbi{margin-top:14px;display:flex;flex-direction:column;gap:14px}.mbi-log{border:1px solid #C9D6E4;border-radius:16px;background:linear-gradient(135deg,#EEF3F8,#fff);padding:12px 14px}.mbi-log h4{display:flex;align-items:center;gap:8px;margin:0 0 8px;color:#0E2236;font-size:15px}.mbi-log h4 i{font-style:normal;width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:#0E2236;color:#F3D58A}.mbi-log h4 small{color:#55687c;font-weight:400}.mbi-log ol{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px}.mbi-log li{background:#fff;border:1px solid #D6E0EA;border-radius:10px;padding:7px 10px;font-size:12.5px;line-height:1.7}.mbi-log li b{display:block;color:#1D3A57}.mbi-log li span{color:#3c536b}.mbi-g{display:grid;grid-template-columns:1.2fr 1fr;gap:14px}.mbi-iss{border-top:4px solid #0E2236}.mbi-ev{border-top:4px solid #2D7A78}.mbi-i{border:1px solid #E3D7BC;border-radius:12px;padding:8px 11px;margin-bottom:8px;background:#fff}.mbi-i.nf{border-color:#E2B4A6;background:#FBF3EF}.mbi-i header{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.mbi-i header b{color:#0E2236}.mbg-tag.bad{background:#F6E3DE;color:#8a3a2b;border-color:#ebcfc3}.mbi-f{margin:6px 0 0;padding:0 14px 0 0;font-size:12.5px;color:#4b4026;line-height:1.8}.mbi-l{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}.mbi-l span{font-size:11.5px;border:1px solid #E4D3A6;background:#FBF4E2;border-radius:7px;padding:2px 8px;color:#5E4512}.mbi-q{margin-top:8px;font-size:12.5px}.mbi-q ul{margin:4px 0 0;padding-inline-start:18px}.mbi-e{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}.mbi-e li{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:8px;align-items:center;border-radius:10px;padding:6px 10px;font-size:12.5px}.mbi-e li i{grid-row:span 2;font-style:normal;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-weight:800}.mbi-e li b{color:#2B2416}.mbi-e li span{font-size:11.5px}.mbi-e li small{grid-column:2;font-size:10.5px;color:#8a7a5a}.mbi-e li.ok{background:#E7F0E8}.mbi-e li.ok i{background:#2f5b3c;color:#fff}.mbi-e li.warn{background:#FBF0D6}.mbi-e li.warn i{background:#C77A2A;color:#fff}.mbi-e li.bad{background:#F6E3DE}.mbi-e li.bad i{background:#B0503A;color:#fff}@media (max-width:900px){.mbi-g{grid-template-columns:1fr}}html.night .mbi-log{background:#1E252E;border-color:#34485C}html.night .mbi-log li{background:#23303D;border-color:#34485C}html.night .mbi-log li b{color:#AFCFEF}html.night .mbi-log li span{color:#C9D9E8}html.night .mbi-i{background:#2A261D;border-color:#4A4130}html.night .mbi-i header b{color:#F3D58A}.mbg svg.mbm-s,.mbg svg.mbm-yr{width:100%!important;height:auto!important;fill:initial;stroke:none;flex:initial}.mbg svg.mbcm-w{width:100%!important;height:100%!important;fill:none;stroke:none;flex:initial}.mbg svg text{stroke:none}.mbl{margin-top:16px;border-top:2px solid var(--mbG);padding-top:12px}.mbl h3{margin:0 0 6px;font-size:15px;color:#0E2236}.mbl h3 small{font-weight:400;color:#7a6a4c;font-size:12px}.mbl-t td{font-size:12.5px}.mbl-v{white-space:nowrap;border-radius:999px;padding:2px 8px;font-size:12px}.mbl-v.ok{background:#E7F0E8;color:#2f5b3c}.mbl-v.warn{background:#FBF0D6;color:#6b4c0e}.mbl-v.bad{background:#F6E3DE;color:#8a3a2b}.mbo{margin-top:14px;border-top:4px solid #5B2C83}.mbo h4 i{background:#5B2C83!important}.mbo h5{margin:12px 0 6px;color:#5B2C83}.mbo-s{border:1px solid #E1D5EC;border-radius:12px;padding:8px 12px;margin-bottom:8px;background:#fff}.mbo-s>b{color:#3E1F5C;font-size:13.5px}.mbo-c{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px}.mbo-c>div{border-radius:10px;padding:6px 10px;font-size:12.5px;line-height:1.9}.mbo-c .f{background:#E7F0E8}.mbo-c .a{background:#F6E3DE}.mbo-c span{display:block;font-weight:700;font-size:12px;margin-bottom:2px}@media (max-width:700px){.mbo-c{grid-template-columns:1fr}}html.night .mbo-s{background:#2A261D;border-color:#4A4130}@media (max-width:900px){.mbg-lanes{grid-template-columns:1fr}.mbm-n text{font-size:15px}}
@media (max-width:700px){.mbm{overflow-x:auto}.mbm-s{min-width:760px}}@media (max-width:560px){.mbg-kpi{grid-template-columns:repeat(3,1fr)}.mbg-k{grid-template-columns:1fr;text-align:center;justify-items:center}.mbg-k i{grid-row:auto}.mbg-tools{grid-template-columns:1fr}.mbm{padding:8px 4px}}
html.night .mbm,html.night .mbg-pnl{background:#221F18;border-color:#4A4130;background-image:none}html.night .mbm-h b,html.night .mbg-pnl h4{color:#F3D58A}
html.night .mbg-lane.leg{background:linear-gradient(180deg,#2E281C,#221F18 180px)}html.night .mbg-lane.jud{background:linear-gradient(180deg,#1C2733,#1A1F26 180px)}
html.night .mbg-law,html.night .mbg-rul,html.night .mbg-dl,html.night .mbg-amt{background:#2A261D;border-color:#4A4130}html.night .mbg-rul{border-color:#34485C}
html.night .mbg-lh{background:linear-gradient(90deg,#3A3122,#2A261D);border-color:#4A4130}html.night .mbg-rh{background:linear-gradient(90deg,#23303D,#1E252E)}html.night .mbg-rf{background:#1E252E;border-color:#34485C}
html.night .mbg-ab{background:#2F2A20;border-color:#4A4130}html.night .mbg-num{background:#2A261D;color:#F3D58A;box-shadow:0 0 0 4px #2A261D}html.night .mbg-tx .mb-loq{background:#332D21;color:#EDE3CC}
html.night .mbg-lt b,html.night .mbg-ah b{color:#F3E3B8}html.night .mbg-rt b{color:#D9E6F2}html.night .mbg-ex{background:#1E2A36;color:#D9E6F2}html.night .mbg-yr{background:#23303D;color:#AFCFEF}
html.night .mbm-n text{fill:#EDE3CC}html.night .mbm-n.law rect{fill:#3A3122}html.night .mbm-n.law text{fill:#F3D58A}html.night .mbm-n.art rect{fill:#2F2A20}html.night .mbm-n.rul rect{fill:#23303D}html.night .mbm-n.rul.cmp rect{fill:#2C2A26}
html.night .mbg-cn,html.night .mbg-tlc{color:#E4DACA}html.night .mbg-tl li:after{background:#2A261D;border-color:#F3D58A}`;document.head.appendChild(css)})();
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
function locGaps(r,ui){
 const sec=(t,body,n)=>body?`<section class="mb-los"><h3>${t}${n!=null?` <small>(${n})</small>`:''}</h3>${body}</section>`:'';
 const X=r.ctx||{},reg={wb:'الضفة الغربية',gaza:'قطاع غزة'}[X.region]||'غير محدد';
 const cited=(r.cited||[]).filter(c=>c.found);
 const missed=(r.missed||[]).map(m=>`<div class="mb-loa ${m.repealed?'miss':''}"><div class="mb-loh"><b>${e(m.label)}</b> من ${e(m.lawTitle)} <span class="mb-st">${e(m.status)}</span>${m.repealed?'<span class="mb-st bad">ملغاة</span>':''}<span class="mb-chip on">${m.count===1?'حكم واحد':m.count===2?'حكمان':m.count+' أحكام'}</span>${ui?locOpen(m.lawId,'التشريع كاملاً'):''}${fbBtns('A:'+m.lawId+':'+m.n,ui)}</div>${vflags(m.valid,ui)}${m.text?locQ(m.text):'<p class="m">نص المادة غير موجود في التشريع المخزّن.</p>'}<div class="mb-low">استشهدت بها: ${m.rulings.map(x=>ui?`<button type="button" class="mb-ref" data-act="mbRefOpen" data-v="${x.id}">${e(x.case_no||x.title)}</button>`:e(x.case_no||x.title)).join(' ')}</div></div>`).join('');
 const rul=(r.unseenRulings||[]).map(x=>`<div class="mb-lor"><div class="mb-loh"><b>${e(x.title)}</b>${x.stance?`<span class="mb-chip ${/يؤيد/.test(x.stance)?'on':''}">${e(x.stance)}</span>`:''}${fbBtns('R:'+x.id,ui)}${ui?locOpen(x.id,'نص الحكم'):''}</div><div class="m">${e([x.court,x.case_no&&'رقم '+x.case_no,x.date].filter(Boolean).join(' · '))}</div>${x.excerpt?`<p class="mb-lox">${e(x.excerpt)}</p>`:''}${(x.cites||[]).length?`<div class="mb-locs">${x.cites.map(c=>`<span class="mb-chip">${e(c)}</span>`).join('')}</div>`:''}<div class="mb-low">ظهر بسبب: ${(x.why||[]).map(e).join(' · ')}</div></div>`).join('');
 const defs=(r.defenses||[]).map(d=>`<div class="mb-loa"><div class="mb-loh"><b>${e(d.label)}</b> <small class="m">${e(d.why)}</small>${ui?locOpen(d.lawId,'التشريع كاملاً'):''}</div>${d.articles.map(a=>`<details><summary>${e(a.label)} من ${e(d.lawTitle)}</summary>${locQ(a.text)}</details>`).join('')}</div>`).join('');
 return `<section class="mb-labres" id="mbLocRes"><div class="mb-rh"><b>${e(r.title||'اكتشف ما فاتك')}</b><span class="m">${r.ms!=null?(r.ms<1000?'أقل من ثانية على الجهاز':(r.ms/1000).toFixed(1)+' ث على الجهاز'):''}</span></div>
  <div class="mb-cmp">${e(r.notice||'')}</div>
  <div class="mb-cmp mb-ctxb"><b>صفة الموكل كما فُهمت من المذكرة:</b> ${r.role==='defendant'?'مدعى عليه / مستأنف عليه':'مدعٍ / مستأنف'} · مكان الواقعة: ${e(reg)} · تاريخ الواقعة: ${X.eventDate?`<b class="mono">${e(X.eventDate)}</b>`:'غير محدد'}${(r.topics||[]).length?' · الموضوع: '+r.topics.map(t=>e(t.label)).join('، '):''}</div>
  <div class="mb-locs"><span class="mb-chip">استشهدت بـ ${cited.length} مادة</span><span class="mb-chip">${r.coveredCount||0} منها استشهدت بها الأحكام أيضاً</span><span class="mb-chip on">${(r.missed||[]).length} مادة لم تذكرها</span><span class="mb-chip on">${(r.unseenRulings||[]).length} حكماً لم تذكره</span></div>
  ${sec('مواد استشهدت بها الأحكام في مسألتك ولم ترد في مذكرتك',missed||'<p class="m">لا مواد فائتة: ما استشهدت به يغطي ما استشهدت به الأحكام الأقرب.</p>')}
  ${sec('أحكام فلسطينية في مسألتك لم تذكرها',rul,(r.unseenRulings||[]).length)}
  ${sec('دفوع شكلية لم ترد في المذكرة (للفحص)',defs)}
  ${ui?`<div class="mb-tools"><button class="btn sm" data-act="mbLocCopy">نسخ</button><button class="btn sm" data-act="mbLocPrint">طباعة A4</button></div>`:''}</section>`}
function locText(){const r=LOC.res;if(!r)return'';const L=[];
 if(LOC.kind==='gaps'){L.push('اكتشف ما فاتك','');for(const m of r.missed||[])L.push(m.label+' من '+m.lawTitle+' — استشهد بها '+m.count+' من الأحكام:',m.text,'');if((r.unseenRulings||[]).length){L.push('أحكام لم تُذكر:');for(const x of r.unseenRulings)L.push('- '+x.title+(x.stance?' ('+x.stance+')':''))}for(const d of r.defenses||[])L.push('','دفع لم يرد: '+d.label,...d.articles.map(a=>a.label+': '+a.text));L.push('',r.notice||'');return L.join('\n')}
 if(LOC.kind==='dissect'){L.push(r.title||'تشريح الحكم',[r.court,r.case_no,r.date].filter(Boolean).join(' · '),'');if((r.result||[]).length)L.push('النتيجة (تصنيف آلي): '+r.result.join('، '),'');for(const p of r.parties||[])L.push(p.role+': '+p.name);if(r.appealed)L.push('الحكم المطعون فيه: '+r.appealed);L.push('');if(r.operative)L.push('المنطوق:',r.operative,'');for(const c of (r.citations||[]).filter(c=>c.found))L.push(c.label+' من '+c.lawTitle+':',c.text,'');return L.join('\n')}
 if(r.title)L.push(r.title,'');
 if(r.inspect){L.push('دورة الفحص:',...r.inspect.log.map((x,i)=>`${i+1}. ${x.step}: ${x.text}`),'','المسائل المستخرجة:');for(const x of r.inspect.issues)L.push(`- ${x.label}: ${x.found?'وُجدت مراجع':'لم يجد المسبار مراجع'}`,...x.facts.map(f=>'  «'+f+'»'));if(r.inspect.evidence.length){L.push('','الأدلة المعتادة للموضوع مقابل مستندات القضية:');for(const x of r.inspect.evidence)L.push(`- ${x.label}: ${x.status==='doc'?'مرفق':x.status==='text'?'مذكور بلا مرفق':'غير موجود'}`)}L.push('')}
 if(r.opposing&&r.opposing.split.length){L.push('الرأي المعارض (أحكام طبّقت المادة نفسها بنتائج مختلفة):');for(const x of r.opposing.split)L.push('- '+x.cite+': لصالح الطاعن/المتهم '+x.for.map(y=>y.case_no).join('، ')+' | بالرد/الإدانة '+x.against.map(y=>y.case_no).join('، '));L.push('')}
 if((r.penQ||r.penShow)&&(r.penalties||[]).length){L.push('العقوبة في النصوص:');for(const p of r.penalties){L.push(p.label+' من '+p.lawTitle+((p.kinds||[]).length?' — '+p.kinds.join('، '):'')+((p.measures||[]).length?' — '+p.measures.join('، '):'')+':',...p.clauses);for(const x of p.refs||[])L.push('تحيل إلى '+x.label+':',...x.clauses);L.push('')}}
 for(const c of r.citations||[])L.push((c.label||'المادة '+c.article)+(c.lawTitle?' من '+c.lawTitle:'')+':',c.found?c.text:'('+(c.note||'غير موجودة')+')','');
 for(const l of r.laws||[]){L.push(l.title+' — '+(l.status||''));for(const a of l.articles||[])L.push(a.label+': '+a.text);L.push('')}
 if((r.rulings||[]).length){L.push('أحكام فلسطينية:');for(const x of r.rulings)L.push('- '+x.title+(x.excerpt?'\n  '+x.excerpt:''));L.push('')}
 if((r.comparative||[]).length){L.push('للمقارنة والاستئناس:');for(const x of r.comparative)L.push('- '+x.source+': '+x.title);L.push('')}
 if((r.timeline||[]).length){L.push('التسلسل الزمني:');for(const t of r.timeline)L.push(`- ${t.date} (عن السابق: ${dd(t.sincePrev)}): ${t.ctx}`);L.push('')}
 L.push(r.notice||'');return L.join('\n')}
A.mbLocMode=v=>{locKeep();const m=LOCM.some(x=>x[0]===v)?v:'research';if(m!==LOC.mode){LOC.res=null;LOC.kind=''}LOC.mode=m;LOC.err='';mbRender()};
A.mbLocClearR=()=>{LOC.rid=null;LOC.rtitle='';mbRender()};
window.MQ_mbLocal=()=>{MB.view='local';LOC.mode=LOC.mode==='dict'?'research':LOC.mode;A.nav('misbar');setTimeout(()=>{const t=document.getElementById('mbLoT');if(t)t.focus()},120)};
A.mbLocToResearch=()=>{locKeep();LOC.text=LOC.rtext;LOC.mode='research';LOC.res=null;mbRender();setTimeout(locRun,30)};
A.mbLocDissect=v=>{const d=MB.doc;LOC.mode='ruling';LOC.rid=Number(v);LOC.rtitle=d&&String(d.id)===String(v)?cleanT(d.title):'';MB.doc=null;MB.docBusy=false;paintReader();MB.view='local';if(S.view!=='misbar'){A.nav('misbar')}else mbRender();setTimeout(locRun,30)};
async function locPost(a,b){const r=await fetch('/api/admin/misbar/local/'+a,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify(b)});
 if(r.status===401){location.replace('/login.html');throw new Error('انتهت الجلسة')}const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(r.status===404?'المسبار المحلي متاح في تطبيق المكتب على الجهاز.':j.error||'تعذّر التحليل');return j}
function refView(){
 if(!LOC.vals&&!LOC.valsBusy){LOC.valsBusy=1;setTimeout(locRefLoad,0)}
 const V=LOC.vals,A2=LOC.alerts,O=(V&&V.office)||{};
 const card=x=>`<article class="mbr-c ${x.missing?'miss':''}"><header><b>${e(x.label)}</b>${x.docId?`<button type="button" class="mb-ref" data-act="mbRefOpen" data-v="${x.docId}">فتح التشريع</button>`:''}</header>
  ${x.missing?'<p class="m">غير موجود في القاعدة المحلية.</p>':`<small class="m">${e(x.title)}${x.status?' · '+e(x.status):''}</small>
  ${(x.values||[]).length?`<div class="mbr-vals">${x.values.map(v=>`<span class="mbr-v"><b class="mono">${e(v.value)}</b> ${e(v.currency)} <small>${e(v.unit)}</small></span>`).join('')}</div>`:''}
  ${x.text?`<details class="mbg-tx" ${x.values&&x.values.length?'':'open'}><summary>نص ${e(x.art)} كما ورد</summary>${locQ(x.text)}</details>`:x.hasText?'':'<p class="mbr-warn">نص هذا التشريع غير محفوظ في القاعدة بعد (العنوان فقط)؛ افتح الأصل من موقع الجريدة الرسمية.</p>'}`}</article>`;
 const vals=V?V.items.filter(x=>x.group==='values'):[],courts=V?V.items.filter(x=>x.group==='courts'):[];
 const cases0=(typeof cases!=='undefined'?cases:[]),cn=id=>{const k=cases0.find(c=>c.id===id);return k?(k.no||'قيد التسجيل')+' — '+(k.subject||k.type||''):id};
 const byCase={};for(const a of (A2&&A2.alerts)||[]){(byCase[a.caseId]=byCase[a.caseId]||[]).push(a)}
 const alerts=!A2?'<p class="m">جارٍ فحص مراجع القضايا…</p>':!A2.checked?'<p class="m">لا مواد ولا تشريعات مربوطة بقضايا بعد. اربطها من قارئ المسبار (زر «ربط بقضية» أو 🔗 بجانب المادة) فيُنبَّه المكتب حين تُعدَّل.</p>':!A2.alerts.length?`<p class="mbr-ok">✓ فُحص ${A2.checked} مرجعاً مربوطاً بالقضايا: لا تعديل ولا إلغاء بعد ربطها حسب القاعدة.</p>`:Object.entries(byCase).map(([cid,xs])=>`<div class="mbr-case"><header><b>❏ ${e(cn(cid))}</b><button type="button" class="btn sm" data-act="openCase" data-v="${e(cid)}">فتح القضية</button></header>${xs.map(a=>`<div class="mbr-al"><b>${e(a.art?'المادة ('+a.art+') من ':'')}${e(a.title)}</b> <small class="m">رُبطت ${e(a.at)}</small><ul class="mb-lov">${a.items.map(i=>`<li class="${i.level==='bad'?'bad':'warn'}">${i.level==='bad'?'⛔':'⚠'} ${e(i.text)}${i.instId?` <button type="button" class="mb-ref" data-act="mbRefOpen" data-v="${i.instId}">فتح</button>`:''}</li>`).join('')}</ul></div>`).join('')}</div>`).join('');
 return `<section class="mbr">
 <div class="mbr-sec" id="mbrAlerts"><h3>🔔 تنبيهات التشريع على قضاياك ${A2&&A2.alerts.length?`<b class="mbr-badge">${A2.alerts.length}</b>`:''}</h3>${alerts}</div>
 <div class="mbr-sec"><h3>¤ أرقام نافذة</h3>${V?`<div class="mbr-g">${vals.map(card).join('')}</div>
  <div class="mbr-office"><h4>قيم يحددها المكتب (ليس لها نص تشريعي في القاعدة)</h4><div class="mbr-f"><label>سعر صرف الدينار بالشيكل<input class="field" id="mbrFxJod" value="${e(O.fxJod)}" placeholder="مثال 5.0"></label><label>سعر صرف الدولار بالشيكل<input class="field" id="mbrFxUsd" value="${e(O.fxUsd)}"></label><label>تاريخ السعر<input class="field" type="date" id="mbrFxDate" value="${e(O.fxDate)}"></label><label>نسبة الفائدة المعتمدة في المكتب %<input class="field" id="mbrInt" value="${e(O.interest)}"></label></div>
  <label class="wide">جدول أتعاب النقابة أو أتعاب المكتب المعتمدة<textarea class="field" id="mbrBar" rows="3" placeholder="الصق جدول الأتعاب المعتمد كما هو">${e(O.barFees)}</textarea></label>
  <div class="mb-labrow"><button type="button" class="btn sm" data-act="mbrSave">حفظ قيم المكتب</button>${O.at?`<small class="m">آخر تعديل: ${e(O.by||'')} ${e(String(O.at).slice(0,10))}</small>`:''}</div></div>`:'<p class="m">جارٍ التحميل…</p>'}</div>
 <div class="mbr-sec"><h3>⚖ دليل المحاكم والاختصاص المكاني</h3><div class="mb-labrow"><input class="field" id="mbrQ" placeholder="اسم البلدة أو المنطقة أو المحكمة، مثل: طولكرم" value="${e(LOC.courtQ||'')}"><button type="button" class="btn sm" data-act="mbrFind">بحث في نصوص المحاكم</button></div>
  ${LOC.court?(LOC.court.hits.length?LOC.court.hits.map(h=>`<div class="mbr-hit"><b>${e(h.art)}</b> <small class="m">من ${e(h.title)}</small> <button type="button" class="mb-ref" data-act="mbRefOpen" data-v="${h.docId}">فتح</button>${locQ(h.text)}</div>`).join(''):`<p class="m">لم يرد «${e(LOC.court.q)}» في نصوص تشكيل المحاكم والاختصاص المكاني المحفوظة.</p>`):''}
  <div class="mbr-g">${courts.map(card).join('')}</div></div>
 </section>`}
async function locRefLoad(){try{LOC.vals=await locPost('refvalues',{})}catch(x){LOC.vals={items:[],office:{}};toast(x.message)}LOC.valsBusy=0;locAlertsLoad(true)}
async function locAlertsLoad(rerender){const refs=[];for(const k of (typeof cases!=='undefined'?cases:[]))for(const r of (Array.isArray(k.lawRefs)?k.lawRefs:[]))if(r.docId&&r.kind!=='ruling'&&!r.rulingId)refs.push({key:k.id+'|'+r.id,caseId:k.id,docId:r.docId,art:r.art||'',at:String(r.at||'').slice(0,10)});
 try{LOC.alerts=refs.length?await locPost('refalerts',{refs}):{alerts:[],checked:0}}catch(x){LOC.alerts={alerts:[],checked:0}}
 const el=document.getElementById('mbLoc');if(rerender&&el&&LOC.mode==='ref')el.outerHTML=localView()}
window.MQ_mbAlerts=()=>LOC.alerts;window.MQ_mbAlertsLoad=locAlertsLoad;
A.mbrSave=async()=>{const g=id=>(document.getElementById(id)||{}).value||'';try{LOC.vals=await locPost('vals-save',{fxJod:g('mbrFxJod'),fxUsd:g('mbrFxUsd'),fxDate:g('mbrFxDate'),interest:g('mbrInt'),barFees:g('mbrBar')});toast('حُفظت قيم المكتب')}catch(x){toast(x.message)}const el=document.getElementById('mbLoc');if(el)el.outerHTML=localView()};
A.mbrFind=async()=>{const q=((document.getElementById('mbrQ')||{}).value||'').trim();LOC.courtQ=q;try{LOC.court=await locPost('courtfind',{q})}catch(x){toast(x.message);return}const el=document.getElementById('mbLoc');if(el)el.outerHTML=localView()};
/* التعلّم من ربط المراجع بالقضايا: ربط مادة أو حكم بقضية تقييم «مهم» لأسئلة تشبه موضوع القضية؛ وإزالة الربط تلغيه */
window.MQ_mbLearnLink=(k,r,on)=>{if(!r||!r.docId||!k)return;const key=r.kind==='ruling'?'R:'+r.docId:r.art?'A:'+r.docId+':'+r.art:'';if(!key)return;
 const terms=[k.subject,k.type,r.note,r.issue].filter(Boolean).join(' ').split(/\s+/).filter(w=>w.length>=3).slice(0,24);if(!terms.length)return;
 fetch('/api/admin/misbar/local/feedback',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({key,vote:on?1:0,terms,title:r.title||'',src:'link',ref:k.id+'|'+r.id})}).catch(()=>{})};
function learnedView(){const L=LOC.learned;if(!L){setTimeout(locLearnedLoad,0);return '<p class="m">جارٍ تحميل ما تعلّمه المسبار…</p>'}
 const V={1:['👍','مهم','ok'],2:['⚖','مخالف يستحق الدراسة','warn'],'-1':['👎','غير مرتبط','bad']};
 const items=L.items.filter(x=>LOC.lrnF==='all'||!LOC.lrnF||(LOC.lrnF==='link'?x.src==='link':x.src!=='link'));
 return `<section class="mbl"><h3>🧠 ما تعلّمه المسبار من مكتبك <small>${L.items.length} تقييماً · ${L.items.filter(x=>x.src==='link').length} منها من ربط المراجع بالقضايا</small></h3>
 <p class="m">هذه ذاكرة مكتبك وحده، محفوظة على هذا الجهاز. تحسّن ترتيب النتائج في الأسئلة المشابهة فقط، ولا تغيّر نصاً قانونياً ولا قيمة حكم. يمكنك حذف أي بند أو إعادة الضبط كاملاً.</p>
 <div class="mb-tabs">${[['all','الكل'],['vote','تقييماتك'],['link','من ربط القضايا']].map(([v,t])=>`<button type="button" class="${(LOC.lrnF||'all')===v?'on':''}" data-act="mbLrnF" data-v="${v}">${t}</button>`).join('')}</div>
 ${items.length?`<table class="mb-lot mbl-t"><thead><tr><th>التقييم</th><th>المرجع</th><th>لأسئلة فيها</th><th>المصدر</th><th></th></tr></thead><tbody>${items.slice(0,300).map(x=>{const v=V[x.vote]||['•','',''];return `<tr><td><span class="mbl-v ${v[2]}">${v[0]} ${v[1]}</span></td><td>${e(x.title||x.key)}${/^[AR]:/.test(x.key)?` <button type="button" class="mb-ref" data-act="mbRefOpen" data-v="${e(x.key.split(':')[1])}">فتح</button>`:''}</td><td><small>${e(x.terms.slice(0,8).join('، '))}</small></td><td><small>${x.src==='link'?'ربط بقضية':'تقييم'} · ${e(x.by)} · ${e(String(x.at).slice(0,10))}</small></td><td><button type="button" class="btn sm" data-act="mbLrnDel" data-v="${e(x.key+'|'+x.at)}">حذف</button></td></tr>`}).join('')}</tbody></table>`:'<p class="m">لا شيء بعد. يتعلّم المسبار من أزرار 👍 ⚖ 👎 بجانب كل نتيجة، ومن ربط المواد والأحكام بالقضايا.</p>'}
 ${L.items.length?'<div class="mb-labrow"><button type="button" class="btn sm" data-act="mbLrnReset">إعادة ضبط ذاكرة التعلّم كاملة</button><small class="m">لا يمس قاموس المكتب (المرادفات والمواد المثبّتة)</small></div>':''}</section>`}
async function locLearnedLoad(){try{LOC.learned=await locPost('learned',{})}catch(x){LOC.learned={items:[]};toast(x.message)}const el=document.getElementById('mbLoc');if(el&&LOC.mode==='dict')el.outerHTML=localView()}
A.mbLrnF=v=>{LOC.lrnF=v;const el=document.getElementById('mbLoc');if(el)el.outerHTML=localView()};
A.mbLrnDel=async v=>{const i=String(v).lastIndexOf('|');try{await locPost('learned-del',{key:v.slice(0,i),at:v.slice(i+1)});LOC.learned=null;toast('حُذف من ذاكرة التعلّم')}catch(x){toast(x.message)}const el=document.getElementById('mbLoc');if(el)el.outerHTML=localView()};
A.mbLrnReset=async()=>{if(!confirm('حذف كل ما تعلّمه المسبار من تقييمات المكتب وربط القضايا؟ لا يمكن التراجع.'))return;try{const r=await locPost('learned-reset',{confirm:'reset'});LOC.learned=null;toast('أُعيد ضبط ذاكرة التعلّم ('+r.removed+')')}catch(x){toast(x.message)}const el=document.getElementById('mbLoc');if(el)el.outerHTML=localView()};
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
 try{await locPost('feedback',{key,vote:nv,terms:r.qterms||(r.keyterms||{}).terms||[]});LOC.fb[key]=nv;document.querySelectorAll(`[data-act="mbLocFb"][data-v^="${CSS.escape(key)}|"]`).forEach(b=>{const on=Number(b.dataset.v.slice(b.dataset.v.lastIndexOf('|')+1))===nv;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});toast(nv===1?'سجّل المسبار أنها مهمة لهذا النوع من الأسئلة':nv===2?'سجّل المسبار أنها مخالفة تستحق الدراسة؛ ستظهر في «الرأي المعارض»':nv===-1?'لن تظهر في الأسئلة المشابهة':'أُلغي التقييم')}catch(x){toast(x.message)}};
async function locRun(){locKeep();if(LOC.busy||LOC.mode==='dict')return;LOC.fb={};
 const m=LOC.mode;let a='analyze',b;
 if(m==='research'){if(LOC.text.replace(/\s/g,'').length<10)return toast('اكتب السؤال أو الوقائع');b={text:LOC.text,region:LOC.region,eventDate:LOC.eventDate}}
 else if(m==='case'){if(!LOC.k)return toast('اختر القضية');b={k:LOC.k,region:LOC.region,eventDate:LOC.eventDate}}
 else if(m==='gaps'){a='gaps';if(LOC.gtext.replace(/\s/g,'').length<80)return toast('الصق المذكرة كاملة');b={text:LOC.gtext,region:LOC.region,eventDate:LOC.eventDate}}
 else{a='dissect';if(LOC.rid)b={id:LOC.rid};else{if(LOC.rtext.replace(/\s/g,'').length<200)return toast('الصق نص الحكم كاملاً');b={text:LOC.rtext}}}
 LOC.busy=true;LOC.err='';LOC.res=null;const box=()=>document.getElementById('mbLoc');if(box())box().outerHTML=localView();
 try{LOC.res=await locPost(a,b);LOC.kind=a}catch(x){LOC.err=x.message}
 LOC.busy=false;const el=box();if(el){el.outerHTML=localView();const rs=document.getElementById('mbLocTop')||document.getElementById('mbLocRes');if(rs)rs.scrollIntoView({block:'start',behavior:'smooth'})}}
document.addEventListener('submit',ev=>{if(ev.target.id!=='mbLocForm')return;ev.preventDefault();locRun()},true);
document.addEventListener('change',async ev=>{if(ev.target.id==='mbLoGFile'){const f=ev.target.files[0];if(!f)return;locKeep();try{LOC.gtext=f.name.toLowerCase().endsWith('.docx')&&typeof window.MQ_docxText==='function'?await MQ_docxText(await f.arrayBuffer()):await f.text();const t=document.getElementById('mbLoG');if(t)t.value=LOC.gtext;toast('استُورد النص')}catch(x){toast(x.message)}return}if(ev.target.id!=='mbLoFile')return;const f=ev.target.files[0];if(!f)return;locKeep();if(f.size>5*1024*1024)return toast('الملف أكبر من 5 ميغابايت');
 try{const nm=f.name.toLowerCase();LOC.text=nm.endsWith('.docx')?(typeof window.MQ_docxText==='function'?await MQ_docxText(await f.arrayBuffer()):(()=>{throw new Error('قراءة docx غير متاحة هنا؛ الصق النص')})()):await f.text();const t=document.getElementById('mbLoT');if(t)t.value=LOC.text;toast('استُورد النص')}catch(x){toast(x.message)}});
A.mbLocInspect=async()=>{locKeep();if(LOC.busy)return;LOC.fb={};let b;if(LOC.mode==='case'){if(!LOC.k)return toast('اختر القضية');b={k:LOC.k,region:LOC.region,eventDate:LOC.eventDate}}else{if(LOC.text.replace(/\s/g,'').length<15)return toast('اكتب الوقائع');b={text:LOC.text,region:LOC.region,eventDate:LOC.eventDate}}
 LOC.busy=true;LOC.err='';LOC.res=null;LOC.kind='inspect';const box=()=>document.getElementById('mbLoc');if(box())box().outerHTML=localView();
 try{LOC.res=await locPost('inspect',b);LOC.kind='inspect'}catch(x){LOC.err=x.message}
 LOC.busy=false;const el=box();if(el){el.outerHTML=localView();const rs=document.getElementById('mbLocTop')||document.getElementById('mbLocRes');if(rs)rs.scrollIntoView({block:'start',behavior:'smooth'})}};
A.mbLocCopy=()=>{const t=locText();if(t)navigator.clipboard.writeText(t).then(()=>toast('نُسخ التقرير'),()=>toast('تعذّر النسخ'))};
A.mbLocPrint=()=>{const r=LOC.res;if(!r||!window.MQP||!MQP.B)return;MQP.open({label:'عقل القانون — مسبار',build(){return {title:'مِسْبار — '+(LOC.kind==='dissect'?'تشريح حكم':LOC.kind==='gaps'?'اكتشف ما فاتك':'تحليل محلي'),sub:String(r.title||LOC.text||'').slice(0,120),file:'misbar-local',blocks:[{html:`<div class="mb-print">${LOC.kind==='dissect'?locDissect(r,false):LOC.kind==='gaps'?locGaps(r,false):locResult(r,false)}</div>`}]}}})};
})();
