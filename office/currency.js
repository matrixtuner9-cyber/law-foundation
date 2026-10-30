/* ── عملة الأتعاب ──
   الأتعاب في فلسطين تُتفق بالشيكل أو الدينار الأردني أو الدولار. لكل موكل عملة أتعاب (c.cur، الافتراضي الشيكل)،
   وكل دفعة تحمل عملتها (p.cur، الافتراضي عملة الموكل)، وكل مصروف قضية عملته (x.cur، الافتراضي الشيكل).
   لا تحويل بين العملات أبداً: المجاميع تُعرض لكل عملة على حدة، لأن سعر الصرف يوم الدفع ليس قراراً يتخذه البرنامج. */
(function(root){
'use strict';
const LIST=[['ILS','₪','شيكل'],['JOD','د.أ','دينار أردني'],['USD','$','دولار أمريكي']];
const norm=c=>{c=String(c||'').trim();if(!c||c==='₪'||/شيكل|ILS|NIS/i.test(c))return 'ILS';if(/JOD|دينار/i.test(c))return 'JOD';if(/USD|\$|دولار/i.test(c))return 'USD';return 'ILS'};
const row=c=>LIST.find(x=>x[0]===norm(c))||LIST[0];
const num=n=>Number(n||0).toLocaleString('en-US');
const CUR={
 LIST,norm,
 of:c=>norm(c&&c.cur),                         /* عملة أتعاب الموكل */
 sym:c=>row(c)[1],name:c=>row(c)[2],
 fmt:(n,c)=>num(n)+' '+row(c)[1],               /* 8,000 د.أ */
 words:(n,c)=>root.MQTOOLS&&MQTOOLS.tafqeet?MQTOOLS.tafqeet(n,norm(c)):'',
 /* مجاميع حسب العملة: [{cur,fee,paid,due}] لكل عملة فيها أتعاب */
 totals:(cs,fee=c=>+c.fee||0,paid=c=>+c.paid||0)=>{const m={};for(const c of cs){const k=norm(c.cur);const t=(m[k]=m[k]||{cur:k,fee:0,paid:0,due:0});t.fee+=fee(c);t.paid+=paid(c);t.due+=fee(c)-paid(c)}return LIST.map(x=>m[x[0]]).filter(Boolean)},
 /* «60,500 ₪ · 8,000 د.أ» */
 join:(ts,key,sep)=>{const nz=ts.filter(t=>t[key]);return nz.length?nz.map(t=>CUR.fmt(t[key],t.cur)).join(sep||' · '):CUR.fmt(0,(ts[0]||{}).cur||'ILS')},
 select:(id,val,label)=>`<label>${label||'العملة'}<select class="field" id="${id}">${LIST.map(([k,s,n])=>`<option value="${k}" ${norm(val)===k?'selected':''}>${n} (${s})</option>`).join('')}</select></label>`
};
root.MQ_CUR=CUR;
if(typeof module!=='undefined'&&module.exports)module.exports=CUR;
})(typeof window!=='undefined'?window:globalThis);
