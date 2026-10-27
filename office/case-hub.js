/* ── ملف القضية الموحّد ──
   القضية هي المركز: صفحة واحدة يجد فيها المحامي كل بيانات القضية وتحديثاتها وأوامرها.
   - رأس ثابت بالحقائق الأساسية (الجلسة القادمة، أقرب مهلة، الأتعاب، البوابة، الرسائل غير المقروءة، ميزان)
   - شريط أوامر واحد لكل ما يُفعل في القضية
   - تبويب «كل شيء»: سجل أحداث زمني موحّد (رسائل الموكل ومرفقاته، الجلسات وقراراتها، المستندات، المهل،
     الدفعات، تحديثات ميزان، المسودات، ملاحظات المحامي) مع تصفية بالنوع
   - مسار تنقّل ثابت: الموكلون ← الموكل ← القضية
   العرض فقط يقرأ من السجلات الأصلية، فلا تُنسخ بيانات ولا يحدث تضارب؛ الملاحظات وحدها تُحفظ في سجل القضية. */
(function(root){
'use strict';
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const dOk=s=>/^\d{4}-\d{2}-\d{2}/.test(String(s||''));
const TYPES=[['all','الكل'],['msg','رسائل ومرفقات'],['hearing','جلسات'],['deadline','مهل'],['doc','مستندات'],['pay','دفعات'],['mz','ميزان'],['draft','مسودات'],['note','ملاحظات']];

/* أحداث القضية من مصادرها الأصلية (دالة نقية قابلة للاختبار) */
function events(k,data,today){
 const out=[],client=(data.clients||[]).find(c=>c.id===k.client)||{},clientCases=(data.cases||[]).filter(x=>x.client===k.client);
 const onlyCase=clientCases.filter(x=>x.status!=='منتهية').length<=1;
 for(const h of (data.hearings||[]).filter(h=>h.k===k.id))if(dOk(h.date))out.push({type:'hearing',at:h.date+' '+(h.time||'00:00'),title:(h.date>=today?'جلسة قادمة: ':'جلسة: ')+(h.purpose||''),text:h.result?'القرار: '+h.result:(h.date<today?'لا قرار مدوّن — حدّثه من تبويب الجلسات':(h.attend?'حضور الموكل مطلوب':'')),warn:h.date<today&&!h.result,future:h.date>=today,go:['tab','hearings']});
 for(const d of (data.deadlines||[]).filter(d=>d.k===k.id))if(dOk(d.due))out.push({type:'deadline',at:d.due+' 23:59',title:'مهلة: '+(d.title||''),text:(d.kind||'')+(d.due<today?' · تاريخها سابق، تحقّق من وضعها':''),warn:d.due<today&&!d.done,future:d.due>=today,go:['tab','deadlines']});
 for(const d of (data.docs||[]).filter(d=>d.k===k.id)){const draft=!!(d.aiDraft||d.tplStatus==='draft'||d.templateStatus==='draft');
  out.push({type:draft?'draft':'doc',at:(dOk(d.date)?d.date:'0000-00-00')+' 12:00',title:(draft?'مسودة: ':'مستند: ')+(d.title||''),text:[d.kind,d.src,d.shared?'ظاهر في بوابة الموكل':''].filter(Boolean).join(' · '),go:d.text?['draft',d.id]:['tab','docs']})}
 for(const m of (data.messages||{})[k.client]||[]){
  if(m.k&&m.k!==k.id)continue;                // رسالة مربوطة بقضية أخرى لنفس الموكل
  const mine=m.f==='me',kind={voice:'رسالة صوتية',image:'صورة',file:'مستند',notice:'إشعار'}[m.type]||'رسالة';
  out.push({type:'msg',ic:m.type==='file'?'attach':m.type==='image'?'image':m.type==='voice'?'voice':m.type==='notice'?'notice':'msg',at:m.at,title:(mine?kind+' إلى الموكل':kind+' من الموكل')+(m.ch?' · '+m.ch:''),text:m.type==='file'||m.type==='image'?(m.name||''):String(m.t||'').slice(0,220),unread:!!m.unread,shared:!m.k&&!onlyCase,go:m.type==='file'||m.type==='image'?['read',m.id]:['bag',k.client]})}
 for(const p of client.payments||[]){if(p.k&&p.k!==k.id)continue;if(!p.k&&!onlyCase)continue;
  out.push({type:'pay',at:(dOk(p.date)?p.date:'0000-00-00')+' 12:00',title:'دفعة أتعاب: '+Number(p.amount||0).toLocaleString('en-US')+' ₪',text:[p.method,p.no,p.note].filter(Boolean).join(' · '),go:['pay',k.client]})}
 for(const l of (data.mzLog||[]).filter(l=>l.k===k.id))out.push({type:'mz',at:l.at||'',title:'تحديث من ميزان',text:l.t||'',go:['tab','mz']});
 for(const n of k.notes||[])out.push({type:'note',at:n.at||'',title:'ملاحظة'+(n.by?' · '+n.by:''),text:n.text||'',id:n.id});
 return out.sort((a,b)=>String(b.at).localeCompare(String(a.at)));
}
/* الحقائق الأساسية للرأس */
function facts(k,data,today){
 const hs=(data.hearings||[]).filter(h=>h.k===k.id&&dOk(h.date)&&h.date>=today).sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||'')));
 const dl=(data.deadlines||[]).filter(d=>d.k===k.id&&dOk(d.due)&&d.due>=today).sort((a,b)=>a.due.localeCompare(b.due));
 const c=(data.clients||[]).find(x=>x.id===k.client)||{},cs=(data.cases||[]).filter(x=>x.client===k.client);
 const un=((data.messages||{})[k.client]||[]).filter(m=>m.unread&&m.f!=='me'&&(!m.k||m.k===k.id)).length;
 const pending=(data.hearings||[]).filter(h=>h.k===k.id&&dOk(h.date)&&h.date<today&&!h.result).length;
 /* أتعاب القضية نفسها إن سُجّلت لها (القضايا الجديدة)، وإلا أتعاب الموكل الإجمالية كما كانت */
 const kp=(c.payments||[]).filter(p=>p.k===k.id).reduce((t,p)=>t+(+p.amount||0),0),own=(+k.fee||0)>0;
 const fee=own?+k.fee:+c.fee||0,paid=own?kp:+c.paid||0;
 return {next:hs[0]||null,deadline:dl[0]||null,fee,paid,due:Math.max(0,fee-paid),caseFee:own,feeShared:!own&&cs.length>1,portal:!!c.portal,last:c.last||'',unread:un,pending,mz:(data.mzLog||[]).filter(l=>l.k===k.id).sort((a,b)=>String(b.at).localeCompare(String(a.at)))[0]||null};
}
if(typeof module!=='undefined'&&module.exports)module.exports={events,facts,TYPES};
if(!root||!root.document)return;

