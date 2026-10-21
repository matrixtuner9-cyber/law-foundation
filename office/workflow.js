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
const api={N,MAIN,byId,firstOf,currentId,state};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof A==='undefined'||typeof document==='undefined')return;

const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const node=(n,cur,label)=>{const st=state(n.id,cur);
 return `<button class="wf-n ${st}" data-act="wfAt" data-v="${n.id}" title="اضغط لتحديد هذه المرحلة كمرحلة القضية الحالية"><span class="wf-i">${n.i}</span><b>${esc(n.t)}</b><span class="wf-no">${label||n.id}</span>${st==='cur'?'<em>المرحلة الحالية</em>':''}</button>`};
const arrow='<div class="wf-ar" aria-hidden="true">↓</div>';
const chain=(ids,cur)=>ids.map((id,i)=>(i?arrow:'')+node(byId[id],cur)).join('');
const dec=(q,yes,no)=>`<div class="wf-d"><div class="wf-q">${q}</div><div class="wf-yn"><span class="y">نعم: ${yes}</span><span class="n">لا: ${no}</span></div></div>`;

function body(k){const cur=currentId(k),mk=byId[cur],ST=window.STEPS||[];
 return `<section class="panel wf"><header><h2>مخطط سير القضية</h2><span class="pill">${mk?esc(mk.t):''}</span></header><div class="bd">
 <p class="wf-note">المسار التقليدي من التوكيل حتى التنفيذ أو الإقفال. اضغط أي مرحلة لتحديدها مرحلةً حالية للقضية (تُحدَّث «خطوة القضية» تلقائياً${ST.length?': '+esc(ST[mk?mk.s:0]||''):''}).</p>
 <div class="wf-grid">
  <div class="wf-col"><h3>١ · التهيئة والدراسة</h3>${chain([1,2,3,4],cur)}${arrow}${dec('هل يمكن الحل وديّاً؟','تفاوض وتسوية','إلى رفع الدعوى')}</div>
  <div class="wf-col wf-side"><h3>الحل الودي</h3>${node(byId[5],cur,'5')}${arrow}${dec('هل تمت التسوية؟','إقفال الملف','المتابعة بالدعوى')}${arrow}${node(byId[90],cur,'✓')}</div>
  <div class="wf-col"><h3>٢ · التقاضي أمام المحكمة</h3>${chain([6,7,8,9,10,11,12,13,14],cur)}${arrow}${dec('هل يوجد طعن أو استئناف؟','استئناف/طعن','الحكم النهائي')}</div>
  <div class="wf-col wf-side"><h3>الطعن والاستئناف</h3>${chain([15,16],cur)}<div class="wf-m">ثم يعود المسار إلى «الحكم النهائي»</div></div>
  <div class="wf-col"><h3>٣ · الحكم النهائي والتنفيذ</h3>${chain([17,18,19,20,21,22],cur)}</div>
 </div></div></section>`}

A.wfAt=v=>{if(root.MQ&&MQ.readOnly){toast('صلاحيتك للاطلاع فقط');return}
 const k=K(S.caseId),n=byId[+v];if(!k||!n)return;k.flowAt=n.id;k.step=n.s;
 if(root.MQ&&MQ.saveState)MQ.saveState();render();toast('حُدّدت المرحلة: '+n.t)};
root.MQ_flow={body};
}(typeof window!=='undefined'?window:globalThis));
