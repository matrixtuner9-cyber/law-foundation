/* ── المِسْبار: استيراد القضايا من ميزان بثلاث طرق ──
   1) صورة أو PDF أو ورقة محكمة أو نص ملصوق: تُقرأ على جهاز المكتب، ثم يستخرج المسبار القضايا والأطراف والجلسات.
   2) حساب ميزان (المحامي أو الموكل بموافقته): الموصل يحفظ الصفحات على جهاز المكتب، والمسبار يستخرج منها.
   3) صفحات من زميل: يصدّرها من نسخته (ملف) ونستوردها هنا دون الحاجة لكلمة مروره.
   ثم تطابق أداة المطابقة كل قضية مع المكتب (رقم الدعوى، رقم الهوية)، وتظهر بطاقة مراجعة قبل الحفظ. */
(function(){
'use strict';
if(typeof V==='undefined'||!location.protocol.startsWith('http'))return;
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MK='<img src="misbar-emblem.webp" alt="" class="mzx-mk">';
const X={busy:false,stage:'',caps:null,capErr:'',res:null,recs:null,pick:{},sel:{}};
const extOf=f=>{const x=String(f||'').split('?')[0].split('.').pop().toLowerCase();return x==='jpeg'?'jpg':x};
const rid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
async function jfetch(u,o){const r=await fetch(u,{credentials:'same-origin',...(o||{})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'تعذّر الطلب ('+r.status+')');return j}
const post=(u,b)=>jfetch(u,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b||{})});
function paint(){const b=document.getElementById('mzxBox');if(b)b.outerHTML=panel()}
async function loadCaps(){try{X.caps=(await jfetch('/api/mizan/captures')).captures;X.capErr=''}catch(x){X.caps=[];X.capErr=x.message}paint()}

function panel(){
 const caps=X.caps;
 return `<section id="mzxBox" class="mzx"><header>${MK}<div><b>المِسْبار · استيراد القضايا من ميزان</b><small>يستخرج القضايا والأطراف والجلسات، ويطابقها مع موكلي المكتب برقم الدعوى ورقم الهوية، ثم تراجعها قبل الحفظ.</small></div></header>
 ${X.busy?`<div class="mzx-think"><div class="mzx-orb">${MK}<i></i><i></i></div><div><b>عقل المسبار يعمل</b><span id="mzxStage">${e(X.stage)}</span></div></div>`:''}
 <div class="mzx-g">
  <article class="mzx-c"><h3><span>١</span> من صورة أو ورقة أو نص</h3><p>لقطة شاشة من ميزان، أو صفحة مطبوعة، أو إشعار أو تبليغ أو محضر. تُقرأ على هذا الجهاز.</p>
   <label class="mzx-drop"><input type="file" id="mzxFile" accept="image/*,.pdf,.docx,.txt" multiple hidden><b>📥 اختر الصور أو الملفات</b><small>يمكن اختيار عدة صفحات</small></label>
   <details><summary>✍️ أو الصق النص</summary><textarea class="field" id="mzxText" rows="5" placeholder="الصق نص صفحة القضية أو جدول القضايا من ميزان…"></textarea><button type="button" class="btn pri sm" data-act="mzxPaste" ${X.busy?'disabled':''}>استخراج القضايا</button></details></article>
  <article class="mzx-c"><h3><span>٢</span> من حساب ميزان</h3><p>حساب المحامي (أعلى هذه الصفحة) أو حساب الموكل بموافقته (من حقيبة الموكل). بعد «قراءة صفحات القضايا» تظهر النسخة هنا:</p>
   ${caps===null?'<p class="m">…</p>':X.capErr?`<p class="m">${e(/جهاز المكتب/.test(X.capErr)?'متاح من جهاز المكتب لمدير النظام.':X.capErr)}</p>`:caps.length?`<ul class="mzx-caps">${caps.map(c=>`<li><span>${c.from==='client'?'👤 حساب موكل':c.from==='import'?'📨 من زميل':'⚖️ حساب المحامي'} · ${e(String(c.at||c.id).slice(0,16).replace('T',' '))} · ${c.pages} صفحة</span><span><button type="button" class="btn sm pri" data-act="mzxCap" data-v="${e(c.id)}" ${X.busy?'disabled':''}>استخراج القضايا</button><a class="btn sm" href="/api/mizan/captures/export?id=${encodeURIComponent(c.id)}" title="ملف يمكن إرساله لمكتب آخر">تصدير</a></span></li>`).join('')}</ul>`:'<p class="m">لا صفحات محفوظة بعد.</p>'}</article>
  <article class="mzx-c"><h3><span>٣</span> صفحات من زميل</h3><p>محامٍ لديه المِسْبار يشغّل «قراءة صفحات القضايا» بحسابه، ثم «تصدير» ويرسل الملف. لا نحتاج كلمة مروره.</p>
   <label class="mzx-drop"><input type="file" id="mzxImp" accept=".json,application/json" hidden><b>📨 استيراد ملف صفحات</b><small>ملف .json صادر من المِسْبار</small></label></article>
 </div></section>`}

/* ── المعالجة ── */
const setStage=t=>{X.stage=t;const el=document.getElementById('mzxStage');if(el)el.textContent=t};
const CONSENT='يُرسل المسبار النص المقروء إلى خدمة الذكاء الاصطناعي لاستخراج القضايا، بعد إخفاء أرقام الهويات والهواتف والحسابات (تُعاد محلياً للمطابقة).\n\nمتابعة؟';
async function extract(text,source){
 if(text.replace(/\s/g,'').length<40)throw new Error('لم يُقرأ نص كافٍ.');
 if(!confirm(CONSENT))return null;
 setStage('يستخرج القضايا والأطراف والجلسات…');
 const r=await post('/api/admin/misbar/case/mzx',{text,source,consent:true});
 if(!r.records.length)throw new Error('لم يجد المسبار قضايا في هذا النص.');
 setStage('يطابق القضايا مع موكلي المكتب…');
 const m=await post('/api/admin/misbar/case/mzmatch',{records:r.records});
 X.recs=r.records;X.res=m;X.sel={};X.pick={};
 m.matched.forEach((x,i)=>{X.sel['m'+i]=true});m.newForClient.forEach((x,i)=>{X.sel['n'+i]=true});m.unknown.forEach((x,i)=>{X.sel['u'+i]=true;X.pick[i]=0});
 review();return m}
async function run(fn){X.busy=true;X.stage='يجهّز…';paint();try{await fn()}catch(x){toast(x.message)}X.busy=false;paint()}
async function readFiles(files){const out=[];
 for(let i=0;i<files.length;i++){const f=files[i],url=URL.createObjectURL(f);window.MQ_extractStage=t=>setStage('يقرأ '+(files.length>1?'الملف '+(i+1)+' من '+files.length:'الملف')+': '+t);
  try{const r=await MQ_extract(url,extOf(f.name));out.push(String(r.text||'').trim())}finally{URL.revokeObjectURL(url);window.MQ_extractStage=null}}
 return out.filter(Boolean).join('\n\n')}
document.addEventListener('change',ev=>{const t=ev.target;if(!t)return;
 if(t.id==='mzxFile'&&t.files&&t.files.length){const fs=[...t.files];t.value='';if(typeof MQ_extract!=='function')return toast('قارئ المستندات غير متاح');run(async()=>{const text=await readFiles(fs);await extract(text,'صورة/ملف')})}
 if(t.id==='mzxImp'&&t.files&&t.files[0]){const f=t.files[0];t.value='';run(async()=>{setStage('يستورد ملف الصفحات…');let b;try{b=JSON.parse(await f.text())}catch(x){throw new Error('الملف غير صالح.')}const r=await post('/api/mizan/captures/import',b);toast('استُوردت الصفحات');await loadCaps();setStage('يقرأ الصفحات…');const t2=await jfetch('/api/mizan/captures/text?id='+encodeURIComponent(r.id));await extract(t2.text,'صفحات ميزان من زميل')})}});
A.mzxPaste=()=>{const ta=document.getElementById('mzxText');const text=String(ta&&ta.value||'').trim();run(()=>extract(text,'نص ملصوق'))};
A.mzxCap=id=>run(async()=>{setStage('يقرأ الصفحات المحفوظة…');const t=await jfetch('/api/mizan/captures/text?id='+encodeURIComponent(id));await extract(t.text,'صفحات ميزان')});

/* ── بطاقة المراجعة ── */
function review(){const m=X.res;if(!m)return;const s=m.summary||{};
 const ses=ss=>(ss||[]).length?`<ul class="mzx-ses">${ss.map(x=>`<li>${e(x.date)}${x.time?' '+e(x.time):''} — ${e(x.purpose||'جلسة')}${x.result?' ← '+e(x.result):''}</li>`).join('')}</ul>`:'';
 const parts=r=>(r.parties||[]).map(p=>`${e(p.name)}${p.role?' ('+e(p.role)+')':''}`).join('، ');
 const ck=k=>`<input type="checkbox" data-mzx="${k}" ${X.sel[k]?'checked':''}>`;
 document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal mzx-rv" role="dialog" aria-label="مراجعة الاستيراد من ميزان">
 <div class="head"><h1 style="font-size:22px">${MK} مراجعة ما استخرجه المسبار</h1><button class="x" data-act="close" aria-label="إغلاق">✕</button></div>
 <p class="m">${s.total||0} قضية: ${s.matched||0} موجودة في المكتب (${s.newSessions||0} جلسة جديدة) · ${s.newForClient||0} جديدة لموكلين موجودين · ${s.unknown||0} لموكلين غير موجودين. اختر ما تريد حفظه.</p>
 ${m.matched.length?`<h3>قضايا موجودة في المكتب</h3>${m.matched.map((x,i)=>`<label class="mzx-it">${ck('m'+i)}<div><b>${e(x.caseNo)}</b> <small>طوبقت ب${e(x.by)}</small>${x.newSessions.length?ses(x.newSessions):'<small class="m"> — لا جلسات جديدة</small>'}${(x.changes||[]).filter(c=>c.field==='stage').map(c=>`<small class="mzx-chg">المرحلة: ${e(c.from||'—')} ← ${e(c.to)}</small>`).join('')}</div></label>`).join('')}`:''}
 ${m.newForClient.length?`<h3>قضايا جديدة لموكلين موجودين</h3>${m.newForClient.map((x,i)=>`<label class="mzx-it">${ck('n'+i)}<div><b>${e(x.record.caseNo||'بلا رقم')}</b> · ${e(x.record.court)} — للموكل <b>${e(x.clientName)}</b> <small>(طوبق ب${x.by==='الاسم'?'الاسم — تحقق':'رقم الهوية'})</small><div class="m">${e(x.record.type)} ${e(x.record.subject)}</div><div class="m">الأطراف: ${parts(x.record)}</div>${ses(x.record.sessions)}</div></label>`).join('')}`:''}
 ${m.unknown.length?`<h3>قضايا لموكلين غير موجودين في المكتب</h3>${m.unknown.map((x,i)=>`<div class="mzx-it">${ck('u'+i)}<div><b>${e(x.record.caseNo||'بلا رقم')}</b> · ${e(x.record.court)}<div class="m">${e(x.record.type)} ${e(x.record.subject)}</div>
   <label class="mzx-pk">الموكل: <select class="field" data-mzxp="${i}">${(x.record.parties||[]).map((p,j)=>`<option value="${j}" ${X.pick[i]===j?'selected':''}>${e(p.name)}${p.role?' — '+e(p.role):''}${p.idNo?' — '+e(p.idNo):''}</option>`).join('')}</select></label>${ses(x.record.sessions)}</div></div>`).join('')}`:''}
 <div class="toolbar" style="margin-top:14px"><button class="btn pri" data-act="mzxApply">حفظ المحدد في المكتب</button><button class="btn" data-act="close">إلغاء</button></div>
 <p class="m" style="font-size:12px">يُنشأ للموكل الجديد ملف ورمز بوابة، وتُضاف الجلسات إلى المواعيد، ويُسجَّل كل ذلك في سجل التدقيق.</p></div></div>`}
document.addEventListener('change',ev=>{const t=ev.target;if(!t||!t.dataset)return;if(t.dataset.mzx)X.sel[t.dataset.mzx]=t.checked;if(t.dataset.mzxp!==undefined)X.pick[+t.dataset.mzxp]=+t.value});

const courtOf=name=>{if(!name||typeof courts==='undefined')return '';const n=s=>String(s||'').replace(/[إأآ]/g,'ا').replace(/ة/g,'ه').replace(/\s+/g,' ').trim();const w=n(name);
 const c=courts.find(c=>n(c.name)===w)||courts.find(c=>w.includes(n(c.name))||n(c.name).includes(w))||courts.find(c=>w.split(' ').filter(x=>x.length>2).every(x=>n(c.name).includes(x)));return c?c.id:''};
function addSessions(kid,ss){let n=0;const known=new Set(hearings.filter(h=>h.k===kid).map(h=>h.date));for(const s of ss||[]){if(!s.date||known.has(s.date))continue;hearings.push({id:rid('h'),k:kid,date:s.date,time:s.time||'',purpose:s.purpose||'جلسة',...(s.result?{result:s.result}:{}),src:'ميزان'});known.add(s.date);n++}return n}
function newCase(r,clientId,clientRole){const opps=[];
 for(const p of r.parties||[]){if(p._client)continue;let o=opponents.find(x=>x.name===p.name);if(!o){o={id:rid('o'),name:p.name,type:'—',lawyer:p.lawyer||'—',...(p.idNo?{idNo:p.idNo}:{})};opponents.push(o)}opps.push(o.id)}
 const kid=rid('k');cases.push({id:kid,no:r.caseNo||'قيد التسجيل',mzRef:r.caseNo||'',mz:r.ref||'',court:courtOf(r.court),type:r.type||'',subject:r.subject||(r.type||'قضية من ميزان'),client:clientId,opps,role:clientRole||'',stage:r.status||'',step:0,status:'نشطة',value:Number(String(r.value||'').replace(/[^\d.]/g,''))||0,opened:iso(TODAY),src:'ميزان'});
 return kid}
A.mzxApply=()=>{const m=X.res;if(!m)return;let nc=0,ncl=0,nh=0,nu=0;
 m.matched.forEach((x,i)=>{if(!X.sel['m'+i])return;const k=K(x.caseId);if(!k)return;nh+=addSessions(k.id,x.newSessions);for(const c of x.changes||[]){if(c.field==='stage'&&c.to)k.stage=c.to;if(c.field==='mz'&&c.to)k.mz=c.to}nu++});
 m.newForClient.forEach((x,i)=>{if(!X.sel['n'+i])return;const r=x.record,c=clients.find(c=>c.id===x.clientId);const nm=v=>String(v||'').replace(/[إأآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/\s+/g,' ').trim();const me=(r.parties||[]).find(p=>p.idNo&&c&&String(c.idNo||'').replace(/\D/g,'')===p.idNo)||(r.parties||[]).find(p=>c&&nm(p.name)===nm(c.name));(r.parties||[]).forEach(p=>{p._client=p===me});
  const kid=newCase(r,x.clientId,me&&me.role);nh+=addSessions(kid,r.sessions);nc++});
 m.unknown.forEach((x,i)=>{if(!X.sel['u'+i])return;const r=x.record,p=(r.parties||[])[X.pick[i]||0];if(!p)return;(r.parties||[]).forEach(q=>{q._client=q===p});
  const cid=rid('c');clients.push({id:cid,name:p.name,type:'فرد',idNo:p.idNo||'—',phone:'—',city:(window.OFFICE&&OFFICE.city)||'',ch:'واتساب',portal:false,last:null,fee:0,paid:0,since:iso(TODAY),code:window.MQ_code?MQ_code():'',src:'ميزان'});ncl++;
  const kid=newCase(r,cid,p.role);nh+=addSessions(kid,r.sessions);nc++});
 if(window.MQ&&MQ.saveState)MQ.saveState();A.close();X.res=null;render();
 toast(`حُفظ: ${nc} قضية جديدة${ncl?' و'+ncl+' موكل جديد':''}${nu?' وتحديث '+nu+' قضية':''} و${nh} جلسة`)};

/* في شاشة «الربط مع ميزان» أعلى الصفحة */
if(typeof V.mizan==='function'){const v0=V.mizan;V.mizan=function(){const h=v0.apply(this,arguments);if(X.caps===null&&!X._l){X._l=1;setTimeout(loadCaps,20)}return panel()+h}}
/* عند انتهاء «قراءة صفحات القضايا» تتحدّث قائمة النسخ */
setInterval(()=>{if(S.view==='mizan'&&!X.busy&&document.getElementById('mzxBox'))loadCaps()},45000);

const css=document.createElement('style');css.textContent=`
.mzx{margin:0 0 18px;border:1px solid #C9A24A;border-radius:18px;background:var(--panel,#FBF6EA);padding:14px 16px;display:grid;gap:12px}
.mzx-mk{width:26px;height:26px;border-radius:50%;vertical-align:-6px;filter:drop-shadow(0 0 6px rgb(201 162 74 / .55))}
.mzx>header{display:flex;gap:10px;align-items:center}.mzx>header b{display:block;font-size:17px;color:#0B1B2B}.mzx>header small{color:var(--muted,#6b7280)}
.mzx-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}
.mzx-c{background:#fff;border:1px solid var(--line,#e5dccb);border-radius:14px;padding:12px 14px;display:grid;gap:8px;align-content:start}
.mzx-c h3{margin:0;font-size:15px;display:flex;gap:8px;align-items:center}.mzx-c h3 span{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#0B1B2B,#1B3654);color:#F3D58A;font-size:13px}
.mzx-c p{margin:0;font-size:13px;color:#4B5563;line-height:1.7}
.mzx-drop{display:grid;justify-items:center;gap:2px;padding:14px;border:2px dashed #C9A24A;border-radius:12px;background:#FFFDF6;cursor:pointer;text-align:center}.mzx-drop:hover{background:#FBF0D2}.mzx-drop small{color:var(--muted,#6b7280)}
.mzx-c details textarea{width:100%;box-sizing:border-box;margin:6px 0}.mzx-c summary{cursor:pointer;font-weight:700;font-size:13px}
.mzx-caps{list-style:none;margin:0;padding:0;display:grid;gap:6px}.mzx-caps li{display:flex;flex-wrap:wrap;gap:6px;justify-content:space-between;align-items:center;font-size:12.5px;border:1px solid #efe6d0;border-radius:10px;padding:6px 8px}.mzx-caps li>span:last-child{display:flex;gap:4px}
.mzx-think{display:flex;gap:14px;align-items:center;padding:14px 16px;border-radius:14px;background:radial-gradient(circle at 85% 50%,#1B3654,#0B1B2B 70%);border:1px solid #C9A24A;color:#F2E6C4}.mzx-think b{display:block;color:#F3D58A}
.mzx-orb{position:relative;width:52px;height:52px;display:grid;place-items:center}.mzx-orb .mzx-mk{width:34px;height:34px}.mzx-orb i{position:absolute;inset:0;border-radius:50%;border:2px solid transparent;border-top-color:#F3D58A;animation:mzxSpin 1.3s linear infinite}.mzx-orb i:nth-child(3){inset:5px;border-top-color:transparent;border-left-color:#C9A24A;animation-duration:2s;animation-direction:reverse}
@keyframes mzxSpin{to{transform:rotate(360deg)}}
.mzx-rv{max-width:820px}.mzx-rv h3{margin:14px 0 6px;font-size:15px;color:#8A6A25}
.mzx-it{display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border:1px solid #efe6d0;border-radius:10px;margin-bottom:6px;background:#fff}.mzx-it input[type=checkbox]{margin-top:5px}
.mzx-ses{margin:4px 0 0;padding-inline-start:18px;font-size:13px}.mzx-chg{display:block;color:#1E3A5F}.mzx-pk{display:flex;gap:6px;align-items:center;margin-top:4px;font-size:13px}.mzx-pk select{max-width:420px}
html.night .mzx,html.night .mzx-c,html.night .mzx-it{background:#14213a;color:#e5e7eb}`;
document.head.appendChild(css);
})();
