/* ── البحث في الاجتهادات القضائية الفلسطينية ──
   مكتبة المكتب من المبادئ القضائية: كل حكم بمحكمته ورقمه وتاريخه ومبدئه وملخّصه ونصه (ملف PDF/Word) وكلماته المفتاحية،
   ويُربط بقضايا المكتب ليظهر في ملف القضية. البحث عربي متسامح (الهمزات، التاء المربوطة، التشكيل، «ال» التعريف)
   ويُرتّب بالأقرب للعبارة. ومع روابط للمصادر العامة (مقام، المقتفي، قسطاس) تُفتح في نافذتها دون نسخ محتواها. */
(function(){
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const can2=w=>!!(window.MQ&&MQ.user&&({admin:{write:1,manage:1},lawyer:{write:1}}[MQ.user.role]||{})[w]);
const ro=()=>{if(window.MQ&&MQ.readOnly){toast('صلاحيتك للاطلاع فقط');return true}return false};
const RS={q:'',court:'',field:'',sort:'rel',open:null,mode:'all',in:'all',year:'',from:'',to:'',withText:false,pending:false,adv:false,page:1,sel:new Set()};
const PER=20;
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

/* ── البحث والترتيب: عربي متسامح، بأوضاع «كل الكلمات / أي كلمة / العبارة كما هي» وحقل البحث والتواريخ ── */
function textOf(r){return [r.principle,r.summary,r.title,r.no,r.court,r.courtName,r.field,(r.keywords||[]).join(' '),r.notes,r.text].join(' ')}
function scopeOf(r){return RS.in==='principle'?[r.principle,r.summary,r.title].join(' '):RS.in==='text'?(r.text||''):RS.in==='no'?[r.no,r.courtName].join(' '):textOf(r)}
const noArt=s=>s.replace(/(^| )ال(?=\S{3,})/g,'$1');
function score(r,qn,qt,mode,inF){
 if(!qn)return 1;
 const full=norm(inF?scopeOf(r):textOf(r)),pt=norm([r.principle,r.title].join(' ')),kw=norm((r.keywords||[]).join(' '));
 if(mode==='exact')return noArt(full).includes(noArt(qn))?(pt.includes(qn)?80:40):-1e9;
 let s=0;
 if(pt.includes(qn))s+=60;else if(kw.includes(qn))s+=40;else if(full.includes(qn))s+=25;
 const words=full.split(' ').map(stem);const set=new Set(words);
 let hit=0;qt.forEach(t=>{if(set.has(t)||full.includes(t)){hit++;s+=8;if(pt.split(' ').map(stem).includes(t))s+=6}});
 if(mode==='any')return hit||s>0?s:-1e9;
 if(mode==='all')return qt.length&&hit<qt.length&&!full.includes(qn)?-1e9:s;
 if(qt.length&&hit<qt.length)s-=(qt.length-hit)*12;
 if(norm(r.no).includes(qn))s+=70;
 return hit||s>0?s:-1e9;
}
const yearOf=r=>(r.date||'').slice(0,4)||((String(r.no||'').match(/\/(\d{4})/)||[])[1]||'');
function list(){
 const qn=norm(RS.q),qt=toks(RS.q);
 let rs=rulings.filter(r=>(!RS.court||r.court===RS.court)&&(!RS.field||r.field===RS.field)
  &&(!RS.year||yearOf(r)===RS.year)&&(!RS.from||(r.date&&r.date>=RS.from))&&(!RS.to||(r.date&&r.date<=RS.to))
  &&(!RS.withText||(r.text||'').length>=100)&&(!RS.pending||!String(r.principle||'').trim()))
  .map(r=>({r,s:score(r,qn,qt,RS.mode,RS.in!=='all')})).filter(x=>!qn||x.s>-1e8);
 const D=x=>x.r.date||'';
 if(RS.sort==='rel'&&qn)rs.sort((a,b)=>b.s-a.s||D(b).localeCompare(D(a)));
 else if(RS.sort==='oldest')rs.sort((a,b)=>(D(a)||'9999').localeCompare(D(b)||'9999'));
 else if(RS.sort==='added')rs.sort((a,b)=>String(b.r.added||'').localeCompare(String(a.r.added||''))||String(b.r.id).localeCompare(String(a.r.id)));
 else rs.sort((a,b)=>D(b).localeCompare(D(a)));
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
  <div class="toolbar">${can2('write')?'<button class="btn" data-act="rImport">استيراد حكم برابطه</button><button class="btn pri" data-act="rNew">إضافة حكم</button>':''}</div></div>
 <section class="panel"><div class="bd rl-search">
  <input class="field" id="rq" value="${e(RS.q)}" placeholder="مثال: بطلان التبليغ، الدفع بالتقادم، إخلاء المأجور لعدم دفع الأجرة…" autocomplete="off">
  <select class="field" id="rCourt"><option value="">كل المحاكم</option>${COURTS.map(c=>`<option ${RS.court===c?'selected':''}>${c}</option>`).join('')}</select>
  <select class="field" id="rField"><option value="">كل الفروع</option>${FIELDS.map(c=>`<option ${RS.field===c?'selected':''}>${c}</option>`).join('')}</select>
  <select class="field" id="rSort"><option value="rel" ${RS.sort==='rel'?'selected':''}>الأقرب للبحث</option><option value="date" ${RS.sort==='date'?'selected':''}>الأحدث</option><option value="oldest" ${RS.sort==='oldest'?'selected':''}>الأقدم</option><option value="added" ${RS.sort==='added'?'selected':''}>آخر ما أُضيف</option></select>
 </div>
 <div class="rl-advt" id="rlAdvT">${advT()}</div>
 ${RS.adv?`<div class="bd rl-adv">
  <label>طريقة المطابقة<select class="field" id="rMode"><option value="all" ${RS.mode==='all'?'selected':''}>كل الكلمات</option><option value="any" ${RS.mode==='any'?'selected':''}>أي كلمة</option><option value="exact" ${RS.mode==='exact'?'selected':''}>العبارة كما هي</option></select></label>
  <label>البحث في<select class="field" id="rIn"><option value="all" ${RS.in==='all'?'selected':''}>كل الحقول</option><option value="principle" ${RS.in==='principle'?'selected':''}>المبدأ والملخص</option><option value="text" ${RS.in==='text'?'selected':''}>نص الحكم</option><option value="no" ${RS.in==='no'?'selected':''}>رقم الحكم</option></select></label>
  <label>سنة الحكم<input class="field mono" id="rYear" value="${e(RS.year)}" inputmode="numeric" maxlength="4" placeholder="2023"></label>
  <label>من تاريخ<input class="field" type="date" id="rFrom" value="${e(RS.from)}"></label>
  <label>إلى تاريخ<input class="field" type="date" id="rTo" value="${e(RS.to)}"></label>
  <div class="rl-chk"><label><input type="checkbox" id="rWT" ${RS.withText?'checked':''}> بنص كامل فقط</label><label><input type="checkbox" id="rPend" ${RS.pending?'checked':''}> بانتظار صياغة المبدأ</label></div>
 </div>`:''}
 <div class="rl-src"><span class="m">ابحث في المصادر العامة:</span><button class="chip" data-act="nav" data-v="maqamsearch">بحث مباشر في الأحكام ←</button>${SOURCES.map(s=>`<a class="chip" target="_blank" rel="noopener" href="${s[2]}" data-act="rSrc" data-v="${s[0]}">${s[1]} ↗</a>`).join('')}<span class="m">يُفتح الموقع في نافذة جديدة وتُنسخ عبارة البحث لتلصقها هناك. لا يُنسخ أي محتوى من هذه المواقع إلى النظام.</span></div></section>
 <div id="rlRes">${results(rs)}</div>`;
};
const advT=()=>`<button class="link" data-act="rAdv">${RS.adv?'▾ إخفاء البحث المتقدم':'▸ بحث متقدم'}</button>${advCount()?`<span class="pill">${advCount()} ${advCount()===1?'شرط':'شروط'}</span><button class="link" data-act="rAdvClear">مسح الشروط</button>`:''}`;
function advCount(){return [RS.mode!=='all',RS.in!=='all',RS.year,RS.from,RS.to,RS.withText,RS.pending].filter(Boolean).length}
function results(rs){
 const q=RS.q.trim();
 if(!rulings.length)return `<section class="panel rl-empty"><div class="bd"><b>المكتبة فارغة بعد.</b><p>أضف المبادئ القضائية التي يعتمد عليها المكتب: المبدأ بصياغتك، ورقم الحكم ومحكمته وتاريخه، ونص الحكم إن توفر. كل ما تضيفه يصبح قابلاً للبحث فوراً ويُربط بقضاياك.</p>${can2('write')?'<button class="btn pri" data-act="rNew">إضافة أول حكم</button>':''}</div></section>`;
 if(!rs.length)return `<section class="panel"><div class="empty">لا نتائج في مكتبة المكتب${q?' لـ «'+e(q)+'»':''}. جرّب كلمات أقل، أو غيّر طريقة المطابقة، أو امسح شروط البحث المتقدم.</div></section>`;
 const pages=Math.max(1,Math.ceil(rs.length/PER));if(RS.page>pages)RS.page=pages;
 const slice=rs.slice((RS.page-1)*PER,RS.page*PER),allOn=slice.every(r=>RS.sel.has(r.id)),n=RS.sel.size;
 return `<div class="rl-bar"><label class="rl-all"><input type="checkbox" data-act="rSelPage" ${allOn?'checked':''}> تحديد الصفحة</label>
  <span class="m">${rs.length} ${rs.length===1?'حكم':rs.length===2?'حكمان':rs.length<=10?'أحكام':'حكماً'}${q?' لـ «'+e(q)+'»':''}${n?` · <b>${n} محدد</b> <button class="link" data-act="rSelNone">إلغاء التحديد</button>`:''}</span>
  <span class="rl-sp"></span>
  <button class="btn sm" data-act="rPrint">${I_PRINT} طباعة ${n?'المحدد ('+n+')':'النتائج'}</button>
  <div class="rl-dd"><button class="btn sm" data-act="rExpMenu">${I_EXP} استخراج النتائج ▾</button><div class="rl-ddm" id="rExpM" hidden>
   <button data-act="rExport" data-v="doc">مستند Word<small>للتحرير والإرفاق بالملف</small></button>
   <button data-act="rExport" data-v="csv">جدول Excel (CSV)<small>للفرز والإحصاء</small></button>
   <button data-act="rExport" data-v="html">صفحة HTML<small>تُفتح بأي متصفح بلا إنترنت</small></button>
   <button data-act="rExport" data-v="json">بيانات JSON<small>للنقل إلى نظام آخر</small></button></div></div></div>
 <div class="stack">${slice.map(r=>card(r,q)).join('')}</div>
 ${pages>1?`<div class="rl-pg"><button class="btn sm" data-act="rPg" data-v="${RS.page-1}" ${RS.page<=1?'disabled':''}>→ السابقة</button><span class="m">صفحة ${RS.page} من ${pages}</span><button class="btn sm" data-act="rPg" data-v="${RS.page+1}" ${RS.page>=pages?'disabled':''}>التالية ←</button></div>`:''}`;
}
const I_PRINT='<svg viewBox="0 0 24 24" class="rl-i"><path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><path d="M7 14h10v7H7z"/></svg>';
const I_EXP='<svg viewBox="0 0 24 24" class="rl-i"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>';
function card(r,q){
 const ks=casesOf(r);
 const pend=!String(r.principle||'').trim();
 return `<section class="panel rl-card ${RS.sel.has(r.id)?'sel':''}" id="rl_${r.id}"><header><div class="rl-h"><input type="checkbox" class="rl-ck1" data-act="rSel" data-v="${r.id}" ${RS.sel.has(r.id)?'checked':''} aria-label="تحديد الحكم"><span class="pill mz">${e(r.court)}</span><span class="mono">${e(r.no||'')}</span><span class="m">${dmy2(r.date)}</span>${r.field?`<span class="pill">${e(r.field)}</span>`:''}${r.outcome?`<span class="pill ${/نقض|قبول|فسخ/.test(r.outcome)?'acc':/رد|رفض/.test(r.outcome)?'warn':''}">${e(r.outcome)}</span>`:''}</div>
  <div class="toolbar">${r.file?`<a class="btn sm" target="_blank" rel="noopener" href="${e(r.file)}">نص الحكم</a>`:''}<button class="btn sm" data-act="rCite" data-v="${r.id}">نسخ الاستشهاد</button>${can2('write')?`<button class="btn sm" data-act="rEdit" data-v="${r.id}">تعديل</button>`:''}</div></header>
  <div class="bd">${pend?`<div class="rl-pend"><span class="pill warn">بانتظار صياغة المبدأ</span>${can2('write')?`<button class="link" data-act="rEdit" data-v="${r.id}">اكتب المبدأ</button>`:''}</div><div class="rl-ti">${hl(r.title||r.no||'',q)}</div>`:`<div class="rl-p">${hl(r.principle,q)}</div>`}
  ${r.summary?`<div class="rl-s">${hl(r.summary,q)}</div>`:''}
  ${RS.open===r.id&&r.text?`<div class="rl-t">${hl(r.text,q)}</div>`:r.text?`<button class="link" data-act="rMore" data-v="${r.id}">عرض نص الحكم (${r.text.length.toLocaleString('en-US')} حرف)</button>`:''}
  <div class="rl-f"><div class="chips">${(r.keywords||[]).map(k=>`<button class="chip" data-act="rKw" data-v="${e(k)}">${e(k)}</button>`).join('')}</div>
  <div class="m">${ks.length?'مرتبط بـ: '+ks.map(k=>`<button class="link mono" data-act="openCase" data-v="${k.id}">${k.no}</button>`).join('، '):'غير مرتبط بقضية'}${r.src?' · المصدر: '+(r.srcUrl?`<a href="${e(r.srcUrl)}" target="_blank" rel="noopener">${e(r.src)} ↗</a>`:e(r.src)):''}${r.by?' · أضافه '+e(r.by):''}</div></div>
  ${r.notes?`<div class="note">${e(r.notes)}</div>`:''}</div></section>`;
}
function redraw(){const el=document.getElementById('rlRes');if(el)el.innerHTML=results(list());const t=document.getElementById('rlAdvT');if(t)t.innerHTML=advT()}
const refind=()=>{RS.page=1;redraw()};

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
 ${r.srcUrl&&!r.id?`<div class="rl-imp">استُخرجت البيانات من <a href="${e(r.srcUrl)}" target="_blank" rel="noopener">${e(r.src||'المصدر')} ↗</a>. راجعها${r.principle?'، و<b>المبدأ</b> كما نشره المصدر فعدّله إن شئت':'، واكتب <b>المبدأ القضائي</b> بصياغتك'} قبل الحفظ.${r.fullText?` · <a href="${e(r.fullText)}" target="_blank" rel="noopener">النص الكامل (ملف) ↗</a>`:''}</div>`:''}
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
  const x=j.ruling;openForm({court:x.court,no:x.no,date:x.date,field:x.field,keywords:x.keywords,text:x.text,src:x.src,srcUrl:x.srcUrl,fullText:x.fullText,principle:x.principle||'',summary:x.summary||'',outcome:x.outcome||'',
   notes:[x.courtName&&x.court==='أخرى'?'المحكمة: '+x.courtName:'',(x.classifications||[]).length?'التصنيف: '+x.classifications.join('؛ '):'',(x.cited||[]).length?'النصوص المذكورة: '+x.cited.join('؛ '):''].filter(Boolean).join(' · ').slice(0,1500)});
  toast(x.principle?'استُخرجت بيانات الحكم ومبادئه، راجعها قبل الحفظ':'استُخرجت بيانات الحكم، راجعها واكتب المبدأ');
 }catch(x){toast(x.message);if(btn){btn.disabled=false;btn.textContent=label||'استخراج بيانات الحكم'}}
}
document.addEventListener('submit',ev=>{const f=ev.target;if(f.id!=='fRImport')return;ev.preventDefault();ev.stopImmediatePropagation();
 importFrom(f.riUrl.value.trim(),document.getElementById('riGo'))},true);
A.rImportUrl=v=>{if(ro())return;importFrom(String(v||''),null)};
/* فتح نموذج الإضافة بسجل جاهز (من شاشة «مصادر الأحكام») مع ملف مرفق اختياري */
A.rPrefill=(r,file)=>{if(ro())return;const dup=r&&r.srcUrl&&rulings.find(x=>x.srcUrl===r.srcUrl);if(dup){toast('هذا الحكم موجود في المكتبة');A.rOpen(dup.id);return}
 openForm(r);if(file){pendingFile=file;const n=document.getElementById('rfFileN');if(n)n.textContent=file.name+' · '+(file.size/1048576).toFixed(1)+' م.ب'}};
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
 const q=document.getElementById('rq');if(q){let t;q.oninput=()=>{RS.q=q.value;clearTimeout(t);t=setTimeout(refind,120)}}
 [['rCourt','court'],['rField','field'],['rSort','sort'],['rMode','mode'],['rIn','in'],['rFrom','from'],['rTo','to']].forEach(([id,k])=>{const el=document.getElementById(id);if(el)el.onchange=()=>{RS[k]=el.value;refind()}});
 const y=document.getElementById('rYear');if(y)y.oninput=()=>{const v=y.value.replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\D/g,'');if(v.length===4||!v){RS.year=v;refind()}};
 [['rWT','withText'],['rPend','pending']].forEach(([id,k])=>{const el=document.getElementById(id);if(el)el.onchange=()=>{RS[k]=el.checked;refind()}})};

/* البحث الشامل يشمل الاجتهادات */
const gq=document.getElementById('gq'),gr=document.getElementById('gres');
if(gq){const g0=gq.oninput;gq.oninput=()=>{g0();const q=gq.value.trim();if(q.length<2||!rulings.length)return;const qn=norm(q),qt=toks(q);
 const hits=rulings.map(r=>({r,s:score(r,qn,qt)})).filter(x=>x.s>-1e8).sort((a,b)=>b.s-a.s).slice(0,3);
 if(!hits.length)return;if(gr.querySelector('.empty'))gr.innerHTML='';
 gr.insertAdjacentHTML('beforeend',hits.map(({r})=>`<button data-act="rOpen" data-v="${r.id}"><span>${e(r.principle).slice(0,90)}</span><small>اجتهاد · ${e(r.court)} ${e(r.no||'')}</small></button>`).join(''));gr.hidden=false}}
A.rOpen=v=>{RS.q='';S.view='rulings';render();const el=document.getElementById('rl_'+v);if(el){el.scrollIntoView({block:'center'});el.classList.add('flash')}};

/* ── البحث المتقدم والتحديد والترقيم ── */
A.rAdv=()=>{RS.adv=!RS.adv;render()};
A.rAdvClear=()=>{Object.assign(RS,{mode:'all',in:'all',year:'',from:'',to:'',withText:false,pending:false,page:1});render()};
A.rPg=v=>{RS.page=Math.max(1,+v||1);redraw();const el=document.getElementById('rlRes');if(el)el.scrollIntoView({block:'start',behavior:'smooth'})};
A.rSel=v=>{RS.sel.has(v)?RS.sel.delete(v):RS.sel.add(v);redraw()};
A.rSelPage=()=>{const rs=list().slice((RS.page-1)*PER,RS.page*PER),all=rs.every(r=>RS.sel.has(r.id));rs.forEach(r=>all?RS.sel.delete(r.id):RS.sel.add(r.id));redraw()};
A.rSelNone=()=>{RS.sel.clear();redraw()};
/* المحدد إن وُجد، وإلا نتائج البحث الحالية بترتيبها */
function chosen(){const rs=list();if(RS.sel.size){const ids=RS.sel;const a=rs.filter(r=>ids.has(r.id));rulings.forEach(r=>{if(ids.has(r.id)&&!a.includes(r))a.push(r)});return a}return rs}

/* ── الطباعة: ثلاثة قوالب في محرك الطباعة الموحد (ترويسة المكتب، ترقيم، بصمة المستند) ── */
const TPLS={brief:['مذكرة استشهاد بأحكام قضائية','المبادئ ومراجعها، جاهزة للإرفاق بملف الدعوى'],full:['ملف الأحكام القضائية','كل حكم في صفحة مستقلة بنصه الكامل'],list:['كشف مراجع الأحكام القضائية','جدول مختصر بالأحكام وبياناتها']};
const cite=r=>[r.court,r.no,r.date?'بتاريخ '+dmy(r.date):''].filter(Boolean).join(' · ');
const paras=t=>String(t||'').split(/\n{2,}|\n(?=\S)/).map(x=>x.trim()).filter(Boolean).flatMap(x=>{const o=[];for(let i=0;i<x.length;i+=900){let j=Math.min(x.length,i+900);if(j<x.length){const k=x.lastIndexOf(' ',j);if(k>i+500)j=k}o.push(x.slice(i,j));i=j-900}return o});
function rulingsDoc(items){
 const M=window.MQP,B=M.B,E=M.esc,today=iso(TODAY);
 return {label:'الاجتهادات القضائية ('+items.length+')',
  build(){const st=this.state||{},t=TPLS[st.tpl]?st.tpl:'brief',k=st.k?K(st.k):null,src=st.src!==false,ex=st.ex!==false;
   const head=[k?['القضية','<span class="mono">'+E(k.no)+'</span> · '+E(k.subject||'')]:null,k?['الموكل',E((C(k.client)||{}).name||'')]:null,st.to?['إلى',E(st.to)]:null,['عدد الأحكام',items.length]].filter(Boolean);
   const blocks=[B.kv(head,head.length>1?2:1)];
   if(String(st.note||'').trim())blocks.push(B.box(E(st.note).replace(/\n/g,'<br>')));
   const srcLine=r=>src&&(r.srcUrl||r.src)?B.p('<small>المصدر: '+E(r.src||'')+(r.srcUrl?' — <span dir="ltr">'+E(r.srcUrl)+'</span>':'')+'</small>','s'):'';
   if(t==='list'){
    blocks.push(B.t(['#','المحكمة','رقم الحكم','التاريخ','الفرع','المبدأ القضائي'],items.map((r,i)=>[i+1,E(r.court),E(r.no||''),r.date?dmy(r.date):'—',E(r.field||'—'),E(String(r.principle||r.title||'').slice(0,220))]),{w:['4%','16%','16%','10%','10%','44%']}));
    if(src)blocks.push(B.p('<small>'+items.map((r,i)=>r.srcUrl?(i+1)+'. <span dir="ltr">'+E(r.srcUrl)+'</span>':'').filter(Boolean).join('<br>')+'</small>','s'));
   }else items.forEach((r,i)=>{
    if(t==='full'&&i)blocks.push(B.br());
    blocks.push(B.h((i+1)+'. '+cite(r)));
    if(String(r.principle||'').trim())blocks.push(B.box('<b>المبدأ القضائي:</b> '+E(r.principle)));
    else if(r.title)blocks.push(B.p(E(r.title)));
    if(t==='brief'){const x=r.summary||r.text||'';if(ex&&x)blocks.push(B.p('«'+E(String(x).replace(/\s+/g,' ').slice(0,520))+(String(x).length>520?'…':'')+'»','q'))}
    else{if(r.summary)blocks.push(B.p('<b>الملخص:</b> '+E(r.summary)));
     const ps=paras(r.text);if(ps.length){blocks.push(B.p('<b>نص الحكم</b>'));ps.forEach(x=>blocks.push(B.p(E(x))))}else blocks.push(B.p('<small>النص الكامل غير محفوظ في المكتبة؛ راجع المصدر الأصلي.</small>','s'))}
    const s2=srcLine(r);if(s2)blocks.push(s2);
   });
   blocks.push(B.p('<small>يرجى مطابقة النصوص مع الأحكام الأصلية قبل الاستشهاد بها.</small>','s'));
   return {title:TPLS[t][0],sub:k?'في القضية رقم '+k.no:TPLS[t][1],ref:'اج/'+today,file:TPLS[t][0]+' - '+today,orient:'port',blocks,sign:t==='brief'?['المحامي']:[]}},
  opts:()=>`<label>القالب<select data-po="tpl">${Object.entries(TPLS).map(([k,v])=>`<option value="${k}">${v[0]}</option>`).join('')}</select></label>
   <label>ربط بقضية (اختياري)<select data-po="k"><option value="">—</option>${cases.map(k=>`<option value="${k.id}">${k.no} · ${e(k.subject||'')}</option>`).join('')}</select></label>
   <label>الجهة المخاطبة (اختياري)<input class="rl-pi" data-po="to" maxlength="120" placeholder="محكمة الاستئناف الموقرة"></label>
   <label>وجه الاستشهاد (اختياري)<textarea class="rl-pi" data-po="note" rows="3" maxlength="1800" placeholder="صلة هذه المبادئ بوقائع الدعوى…"></textarea></label>
   <label class="pvck"><input type="checkbox" data-po="src" checked><span>إظهار مصدر كل حكم</span></label>
   <label class="pvck"><input type="checkbox" data-po="ex" checked><span>مقتطف من نص الحكم <small>في المذكرة</small></span></label>`};
}
A.rPrint=()=>{const it=chosen();if(!it.length){toast('لا أحكام للطباعة');return}
 if(it.length>60){toast('اختر 60 حكماً على الأكثر للطباعة (المحدد/النتائج: '+it.length+')');return}
 if(window.MQP)MQP.open(rulingsDoc(it))};

/* ── استخراج النتائج: Word وExcel وHTML وJSON، من بيانات المكتبة نفسها (يعمل بلا إنترنت) ── */
A.rExpMenu=()=>{const m=document.getElementById('rExpM');if(m)m.hidden=!m.hidden};
document.addEventListener('click',ev=>{if(!ev.target.closest('.rl-dd')){const m=document.getElementById('rExpM');if(m)m.hidden=true}});
function save(name,mime,body){const b=new Blob([body],{type:mime}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}
const linked=r=>(r.cases||[]).map(id=>K(id)).filter(Boolean).map(k=>k.no).join('، ');
function htmlDoc(items,word){
 const o=(window.MQ&&MQ.settings)||{},today=iso(TODAY);
 const rows=items.map((r,i)=>`<article><h2>${i+1}. ${e(cite(r))}</h2>
  ${String(r.principle||'').trim()?`<p class="pr"><b>المبدأ القضائي:</b> ${e(r.principle)}</p>`:r.title?`<p>${e(r.title)}</p>`:''}
  ${r.summary?`<p><b>الملخص:</b> ${e(r.summary)}</p>`:''}
  <table class="kv"><tr><th>الفرع</th><td>${e(r.field||'—')}</td><th>الكلمات المفتاحية</th><td>${e((r.keywords||[]).join('، ')||'—')}</td></tr>
  <tr><th>القضايا المرتبطة</th><td>${e(linked(r)||'—')}</td><th>المصدر</th><td>${e(r.src||'—')}${r.srcUrl?`<br><span dir="ltr">${e(r.srcUrl)}</span>`:''}</td></tr></table>
  ${r.text?`<h3>نص الحكم</h3>${paras(r.text).map(x=>`<p>${e(x)}</p>`).join('')}`:''}
  ${r.notes?`<p class="nt"><b>ملاحظات المكتب:</b> ${e(r.notes)}</p>`:''}</article>`).join(word?'<br style="page-break-before:always">':'<hr>');
 return `<!doctype html><html lang="ar" dir="rtl"${word?' xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"':''}><head><meta charset="utf-8"><title>الاجتهادات القضائية</title>
<style>@page{size:A4;margin:18mm}body{font-family:${word?'"Simplified Arabic","Traditional Arabic",':''}Cairo,Tahoma,sans-serif;font-size:14pt;line-height:1.8;color:#1A1209;direction:rtl;max-width:900px;margin:auto;padding:20px}
header{border-bottom:3px double #B8863D;margin-bottom:18px;padding-bottom:8px}header b{font-size:18pt;color:#0B182B}header div{color:#8B6F47;font-size:11pt}
h1{font-size:17pt;text-align:center;color:#0B182B}h2{font-size:14pt;color:#8B6F47;border-bottom:1px solid #E6D5B8;padding-bottom:4px}h3{font-size:12.5pt;color:#0B182B}
.pr{background:#F7F3EA;border-right:4px solid #D4AF37;padding:8px 12px}table.kv{border-collapse:collapse;width:100%;font-size:11pt;margin:8px 0}table.kv th,table.kv td{border:1px solid #E6D5B8;padding:5px 8px;text-align:right;vertical-align:top}table.kv th{background:#F1E3C6;width:16%}
.nt{color:#3E2F21;font-size:12pt}footer{margin-top:24px;border-top:1px solid #E6D5B8;padding-top:8px;font-size:10pt;color:#8B6F47}hr{border:0;border-top:1px dashed #C9A87A;margin:22px 0}</style></head>
<body><header><b>${e(o.officeName||'')}</b><div>${e(o.lawyerName||'')}${o.city?' · '+e(o.city):''}</div></header>
<h1>الاجتهادات القضائية — ${items.length} ${items.length<=10?'أحكام':'حكماً'}</h1><p style="text-align:center;color:#8B6F47">تاريخ الاستخراج: ${dmy(today)}${RS.q.trim()?' · البحث: «'+e(RS.q.trim())+'»':''}</p>
${rows}<footer>مستخرج من مكتبة الاجتهادات في نظام ميثاق. يرجى مطابقة النصوص مع الأحكام الأصلية قبل الاستشهاد بها.</footer></body></html>`;
}
A.rExport=v=>{const it=chosen(),m=document.getElementById('rExpM');if(m)m.hidden=true;if(!it.length){toast('لا أحكام لاستخراجها');return}
 const d=iso(TODAY),base='mithaq-rulings-'+d; /* اسم لاتيني: بعض المتصفحات تُسقط الأسماء العربية للملفات المنزّلة */
 if(v==='csv'){const cols=['المحكمة','رقم الحكم','التاريخ','الفرع','النتيجة','المبدأ القضائي','الملخص','الكلمات المفتاحية','القضايا المرتبطة','المصدر','رابط المصدر','ملاحظات المكتب','نص الحكم'];
  const c=x=>'"'+String(x??'').replace(/"/g,'""')+'"';
  save(base+'.csv','text/csv;charset=utf-8','﻿'+[cols.map(c).join(','),...it.map(r=>[r.court,r.no,r.date,r.field,r.outcome,r.principle||r.title,r.summary,(r.keywords||[]).join('، '),linked(r),r.src,r.srcUrl,r.notes,r.text].map(c).join(','))].join('\r\n'))}
 else if(v==='json')save(base+'.json','application/json;charset=utf-8',JSON.stringify({exportedAt:new Date().toISOString(),office:(window.MQ&&MQ.settings||{}).officeName||'',count:it.length,rulings:it.map(({_v,...r})=>({...r,cases:(r.cases||[]).map(id=>(K(id)||{}).no||id)}))},null,1));
 else if(v==='doc')save(base+'.doc','application/msword;charset=utf-8','﻿'+htmlDoc(it,true));
 else save(base+'.html','text/html;charset=utf-8',htmlDoc(it,false));
 toast('استُخرج '+it.length+' '+(it.length<=10?'أحكام':'حكماً'))};

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
.rl-advt{display:flex;gap:10px;align-items:center;padding:0 18px 10px;flex-wrap:wrap}
.rl-adv{display:grid;grid-template-columns:repeat(5,minmax(0,1fr)) auto;gap:10px;align-items:end;padding-top:0}
.rl-adv label{display:flex;flex-direction:column;gap:4px;font-size:12.5px;color:var(--muted)}
.rl-chk{display:flex;flex-direction:column;gap:6px;font-size:13px}.rl-chk label{flex-direction:row;align-items:center;gap:6px;color:var(--ink);cursor:pointer}
@media(max-width:1000px){.rl-adv{grid-template-columns:1fr 1fr}}
.rl-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:2px 4px 10px;position:sticky;top:0;z-index:5;background:var(--bg,#F8F6F0);padding:6px 0}
.rl-bar .rl-sp{flex:1}.rl-all{display:flex;gap:6px;align-items:center;font-size:13px;cursor:pointer}
.rl-i{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:1.8;vertical-align:-3px}
.rl-dd{position:relative}.rl-ddm{position:absolute;inset-inline-end:0;top:calc(100% + 6px);z-index:20;background:var(--card,#fff);border:1px solid var(--line);border-radius:12px;box-shadow:0 12px 30px rgb(0 0 0/.12);padding:6px;min-width:230px;display:flex;flex-direction:column}
.rl-ddm[hidden]{display:none}.rl-ddm button{all:unset;cursor:pointer;padding:8px 10px;border-radius:8px;font-size:13.5px;font-weight:600;color:var(--ink)}.rl-ddm button:hover{background:var(--sunk)}
.rl-ddm small{display:block;font-weight:400;color:var(--muted);font-size:11.5px}
.rl-ck1{width:17px;height:17px;accent-color:#B8863D;cursor:pointer;margin:0}
.rl-card.sel{outline:2px solid #D4AF37;outline-offset:-1px}
.rl-pend{display:flex;gap:10px;align-items:center;margin-bottom:6px}.rl-ti{font-size:15px;font-weight:700;line-height:1.8;color:var(--ink)}
.rl-pg{display:flex;gap:14px;justify-content:center;align-items:center;margin:16px 0}
.pv-side .rl-pi{background:#13263A;color:#F9F6EF;border:1px solid rgb(185 150 90/.35);border-radius:8px;padding:7px 8px;font:inherit;font-size:13px;resize:vertical}
.rl-imp{border:1px solid var(--brass);background:var(--brass-soft);border-radius:8px;padding:9px 12px;margin:8px 0 4px;font-size:13.5px;line-height:1.8}`;document.head.appendChild(css);
})();
