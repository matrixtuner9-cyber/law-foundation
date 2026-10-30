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
/* طباعة الوكالة ومعها اتفاقية الأتعاب كمستند مستقل (مستندان في معاينة واحدة، يُطبع كلٌّ منهما وحده) */
/* بند المصاريف القضائية في اتفاقية الأتعاب — نص واضح لكل حالة */
const EXP_ITEMS='(رسوم المحكمة والطوابع والتبليغ والخبرة والترجمة وكاتب العدل ودائرة التنفيذ والتنقل)';
root.MQ_feeExp=(mode,cap,how,days)=>{const m=/^تشمل|^included$/.test(String(mode||'').trim())?'in':/سقف|^cap$/.test(String(mode||''))?'cap':'out';const d=days||7,capN=String(cap||'').replace(/[^\d.,]/g,'');
 if(m==='in')return [`تشمل الأتعاب المذكورة جميع الرسوم والمصاريف القضائية في هذه الدعوى ${EXP_ITEMS}، ولا يُطالَب الطرف الثاني بأي مبلغ إضافي عنها.`,'لا تشمل الأتعاب رسوم ومصاريف الطعن بالاستئناف أو النقض، ولا أي إجراء خارج موضوع هذه الدعوى، إلا باتفاق مكتوب.'];
 if(m==='cap')return [`تشمل الأتعاب الرسوم والمصاريف القضائية ${EXP_ITEMS} حتى مبلغ ${capN||'……'} شيكل فقط، وما زاد على ذلك يتحمله الطرف الثاني؛ ${how||'يدفعها الطرف الأول عنه ويستردها منه بموجب إيصالاتها'}.`,`يقدّم الطرف الأول للطرف الثاني كشفاً بالمصاريف مرفقاً بإيصالاتها، ويلتزم الطرف الثاني بسداد ما زاد على السقف خلال ${d} أيام من تقديمه.`];
 return [`لا تشمل الأتعاب الرسوم والمصاريف القضائية ${EXP_ITEMS}، ويتحملها الطرف الثاني؛ ${how||'يدفعها الطرف الأول عنه عند الحاجة ويستردها منه بموجب إيصالاتها'}.`,`يقدّم الطرف الأول للطرف الثاني كشفاً بالمصاريف المدفوعة عنه مرفقاً بإيصالاتها، ويلتزم الطرف الثاني بسدادها خلال ${d} أيام من تقديمه، وهي مستقلة عن الأتعاب ولا تُخصم منها.`]};
