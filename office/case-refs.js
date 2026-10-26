/* ── مراجع القضية: ربط أي مادة قانونية أو تشريع أو حكم أو مقطع منه بقضية أو أكثر ──
   • من قارئ المسبار: زر «ربط بقضية» للمستند كله، وزر 🔗 بجانب كل مادة، وربط المقطع المظلّل.
   • من الاجتهادات المحفوظة ومن «مكتبتي القانونية».
   • لكل مرجع رمز مميز (مثل «م 32 · ق 36/1944» أو «نقض 1234/2019») مع التاريخ والعنوان، ورقم تسلسلي داخل القضية.
   • النص يُحفظ حرفياً كما في المصدر (لا اختصار)، مع المسألة القانونية ووجه الاستشهاد ومن ربطه ومتى.
   • تبويب «المراجع القانونية» في القضية: مجمّعة حسب المسألة، نسخ الاستشهاد، طباعة مذكرة المراجع، الربط بقضايا أخرى.
   • عقل القضية يقدّم المراجع المربوطة على غيرها عند التحليل والصياغة. */
(function(root){
'use strict';
/* ── منطق خالص قابل للاختبار ── */
const AR='٠١٢٣٤٥٦٧٨٩';
const lat=s=>String(s??'').replace(/[٠-٩]/g,c=>AR.indexOf(c));
const ART_RX=/^\s*(?:ال)?ماد[ةه]\s*(?:رقم\s*)?[(\[]?\s*([0-9٠-٩]+)\s*[)\]]?\s*((?:مكرر(?:ة|ا)?)(?:\s*[0-9٠-٩]+)?)?/;
/* تقسيم نص التشريع إلى مواد: [{n:'32', label:'المادة 32', text, start, end}] */
function splitArticles(body){
 const lines=String(body||'').split(/\n/),out=[];let cur=null,pos=0;
 for(const raw of lines){const ln=raw.trim(),m=ln.length<120?ART_RX.exec(ln):null;
  if(m){if(cur){cur.end=pos;out.push(cur)}const n=lat(m[1])+(m[2]?' '+lat(m[2]).replace(/\s+/g,' '):'');cur={n,label:'المادة '+n,text:ln,start:pos,end:0}}
  else if(cur&&ln)cur.text+='\n'+ln;
  pos+=raw.length+1}
 if(cur){cur.end=pos;out.push(cur)}
 return out}
/* المادة التي تحتوي موضع نص محدد داخل التشريع */
function articleAt(body,snippet){const s=String(snippet||'').trim().slice(0,60);if(!s)return null;const i=String(body||'').indexOf(s);if(i<0)return null;
 const arts=splitArticles(body);let hit=null;for(const a of arts){if(a.start<=i)hit=a;else break}return hit}
const LT=t=>/قرار\s*بقانون/.test(t||'')?'ق.ب':/^قانون|قانون/.test(t||'')?'ق':/نظام/.test(t||'')?'ن':/أمر|امر/.test(t||'')?'أ':/مرسوم/.test(t||'')?'مر':/لائحة/.test(t||'')?'ل':/تعليمات/.test(t||'')?'تع':'ت';
const COURT=c=>{c=String(c||'');return /النقض|التمييز/.test(c)?(/التمييز/.test(c)?'تمييز':'نقض'):/الدستورية/.test(c)?'دستورية':/العدل العليا|العليا/.test(c)?'عليا':/استئناف/.test(c)?'استئناف':/بداية/.test(c)?'بداية':/صلح/.test(c)?'صلح':/إدارية|الادارية/.test(c)?'إدارية':'حكم'};
const dmy=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(s||''));return m?(+m[3])+'/'+(+m[2])+'/'+m[1]:''};
/* الرمز المميز للمرجع */
function refCode(r){
 if(r.kind==='ruling')return [COURT(r.court),r.case_no||r.number||''].filter(Boolean).join(' ')+(r.part?' · فقرة':'');
 const law=r.number?`${LT(r.ltype||r.title)} ${lat(r.number)}${r.year?'/'+r.year:''}`:(r.year?`${LT(r.ltype||r.title)} ${r.year}`:LT(r.ltype||r.title));
 if(r.kind==='article')return `م ${r.art} · ${law}`;
 if(r.kind==='excerpt')return `${r.art?'م '+r.art+' · ':''}${law} · مقطع`;
 return law}