const H={filter:'all',limit:60};
const today=()=>typeof iso==='function'?iso(TODAY):new Date().toISOString().slice(0,10);
const DATA=()=>({clients,cases,hearings,deadlines,docs,messages,mzLog:typeof mzLog!=='undefined'?mzLog:[]});
const can=()=>!!(root.MQ?(root.MQ.user&&['admin','lawyer'].includes(root.MQ.user.role)&&!root.MQ.readOnly):true);
/* أيقونات مميزة لكل نوع: خطوط بسيطة بلون خاص، فتُعرف الحركة من شكلها قبل قراءتها */
const P={
 msg:'<path d="M4 5h16v11H8l-4 4z"/>',
 attach:'<path d="M16.5 7.5l-7.6 7.6a2.5 2.5 0 0 0 3.5 3.5l8-8a4.5 4.5 0 0 0-6.4-6.4l-8.3 8.3a6.5 6.5 0 0 0 9.2 9.2L20 16"/>',
 image:'<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M4 18l5.5-5 4 3.5 2.5-2 4 3.5"/>',
 voice:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
 notice:'<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
 hearing:'<path d="M5 9.5l5-5 3.5 3.5-5 5zM9.8 11.3l7.7 7.7M4 20.5h8"/><path d="M12.2 3l4.3 4.3"/>',
 deadline:'<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9"/>',
 doc:'<path d="M6.5 3h8l4 4v14h-12z"/><path d="M14.5 3v4h4M9.5 12h6M9.5 15.5h6M9.5 9h2.5"/>',
 draft:'<path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5zM13.5 7l3 3"/><path d="M14 20h6"/>',
 pay:'<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>',
 mz:'<path d="M20 11a8 8 0 0 0-14.3-4.6L4 8.5M4 13a8 8 0 0 0 14.3 4.6L20 15.5"/><path d="M4 4v4.5h4.5M20 20v-4.5h-4.5"/>',
 note:'<path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5M8.5 9h7M8.5 12.5h4"/>',
 all:'<path d="M5 6h14M5 12h14M5 18h9"/>'};
