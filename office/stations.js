/* محطات القضية الخمس: استقبال وقبول → دراسة وقرار → متابعة (أحداث) → ما بعد الحكم → إقفال
   المحطة تُشتق من بيانات القضية (بوابة القبول، الدراسة، الجلسات، الأحكام، الإقفال) ولا تُنقل يدوياً إلا عبر الشاشات نفسها.
   المرحلة التفصيلية أثناء المتابعة تُشتق من آخر حدث مسجَّل. */
(function(root){
'use strict';
const ST=[{id:'intake',t:'الاستقبال والقبول',i:'🤝'},{id:'study',t:'الدراسة والقرار',i:'⚖️'},{id:'follow',t:'المتابعة',i:'📅'},{id:'post',t:'ما بعد الحكم',i:'📜'},{id:'closed',t:'الإقفال',i:'🗄️'}];
const idx=id=>ST.findIndex(s=>s.id===id);
const gateOk=k=>!!(k&&k.gate&&k.gate.conflictOk&&k.gate.feeOk);
const lastMerits=k=>(k&&k.decisions||[]).filter(d=>d.kind!=='interim').slice(-1)[0]||null;
const lastTrack=k=>(k&&k.track||[]).slice(-1)[0]||null;
const isExec=k=>!!k&&(/^تنفيذ/.test(String(k.type||''))||((lastTrack(k)||{}).lvl==='تنفيذ'));
/* المحطة الحالية */
function stationOf(k,ctx){ctx=ctx||{};const hs=(ctx.hearings||[]).filter(h=>h.k===k.id);
 if(k.status==='منتهية'||k.closed)return 'closed';
 const d=lastMerits(k),t=lastTrack(k);
 if(d&&!(t&&t.from&&t.from>=d.date&&(k.track||[]).length>1)&&!isExec(k))return 'post';
 if(hs.length||k.no&&k.no!=='قيد التسجيل'||k.complaintNo||(k.study&&['court','crime','amic'].includes(k.study.rec))||d||isExec(k))return 'follow';
 if(gateOk(k))return 'study';
 return 'intake'}
/* وصف المرحلة التفصيلية من آخر حدث */
function stageOf(k,ctx){ctx=ctx||{};const today=ctx.today||new Date().toISOString().slice(0,10);const st=stationOf(k,ctx);
 if(st==='closed')return k.closed&&k.closed.result?'مقفلة · '+k.closed.result:'مقفلة';
 if(st==='intake')return gateOk(k)?'بانتظار الدراسة':'بانتظار بوابة القبول';
 if(st==='study')return k.study&&k.study.updated?'الدراسة جارية':'بانتظار الدراسة والقرار';
 if(st==='post'){const d=lastMerits(k);return 'صدر الحكم'+(d&&d.due?' · آخر موعد للطعن '+fmtD(d.due):'')}
 if(isExec(k))return k.execStage||'قيد التنفيذ';
 const hs=(ctx.hearings||[]).filter(h=>h.k===k.id).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 const past=hs.filter(h=>h.date<=today),next=hs.find(h=>h.date>today);
 const crim=k.flow==='criminal'||/جزائ/.test(String(k.type||''));
 if(crim&&k.complaintNo&&(!k.no||k.no==='قيد التسجيل'))return past.length?'قيد التحقيق لدى النيابة':'شكوى مسجلة بانتظار التحقيق';
 if(past.length){const p=String(past[past.length-1].purpose||'');
  const m=/نطق|حجز|للحكم/.test(p)?'محجوزة للحكم':/مرافع/.test(p)?'المرافعات':/بين|شهود|شاهد|خبير/.test(p)?'سماع البينات':/لائح|دفوع|تبادل|رد/.test(p)?'تبادل اللوائح':/تحقيق|استجواب/.test(p)?'التحقيق':/تهم|اتهام|تلاوة/.test(p)?'تلاوة التهمة':/تبليغ/.test(p)?'التبليغات':'قيد النظر · '+p;
  return m+(next?' · الجلسة القادمة '+fmtD(next.date):'')}
 if(next)return 'بانتظار الجلسة الأولى '+fmtD(next.date);
 if(k.no&&k.no!=='قيد التسجيل')return 'مسجلة بانتظار التبليغ وتحديد الجلسة';
 if(k.study&&k.study.rec==='amic')return 'في مرحلة التسوية الودية';
 return crim?'بانتظار تسجيل الشكوى':'قيد إعداد اللائحة وتسجيل الدعوى'}
function fmtD(s){if(!s)return '';const [y,m,d]=String(s).slice(0,10).split('-');return d&&m&&y?`${+d}/${+m}/${y}`:String(s)}
/* تسجيل الانتقال بين المحطات */
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
const MSG={study:k=>'نفيدكم بقبول توكيلنا في قضيتكم وفتح ملفها لدى المكتب، وقد بدأنا دراسة القضية. سنوافيكم بقرارنا وما نحتاجه منكم.',
 follow:(k,w)=>'نفيدكم بأن قضيتكم'+(k.no&&k.no!=='قيد التسجيل'?' رقم '+k.no:'')+' انتقلت إلى مرحلة المتابعة: '+(w||'بدأنا الإجراءات')+'. سنوافيكم بكل جديد.',
 post:k=>'نفيدكم بصدور الحكم في قضيتكم رقم '+k.no+'. نقوم بدراسته وسنوافيكم بتوصيتنا بشأن الطعن أو التنفيذ.',
 closed:(k,w)=>'نفيدكم بإقفال ملف قضيتكم'+(k.no&&k.no!=='قيد التسجيل'?' رقم '+k.no:'')+' لدى المكتب: '+((k.closed&&k.closed.result)||w||'')+'. نشكر ثقتكم، ونحن جاهزون لأي استفسار.',
 intake:k=>'نفيدكم بأن ملف قضيتكم عاد إلى مرحلة الاستقبال لاستكمال المتطلبات.'};
ON_ST=(k,from,to,why)=>{const der=why==='مشتقة من بيانات القضية';if(!from&&der)return;const f=MSG[to];if(f)notify(k,f(k,der?stageOf(k,ctx()):why))};
const sync=k=>{const st=stationOf(k,ctx());if(k.station!==st)setStation(k,st,'مشتقة من بيانات القضية',me());return st};

/* ── المحطة 1: بوابة القبول داخل نموذج فتح الملف نفسه ── */
const GATE_HTML=k=>`<fieldset class="wide cw-h st-gate"><legend>بوابة القبول (إلزامية)</legend>
 <div class="wide" id="stConf"></div>
 <label class="wide ck"><input type="checkbox" id="stC"> فُحص تعارض المصالح على اسم الخصم ولا مانع من قبول التوكيل</label>
 <label>طريقة سداد الأتعاب<select class="field" id="stP">${['دفعة واحدة عند التوكيل','دفعات حسب المراحل','نسبة من المحصَّل','أخرى'].map(x=>`<option>${x}</option>`).join('')}</select></label>
 <label class="ck" style="align-self:end"><input type="checkbox" id="stS"> وُقّعت اتفاقية الأتعاب</label>
 <label class="wide ck"><input type="checkbox" id="stW"> وُقّعت الوكالة الخاصة (أو سُتوقَّع عند التوثيق)</label>
 <p class="m wide" style="margin:0">لا يُفتح الملف قبل فحص التعارض وتوقيع اتفاقية الأتعاب. تُحفظ البوابة على القضية باسم من فتحها وتاريخه.</p></fieldset>`;
const om=root.openModal;
if(typeof om==='function')root.openModal=(...a)=>{om(...a);const f=document.getElementById('fCase');if(!f||document.getElementById('stC'))return;
 const h=f.closest('.modal').querySelector('.head h1');if(h&&!/الاستقبال/.test(h.textContent))h.textContent='الاستقبال والقبول · فتح ملف قضية';
 const btn=f.querySelector('button.btn.pri');btn.insertAdjacentHTML('beforebegin',GATE_HTML());btn.textContent='اجتياز البوابة وفتح الملف';
 const o=f.ncO,box=document.getElementById('stConf');const draw=()=>{if(box&&typeof conflict==='function')box.innerHTML=conflict(o.value||'')};if(o){o.addEventListener('input',draw);draw()}};
let PEND=null;
document.addEventListener('submit',ev=>{const f=ev.target;if(f.id!=='fCase'||!document.getElementById('stC'))return;
 if(f.ncC&&f.ncC.value==='new')return;
 const c=document.getElementById('stC').checked,s=document.getElementById('stS').checked;
 if(!c||!s){ev.preventDefault();ev.stopImmediatePropagation();toast(!c?'أكّد فحص تعارض المصالح أولاً':'لا يُفتح الملف قبل توقيع اتفاقية الأتعاب');document.querySelector('.st-gate').scrollIntoView({block:'center'});return}
 PEND={n:cases.length,other:(f.ncO.value||'').trim(),pay:document.getElementById('stP').value,poa:document.getElementById('stW').checked,fee:Number(f.ncF.value)||0}},true);
document.addEventListener('submit',ev=>{if(ev.target.id!=='fCase'||!PEND)return;const p=PEND;PEND=null;setTimeout(()=>{if(cases.length<=p.n)return;const k=cases[cases.length-1];
 k.gate={other:p.other,conflictOk:true,feeOk:true,poa:p.poa,fee:p.fee,pay:p.pay,at:iso(TODAY),by:me()};k.flowAt=3;setStation(k,'study','اجتازت بوابة القبول',me());save();
 S.view='case';S.caseId=k.id;S.caseTab='study';render();toast('اجتازت القضية بوابة القبول · المحطة التالية: الدراسة والقرار')},0)});

/* ── المحطة 4: قرار ما بعد الحكم (تُفتح تلقائياً عند تسجيل حكم فاصل) ── */
function postModal(k){const d=lastMerits(k);if(!d)return;const lv=lastTrack(k),nx=root.MQ_nextRoute?MQ_nextRoute((lv||{}).lvl||'بداية'):'استئناف',n=d.due?diff(d.due):null,rec=(k.post||{}).rec||'';
 document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog" aria-label="ما بعد الحكم" style="max-width:720px"><div class="head"><div><h1 style="font-size:22px">ما بعد الحكم: قرار الطعن أو التنفيذ</h1><p class="sub">قضية ${esc(k.no)} · ${esc(k.subject||'')}</p></div><button class="btn sm" data-act="close">لاحقاً</button></div>
 <div class="st-post">
  <div class="st-judg"><b>الحكم الصادر بتاريخ ${fmtD(d.date)}</b>${d.text?`<div>${esc(d.text)}</div>`:''}${d.due?`<div class="st-due ${n<0?'gone':n<=5?'bad':n<=15?'warn':''}">آخر موعد لل${esc(nx||'طعن')}: <b>${fmtD(d.due)}</b> · ${n<0?'انقضت المدة':n===0?'اليوم آخر يوم':'متبقٍ '+n+' يوماً'}</div>`:'<div class="m">لا مهلة طعن محسوبة لهذا الحكم.</div>'}</div>
  <form class="form" id="fStPost"><label class="wide">توصية المحامي للموكل<textarea class="field" id="spR" rows="3" placeholder="مثال: الحكم في صالحنا جزئياً؛ ننصح بعدم الطعن والبدء بالتنفيذ…">${esc((k.post||{}).note||'')}</textarea></label>
  <label class="wide ck"><input type="checkbox" id="spM" checked> إبلاغ الموكل عبر البوابة بالقرار المتخذ</label></form>
  <div class="st-opts">
   <button class="st-opt" data-act="stPost" data-v="${k.id}|appeal"><b>الطعن (${esc(nx||'استئناف')})</b><small>تُفتح درجة جديدة في نفس الملف وتُسجَّل مهلة إيداع اللائحة</small></button>
   <button class="st-opt" data-act="stPost" data-v="${k.id}|exec"><b>قبول الحكم والتنفيذ</b><small>يُفتح ملف تنفيذ مستقل مربوط بهذه القضية بمحطاته: إخطار، حجز، تحصيل</small></button>
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
  setStation(k,'follow','قرار الطعن',me());save();if(root.MQ_flow&&MQ_flow.track)MQ_flow.track(k,nx||'استئناف');else{S.view='case';S.caseId=k.id;S.caseTab='track';render()}toast('قُرّر الطعن · أودِع اللائحة قبل '+(d.due?fmtD(d.due):'انقضاء المهلة'));return}
 if(how==='exec'){const id='k'+Date.now();const ex={id,no:'قيد التسجيل',court:k.court,type:'تنفيذ',subject:'تنفيذ الحكم في القضية '+k.no+(k.subject?' · '+k.subject:''),client:k.client,opps:[...(k.opps||[])],role:'طالب التنفيذ',stage:'إخطار المدين',execStage:'إخطار المدين',step:5,status:'نشطة',value:k.value||0,fee:0,opened:iso(TODAY),pri:k.pri||'متوسطة',parent:k.id,gate:{...(k.gate||{}),at:iso(TODAY),by:me(),inherited:true},station:'follow',transitions:[{from:'',to:'follow',at:iso(TODAY),by:me(),why:'ملف تنفيذ للحكم في '+k.no}]};
  cases.push(ex);k.exec=id;k.status='تنفيذ';k.stage='قيد التنفيذ · ملف '+id;setStation(k,'closed','قُبل الحكم وفُتح ملف تنفيذ',me());k.closed={date:iso(TODAY),result:'قبول الحكم والانتقال إلى التنفيذ',archive:''};
  deadlines.push({id:'dl-ex'+Date.now(),k:id,title:'تقديم طلب التنفيذ وإخطار المدين — '+k.no,due:addD(iso(TODAY),10),kind:'تنفيذ',auto:true});
  say('بعد دراسة الحكم الصادر بتاريخ '+fmtD(d.date)+' في قضيتكم رقم '+k.no+'، سنباشر إجراءات التنفيذ لتحصيل حقكم'+(note?'. '+note:'')+'. سنوافيكم بكل خطوة.');save();S.view='case';S.caseId=id;S.caseTab='hub';render();toast('فُتح ملف التنفيذ مربوطاً بالقضية '+k.no);return}
 if(how==='settle'){say('بعد صدور الحكم في قضيتكم رقم '+k.no+'، نعمل على تسوية مع الطرف الآخر لتحصيل حقكم بالتراضي'+(note?'. '+note:''));setStation(k,'follow','تسوية بعد الحكم',me());save();S.view='client';S.clientId=k.client;S.bagTab='settle';render();setTimeout(()=>{const b=document.querySelector('[data-act="stNew"]');if(b)b.click()},80)}};
const addD=(d,n)=>{const x=new Date(d+'T00:00:00');x.setDate(x.getDate()+n);return iso(x)};
/* فتح شاشة ما بعد الحكم تلقائياً بعد تسجيل حكم فاصل */
/* على window لأن معالج phase2 على document يوقف الانتشار */
window.addEventListener('submit',e=>{const f=e.target;if(f.id!=='fDec'||!S.caseId)return;if((document.getElementById('dT')||{}).value==='interim')return;const kid=S.caseId;
 setTimeout(()=>{const k=K(kid);if(!k||!lastMerits(k))return;setStation(k,'post','صدر حكم فاصل',me());save();postModal(k)},150)},true);
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
 if(st==='intake')return ['استكمال بوابة القبول',`data-act="wfGo" data-v="${k.id}|23"`];
 if(st==='study')return [k.study&&k.study.updated?'استكمال الدراسة واتخاذ القرار':'بدء الدراسة والقرار',`data-act="cwNext" data-v="study|${k.id}"`];
 if(st==='post')return [d&&d.due&&diff(d.due)<0?'انقضت مهلة الطعن: قرار التنفيذ أو التسوية':'قرار الطعن أو التنفيذ',`data-act="stPostOpen" data-v="${k.id}"`];
 if(st==='closed')return ['فتح الملف المؤرشف',`data-act="openCase" data-v="${k.id}"`];
 const hs=(typeof hearings!=='undefined'?hearings:[]).filter(h=>h.k===k.id),nh=root.nextH?nextH(k.id):null;
 if(isExec(k))return ['متابعة إجراءات التنفيذ',`data-act="openCase" data-v="${k.id}"`];
 if(k.flow==='criminal'||/جزائ/.test(String(k.type||''))){if(!k.complaintNo)return ['تسجيل الشكوى / المحضر',`data-act="wfGo" data-v="${k.id}|30"`];if(!k.no||k.no==='قيد التسجيل')return ['متابعة التحقيق أو الإحالة',`data-act="wfGo" data-v="${k.id}|35"`]}
 else if(!k.no||k.no==='قيد التسجيل'){if(k.study&&k.study.rec==='amic')return ['إنذار أو اتفاقية تسوية',`data-act="wfGo" data-v="${k.id}|5"`];return ['إعداد اللائحة وتسجيل الدعوى',`data-act="wfGo" data-v="${k.id}|6"`]}
 if(!hs.length)return ['تسجيل التبليغ والجلسة الأولى',`data-act="wfGo" data-v="${k.id}|9"`];
 if(nh)return ['تحضير الجلسة القادمة '+fmtD(nh.date),`data-act="hpGoCase" data-v="${k.id}"`];
 return ['تسجيل ما جرى في آخر جلسة أو الجلسة القادمة',`data-act="wfGo" data-v="${k.id}|9"`]}
