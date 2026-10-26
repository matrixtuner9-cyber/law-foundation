/* المِسْبار: بطاقة مراجعة أسانيد المسودات، يختار المحامي المصدر ويتحقق منه يدوياً. */
(function(root){
'use strict';
if(!root?.document||!root.MQ_refCheck||!root.legalQaTab)return;
const RC=root.MQ_refCheck;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const write=()=>!root.MQ?.readOnly&&['admin','lawyer'].includes(root.MQ?.user?.role);
const selected=()=>{const k=typeof K==='function'&&S.caseId?K(S.caseId):null;return k?root.MQ_legalQaSelection(k):null};
const lib=()=>RC.sources(legalRefs||[],rulings||[]);
const short=x=>String(x||'').slice(0,180);
function panel(d){
 const a=RC.assess(d,lib());
 const rows=a.entries.map(x=>{
   const r=x.ref,url=RC.safeUrl(x.source?.url||x.record?.sourceUrl||r.url),s={
      reviewed:'راجعه المحامي — بحسب إقراره','document-changed':'تغير نص المسودة — أعد المراجعة',changed:'تغير المرجع — أعد المراجعة',
      'source-changed':'تغير/حُذف المصدر — أعد المراجعة',pending:'غير مكتمل',unreviewed:'بانتظار مراجعة المحامي'
   }[x.status];
   return '<article class="rv-item"><div class="rv-top"><b>['+esc(r.id)+'] '+esc(r.title||'مرجع دون عنوان')+'</b><span class="pill'+(x.status==='reviewed'?' ok':'')+'">'+esc(s)+'</span></div>'+
    '<div class="rv-muted">'+esc(r.ref||'')+' · '+esc(r.kind==='ruling'?'اجتهاد أو حكم':'تشريع أو مادة')+'</div>'+
    (x.suggestions.length?'<div class="rv-muted">'+x.suggestions.length+' مرجعاً محتملاً في مكتبة المكتب — التطابق الوصفي لا يثبت الصحة</div>':'')+
    (x.record?.evidenceNote?'<p class="rv-note">ملاحظة المراجع: '+esc(x.record.evidenceNote)+'</p>':'')+
    '<div class="rv-actions">'+(url&&!/muqtafi\.birzeit\.edu/i.test(url)?'<a class="btn sm" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">فتح رابط المصدر ↗</a>':url?'<span class="rv-muted">المصدر محفوظ في مكتبة المكتب</span>':'<span class="rv-muted">لا يوجد رابط مصدر أصلي مثبت</span>')+
    (write()?'<button class="btn sm" data-act="rvOpen" data-v="'+esc(r.id)+'">تسجيل مراجعة المصدر</button>':'')+'</div></article>';
 }).join('');
 return '<section class="panel rv-panel"><header><h3>مراجعة مصادر الاستشهادات</h3><span class="pill">'+a.reviewed+' / '+a.total+' راجعها المحامي</span></header><div class="rv-body"><p class="rv-muted">لا يؤكد المِسْبار تلقائياً صحة الحكم أو نفاذ النص القانوني. انتقل إلى المصدر الأصلي وراجع رقمه ونصه وتاريخه واختصاصه، ثم سجل نتيجة مراجعتك. حتى «راجعه المحامي» ليست شهادة تحقق رسمية.</p>'+
 (rows||'<p class="rv-muted">لا توجد مراجع منظمة محفوظة مع هذا المستند. راجع الإحالات الواردة في المتن يدوياً، وأعد حفظ المراجع مع المسودة عند الحاجة.</p>')+ '</div></section>';
}
const base=root.legalQaTab;
root.legalQaTab=k=>{const html=base(k);const d=root.MQ_legalQaSelection(k);return html+(d?panel(d):'')};
A.rvOpen=v=>{
 if(!write())return toast('لا توجد صلاحية للمراجعة.');
 const d=selected(),r=d?.refs?.find(x=>String(x.id)===String(v));
 if(!d||!r)return toast('المرجع غير موجود في المستند الحالي.');
 const a=RC.assess(d,lib()).entries.find(x=>x.ref.id===v),prev=a?.record||{};
 const candidates=a?.suggestions||[];
 const oldLink=prev.sourceId?lib().find(x=>x.id===prev.sourceId):null;
 if(oldLink&&!candidates.some(x=>x.id===oldLink.id))candidates.unshift(oldLink);
 const options=candidates.map(x=>'<option value="'+esc(x.id)+'" '+(x.id===prev.sourceId?'selected':'')+'>'+esc(x.name)+'</option>').join('');
 const oldUrl=RC.safeUrl(prev.sourceUrl||r.url||'');
 document.getElementById('modal').innerHTML='<div class="modal-bg" data-act="close"><div class="modal" role="dialog" aria-label="مراجعة استشهاد قانوني">'+
  '<div class="head"><div><h2>مراجعة الاستشهاد ['+esc(r.id)+']</h2><p class="sub">'+esc(r.title)+'</p></div><button class="btn sm" data-act="close">إغلاق</button></div>'+
  '<form id="rvForm" class="form"><input type="hidden" name="refId" value="'+esc(r.id)+'">'+
  '<label class="wide">مرجع مشابه من مكتبة المكتب (إن وجد)<select class="field" name="sourceId"><option value="">— دون ربط بمكتبة المكتب —</option>'+options+'</select></label>'+
  '<p class="note wide">الترشيح مبني على البيانات الوصفية ولا يضمن تطابق النص أو صحة الاستشهاد. اختيار المرجع يتطلب مراجعة الأصل.</p>'+
  '<label class="wide">الرابط الأصلي للمصدر<input class="field" name="sourceUrl" type="url" maxlength="600" placeholder="https://..." value="'+esc(oldUrl)+'"></label>'+
  '<label class="wide">ملاحظة المراجع وموضع المادة/الحكم<textarea class="field" name="note" rows="4" maxlength="1500" placeholder="اذكر المادة أو رقم الحكم وتاريخ الاطلاع وما تحققت منه بنفسك">'+esc(prev.evidenceNote||'')+'</textarea></label>'+
  '<label class="wide" style="display:flex;flex-direction:row;gap:9px;align-items:flex-start"><input type="checkbox" name="reviewed" '+(a?.status==='reviewed'?'checked':'')+'> أؤكد أنني فتحت النص الأصلي وراجعت الاستشهاد بنفسي؛ لا يمثل هذا اعتماداً قانونياً نهائياً للمسودة.</label>'+
  '<div class="toolbar wide"><button class="btn pri" type="submit">حفظ نتيجة المراجعة</button></div></form></div></div>';
};
document.addEventListener('submit',ev=>{
 if(ev.target?.id!=='rvForm')return;
 ev.preventDefault();ev.stopImmediatePropagation();
 if(!write())return toast('لا تملك صلاحية تعديل مراجعات المصادر.');
 const d=selected(),f=ev.target,refId=String(f.elements.refId.value||''),ref=d?.refs?.find(x=>x.id===refId);
 if(!d||!ref)return toast('المرجع أو المسودة تغيرا. افتح المراجعة مرة أخرى.');
 const link=lib().find(x=>x.id===f.elements.sourceId.value)||null;
 const sourceId=f.elements.sourceId.value;
 if(sourceId&&!link)return toast('المرجع المختار لم يعد موجوداً في المكتبة.');
 const typed=String(f.elements.sourceUrl.value||'').trim(),url=RC.safeUrl(typed||link?.url||ref.url||'');
 if(typed&&!RC.safeUrl(typed))return toast('الرابط غير صالح؛ استخدم http أو https.');
 const note=String(f.elements.note.value||'').trim();
 const checked=!!f.elements.reviewed.checked;
 if(checked&&(!url||note.length<12))return toast('لتسجيل مراجعة مكتملة: أدخل رابط المصدر الأصلي وملاحظة توثق ما راجعته.');
 const data={refId,refSig:RC.refSig(ref),docSig:RC.docSig(d),sourceId:link?.id||'',sourceSig:link?RC.sourceSig(link.raw):'',sourceUrl:url||'',evidenceNote:note.slice(0,1500),status:checked?'reviewed':'pending',reviewer:root.MQ?.user?.username||'',reviewedAt:new Date().toISOString()};
 const reviews=Array.isArray(d.citationReviews)?d.citationReviews.filter(x=>x.refId!==refId):[];
 d.citationReviews=[...reviews,data];root.MQ?.saveState?.();
 A.close();render();toast(checked?'حُفظت إشارة المراجعة اليدوية — ليست تصديقاً للمصدر':'حُفظت الملاحظات، وما زال المرجع بانتظار التحقق.');
},true);
const css=document.createElement('style');
css.textContent='.rv-panel{overflow:hidden}.rv-panel header{padding:13px 17px;display:flex;align-items:center;justify-content:space-between;gap:12px}.rv-panel header h3{font-size:16px;margin:0}.rv-body{display:grid;gap:10px;padding:12px 16px}.rv-muted{font-size:13px;color:var(--muted);line-height:1.7}.rv-item{padding:12px;border-radius:10px;border:1px solid var(--line);display:grid;gap:6px}.rv-top,.rv-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.rv-top b{font-size:14px}.rv-actions{justify-content:flex-start}.rv-actions a{display:inline-flex;text-decoration:none}.rv-note{font-size:13px;white-space:pre-wrap;overflow-wrap:anywhere;margin:2px 0}.rv-body>p{margin:0 0 5px}';
document.head.appendChild(css);
})(typeof window==='undefined'?null:window);