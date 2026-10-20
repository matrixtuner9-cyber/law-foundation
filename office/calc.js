/* ── الحاسبات القانونية: تعويض حوادث الطرق، الحقوق العمالية، رسوم المحاكم والفائدة ──
   الحساب حتمي (calc-engine.js) وكل سطر بمادته. الذكاء الاصطناعي يُستعمل اختيارياً لاستخراج المعطيات من سرد المحامي فقط.
   الناتج يُحفظ في مستندات القضية أو يُطبع أو يُرسل إلى الصياغة بالصوت ليُبنى عليه لائحة. */
(function(){
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const E=window.MQCALC;if(!E)return;
const online=()=>!!(window.MQ&&MQ.online)&&!document.body.classList.contains('mq-private');
const fmt=n=>Number(n||0).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2});
const LS=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(_){return null}},SV=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};
const CS={tab:'insurance',k:'',text:'',ins:{workEndAge:60,discountPct:3,currency:'ILS',fxJod:5},lab:{minWage:1880,termination:'arbitrary',contract:'open'},fee:{court:'auto'},intr:{},res:null,ai:null,busy:false,err:'',feeCfg:LS('mq_feecfg')||{}};
{const i=NAV.findIndex(n=>n[0]==='laws');NAV.splice((i>=0?i:NAV.findIndex(n=>n[0]==='tpls'))+1,0,['calc','الحاسبات القانونية'])}

const TABS=[['insurance','تعويض حادث طرق','قانون التأمين 20/2005'],['labour','حقوق عمالية','قانون العمل 7/2000'],['fees','رسوم المحاكم','قرار مجلس الوزراء 6/2023'],['interest','فائدة','نسبة يحددها المحامي']];
const F=(id,label,v,extra='')=>`<label>${label}<input class="field" id="${id}" value="${e(v??'')}" ${extra}></label>`;
const N=(id,label,v,extra='')=>F(id,label,v,'type="number" step="any" inputmode="decimal" '+extra);
const D=(id,label,v)=>F(id,label,v,'type="date"');
const CK=(id,label,v)=>`<label class="rl-ck"><input type="checkbox" id="${id}" ${v?'checked':''}> ${label}</label>`;
const SEL=(id,label,v,opts)=>`<label>${label}<select class="field" id="${id}">${opts.map(([a,b])=>`<option value="${a}" ${a===v?'selected':''}>${b}</option>`).join('')}</select></label>`;

V.calc=()=>{const k=K(CS.k);
 return `<div class="head"><div><h1>الحاسبات القانونية</h1><p class="sub">حساب حتمي بنصوص المواد؛ ما لا نص فيه يُدخله المحامي ويُعلَّم «تقدير». الناتج مسودة للمراجعة.</p></div>
  <label class="cl-case">القضية <select class="field" id="clK"><option value="">— دون قضية —</option>${cases.map(c=>`<option value="${c.id}" ${c.id===CS.k?'selected':''}>${e(c.no)} · ${e((C(c.client)||{}).name||'')}</option>`).join('')}</select></label></div>
 <div class="tabs cl-tabs">${TABS.map(([id,t,s])=>`<button class="${CS.tab===id?'on':''}" data-act="clTab" data-v="${id}" title="${s}">${t}</button>`).join('')}</div>
 <div class="cl-grid"><section class="panel"><div class="bd"><form class="form cl-form" id="fCalc">${CS.tab==='insurance'?insForm():CS.tab==='labour'?labForm():CS.tab==='fees'?feeForm():intForm()}
  ${CS.err?`<div class="wide ai-err">${e(CS.err)}</div>`:''}<div class="wide toolbar"><button class="btn pri">احسب</button>${CS.tab==='fees'?'<button type="button" class="btn" data-act="clFeeCfg">إعدادات الجدول</button>':''}</div></form></div></section>
 <section class="panel"><div class="bd" id="clOut">${CS.res?result():`<div class="empty">املأ المعطيات ثم اضغط «احسب»${online()&&(CS.tab==='insurance'||CS.tab==='labour')?'، أو اسرد الوقائع بصوتك في المربع أعلاه فتُستخرج المعطيات تلقائياً':''}.</div>`}</div></section></div>`};