const svg=t=>`<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[t]||P.msg}</svg>`;
const ICON=new Proxy({},{get:(o,t)=>svg(t)});
const fmtAt=a=>{const s=String(a||'');return dOk(s)?(typeof dmy==='function'?dmy(s.slice(0,10)):s.slice(0,10))+(s.length>11&&!/ (00:00|12:00|23:59)$/.test(s)?' · '+s.slice(11,16):''):'—'};

function strip(k){const f=facts(k,DATA(),today());
 const cell=(lb,val,sub,cls,act)=>`<${act?'button type="button" data-act="'+act[0]+'" data-v="'+e(act[1])+'"':'div'} class="hub-f ${cls||''}"><span>${lb}</span><b>${val}</b>${sub?`<small>${sub}</small>`:''}</${act?'button':'div'}>`;
 return `<div class="hub-strip">
  ${cell('الجلسة القادمة',f.next?fmtAt(f.next.date+' '+(f.next.time||'')):'غير محددة',f.next?e(f.next.purpose||''):(f.pending?f.pending+' جلسة سابقة بلا قرار':''),f.next?'':'warn',['hubTab','hearings'])}
  ${cell('أقرب مهلة',f.deadline?fmtAt(f.deadline.due):'لا مهل قادمة',f.deadline?e(f.deadline.title||''):'',f.deadline&&f.deadline.due<=addDays(today(),7)?'urgent':'',['hubTab','deadlines'])}
  ${cell('الأتعاب المتبقية',f.due?Number(f.due).toLocaleString('en-US')+' ₪':'مسددة',f.feeShared?'على مستوى الموكل (له أكثر من قضية)':'من '+Number(f.fee).toLocaleString('en-US')+' ₪'+(f.caseFee?' لهذه القضية':''),f.due?'':'ok',['hubPay',k.client])}
  ${cell('رسائل الموكل',f.unread?f.unread+' غير مقروءة':'لا جديد',f.portal?(f.last?'آخر دخول للبوابة '+fmtAt(f.last):'لم يدخل البوابة بعد'):'البوابة غير مفعّلة',f.unread?'urgent':'',['bag',k.client])}
  ${cell('ميزان',f.mz?fmtAt(f.mz.at):'لا تحديثات',f.mz?e(String(f.mz.t||'').slice(0,60)):(k.mz?e(k.mz):''),'',['hubTab','mz'])}
 </div>`}
const addDays=(d,n)=>{const x=new Date(d+'T00:00:00');x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)};
function actions(k){if(!can())return '';const b=(act,v,t,pri)=>`<button type="button" class="btn sm${pri?' pri':''}" data-act="${act}" data-v="${e(v)}">${t}</button>`;
 return `<div class="hub-acts" role="toolbar" aria-label="أوامر القضية">${b('hubTab','hearings',svg('hearing')+'جلسة')}${b('hubNewDl',k.id,svg('deadline')+'مهلة')}${b('hubTab','docs',svg('attach')+'مرفق')}${b('hubNote',k.id,svg('note')+'ملاحظة')}${b('bag',k.client,'مراسلة الموكل')}${A.aiOpen?b('hubDraft',k.id,'🎙 صياغة لائحة'):''}${A.hpOpen?b('hubPrep',k.id,'تحضير جلسة'):''}${A.asOpen?b('hubAssist',k.id,'مساعد القضية'):''}${b('printCase',k.id,'طباعة ملف القضية')}</div>`}
