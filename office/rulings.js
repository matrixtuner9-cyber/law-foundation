/* ── البحث في الاجتهادات القضائية الفلسطينية ──
   مكتبة المكتب من المبادئ القضائية: كل حكم بمحكمته ورقمه وتاريخه ومبدئه وملخّصه ونصه (ملف PDF/Word) وكلماته المفتاحية،
   ويُربط بقضايا المكتب ليظهر في ملف القضية. البحث عربي متسامح (الهمزات، التاء المربوطة، التشكيل، «ال» التعريف)
   ويُرتّب بالأقرب للعبارة. ومع روابط للمصادر العامة (مقام، المقتفي، قسطاس) تُفتح في نافذتها دون نسخ محتواها. */
(function(){
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const can2=w=>!!(window.MQ&&MQ.user&&({admin:{write:1,manage:1},lawyer:{write:1}}[MQ.user.role]||{})[w]);
const ro=()=>{if(window.MQ&&MQ.readOnly){toast('صلاحيتك للاطلاع فقط');return true}return false};
const RS={q:'',court:'',field:'',sort:'rel',open:null};
const COURTS=['محكمة النقض','المحكمة العليا','المحكمة الدستورية العليا','محكمة الاستئناف','محكمة البداية','محكمة الصلح','المحكمة الإدارية','محكمة الجنايات الكبرى','المحكمة الشرعية العليا','محكمة الاستئناف الشرعية','أخرى'];
const FIELDS=['مدني','تجاري','عمالي','جزائي','أحوال شخصية','إداري','دستوري','تنفيذ','إيجارات','أراضٍ وعقارات','إجراءات وإثبات','ضريبي','تأمين','أخرى'];
const SOURCES=[
 ['maqam','مقام · جامعة النجاح','https://maqam.najah.edu/judgments/'],
 ['muqtafi','المقتفي · جامعة بيرزيت','http://muqtafi.birzeit.edu/'],
 ['qistas','قسطاس','https://qistas.com/']];

/* ── تطبيع عربي ── */
const norm=s=>String(s||'').toLowerCase()
 .replace(/[\u064B-\u0652\u0640]/g,'')            /* التشكيل والتطويل */
 .replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي')
 .replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
const stem=w=>{let x=w;if(x.length>4&&/^(وال|بال|كال|فال)/.test(x))x=x.slice(3);else if(x.length>3&&/^(ال|لل)/.test(x))x=x.slice(2);if(x.length>3&&/^[وف]/.test(x))x=x.slice(1);
 x=x.replace(/(ات|ون|ين|ها|هم|هن|كم|نا|ه|ي)$/,m=>x.length-m.length>=3?'':m);return x};
const toks=s=>norm(s).split(' ').filter(w=>w.length>1).map(stem);
window.MQ_rnorm=norm;

/* ── البحث والترتيب ── */
function textOf(r){return [r.principle,r.summary,r.no,r.court,r.field,(r.keywords||[]).join(' '),r.notes,r.text].join(' ')}
function score(r,qn,qt){
 if(!qn)return 1;
 const full=norm(textOf(r)),pt=norm(r.principle),kw=norm((r.keywords||[]).join(' '));
 let s=0;
 if(pt.includes(qn))s+=60;else if(kw.includes(qn))s+=40;else if(full.includes(qn))s+=25;
 const words=full.split(' ').map(stem);const set=new Set(words);
 let hit=0;qt.forEach(t=>{if(set.has(t)){hit++;s+=8;if(pt.split(' ').map(stem).includes(t))s+=6}});
 if(qt.length&&hit<qt.length)s-=(qt.length-hit)*12;
 if(norm(r.no).includes(qn))s+=70;
 return hit||s>0?s:-1e9;
}
function list(){
 const qn=norm(RS.q),qt=toks(RS.q);
 let rs=rulings.filter(r=>(!RS.court||r.court===RS.court)&&(!RS.field||r.field===RS.field)).map(r=>({r,s:score(r,qn,qt)})).filter(x=>!qn||x.s>-1e8);
 if(RS.sort==='rel'&&qn)rs.sort((a,b)=>b.s-a.s||(b.r.date||'').localeCompare(a.r.date||''));
 else rs.sort((a,b)=>(b.r.date||'').localeCompare(a.r.date||''));
 return rs.map(x=>x.r);
}
const hl=(t,q)=>{t=e(t);if(!q)return t;const ws=norm(q).split(' ').filter(w=>w.length>1);if(!ws.length)return t;
 try{const re=new RegExp('('+ws.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/ا/g,'[اأإآ]').replace(/ي/g,'[يى]').replace(/ه/g,'[هة]')).join('|')+')','giu');return t.replace(re,'<mark>$1</mark>')}catch(x){return t}};
