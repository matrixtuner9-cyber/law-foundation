/* ── التشريعات الفلسطينية ──
   مكتبة يدخلها المكتب بنفسه: إضافة يدوية أو استيراد ملف Excel / CSV / JSON (لا جلب تلقائي من أي مصدر خارجي).
   البحث والفلترة والترقيم في الخادم (/api/admin/laws/*) لأن نصوص التشريعات كبيرة ولا تمر بالمزامنة.
   الإضافة والتعديل والاستيراد والحذف من صلاحية مدير المكتب، والاطلاع والطباعة لكل المستخدمين. */
(function(){
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const online=()=>!!(window.MQ&&MQ.online);
const canM=()=>!!(window.MQ&&MQ.user&&MQ.user.role==='admin'); /* صلاحية manage في الخادم */
const canRef=()=>!!(window.MQ&&MQ.user&&['admin','lawyer'].includes(MQ.user.role)&&!MQ.readOnly); /* حفظ مادة في «مكتبتي القانونية» */
const ro=()=>{if(window.MQ&&MQ.readOnly){toast('صلاحيتك للاطلاع فقط');return true}return false};
const nrm=s=>String(s??'').toLowerCase().replace(/[ً-ْٰـ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي');
const plural=(n,one,two,few,many)=>n===1?one:n===2?two:n>=3&&n<=10?n+' '+few:n+' '+many;
const nLaws=n=>plural(n,'تشريع واحد','تشريعان','تشريعات','تشريعاً');

const TYPES0=['قانون','قرار بقانون','مرسوم','قرار','نظام','تعميم','اتفاقية','تعديل'];
const SOURCES0=['الجريدة الرسمية الفلسطينية','مجلس الوزراء','المجلس التشريعي','رئيس دولة فلسطين','ديوان الفتوى والتشريع','وزارة العدل','محكمة النقض','المحكمة الدستورية العليا','السلطة القضائية'];
const STATUSES0=['ساري','معدل','ملغي','مقترح'];
const ST_CLS={'ساري':'ok','معدل':'warn','ملغي':'bad','مقترح':'mz'};
const SORTS=[['relevance','الأكثر صلة'],['year_desc','الأحدث سنة'],['year_asc','الأقدم سنة'],['title','العنوان (أ-ي)'],['added','آخر ما أُضيف']];
const PER=20;
const LG={q:'',type:'',source:'',status:'',y1:'',y2:'',sort:'relevance',page:1,res:null,facets:null,meta:null,loading:false,err:'',seq:0,open:null,sel:new Map()};
const M_=()=>LG.meta||{types:TYPES0,sources:SOURCES0,statuses:STATUSES0};

/* ── الاتصال بالخادم ── */
async function api(path,opt){const r=await fetch('/api/admin/laws/'+path,opt?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(opt)}:{});
 if(r.status===401){location.replace('/login.html');throw new Error('انتهت الجلسة')}
 const j=await r.json().catch(()=>({}));if(!r.ok){const er=new Error(j.error||('HTTP '+r.status));er.status=r.status;er.body=j;throw er}return j}
const qs=()=>new URLSearchParams(Object.entries({q:LG.q,type:LG.type,source:LG.source,status:LG.status,yearFrom:LG.y1,yearTo:LG.y2,sort:LG.sort,page:LG.page,pageSize:PER}).filter(([,v])=>v!==''&&v!=null)).toString();
async function load(){if(!online())return;const my=++LG.seq;LG.loading=true;LG.err='';paint();
 try{if(!LG.meta)LG.meta=await api('meta');const j=await api('search?'+qs());if(my!==LG.seq)return;LG.res=j;LG.facets=j.facets}
 catch(er){if(my!==LG.seq)return;LG.err=er.message||'تعذّر الاتصال بالخادم'}
 finally{if(my===LG.seq){LG.loading=false;paint();drawNav()}}}
function paint(){const r=document.getElementById('lgRes');if(r)r.innerHTML=results();const s=document.getElementById('lgStats');if(s)s.innerHTML=stats()}

/* ── الملاحة ── */
{const i=NAV.findIndex(n=>n[0]==='lawlib');const j=i>=0?i:NAV.findIndex(n=>n[0]==='tpls');NAV.splice(j+1,0,['laws','التشريعات الفلسطينية'])}
const navCount0=window.navCount;window.navCount=v=>v==='laws'?(LG.facets&&LG.facets.total?LG.facets.total:''):navCount0(v);

/* ── الشاشة ── */
V.laws=()=>{
 /* أول عرض، أو العودة للشاشة بعد 20 ثانية (قد يكون زميل أضاف تشريعات) */
 if(!LG.loading&&!LG.err&&(!LG.res||Date.now()-(LG.at||0)>20e3)){LG.at=Date.now();setTimeout(load,0)}
 if(!online())return `<div class="head"><div><h1>التشريعات الفلسطينية</h1></div></div><section class="panel"><div class="bd lg-empty">مكتبة التشريعات محفوظة في خادم المكتب، وتعمل حين يكون ميثاق متصلاً بالخادم.</div></section>`;
 const m=M_(),web=webOk()&&LG.mode!=='lib';
 return `<div class="head"><div><h1>التشريعات الفلسطينية</h1><p class="sub">${web?'بحث مباشر في مصادر التشريعات الفلسطينية الرسمية على الإنترنت، وعرض النصوص الكاملة داخل ميثاق':'مكتبة المكتب من القوانين والقرارات بقانون والأنظمة والمراسيم: بحث في العناوين والملخصات والنصوص، مع فلاتر النوع والجهة والحالة والسنة'}</p></div>
  <div class="toolbar">${!web&&canM()?`<button class="btn pri" data-act="lgNew">إضافة تشريع</button><button class="btn" data-act="lgImport">استيراد ملف</button><button class="btn" data-act="lgExport">تصدير JSON</button>`:''}</div></div>
 ${webOk()?`<div class="lg-tabs" role="tablist"><button role="tab" aria-selected="${web}" class="${web?'on':''}" data-act="lgMode" data-v="web">البحث في المصادر</button><button role="tab" aria-selected="${!web}" class="${web?'':'on'}" data-act="lgMode" data-v="lib">مكتبة المكتب${LG.facets&&LG.facets.total?' <small>'+LG.facets.total+'</small>':''}</button></div>`:''}
 ${web?webView():`<div class="lg-note">يُدخل المكتب هذه التشريعات بنفسه أو يحفظها من نتائج البحث في المصادر. طابِق النص مع المنشور في الجريدة الرسمية (الوقائع الفلسطينية) قبل الاستشهاد به، وتأكد من آخر تعديلاته.</div>
 <div id="lgStats">${stats()}</div>
 <section class="panel"><div class="bd lg-filters">
  <input class="field" id="lgq" type="search" placeholder="ابحث في العنوان أو الرقم أو الملخص أو نص التشريع…" value="${e(LG.q)}" autocomplete="off">
  <select class="field" id="lgType"><option value="">كل الأنواع</option>${m.types.map(x=>`<option ${LG.type===x?'selected':''}>${e(x)}</option>`).join('')}</select>
  <select class="field" id="lgSource"><option value="">كل الجهات</option>${m.sources.map(x=>`<option ${LG.source===x?'selected':''}>${e(x)}</option>`).join('')}</select>
  <select class="field" id="lgStatus"><option value="">كل الحالات</option>${m.statuses.map(x=>`<option ${LG.status===x?'selected':''}>${e(x)}</option>`).join('')}</select>
  <div class="lg-years"><input class="field" id="lgY1" inputmode="numeric" maxlength="4" placeholder="من سنة" aria-label="من سنة" value="${e(LG.y1)}"><span>–</span><input class="field" id="lgY2" inputmode="numeric" maxlength="4" placeholder="إلى سنة" aria-label="إلى سنة" value="${e(LG.y2)}"></div>
  <select class="field" id="lgSort">${SORTS.map(([k,v])=>`<option value="${k}" ${LG.sort===k?'selected':''}>${v}</option>`).join('')}</select>
 </div></section>
 <div id="lgRes">${results()}</div>`}`};

function stats(){const f=LG.facets;if(!f||!f.total)return '';const m=M_();
 const chip=(k,v,n,on)=>`<button class="lg-st ${on?'on':''}" data-act="${k}" data-v="${e(v)}"><b>${n}</b><span>${e(v)}</span></button>`;
 return `<div class="lg-stats"><button class="lg-st ${!LG.type&&!LG.status?'on':''}" data-act="lgAll"><b>${f.total}</b><span>كل التشريعات</span></button>
  ${m.types.filter(t=>f.type[t]).map(t=>chip('lgT',t,f.type[t],LG.type===t)).join('')}
  ${m.statuses.filter(s=>f.status[s]).map(s=>chip('lgS',s,f.status[s],LG.status===s)).join('')}</div>`}

const filtered=()=>!!(LG.q||LG.type||LG.source||LG.status||LG.y1||LG.y2);
function results(){
 if(LG.err)return `<section class="panel"><div class="bd lg-empty">تعذّر تحميل التشريعات: ${e(LG.err)} <button class="btn sm" data-act="lgReload">إعادة المحاولة</button></div></section>`;
 const r=LG.res;if(!r)return `<section class="panel"><div class="bd lg-empty">جارٍ التحميل…</div></section>`;
 if(!LG.facets.total)return `<section class="panel"><div class="bd lg-empty"><h2>لا توجد تشريعات في مكتبة المكتب بعد</h2>
  ${canM()?`<p>أضف التشريعات يدوياً، أو استورد ملف Excel أو CSV أو JSON. يمكنك البدء من القالب الجاهز بالأعمدة الصحيحة.</p><div class="toolbar" style="justify-content:center"><button class="btn pri" data-act="lgImport">استيراد ملف</button><button class="btn" data-act="lgTemplate">تنزيل القالب</button><button class="btn" data-act="lgNew">إضافة تشريع</button></div>`
  :'<p>يضيفها مدير المكتب يدوياً أو باستيراد ملف.</p>'}</div></section>`;
 const words=nrm(LG.q).split(/\s+/).filter(Boolean);
 const n=LG.sel.size,pageOn=r.items.length&&r.items.every(x=>LG.sel.has(x.id));
 const head=`<div class="lg-bar">${r.items.length?`<button class="lg-ck ${pageOn?'on':''}" data-act="lgSelPage" aria-pressed="${pageOn}" title="تحديد كل تشريعات هذه الصفحة"></button>`:''}<span>${r.total?nLaws(r.total)+(filtered()?' مطابقة':''):'لا نتائج'}${LG.loading?' · <span class="m">يُحدَّث…</span>':''}${n?` · <b>${n} محدد</b> <button class="link" data-act="lgSelNone">إلغاء التحديد</button>`:''}</span>${filtered()?'<button class="link" data-act="lgClear">مسح البحث والفلاتر</button>':''}
  <span style="flex:1"></span>${r.total?`<button class="btn sm pri" data-act="lgExtract" title="${n?'التشريعات التي حددتها، من كل الصفحات':'أول 100 من نتائج البحث الحالي'}">استخراج ${n?'المحدد ('+n+')':'النتائج'} في صفحة مستقلة</button>`:''}</div>`;
 if(!r.items.length)return head+`<section class="panel"><div class="bd lg-empty">لا تشريعات تطابق بحثك. جرّب كلمة أقصر أو أزل بعض الفلاتر.</div></section>`;
 return head+`<div class="lg-list">${r.items.map(x=>card(x,words)).join('')}</div>${pager(r)}`}
function mark(t,words){let h=e(t);if(!words.length)return h;
 /* تمييز تقريبي: يطابق الكلمة مع تجاهل التشكيل والهمزات */
 const src=String(t),n=nrm(src);if(n.length!==src.length)return h;const hits=[];
 words.forEach(w=>{let i=n.indexOf(w);while(i>=0&&hits.length<40){hits.push([i,i+w.length]);i=n.indexOf(w,i+w.length)}});
 if(!hits.length)return h;hits.sort((a,b)=>a[0]-b[0]);let out='',p=0;hits.forEach(([a,b])=>{if(a<p)return;out+=e(src.slice(p,a))+'<mark>'+e(src.slice(a,b))+'</mark>';p=b});return out+e(src.slice(p))}
function card(x,words){const on=LG.sel.has(x.id);return `<article class="lg-card ${on?'sel':''}" data-act="lgOpen" data-v="${e(x.id)}" tabindex="0">
 <div class="lg-top"><button class="lg-ck ${on?'on':''}" data-act="lgSel" data-v="${e(x.id)}" aria-pressed="${on}" aria-label="تحديد للاستخراج"></button><span class="pill">${e(x.type)}</span><span class="pill ${ST_CLS[x.status]||''}">${e(x.status)}</span>${x.ref?`<span class="mono lg-ref">${e(x.ref)}</span>`:''}${x.year?`<span class="m">${x.year}</span>`:''}<span class="m lg-src">${e(x.source)}</span></div>
 <h3>${mark(x.title,words)}</h3>
 <p class="lg-sum">${mark(x.summary,words)}</p>
 ${x.hit?`<p class="lg-hit"><small>في النص:</small> ${mark(x.hit,words)}</p>`:''}
 ${(x.tags||[]).length?`<div class="lg-tags">${x.tags.map(t=>`<span>${e(t)}</span>`).join('')}</div>`:''}
</article>`}
function pager(r){if(r.pages<=1)return '';const p=r.page,b=[];
 const btn=(n,l=n)=>`<button class="btn sm ${n===p?'pri':''}" data-act="lgPage" data-v="${n}" ${n===p?'aria-current="page"':''}>${l}</button>`;
 if(p>1)b.push(btn(p-1,'السابق'));
 const set=new Set([1,r.pages,p-1,p,p+1].filter(n=>n>=1&&n<=r.pages));let last=0;[...set].sort((a,b)=>a-b).forEach(n=>{if(n-last>1)b.push('<span class="m">…</span>');b.push(btn(n));last=n});
 if(p<r.pages)b.push(btn(p+1,'التالي'));
 return `<nav class="lg-pager" aria-label="الصفحات">${b.join('')}</nav>`}

/* ── البحث المباشر في المصادر على الإنترنت (اسم المصدر لا يظهر) ── */
const webOk=()=>online()&&!document.body.classList.contains('mq-private');
const W={q:'',page:1,items:[],srcs:{},busy:0,err:'',sel:new Map(),done:false,q2:''};
const SRCS=['s1','s2'];
A.lgMode=v=>{LG.mode=v;render();if(v==='lib')load()};
async function webSearch(more){const q=W.q.trim();if(q.length<2)return toast('اكتب كلمة من حرفين على الأقل');
 if(!more){W.page=1;W.items=[];W.srcs={};W.err='';W.q2='';W.searched=q}else W.page++;
 const page=W.page,seq=W.seq=(W.seq||0)+1;W.busy=0;
 SRCS.forEach(src=>{if(more&&!(W.srcs[src]&&W.srcs[src].pages>=page))return;W.busy++;
  api2('search?'+new URLSearchParams({q,src,page})).then(r=>{if(seq!==W.seq)return;W.srcs[src]={pages:r.pages||0};if(r.q2)W.q2=r.q2;
   const have=new Set(W.items.map(x=>x.title.replace(/[\s()م.]/g,'')));r.items.forEach(x=>{const k=x.title.replace(/[\s()م.]/g,'');if(!have.has(k)){have.add(k);W.items.push(x)}})})
  .catch(er=>{if(seq!==W.seq)return;W.srcs[src]=W.srcs[src]||{pages:0};if(!W.items.length)W.err=er.message})
  .finally(()=>{if(seq!==W.seq)return;W.busy--;webPaint()})});
 webPaint()}
async function api2(path){const r=await fetch('/api/admin/lawsearch/'+path);if(r.status===401){location.replace('/login.html');throw new Error('انتهت الجلسة')}
 const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||('HTTP '+r.status));return j}
const webMore=()=>SRCS.some(s=>W.srcs[s]&&W.srcs[s].pages>W.page);
function webView(){return `<section class="panel"><form class="bd lg-wform" id="fLgWeb"><input class="field" id="lgwq" type="search" placeholder="ابحث عن قانون أو قرار بقانون أو نظام… مثال: قانون العمل، الأسلحة النارية، التنفيذ" value="${e(W.q)}" autocomplete="off" required minlength="2"><button class="btn pri">بحث</button></form></section>
 <div class="lg-note">النتائج من مصادر التشريعات الفلسطينية المنشورة على الإنترنت، وتُعرض كما نُشرت. طابِق النص مع الجريدة الرسمية (الوقائع الفلسطينية) قبل الاستشهاد به.</div>
 <div id="lgWeb">${webResults()}</div>`}
function webPaint(){const el=document.getElementById('lgWeb');if(el)el.innerHTML=webResults()}
function webResults(){
 if(!W.searched)return `<section class="panel"><div class="bd lg-empty"><h2>ابحث في التشريعات الفلسطينية</h2><p>اكتب اسم التشريع أو موضوعه أو كلمة من نصه، ثم اضغط «بحث». تفتح النصوص الكاملة هنا، ويمكنك تحديد ما تريد واستخراجه في صفحة مستقلة للطباعة والحفظ، أو حفظه في مكتبة المكتب.</p></div></section>`;
 const words=nrm(W.q2||W.searched).split(/\s+/).filter(Boolean),n=W.sel.size,pageOn=W.items.length&&W.items.every(x=>W.sel.has(x.id));
 const bar=`<div class="lg-bar">${W.items.length?`<button class="lg-ck ${pageOn?'on':''}" data-act="lgwSelAll" aria-pressed="${pageOn}" title="تحديد كل النتائج المعروضة"></button>`:''}<span>${W.items.length?nLaws(W.items.length)+(webMore()?' (والمزيد)':''):W.busy?'':'لا نتائج'}${W.busy?' · <span class="m">جارٍ البحث…</span>':''}${W.q2?` · <span class="m">عُرضت نتائج «${e(W.q2)}»</span>`:''}${n?` · <b>${n} محدد</b> <button class="link" data-act="lgwSelNone">إلغاء التحديد</button>`:''}</span>
  <span style="flex:1"></span>${n?`<button class="btn sm pri" data-act="lgwExtract">استخراج المحدد (${n}) في صفحة مستقلة</button>`:''}</div>`;
 if(!W.items.length)return bar+(W.busy?`<section class="panel"><div class="bd lg-empty">جارٍ البحث في المصادر…</div></section>`:`<section class="panel"><div class="bd lg-empty">${W.err?e(W.err):'لا تشريعات تطابق بحثك. جرّب كلمة أخرى أو اكتب الهمزات كما في النص الرسمي (مثل «الأسلحة»).'}</div></section>`);
 return bar+`<div class="lg-list">${W.items.map(x=>{const on=W.sel.has(x.id);return `<article class="lg-card ${on?'sel':''}" data-act="lgwOpen" data-v="${e(x.id)}" tabindex="0">
  <div class="lg-top"><button class="lg-ck ${on?'on':''}" data-act="lgwSel" data-v="${e(x.id)}" aria-pressed="${on}" aria-label="تحديد للاستخراج"></button><span class="pill">${e(x.type)}</span><span class="pill ${ST_CLS[x.status]||''}" title="${e(x.statusRaw||'')}">${e(x.statusRaw||x.status)}</span>${x.ref?`<span class="mono lg-ref">${e(x.ref)}</span>`:''}${x.articles?`<span class="m">${x.articles} مادة</span>`:''}${x.subject?`<span class="m lg-src">${e(x.subject)}</span>`:''}</div>
  <h3>${mark(x.title,words)}</h3>${x.hit?`<p class="lg-hit">${mark(x.hit,words)}</p>`:''}</article>`}).join('')}</div>
  ${webMore()?`<div class="lg-pager"><button class="btn" data-act="lgwMore" ${W.busy?'disabled':''}>${W.busy?'جارٍ التحميل…':'المزيد من النتائج'}</button></div>`:''}`}
A.lgwMore=()=>{if(!W.busy)webSearch(true)};
A.lgwSel=v=>{const x=W.items.find(i=>i.id===v);if(W.sel.has(v))W.sel.delete(v);else if(W.sel.size>=20)return toast('الحد الأقصى 20 تشريعاً في الاستخراج الواحد من المصادر');else W.sel.set(v,x);webPaint()};
A.lgwSelAll=()=>{const all=W.items.every(x=>W.sel.has(x.id));W.items.forEach(x=>{if(all)W.sel.delete(x.id);else if(W.sel.size<20)W.sel.set(x.id,x)});webPaint()};
A.lgwSelNone=()=>{W.sel.clear();webPaint()};
const asRec=x=>({id:x.id,title:x.title,type:x.type,ref:x.ref,year:x.year,source:x.source,status:x.status,summary:x.summary,content:x.content,tags:String(x.subject||'').split(' / ').filter(Boolean),web:true});
async function webItem(id){const j=await api2('item?id='+encodeURIComponent(id));j.item.rec=j.rec;return j.item}
A.lgwOpen=async v=>{LG.open=v;const box=document.getElementById('modal');
 box.innerHTML=`<div class="modal-bg" data-act="close"><div class="modal lg-modal" role="dialog"><div class="bd lg-empty">جارٍ جلب النص الكامل…</div></div></div>`;
 try{const x=await webItem(v);if(LG.open!==v)return;LG.wcur=x;box.innerHTML=webDetail(x)}
 catch(er){box.innerHTML=`<div class="modal-bg" data-act="close"><div class="modal lg-modal"><div class="head"><h1 style="font-size:22px">تعذّر جلب التشريع</h1><button class="btn sm" data-act="close">إغلاق</button></div><p>${e(er.message)}</p></div></div>`}};
function webDetail(x){const words=nrm(W.q2||W.searched||'').split(/\s+/).filter(Boolean);
 const body=(x.parts&&x.parts.length?x.parts:[{t:x.content||''}]).map(p=>p.h?`<h3 class="lg-ph">${e(p.h)}</h3>`:p.a?`<p><b class="lg-art">${e(p.a)}</b> ${mark(p.t,words).replace(/\n/g,'<br>')}</p>`:paras(p.t).map(t=>`<p>${mark(t,words)}</p>`).join('')).join('');
 return `<div class="modal-bg" data-act="close"><div class="modal lg-modal" role="dialog" aria-label="${e(x.title)}">
 <div class="head"><div><h1 style="font-size:23px">${e(x.title)}</h1></div><button class="btn sm" data-act="close">إغلاق</button></div>
 <div class="toolbar" style="margin-bottom:10px"><button class="btn pri" data-act="lgwPrint">معاينة وطباعة</button><button class="btn" data-act="lgwExtractOne">صفحة مستقلة</button><button class="btn" data-act="lgwCite">نسخ الإشارة</button>${canM()?'<button class="btn" data-act="lgwSave">حفظ في مكتبة المكتب</button>':''}${canRef()?'<button class="btn" data-act="lgwSaveArticle">حفظ مادة في مكتبتي</button>':''}<button class="btn" data-act="lgwSel" data-v="${e(x.id)}">${W.sel.has(x.id)?'إلغاء التحديد':'تحديد للاستخراج'}</button></div>
 <dl class="lg-kv">${[['النوع',e(x.kind||x.type)],['الرقم',x.ref?`<span class="mono">${e(x.ref)}</span>`:'—'],['الجهة',e(x.source)],['الحالة',e(x.statusRaw||x.status)],['السنة',x.year||'—'],['عدد المواد',x.articles||'—'],['التصنيف',e(x.subject||'—')]].map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
 <h2 class="lg-h">نص التشريع</h2><div class="lg-text">${body||'<p class="m">لا يتوفر نص مفصّل لهذا التشريع في المصدر.</p>'}</div>
 <p class="m" style="margin-top:12px;font-size:12.5px">النص كما نُشر في مصدره على الإنترنت. طابِقه مع الجريدة الرسمية (الوقائع الفلسطينية) قبل الاستشهاد به.</p></div></div>`}
A.lgwPrint=()=>{if(LG.wcur&&window.MQP)MQP.open(lawDoc(asRec(LG.wcur)))};
A.lgwCite=()=>{const x=LG.wcur;if(!x)return;const t=x.title;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('نُسخت الإشارة: '+t)).catch(()=>toast(t))};
A.lgwSave=async()=>{const x=LG.wcur;if(!x||ro()||!canM())return;
 try{const r=await api('import',{records:[x.rec],mode:'skip',file:'online'});toast(r.added?'حُفظ في مكتبة المكتب':r.duplicates?'موجود مسبقاً في مكتبة المكتب':(r.errors[0]||{}).message||'لم يُحفظ');LG.at=0;if((r.added||r.duplicates)&&!document.querySelector('.lg-modal [data-act="klGo"]'))document.querySelector('.lg-modal .toolbar')?.insertAdjacentHTML('beforeend','<button class="btn pri" data-act="klGo">عرض في مكتبتي</button>')}catch(er){toast(er.message)}};
/* حفظ مادة منفردة في «مكتبتي القانونية»: النص المحدَّد بالفأرة ورقم المادة إن وُجد فيه؛ لا يُنسخ القانون كله */
function articleFromLaw(x){
 if(!x||!window.MQ_openRefForm)return toast('أعد تحميل الصفحة وحاول مرة أخرى');
 const sel=String(window.getSelection&&window.getSelection()||'').trim().slice(0,30000),m=sel.match(/(?:المادة|مادة)\s*\(?\s*(\d+)/),no=m?m[1]:'';
 MQ_openRefForm({referenceType:'article',authorityType:x.type||'قانون',natureType:'مادة قانونية',lawName:x.title||'',lawNumber:x.ref||'',lawYear:String(x.year||''),
  title:(no?'المادة '+no+' من ':'مادة من ')+(x.title||''),articleNumber:no,text:sel,source:x.source||'',srcUrl:x.srcUrl||x.url||''});
}
A.lgSaveArticle=()=>articleFromLaw(LG.cur);
A.lgwSaveArticle=()=>articleFromLaw(LG.wcur);
A.lgwExtractOne=()=>{const x=LG.wcur;if(!x)return;EX.recs=[asRec(x)];EX.crit='';EX.web=true;viewer()};
A.lgwExtract=async()=>{const ids=[...W.sel.keys()];if(!ids.length)return;const out=[];
 document.getElementById('modal').innerHTML=`<div class="modal-bg"><div class="modal lg-modal" role="dialog"><div class="bd lg-empty"><h2>جارٍ جلب النصوص الكاملة</h2><p id="lgwProg">0 من ${ids.length}</p><p class="m">بعض المصادر تطلب التمهّل بين الطلبات، فقد يستغرق ذلك قليلاً.</p><button class="btn" data-act="close">إلغاء</button></div></div></div>`;
 const tok=W.exTok=(W.exTok||0)+1;
 try{for(const id of ids){if(W.exTok!==tok||!document.getElementById('lgwProg'))return;out.push(asRec(await webItem(id)));const p=document.getElementById('lgwProg');if(p)p.textContent=out.length+' من '+ids.length}
  EX.recs=out;EX.crit=W.searched?'البحث: «'+W.searched+'»':'';EX.web=true;if(out.length>60)EX.tpl='brief';viewer()}
 catch(er){A.close();toast(er.message)}};
document.addEventListener('submit',ev=>{if(ev.target.id!=='fLgWeb')return;ev.preventDefault();ev.stopImmediatePropagation();W.q=document.getElementById('lgwq').value;W.sel.clear();webSearch(false)},true);

/* ── التفاصيل ── */
const paras=t=>String(t||'').split(/\n+/).map(s=>s.trim()).filter(Boolean);
const cite=x=>[x.type&&!x.title.startsWith(x.type)?x.type:'',x.title,x.ref&&!x.title.includes(x.ref)?'رقم '+x.ref:''].filter(Boolean).join(' ');
async function openD(id){LG.open=id;const box=document.getElementById('modal');
 box.innerHTML=`<div class="modal-bg" data-act="close"><div class="modal lg-modal" role="dialog" aria-label="تشريع"><div class="bd lg-empty">جارٍ فتح التشريع…</div></div></div>`;
 try{const {rec}=await api('item?id='+encodeURIComponent(id));if(LG.open!==id)return;LG.cur=rec;box.innerHTML=detail(rec)}
 catch(er){box.innerHTML=`<div class="modal-bg" data-act="close"><div class="modal lg-modal"><div class="head"><h1 style="font-size:22px">تعذّر فتح التشريع</h1><button class="btn sm" data-act="close">إغلاق</button></div><p>${e(er.message)}</p></div></div>`}}
function detail(x){const words=nrm(LG.q).split(/\s+/).filter(Boolean);
 const kv=[['النوع',e(x.type)],['الرقم',x.ref?`<span class="mono">${e(x.ref)}</span>`:'—'],['الجهة',e(x.source)],['الحالة',`<span class="pill ${ST_CLS[x.status]||''}">${e(x.status)}</span>`],
  ['تاريخ الإصدار',x.issueDate?dmy(x.issueDate):'—'],['تاريخ النشر',x.publishDate?dmy(x.publishDate):'—'],['السنة',x.year||'—'],['أُضيف',`${e(x.addedAt||'')} · ${e(x.addedBy||'')}`]];
 return `<div class="modal-bg" data-act="close"><div class="modal lg-modal" role="dialog" aria-label="${e(x.title)}">
 <div class="head"><div>${x.titleEn?`<div class="m" dir="ltr" style="text-align:right">${e(x.titleEn)}</div>`:''}<h1 style="font-size:23px">${e(x.title)}</h1></div><button class="btn sm" data-act="close">إغلاق</button></div>
 <div class="toolbar" style="margin-bottom:10px"><button class="btn pri" data-act="lgPrint">معاينة وطباعة</button><button class="btn" data-act="lgCite">نسخ الإشارة</button>${canRef()?'<button class="btn" data-act="lgSaveArticle">حفظ مادة في مكتبتي</button>':''}${canM()?`<button class="btn" data-act="lgEdit">تعديل</button><button class="btn danger" data-act="lgDel">حذف</button>`:''}</div>
 <dl class="lg-kv">${kv.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
 <div class="lg-sumbox"><b>الملخص</b><p>${mark(x.summary,words)}</p></div>
 <h2 class="lg-h">نص التشريع</h2>
 <div class="lg-text">${paras(x.content).map(p=>`<p>${mark(p,words)}</p>`).join('')}</div>
 ${(x.tags||[]).length?`<div class="lg-tags" style="margin-top:10px">${x.tags.map(t=>`<span>${e(t)}</span>`).join('')}</div>`:''}
 <p class="m" style="margin-top:12px;font-size:12.5px">آخر تحديث ${e(x.updatedAt||'')} · ${e(x.updatedBy||'')}. طابِق النص مع المنشور رسمياً قبل الاستشهاد به.</p>
 </div></div>`}

/* ── الطباعة ── */
function lawDoc(x){const M=window.MQP,B=M.B,E=M.esc;
 return {label:x.title,build(){const st=this.state||{};
  const blocks=[B.kv([['النوع',E(x.type)],['الرقم',x.ref?'<span class="mono">'+E(x.ref)+'</span>':'—'],['الجهة',E(x.source)],['الحالة',E(x.status)],['تاريخ الإصدار',x.issueDate?dmy(x.issueDate):'—'],['تاريخ النشر',x.publishDate?dmy(x.publishDate):'—']],2)];
  blocks.push(B.box('<b>الملخص:</b> '+E(x.summary)));
  if(st.text!==false){blocks.push(B.h('نص التشريع'));paras(x.content).forEach(p=>blocks.push(B.p(E(p))))}
  blocks.push(B.p('<small>نسخة من مكتبة تشريعات المكتب؛ يُرجع إلى النص المنشور في الجريدة الرسمية (الوقائع الفلسطينية) للتحقق.</small>','s'));
  return {title:x.title,sub:[x.type,x.ref?'رقم '+x.ref:'',x.year?'لسنة '+x.year:''].filter(Boolean).join(' · '),ref:'تش/'+(x.ref||x.id),file:'legislation-'+(x.ref||x.id).replace(/[^\w-]+/g,'-'),orient:'port',blocks,sign:[]}},
 opts:()=>`<label class="pvck"><input type="checkbox" data-po="text" checked><span>طباعة نص التشريع كاملاً</span></label>`}}
A.lgPrint=()=>{if(LG.cur&&window.MQP)MQP.open(lawDoc(LG.cur))};
/* ── التحديد والاستخراج في صفحة مستقلة ── */
A.lgSel=(v,t,ev)=>{if(ev)ev.stopPropagation();const x=(LG.res&&LG.res.items||[]).find(i=>i.id===v);if(LG.sel.has(v))LG.sel.delete(v);else if(LG.sel.size>=200)return toast('الحد الأقصى 200 تشريع في الاستخراج الواحد');else LG.sel.set(v,x||{id:v});paint()};
A.lgSelPage=()=>{const it=(LG.res&&LG.res.items)||[];const all=it.every(x=>LG.sel.has(x.id));it.forEach(x=>{if(all)LG.sel.delete(x.id);else if(LG.sel.size<200)LG.sel.set(x.id,x)});paint()};
A.lgSelNone=()=>{LG.sel.clear();paint()};
const EX={recs:[],tpl:'full',toc:true,sum:true,tags:true,note:'',crit:''};
const TPL={full:'النص الكامل',brief:'ملخصات',list:'جدول'};
A.lgExtract=async()=>{try{let ids=[...LG.sel.keys()];
  if(!ids.length){const p=new URLSearchParams(qs());p.set('page','1');p.set('pageSize','100');ids=(await api('search?'+p)).items.map(x=>x.id)}
  if(!ids.length)return toast('لا تشريعات لاستخراجها');
  toast('جارٍ تجهيز '+nLaws(ids.length)+'…');
  const {recs}=await api('items?ids='+encodeURIComponent(ids.join(',')));
  EX.recs=recs;EX.web=false;EX.crit=LG.sel.size?'':[LG.q?'البحث: «'+LG.q+'»':'',LG.type,LG.source,LG.status,LG.y1||LG.y2?'السنوات '+(LG.y1||'…')+'–'+(LG.y2||'…'):''].filter(Boolean).join(' · ');
  if(!EX.tpl||(recs.length>60&&EX.tpl==='full'))EX.tpl=recs.length>60?'brief':'full';
  viewer()}catch(er){toast(er.message)}};
const isElectron=/Electron/i.test(navigator.userAgent);
function viewer(){document.getElementById('modal').innerHTML=`<div class="lg-viewer" role="dialog" aria-label="صفحة التشريعات المستخرجة">
 <div class="lg-vbar"><b>${nLaws(EX.recs.length)}</b>
  <label>العرض <select class="field" id="exTpl">${Object.entries(TPL).map(([k,v])=>`<option value="${k}" ${EX.tpl===k?'selected':''}>${v}</option>`).join('')}</select></label>
  <label class="lg-vck"><input type="checkbox" id="exToc" ${EX.toc?'checked':''}> الفهرس</label><label class="lg-vck"><input type="checkbox" id="exSum" ${EX.sum?'checked':''}> الملخص</label><label class="lg-vck"><input type="checkbox" id="exTags" ${EX.tags?'checked':''}> الوسوم</label>
  <input class="field" id="exNote" placeholder="عنوان أو ملاحظة أعلى الصفحة (اختياري)" value="${e(EX.note)}" maxlength="200">
  <span style="flex:1"></span>
  <button class="btn pri" data-act="exPrint">طباعة / حفظ PDF</button><button class="btn" data-act="exSave" data-v="html">حفظ صفحة HTML</button><button class="btn" data-act="exSave" data-v="doc">حفظ Word</button>${isElectron?'':'<button class="btn" data-act="exTab">فتح في تبويب جديد</button>'}<button class="btn" data-act="close">إغلاق</button></div>
 <iframe id="lgFrame" title="معاينة الصفحة المستقلة"></iframe></div>`;
 drawEx();
 const on=(id,f)=>{const el=document.getElementById(id);if(el)el.addEventListener(el.tagName==='INPUT'&&el.type==='text'||el.id==='exNote'?'input':'change',()=>{f(el);drawEx()})};
 on('exTpl',el=>EX.tpl=el.value);on('exToc',el=>EX.toc=el.checked);on('exSum',el=>EX.sum=el.checked);on('exTags',el=>EX.tags=el.checked);on('exNote',el=>EX.note=el.value)}
let exT;function drawEx(){clearTimeout(exT);exT=setTimeout(()=>{const f=document.getElementById('lgFrame');if(f)f.srcdoc=pageHtml(false)},120)}
A.exPrint=()=>{const f=document.getElementById('lgFrame');if(f&&f.contentWindow){f.contentWindow.focus();f.contentWindow.print()}};
A.exSave=v=>{const base='mithaq-legislation-'+iso(TODAY);/* اسم لاتيني: بعض المتصفحات تُسقط الأسماء العربية */
 if(v==='doc')dl(new Blob(['﻿'+pageHtml('word')],{type:'application/msword;charset=utf-8'}),base+'.doc');
 else dl(new Blob([pageHtml('file')],{type:'text/html;charset=utf-8'}),base+'.html');toast('حُفظ الملف')};
A.exTab=()=>{const u=URL.createObjectURL(new Blob([pageHtml('file')],{type:'text/html;charset=utf-8'}));const w=window.open(u,'_blank');if(!w)toast('اسمح للمتصفح بفتح النوافذ المنبثقة');setTimeout(()=>URL.revokeObjectURL(u),60000)};
/* الصفحة المستقلة: HTML كامل يعمل بلا إنترنت، بفهرس وروابط داخلية، وكل تشريع يبدأ بصفحة جديدة عند الطباعة */
function pageHtml(mode){const o=(window.MQ&&MQ.settings)||{},rs=EX.recs,t=EX.tpl,word=mode==='word',file=!!mode;
 const meta=x=>[['النوع',x.type],['الرقم',x.ref||'—'],['الجهة',x.source],['الحالة',x.status],['تاريخ الإصدار',x.issueDate?dmy(x.issueDate):'—'],['تاريخ النشر',x.publishDate?dmy(x.publishDate):'—']];
 const kvT=x=>{const m=meta(x);let h='';for(let i=0;i<m.length;i+=3)h+='<tr>'+m.slice(i,i+3).map(([a,b])=>`<th>${e(a)}</th><td>${e(b)}</td>`).join('')+'</tr>';return `<table class="kv">${h}</table>`};
 const body=t==='list'?`<table class="lst"><thead><tr><th>#</th><th>التشريع</th><th>النوع</th><th>الرقم</th><th>السنة</th><th>الجهة</th><th>الحالة</th>${EX.sum?'<th>الملخص</th>':''}</tr></thead><tbody>${rs.map((x,i)=>`<tr><td>${i+1}</td><td><b>${e(x.title)}</b></td><td>${e(x.type)}</td><td class="n">${e(x.ref||'—')}</td><td class="n">${x.year||'—'}</td><td>${e(x.source)}</td><td>${e(x.status)}</td>${EX.sum?`<td>${e(x.summary)}</td>`:''}</tr>`).join('')}</tbody></table>`
  :rs.map((x,i)=>`<article id="l${i+1}" class="${t==='full'&&i?'pb':''}"><h2><span>${i+1}.</span> ${e(x.title)}</h2>${x.titleEn?`<div class="en" dir="ltr">${e(x.titleEn)}</div>`:''}${kvT(x)}
   ${EX.sum?`<div class="sum"><b>الملخص:</b> ${e(x.summary)}</div>`:''}
   ${t==='full'?`<h3>نص التشريع</h3><div class="txt">${paras(x.content).map(p=>`<p>${e(p)}</p>`).join('')}</div>`:''}
   ${EX.tags&&(x.tags||[]).length?`<div class="tags">${x.tags.map(g=>`<span>${e(g)}</span>`).join('')}</div>`:''}
   ${!word&&EX.toc&&rs.length>1?'<a class="top" href="#toc">↑ الفهرس</a>':''}</article>`).join(word?'<br style="page-break-before:always">':'');
 const toc=EX.toc&&rs.length>1&&t!=='list'?`<nav id="toc"><h2>الفهرس</h2><ol>${rs.map((x,i)=>`<li>${word?e(x.title):`<a href="#l${i+1}">${e(x.title)}</a>`} <small>${e([x.type,x.ref,x.year].filter(Boolean).join(' · '))}</small></li>`).join('')}</ol></nav>`:'';
 const fonts=word?'':`<link rel="stylesheet" href="${location.origin}/fonts/fonts.css">`;
 return `<!doctype html><html lang="ar" dir="rtl"${word?' xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"':''}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(EX.note||'تشريعات مختارة')}</title>${fonts}
<style>@page{size:A4;margin:16mm 15mm}*{box-sizing:border-box}
body{font-family:${word?'"Simplified Arabic","Traditional Arabic",':''}Cairo,Tahoma,sans-serif;color:#1A1209;direction:rtl;margin:0;background:${file?'#F8F6F0':'#fff'};line-height:1.8}
.page{max-width:900px;margin:0 auto;background:#fff;padding:28px 34px}
header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px double #B8863D;padding-bottom:8px;margin-bottom:16px}header b{font-size:17pt;color:#0B182B}header div{color:#8B6F47;font-size:10.5pt}
h1{font-size:19pt;text-align:center;color:#0B182B;margin:6px 0 2px}.crit{text-align:center;color:#8B6F47;font-size:10.5pt;margin:0 0 14px}
nav{border:1px solid #E6D5B8;border-radius:8px;padding:8px 16px;margin:0 0 18px;background:#FFFDF8}nav h2{font-size:13pt;margin:4px 0;color:#0B182B;border:0}nav ol{margin:0;padding-inline-start:22px;font-size:11.5pt}nav a{color:#0B182B;text-decoration:none}nav small{color:#8B6F47}
article{margin:0 0 22px}h2{font-size:14.5pt;color:#0B182B;border-bottom:1px solid #E6D5B8;padding-bottom:4px;margin:16px 0 6px}h2 span{color:#B8863D}.en{color:#6F5B3E;font-size:10.5pt;text-align:left}
h3{font-size:12.5pt;color:#8B6F47;margin:12px 0 4px}
table{border-collapse:collapse;width:100%;font-size:10.5pt;margin:6px 0}th,td{border:1px solid #E6D5B8;padding:4px 8px;text-align:right;vertical-align:top}th{background:#F7EFDD;color:#3E2F21;font-weight:600}.kv th{width:12%}.n{font-family:"IBM Plex Mono",monospace;white-space:nowrap}
.lst thead th{background:#0B182B;color:#F1E3C6}
.sum{background:#F7F3EA;border-right:4px solid #D4AF37;padding:6px 12px;margin:8px 0;font-size:11.5pt}
.txt{font-family:${word?'"Traditional Arabic",':''}Amiri,"Traditional Arabic",serif;font-size:14pt;line-height:2;text-align:justify}.txt p{margin:0 0 8px}
.tags span{display:inline-block;font-size:9.5pt;border:1px solid #E6D5B8;border-radius:99px;padding:0 9px;margin:2px;color:#6F5B3E}
.top{font-size:9.5pt;color:#8B6F47;text-decoration:none}
footer{margin-top:22px;border-top:1px solid #E6D5B8;padding-top:6px;font-size:9.5pt;color:#8B6F47}
.pbar{position:sticky;top:0;background:#0B182B;color:#F1E3C6;padding:8px 14px;display:flex;gap:10px;align-items:center;justify-content:center;font-size:12pt}.pbar button{font:inherit;background:#D4AF37;color:#1A1209;border:0;border-radius:8px;padding:5px 14px;cursor:pointer}
@media print{body{background:#fff}.page{padding:0;max-width:none}.pbar,.top{display:none}article.pb{break-before:page}nav{break-after:page}tr,.sum{break-inside:avoid}h2,h3{break-after:avoid}}
</style></head><body>${file&&!word?'<div class="pbar"><span>صفحة مستقلة من ميثاق</span><button onclick="print()">طباعة / حفظ PDF</button></div>':''}<div class="page">
<header><div><b>${e(o.officeName||OFFICE.name||'')}</b><div>${e(o.lawyerName||OFFICE.lawyer||'')}${o.city?' · '+e(o.city):''}</div></div><div>تاريخ الاستخراج: ${dmy(iso(TODAY))}</div></header>
<h1>${e(EX.note||'تشريعات مختارة')}</h1><p class="crit">${nLaws(rs.length)}${EX.crit?' · '+e(EX.crit):''}</p>
${toc}${body}
<footer>${EX.web?'مستخرج عبر نظام ميثاق من مصادر التشريعات المنشورة على الإنترنت':'مستخرج من مكتبة تشريعات المكتب في نظام ميثاق'}. يُرجع إلى النص المنشور في الجريدة الرسمية (الوقائع الفلسطينية) للتحقق من النص وآخر تعديلاته قبل الاستشهاد.</footer></div></body></html>`}
A.lgCite=()=>{const x=LG.cur;if(!x)return;const t=cite(x)+(x.issueDate?' الصادر بتاريخ '+dmy(x.issueDate):x.year?' لسنة '+x.year:'');
 (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('نُسخت الإشارة: '+t)).catch(()=>toast(t))};

/* ── الإضافة والتعديل ── */
function form(x){x=x||{};const m=M_(),opt=(l,v)=>l.map(o=>`<option ${o===v?'selected':''}>${e(o)}</option>`).join('');
 return `<div class="modal-bg" data-act="close"><div class="modal lg-modal" role="dialog" aria-label="${x.id?'تعديل تشريع':'تشريع جديد'}">
 <div class="head"><h1 style="font-size:23px">${x.id?'تعديل تشريع':'إضافة تشريع'}</h1><button class="btn sm" data-act="close">إغلاق</button></div>
 <form class="form" id="fLgEdit" data-id="${e(x.id||'')}" data-v="${e(x._v||'')}">
  <label class="wide">عنوان التشريع<input class="field" name="titleAr" value="${e(x.title)}" required maxlength="500" placeholder="مثال: قانون العمل رقم (7) لسنة 2000"></label>
  <label>النوع<select class="field" name="type" required>${opt(m.types,x.type||'قانون')}</select></label>
  <label>رقم التشريع<input class="field mono" name="referenceNumber" value="${e(x.ref)}" maxlength="80" placeholder="7/2000"></label>
  <label>الجهة<select class="field" name="source" required>${opt(m.sources,x.source)}</select></label>
  <label>الحالة<select class="field" name="status">${opt(m.statuses,x.status||'ساري')}</select></label>
  <label>تاريخ الإصدار<input class="field" type="date" name="issueDate" value="${e(x.issueDate)}"></label>
  <label>تاريخ النشر<input class="field" type="date" name="publishDate" value="${e(x.publishDate)}"></label>
  <label>السنة<input class="field mono" name="year" inputmode="numeric" maxlength="4" value="${e(x.year??'')}" placeholder="تُؤخذ من تاريخ الإصدار إن تُركت"></label>
  <label class="wide">العنوان بالإنجليزية (اختياري)<input class="field" name="title" dir="ltr" value="${e(x.titleEn)}" maxlength="500"></label>
  <label class="wide">الملخص<textarea class="field" name="summary" rows="3" required maxlength="8000">${e(x.summary)}</textarea></label>
  <label class="wide"><span>نص التشريع <small class="m">· كل مادة أو فقرة في سطر</small></span><textarea class="field lg-ta" name="content" rows="14" required>${e(x.content)}</textarea></label>
  <label class="wide">الوسوم <small class="m">· مفصولة بفاصلة</small><input class="field" name="tags" value="${e((x.tags||[]).join('، '))}"></label>
  <div class="wide toolbar"><button class="btn pri">حفظ</button><span class="m" id="lgFormMsg"></span></div>
 </form></div></div>`}
A.lgNew=()=>{if(ro()||!canM())return;LG.open=null;document.getElementById('modal').innerHTML=form(null)};
A.lgEdit=()=>{if(ro()||!canM()||!LG.cur)return;document.getElementById('modal').innerHTML=form(LG.cur)};
A.lgDel=async()=>{const x=LG.cur;if(!x||ro()||!canM())return;if(!confirm('حذف «'+x.title+'» من مكتبة التشريعات؟ لا يمكن التراجع.'))return;
 try{await api('delete',{id:x.id});A.close();toast('حُذف التشريع');LG.cur=null;load()}catch(er){toast(er.message)}};
document.addEventListener('submit',async ev=>{const f=ev.target;if(f.id!=='fLgEdit')return;ev.preventDefault();ev.stopImmediatePropagation();if(ro())return;
 const rec=Object.fromEntries(new FormData(f).entries());if(f.dataset.id){rec.id=f.dataset.id;rec._v=+f.dataset.v||undefined}
 const msg=document.getElementById('lgFormMsg'),b=f.querySelector('button.pri');b.disabled=true;msg.textContent='جارٍ الحفظ…';
 try{const j=await api('save',{rec});toast(f.dataset.id?'حُفظت التعديلات':'أُضيف التشريع');load();openD(j.rec.id)}
 catch(er){msg.textContent=er.message;b.disabled=false;if(er.status===409&&er.body&&er.body.id)msg.innerHTML=e(er.message)+` <button type="button" class="link" data-act="lgOpen" data-v="${e(er.body.id)}">فتح الموجود</button>`}},true);

/* ── الاستيراد ── */
const COLS_AR=['العنوان','العنوان الإنجليزي','رقم المرجع','النوع','المصدر','الحالة','تاريخ الإصدار','تاريخ النشر','السنة','الملخص','المحتوى','الوسوم'];
const IM={rows:null,file:'',mode:'skip',busy:false,result:null};
function importBox(){const m=M_(),r=IM.rows;
 return `<div class="modal-bg" data-act="close"><div class="modal lg-modal" role="dialog" aria-label="استيراد تشريعات">
 <div class="head"><h1 style="font-size:23px">استيراد تشريعات من ملف</h1><button class="btn sm" data-act="close">إغلاق</button></div>
 <ol class="lg-steps">
  <li><b>حمّل القالب</b> وعبّئه في Excel. الأعمدة المطلوبة: العنوان، النوع، المصدر، الملخص، المحتوى (نص التشريع). <button class="btn sm" data-act="lgTemplate">تنزيل القالب</button></li>
  <li><b>ارفع الملف</b>: Excel (xlsx) أو CSV أو JSON. تُقبل أسماء الأعمدة بالعربية أو الإنجليزية (titleAr, type, source, summary, content…).<div class="toolbar" style="margin-top:6px"><input type="file" id="lgFile" accept=".xlsx,.csv,.json,.txt"></div></li>
  <li><b>راجع ثم استورد.</b> التشريع المكرر (العنوان والرقم نفسهما) <select class="field" id="lgMode" style="display:inline-block;width:auto"><option value="skip" ${IM.mode==='skip'?'selected':''}>يُتخطى</option><option value="update" ${IM.mode==='update'?'selected':''}>يُحدَّث بالبيانات الجديدة</option></select></li>
 </ol>
 <details class="lg-allowed"><summary>القيم المسموحة للنوع والمصدر والحالة</summary><p><b>النوع:</b> ${m.types.map(e).join('، ')}</p><p><b>المصدر:</b> ${m.sources.map(e).join('، ')}</p><p><b>الحالة:</b> ${m.statuses.map(e).join('، ')} <span class="m">(إن تُركت: ساري)</span></p><p class="m">التواريخ بصيغة YYYY-MM-DD أو DD/MM/YYYY. الوسوم مفصولة بفاصلة.</p></details>
 <div id="lgImpView">${impView()}</div>
 ${canM()?`<details class="lg-danger"><summary>إدارة المكتبة</summary><div class="toolbar"><button class="btn" data-act="lgExport">تصدير كل التشريعات (JSON)</button><button class="btn danger" data-act="lgClearAll">حذف كل التشريعات…</button></div></details>`:''}
 </div></div>`}
function impView(){const r=IM.rows,res=IM.result;
 if(res)return `<div class="${res.failed?'lg-warnbox':'lg-okbox'}"><b>انتهى الاستيراد:</b> أُضيف ${res.added}${res.updated?' · حُدّث '+res.updated:''}${res.duplicates?' · مكرر تُخطي '+res.duplicates:''}${res.failed?' · رُفض '+res.failed:''} من ${res.total} صفاً.
  ${res.errors.length?`<ul class="lg-errs">${res.errors.slice(0,50).map(x=>`<li>الصف ${x.row}: ${e(x.message)}</li>`).join('')}${res.errors.length>50?`<li>و${res.errors.length-50} أخرى…</li>`:''}</ul>`:''}</div>`;
 if(!r)return '';
 const keys=[...new Set(r.slice(0,50).flatMap(o=>Object.keys(o)))].slice(0,12);
 return `<div class="lg-prev"><div class="lg-bar"><span>${e(IM.file)} · ${nLaws(r.length)} في الملف</span><button class="btn pri" data-act="lgDoImport" ${IM.busy?'disabled':''}>${IM.busy?'جارٍ الاستيراد…':'استيراد '+r.length+' صفاً'}</button></div>
  <div class="lg-scroll"><table class="lg-pt"><thead><tr><th>#</th>${keys.map(k=>`<th>${e(k)}</th>`).join('')}</tr></thead><tbody>${r.slice(0,8).map((o,i)=>`<tr><td>${i+1}</td>${keys.map(k=>`<td>${e(String(o[k]??'').slice(0,80))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
  ${r.length>8?`<p class="m">معاينة أول 8 صفوف.</p>`:''}<div id="lgProg" class="m"></div></div>`}
A.lgImport=()=>{if(ro()||!canM())return;IM.rows=null;IM.result=null;IM.busy=false;document.getElementById('modal').innerHTML=importBox()};
A.lgTemplate=()=>{/* CSV بترميز UTF-8 مع BOM يفتح بالعربية في Excel مباشرة */
 const csv='﻿'+COLS_AR.join(',')+'\r\n';dl(new Blob([csv],{type:'text/csv;charset=utf-8'}),'legislation-template.csv')};
A.lgExport=()=>{const a=document.createElement('a');a.href='/api/admin/laws/export';a.download='';document.body.appendChild(a);a.click();a.remove()};
A.lgClearAll=async()=>{if(!canM()||ro())return;const n=(LG.facets||{}).total||0;const t=prompt('سيُحذف '+nLaws(n)+' نهائياً من مكتبة المكتب. للتأكيد اكتب: حذف الكل');if(t==null)return;
 try{const j=await api('delete',{all:true,confirm:t.trim()});A.close();toast('حُذف '+nLaws(j.n));load()}catch(er){toast(er.message)}};
function dl(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
A.lgDoImport=async()=>{if(!IM.rows||IM.busy||ro())return;IM.busy=true;IM.mode=(document.getElementById('lgMode')||{}).value||IM.mode;refreshImp();
 /* دفعات صغيرة (≤ 200 صف أو ~4 ميغابايت) حتى لا يُرفض طلب كبير */
 const rows=IM.rows,tot={total:rows.length,added:0,updated:0,duplicates:0,failed:0,errors:[]};let i=0;
 try{while(i<rows.length){let j=i,size=0;while(j<rows.length&&j-i<200){const s=JSON.stringify(rows[j]).length;if(j>i&&size+s>4e6)break;size+=s;j++}
   const pr=document.getElementById('lgProg');if(pr)pr.textContent='يُستورد '+j+' من '+rows.length+'…';
   const r=await api('import',{records:rows.slice(i,j),mode:IM.mode,file:IM.file});
   ['added','updated','duplicates','failed'].forEach(k=>tot[k]+=r[k]);r.errors.forEach(x=>tot.errors.push({row:x.row+i,message:x.message}));i=j}
  IM.result=tot;toast('أُضيف '+nLaws(tot.added)+(tot.failed?' · رُفض '+tot.failed:''))}
 catch(er){IM.result={...tot,failed:tot.failed+(rows.length-i),errors:[...tot.errors,{row:i+1,message:'توقف الاستيراد: '+er.message}]}}
 finally{IM.busy=false;IM.rows=null;refreshImp();load()}};
const refreshImp=()=>{const v=document.getElementById('lgImpView');if(v)v.innerHTML=impView()};
document.addEventListener('change',async ev=>{if(ev.target.id!=='lgFile')return;const f=ev.target.files[0];if(!f)return;IM.result=null;IM.rows=null;IM.file=f.name;
 try{if(f.size>60*1024*1024)throw new Error('الملف أكبر من 60 ميغابايت.');
  const rows=await readFile(f);if(!rows.length)throw new Error('لم يُعثر على صفوف بيانات في الملف.');if(rows.length>20000)throw new Error('الملف فيه أكثر من 20000 صف؛ قسّمه إلى ملفات أصغر.');IM.rows=rows}
 catch(er){IM.result=null;toast(er.message);ev.target.value=''}
 refreshImp()});

/* قراءة الملفات في المتصفح: JSON أو CSV أو xlsx (فك ZIP بـ DecompressionStream المدمج، بلا مكتبات خارجية) */
async function readFile(f){const name=f.name.toLowerCase();
 if(name.endsWith('.json')){let j;try{j=JSON.parse(await f.text())}catch(er){throw new Error('ملف JSON غير صالح.')}const a=Array.isArray(j)?j:Array.isArray(j.records)?j.records:null;if(!a)throw new Error('ملف JSON يجب أن يكون مصفوفة سجلات أو {records:[…]}.');return a.filter(o=>o&&typeof o==='object')}
 const grid=name.endsWith('.xlsx')?await xlsxRows(await f.arrayBuffer()):csvRows(await f.text());
 const head=(grid[0]||[]).map(h=>String(h).replace(/^﻿/,'').trim());if(!head.some(Boolean))throw new Error('الصف الأول يجب أن يحوي أسماء الأعمدة.');
 return grid.slice(1).filter(r=>r.some(c=>String(c).trim())).map(r=>Object.fromEntries(head.map((h,i)=>[h,r[i]??'']).filter(([h])=>h)))}
function csvRows(t){t=t.replace(/^﻿/,'');const first=t.split(/\r?\n/,1)[0]||'';const d=[',',';','\t'].sort((a,b)=>first.split(b).length-first.split(a).length)[0];
 const rows=[];let row=[],cell='',q=false;
 for(let i=0;i<t.length;i++){const c=t[i];
  if(q){if(c==='"'){if(t[i+1]==='"'){cell+='"';i++}else q=false}else cell+=c}
  else if(c==='"')q=true;else if(c===d){row.push(cell);cell=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&t[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell=''}else cell+=c}
 if(cell!==''||row.length){row.push(cell);rows.push(row)}return rows}
async function inflate(bytes){const ds=new DecompressionStream('deflate-raw');const out=new Response(new Blob([bytes]).stream().pipeThrough(ds));return new Uint8Array(await out.arrayBuffer())}
async function xlsxRows(buf){const u8=new Uint8Array(buf),dv=new DataView(buf),td=new TextDecoder();let eocd=-1;
 for(let i=u8.length-22;i>=Math.max(0,u8.length-65557);i--)if(dv.getUint32(i,true)===0x06054b50){eocd=i;break}
 if(eocd<0)throw new Error('الملف ليس بصيغة Excel (xlsx) صالحة.');
 const n=dv.getUint16(eocd+10,true);let p=dv.getUint32(eocd+16,true);const files={};
 for(let k=0;k<n;k++){if(dv.getUint32(p,true)!==0x02014b50)throw new Error('ملف Excel تالف.');
  const method=dv.getUint16(p+10,true),cs=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),off=dv.getUint32(p+42,true);
  const nm=td.decode(u8.subarray(p+46,p+46+nl)),ln=dv.getUint16(off+26,true),lx=dv.getUint16(off+28,true),data=u8.subarray(off+30+ln+lx,off+30+ln+lx+cs);
  files[nm]=async()=>td.decode(method===0?data:method===8?await inflate(data):(()=>{throw new Error('ضغط غير مدعوم في ملف Excel')})());p+=46+nl+xl+cl}
 const get=async nm=>files[nm]?files[nm]():null;
 const ENT={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"};const dec=s=>s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,(m,k)=>k[0]==='#'?String.fromCodePoint(k[1]==='x'||k[1]==='X'?parseInt(k.slice(2),16):+k.slice(1)):(ENT[k]??m));
 const NS='(?:\\w+:)?',re=(s,f='g')=>new RegExp(s.replace(/~/g,NS),f);
 const textOf=x=>dec([...x.matchAll(re('<~t(?:\\s[^>]*)?>([\\s\\S]*?)</~t>'))].map(m=>m[1]).join(''));
 const colIdx=ref=>{let c=0;for(const ch of ref.replace(/\d+/g,''))c=c*26+(ch.charCodeAt(0)-64);return c-1};
 const shared=[];const ss=await get('xl/sharedStrings.xml');if(ss)for(const m of ss.matchAll(re('<~si>([\\s\\S]*?)</~si>')))shared.push(textOf(m[1]));
 let sheet='xl/worksheets/sheet1.xml';const wb=await get('xl/workbook.xml'),rels=await get('xl/_rels/workbook.xml.rels');
 if(wb&&rels){const rid=(wb.match(re('<~sheet\\b[^>]*r:id="([^"]+)"',''))||[])[1];const t=rid&&(rels.match(new RegExp(`<Relationship\\b[^>]*Id="${rid}"[^>]*Target="([^"]+)"`))||rels.match(new RegExp(`<Relationship\\b[^>]*Target="([^"]+)"[^>]*Id="${rid}"`))||[])[1];if(t)sheet='xl/'+t.replace(/^\/?xl\//,'').replace(/^\//,'')}
 const xml=await get(sheet);if(!xml)throw new Error('لم يُعثر على ورقة البيانات في الملف.');const rows=[];
 for(const r of xml.matchAll(re('<~row\\b[^>]*>([\\s\\S]*?)</~row>'))){const row=[];
  for(const c of r[1].matchAll(re('<~c\\b([^>]*?)(?:/>|>([\\s\\S]*?)</~c>)'))){const at=c[1],body=c[2]||'',ref=(at.match(/\br="([A-Z]+\d+)"/)||[])[1],t=(at.match(/\bt="([^"]+)"/)||[])[1];let v='';
   if(t==='inlineStr')v=textOf(body);else{const raw=(body.match(re('<~v>([\\s\\S]*?)</~v>',''))||[])[1];v=raw==null?'':t==='s'?(shared[+raw]??''):dec(raw)}
   row[ref?colIdx(ref):row.length]=String(v)}
  rows.push(Array.from(row,x=>x??''))}
 return rows}

/* ── الأحداث ── */
A.lgOpen=v=>openD(v);
A.lgPage=v=>{LG.page=+v||1;load();const el=document.getElementById('lgRes');if(el)el.scrollIntoView({block:'start',behavior:'smooth'})};
const refresh=()=>{LG.at=Date.now();render();load()};
A.lgT=v=>{LG.type=LG.type===v?'':v;LG.page=1;refresh()};
A.lgS=v=>{LG.status=LG.status===v?'':v;LG.page=1;refresh()};
A.lgAll=()=>{LG.type='';LG.status='';LG.page=1;refresh()};
A.lgClear=()=>{Object.assign(LG,{q:'',type:'',source:'',status:'',y1:'',y2:'',sort:'relevance',sortSet:false,page:1});refresh()};
A.lgReload=()=>{LG.err='';LG.meta=null;load()};
const bind0=window.bindLocal;window.bindLocal=function(){bind0();if(S.view!=='laws')return;
 const q=document.getElementById('lgq');if(q){let t;q.oninput=()=>{clearTimeout(t);t=setTimeout(()=>{LG.q=q.value.trim();LG.page=1;if(LG.q&&LG.sort!=='relevance'&&!LG.sortSet)LG.sort='relevance';load()},250)}}
 [['lgType','type'],['lgSource','source'],['lgStatus','status'],['lgSort','sort']].forEach(([id,k])=>{const el=document.getElementById(id);if(el)el.onchange=()=>{LG[k]=el.value;if(k==='sort')LG.sortSet=true;LG.page=1;if(k==='type'||k==='status')refresh();else load()}});
 [['lgY1','y1'],['lgY2','y2']].forEach(([id,k])=>{const el=document.getElementById(id);if(el)el.onchange=()=>{const v=el.value.replace(/[^\d]/g,'');LG[k]=/^\d{4}$/.test(v)?v:'';el.value=LG[k];LG.page=1;load()}});
 const lst=document.querySelector('.lg-list');if(lst)lst.onkeydown=ev=>{const c=ev.target.closest('.lg-card');if(c&&(ev.key==='Enter'||ev.key===' ')){ev.preventDefault();openD(c.dataset.v)}}};

const css=document.createElement('style');css.textContent=`
.lg-note{border:1px solid var(--line);background:var(--sunk);border-radius:10px;padding:9px 14px;font-size:13px;color:var(--muted);margin:0 0 12px;line-height:1.8}
.lg-stats{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px}
.lg-st{all:unset;cursor:pointer;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:8px 14px;display:flex;align-items:baseline;gap:8px}
.lg-st b{font-size:20px;font-weight:800;color:var(--ink);font-family:var(--f-mono,inherit)}.lg-st span{font-size:13px;color:var(--muted)}
.lg-st.on,.lg-st:hover{border-color:var(--brass);background:var(--brass-soft,var(--sunk))}
.lg-st:focus-visible,.lg-card:focus-visible{outline:2px solid var(--brass);outline-offset:2px}
.lg-filters{display:grid;grid-template-columns:minmax(0,1.5fr) repeat(3,minmax(0,1fr)) minmax(0,1.3fr) minmax(0,.9fr);gap:10px}
.lg-years{display:flex;align-items:center;gap:6px}.lg-years .field{min-width:0;text-align:center}
.lg-filters>*{min-width:0}.lg-filters .field{width:100%;box-sizing:border-box}
@media(max-width:1100px){.lg-filters{grid-template-columns:repeat(3,minmax(0,1fr))}.lg-filters #lgq{grid-column:1/-1}}
@media(max-width:640px){.lg-filters{grid-template-columns:repeat(2,minmax(0,1fr))}.lg-filters #lgSource,.lg-filters .lg-years{grid-column:1/-1}.lg-src{margin-inline-start:0;width:100%}}
.lg-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:14px 2px 8px;font-size:14px;color:var(--muted);flex-wrap:wrap}
.lg-list{display:flex;flex-direction:column;gap:10px}
.lg-card{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 16px;cursor:pointer;transition:border-color .15s}
.lg-card:hover{border-color:var(--brass)}
.lg-card h3{margin:6px 0 4px;font-size:16.5px;line-height:1.6;color:var(--ink)}
.lg-top{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:12.5px}.lg-ref{font-size:12.5px;color:var(--ink)}.lg-src{margin-inline-start:auto}
.lg-sum{margin:0;color:var(--muted);font-size:14px;line-height:1.8;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.lg-hit{margin:6px 0 0;font-size:13.5px;line-height:1.8;border-inline-start:3px solid var(--brass);padding-inline-start:10px;color:var(--ink)}
.lg-card mark,.lg-modal mark{background:#FDE68A;color:inherit;border-radius:3px;padding:0 1px}
.lg-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.lg-tags span{font-size:12px;background:var(--sunk);border:1px solid var(--line);border-radius:99px;padding:1px 10px;color:var(--muted)}
.lg-pager{display:flex;gap:6px;justify-content:center;align-items:center;margin:14px 0;flex-wrap:wrap}
.lg-empty{text-align:center;padding:30px 16px;color:var(--muted);line-height:1.9}.lg-empty h2{color:var(--ink);font-size:19px;margin:0 0 6px}
.lg-modal{max-width:940px}
.lg-kv{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 12px}
@media(max-width:760px){.lg-kv{grid-template-columns:repeat(2,minmax(0,1fr))}}
.lg-kv div{border:1px solid var(--line);border-radius:8px;padding:6px 10px}.lg-kv dt{font-size:12px;color:var(--muted)}.lg-kv dd{margin:2px 0 0;font-weight:600;font-size:14px}
.lg-sumbox{background:var(--sunk);border:1px solid var(--line);border-radius:10px;padding:10px 14px;line-height:1.9}.lg-sumbox p{margin:4px 0 0}
.lg-h{font-size:17px;margin:16px 0 6px}
.lg-text{font-family:var(--f-doc,inherit);font-size:16px;line-height:2;max-height:56vh;overflow:auto;border:1px solid var(--line);border-radius:10px;padding:10px 16px;background:var(--surface)}
.lg-text p{margin:0 0 10px}
.lg-ta{font-family:var(--f-doc,inherit);font-size:15px;line-height:1.9}
.lg-steps{margin:0 0 10px;padding-inline-start:22px;line-height:2}.lg-steps li{margin-bottom:6px}
.lg-allowed,.lg-danger{margin:8px 0;font-size:13.5px;line-height:1.9}.lg-allowed summary,.lg-danger summary{cursor:pointer;color:var(--muted)}.lg-allowed p{margin:4px 0}
.lg-danger .toolbar{margin-top:8px}
.lg-prev{border:1px dashed var(--brass);border-radius:10px;padding:8px 12px;margin-top:10px}
.lg-scroll{overflow:auto;max-height:280px}.lg-pt{border-collapse:collapse;font-size:12.5px;width:max-content;min-width:100%}.lg-pt th,.lg-pt td{border:1px solid var(--line);padding:4px 8px;text-align:right;max-width:260px;vertical-align:top}.lg-pt th{background:var(--sunk)}
.lg-okbox{border:1px solid #22C55E;background:#F0FDF4;color:#14532D;border-radius:10px;padding:10px 14px;margin-top:10px;line-height:1.9}
.lg-warnbox{border:1px solid #F59E0B;background:#FFFBEB;color:#78350F;border-radius:10px;padding:10px 14px;margin-top:10px;line-height:1.9}
.lg-errs{margin:6px 0 0;padding-inline-start:20px;max-height:200px;overflow:auto;font-size:13px}
.lg-tabs{display:flex;gap:6px;margin:0 0 12px;border-bottom:1px solid var(--line)}.lg-tabs button{all:unset;cursor:pointer;padding:9px 16px;font-weight:700;color:var(--muted);border-bottom:3px solid transparent;margin-bottom:-1px}
.lg-tabs button.on{color:var(--ink);border-bottom-color:var(--brass)}.lg-tabs small{background:var(--sunk);border-radius:99px;padding:0 8px;font-weight:600}.lg-tabs button:focus-visible{outline:2px solid var(--brass)}
.lg-wform{display:flex;gap:10px}.lg-wform .field{flex:1}
.lg-ph{font-size:15px;text-align:center;color:var(--brass,#8B6F47);margin:16px 0 8px}.lg-art{color:var(--ink);white-space:nowrap}
.btn.danger{color:#B91C1C;border-color:#FCA5A5}.btn.danger:hover{background:#FEF2F2}
.lg-ck{all:unset;cursor:pointer;width:20px;height:20px;border:1.5px solid var(--line);border-radius:6px;background:var(--surface);display:inline-flex;align-items:center;justify-content:center;flex:none;box-sizing:border-box}
.lg-ck.on{background:var(--brass,#B8863D);border-color:var(--brass,#B8863D)}.lg-ck.on::after{content:'';width:5px;height:10px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg) translate(-1px,-1px)}
.lg-ck:focus-visible{outline:2px solid var(--brass);outline-offset:2px}.lg-card.sel{border-color:var(--brass);box-shadow:inset 3px 0 0 var(--brass)}
.lg-viewer{position:fixed;inset:0;z-index:300;background:rgba(11,24,43,.6);display:flex;flex-direction:column}
.lg-vbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;background:var(--surface);border-bottom:1px solid var(--line);padding:10px 16px}
.lg-vbar label{display:flex;gap:6px;align-items:center;font-size:13.5px}.lg-vbar select.field{width:auto}.lg-vbar #exNote{max-width:300px}
.lg-vck input{accent-color:var(--brass,#B8863D)}
#lgFrame{flex:1;border:0;background:#fff;width:100%}
@media(max-width:700px){.lg-vbar #exNote{max-width:none;flex:1 1 100%}}`;
document.head.appendChild(css);
})();