function timeline(k){const all=events(k,DATA(),today()),list=H.filter==='all'?all:all.filter(x=>x.type===H.filter),shown=list.slice(0,H.limit);
 const cnt=t=>t==='all'?all.length:all.filter(x=>x.type===t).length;
 const shared=all.some(x=>x.shared);
 return `<section class="panel hub-tl"><header><h2>سجل القضية</h2><span class="m">كل ما يخص القضية من مصادره الأصلية، الأحدث أولاً</span></header><div class="bd">
  <div class="hub-filters" role="tablist">${TYPES.map(([t,lb])=>{const n=cnt(t);return n||t==='all'?`<button type="button" role="tab" aria-selected="${H.filter===t}" class="chip hub-chip i-${t} ${H.filter===t?'on':''}" data-act="hubFilter" data-v="${t}">${svg(t==='msg'?'attach':t)}${lb} <small>${n}</small></button>`:''}).join('')}</div>
  ${shared?'<p class="note">للموكل أكثر من قضية جارية: الرسائل غير المربوطة بقضية بعينها تظهر في كل قضاياه، وتُميَّز بعلامة «للموكل».</p>':''}
  ${shown.length?`<ol class="hub-list">${shown.map(x=>`<li class="hub-ev t-${x.type}${x.warn?' warn':''}${x.unread?' unread':''}${x.future?' future':''}"><span class="hub-ic i-${x.ic||x.type}" aria-hidden="true">${svg(x.ic||x.type)}</span><div class="hub-body"><div class="hub-top"><b>${e(x.title)}</b>${x.unread?'<span class="pill bad">جديد</span>':''}${x.shared?'<span class="pill">للموكل</span>':''}${x.warn?'<span class="pill warn">يحتاج متابعة</span>':''}<time>${fmtAt(x.at)}</time></div>${x.text?`<p>${e(x.text)}</p>`:''}</div>${x.go?`<button type="button" class="btn sm hub-go" data-act="hubGo" data-v="${e(x.go.join('|'))}">${{tab:'فتح',draft:'عرض',read:'قراءة',bag:'المراسلات',pay:'الأتعاب'}[x.go[0]]||'فتح'}</button>`:x.type==='note'&&can()?`<button type="button" class="btn sm hub-go" data-act="hubNoteDel" data-v="${e(x.id)}">حذف</button>`:''}</li>`).join('')}</ol>`:'<div class="empty">لا أحداث من هذا النوع بعد.</div>'}
  ${list.length>shown.length?`<div class="toolbar" style="justify-content:center"><button class="btn sm" data-act="hubMore">عرض المزيد (${list.length-shown.length})</button></div>`:''}
 </div></section>`}
root.caseHubTab=k=>timeline(k);

/* حقن الرأس والأوامر ومسار التنقل في صفحة القضية، وإضافة تبويب «كل شيء» أولاً */
const vcase=V.case;V.case=()=>{const k=K(S.caseId);let h=vcase();if(!k)return h;const cl=C(k.client)||{};
 h=h.replace(/<div><button class="link" data-act="nav" data-v="cases">→ كل القضايا<\/button><\/div>/,`<nav class="hub-crumbs" aria-label="مسار التنقل"><button class="link" data-act="nav" data-v="clients">الموكلون</button><span>←</span><button class="link" data-act="openClient" data-v="${e(cl.id)}">${e(cl.name||'الموكل')}</button><span>←</span><b class="mono">${e(k.no)}</b><span class="hub-crumb-sp"></span><button class="link" data-act="nav" data-v="cases">كل القضايا</button></nav>`);
 const i=h.indexOf('<div class="tabs">');
 if(i>=0)h=h.slice(0,i)+strip(k)+actions(k)+h.slice(i);
 h=h.replace('<div class="tabs">',`<div class="tabs"><button class="${S.caseTab==='hub'?'on':''}" data-act="caseTab" data-v="hub">كل شيء</button>`);
 return h};
const ctab=root.caseTab;
if(typeof ctab==='function'){root.caseTab=k=>S.caseTab==='hub'?timeline(k):ctab(k)}
/* فتح القضية يبدأ بـ«كل شيء» */
const oc=A.openCase;A.openCase=(v,...r)=>{oc(v,...r);if(S.caseTab!=='hub'){S.caseTab='hub';render()}};
S.caseTab='hub';

