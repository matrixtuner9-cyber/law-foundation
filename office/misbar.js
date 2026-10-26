/* ── مِسْبار | Misbar AI: عقل التحليل والاستنباط القانوني ──
   صفحة مستقلة داخل ميثاق: البحث في التشريعات والقرارات (فلسطين أساس، الأردن ومصر للمقارنة والاستئناس)، قارئ المصادر،
   وأدوات التحليل واستقصاء الثغرات وإعداد الخطط عبر «مساعد المحامي الذكي» الذي يستشهد من القاعدة نفسها.
   القاعدة محلية للقراءة فقط (/api/admin/misbar/*) وتعمل دون إنترنت. لا يُعتمد أي استنتاج قبل مراجعة المحامي.
   تحل محل: «التشريعات الفلسطينية» و«البحث في الأحكام» و«مصادر الأحكام» (تشريعات المكتب المدخلة يدوياً تبقى من داخل المسبار). */
(function(){
'use strict';
if(typeof V==='undefined'||typeof NAV==='undefined')return;
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const can2=w=>!!(window.MQ&&MQ.user&&({admin:{write:1,manage:1},lawyer:{write:1}}[MQ.user.role]||{})[w]);
const SRC=[['','كل المصادر'],['PS_JUDGMENT','فلسطين · أحكام'],['PS_LEGISLATION','فلسطين · تشريعات'],['JO_LEGISLATION','الأردن · تشريعات'],['JO_CASSATION','الأردن · تمييز'],['EG_LEGISLATION','مصر · تشريعات']];
const COURTS=['','محكمة النقض','محكمة استئناف رام الله','محكمة استئناف القدس','محكمة العدل العليا','المحكمة الدستورية العليا','محكمة جرائم الفساد','محكمة التمييز الأردنية'];
const STATUS=[['','كل الحالات'],['in_force','ساري'],['partial','ساري في الضفة الغربية فقط'],['suspended','موقوف النفاذ'],['repealed','ملغى / غير ساري']];
/* أدوات المحامي: كل أداة تفتح «مساعد المحامي الذكي» بالنمط المناسب، ومراجعه من قاعدة المسبار */
const TOOLS=[
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
const MB={view:'search',q:'',src:'',year_from:'',year_to:'',court:'',case_no:'',status:'',has_text:'',sort:'relevance',page:1,data:null,busy:false,err:'',open:null,doc:null,docBusy:false,fs:17,stats:null,statsErr:''};
try{const f=Number(localStorage.getItem('mq_mb_fs'));if(f>=14&&f<=24)MB.fs=f}catch(x){}

/* ── القائمة: المسبار بدل الشاشات القديمة ── */
for(const v of ['laws','maqamsearch','sources']){const i=NAV.findIndex(n=>n[0]===v);if(i>=0)NAV.splice(i,1)}
{const i=NAV.findIndex(n=>n[0]==='dash');NAV.splice(i+1,0,['misbar','المِسْبار'])}
if(window.NAV_ICON)NAV_ICON.misbar='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 5v14M8 9l-3 5h6zM16 9l-3 5h6z"/><path d="M8 9h8"/></svg>';
const nc0=window.navCount;if(typeof nc0==='function')window.navCount=v=>v==='misbar'?'':nc0(v);

async function call(path,p){
 const r=await fetch('/api/admin/misbar/'+path+'?'+new URLSearchParams(p).toString(),{credentials:'same-origin'});
 if(r.status===401){location.replace('/login.html');throw new Error('انتهت الجلسة')}
 const j=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(j.error||'تعذّر الاتصال بخادم المكتب'),{code:j.code});return j;
}
function params(page){const p={page:String(page||1),sort:MB.sort};
 for(const k of ['q','src','year_from','year_to','court','case_no','status','has_text'])if(String(MB[k]||'').trim())p[k]=String(MB[k]).trim();return p}
const hasQuery=()=>['q','src','year_from','year_to','court','case_no','status'].some(k=>String(MB[k]||'').trim());
async function run(page){
 readForm();if(!hasQuery()){toast('اكتب عبارة البحث أو اختر مصدراً أو رقم قضية');return}
 if(MB.busy)return;MB.busy=true;MB.err='';MB.page=page||1;paint();
 try{MB.data=await call('search',params(MB.page))}catch(x){MB.err=x.message;MB.data=null}
 MB.busy=false;paint();
 const r=document.getElementById('mbRes');if(r&&page>1)r.scrollIntoView({block:'start',behavior:'smooth'});
}
async function loadStats(){if(MB.stats||MB.statsErr)return;try{MB.stats=await call('stats',{})}catch(x){MB.statsErr=x.code==='NO_INDEX'?'قاعدة المسبار غير مثبتة على هذا الخادم بعد. يثبّتها الدعم الفني.':x.message}if(S.view==='misbar')paintHead()}

/* ── العرض ── */
const fmtN=n=>Number(n||0).toLocaleString('en-US');
const badge=r=>`<span class="mb-src ${r.primary?'ps':'cmp'}">${e(r.source)}</span>`;
function statusPill(r){if(!r.status_code&&!r.status)return '';const c=r.status_code==='in_force'||r.status_code==='partial'?'ok':r.status_code==='suspended'?'warn':r.status_code==='repealed'?'bad':'';return `<span class="mb-st ${c}">${e(r.status||'')}</span>`}
const hl=(t,q)=>{let h=e(t);const ws=String(q||'').replace(/["()]/g,' ').split(/\s+/).filter(w=>w.length>2).slice(0,6);
 for(const w of ws){const core=w.replace(/^(?:وال|بال|كال|فال|لل|ال)/,'');if(core.length<2)continue;
  const rx=core.split('').map(c=>({'ا':'[اأإآ]','أ':'[اأإآ]','إ':'[اأإآ]','آ':'[اأإآ]','ي':'[يى]','ى':'[يى]','ه':'[هة]','ة':'[هة]'}[c]||c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))).join('[\\u064B-\\u0652\\u0640]*');
  try{h=h.replace(new RegExp('('+rx+')','g'),'<mark>$1</mark>')}catch(x){}}return h};
function head(){
 const st=MB.stats;
 return `<header class="mb-top"><div class="mb-hero" role="img" aria-label="مِسْبار | Misbar AI: عقل التحليل والاستنباط القانوني"><i class="mb-ring"></i><b class="mb-sub">مِسْبارُ القانونِ التحليليّ</b></div>
  <div class="mb-stats" id="mbStats">${st?st.sources.map(s=>`<button class="mb-chip ${MB.src===s.src?'on':''}" data-act="mbSrc" data-v="${s.src}" title="${e(s.label)}: ${fmtN(s.texts)} بنص كامل">${e(s.label)} <b>${fmtN(s.n)}</b></button>`).join(''):MB.statsErr?`<span class="mb-warn">${e(MB.statsErr)}</span>`:'<span class="m">…</span>'}</div></header>`}
function side(){
 const it=(v,ic,t,act='mbView')=>`<button class="${MB.view===v?'on':''}" data-act="${act}" data-v="${v}"><i>${ic}</i>${t}</button>`;
 return `<aside class="mb-side" aria-label="أقسام المسبار"><div class="mb-brand"><img src="misbar-emblem.webp" alt="" width="96" height="91"><b>مِسْبار</b><small>Misbar AI · عقل التحليل والاستنباط القانوني</small></div>
  <div class="g">الاستقصاء القضائي</div>${it('search','⌕','البحث في التشريعات والقرارات')}${it('tools','✦','التحليل واستخلاص النتائج')}
  <div class="g">أدوات المحامي</div>${TOOLS.map(([m,ic,t])=>`<button data-act="mbTool" data-v="${m}"><i>${ic}</i>${t}</button>`).join('')}
  <div class="g">مراجع المكتب</div><button data-act="nav" data-v="rulings"><i>§</i>الاجتهادات القضائية</button><button data-act="nav" data-v="laws"><i>✎</i>تشريعات المكتب</button><button data-act="nav" data-v="legalShelf"><i>❏</i>مكتبتي القانونية</button>
  <div class="mb-note">المراجع الفلسطينية أساسية؛ الأردنية والمصرية للمقارنة والاستئناس. لا يُعتمد أي استنتاج قبل مراجعة المحامي.</div></aside>`}
function form(){
 const opt=(arr,v)=>arr.map(([k,t])=>`<option value="${k}" ${v===k?'selected':''}>${t}</option>`).join('');
 return `<form class="mb-form" id="mbForm" autocomplete="off">
  <div class="mb-qrow"><input class="field mb-q" id="mbQ" value="${e(MB.q)}" placeholder="ابحث بالكلمات أو بعبارة بين علامتي تنصيص: “عدم كفاية الرصيد”، إخلاء المأجور، مكافأة نهاية الخدمة…" maxlength="300" aria-label="عبارة البحث">
   <button class="btn mb-go" id="mbGo" ${MB.busy?'disabled':''}>⌕ بحث قانوني</button></div>
  <div class="mb-f">
   <label>الدولة والمصدر<select class="field" id="mbSrcSel">${opt(SRC,MB.src)}</select></label>
   <label>من سنة<input class="field mono" id="mbY1" value="${e(MB.year_from)}" inputmode="numeric" maxlength="4" placeholder="1950"></label>
   <label>حتى سنة<input class="field mono" id="mbY2" value="${e(MB.year_to)}" inputmode="numeric" maxlength="4" placeholder="${new Date().getFullYear()}"></label>
   <label>المحكمة<select class="field" id="mbCourt">${COURTS.map(c=>`<option value="${e(c)}" ${MB.court===c?'selected':''}>${c||'جميع المحاكم'}</option>`).join('')}</select></label>
   <label>رقم القضية<input class="field mono" id="mbCase" value="${e(MB.case_no)}" placeholder="690/2023" maxlength="12"></label>
   <label>حالة السريان<select class="field" id="mbStatus">${opt(STATUS,MB.status)}</select></label>
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
   <b class="mb-t">${hl(r.title,MB.q)}</b>
   <div class="mb-meta">${[r.court,r.case_no&&('رقم '+r.case_no),r.date||r.year,r.ltype].filter(Boolean).map(e).join(' · ')}</div>
   ${r.excerpt?`<p class="mb-x">${hl(r.excerpt,MB.q)}</p>`:''}</button></li>`).join('')}</ol>
  ${d.pages>1?`<div class="mb-pg">${d.page>1?`<button class="btn sm" data-act="mbPage" data-v="${d.page-1}">→ السابق</button>`:''}<span class="m">${d.page} / ${fmtN(d.pages)}</span>${d.page<d.pages?`<button class="btn sm" data-act="mbPage" data-v="${d.page+1}">التالي ←</button>`:''}</div>`:''}`}
/* النص بفقرات، وعناوين المواد بارزة */
function bodyHtml(t,q){const parts=String(t||'').split(/\n+/).map(s=>s.trim()).filter(Boolean);
 return parts.map(p=>/^(?:المادة|مادة|الماده)\s*[(\d٠-٩]/.test(p)&&p.length<90?`<h4>${hl(p,q)}</h4>`:`<p>${hl(p,q)}</p>`).join('')}
function reader(){
 const d=MB.doc;
 if(MB.docBusy)return `<div class="mb-empty">جارٍ فتح المستند…</div>`;
 if(!d)return `<div class="mb-empty"><b>قارئ المصادر داخل التطبيق</b><span>اختر مستنداً من نتائج البحث لعرضه هنا.</span></div>`;
 const m=d.meta||{};
 return `<div class="mb-doc-h"><div class="mb-tags">${badge(d)}${statusPill(d)}</div><h2>${e(d.title)}</h2>
  <div class="mb-meta">${[d.court,d.case_no&&('رقم '+d.case_no),d.date||d.year,d.ltype,d.subject].filter(Boolean).map(e).join(' · ')}</div>
  ${d.primary?'':`<div class="mb-cmp">مرجع ${d.country==='JO'?'أردني':'مصري'} للمقارنة والاستئناس، وليس ملزماً أمام المحاكم الفلسطينية.${m.note?' '+e(m.note):''}</div>`}
  <div class="mb-tools"><button class="btn sm" data-act="mbFs" data-v="-1">A−</button><button class="btn sm" data-act="mbFs" data-v="0">افتراضي</button><button class="btn sm" data-act="mbFs" data-v="1">A+</button>
   <button class="btn sm" data-act="mbCopy">نسخ</button><button class="btn sm" data-act="mbPrint">طباعة A4</button>
   ${d.kind==='ruling'&&can2('write')?'<button class="btn sm" data-act="mbSaveRuling">حفظ في الاجتهادات</button>':''}
   ${can2('write')&&d.body?`<button class="btn sm pri" data-act="mbAnalyze">${d.kind==='ruling'?'تحليل الحكم وأسباب الطعن':'تحليل النص'}</button>`:''}
   ${d.url?`<a class="btn sm" href="${e(d.url)}" target="_blank" rel="noopener">المصدر ↗</a>`:''}</div></div>
  <div class="mb-body" style="font-size:${MB.fs}px">${d.body?bodyHtml(d.body,MB.q):`<p class="m">النص الكامل غير متوفر في القاعدة لهذا ${d.kind==='law'?'التشريع':'الحكم'}.${d.file_url?` <a href="${e(d.file_url)}" target="_blank" rel="noopener">ملف النص في المصدر ↗</a>`:''}</p>`}</div>
  ${(d.cites||[]).length?`<div class="mb-cites"><b>التشريعات المستشهد بها في الحكم (${d.cites.length})</b><ul>${d.cites.map(c=>`<li><button class="link" data-act="mbFind" data-v="${e(c.title)}">${e(c.title)}</button>${c.text?`<small>${e(c.text.slice(0,240))}${c.text.length>240?'…':''}</small>`:''}</li>`).join('')}</ul></div>`:''}
  ${m.classifications&&m.classifications.length?`<div class="mb-cites"><b>التصنيف</b><ul>${m.classifications.map(c=>`<li>${e(c)}</li>`).join('')}</ul></div>`:''}`}
function toolsView(){
 return `<section class="mb-card"><h2>مختبر التحليل القانوني واستخلاص النتائج</h2>
  <p class="m">اختر المهمة، ثم أدخل الوقائع أو المستند. المحلل يسترجع مقتطفات مرجعية من قاعدة المسبار ويضع رقم المرجع بجانب كل ادعاء؛ ويجب تدقيق صلتها وحجيتها قبل الاعتماد.</p>
  <div class="mb-tgrid">${TOOLS.map(([m,ic,t,d])=>`<button class="mb-tool" data-act="mbTool" data-v="${m}"><i>${ic}</i><b>${t}</b><span>${d}</span></button>`).join('')}</div>
  <div class="mb-princ"><span>لا إجراء دون مستند</span><span>لا استشهاد دون مصدر</span><span>لا انتقال دون استكمال المرحلة</span><span>لا اعتماد نهائي دون مراجعة المحامي</span></div></section>`}
V.misbar=()=>{setTimeout(loadStats,0);
 return `<div class="mb-wrap">${head()}<div class="mb-grid">${side()}<main class="mb-main">${MB.view==='tools'?toolsView():`
  <section class="mb-card"><div class="mb-h"><div><h1>البحث القانوني المتقدم</h1><p class="m">استقصاء التشريعات والقرارات المحلية والمقارنة</p></div></div>${form()}</section>
  <div class="mb-two"><section class="mb-card" id="mbRes">${results()}</section><section class="mb-card mb-reader" id="mbDoc">${reader()}</section></div>`}</main></div></div>`};

function paint(){if(S.view!=='misbar')return;const r=document.getElementById('mbRes');if(r)r.innerHTML=results();const g=document.getElementById('mbGo');if(g)g.disabled=MB.busy;const d=document.getElementById('mbDoc');if(d)d.innerHTML=reader()}
function paintHead(){const s=document.getElementById('mbStats');if(s){const t=document.createElement('div');t.innerHTML=head();s.replaceWith(t.querySelector('#mbStats'))}}
function readForm(){const g=id=>document.getElementById(id);if(!g('mbQ'))return;MB.q=g('mbQ').value;MB.src=g('mbSrcSel').value;MB.year_from=g('mbY1').value;MB.year_to=g('mbY2').value;MB.court=g('mbCourt').value;MB.case_no=g('mbCase').value;MB.status=g('mbStatus').value;MB.has_text=g('mbText').value;MB.sort=g('mbSort').value}

/* ── الأفعال ── */
document.addEventListener('submit',ev=>{if(ev.target.id!=='mbForm')return;ev.preventDefault();ev.stopImmediatePropagation();run(1)},true);
document.addEventListener('change',ev=>{if(S.view!=='misbar')return;if(['mbSrcSel','mbCourt','mbStatus','mbText','mbSort'].includes(ev.target.id)&&MB.data){run(1)}});
A.mbView=v=>{readForm();MB.view=v==='tools'?'tools':'search';render()};
A.mbSrc=v=>{readForm();MB.src=MB.src===v?'':v;if(MB.view!=='search'){MB.view='search';render()}const s=document.getElementById('mbSrcSel');if(s)s.value=MB.src;if(hasQuery())run(1);else{MB.data=null;paint()}document.querySelectorAll('.mb-chip').forEach(b=>b.classList.toggle('on',b.dataset.v===MB.src))};
A.mbPage=v=>run(Number(v)||1);
A.mbClear=()=>{Object.assign(MB,{q:'',src:'',year_from:'',year_to:'',court:'',case_no:'',status:'',has_text:'',sort:'relevance',data:null,err:'',open:null,doc:null});render()};
A.mbOpen=async v=>{const id=Number(v);if(!id)return;MB.open=id;MB.docBusy=true;
 document.querySelectorAll('.mb-list li').forEach(li=>li.classList.toggle('on',li.querySelector('[data-v="'+id+'"]')!=null));
 const d=document.getElementById('mbDoc');if(d)d.innerHTML=reader();
 try{MB.doc=await call('doc',{id})}catch(x){toast(x.message);MB.doc=null}MB.docBusy=false;
 const el=document.getElementById('mbDoc');if(el){el.innerHTML=reader();el.scrollTop=0;if(window.innerWidth<1100)el.scrollIntoView({block:'start',behavior:'smooth'})}};
A.mbFs=v=>{const n=Number(v);MB.fs=n===0?17:Math.max(14,Math.min(24,MB.fs+n*1.5));try{localStorage.setItem('mq_mb_fs',String(MB.fs))}catch(x){}const b=document.querySelector('.mb-body');if(b)b.style.fontSize=MB.fs+'px'};
A.mbFind=v=>{const t=String(v||'').replace(/^المادة رقم\s*\d+\s*من\s*/,'');MB.q='"'+t.replace(/["()]/g,' ').replace(/\s+/g,' ').trim()+'"';MB.src='PS_LEGISLATION';MB.view='search';render();run(1)};
const docText=d=>[d.title,[d.court,d.case_no&&('رقم '+d.case_no),d.date||d.year].filter(Boolean).join(' · '),'',d.body||'',d.url?'\nالمصدر: '+d.url:''].join('\n');
A.mbCopy=()=>{const d=MB.doc;if(!d)return;navigator.clipboard.writeText(docText(d)).then(()=>toast('نُسخ النص'),()=>toast('تعذّر النسخ في هذا المتصفح'))};
A.mbPrint=()=>{const d=MB.doc;if(!d)return;
 if(window.MQP&&MQP.open&&MQP.B){const B=MQP.B;MQP.open({label:d.title,build(){return {title:d.title,sub:[d.source,d.court,d.case_no&&('رقم '+d.case_no),d.date||d.year,d.status].filter(Boolean).join(' · '),file:'مسبار - '+String(d.title).slice(0,60),blocks:[...(d.primary?[]:[B.box('مرجع للمقارنة والاستئناس، وليس ملزماً أمام المحاكم الفلسطينية.')]),...String(d.body||'').split(/\n+/).filter(Boolean).map(t=>B.p(e(t))),B.box('وثيقة عمل من «مِسْبار» تتطلب التحقق من النص الأصلي والحجية والنفاذ قبل الاستناد إليها.'+(d.url?' المصدر: '+e(d.url):''))]}}});return}
 const w=window.open('','_blank');if(!w)return;w.document.write(`<!doctype html><html dir="rtl" lang="ar"><meta charset="utf-8"><title>${e(d.title)}</title><body style="font-family:serif;line-height:2;padding:20mm">${'<h2>'+e(d.title)+'</h2>'+String(d.body||'').split(/\n+/).map(p=>'<p>'+e(p)+'</p>').join('')}</body></html>`);w.document.close();w.print()};
/* حفظ حكم في مكتبة الاجتهادات برابطه (من مراجع المساعد الذكي) */
A.mbSaveUrl=async v=>{try{const r=await call('search',{url:String(v||''),per:'5',facets:'0'});const x=(r.results||[])[0];if(!x)return toast('المرجع غير موجود في قاعدة المسبار');MB.doc=await call('doc',{id:x.id});A.mbSaveRuling()}catch(x){toast(x.message)}};
A.mbSaveRuling=()=>{const d=MB.doc;if(!d||!window.MQ_rulingForm)return;
 const court=/النقض/.test(d.court)?'محكمة النقض':/الدستورية/.test(d.court)?'المحكمة الدستورية العليا':/العدل العليا/.test(d.court)?'المحكمة العليا':/استئناف/.test(d.court)?'محكمة الاستئناف':'أخرى';
 const iso=(d.date||'').match(/^\d{4}-\d{2}-\d{2}$/)?d.date:'';
 MQ_rulingForm({court,no:d.case_no||'',date:iso,field:'',keywords:[],text:String(d.body||'').slice(0,200000),src:d.source+(d.primary?'':' (للاستئناس)'),srcUrl:d.url||'',principle:'',summary:'',outcome:'',
  notes:[d.court&&court==='أخرى'?'المحكمة: '+d.court:'',(d.meta&&d.meta.classifications||[]).length?'التصنيف: '+d.meta.classifications.join('؛ '):'',(d.cites||[]).length?'النصوص المذكورة: '+d.cites.map(c=>c.title).join('؛ '):''].filter(Boolean).join(' · ').slice(0,1500)})};
/* فتح المساعد بنمط محدد، مع تعبئة النص المختار من القارئ عند الحاجة */
function openTool(mode,text){if(!can2('write'))return toast('أدوات التحليل متاحة للمحامين ومدير المكتب');
 if(typeof A.asOpen!=='function')return toast('مساعد المحامي غير متاح');
 const k=S.view==='case'?S.caseId:(S.bagCase||'');A.asOpen(k,{dataset:{mode}});
 if(text){let n=0;const t=setInterval(()=>{const q=document.getElementById('asQ');if(q||++n>40){clearInterval(t);if(q){q.value=String(text).slice(0,100000);q.dispatchEvent(new Event('input',{bubbles:true}))}}},100)}}
A.mbTool=v=>openTool(String(v||'question'));
A.mbAnalyze=()=>{const d=MB.doc;if(!d)return;openTool(d.kind==='ruling'?'appeal':'gaps',docText(d))};

const css=document.createElement('style');css.textContent=`
.mb-wrap{--mbN:#0E2236;--mbN2:#16314A;--mbG:#C9A24A;--mbG2:#F3D58A;margin:-6px 0 0}
.mb-top{border-radius:16px;overflow:hidden;background:#0B1B2B;border:1px solid rgb(201 162 74 / .55);box-shadow:0 8px 24px rgb(11 27 43 / .22)}
.mb-hero{position:relative;aspect-ratio:966/250;max-height:300px;background:#0B1B2B url(misbar-hero.webp) center/contain no-repeat}
.mb-sub{position:absolute;left:63.5%;top:85%;transform:translate(-50%,-50%);color:#F3D58A;font-size:clamp(11px,1.45vw,17px);font-weight:700;letter-spacing:.02em;white-space:nowrap;text-shadow:0 0 6px rgb(243 213 138 / .6),0 1px 2px #000}
.mb-ring{position:absolute;left:63.5%;top:30%;width:11.6%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;animation:mbNeon 2.4s ease-in-out infinite}
.mb-brand{text-align:center;padding:6px 6px 10px;border-bottom:1px solid rgb(201 162 74 / .3);margin-bottom:4px}.mb-brand img{width:96px;height:auto;border-radius:50%;animation:mbNeon 2.4s ease-in-out infinite;box-shadow:0 0 0 2px #F3D58A,0 0 16px 4px rgb(243 213 138 / .85),0 0 36px 10px rgb(201 162 74 / .45)}
@keyframes mbNeon{0%,100%{box-shadow:0 0 0 2px #E9C46A,0 0 12px 3px rgb(243 213 138 / .7),0 0 28px 8px rgb(201 162 74 / .35)}50%{box-shadow:0 0 0 2px #FFF1C2,0 0 22px 6px rgb(243 213 138 / 1),0 0 52px 16px rgb(201 162 74 / .6)}}
@media (prefers-reduced-motion:reduce){.mb-brand img{animation:none}}
.mb-brand b{display:block;font-size:26px;color:var(--mbG2);letter-spacing:.02em;margin-top:2px}.mb-brand small{display:block;color:#C9D4DB;font-size:12px}
.mb-stats{display:flex;gap:6px;flex-wrap:wrap;padding:8px 12px;border-top:2px solid var(--mbG)}
.mb-chip{border:1px solid rgb(201 162 74 / .55);background:rgb(255 255 255 / .06);color:#F2E6C4;border-radius:999px;padding:4px 10px;font:inherit;font-size:12px;cursor:pointer}.mb-chip b{color:var(--mbG2)}.mb-chip.on{background:var(--mbG);color:#0B1B2B}.mb-chip.on b{color:#0B1B2B}
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
mark{background:#FCE9A8;color:inherit;padding:0 1px;border-radius:3px}
.mb-pg{display:flex;gap:10px;justify-content:center;align-items:center;margin-top:12px}
.mb-empty{padding:30px 10px;text-align:center;color:#7a6a4c;display:flex;flex-direction:column;gap:6px}.mb-empty.bad{color:#A33}
.mb-reader{position:sticky;top:10px;max-height:calc(100vh - 30px);overflow:auto}
.mb-doc-h h2{font-size:19px;line-height:1.7;margin:8px 0 4px;color:#13304d}.mb-tools{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}
.mb-cmp{margin-top:8px;padding:8px 10px;border-radius:10px;background:#EEF3F7;color:#3c536b;font-size:13px}
.mb-body{border-top:1px solid #eee4cf;padding-top:10px;line-height:2.1;color:#1d2b38}.mb-body p{margin:0 0 8px}.mb-body h4{margin:14px 0 4px;color:#8A6A25;font-size:1em}
.mb-cites{margin-top:12px;padding:10px 12px;border-radius:12px;background:#FBF6EA;border:1px solid #eadcb8}.mb-cites ul{margin:6px 0 0;padding-inline-start:18px}.mb-cites li{margin-bottom:6px}.mb-cites small{display:block;color:#7a6a4c}
.mb-tgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin-top:12px}
.mb-tool{display:flex;flex-direction:column;gap:6px;text-align:start;padding:16px;border-radius:16px;cursor:pointer;font:inherit;background:linear-gradient(160deg,#16314A,#0B1B2B);border:1px solid rgb(201 162 74 / .55);color:#C9D4DB;box-shadow:0 6px 16px rgb(11 27 43 / .18)}
.mb-tool i{font-style:normal;font-size:22px;color:var(--mbG2)}.mb-tool b{color:#F2D58C;font-size:16px}.mb-tool span{font-size:12.5px;line-height:1.7}.mb-tool:hover{box-shadow:0 0 0 1px var(--mbG2),0 0 20px rgb(233 196 106 / .3)}
.mb-princ{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;justify-content:center}.mb-princ span{font-size:12px;color:#8A6A25;border:1px solid #e4d3a6;border-radius:999px;padding:3px 10px;background:#FBF6EA}
@media(max-width:1100px){.mb-two{grid-template-columns:1fr}.mb-reader{position:static;max-height:none}}
@media(max-width:820px){.mb-grid{grid-template-columns:1fr}.mb-side{position:static;display:flex;flex-wrap:wrap;gap:4px}.mb-side .g,.mb-note{width:100%}.mb-side button{width:auto}.mb-qrow{flex-direction:column}.mb-go{height:44px}}
@media print{.mb-side,.mb-top,.mb-card:not(.mb-reader),.mb-tools{display:none!important}}`;document.head.appendChild(css);
window.MQ_misbar=MB;
})();
