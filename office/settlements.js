/* ── التسويات والأقساط ── اتفاقيات تسوية الذمة وتقسيط المبالغ التي يلتزم بها الخصم للموكل بحضور المحامي.
   تُحفظ على سجل القضية نفسه (k.settles) فتنتقل مع القضية وتُحفظ وتُزامَن بآلية الحفظ المعتادة، وتظهر في حقيبة الموكل. */
(function(root){
'use strict';

/* ── الحساب (دوال خالصة، تُختبر في tests/settlements.test.js) ── */
const r2=n=>Math.round((Number(n)||0)*100)/100;
const pad=n=>String(n).padStart(2,'0');
const parse=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(s||''));return m?{y:+m[1],m:+m[2],d:+m[3]}:null};
const daysIn=(y,m)=>new Date(y,m,0).getDate();
/* إضافة أشهر مع الحفاظ على اليوم، وإن لم يوجد في الشهر الهدف فآخر يوم فيه (31 يناير + شهر = 28/29 فبراير) */
function addMonths(iso,n){const p=parse(iso);if(!p)return '';let t=p.m-1+n,y=p.y+Math.floor(t/12),m=((t%12)+12)%12+1;const d=Math.min(p.d,daysIn(y,m));return y+'-'+pad(m)+'-'+pad(d)}
/* جدول الأقساط: دفعة أولى اختيارية تستحق عند توقيع الاتفاقية، ثم n قسطاً متساوياً بفاصل step أشهر، والباقي الكسري في القسط الأخير */
function schedule(o){
 const total=r2(o.total),down=Math.min(total,Math.max(0,r2(o.down))),n=Math.max(1,Math.min(240,Math.floor(+o.n||1))),step=Math.max(1,Math.floor(+o.step||1));
 const rest=r2(total-down),base=Math.floor(rest/n*100)/100,out=[];
 if(down>0)out.push({id:'i0',due:o.date||o.first,amount:down,paid:0,label:'الدفعة الأولى'});
 if(rest>0)for(let i=0;i<n;i++){const amt=i===n-1?r2(rest-base*(n-1)):base;out.push({id:'i'+(i+1),due:addMonths(o.first,i*step),amount:amt,paid:0,label:'القسط '+(i+1)})}
 return out;
}
const paidOf=x=>r2(Math.min(x.amount,x.paid||0));
/* حالة القسط: paid مسدد، part مسدد جزئياً، late متأخر، due مستحق اليوم، wait قادم */
function instState(x,today){if(r2(x.paid)>=r2(x.amount))return 'paid';const late=x.due&&x.due<today;if(late)return 'late';if(x.due===today)return 'due';return r2(x.paid)>0?'part':'wait'}
function summary(ag,today){
 const ins=ag.installments||[],total=r2(ins.reduce((a,x)=>a+x.amount,0)),paid=r2(ins.reduce((a,x)=>a+paidOf(x),0)),rem=r2(total-paid);
 const late=ins.filter(x=>instState(x,today)==='late'),lateAmt=r2(late.reduce((a,x)=>a+(x.amount-paidOf(x)),0));
 const next=ins.filter(x=>r2(x.paid)<r2(x.amount)&&x.due>=today).sort((a,b)=>a.due.localeCompare(b.due))[0]||null;
 const status=!ins.length?'empty':rem<=0?'done':late.length?'late':'active';
 /* شرط حلول الأقساط: تخلّف عن عدد الأقساط المحدد يجعل الباقي كله مستحقاً */
 const accel=ag.accel&&+ag.accelN>0&&late.length>=+ag.accelN&&rem>0;
 return {total,paid,rem,late:late.length,lateAmt,next,status,accel,pct:total?Math.round(paid/total*100):0};
}
function addPayment(inst,amt,on,note){
 const a=r2(amt);if(!(a>0))return {ok:false,err:'المبلغ غير صالح'};
 const left=r2(inst.amount-(inst.paid||0));if(a>left+0.005)return {ok:false,err:'المبلغ أكبر من المتبقي من القسط ('+left+')'};
 inst.paid=r2((inst.paid||0)+a);inst.pays=(inst.pays||[]);inst.pays.push({on,amt:a,note:note||''});return {ok:true};
}
const calc={r2,addMonths,schedule,instState,summary,addPayment};
if(typeof module!=='undefined'&&module.exports)module.exports=calc;
if(typeof document==='undefined'||typeof A==='undefined')return;

