/* ميثاق — محرك التدقيق القانوني: فحص محلي حتمي + مراجعة AI اختيارية.
   الفحص لا يقرر صحة الدعوى، ولا يثبت مرجعاً قضائياً تلقائياً. */
(function(root){
'use strict';
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>String(s??'').trim();
const dated=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||''));
const short=(s,n=180)=>norm(s).slice(0,n);
function fingerprint(doc){
 const t=JSON.stringify([String(doc?.text||''),doc?.refs||[],doc?.unverified||[]]);let h=2166136261;
 for(let i=0;i<t.length;i++)h=Math.imul(h^t.charCodeAt(i),16777619)>>>0;
 return t.length+'-'+h.toString(16).padStart(8,'0'); // مؤشر تغير للمراجعة؛ ليس توقيعاً أمنياً.
}
function review({caseFile={},doc={},documents=[],deadlines=[],today=''}={}){
 const text=String(doc.text||''),refs=Array.isArray(doc.refs)?doc.refs:[],unv=Array.isArray(doc.unverified)?doc.unverified:[];
 const issues=[],seen=new Set();
 const add=(id,level,title,detail,example='')=>{if(!seen.has(id)){seen.add(id);issues.push({id,level,title,detail,example:short(example,260)})}};
 if(text.trim().length<60)add('text','attention','نص غير كافٍ للفحص','هذه البطاقة لا تحتوي نصاً قانونياً كافياً؛ قد تكون وصفاً لمرفق لم يُحمّل نصه.');
 if(!caseFile.no||!caseFile.court)add('case-data','attention','بيانات القضية تحتاج مراجعة','تحقق من رقم القضية والمحكمة المختصة من الملف والسجل الرسمي.');
 if(caseFile.no&&!text.includes(caseFile.no))add('case-no','check','مطابقة رقم الدعوى','رقم القضية المسجل لا يظهر حرفياً في نص المستند؛ راجع الديباجة قبل التقديم.',caseFile.no);
 if(/لائحة|استئناف|نقض|مذكرة/i.test(String(doc.kind||doc.title||''))&&!/(الطلبات|لذلك|نلتمس|تلتمس|نطلب|التمس|تطلب)/.test(text))add('requests','check','مراجعة الطلبات الختامية','لم يظهر عنوان أو تعبير شائع للطلبات؛ تحقق من وجود الطلبات وصياغتها.');
 const placeholders=[...new Set([...text.matchAll(/\{([^{}\n]{2,85})\}/g)].map(x=>x[0]))].slice(0,12);
 if(placeholders.length)add('blanks','attention','حقول مسودة غير مكتملة','توجد مواضع تعبئة بين أقواس معقوفة؛ استكملها قبل الاعتماد.',placeholders.join('، '));
 if(/\[مرجع يحتاج تحقق(?::[^\]]*)?\]/.test(text))add('citation-placeholder','attention','إحالة معلّمة للتحقق','وجدت إحالة قانونية موسومة بأنها تحتاج تحققاً في متن المسودة.');
 if(unv.length)add('unverified','attention','أسانيد غير متحقق منها','أورد محرك الصياغة أسانيد أو مواد تتطلب التحقق من مصدرها الأصلي.',unv.slice(0,3).join('؛ '));
 const cited=[...new Set([...text.matchAll(/\[(R\d+)\]/g)].map(x=>x[1]))];
 const indexed=new Set(refs.map(x=>String(x.id||'')));
 const unknown=cited.filter(x=>!indexed.has(x));
 if(unknown.length)add('orphan','attention','إحالات غير موجودة بقائمة المراجع','هذه الرموز وردت في النص لكن لم تُدرج في قائمة المراجع المرفقة.',unknown.join('، '));
 if(refs.length)add('source-check','check','التحقق من صحة المراجع','وجود عنوان أو رقم مادة في قائمة المراجع ليس إثباتاً لنفاذها أو لمطابقتها لنص المصدر؛ افتح الأصل وتحقق من الحكم والمادة والاختصاص وتاريخ النفاذ.',refs.slice(0,3).map(x=>x.title||x.ref||x.id).join('؛ '));
 if(cited.length===0&&/المادة|قانون|محكمة النقض|حكم/.test(text))add('source-unlinked','check','نصوص قانونية دون إحالات مرتبطة','راجع الإشارات إلى القوانين والأحكام وتحقق من سندها؛ الفحص لا يستنتج مراجع من سياق النص.');
 const amountMatches=[...text.matchAll(/(?:^|[^\d])(\d{1,3}(?:,\d{3})+|\d{1,9})(?:\.(\d{1,2}))?\s*(شيكل|₪)/gm)].slice(0,120);
 const amounts=[...new Set(amountMatches.map(x=>Number(x[1].replace(/,/g,''))+(x[2]?Number('0.'+x[2]):0)))];
 if(amounts.length>1)add('amounts','check','مبالغ متعددة تحتاج مطابقة','ظهرت مبالغ مختلفة في النص؛ قد تكون دفعات أو مطالبات متعددة وليست تناقضاً. راجع سياق كل مبلغ.',amounts.slice(0,7).join('، ')+' ₪');
 const overdue=deadlines.filter(x=>x.k===caseFile.id&&dated(x.due)&&dated(today)&&x.due<today);
 if(overdue.length)add('deadlines','attention','مهل مسجلة بتواريخ سابقة','توجد مهل في السجل بتاريخ سابق؛ راجع التبليغات والقرارات للتأكد من وضعها، ولا تعتبرها منقضية تلقائياً.',overdue.slice(0,3).map(x=>x.title+' ('+x.due+')').join('؛ '));
 const ev=documents.filter(x=>x.k===caseFile.id&&x.id!==doc.id);
 const reviewed=ev.filter(x=>x.evidence360&&['support','oppose','context'].includes(x.evidence360.position));
 if(ev.length&&!reviewed.length)add('evidence','check','علاقة البينات بالوقائع لم توثق','هناك مستندات أخرى مسجلة في القضية دون مراجعة مثبتة لعلاقتها بالوقائع في مصفوفة البينات.');
 if(doc.aiDraft||doc.tplStatus==='draft'||doc.templateStatus==='draft')add('draft','info','مسودة غير معتمدة','لا يُجيز تقرير التدقيق إيداع المسودة أو مشاركتها دون مراجعة واعتماد المحامي.');
 return {version:1,docId:String(doc.id||''),docTitle:short(doc.title,160),fingerprint:fingerprint(doc),issues,
  counts:{attention:issues.filter(x=>x.level==='attention').length,check:issues.filter(x=>x.level==='check').length,info:issues.filter(x=>x.level==='info').length},
  checkedAt:dated(today)?today:'',scope:'فحص قواعد محلي فقط: دون تفسير قانوني نهائي أو تحقق خارجي من الأحكام'};
}
if(typeof module!=='undefined'&&module.exports)module.exports={review,fingerprint};
if(!root||!root.document)return;
const state={selected:'',result:null,ai:null,busy:false,err:''};
const rtime=()=>typeof iso==='function'?iso(TODAY):new Date().toISOString().slice(0,10);
const visible=()=>S.caseId&&typeof K==='function'?K(S.caseId):null;
const writable=()=>!root.MQ?.readOnly&&['admin','lawyer'].includes(root.MQ?.user?.role);
const caseDocs=k=>(docs||[]).filter(d=>d.k===k.id&&String(d.text||'').trim().length>0);
const selectedDoc=k=>caseDocs(k).find(d=>String(d.id)===state.selected)||null;
const inputData=(k,d)=>({caseFile:k,doc:d,documents:docs,deadlines,today:rtime()});
const isStale=(d,q)=>!!q&&q.fingerprint!==fingerprint(d);
const badge=issue=>({attention:'يتطلب معالجة',check:'مراجعة يدوية',info:'معلومات'}[issue.level]||'ملاحظة');
function drawReport(rep){
 const groups=rep.issues.map(x=>'<div class="qa-issue '+e(x.level)+'"><div class="qa-issue-head"><b>'+e(x.title)+'</b><span class="pill">'+badge(x)+'</span></div><p>'+e(x.detail)+'</p>'+(x.example?'<div class="qa-example">'+e(x.example)+'</div>':'')+'</div>').join('');
 return '<div class="qa-summary"><b>نتيجة فحص القواعد المحلية</b><span class="pill">عناصر تستلزم معالجة: '+rep.counts.attention+'</span><span class="pill">مراجعة يدوية: '+rep.counts.check+'</span><span class="pill">إرشادية: '+rep.counts.info+'</span></div><p class="c360-muted">'+e(rep.scope)+'</p>'+groups;
}
function drawAI(ai){
 if(!ai)return '';
 const sections=(ai.sections||[]).map(s=>'<section class="qa-ai-section"><h4>'+e(s.heading||'مراجعة')+'</h4><ul>'+ (s.items||[]).map(x=>'<li>'+e(x)+'</li>').join('')+'</ul></section>').join('');
 const refs=(ai.references||[]).map(x=>{const url=String(x.url||'').trim(),safe=/^https?:\/\/[^\s<>"']+$/i.test(url)&&!/muqtafi\.birzeit\.edu/i.test(url);return '<li>'+e(x.title||'مرجع')+(safe?' — <a href="'+e(url)+'" target="_blank" rel="noopener noreferrer">المصدر ↗</a>':'')+'</li>'}).join('');
 return '<section class="qa-ai-output"><h3>تحليل إضافي بالذكاء الاصطناعي — للمراجعة</h3><p class="c360-muted">لا تعتمد اقتراحات النموذج دون قراءة المستند الأصلي ومصادر القانون. قد يخطئ أو يسقط وقائع مهمة.</p>'+sections+(refs?'<h4>مراجع أوردها النموذج (بحاجة تحقق يدوي)</h4><ul>'+refs+'</ul>':'')+(ai.unverified?.length?'<h4>تحتاج تحققاً</h4><ul>'+ai.unverified.map(x=>'<li>'+e(x)+'</li>').join('')+'</ul>':'')+'</section>';
}
function view(k){
 const ds=caseDocs(k);
 if(!ds.length)return '<section class="panel c360-panel"><header><h3>التدقيق القانوني للمسودات</h3></header><div class="c360-body"><p>لا توجد مسودة ذات نص قابل للفحص في هذه القضية. افتح «صياغة لائحة» واحفظ مسودة في مستندات القضية أولاً.</p><button class="btn pri" data-act="c360Draft">إنشاء مسودة</button></div></section>';
 if(!ds.some(d=>String(d.id)===state.selected)){state.selected=ds[0].id;state.result=null;state.ai=null;state.err=''}
 const d=selectedDoc(k);
 const saved=d.qualityReview||null;
 const stale=isStale(d,saved);
 const report=state.result&&state.result.docId===d.id&&!isStale(d,state.result)?state.result:(!stale?saved:null);
 const options=ds.map(x=>'<option value="'+e(x.id)+'" '+(x.id===state.selected?'selected':'')+'>'+e((x.title||'مستند')+' · '+(x.date||''))+'</option>').join('');
 const currentTag=saved?(stale?'<span class="pill warn">المسودة عُدلت بعد آخر تدقيق — أعد الفحص</span>':'<span class="pill ok">تقرير التدقيق محفوظ لهذه النسخة</span>'):'<span class="pill">لم يُحفظ تدقيق بعد</span>';
 const reportHtml=report?drawReport(report):'<p class="c360-muted">اضغط «فحص محلي الآن» لاستخراج ملاحظات من النص وسجل القضية، دون إرسال أي بيانات للخارج.</p>';
 const reportActions=report?'<div class="qa-actions">'+(writable()?'<button class="btn pri sm" data-act="qaSave">حفظ تقرير التدقيق في المسودة</button>':'')+'<button class="btn sm" data-act="qaPrint">طباعة التقرير</button></div>':'';
 const ai=state.ai&&state.ai.docId===d.id&&!isStale(d,state.ai)?state.ai.result:(!stale?saved?.ai||null:null);
 return '<section class="panel c360-panel qa"><header><h3>محرك التدقيق القانوني للمسودات</h3>'+currentTag+'</header><div class="c360-body">'+
  '<p class="c360-muted">الفحص المحلي يكتشف مؤشرات تستحق المراجعة ولا يثبت صحة الإحالات القانونية أو المهل. لا يُرسل بيانات الموكلين للخارج حتى تطلب التحليل الذكي صراحة.</p>'+
  '<label class="qa-picker">اختر المستند المراد تدقيقه <select class="field" id="qaDoc">'+options+'</select></label>'+
  '<div class="qa-actions"><button class="btn pri" data-act="qaRun">فحص محلي الآن</button><button class="btn sm" data-act="c360Jump" data-v="docs">مستندات القضية</button></div>'+
  (state.err?'<p class="ai-err">'+e(state.err)+'</p>':'')+
  '<div class="qa-report">'+reportHtml+reportActions+'</div>'+
  '<div class="qa-ai-panel"><h3>تحليل إضافي باستخدام Claude — اختياري</h3><p class="c360-muted">للمراجعة المتقدمة، يرسل نص هذا المستند إلى مزوّد الذكاء الاصطناعي (وقد يحتوي بيانات شخصية أو سرية). تختلف تكلفة الطلب حسب الاستخدام. لا يحدث الإرسال عند الفحص المحلي.</p>'+
  '<label class="qa-consent"><input id="qaConsent" type="checkbox"> أؤكد وجود تصريح وصلاحية لمعالجة هذا النص لدى مزوّد خارجي وأوافق على إرساله لهذا التحليل.</label>'+
  '<button class="btn sm" data-act="qaAI" '+(state.busy?'disabled':'')+'>'+(state.busy?'جارٍ التحليل…':'تحليل المسودة بالذكاء الاصطناعي')+'</button>'+
  drawAI(ai)+'</div></div></section>';
}
root.legalQaTab=view;
root.MQ_legalQaSelection=k=>selectedDoc(k);
A.qaSelect=v=>{state.selected=v;state.result=null;state.ai=null;state.err='';render()};
A.qaOpenDoc=v=>{const d=docs.find(x=>String(x.id)===String(v)&&x.text);if(!d||!cases.some(k=>k.id===d.k))return toast('المستند غير متاح');state.selected=d.id;state.result=null;state.ai=null;state.err='';S.view='case';S.caseId=d.k;S.caseTab='c360';A.c360Section('quality')};
document.addEventListener('change',ev=>{if(ev.target?.id==='qaDoc')A.qaSelect(ev.target.value)});
A.qaRun=()=>{const k=visible(),d=k&&selectedDoc(k);if(!d)return toast('اختر مسودة');state.result=review(inputData(k,d));state.ai=null;state.err='';render()};
A.qaSave=()=>{if(!writable())return toast('ليس لديك صلاحية حفظ تقرير التدقيق.');
 const k=visible(),d=k&&selectedDoc(k),r=state.result||d?.qualityReview;
 if(!d||!r||isStale(d,r))return toast('أعد فحص أحدث نسخة من المسودة أولاً.');
 const report={...r,reviewer:root.MQ?.user?.username||'',savedAt:new Date().toISOString(),ai:state.ai?.result&&!isStale(d,state.ai)?state.ai.result:(!isStale(d,d.qualityReview)?d.qualityReview?.ai||null:null)};
 const hist=Array.isArray(d.qualityHistory)?d.qualityHistory.slice(-4):[];
 if(d.qualityReview)hist.push({...d.qualityReview,ai:undefined});
 d.qualityReview=report;d.qualityHistory=hist;
 if(root.MQ?.saveState)root.MQ.saveState();state.result=report;render();toast('حُفظ تقرير التدقيق في سجل المسودة دون اعتمادها.')};
A.qaAI=async()=>{
 if(!writable())return toast('لا تملك صلاحية تشغيل التحليل الذكي.');
 const k=visible(),d=k&&selectedDoc(k);if(!k||!d)return toast('اختر مسودة.');
 if(!document.getElementById('qaConsent')?.checked){state.err='يجب تأكيد صلاحية معالجة النص خارج المكتب أولاً.';return render()}
 if(!confirm('سيُرسل نص المسودة إلى خدمة Claude للتحليل، وقد يتضمن بيانات شخصية أو معلومات سرية. هل تؤكد الموافقة؟'))return;
 state.busy=true;state.err='';render();
 const fp=fingerprint(d);
 try{
  if(root.MQ?.pending?.()){await root.MQ.flush();if(root.MQ.pending())throw new Error('تعذر حفظ أحدث نسخة من المسودة؛ أعد المحاولة بعد اكتمال المزامنة.');}
  const expectedVersion=d._v||0;
  const res=await fetch('/api/admin/ai/legal-review',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({caseId:k.id,docId:d.id,consent:true})});
  const result=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(result.error||'تعذر التحليل');
  if(!visible()||visible().id!==k.id||!selectedDoc(k)||fingerprint(d)!==fp||(result.docId&&String(result.docId)!==String(d.id))||(result.docVersion!=null&&Number(result.docVersion)!==expectedVersion)){state.err='تغيّر النص أو القضية أو إصدار المستند أثناء التحليل؛ لم تُربط النتيجة بمسودة مختلفة.';return}
  state.ai={docId:d.id,fingerprint:fp,result:{sections:result.sections||[],references:result.references||[],unverified:result.unverified||[]}};
 }catch(err){state.err=err.message||'تعذر الاتصال بالمزود'}finally{state.busy=false;render()}
};
A.qaPrint=()=>{const k=visible(),d=k&&selectedDoc(k),r=state.result||d?.qualityReview;if(!d||!r||isStale(d,r))return toast('شغّل التدقيق لأحدث نص.');
 if(!root.MQP)return toast('محرك الطباعة غير متاح.');
 const B=MQP.B,E=MQP.esc;
 MQP.open({label:'تقرير تدقيق قانوني',build(){return {title:'تقرير تدقيق مسودة — للمراجعة فقط',sub:'القضية '+k.no+' · '+d.title,ref:k.no,file:'تدقيق-'+String(k.no).replace(/\W/g,'-'),sign:['المحامي المراجع'],mark:'مسودة',blocks:[
  B.box('تقرير مؤشرات وتحذيرات، لا يثبت صحة المصادر ولا يعد اعتماداً قانونياً.','warn'),
  ...r.issues.flatMap(x=>[B.h(E(x.title)),B.p(E(x.detail)),...(x.example?[B.p(E(x.example),'s')]:[])])
 ]}}})};
const style=document.createElement('style');
style.textContent='.qa-picker{display:grid;gap:7px;font-size:14px;font-weight:600}.qa-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0}.qa-report,.qa-ai-panel{border:1px solid var(--line);background:var(--surface);border-radius:12px;padding:14px;display:grid;gap:10px}.qa-summary{display:flex;gap:7px;flex-wrap:wrap;align-items:center}.qa-issue{border:1px solid var(--line);border-inline-start:3px solid #64748b;border-radius:8px;padding:10px 12px;line-height:1.7}.qa-issue.attention{border-inline-start-color:#b91c1c}.qa-issue.check{border-inline-start-color:#b8863d}.qa-issue-head{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.qa-issue p{margin:5px 0;font-size:14px}.qa-example{font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere;color:var(--muted)}.qa-consent{display:flex;gap:8px;align-items:start;line-height:1.7;font-size:13px}.qa-consent input{margin-top:4px;flex:none}.qa-ai-section li{margin-bottom:7px}.qa-ai-output{display:grid;gap:6px}.qa-ai-output h4,.qa-ai-panel h3{margin:0}.qa-ai-output ul{margin:4px 0;padding-inline-start:18px}.qa-ai-section{border-top:1px solid var(--line);padding-top:8px}';
document.head.appendChild(style);
})(typeof window==='undefined'?null:window);
