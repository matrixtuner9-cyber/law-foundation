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
/* ما يفتحه كل صندوق في المخطط: [وصف قصير يظهر تحت العنوان، الإجراء] */
const goCase=(k,tab,after)=>{S.view='case';S.caseId=k.id;S.caseTab=tab;window.scrollTo(0,0);render();if(after)setTimeout(after,60)};
const goTpl=(k,g)=>{S.tplCase=k.id;S.view='tpls';render();if(A.ptCategory)A.ptCategory(g);window.scrollTo(0,0)};
const goBag=(k,tab)=>{S.view='client';S.clientId=k.client;S.bagTab=tab;window.scrollTo(0,0);render()};
const track=(k,lvl)=>goCase(k,'track',()=>{const s=document.getElementById(lvl?'mL':'fDec');if(!s)return;if(lvl){s.value=lvl;s.dispatchEvent(new Event('change',{bubbles:true}))}const f=s.closest('form')||s;f.scrollIntoView({block:'center'});const i=f.querySelector('input,select');if(i)i.focus()});
const choose=(title,opts)=>{document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog" aria-label="${esc(title)}"><div class="head"><h1 style="font-size:22px">${esc(title)}</h1><button class="btn sm" data-act="close">إغلاق</button></div><div class="list">${opts.map((o,i)=>`<button class="row clk" data-act="wfPick" data-v="${i}"><div><div class="t">${esc(o[0])}</div><div class="m">${esc(o[1])}</div></div></button>`).join('')}</div></div></div>`;PICK=opts};
let PICK=null;A.wfPick=v=>{const o=PICK&&PICK[+v];A.close();if(o)o[2]()};
const GO={
 1:['وكالة خاصة من النماذج',k=>goTpl(k,'التوكيلات')],
 2:['فتح ملف قضية جديدة للموكل',k=>{if(A.caseFor)A.caseFor(k.client)}],
 3:['شاشة جمع وتوثيق المعلومات',k=>goCase(k,'gather')],
 4:['الدراسة القانونية والتوصية',k=>goCase(k,'study')],
 5:['إنذار قانوني أو اتفاقية تسوية',k=>choose('الحل الودي',[['إنذار قانوني','نموذج إنذار جاهز يُملأ من بيانات القضية',()=>goTpl(k,'الإنذارات')],['اتفاقية تسوية وأقساط','جدول سداد وتسجيل دفعات وطباعة',()=>{goBag(k,'settle');setTimeout(()=>{const b=document.querySelector('[data-act="stNew"]');if(b)b.click()},80)}],['تسجيل محضر تفاوض','ملاحظة مؤرخة في سجل القضية',()=>{if(A.hubNote)A.hubNote(k.id)}]])],
 90:['إقفال الملف بعد التسوية',k=>track(k,'تسوية ودية')],
 6:['لائحة الدعوى من النماذج',k=>choose('إعداد اللائحة',[['نموذج لائحة جاهز','يُملأ من بيانات القضية ويُحفظ مسودة',()=>goTpl(k,'اللوائح والدفوع')],['صياغة بالمساعد','صياغة بالصوت أو النص مع مراجعة قانونية',()=>{if(A.aiOpen)A.aiOpen(k.id)}]])],
 7:['تسجيل رقم الدعوى والمحكمة',k=>regModal(k)],
 8:['تسجيل مهلة التبليغ',k=>goCase(k,'hub',()=>{if(A.hubTab)A.hubTab('deadlines')})],
 9:['إضافة الجلسة الأولى',k=>goCase(k,'hearings',()=>{const f=document.getElementById('fH');if(f)f.scrollIntoView({block:'center'})})],
 10:['اللوائح الجوابية والدفوع',k=>goTpl(k,'اللوائح والدفوع')],
 11:['مصفوفة البينات في ملف 360°',k=>goCase(k,'c360',()=>{if(A.c360Section)A.c360Section('evidence')})],
 12:['جلسة النطق بالحكم',k=>goCase(k,'hearings',()=>{const p=document.getElementById('hP');if(p){p.value='النطق بالحكم';p.closest('form').scrollIntoView({block:'center'})}})],
 13:['تسجيل الحكم ومهلة الطعن',k=>track(k)],
 14:['إبلاغ الموكل بالحكم',k=>{const d=(k.decisions||[]).slice(-1)[0];goBag(k,'msgs');setTimeout(()=>{const t=document.getElementById('bagT');if(t){t.value='تحية طيبة، نفيدكم بأنه صدر الحكم في قضيتكم رقم '+k.no+(d?' بتاريخ '+dmy(d.date)+(d.text?': '+d.text:''):'')+'. وقد درسنا الحكم، ونقترح موعداً لمناقشة الخطوة التالية (الطعن أو التنفيذ).';t.dispatchEvent(new Event('input'));t.focus()}},120)}],
 15:['نموذج الطعن أو حاسبة المهلة',k=>choose('الطعن والاستئناف',[['نموذج استئناف / طعن','من النماذج الجاهزة',()=>goTpl(k,'الطعون')],['حاسبة مهلة الطعن','احسب آخر يوم للطعن',()=>{S.view='calc';render()}],['مهل الطعن المسجلة','من الأحكام المسجلة في مسار التقاضي',()=>goCase(k,'track')]])],
 16:['نقل القضية إلى الاستئناف',k=>track(k,'استئناف')],
 17:['تسجيل الحكم النهائي',k=>track(k)],
 18:['تاريخ اكتساب الدرجة القطعية',k=>finalModal(k)],
 19:['نقل القضية إلى التنفيذ',k=>track(k,'تنفيذ')],
 20:['مهل وإجراءات التنفيذ',k=>goCase(k,'hub',()=>{if(A.hubTab)A.hubTab('deadlines')})],
 21:['تحصيل المبالغ والدفعات',k=>goBag(k,'settle')],
 22:['إقفال الملف وأرشفته',k=>closeModal(k)]};
function regModal(k){document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog"><div class="head"><h1 style="font-size:22px">تسجيل الدعوى لدى المحكمة</h1><button class="btn sm" data-act="close">إغلاق</button></div><form class="form" id="fWfReg">
 <label>رقم الدعوى<input class="field mono" id="wrNo" value="${esc(k.no||'')}" placeholder="0000/2026" required></label><label>تاريخ التسجيل<input class="field" type="date" id="wrD" value="${esc(k.opened||iso(TODAY))}"></label>
 <label class="wide">المحكمة<select class="field" id="wrC">${courts.map(c=>`<option value="${c.id}" ${c.id===k.court?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label>
 <label class="wide">ملاحظة (الرسوم، رقم الإيصال…)<input class="field" id="wrN"></label>
 <button class="btn pri">حفظ والانتقال إلى التبليغات</button></form></div></div>`;document.getElementById('wrNo').focus()}
function finalModal(k){const f=k.final||{};document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog"><div class="head"><h1 style="font-size:22px">اكتساب الحكم الدرجة القطعية</h1><button class="btn sm" data-act="close">إغلاق</button></div><form class="form" id="fWfFinal">
 <label>تاريخ اكتساب الدرجة القطعية<input class="field" type="date" id="wfD" value="${esc(f.date||iso(TODAY))}" required></label><label>السبب<select class="field" id="wfW">${['انقضاء مدة الطعن دون طعن','صدور حكم الاستئناف','صدور قرار النقض','تنازل عن الطعن'].map(x=>`<option ${f.why===x?'selected':''}>${x}</option>`).join('')}</select></label>
 <label class="wide">ملاحظة<input class="field" id="wfN" value="${esc(f.note||'')}"></label>
 <button class="btn pri">حفظ والانتقال إلى التنفيذ</button></form></div></div>`}
function closeModal(k){document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog"><div class="head"><h1 style="font-size:22px">إقفال الملف وأرشفته</h1><button class="btn sm" data-act="close">إغلاق</button></div><form class="form" id="fWfClose">
 <label>تاريخ الإقفال<input class="field" type="date" id="wcD" value="${iso(TODAY)}" required></label><label>النتيجة النهائية<select class="field" id="wcR">${['تحصيل الحق كاملاً','تحصيل جزئي','تسوية ودية','رد الدعوى','تنازل الموكل','أخرى'].map(x=>`<option>${x}</option>`).join('')}</select></label>
 <label class="wide">رقم الأرشفة / مكان الملف الورقي<input class="field" id="wcA" placeholder="مثال: خزانة 3 — رف ب"></label>
 <p class="note wide">تُنقل القضية إلى «منتهية» ويبقى ملفها كاملاً للرجوع إليه.</p>
 <button class="btn pri" style="background:var(--danger)">إقفال الملف</button></form></div></div>`}
document.addEventListener('submit',e=>{const f=e.target;if(!['fWfReg','fWfFinal','fWfClose'].includes(f.id))return;e.preventDefault();e.stopImmediatePropagation();
 if(root.MQ&&MQ.readOnly)return toast('صلاحيتك للاطلاع فقط');const k=K(WK);if(!k)return;const g=id=>(document.getElementById(id)||{}).value||'';
 if(f.id==='fWfReg'){k.no=g('wrNo').trim()||k.no;k.opened=g('wrD')||k.opened;k.court=g('wrC')||k.court;if(g('wrN').trim())k.regNote=g('wrN').trim();k.flowAt=8;k.step=Math.max(k.step||0,0);A.close();saveK();toast('سُجّلت الدعوى برقم '+k.no);goCase(k,'hub',()=>{if(A.hubTab)A.hubTab('deadlines')})}
 if(f.id==='fWfFinal'){k.final={date:g('wfD'),why:g('wfW'),note:g('wfN').trim()};k.stage='حكم قطعي';k.flowAt=19;A.close();saveK();toast('سُجّل اكتساب الحكم الدرجة القطعية');track(k,'تنفيذ')}
 if(f.id==='fWfClose'){k.status='منتهية';k.stage='مقفلة ومؤرشفة';k.closed={date:g('wcD'),result:g('wcR'),archive:g('wcA').trim()};k.flowAt=22;k.step=Math.max(k.step||0,5);A.close();saveK();toast('أُقفل الملف وأُرشف');goBag(k,'cases')}
});
/* متابعة ما يُسجَّل في «مسار التقاضي» لتحريك المخطط تلقائياً */
document.addEventListener('submit',e=>{const f=e.target;if(!['fDec','fMove'].includes(f.id)||!S.caseId)return;const k=K(S.caseId);if(!k)return;
 if(f.id==='fMove'){const l=(document.getElementById('mL')||{}).value;k.flowAt=l==='استئناف'||l==='نقض'?16:l==='تنفيذ'?19:l==='تسوية ودية'?90:k.flowAt}
 if(f.id==='fDec'&&(document.getElementById('dT')||{}).value!=='interim'){const lv=(k.track||[]).slice(-1)[0];k.flowAt=lv&&/استئناف|نقض/.test(lv.lvl||'')?17:13}},true);
let WK=null;const saveK=()=>{if(root.MQ&&MQ.saveState)MQ.saveState()};
A.wfGo=v=>{const [a,b]=String(v).split('|'),k=K(b?a:S.caseId),id=+(b||a),g=GO[id];if(!k)return;WK=k.id;if(!g)return;if(root.MQ&&MQ.readOnly&&![3,4,11,13,15,17,20].includes(id))return toast('صلاحيتك للاطلاع فقط');g[1](k)};
const node=(n,cur,label,kid)=>{const st=state(n.id,cur);
 return `<div class="wf-n ${st}"><button class="wf-go" data-act="wfGo" data-v="${kid?kid+'|':''}${n.id}" title="${esc(GO[n.id]?GO[n.id][0]:'')}"><span class="wf-i">${n.i}</span><b>${esc(n.t)}</b>${GO[n.id]?`<small class="wf-h">${esc(GO[n.id][0])}</small>`:''}</button><span class="wf-no">${label||n.id}</span>${st==='cur'?'<em>المرحلة الحالية</em>':`<button class="wf-pin" data-act="wfAt" data-v="${kid?kid+'|':''}${n.id}" title="تعيين كمرحلة حالية" aria-label="تعيين كمرحلة حالية">⚑</button>`}</div>`};
const arrow='<div class="wf-ar" aria-hidden="true">↓</div>';
let KID=null;
const chain=(ids,cur)=>ids.map((id,i)=>(i?arrow:'')+node(byId[id],cur,null,KID)).join('');
const dec=(q,yes,no)=>`<div class="wf-d"><div class="wf-q">${q}</div><div class="wf-yn"><span class="y">نعم: ${yes}</span><span class="n">لا: ${no}</span></div></div>`;

function body(k){KID=k.id;const cur=currentId(k),mk=byId[cur],ST=window.STEPS||[];
 return `<section class="panel wf"><header><h2>مخطط سير القضية</h2><span class="pill">${mk?esc(mk.t):''}</span></header><div class="bd">
 <p class="wf-note">المسار التقليدي من التوكيل حتى التنفيذ أو الإقفال. اضغط أي صندوق لفتح إجرائه مباشرة، والعلم ⚑ لتعيين المرحلة الحالية للقضية (تُحدَّث «خطوة القضية» تلقائياً${ST.length?': '+esc(ST[mk?mk.s:0]||''):''}).</p>
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
root.MQ_flow={body,bag};root.MQ_wf=api;
}(typeof window!=='undefined'?window:globalThis));
