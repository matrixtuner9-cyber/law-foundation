/* ── البحث في الأحكام ──
   شاشة تبحث مباشرة في صفحات الأحكام العامة للموسوعة القانونية (جامعة النجاح) عبر خادم المكتب، بالسكريبت المرفق (lib/maqam-integration.mjs).
   يبحث المحامي بنفسه (طلب لكل ضغطة بحث) بالنص والمحكمة والتصنيف والسنة ورقم القضية، ويقرأ النص الكامل لحكم يختاره،
   وينزّل النتائج (HTML/CSV/JSON)، ويستورد أي حكم لمكتبة الاجتهادات مع رابط مصدره. لا جلب آلي ولا تخزين للنتائج. */
(function(){
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const can2=w=>!!(window.MQ&&MQ.user&&({admin:{write:1,manage:1},lawyer:{write:1}}[MQ.user.role]||{})[w]);
const FACETS=[['court','المحكمة'],['litigation_type','نوع التقاضي'],['section','القسم'],['subject','الموضوع'],['branch','الفرع']];
const CAMEL={court:['court','courtId'],litigation_type:['litigationType','litigationTypeId'],section:['section','sectionId'],subject:['subject','subjectId'],branch:['branch','branchId']};
const MS={q:'',year:'',number:'',order:'relevance',facets:{},page:1,data:null,busy:false,err:'',open:null,detail:{},dl:{format:'html',pages:1,full:false},dlBusy:false};

const NAV_I=NAV.findIndex(n=>n[0]==='rulings');NAV.splice(NAV_I+1,0,['maqamsearch','البحث في الأحكام']);
if(window.NAV_ICON)NAV_ICON.maqamsearch='<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/><path d="M8.2 10.5h4.6M10.5 8.2v4.6"/></svg>';

function params(page){
 const p=new URLSearchParams();
 if(MS.q.trim())p.set('q',MS.q.trim());
 if(/^\d{4}$/.test(MS.year.trim()))p.set('year',MS.year.trim());
 if(/^\d{1,12}$/.test(MS.number.trim()))p.set('number',MS.number.trim());
 if(MS.order==='date')p.set('order_by','date');
 for(const [k] of FACETS)if(MS.facets[k])p.set(k,MS.facets[k].id);
 if(page>1)p.set('page',page);
 return p;
}
async function call(path,p){
 const r=await fetch('/api/admin/maqam/'+path+'?'+p.toString(),{credentials:'same-origin'});
 if(r.status===401){location.replace('/login.html');throw new Error('انتهت الجلسة')}
 return r;
}
async function jsonCall(path,p){
 const r=await call(path,p),j=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(j.error||'تعذّر الاتصال بالموقع المصدر');return j;
}
const hasFilter=()=>MS.q.trim()||MS.year.trim()||MS.number.trim()||Object.keys(MS.facets).length;

async function run(page){
 if(!hasFilter()){toast('اكتب عبارة البحث أو اختر سنة أو رقم قضية');return}
 if(MS.busy)return;
 MS.busy=true;MS.err='';MS.page=page;MS.open=null;paint();
 try{MS.data=await jsonCall('search',params(page))}
 catch(x){MS.err=x.message;MS.data=null}
 MS.busy=false;paint();
 const r=document.getElementById('msRes');if(r&&MS.data)r.scrollIntoView({block:'start',behavior:'smooth'});
}

function inLib(r){const u='https://maqam.najah.edu/judgments/'+r.maqamId+'/';return (typeof rulings!=='undefined'?rulings:[]).find(x=>x.srcUrl&&x.srcUrl.replace(/\/?$/,'/')===u)}

function badges(r){
 return FACETS.map(([k])=>{const [nm,id]=CAMEL[k];return r[nm]&&r[id]?`<button class="chip ms-b ${MS.facets[k]&&MS.facets[k].id===r[id]?'on':''}" data-act="msFacet" data-v="${k}|${r[id]}|${e(r[nm])}" title="حصر البحث في هذا التصنيف">${e(r[nm])}</button>`:r[nm]?`<span class="chip ms-b">${e(r[nm])}</span>`:''}).join('')
}
function hl(t,q){t=e(t);const ws=(window.MQ_rnorm?MQ_rnorm(q):q||'').split(' ').filter(w=>w.length>1);if(!ws.length)return t;
 try{const re=new RegExp('('+ws.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/ا/g,'[اأإآ]').replace(/ي/g,'[يى]').replace(/ه/g,'[هة]')).join('|')+')','giu');return t.replace(re,'<mark>$1</mark>')}catch(x){return t}}

