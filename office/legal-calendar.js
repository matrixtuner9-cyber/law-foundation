/* ── التقويم القضائي للمكتب: أيام الراحة الأسبوعية، والعطل الرسمية المعتمدة، والعطلة القضائية ──
   يُستعمل في كل حساب ميعاد (النماذج القانونية، عقل القانون، مهل الطعن بعد الحكم، شاشة الجلسات والمهل).
   قاعدة السلامة المهنية: لا يُمدَّد ميعاد تلقائياً. يُعرض آخر يوم بحسب العدّ — وهو الذي يُسجَّل في مواعيد القضية —
   فإن صادف عطلة يُذكر اسمها واليوم الذي يمتد إليه لو ثبتت رسمياً، مع التوصية بالتقديم قبلها. العطل المقترحة (هجرية وميلادية)
   لا تُعتمد إلا بعد أن يقرّها مدير المكتب من الإعدادات بحسب قرار مجلس الوزراء أو مجلس القضاء الأعلى لكل سنة. */
(function(){
'use strict';
const h=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DAYS=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const CAL={rest:[5],holidays:[],recess:[]};let loaded=false,loading=null;
const isoOf=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const parse=s=>{const m=/^(\d{4})-(\d\d)-(\d\d)/.exec(String(s||''));return m?new Date(+m[1],+m[2]-1,+m[3]):null};
const dm=s=>{const d=parse(s);return d?DAYS[d.getDay()]+' '+d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear():s};
function load(force){if(loading&&!force)return loading;loading=fetch('/api/admin/calendar',{credentials:'same-origin'}).then(r=>r.ok?r.json():null).then(j=>{if(j){CAL.rest=Array.isArray(j.rest)?j.rest:[5];CAL.holidays=j.holidays||[];CAL.recess=j.recess||[]}loaded=true;return CAL}).catch(()=>{loaded=true;return CAL});return loading}
/* حالة يوم: راحة أسبوعية، عطلة معتمدة، داخل العطلة القضائية */
function check(iso){const d=parse(iso);if(!d)return null;const s=isoOf(d);
 const hol=CAL.holidays.find(x=>x.date===s),rec=CAL.recess.find(r=>r.from&&r.to&&s>=r.from&&s<=r.to);
 return {iso:s,weekly:CAL.rest.includes(d.getDay())?DAYS[d.getDay()]:'',holiday:hol?hol.name:'',recess:rec?(rec.note||'العطلة القضائية'):'',off:CAL.rest.includes(d.getDay())||!!hol}}
function nextWork(iso){const d=parse(iso);if(!d)return null;let n=0;for(;n<30;n++){const c=check(isoOf(d));if(!c.off)break;d.setDate(d.getDate()+1)}return isoOf(d)}
/* ميعاد بالأيام من تاريخ (لا يُحسب يومه): آخر يوم بحسب العدّ، وما يطرأ عليه */
function due(base,days){const d=parse(base);if(!d||!days)return null;d.setDate(d.getDate()+Number(days));const end=isoOf(d),c=check(end);
 return {end,check:c,ext:c&&c.off?nextWork(end):null}}
/* ملاحظة جاهزة تُلحق بأي عرض لميعاد */
function note(end){const c=check(end);if(!c)return '';const parts=[];
 if(c.off){const why=c.holiday?('عطلة «'+c.holiday+'»'):('يوم '+c.weekly+' (راحة أسبوعية)');const ext=nextWork(end);
  parts.push(`<span class="cal-n off">⚠ آخر يوم يصادف ${h(why)}. إن ثبتت العطلة رسمياً يمتد الميعاد إلى أول يوم عمل: <b>${h(dm(ext))}</b> — والأحوط التقديم قبل ${h(dm(end))}.</span>`)}
 if(c.recess)parts.push(`<span class="cal-n rec">◷ يقع داخل ${h(c.recess)}: تحقّق من أثرها على هذا الميعاد قبل الاعتماد عليها؛ الأصل أن المواعيد لا تقف إلا بنص.</span>`);
 if(!loaded)parts.push('<span class="cal-n m">لم يُحمَّل تقويم المكتب بعد.</span>');
 else if(!CAL.holidays.length)parts.push('<span class="cal-n m">لم تُعتمد عطل رسمية في تقويم المكتب بعد (الإعدادات ← التقويم القضائي)؛ فُحصت الراحة الأسبوعية فقط.</span>');
 return parts.length?`<div class="cal-nb">${parts.join('')}</div>`:''}
/* عطل مقترحة لسنة: ميلادية ثابتة، وهجرية محسوبة بتقويم أم القرى — تقديرية تُراجع بقرار رسمي */
function suggest(year){const out=[],add=(date,name,kind)=>{if(!out.some(x=>x.date===date&&x.name===name))out.push({date,name,kind})};
 for(const [md,n] of [['01-01','رأس السنة الميلادية'],['01-07','عيد الميلاد المجيد (التقويم الشرقي)'],['05-01','عيد العمال'],['11-15','ذكرى إعلان الاستقلال'],['12-25','عيد الميلاد المجيد']])add(year+'-'+md,n,'ميلادي');
 let f;try{f=new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn',{day:'numeric',month:'numeric',year:'numeric'})}catch(e){return out}
 const d=new Date(year,0,1);while(d.getFullYear()===year){const p={};for(const x of f.formatToParts(d))p[x.type]=x.value;const m=+p.month,dd=+p.day,s=isoOf(d);
  if(m===10&&dd<=3)add(s,'عيد الفطر ('+dd+')','هجري');else if(m===12&&dd>=10&&dd<=13)add(s,'عيد الأضحى ('+(dd-9)+')','هجري');else if(m===12&&dd===9)add(s,'يوم عرفة','هجري');
  else if(m===1&&dd===1)add(s,'رأس السنة الهجرية','هجري');else if(m===3&&dd===12)add(s,'المولد النبوي الشريف','هجري');else if(m===7&&dd===27)add(s,'الإسراء والمعراج','هجري');
  d.setDate(d.getDate()+1)}
 return out.sort((a,b)=>a.date.localeCompare(b.date))}
async function save(){const r=await fetch('/api/admin/calendar',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify(CAL)});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'تعذّر الحفظ');Object.assign(CAL,j);return CAL}
window.MQ_CAL={CAL,load,check,due,note,nextWork,suggest,save,dm};
load();

/* ── الإعدادات: قسم «التقويم القضائي» ── */
if(typeof V==='undefined'||typeof A==='undefined')return;
const can=w=>typeof window.MQ_can==='function'?window.MQ_can(w):true;
let yr=new Date().getFullYear(),sug=null;
const vs=V.settings;
V.settings=function(){const html=vs.apply(this,arguments);const mine=CAL.holidays.filter(x=>x.date.startsWith(String(yr))).sort((a,b)=>a.date.localeCompare(b.date)),ed=can('manage');
 const s=sug?sug.filter(x=>!CAL.holidays.some(y=>y.date===x.date)):null;
 return html+`<section class="panel cal-set" style="margin-top:16px" id="calSet"><header><h2>التقويم القضائي</h2></header><div class="bd">
 <p class="m">يُفحص به كل ميعاد يحسبه النظام. لا يُمدَّد ميعاد تلقائياً: يُسجَّل آخر يوم بحسب العدّ، ويُنبَّه إن صادف عطلة أو العطلة القضائية مع اليوم الذي يمتد إليه لو ثبتت العطلة رسمياً.</p>
 <div class="cal-row"><b>الراحة الأسبوعية:</b>${[5,6,0].map(i=>`<label class="cal-ck"><input type="checkbox" data-calrest="${i}" ${CAL.rest.includes(i)?'checked':''} ${ed?'':'disabled'}> ${DAYS[i]}</label>`).join('')}</div>
 <div class="cal-row"><b>العطل الرسمية المعتمدة لسنة</b><button type="button" class="btn sm" data-act="calYr" data-v="-1">‹</button><b class="mono">${yr}</b><button type="button" class="btn sm" data-act="calYr" data-v="1">›</button>${ed?`<button type="button" class="btn sm" data-act="calSug">اقتراح عطل ${yr}</button>`:''}</div>
 <table class="tbl cal-t"><tbody>${mine.map(x=>`<tr><td class="mono">${h(dm(x.date))}</td><td>${h(x.name)}</td><td>${ed?`<button type="button" class="btn sm" data-act="calDel" data-v="${h(x.date)}|${h(x.name)}">حذف</button>`:''}</td></tr>`).join('')||'<tr><td class="m">لا عطل معتمدة لهذه السنة.</td></tr>'}</tbody></table>
 ${s?`<div class="cal-sug"><p><b>عطل مقترحة لسنة ${yr}</b> — التواريخ الهجرية محسوبة بتقويم أم القرى وقد تختلف يوماً بحسب ثبوت الهلال؛ اعتمد ما أقرّه مجلس الوزراء أو مجلس القضاء الأعلى فقط.</p>${s.map((x,i)=>`<label class="cal-ck"><input type="checkbox" data-calsug="${i}" checked> <span class="mono">${h(dm(x.date))}</span> ${h(x.name)}</label>`).join('')}<div><button type="button" class="btn pri sm" data-act="calSugOk">اعتماد المحدد</button> <button type="button" class="btn sm" data-act="calSugNo">إلغاء</button></div></div>`:''}
 ${ed?`<div class="cal-row"><input type="date" class="field" id="calD" style="max-width:170px"><input class="field" id="calN" placeholder="اسم العطلة (مثلاً: عطلة بقرار مجلس الوزراء)" style="max-width:300px"><button type="button" class="btn sm" data-act="calAdd">إضافة عطلة</button></div>`:''}
 <div class="cal-row"><b>العطلة القضائية:</b>${CAL.recess.map((r,i)=>`<span class="cal-rc">${h(dm(r.from))} ← ${h(dm(r.to))}${r.note?' · '+h(r.note):''}${ed?` <button type="button" class="btn sm" data-act="calRecDel" data-v="${i}">×</button>`:''}</span>`).join('')||'<span class="m">غير محددة</span>'}</div>
 ${ed?`<div class="cal-row"><input type="date" class="field" id="calRF" style="max-width:170px"><span>إلى</span><input type="date" class="field" id="calRT" style="max-width:170px"><input class="field" id="calRN" placeholder="المرجع (قرار مجلس القضاء الأعلى…)" style="max-width:260px"><button type="button" class="btn sm" data-act="calRecAdd">إضافة</button></div>`:''}
 </div></section>`};
const rer=()=>{if(S.view==='settings')render()};
const persist=async()=>{try{await save();toast('حُفظ التقويم القضائي')}catch(e){toast(e.message)}rer()};
A.calYr=v=>{yr+=Number(v);sug=null;rer()};
A.calSug=()=>{sug=suggest(yr);rer()};A.calSugNo=()=>{sug=null;rer()};
A.calSugOk=()=>{const s=sug.filter(x=>!CAL.holidays.some(y=>y.date===x.date));document.querySelectorAll('[data-calsug]').forEach(c=>{if(c.checked){const x=s[+c.dataset.calsug];if(x)CAL.holidays.push({date:x.date,name:x.name})}});sug=null;persist()};
A.calAdd=()=>{const d=(document.getElementById('calD')||{}).value,n=((document.getElementById('calN')||{}).value||'').trim();if(!d||!n)return toast('أدخل التاريخ واسم العطلة');CAL.holidays.push({date:d,name:n});persist()};
A.calDel=v=>{const [d,...n]=String(v).split('|');const i=CAL.holidays.findIndex(x=>x.date===d&&x.name===n.join('|'));if(i>=0)CAL.holidays.splice(i,1);persist()};
A.calRecAdd=()=>{const f=(document.getElementById('calRF')||{}).value,t=(document.getElementById('calRT')||{}).value,n=((document.getElementById('calRN')||{}).value||'').trim();if(!f||!t||t<f)return toast('أدخل بداية العطلة القضائية ونهايتها');CAL.recess.push({from:f,to:t,note:n});persist()};
A.calRecDel=v=>{CAL.recess.splice(Number(v),1);persist()};
document.addEventListener('change',e=>{const t=e.target;if(!t||!t.dataset||t.dataset.calrest==null)return;const i=+t.dataset.calrest;CAL.rest=CAL.rest.filter(x=>x!==i);if(t.checked)CAL.rest.push(i);persist()});

/* ── شاشة الجلسات والمهل: ما يقع منها في عطلة أو في العطلة القضائية ── */
const va=V.agenda;
if(va)V.agenda=function(){const html=va.apply(this,arguments);if(!loaded)return html;const today=isoOf(new Date());
 const items=[...(typeof deadlines!=='undefined'?deadlines:[]).filter(x=>x.due&&!x.done).map(x=>({d:x.due,t:x.title||'مهلة',k:x.k,kind:'مهلة'})),...(typeof hearings!=='undefined'?hearings:[]).filter(x=>x.date).map(x=>({d:x.date,t:x.purpose||'جلسة',k:x.k,kind:'جلسة'}))]
  .filter(x=>x.d>=today).map(x=>({...x,c:check(x.d)})).filter(x=>x.c&&(x.c.off||x.c.recess)).sort((a,b)=>a.d.localeCompare(b.d)).slice(0,12);
 if(!items.length)return html;
 return `<section class="panel cal-warn"><header><h2>⚠ مواعيد تقع في عطلة أو في العطلة القضائية <small>${items.length}</small></h2></header><div class="bd">${items.map(x=>{const k=typeof K==='function'?K(x.k):null;return `<div class="cal-wi"><b class="mono">${h(dm(x.d))}</b><span>${h(x.kind)}: ${h(x.t)}${k?` <small>(${h(k.no||'')})</small>`:''}</span><em>${h(x.c.holiday||(x.c.weekly?'راحة '+x.c.weekly:'')||x.c.recess)}</em></div>`}).join('')}<p class="m">المهلة التي يصادف آخر يومها عطلة: سُجّل آخر يوم بحسب العدّ؛ قدّم قبله ما لم تتحقق من الامتداد.</p></div></section>`+html};
if(va&&va._grp)V.agenda._grp=1;
load().then(()=>{if(S&&(S.view==='agenda'||S.view==='settings'))render()});

const css=document.createElement('style');css.textContent=`.cal-nb{display:flex;flex-direction:column;gap:4px;margin-top:6px}.cal-n{display:block;font-size:12.5px;line-height:1.7;padding:6px 10px;border-radius:9px}.cal-n.off{background:#FFF4E5;color:#7A4A07;border:1px solid #E9C27A}.cal-n.rec{background:#EAF2FB;color:#24476B;border:1px solid #B9D0EA}.cal-n.m{color:#7A6A45;padding:2px 0}
.cal-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:10px 0}.cal-ck{display:inline-flex;align-items:center;gap:5px;font-size:13px;margin-inline-end:10px}.cal-t td{padding:5px 8px}.cal-sug{background:#FBF6EA;border:1px solid #E4D3A6;border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:4px}.cal-sug p{margin:0 0 6px;font-size:13px}
.cal-rc{background:#EAF2FB;border-radius:9px;padding:4px 10px;font-size:13px}.cal-warn{border:1px solid #E9C27A;margin-bottom:12px}.cal-warn h2{color:#7A4A07}.cal-wi{display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:6px 0;border-bottom:1px dashed #EADBB4}.cal-wi em{font-style:normal;margin-inline-start:auto;background:#FFF4E5;color:#7A4A07;border-radius:99px;padding:2px 10px;font-size:12px}`;document.head.appendChild(css);
})();