const dmy2=s=>s?dmy(s):'—';
const casesOf=r=>(r.cases||[]).map(id=>K(id)).filter(Boolean);

/* ── الملاحة ── */
const i=NAV.findIndex(n=>n[0]==='tpls');NAV.splice(i+1,0,['rulings','الاجتهادات القضائية']);
const navCount0=window.navCount;window.navCount=v=>v==='rulings'?(rulings.length||''):navCount0(v);

/* ── الشاشة ── */
V.rulings=()=>{
 const rs=list(),q=RS.q.trim();
 return `<div class="head"><div><h1>الاجتهادات القضائية الفلسطينية</h1><p class="sub">مكتبة المكتب من المبادئ القضائية: ابحث بالموضوع أو المبدأ أو رقم الحكم، واربط ما يفيد منها بقضاياك</p></div>
  <div class="toolbar">${can2('write')?'<button class="btn" data-act="rImport">استيراد حكم من مقام برابطه</button><button class="btn pri" data-act="rNew">إضافة حكم</button>':''}</div></div>
 <section class="panel"><div class="bd rl-search">
  <input class="field" id="rq" value="${e(RS.q)}" placeholder="مثال: بطلان التبليغ، الدفع بالتقادم، إخلاء المأجور لعدم دفع الأجرة…" autocomplete="off">
  <select class="field" id="rCourt"><option value="">كل المحاكم</option>${COURTS.map(c=>`<option ${RS.court===c?'selected':''}>${c}</option>`).join('')}</select>
  <select class="field" id="rField"><option value="">كل الفروع</option>${FIELDS.map(c=>`<option ${RS.field===c?'selected':''}>${c}</option>`).join('')}</select>
  <select class="field" id="rSort"><option value="rel" ${RS.sort==='rel'?'selected':''}>الأقرب للبحث</option><option value="date" ${RS.sort==='date'?'selected':''}>الأحدث</option></select>
 </div>
 <div class="rl-src"><span class="m">ابحث في المصادر العامة:</span><button class="chip" data-act="nav" data-v="maqamsearch">بحث مباشر في الأحكام ←</button>${SOURCES.map(s=>`<a class="chip" target="_blank" rel="noopener" href="${s[2]}" data-act="rSrc" data-v="${s[0]}">${s[1]} ↗</a>`).join('')}<span class="m">يُفتح الموقع في نافذة جديدة وتُنسخ عبارة البحث لتلصقها هناك. لا يُنسخ أي محتوى من هذه المواقع إلى النظام.</span></div></section>
 <div id="rlRes">${results(rs)}</div>`;
};
function results(rs){
 const q=RS.q.trim();
 if(!rulings.length)return `<section class="panel rl-empty"><div class="bd"><b>المكتبة فارغة بعد.</b><p>أضف المبادئ القضائية التي يعتمد عليها المكتب: المبدأ بصياغتك، ورقم الحكم ومحكمته وتاريخه، ونص الحكم إن توفر. كل ما تضيفه يصبح قابلاً للبحث فوراً ويُربط بقضاياك.</p>${can2('write')?'<button class="btn pri" data-act="rNew">إضافة أول حكم</button>':''}</div></section>`;
 if(!rs.length)return `<section class="panel"><div class="empty">لا نتائج في مكتبة المكتب لـ «${e(q)}». جرّب كلمات أقل، أو ابحث في المصادر العامة أعلاه.</div></section>`;
 return `<div class="m" style="margin:2px 4px 8px">${rs.length} ${rs.length===1?'حكم':rs.length===2?'حكمان':rs.length<=10?'أحكام':'حكماً'}${q?' لـ «'+e(q)+'»':''}</div>
 <div class="stack">${rs.map(r=>card(r,q)).join('')}</div>`;
}
function card(r,q){
 const ks=casesOf(r);
 return `<section class="panel rl-card" id="rl_${r.id}"><header><div class="rl-h"><span class="pill mz">${e(r.court)}</span><span class="mono">${e(r.no||'')}</span><span class="m">${dmy2(r.date)}</span>${r.field?`<span class="pill">${e(r.field)}</span>`:''}${r.outcome?`<span class="pill ${/نقض|قبول|فسخ/.test(r.outcome)?'acc':/رد|رفض/.test(r.outcome)?'warn':''}">${e(r.outcome)}</span>`:''}</div>
  <div class="toolbar">${r.file?`<a class="btn sm" target="_blank" rel="noopener" href="${e(r.file)}">نص الحكم</a>`:''}<button class="btn sm" data-act="rCite" data-v="${r.id}">نسخ الاستشهاد</button>${can2('write')?`<button class="btn sm" data-act="rEdit" data-v="${r.id}">تعديل</button>`:''}</div></header>
  <div class="bd"><div class="rl-p">${hl(r.principle,q)}</div>
  ${r.summary?`<div class="rl-s">${hl(r.summary,q)}</div>`:''}
  ${RS.open===r.id&&r.text?`<div class="rl-t">${hl(r.text,q)}</div>`:r.text?`<button class="link" data-act="rMore" data-v="${r.id}">عرض نص الحكم (${r.text.length.toLocaleString('en-US')} حرف)</button>`:''}
  <div class="rl-f"><div class="chips">${(r.keywords||[]).map(k=>`<button class="chip" data-act="rKw" data-v="${e(k)}">${e(k)}</button>`).join('')}</div>
  <div class="m">${ks.length?'مرتبط بـ: '+ks.map(k=>`<button class="link mono" data-act="openCase" data-v="${k.id}">${k.no}</button>`).join('، '):'غير مرتبط بقضية'}${r.src?' · المصدر: '+(r.srcUrl?`<a href="${e(r.srcUrl)}" target="_blank" rel="noopener">${e(r.src)} ↗</a>`:e(r.src)):''}${r.by?' · أضافه '+e(r.by):''}</div></div>
  ${r.notes?`<div class="note">${e(r.notes)}</div>`:''}</div></section>`;
}
function redraw(){const el=document.getElementById('rlRes');if(el)el.innerHTML=results(list())}