/* ── الواجهة ── */
const e=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const can2=w=>!!(root.MQ&&MQ.user&&({admin:{write:1,manage:1},lawyer:{write:1}}[MQ.user.role]||{})[w]);
const ro=()=>{if(root.MQ&&MQ.readOnly){toast('صلاحيتك للاطلاع فقط');return true}return false};
const num=n=>Number(n||0).toLocaleString('en-US',{maximumFractionDigits:2});
const CUR={'₪':'شيكل','JOD':'دينار أردني','USD':'دولار أمريكي'};
const cm=(n,c)=>num(n)+' '+(c||'₪');
const today=()=>iso(TODAY);
const save=()=>{if(root.MQ&&MQ.saveState)MQ.saveState()};
const kOf=id=>cases.find(x=>x.id===id);
const agsOf=c=>cases.filter(k=>k.client===c).flatMap(k=>(k.settles||[]).map(a=>({a,k})));
const SL={paid:['مسدد','ok'],part:['جزئي','warn'],late:['متأخر','bad'],due:['يستحق اليوم','warn'],wait:['قادم','']};
const ST={done:['منتهية: سُدّد المبلغ كاملاً','ok'],late:['متعثرة: أقساط متأخرة','bad'],active:['سارية','acc'],empty:['بلا أقساط','']};

/* عدد الأقساط المتأخرة لموكل (يظهر على تبويب الحقيبة) */
const lateOf=c=>agsOf(c).reduce((n,x)=>n+summary(x.a,today()).late,0);

