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
 if(o.client){if(window.MQ_mzClientEvent)MQ_mzClientEvent(o);if(o.stage!=='exit')return}
 if(o.stage==='exit'){MZ.status=o.status;if(S.view==='mizan')render();return}
 addLog(o);
 if(o.done){toast(o.ok?(o.mode==='capture'?'اكتملت قراءة صفحات ميزان':'تم الدخول إلى ميزان بنجاح'):'تعذّر الدخول إلى ميزان: '+(o.error||''))}});

/* ── ميزان في حقيبة الموكل: بيانات الموكل في ميزان، وأرقام قضاياه هناك، وحسابه (بموافقته) ──
   البيانات التعريفية تُحفظ في ملف الموكل وتُزامن؛ كلمة مرور حساب الموكل تُحفظ مشفّرة على جهاز المكتب فقط ولا تُعرض. */
const LINK=[['','—'],['none','لم تُقدَّم الوكالة بعد'],['filed','قُدّمت الوكالة لقلم المحكمة'],['linked','أُدرجت: تظهر في حساب المحامي']];
const ROLES=['مدعٍ','مدعى عليه','مستأنِف','مستأنَف عليه','طاعن','مطعون ضده','مشتكٍ','مشتكى عليه','طالب تنفيذ','منفَّذ ضده','مستدعٍ','متدخل'];
const MC={id:null,st:null,err:'',editing:false,log:[],busy:false};
const can3=w=>!!(window.MQ&&MQ.user&&({admin:{write:1,manage:1},lawyer:{write:1}}[MQ.user.role]||{})[w]);
async function mcLoad(id){MC.id=id;MC.st=null;MC.err='';try{const r=await fetch('/api/mizan/client?id='+encodeURIComponent(id));const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'تعذّر');MC.st=j}catch(e){MC.err=e.message}mcPaint()}
function mcAcct(c){
 if(!can3('manage'))return `<p class="note">حساب الموكل في ميزان يضبطه مدير المكتب.</p>`;
 if(MC.err)return `<p class="note">${esc2(MC.err)}</p><p class="m">حفظ حساب الموكل وتشغيل الدخول يكونان من جهاز المكتب (الخادم المحلي أو تطبيق سطح المكتب)، لأن كلمة المرور لا تغادر ذلك الجهاز.</p>`;
 const st=MC.st;if(!st||MC.id!==c.id)return '<p class="m">جارٍ القراءة…</p>';
 if(st.configured&&!MC.editing){const l=st.last;return `<div class="mzc-cred"><div class="mzc-lock">${lockSvg}</div><div><b>حساب الموكل محفوظ</b><div class="m">اسم المستخدم <span class="mono">${esc2(st.cred.user)}</span> · حُفظ ${esc2(String(st.cred.savedAt||'').slice(0,10))}${st.cred.consent?` · موافقة الموكل وثّقها ${esc2(st.cred.consent.by)} ${esc2(String(st.cred.consent.at||'').slice(0,10))}${st.cred.consent.how?' ('+esc2(st.cred.consent.how)+')':''}`:''}</div>
  ${l?`<div class="m">${l.ok?'<span class="pill ok">آخر محاولة ناجحة</span>':'<span class="pill warn">تعذّر</span>'} ${esc2(l.at)}${l.error?' · '+esc2(l.error):''}</div>`:''}</div></div>
  <label class="mzc-chk"><input type="checkbox" id="mcShow" checked> إظهار نافذة المتصفح (لإكمال رمز تحقق إن طُلب)</label>
  <div class="toolbar"><button class="btn pri" data-act="mcRun" data-v="test" ${st.running||MC.busy?'disabled':''}>تجربة الدخول بحساب الموكل</button><button class="btn brass" data-act="mcRun" data-v="capture" ${st.running||MC.busy?'disabled':''}>قراءة صفحات قضاياه</button><button class="link" data-act="mcEdit">تغيير</button><button class="link danger" data-act="mcForget">حذف الحساب من الجهاز</button></div>
  ${MC.log.length?`<ul class="mc-log">${MC.log.map(x=>`<li class="${x.ok===false||x.error?'bad':x.done?'good':''}">${esc2(x.msg||x.error||(x.done?(x.ok?'اكتملت العملية':'تعذّر'):''))}</li>`).join('')}</ul>`:''}`}
 return `<form class="form" id="fMc" autocomplete="off"><div class="wide ai-note">لمتابعة قضايا الموكل كما تظهر له في ميزان. تُحفظ كلمة المرور مشفّرة على جهاز المكتب فقط ولا تظهر بعد الحفظ لأي مستخدم، ويُسجَّل كل استخدام في سجل التدقيق.</div>
  <label>اسم المستخدم في ميزان <small class="m">(غالباً رقم الهوية)</small><input class="field mono" id="mcUser" value="${esc2((c.mz&&c.mz.idNo)||c.idNo||'')}" dir="ltr" autocomplete="off" required></label>
  <label>كلمة المرور<input class="field" id="mcPass" type="password" autocomplete="new-password" required></label>
  <label class="wide mzc-chk"><input type="checkbox" id="mcConsent" required> وافق الموكل على استخدام المكتب حسابه في ميزان لمتابعة قضاياه</label>
  <label class="wide">كيف وُثّقت الموافقة<input class="field" id="mcHow" maxlength="120" placeholder="مثال: إقرار موقّع في نموذج الاستقبال بتاريخ…"></label>
  <div class="wide toolbar"><button class="btn pri">حفظ وتجربة الدخول</button>${st.configured?'<button type="button" class="btn" data-act="mcCancel">إلغاء</button>':''}</div></form>`;
}
function mcBody(c){
 const m=c.mz||{},ks=cases.filter(k=>k.client===c.id),ro=!can3('write');
 return `<div class="grid2 mc">
 <section class="panel"><header><h2>بيانات الموكل في ميزان</h2><span class="m">تُستخدم لمطابقة ما يرد من ميزان مع هذا الموكل</span></header><div class="bd"><form class="form" id="fMcId">
  <label>رقم الهوية / التسجيل في ميزان<input class="field mono" id="mzIdNo" value="${esc2(m.idNo||c.idNo||'')}" dir="ltr" ${ro?'disabled':''}></label>
  <label>الهاتف المسجّل في ميزان<input class="field mono" id="mzPhone" value="${esc2(m.phone||c.phone||'')}" dir="ltr" ${ro?'disabled':''}></label>
  <label>صفة الموكل الغالبة <small class="m">(تُحدد لكل قضية في الجدول)</small><select class="field" id="mzRole" ${ro?'disabled':''}><option value="">—</option>${ROLES.map(r=>`<option ${m.role===r?'selected':''}>${r}</option>`).join('')}</select></label>
  <label>هل للموكل حساب في بوابة ميزان؟<select class="field" id="mzHas" ${ro?'disabled':''}><option value="">لا أعرف</option><option value="yes" ${m.has==='yes'?'selected':''}>نعم</option><option value="no" ${m.has==='no'?'selected':''}>لا</option></select></label>
  <label class="wide">ملاحظات<input class="field" id="mzNote" value="${esc2(m.note||'')}" placeholder="مثل: الوكالة مسجلة في ميزان باسم المحامي…" ${ro?'disabled':''}></label>
  ${ro?'':'<div class="wide toolbar"><button class="btn pri">حفظ بيانات ميزان</button></div>'}</form></div></section>
 <section class="panel"><header><h2>قضايا الموكل في ميزان</h2><span class="m">رقم كل قضية كما هو في ميزان، لربط تحديثاتها بملفها هنا</span></header><div class="bd">
  ${ks.length?`<table class="mc-t"><thead><tr><th>القضية في المكتب</th><th>رقمها في ميزان</th><th>صفة الموكل فيها</th><th>وكالة المحامي في ميزان</th></tr></thead><tbody>${ks.map(k=>`<tr><td><button class="link mono" data-act="openCase" data-v="${k.id}">${esc2(k.no)}</button><div class="m">${esc2(k.subject||'')}</div></td><td><input class="field mono mc-ref" data-k="${k.id}" value="${esc2(k.mzRef||'')}" placeholder="${esc2(k.no)}" dir="ltr" ${ro?'disabled':''} aria-label="رقم القضية ${esc2(k.no)} في ميزان"></td>
   <td><select class="field mc-role" data-k="${k.id}" ${ro?'disabled':''} aria-label="صفة الموكل في ${esc2(k.no)}"><option value="">${esc2(m.role?'كالغالبة ('+m.role+')':'—')}</option>${ROLES.map(r=>`<option ${k.mzRole===r?'selected':''}>${r}</option>`).join('')}</select></td>
   <td><select class="field mc-link" data-k="${k.id}" ${ro?'disabled':''} aria-label="حالة وكالة المحامي في ${esc2(k.no)}">${LINK.map(([v,t])=>`<option value="${v}" ${(k.mzLink||'')===v?'selected':''}>${t}</option>`).join('')}</select>${k.mzLinkAt?`<div class="m">${esc2(k.mzLinkAt)}</div>`:''}${k.mzLink==='filed'&&k.mzLinkAt&&(TODAY-new Date(k.mzLinkAt))/864e5>7?'<div class="mc-late">مرّ أسبوع ولم تُدرج بعد: تحقق من القضية في ميزان، وإن لم يظهر اسم المحامي فقدّم طلب «إدراج وكيل» في القلم.</div>':''}</td></tr>`).join('')}</tbody></table>${ro?'':'<div class="toolbar" style="margin-top:8px"><button class="btn sm" data-act="mcRefs">حفظ بيانات القضايا</button></div>'}`:'<p class="m">لا قضايا لهذا الموكل بعد.</p>'}
  <div class="toolbar" style="margin-top:8px"><a class="btn sm" href="https://www.courts.gov.ps/EServices/login.aspx" target="_blank" rel="noopener noreferrer">التحقق في بوابة مجلس القضاء ↗</a></div>
  <div class="note mc-how" style="margin-top:8px"><b>كيف تصل القضية إلى حساب المحامي في ميزان:</b> يقدّم المحامي صك الوكالة لقلم المحكمة ← يُدرج موظف القلم رقم عضويته على القضية ← يتحقق ميزان من النقابة أنه مزاول ← تظهر القضية في حساب المحامي فوراً. قبل ذلك تظهر القضية في حساب الموكل (برقم هويته) فقط، ولذلك يفيد حسابه أدناه في المرحلة الأولى.</div>
  <p class="m" style="margin-top:6px">تُقرأ التحديثات بحساب المحامي (شاشة «الربط مع ميزان») للقضايا المُدرجة، وبحساب الموكل لما سواها، وتظهر للمراجعة قبل إضافتها إلى ملف القضية.</p></div></section>
 <section class="panel wide-panel"><header><h2>حساب الموكل في ميزان</h2><span class="m">اختياري، بموافقة الموكل</span></header><div class="bd" id="mcAcct">${mcAcct(c)}</div></section>
 </div>`;
}
function mcPaint(){const el=document.getElementById('mcAcct');const c=C(S.clientId);if(el&&c)el.innerHTML=mcAcct(c)}
window.MQ_mzClientEvent=o=>{if(o.client!==MC.id)return;if(o.stage==='exit'){if(o.clientStatus)MC.st=o.clientStatus;MC.busy=false;mcPaint();return}
 MC.log.unshift(o);MC.log=MC.log.slice(0,12);if(o.done){toast(o.ok?(o.mode==='capture'?'اكتملت قراءة صفحات الموكل في ميزان':'تم الدخول بحساب الموكل'):'تعذّر: '+(o.error||''))}mcPaint()};