/* ── ملف القضية: تبويب «اجتهادات» ── */
const caseTab0=window.caseTab;
window.caseTab=function(k){
 if(S.caseTab==='rulings'){const rs=rulings.filter(r=>(r.cases||[]).includes(k.id)).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  return `<div class="toolbar" style="margin-bottom:10px">${can2('write')?`<button class="btn sm pri" data-act="rNewFor" data-v="${k.id}">إضافة حكم لهذه القضية</button><button class="btn sm" data-act="rPick" data-v="${k.id}">ربط حكم من المكتبة</button>`:''}<button class="btn sm" data-act="rSearchFor" data-v="${k.id}">بحث في المكتبة عن موضوع القضية</button></div>
  ${rs.length?`<div class="stack">${rs.map(r=>card(r,'')).join('')}</div>`:'<section class="panel"><div class="empty">لا اجتهادات مرتبطة بهذه القضية بعد.</div></section>'}`}
 return caseTab0(k);
};
const vcase=V.case;V.case=()=>vcase().replace('<button class="'+(S.caseTab==='mz'?'on':'')+'" data-act="caseTab" data-v="mz">سجل ميزان</button>',m=>m+`<button class="${S.caseTab==='rulings'?'on':''}" data-act="caseTab" data-v="rulings">الاجتهادات<span class="cnt">${rulings.filter(r=>(r.cases||[]).includes(S.caseId)).length||''}</span></button>`);

