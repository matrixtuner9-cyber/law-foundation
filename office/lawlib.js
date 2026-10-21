/* ── المكتبة القانونية الفلسطينية: النماذج ──
   الفهرس الأساسي (245) في lawlib-data.js، وحالة كل نموذج لدى المكتب في السجلات (lawforms) بنفس الحفظ الآمن.
   - النوع A: مرجع لنموذج منشور لدى جهة رسمية. ليس نسخة أصلية مصدقة ولا تأكيداً بأنه ما زال نافذاً؛ يُنزَّل الأصل من الجهة.
   - النوع B: مسودة عمل مقترحة؛ لا تُعرض «معتمدة» قبل مراجعة محامٍ فلسطيني مختص.
   أربع حالات: مسودة ← قيد المراجعة القانونية ← معتمد داخلياً (مع المعتمِد ورقم مزاولته والاختصاص والإصدار)
   و«نموذج رسمي محقق» للنوع A فقط بعد رفع نسخة الجهة الأصلية وتوثيق مصدرها وتاريخها.
   الاعتماد من صلاحية مدير المكتب، ويتحقق الخادم من ذلك. وأي تعديل على نص نموذج معتمد يعيده إلى المراجعة.
   ما لم يُعتمد يُطبع بعلامة «مسودة» وتنبيه واضح. */
