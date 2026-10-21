/* ── مكتبتي القانونية ──
   شاشة واحدة تجمع مراجع المكتب: الأحكام المحفوظة، والتشريعات، والنماذج، والمواد والمبادئ المحفوظة منفردة (legalRefs).
   كل نوع يبقى في سجله الأصلي؛ هذه الشاشة تعرض وتبحث وتفتح فقط، والمواد المحفوظة منفردة تُضاف وتُعدّل من هنا. */
(function(){
'use strict';
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nrm=s=>String(s||'').toLowerCase().replace(/[ً-ْـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه');
const TABS=['الكل','التشريعات','المواد القانونية','الاجتهادات القضائية','النقض','الاستئناف','المبادئ القانونية','النماذج'];
const TYPES=[['legislation','تشريع'],['article','مادة قانونية'],['ruling','حكم قضائي'],['principle','مبدأ قانوني'],['template','نموذج'],['decision','قرار']];
const AUTH=['قانون','قرار بقانون','نظام','لائحة','تعليمات','مرسوم','قرار','تعميم','محكمة النقض','محكمة الاستئناف','المحكمة العليا','المحكمة الدستورية العليا','محكمة البداية','محكمة الصلح','المحكمة الإدارية','المحكمة الشرعية العليا','أخرى'];
const PER=18;
const canWrite=()=>!!(window.MQ&&MQ.user&&['admin','lawyer'].includes(MQ.user.role)&&!MQ.readOnly);
const validUrl=s=>{try{const u=new URL(s);return /^https?:$/.test(u.protocol)?u.href:''}catch(x){return ''}};
/* روابط تحتاج تسجيل دخول (المقتفي) لا تُعرض، كما في بقية الشاشات */
const shownUrl=s=>{const u=validUrl(s);return u&&!/muqtafi\.birzeit\.edu/i.test(u)?u:''};
const P={tab:'الكل',q:'',authority:'',nature:'',page:1,laws:[],totalLaws:0,partial:false,busy:false,error:'',loadedQ:null,seq:0,t:0};

{const i=NAV.findIndex(n=>n[0]==='laws');NAV.splice(i<0?NAV.length:i+1,0,['legalShelf','مكتبتي القانونية'])}
if(window.NAV_ICON)NAV_ICON.legalShelf='<svg viewBox="0 0 24 24"><path d="M5 4h4v16H5zM10 4h4v16h-4z"/><path d="M15.5 5.2l3.8-1 3.2 15.5-3.8 1z"/></svg>';
const count0=window.navCount;
window.navCount=v=>v==='legalShelf'?(legalRefs.length+rulings.length||''):count0(v);

const level=s=>/نقض/.test(s)?'cassation':/استئناف/.test(s)?'appeal':'';
const mk=(id,source,title,kind,authority,nature,details,raw)=>({id,source,title:String(title||''),kind,authority:String(authority||''),nature:String(nature||''),details:String(details||''),raw});
function records(){
 const a=[];
 for(const r of legalRefs)a.push(mk(r.id,'saved',r.title,r.referenceType,r.courtName||r.authorityType,r.natureType,[r.lawName,r.lawNumber,r.lawYear,r.articleNumber,r.judgmentNumber,r.judgmentYear,r.source,r.text,r.notes].join(' '),r));
 for(const r of rulings)a.push(mk(r.id,'ruling',r.title||r.principle||'حكم '+(r.no||''),'ruling',r.court,r.field,[r.no,r.date,r.principle,r.summary,r.text,(r.keywords||[]).join(' ')].join(' '),r));
 for(const r of P.laws)a.push(mk(r.id,'law',r.title,'legislation',r.type,r.type,[r.ref,r.year,r.summary,r.source,(r.tags||[]).join(' ')].join(' '),r));
 for(const r of lawforms)a.push(mk(r.id,'template',r.title||r.id,'template',r.cat,r.status,r.body||'',r));
 const have=new Set(lawforms.map(r=>String(r.id)));
 for(const r of (window.MQ_LAWLIB&&MQ_LAWLIB.items||[]))if(!have.has(String(r.id)))a.push(mk(r.id,'templateBase',r.title||r.id,'template',r.cat,r.kind==='A'?'مرجع يحتاج التحقق':'مسودة غير معتمدة',r.body||'',r));
 return a;
}
function inTab(x,t){
 if(t==='الكل')return true;
 if(t==='التشريعات')return x.kind==='legislation';
 if(t==='المواد القانونية')return x.kind==='article';
 if(t==='الاجتهادات القضائية')return x.kind==='ruling'||x.kind==='decision';
 if(t==='النقض')return (x.kind==='ruling'||x.kind==='decision')&&level(x.authority)==='cassation';
 if(t==='الاستئناف')return (x.kind==='ruling'||x.kind==='decision')&&level(x.authority)==='appeal';
 if(t==='المبادئ القانونية')return x.kind==='principle'||(x.kind==='ruling'&&!!x.raw.principle);
 return x.kind==='template';
}
function filtered(items){const q=nrm(P.q),a=nrm(P.authority),b=nrm(P.nature);
 return items.filter(x=>inTab(x,P.tab)&&(!q||nrm([x.title,x.authority,x.nature,x.details].join(' ')).includes(q))&&(!a||nrm(x.authority).includes(a))&&(!b||nrm(x.nature).includes(b)));
}
const opts=(xs,val)=>xs.map(s=>`<option value="${e(s)}" ${val===s?'selected':''}>${e(s)}</option>`).join('');
const typeName=t=>(TYPES.find(x=>x[0]===t)||[0,t])[1];
function card(x){const r=x.raw,url=shownUrl(r.srcUrl||r.sourceUrl||r.url||''),ex=String(r.principle||r.summary||r.text||r.content||r.body||'').replace(/\s+/g,' '),cut=ex.slice(0,210),ref=[r.articleNumber?'المادة '+r.articleNumber:'',r.no,r.ref,r.year].filter(Boolean).join(' · ');
 return `<article class="kl-card"><div class="kl-meta"><span class="pill mz">${e(x.source==='ruling'?'حكم قضائي':x.source==='law'?'تشريع':typeName(x.kind))}</span>${x.authority?`<span class="pill">${e(x.authority)}</span>`:''}${x.nature?`<span class="pill">${e(x.nature)}</span>`:''}<small>${e(ref)}</small></div><h3>${e(x.title)}</h3>${cut?`<p>${e(cut)}${ex.length>210?'…':''}</p>`:''}<div class="kl-foot"><small>${e(r.source||r.src||'')}</small><div class="toolbar">${url?`<a class="btn sm" href="${e(url)}" target="_blank" rel="noopener noreferrer">المصدر ↗</a>`:''}<button class="btn sm pri" data-act="klOpen" data-v="${e(x.source+'|'+x.id)}">عرض المرجع</button></div></div></article>`;
}
function view(){const all=records(),sel=filtered(all),pages=Math.max(1,Math.ceil(sel.length/PER));P.page=Math.min(P.page,pages);
 const inT=all.filter(x=>inTab(x,P.tab)),auths=[...new Set(inT.map(x=>x.authority).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ar')),nats=[...new Set(inT.map(x=>x.nature).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ar'));
 const page=sel.slice((P.page-1)*PER,P.page*PER);
 return `<div class="head"><div><h1>مكتبتي القانونية</h1><p class="sub">مراجع المكتب المحفوظة بحسب المحكمة والتشريع والطبيعة القانونية</p></div><div class="toolbar">${canWrite()?'<button class="btn pri" data-act="klNew">إضافة مرجع أو مادة</button>':''}<button class="btn" data-act="nav" data-v="sources">مصادر الأحكام</button><button class="btn" data-act="nav" data-v="laws">التشريعات</button></div></div>
 <div class="kl-stats"><span><b>${all.length}</b> عنصر</span><span><b>${rulings.length}</b> حكم</span><span><b>${P.totalLaws}</b> تشريع</span><span><b>${legalRefs.filter(r=>r.referenceType==='article').length}</b> مادة</span></div>
 <div class="kl-tabs" role="tablist">${TABS.map(t=>`<button role="tab" aria-selected="${P.tab===t}" class="${P.tab===t?'on':''}" data-act="klTab" data-v="${e(t)}">${t} <small>${all.filter(x=>inTab(x,t)).length}</small></button>`).join('')}</div>
 <section class="panel"><div class="bd kl-search"><input class="field" id="klQuery" type="search" placeholder="عنوان القانون أو الحكم أو رقم المادة…" value="${e(P.q)}" autocomplete="off"><select class="field" id="klAuthority"><option value="">كل المرجعيات</option>${opts(auths,P.authority)}</select><select class="field" id="klNature"><option value="">كل الطبائع</option>${opts(nats,P.nature)}</select><button class="btn" data-act="klClear">مسح</button></div></section>
 ${P.busy?'<p class="m">جارٍ قراءة تشريعات المكتب…</p>':''}${P.error?`<p class="note">تعذّر تحميل التشريعات (${e(P.error)}). تظهر بقية المراجع.</p>`:''}${P.partial?'<p class="note">يُعرض أول 1,000 تشريع. ابحث في بقية القوانين من شاشة التشريعات.</p>':''}
 <div class="kl-results"><span class="m">${sel.length} نتيجة</span>${page.length?`<div class="kl-grid">${page.map(card).join('')}</div>`:'<section class="panel"><div class="empty">لا عناصر مطابقة في هذا التصنيف.</div></section>'}${pages>1?`<div class="kl-pager"><button class="btn sm" data-act="klPage" data-v="${P.page-1}" ${P.page===1?'disabled':''}>السابق</button><span>${P.page} / ${pages}</span><button class="btn sm" data-act="klPage" data-v="${P.page+1}" ${P.page===pages?'disabled':''}>التالي</button></div>`:''}</div>`;
}
V.legalShelf=()=>{if(P.loadedQ!==P.q&&!P.busy)setTimeout(loadLaws,0);return view()};
const refresh=()=>{if(S.view==='legalShelf')render()};
/* التشريعات من خادم المكتب (حتى 10 صفحات × 100) */
async function loadLaws(){if(!window.MQ||!MQ.online)return;const seq=++P.seq,q=P.q;P.loadedQ=q;P.busy=true;P.error='';
 try{const rows=[];let pages=1,total=0;
  for(let page=1;page<=pages&&page<=10;page++){
   const p=new URLSearchParams({page:String(page),pageSize:'100',...(q?{q}:{})});
   const r=await fetch('/api/admin/laws/search?'+p,{credentials:'same-origin'});
   if(r.status===401){location.replace('/login.html');return}if(!r.ok)throw new Error('HTTP '+r.status);
   const d=await r.json();if(seq!==P.seq)return;rows.push(...(d.items||[]));pages=d.pages||1;total=d.total||0;
  }
  if(seq===P.seq){P.laws=rows;P.totalLaws=total;P.partial=total>rows.length}
 }catch(er){if(seq===P.seq)P.error=er.message}finally{if(seq===P.seq){P.busy=false;refresh()}}
}
A.klTab=t=>{if(TABS.includes(t)){P.tab=t;P.page=1;P.authority='';P.nature='';refresh()}};
A.klClear=()=>{Object.assign(P,{q:'',authority:'',nature:'',page:1,loadedQ:null});refresh()};
A.klPage=n=>{P.page=Math.max(1,Number(n)||1);refresh();window.scrollTo(0,0)};
document.addEventListener('input',ev=>{if(ev.target.id!=='klQuery')return;P.q=ev.target.value;P.page=1;clearTimeout(P.t);P.t=setTimeout(()=>{P.loadedQ=null;refresh()},360)});
document.addEventListener('change',ev=>{if(ev.target.id==='klAuthority'){P.authority=ev.target.value;P.page=1;refresh()}else if(ev.target.id==='klNature'){P.nature=ev.target.value;P.page=1;refresh()}else if(ev.target.id==='klType')showFields()});
A.klOpen=v=>{const [s,...rest]=String(v||'').split('|'),id=rest.join('|');
 if(s==='ruling')return A.rOpen(id);if(s==='law')return A.lgOpen(id);if(s==='template'||s==='templateBase')return A.llOpen(id);
 if(s==='saved'){const r=legalRefs.find(x=>x.id===id);if(r)return canWrite()?form(r):readRef(r)}};
function readRef(r){document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal kl-modal" role="dialog" aria-label="${e(r.title)}"><div class="head"><h1>${e(r.title)}</h1><button class="btn sm" data-act="close">إغلاق</button></div><p class="m">${e([typeName(r.referenceType),r.authorityType,r.lawName,r.articleNumber?'المادة '+r.articleNumber:'',r.courtName,r.judgmentNumber].filter(Boolean).join(' · '))}</p><div class="paper" style="white-space:pre-wrap">${e(r.text||'')}</div>${r.notes?`<p class="note">${e(r.notes)}</p>`:''}</div></div>`}
const fld=(id,label,v,ph='')=>`<label>${label}<input class="field" id="${id}" placeholder="${e(ph)}" value="${e(v||'')}"></label>`;
function form(r={}){if(!canWrite())return toast('لا تملك صلاحية تعديل المكتبة');
 document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal kl-modal" role="dialog" aria-label="المرجع القانوني"><div class="head"><h1>${r.id?'تعديل المرجع':'حفظ مرجع في مكتبتي'}</h1><button class="btn sm" data-act="close">إغلاق</button></div><form class="form" id="klForm" data-id="${e(r.id||'')}">
 <label>نوع المرجع<select class="field" id="klType">${TYPES.map(([id,n])=>`<option value="${id}" ${(r.referenceType||'article')===id?'selected':''}>${n}</option>`).join('')}</select></label>
 <label>المرجعية<select class="field" id="klAuthorityType">${opts(AUTH,r.authorityType||'قانون')}</select></label>
 ${fld('klNatureType','الطبيعة القانونية',r.natureType,'مادة / حكم / مبدأ')}${fld('klTitle','عنوان المرجع *',r.title,'اسم القانون أو الحكم')}
 ${fld('klLawName','اسم القانون',r.lawName)}${fld('klLawNumber','رقم القانون',r.lawNumber)}${fld('klLawYear','سنة القانون',r.lawYear)}${fld('klArticleNumber','رقم المادة',r.articleNumber)}
 ${fld('klCourtName','اسم المحكمة',r.courtName)}${fld('klJudgmentNumber','رقم الحكم',r.judgmentNumber)}${fld('klJudgmentYear','سنة الحكم',r.judgmentYear)}
 <label>تاريخ الحكم<input type="date" class="field" id="klDate" value="${e(r.decisionDate||'')}"></label>
 ${fld('klSource','المصدر / الجهة الناشرة',r.source)}${fld('klSourceUrl','الرابط الأصلي',r.srcUrl,'https://...')}
 <label class="wide">النص القانوني *<textarea class="field" id="klText" rows="8">${e(r.text||'')}</textarea></label>
 <label class="wide">ملاحظات المكتب<textarea class="field" id="klNotes" rows="3">${e(r.notes||'')}</textarea></label>
 <div class="wide toolbar"><button class="btn pri">حفظ في مكتبتي</button>${r.id?`<button class="btn" type="button" data-act="klDelete" data-v="${e(r.id)}">حذف المرجع</button>`:''}</div>
 </form></div></div>`;
 document.getElementById('klTitle').focus();showFields()}
function showFields(){const t=(document.getElementById('klType')||{}).value;if(!t)return;
 const law=t==='legislation'||t==='article',court=t==='ruling'||t==='decision'||t==='principle';
 for(const id of ['klLawName','klLawNumber','klLawYear','klArticleNumber'])document.getElementById(id).closest('label').style.display=law?'':'none';
 for(const id of ['klCourtName','klJudgmentNumber','klJudgmentYear','klDate'])document.getElementById(id).closest('label').style.display=court?'':'none'}
A.klGo=()=>{A.close();P.loadedQ=null;A.nav('legalShelf')};
A.klNew=()=>form();window.MQ_openRefForm=form;
A.klDelete=id=>{if(!canWrite()||!confirm('حذف هذا المرجع من مكتبة المكتب؟'))return;const i=legalRefs.findIndex(r=>r.id===id);if(i<0)return;legalRefs.splice(i,1);if(MQ.deleted)MQ.deleted('legalRefs',id);A.close();refresh();toast('حُذف المرجع')};
document.addEventListener('submit',ev=>{const f=ev.target;if(f.id!=='klForm')return;ev.preventDefault();ev.stopImmediatePropagation();if(!canWrite())return;
 const g=id=>document.getElementById(id).value.trim(),title=g('klTitle'),text=g('klText'),kind=g('klType'),art=g('klArticleNumber'),url=g('klSourceUrl');
 if(!title)return toast('عنوان المرجع مطلوب');if(!text)return toast('نص المرجع مطلوب');if(kind==='article'&&!art)return toast('رقم المادة مطلوب');if(url&&!validUrl(url))return toast('الرابط غير صالح');
 const id=f.dataset.id||'lr'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
 const rec={id,title,referenceType:kind,authorityType:g('klAuthorityType'),natureType:g('klNatureType'),lawName:g('klLawName'),lawNumber:g('klLawNumber'),lawYear:g('klLawYear'),articleNumber:art,courtName:g('klCourtName'),judgmentNumber:g('klJudgmentNumber'),judgmentYear:g('klJudgmentYear'),decisionDate:g('klDate'),source:g('klSource'),srcUrl:url,text,notes:g('klNotes')};
 if(url&&legalRefs.some(r=>r.id!==id&&r.srcUrl===url&&r.articleNumber===art))return toast('مرجع مطابق محفوظ سابقاً');
 const i=legalRefs.findIndex(r=>r.id===id);if(i>=0)Object.assign(legalRefs[i],rec);else legalRefs.push({...rec,added:iso(TODAY),by:(MQ.user&&MQ.user.name)||''});
 A.close();if(MQ.saveState)MQ.saveState();Object.assign(P,{tab:'الكل',q:'',page:1,loadedQ:null});S.view='legalShelf';render();toast('حُفظ المرجع في مكتبتي القانونية');
},true);
const css=document.createElement('style');css.textContent=`
.kl-tabs{display:flex;flex-wrap:wrap;gap:7px;margin:12px 0}.kl-tabs button{font:inherit;border:1px solid var(--line);border-radius:9px;padding:9px 12px;cursor:pointer;background:var(--panel,#fff);color:var(--ink)}.kl-tabs button.on{border-color:var(--brass);background:var(--accent-soft);font-weight:700}.kl-tabs small{color:var(--muted);padding-inline-start:4px}
.kl-stats{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.kl-stats span{border:1px solid var(--line);border-radius:9px;padding:9px 14px;background:var(--panel,#fff)}.kl-stats b{color:var(--brass);font-size:20px;margin-inline-end:6px}
.kl-search{display:grid;grid-template-columns:minmax(240px,2fr) minmax(150px,1fr) minmax(150px,1fr) auto;gap:9px;align-items:center}.kl-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:12px 0}.kl-card{min-width:0;border:1px solid var(--line);background:var(--panel,#fff);border-radius:13px;padding:16px}.kl-card h3{font-size:16px;color:var(--ink);margin:9px 0}.kl-card p{color:var(--muted);line-height:1.8;font-size:14px}.kl-meta{display:flex;align-items:center;flex-wrap:wrap;gap:6px}.kl-meta small{color:var(--muted)}.kl-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:12px}.kl-pager{display:flex;gap:12px;align-items:center;justify-content:center;margin:16px}.kl-modal{max-width:920px}
@media(max-width:950px){.kl-search{grid-template-columns:1fr 1fr}.kl-grid{grid-template-columns:1fr}}@media(max-width:550px){.kl-search{grid-template-columns:1fr}.kl-stats{display:grid;grid-template-columns:1fr 1fr}}
`;document.head.appendChild(css);
})();
