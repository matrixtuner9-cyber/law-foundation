/* ── حذف الموكل وأرشفته، والبدء من مكتب فارغ ──
   • أرشفة الموكل (المفضّلة): يختفي من قائمة الموكلين وتبقى ملفاته وقضاياه، ويُعطَّل دخوله لبوابة «ميثاق» فوراً. يمكن إرجاعه.
   • حذف نهائي: الموكل وقضاياه وجلساتها ومواعيدها ومستنداتها ورسائله، بعد كتابة اسمه للتأكيد. لمن يملك صلاحية الحذف فقط.
   • «البدء من مكتب فارغ» في الإعدادات (للمدير): نسخة احتياطية ثم حذف كل السجلات والرسائل، بعد كتابة «حذف».
   كل ذلك يُسجَّل في سجل التدقيق من الخادم. */
(function(){
'use strict';
if(typeof V==='undefined'||typeof A==='undefined')return;
const h=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const can=w=>typeof window.MQ_can==='function'?window.MQ_can(w):true;
const modal=html=>{document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal cd-m" role="dialog">${html}</div></div>`};
const relOf=id=>{const ks=cases.filter(k=>k.client===id),kid=new Set(ks.map(k=>k.id));
 return {ks,hs:hearings.filter(x=>kid.has(x.k)),dls:deadlines.filter(x=>kid.has(x.k)),ds:docs.filter(x=>kid.has(x.k)||x.client===id),ms:(typeof messages!=='undefined'&&messages[id])||[]}};

/* زر في ملف الموكل */
const vc=V.client;
V.client=function(){const html=vc.apply(this,arguments),c=C(S.clientId);if(!c||!(can('clients')||can('delete')))return html;
 const btn=`<div class="cd-bar">${c.archived?`<span class="pill warn">مؤرشف منذ ${h(c.archivedAt||'')}</span><button class="btn sm" data-act="cdUnarch" data-v="${h(c.id)}">إرجاع من الأرشيف</button>`:''}<button class="btn sm cd-btn" data-act="cdOpen" data-v="${h(c.id)}">${c.archived?'حذف نهائي…':'أرشفة أو حذف الموكل…'}</button></div>`;
 return btn+html};

A.cdOpen=id=>{const c=C(id);if(!c)return;const r=relOf(id),delOk=can('delete');
 modal(`<div class="head"><div><h1>${h(c.name)}</h1><p class="sub">ماذا تريد أن تفعل بملف هذا الموكل؟</p></div><button class="btn sm" data-act="close">إغلاق</button></div>
 <div class="cd-sum"><span><b>${r.ks.length}</b> قضية</span><span><b>${r.hs.length}</b> جلسة</span><span><b>${r.dls.length}</b> ميعاد</span><span><b>${r.ds.length}</b> مستند</span><span><b>${r.ms.length}</b> رسالة</span></div>
 ${c.archived?'':`<section class="cd-opt ok"><h3>📦 أرشفة الموكل <small>(المستحسن)</small></h3><p>يختفي من قائمة الموكلين، وتبقى قضاياه ومستنداته محفوظة كما هي؛ فالمحامي ملزم بحفظ ملفات موكليه. ويُعطَّل دخوله لبوابة «ميثاق» فوراً. يمكن إرجاعه في أي وقت.</p><button class="btn pri" data-act="cdArch" data-v="${h(id)}">أرشفة</button></section>`}
 <section class="cd-opt bad"><h3>🗑 حذف نهائي</h3><p>يُحذف الموكل ومعه ${r.ks.length} قضية وجلساتها ومواعيدها و${r.ds.length} مستنداً و${r.ms.length} رسالة. <b>لا يمكن التراجع</b> إلا من نسخة احتياطية.</p>
 ${delOk?`<label class="cd-l">للتأكيد اكتب اسم الموكل كما هو: <b>${h(c.name)}</b><input class="field" id="cdName" autocomplete="off"></label><button class="btn danger" data-act="cdDel" data-v="${h(id)}">حذف نهائي</button>`:'<p class="m">لا تملك صلاحية الحذف؛ يحذف المدير أو من مُنح الصلاحية.</p>'}</section>`)};

A.cdArch=id=>{const c=C(id);if(!c)return;c.archived=true;c.archivedAt=iso(TODAY);c.portal=false;
 if(window.MQ&&MQ.saveState)MQ.saveState();A.close();toast('أُرشف الموكل وعُطّل دخوله للبوابة');S.view='clients';render()};
A.cdUnarch=id=>{const c=C(id);if(!c)return;delete c.archived;delete c.archivedAt;if(window.MQ&&MQ.saveState)MQ.saveState();toast('أُرجع الموكل إلى القائمة (البوابة تبقى معطلة حتى تفعّلها)');render()};

A.cdDel=async id=>{const c=C(id);if(!c||!can('delete'))return;const v=(document.getElementById('cdName')||{}).value||'';
 if(v.trim()!==String(c.name).trim())return toast('الاسم المكتوب لا يطابق اسم الموكل');
 const r=relOf(id),gone=(arr,kind,xs)=>{for(const x of xs){const i=arr.indexOf(x);if(i>=0)arr.splice(i,1);if(MQ.deleted)MQ.deleted(kind,x.id)}};
 gone(hearings,'hearings',r.hs);gone(deadlines,'deadlines',r.dls);gone(docs,'docs',r.ds);gone(cases,'cases',r.ks);gone(clients,'clients',[c]);
 if(typeof messages!=='undefined')delete messages[id];
 A.close();S.clientId=null;S.view='clients';render();
 /* الرسائل تُحذف من الخادم بعد أن يحفظ حذف السجل */
 const purge=async(n)=>{try{if(MQ.flush)await MQ.flush();const x=await fetch('/api/admin/client-purge',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({client:id})});if(x.status===409&&n<5)return setTimeout(()=>purge(n+1),1200);toast(x.ok?'حُذف الموكل نهائياً مع قضاياه ورسائله':'حُذف الموكل؛ تعذّر حذف رسائله الآن')}catch(e){if(n<5)setTimeout(()=>purge(n+1),1500)}};
 setTimeout(()=>purge(0),900)};

/* قائمة الموكلين: المؤرشفون مخفيون، مع زر لعرضهم */
let showArch=false;const vcl=V.clients;
A.cdShowArch=()=>{showArch=!showArch;render()};
V.clients=function(){const arch=clients.filter(c=>c.archived);if(!arch.length)return vcl.apply(this,arguments);
 const all=clients.slice();if(!showArch){clients.splice(0,clients.length,...all.filter(c=>!c.archived))}
 let html;try{html=vcl.apply(this,arguments)}finally{clients.splice(0,clients.length,...all)}
 return `<div class="cd-arch"><button class="btn sm" data-act="cdShowArch">${showArch?'إخفاء المؤرشفين':'عرض الموكلين المؤرشفين ('+arch.length+')'}</button></div>`+html};
/* شريط تبويبات «الاستعلامات والتقارير» يضاف مرة واحدة: تحمل الدالة الجديدة علامة الدالة التي غلّفتها (case-layout.js) */
if(vcl&&vcl._grp)V.clients._grp=1;

/* الإعدادات: البدء من مكتب فارغ */
const vs=V.settings;
V.settings=function(){const html=vs.apply(this,arguments);if(!can('manage'))return html;
 return html+`<section class="panel cd-fresh" style="margin-top:16px"><header><h2>البدء من مكتب فارغ</h2></header><div class="bd">
 <p>يحذف كل الموكلين والقضايا والجلسات والمواعيد والمستندات والرسائل من هذا المكتب، ومنها البيانات التجريبية إن كانت قد حُفظت، ويبقى المستخدمون والإعدادات وقاعدة التشريعات والترخيص. تؤخذ نسخة احتياطية كاملة تلقائياً قبل الحذف.</p>
 <label class="cd-l">للتأكيد اكتب كلمة <b>حذف</b><input class="field" id="cdFresh" autocomplete="off" style="max-width:220px"></label>
 <button class="btn danger" data-act="cdFresh">ابدأ من مكتب فارغ</button></div></section>`};
A.cdFresh=async()=>{const v=((document.getElementById('cdFresh')||{}).value||'').trim();if(v!=='حذف')return toast('اكتب كلمة «حذف» للتأكيد');
 if(!confirm('سيُحذف كل محتوى المكتب بعد أخذ نسخة احتياطية. متابعة؟'))return;
 try{const r=await fetch('/api/admin/fresh-start',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({confirm:v})});const j=await r.json().catch(()=>({}));
  if(!r.ok)return toast(j.error||'تعذّر التنفيذ');toast('بدأ المكتب فارغاً · حُذف '+j.records+' سجلاً و'+j.messages+' رسالة');setTimeout(()=>location.reload(),1200)}catch(e){toast('تعذّر الاتصال بالخادم')}};

const css=document.createElement('style');css.textContent=`.cd-bar{display:flex;gap:8px;justify-content:flex-end;align-items:center;margin-bottom:8px}.cd-btn{color:#8a3a2a}
.cd-m{max-width:640px}.cd-sum{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.cd-sum span{background:#F6EFDD;border-radius:10px;padding:6px 12px;font-size:13px}.cd-sum b{font-size:16px}
.cd-opt{border:1px solid #E4D3A6;border-radius:12px;padding:12px 14px;margin-top:10px}.cd-opt h3{margin:0 0 6px;font-size:15px}.cd-opt p{font-size:13px;line-height:1.8;margin:0 0 8px}.cd-opt.ok{background:#F2FAF7;border-color:#9ED3C8}.cd-opt.bad{background:#FCF1EE;border-color:#E2B3A6}
.cd-l{display:flex;flex-direction:column;gap:6px;font-size:13px;margin:6px 0 10px}.btn.danger{background:#B0503A;color:#fff;border-color:#B0503A}.cd-arch{display:flex;justify-content:flex-end;margin-bottom:8px}`;document.head.appendChild(css);
})();