(function(){
const LIB=window.MQ_LAWLIB;if(!LIB)return;
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const can2=w=>!!(window.MQ&&MQ.user&&({admin:{write:1,manage:1},lawyer:{write:1}}[MQ.user.role]||{})[w]);
const offline=()=>!(window.MQ&&MQ.online);
const canW=()=>offline()||can2('write'),canM=()=>offline()||can2('manage');
const ro=()=>{if(window.MQ&&MQ.readOnly){toast('صلاحيتك للاطلاع فقط');return true}return false};
const norm=window.MQ_rnorm||(s=>String(s||'').toLowerCase());
const me=()=>window.MQ&&MQ.user?MQ.user.name:OFFICE.lawyer;
const stamp=()=>{const n=new Date();return iso(TODAY)+' '+String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0')};

const ST={draft:['مسودة','','نموذج تحت الإعداد، غير صالح للإصدار الرسمي'],review:['قيد المراجعة القانونية','warn','صيغ ويخضع لتدقيق المحامي'],
 internal:['معتمد داخلياً','ok','وافق عليه المسؤول القانوني مع تحديد الاختصاص والإصدار'],official:['نموذج رسمي محقق','acc','حُصل على نسخته الأصلية من الجهة المختصة وتُحقق من تاريخها ومصدرها']};
const ORDER=['draft','review','internal','official'];
const JUR={WB:'الضفة الغربية',GZ:'قطاع غزة',JR:'القدس'};
const CHECK=['الاختصاص','المواعيد','الصفة','الوكالة','الرسوم','المتطلبات الشكلية','القانون واجب التطبيق وتاريخ نفاذه'];
const SKELETON='التاريخ: {التاريخ}   المرجع: {رقم الملف}   الجهة/المحكمة: {الجهة المختصة}\nالطرف الأول/مقدم الطلب: {الاسم، الهوية/التسجيل، العنوان، الصفة}\nالطرف الثاني/المخاطب: {الاسم، الصفة، عنوان التبليغ}\nالموضوع: {العنوان}\n1. {البند الأول}\n2. {البند الثاني}\n3. {البند الثالث}\nالمرفقات: {قائمة المستندات مع أرقامها وتواريخها}.  الاعتماد: {اسم المحامي/رقم مزاولته}.  التوقيع والختم: {حسب المتطلبات}.\nمراجعة إلزامية: الاختصاص، المواعيد، الصفة، الوكالة، الرسوم، المتطلبات الشكلية، القانون واجب التطبيق، وتاريخ نفاذه.';

const LS={q:'',cat:'',kind:'',st:'',jur:'',open:null};
const rec=id=>lawforms.find(r=>r.id===id);
/* النموذج الفعلي = بيانات الفهرس + ما سجّله المكتب */
function item(id){const base=LIB.items.find(x=>x.id===id),r=rec(id);if(!base&&!r)return null;
 const it={...(base||{}),...(r||{})};it.status=r&&r.status||'draft';it.body=r&&r.body!=null?r.body:(base&&base.body)||'';it.version=r&&r.version||(base&&base.body?'0.1':'');it.jur=r&&r.jur||[];it.custom=!base;return it}
const all=()=>[...LIB.items.map(x=>item(x.id)),...lawforms.filter(r=>r.custom).map(r=>item(r.id))];
const cats=()=>[...new Set(all().map(x=>x.cat))];
function filtered(){const qn=norm(LS.q);return all().filter(x=>(!LS.cat||x.cat===LS.cat)&&(!LS.kind||x.kind===LS.kind)&&(!LS.st||x.status===LS.st)&&(!LS.jur||x.jur.includes(LS.jur))&&(!qn||norm([x.id,x.title,x.cat,x.body].join(' ')).includes(qn)))}
const stPill=x=>`<span class="pill ${ST[x.status][1]}">${ST[x.status][0]}</span>`;
const kindPill=x=>x.kind==='A'?`<span class="pill mz" title="مرجع لنموذج منشور لدى جهة رسمية">مرجع رسمي</span>`:`<span class="pill" title="مسودة عمل مقترحة تحتاج اعتماداً">نموذج عمل مقترح</span>`;

/* ── الملاحة ── */
const i=NAV.findIndex(n=>n[0]==='tpls');NAV.splice(i+1,0,['lawlib','المكتبة القانونية']);
const navCount0=window.navCount;window.navCount=v=>v==='lawlib'?all().length:navCount0(v);

/* ── الشاشة ── */
V.lawlib=()=>{
 const A_=all(),n=k=>A_.filter(x=>x.status===k).length,a=A_.filter(x=>x.kind==='A').length;
 return `<div class="head"><div><h1>المكتبة القانونية الفلسطينية</h1><p class="sub">${e(LIB.edition)} · ${A_.length} نموذجاً ومرجعاً، مع فصل النماذج المنشورة لدى الجهات الرسمية عن مسودات العمل التي تحتاج مراجعة واعتماداً</p></div>
  <div class="toolbar"><button class="btn" data-act="nav" data-v="legalShelf">مكتبتي القانونية</button>${canW()?'<button class="btn" data-act="llNew">نموذج جديد للمكتب</button>':''}</div></div>
 <div class="ll-stats">
  <button class="ll-st" data-act="llKind" data-v=""><b>${A_.length}</b><span>نموذجاً ومرجعاً</span></button>
  <button class="ll-st ${LS.kind==='A'?'on':''}" data-act="llKind" data-v="A"><b>${a}</b><span>مرجعاً لنموذج منشور لدى جهة رسمية</span></button>
  <button class="ll-st ${LS.kind==='B'?'on':''}" data-act="llKind" data-v="B"><b>${A_.length-a}</b><span>نموذج عمل مقترح يحتاج اعتماداً</span></button>
  ${ORDER.map(k=>`<button class="ll-st sm ${LS.st===k?'on':''}" data-act="llSt" data-v="${k}"><b>${n(k)}</b><span><i class="pill ${ST[k][1]}">${ST[k][0]}</i></span></button>`).join('')}
 </div>
 <div class="ll-warn" role="note"><b>تنبيه قانوني مهم</b> المراجع الرسمية (${a}) مرتبطة بفهارس جهات رسمية، لكنها ليست نسخاً أصلية مصدقة ولا تأكيداً بأن إصداراتها ما زالت نافذة؛ نزّل الأصل من الجهة قبل الاستعمال. وبقية النماذج مسودات مقترحة لا تُعرض «معتمدة قانونياً» قبل مراجعتها من محامٍ فلسطيني مختص. وراعِ اختلاف الإجراءات والتشريعات بين الضفة الغربية وقطاع غزة والقدس.</div>
 <section class="panel"><div class="bd ll-filters">
  <input class="field" id="llq" value="${e(LS.q)}" placeholder="ابحث باسم النموذج أو رقمه أو نصه…" autocomplete="off">
  <select class="field" id="llCat"><option value="">كل التصنيفات</option>${cats().map(c=>`<option ${LS.cat===c?'selected':''}>${e(c)}</option>`).join('')}</select>
  <select class="field" id="llKindS"><option value="">كل الأنواع</option><option value="A" ${LS.kind==='A'?'selected':''}>مراجع رسمية</option><option value="B" ${LS.kind==='B'?'selected':''}>مسودات عمل</option></select>
  <select class="field" id="llStS"><option value="">كل الحالات</option>${ORDER.map(k=>`<option value="${k}" ${LS.st===k?'selected':''}>${ST[k][0]}</option>`).join('')}</select>
  <select class="field" id="llJur"><option value="">كل الاختصاصات</option>${Object.entries(JUR).map(([k,v])=>`<option value="${k}" ${LS.jur===k?'selected':''}>${v}</option>`).join('')}</select>
 </div></section>
 <div id="llRes">${results()}</div>
 <section class="panel" style="margin-top:16px"><header><h2>المصادر الرسمية للتحقق والتحميل</h2></header><div class="ll-src">${LIB.sources.map(s=>`<a href="${e(s[1])}" target="_blank" rel="noopener"><b>${e(s[0])} ↗</b><small>${e(s[2])}</small></a>`).join('')}</div></section>`;
};
function results(){const xs=filtered();if(!xs.length)return '<section class="panel"><div class="empty">لا نماذج تطابق البحث والتصفية.</div></section>';
 const by={};xs.forEach(x=>(by[x.cat]=by[x.cat]||[]).push(x));
 return `<div class="m" style="margin:4px">${xs.length} من ${all().length}</div><div class="stack">${Object.entries(by).map(([c,list])=>`<section class="panel tablewrap"><header><h2>${e(c)}</h2><span class="pill">${list.length}</span></header>
 <table class="ll-t"><tbody>${list.map(x=>`<tr class="clk" data-act="llOpen" data-v="${e(x.id)}"><td class="mono ll-id">${e(x.id)}</td><td style="font-weight:600">${e(x.title)}${x.custom?' <span class="pill">من المكتب</span>':''}</td><td>${kindPill(x)}</td><td>${stPill(x)}</td>
  <td class="m">${x.jur.length?x.jur.map(j=>JUR[j]).join('، '):'—'}</td><td class="m">${x.version?'إ '+e(x.version):''}</td><td class="m">${x.kind==='A'?(x.status==='official'?'الأصل محفوظ':'يُنزَّل من الجهة'):x.body?'نص متاح':'لم يُصَغ بعد'}</td></tr>`).join('')}</tbody></table></section>`).join('')}</div>`}
function redraw(){const el=document.getElementById('llRes');if(el)el.innerHTML=results()}

/* ── بطاقة النموذج ── */
function detail(id){const x=item(id);if(!x)return '';const r=rec(id)||{};const hist=(r.history||[]).slice().reverse();
 const stepIdx=ORDER.indexOf(x.status);
 return `<div class="modal-bg" data-act="close"><div class="modal ll-modal" role="dialog" aria-label="${e(x.title)}">
 <div class="head"><div><div class="m mono">${e(x.id)} · ${e(x.cat)}</div><h1 style="font-size:24px">${e(x.title)}</h1></div><button class="btn sm" data-act="close">إغلاق</button></div>
 <div class="ll-steps">${ORDER.map((k,j)=>(k==='official'&&x.kind!=='A')||(k==='internal'&&x.kind==='A'&&!x.custom)?'':`<div class="${j===stepIdx?'on':j<stepIdx?'done':''}"><b>${ST[k][0]}</b><small>${ST[k][2]}</small></div>`).join('')}</div>
 ${x.kind==='A'?`<div class="ll-warn">مرجع لنموذج منشور لدى جهة رسمية. هذا ليس نسخة أصلية مصدقة، ولا تأكيداً بأن إصداره ما زال نافذاً. ${x.src?`نزّل الأصل من <a href="${e(x.src)}" target="_blank" rel="noopener">موقع الجهة ↗</a>`:''}</div>`
  :x.status!=='internal'?`<div class="ll-warn">مسودة عمل مقترحة غير معتمدة: لا تُستخدم للإيداع أو التوقيع قبل مراجعة محامٍ فلسطيني مختص.</div>`:''}
 <form class="form" id="fLaw" data-id="${e(id)}">
  ${x.custom?`<label class="wide">اسم النموذج<input class="field" id="lfT" value="${e(x.title)}" required></label><label class="wide">التصنيف<input class="field" id="lfC" value="${e(x.cat)}" list="lfCl"><datalist id="lfCl">${cats().map(c=>`<option value="${e(c)}">`).join('')}</datalist></label>`:''}
  <label>رقم الإصدار<input class="field mono" id="lfV" value="${e(x.version)}" placeholder="مثال: 1.0"></label>
  <label class="wide-2"><span>نطاق الاختصاص</span><div class="ll-jur">${Object.entries(JUR).map(([k,v])=>`<label class="rl-ck"><input type="checkbox" name="lfJ" value="${k}" ${x.jur.includes(k)?'checked':''}> ${v}</label>`).join('')}</div></label>
  ${x.kind==='B'||x.custom?`<label class="wide"><span>نص النموذج <small class="m">· ما بين { } حقول تُملأ من ملف القضية أو يدوياً</small></span>${x.body?'':`<div class="m" style="margin-bottom:6px">لم يُصَغ نص هذا النموذج بعد. ${canW()?'<button type="button" class="link" data-act="llSkel">ابدأ من الهيكل العام</button>':''}</div>`}<textarea class="field ll-body" id="lfB" rows="12" dir="rtl" ${canW()?'':'readonly'}>${e(x.body)}</textarea></label>`:''}
  <label class="wide">ملاحظات المراجعة<input class="field" id="lfN" value="${e(r.notes||'')}" placeholder="ما يحتاج تعديلاً أو تحققاً"></label>
  ${canW()?`<div class="wide toolbar"><button class="btn" name="go" value="save">حفظ</button>${x.status==='draft'?'<button class="btn pri" name="go" value="review">إرسال للمراجعة القانونية</button>':''}${x.status!=='draft'?'<button class="btn" name="go" value="draft">إعادة إلى مسودة</button>':''}</div>`:''}
 </form>
 ${canM()&&(x.status==='review'||x.status==='internal')&&(x.kind==='B'||x.custom)?approveForm(x,r):''}
 ${canM()&&x.kind==='A'?officialForm(x,r):''}
 ${x.status==='internal'?`<div class="ll-ok">معتمد داخلياً بتاريخ ${e(r.approvedAt||'')} من ${e(r.approvedBy||'')} (رقم المزاولة ${e(r.barNo||'')}) · الإصدار ${e(x.version)} · ${x.jur.map(j=>JUR[j]).join('، ')}</div>`:''}
 ${x.status==='official'&&r.official?`<div class="ll-ok">نسخة الجهة الأصلية: <a href="${e(r.official.file)}" target="_blank" rel="noopener">${e(r.official.fileName||'فتح')}</a> · المصدر <a href="${e(r.official.src)}" target="_blank" rel="noopener">${e(r.official.src)}</a> · حُصل عليها بتاريخ ${dmy(r.official.retrieved)}${r.official.note?' · '+e(r.official.note):''}</div>`:''}
 ${(x.body||x.status==='official')?`<section class="panel" style="margin-top:12px"><header><h2>استخدام النموذج</h2></header><div class="bd toolbar"><select class="field" id="llCase" style="max-width:380px">${cases.map(k=>`<option value="${k.id}">${k.no} · ${e(C(k.client)?C(k.client).name:'')}</option>`).join('')}</select>
  ${x.body?`<button class="btn pri" data-act="llUse" data-v="${e(id)}">معاينة وطباعة</button>${canW()?`<button class="btn" data-act="llSaveDoc" data-v="${e(id)}">حفظ في مستندات القضية</button>`:''}`:''}${x.status==='official'&&r.official?`<a class="btn" target="_blank" rel="noopener" href="${e(r.official.file)}">فتح النموذج الرسمي</a>`:''}
  ${x.status==='internal'||x.status==='official'?'':'<span class="m">سيُطبع بعلامة «مسودة» وتنبيه بأنه غير معتمد.</span>'}</div></section>`:''}
 ${hist.length?`<details class="ll-hist"><summary>سجل الحالة (${hist.length})</summary>${hist.map(h=>`<div><time>${e(h.at)}</time> ${e(h.by)}: ${e(ST[h.from]?ST[h.from][0]:h.from||'—')} ← ${e(ST[h.to]?ST[h.to][0]:h.to)}${h.note?' · '+e(h.note):''}</div>`).join('')}</details>`:''}
 </div></div>`}
function approveForm(x,r){return `<form class="form ll-box" id="fApprove" data-id="${e(x.id)}"><h3 class="wide">الاعتماد الداخلي <small class="m">· من صلاحية مدير المكتب</small></h3>
 <label>المحامي المعتمِد<input class="field" id="apBy" value="${e(r.approvedBy||me())}" required></label><label>رقم المزاولة<input class="field mono" id="apNo" value="${e(r.barNo||'')}" required></label>
 <div class="wide"><span class="m">مراجعة إلزامية، أكّد كل بند:</span><div class="ll-chk">${CHECK.map((c,j)=>`<label class="rl-ck"><input type="checkbox" name="apC" value="${j}" ${x.status==='internal'?'checked':''}> ${c}</label>`).join('')}</div></div>
 <div class="wide toolbar"><button class="btn pri">${x.status==='internal'?'تحديث الاعتماد':'اعتماد داخلياً'}</button><span class="m">يتطلب الاعتماد رقم الإصدار ونطاق الاختصاص من النموذج أعلاه.</span></div></form>`}
function officialForm(x,r){const o=r.official||{};return `<form class="form ll-box" id="fOfficial" data-id="${e(x.id)}"><h3 class="wide">التحقق من النسخة الرسمية <small class="m">· من صلاحية مدير المكتب</small></h3>
 <label class="wide"><span>نسخة الجهة الأصلية <small class="m">· PDF أو Word كما نُزّلت من موقع الجهة</small></span><div class="toolbar"><input type="file" id="ofF" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png">${o.file?`<a target="_blank" rel="noopener" href="${e(o.file)}">${e(o.fileName||'الملف الحالي')}</a>`:''}</div></label>
 <label class="wide">رابط المصدر<input class="field" id="ofS" value="${e(o.src||x.src||'')}" required dir="ltr"></label>
 <label>تاريخ الحصول عليها<input class="field" type="date" id="ofD" value="${e(o.retrieved||iso(TODAY))}" required></label>
 <label>إصدار النموذج لدى الجهة<input class="field" id="ofN" value="${e(o.note||'')}" placeholder="مثال: نسخة 2025، رقم النموذج لدى الوزارة"></label>
 <div class="wide toolbar"><button class="btn pri">${x.status==='official'?'تحديث التحقق':'اعتماد كنموذج رسمي محقق'}</button><span class="m">يتطلب رقم الإصدار ونطاق الاختصاص أعلاه.</span></div></form>`}
function openD(id){LS.open=id;document.getElementById('modal').innerHTML=detail(id)}

/* ── الحفظ ── */
/* يعدّل نسخة من السجل، ولا يكتبها إلا إن نجحت كل الشروط (فلا يبقى تعديل ناقص عند رفض الاعتماد) */
function upsert(id,fn,hist){const old=rec(id);let r;if(old)r=JSON.parse(JSON.stringify(old));else{const base=LIB.items.find(x=>x.id===id);r={id,kind:base?base.kind:'B'}}
 const before=r.status||'draft';fn(r);r.status=r.status||'draft';
 if(hist||before!==r.status){(r.history=r.history||[]).push({at:stamp(),by:me(),from:before,to:r.status,...(hist?{note:hist}:{})});if(r.history.length>60)r.history.splice(0,r.history.length-60)}
 if(old)lawforms[lawforms.indexOf(old)]=r;else lawforms.push(r);return r}
function readMain(f,r){const base=LIB.items.find(x=>x.id===r.id);
 const body=f.lfB?f.lfB.value:undefined,ver=f.lfV.value.trim(),jur=[...f.querySelectorAll('input[name=lfJ]:checked')].map(x=>x.value);
 const changed=(body!==undefined&&body!==(r.body!=null?r.body:(base&&base.body)||''))||ver!==(r.version||(base&&base.body?'0.1':''))||JSON.stringify(jur)!==JSON.stringify(r.jur||[]);
 if(body!==undefined&&(r.body!=null||body!==((base&&base.body)||'')))r.body=body;r.version=ver;r.jur=jur;r.notes=f.lfN.value.trim();
 if(f.lfT){r.title=f.lfT.value.trim();r.cat=f.lfC.value.trim()||'نماذج المكتب'}
 return changed}
async function upload(file){const r=await fetch('/api/admin/ruling-file?name='+encodeURIComponent(file.name),{method:'POST',headers:{'content-type':file.type||'application/octet-stream'},body:file});
 if(r.status===401){location.replace('/login.html');throw new Error('انتهت الجلسة')}const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'تعذّر رفع الملف');return j}
document.addEventListener('submit',async ev=>{const f=ev.target;if(!['fLaw','fApprove','fOfficial'].includes(f.id))return;ev.preventDefault();ev.stopImmediatePropagation();if(ro())return;
 const id=f.dataset.id,main=document.getElementById('fLaw');
 try{
  if(f.id==='fLaw'){const go=ev.submitter&&ev.submitter.value||'save';let msg='حُفظ';
   upsert(id,r=>{const ch=readMain(main,r);
    if(go==='review'){if(!(r.body!=null?r.body:(item(id).body||'')).trim()&&r.kind!=='A')throw new Error('اكتب نص النموذج قبل إرساله للمراجعة');r.status='review';msg='أُرسل النموذج للمراجعة القانونية'}
    else if(go==='draft'){r.status='draft';msg='أُعيد إلى مسودة'}
    else if(ch&&(r.status==='internal'||r.status==='official')){r.status='review';msg='تغيّر نص نموذج معتمد، فأُعيد إلى المراجعة القانونية'}});
   toast(msg)}
  if(f.id==='fApprove'){if(!canM())throw new Error('الاعتماد من صلاحية مدير المكتب');
   const by=f.apBy.value.trim(),no=f.apNo.value.trim(),ok=f.querySelectorAll('input[name=apC]:checked').length===CHECK.length;
   if(!ok)throw new Error('أكّد كل بنود المراجعة الإلزامية قبل الاعتماد');
   upsert(id,r=>{readMain(main,r);if(!r.version||!(r.jur||[]).length)throw new Error('حدّد رقم الإصدار ونطاق الاختصاص قبل الاعتماد');if(!(r.body!=null?r.body:item(id).body||'').trim())throw new Error('لا يُعتمد نموذج بلا نص');
    Object.assign(r,{status:'internal',approvedBy:by,barNo:no,approvedAt:iso(TODAY)})},'اعتماد داخلي · إصدار '+main.lfV.value.trim());toast('اعتُمد النموذج داخلياً')}
  if(f.id==='fOfficial'){if(!canM())throw new Error('التحقق من صلاحية مدير المكتب');const fl=f.ofF.files[0],r0=rec(id)||{};
   if(!fl&&!(r0.official&&r0.official.file))throw new Error('ارفع نسخة الجهة الأصلية أولاً');
   let up=null;if(fl){if(offline())throw new Error('رفع الملف يحتاج اتصالاً بالخادم');up=await upload(fl)}
   upsert(id,r=>{readMain(main,r);if(!r.version||!(r.jur||[]).length)throw new Error('حدّد رقم الإصدار ونطاق الاختصاص قبل الاعتماد');
    r.official={...(r.official||{}),...(up?{file:up.file,fileName:up.name}:{}),src:f.ofS.value.trim(),retrieved:f.ofD.value,note:f.ofN.value.trim()};if(!r.official.src||!r.official.retrieved)throw new Error('أدخل رابط المصدر وتاريخ الحصول');
    Object.assign(r,{status:'official',approvedBy:me(),approvedAt:iso(TODAY)})},'تحقق رسمي · '+f.ofS.value.trim());toast('سُجّل كنموذج رسمي محقق')}
  if(window.MQ&&MQ.saveState)MQ.saveState();render();openD(id);
 }catch(x){toast(x.message)}
},true);

/* ── الاستخدام في قضية ── */
function fill(text,k){if(!k)return text;const cl=C(k.client)||{},o=(k.opps||[]).map(O).filter(Boolean),ct=CT(k.court)||{};
 const map={'التاريخ':dmy(iso(TODAY)),'رقم الملف':k.no,'الجهة المختصة':ct.name,'المنطقة/المحكمة':ct.name,'الاسم، الهوية/التسجيل، العنوان، الصفة':[cl.name,cl.idNo,cl.city,k.role].filter(x=>x&&x!=='—').join('، '),
  'الاسم، الصفة، عنوان التبليغ':o.map(x=>x.name).join(' و'),'اسم المحامي/رقم مزاولته':OFFICE.lawyer};
 return text.replace(/\{([^{}]+)\}/g,(m,key)=>map[key]!=null&&map[key]!==''?map[key]:m)}
function docOf(id,kid){const x=item(id),k=K(kid),approved=x.status==='internal'||x.status==='official',B=MQP.B;
 const lines=fill(x.body,k).split('\n').filter(l=>l.trim());
 return {label:x.title,build(){return {title:x.title,ref:x.id+(x.version?' · إ '+x.version:''),file:x.title+(k?' - '+k.no:''),
  blocks:[...(approved?[]:[B.box('<b>مسودة غير معتمدة</b> · '+(x.kind==='A'?'مرجع لنموذج رسمي؛ استخدم نسخة الجهة الأصلية':'لا تُستخدم للإيداع أو التوقيع قبل مراجعة محامٍ فلسطيني مختص'),'warn')]),
   ...lines.map(l=>/^\d+\.\s/.test(l)?B.p(MQP.esc(l)):/^(المرفقات|مراجعة إلزامية)/.test(l)?B.p(MQP.esc(l),'s'):B.p(MQP.esc(l)).replace(/\{([^{}]+)\}/g,'<span class="fill">{$1}</span>'))],
  sign:['المحامي'],mark:approved?'':'مسودة'}}}}
A.llUse=v=>{const kid=(document.getElementById('llCase')||{}).value;if(window.MQP)MQP.open(docOf(v,kid))};
A.llSaveDoc=v=>{if(ro())return;const kid=(document.getElementById('llCase')||{}).value,k=K(kid),x=item(v);if(!k)return toast('اختر قضية');
 const approved=x.status==='internal'||x.status==='official';
 docs.push({id:'d'+Date.now(),k:k.id,title:x.title+(approved?'':' (مسودة)'),kind:x.cat,date:iso(TODAY),src:'المكتبة القانونية',pages:1,shared:false,tpl:x.id,tplVer:x.version||'',tplStatus:x.status,text:fill(x.body,k)});
 toast('حُفظ في مستندات القضية '+k.no+(approved?'':' بوصفه مسودة'));render();openD(v)};

/* ── الأفعال ── */
A.llOpen=v=>openD(v);
A.llKind=v=>{LS.kind=LS.kind===v?'':v;render()};
A.llSt=v=>{LS.st=LS.st===v?'':v;render()};
A.llSkel=()=>{const t=document.getElementById('lfB');if(t&&!t.value.trim()){const x=item(LS.open);t.value=SKELETON.replace('{العنوان}',x?x.title:'')}};
A.llNew=()=>{if(ro())return;const n=lawforms.filter(r=>r.custom).length+1;const id='MQ-OF-'+String(n).padStart(3,'0')+'-'+Date.now().toString(36).slice(-4).toUpperCase();
 upsert(id,r=>{Object.assign(r,{custom:true,kind:'B',title:'نموذج جديد',cat:'نماذج المكتب',body:'',status:'draft'})});if(window.MQ&&MQ.saveState)MQ.saveState();render();openD(id)};
const bind0=window.bindLocal;window.bindLocal=function(){bind0();
 const q=document.getElementById('llq');if(q){let t;q.oninput=()=>{LS.q=q.value;clearTimeout(t);t=setTimeout(redraw,120)}}
 [['llCat','cat'],['llKindS','kind'],['llStS','st'],['llJur','jur']].forEach(([id,k])=>{const el=document.getElementById(id);if(el)el.onchange=()=>{LS[k]=el.value;render()}})};

const css=document.createElement('style');css.textContent=`
.ll-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) repeat(4,minmax(0,.8fr));gap:10px;margin:4px 0 12px}
@media(max-width:1100px){.ll-stats{grid-template-columns:repeat(3,1fr)}}
.ll-st{all:unset;cursor:pointer;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:4px}
.ll-st b{font-size:26px;font-weight:800;color:var(--ink);font-family:var(--f-mono,inherit)}.ll-st.sm b{font-size:20px}
.ll-st span{font-size:12.5px;color:var(--muted);line-height:1.5}.ll-st i{font-style:normal}.ll-st .pill{white-space:normal;text-align:center}
.ll-st.on,.ll-st:hover{border-color:var(--brass)}
.ll-warn{border:1px solid #F59E0B;background:#FFFBEB;color:#78350F;border-radius:10px;padding:10px 14px;line-height:1.8;font-size:13.5px;margin-bottom:12px}
.ll-warn b{margin-inline-end:6px}.ll-ok{border:1px solid #22C55E;background:#F0FDF4;color:#14532D;border-radius:10px;padding:10px 14px;line-height:1.8;font-size:13.5px;margin-top:10px}
.ll-filters{display:grid;grid-template-columns:minmax(0,1fr) 210px 140px 170px 150px;gap:10px}
@media(max-width:900px){.ll-filters{grid-template-columns:1fr 1fr}.ll-filters #llq{grid-column:1/-1}}
.ll-t td{padding:9px 12px;border-bottom:1px solid var(--line);vertical-align:middle}.ll-t tr:last-child td{border-bottom:0}
.ll-t tr.clk{cursor:pointer}.ll-t tr.clk:hover td{background:var(--sunk)}.ll-id{white-space:nowrap;font-size:12.5px;color:var(--muted);width:96px}
.ll-src{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px;padding:12px 16px}
.ll-src a{display:flex;flex-direction:column;gap:2px;border:1px solid var(--line);border-radius:8px;padding:10px 12px;text-decoration:none;color:var(--ink)}
.ll-src a:hover{border-color:var(--brass)}.ll-src small{color:var(--muted)}
.ll-modal{max-width:960px}
.ll-steps{display:flex;gap:6px;margin:6px 0 12px;flex-wrap:wrap}
.ll-steps>div{flex:1 1 160px;border:1px solid var(--line);border-radius:8px;padding:8px 10px;display:flex;flex-direction:column;gap:2px;opacity:.7}
.ll-steps>div small{font-size:11.5px;color:var(--muted);line-height:1.5}
.ll-steps>div.done{opacity:1;border-color:#22C55E}.ll-steps>div.on{opacity:1;border-color:var(--brass);background:var(--brass-soft);box-shadow:inset 0 -3px 0 var(--brass)}
.ll-jur,.ll-chk{display:flex;gap:14px;flex-wrap:wrap;padding:6px 0}
.ll-body{font-family:var(--f-doc,inherit);font-size:15.5px;line-height:1.9}
.ll-box{border:1px dashed var(--brass);border-radius:10px;padding:12px 14px;margin-top:12px}.ll-box h3{margin:0;font-size:16px}
.wide-2{grid-column:span 2}
.ll-hist{margin-top:12px;font-size:13px}.ll-hist summary{cursor:pointer;color:var(--muted)}.ll-hist div{padding:3px 0;border-bottom:1px dashed var(--line)}.ll-hist time{color:var(--muted);font-family:var(--f-mono,inherit);font-size:12px}`;
document.head.appendChild(css);
})();