/* إضافة مهلة فعلية (لا مجرد فتح التبويب) */
A.hubNewDl=id=>{const k=K(id||S.caseId);if(!k||!can())return;const d=new Date();d.setDate(d.getDate()+7);const dd=d.toISOString().slice(0,10);
 document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog" aria-label="مهلة جديدة" style="max-width:600px"><div class="head"><h1 style="font-size:22px">مهلة جديدة · ${e(k.no||'')}</h1><button class="btn sm" data-act="close">إغلاق</button></div>
 <form class="form" id="hubDlF" data-k="${e(k.id)}"><label class="wide">المهلة / الإجراء<input class="field" id="hubDlT" maxlength="160" required placeholder="مثال: إيداع قائمة البينات"></label><label>الموعد<input class="field" type="date" id="hubDlD" required value="${dd}"></label><label>النوع<select class="field" id="hubDlK"><option>إجرائية</option><option>متابعة</option><option>تقديم بينة</option><option>طعن</option></select></label><div class="wide toolbar"><button class="btn pri">حفظ المهلة</button></div></form></div></div>`;
 document.getElementById('hubDlT').focus()};
document.addEventListener('submit',ev=>{if(ev.target.id!=='hubDlF')return;ev.preventDefault();ev.stopImmediatePropagation();const k=K(ev.target.dataset.k),t=document.getElementById('hubDlT').value.trim(),due=document.getElementById('hubDlD').value;if(!k||!t||!due)return;
 deadlines.push({id:'dl-h'+Date.now().toString(36),k:k.id,title:t.slice(0,160),due,kind:document.getElementById('hubDlK').value,done:false});
 A.close();if(root.MQ&&MQ.saveState)MQ.saveState();render();toast('أُضيفت المهلة')},true);
A.hubTab=v=>{S.caseTab=v;render();setTimeout(()=>{const f=document.querySelector('#page form');if(f){f.scrollIntoView({block:'center'});const i=f.querySelector('input,select,textarea');if(i)i.focus()}},60)};
A.hubFilter=v=>{H.filter=v;H.limit=60;render()};
A.hubMore=()=>{H.limit+=60;render()};
A.hubPay=cid=>{if((S.view==='case'||(S.view==='client'&&S.bagTab==='case'))&&S.caseId)root.MQ_payCase=S.caseId;S.view='client';S.clientId=cid;S.bagTab='acct';window.scrollTo(0,0);render()};
A.hubDraft=id=>A.aiOpen&&A.aiOpen(id);
A.hubAssist=id=>A.asOpen&&A.asOpen(id);
A.hubPrep=()=>A.hpOpen&&A.hpOpen();
A.hubGo=v=>{const [kind,id]=String(v||'').split('|');
 if(kind==='tab')return A.hubTab(id);
 if(kind==='draft')return A.tplDraftOpen?A.tplDraftOpen(id):A.hubTab('docs');
 if(kind==='read'){if(A.rdOpen)return A.rdOpen(id);return A.bag(K(S.caseId).client)}
 if(kind==='bag')return A.bag(id);
 if(kind==='pay')return A.hubPay(id)};
A.hubNote=id=>{const k=K(id);if(!k||!can())return;
 document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog" aria-label="ملاحظة على القضية" style="max-width:640px"><div class="head"><h1 style="font-size:22px">ملاحظة على القضية ${e(k.no)}</h1><button class="btn sm" data-act="close">إغلاق</button></div><form class="form" id="hubNoteF"><label class="wide">الملاحظة<textarea class="field" id="hubNoteT" rows="5" maxlength="3000" required placeholder="ما جرى، اتصال مع الموكل، تعليمات، تذكير…"></textarea></label><div class="wide toolbar"><button class="btn pri">حفظ في سجل القضية</button></div></form></div></div>`;
 document.getElementById('hubNoteT').focus()};
document.addEventListener('submit',ev=>{if(ev.target.id!=='hubNoteF')return;ev.preventDefault();ev.stopImmediatePropagation();const k=K(S.caseId),t=document.getElementById('hubNoteT').value.trim();if(!k||!t)return;
 const n=new Date(),at=today()+' '+String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0');
 k.notes=[...(k.notes||[]),{id:'n'+Date.now().toString(36),at,by:(root.MQ&&MQ.user&&MQ.user.name)||'',text:t.slice(0,3000)}];
 A.close();if(root.MQ&&MQ.saveState)MQ.saveState();H.filter='all';S.caseTab='hub';render();toast('حُفظت الملاحظة في سجل القضية')},true);
A.hubNoteDel=id=>{const k=K(S.caseId);if(!k||!can()||!confirm('حذف هذه الملاحظة؟'))return;k.notes=(k.notes||[]).filter(n=>n.id!==id);if(root.MQ&&MQ.saveState)MQ.saveState();render()};

/* حقيبة الموكل بوابة لقضاياه: بطاقة لكل قضية تفتح ملفها الموحّد */
const vclient=V.client;if(typeof vclient==='function')V.client=()=>{let h=vclient();const c=C(S.clientId);if(!c)return h;
 const ks=cases.filter(k=>k.client===c.id);
 const cards=ks.length?ks.map(k=>{const f=facts(k,DATA(),today());return `<button type="button" class="hub-case" data-act="openCase" data-v="${e(k.id)}"><span class="mono">${e(k.no)}</span><b>${e(k.subject||'')}</b><small>${e((CT(k.court)||{}).name||'')} · ${e(k.status||'')}</small><small>${f.next?'الجلسة القادمة '+fmtAt(f.next.date):'لا جلسة قادمة'}${f.unread?' · '+f.unread+' رسالة جديدة':''}</small></button>`}).join(''):`<div class="m">لا قضايا لهذا الموكل بعد.</div>`;
 const box=`<section class="hub-cases"><header><b>قضايا الموكل (${ks.length})</b><span class="m">افتح القضية لترى كل بياناتها وتحديثاتها في صفحة واحدة</span>${can()?`<button type="button" class="btn sm" data-act="caseFor" data-v="${e(c.id)}">+ قضية جديدة لهذا الموكل</button>`:''}</header><div class="hub-case-row">${cards}</div></section>`;
 const i=h.indexOf('</section>',h.indexOf('class="bag-head"'));
 return i>=0?h.slice(0,i+10)+box+h.slice(i+10):box+h};

