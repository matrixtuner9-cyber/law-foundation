/* ── نماذج قانونية فلسطينية إضافية ──
   مسودات قابلة للتعبئة من بيانات القضية، وليست نسخاً رسمية معتمدة. يُذكر لكل نموذج أساسه في قانون أصول المحاكمات
   المدنية والتجارية رقم (2) لسنة 2001 لمساعدة المحامي في المراجعة، لا لاعتماد النص دون تدقيق.
   المسودة تُحفظ بنصها في مستندات القضية، ولا تُشارك في بوابة الموكل ما دامت غير معتمدة. */
(function(){
'use strict';
const BASE='قانون أصول المحاكمات المدنية والتجارية رقم (2) لسنة 2001 وتعديلاته';
const D='[تُستكمل الوقائع والبيانات بعد مراجعة الملف]';
const src=id=>'https://maqam.najah.edu/legislation/4/item/'+id+'/';
const okSrc=u=>/^https:\/\/maqam\.najah\.edu\/legislation\/4\/item\/\d+\/$/.test(String(u||''));
const T=(name,category,hint,art,item,fields,body)=>({name,category,hint,status:'draft',basis:BASE+' — المادة '+art,sourceUrl:src(item),fields:fields.map(([k,l])=>[k,l,D]),body});
Object.assign(TPL,{
 t8:T('لائحة جوابية حقوقية','اللوائح والدفوع','إجابة على ادعاءات الخصم مع بيان المستندات',62,493,
  [['facts','الرد التفصيلي على الوقائع'],['defence','الدفوع والأسانيد القانونية'],['documents','المستندات المؤيدة للدفاع'],['requests','الطلبات الختامية']],
  ['لدى {court} الموقرة','لائحة جوابية في الدعوى رقم {no}','','المدعى عليه / المجيب: {client}','وكيله: {lawyer}','المدعي / الطرف الآخر: {opp}','موضوع الدعوى: {subject}','','أولاً: الرد على وقائع لائحة الدعوى','{facts}','','ثانياً: الدفوع القانونية والموضوعية','{defence}','','ثالثاً: المستندات والبينات المؤيدة','{documents}','','رابعاً: الطلبات','{requests}','','يرجى التحقق من الصفة والاختصاص والمهل والمرفقات وعدد النسخ قبل الإيداع.','وكيل المجيب: {lawyer}','التاريخ: {date}']),
 t9:T('لائحة طعن بالنقض','الطعون','أسباب واضحة ومحددة للطعن في الحكم',228,659,
  [['judgmentCourt','المحكمة التي أصدرت الحكم المطعون فيه'],['judgmentDate','تاريخ الحكم'],['judgmentNo','رقم الدعوى التي صدر فيها الحكم'],['grounds','أسباب الطعن المحددة'],['requests','طلبات الطاعن'],['addresses','عمل وعناوين الخصوم والمحامي']],
  ['لدى المحكمة العليا / محكمة النقض الموقرة','لائحة طعن بالنقض','','الطاعن: {client}','وكيله المحامي: {lawyer}','المطعون ضده: {opp}','بيانات العمل والعناوين: {addresses}','','الحكم المطعون فيه: حكم {judgmentCourt}','رقم الدعوى: {judgmentNo}','تاريخ صدوره: {judgmentDate}','','أسباب الطعن بالنقض:','{grounds}','','الطلبات:','{requests}','','تنبيه: تُراجع قابلية الحكم للطعن وشروط الإذن إن انطبقت ومواعيد الطعن وفق النص النافذ قبل الإيداع.','الطاعن بواسطة وكيله: {lawyer}','التاريخ: {date}']),
 t10:T('طلب وقف تنفيذ حكم مطعون فيه بالنقض','الطلبات القضائية','طلب مستقل مرتبط بطعن بالنقض قائم',240,671,
  [['appealNo','رقم الطعن بالنقض'],['judgmentDetails','بيانات الحكم المطلوب وقف تنفيذه'],['harm','الضرر المحدد والبينات المؤيدة'],['relief','الطلب المحدد']],
  ['لدى المحكمة العليا / محكمة النقض الموقرة','طلب وقف تنفيذ حكم مطعون فيه بالنقض','','المستدعي (الطاعن): {client}','وكيله: {lawyer}','المستدعى ضده: {opp}','الطعن بالنقض رقم: {appealNo}','','الحكم المطلوب وقف تنفيذه:','{judgmentDetails}','','الأسباب والضرر المحتمل المدعم بالأدلة:','{harm}','','الطلب:','{relief}','','هذا الطلب لا يوقف التنفيذ تلقائياً؛ الأمر خاضع لقرار المحكمة وكفالة إن قررتها.','وكيل المستدعي: {lawyer}','التاريخ: {date}']),
 t11:T('لائحة إعادة المحاكمة','الطعون','طلب استثنائي يحتاج أسباباً محددة',253,684,
  [['partyData','مهن وعناوين الخصوم'],['judgmentDetails','الحكم وتاريخ صدوره والمحكمة وتاريخ التبليغ'],['reasons','الأسباب القانونية المحددة لإعادة المحاكمة'],['requests','الطلبات']],
  ['لدى المحكمة المختصة التي أصدرت الحكم المطعون فيه','لائحة طلب إعادة المحاكمة','','طالب إعادة المحاكمة: {client}','وكيله: {lawyer}','المستدعى ضده: {opp}','المهن والعناوين: {partyData}','','الحكم محل الطلب:','{judgmentDetails}','','الأسباب المحددة بدقة:','{reasons}','','الطلبات:','{requests}','','تنبيه: يجب مراجعة الحالات الحصرية لقبول إعادة المحاكمة والميعاد والاختصاص وأثر الطلب قبل تقديمه.','وكيل الطالب: {lawyer}','التاريخ: {date}']),
 t12:T('مذكرة دفع شكلي أو بعدم الاختصاص المحلي','اللوائح والدفوع','صياغة الدفع الإجرائي وفق ترتيب تقديمه',91,522,
  [['proceduralIssue','بيان الدفع والوقائع المؤيدة'],['legalGrounds','السند القانوني والتحليل'],['requests','الطلبات']],
  ['لدى {court} الموقرة','مذكرة بدفع إجرائي في الدعوى رقم {no}','','مقدم الدفع: {client} بصفته {role}','وكيله: {lawyer}','الخصم: {opp}','','موضوع الدفع ووقائعه:','{proceduralIssue}','','الأساس القانوني:','{legalGrounds}','','الطلبات:','{requests}','','تنبيه: افحص وجوب إبداء الدفوع الإجرائية معاً وقبل إبداء الطلب أو الدفاع وفق النص النافذ.','وكيل مقدم الدفع: {lawyer}','التاريخ: {date}']),
 t13:T('طلب إدخال أو تدخل شخص ثالث','الطلبات القضائية','إدخال خصم أو التدخل في خصومة قائمة',96,527,
  [['thirdParty','اسم الشخص الثالث وصفته وعنوانه'],['interest','المصلحة أو سبب الإدخال ووقائعه'],['requests','الطلبات والبينات']],
  ['لدى {court} الموقرة','طلب إدخال / تدخل في الدعوى رقم {no}','','مقدم الطلب: {client}','الوكيل: {lawyer}','الطرف الآخر: {opp}','','الشخص المراد إدخاله أو المتدخل:','{thirdParty}','','المصلحة أو سبب الإدخال وعلاقته بموضوع الدعوى:','{interest}','','الطلبات والبينات:','{requests}','','يحدد الوكيل إن كان الطلب إدخالاً أم تدخلاً انضمامياً أم اختصامياً، مع التحقق من الصفة والإجراءات.','وكيل مقدم الطلب: {lawyer}','التاريخ: {date}']),
 t14:T('طلب تعديل لائحة الدعوى','الطلبات القضائية','تصحيح أو تعديل مرتبط بالدعوى',97,528,
  [['change','البيانات المطلوب تصحيحها أو تعديلها'],['reason','الوقائع المستجدة أو وجه الارتباط'],['requests','صيغة الطلب المعدل']],
  ['لدى {court} الموقرة','طلب تصحيح / تعديل لائحة دعوى رقم {no}','','المستدعي: {client}','وكيله المحامي: {lawyer}','المستدعى ضده: {opp}','','التعديل أو التصحيح المطلوب:','{change}','','مبررات الطلب وصلته بالدعوى الأصلية:','{reason}','','الطلبات:','{requests}','','يجب مراجعة جواز التعديل ومداه والإذن اللازم وأثره على الرسوم والتبليغات.','وكيل المستدعي: {lawyer}','التاريخ: {date}']),
 t15:T('مذكرة تحديد نقاط الخلاف وحصر البينة','البينات والإجراءات','تحديد الاتفاق والاختلاف والبينات المتصلة',120,551,
  [['agreements','النقاط المتفق عليها'],['disputes','النقاط المختلف عليها'],['evidence','البينات لكل نقطة خلاف']],
  ['لدى {court} الموقرة','مذكرة تحديد نقاط الاتفاق والاختلاف وحصر البينات','في الدعوى رقم {no}','','مقدم المذكرة: {client} بصفته {role}','وكيله: {lawyer}','الطرف الآخر: {opp}','','أولاً: نقاط الاتفاق:','{agreements}','','ثانياً: نقاط الخلاف:','{disputes}','','ثالثاً: البينات المراد تقديمها بشأن النقاط المختلف عليها:','{evidence}','','يراجع وكيل الخصم توجيهات المحكمة ومواعيد تقديم البينة وحصرها.','وكيل مقدم المذكرة: {lawyer}','التاريخ: {date}'])
});
for(const [id,cat] of Object.entries({t1:'التوكيلات',t2:'الإنذارات',t3:'اللوائح والدفوع',t4:'الطلبات القضائية',t5:'البينات والإجراءات',t6:'الاتفاقيات',t7:'الطعون'}))if(TPL[id]){TPL[id].category=cat;TPL[id].status='draft'}
if(TPL.t3){TPL.t3.basis=BASE+' — المادة 52';TPL.t3.sourceUrl=src(483)}
if(TPL.t7){TPL.t7.basis=BASE+' — المادة 208';TPL.t7.sourceUrl=src(639)}

const GROUPS=['الكل','التوكيلات','الإنذارات','اللوائح والدفوع','الطعون','الطلبات القضائية','البينات والإجراءات','الاتفاقيات'];
let group='الكل';
A.ptCategory=v=>{group=GROUPS.includes(v)?v:'الكل';render()};
V.tpls=function(){
 const t=TPL[S.tpl]||TPL.t1,h=s=>esc(String(s==null?'':s));
 const shown=Object.entries(TPL).filter(([,x])=>group==='الكل'||x.category===group);
 const basis=okSrc(t.sourceUrl)?`<a class="btn sm" href="${h(t.sourceUrl)}" target="_blank" rel="noopener noreferrer">عرض الأساس القانوني ↗</a>`:'';
 return `<div class="head"><div><h1>النماذج الجاهزة</h1><p class="sub">${Object.keys(TPL).length} نموذجاً قابلاً للتعبئة من بيانات القضية، مع تمييز المسودات عن النماذج الرسمية</p></div><div class="toolbar"><a class="btn" href="https://www.courts.gov.ps/userfiles/20111212183613.pdf" target="_blank" rel="noopener noreferrer">نموذج شكوى رسمي ↗</a><button class="btn" data-act="nav" data-v="lawlib">المكتبة القانونية</button></div></div>
 <div class="tpl-categories">${GROUPS.map(g=>`<button type="button" class="chip ${g===group?'on':''}" data-act="ptCategory" data-v="${h(g)}">${h(g)}</button>`).join('')}</div>
 <div class="tplgrid"><section class="panel tpllist">${shown.map(([id,x])=>`<button class="${S.tpl===id?'on':''}" data-act="tpl" data-v="${h(id)}"><b>${h(x.name)}</b><small>${h(x.hint)}</small><small>${h(x.category||'')} · مسودة للمراجعة</small></button>`).join('')}</section>
 <div class="stack"><section class="panel"><div class="bd"><div class="note" role="note"><b>مسودة قانونية للمراجعة:</b> لا تُودَع ولا تُوقَّع تلقائياً. تحقق من النص النافذ والاختصاص والصفة والمواعيد، ولا تعتبر البيانات المأخوذة من القضية حقائق ثابتة دون مراجعتها.</div>
 <div class="pt-source"><span>${h(t.basis||'نموذج عمل داخلي يحتاج تكييفاً ومراجعة')}</span>${basis}</div>
 <div class="form"><label>القضية<select class="field" id="tplCase">${cases.map(k=>`<option value="${h(k.id)}" ${S.tplCase===k.id?'selected':''}>${h(k.no)} · ${h((C(k.client)||{}).name||'')}</option>`).join('')}</select></label>
 ${t.fields.map(([key,label,def])=>`<label class="wide">${h(label)}<input class="field" id="tf_${h(key)}" data-tf="${h(key)}" value="${h(S.tplVals[key]??def)}"></label>`).join('')}</div>
 <div class="toolbar" style="margin-top:12px"><button class="btn pri" data-act="saveTpl">حفظ المسودة في مستندات القضية</button><button class="btn" data-act="copyTpl">نسخ النص</button><span class="m">الحقول المظللة مأخوذة من بيانات القضية، ويجب مراجعتها</span></div></div></section>
 <div class="paper" id="paper">${tplText(true)}</div></div></div>`;
};
/* حفظ المسودة بنصها الكامل في مستندات القضية (يمكن فتحها لاحقاً من «عرض المسودة») */
A.saveTpl=function(){
 if(window.MQ&&MQ.user&&(MQ.readOnly||!['admin','lawyer'].includes(MQ.user.role)))return toast('لا تتوفر صلاحية حفظ المسودة');
 const k=K(S.tplCase);if(!k)return toast('اختر ملف قضية صحيحاً');
 const t=TPL[S.tpl],body=tplText(false);
 if((body.includes('[تُستكمل')||body.includes('____'))&&!confirm('لا تزال في المسودة بيانات ناقصة. هل تحفظها كمسودة غير مكتملة؟'))return;
 docs.push({id:'d'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),k:k.id,title:t.name+' · '+((C(k.client)||{}).name||''),kind:t.name,date:iso(TODAY),src:'مولّد من نموذج',pages:1,shared:false,templateId:S.tpl,templateStatus:'draft',templateSource:t.sourceUrl||'',text:body});
 if(window.MQ&&MQ.saveState)MQ.saveState();
 toast('حُفظت المسودة ونصها في مستندات القضية '+k.no);drawNav();
};
/* المسودات غير المعتمدة (من النماذج أو الذكاء الاصطناعي) لا تُرسل إلى بوابة الموكل */
const share0=A.share;
A.share=function(id){const d=docs.find(x=>x.id===id);if(d&&(d.templateStatus==='draft'||d.tplStatus==='draft'||d.aiDraft)&&!d.shared)return toast('هذه مسودة غير معتمدة؛ لا يمكن مشاركتها في بوابة الموكل');return share0(id)};
A.tplDraftOpen=function(id){
 const d=docs.find(x=>x.id===id);if(!d||!d.text)return toast('لا يتوفر نص محفوظ لهذا المستند');
 const url=okSrc(d.templateSource)?d.templateSource:'';
 document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog" aria-label="مسودة محفوظة"><div class="head"><div><h1>${esc(d.title)}</h1>${d.templateStatus==='draft'?'<span class="pill warn">مسودة غير معتمدة</span>':''}</div><button class="btn sm" data-act="close">إغلاق</button></div>
 <p class="note">دقّق النص والبيانات والتشريع النافذ قبل التوقيع أو الإيداع.</p>
 <div class="toolbar"><button class="btn" data-act="tplDraftCopy" data-v="${esc(d.id)}">نسخ النص</button>${url?`<a class="btn" href="${esc(url)}" target="_blank" rel="noopener noreferrer">المصدر التشريعي ↗</a>`:''}</div>
 <pre class="pt-draft-content">${esc(d.text)}</pre></div></div>`;
};
A.tplDraftCopy=async function(id){const d=docs.find(x=>x.id===id);if(!d||!d.text)return;try{await navigator.clipboard.writeText(d.text);toast('نُسخ نص المسودة')}catch(x){toast('تعذّر النسخ؛ حدّد النص يدوياً')}};
const css=document.createElement('style');css.textContent='.tpl-categories{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 14px}.tpl-categories .chip{cursor:pointer}.tpl-categories .chip.on{background:var(--accent-soft);border-color:var(--brass);font-weight:700}.pt-source{margin:12px 0;display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;color:var(--muted);font-size:13px}.tpllist button{min-width:0}.tpllist small{display:block;margin-top:4px}.pt-draft-content{white-space:pre-wrap;font:inherit;line-height:1.9;background:var(--panel,#fff);border:1px solid var(--line);border-radius:10px;padding:14px;max-height:60vh;overflow:auto}';document.head.appendChild(css);
})();
