/* ── الصورة الشخصية للمستخدم (من الهاتف: الكاميرا أو المعرض، أو من ملفات الجهاز) ──
   تُصغَّر في المتصفح إلى مربع 320 بكسل قبل الرفع. للمحامي/المدير خيار إظهارها للموكلين في تطبيقهم صورةً لمحامي المكتب. */
(function(){
'use strict';
const AV={data:null,forClients:false,canClients:false,officePhoto:false,loaded:false,draft:undefined,draftFor:false};
async function load(){try{const r=await fetch('/api/admin/me/avatar',{credentials:'same-origin'});if(r.ok)Object.assign(AV,await r.json(),{loaded:true})}catch(x){}paint()}
function paint(){const a=document.querySelector('.me .avatar');if(!a)return;
 if(AV.data){a.style.backgroundImage=`url("${AV.data}")`;a.classList.add('has-photo');a.dataset.letter=a.dataset.letter||a.textContent;a.textContent=''}
 else{a.style.backgroundImage='';a.classList.remove('has-photo');if(a.dataset.letter)a.textContent=a.dataset.letter}
 const m=document.getElementById('meMenu');if(m&&!m.querySelector('[data-act="avOpen"]'))m.insertAdjacentHTML('afterbegin','<button data-act="avOpen" role="menuitem">صورتي الشخصية</button>')}
/* تصغير وقص إلى مربع */
function shrink(file){return new Promise((ok,bad)=>{const url=URL.createObjectURL(file),im=new Image();
 im.onload=()=>{const s=Math.min(im.naturalWidth,im.naturalHeight),N=320,c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d');
  g.imageSmoothingQuality='high';g.drawImage(im,(im.naturalWidth-s)/2,(im.naturalHeight-s)/2,s,s,0,0,N,N);URL.revokeObjectURL(url);ok(c.toDataURL('image/jpeg',.86))};
 im.onerror=()=>{URL.revokeObjectURL(url);bad(new Error('تعذّرت قراءة الصورة. جرّب صورة بصيغة JPG أو PNG.'))};im.src=url})}
const letter=()=>{const n=(window.MQ&&MQ.user&&MQ.user.name)||'م';return n.replace(/^(المحامي|المحامية|الأستاذ)\s+/,'').trim()[0]||'م'};
function modal(){const d=AV.draft!==undefined?AV.draft:AV.data,fc=AV.draft!==undefined?AV.draftFor:AV.forClients;
 document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal av-modal" role="dialog" aria-label="صورتي الشخصية" style="max-width:520px"><div class="head"><h1 style="font-size:22px">صورتي الشخصية</h1><button class="btn sm" data-act="close">إغلاق</button></div>
 <div class="av-row"><div class="av-big" style="${d?`background-image:url('${d}')`:''}">${d?'':letter()}</div>
  <div class="av-acts"><label class="btn pri" style="cursor:pointer">اختيار صورة<input type="file" id="avFile" accept="image/*" hidden></label>
  <small class="m">من الهاتف: التقط صورة أو اخترها من المعرض أو الملفات. من الكمبيوتر: اخترها من وحدة التخزين.</small>
  ${d?'<button type="button" class="btn sm" data-act="avRemove">إزالة الصورة</button>':''}</div></div>
 ${AV.canClients?`<label class="ck av-ck"><input type="checkbox" id="avFor" ${fc?'checked':''} ${d?'':'disabled'}> إظهار صورتي للموكلين في تطبيقهم بصفتي محامي المكتب</label><small class="m">${AV.officePhoto&&!AV.forClients?'تظهر للموكلين حالياً صورة زميل آخر؛ اختيارك يستبدلها.':'تظهر في رأس المحادثة والشاشة الرئيسية لتطبيق الموكل.'}</small>`:''}
 <div class="toolbar" style="margin-top:14px"><button type="button" class="btn pri" data-act="avSave" ${AV.draft===undefined&&!AV.canClients?'disabled':''}>حفظ</button></div></div></div>`;
 const f=document.getElementById('avFile');if(f)f.onchange=async ev=>{const file=ev.target.files[0];if(!file)return;if(!/^image\//.test(file.type)&&!/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name))return toast('اختر ملف صورة');
  try{AV.draft=await shrink(file);const ck=document.getElementById('avFor');AV.draftFor=AV.canClients&&!AV.officePhoto?true:(ck&&!ck.disabled?ck.checked:AV.forClients);modal()}catch(e){toast(e.message)}};
 const c=document.getElementById('avFor');if(c)c.onchange=()=>{if(AV.draft===undefined)AV.draft=AV.data;AV.draftFor=c.checked}}
A.avOpen=async()=>{const m=document.getElementById('meMenu');if(m)m.hidden=true;if(!AV.loaded)await load();AV.draft=undefined;AV.draftFor=AV.forClients;modal()};
A.avRemove=()=>{AV.draft=null;AV.draftFor=false;modal()};
A.avSave=async()=>{const data=AV.draft!==undefined?AV.draft:AV.data,forClients=!!(data&&(AV.draft!==undefined?AV.draftFor:((document.getElementById('avFor')||{}).checked??AV.forClients)));
 try{const r=await fetch('/api/admin/me/avatar',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({data,forClients})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'تعذّر الحفظ');
  AV.officePhoto=forClients?true:(AV.forClients?false:AV.officePhoto);AV.data=data;AV.forClients=forClients;AV.draft=undefined;A.close();paint();toast(data?(forClients?'حُفظت الصورة وتظهر للموكلين في تطبيقهم':'حُفظت صورتك'):'أُزيلت الصورة')}catch(e){toast(e.message)}};
/* بعد بناء الشريط العلوي (admin.js) */
const r0=render;render=function(){r0();try{const a=document.querySelector('.me .avatar');if(a&&!a.dataset.avDone){a.dataset.avDone=1;AV.loaded?paint():load()}else paint()}catch(x){}};
const css=document.createElement('style');css.textContent=`
.me .avatar.has-photo{background-size:cover!important;background-position:center!important;color:transparent!important}
.av-row{display:flex;gap:18px;align-items:center;flex-wrap:wrap}
.av-big{width:132px;height:132px;border-radius:50%;flex:none;display:grid;place-items:center;font-size:52px;font-weight:800;background:var(--sunk,#f1e9db) center/cover no-repeat;color:var(--gold,#B9965A);border:3px solid var(--gold,#B9965A);box-shadow:0 8px 22px rgb(0 0 0 / .15)}
.av-acts{flex:1;min-width:200px;display:flex;flex-direction:column;gap:8px;align-items:flex-start}
.av-ck{display:flex;gap:8px;align-items:center;margin-top:16px;font-weight:600;color:inherit}`;document.head.appendChild(css);
})();