/* ── نموذج الإضافة والتعديل ── */
function form(r,caseId){
 r=r||{};const sel=new Set(r.cases||(caseId?[caseId]:[]));
 return `<div class="modal-bg" data-act="close"><div class="modal rl-modal" role="dialog" aria-label="حكم قضائي"><div class="head"><h1 style="font-size:24px">${r.id?'تعديل حكم':'إضافة حكم إلى المكتبة'}</h1><button class="btn sm" data-act="close">إغلاق</button></div>
 ${r.srcUrl&&!r.id?`<div class="rl-imp">استُخرجت البيانات من <a href="${e(r.srcUrl)}" target="_blank" rel="noopener">صفحة الحكم في مقام ↗</a>. راجعها، واكتب <b>المبدأ القضائي</b> بصياغتك قبل الحفظ.${r.fullText?` · <a href="${e(r.fullText)}" target="_blank" rel="noopener">النص الكامل (ملف) ↗</a>`:''}</div>`:''}
 <form class="form" id="fRuling" data-id="${e(r.id||'')}" data-src-url="${e(r.srcUrl||'')}">
  <label>المحكمة<select class="field" id="rfCourt">${COURTS.map(c=>`<option ${r.court===c?'selected':''}>${c}</option>`).join('')}</select></label>
  <label>رقم الحكم<input class="field mono" id="rfNo" value="${e(r.no||'')}" placeholder="مثال: نقض مدني 512/2023" required></label>
  <label>تاريخ الحكم<input class="field" type="date" id="rfDate" value="${e(r.date||'')}"></label>
  <label>الفرع<select class="field" id="rfField"><option value="">—</option>${FIELDS.map(c=>`<option ${r.field===c?'selected':''}>${c}</option>`).join('')}</select></label>
  <label>النتيجة<input class="field" id="rfOut" value="${e(r.outcome||'')}" list="rfOutL" placeholder="نقض الحكم / رد الطعن…"><datalist id="rfOutL">${['نقض الحكم','رد الطعن','قبول الاستئناف','رد الاستئناف','فسخ الحكم','تأييد الحكم','إعادة المحاكمة'].map(x=>`<option value="${x}">`).join('')}</datalist></label>
  <label>المصدر<input class="field" id="rfSrc" value="${e(r.src||'')}" placeholder="مقام / المقتفي / مجموعة المبادئ / ملف المكتب"></label>
  <label class="wide"><span>المبدأ القضائي <b class="rq">*</b></span><textarea class="field" id="rfP" rows="3" required placeholder="القاعدة التي قرّرها الحكم، بصياغة قابلة للاستشهاد">${e(r.principle||'')}</textarea></label>
  <label class="wide">ملخص الوقائع والتسبيب<textarea class="field" id="rfS" rows="3">${e(r.summary||'')}</textarea></label>
  <label class="wide"><span>الكلمات المفتاحية <small class="m">· مفصولة بفواصل</small></span><input class="field" id="rfK" value="${e((r.keywords||[]).join('، '))}" placeholder="تبليغ، بطلان، ميعاد الطعن"></label>
  <label class="wide"><span>نص الحكم <small class="m">· اختياري: الصقه هنا ليُبحث فيه</small></span><textarea class="field" id="rfT" rows="5" dir="rtl">${e(r.text||'')}</textarea></label>
  <label class="wide"><span>ملف الحكم <small class="m">· PDF أو Word أو صورة، حتى 25 ميغابايت</small></span><div class="toolbar"><input type="file" id="rfFile" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"><span id="rfFileN" class="m">${r.file?`ملف مرفق: <a target="_blank" rel="noopener" href="${e(r.file)}">${e(r.fileName||'فتح')}</a>`:''}</span></div></label>
  <label class="wide">ربط بقضايا المكتب<div class="rl-cases">${cases.map(k=>`<label class="rl-ck"><input type="checkbox" name="rfCase" value="${k.id}" ${sel.has(k.id)?'checked':''}> <span class="mono">${k.no}</span> · ${e(k.subject)}</label>`).join('')||'<span class="m">لا قضايا بعد</span>'}</div></label>
  <label class="wide">ملاحظات المكتب<input class="field" id="rfN" value="${e(r.notes||'')}" placeholder="كيف يُستعمل هذا المبدأ، أو تحفّظات عليه"></label>
  <div class="wide toolbar"><button class="btn pri" id="rfSave">حفظ</button>${r.id?`<button type="button" class="btn" data-act="rDel" data-v="${r.id}" style="color:var(--danger)">حذف من المكتبة</button>`:''}</div>
 </form></div></div>`;
}
let pendingFile=null;
function openForm(r,caseId){document.getElementById('modal').innerHTML=form(r,caseId);pendingFile=null;
 const fi=document.getElementById('rfFile');fi.onchange=()=>{pendingFile=fi.files[0]||null;document.getElementById('rfFileN').textContent=pendingFile?pendingFile.name+' · '+(pendingFile.size/1048576).toFixed(1)+' م.ب':''};
 document.getElementById('rfNo').focus()}