function card(r){
 const d=MS.detail[r.maqamId],open=MS.open===r.maqamId,lib=inLib(r),src='https://maqam.najah.edu/judgments/'+r.maqamId+'/';
 return `<section class="panel rl-card ms-card" id="ms_${r.maqamId}"><header><div class="rl-h">${r.court?`<span class="pill mz">${e(r.court)}</span>`:''}<span class="mono">${r.number?e(r.number)+'/'+e(r.year||''):''}</span><span class="m">${r.decisionDate?(typeof dmy==='function'?dmy(r.decisionDate):e(r.decisionDate)):''}</span></div>
  <div class="toolbar"><button class="btn sm" data-act="msOpen" data-v="${r.maqamId}">${open?'إخفاء النص':'عرض النص الكامل'}</button>${can2('write')?(lib?`<button class="btn sm" data-act="rOpen" data-v="${e(lib.id)}">في المكتبة ✓</button>`:`<button class="btn sm pri" data-act="rImportUrl" data-v="${src}">استيراد للمكتبة</button>`):''}<a class="btn sm" href="${src}" target="_blank" rel="noopener noreferrer">المصدر ↗</a></div></header>
  <div class="bd"><div class="rl-p">${hl(r.title,MS.q)}</div><div class="chips ms-bs">${badges(r)}</div>
  ${r.snippet?`<div class="ms-sn">${hl(r.snippet,MS.q)}</div>`:''}
  ${open?(d==='loading'?'<div class="ms-load">جارٍ جلب النص الكامل من الموقع المصدر…</div>':d&&d.error?`<div class="note" style="color:var(--danger)">${e(d.error)}</div>`:d?`<div class="ms-meta m">${[d.court,d.litigationType,d.section,d.subject,d.branch].filter(Boolean).map(e).join(' · ')}</div><div class="ms-t">${String(d.bodyText||'').split(/\n{2,}/).map(x=>x.trim()).filter(Boolean).map(x=>`<p>${hl(x,MS.q)}</p>`).join('')}</div>`:''):''}
  </div></section>`;
}

function pager(){
 const d=MS.data;if(!d||d.totalPages<=1)return '';
 return `<div class="ms-pg"><button class="btn sm" data-act="msPage" data-v="${d.page-1}" ${d.page<=1||MS.busy?'disabled':''}>→ السابقة</button><span class="m">صفحة ${d.page} من ${d.totalPages}</span><button class="btn sm" data-act="msPage" data-v="${d.page+1}" ${d.page>=d.totalPages||MS.busy?'disabled':''}>التالية ←</button></div>`;
}
function results(){
 if(MS.busy)return '<section class="panel"><div class="empty ms-load">جارٍ البحث في الأحكام…</div></section>';
 if(MS.err)return `<section class="panel"><div class="bd"><div class="note" style="color:var(--danger)">${e(MS.err)}</div><p class="m">قد يكون الموقع المصدر متوقفاً مؤقتاً أو بطيئاً. يمكنك المحاولة بعد قليل أو فتح الموقع مباشرة.</p></div></section>`;
 const d=MS.data;
 if(!d)return `<section class="panel rl-empty"><div class="bd"><b>ابحث في الأحكام القضائية المنشورة في الموسوعة القانونية.</b><p>اكتب موضوع المسألة أو المبدأ (مثل: «مطالبة مالية»، «بطلان التبليغ»، «إخلاء المأجور»)، أو حدّد السنة ورقم القضية. بعد ظهور النتائج اضغط على اسم المحكمة أو التصنيف في أي حكم لحصر البحث فيه.</p><p class="m">تُجلب النتائج من الصفحات العامة للموقع المصدر عند ضغطك «بحث» فقط. راجع النص الأصلي قبل الاستشهاد، والتزم بشروط استخدام الموقع.</p></div></section>`;
 if(!d.results.length)return '<section class="panel"><div class="empty">لا نتائج مطابقة في المصدر. جرّب كلمات أقل أو أزل بعض التصنيفات.</div></section>';
 return `<div class="ms-top"><div class="m">${d.results.length} حكماً في هذه الصفحة${d.totalPages>1?` · ${d.totalPages} صفحات`:''} · <a href="${e(d.sourceUrl)}" target="_blank" rel="noopener noreferrer">فتح البحث في الموقع المصدر ↗</a></div>${download()}</div>
 <div class="stack">${d.results.map(card).join('')}</div>${pager()}`;
}
function download(){
 const o=MS.dl;
 return `<div class="ms-dl"><select class="field" id="msFmt" aria-label="صيغة التنزيل"><option value="html" ${o.format==='html'?'selected':''}>ملف HTML للطباعة</option><option value="csv" ${o.format==='csv'?'selected':''}>جدول CSV (Excel)</option><option value="json" ${o.format==='json'?'selected':''}>JSON</option></select>
 <select class="field" id="msPages" aria-label="عدد الصفحات">${[1,2,3,4,5].map(n=>`<option value="${n}" ${o.pages===n?'selected':''}>${n} ${n===1?'صفحة':n===2?'صفحتان':'صفحات'}</option>`).join('')}</select>
 <label class="ms-ck"><input type="checkbox" id="msFull" ${o.full?'checked':''}> مع النص الكامل <small class="m">(حتى صفحتين)</small></label>
 <button class="btn" data-act="msDl" ${MS.dlBusy?'disabled':''}>${MS.dlBusy?'جارٍ التجهيز…':'تنزيل النتائج'}</button></div>`;
}
function chips(){
 const f=Object.entries(MS.facets);if(!f.length)return '';
 return `<div class="ms-fc"><span class="m">تصنيفات مفعّلة:</span>${f.map(([k,v])=>`<button class="chip ms-b on" data-act="msUnfacet" data-v="${k}" title="إزالة">${e((FACETS.find(x=>x[0]===k)||[,k])[1])}: ${e(v.name)} ✕</button>`).join('')}</div>`;
}

