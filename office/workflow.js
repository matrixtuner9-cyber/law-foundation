/* مخطط سير القضية منذ التوكيل حتى التنفيذ أو الإقفال — مساران: حقوقي وجزائي، يُختار تلقائياً بنوع القضية */
(function(root){
'use strict';
/* s = رقم المرحلة في STEPS: 0 التسجيل 1 تبادل اللوائح 2 البينات 3 المرافعة 4 الحكم 5 التنفيذ */
const N=[
 {id:1,t:'توكيل المحامي',s:0,i:'🤝'},{id:23,t:'فحص تعارض المصالح واتفاقية الأتعاب',s:0,i:'🛡️'},{id:2,t:'فتح ملف القضية',s:0,i:'📁'},{id:3,t:'جمع المعلومات والمستندات',s:0,i:'📄'},{id:4,t:'الدراسة القانونية والتقييم الأولي',s:0,i:'⚖️'},
 {id:5,t:'تفاوض / إنذار قانوني / تسوية',s:0,i:'💬',br:'amic'},{id:6,t:'إعداد اللائحة أو الدعوى',s:0,i:'📝'},{id:7,t:'تسجيل الدعوى لدى المحكمة المختصة',s:0,i:'🏛️'},
 {id:8,t:'التبليغات',s:1,i:'✉️'},{id:9,t:'الجلسات الأولى',s:1,i:'👥'},{id:10,t:'تبادل اللوائح والدفوع',s:1,i:'📑'},{id:11,t:'تقديم البينات والمرافعات',s:2,i:'🗂️'},
 {id:12,t:'حجز القضية للحكم',s:3,i:'🔨'},{id:13,t:'صدور الحكم',s:4,i:'📜'},{id:14,t:'دراسة الحكم وتبليغه للموكل',s:4,i:'📋'},
 {id:15,t:'استئناف / طعن',s:4,i:'📄',br:'appeal'},{id:16,t:'إجراءات الطعن والفصل فيه',s:4,i:'🏛️',br:'appeal'},
 {id:17,t:'الحكم النهائي',s:4,i:'🔨'},{id:18,t:'اكتساب الحكم الدرجة القطعية',s:4,i:'✅'},{id:19,t:'فتح ملف التنفيذ',s:5,i:'📁'},{id:20,t:'إجراءات التنفيذ',s:5,i:'⚙️'},
 {id:21,t:'تحصيل الحق أو إنهاء التنفيذ',s:5,i:'💰'},{id:22,t:'إقفال الملف وأرشفته',s:5,i:'🗄️'},
 {id:90,t:'إقفال الملف (تمت التسوية)',s:5,i:'✅',br:'amic'},
 /* المسار الجزائي */
 {id:30,t:'الشكوى / الضبط لدى الشرطة أو النيابة',s:0,i:'🚨'},{id:31,t:'التحقيق الابتدائي لدى النيابة العامة',s:1,i:'🔎'},{id:32,t:'التوقيف والكفالة',s:1,i:'🔐'},
 {id:34,t:'التظلم من قرار حفظ الأوراق',s:1,i:'📨',br:'keep'},{id:35,t:'الإحالة ولائحة الاتهام',s:1,i:'🏛️'},{id:36,t:'جلسات المحاكمة',s:2,i:'👥'},
 {id:37,t:'البينات والشهود والمرافعة',s:3,i:'🗂️'},{id:38,t:'صدور الحكم الجزائي',s:4,i:'📜'},{id:39,t:'دراسة الحكم وتبليغه للموكل',s:4,i:'📋'},
 {id:40,t:'تنفيذ الحكم الجزائي (العقوبة / الغرامة / الحق المدني)',s:5,i:'⚙️'},{id:91,t:'الصلح الجزائي / التنازل عن الشكوى',s:5,i:'✅',br:'amic'}];
const byId=Object.fromEntries(N.map(n=>[n.id,n]));
const DEC=(q,y,n)=>({q,y,n});
/* المسار الحقوقي (الافتراضي) والمسار الجزائي: المسار الرئيسي المتسلسل، والمراحل، وتخطيط المخطط الكامل */
const PROFILES={
 civil:{id:'civil',t:'المسار الحقوقي',MAIN:[1,23,2,3,4,6,7,8,9,10,11,12,13,14,17,18,19,20,21,22],
  PH:[{id:'prep',t:'التهيئة والدراسة',n:[1,23,2,3,4]},{id:'amic',t:'الحل الودي',n:[5,90],side:true},{id:'court',t:'التقاضي أمام المحكمة',n:[6,7,8,9,10,11,12,13,14]},{id:'appeal',t:'الطعن والاستئناف',n:[15,16],side:true},{id:'final',t:'الحكم النهائي والتنفيذ',n:[17,18,19,20,21,22]}],
  COLS:[{t:'١ · التهيئة والدراسة',x:[1,23,2,3,4,DEC('هل يمكن الحل وديّاً؟','تفاوض وتسوية','إلى رفع الدعوى')]},{t:'الحل الودي',side:true,x:[5,DEC('هل تمت التسوية؟','إقفال الملف','المتابعة بالدعوى'),90]},{t:'٢ · التقاضي أمام المحكمة',x:[6,7,8,9,10,11,12,13,14,DEC('هل يوجد طعن أو استئناف؟','استئناف/طعن','الحكم النهائي')]},{t:'الطعن والاستئناف',side:true,x:[15,16,{m:'ثم يعود المسار إلى «الحكم النهائي»'}]},{t:'٣ · الحكم النهائي والتنفيذ',x:[17,18,19,20,21,22]}]},
 criminal:{id:'criminal',t:'المسار الجزائي',MAIN:[1,23,2,3,4,30,31,32,35,36,37,38,39,17,18,40,22],
  PH:[{id:'prep',t:'التهيئة والدراسة',n:[1,23,2,3,4]},{id:'amic',t:'الصلح الجزائي',n:[5,91],side:true},{id:'invest',t:'الشكوى والتحقيق',n:[30,31,32,34]},{id:'court',t:'المحاكمة',n:[35,36,37,38,39]},{id:'appeal',t:'الطعن',n:[15,16],side:true},{id:'final',t:'الحكم النهائي والتنفيذ',n:[17,18,40,22]}],
  COLS:[{t:'١ · التهيئة والدراسة',x:[1,23,2,3,4,DEC('هل الجريمة قابلة للصلح أو التنازل؟','صلح جزائي','إلى الشكوى والتحقيق')]},{t:'الصلح الجزائي',side:true,x:[5,91]},{t:'٢ · الشكوى والتحقيق',x:[30,31,32,DEC('هل أحالت النيابة الدعوى؟','لائحة الاتهام','حفظ الأوراق → التظلم'),34]},{t:'٣ · المحاكمة',x:[35,36,37,38,39,DEC('هل يوجد طعن؟','استئناف/نقض','الحكم النهائي')]},{t:'الطعن',side:true,x:[15,16,{m:'ثم يعود المسار إلى «الحكم النهائي»'}]},{t:'٤ · الحكم النهائي والتنفيذ',x:[17,18,40,22]}]}};
const MAIN=PROFILES.civil.MAIN,PH=PROFILES.civil.PH;
function profileOf(k){if(!k)return PROFILES.civil;if(k.flow&&PROFILES[k.flow])return PROFILES[k.flow];
 const cat=typeof root.catOf==='function'?(root.catOf(k)||{}).k:'';return cat==='criminal'||/جزائ|جنائ|جنح|جناي/.test(String(k.type||''))?PROFILES.criminal:PROFILES.civil}
function firstOf(step,main){main=main||MAIN;const n=main.map(id=>byId[id]).find(x=>x&&x.s===(step||0));return n?n.id:1}
function currentId(k){const p=profileOf(k);if(k&&byId[k.flowAt]&&(p.MAIN.includes(k.flowAt)||p.PH.some(ph=>ph.n.includes(k.flowAt))))return k.flowAt;return firstOf(k&&k.step,p.MAIN)}
function state(id,cur,main){main=main||MAIN;if(id===cur)return'cur';const a=main.indexOf(id),b=main.indexOf(cur);if(a<0||b<0)return'';return a<b?'done':''}
function phaseOf(cur,ph){ph=ph||PH;return ph.find(p=>p.n.includes(cur))||ph[0]}
function phaseState(p,cur,prof){prof=prof||PROFILES.civil;const c=phaseOf(cur,prof.PH);if(p===c)return'cur';const settled=cur===90||cur===91;
 if(p.side)return settled&&p.id==='amic'?'done':'';
 const last=[...p.n].reverse().find(id=>prof.MAIN.includes(id)),a=prof.MAIN.indexOf(last),b=prof.MAIN.indexOf(cur);return (a>=0&&b>a)||settled?'done':''}
const api={N,MAIN,PH,PROFILES,byId,firstOf,currentId,state,phaseOf,phaseState,profileOf};
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
 23:['بوابة القبول: التعارض والأتعاب',k=>gateModal(k)],
 2:['فتح ملف قضية جديدة للموكل',k=>{if(!(k.gate&&k.gate.conflictOk&&k.gate.feeOk))toast('تنبيه: لم تُستكمل بوابة القبول (فحص التعارض واتفاقية الأتعاب) لهذا الملف');if(A.caseFor)A.caseFor(k.client)}],
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
 22:['إقفال الملف وأرشفته',k=>closeModal(k)],
 /* المسار الجزائي */
 30:['بيانات الشكوى أو المحضر',k=>choose('الشكوى / الضبط',[['تسجيل بيانات الشكوى','رقم الشكوى أو المحضر والجهة والتاريخ',()=>regModal(k,'crime')],['نموذج شكوى جزائية','من الطلبات القضائية',()=>goTpl(k,'الطلبات القضائية')]])],
 31:['جلسات التحقيق ومحاضره',k=>choose('التحقيق لدى النيابة',[['تسجيل جلسة تحقيق','موعد الاستجواب أو سماع الأقوال',()=>goCase(k,'hearings',()=>{const p=document.getElementById('hP');if(p){p.value='جلسة تحقيق لدى النيابة العامة';p.closest('form').scrollIntoView({block:'center'})}})],['محضر الأقوال','ملاحظة مؤرخة في سجل القضية',()=>{if(A.hubNote)A.hubNote(k.id)}]])],
 32:['طلب إفراج بالكفالة ومهل التوقيف',k=>choose('التوقيف والكفالة',[['طلب إفراج بالكفالة','من الطلبات القضائية',()=>goTpl(k,'الطلبات القضائية')],['مهلة تمديد التوقيف','تسجيل آخر يوم في التوقيف الحالي',()=>goCase(k,'hub',()=>{if(A.hubTab)A.hubTab('deadlines')})]])],
 34:['تظلم من قرار الحفظ',k=>goTpl(k,'الطعون')],
 35:['رقم الدعوى الجزائية والمحكمة',k=>regModal(k,'crim')],
 36:['إضافة جلسة محاكمة',k=>goCase(k,'hearings',()=>{const f=document.getElementById('fH');if(f)f.scrollIntoView({block:'center'})})],
 37:['البينات والشهود في ملف 360°',k=>goCase(k,'c360',()=>{if(A.c360Section)A.c360Section('evidence')})],
 38:['تسجيل الحكم ومهلة الطعن',k=>track(k)],
 39:['إبلاغ الموكل بالحكم',k=>GO[14][1](k)],
 40:['تنفيذ العقوبة أو الغرامة أو الحق المدني',k=>choose('تنفيذ الحكم الجزائي',[['نقل القضية إلى التنفيذ','ملف تنفيذ للحق المدني أو الغرامة',()=>track(k,'تنفيذ')],['مهلة دفع الغرامة / تنفيذ العقوبة','تسجيل مهلة متابعة',()=>goCase(k,'hub',()=>{if(A.hubTab)A.hubTab('deadlines')})]])],
 91:['إسقاط الحق الشخصي / الصلح',k=>track(k,'تسوية ودية')]};
/* بوابة القبول: فحص تعارض المصالح واتفاقية الأتعاب قبل فتح الملف */
function gateModal(k){const g=k.gate||{},c=C(k.client)||{},q=g.other||oppNames(k)||'';
 document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog" aria-label="بوابة القبول"><div class="head"><div><h1 style="font-size:22px">بوابة القبول: التعارض والأتعاب</h1><p class="sub">لا يُفتح ملف ولا تُرفع دعوى قبل اجتياز هذه البوابة</p></div><button class="btn sm" data-act="close">إغلاق</button></div>
 <form class="form" id="fWfGate">
  <label class="wide">الطرف الآخر (لفحص تعارض المصالح)<input class="field" id="wgQ" value="${esc(q)}" placeholder="اسم الخصم أو وكيله"></label>
  <div class="wide" id="wgRes">${typeof conflict==='function'?conflict(q):''}</div>
  <label class="wide ck"><input type="checkbox" id="wgC" ${g.conflictOk?'checked':''}> فُحص التعارض ولا مانع من قبول التوكيل</label>
  <label>الأتعاب المتفق عليها ₪<input class="field" id="wgF" type="number" min="0" value="${esc(k.fee||g.fee||c.fee||'')}"></label>
  <label>طريقة السداد<select class="field" id="wgP">${['دفعة واحدة عند التوكيل','دفعات حسب المراحل','نسبة من المحصَّل','أخرى'].map(x=>`<option ${g.pay===x?'selected':''}>${x}</option>`).join('')}</select></label>
  <label class="wide ck"><input type="checkbox" id="wgS" ${g.feeOk?'checked':''}> وُقّعت اتفاقية الأتعاب مع الموكل</label>
  <div class="toolbar wide"><button class="btn pri">حفظ واجتياز البوابة</button><button type="button" class="btn" data-act="wfGateTpl" data-v="${k.id}">نموذج اتفاقية الأتعاب</button><button type="button" class="btn" data-act="nav" data-v="opps">شاشة التعارض الكاملة</button></div>
 </form></div></div>`;
 const i=document.getElementById('wgQ'),r=document.getElementById('wgRes');if(i&&r&&typeof conflict==='function')i.oninput=()=>{r.innerHTML=conflict(i.value)}}
A.wfGateTpl=v=>{const k=K(v);if(!k)return;A.close();S.tplCase=k.id;S.tpl='t6';S.view='tpls';render();if(A.ptCategory)A.ptCategory('الاتفاقيات');window.scrollTo(0,0)};
function regModal(k,mode){REG=mode||'';const T=mode==='crime'?['تسجيل الشكوى أو المحضر','رقم الشكوى / المحضر','تاريخ الشكوى','الجهة (مركز الشرطة / النيابة)','حفظ والانتقال إلى التحقيق']:mode==='crim'?['الإحالة إلى المحكمة','رقم الدعوى الجزائية','تاريخ الإحالة','المحكمة المختصة','حفظ والانتقال إلى الجلسات']:['تسجيل الدعوى لدى المحكمة','رقم الدعوى','تاريخ التسجيل','المحكمة','حفظ والانتقال إلى التبليغات'];
 document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog"><div class="head"><h1 style="font-size:22px">${T[0]}</h1><button class="btn sm" data-act="close">إغلاق</button></div><form class="form" id="fWfReg">
 <label>${T[1]}<input class="field mono" id="wrNo" value="${esc(mode==='crime'?(k.complaintNo||''):(k.no||''))}" placeholder="0000/2026" required></label><label>${T[2]}<input class="field" type="date" id="wrD" value="${esc(mode==='crime'?(k.complaintAt||iso(TODAY)):(k.opened||iso(TODAY)))}"></label>
 <label class="wide">${T[3]}<select class="field" id="wrC">${courts.map(c=>`<option value="${c.id}" ${c.id===k.court?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label>
 <label class="wide">ملاحظة (الرسوم، رقم الإيصال…)<input class="field" id="wrN"></label>
 <button class="btn pri">${T[4]}</button></form></div></div>`;document.getElementById('wrNo').focus()}
let REG='';
function finalModal(k){const f=k.final||{};document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog"><div class="head"><h1 style="font-size:22px">اكتساب الحكم الدرجة القطعية</h1><button class="btn sm" data-act="close">إغلاق</button></div><form class="form" id="fWfFinal">
 <label>تاريخ اكتساب الدرجة القطعية<input class="field" type="date" id="wfD" value="${esc(f.date||iso(TODAY))}" required></label><label>السبب<select class="field" id="wfW">${['انقضاء مدة الطعن دون طعن','صدور حكم الاستئناف','صدور قرار النقض','تنازل عن الطعن'].map(x=>`<option ${f.why===x?'selected':''}>${x}</option>`).join('')}</select></label>
 <label class="wide">ملاحظة<input class="field" id="wfN" value="${esc(f.note||'')}"></label>
 <button class="btn pri">حفظ والانتقال إلى التنفيذ</button></form></div></div>`}
function closeModal(k){document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog"><div class="head"><h1 style="font-size:22px">إقفال الملف وأرشفته</h1><button class="btn sm" data-act="close">إغلاق</button></div><form class="form" id="fWfClose">
 <label>تاريخ الإقفال<input class="field" type="date" id="wcD" value="${iso(TODAY)}" required></label><label>النتيجة النهائية<select class="field" id="wcR">${['تحصيل الحق كاملاً','تحصيل جزئي','تسوية ودية','رد الدعوى','تنازل الموكل','أخرى'].map(x=>`<option>${x}</option>`).join('')}</select></label>
 <label class="wide">رقم الأرشفة / مكان الملف الورقي<input class="field" id="wcA" placeholder="مثال: خزانة 3 — رف ب"></label>
 <p class="note wide">تُنقل القضية إلى «منتهية» ويبقى ملفها كاملاً للرجوع إليه.</p>
 <button class="btn pri" style="background:var(--danger)">إقفال الملف</button></form></div></div>`}
document.addEventListener('submit',e=>{const f=e.target;if(!['fWfReg','fWfFinal','fWfClose','fWfGate'].includes(f.id))return;e.preventDefault();e.stopImmediatePropagation();
 if(root.MQ&&MQ.readOnly)return toast('صلاحيتك للاطلاع فقط');const k=K(WK);if(!k)return;const g=id=>(document.getElementById(id)||{}).value||'';
 if(f.id==='fWfReg'){if(REG==='crime'){k.complaintNo=g('wrNo').trim();k.complaintAt=g('wrD');k.complaintAtOrg=(CT(g('wrC'))||{}).name||'';if(g('wrN').trim())k.regNote=g('wrN').trim();k.flowAt=31;A.close();saveK();toast('سُجّلت الشكوى رقم '+k.complaintNo);if(root.MQ_station)MQ_station.notify(k,'نفيدكم بتسجيل الشكوى في قضيتكم برقم '+k.complaintNo+(k.complaintAtOrg?' لدى '+k.complaintAtOrg:'')+'، وسنتابع التحقيق ونوافيكم بالمواعيد.');goCase(k,'hearings')}
  else{k.no=g('wrNo').trim()||k.no;k.opened=g('wrD')||k.opened;k.court=g('wrC')||k.court;if(g('wrN').trim())k.regNote=g('wrN').trim();k.flowAt=REG==='crim'?36:8;k.step=Math.max(k.step||0,REG==='crim'?1:0);A.close();saveK();toast('سُجّلت الدعوى برقم '+k.no);if(root.MQ_station)MQ_station.notify(k,'نفيدكم بتسجيل دعواكم لدى '+((CT(k.court)||{}).name||'المحكمة')+' برقم '+k.no+'، وسنوافيكم بموعد الجلسة الأولى.');if(REG==='crim')goCase(k,'hearings');else goCase(k,'hub',()=>{if(A.hubTab)A.hubTab('deadlines')})}}
 if(f.id==='fWfGate'){const ok=!!(document.getElementById('wgC')||{}).checked,fo=!!(document.getElementById('wgS')||{}).checked,fee=Number(g('wgF'))||0;
  k.gate={other:g('wgQ').trim(),conflictOk:ok,feeOk:fo,fee,pay:g('wgP'),at:iso(TODAY),by:(root.MQ&&MQ.user&&MQ.user.name)||''};if(fee&&!k.fee)k.fee=fee;
  if(ok&&fo&&(!k.flowAt||k.flowAt<23))k.flowAt=23;A.close();saveK();render();toast(ok&&fo?'اجتازت القضية بوابة القبول':'حُفظت البوابة، وما زالت غير مكتملة');if(ok&&fo&&root.MQ_station)MQ_station.notify(k,'نفيدكم بقبول توكيلنا في قضيتكم وتوقيع اتفاقية الأتعاب، وسنباشر العمل على ملفكم.')}
 if(f.id==='fWfFinal'){k.final={date:g('wfD'),why:g('wfW'),note:g('wfN').trim()};k.stage='حكم قطعي';k.flowAt=19;A.close();saveK();toast('سُجّل اكتساب الحكم الدرجة القطعية');if(root.MQ_station)MQ_station.notify(k,'نفيدكم بأن الحكم في قضيتكم رقم '+k.no+' اكتسب الدرجة القطعية، وننتقل إلى إجراءات التنفيذ.');track(k,'تنفيذ')}
 if(f.id==='fWfClose'){k.status='منتهية';k.stage='مقفلة ومؤرشفة';k.closed={date:g('wcD'),result:g('wcR'),archive:g('wcA').trim()};k.flowAt=22;k.step=Math.max(k.step||0,5);A.close();saveK();toast('أُقفل الملف وأُرشف');if(root.MQ_station)MQ_station.notify(k,'نفيدكم بإقفال ملف قضيتكم'+(k.no?' رقم '+k.no:'')+': '+k.closed.result+'. نشكر ثقتكم.');goBag(k,'cases')}
});
/* متابعة ما يُسجَّل في «مسار التقاضي»: تحريك المخطط، وتنبيه الموكل والمكتب عند صدور حكم أو نقل القضية إلى درجة أخرى */
const APPEAL=['استئناف','نقض','إعادة محاكمة'];
const addD=(d,n)=>{const x=new Date(d+'T00:00:00');x.setDate(x.getDate()+n);return iso(x)};
document.addEventListener('submit',e=>{const f=e.target;if(!['fDec','fMove'].includes(f.id)||!S.caseId)return;const k=K(S.caseId);if(!k)return;const c=C(k.client)||{};
 if(f.id==='fMove'){const l=(document.getElementById('mL')||{}).value,d=(document.getElementById('mD')||{}).value||iso(TODAY),ct=CT((document.getElementById('mC')||{}).value)||{},no=((document.getElementById('mN')||{}).value||'').trim(),tell=!!(document.getElementById('mM')||{checked:true}).checked;
  k.flowAt=APPEAL.includes(l)?16:l==='تنفيذ'?19:l==='تسوية ودية'?90:k.flowAt;
  setTimeout(()=>{const kk=K(k.id);if(!kk)return;
   const what=l==='تنفيذ'?'فتح ملف التنفيذ':l==='تسوية ودية'?'إنهاء القضية بتسوية ودية':'تحويل القضية إلى مرحلة '+l;
   if(tell&&l!=='تسوية ودية'&&typeof sendMsg==='function')sendMsg(kk.client,'نفيدكم بأنه تم '+what+(ct.name?' لدى '+ct.name:'')+' بتاريخ '+dmy(d)+(no?' برقم '+no:'')+(APPEAL.includes(l)?'. سنوافيكم بموعد أول جلسة فور تحديده، وقد لا يُشترط حضوركم إلا إذا طلبناه.':'. سنتابع الإجراءات ونوافيكم بكل جديد.'),c.ch||'البوابة');
   const due=addD(d,APPEAL.includes(l)?7:l==='تنفيذ'?10:3),title=APPEAL.includes(l)?'متابعة قيد '+l+' وتحديد أول جلسة — '+kk.no:l==='تنفيذ'?'متابعة إشعار التنفيذ وتبليغ المدين — '+kk.no:'إقفال الملف بعد التسوية — '+kk.no;
   if(!deadlines.some(x=>x.k===kk.id&&x.title===title))deadlines.push({id:'dl-wf'+Date.now(),k:kk.id,title,due,kind:'متابعة',auto:true});
   if(root.MQ&&MQ.saveState)MQ.saveState();if(root.MQ_announce&&MQ_announce.say)try{MQ_announce.say(what+' في قضية '+kk.no)}catch(x){}
   toast(what+(tell&&l!=='تسوية ودية'?' وأُبلغ الموكل':'')+' · مهلة متابعة '+dmy(due));render()},0)}
 if(f.id==='fDec'&&(document.getElementById('dT')||{}).value!=='interim'){const lv=(k.track||[]).slice(-1)[0];k.flowAt=lv&&APPEAL.some(a=>(lv.lvl||'').includes(a))?17:(profileOf(k).id==='criminal'?38:13);
  setTimeout(()=>{const kk=K(k.id),dd=(kk.decisions||[]).slice(-1)[0];if(!kk||!dd)return;
   const title='دراسة الحكم وقرار الطعن — '+kk.no,due=dd.due?addD(dd.due,-5):addD(dd.date||iso(TODAY),7);
   if(!deadlines.some(x=>x.k===kk.id&&x.title===title))deadlines.push({id:'dl-wj'+Date.now(),k:kk.id,title,due:due<iso(TODAY)?iso(TODAY):due,kind:'متابعة',auto:true,dec:dd.id});
   if(root.MQ&&MQ.saveState)MQ.saveState();if(root.MQ_announce&&MQ_announce.say)try{MQ_announce.say('صدر الحكم في قضية '+kk.no+(dd.due?'، آخر موعد للطعن '+dmy(dd.due):''))}catch(x){}
   render()},0)}},true);
/* خانة «إبلاغ الموكل» في نموذج نقل القضية */
const wrapTrack=()=>{const t0=root.trackTab;if(typeof t0!=='function'||t0._wf)return false;const w=k=>String(t0(k)).replace('<button class="btn">نقل القضية</button>','<label class="wide ck"><input type="checkbox" id="mM" checked> إبلاغ الموكل عبر البوابة بنقل القضية إلى الدرجة الجديدة</label><button class="btn">نقل القضية</button>');w._wf=1;root.trackTab=w;return true};
if(!wrapTrack())addEventListener('load',wrapTrack);
let WK=null;const saveK=()=>{if(root.MQ&&MQ.saveState)MQ.saveState()};
A.wfGo=v=>{const [a,b]=String(v).split('|'),k=K(b?a:S.caseId),id=+(b||a),g=GO[id];if(!k)return;WK=k.id;if(!g)return;if(root.MQ&&MQ.readOnly&&![3,4,11,13,15,17,20,37,38].includes(id))return toast('صلاحيتك للاطلاع فقط');g[1](k)};
let PROF=PROFILES.civil;
const node=(n,cur,label,kid)=>{const st=state(n.id,cur,PROF.MAIN);
 return `<div class="wf-n ${st}"><button class="wf-go" data-act="wfGo" data-v="${kid?kid+'|':''}${n.id}" title="${esc(GO[n.id]?GO[n.id][0]:'')}"><span class="wf-i">${n.i}</span><b>${esc(n.t)}</b>${GO[n.id]?`<small class="wf-h">${esc(GO[n.id][0])}</small>`:''}</button><span class="wf-no">${label||n.id}</span>${st==='cur'?'<em>المرحلة الحالية</em>':`<button class="wf-pin" data-act="wfAt" data-v="${kid?kid+'|':''}${n.id}" title="تعيين كمرحلة حالية" aria-label="تعيين كمرحلة حالية">⚑</button>`}</div>`};
const arrow='<div class="wf-ar" aria-hidden="true">↓</div>';
let KID=null;
const chain=(ids,cur)=>ids.map((id,i)=>(i?arrow:'')+node(byId[id],cur,null,KID)).join('');
const dec=(q,yes,no)=>`<div class="wf-d"><div class="wf-q">${q}</div><div class="wf-yn"><span class="y">نعم: ${yes}</span><span class="n">لا: ${no}</span></div></div>`;

function body(k){KID=k.id;PROF=profileOf(k);const cur=currentId(k),mk=byId[cur],ST=window.STEPS||[];
 const col=c=>`<div class="wf-col ${c.side?'wf-side':''}"><h3>${esc(c.t)}</h3>${c.x.map((x,i)=>(i&&!(x&&x.m)?arrow:'')+(typeof x==='number'?node(byId[x],cur,x===5?'5':x===90||x===91?'✓':null,KID):x.q?dec(x.q,x.y,x.n):`<div class="wf-m">${esc(x.m)}</div>`)).join('')}</div>`;
 return `<section class="panel wf"><header><h2>مخطط سير القضية</h2><span class="pill">${esc(PROF.t)}</span><span class="pill">${mk?esc(mk.t):''}</span></header><div class="bd">
 <p class="wf-note">${PROF.id==='criminal'?'المسار الجزائي: من التوكيل إلى الشكوى والتحقيق فالمحاكمة والطعن والتنفيذ.':'المسار الحقوقي: من التوكيل حتى التنفيذ أو الإقفال.'} اضغط أي صندوق لفتح إجرائه مباشرة، والعلم ⚑ لتعيين المرحلة الحالية للقضية (تُحدَّث «خطوة القضية» تلقائياً${ST.length?': '+esc(ST[mk?mk.s:0]||''):''}). <button class="link" data-act="wfFlow" data-v="${k.id}|${PROF.id==='criminal'?'civil':'criminal'}">تبديل إلى ${PROF.id==='criminal'?'المسار الحقوقي':'المسار الجزائي'}</button></p>
 <div class="wf-grid">${PROF.COLS.map(col).join('')}</div></div></section>`}
A.wfFlow=v=>{if(root.MQ&&MQ.readOnly)return toast('صلاحيتك للاطلاع فقط');const [kid,f]=v.split('|'),k=K(kid);if(!k||!PROFILES[f])return;k.flow=f;if(k.flowAt&&!PROFILES[f].MAIN.includes(k.flowAt)&&!PROFILES[f].PH.some(p=>p.n.includes(k.flowAt)))delete k.flowAt;saveK();render();toast('تحوّلت القضية إلى '+PROFILES[f].t)};
A.wfAt=v=>{if(root.MQ&&MQ.readOnly){toast('صلاحيتك للاطلاع فقط');return}
 const [a,b]=String(v).split('|'),k=K(b?a:S.caseId),n=byId[+(b||a)];if(!k||!n)return;k.flowAt=n.id;k.step=n.s;
 if(root.MQ&&MQ.saveState)MQ.saveState();if(root.MQ_station)MQ_station.notify(k,'نفيدكم بتحديث مرحلة قضيتكم'+(k.no&&k.no!=='قيد التسجيل'?' رقم '+k.no:'')+' إلى: '+n.t+'.');render();toast('حُدّدت المرحلة وأُبلغ الموكل: '+n.t)};
/* حقيبة الموكل: قضايا الموكل مرتبة على مسار السير */
function bag(c,ks){
 if(!ks.length)return '<section class="panel"><div class="empty">لا قضايا لهذا الموكل بعد. تبدأ الحقيبة بالتوكيل وفتح ملف القضية.</div></section>';
 return ks.map(k=>{PROF=profileOf(k);const cur=currentId(k),ph=phaseOf(cur,PROF.PH),mk=byId[cur];
  const hs=(typeof hearings!=='undefined'?hearings:[]).filter(h=>h.k===k.id),nh=root.nextH?nextH(k.id):null,ds=(typeof docs!=='undefined'?docs:[]).filter(d=>d.k===k.id),dl=(typeof deadlines!=='undefined'?deadlines:[]).filter(d=>d.k===k.id&&diff(d.due)>=0),st=(k.settles||[]).length;
  const gate=k.gate&&k.gate.conflictOk&&k.gate.feeOk;const info={prep:(gate?'بوابة القبول ✓ · ':'بوابة القبول ناقصة · ')+ds.length+' مستند',amic:st?st+' اتفاقية تسوية':'لا تسوية',invest:(k.complaintNo?'شكوى '+k.complaintNo:'لا شكوى مسجلة'),court:hs.length+' جلسة'+(nh?' · القادمة '+dmy(nh.date):''),appeal:'',final:dl.length?dl.length+' مهلة قائمة':esc(k.status)};
  const steps=PROF.PH.map(p=>{const s2=phaseState(p,cur,PROF);return `<div class="wfs ${s2} ${p.side?'side':''}"><i>${s2==='done'?'✓':''}</i><b>${p.t}</b><small>${info[p.id]||''}</small></div>`}).join('');
  const nodes=ph.n.map(id=>node(byId[id],cur,null,k.id)).join('');
  const open=S.wfOpen===k.id;
  return `<section class="panel wf-case"><header><h2>${esc(k.subject)}</h2><span class="mono">${esc(k.no)}</span><span class="pill ${PROF.id==='criminal'?'bad':''}">${esc(PROF.t)}</span><span class="pill">${esc(mk.t)}</span><span class="grow"></span>${ph.id==='amic'||st?`<button class="btn sm" data-act="bagTab" data-v="settle">التسويات</button>`:''}<button class="btn sm" data-act="openCase" data-v="${k.id}">فتح ملف القضية</button></header>
  <div class="bd"><div class="wf-steps">${steps}</div>
  <div class="wf-nodes"><div class="wf-ph">${esc(ph.t)}</div><div class="wf-row">${nodes}</div></div>
  <button class="link" data-act="wfOpen" data-v="${k.id}">${open?'إخفاء المخطط الكامل':'عرض المخطط الكامل للقضية'}</button>${open?body(k):''}</div></section>`}).join('')}
A.wfOpen=v=>{S.wfOpen=S.wfOpen===v?null:v;render()};
root.MQ_flow={body,bag,track};root.MQ_wf=api;
}(typeof window!=='undefined'?window:globalThis));