A.hpGoCase=v=>{S.view='case';S.caseId=v;S.caseTab='c360';render();if(A.c360Section)A.c360Section('hearing')};
function bag(c,ks){
 const head=`<div class="st-bar"><button class="btn pri" data-act="caseFor" data-v="${c.id}">+ قضية جديدة لهذا الموكل</button></div>`;
 if(!ks.length)return head+'<section class="panel"><div class="empty">لا قضايا لهذا الموكل بعد. ابدأ بالاستقبال والقبول.</div></section>';
 return head+ks.map(k=>{const st=sync(k),si=idx(st),stage=stageOf(k,ctx()),d=lastMerits(k),nh=root.nextH?nextH(k.id):null,dl=(typeof deadlines!=='undefined'?deadlines:[]).filter(x=>x.k===k.id&&diff(x.due)>=0).sort((a,b)=>a.due.localeCompare(b.due))[0],miss=((k.gather||{}).need||[]).filter(n=>n.st==='client'||n.st==='agency').length,[nt,na]=nextOf(k,st),open=S.stMap===k.id;
  const steps=ST.map((s,i)=>`<div class="wfs ${i<si?'done':i===si?'cur':''}"><i>${i<si?'✓':''}</i><b>${s.t}</b><small>${i===si?esc(stage):''}</small></div>`).join('');
  const facts=[nh?['الجلسة القادمة',fmtD(nh.date)+' · '+esc(nh.purpose||'')]:null,dl?['أقرب مهلة',fmtD(dl.due)+' · '+esc(dl.title)]:null,miss?['مستندات ناقصة',miss+' من الموكل أو جهة']:null,d?['آخر حكم',fmtD(d.date)+(d.due?' · الطعن حتى '+fmtD(d.due):'')]:null,k.exec?['ملف التنفيذ','<button class="link mono" data-act="openCase" data-v="'+k.exec+'">'+esc((K(k.exec)||{}).no||k.exec)+'</button>']:null,k.parent?['القضية الأصل','<button class="link mono" data-act="openCase" data-v="'+k.parent+'">'+esc((K(k.parent)||{}).no||'')+'</button>']:null].filter(Boolean);
  return `<section class="panel wf-case st-case"><header><h2>${esc(k.subject)}</h2><span class="mono">${esc(k.no)}</span>${isExec(k)?'<span class="pill warn">تنفيذ</span>':''}${(k.flow==='criminal'||/جزائ/.test(String(k.type||'')))?'<span class="pill bad">جزائي</span>':''}<span class="grow"></span><button class="btn sm" data-act="openCase" data-v="${k.id}">فتح الملف</button></header>
  <div class="bd"><div class="wf-steps st5">${steps}</div>
  <div class="st-now"><div class="st-facts">${facts.length?facts.map(f=>`<div><small>${f[0]}</small><b>${f[1]}</b></div>`).join(''):'<div><small>لا أحداث قادمة</small><b>—</b></div>'}</div>
   <div class="st-next"><button class="btn pri" ${na}>${esc(nt)} ←</button>${st!=='closed'&&st!=='intake'?`<button class="btn sm" data-act="stClose" data-v="${k.id}">إقفال</button>`:''}<button class="link" data-act="stMap" data-v="${k.id}">${open?'إخفاء الخريطة':'الخريطة المرجعية'}</button></div></div>
  ${open&&root.MQ_flow?MQ_flow.body(k):''}</div></section>`}).join('')}
A.stMap=v=>{S.stMap=S.stMap===v?null:v;render()};
root.MQ_station={notify,bag,stationOf:k=>stationOf(k,ctx()),stageOf:k=>stageOf(k,ctx()),setStation,postModal,closeModal:k=>{CK=k.id;closeModal(k)}};
}(typeof window!=='undefined'?window:globalThis));