function narr(kind){if(!online())return '';return `<div class="wide ai-dict cl-narr"><div class="ai-mic-row"><button type="button" class="ai-mic sm" data-act="clMic" aria-label="إملاء السرد">🎙</button><div><b>اسرد الوقائع</b> <span class="m">(اختياري)</span> فتُستخرج المعطيات إلى الحقول، وتبقى الأسماء مخفية عن الخدمة</div></div>
 <textarea class="field" id="clText" rows="3" placeholder="${kind==='labour'?'مثال: عمل موكلنا منذ 1/3/2016 براتب 4200 شيكل وفُصل بتاريخ 15/9/2025 دون إشعار ولا سبب…':'مثال: أصيب موكلنا بتاريخ 12/5/2025، عمره 34 سنة وأجره 3500 شيكل، مكث 6 ليالٍ وأُجريت له عملية، ونسبة العجز الدائم 15%…'}">${e(CS.text)}</textarea>
 <div class="ai-interim" id="aiInterim"></div><div class="toolbar"><button type="button" class="btn sm" data-act="clExtract" ${CS.busy?'disabled':''}>${CS.busy?'جارٍ الاستخراج…':'استخراج المعطيات من السرد'}</button>${CS.ai&&CS.ai.missing&&CS.ai.missing.length?`<span class="m">ناقص: ${e(CS.ai.missing.join('، '))}</span>`:''}</div>
 ${CS.ai&&CS.ai.assumptions&&CS.ai.assumptions.length?`<div class="m">افتراضات الاستخراج: ${e(CS.ai.assumptions.join('؛ '))}</div>`:''}</div>`}
function insForm(){const i=CS.ins;return narr('insurance')+`
 ${CK('i_died','وفاة المصاب',i.died)}${N('i_dependantsShare','حصة الورثة المعالين % (م154)',i.dependantsShare)}
 ${N('i_disability','نسبة العجز الدائم الطبي %',i.disability)}${N('i_functionalDisability','نسبة العجز الوظيفي % (للكسب المستقبلي؛ تُترك فتُساوي الطبي)',i.functionalDisability)}
 ${N('i_nights','ليالي المستشفى',i.nights)}${CK('i_operations','أُجريت عملية جراحية استلزمت المكوث',i.operations)}
 ${N('i_monthlyWage','الأجر الشهري',i.monthlyWage)}${N('i_sectorAvgWage','معدل الأجور في قطاع المصاب (الإحصاء الفلسطيني، م155)',i.sectorAvgWage)}
 ${D('i_accidentDate','تاريخ الحادث',i.accidentDate)}${D('i_returnDate','تاريخ العودة للعمل (للعجز المؤقت)',i.returnDate)}
 ${N('i_tempDays','أو أيام العجز المؤقت',i.tempDays)}${N('i_age','عمر المصاب',i.age)}
 ${N('i_workEndAge','سن نهاية العمل (تقدير)',i.workEndAge)}${N('i_discountPct','نسبة خصم الدفع الفوري % سنوياً (م157، تقدير)',i.discountPct)}
 ${N('i_medical','نفقات العلاج الموثقة',i.medical)}${N('i_advancePaid','دفعات مستعجلة مدفوعة (تُخصم)',i.advancePaid)}
 ${CK('i_notified','تم الإخطار خلال 30 يوماً (م148)',i.notified)}${SEL('i_currency','عملة الأجر والنفقات',i.currency,[['ILS','شيكل'],['JOD','دينار'],['USD','دولار']])}${N('i_fxJod','سعر الدينار الأردني بهذه العملة (لتحويل مبالغ م152–154)',i.fxJod)}`}
