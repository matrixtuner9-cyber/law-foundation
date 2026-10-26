/* المِسْبار — التحضير المنظم للجلسة. بيانات محلية فقط، دون اتصال بالخارج.
   لا يعد ملخصاً قانونياً تلقائياً ولا يثبت قراراً أو ميعاداً غير مسجل. */
(function(root){
'use strict';
const escape=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const safeDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||''));
const str=s=>String(s??'').trim();
const hash=x=>{const s=JSON.stringify(x);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619)>>>0;return s.length+'-'+h.toString(16)};
const item=(id,label,hint)=>({id,label,hint});
const TASKS=[
 item('schedule','مطابقة تاريخ الجلسة ووقتها والمحكمة','تحقق من جدول المحكمة أو التبليغ الأحدث؛ لا تعتمد على سجل المكتب وحده'),
 item('previous','مراجعة آخر محضر وقرار جلسة','اطلع على النص الأصلي للقرار وتأكد من استكمال المطلوب'),
 item('evidence','مراجعة أصول المستندات والبينات','قارن المستندات بأصولها وتحقق من علاقتها بالوقائع'),
 item('deadlines','تدقيق الإجراءات والمهل المسجلة','البيانات المعروضة ليست حساباً قانونياً للمواعيد'),
 item('attendance','تأكيد حضور المحامي والموكل والشهود عند اللزوم','لا يُرسل أي إشعار أو استدعاء تلقائياً'),
 item('questions','تجهيز محاور المرافعة والأسئلة والتحفظات','راجع أسئلة الشهود مع ملف القضية وواجبات المهنة'),
 item('materials','تحضير الملف الورقي والنسخ المطلوبة','تحقق من طلبات المحكمة والمرفقات المطلوبة')
];
function build(k,data={},today='',requestedId=''){
 const hs=(data.hearings||[]).filter(h=>h.k===k.id&&h.id).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.time||'').localeCompare(String(b.time||'')));
 const ds=(data.docs||[]).filter(d=>d.k===k.id);
 const dl=(data.deadlines||[]).filter(d=>d.k===k.id);
 const future=hs.filter(h=>safeDate(h.date)&&h.date>=today);
 const next=future[0]||null;
 const latestPast=[...hs].reverse().find(h=>safeDate(h.date)&&h.date<today)||null;
 const current=hs.find(h=>String(h.id)===String(requestedId))||next||latestPast||null;
 const previous=current?[...hs].filter(h=>safeDate(h.date)&&h.date<current.date&&h.id!==current.id).reverse()[0]||null:null;
 const priorMissing=hs.filter(h=>safeDate(h.date)&&h.date<today&&!str(h.result));
 const upcoming=dl.filter(d=>safeDate(d.due)&&d.due>=today).sort((a,b)=>a.due.localeCompare(b.due));
 const pastDeadlines=dl.filter(d=>safeDate(d.due)&&d.due<today);
 const withEvidence=ds.filter(d=>['support','oppose','context'].includes(d.evidence360?.position));
 const pendingEvidence=ds.filter(d=>!['support','oppose','context'].includes(d.evidence360?.position));
 const warnings=[];
 if(!next)warnings.push('لا توجد جلسة قادمة مسجلة؛ تحقق من جدول المحكمة قبل التحضير.');
 if(current&&current.date<today)warnings.push('الجلسة المحددة في هذه البطاقة بتاريخ سابق؛ ليست جلسة قادمة.');
 if(priorMissing.length)warnings.push(priorMissing.length+' جلسة سابقة دون نتيجة مدونة في سجل المكتب؛ تحقق من محاضرها.');
 if(pastDeadlines.length)warnings.push(pastDeadlines.length+' مهلة ذات تاريخ سابق مسجلة؛ تحقق من وضع كل منها دون افتراض انقضائها.');
 if(pendingEvidence.length)warnings.push(pendingEvidence.length+' مستنداً دون ربط مُراجع بالوقائع في مصفوفة البينات.');
 const context=[
  current&&[current.id,current.date,current.time,current.purpose,current.attend,current.result],
  previous&&[previous.id,previous.date,previous.purpose,previous.result],
  ds.map(d=>[d.id,d.title,d.kind,d.date,d.evidence360?.position,d.evidence360?.fact]),
  dl.map(d=>[d.title,d.due,d.kind])
 ];
 return {caseId:k.id,hearings:hs,next,current,previous,upcoming,pastDeadlines,documents:ds,withEvidence,pendingEvidence,priorMissing,warnings,tasks:TASKS,sourceSig:hash(context)};
}
if(typeof module!=='undefined'&&module.exports)module.exports={build,TASKS};
if(!root?.document)return;
const state={selected:''},writable=()=>!root.MQ?.readOnly&&['admin','lawyer'].includes(root.MQ?.user?.role);
const now=()=>{const d=new Date(),pad=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
const openCase=()=>S.caseId?K(S.caseId):null;
const fmt=s=>str(s)||'—';
const input=(k)=>({hearings,deadlines,docs}),model=k=>build(k,input(k),now(),state.selected);
function chosen(k){
 const m=model(k); if(m.current&&state.selected!==m.current.id)state.selected=m.current.id;
 return model(k);
}
const saved=(k,id)=>k.hearingPrep360&&k.hearingPrep360[String(id)]||null;
function view(k){
 const m=chosen(k);
 const c=m.current;
 const casesTxt='<p class="hp-muted">ورقة تحضير داخلية تعتمد على البيانات المسجلة في ملف القضية، ويستكملها المحامي. لا تُرسل إشعارات ولا تستنتج قرارات أو أحكاماً غير مدونة.</p>';
 if(!m.hearings.length)return '<section class="panel hp-panel"><header><h3>تحضير الجلسة</h3></header><div class="hp-body">'+casesTxt+'<p>لا توجد جلسات مسجلة لهذه القضية بعد. أضف جلسة من تبويب «الجلسات»، ثم ارجع إلى التحضير.</p><button type="button" class="btn pri" data-act="c360Jump" data-v="hearings">فتح الجلسات</button></div></section>';
 const old=saved(k,c.id),stale=old&&old.sourceSig!==m.sourceSig;
 const plan=old||{},checkboxes=plan.tasks||{};
 const warnings='<div class="hp-warnings">'+m.warnings.map(x=>'<div class="hp-notice">'+escape(x)+'</div>').join('')+'</div>';
 const table=rows=>rows.map(x=>'<li>'+escape(x)+'</li>').join('');
 const documentRows=m.documents.map(d=>'<li><b>'+escape(d.title||'مستند')+'</b> <small>('+escape(d.kind||'غير محدد')+')</small> — '+(d.evidence360&&['support','oppose','context'].includes(d.evidence360.position)?'تصنيف تنظيمي مُراجع: '+escape(d.evidence360.position):'علاقته بالواقعة تحتاج مراجعة')+'</li>').join('');
 const deadlineRows=m.upcoming.slice(0,8).map(d=>escape(d.due)+' — '+escape(d.title||'مهلة')).concat(m.pastDeadlines.slice(0,5).map(d=>escape(d.due)+' — '+escape(d.title||'مهلة')+' (تاريخ سابق؛ يحتاج متابعة)'));
 const form= '<form id="hpForm" class="hp-form">'+
  '<input type="hidden" name="hearingId" value="'+escape(c.id)+'">'+
  '<div class="hp-cols"><label>الهدف من الجلسة<textarea class="field" name="goal" maxlength="4000" rows="4" '+(!writable()?'readonly ':'')+'placeholder="ما تريد تحقيقه في الجلسة بحسب قرار المحكمة والملف">'+escape(plan.goal||'')+'</textarea></label>'+
  '<label>نقاط المرافعة والتحفظات<textarea class="field" name="arguments" maxlength="6000" rows="4" '+(!writable()?'readonly ':'')+'placeholder="نقاط الدفاع أو المرافعة المطلوب مراجعتها">'+escape(plan.arguments||'')+'</textarea></label>'+
  '<label>أسئلة الشهود المقترحة<textarea class="field" name="questions" maxlength="6000" rows="4" '+(!writable()?'readonly ':'')+'placeholder="أسئلة تعدّها أنت وفق الوقائع والبينات">'+escape(plan.questions||'')+'</textarea></label>'+
  '<label>المستندات والأصول المطلوب إحضارها<textarea class="field" name="materials" maxlength="4500" rows="4" '+(!writable()?'readonly ':'')+'placeholder="الأصول والنسخ والمتطلبات التي راجعتها مع المحكمة">'+escape(plan.materials||'')+'</textarea></label>'+
  '<label>التواصل والتحضيرات اللوجستية<textarea class="field" name="contacts" maxlength="3500" rows="3" '+(!writable()?'readonly ':'')+'placeholder="من يجب التواصل معه؟ ما الذي تم تأكيده؟">'+escape(plan.contacts||'')+'</textarea></label>'+
  '<label>نواقص تحتاج متابعة<textarea class="field" name="missing" maxlength="4500" rows="3" '+(!writable()?'readonly ':'')+'placeholder="نواقص الملف أو إجراءات لم تُنجز">'+escape(plan.missing||'')+'</textarea></label></div>'+
  '<h4>قائمة التحضير — يضع المحامي علامة بعد التحقق</h4><div class="hp-task-list">'+m.tasks.map(t=>'<label class="hp-task"><input type="checkbox" name="task_'+t.id+'" '+(checkboxes[t.id]?'checked ':'')+(!writable()?'disabled ':'')+'><span><b>'+escape(t.label)+'</b><small>'+escape(t.hint)+'</small></span></label>').join('')+'</div>'+
  '<div class="hp-actions">'+(writable()?'<button class="btn pri" type="submit">حفظ تحضير الجلسة</button>':'')+'<button class="btn sm" type="button" data-act="hpPrint">طباعة ورقة التحضير</button><button class="btn sm" type="button" data-act="hpAssist">المساعد القانوني قبل الجلسة</button></div>'+
  '<p class="hp-muted">آخر حفظ: '+escape(plan.updatedAt||'لم تُحفظ هذه الورقة بعد')+(plan.reviewer?' · المحامي/المراجع: '+escape(plan.reviewer):'')+'</p></form>';
 return '<section class="panel hp-panel"><header><h3>مساعد التحضير للجلسات</h3><button class="btn sm" data-act="gdOpen" data-v="hearingprep">دليل الاستخدام</button></header><div class="hp-body">'+casesTxt+
 '<label class="hp-select">الجلسة المطلوب التحضير لها<select class="field" id="hpSelect">'+m.hearings.map(h=>'<option value="'+escape(h.id)+'" '+(c.id===h.id?'selected':'')+'>'+escape(fmt(h.date)+' · '+fmt(h.time)+' · '+fmt(h.purpose))+'</option>').join('')+'</select></label>'+
 '<div class="hp-event"><b>'+escape(fmt(c.date))+' · '+escape(fmt(c.time))+'</b><span>'+escape(c.purpose||'الغرض غير محدد')+'</span><span>الحضور الشخصي للموكل: '+(c.attend?'مُدوّن أنه مطلوب':'غير مثبت في بيانات الجلسة')+'</span></div>'+
 (stale?'<div class="hp-notice">تغيّرت معلومات الجلسة أو مستنداتها أو مهلها بعد حفظ التحضير. راجع الورقة ثم احفظ تحديثاً جديداً.</div>':'')+
 warnings+
 '<div class="hp-cols"><div class="hp-group"><h4>آخر جلسة سابقة</h4><p>'+(m.previous?escape(m.previous.date+' — '+m.previous.purpose)+'<strong>قرار مسجل:</strong> '+escape(m.previous.result||'لم تدوَّن نتيجة'): 'لا توجد جلسة سابقة مسجلة لهذه الجلسة')+'</p></div>'+
 '<div class="hp-group"><h4>المهل المسجلة في ملف القضية</h4>'+(deadlineRows.length?'<ul>'+table(deadlineRows)+'</ul>':'<p>لا مهل مسجلة</p>')+'</div>'+
 '<div class="hp-group"><h4>المستندات والبينات المسجلة ('+m.documents.length+')</h4>'+(documentRows?'<ul>'+documentRows+'</ul>':'<p>لا توجد مستندات مسجلة</p>')+'</div>'+
 '<div class="hp-group"><h4>وضع الملف</h4><p>المرحلة المسجلة: '+escape(k.stage||'—')+'</p><p>المستندات ذات ربط تنظيمي مُراجع: '+m.withEvidence.length+' / '+m.documents.length+'</p></div></div>'+
 form+'</div></section>';
}
root.hearingPrepTab=view;
A.hpOpen=()=>{const k=openCase();if(!k)return toast('افتح القضية أولاً');S.caseTab='c360';A.c360Section('hearing')};
A.hpSelect=v=>{state.selected=String(v||'');render()};
document.addEventListener('change',e=>{if(e.target?.id==='hpSelect')A.hpSelect(e.target.value)});
document.addEventListener('submit',ev=>{
 if(ev.target?.id!=='hpForm')return;ev.preventDefault();ev.stopImmediatePropagation();
 if(!writable())return toast('ليس لديك صلاحية حفظ التحضير.');
 const k=openCase(),f=ev.target,hearingId=f.elements.hearingId.value;
 const m=k&&build(k,input(k),now(),hearingId);
 if(!k||!m.current||String(m.current.id)!==String(hearingId))return toast('الجلسة لم تعد موجودة في هذه القضية.');
 const val=(field,n)=>String(f.elements[field]?.value||'').trim().slice(0,n);
 const flags={};for(const t of TASKS)flags[t.id]=!!f.elements['task_'+t.id]?.checked;
 const plan={hearingId,sourceSig:m.sourceSig,goal:val('goal',4000),arguments:val('arguments',6000),questions:val('questions',6000),materials:val('materials',4500),contacts:val('contacts',3500),missing:val('missing',4500),
  tasks:flags,updatedAt:new Date().toISOString().slice(0,10),reviewer:root.MQ?.user?.username||''};
 k.hearingPrep360={...(k.hearingPrep360||{}),[hearingId]:plan};
 root.MQ?.saveState?.();render();toast('حُفظ التحضير داخل ملف القضية؛ لا يتم إرسال إشعارات تلقائياً.');
},true);
A.hpAssist=()=>{const k=openCase();if(!k)return;toast('مساعد القضية اختياري؛ راجع السرية المهنية قبل أي إرسال خارجي.');if(typeof A.asOpen==='function')A.asOpen(k.id)};
A.hpPrint=()=>{
 const k=openCase(),m=k&&chosen(k),h=m?.current,plan=h&&saved(k,h.id);
 if(!k||!h)return toast('اختر جلسة.');
 if(!plan)return toast('احفظ تحضير الجلسة أولاً قبل الطباعة.');
 if(plan.sourceSig!==m.sourceSig)return toast('تغيرت بيانات الملف أو الجلسة؛ راجع الورقة واحفظها مجدداً قبل الطباعة.');
 if(!root.MQP)return toast('محرك الطباعة غير متاح.');
 const B=MQP.B,E=MQP.esc;
 const para=(title,val)=>[B.h(title),B.p(E(val||'لم تدوَّن تعليمات بعد'))];
 MQP.open({label:'ورقة التحضير للجلسة',build(){
 const rows=TASKS.map(t=>[plan.tasks?.[t.id]?'☑':'☐',E(t.label)]);
 return {title:'ورقة تحضير جلسة — داخلية',sub:'الدعوى '+k.no+' · '+(h.date||'')+' · '+(h.time||''),ref:k.no,file:'جلسة-'+k.no.replace(/\W/g,'-')+'-'+h.date,
 sign:['المحامي المسؤول'],mark:'تحضير داخلي',
 blocks:[B.box('هذه ورقة تحضير لا تُثبت صحة المواعيد أو المهل ولا تمثل محضر جلسة أو اعتماداً رسمياً.','warn'),
 B.kv([['المحكمة',E(CT(k.court)?.name||'—')],['موضوع القضية',E(k.subject||'—')],['الجلسة',E(h.purpose||'—')],['الحضور الشخصي',h.attend?'مُدوّن أنه مطلوب':'يحتاج تأكيداً']]),
 ...(m.previous?[B.h('آخر جلسة سابقة'),B.p(E(m.previous.date+' — '+(m.previous.purpose||'')+' — '+(m.previous.result||'دون نتيجة مدونة')))]:[]),
 ...para('هدف الجلسة',plan.goal),...para('المرافعة والتحفظات',plan.arguments),...para('أسئلة الشهود',plan.questions),...para('أصول المستندات',plan.materials),...para('التواصل',plan.contacts),...para('النواقص',plan.missing),
 B.h('قائمة تحضير المحامي'),B.t(['منجز','مهمة'],rows),
 ...(m.warnings.length?[B.h('تنبيهات من سجلات المكتب'),...m.warnings.map(t=>B.p(E(t)))]:[])]};
 }});
};
const style=document.createElement('style');
style.textContent='.hp-body{padding:15px;display:grid;gap:14px}.hp-panel header{padding:12px 16px;display:flex;justify-content:space-between;align-items:center;gap:8px}.hp-panel h3,.hp-panel h4{margin:0}.hp-muted{font-size:13px;color:var(--muted);line-height:1.8;margin:0}.hp-select,.hp-form label{display:grid;gap:7px}.hp-select{max-width:700px;font-size:14px;font-weight:650}.hp-event{background:var(--sunk);border:1px solid var(--line);border-radius:11px;padding:12px;display:flex;flex-wrap:wrap;gap:12px;line-height:1.8}.hp-warnings{display:grid;gap:8px}.hp-notice{border-inline-start:3px solid #aa7935;background:var(--sunk);padding:9px 12px;border-radius:7px;font-size:13px;line-height:1.7}.hp-cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.hp-group{border:1px solid var(--line);border-radius:10px;padding:12px;line-height:1.7}.hp-group p,.hp-group ul{font-size:13px;margin:7px 0}.hp-group li{padding:3px 0;overflow-wrap:anywhere}.hp-form{display:grid;gap:12px;border-top:1px solid var(--line);padding-top:16px}.hp-form label{font-size:13px;font-weight:650}.hp-task-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.hp-task{border:1px solid var(--line);border-radius:9px;padding:10px;display:flex!important;flex-direction:row;align-items:start;gap:8px;line-height:1.6}.hp-task input{margin-top:5px}.hp-task span{display:grid;gap:3px}.hp-task small{font-size:12px;color:var(--muted);font-weight:400}.hp-actions{display:flex;gap:10px;flex-wrap:wrap}@media(max-width:850px){.hp-cols,.hp-task-list{grid-template-columns:1fr}}';
document.head.appendChild(style);
})(typeof window==='undefined'?null:window);