/* صيغة الاستشهاد الكاملة */
function citation(r){
 if(r.kind==='ruling')return `حكم ${r.court||'المحكمة'} رقم ${r.case_no||'—'}${r.date?' الصادر بتاريخ '+dmy(r.date):r.year?' لسنة '+r.year:''}`;
 const law=`${r.title||'التشريع'}${r.number&&!new RegExp('رقم\\s*\\(?'+r.number).test(r.title||'')?' رقم ('+lat(r.number)+')':''}${r.year&&!String(r.title||'').includes(String(r.year))?' لسنة '+r.year:''}`;
 return (r.art?'المادة ('+r.art+') من ':'')+law}
const keyOf=r=>[r.kind,r.src,r.docId||'',r.rulingId||'',r.shelfId||'',r.art||'',String(r.text||'').replace(/\s+/g,' ').slice(0,140)].join('|');
/* ربط مرجع بعدة قضايا (لا يتكرر في القضية الواحدة)؛ يعيد {added, skipped} */
function linkRef(list,caseIds,ref,{by='',at=''}={}){
 const out={added:[],skipped:[]};const key=keyOf(ref);
 for(const id of caseIds){const k=list.find(x=>x.id===id);if(!k)continue;k.lawRefs=k.lawRefs||[];
  if(k.lawRefs.some(x=>keyOf(x)===key)){out.skipped.push(id);continue}
  k.refSeq=Math.max(Number(k.refSeq)||0,...k.lawRefs.map(x=>Number(x.n)||0))+1;
  k.lawRefs.push({...ref,id:'r'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),n:k.refSeq,code:refCode(ref),by,at});
  out.added.push(id)}
 return out}
/* مرجع من مستند المسبار (تشريع كامل، أو مادة، أو مقطع، أو حكم) */
function fromDoc(d,{art=null,excerpt=''}={}){
 const base={src:'misbar',docId:d.id,title:String(d.title||'').replace(/\s+/g,' ').trim(),source:d.source||'',primary:!!d.primary,country:d.country||'',ltype:d.ltype||'',number:d.number||'',year:d.year||'',date:d.date||'',status:d.status||'',url:d.url||'',court:d.court||'',case_no:d.case_no||''};
 if(d.kind==='ruling')return {...base,kind:'ruling',part:!!excerpt,text:excerpt||String(d.body||'')};
 if(excerpt){const a=art||articleAt(d.body,excerpt);return {...base,kind:'excerpt',art:a?a.n:'',text:excerpt}}
 if(art)return {...base,kind:'article',art:art.n,text:art.text};
 return {...base,kind:'law',text:String(d.body||'')}}
const T={splitArticles,articleAt,refCode,citation,linkRef,fromDoc,keyOf,dmy};
if(typeof module!=='undefined'&&module.exports){module.exports=T;return}
root.MQREFS=T;
if(!root.document||typeof V==='undefined')return;

/* ── الواجهة ── */
const doc=root.document,E=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const canLink=()=>typeof root.MQ_can==='function'?root.MQ_can('cases'):true;
const user=()=>(root.MQ&&MQ.user&&MQ.user.name)||'';
const now=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes())};
const save=()=>{if(root.MQ&&MQ.saveState)MQ.saveState()};
const allCases=()=>(typeof cases!=='undefined'?cases:[]);
const clientName=id=>{try{return (C(id)||{}).name||''}catch(_){return ''}};
const KIND={article:['مادة','#8A6A12','§'],law:['تشريع','#1D3557','📘'],excerpt:['مقطع','#6B4FA0','❝'],ruling:['حكم','#7A2E2E','⚖']};
const docCache=new Map();
async function getDoc(id){if(docCache.has(id))return docCache.get(id);const r=await fetch('/api/admin/misbar/doc?id='+encodeURIComponent(id));const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'تعذّر فتح المرجع');docCache.set(id,j);return j}
const linkedCount=pred=>allCases().filter(k=>(Array.isArray(k.lawRefs)?k.lawRefs:[]).some(pred));