function labForm(){const i=CS.lab;return narr('labour')+`
 ${N('l_monthlyWage','آخر أجر شهري (دون الإضافي)',i.monthlyWage)}${N('l_minWage','الحد الأدنى للأجر النافذ (م89)',i.minWage)}
 ${D('l_start','بداية الخدمة',i.start)}${D('l_end','نهايتها',i.end)}
 ${N('l_years','أو سنوات الخدمة',i.years)}${SEL('l_termination','سبب الانتهاء',i.termination,[['arbitrary','فصل تعسفي'],['dismissal','فصل لسبب (م40/41)'],['resignation','استقالة'],['end_of_term','انتهاء المدة'],['agreed','اتفاق']])}
 ${SEL('l_contract','نوع العقد',i.contract,[['open','غير محدد المدة'],['fixed','محدد المدة']])}${N('l_unusedLeaveYears','سنوات الإجازة غير المستعملة (حتى 2)',i.unusedLeaveYears)}
 ${CK('l_noticeGiven','أُعطي الإشعار قبل شهر',i.noticeGiven)}${CK('l_justifiedLeave','ترك مبرر (م42/1) يستحق المكافأة كاملة',i.justifiedLeave)}
 ${CK('l_hazardous','عمل خطر أو ضار بالصحة',i.hazardous)}${CK('l_commission','يعمل بالقطعة أو بالعمولة (م48)',i.commission)}
 ${N('l_unpaidWages','أجور متأخرة',i.unpaidWages)}${N('l_overtime','بدل عمل إضافي',i.overtime)}
 ${N('l_other','مبالغ أخرى',i.other)}${F('l_otherLabel','وصفها',i.otherLabel)}
 <div class="wide cl-sub">${CK('l_injury','إصابة عمل',i.injury)}</div>
 ${N('l_injuryTempDays','أيام العجز المؤقت عن الإصابة',i.injuryTempDays)}${N('l_injuryDisability','نسبة العجز الدائم %',i.injuryDisability)}
 ${CK('l_injuryDeath','وفاة عن الإصابة',i.injuryDeath)}${N('l_age','عمر العامل',i.age)}${N('l_avg3Wage','متوسط أجر آخر 3 أشهر (م130)',i.avg3Wage)}`}
function feeForm(){const i=CS.fee;return `${N('f_value','قيمة الدعوى بالدينار الأردني',i.value)}${SEL('f_court','المحكمة',i.court,[['auto','تلقائي حسب القيمة'],['mag','صلح'],['first','بداية']])}
 ${CK('f_appeal','استئناف',i.appeal)}${CK('f_cassation','نقض',i.cassation)}${CK('f_execution','تنفيذ',i.execution)}`}
function intForm(){const i=CS.intr;return `${N('n_principal','المبلغ',i.principal)}${N('n_ratePct','النسبة السنوية %',i.ratePct)}${D('n_from','من',i.from)}${D('n_to','إلى',i.to)}`}

function read(){const g=id=>{const x=document.getElementById(id);return x?(x.type==='checkbox'?x.checked:x.value):undefined};
 const pick=(p,o)=>{document.querySelectorAll(`#fCalc [id^="${p}"]`).forEach(x=>{o[x.id.slice(2)]=x.type==='checkbox'?x.checked:x.value})};
 const k=document.getElementById('clK');if(k)CS.k=k.value;const t=document.getElementById('clText');if(t)CS.text=t.value;
 if(CS.tab==='insurance')pick('i_',CS.ins);else if(CS.tab==='labour')pick('l_',CS.lab);else if(CS.tab==='fees')pick('f_',CS.fee);else pick('n_',CS.intr)}
