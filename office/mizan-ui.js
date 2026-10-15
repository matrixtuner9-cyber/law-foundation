/* ── الربط الفعلي مع ميزان 2 ── بيانات الدخول (تُحفظ مشفّرة على جهاز المكتب) وتشغيل الدخول الآلي وقراءة القضايا */
(function(){
if(!location.protocol.startsWith('http'))return;
const MZ={status:null,log:[],editing:false,show:true};
const esc2=s=>esc(s);
async function refresh(){try{MZ.status=await(await fetch('/api/mizan/status')).json()}catch(e){MZ.status={error:true}}if(S.view==='mizan')render()}
const post=(u,b)=>fetch(u,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b||{})}).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error||'تعذّر التنفيذ');return j});
function addLog(o){MZ.log.unshift({t:new Date().toTimeString().slice(0,8),...o});MZ.log=MZ.log.slice(0,40);
 const el=document.getElementById('mzLog');if(el)el.innerHTML=logHTML()}
function logHTML(){return MZ.log.length?MZ.log.map(l=>`<li class="${l.ok===false||l.error?'bad':l.done||l.stage==='in'||l.stage==='captured'?'good':''}"><time class="mono">${l.t}</time><span>${esc2(l.error||l.msg||(l.done?(l.ok?'انتهت العملية بنجاح':'فشلت العملية'):''))}</span></li>`).join(''):'<li class="idle"><span>ستظهر هنا خطوات الدخول والقراءة لحظة بلحظة.</span></li>'}

function panel(){
 const s=MZ.status||{},on=s.configured&&!MZ.editing,last=s.last;
 const pill=s.running?'<span class="pill warn"><span class="spin"></span> قيد التنفيذ</span>':last?(last.ok?'<span class="pill ok">آخر دخول ناجح · '+esc2(last.at)+'</span>':'<span class="pill bad">آخر محاولة فشلت · '+esc2(last.at)+'</span>'):s.configured?'<span class="pill">لم يُجرَّب بعد</span>':'<span class="pill">غير مهيّأ</span>';
 return `<section class="panel mzc"><header><div><h2>الاتصال الفعلي بميزان 2</h2><div class="mzc-sub">الدخول كـ «حارس العدالة» · <span class="mono">courts.gov.ps/EServices2020</span></div></div>${pill}</header>
 <div class="mzc-body"><div class="mzc-form">
 ${on?`<div class="mzc-cred"><div class="mzc-lock">${lockSvg}</div><div><b>بيانات الدخول محفوظة</b><div class="m">رقم العضوية <span class="mono">${esc2(s.cred.user)}</span> · ${s.cred.method==='dpapi'?'مشفّرة بحماية حساب Windows':'مشفّرة على هذا الجهاز'}</div></div></div>
  <label class="mzc-chk"><input type="checkbox" id="mzShow" ${MZ.show?'checked':''}> إظهار نافذة المتصفح أثناء الدخول (لإكمال رمز تحقق إن طُلب)</label>
  <div class="toolbar"><button class="btn pri" data-act="mzRun" data-v="test" ${s.running?'disabled':''}>تجربة الدخول</button><button class="btn brass" data-act="mzRun" data-v="capture" ${s.running?'disabled':''}>قراءة صفحات القضايا</button></div>
  <div class="toolbar"><button class="link" data-act="mzEdit">تغيير البيانات</button><button class="link danger" data-act="mzForget">حذف البيانات من الجهاز</button></div>
  ${s.captures?`<p class="note">قُرئت صفحات ميزان ${s.captures} مرة وحُفظت على هذا الجهاز. الخطوة التالية: بناء قارئ الحقول (رقم الدعوى، المحكمة، الأطراف وأرقام هوياتهم، الجلسات) ثم استيرادها هنا مع المطابقة.</p>`:''}`
 :`<form class="form" id="fMz" autocomplete="off"><label class="wide">رقم العضوية في النقابة<input class="field mono" id="mzUser" inputmode="numeric" autocomplete="off" required placeholder="مثال: 4512"></label>
  <label class="wide">كلمة المرور في ميزان<input class="field" id="mzPass" type="password" autocomplete="new-password" required></label>
  <div class="wide toolbar"><button class="btn pri">حفظ وتجربة الدخول</button>${s.configured?'<button type="button" class="btn" data-act="mzCancel">إلغاء</button>':''}</div></form>
  <p class="note">تُحفظ كلمة المرور مشفّرة على هذا الجهاز فقط${navigator.userAgent.includes('Windows')?' بحماية حساب Windows':''}، ولا تُرسل إلى أي جهة غير موقع ميزان نفسه. يحتفظ المتصفح الآلي بالجلسة فلا يُعاد الدخول في كل مرة.</p>`}
 </div><div class="mzc-log"><h3>سجل العمليات</h3><ul id="mzLog">${logHTML()}</ul></div></div></section>
 <div class="mzc-div"><span>محاكاة التحديثات (للتجربة فقط)</span></div>`;
}
const lockSvg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2.5"/></svg>';

const orig=V.mizan;V.mizan=()=>{if(!MZ.status)refresh();return orig().replace('<div class="mz-head">',panel()+'<div class="mz-head">')};
A.mzRun=v=>{const cb=document.getElementById('mzShow');MZ.show=cb?cb.checked:MZ.show;MZ.log=[];post('/api/mizan/run',{mode:v,show:MZ.show}).then(st=>{MZ.status=st;render()}).catch(e=>{toast(e.message);addLog({error:e.message})})};
A.mzEdit=()=>{MZ.editing=true;render()};
A.mzCancel=()=>{MZ.editing=false;render()};
A.mzForget=()=>{document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog"><h2>حذف بيانات الدخول إلى ميزان؟</h2><p class="sub">تُحذف كلمة المرور المشفّرة وجلسة المتصفح الآلي من هذا الجهاز. يمكنك إدخالها مجدداً في أي وقت.</p><div class="toolbar"><button class="btn pri" data-act="mzForgetOk">حذف</button><button class="btn" data-act="close">إلغاء</button></div></div></div>`};
A.mzForgetOk=()=>{post('/api/mizan/forget').then(st=>{MZ.status=st;MZ.log=[];A.close();toast('حُذفت بيانات الدخول من الجهاز');render()}).catch(e=>toast(e.message))};
document.addEventListener('submit',e=>{if(e.target.id!=='fMz')return;e.preventDefault();e.stopImmediatePropagation();
 const u=document.getElementById('mzUser').value,p=document.getElementById('mzPass').value;
 post('/api/mizan/credentials',{username:u,password:p}).then(st=>{MZ.status=st;MZ.editing=false;toast('حُفظت البيانات مشفّرة');render();A.mzRun('test')}).catch(er=>toast(er.message))},true);

const es=new EventSource('/api/stream');
es.addEventListener('mizan',ev=>{const o=JSON.parse(ev.data);
 if(o.stage==='exit'){MZ.status=o.status;if(S.view==='mizan')render();return}
 addLog(o);
 if(o.done){toast(o.ok?(o.mode==='capture'?'اكتملت قراءة صفحات ميزان':'تم الدخول إلى ميزان بنجاح'):'تعذّر الدخول إلى ميزان: '+(o.error||''))}});
})();