async function upload(f){
 const r=await fetch('/api/admin/ruling-file?name='+encodeURIComponent(f.name),{method:'POST',headers:{'content-type':f.type||'application/octet-stream'},body:f});
 if(r.status===401){location.replace('/login.html');throw new Error('انتهت الجلسة')}
 const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'تعذّر رفع الملف');return j;
}
document.addEventListener('submit',async ev=>{const f=ev.target;if(f.id!=='fRuling')return;ev.preventDefault();if(ro())return;
 const btn=document.getElementById('rfSave');btn.disabled=true;
 try{
  const id=f.dataset.id||('r'+Date.now().toString(36)+Math.random().toString(36).slice(2,7));
  let r=rulings.find(x=>x.id===id);const isNew=!r;if(isNew){r={id,added:iso(TODAY),by:window.MQ&&MQ.user?MQ.user.name:''};}
  Object.assign(r,{court:f.rfCourt.value,no:f.rfNo.value.trim(),date:f.rfDate.value,field:f.rfField.value,outcome:f.rfOut.value.trim(),src:f.rfSrc.value.trim(),
   principle:f.rfP.value.trim(),summary:f.rfS.value.trim(),keywords:f.rfK.value.split(/[،,]/).map(s=>s.trim()).filter(Boolean),text:f.rfT.value.trim().slice(0,200000),notes:f.rfN.value.trim(),...(f.dataset.srcUrl?{srcUrl:f.dataset.srcUrl}:{}),
   cases:[...f.querySelectorAll('input[name=rfCase]:checked')].map(x=>x.value)});
  if(pendingFile){if(!(window.MQ&&MQ.online))throw new Error('رفع الملف يحتاج اتصالاً بالخادم');const up=await upload(pendingFile);r.file=up.file;r.fileName=up.name;r.fileSize=up.size}
  if(isNew)rulings.push(r);
  A.close();toast(isNew?'أُضيف الحكم إلى المكتبة':'حُفظ التعديل');if(S.view!=='rulings'&&S.view!=='case')S.view='rulings';render();
  if(S.view==='rulings'){const el=document.getElementById('rl_'+r.id);if(el)el.scrollIntoView({block:'center'})}
 }catch(x){toast(x.message);btn.disabled=false}
});

