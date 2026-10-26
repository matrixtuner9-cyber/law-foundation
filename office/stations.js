/* مراحل القضية في المكتب (حسب المخطط الذي اعتمده المحامون):
   التقييم والدراسة → [مقبولة] قيد التسجيل → قيد التقاضي → صدر الحكم → (قيد الاستئناف) → قيد التنفيذ → مغلقة
   المرحلة تُشتق من بيانات القضية، ولكل مرحلة زر واحد «الخطوة التالية». */
(function(root){
'use strict';
const ST=[{id:'study',t:'التقييم والدراسة'},{id:'pending',t:'قيد التسجيل'},{id:'active',t:'قيد التقاضي'},{id:'judgment',t:'صدر الحكم'},{id:'appeal',t:'قيد الاستئناف',opt:true},{id:'exec',t:'قيد التنفيذ'},{id:'closed',t:'مغلقة'}];
const idx=id=>ST.findIndex(s=>s.id===id);
const accepted=k=>!!(k&&(k.accepted||(k.gate&&k.gate.feeOk)||(k.study&&['court','crime','amic'].includes(k.study.rec))));
const gateOk=accepted;
const lastMerits=k=>(k&&k.decisions||[]).filter(d=>d.kind!=='interim').slice(-1)[0]||null;
const lastTrack=k=>(k&&k.track||[]).slice(-1)[0]||null;
const APPEAL_LV=/استئناف|نقض|إعادة محاكمة/;
const isExec=k=>!!k&&(!!k.exec||/^تنفيذ/.test(String(k.type||''))||((lastTrack(k)||{}).lvl==='تنفيذ'));
const registered=k=>!!(k&&((k.no&&k.no!=='قيد التسجيل')||k.complaintNo));
function stationOf(k,ctx){ctx=ctx||{};const hs=(ctx.hearings||[]).filter(h=>h.k===k.id);
 if(k.status==='منتهية'||k.closed)return 'closed';
 if(isExec(k))return 'exec';
 const d=lastMerits(k),t=lastTrack(k),inAppeal=t&&APPEAL_LV.test(t.lvl||'');
 if(inAppeal&&(!d||(t.from&&t.from>=d.date&&(k.track||[]).length>1)))return 'appeal';
 if(d)return 'judgment';
 if(registered(k)||hs.length)return 'active';
 if(accepted(k))return 'pending';
 return 'study'}
function stageOf(k,ctx){ctx=ctx||{};const today=ctx.today||new Date().toISOString().slice(0,10);const st=stationOf(k,ctx);
 if(st==='closed')return k.closed&&k.closed.result?k.closed.result:'مغلقة';
 if(st==='study')return k.study&&k.study.updated?'الدراسة جارية · بانتظار قرار القبول':'بانتظار التقييم وقرار القبول';
 if(st==='pending')return (k.flow==='criminal'||/جزائ/.test(String(k.type||'')))?'بانتظار تسجيل الشكوى':'بانتظار تسجيل الدعوى ورقمها';
 if(st==='judgment'){const d=lastMerits(k);return 'صدر الحكم '+fmtD(d.date)+(d.due?' · الطعن حتى '+fmtD(d.due):'')}
 if(st==='exec')return k.execStage||'إجراءات التنفيذ';
 const hs=(ctx.hearings||[]).filter(h=>h.k===k.id).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 const past=hs.filter(h=>h.date<=today),next=hs.find(h=>h.date>today);
 if(past.length){const p=String(past[past.length-1].purpose||'');
  const m=/نطق|حجز|للحكم/.test(p)?'محجوزة للحكم':/مرافع/.test(p)?'المرافعات':/بين|شهود|شاهد|خبير/.test(p)?'سماع البينات':/لائح|دفوع|تبادل|رد/.test(p)?'تبادل اللوائح':/تحقيق|استجواب/.test(p)?'التحقيق':'جلسات';
  return m+(next?' · القادمة '+fmtD(next.date):'')}
 return next?'الجلسة الأولى '+fmtD(next.date):'بانتظار تحديد الجلسة الأولى'}
function fmtD(s){if(!s)return '';const [y,m,d]=String(s).slice(0,10).split('-');return d&&m&&y?`${+d}/${+m}/${y}`:String(s)}
let ON_ST=null;
function setStation(k,st,why,by,at){if(!k||!ST.some(s=>s.id===st))return false;if(k.station===st)return false;if(ON_ST)try{ON_ST(k,k.station||'',st,why||'')}catch(x){}
 k.transitions=[...(k.transitions||[]),{from:k.station||'',to:st,at:at||new Date().toISOString().slice(0,16).replace('T',' '),by:by||'',why:why||''}];k.station=st;return true}
const api={ST,stationOf,stageOf,setStation,gateOk,lastMerits,isExec};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof A==='undefined'||typeof document==='undefined')return;

const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ctx=()=>({hearings:typeof hearings!=='undefined'?hearings:[],today:iso(TODAY)});
const me=()=>(root.MQ&&MQ.user&&MQ.user.name)||'';
const save=()=>{if(root.MQ&&MQ.saveState)MQ.saveState()};
const can=()=>!(root.MQ&&MQ.readOnly);
/* تنبيه الموكل بكل إجراء على مسار قضيته (مع منع التكرار إن أُرسلت له رسالة محددة للإجراء نفسه) */
const LAST={};let OWN=false;
const wrapSend=()=>{const s0=root.sendMsg;if(typeof s0!=='function'||s0._st)return;const w=function(cid,...r){if(!OWN)LAST[cid]=Date.now();return s0.call(this,cid,...r)};w._st=1;root.sendMsg=w};
addEventListener('load',()=>setTimeout(wrapSend,0));
function notify(k,text){if(!k||!text||!can())return;wrapSend();setTimeout(()=>{if(Date.now()-(LAST[k.client]||0)<2500)return;const c=C(k.client)||{};if(typeof sendMsg==='function'){OWN=true;try{sendMsg(k.client,text,c.ch||'البوابة')}finally{OWN=false}}},0)}
const NO=k=>k.no&&k.no!=='قيد التسجيل'?' رقم '+k.no:'';
const MSG={study:k=>'نفيدكم باستلام قضيتكم لدى المكتب، ونقوم الآن بتقييمها ودراسة مستنداتها، وسنبلغكم بقرارنا قريباً.',
 pending:k=>'نفيدكم بقبول قضيتكم وتوقيع الوكالة واتفاقية الأتعاب، ونعمل الآن على تسجيلها لدى الجهة المختصة.',
 active:k=>'نفيدكم بتسجيل قضيتكم'+NO(k)+' وأصبحت قيد التقاضي. سنوافيكم بمواعيد الجلسات وما يجري فيها.',
 judgment:k=>'نفيدكم بصدور الحكم في قضيتكم'+NO(k)+'. نقوم بدراسته وسنوافيكم بتوصيتنا بشأن الاستئناف أو التنفيذ.',
 appeal:k=>'نفيدكم بأن قضيتكم'+NO(k)+' أصبحت قيد الاستئناف، وسنوافيكم بموعد الجلسة.',
 exec:k=>'نفيدكم بتحويل قضيتكم'+NO(k)+' إلى التنفيذ لتحصيل حقوقكم، وسنوافيكم بكل خطوة.',
 closed:(k,w)=>'نفيدكم بإغلاق ملف قضيتكم'+NO(k)+' لدى المكتب: '+((k.closed&&k.closed.result)||w||'')+'. نشكر ثقتكم.'};
ON_ST=(k,from,to,why)=>{const der=why==='مشتقة من بيانات القضية';if(!from&&der)return;const f=MSG[to];if(f)notify(k,f(k,der?stageOf(k,ctx()):why))};
const sync=k=>{const st=stationOf(k,ctx());if(k.station!==st)setStation(k,st,'مشتقة من بيانات القضية',me());return st};

/* ── فتح قضية جديدة: نموذج قصير، والقضية تبدأ «قيد التقييم والدراسة» ── */
let PN=null;
document.addEventListener('submit',ev=>{if(ev.target.id==='fCase'&&ev.target.ncC&&ev.target.ncC.value!=='new')PN=cases.length},true);
document.addEventListener('submit',ev=>{if(ev.target.id!=='fCase'||PN==null)return;const n=PN;PN=null;setTimeout(()=>{if(cases.length<=n)return;const k=cases[cases.length-1];setStation(k,'study','قضية جديدة',me());save();render()},0)});

/* ── قرار القبول (التقييم والدراسة → قيد التسجيل، أو الرفض) ── */
function acceptModal(k){const c=C(k.client)||{},q=oppNames(k);
 document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog" aria-label="قرار القبول" style="max-width:680px"><div class="head"><div><h1 style="font-size:22px">هل القضية مجدية؟</h1><p class="sub">${esc(k.subject||'')} · ${esc(c.name||'')}</p></div><button class="btn sm" data-act="close">لاحقاً</button></div>
 <div class="wide" style="margin-bottom:10px">${typeof conflict==='function'&&q?conflict(q):''}</div>
 <div class="st-opts">
  <div class="st-opt" style="cursor:default"><b>✓ قبول القضية</b><small>بعد توقيع الوكالة والاتفاق على الأتعاب</small>
   <form id="fStAcc" class="form" style="margin-top:8px"><label>الأتعاب ₪<input class="field" type="number" id="saF" min="0" value="${esc(k.fee||'')}"></label><label>طريقة السداد<select class="field" id="saP">${['دفعة واحدة','دفعات حسب المراحل','نسبة من المحصَّل'].map(x=>`<option>${x}</option>`).join('')}</select></label>
   <div class="wide" style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn sm" data-act="csPrintPoa" data-v="${k.id}">🖨 طباعة الوكالة + اتفاقية الأتعاب</button></div>
   <label class="wide ck"><input type="checkbox" id="saW" checked> وُقّعت الوكالة واتفاقية الأتعاب</label>
   <label class="wide">نوع الإجراء<select class="field" id="saT"><option value="civil">دعوى حقوقية</option><option value="criminal" ${/جزائ/.test(String(k.type||''))?'selected':''}>شكوى جزائية</option></select></label>
   <button class="btn pri wide">قبول ← قيد التسجيل</button></form></div>
  <div class="st-opt" style="cursor:default"><b>✕ رفض القضية</b><small>يُبلَّغ الموكل ويُغلق الملف</small>
   <form id="fStRej" class="form" style="margin-top:8px"><label class="wide">سبب الرفض (يصل الموكل)<textarea class="field" id="srR" rows="3" placeholder="مثال: لا تتوفر بينات كافية، أو انقضت مدة التقادم"></textarea></label>
   <button class="btn wide" style="color:var(--danger)">رفض وإبلاغ الموكل</button></form></div>
 </div><p class="m" style="margin-top:10px">للتقييم التفصيلي (الوقائع، المستندات المطلوبة، نقاط القوة والضعف): <button class="link" data-act="cwNext" data-v="study|${k.id}">شاشة الدراسة</button></p></div></div>`;AK=k.id}
let AK=null;A.stAccept=v=>{const k=K(v);if(!k)return;if(!can())return toast('صلاحيتك للاطلاع فقط');acceptModal(k)};
document.addEventListener('submit',e=>{const f=e.target;if(!['fStAcc','fStRej'].includes(f.id))return;e.preventDefault();e.stopImmediatePropagation();if(!can())return toast('صلاحيتك للاطلاع فقط');const k=K(AK);if(!k)return;const g=id=>(document.getElementById(id)||{}).value||'';
 if(f.id==='fStAcc'){const fee=Number(g('saF'))||0;k.accepted={at:iso(TODAY),by:me(),fee,pay:g('saP'),signed:!!document.getElementById('saW').checked};k.gate={...(k.gate||{}),conflictOk:true,feeOk:true,fee,pay:g('saP'),at:iso(TODAY),by:me()};if(fee&&!k.fee)k.fee=fee;k.flow=g('saT');k.flowAt=k.flow==='criminal'?30:6;
  setStation(k,'pending','قُبلت القضية',me());A.close();save();render();toast('قُبلت القضية · الخطوة التالية: '+(k.flow==='criminal'?'تسجيل الشكوى':'تسجيل الدعوى'))}
 else{const r=g('srR').trim()||'بعد الدراسة لم نجد القضية مجدية';const c=C(k.client)||{};if(typeof sendMsg==='function')sendMsg(k.client,'بعد دراسة قضيتكم وتقييم مستنداتها، نعتذر عن قبولها: '+r+'. نشكر ثقتكم، ويسعدنا خدمتكم في أي أمر آخر.',c.ch||'البوابة');
  k.status='منتهية';k.stage='رُفضت بعد الدراسة';k.closed={date:iso(TODAY),result:'رفض القضية: '+r,by:me()};setStation(k,'closed','رفض القضية',me());A.close();save();render();toast('رُفضت القضية وأُبلغ الموكل')}});

/* ── المحطة 4: قرار ما بعد الحكم (تُفتح تلقائياً عند تسجيل حكم فاصل) ── */
function postModal(k){const d=lastMerits(k);if(!d)return;const lv=lastTrack(k),nx=root.MQ_nextRoute?MQ_nextRoute((lv||{}).lvl||'بداية'):'استئناف',n=d.due?diff(d.due):null,rec=(k.post||{}).rec||'';
 document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog" aria-label="ما بعد الحكم" style="max-width:720px"><div class="head"><div><h1 style="font-size:22px">صدر الحكم: هل يحتاج استئنافاً؟</h1><p class="sub">قضية ${esc(k.no)} · ${esc(k.subject||'')}</p></div><button class="btn sm" data-act="close">لاحقاً</button></div>
 <div class="st-post">
  <div class="st-judg"><b>الحكم الصادر بتاريخ ${fmtD(d.date)}</b>${d.text?`<div>${esc(d.text)}</div>`:''}${d.due?`<div class="st-due ${n<0?'gone':n<=5?'bad':n<=15?'warn':''}">آخر موعد لل${esc(nx||'طعن')}: <b>${fmtD(d.due)}</b> · ${n<0?'انقضت المدة':n===0?'اليوم آخر يوم':'متبقٍ '+n+' يوماً'}</div>`:'<div class="m">لا مهلة طعن محسوبة لهذا الحكم.</div>'}</div>
  <form class="form" id="fStPost"><label class="wide">توصية المحامي للموكل<textarea class="field" id="spR" rows="3" placeholder="مثال: الحكم في صالحنا جزئياً؛ ننصح بعدم الطعن والبدء بالتنفيذ…">${esc((k.post||{}).note||'')}</textarea></label>
  <label class="wide ck"><input type="checkbox" id="spM" checked> إبلاغ الموكل عبر البوابة بالقرار المتخذ</label></form>
  <div class="st-opts">
   <button class="st-opt" data-act="stPost" data-v="${k.id}|appeal"><b>يحتاج استئنافاً (${esc(nx||'استئناف')})</b><small>تُفتح درجة جديدة في نفس الملف وتُسجَّل مهلة إيداع اللائحة</small></button>
   <button class="st-opt" data-act="stPost" data-v="${k.id}|exec"><b>نهائي: التحويل للتنفيذ</b><small>يُفتح ملف تنفيذ مستقل مربوط بهذه القضية بمحطاته: إخطار، حجز، تحصيل</small></button>
   <button class="st-opt" data-act="stPost" data-v="${k.id}|settle"><b>تسوية بعد الحكم</b><small>اتفاقية تسوية وأقساط مع الخصم بحضور المحامي</small></button>
   <button class="st-opt" data-act="stPost" data-v="${k.id}|wait"><b>قرار مؤجَّل</b><small>تُبقى المهلة حمراء في الرئيسية حتى يُتخذ القرار</small></button>
  </div></div></div></div>`}
A.stPost=v=>{if(!can())return toast('صلاحيتك للاطلاع فقط');const [kid,how]=v.split('|'),k=K(kid);if(!k)return;const d=lastMerits(k)||{},c=C(k.client)||{};
 const note=((document.getElementById('spR')||{}).value||'').trim(),tell=!!(document.getElementById('spM')||{checked:true}).checked;
 k.post={rec:how,note,at:iso(TODAY),by:me(),dec:d.id};A.close();
 const say=t=>{if(tell&&typeof sendMsg==='function')sendMsg(k.client,t,c.ch||'البوابة')};
 if(how==='wait'){save();render();toast('أُجّل القرار؛ تبقى مهلة الطعن ظاهرة في الرئيسية');return}
 if(how==='appeal'){const lv=lastTrack(k),nx=root.MQ_nextRoute?MQ_nextRoute((lv||{}).lvl||'بداية'):'استئناف';say('بعد دراسة الحكم الصادر بتاريخ '+fmtD(d.date)+' في قضيتكم رقم '+k.no+'، قرر المكتب الطعن فيه بال'+(nx||'استئناف')+(note?'. '+note:'')+'. سنوافيكم برقم الطعن وموعد جلسته.');
  if(d.due){const title='إيداع لائحة ال'+(nx||'طعن')+' — '+k.no,due=d.due;if(!deadlines.some(x=>x.k===k.id&&x.title===title))deadlines.push({id:'dl-sp'+Date.now(),k:k.id,title,due,kind:'طعن',auto:true,dec:d.id})}
  setStation(k,'appeal','قرار الاستئناف',me());save();if(root.MQ_flow&&MQ_flow.track)MQ_flow.track(k,nx||'استئناف');else{S.view='case';S.caseId=k.id;S.caseTab='track';render()}toast('قُرّر الطعن · أودِع اللائحة قبل '+(d.due?fmtD(d.due):'انقضاء المهلة'));return}
 if(how==='exec'){const id='k'+Date.now();const ex={id,no:'قيد التسجيل',court:k.court,type:'تنفيذ',subject:'تنفيذ الحكم في القضية '+k.no+(k.subject?' · '+k.subject:''),client:k.client,opps:[...(k.opps||[])],role:'طالب التنفيذ',stage:'إخطار المدين',execStage:'إخطار المدين',step:5,status:'نشطة',value:k.value||0,fee:0,opened:iso(TODAY),pri:k.pri||'متوسطة',parent:k.id,gate:{...(k.gate||{}),at:iso(TODAY),by:me(),inherited:true},station:'exec',transitions:[{from:'',to:'exec',at:iso(TODAY),by:me(),why:'ملف تنفيذ للحكم في '+k.no}]};
  cases.push(ex);k.exec=id;k.status='تنفيذ';k.stage='قيد التنفيذ · ملف '+id;setStation(k,'exec','قُبل الحكم وفُتح ملف تنفيذ',me());
  deadlines.push({id:'dl-ex'+Date.now(),k:id,title:'تقديم طلب التنفيذ وإخطار المدين — '+k.no,due:addD(iso(TODAY),10),kind:'تنفيذ',auto:true});
  say('بعد دراسة الحكم الصادر بتاريخ '+fmtD(d.date)+' في قضيتكم رقم '+k.no+'، سنباشر إجراءات التنفيذ لتحصيل حقكم'+(note?'. '+note:'')+'. سنوافيكم بكل خطوة.');save();S.view='case';S.caseId=id;S.caseTab='hub';render();toast('فُتح ملف التنفيذ مربوطاً بالقضية '+k.no);return}
 if(how==='settle'){say('بعد صدور الحكم في قضيتكم رقم '+k.no+'، نعمل على تسوية مع الطرف الآخر لتحصيل حقكم بالتراضي'+(note?'. '+note:''));setStation(k,'exec','تسوية بعد الحكم',me());save();S.view='client';S.clientId=k.client;S.bagTab='settle';render();setTimeout(()=>{const b=document.querySelector('[data-act="stNew"]');if(b)b.click()},80)}};
const addD=(d,n)=>{const x=new Date(d+'T00:00:00');x.setDate(x.getDate()+n);return iso(x)};
/* فتح شاشة ما بعد الحكم تلقائياً بعد تسجيل حكم فاصل */
/* على window لأن معالج phase2 على document يوقف الانتشار */
window.addEventListener('submit',e=>{const f=e.target;if(f.id!=='fDec'||!S.caseId)return;if((document.getElementById('dT')||{}).value==='interim')return;const kid=S.caseId;
 setTimeout(()=>{const k=K(kid);if(!k||!lastMerits(k))return;setStation(k,'judgment','صدر حكم فاصل',me());save();postModal(k)},150)},true);
A.stPostOpen=v=>{const k=K(v);if(k)postModal(k)};

/* ── المحطة 5: إقفال بقائمة تحقق ── */
function closeModal(k){const c=C(k.client)||{},due=Math.max(0,(Number(k.fee)||0)-(k.paid||0)),cdue=Math.max(0,(Number(c.fee)||0)-(Number(c.paid)||0));
 document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog" aria-label="إقفال الملف"><div class="head"><h1 style="font-size:22px">إقفال الملف وأرشفته</h1><button class="btn sm" data-act="close">إغلاق</button></div><form class="form" id="fStClose">
 <label>تاريخ الإقفال<input class="field" type="date" id="scD" value="${iso(TODAY)}" required></label><label>النتيجة النهائية<select class="field" id="scR">${['تحصيل الحق كاملاً','تحصيل جزئي','تسوية ودية','رد الدعوى','براءة','إدانة','تنازل الموكل','اعتذار عن القضية','أخرى'].map(x=>`<option>${x}</option>`).join('')}</select></label>
 <fieldset class="wide cw-h"><legend>قائمة التحقق قبل الإقفال</legend>
  <label class="wide ck"><input type="checkbox" id="scF" required> الأتعاب مسدّدة أو مجدولة${cdue?` <span class="pill warn">متبقٍ على الموكل ${money(cdue)}</span>`:' <span class="pill ok">لا متبقٍ</span>'}</label>
  <label class="wide ck"><input type="checkbox" id="scO" required> أُعيدت المستندات الأصلية إلى الموكل بإيصال</label>
  <label class="wide ck"><input type="checkbox" id="scM" required> أُبلغ الموكل بنتيجة القضية النهائية</label>
  <label class="wide">رقم الأرشفة / مكان الملف الورقي<input class="field" id="scA" required placeholder="مثال: خزانة 3 — رف ب"></label></fieldset>
 <p class="note wide">تُنقل القضية إلى «منتهية» ويبقى ملفها كاملاً للرجوع إليه، ويُسجَّل الإقفال باسمك وتاريخه.</p>
 <button class="btn pri" style="background:var(--danger)">إقفال الملف</button></form></div></div>`}
document.addEventListener('submit',e=>{const f=e.target;if(f.id!=='fStClose')return;e.preventDefault();e.stopImmediatePropagation();if(!can())return toast('صلاحيتك للاطلاع فقط');const k=K(CK);if(!k)return;const g=id=>(document.getElementById(id)||{}).value||'';
 k.status='منتهية';k.stage='مقفلة ومؤرشفة';k.closed={date:g('scD'),result:g('scR'),archive:g('scA').trim(),by:me(),checks:['fees','originals','client']};k.flowAt=22;setStation(k,'closed','إقفال الملف: '+g('scR'),me());A.close();save();toast('أُقفل الملف وأُرشف');S.view='client';S.clientId=k.client;S.bagTab='cases';render()});
let CK=null;A.stClose=v=>{const k=K(v);if(!k)return;if(!can())return toast('صلاحيتك للاطلاع فقط');CK=k.id;closeModal(k)};
/* الصندوق 22 في الخريطة المرجعية يستخدم قائمة التحقق نفسها */
{const g0=A.wfGo;if(typeof g0==='function')A.wfGo=v=>{const [a,b]=String(v).split('|');if(+(b||a)===22){A.stClose(b?a:S.caseId);return}return g0(v)}}

/* ── حقيبة الموكل: المحطات الخمس لكل قضية وزر واحد «الخطوة التالية» ── */
function nextOf(k,st){const d=lastMerits(k);
 if(root.MQ_steps&&['study','pending'].includes(st)){const c=MQ_steps.current(k);if(c&&c.n<=9)return [String(c.n).padStart(2,'0')+' · '+c.t,`data-act="csGo" data-v="${k.id}|${c.id}"`]}const H=typeof hearings!=='undefined'?hearings:[];
 if(st==='study')return ['تقييم القضية: قبول أو رفض',`data-act="stAccept" data-v="${k.id}"`];
 if(st==='pending')return (k.flow==='criminal'||/جزائ/.test(String(k.type||'')))?['تسجيل الشكوى ورقمها',`data-act="wfGo" data-v="${k.id}|30"`]:['تسجيل الدعوى في المحكمة ورقمها',`data-act="wfGo" data-v="${k.id}|7"`];
 if(st==='judgment')return [d&&d.due&&diff(d.due)<0?'انقضت مهلة الطعن: التحويل للتنفيذ':'هل الحكم نهائي أم يحتاج استئنافاً؟',`data-act="stPostOpen" data-v="${k.id}"`];
 if(st==='exec')return ['تحصيل الحقوق أو الصلح',`data-act="bagTab" data-v="settle"`];
 if(st==='closed')return ['فتح الملف المؤرشف',`data-act="openCase" data-v="${k.id}"`];
 const pend=H.filter(h=>h.k===k.id&&!h.result&&h.date<=iso(TODAY)).sort((a,b)=>b.date.localeCompare(a.date))[0];
 if(pend)return ['ما جرى في جلسة '+fmtD(pend.date),`data-act="hrOpen" data-v="${pend.id}"`];
 const nh=(typeof nextH==='function'?nextH(k.id):null);
 if(nh)return ['تحضير جلسة '+fmtD(nh.date),`data-act="hpGoCase" data-v="${k.id}"`];
 return ['إضافة الجلسة القادمة',`data-act="wfGo" data-v="${k.id}|9"`]}
A.hpGoCase=v=>{A.openCase(v);S.caseTab='c360';render();if(A.c360Section)A.c360Section('hearing')};
function bag(c,ks){
 const head=`<div class="st-bar"><button class="btn pri" data-act="caseFor" data-v="${c.id}">+ قضية جديدة لهذا الموكل</button></div>`;
 if(!ks.length)return head+'<section class="panel"><div class="empty">لا قضايا لهذا الموكل بعد. ابدأ بـ«قضية جديدة».</div></section>';
 return head+ks.map(k=>{const st=sync(k),si=idx(st),stage=stageOf(k,ctx()),d=lastMerits(k),nh=(typeof nextH==='function'?nextH(k.id):null),dl=(typeof deadlines!=='undefined'?deadlines:[]).filter(x=>x.k===k.id&&diff(x.due)>=0).sort((a,b)=>a.due.localeCompare(b.due))[0],miss=((k.gather||{}).need||[]).filter(n=>n.st==='client'||n.st==='agency').length,[nt,na]=nextOf(k,st),open=S.stMap===k.id;
  const usedAppeal=st==='appeal'||(k.track||[]).some(t=>APPEAL_LV.test(t.lvl||''));const steps=ST.map((s,i)=>s.opt&&!usedAppeal?'':`<div class="wfs ${i<si?'done':i===si?'cur':''}"><i>${i<si?'✓':''}</i><b>${s.t}</b><small>${i===si?esc(stage):''}</small></div>`).join('');
  const facts=[nh?['الجلسة القادمة',fmtD(nh.date)+' · '+esc(nh.purpose||'')]:null,dl?['أقرب مهلة',fmtD(dl.due)+' · '+esc(dl.title)]:null,miss?['مستندات ناقصة',miss+' من الموكل أو جهة']:null,d?['آخر حكم',fmtD(d.date)+(d.due?' · الطعن حتى '+fmtD(d.due):'')]:null,k.exec?['ملف التنفيذ','<button class="link mono" data-act="openCase" data-v="'+k.exec+'">'+esc((K(k.exec)||{}).no||k.exec)+'</button>']:null,k.parent?['القضية الأصل','<button class="link mono" data-act="openCase" data-v="'+k.parent+'">'+esc((K(k.parent)||{}).no||'')+'</button>']:null].filter(Boolean);
  return `<section class="panel wf-case st-case"><header><h2>${esc(k.subject)}</h2><span class="mono">${esc(k.no)}</span>${isExec(k)?'<span class="pill warn">تنفيذ</span>':''}${(k.flow==='criminal'||/جزائ/.test(String(k.type||'')))?'<span class="pill bad">جزائي</span>':''}<span class="grow"></span><button class="btn sm" data-act="openCase" data-v="${k.id}">فتح الملف</button></header>
  <div class="bd"><div class="wf-steps st5">${steps}</div>
  <div class="st-now"><div class="st-facts">${facts.length?facts.map(f=>`<div><small>${f[0]}</small><b>${f[1]}</b></div>`).join(''):'<div><small>لا أحداث قادمة</small><b>—</b></div>'}</div>
   <div class="st-next"><button class="btn pri" ${na}>${esc(nt)} ←</button>${st==='active'||st==='appeal'?`<button class="btn sm" data-act="wfGo" data-v="${k.id}|13">تسجيل صدور الحكم</button>`:''}${st!=='closed'&&st!=='study'?`<button class="btn sm" data-act="stClose" data-v="${k.id}">إقفال</button>`:''}<button class="link" data-act="stMap" data-v="${k.id}">${open?'إخفاء الخريطة':'الخريطة المرجعية'}</button></div></div>
  ${open&&root.MQ_flow?MQ_flow.body(k):''}</div></section>`}).join('')}
A.stMap=v=>{S.stMap=S.stMap===v?null:v;render()};
root.MQ_station={notify,bag,nextOf:k=>nextOf(k,stationOf(k,ctx())),stationOf:k=>stationOf(k,ctx()),stageOf:k=>stageOf(k,ctx()),setStation,postModal,closeModal:k=>{CK=k.id;closeModal(k)}};
}(typeof window!=='undefined'?window:globalThis));
/* تنبيه المحامي في الشاشة الرئيسية بالجلسات خلال 48 ساعة */
(function(){if(typeof V==='undefined'||typeof V.dash!=='function')return;const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const at=h=>{const d=new Date(String(h.date)+'T'+(/^\d{1,2}:\d{2}/.test(h.time||'')?h.time.padStart(5,'0'):'09:00')+':00');return d.getTime()};
 const d0=V.dash;V.dash=function(){const html=d0.apply(this,arguments);const now=Date.now();
  const hs=(typeof hearings!=='undefined'?hearings:[]).filter(h=>!h.result).map(h=>({h,ms:at(h),k:K(h.k)})).filter(x=>x.k&&x.k.status!=='منتهية'&&x.ms>now&&x.ms-now<=48*3600e3).sort((a,b)=>a.ms-b.ms);
  if(!hs.length)return html;
  const box=`<section class="hb48" role="alert"><div class="hb48-h"><b>⏰ جلسات خلال 48 ساعة (${hs.length})</b><span>راجع التحضير والمستندات، وتأكد من إبلاغ من يُطلب حضورهم</span></div>${hs.map(({h,ms,k})=>{const left=Math.round((ms-now)/3600e3),c=C(k.client)||{},ct=CT(k.court)||{};
   return `<button class="hb48-r ${left<=12?'hot':''}" data-act="openCase" data-v="${k.id}"><span class="hb48-t">${left<=1?'خلال ساعة':'بعد '+left+' ساعة'}</span><span><b>${esc(k.no)} · ${esc(c.name||'')}</b><small>${dmy(h.date)} ${esc(h.time||'')} · ${esc(ct.name||'')}${h.purpose?' · '+esc(h.purpose):''}</small></span>${h.attend?'<em>حضور الموكل مطلوب · يُذكَّر تلقائياً كل 8 ساعات</em>':''}</button>`}).join('')}</section>`;
  return box+html};
 const css=document.createElement('style');css.textContent='.hb48{margin:0 0 14px;border:1px solid #E7B54A;background:linear-gradient(180deg,#FFF8E6,#FFF2D2);border-radius:14px;padding:10px 12px}.hb48-h{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:baseline;margin-bottom:8px}.hb48-h b{font-size:15px;color:#7A4B00}.hb48-h span{font-size:12.5px;color:#8a6a2e}.hb48-r{all:unset;cursor:pointer;display:flex;align-items:center;gap:12px;padding:8px 10px;border-radius:10px;background:#fff;border:1px solid #F1DDB0;margin-top:6px;width:100%;box-sizing:border-box;flex-wrap:wrap}.hb48-r:hover{border-color:#C8902A}.hb48-r small{display:block;color:#6b7280;font-size:12px}.hb48-t{min-width:84px;font-weight:800;color:#A8741C}.hb48-r.hot .hb48-t{color:#B42318}.hb48-r em{font-style:normal;font-size:11.5px;background:#FDE8E8;color:#9B1C1C;border-radius:999px;padding:2px 8px;margin-inline-start:auto}';document.head.appendChild(css)})();