const css=`
.cr-badge{display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap}
.cr-code{font:700 13px/1.4 ui-monospace,Consolas,monospace;direction:rtl;background:var(--crb,#F6EEDA);color:var(--crc,#8A6A12);border:1px solid color-mix(in srgb,var(--crc,#8A6A12) 35%,transparent);border-radius:8px;padding:3px 8px;white-space:nowrap}
.cr-n{font:700 12px/1 system-ui;background:#0B1B2B;color:#F3D58A;border-radius:999px;padding:4px 7px}
.cr-date{font-size:12px;color:var(--muted,#6B7380)}
.cr-card{border:1px solid var(--line,#E5DCC8);border-radius:12px;padding:12px 14px;background:#fff;margin-bottom:10px}
.cr-card h4{margin:6px 0 4px;font-size:15px}
.cr-note{margin:6px 0;padding:6px 10px;border-inline-start:3px solid #C9A24A;background:#FBF6EA;border-radius:6px;font-size:13.5px}
.cr-text{white-space:pre-wrap;line-height:1.95;font-size:14.5px;background:#FFFDF7;border:1px solid #EFE6D2;border-radius:8px;padding:10px 12px;margin-top:6px;max-height:340px;overflow:auto}
.cr-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.cr-issue{margin:16px 0 8px;font-size:14px;color:#5B6470;display:flex;align-items:center;gap:8px}.cr-issue::after{content:'';flex:1;border-top:1px dashed #DCCFB2}
.cr-modal .cr-prev{border:1px solid #E5DCC8;border-radius:10px;padding:10px;background:#FFFDF7;max-height:180px;overflow:auto;white-space:pre-wrap;font-size:13.5px;line-height:1.8}
.cr-cases{border:1px solid #E5DCC8;border-radius:10px;max-height:240px;overflow:auto;padding:6px}
.cr-cases label,.cr-modal .cr-cases label{display:flex!important;flex-direction:row!important;flex-wrap:wrap;gap:8px;align-items:center;justify-content:flex-start;text-align:start;padding:6px 8px;margin:0;border-radius:7px;cursor:pointer;color:var(--ink,#1F2A36);font-size:14px}.cr-cases label[hidden]{display:none!important}.cr-cases input{width:auto!important;margin:0}.cr-cases label:hover{background:#F8F3E6}
.cr-cases small{color:#7A8592}
.mb-body h4 .cr-art{margin-inline-start:8px;border:1px solid #C9A24A;background:#FFF8E6;color:#8A6A12;border-radius:7px;font-size:12px;padding:1px 7px;cursor:pointer;vertical-align:2px}
.mb-body h4 .cr-art:hover{background:#C9A24A;color:#fff}
.mb-body h4 .cr-on{font-size:11px;color:#2F7D4A;margin-inline-start:6px}
#crSel{position:fixed;z-index:960;display:none;background:#0B1B2B;color:#F3D58A;border:1px solid #C9A24A;border-radius:9px;padding:6px 10px;font:600 13px system-ui;cursor:pointer;box-shadow:0 8px 20px rgb(0 0 0 / .3)}
html.night .cr-card,html.night .cr-text,html.night .cr-note{background:#132433;color:#E9E2D0;border-color:#2B4256}
@media print{#crSel{display:none!important}}`;
{const st=doc.createElement('style');st.textContent=css;doc.head.appendChild(st)}

