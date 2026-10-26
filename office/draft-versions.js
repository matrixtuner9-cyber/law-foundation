/* المِسْبار — تاريخ نسخ المسودات قبل الاعتماد، محفوظ ضمن سجل مستند القضية.
   طلب المراجعة لا يمنح اعتماداً قانونياً ولا يرفع الحظر عن مشاركة مسودات AI. */
(function(root){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MAX_HISTORY=20,MAX_TEXT=120000;
const sig=text=>{const s=String(text||'');let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619)>>>0;return s.length+'-'+h.toString(16)};
const isDraft=d=>!!d&&d.shared!==true&&(d.aiDraft===true||d.templateStatus==='draft'||d.tplStatus==='draft');
function saveRevision(doc,newText,{reason='',user='',at=''}={}){
 if(!isDraft(doc))return {ok:false,error:'لا يمكن تعديل مستند معتمد أو ظاهر في بوابة الموكل من محرر المسودات.'};
 const text=String(newText||''),original=String(doc.text||'');
 if(text.trim().length<20||text.length>MAX_TEXT)return {ok:false,error:'نص المسودة يجب أن يتراوح بين 20 و120000 حرف.'};
 if(text===original)return {ok:false,error:'لم يتغير النص؛ لا داعي لحفظ إصدار مكرر.'};
 if(String(reason).trim().length<5)return {ok:false,error:'أدخل سبب التعديل (5 أحرف على الأقل).'};
 const hist=Array.isArray(doc.versionHistory)?doc.versionHistory.slice():[];
 if(hist.length>=MAX_HISTORY)return {ok:false,error:'وصلت المسودة إلى حد 20 إصداراً محفوظاً. صدّر سجل النسخ قبل استكمال العمل.'};
 const n=Math.max(1,Math.floor(Number(doc.versionCurrent)||1));
 const previous={version:n,text:original,signature:sig(original),reason:String(reason).trim().slice(0,600),user:String(user).slice(0,90),at:String(at)};
 return {ok:true,document:{...doc,text,versionCurrent:n+1,versionHistory:[...hist,previous],draftRevisionAt:String(at),draftRevisionBy:String(user),shared:false}};
}
const reviewState=d=>{
 const r=d?.draftReview360;
 if(!r)return 'none';
 return r.textSignature===sig(d.text)?'requested':'stale';
};
function submitReview(doc,{user='',note='',at=''}={}){
 if(!isDraft(doc))return {ok:false,error:'طلب المراجعة متاح للمسودات غير المعتمدة فقط.'};
 if(!String(doc.text||'').trim())return {ok:false,error:'لا يمكن طلب مراجعة مستند دون نص.'};
 return {ok:true,document:{...doc,draftReview360:{textSignature:sig(doc.text),requestedAt:String(at),requestedBy:String(user),note:String(note).slice(0,2000),status:'requested'},shared:false}};
}
if(typeof module!=='undefined'&&module.exports)module.exports={sig,isDraft,saveRevision,reviewState,submitReview,MAX_HISTORY};
if(!root?.document)return;
const writable=()=>!root.MQ?.readOnly&&['admin','lawyer'].includes(root.MQ?.user?.role);
const viewState={selected:'',compare:null};
const selectedDoc=k=>docs.find(d=>d.k===k.id&&String(d.id)===String(viewState.selected));
function currentCase(){return S.caseId?K(S.caseId):null}
function revDocs(k){return docs.filter(d=>d.k===k.id&&isDraft(d)&&typeof d.text==='string'&&d.text.trim())}
function view(k){
 const ds=revDocs(k);
 if(!ds.length)return '<section class="panel c360-panel"><header><h3>إصدارات المسودات</h3></header><div class="c360-body"><p>لا توجد مسودات نصية محفوظة وغير معتمدة في هذه القضية. أنشئ مسودة من مساعد الصياغة أو النماذج أولاً.</p></div></section>';
 if(!ds.some(d=>d.id===viewState.selected)){viewState.selected=ds[0].id;viewState.compare=null}
 const d=selectedDoc(k),hist=Array.isArray(d.versionHistory)?d.versionHistory:[];
 const requested=reviewState(d),isRO=!writable();
 const compares=hist.map(x=>'<option value="'+Number(x.version)+'" '+(String(viewState.compare)===String(x.version)?'selected':'')+'>الإصدار '+Number(x.version)+' · '+esc(x.at||'')+'</option>').join('');
 const compare=hist.find(x=>String(x.version)===String(viewState.compare));
 const marker=requested==='requested'?'طلب مراجعة داخلية قائم لهذه النسخة':requested==='stale'?'تغير النص بعد طلب المراجعة — يحتاج طلباً جديداً':'مسودة غير معتمدة';
 const history=hist.length?hist.slice().reverse().map(x=>'<tr><td>'+Number(x.version)+'</td><td>'+esc(x.at||'—')+'</td><td>'+esc(x.user||'—')+'</td><td>'+esc(x.reason||'—')+'</td></tr>').join(''):'<tr><td colspan="4">لا توجد إصدارات أقدم بعد</td></tr>';
 return '<section class="panel c360-panel dv-panel"><header><h3>إدارة نسخ اللوائح والمسودات</h3><span class="pill">الإصدار '+Number(d.versionCurrent||1)+'</span></header><div class="c360-body">'+
 '<p class="c360-muted">النسخ هنا سجلات تشغيلية ضمن ملف المستند، وليست سجلاً غير قابل للتعديل. تحفظ النسخة السابقة تلقائياً عند تسجيل تعديل جديد. لا يمنح «طلب مراجعة» اعتماداً للمحكمة أو إذناً بمشاركة الموكل.</p>'+
 '<label>اختر المسودة <select class="field" id="dvDoc">'+ds.map(x=>'<option value="'+esc(x.id)+'" '+(x.id===d.id?'selected':'')+'>'+esc(x.title||'مسودة')+'</option>').join('')+'</select></label>'+
 '<div class="dv-state"><b>'+esc(d.title)+'</b><span class="pill">'+esc(marker)+'</span></div>'+
 '<form id="dvSaveForm" class="dv-form"><label>نص المسودة الحالي<textarea class="field" name="text" rows="12" maxlength="'+MAX_TEXT+'" '+(isRO?'readonly ':'')+'spellcheck="false">'+esc(d.text)+'</textarea></label><label>سبب التعديل الذي سيُسجل مع الإصدار<input class="field" name="reason" maxlength="600" '+(isRO?'readonly ':'')+'placeholder="مثال: تصحيح مبلغ المطالبة وفق سند القبض"></label>'+
 (isRO?'':'<button class="btn pri" type="submit">حفظ نسخة جديدة من المسودة</button>')+'</form>'+
 '<div class="dv-actions">'+(isRO?'':'<button class="btn sm" data-act="dvRequest">طلب مراجعة داخلية لهذه النسخة</button>')+'<button class="btn sm" data-act="dvReview" >فتح التدقيق القانوني</button></div>'+
 (d.draftReview360?'<div class="hp-notice">آخر طلب مراجعة: '+esc(d.draftReview360.requestedAt||'—')+' · '+esc(d.draftReview360.requestedBy||'—')+(d.draftReview360.note?' · '+esc(d.draftReview360.note):'')+'</div>':'')+
 '<h4>تاريخ الإصدارات السابقة ('+hist.length+'/'+MAX_HISTORY+')</h4><div class="tablewrap"><table><thead><tr><th>الإصدار</th><th>التاريخ</th><th>المحرر</th><th>سبب التعديل</th></tr></thead><tbody>'+history+'</tbody></table></div>'+
 (hist.length?'<label>المقارنة بإصدار سابق<select class="field" id="dvCompare"><option value="">— اختر إصداراً سابقاً —</option>'+compares+'</select></label>':'')+
 (compare?'<div class="dv-compare"><label>النص السابق — الإصدار '+Number(compare.version)+'<textarea class="field" readonly rows="9">'+esc(compare.text)+'</textarea></label><label>النص الحالي<textarea class="field" readonly rows="9">'+esc(d.text)+'</textarea></label></div><p class="c360-muted">لإعادة نص قديم، انسخه إلى المحرر الحالي واحفظ إصداراً جديداً مع ذكر سبب الاستعادة؛ لا تُمحى الإصدارات السابقة.</p>':'')+
 '</div></section>';
}
root.draftVersionsTab=view;
A.dvOpenDoc=id=>{const d=docs.find(x=>String(x.id)===String(id)&&isDraft(x));if(!d)return toast('لا توجد مسودة قابلة لإدارة الإصدارات');S.caseId=d.k;S.view='case';S.caseTab='c360';viewState.selected=d.id;viewState.compare=null;A.c360Section('versions')};
A.dvSelect=id=>{viewState.selected=String(id||'');viewState.compare=null;render()};
A.dvCompare=id=>{viewState.compare=id||null;render()};
document.addEventListener('change',ev=>{if(ev.target?.id==='dvDoc')A.dvSelect(ev.target.value);if(ev.target?.id==='dvCompare')A.dvCompare(ev.target.value)});
document.addEventListener('submit',ev=>{
 if(ev.target?.id!=='dvSaveForm')return;ev.preventDefault();ev.stopImmediatePropagation();
 if(!writable())return toast('ليس لديك صلاحية تعديل المسودة');
 const k=currentCase(),d=k&&selectedDoc(k);if(!d)return toast('المسودة غير متاحة لهذه القضية');
 const f=ev.target,r=saveRevision(d,f.elements.text.value,{reason:f.elements.reason.value,user:root.MQ?.user?.username||'',at:new Date().toISOString()});
 if(!r.ok)return toast(r.error);
 Object.assign(d,r.document);root.MQ?.saveState?.();viewState.compare=null;render();toast('حُفظ الإصدار '+d.versionCurrent+' مع الاحتفاظ بالإصدار السابق.');
},true);
A.dvRequest=()=>{if(!writable())return toast('ليس لديك صلاحية إرسال طلب مراجعة');
 const k=currentCase(),d=k&&selectedDoc(k);if(!d)return;
 const note=prompt('ملاحظة للمراجع الداخلي (اختيارية):','');if(note===null)return;
 const r=submitReview(d,{user:root.MQ?.user?.username||'',note,at:new Date().toISOString()});
 if(!r.ok)return toast(r.error);
 Object.assign(d,r.document);root.MQ?.saveState?.();render();toast('سُجل طلب مراجعة داخلي دون اعتماد المسودة أو إرسالها لأي طرف.');
};
A.dvReview=()=>{const k=currentCase(),d=k&&selectedDoc(k);if(d&&typeof A.qaOpenDoc==='function')A.qaOpenDoc(d.id)};
const style=document.createElement('style');
style.textContent='.dv-panel .c360-body{gap:14px}.dv-form{display:grid;gap:10px}.dv-form label,.dv-panel label{display:grid;gap:7px;font-size:13px;font-weight:600}.dv-form textarea{line-height:1.85;direction:rtl}.dv-form button{justify-self:start}.dv-state{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.dv-actions{display:flex;gap:9px;flex-wrap:wrap}.dv-compare{display:grid;grid-template-columns:1fr 1fr;gap:10px}.dv-compare textarea{direction:rtl;line-height:1.75}@media(max-width:800px){.dv-compare{grid-template-columns:1fr}}';
document.head.appendChild(style);
})(typeof window==='undefined'?null:window);