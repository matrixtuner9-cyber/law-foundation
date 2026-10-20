/* ── مصادر الأحكام ──
   شاشة واحدة لمصدرين خارجيين للأحكام والمبادئ، يبحث فيهما المحامي بنفسه (طلب لكل ضغطة) عبر خادم المكتب:
   1) «مبادئ قضائية» – المكتب الفني في مجلس القضاء الأعلى (courts.gov.ps): عام بلا تسجيل دخول، مبادئ النقض مصنّفة حسب القانون مع وثيقة PDF.
   2) «المقتفي» – معهد الحقوق في جامعة بيرزيت: قاعدة الأحكام النظامية (النقض، الاستئناف، العدل العليا…) للمشتركين؛ اشتراك المكتب يُحفظ في الخادم.
   كل نتيجة تُحفظ في مكتبة الاجتهادات بمبادئها ونصها ورابط مصدرها بعد مراجعة المحامي. لا جلب آلي ولا سحب جماعي. */
(function(){
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const can2=w=>!!(window.MQ&&MQ.user&&({admin:{write:1,manage:1},lawyer:{write:1}}[MQ.user.role]||{})[w]);
const ST={tab:'sjc',
 sjc:{cls:'',q:'',inText:false,classes:null,data:null,busy:false,err:'',saving:0},
 mq:{st:null,q:'',match:'any',court:'',domain:'',caseType:'',region:'',number:'',year:'',from:'',to:'',inP:false,inC:false,data:null,busy:false,err:'',open:null,detail:{},credOpen:false,credBusy:false}};
const NAV_I=NAV.findIndex(n=>n[0]==='maqamsearch');NAV.splice((NAV_I<0?NAV.findIndex(n=>n[0]==='rulings'):NAV_I)+1,0,['sources','مصادر الأحكام']);
if(window.NAV_ICON)NAV_ICON.sources='<svg viewBox="0 0 24 24"><path d="M4 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H4z"/><path d="M20 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z"/></svg>';

async function api(path,opt){
 const r=await fetch('/api/admin/'+path,{credentials:'same-origin',...(opt||{})});
 if(r.status===401){location.replace('/login.html');throw new Error('انتهت الجلسة')}
 return r;
}
async function j(path,opt){const r=await api(path,opt),x=await r.json().catch(()=>({}));if(!r.ok){const er=new Error(x.error||'تعذّر الاتصال بالمصدر');er.needCred=x.needCred;er.badCred=x.badCred;throw er}return x}
const post=(path,body)=>j(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
const inLib=u=>(typeof rulings!=='undefined'?rulings:[]).find(x=>x.srcUrl===u);
const hl=(t,q)=>{t=e(t);const ws=String(q||'').split(/\s+/).filter(w=>w.length>1);if(!ws.length)return t;try{return t.replace(new RegExp('('+ws.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')','g'),'<mark>$1</mark>')}catch(x){return t}};

/* ═══ 1) مبادئ المكتب الفني ═══ */
async function sjcClasses(){const s=ST.sjc;if(s.classes)return;try{s.classes=(await j('sjc/classes')).classes}catch(x){s.classes=[];s.err=x.message}paint()}
async function sjcRun(){
 const s=ST.sjc;readSjc();if(!s.q.trim()&&!s.cls){toast('اكتب كلمة البحث أو اختر تصنيفاً');return}
 if(s.busy)return;s.busy=true;s.err='';paint();
 try{s.data=await post('sjc/search',{cls:s.cls,q:s.q.trim(),inText:s.inText})}catch(x){s.err=x.message;s.data=null}
 s.busy=false;paint();
}
function readSjc(){const g=id=>document.getElementById(id);if(!g('sjQ'))return;const s=ST.sjc;s.q=g('sjQ').value;s.cls=g('sjCls').value;s.inText=g('sjIn').value==='text'}
function sjcForm(){
 const s=ST.sjc,cl=s.classes||[];
 return `<form class="bd src-form" id="sjForm" autocomplete="off">
  <select class="field" id="sjCls" aria-label="التصنيف"><option value="">كل التصنيفات</option>${cl.map(c=>`<option value="${e(c.id)}" ${s.cls===c.id?'selected':''}>${e(c.name)}</option>`).join('')}</select>
  <input class="field" id="sjQ" value="${e(s.q)}" maxlength="200" placeholder="كلمة البحث: حساب جاري، كمبيالة، فصل تعسفي…" aria-label="كلمة البحث">
  <select class="field" id="sjIn" aria-label="مجال البحث"><option value="p" ${!s.inText?'selected':''}>في نص المبدأ</option><option value="text" ${s.inText?'selected':''}>في نص الحكم</option></select>
  <button class="btn pri" id="sjGo" ${s.busy?'disabled':''}>بحث</button></form>`;
}
function sjcResults(){
 const s=ST.sjc;
 if(s.busy)return '<section class="panel"><div class="empty src-load">جارٍ البحث في مبادئ المكتب الفني…</div></section>';
 if(s.err)return `<section class="panel"><div class="bd"><div class="note" style="color:var(--danger)">${e(s.err)}</div></div></section>`;
 const d=s.data;
 if(!d)return `<section class="panel rl-empty"><div class="bd"><b>مبادئ محكمة النقض كما ينشرها المكتب الفني في مجلس القضاء الأعلى.</b><p>اختر القانون (عمل، التجاري، التأمين، المالكين والمستأجرين…) أو اكتب كلمة، فتظهر المبادئ برقمها، ولكل مبدأ وثيقة PDF بنص الحكم. احفظ ما يفيدك في مكتبة الاجتهادات بضغطة، فيُرفق ملف الوثيقة بالسجل.</p><p class="m">مصدر عام بلا تسجيل دخول. يُسأل الموقع عند ضغطك «بحث» فقط.</p></div></section>`;
 if(!d.results.length)return '<section class="panel"><div class="empty">لا مبادئ مطابقة. جرّب كلمة أخرى أو تصنيفاً آخر.</div></section>';
 const cnt=n=>n===1?'مبدأ واحد':n===2?'مبدآن':n<=10?n+' مبادئ':n+' مبدأً';
 return `<div class="src-top m">${cnt(d.results.length)}${d.cls?` في «${e(d.cls.name)}»`:''} · <a href="https://www.courts.gov.ps/TechnicalOffice/SearchJudicialPrincipl.aspx" target="_blank" rel="noopener noreferrer">فتح الصفحة في موقع المجلس ↗</a> · <button class="link" data-act="srcSjcPrint">طباعة القائمة</button></div>
 <div class="stack">${d.rulings.map((r,i)=>{const lib=inLib(r.srcUrl);return `<section class="panel rl-card src-card"><header><div class="rl-h"><span class="pill mz">مبدأ ${e(r.no.replace(/^مبدأ /,''))}</span>${d.cls?`<span class="m">${e(d.cls.name)}</span>`:''}</div>
   <div class="toolbar">${can2('write')?(lib?`<button class="btn sm" data-act="rOpen" data-v="${e(lib.id)}">في المكتبة ✓</button>`:`<button class="btn sm pri" data-act="srcSaveSjc" data-v="${i}" ${s.saving===r.sjcId?'disabled':''}>${s.saving===r.sjcId?'جارٍ جلب الوثيقة…':'حفظ في المكتبة'}</button>`):''}<a class="btn sm" href="${e(r.pdfUrl)}" target="_blank" rel="noopener noreferrer">الوثيقة (PDF) ↗</a></div></header>
   <div class="bd"><div class="rl-p">${hl(r.principle,s.q)}</div></div></section>`}).join('')}</div>`;
}
A.srcSaveSjc=async v=>{
 const s=ST.sjc,r=s.data&&s.data.rulings[Number(v)];if(!r||s.saving)return;
 s.saving=r.sjcId;paint();
 let file=null;
 try{const x=await api('sjc/pdf?id='+r.sjcId);if(x.ok){const b=await x.blob();file=new File([b],'مبدأ-'+r.no.replace(/^مبدأ /,'').replace('/','-')+'.pdf',{type:'application/pdf'})}else{const er=await x.json().catch(()=>({}));toast(er.error||'تعذّر جلب الوثيقة، سيُحفظ المبدأ برابطه')}}
 catch(x){toast('تعذّر جلب الوثيقة، سيُحفظ المبدأ برابطه')}
 s.saving=0;paint();
 const {sjcId,pdfUrl,extracted,year,classifications,...rec}=r;
 A.rPrefill(rec,file);
};

/* ═══ 2) المقتفي ═══ */
async function mqStatus(){const m=ST.mq;try{m.st=await j('muqtafi/status')}catch(x){m.st={configured:false,canManage:false,error:x.message}}paint()}
function readMq(){const g=id=>document.getElementById(id);if(!g('mqQ'))return;const m=ST.mq;m.q=g('mqQ').value;m.match=g('mqMatch').value;m.court=g('mqCourt').value;m.domain=g('mqDom').value;m.caseType=g('mqCase').value;m.region=g('mqReg').value;m.number=g('mqNum').value.trim();m.year=g('mqYear').value.trim();m.from=g('mqFrom').value;m.to=g('mqTo').value;m.inP=g('mqInP').checked;m.inC=g('mqInC').checked}
async function mqRun(){
 const m=ST.mq;readMq();
 if(!m.q.trim()&&!m.number&&!m.court&&!m.domain&&!m.from){toast('اكتب عبارة البحث أو حدّد المحكمة أو رقم القضية');return}
 if(m.busy)return;m.busy=true;m.err='';m.open=null;paint();
 try{m.data=await post('muqtafi/search',{q:m.q.trim(),match:m.match,court:m.court,domain:m.domain,caseType:m.caseType,region:m.region,number:m.number,year:m.year,from:m.from,to:m.to,in:{judgment:true,principles:m.inP,commentary:m.inC}})}
 catch(x){m.err=x.message;m.data=null;if(x.needCred&&m.st&&m.st.canManage)m.credOpen=true}
 m.busy=false;paint();
}
function credBox(){
 const m=ST.mq,st=m.st||{};
 if(!st.canManage)return st.configured?'':`<div class="src-note">البحث في المقتفي يحتاج اشتراك المكتب. يضيفه مدير المكتب من هذه الشاشة.</div>`;
 if(!m.credOpen)return `<div class="src-note"><span>${st.configured?`اشتراك المكتب في المقتفي: <b>${e(st.user)}</b>`:'لم يُضبط اشتراك المكتب في المقتفي بعد.'}</span><button class="btn sm" data-act="srcCred">${st.configured?'تغيير الاشتراك':'ضبط الاشتراك'}</button></div>`;
 return `<form class="form src-cred" id="mqCred" autocomplete="off"><div class="wide ai-note">تُحفظ بيانات اشتراك المكتب في المقتفي على خادم المكتب فقط، ولا تظهر كلمة المرور بعد حفظها لأي مستخدم. البحث يكون بطلب المحامي وباسم المكتب، فالتزم بشروط اشتراككم.</div>
  <label>اسم المستخدم<input class="field" id="mqUser" value="${e(st.user||'')}" dir="ltr" autocomplete="off" required></label>
  <label>كلمة المرور<input class="field" id="mqPass" type="password" dir="ltr" autocomplete="new-password" required></label>
  <div class="wide toolbar"><button class="btn pri" ${m.credBusy?'disabled':''}>${m.credBusy?'جارٍ التحقق…':'حفظ والتحقق من الدخول'}</button>${st.configured?`<button type="button" class="btn" data-act="srcCredRm">إزالة الاشتراك</button>`:''}<button type="button" class="btn" data-act="srcCredX">إلغاء</button></div></form>`;
}
A.srcCred=()=>{ST.mq.credOpen=true;paint()};A.srcCredX=()=>{ST.mq.credOpen=false;paint()};
A.srcCredRm=async()=>{if(!confirm('إزالة بيانات اشتراك المقتفي من خادم المكتب؟'))return;try{await post('muqtafi/cred',{user:'',pass:''});toast('أُزيل الاشتراك');ST.mq.credOpen=false;await mqStatus()}catch(x){toast(x.message)}};
document.addEventListener('submit',async ev=>{const f=ev.target;if(f.id!=='mqCred')return;ev.preventDefault();const m=ST.mq;if(m.credBusy)return;m.credBusy=true;paint();
 try{const r=await post('muqtafi/cred',{user:f.mqUser.value.trim(),pass:f.mqPass.value});toast(r.verified?'تم التحقق من الدخول إلى المقتفي ✓':'حُفظ الاشتراك لكن تعذّر التحقق: '+(r.warning||''));m.credOpen=false;await mqStatus()}
 catch(x){toast(x.message)}m.credBusy=false;paint()});

function mqForm(){
 const m=ST.mq,st=m.st||{},opt=(o,v)=>Object.entries(o||{}).map(([k,n])=>`<option value="${k}" ${v===k?'selected':''}>${e(n)}</option>`).join('');
 return `<form class="bd src-form mq-form" id="mqForm" autocomplete="off">
  <input class="field" id="mqQ" value="${e(m.q)}" maxlength="200" placeholder="عبارة البحث في نص الحكم: عقد عمل غير محدد المدة، بطلان التبليغ…" aria-label="عبارة البحث">
  <select class="field" id="mqMatch" aria-label="طريقة المطابقة"><option value="any" ${m.match==='any'?'selected':''}>أي كلمة</option><option value="all" ${m.match==='all'?'selected':''}>كل الكلمات</option><option value="phrase" ${m.match==='phrase'?'selected':''}>العبارة كما هي</option></select>
  <select class="field" id="mqCourt" aria-label="المحكمة"><option value="">كل المحاكم</option>${opt(st.courts,m.court)}</select>
  <select class="field" id="mqDom" aria-label="مجال القرار"><option value="">كل المجالات</option>${opt(st.domains,m.domain)}</select>
  <select class="field" id="mqCase" aria-label="نوع التقاضي"><option value="">نوع التقاضي</option>${opt(st.caseTypes,m.caseType)}</select>
  <select class="field" id="mqReg" aria-label="المنطقة"><option value="">المنطقة</option>${opt(st.regions,m.region)}</select>
  <input class="field mono" id="mqNum" value="${e(m.number)}" inputmode="numeric" maxlength="7" placeholder="رقم القضية" aria-label="رقم القضية">
  <input class="field mono" id="mqYear" value="${e(m.year)}" inputmode="numeric" maxlength="4" placeholder="سنتها" aria-label="سنة القضية">
  <label class="src-dt">الفصل من<input class="field" type="date" id="mqFrom" value="${e(m.from)}"></label><label class="src-dt">إلى<input class="field" type="date" id="mqTo" value="${e(m.to)}"></label>
  <label class="ms-ck"><input type="checkbox" id="mqInP" ${m.inP?'checked':''}> وفي المبادئ القانونية</label><label class="ms-ck"><input type="checkbox" id="mqInC" ${m.inC?'checked':''}> وفي التعليق</label>
  <button class="btn pri" id="mqGo" ${m.busy||!st.configured?'disabled':''}>بحث</button><button type="button" class="btn" data-act="srcMqClear">مسح</button></form>`;
}
function mqCard(r){
 const m=ST.mq,d=m.detail[r.id],open=m.open===r.id,lib=inLib(r.cardUrl);
 return `<section class="panel rl-card src-card" id="mq_${r.id}"><header><div class="rl-h"><span class="pill mz">${e(r.court)}</span><span class="mono">${e(r.no)}/${e(r.year)}</span><span class="m">${r.date?(typeof dmy==='function'?dmy(r.date):e(r.date)):''}</span><span class="m">${[r.city,r.litigation,r.field].filter(Boolean).map(e).join(' · ')}</span></div>
  <div class="toolbar"><button class="btn sm" data-act="srcMqOpen" data-v="${r.id}">${open?'إخفاء':'البطاقة والنص الكامل'}</button>${d&&d.card?`<button class="btn sm" data-act="srcMqPrint" data-v="${r.id}">طباعة</button>`:''}${can2('write')?(lib?`<button class="btn sm" data-act="rOpen" data-v="${e(lib.id)}">في المكتبة ✓</button>`:`<button class="btn sm pri" data-act="rImportUrl" data-v="${e(r.cardUrl)}">حفظ في المكتبة</button>`):''}</div></header>
  ${open?`<div class="bd">${d==='loading'?'<div class="src-load">جارٍ جلب بطاقة الحكم ونصه من المقتفي…</div>':d&&d.error?`<div class="note" style="color:var(--danger)">${e(d.error)}</div>`:d?mqDetail(d):''}</div>`:''}</section>`;
}
function mqDetail(d){
 const c=d.card,f=d.full,SEC=[['judges','الديباجة'],['facts','الأسباب والوقائع'],['reasoning','التسبيب'],['verdict','منطوق الحكم'],['conclusions','الخاتمة']];
 return `${c.principles.length?`<div class="src-pr"><b>المبادئ القانونية</b><ol>${c.principles.map(p=>`<li>${e(p.text)}</li>`).join('')}</ol></div>`:''}
  ${c.laws.length?`<div class="m src-meta">النصوص المذكورة: ${c.laws.map(l=>e(l.text)).join('؛ ')}</div>`:''}
  ${c.paths.length?`<div class="m src-meta">الكشاف: ${c.paths.map(e).join(' | ')}</div>`:''}
  ${c.related.length?`<div class="m src-meta">أحكام ذات علاقة: ${c.related.map(x=>e(x.title)).join('؛ ')}</div>`:''}
  ${f.protected?`<div class="note">النص الكامل لهذا الحكم معروض في المقتفي بصيغة محمية لا تُنسخ؛ افتحه من زر «المصدر» لقراءته هناك. تُحفظ البطاقة والمبادئ في المكتبة مع الرابط.</div>`:''}
  <div class="ms-t">${SEC.map(([k,t])=>f.sections[k]?`<h4>${t}</h4>${f.sections[k].split(/\n+/).map(x=>`<p>${hl(x,ST.mq.q)}</p>`).join('')}`:'').join('')}</div>`;
}
function mqResults(){
 const m=ST.mq,st=m.st||{};
 if(!st.configured)return `<section class="panel rl-empty"><div class="bd"><b>المقتفي: قاعدة الأحكام النظامية في معهد الحقوق – جامعة بيرزيت.</b><p>أحكام النقض والاستئناف والعدل العليا والدستورية مع بطاقة لكل حكم فيها المبادئ القانونية والنصوص المطبّقة ومسار الكشاف، والنص الكامل مقسّماً (الديباجة، الوقائع، التسبيب، المنطوق). يحتاج اشتراكاً من المعهد.</p></div></section>`;
 if(m.busy)return '<section class="panel"><div class="empty src-load">جارٍ البحث في المقتفي…</div></section>';
 if(m.err)return `<section class="panel"><div class="bd"><div class="note" style="color:var(--danger)">${e(m.err)}</div></div></section>`;
 const d=m.data;
 if(!d)return `<section class="panel rl-empty"><div class="bd"><b>ابحث في أحكام المقتفي.</b><p>اكتب عبارة من نص الحكم، وحدّد المحكمة والمجال وتاريخ الفصل لتضييق النتائج (يعرض المقتفي 30 حكماً في البحث الواحد). افتح «البطاقة والنص الكامل» لقراءة المبادئ والتسبيب، ثم «حفظ في المكتبة» فيُنقل الحكم بمبادئه ونصه إلى مكتبة الاجتهادات.</p></div></section>`;
 if(!d.results.length)return '<section class="panel"><div class="empty">لا أحكام مطابقة في المقتفي. جرّب كلمات أقل أو أزل بعض القيود.</div></section>';
 return `<div class="src-top m">${d.total?`${d.total} نتيجة في المقتفي، `:''}${d.results.length} حكماً معروضاً${d.narrow?' · <b style="color:var(--danger)">ضيّق البحث لترى الأحكام الأقرب (المقتفي يعرض أول 30 فقط)</b>':''}</div><div class="stack">${d.results.map(mqCard).join('')}</div>`;
}
A.srcMqOpen=async v=>{const m=ST.mq,id=Number(v);if(m.open===id){m.open=null;paint();return}m.open=id;if(m.detail[id]&&!m.detail[id].error){paint();return}
 m.detail[id]='loading';paint();try{m.detail[id]=await j('muqtafi/judgment?id='+id)}catch(x){m.detail[id]={error:x.message}}paint()};
A.srcMqClear=()=>{Object.assign(ST.mq,{q:'',match:'any',court:'',domain:'',caseType:'',region:'',number:'',year:'',from:'',to:'',inP:false,inC:false,data:null,err:''});paint()};

/* ═══ الطباعة بمحرك الطباعة الموحد (ترويسة المكتب وترقيم الصفحات) ═══ */
const SEC_T=[['judges','الديباجة'],['facts','الأسباب والوقائع'],['reasoning','التسبيب'],['verdict','منطوق الحكم'],['conclusions','الخاتمة']];
const paras=t=>String(t||'').split(/\n+/).map(x=>x.trim()).filter(Boolean).flatMap(x=>{const o=[];for(let i=0;i<x.length;i+=900){let j=Math.min(x.length,i+900);if(j<x.length){const k=x.lastIndexOf(' ',j);if(k>i+500)j=k}o.push(x.slice(i,j));i=j-900}return o});
A.srcMqPrint=v=>{const m=ST.mq,id=Number(v),d=m.detail[id],r=(m.data&&m.data.results||[]).find(x=>x.id===id);if(!d||!d.card||!window.MQP){toast('افتح البطاقة أولاً');return}
 const c=d.card,f=d.full,M=window.MQP,B=M.B,E=M.esc,today=iso(TODAY),title=`حكم محكمة ${c.court||(r&&r.court)||''} ${c.litigation||''} ${c.no||(r&&r.no)||''}/${c.year||(r&&r.year)||''}`.replace(/\s+/g,' ');
 MQP.open({label:title,build(){const blocks=[B.kv([['المحكمة',E(c.court||'')+(c.city?' – '+E(c.city):'')],['رقم الدعوى',E((c.litigation?c.litigation+' ':'')+(c.no||'')+'/'+(c.year||''))],['تاريخ الفصل',c.date?dmy(c.date):'—'],['المجال',E(c.domain||(r&&r.field)||'')]],2)];
   if(c.principles.length)blocks.push(B.box('<b>المبادئ القانونية:</b><br>'+c.principles.map(p=>p.n+'- '+E(p.text)).join('<br>')));
   if(c.laws.length)blocks.push(B.p('<small><b>النصوص القانونية المذكورة:</b> '+c.laws.map(l=>E(l.text)+(l.kind?' ('+E(l.kind)+')':'')).join('؛ ')+'</small>','s'));
   if(c.paths.length)blocks.push(B.p('<small><b>الكشاف:</b> '+c.paths.map(E).join(' | ')+'</small>','s'));
   if(f.protected)blocks.push(B.p('النص الكامل لهذا الحكم معروض في المقتفي بصيغة محمية؛ يُراجع في المصدر.'));
   SEC_T.forEach(([k,t])=>{if(f.sections[k]){blocks.push(B.h(t));paras(f.sections[k]).forEach(x=>blocks.push(B.p(E(x))))}});
   blocks.push(B.p('<small>المصدر: المقتفي · معهد الحقوق – جامعة بيرزيت · يرجى مطابقة النص مع الحكم الأصلي قبل الاستشهاد.</small>','s'));
   return {title,sub:'نسخة من المقتفي (معهد الحقوق – جامعة بيرزيت)',ref:'مق/'+today,file:title+' - '+today,orient:'port',blocks,sign:[]}}})};
A.srcSjcPrint=()=>{const d=ST.sjc.data;if(!d||!d.results.length||!window.MQP)return;const M=window.MQP,B=M.B,E=M.esc,today=iso(TODAY),title='مبادئ قضائية – المكتب الفني في مجلس القضاء الأعلى';
 MQP.open({label:title,build(){return {title,sub:(d.cls?'تصنيف «'+d.cls.name+'»':'نتائج البحث')+(ST.sjc.q?' · كلمة البحث: '+ST.sjc.q:''),ref:'مف/'+today,file:title+' - '+today,orient:'port',sign:[],
   blocks:[B.t(['#','رقم المبدأ','نص المبدأ'],d.results.map((r,i)=>[i+1,E(r.no),E(r.title)]),{w:['5%','14%','81%']}),B.p('<small>المصدر: courts.gov.ps — المكتب الفني · لكل مبدأ وثيقة PDF بنص الحكم في الموقع. يرجى مطابقة النصوص قبل الاستشهاد.</small>','s')]}}})};

/* ═══ الشاشة ═══ */
A.srcTab=v=>{ST.tab=v;paint();if(v==='mq'&&!ST.mq.st)mqStatus();if(v==='sjc'&&!ST.sjc.classes)sjcClasses()};
function body(){
 return `<div class="src-tabs"><button class="src-tab ${ST.tab==='sjc'?'on':''}" data-act="srcTab" data-v="sjc">مبادئ المكتب الفني <small>مجلس القضاء الأعلى · عام</small></button><button class="src-tab ${ST.tab==='mq'?'on':''}" data-act="srcTab" data-v="mq">المقتفي <small>معهد الحقوق – بيرزيت · اشتراك</small></button></div>
 ${ST.tab==='sjc'?`<section class="panel">${sjcForm()}</section>${sjcResults()}`:`${credBox()}<section class="panel">${mqForm()}</section>${mqResults()}`}`;
}
V.sources=()=>{setTimeout(()=>{if(ST.tab==='sjc')sjcClasses();else mqStatus()},0);
 return `<div class="head"><div><h1>مصادر الأحكام</h1><p class="sub">بحث مباشر في مبادئ المكتب الفني (مجلس القضاء الأعلى) وفي أحكام المقتفي (بيرزيت)، وحفظ ما يفيدك في مكتبة الاجتهادات بمبادئه ونصه ورابط مصدره</p></div>
 <div class="toolbar"><button class="btn" data-act="nav" data-v="maqamsearch">البحث في الأحكام (مقام)</button><button class="btn" data-act="nav" data-v="rulings">مكتبة الاجتهادات</button></div></div><div id="srcBody">${body()}</div>`};
function paint(){const el=document.getElementById('srcBody');if(el&&S.view==='sources')el.innerHTML=body();paintSettings()}

/* ═══ قسم في شاشة الإعدادات: اشتراكات المصادر والخدمات الخارجية (لمدير المكتب) ═══ */
const SS={ai:null,aiOpen:false,aiBusy:false,use:null,month:'',ap:null,apOpen:false,apBusy:false,apP8:''};
/* إشعارات تطبيق الموكل على الآيفون (Apple Push): مفتاح .p8 من حساب Apple Developer يُحفظ في الخادم ولا يُعاد */
async function apStatus(){try{SS.ap=await j('apns')}catch(x){SS.ap={configured:false,error:x.message}}paintSettings()}
const AP_WHY={network:'تعذّر الوصول إلى خادم Apple',InvalidProviderToken:'رقم المفتاح أو الفريق أو ملف ‎.p8‎ غير صحيح',BadKey:'ملف ‎.p8‎ غير صالح',DeviceTokenNotForTopic:'معرّف التطبيق Bundle ID لا يطابق التطبيق',TopicDisallowed:'معرّف التطبيق غير مسموح لهذا المفتاح',BadDeviceToken:'رمز الجهاز غير صالح (أُزيل)',Unregistered:'حُذف التطبيق من الجهاز (أُزيل)',TooManyRequests:'طلبات كثيرة، حاول لاحقاً'};
const apWhy=k=>AP_WHY[k]||k;
const allClients=()=>(typeof clients!=='undefined'&&Array.isArray(clients)?clients:[]).filter(c=>!c.archived);
function apBox(){const a=SS.ap;if(!a)return '<div class="m">جارٍ القراءة…</div>';if(a.error)return `<div class="note" style="color:var(--danger)">${e(a.error)}</div>`;
 if(SS.apOpen)return `<form class="form src-cred" id="srcApForm" autocomplete="off"><div class="wide ai-note">من حساب Apple Developer ← Certificates, Identifiers &amp; Profiles ← Keys: أنشئ مفتاحاً مفعّلاً عليه «Apple Push Notifications service (APNs)» ونزّل ملف ‎.p8‎ (يُنزَّل مرة واحدة فقط). يُحفظ في خادم المكتب ولا يظهر بعد حفظه.</div>
  <label>رقم المفتاح Key ID<input class="field mono" id="srcApKey" dir="ltr" maxlength="10" value="${e(a.keyId||'')}" placeholder="ABC123DEFG" required></label>
  <label>رقم الفريق Team ID<input class="field mono" id="srcApTeam" dir="ltr" maxlength="10" value="${e(a.teamId||'')}" placeholder="أعلى يمين صفحة Membership" required></label>
  <label class="wide">معرّف التطبيق Bundle ID<input class="field mono" id="srcApTopic" dir="ltr" value="${e(a.topic||'ps.mithaq.mithaqPortal')}" required></label>
  <label class="wide">ملف المفتاح ‎.p8‎ ${a.configured?'<small class="m">(اتركه فارغاً لإبقاء المفتاح المحفوظ)</small>':''}<input class="field" id="srcApFile" type="file" accept=".p8,text/plain"></label>
  <div class="wide toolbar"><button class="btn pri" ${SS.apBusy?'disabled':''}>حفظ</button><button type="button" class="btn" data-act="srcApX">إلغاء</button></div></form>`;
 const cl=allClients();
 return `<div class="st-row"><div>${a.configured?`<span class="pill ok">مضبوط</span> المفتاح <span class="mono">${e(a.keyId)}</span> · الفريق <span class="mono">${e(a.teamId)}</span> <span class="m">· ${a.devices||0} جهاز آيفون لـ ${a.clients||0} موكل</span>`:'<span class="m">لم يُضبط بعد. بدونه يعمل تطبيق الآيفون لكن لا تصل التنبيهات والتطبيق مغلق.</span>'}</div><div class="toolbar"><button type="button" class="btn sm" data-act="srcAp">${a.configured?'تغيير':'ضبط الإشعارات'}</button>${a.configured?'<button type="button" class="btn sm" data-act="srcApRm">إزالة</button>':''}</div></div>
 ${a.configured?`<div class="st-row" style="margin-top:8px"><div class="m">تجربة: أرسل تنبيهاً إلى آيفون موكل سجّل دخوله من التطبيق</div><div class="toolbar"><select class="field" id="srcApCl" style="max-width:220px">${cl.map(c=>`<option value="${e(c.id)}">${e(c.name)}</option>`).join('')}</select><button type="button" class="btn sm" data-act="srcApTest" ${SS.apBusy?'disabled':''}>إرسال تجربة</button></div></div>`:''}`}
async function aiUsage(){try{SS.use=await j('ai/usage'+(SS.month?'?month='+SS.month:''))}catch(x){SS.use={error:x.message}}paintSettings()}
const AI_KIND={'ai.draft':'صياغة لوائح ومستندات','ai.draft_failed':'صياغة لم تكتمل','ai.assist':'المساعد','ai.assist_failed':'طلبات مساعد لم تكتمل','ai.extract':'قراءة لائحة الخصم','ai.calc_extract':'استخراج معطيات الحاسبات','ai.ruling_extract':'استخراج مبادئ الأحكام'};
const AI_MODE={howto:'أسئلة عن التطبيق',brief:'ملخص قبل الجلسة',defences:'الدفوع والمهل',question:'سؤال قانوني',contract:'مراجعة عقد',opponent:'تحليل مستند للخصم',gaps:'ثغرات مستند',appeal:'أسباب الطعن',similar:'أحكام مشابهة',client_msg:'رسالة للموكل',minutes:'محضر اجتماع',translate:'ترجمة'};
const kindName=k=>{const [a,m]=k.split(':');return m?(AI_MODE[m]||m):(AI_KIND[a]||a)};
const usd=x=>'$'+(Number(x)||0).toFixed(2);
function usageBox(){const u=SS.use;if(!u)return '<div class="m">جارٍ حساب الاستهلاك…</div>';if(u.error)return `<div class="m">${e(u.error)}</div>`;
 const t=u.total,mo=[0,1,2].map(i=>{const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')});
 return `<div class="src-use"><div class="st-row"><div><b>استهلاك الشهر</b> <select class="field src-mo" id="srcMo">${mo.map(m=>`<option ${u.month===m?'selected':''}>${m}</option>`).join('')}</select></div><div class="src-use-tot"><span>${t.ops} عملية</span><b>${usd(t.usd)}</b><small class="m">تقديري</small></div></div>
  ${t.ops?`<div class="src-use-g"><table class="src-tbl"><thead><tr><th>المستخدم</th><th>العمليات</th><th>التكلفة</th></tr></thead><tbody>${u.users.map(x=>`<tr><td>${e(x.user)}</td><td>${x.ops}</td><td>${x.metered?usd(x.usd):'—'}</td></tr>`).join('')}</tbody></table>
  <table class="src-tbl"><thead><tr><th>نوع العملية</th><th>العمليات</th><th>التكلفة</th></tr></thead><tbody>${u.kinds.map(x=>`<tr><td>${e(kindName(x.kind))}</td><td>${x.ops}</td><td>${x.metered?usd(x.usd):'—'}</td></tr>`).join('')}</tbody></table></div>`:'<div class="m">لا عمليات ذكاء اصطناعي في هذا الشهر.</div>'}
  <div class="m" style="margin-top:6px">تُحسب من الاستهلاك الفعلي الذي يعيده المزوّد وبأسعار تقديرية للنموذج ${e(u.model||'')}${t.unmetered?` · ${t.unmetered} عملية قديمة بلا قياس (—)`:''}. الفاتورة الرسمية في لوحة Anthropic، ويُنصح بضبط سقف شهري للإنفاق هناك.</div></div>`}
document.addEventListener('change',ev=>{if(ev.target.id!=='srcMo')return;SS.month=ev.target.value;SS.use=null;paintSettings();aiUsage()});
async function aiStatus(){try{SS.ai=await j('ai/status')}catch(x){SS.ai={configured:false,error:x.message}}paintSettings()}
function settingsBody(){
 const st=ST.mq.st,ai=SS.ai,m=ST.mq;
 const mq=!st?'<div class="m">جارٍ القراءة…</div>':st.error?`<div class="note" style="color:var(--danger)">${e(st.error)}</div>`:m.credOpen?credBox():`<div class="st-row"><div>${st.configured?`<span class="pill ok">مضبوط</span> اسم المستخدم: <b>${e(st.user)}</b> <span class="m">· كلمة المرور محفوظة في الخادم ولا تُعرض</span>`:'<span class="m">لم يُضبط اشتراك المكتب بعد. البحث في المقتفي يحتاج اشتراكاً من معهد الحقوق في جامعة بيرزيت.</span>'}</div><div class="toolbar"><button type="button" class="btn sm" data-act="srcCred">${st.configured?'تغيير':'ضبط الاشتراك'}</button>${st.configured?'<button type="button" class="btn sm" data-act="srcCredRm">إزالة</button>':''}</div></div>`;
 const aib=!ai?'<div class="m">جارٍ القراءة…</div>':SS.aiOpen?`<form class="form src-cred" id="srcAiKey" autocomplete="off"><div class="wide ai-note">مفتاح API من Anthropic (console.anthropic.com). يُحفظ في خادم المكتب فقط ولا يظهر بعد حفظه لأي مستخدم.</div><label class="wide">مفتاح API<input class="field mono" id="srcAiK" type="password" autocomplete="new-password" dir="ltr" placeholder="sk-ant-…" required></label><div class="wide toolbar"><button class="btn pri" ${SS.aiBusy?'disabled':''}>حفظ المفتاح</button><button type="button" class="btn" data-act="srcAiX">إلغاء</button></div></form>`
  :`${ai.configured?usageBox():''}<div class="st-row"><div>${ai.configured?`<span class="pill ok">مضبوط</span> ينتهي بـ <span class="mono">${e(ai.last4)}</span> <span class="m">· النموذج ${e(ai.model||'')}</span>`:'<span class="m">لم يُضبط المفتاح بعد. يلزم لتشغيل الصياغة والمساعد الذكي وحاسبات الاستخراج.</span>'}</div><div class="toolbar"><button type="button" class="btn sm" data-act="srcAi">${ai.configured?'تغيير المفتاح':'ضبط المفتاح'}</button>${ai.configured?'<button type="button" class="btn sm" data-act="srcAiRm">إزالة</button>':''}</div></div>`;
 return `<div class="bd src-set"><div class="src-set-item"><h3>المقتفي <small class="m">· معهد الحقوق – جامعة بيرزيت · قاعدة الأحكام النظامية</small></h3>${mq}</div>
 <div class="src-set-item"><h3>الذكاء الاصطناعي <small class="m">· Anthropic Claude · الصياغة والمساعد والحاسبات واستخراج المبادئ</small></h3>${aib}</div>
 <div class="src-set-item"><h3>إشعارات تطبيق الآيفون <small class="m">· Apple Push · تنبيه الموكل برسائل المحامي والتطبيق مغلق</small></h3>${apBox()}</div>
 <div class="src-set-item"><h3>مصادر عامة بلا تسجيل <small class="m">· لا تحتاج إعداداً</small></h3><div class="m">مبادئ المكتب الفني (مجلس القضاء الأعلى)، مقام (جامعة النجاح) للأحكام والتشريعات، وموقع التشريعات الأمنية.</div></div></div>`;
}
function paintSettings(){const el=document.getElementById('srcSet');if(el&&S.view==='settings')el.innerHTML=settingsBody()}
if(typeof V.settings==='function'){const vs=V.settings;V.settings=()=>{let h=vs();if(!can2('manage'))return h;setTimeout(()=>{if(!ST.mq.st)mqStatus();else paintSettings();if(!SS.ai)aiStatus();if(!SS.use)aiUsage();if(!SS.ap)apStatus()},0);
 return h+`<section class="panel" style="margin-top:16px" id="srcSetPanel"><header><h2>اشتراكات المصادر والخدمات الخارجية</h2><span class="m">تُحفظ بيانات الدخول في خادم المكتب فقط، ويستخدمها التطبيق باسم المكتب عند طلب المحامي</span></header><div id="srcSet">${settingsBody()}</div></section>`}}
A.srcAp=()=>{SS.apOpen=true;paintSettings()};A.srcApX=()=>{SS.apOpen=false;paintSettings()};
A.srcApRm=async()=>{if(!confirm('إزالة مفتاح إشعارات الآيفون؟ ستتوقف التنبيهات على أجهزة الآيفون حتى يُضبط مفتاح جديد.'))return;try{await post('apns',{clear:true});toast('أُزيل المفتاح');await apStatus()}catch(x){toast(x.message)}};
A.srcApTest=async()=>{const id=(document.getElementById('srcApCl')||{}).value;if(!id)return toast('اختر موكلاً');SS.apBusy=true;paintSettings();
 try{const r=await post('apns/test',{client:id});toast(r.sent?'أُرسل التنبيه إلى '+r.sent+' جهاز':'لم يصل: '+[...new Set(r.failed||[])].map(apWhy).join('، '))}catch(x){toast(x.message)}SS.apBusy=false;paintSettings()};
document.addEventListener('submit',async ev=>{const f=ev.target;if(f.id!=='srcApForm')return;ev.preventDefault();ev.stopImmediatePropagation();if(SS.apBusy)return;
 const file=f.srcApFile.files[0];let p8='';if(file){if(file.size>4000)return toast('ملف المفتاح غير صالح');p8=await file.text()}
 const body={keyId:f.srcApKey.value.trim(),teamId:f.srcApTeam.value.trim(),topic:f.srcApTopic.value.trim(),p8};SS.apBusy=true;const btn=f.querySelector('.btn.pri');if(btn)btn.disabled=true;
 try{await post('apns',body);toast('حُفظت إعدادات إشعارات الآيفون');SS.apOpen=false;SS.apBusy=false;await apStatus()}catch(x){toast(x.message);SS.apBusy=false;if(btn)btn.disabled=false}},true);
A.srcAi=()=>{SS.aiOpen=true;paintSettings()};A.srcAiX=()=>{SS.aiOpen=false;paintSettings()};
A.srcAiRm=async()=>{if(!confirm('إزالة مفتاح الذكاء الاصطناعي من خادم المكتب؟ ستتوقف الصياغة والمساعد حتى يُضبط مفتاح جديد.'))return;try{await post('ai/key',{key:''});toast('أُزيل المفتاح');SS.ai=null;await aiStatus()}catch(x){toast(x.message)}};
document.addEventListener('submit',async ev=>{const f=ev.target;if(f.id!=='srcAiKey')return;ev.preventDefault();ev.stopImmediatePropagation();if(SS.aiBusy)return;SS.aiBusy=true;paintSettings();
 try{await post('ai/key',{key:f.srcAiK.value.trim()});toast('حُفظ المفتاح');SS.aiOpen=false;SS.ai=null;await aiStatus()}catch(x){toast(x.message)}SS.aiBusy=false;paintSettings()},true);
document.addEventListener('submit',ev=>{if(ev.target.id==='sjForm'){ev.preventDefault();sjcRun()}else if(ev.target.id==='mqForm'){ev.preventDefault();mqRun()}});

const css=document.createElement('style');css.textContent=`
.src-tabs{display:flex;gap:8px;margin:0 4px 12px;flex-wrap:wrap}
.src-tab{border:1px solid var(--line);background:var(--panel,#fff);border-radius:12px;padding:10px 16px;cursor:pointer;font:inherit;display:flex;flex-direction:column;gap:2px;align-items:flex-start;color:var(--ink)}
.src-tab small{color:var(--muted);font-size:12px}.src-tab.on{border-color:var(--accent);background:var(--accent-soft);box-shadow:0 0 0 2px var(--accent-soft)}
.src-form{display:grid;grid-template-columns:minmax(0,1fr) 150px 150px auto;gap:10px;align-items:center}
.src-form.mq-form{grid-template-columns:repeat(6,minmax(0,1fr))}.mq-form #mqQ{grid-column:1/5}.mq-form #mqMatch{grid-column:5/7}.src-form .field,.src-form .btn{min-width:0;max-width:100%}.src-dt{display:flex;gap:6px;align-items:center;font-size:13px;color:var(--muted);white-space:nowrap;min-width:0}.src-dt .field{flex:1;width:0}
@media(max-width:900px){.src-form,.src-form.mq-form{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.src-form #sjQ,.mq-form #mqQ,.mq-form #mqMatch{grid-column:1/-1}.src-tabs{display:grid;grid-template-columns:1fr 1fr}.src-tab{min-width:0}}
.src-note{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;border:1px solid #E6D5B8;background:linear-gradient(180deg,#FBF7EE,#F7F3EA);border-radius:14px;padding:10px 16px;margin:0 4px 12px;font-size:14px}
.src-cred{margin:0 4px 12px;background:var(--panel,#fff);border:1px solid var(--line);border-radius:14px;padding:14px 18px}
.src-top{margin:2px 4px 10px}.src-top a{color:var(--accent);font-weight:600}.src-load{color:var(--muted);text-align:center;padding:18px}
.src-card mark{background:var(--warn-soft);color:inherit;padding:0 2px;border-radius:3px}
.src-pr{border-right:3px solid var(--brass);background:var(--sunk);border-radius:6px;padding:10px 14px;line-height:1.9}.src-pr ol{margin:6px 0 0;padding-right:20px}.src-meta{margin-top:8px;line-height:1.8}
.src-card .ms-t h4{margin:10px 0 4px;color:var(--brass);font-size:15px}
.src-use{border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-bottom:10px;background:var(--sunk)}.src-use-tot{display:flex;gap:10px;align-items:baseline}.src-use-tot b{font-size:20px;color:var(--brass)}.src-mo{width:auto;display:inline-block;margin-inline-start:8px;padding:4px 8px}
.src-use-g{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px}@media(max-width:800px){.src-use-g{grid-template-columns:1fr}}.src-tbl{width:100%;border-collapse:collapse;font-size:14px}.src-tbl th,.src-tbl td{padding:6px 8px;border-bottom:1px solid var(--line);text-align:right}.src-tbl th{color:var(--muted);font-weight:600}
.src-set{display:flex;flex-direction:column;gap:14px}.src-set-item h3{margin:0 0 8px;font-size:16px}.src-set-item small{font-weight:400}.src-set .src-cred{margin:0}.src-set .st-row{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}
`;document.head.appendChild(css);
})();
