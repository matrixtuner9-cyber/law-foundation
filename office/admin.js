/* ── الإدارة: المستخدم الحالي، المستخدمون والصلاحيات، سجل التدقيق، الإعدادات، وضع الاطلاع فقط ── */
(function(){
const ROLE_INFO={
 admin:['مدير النظام','كل الصلاحيات: البيانات، المستخدمون، سجل التدقيق، الإعدادات، والربط مع ميزان'],
 lawyer:['محامٍ','يرى كل القضايا ويعدّلها، ويراسل الموكلين. لا يدير المستخدمين ولا يرى سجل التدقيق'],
 external:['محامٍ خارجي','يرى القضايا المسندة إليه فقط وموكليها، للاطلاع (التحديث من الجوال في المرحلة القادمة)'],
 viewer:['مطّلع','يرى كل البيانات دون أي تعديل، مناسب للإدارة العليا أو المدقق']};
const ACT={'auth.login':'دخول','auth.login_failed':'محاولة دخول فاشلة','auth.locked':'قفل الحساب مؤقتاً','auth.logout':'خروج','auth.setup':'إعداد النظام',
 'user.create':'إنشاء مستخدم','user.update':'تعديل مستخدم','user.password_reset':'إعادة تعيين كلمة مرور','user.password_change':'تغيير كلمة المرور',
 'record.create':'إضافة','record.update':'تعديل','record.delete':'حذف','message.send':'رسالة إلى الموكل','message.receive':'رسالة من الموكل',
 'portal.login':'دخول الموكل للبوابة','mizan.credentials':'حفظ بيانات ميزان','mizan.forget':'حذف بيانات ميزان','mizan.run':'تشغيل موصل ميزان','mizan.result':'نتيجة موصل ميزان',
 'state.init':'تهيئة بيانات المكتب','state.reset':'إعادة ضبط البيانات','settings.update':'تعديل الإعدادات','system.start':'تشغيل الخادم','system.migrate':'نقل البيانات إلى قاعدة البيانات','system.repair':'إصلاح بيانات منقولة','rules.update':'تعديل مدد الطعن','bar.refresh':'تحديث دليل المحامين','bar.result':'نتيجة تحديث دليل المحامين'};
const ENT={rules:'مدة طعن',clients:'موكل',cases:'قضية',hearings:'جلسة',deadlines:'مهلة',docs:'مستند',opponents:'خصم',users:'مستخدم',messages:'رسالة'};
const FLD={lawyerName:'اسم المحامي',city:'المدينة',hours:'ساعات الدوام',days:'المدة بالأيام',verified:'مؤكَّدة',ref:'السند',cat:'التصنيف',refs:'المراجع',track:'مسار التقاضي',decisions:'الأحكام والقرارات',subject:'الموضوع',no:'الرقم',date:'التاريخ',time:'الوقت',purpose:'الغاية',status:'الحالة',stage:'المرحلة',step:'الخطوة',paid:'المدفوع',fee:'الأتعاب',phone:'الهاتف',phone2:'هاتف إضافي',whatsapp:'واتساب',portal:'البوابة',shared:'مشاركة مع الموكل',name:'الاسم',role:'الدور',active:'فعّال',cases:'القضايا المسندة',edition:'النسخة',officeName:'اسم الجهة',last:'آخر دخول',result:'القرار',attend:'حضور الموكل',title:'العنوان',kind:'النوع',value:'القيمة',court:'المحكمة',pri:'الأولوية',due:'الاستحقاق',type:'النوع'};
const CAT=[['','كل العمليات'],['auth.','الدخول والخروج'],['record.','تعديلات البيانات'],['message.','الرسائل'],['portal.','بوابة الموكل'],['user.','المستخدمون'],['mizan.','ميزان'],['settings.','الإعدادات'],['bar.','دليل المحامين'],['system.','النظام'],['state.','تهيئة البيانات']];
const MUT=new Set(['share','togglePortal','applyU','dropU','newCase','saveTpl','rule','sync','toCase','toCaseK','recStart']);
const FORMS=new Set(['fH','fMsg','fPay','fCase','fBag']);
const AU={list:[],more:true,f:{cat:'',q:'',user:''},verify:null,busy:false};
const US={list:null};
const api=(url,body)=>fetch(url,body===undefined?{}:{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}).then(async r=>{const j=await r.json().catch(()=>({}));if(r.status===401){location.replace('/login.html');throw new Error('انتهت الجلسة')}if(!r.ok)throw new Error(j.error||'تعذّر التنفيذ');return j});
const can=w=>MQ.user&&({admin:{write:1,manage:1},lawyer:{write:1}}[MQ.user.role]||{})[w];

/* تطبيق المستخدم على الواجهة بعد تحميل البيانات */
window.MQ_applyUser=function(u,st){
 MQ.user=u;MQ.settings=st||{};MQ.readOnly=!can('write');
 if(st)Object.assign(OFFICE,{name:st.officeName||OFFICE.name,lawyer:st.lawyerName||OFFICE.lawyer,city:st.city||OFFICE.city});
 document.body.classList.toggle('ro',MQ.readOnly);
 const who=document.querySelector('.who');
 who.innerHTML=`<button class="me" id="meBtn" aria-haspopup="menu"><span class="me-t"><b>${esc(u.name)}</b><small>${esc(ROLE_INFO[u.role]?.[0]||u.role)}</small></span><span class="avatar">${esc(u.name.replace(/^(المحامي|المحامية|الأستاذ)\s+/,'').trim()[0]||'م')}</span></button>
  <div class="me-menu" id="meMenu" role="menu" hidden><button data-act="pwModal" role="menuitem">تغيير كلمة المرور</button><button data-act="logout" role="menuitem" class="danger">تسجيل الخروج</button></div>`;
 const sub=document.querySelector('.brand small');if(sub)sub.textContent=(st&&st.edition==='insurance'?'الإدارة القانونية':'مكتب المحاماة')+' · '+OFFICE.city;
 /* أقسام الإدارة لمدير النظام فقط، وميزان كذلك */
 const i=NAV.findIndex(n=>n[0]==='mizan');if(!can('manage')&&i>=0)NAV.splice(i,1);
 if(can('manage')&&!NAV.some(n=>n[0]==='users'))NAV.push(['الإدارة'],['users','المستخدمون والصلاحيات'],['audit','سجل التدقيق'],['settings','الإعدادات']);
 let bn=document.getElementById('roBanner');
 if(MQ.readOnly&&!bn){bn=document.createElement('div');bn.id='roBanner';bn.className='ro-banner';bn.textContent=u.role==='external'?'وضع الاطلاع: تظهر لك القضايا المسندة إليك فقط':'وضع الاطلاع فقط: لا تملك صلاحية التعديل';document.querySelector('.main').prepend(bn)}
 if(u.mustChange)setTimeout(()=>A.pwModal(true),300);
};
const navCount0=navCount;window.navCount=function(v){if(v==='users')return US.list?US.list.length:'';if(v==='audit')return '';if(v==='settings')return '';return navCount0(v)};

/* منع أوامر التعديل في وضع الاطلاع */
document.addEventListener('click',e=>{const t=e.target.closest('[data-act]');if(!t||!MQ.readOnly)return;if(MUT.has(t.dataset.act)){e.stopImmediatePropagation();e.preventDefault();toast('صلاحيتك للاطلاع فقط')}},true);
document.addEventListener('submit',e=>{if(MQ.readOnly&&FORMS.has(e.target.id)){e.preventDefault();e.stopImmediatePropagation();toast('صلاحيتك للاطلاع فقط')}},true);
document.addEventListener('click',e=>{const m=document.getElementById('meMenu');if(!m)return;if(e.target.closest('#meBtn')){m.hidden=!m.hidden;return}if(!e.target.closest('#meMenu'))m.hidden=true});

function modal(title,html,wide){document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal ${wide?'wide':''}" role="dialog" aria-label="${esc(title)}"><div class="head"><h1 style="font-size:22px">${esc(title)}</h1><button class="btn sm" data-act="close">إغلاق</button></div>${html}<div class="err-box" id="mErr" hidden></div></div></div>`;const f=document.querySelector('.modal input:not([type=checkbox]),.modal select');if(f)f.focus()}
const mErr=m=>{const e=document.getElementById('mErr');if(e){e.textContent=m;e.hidden=!m}};
const genPw=()=>{const a='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz',d='23456789';let s='';const r=new Uint32Array(10);crypto.getRandomValues(r);for(let i=0;i<10;i++)s+=(i%3===2?d:a)[r[i]%(i%3===2?d.length:a.length)];return s};

A.logout=()=>fetch('/api/auth/logout',{method:'POST'}).finally(()=>location.replace('/login.html'));
A.pwModal=(forced)=>{modal(forced===true?'غيّر كلمة المرور المؤقتة':'تغيير كلمة المرور',`${forced===true?'<p class="note">أُنشئ حسابك بكلمة مرور مؤقتة. اختر كلمة مرور خاصة بك قبل المتابعة.</p>':''}
 <form class="form" id="fPw"><label class="wide">كلمة المرور الحالية<input class="field" type="password" id="pwC" required autocomplete="current-password" dir="ltr"></label>
 <label>كلمة المرور الجديدة<input class="field" type="password" id="pwN" required autocomplete="new-password" dir="ltr"></label><label>تأكيدها<input class="field" type="password" id="pwN2" required autocomplete="new-password" dir="ltr"></label>
 <p class="note wide">8 أحرف على الأقل، وتحتوي حروفاً وأرقاماً.</p><button class="btn pri">حفظ</button></form>`)};

/* ── المستخدمون والصلاحيات ── */
function loadUsers(){return api('/api/users').then(l=>{US.list=l;if(S.view==='users')render();else drawNav()}).catch(e=>toast(e.message))}
V.users=()=>{if(!US.list){loadUsers();return '<div class="empty">جارٍ التحميل…</div>'}
 const caseNo=id=>(K(id)||{}).no||id;
 return `<div class="head"><div><h1>المستخدمون والصلاحيات</h1><p class="sub">كل مستخدم يدخل باسمه، ويرى ويعدّل حسب دوره، وكل ما يفعله مسجّل في سجل التدقيق</p></div><button class="btn pri" data-act="userNew">مستخدم جديد</button></div>
 <div class="roles">${Object.entries(ROLE_INFO).map(([k,[n,d]])=>`<div class="role-card r-${k}"><b>${n}</b><span>${d}</span><small>${US.list.filter(u=>u.role===k&&u.active).length} مستخدم</small></div>`).join('')}</div>
 <section class="panel tablewrap"><table><thead><tr><th>الاسم</th><th>اسم المستخدم</th><th>الدور</th><th>القضايا المسندة</th><th>آخر دخول</th><th>الحالة</th><th></th></tr></thead><tbody>
 ${US.list.map(u=>`<tr><td style="font-weight:600">${esc(u.name)}${u.id===MQ.user.id?' <span class="pill">أنت</span>':''}</td><td class="mono">${esc(u.username)}</td><td><span class="pill role-${u.role}">${esc(ROLE_INFO[u.role]?.[0]||u.role)}</span></td>
  <td>${u.role==='external'?(u.cases.length?u.cases.map(c=>`<span class="mono">${esc(caseNo(c))}</span>`).join('، '):'<span class="m">لا قضايا</span>'):'<span class="m">كل القضايا</span>'}</td>
  <td class="num">${u.lastLogin?esc(u.lastLogin.slice(0,16)):'<span class="m">لم يدخل بعد</span>'}</td>
  <td>${!u.active?'<span class="pill">معطّل</span>':u.locked?'<span class="pill bad">مقفل مؤقتاً</span>':u.mustChange?'<span class="pill warn">بانتظار تغيير كلمة المرور</span>':'<span class="pill ok">فعّال</span>'}</td>
  <td style="white-space:nowrap"><button class="btn sm" data-act="userEdit" data-v="${u.id}">تعديل</button> <button class="btn sm" data-act="userPw" data-v="${u.id}">كلمة مرور مؤقتة</button></td></tr>`).join('')}</tbody></table></section>
 <p class="note">كلمات المرور محفوظة مشفّرة (scrypt) ولا يمكن لأحد قراءتها، حتى مدير النظام. عند إنشاء مستخدم أو إعادة تعيين كلمته تُعطى كلمة مؤقتة يُطلب تغييرها عند أول دخول.</p>`};
function userForm(u){const isNew=!u;u=u||{role:'lawyer',cases:[],active:true,name:'',username:''};
 return `<form class="form" id="fUser" data-id="${u.id||''}"><label class="wide">الاسم الكامل<input class="field" id="uN" required value="${esc(u.name)}"></label>
 <label>اسم المستخدم<input class="field mono" id="uU" required ${isNew?'':'disabled'} value="${esc(u.username)}" dir="ltr" placeholder="ahmad.k"></label>
 <label>الدور<select class="field" id="uR">${Object.entries(ROLE_INFO).map(([k,[n]])=>`<option value="${k}" ${u.role===k?'selected':''}>${n}</option>`).join('')}</select></label>
 ${isNew?`<label class="wide">كلمة المرور المؤقتة<span class="pwgen"><input class="field mono" id="uP" required dir="ltr" value="${genPw()}"><button type="button" class="btn sm" data-act="genPw">توليد</button></span></label>`:`<label class="wide" style="flex-direction:row;align-items:center;gap:8px;color:var(--ink)"><input type="checkbox" id="uA" ${u.active?'checked':''}> الحساب فعّال</label>`}
 <fieldset class="wide cases-pick" id="uCases" ${u.role==='external'?'':'hidden'}><legend>القضايا المسندة لهذا المحامي</legend>${cases.map(k=>`<label class="ck"><input type="checkbox" value="${k.id}" ${u.cases.includes(k.id)?'checked':''}> <span class="mono">${esc(k.no)}</span> · ${esc(k.subject)} <span class="m">(${esc((C(k.client)||{}).name||'')})</span></label>`).join('')}</fieldset>
 <p class="note wide" id="uHint">${esc(ROLE_INFO[u.role][1])}</p>
 <button class="btn pri">${isNew?'إنشاء المستخدم':'حفظ التعديلات'}</button></form>`}
A.userNew=()=>{modal('مستخدم جديد',userForm(null),true);bindUserForm()};
A.userEdit=id=>{modal('تعديل مستخدم',userForm(US.list.find(u=>u.id===id)),true);bindUserForm()};
A.genPw=()=>{const i=document.getElementById('uP');if(i)i.value=genPw()};
function bindUserForm(){const r=document.getElementById('uR');r.onchange=()=>{document.getElementById('uCases').hidden=r.value!=='external';document.getElementById('uHint').textContent=ROLE_INFO[r.value][1]}}
A.userPw=id=>{const u=US.list.find(x=>x.id===id),pw=genPw();
 modal('كلمة مرور مؤقتة',`<p>ستُعيَّن كلمة مرور مؤقتة لـ <b>${esc(u.name)}</b>، ويُطلب منه تغييرها عند الدخول، وتُنهى جلساته المفتوحة.</p><div class="secret mono" id="tmpPw">${pw}</div><p class="note">انسخها وسلّمها له بطريقة آمنة. لن تظهر مرة أخرى.</p><div class="toolbar"><button class="btn pri" data-act="userPwOk" data-v="${id}">تعيين</button><button class="btn" data-act="close">إلغاء</button></div>`)};
A.userPwOk=id=>{const pw=document.getElementById('tmpPw').textContent;api(`/api/users/${id}/password`,{password:pw}).then(()=>{toast('عُيّنت كلمة المرور المؤقتة');A.close();loadUsers()}).catch(e=>mErr(e.message))};

/* ── سجل التدقيق ── */
function loadAudit(reset){if(AU.busy)return;AU.busy=true;if(reset){AU.list=[];AU.more=true}
 const q=new URLSearchParams({limit:100});if(AU.f.cat)q.set('action',AU.f.cat);if(AU.f.q)q.set('q',AU.f.q);if(AU.f.user)q.set('user',AU.f.user);if(!reset&&AU.list.length)q.set('before',AU.list[AU.list.length-1].seq);
 return api('/api/audit?'+q).then(l=>{AU.list.push(...l);AU.more=l.length===100}).catch(e=>toast(e.message)).finally(()=>{AU.busy=false;if(S.view==='audit')render()})}
function detailHtml(r){const d=r.detail||{},bits=[];
 if(d.label)bits.push(`<b>${esc(d.label)}</b>`);
 const obj=v=>/^[\[{]/.test(v||'');
 if(d.fields&&d.fields.length)bits.push(d.fields.map(f=>obj(f.from)||obj(f.to)?`<span class="chg"><i>${esc(FLD[f.f]||f.f)}</i> <ins>${f.from===''?'أُضيف':'عُدّل'}</ins></span>`:`<span class="chg"><i>${esc(FLD[f.f]||f.f)}</i> ${f.from!==''?`<del>${esc(f.from)}</del> ← `:''}<ins>${esc(f.to===''?'(فارغ)':f.to)}</ins></span>`).join(''));
 if(d.preview)bits.push(`«${esc(d.preview)}»`);
 if(d.type&&r.action.startsWith('message.'))bits.push({voice:'رسالة صوتية',image:'صورة',file:'مستند'+(d.name?': '+esc(d.name):''),text:'نص',notice:'إشعار'}[d.type]||esc(d.type));
 if(d.mode)bits.push(d.mode==='capture'?'قراءة صفحات القضايا':'تجربة دخول');
 if(d.ok!=null)bits.push(d.ok?'نجحت':'فشلت'+(d.error?': '+esc(d.error):''));
 if(d.role)bits.push('الدور: '+esc(ROLE_INFO[d.role]?.[0]||d.role));
 if(d.records!=null)bits.push(d.records+' سجل');if(d.messages!=null)bits.push(d.messages+' رسالة');
 if(d.sha256)bits.push(`<span class="m mono" title="بصمة الملف SHA-256">${d.sha256.slice(0,12)}…</span>`);
 return bits.join(' · ')}
const sev=a=>/failed|locked|delete|reset|forget/.test(a)?'bad':/^auth\./.test(a)?'acc':/^record\./.test(a)?'warn':/^message|portal/.test(a)?'ok':'';
V.audit=()=>{if(!AU.list.length&&AU.more&&!AU.busy)loadAudit(true);
 const users=[...new Set(AU.list.map(r=>r.username).filter(Boolean))];
 const v=AU.verify;
 return `<div class="head"><div><h1>سجل التدقيق</h1><p class="sub">كل دخول وتعديل ورسالة مسجّل بالوقت والمستخدم والعنوان، في سجل متسلسل لا يقبل التعديل أو الحذف</p></div>
  <div class="toolbar">${v?`<span class="pill ${v.ok?'ok':'bad'}">${v.ok?'السلسلة سليمة · '+v.n+' قيد':'تلاعب محتمل عند القيد #'+v.brokenAt}</span>`:''}<button class="btn" data-act="auditVerify">فحص سلامة السجل</button><button class="btn" data-act="auditCsv">تصدير CSV</button></div></div>
 <div class="toolbar"><select class="field" id="auCat">${CAT.map(([k,n])=>`<option value="${k}" ${AU.f.cat===k?'selected':''}>${n}</option>`).join('')}</select>
  <select class="field" id="auUser"><option value="">كل المستخدمين</option>${[...new Set([AU.f.user,...users].filter(Boolean))].map(u=>`<option ${AU.f.user===u?'selected':''}>${esc(u)}</option>`).join('')}</select>
  <input class="field" id="auQ" placeholder="بحث في التفاصيل أو رقم السجل" value="${esc(AU.f.q)}" style="flex:1;max-width:320px"></div>
 <section class="panel"><div class="audit">${AU.list.map(r=>`<div class="au"><span class="au-n mono">#${r.seq}</span><time class="mono">${esc(r.at)}</time>
  <span class="au-who">${r.username?esc(r.username.startsWith('portal:')?'موكل '+r.username.slice(7):r.username):'<span class="m">النظام</span>'}</span>
  <span class="pill ${sev(r.action)}">${esc(ACT[r.action]||r.action)}${r.entity&&ENT[r.entity]?' · '+ENT[r.entity]:''}</span>
  <span class="au-d">${detailHtml(r)}</span><span class="au-ip mono">${esc(r.ip||'')}</span></div>`).join('')||(AU.busy?'<div class="empty">جارٍ التحميل…</div>':'<div class="empty">لا قيود تطابق التصفية.</div>')}</div>
  ${AU.more&&AU.list.length?`<div style="padding:12px;text-align:center"><button class="btn" data-act="auditMore">${AU.busy?'جارٍ التحميل…':'تحميل المزيد'}</button></div>`:''}</section>`};
A.auditMore=()=>loadAudit(false);
A.auditVerify=()=>api('/api/audit/verify').then(v=>{AU.verify=v;toast(v.ok?'السجل سليم: لم يُعدَّل أي قيد':'تحذير: السلسلة مكسورة');render()}).catch(e=>toast(e.message));
A.auditCsv=()=>{const rows=[['#','الوقت','المستخدم','العملية','الكيان','المعرّف','التفاصيل','IP'],...AU.list.map(r=>[r.seq,r.at,r.username||'',ACT[r.action]||r.action,ENT[r.entity]||r.entity||'',r.entity_id||'',JSON.stringify(r.detail||''),r.ip||''])];
 const csv='﻿'+rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='mithaq-audit-'+new Date().toISOString().slice(0,10)+'.csv';a.click()};

/* ── الإعدادات ── */
V.settings=()=>{const st=MQ.settings||{};
 return `<div class="head"><div><h1>الإعدادات</h1><p class="sub">نسخة النظام وبيانات الجهة</p></div></div>
 <form class="stack" id="fSet"><section class="panel"><header><h2>نسخة النظام</h2></header><div class="bd editions">
  ${[['office','مكتب محاماة','إدارة الموكلين والقضايا والجلسات، بوابة الموكل، النماذج، والربط مع ميزان'],['insurance','الإدارة القانونية لشركة تأمين','متابعة المحامين والمكاتب الخارجية، تصنيفات قضايا التأمين، المخصصات والفواتير والتقارير التنفيذية (تُضاف تباعاً في المراحل القادمة)']].map(([k,n,d])=>`<label class="edition ${st.edition===k?'on':''}"><input type="radio" name="ed" value="${k}" ${st.edition===k?'checked':''}><b>${n}</b><span>${d}</span></label>`).join('')}
 </div></section>
 <section class="panel"><header><h2>بيانات المكتب والمحامي</h2><span class="m">تظهر في رسائل البوابة وإشعارات الموكلين وتطبيقهم، وفي النماذج وشاشة الدخول</span></header><div class="bd"><div class="form">
  <label class="wide">اسم المحامي كما يظهر للموكلين<input class="field" id="setLawyer" required value="${esc(st.lawyerName||'')}" placeholder="المحامي سامر عبد الله"></label>
  <label class="wide">الاسم الرسمي للمكتب أو الجهة<input class="field" id="setName" required value="${esc(st.officeName||'')}"></label>
  <label>المدينة<input class="field" id="setCity" value="${esc(st.city||'')}"></label><label>هاتف المكتب<input class="field mono" id="setPhone" dir="ltr" value="${esc(st.phone||'')}"></label>
  <label class="wide">ساعات الدوام<input class="field" id="setHours" value="${esc(st.hours||'')}" placeholder="الأحد – الخميس · 8:30 – 16:00"></label>
  <div class="wide preview-msg"><small>معاينة إشعار يصل للموكل:</small><b>رسالة من ${esc(st.lawyerName||'')}</b><span>${esc(st.officeName||'')}</span></div></div></div></section>
 <section class="panel"><header><h2>الأمان والتخزين</h2></header><div class="bd"><dl class="kv"><dt>قاعدة البيانات</dt><dd>SQLite مدمجة (data/mithaq.db)</dd><dt>كلمات المرور</dt><dd>scrypt مع ملح لكل مستخدم</dd><dt>الجلسات</dt><dd>12 ساعة، قفل الحساب 15 دقيقة بعد 5 محاولات خاطئة</dd><dt>سجل التدقيق</dt><dd>متسلسل بتوقيع HMAC-SHA256، يمنع التعديل والحذف</dd><dt>الوصول من الإنترنت</dt><dd>بوابة الموكل فقط، عبر HTTPS (mithaq.palgaz.net)</dd></dl></div></section>
 <div><button class="btn pri">حفظ الإعدادات</button></div></form>`};

/* النماذج */
document.addEventListener('submit',e=>{const f=e.target;
 if(f.id==='fPw'){e.preventDefault();e.stopImmediatePropagation();if(f.pwN.value!==f.pwN2.value)return mErr('كلمتا المرور غير متطابقتين.');
  api('/api/me/password',{current:f.pwC.value,password:f.pwN.value}).then(()=>{MQ.user.mustChange=false;A.close();toast('غُيّرت كلمة المرور')}).catch(x=>mErr(x.message))}
 if(f.id==='fUser'){e.preventDefault();e.stopImmediatePropagation();const id=f.dataset.id,role=f.uR.value;
  const sel=[...f.querySelectorAll('#uCases input:checked')].map(i=>i.value);
  const req=id?api('/api/users/'+id,{name:f.uN.value,role,active:f.uA.checked,cases:role==='external'?sel:[]}):api('/api/users',{name:f.uN.value,username:f.uU.value,role,password:f.uP.value,cases:role==='external'?sel:[]});
  req.then(u=>{A.close();toast(id?'حُفظت التعديلات':'أُنشئ المستخدم '+u.username+'. سلّمه كلمة المرور المؤقتة');loadUsers()}).catch(x=>mErr(x.message))}
 if(f.id==='fSet'){e.preventDefault();e.stopImmediatePropagation();const ed=(f.querySelector('input[name=ed]:checked')||{}).value;
  api('/api/settings',{edition:ed,officeName:f.setName.value,lawyerName:f.setLawyer.value,city:f.setCity.value,phone:f.setPhone.value,hours:f.setHours.value}).then(st=>{MQ.settings=st;MQ_applyUser(MQ.user,st);toast('حُفظت الإعدادات');render()}).catch(x=>toast(x.message))}
},true);
document.addEventListener('change',e=>{
 if(e.target.id==='auCat'){AU.f.cat=e.target.value;loadAudit(true)}
 if(e.target.id==='auUser'){AU.f.user=e.target.value;loadAudit(true)}
 if(e.target.name==='ed')document.querySelectorAll('.edition').forEach(l=>l.classList.toggle('on',l.contains(e.target)));
});
let auT;document.addEventListener('input',e=>{if(e.target.id==='auQ'){clearTimeout(auT);auT=setTimeout(()=>{AU.f.q=e.target.value.trim();loadAudit(true)},350)}});
})();
