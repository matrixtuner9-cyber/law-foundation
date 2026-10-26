/* ── مصاريف القضايا (خارج الأتعاب) ──
   رسوم المحكمة والطوابع والتبليغ والخبرة والترجمة والتنقل… تُسجَّل لكل قضية في سجل منفصل عن الأتعاب:
   - «دفعها المكتب عن الموكل»: مستحقة الاسترداد من الموكل حتى تُسجَّل كمستردّة.
   - «دفعها الموكل مباشرة»: للتوثيق فقط، لا تُستحق على أحد.
   تُحفظ في سجل الموكل (c.expenses) فتُزامَن مع بقية بياناته. */
(function(){
'use strict';
if(typeof V==='undefined')return;
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mny=n=>Number(n||0).toLocaleString('en-US')+' ₪';
const TYPES=['رسوم المحكمة','طوابع ورسوم','رسوم تبليغ','أتعاب خبير','ترجمة','رسوم كاتب العدل','رسوم دائرة التنفيذ','تصوير ونسخ','تنقل وسفر','أخرى'];
const can=()=>!!(window.MQ&&MQ.user&&['admin','lawyer'].includes(MQ.user.role)&&!MQ.readOnly);
const list=c=>(c&&c.expenses)||[];
const due=c=>list(c).filter(x=>x.by==='office'&&!x.back).reduce((s,x)=>s+Number(x.amount||0),0);
const sums=c=>{const xs=list(c);return {all:xs.reduce((s,x)=>s+Number(x.amount||0),0),office:xs.filter(x=>x.by==='office').reduce((s,x)=>s+Number(x.amount||0),0),back:xs.filter(x=>x.by==='office'&&x.back).reduce((s,x)=>s+Number(x.amount||0),0),due:due(c)}};
window.MQ_expenses={list,due,sums,TYPES};

function panel(c){const xs=list(c).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))),s=sums(c),ks=cases.filter(k=>k.client===c.id);
 const kno=id=>{const k=K(id);return k?(k.no&&k.no!=='قيد التسجيل'?k.no:String(k.subject||'').slice(0,24)):'—'};
 return `<section class="panel xp"><header><h2>مصاريف القضايا <small>خارج الأتعاب</small></h2><span class="toolbar">${xs.length?`<button class="btn sm" data-act="xpStatement" data-v="${e(c.id)}">كشف المصاريف</button>`:''}${can()?`<button class="btn sm pri" data-act="xpNew" data-v="${e(c.id)}">+ مصروف</button>`:''}</span></header>
 <div class="bd"><div class="xp-sum"><div><small>إجمالي المصاريف</small><b>${mny(s.all)}</b></div><div><small>دفعها المكتب</small><b>${mny(s.office)}</b></div><div><small>استُردّ من الموكل</small><b>${mny(s.back)}</b></div><div class="${s.due?'due':''}"><small>مستحق على الموكل</small><b>${mny(s.due)}</b></div></div>
 ${xs.length?`<div class="tablewrap"><table class="xp-t"><thead><tr><th>التاريخ</th><th>القضية</th><th>البند</th><th>المبلغ</th><th>من دفع</th><th>الحالة</th><th></th></tr></thead><tbody>${xs.map(x=>`<tr><td class="mono">${e(x.date)}</td><td class="mono">${e(kno(x.k))}</td><td>${e(x.type)}${x.note?`<small class="m"> — ${e(x.note)}</small>`:''}${x.rc?`<small class="m"> · إيصال ${e(x.rc)}</small>`:''}</td><td class="num">${mny(x.amount)}</td><td>${x.by==='office'?'المكتب عن الموكل':'الموكل مباشرة'}</td>
  <td>${x.by!=='office'?'<span class="pill">موثّق</span>':x.back?`<span class="pill ok">مستردّ ${e(x.back)}</span>`:'<span class="pill warn">مستحق</span>'}</td>
  <td class="xp-a">${can()?`${x.by==='office'?`<button class="link" data-act="xpBack" data-v="${e(c.id)}|${e(x.id)}">${x.back?'إلغاء الاسترداد':'تسجيل الاسترداد'}</button>`:''} <button class="link danger" data-act="xpDel" data-v="${e(c.id)}|${e(x.id)}">حذف</button>`:''}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty">لا مصاريف مسجّلة. ${ks.length?'أضف رسوم المحكمة والطوابع والتبليغ وغيرها من «+ مصروف».':''}</div>`}
 <p class="note" style="border:0;margin:6px 0 0">المصاريف لا تُخصم من الأتعاب ولا تُضاف إليها؛ تظهر منفصلة في كشف الموكل.</p></div></section>`}

/* حقيبة الموكل ← «الأتعاب والبيانات» */
const vc=V.client;if(typeof vc==='function')V.client=function(){let h=vc.apply(this,arguments);const c=C(S.clientId);if(!c||S.view!=='client'||(S.bagTab||'msgs')!=='acct')return h;
 return h+'<div class="xp-wrap">'+panel(c)+'</div>'};
/* شاشة «المالية والفواتير»: مصاريف مستحقة على الموكلين */
const vf=V.finance;if(typeof vf==='function')V.finance=function(){const h=vf.apply(this,arguments);const rows=clients.map(c=>({c,s:sums(c)})).filter(r=>r.s.all>0).sort((a,b)=>b.s.due-a.s.due);if(!rows.length)return h;
 const tot=rows.reduce((n,r)=>n+r.s.due,0);
 const box=`<section class="panel xp"><header><h2>مصاريف القضايا (خارج الأتعاب)</h2><span class="pill ${tot?'warn':'ok'}">مستحق ${mny(tot)}</span></header><div class="tablewrap"><table class="xp-t"><thead><tr><th>الموكل</th><th>إجمالي المصاريف</th><th>دفعها المكتب</th><th>استُردّ</th><th>مستحق</th></tr></thead><tbody>${rows.map(r=>`<tr class="clk" data-act="xpOpen" data-v="${e(r.c.id)}"><td>${e(r.c.name)}</td><td class="num">${mny(r.s.all)}</td><td class="num">${mny(r.s.office)}</td><td class="num">${mny(r.s.back)}</td><td class="num" style="font-weight:700;color:${r.s.due?'var(--warn)':'var(--ok)'}">${mny(r.s.due)}</td></tr>`).join('')}</tbody></table></div></section>`;
 return h+box};

/* ── الأوامر ── */
/* كشف مصاريف للموكل (مذكور في اتفاقية الأتعاب: يُقدَّم مع الإيصالات ويُسدَّد خلال المهلة) */
A.xpStatement=cid=>{const c=C(cid);if(!c)return;const xs=list(c).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))),s=sums(c);
 const kno=id=>{const k=K(id);return k?(k.no||'')+' — '+String(k.subject||'').slice(0,40):'—'};
 const L=['كشف مصاريف قضائية (خارج الأتعاب)','الموكل: '+c.name,'تاريخ الكشف: '+iso(TODAY),''];
 xs.forEach((x,i)=>L.push(`${i+1}. ${x.date} — ${x.type}${x.note?' ('+x.note+')':''} — القضية: ${kno(x.k)} — ${mny(x.amount)} — ${x.by==='office'?(x.back?'دفعها المكتب، واستُردّت بتاريخ '+x.back:'دفعها المكتب عن الموكل، مستحقة'):'دفعها الموكل مباشرة'}${x.rc?' — إيصال رقم '+x.rc:''}`));
 L.push('','إجمالي المصاريف: '+mny(s.all),'ما دفعه المكتب عن الموكل: '+mny(s.office),'ما استُردّ: '+mny(s.back),'المستحق على الموكل: '+mny(s.due),'','هذه المصاريف مستقلة عن الأتعاب المتفق عليها، وتُرفق بها إيصالاتها وفق اتفاقية الأتعاب.');
 if(A.ftOpen)A.ftOpen({title:'كشف مصاريف — '+c.name,sub:'مستحق: '+mny(s.due),text:L.join('\n\n')});else navigator.clipboard.writeText(L.join('\n'))};
A.xpOpen=id=>{S.view='client';S.clientId=id;S.bagTab='acct';window.scrollTo(0,0);render()};
A.xpNew=cid=>{const c=C(cid);if(!c||!can())return;const ks=cases.filter(k=>k.client===c.id),cur=window.MQ_payCase||S.caseId;
 document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog" aria-label="مصروف قضية"><div class="head"><h1 style="font-size:22px">مصروف قضية — ${e(c.name)}</h1><button class="x" data-act="close" aria-label="إغلاق">✕</button></div>
 <form class="form" id="fXp"><label class="wide">القضية<select class="field" name="k">${ks.map(k=>`<option value="${e(k.id)}" ${k.id===cur?'selected':''}>${e(k.no)} — ${e(String(k.subject||'').slice(0,40))}</option>`).join('')||'<option value="">بلا قضية</option>'}</select></label>
 <label>البند<select class="field" name="type">${TYPES.map(t=>`<option>${t}</option>`).join('')}</select></label>
 <label>المبلغ (₪)<input class="field num" name="amount" type="number" min="0" step="0.01" required></label>
 <label>التاريخ<input class="field" name="date" type="date" value="${iso(TODAY)}" required></label>
 <label>رقم الإيصال<input class="field" name="rc" maxlength="40" placeholder="اختياري"></label>
 <label class="wide">من دفع؟<select class="field" name="by"><option value="office">دفعها المكتب عن الموكل (تُسترد منه)</option><option value="client">دفعها الموكل مباشرة (للتوثيق)</option></select></label>
 <label class="wide">ملاحظة<input class="field" name="note" maxlength="200" placeholder="مثلاً: رسوم إقامة الدعوى، تبليغ الخصم بالنشر…"></label>
 <div class="wide toolbar"><button class="btn pri">حفظ المصروف</button><button type="button" class="btn" data-act="close">إلغاء</button></div></form></div></div>`};