/* محتوى تبويب «التسويات والأقساط» في حقيبة الموكل */
function body(c,ks){
 const list=agsOf(c.id),w=can2('write'),t=today();
 const sums=list.map(x=>({...x,s:summary(x.a,t)}));
 const tot=sums.reduce((a,x)=>{const k=x.a.cur||'₪';(a[k]=a[k]||{total:0,paid:0,rem:0,late:0});a[k].total+=x.s.total;a[k].paid+=x.s.paid;a[k].rem+=x.s.rem;a[k].lateAmt=(a[k].lateAmt||0)+x.s.lateAmt;return a},{});
 const head=`<div class="st-top"><div><h2>التسويات والأقساط</h2><p class="m">اتفاقيات تسوية الذمة وتقسيط المبالغ المستحقة للموكل على الخصم، وجدول السداد ومتابعة كل دفعة.</p></div>${w&&ks.length?`<button class="btn pri" data-act="stNew">+ اتفاقية تسوية جديدة</button>`:''}</div>`;
 if(!ks.length)return `<section class="panel st-empty"><div class="bd"><b>لا قضايا لهذا الموكل بعد.</b><p>تُسجَّل اتفاقية التسوية على قضية. أضف قضية للموكل أولاً.</p></div></section>`;
 if(!list.length)return head+`<section class="panel st-empty"><div class="bd"><b>لا اتفاقيات تسوية بعد.</b><p>عندما يتفق الموكل والخصم بحضور المحامي على تسديد مبلغ بدفعات، سجّل الاتفاقية هنا: المبلغ، والدفعة الأولى، وعدد الأقساط وتواريخها. يحسب النظام الجدول ويتابع المتأخر ويطبع نسخة للتوقيع.</p></div></section>`;
 const cards=Object.entries(tot).map(([cu,v])=>`<div class="st-stats"><div><b class="num">${cm(v.total,cu)}</b><span>إجمالي المتفق عليه</span></div><div class="ok"><b class="num">${cm(v.paid,cu)}</b><span>المحصّل</span></div><div><b class="num">${cm(v.rem,cu)}</b><span>المتبقي</span></div><div class="${v.lateAmt?'bad':''}"><b class="num">${cm(v.lateAmt||0,cu)}</b><span>متأخر الآن</span></div></div>`).join('');
 return head+cards+sums.map(x=>card(x.a,x.k,x.s,w,t)).join('');
}
function card(a,k,s,w,t){
 const st=ST[s.status]||ST.active,cu=a.cur||'₪';
 return `<section class="panel st-card"><header><div><h2>${e(a.title||'اتفاقية تسوية وتقسيط')}</h2><div class="m">قضية <span class="mono">${e(k.no)}</span> · ${e(k.subject||'')} · الخصم: <b>${e(a.debtor||'—')}</b></div></div><span class="pill ${st[1]}">${st[0]}</span></header>
 <div class="bd">
  <div class="st-meta"><span>تاريخ الاتفاقية <b>${dmy(a.date)}</b></span><span>الإجمالي <b class="num">${cm(s.total,cu)}</b></span><span>المحصّل <b class="num">${cm(s.paid,cu)}</b> (${s.pct}%)</span><span>المتبقي <b class="num">${cm(s.rem,cu)}</b></span>${s.next?`<span>القسط القادم <b>${dmy(s.next.due)}</b> · <b class="num">${cm(s.next.amount-(s.next.paid||0),cu)}</b></span>`:''}</div>
  <div class="st-bar" role="progressbar" aria-valuenow="${s.pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${s.pct}%"></i></div>
  ${s.accel?`<div class="st-warn">تحقق شرط حلول الأقساط: تأخّر الخصم عن ${a.accelN} أقساط أو أكثر، فيصير المتبقي (${cm(s.rem,cu)}) مستحقاً دفعة واحدة بحسب الاتفاقية.</div>`:''}
  <div class="st-tbl"><table class="tbl"><thead><tr><th>#</th><th>البند</th><th>الاستحقاق</th><th class="n">المبلغ</th><th class="n">المسدد</th><th>الحالة</th><th></th></tr></thead><tbody>
  ${(a.installments||[]).map((x,i)=>{const q=instState(x,t),l=SL[q];const left=r2(x.amount-(x.paid||0));
   return `<tr><td>${i+1}</td><td>${e(x.label||'')}</td><td>${dmy(x.due)}${q==='late'?` <small class="m">(${-diff(x.due)} يوماً)</small>`:''}</td><td class="n num">${num(x.amount)}</td><td class="n num">${num(x.paid||0)}</td><td><span class="pill ${l[1]}">${l[0]}</span></td><td class="st-act">${w&&left>0?`<button class="btn sm pri" data-act="stPay" data-v="${a.id}|${x.id}">تسجيل دفعة</button>`:''}${(x.pays||[]).length?`<button class="btn sm" data-act="stHist" data-v="${a.id}|${x.id}">السجل</button>`:''}${w?`<button class="btn sm" data-act="stInst" data-v="${a.id}|${x.id}">تعديل</button>`:''}</td></tr>`}).join('')}
  </tbody></table></div>
  ${a.terms?`<div class="st-terms"><b>شروط الاتفاقية</b><p>${e(a.terms).replace(/\n/g,'<br>')}</p></div>`:''}
  <div class="toolbar"><button class="btn sm" data-act="stPrint" data-v="${a.id}">طباعة جدول السداد</button><button class="btn sm" data-act="stSend" data-v="wa|${a.id}">إرسال واتساب</button><button class="btn sm" data-act="stSend" data-v="mail|${a.id}">إرسال بريد</button><button class="btn sm" data-act="stSend" data-v="copy|${a.id}">نسخ النص</button>${w?`<button class="btn sm" data-act="stEdit" data-v="${a.id}">تعديل الاتفاقية</button><button class="btn sm" data-act="stDel" data-v="${a.id}" style="color:var(--danger)">حذف</button>`:''}</div>
 </div></section>`;
}
const find=id=>{for(const k of cases){const a=(k.settles||[]).find(x=>x.id===id);if(a)return {a,k}}return null};
const modal=h=>{document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal st-modal" role="dialog">${h}</div></div>`};
const val=id=>{const el=document.getElementById(id);return el?el.value.trim():''};

/* نموذج اتفاقية جديدة / تعديل */
function form(ag,ks){
 const n=!ag,a=ag||{};
 const opts=ks.map(k=>`<option value="${k.id}" ${a.k===k.id||(!a.k&&ks[0]===k)?'selected':''}>${e(k.no)} · ${e(k.subject||'')}</option>`).join('');
 const k0=a.k?kOf(a.k):ks[0];
 return `<div class="head"><h1 style="font-size:22px">${n?'اتفاقية تسوية وتقسيط جديدة':'تعديل الاتفاقية'}</h1><button class="btn sm" data-act="close">إغلاق</button></div>
 <form id="stForm" class="st-form" onsubmit="return false">
  ${n?`<label class="wide">القضية<select class="field" id="stK">${opts}</select></label>`:''}
  <label>عنوان الاتفاقية<input class="field" id="stTitle" value="${e(a.title||'اتفاقية تسوية وتقسيط')}" maxlength="120"></label>
  <label>تاريخ الاتفاقية<input class="field" type="date" id="stDate" value="${e(a.date||today())}"></label>
  <label>الطرف الملتزم بالسداد (الخصم)<input class="field" id="stDebtor" value="${e(a.debtor||(k0?oppNames(k0):''))}" maxlength="160"></label>
  <label>بحضور<input class="field" id="stWit" value="${e(a.wit||((root.MQ&&MQ.settings&&MQ.settings.lawyerName)||''))}" placeholder="اسم المحامي أو الشهود" maxlength="200"></label>
  ${n?`<label>العملة<select class="field" id="stCur">${Object.entries(CUR).map(([c,t])=>`<option value="${c}">${c} · ${t}</option>`).join('')}</select></label>
  <label>إجمالي المبلغ المتفق عليه<input class="field" type="number" min="0" step="0.01" id="stTotal" required></label>
  <label>الدفعة الأولى عند التوقيع <small class="m">اختياري</small><input class="field" type="number" min="0" step="0.01" id="stDown" value="0"></label>
  <label>عدد الأقساط<input class="field" type="number" min="1" max="240" id="stN" value="6"></label>
  <label>تاريخ أول قسط<input class="field" type="date" id="stFirst" value="${addMonths(today(),1)}"></label>
  <label>الفاصل بين الأقساط<select class="field" id="stStep"><option value="1">شهري</option><option value="2">كل شهرين</option><option value="3">كل 3 أشهر</option><option value="6">كل 6 أشهر</option><option value="12">سنوي</option></select></label>
  <div class="wide m" id="stPrev"></div>`:''}
  <label class="wide ck"><input type="checkbox" id="stAccel" ${a.accel?'checked':''}> <span>شرط حلول الأقساط: يصير الباقي مستحقاً كاملاً عند التخلف عن <input class="field" type="number" min="1" max="12" id="stAccelN" value="${e(a.accelN||2)}" style="width:70px;display:inline-block"> أقساط</span></label>
  <label class="wide">شروط الاتفاقية وملاحظاتها<textarea class="field" id="stTerms" rows="3" maxlength="2000" placeholder="كيفية السداد (نقداً، تحويل، شيكات)، الكفالة، الفوائد أو الشرط الجزائي، أي التزام آخر…">${e(a.terms||'')}</textarea></label>
  <div class="wide toolbar"><button class="btn pri" id="stSave" type="button" data-act="stSave" data-v="${n?'':a.id}">${n?'إنشاء الاتفاقية وجدول السداد':'حفظ'}</button></div>
 </form>`;
}
A.stNew=()=>{if(ro())return;const ks=cases.filter(k=>k.client===S.clientId);if(!ks.length)return toast('لا قضايا لهذا الموكل');modal(form(null,ks));
 const upd=()=>{const t=+val('stTotal')||0,d=+val('stDown')||0,n=Math.max(1,+val('stN')||1),el=document.getElementById('stPrev');if(!el)return;
  if(!(t>0)){el.textContent='';return}if(d>t){el.textContent='الدفعة الأولى أكبر من الإجمالي';return}
  const rest=r2(t-d),per=Math.floor(rest/n*100)/100;el.innerHTML='القسط التقريبي: <b class="num">'+num(per)+'</b> × '+n+(d>0?' بعد دفعة أولى '+num(d):'')+(r2(rest-per*(n-1))!==per?' (القسط الأخير '+num(r2(rest-per*(n-1)))+')':'')};
 ['stTotal','stDown','stN'].forEach(i=>{const el=document.getElementById(i);if(el)el.oninput=upd})};
A.stEdit=v=>{if(ro())return;const f=find(v);if(!f)return;modal(form({...f.a,k:f.k.id},[f.k]))};
A.stSave=v=>{if(ro())return;
 const base={title:val('stTitle')||'اتفاقية تسوية وتقسيط',date:val('stDate')||today(),debtor:val('stDebtor'),wit:val('stWit'),accel:!!document.getElementById('stAccel').checked,accelN:Math.max(1,Math.min(12,+val('stAccelN')||2)),terms:val('stTerms')};
 if(v){const f=find(v);if(!f)return;Object.assign(f.a,base);save();A.close();render();toast('حُفظت الاتفاقية');return}
 const k=kOf(val('stK')),total=r2(val('stTotal')),down=r2(val('stDown')),n=+val('stN'),first=val('stFirst');
 if(!k)return toast('اختر القضية');if(!(total>0))return toast('أدخل إجمالي المبلغ');if(down>total)return toast('الدفعة الأولى أكبر من الإجمالي');if(!first)return toast('حدّد تاريخ أول قسط');
 if(!base.debtor)return toast('اكتب اسم الطرف الملتزم بالسداد');
 const ins=schedule({total,down,n,first,step:+val('stStep')||1,date:base.date});
 (k.settles=k.settles||[]).push({id:'s'+Date.now().toString(36),...base,cur:val('stCur')||'₪',installments:ins});
 save();A.close();S.bagTab='settle';render();toast('أُنشئت الاتفاقية وجدول السداد ('+ins.length+' دفعة)')};
A.stDel=v=>{if(ro())return;const f=find(v);if(!f)return;
 modal(`<div class="head"><h1 style="font-size:20px">حذف الاتفاقية؟</h1></div><p>سيُحذف جدول السداد وسجل الدفعات المسجلة في «${e(f.a.title)}». لا يمكن التراجع.</p><div class="toolbar"><button class="btn" style="color:var(--danger)" data-act="stDel2" data-v="${v}">حذف نهائياً</button><button class="btn" data-act="close">إلغاء</button></div>`)};
A.stDel2=v=>{const f=find(v);if(!f)return;f.k.settles=f.k.settles.filter(x=>x.id!==v);save();A.close();render();toast('حُذفت الاتفاقية')};
/* تسجيل دفعة على قسط */
A.stPay=v=>{if(ro())return;const [aid,iid]=v.split('|'),f=find(aid);if(!f)return;const x=f.a.installments.find(i=>i.id===iid);if(!x)return;const left=r2(x.amount-(x.paid||0));
 modal(`<div class="head"><h1 style="font-size:20px">تسجيل دفعة · ${e(x.label||'')}</h1><button class="btn sm" data-act="close">إغلاق</button></div>
 <p class="m">المتبقي من هذا القسط: <b class="num">${cm(left,f.a.cur)}</b> · الاستحقاق ${dmy(x.due)}</p>
 <form class="st-form" onsubmit="return false"><label>المبلغ المدفوع<input class="field" type="number" min="0" step="0.01" max="${left}" id="spA" value="${left}"></label><label>تاريخ الدفع<input class="field" type="date" id="spD" value="${today()}"></label>
 <label class="wide">طريقة الدفع / ملاحظة<input class="field" id="spN" placeholder="نقداً، تحويل بنكي، شيك رقم…" maxlength="160"></label>
 <div class="wide toolbar"><button class="btn pri" type="button" data-act="stPay2" data-v="${v}">تسجيل الدفعة</button></div></form>`)};
A.stPay2=v=>{if(ro())return;const [aid,iid]=v.split('|'),f=find(aid);if(!f)return;const x=f.a.installments.find(i=>i.id===iid);if(!x)return;
 const r=addPayment(x,val('spA'),val('spD')||today(),val('spN'));if(!r.ok)return toast(r.err);save();A.close();render();toast('سُجّلت الدفعة')};
A.stHist=v=>{const [aid,iid]=v.split('|'),f=find(aid);if(!f)return;const x=f.a.installments.find(i=>i.id===iid);if(!x)return;
 modal(`<div class="head"><h1 style="font-size:20px">سجل دفعات · ${e(x.label||'')}</h1><button class="btn sm" data-act="close">إغلاق</button></div><table class="tbl"><thead><tr><th>التاريخ</th><th class="n">المبلغ</th><th>ملاحظة</th></tr></thead><tbody>${(x.pays||[]).map(p=>`<tr><td>${dmy(p.on)}</td><td class="n num">${num(p.amt)}</td><td>${e(p.note||'')}</td></tr>`).join('')}</tbody></table>`)};
/* تعديل قسط (الاستحقاق والمبلغ) أو حذفه */
A.stInst=v=>{if(ro())return;const [aid,iid]=v.split('|'),f=find(aid);if(!f)return;const x=f.a.installments.find(i=>i.id===iid);if(!x)return;
 modal(`<div class="head"><h1 style="font-size:20px">تعديل ${e(x.label||'القسط')}</h1><button class="btn sm" data-act="close">إغلاق</button></div>
 <form class="st-form" onsubmit="return false"><label>تاريخ الاستحقاق<input class="field" type="date" id="siD" value="${e(x.due)}"></label><label>المبلغ<input class="field" type="number" min="0" step="0.01" id="siA" value="${x.amount}"></label>
 <p class="wide m">المسدد حتى الآن: <b class="num">${num(x.paid||0)}</b>. لا يقل المبلغ عنه.</p>
 <div class="wide toolbar"><button class="btn pri" type="button" data-act="stInst2" data-v="${v}">حفظ</button>${(x.paid||0)?'':`<button class="btn" type="button" style="color:var(--danger)" data-act="stInstDel" data-v="${v}">حذف القسط</button>`}</div></form>`)};
A.stInst2=v=>{if(ro())return;const [aid,iid]=v.split('|'),f=find(aid);if(!f)return;const x=f.a.installments.find(i=>i.id===iid);if(!x)return;
 const amt=r2(val('siA')),d=val('siD');if(!(amt>0))return toast('المبلغ غير صالح');if(amt<r2(x.paid||0))return toast('المبلغ أقل من المسدد');if(!d)return toast('حدّد الاستحقاق');
 x.amount=amt;x.due=d;f.a.installments.sort((p,q)=>p.due.localeCompare(q.due));save();A.close();render();toast('حُفظ القسط')};
A.stInstDel=v=>{if(ro())return;const [aid,iid]=v.split('|'),f=find(aid);if(!f)return;f.a.installments=f.a.installments.filter(i=>i.id!==iid);save();A.close();render();toast('حُذف القسط')};
/* طباعة جدول السداد للتوقيع */
A.stPrint=v=>{const f=find(v);if(!f||!root.MQP)return;const M=MQP,B=M.B,E=M.esc,a=f.a,k=f.k,s=summary(a,today()),cu=a.cur||'₪',cl=C(k.client)||{};
 const blocks=[B.kv([['الموكل (الدائن)',E(cl.name||'')],['الطرف الملتزم (المدين)',E(a.debtor||'')],['القضية','<span class="mono">'+E(k.no)+'</span> · '+E(k.subject||'')],['تاريخ الاتفاقية',dmy(a.date)],a.wit?['بحضور',E(a.wit)]:null],2),
  B.stats([['إجمالي المبلغ',cm(s.total,cu)],['المسدد',cm(s.paid,cu)],['المتبقي',cm(s.rem,cu)]]),
  B.h('جدول السداد'),
  B.t(['#','البند','تاريخ الاستحقاق','المبلغ','المسدد','الحالة'],(a.installments||[]).map((x,i)=>[i+1,E(x.label||''),dmy(x.due),num(x.amount),num(x.paid||0),SL[instState(x,today())][0]]),{w:['5%','20%','22%','18%','18%','17%'],num:[3,4]})];
 if(a.accel)blocks.push(B.box('<b>شرط حلول الأقساط:</b> عند التخلف عن سداد '+a.accelN+' أقساط أو أكثر يصير المبلغ المتبقي كله مستحق الأداء فوراً.'));
 if(a.terms)blocks.push(B.box('<b>شروط الاتفاقية:</b><br>'+E(a.terms).replace(/\n/g,'<br>')));
 blocks.push(B.p('<small>يُلتزم بسداد كل قسط في موعده. هذه نسخة من جدول السداد المتفق عليه، وتُسجَّل الدفعات فور استلامها.</small>','s'));
 M.open({label:'جدول سداد اتفاقية تسوية',build(){return {title:a.title||'جدول سداد اتفاقية تسوية',sub:'قضية رقم '+k.no,ref:'تس/'+k.no,file:'جدول سداد - '+k.no,orient:'port',blocks,sign:['الدائن (الموكل)','المدين','المحامي']}}})};
/* رسالة للموكل: واتساب / بريد / نسخ */
function msgText(f){const a=f.a,k=f.k,s=summary(a,today()),cu=a.cur||'₪',cl=C(k.client)||{},nx=(a.installments||[]).filter(x=>instState(x,today())!=='paid').sort((p,q)=>p.due.localeCompare(q.due));
 const L=['السيد/ة '+(cl.name||'')+' المحترم/ة،','تحية طيبة، بخصوص اتفاقية التسوية في القضية رقم '+k.no+(a.debtor?' (الطرف الملتزم: '+a.debtor+')':'')+':','','إجمالي المبلغ: '+cm(s.total,cu),'المسدّد حتى الآن: '+cm(s.paid,cu),'المتبقي: '+cm(s.rem,cu)];
 if(nx.length){L.push('','الأقساط القادمة:');nx.slice(0,4).forEach(x=>L.push('• '+dmy(x.due)+' — '+cm(Math.max(0,x.amount-(x.paid||0)),cu)))}
 L.push('','مكتب المحاماة');return L.join('\n')}
A.stSend=v=>{const [how,id]=v.split('|'),f=find(id);if(!f)return;const cl=C(f.k.client)||{},txt=msgText(f),sub='اتفاقية التسوية - قضية '+f.k.no;
 if(how==='copy'){(navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>toast('نُسخ نص الرسالة')).catch(()=>toast('تعذّر النسخ'));return}
 const a=document.createElement('a');a.target='_blank';a.rel='noopener';
 if(how==='wa'){let d=String(cl.whatsapp||cl.phone||'').replace(/\D/g,'');if(d.startsWith('00'))d=d.slice(2);else if(d.startsWith('0'))d='970'+d.slice(1);a.href='https://wa.me/'+(d.length>=11?d:'')+'?text='+encodeURIComponent(txt);if(d.length<11)toast('لا رقم واتساب للموكل؛ اختر جهة الاتصال في واتساب')}
 else{if(!cl.email)toast('لا بريد إلكتروني مسجّل للموكل؛ أضفه من «تعديل البيانات»');a.href='mailto:'+encodeURIComponent(cl.email||'')+'?subject='+encodeURIComponent(sub)+'&body='+encodeURIComponent(txt)}
 document.body.appendChild(a);a.click();a.remove()};

root.MQ_settle={body,lateOf,count:c=>agsOf(c).length,calc};
}(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:this)));