const vcl=V.client;if(typeof vcl==='function')V.client=()=>{const c=C(S.clientId);let h=vcl();if(!c)return h;
 const on=S.bagTab==='mizan',linked=cases.filter(k=>k.client===c.id&&(k.mzRef||k.mz)).length;
 h=h.replace(/(<div class="tabs">[\s\S]*?)(<\/div>\s*<div id="bagBody">)/,(m0,a,b)=>a+`<button class="${on?'on':''}" data-act="bagTab" data-v="mizan">ميزان${linked?` <span class="tcount">${linked}</span>`:''}</button>`+b);
 if(on){h=h.replace(/<div id="bagBody">[\s\S]*$/,`<div id="bagBody">${mcBody(c)}</div>`);if(can3('manage')&&MC.id!==c.id)setTimeout(()=>mcLoad(c.id),0)}
 return h};
A.mcEdit=()=>{MC.editing=true;mcPaint()};A.mcCancel=()=>{MC.editing=false;mcPaint()};
A.mcRun=v=>{const cb=document.getElementById('mcShow');MC.busy=true;MC.log=[];mcPaint();post('/api/mizan/client-run',{client:MC.id,mode:v,show:cb?cb.checked:true}).then(st=>{MC.st=st;mcPaint()}).catch(e=>{MC.busy=false;toast(e.message);mcPaint()})};
A.mcForget=()=>{document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog"><h2>حذف حساب الموكل في ميزان؟</h2><p class="sub">تُحذف كلمة المرور المشفّرة وجلسة المتصفح الخاصة بهذا الموكل من جهاز المكتب.</p><div class="toolbar"><button class="btn danger" data-act="mcForgetOk">حذف</button><button class="btn" data-act="close">إلغاء</button></div></div></div>`};
A.mcForgetOk=()=>{post('/api/mizan/client',{client:MC.id,forget:true}).then(st=>{MC.st=st;MC.editing=false;MC.log=[];A.close();toast('حُذف حساب الموكل من الجهاز');mcPaint()}).catch(e=>toast(e.message))};
A.mcRefs=()=>{let n=0;const set=(sel,f,fn)=>document.querySelectorAll(sel).forEach(x=>{const k=K(x.dataset.k);const v=x.value.trim();if(k&&(k[f]||'')!==v){k[f]=v;if(fn)fn(k,v);n++}});
 set('.mc-ref','mzRef');set('.mc-role','mzRole');set('.mc-link','mzLink',(k,v)=>{k.mzLinkAt=v?iso(TODAY):''});
 toast(n?'حُفظت بيانات ميزان للقضايا ('+n+')':'لا تغيير');render()};
document.addEventListener('submit',e=>{const f=e.target;
 if(f.id==='fMcId'){e.preventDefault();e.stopImmediatePropagation();const c=C(S.clientId);if(!c)return;
  c.mz={...(c.mz||{}),idNo:f.mzIdNo.value.trim(),phone:f.mzPhone.value.trim(),role:f.mzRole.value,has:f.mzHas.value,note:f.mzNote.value.trim(),at:iso(TODAY),by:MQ.user?MQ.user.username:''};toast('حُفظت بيانات الموكل في ميزان');render();return}
 if(f.id==='fMc'){e.preventDefault();e.stopImmediatePropagation();
  if(!f.mcConsent.checked){toast('وثّق موافقة الموكل أولاً');return}
  post('/api/mizan/client',{client:MC.id,username:f.mcUser.value,password:f.mcPass.value,consent:true,consentHow:f.mcHow.value}).then(st=>{MC.st=st;MC.editing=false;toast('حُفظ حساب الموكل مشفّراً');mcPaint();A.mcRun('test')}).catch(er=>toast(er.message))}},true);
const mcss=document.createElement('style');mcss.textContent=`.mc .wide-panel{grid-column:1/-1}.mc-t{width:100%;border-collapse:collapse;font-size:14px}.mc-t th,.mc-t td{padding:6px;border-bottom:1px solid var(--line);text-align:right;vertical-align:middle}.mc-t th{color:var(--muted);font-weight:600}.mc-t .field{width:100%;min-width:110px}
.mc-t .mc-role,.mc-t .mc-link{min-width:130px}.mc-how{line-height:1.9}.mc-late{color:var(--danger,#B42318);font-size:12.5px;line-height:1.6;margin-top:4px;max-width:260px}
.mc-log{list-style:none;margin:8px 0 0;padding:0;font-size:13.5px;display:flex;flex-direction:column;gap:3px}.mc-log li.bad{color:var(--danger,#B42318)}.mc-log li.good{color:var(--ok)}`;document.head.appendChild(mcss);
})();