const EXP_LABEL={out:'المصاريف القضائية غير مشمولة بالأتعاب (يتحملها الموكل)',in:'المصاريف القضائية مشمولة بالأتعاب',cap:'المصاريف مشمولة حتى سقف محدد'};
root.MQ_feeTermsLabel=k=>{const t=k&&k.feeTerms;if(!t)return '';return (EXP_LABEL[t.expMode]||'')+(t.expMode==='cap'&&t.expCap?' ('+Number(t.expCap).toLocaleString('en-US')+' ₪)':'')};
/* أوراق قبول القضية: الوكالة + اتفاقية الأتعاب، بعد تحديد شمول المصاريف بوضوح */
A.csPrintPoa=v=>{const k=K(v);if(!k||!window.MQP||!MQP.D||!MQP.D.tpl)return toast('الطباعة غير متاحة');
 const acc=k.accepted||{},g=k.gate||{},t=k.feeTerms||{},fee=Number(t.fee||acc.fee||g.fee||k.fee||0),plan=t.plan||acc.pay||g.pay||'نصفها عند التوقيع والباقي عند صدور الحكم';
 const mode=t.expMode||'out',r=(v2,lb,sub)=>`<label class="fp-opt ${mode===v2?'on':''}"><input type="radio" name="fpExp" value="${v2}" ${mode===v2?'checked':''}><span><b>${lb}</b><small>${sub}</small></span></label>`;
 document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal fp-m" role="dialog" aria-label="أوراق قبول القضية"><div class="head"><h1 style="font-size:21px">🖨 أوراق قبول القضية ${esc(k.no||'')}</h1><button class="btn sm" data-act="close">إغلاق</button></div>
  <p class="m" style="margin-top:0">تُطبع ورقتان منفصلتان: <b>الوكالة الخاصة</b> و<b>اتفاقية أتعاب المحاماة</b>، كلٌّ منهما من نسختين للتوقيع.</p>
  <form class="form" id="fFp">${window.MQ_CUR?MQ_CUR.select('fpCur',(C(k.client)||{}).cur,'عملة الأتعاب'):''}<label>الأتعاب المتفق عليها<input class="field mono" id="fpFee" inputmode="numeric" value="${fee?fee.toLocaleString('en-US'):''}" placeholder="مثال: 8,000"></label><label>طريقة الدفع<input class="field" id="fpPlan" value="${esc(plan)}"></label>
   <fieldset class="wide fp-exp"><legend>هل تشمل الأتعاب المصاريف القضائية؟</legend>
    ${r('out','لا تشمل — يتحملها الموكل','رسوم المحكمة والطوابع والتبليغ والخبرة… يدفعها المكتب عنه ويستردها بإيصالاتها')}
    ${r('in','تشمل — لا يدفع الموكل شيئاً إضافياً','كل الرسوم والمصاريف القضائية لهذه الدعوى ضمن الأتعاب')}
    ${r('cap','تشمل حتى سقف محدد','وما زاد على السقف يتحمله الموكل')}
    <label class="fp-cap" ${mode==='cap'?'':'hidden'}>سقف المصاريف المشمولة (شيكل)<input class="field mono" id="fpCap" inputmode="numeric" value="${esc(t.expCap||'')}"></label></fieldset>
   <div class="wide fp-prev" id="fpPrev"></div>
   <button class="btn pri wide">معاينة وطباعة الورقتين</button></form></div></div>`;
 const f=document.getElementById('fFp'),prev=()=>{const m=(f.querySelector('input[name=fpExp]:checked')||{}).value||'out';f.querySelectorAll('.fp-opt').forEach(l=>l.classList.toggle('on',l.querySelector('input').checked));f.querySelector('.fp-cap').hidden=m!=='cap';const X=MQ_feeExp(m,document.getElementById('fpCap').value);document.getElementById('fpPrev').innerHTML=`<b>كما سيظهر في الاتفاقية:</b><br>2. ${esc(X[0])}<br>3. ${esc(X[1])}`};
 f.addEventListener('change',prev);f.addEventListener('input',prev);prev()};
document.addEventListener('submit',e=>{if(e.target.id!=='fFp')return;e.preventDefault();e.stopImmediatePropagation();const k=K(KID_FP);if(!k)return;
 const g=id=>(document.getElementById(id)||{}).value||'',fee=Number(g('fpFee').replace(/[^\d.]/g,''))||0,mode=(document.querySelector('input[name=fpExp]:checked')||{}).value||'out',cap=g('fpCap').replace(/[^\d.]/g,'');
 if(mode==='cap'&&!cap)return toast('اكتب سقف المصاريف المشمولة');
 if(!fee&&!confirm('لم تُحدَّد قيمة الأتعاب؛ ستظهر في الاتفاقية فراغاً للتعبئة باليد. متابعة؟'))return;
 const cur=window.MQ_CUR?MQ_CUR.norm(g('fpCur')):'ILS',cl=C(k.client);if(cl&&cur!==MQ_CUR.of(cl)){if((cl.payments||[]).length&&!confirm('لهذا الموكل دفعات مسجّلة بعملة '+MQ_CUR.name(cl.cur)+'. تغيير عملة الأتعاب لا يحوّل المبالغ المسجّلة. متابعة؟'))return;cl.cur=cur}
 k.feeTerms={fee,cur,plan:g('fpPlan').trim(),expMode:mode,expCap:mode==='cap'?cap:'',printedAt:iso(TODAY),by:me()};save();A.close();
 const doc=(tid,label,vals)=>({label,build(){const o=[S.tpl,S.tplCase,S.tplVals];S.tpl=tid;S.tplCase=k.id;S.tplVals=vals||{};try{const r=MQP.D.tpl().build();r.title=label;return r}finally{[S.tpl,S.tplCase,S.tplVals]=o}}});
 MQP.open([doc('t1','وكالة خاصة'),doc('t6','اتفاقية أتعاب محاماة',{...(fee?{fee:fee.toLocaleString('en-US')}:{}),feeCur:window.MQ_CUR?MQ_CUR.name(cur):'شيكل',plan:k.feeTerms.plan,expMode:mode==='in'?'تشمل':mode==='cap'?'سقف':'لا تشمل',expCap:cap})],0);
 toast('المعاينة فيها الورقتان: الوكالة واتفاقية الأتعاب — بدّل بينهما من «المستند» واطبع كلاً منهما');render()},true);
let KID_FP=null;{const p0=A.csPrintPoa;A.csPrintPoa=v=>{KID_FP=v;p0(v)}}
{const st=document.createElement('style');st.textContent=`.fp-m{max-width:720px}.fp-exp{border:1px solid var(--line,#E5DCC8);border-radius:12px;padding:8px 10px;display:flex;flex-direction:column;gap:6px}.fp-exp legend{font-weight:700;padding:0 6px}
.fp-opt{display:flex!important;flex-direction:row!important;gap:10px;align-items:flex-start;padding:8px 10px;border:1px solid var(--line,#E5DCC8);border-radius:10px;cursor:pointer;margin:0}.fp-opt input{width:auto!important;margin-top:4px}.fp-opt span{display:flex;flex-direction:column}.fp-opt small{color:var(--muted,#7A8592);font-size:12px}.fp-opt.on{border-color:#C9A24A;background:#FBF3DD}
.fp-prev{background:#FFFDF7;border:1px dashed #C9A24A;border-radius:10px;padding:10px 12px;font-size:13.5px;line-height:1.9}`;document.head.appendChild(st)}
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
.cs-panel{margin:10px 16px 6px;border-radius:18px;border:1px solid var(--brass,#C9A24A);background:var(--panel)}
.cs-panel>*{position:relative}

.cs-panel header{border-radius:18px 18px 0 0;display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;justify-content:space-between;padding:14px 16px 10px}
.cs-panel header b{font-size:18px;display:block;color:var(--ink,#0B1B2B)}.cs-panel header small{color:var(--muted,#6b7280);font-size:12.5px}
.cs-prog{flex:0 1 240px;height:8px;border-radius:99px;background:rgb(11 27 43 / .10);overflow:hidden}.cs-prog span{display:block;height:100%;background:linear-gradient(90deg,#B88A2E,#F3D58A)}
.cs-list{list-style:none;margin:0;padding:8px 12px 14px;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px}
.cs-list li{position:relative;display:flex;gap:12px;align-items:center;padding:12px 12px;border-radius:16px;background:linear-gradient(160deg,#16314A 0%,#0F2335 55%,#0B1B2B 100%);border:1px solid rgb(201 162 74 / .55);box-shadow:inset 0 1px 0 rgb(255 255 255 / .06),0 4px 14px rgb(0 0 0 / .25)}
.cs-n{min-width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:13px;color:#0B1B2B;background:radial-gradient(circle at 35% 30%,#FFE9A8,#D9B45C 55%,#9C7628);box-shadow:0 0 0 2px rgb(11 27 43 / .9),0 0 0 3px rgb(201 162 74 / .7)}
.cs-b{flex:1;min-width:0}.cs-b b{display:block;font-size:15px;color:#F2D58C}.cs-b small{color:#C9D4DB;font-size:12.5px;line-height:1.55}
.cs-list .btn{background:transparent;color:#E9C46A;border:1px solid rgb(201 162 74 / .7)}.cs-list .btn:hover{background:rgb(201 162 74 / .15)}
.cs-list .btn.pri,.cs-cur .btn{background:linear-gradient(180deg,#F3D58A,#C9A24A)!important;color:#0B1B2B!important;border:0!important;font-weight:700}
.cs-done .cs-n{background:radial-gradient(circle at 35% 30%,#B8F0CF,#3BB273 60%,#1E7A4C);color:#fff}
.cs-done .cs-b b{color:#E9D9A8}
.cs-cur{border:1.5px solid #F3D58A!important;box-shadow:0 0 0 1px rgb(243 213 138 / .35),0 0 22px rgb(233 196 106 / .35),inset 0 1px 0 rgb(255 255 255 / .08)!important}
.cs-cur::after{content:"الخطوة الحالية";position:absolute;top:-9px;right:14px;font-size:10.5px;font-weight:800;color:#0B1B2B;background:linear-gradient(180deg,#F3D58A,#C9A24A);padding:1px 8px;border-radius:999px}
.cs-lock{border-color:rgb(201 162 74 / .3)!important}.cs-lock .cs-b b{color:#A9B4BC}.cs-lock .cs-b small{color:#7F8C96}.cs-lock .cs-n{background:#1d3348;color:#C9A24A;box-shadow:0 0 0 1px rgb(201 162 74 / .45)}.cs-lk{font-size:14px;filter:grayscale(1) brightness(1.6)}
.cs-panel footer{border-radius:0 0 18px 18px;font-size:12px;color:#8A6A25;padding:10px 14px;border-top:1px solid var(--line,#e5dccb);text-align:center;letter-spacing:.01em}`;document.head.appendChild(css);
}(typeof window!=='undefined'?window:globalThis));