/* ── نافذة الربط ── */
let PEND=null;
function openLink(ref,pre){if(!canLink())return toast('لا تملك صلاحية تعديل القضايا');PEND=ref;
 const cur=pre||(S.caseId&&(S.view==='client'||S.view==='case')?S.caseId:'')||root.MQ_refTarget||'';
 const ks=allCases().slice().sort((a,b)=>(a.id===cur?-1:b.id===cur?1:0)||((a.status==='منتهية')-(b.status==='منتهية')));
 const already=new Set(linkedCount(x=>keyOf(x)===keyOf(ref)).map(k=>k.id));
 const issues=[...new Set(allCases().flatMap(k=>(Array.isArray(k.lawRefs)?k.lawRefs:[]).map(r=>r.issue)).filter(Boolean))].slice(0,60);
 const kd=KIND[ref.kind]||KIND.law;
 doc.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal wide cr-modal" role="dialog" aria-label="ربط مرجع بقضية"><div class="head"><h1 style="font-size:21px">ربط مرجع قانوني بقضية</h1><button class="btn sm" data-act="close">إغلاق</button></div>
  <div class="cr-badge" style="--crc:${kd[1]}"><span class="cr-code">${kd[2]} ${E(refCode(ref))}</span>${ref.date||ref.year?`<span class="cr-date">${E(dmy(ref.date)||ref.year)}</span>`:''}<span class="pill">${kd[0]}</span>${ref.status?`<span class="pill">${E(ref.status)}</span>`:''}</div>
  <h4 style="margin:8px 0">${E(citation(ref))}</h4>
  <div class="cr-prev">${E(String(ref.text||'').slice(0,3000))}${String(ref.text||'').length>3000?'\n… (يُحفظ النص كاملاً: '+String(ref.text).length.toLocaleString('en')+' حرف)':''}</div>
  <form class="form" id="crForm" style="margin-top:10px">
   <label class="wide">المسألة القانونية (لتجميع المراجع)<input class="field" id="crIssue" list="crIssues" placeholder="مثال: التقادم · عبء الإثبات · الاختصاص المكاني" maxlength="120"><datalist id="crIssues">${issues.map(i=>`<option value="${E(i)}">`).join('')}</datalist></label>
   <label class="wide">وجه الاستشهاد (اختياري)<textarea class="field" id="crNote" rows="2" maxlength="1200" placeholder="لماذا هذا المرجع مهم لهذه القضية؟"></textarea></label>
   <div class="wide"><div style="display:flex;gap:8px;align-items:center;margin-bottom:6px"><b>القضايا</b><input class="field" id="crQ" placeholder="ابحث برقم القضية أو الموكل أو الموضوع" style="flex:1"></div>
    <div class="cr-cases" id="crCases">${ks.map(k=>`<label data-s="${E((k.no+' '+k.subject+' '+clientName(k.client)+' '+(k.court||'')).toLowerCase())}"><input type="checkbox" value="${k.id}" ${k.id===cur?'checked':''} ${already.has(k.id)?'disabled':''}><b class="mono">${E(k.no||'—')}</b> ${E(k.subject||'')} <small>${E(clientName(k.client))}${k.status==='منتهية'?' · منتهية':''}${already.has(k.id)?' · مربوط سابقاً':''}</small></label>`).join('')||'<div class="m">لا قضايا.</div>'}</div></div>
   <button class="btn pri">ربط بالقضايا المحددة</button></form><div class="err-box" id="mErr" hidden></div></div></div>`;
 const q=doc.getElementById('crQ');q.oninput=()=>{const v=q.value.trim().toLowerCase();doc.querySelectorAll('#crCases label').forEach(l=>{l.hidden=!!v&&!l.dataset.s.includes(v)})};
 setTimeout(()=>doc.getElementById('crIssue').focus(),50)}
doc.addEventListener('submit',ev=>{if(ev.target.id!=='crForm')return;ev.preventDefault();ev.stopImmediatePropagation();
 const ids=[...doc.querySelectorAll('#crCases input:checked:not(:disabled)')].map(i=>i.value);if(!ids.length){const m=doc.getElementById('mErr');m.textContent='اختر قضية واحدة على الأقل';m.hidden=false;return}
 const ref={...PEND,issue:doc.getElementById('crIssue').value.trim(),note:doc.getElementById('crNote').value.trim()};
 const r=linkRef(allCases(),ids,ref,{by:user(),at:now()});save();A.close();
 toast(r.added.length?`رُبط «${refCode(ref)}» بـ ${r.added.length} ${r.added.length===1?'قضية':'قضايا'}`+(r.skipped.length?' (مربوط سابقاً بـ '+r.skipped.length+')':''):'المرجع مربوط سابقاً بهذه القضايا');
 if(typeof root.MQ_mbRepaint==='function')root.MQ_mbRepaint();else render()},true);

/* ── من قارئ المسبار ── */
A.crLinkDoc=async v=>{try{const d=root.MQ_mbDoc&&root.MQ_mbDoc()&&String(root.MQ_mbDoc().id)===String(v)?root.MQ_mbDoc():await getDoc(v);openLink(fromDoc(d))}catch(x){toast(x.message)}};
A.crLinkArt=async v=>{const [id,n]=String(v).split('|');try{const d=root.MQ_mbDoc&&root.MQ_mbDoc()&&String(root.MQ_mbDoc().id)===id?root.MQ_mbDoc():await getDoc(id);const a=splitArticles(d.body).find(x=>x.n===n);if(!a)return toast('تعذّر تحديد نص المادة');openLink(fromDoc(d,{art:a}))}catch(x){toast(x.message)}};
/* تظليل نص داخل القارئ ← زر «ربط المقطع المحدد» */
const selBtn=doc.createElement('button');selBtn.id='crSel';selBtn.type='button';selBtn.textContent='🔗 ربط المقطع المحدد بقضية';doc.body.appendChild(selBtn);
let SEL='';
doc.addEventListener('mouseup',()=>setTimeout(()=>{const s=root.getSelection&&root.getSelection(),t=s?String(s).trim():'';const box=doc.querySelector('#mbReader .mb-body');
 if(!t||t.length<15||!box||!s.rangeCount||!box.contains(s.getRangeAt(0).commonAncestorContainer)||!canLink()){selBtn.style.display='none';return}
 SEL=t;const rc=s.getRangeAt(0).getBoundingClientRect();selBtn.style.display='block';selBtn.style.top=Math.max(8,rc.top-44)+'px';selBtn.style.left=Math.max(8,Math.min(innerWidth-260,rc.left+rc.width/2-110))+'px'},10));
doc.addEventListener('mousedown',ev=>{if(ev.target!==selBtn)selBtn.style.display='none'});
selBtn.addEventListener('mousedown',ev=>ev.preventDefault());
selBtn.addEventListener('click',()=>{selBtn.style.display='none';const d=root.MQ_mbDoc&&root.MQ_mbDoc();if(!d)return;openLink(fromDoc(d,{excerpt:SEL}))});

/* ── من الاجتهادات المحفوظة ومن مكتبتي القانونية ── */
A.crLinkRuling=v=>{const r=(typeof rulings!=='undefined'?rulings:[]).find(x=>x.id===v);if(!r)return;
 openLink({src:'ruling',rulingId:r.id,kind:'ruling',court:r.court||'',case_no:r.no||'',date:r.date||'',title:r.title||r.principle||'',text:[r.principle?'المبدأ: '+r.principle:'',r.text||r.summary||''].filter(Boolean).join('\n\n'),url:r.srcUrl||'',source:r.src||'مكتبة الاجتهادات'})};
A.crLinkShelf=v=>{const r=(typeof legalRefs!=='undefined'?legalRefs:[]).find(x=>x.id===v);if(!r)return;
 const isR=r.referenceType==='judgment'||r.referenceType==='ruling';
 openLink(isR?{src:'shelf',shelfId:r.id,kind:'ruling',court:r.courtName||'',case_no:[r.judgmentNumber,r.judgmentYear].filter(Boolean).join('/'),date:r.judgmentDate||'',title:r.title||'',text:r.text||r.principle||r.excerpt||'',url:r.srcUrl||''}
  :{src:'shelf',shelfId:r.id,kind:r.articleNumber?'article':'law',title:r.lawName||r.title||'',number:r.lawNumber||'',year:r.lawYear||'',art:r.articleNumber?lat(r.articleNumber):'',ltype:r.lawName||'',text:r.text||r.articleText||r.excerpt||'',url:r.srcUrl||''})};

/* ── تبويب «المراجع القانونية» في القضية ── */
const CR={open:new Set(),issue:''};
function card(k,r){const kd=KIND[r.kind]||KIND.law,open=CR.open.has(r.id),others=allCases().filter(x=>x.id!==k.id&&(x.lawRefs||[]).some(y=>keyOf(y)===keyOf(r)));
 return `<div class="cr-card" id="cr_${r.id}"><div class="cr-badge" style="--crc:${kd[1]}"><span class="cr-n" title="رقم المرجع في هذه القضية">${r.n||'•'}</span><span class="cr-code">${kd[2]} ${E(r.code||refCode(r))}</span>${dmy(r.date)||r.year?`<span class="cr-date">${E(dmy(r.date)||r.year)}</span>`:''}<span class="pill">${kd[0]}</span>${r.status?`<span class="pill ${/ملغ/.test(r.status)?'bad':''}">${E(r.status)}</span>`:''}${r.primary===false?'<span class="pill">للاستئناس</span>':''}</div>
  <h4>${E(citation(r))}</h4>
  ${r.note?`<div class="cr-note"><b>وجه الاستشهاد:</b> ${E(r.note)}</div>`:''}
  ${open?`<div class="cr-text">${E(r.text||'')}</div>`:`<div class="m" style="margin-top:4px">${E(String(r.text||'').replace(/\s+/g,' ').slice(0,220))}${String(r.text||'').length>220?'…':''}</div>`}
  <div class="m" style="margin-top:6px">رُبط ${E(r.at||'')}${r.by?' · '+E(r.by):''}${others.length?' · مربوط أيضاً بـ: '+others.map(o=>`<button class="link mono" data-act="openCase" data-v="${o.id}">${E(o.no)}</button>`).join('، '):''}</div>
  <div class="cr-acts"><button class="btn sm" data-act="crToggle" data-v="${r.id}">${open?'إخفاء النص':'النص الكامل'}</button><button class="btn sm" data-act="crCopy" data-v="${k.id}|${r.id}">نسخ الاستشهاد</button>${r.docId?`<button class="btn sm" data-act="mbOpen" data-v="${r.docId}">فتح المصدر</button>`:''}${canLink()?`<button class="btn sm" data-act="crMore" data-v="${k.id}|${r.id}">ربط بقضايا أخرى</button><button class="btn sm" data-act="crEdit" data-v="${k.id}|${r.id}">تعديل</button><button class="btn sm d" data-act="crDel" data-v="${k.id}|${r.id}">إزالة</button>`:''}</div></div>`}
function tab(k){const rs=(Array.isArray(k.lawRefs)?k.lawRefs:[]).slice().sort((a,b)=>(a.n||0)-(b.n||0));
 const groups={};for(const r of rs){(groups[r.issue||'']=groups[r.issue||'']||[]).push(r)}
 const order=Object.keys(groups).sort((a,b)=>!a?1:!b?-1:a.localeCompare(b,'ar'));
 return `<section class="panel"><header><h2>المراجع القانونية للقضية</h2><span class="m">المواد والتشريعات والأحكام التي يعتمد عليها ملف القضية، بنصوصها الحرفية</span></header><div class="bd">
  <div class="toolbar" style="margin-bottom:10px">${canLink()?`<button class="btn sm pri" data-act="crFind" data-v="${k.id}">+ ربط من المسبار (تشريع أو حكم)</button><button class="btn sm" data-act="crPick" data-v="${k.id}|rulings">+ من الاجتهادات المحفوظة</button><button class="btn sm" data-act="crPick" data-v="${k.id}|shelf">+ من مكتبتي القانونية</button>`:''}${rs.length?`<button class="btn sm" data-act="crPrint" data-v="${k.id}">طباعة مذكرة المراجع</button><button class="btn sm" data-act="crCopyAll" data-v="${k.id}">نسخ قائمة المراجع</button>`:''}</div>
  ${rs.length?order.map(g=>`<div class="cr-issue">${g?E(g):'بلا مسألة محددة'} <small>(${groups[g].length})</small></div>${groups[g].map(r=>card(k,r)).join('')}`).join(''):
  `<div class="empty">لا مراجع مربوطة بعد.<br><small>افتح أي تشريع أو حكم في المسبار، ثم اضغط «🔗 ربط» بجانب المادة، أو «ربط بقضية» للمستند كله، أو ظلّل فقرة واضغط «ربط المقطع المحدد».</small></div>`}
 </div></section>`}
const caseTab0=root.caseTab;root.caseTab=function(k){if(S.caseTab==='refs')return tab(k);return caseTab0(k)};

A.crToggle=v=>{CR.open.has(v)?CR.open.delete(v):CR.open.add(v);render()};
const find=v=>{const [kid,rid]=String(v).split('|');const k=allCases().find(x=>x.id===kid);return {k,r:k&&(Array.isArray(k.lawRefs)?k.lawRefs:[]).find(x=>x.id===rid)}};
A.crCopy=v=>{const {r}=find(v);if(!r)return;const t=citation(r)+(r.text?'\n«'+r.text+'»':'');navigator.clipboard.writeText(t).then(()=>toast('نُسخ الاستشهاد مع النص'))};
A.crCopyAll=v=>{const k=allCases().find(x=>x.id===v);if(!k)return;const t=(Array.isArray(k.lawRefs)?k.lawRefs:[]).slice().sort((a,b)=>a.n-b.n).map(r=>`(${r.n}) ${citation(r)}`).join('\n');navigator.clipboard.writeText(t).then(()=>toast('نُسخت قائمة المراجع'))};
A.crDel=v=>{const {k,r}=find(v);if(!r||!confirm('إزالة «'+(r.code||'')+'» من مراجع هذه القضية؟'))return;k.lawRefs=k.lawRefs.filter(x=>x.id!==r.id);save();render()};
A.crMore=v=>{const {k,r}=find(v);if(!r)return;const {id,n,code,by,at,...ref}=r;openLink(ref,'')};
A.crEdit=v=>{const {k,r}=find(v);if(!r)return;
 doc.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog"><div class="head"><h1 style="font-size:20px">تعديل المرجع (${r.n}) ${E(r.code||'')}</h1><button class="btn sm" data-act="close">إغلاق</button></div>
  <form class="form" id="crEditF" data-v="${E(v)}"><label class="wide">المسألة القانونية<input class="field" id="ceI" value="${E(r.issue||'')}" maxlength="120"></label><label class="wide">وجه الاستشهاد<textarea class="field" id="ceN" rows="3" maxlength="1200">${E(r.note||'')}</textarea></label><button class="btn pri">حفظ</button></form></div></div>`};
