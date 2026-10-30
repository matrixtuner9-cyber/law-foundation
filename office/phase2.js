/* ── المرحلة الثانية: تصنيف القضايا، مسار درجات التقاضي، الأحكام وحساب مواعيد الطعن ── */
(function(){
const CATS=[
 {k:'civil',n:'حقوقية'},{k:'labor',n:'عمالية'},{k:'criminal',n:'جزائية'},{k:'rent',n:'إيجارات وإخلاء'},{k:'exec',n:'تنفيذ'},{k:'sharia',n:'شرعية'},
 {k:'bodily',n:'أضرار جسدية',ins:1},{k:'property',n:'أضرار مادية',ins:1},{k:'policy',n:'بوالص تأمين',ins:1},{k:'recovery',n:'تحصيل',ins:1}];
const LEVELS=['صلح','بداية','استئناف','نقض','إعادة محاكمة','تنفيذ','تسوية ودية'];
const MAIN=['صلح','بداية','استئناف','نقض','تنفيذ'];
const DTYPES=[['merits','حكم فاصل في الموضوع'],['urgent','حكم في مادة مستعجلة'],['interim','قرار تمهيدي (لا يُطعن فيه استقلالاً)']];
const ins=()=>MQ.settings&&MQ.settings.edition==='insurance';
const cats=()=>ins()?[...CATS.filter(c=>c.ins),...CATS.filter(c=>!c.ins)]:CATS;
let RULES=[];
const loadRules=()=>fetch('/api/rules').then(r=>r.ok?r.json():[]).then(r=>{RULES=r;if(['case','settings'].includes(S.view))render()}).catch(()=>{});
loadRules();

window.catOf=k=>{if(k.cat)return CATS.find(c=>c.k===k.cat)||CATS[0];const t=k.type||'';
 const g=/عمال/.test(t)?'labor':/جزائ/.test(t)?'criminal':/إخلاء|إيجار|مأجور/.test(t)?'rent':/^تنفيذ/.test(t)?'exec':/شرع/.test(t)?'sharia':/تعويض|حادث|جسد/.test(t)?'bodily':/تأمين|بوليص/.test(t)?'policy':'civil';
 return CATS.find(c=>c.k===g)};
window.trackOf=k=>k.track&&k.track.length?k.track:[{lvl:(CT(k.court)||{}).type||'بداية',court:k.court,no:k.no,from:k.opened||''}];
const curLvl=k=>trackOf(k).slice(-1)[0].lvl;
const nature=k=>catOf(k).k==='criminal'?'criminal':'civil';
const nextRoute=l=>l==='صلح'||l==='بداية'?'استئناف':l==='استئناف'?'نقض':null;window.MQ_nextRoute=nextRoute;
const addDays=(s,n)=>{const d=pd(s);return iso(new Date(d.getFullYear(),d.getMonth(),d.getDate()+n))};
const today=()=>iso(new Date());
function ruleFor(k,type,lvl){if(type==='interim')return null;const to=nextRoute(lvl);if(!to)return null;
 return RULES.find(r=>r.to===to&&r.nature===nature(k)&&!!r.urgent===(type==='urgent')&&r.from.includes(lvl))||null}
function computeDue(rule,date,start,notified){const base=start==='notice'&&notified?notified:date;const due=addDays(base,rule.days);return {base,due,fri:pd(due).getDay()===5}}

window.levelPill=k=>`<span class="pill lvl lvl-${MAIN.indexOf(curLvl(k))}">${esc(curLvl(k))}</span> `;
window.caseBadges=k=>{const c=catOf(k),r=k.refs||{};
 return `<span class="pill cat cat-${c.k}">${esc(c.n)}</span>${window.levelPill(k)}${r.policy?`<span class="pill ref">بوليصة <span class="mono">${esc(r.policy)}</span></span>`:''}${r.claim?`<span class="pill ref">مطالبة <span class="mono">${esc(r.claim)}</span></span>`:''}${r.accident?`<span class="pill ref">حادث <span class="mono">${esc(r.accident)}</span></span>`:''}`};
window.catFilter=()=>`<select class="field" id="catF" aria-label="تصفية حسب التصنيف"><option value="">كل التصنيفات</option>${cats().map(c=>`<option value="${c.k}" ${S.cat===c.k?'selected':''}>${esc(c.n)}${c.ins?' · تأمين':''}</option>`).join('')}</select>`;

/* ── تبويب مسار التقاضي ── */
window.trackTab=k=>{
 const tr=trackOf(k),cur=curLvl(k),decs=(k.decisions||[]).slice().sort((a,b)=>b.date.localeCompare(a.date));
 const seen=new Map(tr.map(t=>[t.lvl,t]));
 const lvlIdx=MAIN.indexOf(cur);
 const stepper=`<div class="lvls">${MAIN.map((l,i)=>{const t=seen.get(l);return `<div class="lv ${t?'done':''} ${l===cur?'cur':''} ${!t&&i<lvlIdx?'skip':''}"><i>${i+1}</i><b>${l}</b><small>${t?(t.from?dmy(t.from):'—'):l===cur?'':'—'}</small></div>`}).join('<span class="lv-line"></span>')}${cur==='تسوية ودية'?'<div class="lv cur done settle"><i>✓</i><b>تسوية ودية</b><small>'+(seen.get('تسوية ودية').from?dmy(seen.get('تسوية ودية').from):'')+'</small></div>':''}</div>`;
 const hist=tr.slice().reverse().map((t,i)=>`<div class="tr-row ${i===0?'now':''}"><span class="pill lvl lvl-${MAIN.indexOf(t.lvl)}">${esc(t.lvl)}</span><div><b>${esc((CT(t.court)||{}).name||'—')}</b> · <span class="mono">${esc(t.no||'')}</span><div class="m">${t.from?'من '+dmy(t.from):''}${t.to?' إلى '+dmy(t.to):i===0?' · الدرجة الحالية':''}${t.outcome?' · '+esc(t.outcome):''}</div></div></div>`).join('');
 const decList=decs.map(d=>{const r=RULES.find(x=>x.id===d.rule),n=d.due?diff(d.due):null;
  return `<div class="dec"><div class="dec-h"><b>${esc((DTYPES.find(t=>t[0]===d.kind)||[,'قرار'])[1])}</b><span class="m">${esc(d.lvl)} · ${fmt(d.date)}</span></div>${d.text?`<div class="dec-t">${esc(d.text)}</div>`:''}
  ${d.due?`<div class="dec-due ${n<0?'gone':sevOf(n)}"><span>آخر موعد لل${esc(r?r.to:'طعن')}: <b>${fmt(d.due)}</b></span><span class="pill ${n<0?'':sevOf(n)}">${n<0?'انقضت المدة':n===0?'اليوم آخر يوم':'متبقٍ '+daysW(n)}</span></div>
  <div class="m">${r?`${r.days} يوماً ${d.start==='notice'?'من تاريخ التبليغ '+dmy(d.notified):'من اليوم التالي لصدور الحكم'} · ${esc(r.ref)}`:''}${r&&!r.verified?' <span class="pill warn">مدة غير مؤكدة · راجعها في الإعدادات</span>':''}</div>`:'<div class="m">لا مهلة طعن مستقلة لهذا القرار.</div>'}</div>`}).join('')||'<div class="empty">لم يُسجَّل حكم أو قرار بعد.</div>';
 const ctOpts=courts.map(c=>`<option value="${c.id}" data-t="${c.type}">${esc(c.name)} (${c.type})</option>`).join('');
 const r=k.refs||{};
 return `<div class="grid2 p2">
 <div class="stack"><section class="panel"><header><h2>درجات التقاضي</h2><span class="pill lvl lvl-${lvlIdx}">الحالية: ${esc(cur)}</span></header><div class="bd">${stepper}<div class="tr-list">${hist}</div></div></section>
  <section class="panel"><header><h2>الأحكام والقرارات ومواعيد الطعن</h2><span class="pill">${decs.length}</span></header><div class="bd decs">${decList}</div></section></div>
 <div class="stack p2-forms">
  <section class="panel"><header><h2>تسجيل حكم أو قرار</h2></header><div class="bd"><form class="form" id="fDec">
   <label>تاريخ الصدور<input class="field" type="date" id="dD" required value="${today()}"></label>
   <label>النوع<select class="field" id="dT">${DTYPES.map(([v,n])=>`<option value="${v}">${n}</option>`).join('')}</select></label>
   <label class="wide">منطوق الحكم باختصار<input class="field" id="dX" placeholder="مثال: إلزام المدعى عليه بدفع 18,500 شيكل والرسوم"></label>
   <fieldset class="wide startf"><legend>بداية مدة الطعن</legend><label class="ck"><input type="radio" name="dS" value="judgment" checked> من اليوم التالي لصدور الحكم</label><label class="ck"><input type="radio" name="dS" value="notice"> من تاريخ التبليغ (لمن تخلّف عن حضور جميع الجلسات)</label><input class="field" type="date" id="dN" hidden></fieldset>
   <div class="wide prev" id="decPrev"></div>
   <label class="wide ck"><input type="checkbox" id="dM" checked> إبلاغ الموكل عبر البوابة بصدور الحكم وآخر موعد للطعن</label>
   <button class="btn pri">تسجيل الحكم وإنشاء مهلة الطعن</button></form></div></section>
  <section class="panel"><header><h2>نقل القضية إلى درجة أخرى</h2></header><div class="bd"><form class="form" id="fMove">
   <label>الدرجة<select class="field" id="mL">${LEVELS.filter(l=>l!==cur).map(l=>`<option ${l===nextRoute(cur)?'selected':''}>${l}</option>`).join('')}</select></label>
   <label>التاريخ<input class="field" type="date" id="mD" required value="${today()}"></label>
   <label class="wide">المحكمة / الجهة<select class="field" id="mC">${ctOpts}</select></label>
   <label class="wide">رقم الدعوى في الدرجة الجديدة<input class="field mono" id="mN" placeholder="0000/2026"></label>
   <label class="wide">نتيجة الدرجة السابقة (اختياري)<input class="field" id="mO" placeholder="مثال: رد الدعوى، فاستأنفنا الحكم"></label>
   <button class="btn">نقل القضية</button></form></div></section>
  <section class="panel"><header><h2>التصنيف والمراجع</h2></header><div class="bd"><form class="form" id="fRefs">
   <label class="wide">تصنيف القضية<select class="field" id="rC">${cats().map(c=>`<option value="${c.k}" ${catOf(k).k===c.k?'selected':''}>${esc(c.n)}${c.ins?' · تأمين':''}</option>`).join('')}</select></label>
   <label>رقم البوليصة<input class="field mono" id="rP" value="${esc(r.policy||'')}"></label><label>رقم المطالبة<input class="field mono" id="rM" value="${esc(r.claim||'')}"></label>
   <label class="wide">رقم الحادث / الملف لدى الجهة<input class="field mono" id="rA" value="${esc(r.accident||'')}"></label>
   <button class="btn">حفظ</button></form></div></section>
 </div></div>`};

function decPreview(){const el=document.getElementById('decPrev');if(!el)return;const k=K(S.caseId),lvl=curLvl(k);
 const type=document.getElementById('dT').value,date=document.getElementById('dD').value,start=(document.querySelector('input[name=dS]:checked')||{}).value,nt=document.getElementById('dN');
 nt.hidden=start!=='notice';nt.required=start==='notice';
 const r=ruleFor(k,type,lvl);
 if(!date){el.innerHTML='';return}
 if(type==='interim'){el.innerHTML='<span class="m">القرار التمهيدي لا يُطعن فيه استقلالاً، ولن تُنشأ مهلة.</span>';return}
 if(!nextRoute(lvl)){el.innerHTML=`<span class="m">لا طعن عادي بعد درجة «${esc(lvl)}».</span>`;return}
 if(!r){el.innerHTML='<span class="m">لا توجد قاعدة مدة مطابقة. راجع جدول مدد الطعن في الإعدادات.</span>';return}
 if(start==='notice'&&!nt.value){el.innerHTML='<span class="m">أدخل تاريخ التبليغ لحساب المهلة.</span>';return}
 const c=computeDue(r,date,start,nt.value),n=diff(c.due);
 el.innerHTML=`<div class="prev-box ${n<0?'gone':sevOf(n)}"><small>${esc(r.name)} · ${r.days} يوماً</small><b>آخر موعد: ${fmt(c.due)}</b><span>${n<0?'انقضت المدة':'متبقٍ '+daysW(n)}</span>${window.MQ_CAL?MQ_CAL.note(c.due):c.fri?'<em>يصادف يوم جمعة: تحقّق من قاعدة امتداد المدة إن صادف آخرها عطلة رسمية.</em>':''}${!r.verified?'<em>هذه المدة غير مؤكدة بعد، راجعها في الإعدادات.</em>':''}</div>`}

/* ── الحفظ ── */
document.addEventListener('submit',e=>{const f=e.target;if(!['fDec','fMove','fRefs'].includes(f.id))return;e.preventDefault();e.stopImmediatePropagation();
 if(MQ.readOnly)return toast('صلاحيتك للاطلاع فقط');
 const k=K(S.caseId);
 if(f.id==='fDec'){const lvl=curLvl(k),type=f.dT.value,date=f.dD.value,start=(f.querySelector('input[name=dS]:checked')||{}).value||'judgment',notified=f.dN.value;
  const d={id:'dc'+Date.now(),date,lvl,kind:type,text:f.dX.value.trim(),start,notified:start==='notice'?notified:''};
  const r=ruleFor(k,type,lvl);let c=null;
  if(r){c=computeDue(r,date,start,notified);d.rule=r.id;d.due=c.due;
   deadlines.push({id:'dl-'+d.id,k:k.id,title:`آخر موعد لل${r.to} في الحكم الصادر بتاريخ ${dmy(date)}`,due:c.due,kind:'طعن',auto:true,rule:r.id,dec:d.id})}
  k.decisions=[...(k.decisions||[]),d];
  if(type!=='interim'){k.stage=r?'صدر الحكم · مهلة '+r.to:'صدر الحكم';k.step=Math.max(k.step||0,STEPS.indexOf('الحكم'))}
  if(f.dM.checked&&type!=='interim')sendMsg(k.client,`صدر ${type==='urgent'?'حكم مستعجل':'الحكم'} في قضيتك رقم ${k.no} بتاريخ ${fmt(date)}${d.text?': '+d.text:''}.${c?` آخر موعد للطعن بال${r.to}: ${fmt(c.due)}. سنتواصل معك لتقرير الخطوة التالية.`:''}`,C(k.client).ch);
  toast(c?'سُجّل الحكم وأُنشئت مهلة '+r.to+' حتى '+dmy(c.due):'سُجّل القرار');render()}
 if(f.id==='fMove'){const tr=trackOf(k).map(t=>({...t})),last=tr[tr.length-1],lvl=f.mL.value,date=f.mD.value,court=f.mC.value,no=f.mN.value.trim();
  last.to=date;if(f.mO.value.trim())last.outcome=f.mO.value.trim();
  tr.push({lvl,court,no:no||k.no,from:date});k.track=tr;k.court=court;if(no)k.no=no;
  if(lvl==='تسوية ودية'){k.status='منتهية';k.stage='تسوية ودية'}else if(lvl==='تنفيذ'){k.status='تنفيذ';k.stage='قيد التنفيذ'}else{k.status='نشطة';k.stage='قيد النظر · '+lvl;k.step=0}
  toast('نُقلت القضية إلى درجة '+lvl);render()}
 if(f.id==='fRefs'){k.cat=f.rC.value;k.refs={policy:f.rP.value.trim(),claim:f.rM.value.trim(),accident:f.rA.value.trim()};toast('حُفظ التصنيف والمراجع');render()}
},true);
document.addEventListener('input',e=>{if(e.target.closest&&e.target.closest('#fDec'))decPreview()});
document.addEventListener('change',e=>{
 if(e.target.closest&&e.target.closest('#fDec'))decPreview();
 if(e.target.id==='mL'){const want=e.target.value,sel=document.getElementById('mC'),o=[...sel.options].find(o=>o.dataset.t===want);if(o)sel.value=o.value}
 if(e.target.id==='catF'){S.cat=e.target.value;const tb=document.getElementById('ctb');if(tb)tb.innerHTML=caseRows();else render()}
});
const r0=render;render=function(){r0();if((S.view==='case'||(S.view==='client'&&S.bagTab==='case'))&&S.caseTab==='track'){decPreview();const ml=document.getElementById('mL');if(ml)ml.dispatchEvent(new Event('change',{bubbles:true}))}};

/* ── قضية جديدة: التصنيف والمراجع ── */
const om=openModal;window.openModal=function(){om();const note=document.querySelector('#fCase .note.wide');if(!note)return;
 note.insertAdjacentHTML('beforebegin',`<label>التصنيف<select class="field" id="ncCat">${cats().map(c=>`<option value="${c.k}">${esc(c.n)}${c.ins?' · تأمين':''}</option>`).join('')}</select></label>
  <label>رقم البوليصة<input class="field mono" id="ncPol" placeholder="${ins()?'مطلوب لقضايا التأمين':'اختياري'}"></label><label>رقم المطالبة<input class="field mono" id="ncClm"></label><label>رقم الحادث<input class="field mono" id="ncAcc"></label>`)};
document.addEventListener('submit',e=>{if(e.target.id!=='fCase'||MQ.readOnly)return;const f=e.target,x={cat:f.ncCat&&f.ncCat.value,refs:{policy:(f.ncPol||{}).value||'',claim:(f.ncClm||{}).value||'',accident:(f.ncAcc||{}).value||''}};
 setTimeout(()=>{const k=cases[cases.length-1];if(k&&!k.cat&&x.cat){k.cat=x.cat;k.refs=x.refs;render()}},0)},true);

/* ── الإعدادات: جدول مدد الطعن ── */
const vs=V.settings;V.settings=()=>vs()+`<section class="panel" style="margin-top:16px"><header><h2>مدد الطعن</h2><span class="m">تُحسب منها مواعيد الطعن تلقائياً عند تسجيل الأحكام</span></header>
 <div class="tablewrap"><table class="rules"><thead><tr><th>الطعن</th><th>المدة (يوم)</th><th>تبدأ</th><th>السند القانوني</th><th>مؤكَّدة</th></tr></thead><tbody>
 ${RULES.map(r=>`<tr data-id="${r.id}"><td style="font-weight:600">${esc(r.name)}<div class="m">من: ${r.from.join('، ')}</div></td><td><input class="field num" type="number" min="1" max="365" value="${r.days}" data-f="days" style="width:90px"></td><td class="m">من اليوم التالي لصدور الحكم، أو من التبليغ للمتخلف</td><td><input class="field" value="${esc(r.ref)}" data-f="ref"></td><td><input type="checkbox" data-f="verified" ${r.verified?'checked':''}>${r.verified?'':' <span class="pill warn">راجِعها</span>'}</td></tr>`).join('')}</tbody></table></div>
 <div class="bd"><p class="note">القيم الافتراضية مأخوذة من أحكام منشورة لمحكمتي الاستئناف والنقض الفلسطينيتين، عدا ما عُلّم «راجِعها». يجب أن يراجعها محامٍ قبل الاعتماد عليها. كل تعديل هنا يُسجّل في سجل التدقيق.</p><button class="btn pri" data-act="rulesSave">حفظ مدد الطعن</button></div></section>`;
A.rulesSave=()=>{const rows=[...document.querySelectorAll('table.rules tbody tr')].map(tr=>({id:tr.dataset.id,days:tr.querySelector('[data-f=days]').value,ref:tr.querySelector('[data-f=ref]').value,verified:tr.querySelector('[data-f=verified]').checked}));
 fetch('/api/rules',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(rows)}).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error||'تعذّر الحفظ');RULES=j;toast('حُفظت مدد الطعن');render()}).catch(e=>toast(e.message))};
})();