V.maqamsearch=()=>`<div class="head"><div><h1>البحث في الأحكام</h1><p class="sub">بحث مباشر في الأحكام القضائية المنشورة على الموسوعة القانونية – جامعة النجاح، بنتائج حيّة وروابط مصادرها</p></div>
 <div class="toolbar"><a class="btn" href="https://maqam.najah.edu/judgments/" target="_blank" rel="noopener noreferrer">فتح الموقع المصدر ↗</a><button class="btn" data-act="nav" data-v="rulings">مكتبة الاجتهادات</button></div></div>
 <section class="panel"><form class="bd ms-form" id="msForm" autocomplete="off">
  <input class="field" id="msQ" value="${e(MS.q)}" placeholder="مثال: مطالبة مالية، بطلان التبليغ، إخلاء المأجور…" maxlength="200" aria-label="عبارة البحث">
  <input class="field mono" id="msYear" value="${e(MS.year)}" inputmode="numeric" maxlength="4" placeholder="سنة القضية" aria-label="سنة القضية">
  <input class="field mono" id="msNum" value="${e(MS.number)}" inputmode="numeric" maxlength="12" placeholder="رقم القضية" aria-label="رقم القضية">
  <select class="field" id="msOrder" aria-label="الترتيب"><option value="relevance" ${MS.order==='relevance'?'selected':''}>الأقرب للبحث</option><option value="date" ${MS.order==='date'?'selected':''}>الأحدث</option></select>
  <button class="btn pri" id="msGo" ${MS.busy?'disabled':''}>بحث</button>
  <button type="button" class="btn" data-act="msClear">مسح</button>
 </form>${chips()}</section>
 <div id="msRes">${results()}</div>`;

function paint(){const el=document.getElementById('msRes');if(el&&S.view==='maqamsearch'){el.innerHTML=results();const fc=document.querySelector('.ms-fc'),form=document.getElementById('msForm');
  if(form){const host=form.parentNode;const old=host.querySelector('.ms-fc');if(old)old.remove();host.insertAdjacentHTML('beforeend',chips())}
  const go=document.getElementById('msGo');if(go)go.disabled=MS.busy}}

function readForm(){const g=id=>document.getElementById(id);if(!g('msQ'))return;MS.q=g('msQ').value;MS.year=g('msYear').value;MS.number=g('msNum').value;MS.order=g('msOrder').value}