/* ── الأفعال ── */
A.rNew=()=>{if(!ro())openForm(null)};
/* استيراد حكم واحد برابطه من مقام: يقرأ الخادم الصفحة ويملأ نموذج الإضافة للمراجعة */
A.rImport=()=>{if(ro())return;
 document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal rl-modal" role="dialog" aria-label="استيراد حكم"><div class="head"><h1 style="font-size:22px">استيراد حكم من مقام</h1><button class="btn sm" data-act="close">إغلاق</button></div>
 <form class="form" id="fRImport"><label class="wide"><span>رابط صفحة الحكم <small class="m">· افتح الحكم في موقع مقام وانسخ رابطه من شريط العنوان</small></span><input class="field" id="riUrl" dir="ltr" required placeholder="https://maqam.najah.edu/judgments/5158/"></label>
 <div class="wide toolbar"><button class="btn pri" id="riGo">استخراج بيانات الحكم</button><a class="btn" href="https://maqam.najah.edu/judgments/" target="_blank" rel="noopener">فتح مقام ↗</a></div>
 <p class="note wide">يُقرأ الحكم الذي تختاره فقط، ثم تراجع بياناته وتكتب المبدأ قبل حفظه في مكتبة المكتب، مع رابط مصدره.</p></form></div></div>`;
 document.getElementById('riUrl').focus()};
/* يقرأ الخادم صفحة الحكم ويفتح نموذج الإضافة للمراجعة؛ يُستدعى من نافذة الرابط ومن شاشة «البحث في مقام» */
async function importFrom(url,btn,label){
 const dup=rulings.find(r=>r.srcUrl&&r.srcUrl.replace(/\/?$/,'/')===url.replace(/\/?$/,'/'));if(dup){A.close();toast('هذا الحكم موجود في المكتبة');A.rOpen(dup.id);return}
 if(btn){btn.disabled=true;btn.textContent='جارٍ القراءة…'}
 try{const r=await fetch('/api/admin/ruling-import',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url})});
  if(r.status===401){location.replace('/login.html');return}
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'تعذّر الاستيراد');
  const x=j.ruling;openForm({court:x.court,no:x.no,date:x.date,field:x.field,keywords:x.keywords,text:x.text,src:x.src,srcUrl:x.srcUrl,fullText:x.fullText,
   notes:[x.courtName&&x.court==='أخرى'?'المحكمة: '+x.courtName:'',(x.classifications||[]).length?'التصنيف: '+x.classifications.join('؛ '):'',(x.cited||[]).length?'النصوص المذكورة: '+x.cited.join('؛ '):''].filter(Boolean).join(' · ').slice(0,1500)});
  toast('استُخرجت بيانات الحكم، راجعها واكتب المبدأ');
 }catch(x){toast(x.message);if(btn){btn.disabled=false;btn.textContent=label||'استخراج بيانات الحكم'}}
}
document.addEventListener('submit',ev=>{const f=ev.target;if(f.id!=='fRImport')return;ev.preventDefault();ev.stopImmediatePropagation();
 importFrom(f.riUrl.value.trim(),document.getElementById('riGo'))},true);
A.rImportUrl=v=>{if(ro())return;importFrom(String(v||''),null)};
A.rNewFor=v=>{if(!ro())openForm(null,v)};
A.rEdit=v=>{if(!ro())openForm(rulings.find(r=>r.id===v))};
A.rDel=v=>{if(ro())return;const r=rulings.find(x=>x.id===v);if(!r||!confirm('حذف الحكم «'+(r.no||'')+'» من مكتبة المكتب؟'))return;
 const i=rulings.indexOf(r);rulings.splice(i,1);if(window.MQ&&MQ.deleted)MQ.deleted('rulings',v);A.close();toast('حُذف الحكم');render()};
A.rMore=v=>{RS.open=RS.open===v?null:v;if(S.view==='rulings')redraw();else render()};
A.rSrc=()=>{const q=RS.q.trim();if(q&&navigator.clipboard)navigator.clipboard.writeText(q).then(()=>toast('نُسخت عبارة البحث، الصقها في موقع المصدر'),()=>{})};
A.rKw=v=>{RS.q=v;S.view='rulings';render()};
A.rSearchFor=v=>{const k=K(v);RS.q=k?k.subject:'';S.view='rulings';render()};
A.rCite=v=>{const r=rulings.find(x=>x.id===v);if(!r)return;const t=`${r.court}${r.no?' · '+r.no:''}${r.date?' · بتاريخ '+dmy(r.date):''}:\n«${r.principle}»`;
 (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('نُسخ الاستشهاد'),()=>prompt('انسخ الاستشهاد:',t))};
A.rPick=v=>{if(ro())return;const k=K(v);if(!rulings.length){toast('المكتبة فارغة، أضف حكماً أولاً');return}
 document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal rl-modal" role="dialog"><div class="head"><h1 style="font-size:22px">ربط حكم بالقضية <span class="mono">${k.no}</span></h1><button class="btn sm" data-act="close">إغلاق</button></div>
 <input class="field" id="rpq" placeholder="ابحث في المكتبة…" style="margin:10px 0"><div id="rpl" class="rl-pick">${pickList(k,'')}</div></div></div>`;
 const q=document.getElementById('rpq');q.oninput=()=>{document.getElementById('rpl').innerHTML=pickList(k,q.value)};q.focus()};
function pickList(k,q){const qn=norm(q),qt=toks(q);const rs=rulings.map(r=>({r,s:score(r,qn,qt)})).filter(x=>!qn||x.s>-1e8).sort((a,b)=>b.s-a.s).slice(0,30).map(x=>x.r);
 return rs.map(r=>{const on=(r.cases||[]).includes(k.id);return `<button class="rl-pk ${on?'on':''}" data-act="rLink" data-v="${r.id}|${k.id}"><span class="pill mz">${e(r.court)}</span> <span class="mono">${e(r.no||'')}</span><div>${e(r.principle).slice(0,160)}</div><small>${on?'✓ مرتبط — اضغط لفك الربط':'اضغط للربط'}</small></button>`}).join('')||'<div class="empty">لا نتائج.</div>'}
