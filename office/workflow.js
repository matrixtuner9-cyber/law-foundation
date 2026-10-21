/* مخطط سير القضية التقليدي منذ التوكيل حتى التنفيذ أو الإقفال — تبويب في ملف القضية */
(function(root){
'use strict';
/* s = رقم المرحلة في STEPS: 0 التسجيل 1 تبادل اللوائح 2 البينات 3 المرافعة 4 الحكم 5 التنفيذ */
const N=[
 {id:1,t:'توكيل المحامي',s:0,i:'🤝'},{id:2,t:'فتح ملف القضية',s:0,i:'📁'},{id:3,t:'جمع المعلومات والمستندات',s:0,i:'📄'},{id:4,t:'الدراسة القانونية والتقييم الأولي',s:0,i:'⚖️'},
 {id:5,t:'تفاوض / إنذار قانوني / تسوية',s:0,i:'💬',br:'amic'},{id:6,t:'إعداد اللائحة أو الدعوى',s:0,i:'📝'},{id:7,t:'تسجيل الدعوى لدى المحكمة المختصة',s:0,i:'🏛️'},
 {id:8,t:'التبليغات',s:1,i:'✉️'},{id:9,t:'الجلسات الأولى',s:1,i:'👥'},{id:10,t:'تبادل اللوائح والدفوع',s:1,i:'📑'},{id:11,t:'تقديم البينات والمرافعات',s:2,i:'🗂️'},
 {id:12,t:'حجز القضية للحكم',s:3,i:'🔨'},{id:13,t:'صدور الحكم',s:4,i:'📜'},{id:14,t:'دراسة الحكم وتبليغه للموكل',s:4,i:'📋'},
 {id:15,t:'استئناف / طعن',s:4,i:'📄',br:'appeal'},{id:16,t:'إجراءات الطعن والفصل فيه',s:4,i:'🏛️',br:'appeal'},
 {id:17,t:'الحكم النهائي',s:4,i:'🔨'},{id:18,t:'اكتساب الحكم الدرجة القطعية',s:4,i:'✅'},{id:19,t:'فتح ملف التنفيذ',s:5,i:'📁'},{id:20,t:'إجراءات التنفيذ',s:5,i:'⚙️'},
 {id:21,t:'تحصيل الحق أو إنهاء التنفيذ',s:5,i:'💰'},{id:22,t:'إقفال الملف وأرشفته',s:5,i:'🗄️'},
 {id:90,t:'إقفال الملف (تمت التسوية)',s:5,i:'✅',br:'amic'}];
const byId=Object.fromEntries(N.map(n=>[n.id,n]));
/* المسار الرئيسي المتسلسل للقضية التي تمضي إلى المحكمة */
const MAIN=[1,2,3,4,6,7,8,9,10,11,12,13,14,17,18,19,20,21,22];
function firstOf(step){const n=N.find(x=>x.s===(step||0)&&MAIN.includes(x.id));return n?n.id:1}
function currentId(k){return k&&byId[k.flowAt]?k.flowAt:firstOf(k&&k.step)}
function state(id,cur){if(id===cur)return'cur';const a=MAIN.indexOf(id),b=MAIN.indexOf(cur);
 if(a<0||b<0)return id===90||id===5?'':'';return a<b?'done':''}
const PH=[{id:'prep',t:'التهيئة والدراسة',n:[1,2,3,4]},{id:'amic',t:'الحل الودي',n:[5,90],side:true},{id:'court',t:'التقاضي أمام المحكمة',n:[6,7,8,9,10,11,12,13,14]},{id:'appeal',t:'الطعن والاستئناف',n:[15,16],side:true},{id:'final',t:'الحكم النهائي والتنفيذ',n:[17,18,19,20,21,22]}];
function phaseOf(cur){return PH.find(p=>p.n.includes(cur))||PH[0]}
function phaseState(p,cur){const c=phaseOf(cur);if(p===c)return'cur';if(p.side)return cur===90&&p.id==='amic'?'done':'';
 const last=p.n[p.n.length-1],a=MAIN.indexOf(last),b=MAIN.indexOf(cur);return a>=0&&b>a?'done':(cur===90?'done':'')}
const api={N,MAIN,PH,byId,firstOf,currentId,state,phaseOf,phaseState};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof A==='undefined'||typeof document==='undefined')return;

const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const node=(n,cur,label,kid)=>{const st=state(n.id,cur);
 return `<button class="wf-n ${st}" data-act="wfAt" data-v="${kid?kid+'|':''}${n.id}" title="اضغط لتحديد هذه المرحلة كمرحلة القضية الحالية"><span class="wf-i">${n.i}</span><b>${esc(n.t)}</b><span class="wf-no">${label||n.id}</span>${st==='cur'?'<em>المرحلة الحالية</em>':''}</button>`};
const arrow='<div class="wf-ar" aria-hidden="true">↓</div>';
let KID=null;
const chain=(ids,cur)=>ids.map((id,i)=>(i?arrow:'')+node(byId[id],cur,null,KID)).join('');
const dec=(q,yes,no)=>`<div class="wf-d"><div class="wf-q">${q}</div><div class="wf-yn"><span class="y">نعم: ${yes}</span><span class="n">لا: ${no}</span></div></div>`;

function body(k){KID=k.id;const cur=currentId(k),mk=byId[cur],ST=window.STEPS||[];
 return `<section class="panel wf"><header><h2>مخطط سير القضية</h2><span class="pill">${mk?esc(mk.t):''}</span></header><div class="bd">
 <p class="wf-note">المسار التقليدي من التوكيل حتى التنفيذ أو الإقفال. اضغط أي مرحلة لتحديدها مرحلةً حالية للقضية (تُحدَّث «خطوة القضية» تلقائياً${ST.length?': '+esc(ST[mk?mk.s:0]||''):''}).</p>
 <div class="wf-grid">
  <div class="wf-col"><h3>١ · التهيئة والدراسة</h3>${chain([1,2,3,4],cur)}${arrow}${dec('هل يمكن الحل وديّاً؟','تفاوض وتسوية','إلى رفع الدعوى')}</div>
  <div class="wf-col wf-side"><h3>الحل الودي</h3>${node(byId[5],cur,'5',KID)}${arrow}${dec('هل تمت التسوية؟','إقفال الملف','المتابعة بالدعوى')}${arrow}${node(byId[90],cur,'✓',KID)}</div>
  <div class="wf-col"><h3>٢ · التقاضي أمام المحكمة</h3>${chain([6,7,8,9,10,11,12,13,14],cur)}${arrow}${dec('هل يوجد طعن أو استئناف؟','استئناف/طعن','الحكم النهائي')}</div>
  <div class="wf-col wf-side"><h3>الطعن والاستئناف</h3>${chain([15,16],cur)}<div class="wf-m">ثم يعود المسار إلى «الحكم النهائي»</div></div>
  <div class="wf-col"><h3>٣ · الحكم النهائي والتنفيذ</h3>${chain([17,18,19,20,21,22],cur)}</div>
 </div></div></section>`}

A.wfAt=v=>{if(root.MQ&&MQ.readOnly){toast('صلاحيتك للاطلاع فقط');return}
 const [a,b]=String(v).split('|'),k=K(b?a:S.caseId),n=byId[+(b||a)];if(!k||!n)return;k.flowAt=n.id;k.step=n.s;
 if(root.MQ&&MQ.saveState)MQ.saveState();render();toast('حُدّدت المرحلة: '+n.t)};
/* حقيبة الموكل: قضايا الموكل مرتبة على مسار السير */
function bag(c,ks){
 if(!ks.length)return '<section class="panel"><div class="empty">لا قضايا لهذا الموكل بعد. تبدأ الحقيبة بالتوكيل وفتح ملف القضية.</div></section>';
 return ks.map(k=>{const cur=currentId(k),ph=phaseOf(cur),mk=byId[cur];
  const hs=(root.hearings||[]).filter(h=>h.k===k.id),nh=root.nextH?nextH(k.id):null,ds=(root.docs||[]).filter(d=>d.k===k.id),dl=(root.deadlines||[]).filter(d=>d.k===k.id&&diff(d.due)>=0),st=(k.settles||[]).length;
  const info={prep:ds.length+' مستند',amic:st?st+' اتفاقية تسوية':'لا تسوية',court:hs.length+' جلسة'+(nh?' · القادمة '+dmy(nh.date):''),appeal:'',final:dl.length?dl.length+' مهلة قائمة':esc(k.status)};
  const steps=PH.map(p=>{const s2=phaseState(p,cur);return `<div class="wfs ${s2} ${p.side?'side':''}"><i>${s2==='done'?'✓':''}</i><b>${p.t}</b><small>${info[p.id]||''}</small></div>`}).join('');
  const nodes=ph.n.map(id=>node(byId[id],cur,null,k.id)).join('');
  const open=S.wfOpen===k.id;
  return `<section class="panel wf-case"><header><h2>${esc(k.subject)}</h2><span class="mono">${esc(k.no)}</span><span class="pill">${esc(mk.t)}</span><span class="grow"></span>${ph.id==='amic'||st?`<button class="btn sm" data-act="bagTab" data-v="settle">التسويات</button>`:''}<button class="btn sm" data-act="openCase" data-v="${k.id}">فتح ملف القضية</button></header>
  <div class="bd"><div class="wf-steps">${steps}</div>
  <div class="wf-nodes"><div class="wf-ph">${esc(ph.t)}</div><div class="wf-row">${nodes}</div></div>
  <button class="link" data-act="wfOpen" data-v="${k.id}">${open?'إخفاء المخطط الكامل':'عرض المخطط الكامل للقضية'}</button>${open?body(k):''}</div></section>`}).join('')}
A.wfOpen=v=>{S.wfOpen=S.wfOpen===v?null:v;render()};
root.MQ_flow={body,bag};
}(typeof window!=='undefined'?window:globalThis));