doc.addEventListener('submit',ev=>{if(ev.target.id!=='crEditF')return;ev.preventDefault();ev.stopImmediatePropagation();const {r}=find(ev.target.dataset.v);if(!r)return;r.issue=doc.getElementById('ceI').value.trim();r.note=doc.getElementById('ceN').value.trim();save();A.close();render()},true);
/* «ربط من المسبار»: يفتح المسبار ببحث في موضوع القضية، وتكون القضية هي المختارة مسبقاً في نافذة الربط */
A.crFind=v=>{const k=allCases().find(x=>x.id===v);root.MQ_refTarget=v;if(k&&root.MQ_mbSearch)root.MQ_mbSearch(k.subject||'');else A.nav('misbar');toast('اختر مادة أو حكماً ثم اضغط «🔗 ربط» — القضية '+((k&&k.no)||'')+' محددة مسبقاً')};
A.crPick=v=>{const [kid,what]=String(v).split('|');const list=what==='rulings'?(typeof rulings!=='undefined'?rulings:[]):(typeof legalRefs!=='undefined'?legalRefs:[]);
 if(!list.length)return toast(what==='rulings'?'لا أحكام محفوظة في مكتبة الاجتهادات':'لا مراجع في مكتبتي القانونية');
 root.MQ_refTarget=kid;
 doc.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal wide" role="dialog"><div class="head"><h1 style="font-size:20px">${what==='rulings'?'اختر حكماً من الاجتهادات المحفوظة':'اختر مرجعاً من مكتبتي القانونية'}</h1><button class="btn sm" data-act="close">إغلاق</button></div>
  <input class="field" id="crPq" placeholder="بحث…" style="width:100%;margin-bottom:8px"><div class="cr-cases" id="crPl" style="max-height:420px">${list.map(r=>`<label data-s="${E(JSON.stringify([r.title,r.no,r.court,r.principle,r.lawName,r.articleNumber]).toLowerCase())}"><button type="button" class="btn sm" data-act="${what==='rulings'?'crLinkRuling':'crLinkShelf'}" data-v="${r.id}">اختيار</button> ${E(what==='rulings'?[r.court,r.no,dmy(r.date)].filter(Boolean).join(' · ')+' — '+(r.principle||r.title||'').slice(0,120):[r.lawName||r.title,r.articleNumber?'م '+r.articleNumber:''].filter(Boolean).join(' · '))}</label>`).join('')}</div></div></div>`;
 const q=doc.getElementById('crPq');q.oninput=()=>{const t=q.value.trim().toLowerCase();doc.querySelectorAll('#crPl label').forEach(l=>{l.hidden=!!t&&!l.dataset.s.includes(t)})};q.focus()};
A.crPrint=v=>{const k=allCases().find(x=>x.id===v);if(!k||!root.MQP||!MQP.open)return toast('الطباعة غير متاحة');const B=MQP.B,e2=E;
 MQP.open({label:'مذكرة المراجع',build(){const rs=(Array.isArray(k.lawRefs)?k.lawRefs:[]).slice().sort((a,b)=>a.n-b.n),blocks=[];let g=null;
  for(const r of rs.slice().sort((a,b)=>String(a.issue||'￿').localeCompare(String(b.issue||'￿'),'ar')||a.n-b.n)){if((r.issue||'')!==g){g=r.issue||'';blocks.push(B.h(g||'مراجع أخرى'))}
   blocks.push(B.p(`<b>(${r.n}) ${e2(citation(r))}</b> <small>[${e2(r.code||'')}]</small>`));if(r.note)blocks.push(B.box('<b>وجه الاستشهاد:</b> '+e2(r.note)));
   String(r.text||'').split(/\n+/).filter(Boolean).forEach(p=>blocks.push(B.p(e2(p),'q')))}
  blocks.push(B.p('<small>النصوص منقولة حرفياً من مصادرها؛ يرجى مطابقتها مع الأصل قبل تقديمها.</small>','s'));
  return {title:'مذكرة المراجع القانونية',sub:'في القضية رقم '+(k.no||'')+' · '+(k.subject||''),file:'مراجع القضية '+(k.no||''),orient:'port',blocks,sign:['المحامي']}}})};

/* ── إدماج في شاشة القضية: تبويب وعدّاد ── */
const vcase=V.case;V.case=function(){let html=vcase.apply(this,arguments);const k=typeof K==='function'?K(S.caseId):null;if(!k)return html;
 const n=(Array.isArray(k.lawRefs)?k.lawRefs:[]).length;const btn=`<button class="${S.caseTab==='refs'?'on':''}" data-act="caseTab" data-v="refs">⚖ المراجع القانونية${n?` <span class="cnt">${n}</span>`:''}</button>`;
 if(html.includes('data-act="caseTab" data-v="refs"'))return html;
 const t=doc.createElement('template');t.innerHTML=html;const tabs=t.content.querySelector('.tabs');if(!tabs)return html;
 const x=doc.createElement('template');x.innerHTML=btn;const after=tabs.querySelector('[data-v="misbar"]');if(after)after.after(x.content);else tabs.appendChild(x.content);
 const w=doc.createElement('div');w.appendChild(t.content.cloneNode(true));return w.innerHTML};
root.MQ_refsCount=k=>(k&&k.lawRefs||[]).length;
})(typeof window!=='undefined'?window:globalThis);
