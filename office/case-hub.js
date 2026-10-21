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
  out.push({type:'msg',at:m.at,title:(mine?kind+' إلى الموكل':kind+' من الموكل')+(m.ch?' · '+m.ch:''),text:m.type==='file'||m.type==='image'?(m.name||''):String(m.t||'').slice(0,220),unread:!!m.unread,shared:!m.k&&!onlyCase,go:m.type==='file'||m.type==='image'?['read',m.id]:['bag',k.client]})}
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
const ICON={msg:'✉',hearing:'⚖',deadline:'⏳',doc:'📄',draft:'✎',pay:'₪',mz:'⟳',note:'🗒'};
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
 return `<div class="hub-acts" role="toolbar" aria-label="أوامر القضية">${b('hubTab','hearings','+ جلسة')}${b('hubTab','deadlines','+ مهلة')}${b('hubTab','docs','+ مستند')}${b('hubPay',k.client,'+ دفعة')}${b('hubNote',k.id,'+ ملاحظة')}${b('bag',k.client,'مراسلة الموكل')}${A.aiOpen?b('hubDraft',k.id,'🎙 صياغة لائحة'):''}${A.hpOpen?b('hubPrep',k.id,'تحضير جلسة'):''}${A.asOpen?b('hubAssist',k.id,'مساعد القضية'):''}${b('printCase',k.id,'طباعة ملف القضية')}</div>`}
function timeline(k){const all=events(k,DATA(),today()),list=H.filter==='all'?all:all.filter(x=>x.type===H.filter),shown=list.slice(0,H.limit);
 const cnt=t=>t==='all'?all.length:all.filter(x=>x.type===t).length;
 const shared=all.some(x=>x.shared);
 return `<section class="panel hub-tl"><header><h2>سجل القضية</h2><span class="m">كل ما يخص القضية من مصادره الأصلية، الأحدث أولاً</span></header><div class="bd">
  <div class="hub-filters" role="tablist">${TYPES.map(([t,lb])=>{const n=cnt(t);return n||t==='all'?`<button type="button" role="tab" aria-selected="${H.filter===t}" class="chip ${H.filter===t?'on':''}" data-act="hubFilter" data-v="${t}">${lb} <small>${n}</small></button>`:''}).join('')}</div>
  ${shared?'<p class="note">للموكل أكثر من قضية جارية: الرسائل غير المربوطة بقضية بعينها تظهر في كل قضاياه، وتُميَّز بعلامة «للموكل».</p>':''}
  ${shown.length?`<ol class="hub-list">${shown.map(x=>`<li class="hub-ev t-${x.type}${x.warn?' warn':''}${x.unread?' unread':''}${x.future?' future':''}"><span class="hub-ic" aria-hidden="true">${ICON[x.type]||'•'}</span><div class="hub-body"><div class="hub-top"><b>${e(x.title)}</b>${x.unread?'<span class="pill bad">جديد</span>':''}${x.shared?'<span class="pill">للموكل</span>':''}${x.warn?'<span class="pill warn">يحتاج متابعة</span>':''}<time>${fmtAt(x.at)}</time></div>${x.text?`<p>${e(x.text)}</p>`:''}</div>${x.go?`<button type="button" class="btn sm hub-go" data-act="hubGo" data-v="${e(x.go.join('|'))}">${{tab:'فتح',draft:'عرض',read:'قراءة',bag:'المراسلات',pay:'الأتعاب'}[x.go[0]]||'فتح'}</button>`:x.type==='note'&&can()?`<button type="button" class="btn sm hub-go" data-act="hubNoteDel" data-v="${e(x.id)}">حذف</button>`:''}</li>`).join('')}</ol>`:'<div class="empty">لا أحداث من هذا النوع بعد.</div>'}
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

A.hubTab=v=>{S.caseTab=v;render();setTimeout(()=>{const f=document.querySelector('#page form');if(f){f.scrollIntoView({block:'center'});const i=f.querySelector('input,select,textarea');if(i)i.focus()}},60)};
A.hubFilter=v=>{H.filter=v;H.limit=60;render()};
A.hubMore=()=>{H.limit+=60;render()};
A.hubPay=cid=>{if(S.view==='case'&&S.caseId)root.MQ_payCase=S.caseId;S.view='client';S.clientId=cid;S.bagTab='acct';window.scrollTo(0,0);render()};
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
.hub-ic{width:30px;height:30px;flex:none;border-radius:50%;display:grid;place-items:center;background:var(--surface);border:1px solid var(--line);font-size:14px}
.hub-body{flex:1;min-width:0}.hub-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.hub-top time{margin-inline-start:auto;font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums}
.hub-body p{margin:4px 0 0;font-size:13.5px;color:var(--muted);line-height:1.7;overflow-wrap:anywhere}.hub-go{flex:none}
.hub-cases{margin:14px 0;border:1px solid var(--line);border-radius:14px;padding:12px;background:var(--panel,#fff)}.hub-cases header{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px}.hub-cases header .btn{margin-inline-start:auto}
.hub-case-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
.hub-case{all:unset;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;gap:4px;border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:var(--surface)}.hub-case:hover{border-color:var(--brass)}.hub-case small{color:var(--muted);font-size:12px}
@media(max-width:1000px){.hub-strip{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:600px){.hub-strip{grid-template-columns:1fr 1fr}.hub-ev{flex-wrap:wrap}.hub-go{width:100%}}`;document.head.appendChild(css);
})(typeof window==='undefined'?null:window);