A.rLink=v=>{if(ro())return;const [rid,kid]=v.split('|');const r=rulings.find(x=>x.id===rid);if(!r)return;r.cases=r.cases||[];const i=r.cases.indexOf(kid);if(i>=0)r.cases.splice(i,1);else r.cases.push(kid);
 if(window.MQ&&MQ.saveState)MQ.saveState();const q=document.getElementById('rpq');document.getElementById('rpl').innerHTML=pickList(K(kid),q?q.value:'');toast(i>=0?'فُك الربط':'رُبط الحكم بالقضية')};

/* ── الربط بالشاشة ── */
const bind0=window.bindLocal;window.bindLocal=function(){bind0();
 const q=document.getElementById('rq');if(q){let t;q.oninput=()=>{RS.q=q.value;clearTimeout(t);t=setTimeout(redraw,120)}}
 [['rCourt','court'],['rField','field'],['rSort','sort']].forEach(([id,k])=>{const el=document.getElementById(id);if(el)el.onchange=()=>{RS[k]=el.value;redraw()}})};

/* البحث الشامل يشمل الاجتهادات */
const gq=document.getElementById('gq'),gr=document.getElementById('gres');
if(gq){const g0=gq.oninput;gq.oninput=()=>{g0();const q=gq.value.trim();if(q.length<2||!rulings.length)return;const qn=norm(q),qt=toks(q);
 const hits=rulings.map(r=>({r,s:score(r,qn,qt)})).filter(x=>x.s>-1e8).sort((a,b)=>b.s-a.s).slice(0,3);
 if(!hits.length)return;if(gr.querySelector('.empty'))gr.innerHTML='';
 gr.insertAdjacentHTML('beforeend',hits.map(({r})=>`<button data-act="rOpen" data-v="${r.id}"><span>${e(r.principle).slice(0,90)}</span><small>اجتهاد · ${e(r.court)} ${e(r.no||'')}</small></button>`).join(''));gr.hidden=false}}
A.rOpen=v=>{RS.q='';S.view='rulings';render();const el=document.getElementById('rl_'+v);if(el){el.scrollIntoView({block:'center'});el.classList.add('flash')}};

const css=document.createElement('style');css.textContent=`
.rl-search{display:grid;grid-template-columns:minmax(0,1fr) 170px 150px 140px;gap:10px}
@media(max-width:800px){.rl-search{grid-template-columns:1fr 1fr}.rl-search #rq{grid-column:1/-1}}
.rl-src{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:0 18px 12px}
.rl-src .chip{text-decoration:none;color:var(--ink)}
.rl-card header{flex-wrap:wrap}.rl-h{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.rl-p{font-size:16px;font-weight:700;line-height:1.8;color:var(--ink)}
.rl-s{margin-top:8px;line-height:1.75;color:var(--ink)}
.rl-t{margin-top:10px;padding:12px 14px;background:var(--sunk);border-radius:8px;white-space:pre-wrap;line-height:1.9;max-height:420px;overflow:auto;font-family:var(--f-doc,inherit);font-size:15px}
.rl-f{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:10px;align-items:center}
.rl-card mark{background:var(--warn-soft);color:inherit;padding:0 2px;border-radius:3px}
.rl-card.flash{outline:2px solid var(--brass)}
.rl-modal{max-width:860px}
.rl-cases{display:flex;flex-direction:column;gap:4px;max-height:160px;overflow:auto;border:1px solid var(--line);border-radius:8px;padding:8px 10px}
.rl-ck{display:flex;gap:8px;align-items:center;font-size:13.5px;cursor:pointer;flex-direction:row}
.rl-pick{display:flex;flex-direction:column;gap:6px;max-height:60vh;overflow:auto}
.rl-pk{all:unset;cursor:pointer;display:block;border:1px solid var(--line);border-radius:8px;padding:10px 12px;line-height:1.6}
.rl-pk:hover{background:var(--sunk)}.rl-pk.on{border-color:var(--accent);background:var(--accent-soft)}
.rl-pk small{color:var(--muted);font-size:12px}
.rl-empty p{color:var(--muted);line-height:1.8;max-width:620px}
.rq{color:var(--danger)}
.rl-imp{border:1px solid var(--brass);background:var(--brass-soft);border-radius:8px;padding:9px 12px;margin:8px 0 4px;font-size:13.5px;line-height:1.8}`;document.head.appendChild(css);
})();
