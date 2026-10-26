/* سير القضية في المكتب: إحدى عشرة خطوة من الاستقبال حتى الإغلاق والأرشفة (حسب دليل المكتب)
   مبادئ العمل: لا إجراء دون مستند · لا استشهاد دون مصدر · لا انتقال دون استكمال المرحلة · لا اعتماد نهائي دون مراجعة المحامي.
   كل خطوة: شرط إنجاز يُقرأ من بيانات القضية + زر واحد يفتح إجراءها. الخطوة التالية تُفتح فقط بعد إنجاز ما قبلها. */
(function(root){
'use strict';
const reg=k=>!!(k&&((k.no&&k.no!=='قيد التسجيل')||k.complaintNo));
const merits=k=>(k&&k.decisions||[]).some(d=>d.kind!=='interim');
const closed=k=>!!(k&&(k.status==='منتهية'||k.closed));
function steps(k,D){D=D||{};const docs=(D.docs||[]).filter(d=>d.k===k.id),need=((k.gather||{}).need)||[],miss=need.filter(n=>n.st==='client'||n.st==='agency').length,s=k.study||{},g=k.gate||{};
 const legacy=reg(k)||merits(k)||closed(k); /* قضايا سُجّلت قبل هذا الدليل: مراحلها الأولى تُعدّ مستكملة */
 const L=(v)=>v||legacy;
 return [
  {n:1,id:'intake',t:'الاستقبال الأولي',d:'بيانات الموكل، ملخص المشكلة، المستندات الأولية',done:L(!!((k.gather||{}).facts||k.intake))},
  {n:2,id:'conflict',t:'فحص تعارض المصالح',d:'التحقق من الأطراف ومنع التعارض',done:L(!!g.conflictOk)},
  {n:3,id:'study',t:'الدراسة الأولية',d:'الاختصاص، المهل، قابلية الدعوى، الإجراء العاجل',done:L(!!(s.rec&&s.rec!=='more'))},
  {n:4,id:'fees',t:'اتفاق الأتعاب والوكالة',d:'الاتفاق المالي، التوكيل، الرسوم، الصلاحيات',done:L(!!(g.feeOk||(k.accepted&&k.accepted.signed)))},
  {n:5,id:'file',t:'فتح ملف القضية',d:'رقم ملف، المحامي المسؤول، فريق العمل، التنبيهات',done:L(!!k.file)},
  {n:6,id:'evidence',t:'جمع البينات والمستندات',d:'عقود، مراسلات، فواتير، شهود، مبرزات',done:L(docs.length>0&&miss===0)},
  {n:7,id:'analysis',t:'التحليل والاستراتيجية',d:'الوقائع، النصوص القانونية، السوابق، الدفوع، المخاطر',done:L(!!(s.basis&&(s.strong||s.weak)))},
  {n:8,id:'drafting',t:'إعداد وصياغة الأوراق',d:'لائحة دعوى، لائحة جوابية، طلبات، مذكرات',done:L(docs.some(d=>d.tpl||d.text||/لائح|مذكر|طلب|شكوى/.test(String(d.kind||'')+String(d.title||''))))},
  {n:9,id:'filing',t:'التقديم والمتابعة القضائية',d:'الإيداع، التبليغ، الجلسات، القرارات، المهل',done:merits(k)||closed(k)||!!k.exec},
  {n:10,id:'judgment',t:'الحكم وما بعده',d:'الحكم، الاستئناف أو النقض، التنفيذ أو التسوية',done:closed(k)||!!(k.post&&['exec','settle'].includes(k.post.rec))},
  {n:11,id:'close',t:'الإغلاق والأرشفة',d:'تقرير ختامي، تسليم المستندات، إقفال الحساب، الأرشفة',done:closed(k)}]}
function current(k,D){const ss=steps(k,D);return ss.find(x=>!x.done)||ss[ss.length-1]}
const api={steps,current};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof A==='undefined'||typeof document==='undefined')return;

const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const D=()=>({docs:typeof docs!=='undefined'?docs:[]});
const can=()=>!(root.MQ&&MQ.readOnly);const me=()=>(root.MQ&&MQ.user&&MQ.user.name)||'';
const save=()=>{if(root.MQ&&MQ.saveState)MQ.saveState()};
const modal=h=>{document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog" style="max-width:680px">${h}</div></div>`};
const head=(t,sub)=>`<div class="head"><div><h1 style="font-size:22px">${t}</h1>${sub?`<p class="sub">${sub}</p>`:''}</div><button class="btn sm" data-act="close">إغلاق</button></div>`;
let KID=null;
const hasTab=t=>{S.caseTab=t;render();setTimeout(()=>{const f=document.querySelector('#page .cw form, #page form');if(f)f.scrollIntoView({block:'start'})},60)};

/* ما يفتحه كل زر */
const GO={
 intake:k=>hasTab('study'),
 conflict:k=>{const q=(k.gate||{}).other||oppNames(k)||'';modal(head('فحص تعارض المصالح',esc(k.subject||''))+`<form class="form" id="fCsConf">
  <label class="wide">اسم الخصم أو وكيله أو أي طرف مرتبط<input class="field" id="ccQ" value="${esc(q)}"></label><div class="wide" id="ccR">${typeof conflict==='function'?conflict(q):''}</div>
  <label class="wide ck"><input type="checkbox" id="ccOk" ${(k.gate||{}).conflictOk?'checked':''}> فحصتُ الأطراف ولا يوجد تعارض يمنع قبول التوكيل</label>
  <button class="btn pri wide">حفظ نتيجة الفحص</button></form>`);const i=document.getElementById('ccQ'),r=document.getElementById('ccR');i.oninput=()=>{if(typeof conflict==='function')r.innerHTML=conflict(i.value)}},
 study:k=>{if(window.MQ_station&&A.stAccept&&(k.study||{}).updated)return A.stAccept(k.id);hasTab('study')},
 fees:k=>{if(A.stAccept)A.stAccept(k.id)},
 file:k=>{const f=k.file||{};const sug='م/'+new Date().getFullYear()+'/'+String(cases.indexOf(k)+1).padStart(3,'0');modal(head('فتح ملف القضية',esc(k.subject||''))+`<form class="form" id="fCsFile">
  <label>رقم الملف الداخلي<input class="field mono" id="cfN" value="${esc(f.no||sug)}" required></label><label>المحامي المسؤول<input class="field" id="cfL" value="${esc(f.lead||me())}" required></label>
  <label class="wide">فريق العمل (اختياري)<input class="field" id="cfT" value="${esc(f.team||'')}" placeholder="محامٍ متدرب، سكرتيرة…"></label>
  <label class="wide ck"><input type="checkbox" id="cfA" ${f.alerts===false?'':'checked'}> تفعيل تنبيهات المهل والجلسات لهذا الملف</label>
  <button class="btn pri wide">فتح الملف</button></form>`)},
 evidence:k=>hasTab('study'),
 analysis:k=>hasTab('study'),
 drafting:k=>{modal(head('إعداد وصياغة الأوراق',esc(k.subject||''))+`<div class="list">
  <button class="row clk" data-act="csTpl" data-v="${k.id}|t3"><div><div class="t">لائحة دعوى من نموذج</div><div class="m">تُملأ من بيانات القضية وتُحفظ مسودة</div></div></button>
  <button class="row clk" data-act="csTpl" data-v="${k.id}|"><div><div class="t">نموذج آخر (لائحة جوابية، طلب، مذكرة…)</div><div class="m">من النماذج الجاهزة</div></div></button>
  ${A.aiOpen?`<button class="row clk" data-act="csAi" data-v="${k.id}"><div><div class="t">صياغة بالمساعد</div><div class="m">بالصوت أو النص، والاعتماد النهائي للمحامي</div></div></button>`:''}</div>`)},
 filing:k=>{const ns=window.MQ_station&&MQ_station.nextOf?MQ_station.nextOf(k):null;if(!reg(k)){A.wfGo&&A.wfGo(k.id+'|'+((k.flow==='criminal'||/جزائ/.test(String(k.type||'')))?30:7));return}hasTab('hearings')},
 judgment:k=>{if(merits(k)&&A.stPostOpen)return A.stPostOpen(k.id);hasTab('track')},
 close:k=>{if(A.stClose)A.stClose(k.id)}};
A.csGo=v=>{const [kid,id]=String(v).split('|'),k=K(kid);if(!k)return;KID=k.id;if(!can()&&!['intake','evidence','analysis'].includes(id))return toast('صلاحيتك للاطلاع فقط');(GO[id]||(()=>{}))(k)};
A.csTpl=v=>{const [kid,t]=v.split('|');A.close();S.tplCase=kid;if(t)S.tpl=t;S.tplVals={};S.view='tpls';render();window.scrollTo(0,0)};
A.csAi=v=>{A.close();A.aiOpen&&A.aiOpen(v)};
document.addEventListener('submit',e=>{const f=e.target;if(!['fCsConf','fCsFile'].includes(f.id))return;e.preventDefault();e.stopImmediatePropagation();if(!can())return toast('صلاحيتك للاطلاع فقط');const k=K(KID);if(!k)return;const g=id=>(document.getElementById(id)||{}).value||'';
 if(f.id==='fCsConf'){const ok=document.getElementById('ccOk').checked;k.gate={...(k.gate||{}),other:g('ccQ').trim(),conflictOk:ok,conflictAt:iso(TODAY),conflictBy:me()};A.close();save();render();toast(ok?'سُجّل فحص التعارض: لا تعارض':'حُفظ الفحص؛ لم يُؤكَّد خلوّه من التعارض')}
 if(f.id==='fCsFile'){k.file={no:g('cfN').trim(),lead:g('cfL').trim(),team:g('cfT').trim(),alerts:document.getElementById('cfA').checked,at:iso(TODAY),by:me()};A.close();save();render();toast('فُتح ملف القضية برقم '+k.file.no)}});

/* لوحة السير داخل ملف القضية */
function panel(k){const ss=steps(k,D()),cur=ss.find(x=>!x.done),ci=cur?ss.indexOf(cur):ss.length;
 const row=(x,i)=>{const st=x.done?'done':i===ci?'cur':'lock';
  return `<li class="cs-${st}"><span class="cs-n">${x.done?'✓':String(x.n).padStart(2,'0')}</span><div class="cs-b"><b>${x.t}</b><small>${x.d}</small></div>${st==='cur'?`<button class="btn pri sm" data-act="csGo" data-v="${k.id}|${x.id}">ابدأ ←</button>`:st==='done'?`<button class="btn sm" data-act="csGo" data-v="${k.id}|${x.id}">عرض</button>`:'<span class="cs-lk" title="لا انتقال دون استكمال المرحلة">🔒</span>'}</li>`};
 return `<section class="cs-panel"><header><div><b>سير القضية في المكتب</b><small>${cur?'الخطوة الحالية: '+String(cur.n).padStart(2,'0')+' · '+cur.t:'اكتملت كل الخطوات'}</small></div><div class="cs-prog"><span style="width:${Math.round(ss.filter(x=>x.done).length/ss.length*100)}%"></span></div></header>
 <ol class="cs-list">${ss.map(row).join('')}</ol>
 <footer>لا إجراء دون مستند · لا استشهاد دون مصدر · لا انتقال دون استكمال المرحلة · لا اعتماد نهائي دون مراجعة المحامي</footer></section>`}
root.MQ_steps={panel,steps:k=>steps(k,D()),current:k=>current(k,D())};
const css=document.createElement('style');css.textContent=`
.cs-panel{margin:10px 16px 6px;border:1px solid var(--brass,#B9965A);border-radius:16px;background:var(--panel,#fff);overflow:hidden}
.cs-panel header{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;justify-content:space-between;padding:12px 14px;background:linear-gradient(180deg,rgb(185 150 90 / .14),transparent)}
.cs-panel header b{font-size:16px;display:block}.cs-panel header small{color:var(--muted);font-size:12.5px}
.cs-prog{flex:0 1 220px;height:8px;border-radius:99px;background:var(--line,#E5E0D6);overflow:hidden}.cs-prog span{display:block;height:100%;background:var(--brass,#B9965A)}
.cs-list{list-style:none;margin:0;padding:6px 10px 10px;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:6px}
.cs-list li{display:flex;gap:10px;align-items:center;padding:8px 10px;border-radius:12px;border:1px solid var(--line,#E5E0D6)}
.cs-n{min-width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:12.5px;background:#0B1B2B;color:#E4C77A}
.cs-b{flex:1;min-width:0}.cs-b b{display:block;font-size:14px}.cs-b small{color:var(--muted);font-size:12px;line-height:1.5}
.cs-done .cs-n{background:var(--ok,#2E7D5B);color:#fff}.cs-done{opacity:.85}
.cs-cur{border-color:var(--brass,#B9965A);box-shadow:0 0 0 2px rgb(185 150 90 / .35);background:rgb(185 150 90 / .06)}
.cs-lock{opacity:.55}.cs-lk{font-size:14px}
.cs-panel footer{font-size:12px;color:var(--muted);padding:8px 14px;border-top:1px solid var(--line,#E5E0D6);text-align:center}`;document.head.appendChild(css);
}(typeof window!=='undefined'?window:globalThis));