const css=document.createElement('style');css.textContent=`
.hub-crumbs{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:14px;color:var(--muted)}.hub-crumbs b{color:var(--ink)}.hub-crumb-sp{flex:1}
.hub-strip{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:12px 0}
.hub-f{all:unset;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;gap:3px;border:1px solid var(--line);background:var(--panel,#fff);border-radius:12px;padding:10px 12px;min-width:0}
div.hub-f{cursor:default}.hub-f:hover{border-color:var(--brass)}.hub-f span{font-size:12px;color:var(--muted)}.hub-f b{font-size:15px;color:var(--ink)}.hub-f small{font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hub-f.urgent{border-inline-start:3px solid #b91c1c}.hub-f.warn{border-inline-start:3px solid #b8863d}.hub-f.ok b{color:var(--ok,#1f7a4d)}
.hub-acts{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px;padding:10px;border:1px dashed var(--line);border-radius:12px;background:var(--surface)}
.hub-filters{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}.hub-filters small{color:var(--muted);padding-inline-start:3px}
.hub-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.hub-ev{display:flex;gap:12px;align-items:flex-start;border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:var(--panel,#fff)}
.hub-ev.warn{border-inline-start:3px solid #b8863d}.hub-ev.unread{border-inline-start:3px solid #b91c1c}.hub-ev.future{background:var(--accent-soft)}
.hub-ic{width:32px;height:32px;flex:none;border-radius:10px;display:grid;place-items:center;background:var(--ic-bg,#F3EEE2);color:var(--ic,#7A6A48);border:1px solid color-mix(in srgb,var(--ic,#7A6A48) 28%,transparent)}
.i-msg{--ic:#2F6B9A;--ic-bg:#E8F0F7}.i-attach{--ic:#6B4FA0;--ic-bg:#EFEAF7}.i-image{--ic:#2E7D74;--ic-bg:#E5F3F1}.i-voice{--ic:#B0563A;--ic-bg:#F8ECE7}.i-notice{--ic:#9A7B1F;--ic-bg:#F8F1DC}
.i-hearing{--ic:#1D3557;--ic-bg:#E7ECF3}.i-deadline{--ic:#B23A3A;--ic-bg:#F9E9E9}.i-doc{--ic:#5B6470;--ic-bg:#EEF0F2}.i-draft{--ic:#8A5A12;--ic-bg:#F6EEDF}.i-pay{--ic:#2F7D4A;--ic-bg:#E6F3EA}.i-mz{--ic:#3D6E8F;--ic-bg:#E6EFF4}.i-note{--ic:#A57A00;--ic-bg:#FFF4C9}.i-all{--ic:#7A6A48;--ic-bg:#F3EEE2}
.hub-chip svg{width:14px;height:14px;vertical-align:-2px;margin-inline-end:5px;color:var(--ic)}.hub-chip.on svg{color:inherit}
.hub-acts .btn svg{width:15px;height:15px;vertical-align:-3px;margin-inline-end:5px}
.hub-body{flex:1;min-width:0}.hub-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.hub-top time{margin-inline-start:auto;font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums}
.hub-body p{margin:4px 0 0;font-size:13.5px;color:var(--muted);line-height:1.7;overflow-wrap:anywhere}.hub-go{flex:none}
.hub-cases{margin:14px 0;border:1px solid var(--line);border-radius:14px;padding:12px;background:var(--panel,#fff)}.hub-cases header{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px}.hub-cases header .btn{margin-inline-start:auto}
.hub-case-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
.hub-case{all:unset;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;gap:4px;border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:var(--surface)}.hub-case:hover{border-color:var(--brass)}.hub-case small{color:var(--muted);font-size:12px}
@media(max-width:1000px){.hub-strip{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:600px){.hub-strip{grid-template-columns:1fr 1fr}.hub-ev{flex-wrap:wrap}.hub-go{width:100%}}`;document.head.appendChild(css);
})(typeof window==='undefined'?null:window);
