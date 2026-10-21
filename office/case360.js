/* ميثاق | ملف القضية الذكي 360° — تلخيص حتمي من بيانات المكتب ومصفوفة بينات يراجعها المحامي.
   لا يصدر حكماً على صحة البينة أو نجاح القضية، ولا يتصل بخدمات AI من تلقاء نفسه. */
(function(root){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const dateOk=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s);
const STATUSES={support:'يؤيد الواقعة المذكورة',oppose:'قد يناقض الواقعة المذكورة',context:'سياق أو قرينة إضافية',verify:'تحتاج مراجعة'};
const REVIEW_ITEMS=[['facts','راجعت الوقائع مع الموكل وحددت المختلف عليه'],['evidence','فحصت البينات وأصول المستندات وما ينقص منها'],['sources','تحققت من النصوص القانونية والاجتهادات التي استندت إليها'],['dates','راجعت التبليغات والمواعيد والمهل والإجراءات'],['claims','طابقت الطلبات والدفوع مع المستندات والوقائع'],['draft','راجعت المسودة النهائية قبل أي اعتماد أو إيداع']];
const format=s=>dateOk(s)?s:'—';
function build(k, data, today){
 const ds=(data.docs||[]).filter(x=>x.k===k.id);
 const hs=(data.hearings||[]).filter(x=>x.k===k.id);
 const dl=(data.deadlines||[]).filter(x=>x.k===k.id);
 const next=hs.filter(h=>dateOk(h.date)&&h.date>=today).sort((a,b)=>a.date.localeCompare(b.date))[0]||null;
 const upcoming=dl.filter(d=>dateOk(d.due)&&d.due>=today).sort((a,b)=>a.due.localeCompare(b.due));
 const overdue=dl.filter(d=>dateOk(d.due)&&d.due<today);
 const missingMinutes=hs.filter(h=>dateOk(h.date)&&h.date<today&&!String(h.result||'').trim());
 const pendingEvidence=ds.filter(d=>!d.evidence360||!Object.hasOwn(STATUSES,d.evidence360.position)||d.evidence360.position==='verify');
 const reviewedEvidence=ds.filter(d=>d.evidence360&&Object.hasOwn(STATUSES,d.evidence360.position)&&d.evidence360.position!=='verify');
 const drafts=ds.filter(d=>d.aiDraft||d.tplStatus==='draft'||d.templateStatus==='draft');
 const review=k.caseReview360||{},reviewedSteps=REVIEW_ITEMS.filter(([id])=>!!(review.checks||{})[id]).length;
 const checks=[];
 if(overdue.length)checks.push({type:'urgent',text:overdue.length+' مهلة مسجلة بتاريخ سابق؛ تحقق من وضعها القانوني والإجرائي.',target:'deadlines'});
 if(missingMinutes.length)checks.push({type:'warn',text:missingMinutes.length+' جلسة سابقة دون نتيجة مدونة في السجل؛ راجع محاضرها.',target:'hearings'});
 if(drafts.length)checks.push({type:'warn',text:drafts.length+' مسودة غير معتمدة تحتاج مراجعة قبل الاستخدام أو المشاركة.',target:'docs'});
 if(pendingEvidence.length)checks.push({type:'info',text:pendingEvidence.length+' مستنداً لم تستكمل مراجعته في مصفوفة البينات.',target:'c360'});
 if(!ds.length)checks.push({type:'info',text:'لم يُسجّل أي مستند لهذه القضية بعد.',target:'docs'});
 if(!next)checks.push({type:'info',text:'لا توجد جلسة قادمة مسجلة؛ راجع جدول المحكمة أو مزامنة ميزان.',target:'hearings'});
 const events=[
   ...hs.filter(h=>dateOk(h.date)).map(h=>({date:h.date,type:'جلسة',name:h.purpose||'جلسة',detail:h.result?'القرار المسجل: '+h.result:'لا توجد نتيجة مدونة'})),
   ...dl.filter(d=>dateOk(d.due)).map(d=>({date:d.due,type:'مهلة',name:d.title||'مهلة',detail:d.kind||''})),
   ...ds.filter(d=>dateOk(d.date)).map(d=>({date:d.date,type:'مستند',name:d.title||'مستند',detail:d.kind||''}))
 ].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,40);
 return {ds,hs,dl,next,upcoming,overdue,missingMinutes,pendingEvidence,reviewedEvidence,drafts,checks,events,review,reviewedSteps,reviewTotal:REVIEW_ITEMS.length};
}
if(typeof module!=='undefined'&&module.exports)module.exports={build,STATUSES,REVIEW_ITEMS};
if(!root||!root.document)return;
/* A و S معرفان في المجال العام لملف app.js؛ لا يلزم وجودهما كخصائص window. */
const panelK=()=>typeof K==='function'&&S.caseId?K(S.caseId):null;
const pdate=()=>typeof iso==='function'?iso(TODAY):new Date().toISOString().slice(0,10);
const canWrite=()=>!root.MQ?.readOnly&&['admin','lawyer'].includes(root.MQ?.user?.role);
const DATA=()=>({docs,hearings,deadlines});
const pill=(n,t)=>'<div class="c360-stat"><strong>'+n+'</strong><span>'+esc(t)+'</span></div>';
const tab=(x,txt,active)=>'<button class="btn sm'+(active?' pri':'')+'" data-act="c360Section" data-v="'+x+'">'+txt+'</button>';
let section='summary';
function view(k){
 const m=build(k,DATA(),pdate());const cl=C(k.client)||{},court=CT(k.court)||{};
 const header='<div class="c360-intro"><div><h2>ملف القضية الذكي 360°</h2><p>لوحة تشغيلية من البيانات المسجلة؛ ليست حكماً قانونياً على القضية أو حجية مستنداتها.</p></div><div class="c360-tools"><button class="btn sm" data-act="gdOpen" data-v="case360">دليل الاستخدام</button><button class="btn sm" data-act="hpOpen">تحضير جلسة</button><button class="btn sm" data-act="c360Draft">صياغة لائحة</button><button class="btn sm" data-act="c360Section" data-v="quality">تدقيق قانوني</button><button class="btn sm pri" data-act="c360Assistant">مساعد القضية</button></div></div>';
 const stats='<div class="c360-stats">'+pill(m.hs.length,'جلسات مسجلة')+pill(m.dl.length,'مهل مسجلة')+pill(m.ds.length,'مستندات')+pill(m.reviewedEvidence.length+'/'+m.ds.length,'مستندات تمت مراجعة ربطها بالوقائع')+'</div>';
 const controls='<div class="c360-nav">'+tab('summary','الملخص والتنبيهات',section==='summary')+tab('evidence','مصفوفة البينات',section==='evidence')+tab('timeline','التسلسل الزمني',section==='timeline')+tab('hearing','تحضير الجلسة',section==='hearing')+tab('versions','إصدارات المسودات',section==='versions')+tab('review','تدقيق ما قبل الاعتماد ('+m.reviewedSteps+'/'+m.reviewTotal+')',section==='review')+tab('quality','تدقيق اللوائح والمراجع',section==='quality')+'</div>';
 let content='';
 if(section==='summary'){
  const list=m.checks.length?m.checks.map(x=>'<button class="c360-alert '+x.type+'" data-act="c360Jump" data-v="'+x.target+'"><span>'+esc(x.text)+'</span><span aria-hidden="true">←</span></button>').join(''):'<p class="c360-muted">لا توجد ملاحظات آلية من قواعد المتابعة المحددة. لا يعني ذلك اكتمال الملف قانونياً.</p>';
  const next=m.next?'<b>'+esc(m.next.date)+'</b> · '+esc(m.next.time||'')+' · '+esc(m.next.purpose||''):'لا توجد جلسة قادمة مسجلة';
  const up=m.upcoming.length?m.upcoming.slice(0,5).map(d=>'<div class="c360-brief-line"><b>'+esc(format(d.due))+'</b><span>'+esc(d.title||'مهلة')+'</span></div>').join(''):'لا مهل مستقبلية مدونة';
  content='<div class="c360-cols"><section class="panel c360-panel"><header><h3>متابعة واستكمال الملف</h3><span class="pill">'+m.checks.length+' ملاحظات</span></header><div class="c360-body">'+list+'</div></section>'+
   '<section class="panel c360-panel"><header><h3>الاستعداد للجلسة</h3></header><div class="c360-body"><div class="c360-subtitle">الجلسة القادمة</div><p>'+next+'</p><div class="c360-subtitle">المهل القادمة</div>'+up+'</div></section></div>'+
   '<section class="panel c360-panel"><header><h3>بيانات مرجعية</h3></header><div class="c360-body c360-meta"><div><span>رقم القضية</span><b>'+esc(k.no)+'</b></div><div><span>الموكل</span><b>'+esc(cl.name||'—')+'</b></div><div><span>المحكمة</span><b>'+esc(court.name||'—')+'</b></div><div><span>المرحلة</span><b>'+esc(k.stage||'—')+'</b></div></div></section>';
 }
 if(section==='evidence'){
  const rows=m.ds.map(d=>{
    const ev=d.evidence360||{},pos=Object.hasOwn(STATUSES,ev.position)?ev.position:'',related=ev.fact||'—';
    const opt=pos?STATUSES[pos]:'لم تُراجع';
    return '<tr><td><b>'+esc(d.title||'مستند')+'</b><div class="c360-muted">'+esc(d.kind||'—')+' · '+esc(d.src||'')+'</div></td><td><span class="pill">'+esc(opt)+'</span></td><td>'+esc(related)+'</td><td>'+esc(ev.updatedAt||'—')+'</td><td><button class="btn sm" data-act="c360Edit" data-v="'+esc(d.id)+'">'+(canWrite()?'مراجعة الربط':'عرض')+'</button></td></tr>';
   }).join('');
  content='<section class="panel c360-panel"><header><h3>مصفوفة البينات والمستندات</h3><span class="pill">'+m.reviewedEvidence.length+' تمت مراجعتها</span></header><div class="c360-body"><p class="c360-muted">اختر مستنداً وحدد علاقته بالواقعة وفق مراجعتك؛ هذا التصنيف ملاحظة تنظيمية للمحامي، ولا يثبت صحة المستند أو حجيته. وجود سجل للمستند لا يعني توفر ملفه الرقمي أو فحص محتواه.</p><div class="tablewrap"><table><thead><tr><th>المستند المسجل</th><th>التصنيف</th><th>الواقعة المرتبطة</th><th>آخر مراجعة</th><th></th></tr></thead><tbody>'+ (rows||'<tr><td colspan="5" class="empty">لا مستندات مسجلة. أضف مستنداً من تبويب «المستندات» في القضية.</td></tr>')+'</tbody></table></div><button class="btn sm" data-act="c360Jump" data-v="docs">فتح مستندات القضية</button></div></section>';
 }
 if(section==='hearing'&&typeof root.hearingPrepTab==='function')content=root.hearingPrepTab(k);
 if(section==='versions'&&typeof root.draftVersionsTab==='function')content=root.draftVersionsTab(k);
 if(section==='quality'&&typeof root.legalQaTab==='function')content=root.legalQaTab(k);
 if(section==='review'){
  const items=REVIEW_ITEMS.map(([id,label])=>'<label class="c360-review-item"><input type="checkbox" name="rev_'+id+'" '+((m.review.checks||{})[id]?'checked ':'')+(!canWrite()?'disabled ':'')+'><span>'+esc(label)+'</span></label>').join('');
  content='<section class="panel c360-panel"><header><h3>قائمة تدقيق مهنية قبل الاعتماد</h3><span class="pill">'+m.reviewedSteps+' / '+m.reviewTotal+'</span></header><div class="c360-body"><p class="c360-muted">يُقر المحامي بنفسه بإتمام بنود المراجعة التي تحقق منها، ولا يعني اكتمال هذه القائمة اعتماد اللائحة أو ضمان سلامتها القانونية. راجع المستندات والمواعيد مع مصدرها الأصلي.</p><form id="c360ReviewForm" class="c360-review-form">'+items+'<label class="c360-review-notes">ملاحظات المراجع<textarea class="field" name="note" maxlength="2000" rows="3" '+(!canWrite()?'readonly ':'')+'placeholder="نواقص أو تحفظات أو خطوات لازمة قبل الاعتماد">'+esc(m.review.note||'')+'</textarea></label>'+(canWrite()?'<button class="btn pri" type="submit">حفظ نتائج مراجعة المحامي</button>':'')+'<p class="c360-muted">آخر مراجعة: '+esc(m.review.updatedAt||'—')+' · المستخدم: '+esc(m.review.reviewer||'—')+'</p></form></div></section>';
 }
 if(section==='timeline'){
  const events=m.events.map(x=>'<div class="c360-event"><time>'+esc(x.date)+'</time><div><span class="pill">'+esc(x.type)+'</span> <b>'+esc(x.name)+'</b><p>'+esc(x.detail)+'</p></div></div>').join('');
  content='<section class="panel c360-panel"><header><h3>التسلسل الزمني للقضية</h3><span class="pill">'+m.events.length+' حدثاً</span></header><div class="c360-body"><p class="c360-muted">مُنشأ من تواريخ الجلسات والمهل والمستندات المسجلة فقط، دون استنتاج وقائع خارج الملف.</p>'+ (events||'<div class="empty">لا أحداث مسجلة بعد.</div>')+'</div></section>';
 }
 return '<div class="c360" aria-label="ملف القضية الذكي 360°">'+header+stats+controls+content+'</div>';
}
root.case360Tab=view;
A.c360Section=v=>{if(!['summary','evidence','timeline','hearing','versions','review','quality'].includes(v))return;section=v;render()};
A.c360Jump=v=>{if(v==='c360'){section='evidence';return render()}if(!['docs','hearings','deadlines'].includes(v))return;S.caseTab=v;render()};
A.c360Draft=()=>{const k=panelK();if(k&&typeof A.aiOpen==='function')A.aiOpen(k.id)};
A.c360Assistant=()=>{const k=panelK();if(k&&typeof A.asOpen==='function')A.asOpen(k.id)};
A.c360Edit=v=>{
 const k=panelK(),d=k&&docs.find(x=>String(x.id)===String(v)&&x.k===k.id);
 if(!d)return toast('المستند غير متاح لهذه القضية.');
 const ev=d.evidence360||{},selected=Object.hasOwn(STATUSES,ev.position)?ev.position:'',opts=Object.entries(STATUSES).map(([id,t])=>'<option value="'+id+'"'+(selected===id?' selected':'')+'>'+esc(t)+'</option>').join('');
 const ro=!canWrite();
 document.getElementById('modal').innerHTML='<div class="modal-bg" data-act="close"><div class="modal c360-dialog" role="dialog" aria-label="مراجعة علاقة البينة بالواقعة"><div class="head"><div><h2>مراجعة مستند: '+esc(d.title)+'</h2><p class="sub">تقييم تنظيمي يدوّنه المحامي؛ لا ينشئ حقيقة قضائية.</p></div><button class="btn sm" data-act="close">إغلاق</button></div><form id="c360EvidenceForm" class="form"><input type="hidden" name="docId" value="'+esc(d.id)+'"><label class="wide">تصنيف العلاقة بالواقعة<select class="field" name="position" required'+(ro?' disabled':'')+'><option value="">اختر تصنيفاً</option>'+opts+'</select></label><label class="wide">الواقعة أو الادعاء محل الربط<textarea class="field" name="fact" rows="3" maxlength="1200"'+(ro?' readonly':'')+' placeholder="حدد الواقعة كما وردت في ملف القضية">'+esc(ev.fact||'')+'</textarea></label><label class="wide">ملاحظات المحامي ومصادر التحقق<textarea class="field" name="note" rows="4" maxlength="2000"'+(ro?' readonly':'')+' placeholder="ماذا يحتاج إلى تأكيد أو إثبات إضافي؟">'+esc(ev.note||'')+'</textarea></label><p class="note wide">التصنيف يعبر عن مراجعة المحامي في تاريخ الحفظ، وليس عن حكم المحكمة أو دليل صحة المستند.</p>'+(ro?'':'<button class="btn pri" type="submit">حفظ مراجعة البينة</button>')+'</form></div></div>';
};
document.addEventListener('submit',ev=>{
 if(ev.target?.id==='c360ReviewForm'){
  ev.preventDefault();ev.stopImmediatePropagation();if(!canWrite())return toast('ليس لديك صلاحية مراجعة هذه القضية.');
  const k=panelK();if(!k)return toast('القضية غير متاحة.');
  const f=ev.target,checks={};for(const [id] of REVIEW_ITEMS)checks[id]=!!f.elements['rev_'+id]?.checked;
  k.caseReview360={checks,note:String(f.elements.note.value||'').trim().slice(0,2000),reviewer:root.MQ?.user?.username||'',updatedAt:new Date().toISOString().slice(0,10)};
  if(root.MQ?.saveState)root.MQ.saveState();render();toast('حُفظت قائمة التدقيق اليدوية في ملف القضية.');return;
 }
 if(ev.target?.id!=='c360EvidenceForm')return;
 ev.preventDefault();ev.stopImmediatePropagation();
 if(!canWrite())return toast('ليس لديك صلاحية تعديل ملف القضية.');
 const form=ev.target,docId=form.elements.docId.value,k=panelK(),d=k&&docs.find(x=>String(x.id)===docId&&x.k===k.id);
 if(!d)return toast('المستند غير متاح');
 const position=form.elements.position.value, fact=form.elements.fact.value.trim(),note=form.elements.note.value.trim();
 if(!Object.hasOwn(STATUSES,position))return toast('اختر تصنيف البينة.');
 if(['support','oppose'].includes(position)&&fact.length<5)return toast('حدد الواقعة المرتبطة بالبينة قبل اعتماد التصنيف.');
 d.evidence360={position,fact:fact.slice(0,1200),note:note.slice(0,2000),updatedAt:new Date().toISOString().slice(0,10),reviewer:root.MQ?.user?.username||''};
 if(root.MQ?.saveState)root.MQ.saveState();
 A.close();render();toast('حُفظت مراجعة المستند داخل ملف القضية.');
},true);
const style=document.createElement('style');
style.textContent='.c360{display:grid;gap:15px}.c360-intro{display:flex;justify-content:space-between;align-items:start;gap:16px;flex-wrap:wrap}.c360-intro h2{margin:0;font-size:22px}.c360-intro p,.c360-muted{color:var(--muted);font-size:13px;line-height:1.75;margin:4px 0}.c360-tools,.c360-nav{display:flex;gap:8px;flex-wrap:wrap}.c360-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.c360-stat{border:1px solid var(--line);background:var(--surface);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:6px}.c360-stat strong{font-size:23px;font-variant-numeric:tabular-nums}.c360-stat span{font-size:12px;color:var(--muted);line-height:1.5}.c360-cols{display:grid;grid-template-columns:1.2fr 1fr;gap:12px}.c360-panel{overflow:hidden}.c360-panel header{padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:8px}.c360-panel h3{margin:0;font-size:16px}.c360-body{padding:12px 16px;display:grid;gap:10px}.c360-alert{width:100%;text-align:start;border:1px solid var(--line);background:var(--surface);padding:12px;border-radius:10px;display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;line-height:1.7}.c360-alert.urgent{border-inline-start:3px solid #b91c1c}.c360-alert.warn{border-inline-start:3px solid #b8863d}.c360-alert.info{border-inline-start:3px solid #64748b}.c360-alert:hover{background:var(--sunk)}.c360-subtitle{font-weight:700;font-size:13px}.c360-brief-line{display:flex;gap:14px;padding:5px 0;border-bottom:1px solid var(--line);font-size:13px}.c360-brief-line b{white-space:nowrap}.c360-meta{grid-template-columns:repeat(4,minmax(0,1fr))}.c360-meta div{display:flex;flex-direction:column;gap:5px}.c360-meta span{color:var(--muted);font-size:12px}.c360-meta b{font-size:13px}.c360-event{display:grid;grid-template-columns:112px 1fr;gap:14px;border-bottom:1px solid var(--line);padding:10px 0}.c360-event time{font-variant-numeric:tabular-nums;color:var(--muted);font-size:13px}.c360-event p{margin:5px 0;color:var(--muted);font-size:13px}.c360-dialog{max-width:700px}@media(max-width:800px){.c360-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.c360-cols{grid-template-columns:1fr}.c360-meta{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.c360-stats{grid-template-columns:1fr 1fr}.c360-stat{padding:9px}.c360-event{grid-template-columns:1fr;gap:2px}}';
style.textContent+='.c360-review-form{display:grid;gap:10px}.c360-review-item{display:flex;align-items:flex-start;gap:10px;border:1px solid var(--line);border-radius:9px;padding:10px 12px;line-height:1.7}.c360-review-item input{margin-top:5px;flex:none}.c360-review-notes{display:grid;gap:7px;font-size:14px}.c360-review-form button{justify-self:start}';
document.head.appendChild(style);
})(typeof window==='undefined'?null:window);