A.clTab=v=>{read();CS.tab=v;CS.res=null;CS.err='';render()};
document.addEventListener('change',ev=>{if(ev.target.id==='clK'){read();}});
document.addEventListener('submit',ev=>{if(ev.target.id!=='fCalc')return;ev.preventDefault();ev.stopImmediatePropagation();read();CS.err='';
 try{if(CS.tab==='insurance')CS.res={kind:'insurance',...E.insurance({...CS.ins,today:iso(TODAY)})};else if(CS.tab==='labour')CS.res={kind:'labour',...E.labour(CS.lab)};else if(CS.tab==='fees')CS.res={kind:'fees',...E.fees(CS.fee,CS.feeCfg)};else CS.res={kind:'interest',...E.interest(CS.intr)}}
 catch(er){CS.err='تعذّر الحساب: '+er.message}render()},true);

function result(){const r=CS.res,t=TABS.find(x=>x[0]===r.kind);
 const rows=(r.lines||[]).map(l=>`<tr class="${l.amount<0?'neg':''}"><td><b>${e(l.label)}</b>${l.detail?`<div class="m">${e(l.detail)}</div>`:''}${l.basis?`<div class="cl-basis">${e(l.basis)}</div>`:''}${l.est?`<div class="cl-est">⚠ ${e(l.est)}</div>`:''}</td><td class="mono num">${fmt(l.amount)}</td></tr>`).join('');
 return `<h2 class="cl-h">${t[1]} <span class="m">${t[2]}</span></h2>
 ${r.kind==='interest'?`<div class="kgrid"><div class="k"><small>الأيام</small><b>${r.days}</b></div><div class="k"><small>الفائدة</small><b>${fmt(r.amount)}</b></div><div class="k ok"><small>الإجمالي</small><b>${fmt(r.total)}</b></div></div><p class="m">${e(r.note)}</p>`
 :`<table class="cl-tbl"><tbody>${rows||'<tr><td colspan="2" class="m">لا بنود مستحقة بالمعطيات المدخلة.</td></tr>'}</tbody><tfoot><tr><td>الإجمالي${r.kind==='insurance'?' بال'+(r.currency==='ILS'?'شيكل':r.currency==='JOD'?'دينار':'دولار')+' (منه الضرر المعنوي '+fmt(r.moral)+' دينار)':''}</td><td class="mono num">${fmt(r.total)}</td></tr></tfoot></table>`}
 ${(r.warnings||[]).map(w=>`<div class="ai-err">${e(w)}</div>`).join('')}${(r.notes||[]).map(n=>`<div class="cl-note">${e(n)}</div>`).join('')}
 ${r.currencyNote?`<p class="m">${e(r.currencyNote)}</p>`:''}${r.source?`<p class="m">${e(r.source)} — ${e(r.note||'')}</p>`:''}
 ${r.basisRefs?`<details class="cl-refs"><summary>نصوص المواد المعتمدة (${r.basisRefs.length})</summary><ul>${r.basisRefs.map(x=>`<li>${e(x)}</li>`).join('')}</ul></details>`:''}
 <div class="ai-warn">مسودة حسابية للمراجعة؛ السلطة التقديرية للمحكمة في العناصر المعلَّمة «تقدير» وفي تقدير نسب العجز والأجر المعتمد.</div>
 <div class="toolbar"><button class="btn pri" data-act="clSave">حفظ في مستندات القضية</button><button class="btn" data-act="clPrint">طباعة</button>${online()&&r.kind!=='interest'&&r.kind!=='fees'?'<button class="btn" data-act="clDraft">🎙 صياغة لائحة من هذا الحساب</button>':''}</div>`}