/* ── الأفعال ── */
A.msFacet=v=>{const [k,id,name]=String(v).split('|');if(!k||!id)return;readForm();
 if(MS.facets[k]&&String(MS.facets[k].id)===id)delete MS.facets[k];else MS.facets[k]={id:Number(id),name};
 run(1)};
A.msUnfacet=k=>{readForm();delete MS.facets[k];if(hasFilter())run(1);else{MS.data=null;paint()}};
A.msPage=v=>{const n=Number(v);if(n>=1)run(n)};
A.msClear=()=>{MS.q=MS.year=MS.number='';MS.facets={};MS.data=null;MS.err='';MS.order='relevance';render()};
A.msOpen=async v=>{
 const id=Number(v);if(MS.open===id){MS.open=null;paint();return}
 MS.open=id;
 if(MS.detail[id]&&!MS.detail[id].error){paint();return}
 MS.detail[id]='loading';paint();
 try{const j=await jsonCall('judgment',new URLSearchParams({id}));MS.detail[id]=j.judgment}
 catch(x){MS.detail[id]={error:x.message}}
 paint();const el=document.getElementById('ms_'+id);if(el)el.scrollIntoView({block:'nearest'});
};
A.msDl=async()=>{
 if(MS.dlBusy)return;readForm();
 MS.dl={format:document.getElementById('msFmt').value,pages:Number(document.getElementById('msPages').value)||1,full:document.getElementById('msFull').checked};
 const p=params(MS.data?MS.data.page:1);p.set('format',MS.dl.format);p.set('pages',MS.dl.pages);if(MS.dl.full)p.set('full','1');
 MS.dlBusy=true;paint();toast(MS.dl.full?'جارٍ جلب النصوص الكاملة، قد يستغرق دقيقة…':'جارٍ تجهيز الملف…');
 try{
  const r=await call('download',p);
  if(!r.ok){const j=await r.json().catch(()=>({}));throw new Error(j.error||'تعذّر تجهيز الملف')}
  const name=((r.headers.get('content-disposition')||'').match(/filename="([^"]+)"/)||[])[1]||('maqam-results.'+MS.dl.format);
  const b=await r.blob(),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);
  toast('تم تنزيل الملف');
 }catch(x){toast(x.message)}
 MS.dlBusy=false;paint();
};

document.addEventListener('submit',ev=>{if(ev.target.id!=='msForm')return;ev.preventDefault();readForm();run(1)});
document.addEventListener('change',ev=>{const t=ev.target;if(t.id==='msFmt')MS.dl.format=t.value;else if(t.id==='msPages')MS.dl.pages=Number(t.value)||1;else if(t.id==='msFull'){MS.dl.full=t.checked;if(t.checked&&MS.dl.pages>2){MS.dl.pages=2;const p=document.getElementById('msPages');if(p)p.value='2'}}});

const css=document.createElement('style');css.textContent=`
.ms-form{display:grid;grid-template-columns:minmax(0,1fr) 120px 130px 140px auto auto;gap:10px;align-items:center}
@media(max-width:900px){.ms-form{grid-template-columns:1fr 1fr}.ms-form #msQ{grid-column:1/-1}}
.ms-fc{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:0 18px 14px}
.ms-b{cursor:pointer}.ms-b.on{background:var(--accent-soft);border-color:var(--accent);color:var(--ink)}
.ms-bs{margin-top:8px}
.ms-sn{margin-top:10px;padding:8px 12px;border-right:3px solid var(--brass);background:var(--sunk);border-radius:6px;line-height:1.85}
.ms-card mark{background:var(--warn-soft);color:inherit;padding:0 2px;border-radius:3px}
.ms-t{margin-top:10px;padding:14px 18px;background:var(--sunk);border-radius:8px;max-height:560px;overflow:auto;font-size:15.5px;line-height:1.95;color:var(--ink)}.ms-t p{margin:0 0 8px;white-space:pre-wrap}.ms-meta{margin-top:10px}
.ms-load{color:var(--muted);text-align:center;padding:18px}
.ms-top a{color:var(--accent);font-weight:600}.ms-top{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;margin:2px 4px 10px}
.ms-dl{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.ms-dl .field{width:auto;min-width:130px}
.ms-ck{display:flex;gap:6px;align-items:center;font-size:13.5px;cursor:pointer}
.ms-pg{display:flex;gap:14px;justify-content:center;align-items:center;margin:16px 0}
`;document.head.appendChild(css);
})();
