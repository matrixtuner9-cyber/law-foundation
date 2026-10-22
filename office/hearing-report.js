/* محضر الجلسة: ما جرى في الجلسة يدوّنه المحامي، ويُرسَل ملخّصه للموكل ويظهر في مسار قضيته في تطبيقه.
   - ملاحظة داخلية للمكتب لا تصل الموكل أبداً.
   - الجلسة القادمة تُنشأ من المحضر نفسه، ومعها ما يُطلب من الموكل (مهلة متابعة للمكتب).
   - في الرئيسية: «جلسات بانتظار المحضر» لكل جلسة مضت دون تسجيل ما جرى. */
(function(root){
'use strict';
const KINDS={adj:['تأجيل الجلسة','أُجّلت الجلسة'],wit:['سماع شهود','استمعت المحكمة إلى الشهود'],wreq:['طلب شاهد / بينة','طلبت المحكمة تقديم شاهد أو بينة'],pl:['تبادل اللوائح','جرى تبادل اللوائح والدفوع'],exp:['تعيين خبير / كشف','قررت المحكمة تعيين خبير أو إجراء كشف'],arg:['المرافعة','قُدّمت المرافعات'],rsv:['حجز للحكم','حُجزت القضية للحكم'],dec:['صدور قرار','أصدرت المحكمة قراراً'],rec:['صلح / مصالحة','عُرض الصلح بين الطرفين'],oth:['إجراء آخر','']};
const REASONS=['طلب الخصم مهلة','لعدم تبليغ الخصم','لغياب القاضي / عطلة','لتقديم بينات','لاستكمال التبليغ','لسماع الشهود','لطلب المحكمة','أخرى'];
/* النص الذي يصل الموكل: لغة بسيطة، بلا ملاحظات داخلية */
function clientText(k,h,r,fmt){fmt=fmt||(s=>s);const K2=KINDS[r.kind]||KINDS.oth;const L=[];
 L.push('ما جرى في جلسة قضيتكم رقم '+k.no+' بتاريخ '+fmt(h.date)+':');
 L.push('• '+(r.kind==='adj'?K2[1]+(r.reason&&r.reason!=='أخرى'?' '+r.reason:''):(K2[1]||K2[0])));
 if(r.summary)L.push('• '+r.summary);
 if(r.next&&r.next.date)L.push('• الجلسة القادمة: '+fmt(r.next.date)+(r.next.time?' الساعة '+r.next.time:'')+(r.next.purpose?' — '+r.next.purpose:'')+(r.next.attend?' (حضوركم شخصياً مطلوب)':' (لا يلزم حضوركم)'));
 if(r.asks)L.push('• المطلوب منكم'+(r.asksDue?' قبل '+fmt(r.asksDue):'')+': '+r.asks);
 L.push('حضر عنكم المحامي'+(r.by?' '+r.by:'')+'. لأي استفسار راسلونا من التطبيق.');
 return L.join('\n')}
const api={KINDS,REASONS,clientText};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof A==='undefined'||typeof document==='undefined')return;

const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const can=()=>!(root.MQ&&MQ.readOnly);const me=()=>(root.MQ&&MQ.user&&MQ.user.name)||'';
const save=()=>{if(root.MQ&&MQ.saveState)MQ.saveState()};
const HS=()=>typeof hearings!=='undefined'?hearings:[];
const pending=()=>HS().filter(h=>!h.result&&h.date<=iso(TODAY)&&K(h.k)&&K(h.k).status!=='منتهية').sort((a,b)=>b.date.localeCompare(a.date));
let HID=null;
function form(h){const k=K(h.k),r=h.report||{},nx=r.next||{};HID=h.id;
 document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal hr-modal" role="dialog" aria-label="محضر الجلسة"><div class="head"><div><h1 style="font-size:22px">محضر الجلسة: ما جرى</h1><p class="sub">قضية ${esc(k.no)} · جلسة ${dmy(h.date)} ${esc(h.time||'')} · ${esc(h.purpose||'')}</p></div><button class="btn sm" data-act="close">إغلاق</button></div>
 <form class="form" id="fHRep">
  <label>ما جرى<select class="field" id="hrK">${Object.entries(KINDS).map(([v,[t]])=>`<option value="${v}" ${r.kind===v?'selected':''}>${t}</option>`).join('')}</select></label>
  <label id="hrRw">سبب التأجيل<select class="field" id="hrR">${REASONS.map(x=>`<option ${r.reason===x?'selected':''}>${x}</option>`).join('')}</select></label>
  <label class="wide">ملخص للموكل (يصله كما هو)<textarea class="field" id="hrS" rows="2" placeholder="مثال: طلب القاضي إحضار شاهد المدعي، وقدّمنا كشف الحساب">${esc(r.summary||'')}</textarea></label>
  <fieldset class="wide cw-h"><legend>الجلسة القادمة</legend>
   <label>التاريخ<input class="field" type="date" id="hrND" value="${esc(nx.date||'')}"></label><label>الساعة<input class="field" type="time" id="hrNT" value="${esc(nx.time||'09:00')}"></label>
   <label class="wide">الغاية<input class="field" id="hrNP" value="${esc(nx.purpose||'')}" placeholder="مثال: سماع شاهد المدعي"></label>
   <label class="wide ck"><input type="checkbox" id="hrNA" ${nx.attend?'checked':''}> حضور الموكل مطلوب (يُذكَّر تلقائياً قبلها بـ48 ساعة وكل 8 ساعات)</label></fieldset>
  <label class="wide">المطلوب من الموكل (اختياري)<input class="field" id="hrAsk" value="${esc(r.asks||'')}" placeholder="مثال: إحضار الشاهد فلان، أو أصل العقد"></label>
  <label>آخر موعد لذلك<input class="field" type="date" id="hrAD" value="${esc(r.asksDue||'')}"></label><span></span>
  <label class="wide">ملاحظة داخلية للمكتب (لا تصل الموكل)<textarea class="field" id="hrIn" rows="2">${esc(r.internal||'')}</textarea></label>
  <div class="wide"><div class="m" style="margin-bottom:4px">معاينة ما يصل الموكل:</div><pre class="hr-prev" id="hrPrev"></pre></div>
  <label class="wide ck"><input type="checkbox" id="hrSend" checked> إرسال المحضر للموكل الآن (إشعار في تطبيقه ويظهر في مسار قضيته)</label>
  <div class="toolbar wide"><button class="btn pri" ${can()?'':'disabled'}>حفظ المحضر${r.at?' (تحديث)':''}</button></div>
 </form></div></div>`;
 const f=document.getElementById('fHRep'),upd=()=>{document.getElementById('hrRw').hidden=f.hrK.value!=='adj';document.getElementById('hrPrev').textContent=clientText(k,h,read(),dmy)};
 f.addEventListener('input',upd);f.addEventListener('change',upd);upd()}
function read(){const g=id=>(document.getElementById(id)||{}).value||'',c=id=>!!(document.getElementById(id)||{}).checked;
 return {kind:g('hrK'),reason:g('hrK')==='adj'?g('hrR'):'',summary:g('hrS').trim(),next:g('hrND')?{date:g('hrND'),time:g('hrNT'),purpose:g('hrNP').trim()||'جلسة متابعة',attend:c('hrNA')}:null,asks:g('hrAsk').trim(),asksDue:g('hrAD'),internal:g('hrIn').trim(),by:me()}}
document.addEventListener('submit',e=>{if(e.target.id!=='fHRep')return;e.preventDefault();e.stopImmediatePropagation();if(!can())return toast('صلاحيتك للاطلاع فقط');
 const h=HS().find(x=>x.id===HID),k=h&&K(h.k);if(!k)return;const r=read(),send=document.getElementById('hrSend').checked,txt=clientText(k,h,r,dmy);
 h.report={...r,at:typeof nowStamp==='function'?nowStamp():iso(TODAY),sent:send?(h.report&&h.report.sent||0)+1:(h.report&&h.report.sent||0)};
 h.result=(KINDS[r.kind]||KINDS.oth)[0]+(r.reason&&r.kind==='adj'?' — '+r.reason:'')+(r.summary?': '+r.summary:'')+(r.next&&r.next.date?' · الجلسة القادمة '+dmy(r.next.date):'');
 if(r.next&&r.next.date&&!HS().some(x=>x.k===k.id&&x.date===r.next.date&&(x.time||'')===(r.next.time||''))){hearings.push({id:'h'+Date.now(),k:k.id,date:r.next.date,time:r.next.time||'09:00',purpose:r.next.purpose,attend:!!r.next.attend,mz:false,from:h.id})}
 if(r.asks){const title='متابعة المطلوب من الموكل: '+r.asks.slice(0,60)+' — '+k.no;if(!deadlines.some(x=>x.k===k.id&&x.title===title))deadlines.push({id:'dl-hr'+Date.now(),k:k.id,title,due:r.asksDue||(r.next&&r.next.date)||iso(TODAY),kind:'متابعة',auto:true})}
 if(r.kind==='rsv'){k.flowAt=12}
 if(send&&typeof sendMsg==='function'){const c=C(k.client)||{};sendMsg(k.client,txt,c.ch||'البوابة')}
 A.close();save();render();toast('حُفظ محضر الجلسة'+(send?' وأُرسل للموكل':'')+(r.next&&r.next.date?' · أُضيفت الجلسة القادمة '+dmy(r.next.date):''))});
A.hrOpen=v=>{const h=HS().find(x=>x.id===v);if(!h)return;if(!can())return toast('صلاحيتك للاطلاع فقط');form(h)};
A.hrResend=v=>{const h=HS().find(x=>x.id===v),k=h&&K(h.k);if(!k||!h.report)return;const c=C(k.client)||{};if(typeof sendMsg==='function')sendMsg(k.client,clientText(k,h,h.report,dmy),c.ch||'البوابة');h.report.sent=(h.report.sent||0)+1;save();toast('أُعيد إرسال المحضر للموكل')};

/* بند «محاضر الجلسات» أعلى تبويب الجلسات في ملف القضية */
function panel(k){const hs=HS().filter(h=>h.k===k.id).sort((a,b)=>b.date.localeCompare(a.date)),T=iso(TODAY),past=hs.filter(h=>h.date<=T);
 return `<section class="panel hr-panel"><header><h2>محاضر الجلسات · ما جرى</h2><span class="pill ${past.some(h=>!h.result)?'warn':''}">${past.filter(h=>!h.result).length} بانتظار المحضر</span></header><div class="bd">
 ${past.length?past.map(h=>{const r=h.report;return `<div class="hr-row ${h.result?'':'due'}"><div class="hr-d"><b>${dmy(h.date)}</b><small>${esc(h.time||'')}</small></div><div class="hr-b"><div class="t">${esc(h.purpose||'جلسة')}</div>${h.result?`<div class="m">${esc(h.result)}</div>`:'<div class="m" style="color:var(--warn)">لم يُسجَّل ما جرى بعد؛ الموكل ينتظر الخبر.</div>'}${r&&r.internal?`<div class="m">🔒 ${esc(r.internal)}</div>`:''}</div><div class="hr-a">${r&&r.sent?'<span class="pill ok">أُرسل للموكل</span>':''}<button class="btn sm ${h.result?'':'pri'}" data-act="hrOpen" data-v="${h.id}">${h.result?'تعديل المحضر':'تسجيل ما جرى'}</button>${r?`<button class="btn sm" data-act="hrResend" data-v="${h.id}">إعادة الإرسال</button>`:''}</div></div>`}).join(''):'<div class="empty">لا جلسات منعقدة بعد.</div>'}</div></section>`}
{const ct=root.caseTab;if(typeof ct==='function')root.caseTab=k=>S.caseTab==='hearings'?panel(k)+ct(k):ct(k)}

/* الرئيسية: جلسات مضت بانتظار المحضر */
{const d0=V.dash;if(typeof d0==='function')V.dash=function(){const html=d0.apply(this,arguments),ps=pending();if(!ps.length)return html;
 return `<section class="hr-due" role="status"><b>📝 جلسات بانتظار تسجيل ما جرى (${ps.length})</b><span>الموكل لا يعرف ما حدث في غيابه حتى تسجّل المحضر</span>${ps.slice(0,6).map(h=>{const k=K(h.k),c=C(k.client)||{};return `<button class="hr-due-r" data-act="hrOpen" data-v="${h.id}"><span>${dmy(h.date)}</span><b>${esc(k.no)} · ${esc(c.name||'')}</b><small>${esc(h.purpose||'')}</small><em>تسجيل ما جرى ←</em></button>`}).join('')}</section>`+html}}

const css=document.createElement('style');css.textContent=`.hr-prev{white-space:pre-wrap;font-family:inherit;background:#F4F8F5;border:1px solid #CFE3D6;border-radius:10px;padding:10px 12px;margin:0;font-size:13px;line-height:1.8}
.hr-row{display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--line)}.hr-row:last-child{border-bottom:0}.hr-row.due{background:linear-gradient(90deg,transparent,#FFF7E6)}
.hr-d{min-width:76px}.hr-d small{display:block;color:var(--muted)}.hr-b{flex:1}.hr-a{display:flex;flex-direction:column;gap:6px;align-items:stretch}
.hr-due{display:flex;flex-direction:column;gap:6px;margin:0 0 14px;border:1px solid #C9D7F0;background:#F3F7FE;border-radius:14px;padding:10px 12px}.hr-due>b{color:#1E3A8A}.hr-due>span{font-size:12.5px;color:#4B5B7A}
.hr-due-r{all:unset;cursor:pointer;display:flex;gap:12px;align-items:center;flex-wrap:wrap;background:#fff;border:1px solid #DCE5F5;border-radius:10px;padding:8px 10px}.hr-due-r:hover{border-color:#1E3A8A}.hr-due-r small{color:var(--muted)}.hr-due-r em{font-style:normal;margin-inline-start:auto;color:#1E3A8A;font-weight:700;font-size:12.5px}`;document.head.appendChild(css);
root.MQ_hearingReport={open:form,panel};
}(typeof window!=='undefined'?window:globalThis));