const asText=()=>{const r=CS.res,t=TABS.find(x=>x[0]===r.kind);return [t[1]+' — '+t[2],...(r.lines||[]).map(l=>`${l.label}: ${fmt(l.amount)}${l.detail?' ('+l.detail+')':''}\n   ${l.basis||''}${l.est?'\n   تقدير: '+l.est:''}`),'الإجمالي: '+fmt(r.total),...(r.notes||[]),...(r.warnings||[])].join('\n')};
A.clSave=()=>{read();const k=K(CS.k),r=CS.res;if(!r)return;if(!k)return toast('اختر القضية أولاً');if(window.MQ&&MQ.readOnly)return toast('صلاحيتك للاطلاع فقط');
 docs.push({id:'d'+Date.now().toString(36),k:k.id,title:TABS.find(x=>x[0]===r.kind)[1]+' — '+iso(TODAY),kind:'حساب',date:iso(TODAY),src:'الحاسبات القانونية',pages:1,shared:false,text:asText(),calc:{kind:r.kind,input:r.kind==='insurance'?CS.ins:r.kind==='labour'?CS.lab:r.kind==='fees'?CS.fee:CS.intr,total:r.total}});
 if(window.MQ&&MQ.saveState)MQ.saveState();toast('حُفظ الحساب في مستندات القضية '+k.no)};
A.clPrint=()=>{if(!window.MQP||!CS.res)return;read();const r=CS.res,k=K(CS.k),B=MQP.B,Es=MQP.esc,t=TABS.find(x=>x[0]===r.kind);
 MQP.open({label:t[1],build(){return {title:t[1],sub:(k?'في الدعوى رقم '+k.no+' · ':'')+t[2],ref:k?k.no:'',file:'calc-'+r.kind,
  blocks:[B.t(['البند','الأساس القانوني','المبلغ'],(r.lines||[]).map(l=>[Es(l.label)+(l.detail?'<br><small>'+Es(l.detail)+'</small>':''),'<small>'+Es(l.basis||'')+(l.est?'<br>تقدير: '+Es(l.est):'')+'</small>',fmt(l.amount)]),{num:[2],w:['38%','44%','18%']}),B.p('<b>الإجمالي: '+fmt(r.total)+'</b>'),...(r.notes||[]).map(n=>B.p(Es(n))),...(r.warnings||[]).map(w=>B.p(Es(w),'s')),B.box('مسودة حسابية للمراجعة؛ العناصر المعلَّمة «تقدير» خاضعة للسلطة التقديرية للمحكمة.','warn')],sign:['المحامي'],mark:'مسودة'}}})};
A.clDraft=()=>{read();const r=CS.res;if(!r||!A.aiOpenWith)return;const k=K(CS.k);if(!k)return toast('اختر القضية أولاً');
 const txt='بناءً على الحساب التالي وفق '+TABS.find(x=>x[0]===r.kind)[2]+':\n'+asText()+'\n\nنطلب الحكم للموكل بالمبلغ الإجمالي مع الرسوم والمصاريف وأتعاب المحاماة.';
 A.aiOpenWith(k.id,txt,'لائحة دعوى')};