document.addEventListener('submit',ev=>{const f=ev.target;if(!f||f.id!=='fXp')return;ev.preventDefault();const c=C(S.clientId);if(!c)return;
 const amount=Math.round(Number(f.amount.value)*100)/100;if(!(amount>0))return toast('أدخل المبلغ');
 (c.expenses=c.expenses||[]).push({id:'x'+Date.now().toString(36),k:f.k.value||'',type:f.type.value,amount,date:f.date.value||iso(TODAY),by:f.by.value==='client'?'client':'office',rc:f.rc.value.trim(),note:f.note.value.trim(),at:new Date().toISOString(),user:window.MQ&&MQ.user?MQ.user.username:''});
 if(window.MQ&&MQ.saveState)MQ.saveState();A.close();render();toast('سُجّل المصروف '+mny(amount))},true);
A.xpBack=v=>{const [cid,id]=String(v).split('|'),c=C(cid),x=list(c).find(y=>y.id===id);if(!x||!can())return;
 if(x.back){if(!confirm('إلغاء تسجيل استرداد هذا المصروف؟'))return;delete x.back}else{const d=prompt('تاريخ الاسترداد من الموكل:',iso(TODAY));if(d===null)return;x.back=/^\d{4}-\d{2}-\d{2}$/.test(d)?d:iso(TODAY)}
 if(window.MQ&&MQ.saveState)MQ.saveState();render()};
A.xpDel=v=>{const [cid,id]=String(v).split('|'),c=C(cid);if(!c||!can())return;const x=list(c).find(y=>y.id===id);if(!x||!confirm('حذف مصروف «'+x.type+'» بمبلغ '+mny(x.amount)+'؟'))return;
 c.expenses=list(c).filter(y=>y.id!==id);if(window.MQ&&MQ.saveState)MQ.saveState();render();toast('حُذف المصروف')};

const css=document.createElement('style');css.textContent=`
.xp-wrap{margin-top:16px}.xp h2 small{font-size:12px;color:var(--muted,#6b7280);font-weight:500}
.xp-sum{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:10px}.xp-sum>div{border:1px solid var(--line,#e5dccb);border-radius:12px;padding:8px 10px;background:var(--panel,#FBF6EA)}
.xp-sum small{display:block;color:var(--muted,#6b7280);font-size:12px}.xp-sum b{font-size:16px}.xp-sum .due{border-color:#F0D49A;background:#FFF8EB}.xp-sum .due b{color:var(--warn,#B45309)}
.xp-t td,.xp-t th{white-space:nowrap}.xp-t td:nth-child(3){white-space:normal}.xp-a .link{font-size:12.5px}`;
document.head.appendChild(css);
})();
