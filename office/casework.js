/* شاشتا «جمع المعلومات والمستندات» و«الدراسة القانونية والتقييم الأولي» داخل ملف القضية
   تُحفظان على القضية نفسها (k.gather, k.study) بالحفظ الآمن المعتاد، وتُستدعيان من مخطط سير القضية في حقيبة الموكل. */
(function(root){
'use strict';
const NEED_ST={have:['متوفر','ok'],client:['مطلوب من الموكل','warn'],agency:['مطلوب من جهة رسمية','warn'],na:['لا ينطبق','']};
const RECS={amic:['إنذار / تسوية ودية',5],court:['رفع دعوى حقوقية',6],crime:['تقديم شكوى جزائية',30],more:['يلزم مزيد من المعلومات',3],decline:['الاعتذار عن القضية',null]};
function gatherDefaults(k){const t=String(k.type||'');const base=['وكالة خاصة موقعة من الموكل','صورة هوية الموكل','المستندات المثبتة للواقعة (عقود، فواتير، مراسلات)'];
 if(/شيك/.test(t)||/شيك/.test(k.subject||''))base.push('أصل الشيك وإشعار الإرجاع من البنك');
 if(/إيجار|مأجور/.test(t))base.push('عقد الإيجار وإيصالات الدفع');
 if(/عمالية/.test(t))base.push('عقد العمل وكشوف الراتب وإثبات مدة الخدمة');
 if(/جزائية/.test(t))base.push('ضبط الشرطة / لائحة الاتهام وقرارات النيابة');
 if(/تنفيذ/.test(t))base.push('صورة الحكم مع الصيغة التنفيذية وإشعار التبليغ');
 return base.map((x,i)=>({id:'n'+i,t:x,st:'client',src:'',note:''}))}
const api={NEED_ST,RECS,gatherDefaults};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof A==='undefined'||typeof document==='undefined')return;

const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const can=()=>!(root.MQ&&MQ.readOnly);
const save=()=>{if(root.MQ&&MQ.saveState)MQ.saveState()};
const ta=(id,label,val,ph,rows=3)=>`<label class="wide">${label}<textarea class="field" id="${id}" rows="${rows}" placeholder="${esc(ph||'')}">${esc(val||'')}</textarea></label>`;

/* ── جمع المعلومات والمستندات ── */
function gatherTab(k){const g=k.gather||{};const need=Array.isArray(g.need)?g.need:gatherDefaults(k);const ds=(root.docs||[]).filter(d=>d.k===k.id);
 const miss=need.filter(n=>n.st==='client'),agency=need.filter(n=>n.st==='agency'),have=need.filter(n=>n.st==='have');
 const rows=need.map((n,i)=>`<tr data-i="${i}"><td><input class="field" data-f="t" value="${esc(n.t)}" placeholder="اسم المستند"></td><td><select class="field" data-f="st">${Object.entries(NEED_ST).map(([v,[t]])=>`<option value="${v}" ${n.st===v?'selected':''}>${t}</option>`).join('')}</select></td><td><input class="field" data-f="src" value="${esc(n.src||'')}" placeholder="من يوفّره / الجهة"></td><td><input class="field" data-f="note" value="${esc(n.note||'')}" placeholder="ملاحظة"></td><td><button type="button" class="btn sm" data-act="cwNeedDel" data-v="${i}" title="حذف">×</button></td></tr>`).join('');
 return `<div class="grid2 cw">
 <section class="panel"><header><h2>وقائع القضية وأطرافها</h2><span class="pill">${g.updated?'آخر تحديث '+dmy(String(g.updated).slice(0,10)):'لم تُوثَّق بعد'}</span></header><div class="bd"><form class="form" id="fGather">
  ${ta('gwFacts','ملخص الوقائع كما رواها الموكل',g.facts,'ماذا حدث؟ متى وأين؟ ومن الأطراف؟',5)}
  ${ta('gwClaim','المطلوب / طلبات الموكل',g.claim,'مثال: إلزام المدعى عليه بدفع 18,500 شيكل مع الفائدة والرسوم',2)}
  ${ta('gwParties','الأطراف والشهود (الاسم، الصفة، وسيلة الاتصال)',g.parties,'كل طرف أو شاهد في سطر',3)}
  ${ta('gwTimeline','التسلسل الزمني للوقائع',g.timeline,'التاريخ — الحدث',3)}
  ${ta('gwNotes','ملاحظات المقابلة الأولى',g.notes,'',2)}
  <div class="toolbar wide"><button class="btn pri" ${can()?'':'disabled'}>حفظ المعلومات</button></div></form></div></section>
 <div class="stack">
  <section class="panel"><header><h2>المستندات المطلوبة</h2><span class="pill ${miss.length?'warn':'ok'}">${have.length} متوفر · ${miss.length+agency.length} ناقص</span></header><div class="bd">
   <div class="tablewrap"><table class="cw-need"><thead><tr><th>المستند</th><th>الحالة</th><th>المصدر</th><th>ملاحظة</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
   <div class="toolbar"><button type="button" class="btn sm" data-act="cwNeedAdd" data-v="${k.id}">+ مستند مطلوب</button><button type="button" class="btn sm" data-act="cwNeedSave" data-v="${k.id}" ${can()?'':'disabled'}>حفظ القائمة</button>${miss.length?`<button type="button" class="btn sm gold" data-act="cwAskClient" data-v="${k.id}">طلب الناقص من الموكل (${miss.length})</button>`:''}<button type="button" class="btn sm" data-act="hubTab" data-v="docs">رفع مستند إلى الملف</button></div>
  </div></section>
  <section class="panel"><header><h2>مستندات الملف (${ds.length})</h2></header><div class="bd">${ds.length?`<div class="list">${ds.map(d=>`<div class="row"><div><div class="t">${esc(d.title)}</div><div class="m">${esc(d.kind||'')} · ${esc(d.src||'')} · ${dmy(d.date)}</div></div></div>`).join('')}</div>`:'<div class="empty">لا مستندات مرفوعة بعد.</div>'}</div></section>
 </div></div>`}

/* ── الدراسة القانونية والتقييم الأولي ── */
function studyTab(k){const s=k.study||{};const rec=s.rec||'';
 return gatherTab(k)+`<div class="grid2 cw" style="margin-top:14px">
 <section class="panel"><header><h2>الدراسة القانونية والقرار</h2><span class="pill">${s.updated?'آخر تحديث '+dmy(String(s.updated).slice(0,10)):'لم تُعدّ بعد'}</span></header><div class="bd"><form class="form" id="fStudy">
  ${ta('swBasis','الأساس القانوني (النصوص والمواد المنطبقة)',s.basis,'مثال: المادة 208 من قانون أصول المحاكمات المدنية والتجارية رقم 2 لسنة 2001',3)}
  <label>الاختصاص (نوعي / مكاني)<input class="field" id="swJur" value="${esc(s.jur||'')}" placeholder="مثال: محكمة بداية نابلس"></label>
  <label>التقادم والمواعيد القانونية<input class="field" id="swLim" value="${esc(s.lim||'')}" placeholder="مثال: لم تنقضِ مدة التقادم"></label>
  ${ta('swStrong','نقاط القوة',s.strong,'',3)}
  ${ta('swWeak','نقاط الضعف والمخاطر',s.weak,'',3)}
  ${ta('swEvid','البينات المتاحة وما يلزم استكماله',s.evid,'',2)}
  <label>التقدير المالي المتوقع<input class="field" id="swEst" value="${esc(s.est||'')}" placeholder="مثال: 18,500 شيكل + الرسوم"></label>
  <label>التكلفة والمدة التقريبية<input class="field" id="swCost" value="${esc(s.cost||'')}" placeholder="مثال: 8–12 شهراً"></label>
  <fieldset class="wide cw-rec"><legend>التوصية</legend>${Object.entries(RECS).map(([v,[t]])=>`<label class="ck"><input type="radio" name="swRec" value="${v}" ${rec===v?'checked':''}> ${t}</label>`).join('')}</fieldset>
  ${ta('swRecNote','مسوّغات التوصية وما يُبلَّغ للموكل',s.recNote,'',2)}
  <div class="toolbar wide"><button class="btn pri" ${can()?'':'disabled'}>حفظ الدراسة وتحديث مسار القضية</button><button type="button" class="btn" data-act="cwPrintStudy" data-v="${k.id}">طباعة مذكرة التقييم</button></div></form></div></section>
 <div class="stack">
  <section class="panel"><header><h2>أدوات مساعدة</h2></header><div class="bd list">
   <button class="row clk" data-act="nav" data-v="laws"><div><div class="t">التشريعات الفلسطينية</div><div class="m">البحث في نصوص القوانين والمواد</div></div></button>
   <button class="row clk" data-act="nav" data-v="rulings"><div><div class="t">الاجتهادات القضائية</div><div class="m">أحكام سابقة في مسائل مشابهة</div></div></button>
   <button class="row clk" data-act="nav" data-v="calc"><div><div class="t">الحاسبات القانونية</div><div class="m">المهل والرسوم والفوائد</div></div></button>
   <button class="row clk" data-act="cwNext" data-v="c360|${k.id}"><div><div class="t">ملف القضية 360°</div><div class="m">مصفوفة البينات والتنبيهات</div></div></button>
  </div></section>
  <section class="panel"><header><h2>ما بعد التوصية</h2></header><div class="bd"><p class="m">القرار هنا هو ما يحدد مسار القضية تلقائياً: «إنذار/تسوية» يفتح التسوية، و«دعوى حقوقية» المسار الحقوقي، و«شكوى جزائية» المسار الجزائي، و«اعتذار» يقفل الملف. وتنتقل القضية إلى محطة «المتابعة» ويُبلَّغ الموكل بالقرار.</p></div></section>
 </div></div>`}

/* ربط التبويبين بشاشة القضية */
{const ct=root.caseTab;if(typeof ct==='function')root.caseTab=k=>S.caseTab==='gather'||S.caseTab==='study'?studyTab(k):ct(k)}
const v0=V.case;V.case=function(){let h=v0.apply(this,arguments);
 h=h.replace('<button class="'+(S.caseTab==='track'?'on':'')+'" data-act="caseTab" data-v="track">',`<button class="${S.caseTab==='study'||S.caseTab==='gather'?'on':''}" data-act="caseTab" data-v="study">الدراسة والقرار</button><button class="${S.caseTab==='track'?'on':''}" data-act="caseTab" data-v="track">`);
 return h};

function readNeed(){return [...document.querySelectorAll('table.cw-need tbody tr')].map((tr,i)=>({id:'n'+i,t:tr.querySelector('[data-f=t]').value.trim(),st:tr.querySelector('[data-f=st]').value,src:tr.querySelector('[data-f=src]').value.trim(),note:tr.querySelector('[data-f=note]').value.trim()})).filter(n=>n.t)}
function saveNeed(k){if(!can())return toast('صلاحيتك للاطلاع فقط');k.gather={...(k.gather||{}),need:readNeed(),updated:iso(TODAY)};save()}
A.cwNeedAdd=v=>{const k=K(v);if(!k)return;k.gather={...(k.gather||{}),need:[...readNeed(),{id:'n'+Date.now(),t:'',st:'client',src:'',note:''}]};render();const r=document.querySelector('table.cw-need tbody tr:last-child input');if(r)r.focus()};
A.cwNeedDel=v=>{const k=K(S.caseId);if(!k)return;const need=readNeed();need.splice(+v,1);k.gather={...(k.gather||{}),need};render()};
A.cwNeedSave=v=>{const k=K(v);if(!k)return;saveNeed(k);render();toast('حُفظت قائمة المستندات')};
A.cwAskClient=v=>{const k=K(v);if(!k||!can())return;saveNeed(k);const miss=(k.gather.need||[]).filter(n=>n.st==='client');if(!miss.length)return;
 const c=C(k.client);const t='تحية طيبة، لاستكمال ملف قضيتك رقم '+k.no+' نرجو تزويدنا بالمستندات التالية:\n'+miss.map((n,i)=>(i+1)+'. '+n.t+(n.note?' ('+n.note+')':'')).join('\n')+'\nيمكنك تصويرها وإرسالها من تطبيق البوابة مباشرة.';
 if(typeof sendMsg==='function')sendMsg(k.client,t,c?c.ch:'البوابة');save();toast('أُرسل طلب المستندات إلى '+(c?c.name:'الموكل'));render()};
A.cwNext=v=>{const [tab,kid]=v.split('|');S.view='case';S.caseId=kid;S.caseTab=tab;window.scrollTo(0,0);render()};
A.cwPrintStudy=v=>{const k=K(v);if(!k||!root.MQP)return;const s=k.study||{},M=MQP,B=M.B,E=M.esc,c=C(k.client)||{};
 M.open({label:'مذكرة تقييم أولي',build(){return {title:'مذكرة دراسة قانونية وتقييم أولي',sub:k.subject,ref:'د/'+k.no,file:'تقييم أولي - '+k.no,blocks:[
  B.kv([['الموكل',E(c.name||'')],['القضية','<span class="mono">'+E(k.no)+'</span> · '+E(k.type||'')],['المحكمة',E((CT(k.court)||{}).name||'')],['تاريخ المذكرة',dmy(iso(TODAY))]],2),
  B.h('الأساس القانوني'),B.p(E(s.basis||'—')),B.kv([['الاختصاص',E(s.jur||'—')],['التقادم والمواعيد',E(s.lim||'—')],['التقدير المالي',E(s.est||'—')],['التكلفة والمدة',E(s.cost||'—')]],2),
  B.h('نقاط القوة'),B.p(E(s.strong||'—')),B.h('نقاط الضعف والمخاطر'),B.p(E(s.weak||'—')),B.h('البينات'),B.p(E(s.evid||'—')),
  B.h('التوصية'),B.box('<b>'+E((RECS[s.rec]||['لم تُحدد'])[0])+'</b>'+(s.recNote?'<br>'+E(s.recNote):'')),
  B.p('<small>مذكرة داخلية للمكتب تُعدّ على مسؤولية المحامي، ولا تُعدّ رأياً قانونياً نهائياً للموكل.</small>','s')],sign:['المحامي المسؤول']}}})};

document.addEventListener('submit',e=>{const f=e.target;if(!['fGather','fStudy'].includes(f.id))return;e.preventDefault();e.stopImmediatePropagation();
 if(!can())return toast('صلاحيتك للاطلاع فقط');const k=K(S.caseId);if(!k)return;const g=id=>(document.getElementById(id)||{}).value||'';
 if(f.id==='fGather'){k.gather={...(k.gather||{}),facts:g('gwFacts').trim(),claim:g('gwClaim').trim(),parties:g('gwParties').trim(),timeline:g('gwTimeline').trim(),notes:g('gwNotes').trim(),need:readNeed(),updated:iso(TODAY)};
  if(!k.flowAt||k.flowAt<3)k.flowAt=3;save();render();toast('حُفظت معلومات القضية')}
 if(f.id==='fStudy'){const rec=(f.querySelector('input[name=swRec]:checked')||{}).value||'';
  k.study={basis:g('swBasis').trim(),jur:g('swJur').trim(),lim:g('swLim').trim(),strong:g('swStrong').trim(),weak:g('swWeak').trim(),evid:g('swEvid').trim(),est:g('swEst').trim(),cost:g('swCost').trim(),rec,recNote:g('swRecNote').trim(),updated:iso(TODAY)};
  const nx=rec&&RECS[rec]?RECS[rec][1]:null;if(nx)k.flowAt=nx;else if(!k.flowAt||k.flowAt<4)k.flowAt=4;
  if(rec==='crime')k.flow='criminal';else if(rec==='court')k.flow='civil';
  const SS=root.MQ_station;const by=(root.MQ&&MQ.user&&MQ.user.name)||'';
  if(rec==='decline'){k.status='منتهية';k.stage='اعتذار عن القضية';k.closed={date:iso(TODAY),result:'اعتذار عن القضية',archive:'',by};if(SS)SS.setStation(k,'closed','اعتذار بعد الدراسة',by)}
  else if(['amic','court','crime'].includes(rec)){if(SS)SS.setStation(k,'follow','قرار الدراسة: '+RECS[rec][0],by);const c=C(k.client)||{};if(typeof sendMsg==='function'&&g('swRecNote').trim())sendMsg(k.client,'بعد دراسة ملفكم، قرر المكتب: '+RECS[rec][0]+'. '+g('swRecNote').trim(),c.ch||'البوابة')}
  save();render();toast(nx?'حُفظت الدراسة وانتقلت القضية إلى: '+(root.MQ_wf&&MQ_wf.byId[nx]?MQ_wf.byId[nx].t:'المرحلة التالية'):'حُفظت الدراسة')}
});
root.MQ_casework={gatherTab,studyTab};
}(typeof window!=='undefined'?window:globalThis));