A.clFeeCfg=()=>{read();const c={...E.FEES_DEFAULT,...CS.feeCfg},m=document.getElementById('modal');
 const rows=[['magPct','نسبة رسم الصلح %'],['magMin','حده الأدنى'],['magMax','حده الأقصى'],['magLimit','حد اختصاص الصلح بالقيمة (دينار)'],['firstPct1','نسبة البداية % عن الشريحة الأولى'],['firstBand','الشريحة الأولى (دينار)'],['firstPct2','النسبة % عما زاد'],['firstMax','سقف رسم البداية'],['appealFrac','نسبة الاستئناف والنقض من رسم الدرجة الأولى (0.5 = النصف)'],['execPct','نسبة التنفيذ %'],['execMaxMag','سقف التنفيذ صلح'],['execMaxFirst','سقف التنفيذ بداية']];
 m.innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog"><div class="head"><div><h1 style="font-size:22px">إعدادات جدول الرسوم</h1><p class="sub">${e(c.source)}</p></div><button class="btn sm" data-act="close">إغلاق</button></div>
  <form class="form" id="fFeeCfg">${rows.map(([k,l])=>N('c_'+k,l,c[k])).join('')}${F('c_source','المصدر',c.source)}<div class="wide toolbar"><button class="btn pri">حفظ</button><button type="button" class="btn" data-act="clFeeReset">الافتراضي</button></div></form></div></div>`};
A.clFeeReset=()=>{CS.feeCfg={};SV('mq_feecfg',{});A.close();toast('أُعيد الجدول إلى الافتراضي');render()};
document.addEventListener('submit',ev=>{if(ev.target.id!=='fFeeCfg')return;ev.preventDefault();ev.stopImmediatePropagation();const o={};ev.target.querySelectorAll('[id^="c_"]').forEach(x=>{o[x.id.slice(2)]=x.id==='c_source'?x.value:parseFloat(x.value)});CS.feeCfg=o;SV('mq_feecfg',o);A.close();toast('حُفظت الإعدادات');CS.res=null;render()},true);

/* الاستخراج بالذكاء الاصطناعي والإملاء */
A.clMic=()=>{if(A.aiMic)A.aiMic('clText')};
A.clExtract=async()=>{read();if(CS.busy)return;if(!CS.text.trim())return toast('اسرد الوقائع أولاً');CS.busy=true;CS.err='';render();
 try{const k=K(CS.k);const r=await fetch('/api/admin/ai/calc',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({kind:CS.tab,text:CS.text,case:k?{client:(C(k.client)||{}).name,opponents:(k.opps||[]).map(o=>(O(o)||{}).name)}:{}})});const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.error||('HTTP '+r.status));CS.ai=j;const tgt=CS.tab==='labour'?CS.lab:CS.ins;for(const [a,b] of Object.entries(j.fields||{}))tgt[a]=typeof b==='boolean'?b:(b===1||b==='1')&&/^(died|operations|notified|noticeGiven|justifiedLeave|hazardous|commission|injury|injuryDeath)$/.test(a)?true:b;
  toast('استُخرجت '+Object.keys(j.fields||{}).length+' معطيات؛ راجعها ثم احسب')}catch(er){CS.err=er.message}CS.busy=false;render()};

const css=document.createElement('style');css.textContent=`
.cl-case{display:flex;gap:8px;align-items:center;font-size:14px}.cl-case select{min-width:260px}.cl-tabs{margin-bottom:12px}
.cl-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;align-items:start}.cl-form{grid-template-columns:1fr 1fr}.cl-sub{border-top:1px dashed var(--line);padding-top:8px;margin-top:4px}
.cl-narr{margin-bottom:6px}.cl-tbl{width:100%;border-collapse:collapse}.cl-tbl td{padding:8px 6px;border-bottom:1px solid var(--line);vertical-align:top}.cl-tbl .num{text-align:left;white-space:nowrap;font-weight:700;direction:ltr}.cl-tbl tr.neg .num{color:#B91C1C}
.cl-tbl tfoot td{font-weight:800;font-size:16px;border-top:2px solid var(--brass);border-bottom:0}.cl-basis{font-size:12.5px;color:var(--muted);line-height:1.6;margin-top:2px}.cl-est{font-size:12.5px;color:#78350F;background:#FFFBEB;border-radius:6px;padding:2px 6px;margin-top:3px;display:inline-block}
.cl-note{font-size:13.5px;background:var(--sunk);border-radius:8px;padding:6px 10px;margin-top:6px}.cl-h{font-size:18px;margin:0 0 10px}.cl-h .m{font-size:13px;font-weight:400}
.cl-refs{margin-top:10px;font-size:13px}.cl-refs ul{line-height:1.8;padding-inline-start:18px}
@media(max-width:1000px){.cl-grid{grid-template-columns:1fr}}@media(max-width:700px){.cl-form{grid-template-columns:1fr}.cl-case select{min-width:0;flex:1}}`;
document.head.appendChild(css);
})();
