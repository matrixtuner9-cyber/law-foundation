/* ── المِسْبار داخل القضية: «عقل القضية» ──
   تبويب في ملف كل قضية يربط المسبار بالقضية بمعرّفها:
   - قراءة مستندات القضية محلياً (PDF وWord والصور بالتعرف على النص العربي) دون إنترنت؛ لا يخرج الملف من المكتب.
   - فحص القضية · ميزان الحجج · الخطوة التالية · تحضير الجلسة: بعد تفعيل الإرسال لهذه القضية فقط،
     ويُرسل ما يلزم من مقاطع بعد إخفاء أرقام الهويات والحسابات والهواتف والبريد.
   - كل نتيجة سجل بسلسلة الثقة (الواقعة ← البينة ← النص ← الاستنتاج ← المخاطر ← الرد ← قرار طاقم العمل). */
(function(){
'use strict';
if(typeof V==='undefined')return;
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MK='<img src="misbar-emblem.webp" alt="" class="mbc-mk">';
const SUBS=[['next','الخطوة التالية'],['brain','الثغرات والتعارضات'],['mizan','ميزان الحجج'],['hearing','تحضير الجلسة'],['docs','المستندات المقروءة'],['log','سجل الإرسال']];
const HINT={next:'يفحص: هل يوجد إجراء عاجل؟ ما آخر إجراء مثبت؟ ماذا طلبت المحكمة؟ هل الملف جاهز؟ ثم يقترح الإجراء وسببه والمسؤول.',
 brain:'الاختصاص والصفة والمصلحة والتمثيل والتبليغات والمدد وشروط القبول، والتعارض بين الأقوال والمستندات، والبينات الناقصة.',
 mizan:'ثلاث قراءات مستقلة لكل مسألة: ما يؤيد الموكل، وما قد يدفع به الخصم مع الرد، والفجوات المحايدة.',
 hearing:'ورقة جاهزة: ما جرى سابقاً، المطلوب، المستندات، الردود الممكنة، أسئلة الشهود، نقاط المرافعة.'};
const URG={high:['عاجل','u-h'],medium:['متوسط','u-m'],low:['عادي','u-l']};
const STAT={proposed:['مقترح — بانتظار المراجعة','s-p'],approved:['معتمد','s-a'],rejected:['مرفوض','s-r']};
const VIA={pdf:'نص PDF',ocr:'تعرّف على النص',docx:'Word',txt:'نص',local:'محلي',manual:'يدوي',draft:'مسودة في التطبيق'};
const ST={k:null,data:null,err:'',busy:'',sub:'next',rd:{},note:{}};
const extOf=f=>{const x=String(f||'').split('?')[0].split('.').pop().toLowerCase();return x==='jpeg'?'jpg':x};
const READABLE=['pdf','png','jpg','webp','gif','txt','docx'];

async function api(a,body){
 const r=body?await fetch('/api/admin/misbar/case/'+a,{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify({k:ST.k,...body})})
  :await fetch('/api/admin/misbar/case/get?k='+encodeURIComponent(ST.k),{credentials:'same-origin'});
 const j=await r.json().catch(()=>({}));if(!r.ok){const er=new Error(j.error||'تعذّر الطلب ('+r.status+')');er.j=j;throw er}return j}
async function load(id){ST.k=id;ST.data=null;ST.err='';paint();try{ST.data=await api('get')}catch(x){ST.err=x.message}paint()}
function paint(){const b=document.getElementById('mbcBox');if(b)b.innerHTML=html()}

window.MQ_caseMisbar=k=>{if(ST.k!==k.id){setTimeout(()=>load(k.id));ST.k=k.id;ST.data=null}return `<div id="mbcBox" class="mbc">${html()}</div>`};
const ct0=window.caseTab;
if(typeof ct0==='function')window.caseTab=k=>S.caseTab==='misbar'?MQ_caseMisbar(k):ct0(k);

/* ── العرض ── */
function html(){
 if(ST.err)return `<div class="mbc-card"><p class="mbc-err">${e(ST.err)}</p><button class="btn sm" data-act="mbcReload">إعادة المحاولة</button></div>`;
 const d=ST.data;if(!d)return '<div class="mbc-card"><p class="m">جارٍ تحميل عقل القضية…</p></div>';
 const cnt=t=>d.findings.filter(f=>f.task===t&&f.status==='proposed').length;
 const unread=d.docs.filter(x=>!x.hasText).length;
 return `${head(d)}${now(d)}
 <nav class="mbc-subs" role="tablist">${SUBS.map(([id,lb])=>{const n=id==='docs'?unread:id==='log'?0:cnt(id);return `<button type="button" class="${ST.sub===id?'on':''}" data-act="mbcSub" data-v="${id}">${lb}${n?`<i>${n}</i>`:''}</button>`}).join('')}</nav>
 <div class="mbc-body">${ST.sub==='docs'?docsView(d):ST.sub==='log'?logView(d):taskView(d,ST.sub)}</div>`}

function head(d){return `<section class="mbc-head">
 <div class="mbc-ttl">${MK}<div><b>المِسْبار · عقل القضية</b><small>يحلل ويقترح ويكشف النواقص؛ الاعتماد لطاقم العمل على القضية.</small></div></div>
 <label class="mbc-sw ${d.enabled?'on':''}" title="${d.enabled?'فعّله '+e(d.enabledBy)+' في '+e(String(d.enabledAt).slice(0,10)):''}"><input type="checkbox" data-act="mbcEnable" ${d.enabled?'checked':''} ${d.canWrite?'':'disabled'}><span class="mbc-tg"></span>
  <span><b>${d.enabled?'التحليل مفعّل لهذه القضية':'التحليل غير مفعّل لهذه القضية'}</b><small>يُرسل ما يلزم من مقاطع فقط، بعد إخفاء أرقام الهويات والحسابات والهواتف والبريد.</small></span></label></section>`}

/* «المسبار يوصي الآن»: آخر خطوة تالية معتمدة أو مقترحة */
function now(d){const f=d.findings.filter(x=>x.kind==='next_step'&&x.status!=='rejected').sort((a,b)=>(a.status==='approved'?-1:0)-(b.status==='approved'?-1:0)||String(b.at).localeCompare(String(a.at)))[0];
 if(!f)return `<section class="mbc-now empty">${MK}<span>لم يحدد المسبار الخطوة التالية بعد. ${d.enabled?'شغّل «الخطوة التالية».':'فعّل التحليل لهذه القضية ثم شغّل «الخطوة التالية».'}</span></section>`;
 const u=URG[f.urgency]||URG.medium,s=STAT[f.status]||STAT.proposed;
 return `<section class="mbc-now">${MK}<div><small>المسبار يوصي الآن</small><b>${e(f.title)}</b><p>${e(f.reply||f.conclusion||'')}</p>
  <div class="mbc-tags"><span class="mbc-u ${u[1]}">${u[0]}</span>${f.due?`<span>الموعد: ${e(f.due)} (بعد التحقق)</span>`:''}${f.owner?`<span>المسؤول: ${e(f.owner)}</span>`:''}<span class="mbc-s ${s[1]}">${s[0]}</span></div></div>
  ${f.status==='proposed'?`<button type="button" class="btn sm gold" data-act="mbcSub" data-v="next">مراجعة</button>`:''}</section>`}

function runBox(d,t){
 const used=d.docs.filter(x=>x.hasText).length;
 if(!d.enabled)return `<div class="mbc-run off"><p>${e(HINT[t])}</p><p class="mbc-warn">التحليل غير مفعّل لهذه القضية. فعّله من المفتاح أعلاه ليُرسل المسبار المقاطع اللازمة بعد إخفاء البيانات الحساسة.</p></div>`;
 return `<div class="mbc-run"><p>${e(HINT[t])}</p>
  <textarea class="field" id="mbcNote" rows="2" maxlength="600" placeholder="توجيه اختياري للمسبار (مثلاً: ركّز على التبليغات أو على شهادة الشاهد الثاني)">${e(ST.note[t]||'')}</textarea>
  <div class="mbc-rowb"><small>يُرسل: ملف القضية (البيانات والجلسات والمهل والملاحظات) ومقاطع مختارة من ${used} مستند مقروء${d.docs.length>used?` — ${d.docs.length-used} لم يُقرأ بعد`:''}، مع مراجع من قاعدة المسبار.</small>
  <button type="button" class="btn pri" data-act="mbcRun" data-v="${t}" ${ST.busy||!d.canWrite?'disabled':''}>${ST.busy===t?'جارٍ التحليل…':'تشغيل «'+e(d.tasks[t])+'»'}</button></div></div>`}

function taskView(d,t){const fs=d.findings.filter(f=>f.task===t);
 let list='';
 if(!fs.length)list=`<p class="m mbc-empty">لا نتائج بعد.</p>`;
 else if(t==='mizan'){const col=(k,lb,cls)=>`<div class="mbc-col ${cls}"><h4>${lb}</h4>${fs.filter(f=>f.kind===k).map(card).join('')||'<p class="m">—</p>'}</div>`;
  list=`<div class="mbc-mizan">${col('pro','يؤيد الموكل','pro')}${col('con','ما قد يدفع به الخصم','con')}${col('neutral','فجوات وتناقضات محايدة','neu')}</div>`}
 else list=fs.map(card).join('');
 return runBox(d,t)+list}

const refBtn=x=>`<button type="button" class="mbc-ref ${x.primary?'':'cmp'}" data-act="mbRefOpen" data-v="${x.id}" title="${e(x.source)}${x.primary?'':' — للمقارنة والاستئناس'}">[${e(x.ref)}] ${e(String(x.title||'').slice(0,90))}</button>`;
const docChip=x=>`<span class="mbc-doc" title="${e(x.tag)}">📄 ${e(x.title||x.tag)}</span>`;
function richText(t,f){const dm=new Map((f.evidence||[]).map(x=>[x.tag,x]));
 return e(t).split(/\n{1,}/).map(l=>{l=l.trim();if(!l)return '';
  l=l.replace(/\[M(\d+)\]/g,(m,n)=>{const x=(f.law||[]).find(r=>r.id===Number(n));return x?`<button type="button" class="mbc-ref ${x.primary?'':'cmp'}" data-act="mbRefOpen" data-v="${x.id}" title="${e(x.title)}">[M${n}]</button>`:'<span class="mbc-unv" title="مرجع غير موجود في المراجع المسترجعة">[M'+n+'؟]</span>'})
   .replace(/\[(D\d+(?:\.\d+)?)\]/g,(m,t)=>{const x=dm.get(t);return `<span class="mbc-doc sm" title="${e(x?x.title:t)}">${e(t)}</span>`}).replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/\(يحتاج تحقق\)/g,'<span class="mbc-unv">(يحتاج تحقق)</span>');
  if(/^#{1,4}\s/.test(l))return `<h4>${l.replace(/^#+\s*/,'')}</h4>`;
  if(/^[-•*]\s/.test(l))return `<li>${l.replace(/^[-•*]\s*/,'')}</li>`;
  return `<p>${l}</p>`}).join('').replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g,'$1</ul>').replace(/(?<!<\/li>)<li>/g,'<ul><li>')}

function card(f){const u=URG[f.urgency]||URG.medium,s=STAT[f.status]||STAT.proposed;
 const row=(lb,v,cls='')=>v?`<div class="mbc-ch ${cls}"><span>${lb}</span><div>${v}</div></div>`:'';
 const dec=f.status==='proposed'&&ST.data.canWrite?`<div class="mbc-dec"><button type="button" class="btn sm pri" data-act="mbcDecide" data-v="${e(f.id)}|approved">اعتماد</button><button type="button" class="btn sm" data-act="mbcDecide" data-v="${e(f.id)}|rejected">رفض</button></div>`
  :f.status!=='proposed'?`<div class="mbc-who">${s[0]} بواسطة ${e(f.decidedName||f.decidedBy)} · ${e(String(f.decidedAt||'').slice(0,16).replace('T',' '))}${f.note?' — '+e(f.note):''}${ST.data.canWrite?` <button type="button" class="link" data-act="mbcDecide" data-v="${e(f.id)}|proposed">تراجع</button>`:''}</div>`:'';
 if(f.kind==='report')return `<article class="mbc-f rep is-${e(f.status)}"><header><b>${e(f.title)}</b><span class="mbc-s ${s[1]}">${s[0]}</span></header><div class="mbc-rep">${richText(f.text||'',f)}</div>
  ${(f.law||[]).length?`<div class="mbc-refs">${f.law.map(refBtn).join('')}</div>`:''}<footer><small>أعدّها المسبار لـ ${e(f.byName||f.by)} · ${e(String(f.at).slice(0,16).replace('T',' '))} — لا تُعتمد قبل مراجعة المحامي.</small>${dec}</footer></article>`;
 return `<article class="mbc-f is-${e(f.status)}"><header><span class="mbc-k">${e((ST.data.kinds||{})[f.kind]||f.kind)}</span><b>${e(f.title)}</b><span class="mbc-u ${u[1]}">${u[0]}</span><span class="mbc-s ${s[1]}">${s[0]}</span></header>
 <div class="mbc-chain">
  ${row('المسألة',e(f.issue))}${row('الواقعة',e(f.fact))}
  ${row('البينة',(f.evidence||[]).length?f.evidence.map(docChip).join(' '):'<span class="mbc-unv">لا بينة من مستندات القضية</span>')}
  ${row('النص والحكم',(f.law||[]).length?f.law.map(refBtn).join(' '):'<span class="mbc-unv">لا مرجع من القاعدة — يحتاج تحقق</span>')}
  ${row('الاستنتاج',e(f.conclusion))}${row('المخاطر',e(f.risk),'risk')}${row(f.kind==='con'?'الرد المضاد':'الرد / الإجراء المقترح',e(f.reply),'reply')}
  ${f.due||f.owner?row('الموعد والمسؤول',[f.due?'الموعد: '+e(f.due)+' (بعد التحقق)':'',f.owner?'المسؤول: '+e(f.owner):''].filter(Boolean).join(' · ')):''}
 </div>${f.unverified?'<p class="mbc-warn sm">بعض ما ورد هنا بلا سند مسترجع من القاعدة؛ تحقّق منه قبل الاعتماد.</p>':''}
 <footer><small>${e(String(f.at).slice(0,16).replace('T',' '))} · طلبه ${e(f.byName||f.by)}</small>${dec}</footer></article>`}

function docsView(d){
 if(!d.docs.length)return '<p class="m mbc-empty">لا مستندات في هذه القضية بعد. أضف المستندات من «سجل القضية».</p>';
 const can=d.canWrite&&typeof window.MQ_extract==='function';
 const pend=d.docs.filter(x=>!x.hasText&&x.file&&READABLE.includes(extOf(x.file)));
 return `<div class="mbc-run"><p>يقرأ المسبار المستندات على هذا الجهاز دون إنترنت: نص PDF مباشرة، والصفحات الممسوحة والصور بالتعرّف على النص العربي، وملفات Word. لا يخرج الملف من المكتب.</p>
 ${can&&pend.length?`<div class="mbc-rowb"><small>${pend.length} مستند قابل للقراءة لم يُقرأ بعد.</small><button type="button" class="btn pri" data-act="mbcReadAll" ${ST.busy?'disabled':''}>قراءة كل المستندات غير المقروءة</button></div>`:''}</div>
 <table class="mbc-tbl"><thead><tr><th>المستند</th><th>النوع</th><th>التاريخ</th><th>النص</th><th></th></tr></thead><tbody>
 ${d.docs.map(x=>{const ext=extOf(x.file),st=ST.rd[x.id];return `<tr><td><b>${e(x.title)}</b></td><td>${e(x.kind)}</td><td>${e(x.date)}</td>
  <td>${st?`<span class="mbc-prog">${e(st)}</span>`:x.hasText?`<span class="mbc-ok">✓ ${Number(x.chars).toLocaleString('ar-EG')} حرف · ${e(VIA[x.via]||x.via)}</span>`:x.file?(READABLE.includes(ext)?'<span class="m">لم يُقرأ</span>':'<span class="m">نوع لا يُقرأ آلياً</span>'):'<span class="m">لا ملف مرفق</span>'}</td>
  <td>${can&&x.file&&READABLE.includes(ext)&&!st?`<button type="button" class="btn sm" data-act="mbcRead" data-v="${e(x.id)}">${x.hasText?'إعادة القراءة':'قراءة'}</button>`:''}</td></tr>`}).join('')}</tbody></table>`}

function logView(d){
 if(!d.sends.length)return '<p class="m mbc-empty">لم يُرسل شيء من هذه القضية للتحليل.</p>';
 const hid=h=>Object.entries(h||{}).map(([k,n])=>k+' '+n).join('، ')||'لا شيء';
 return `<p class="m">كل إرسال لخدمة الذكاء الاصطناعي من هذه القضية مسجّل هنا وفي سجل التدقيق.</p><table class="mbc-tbl"><thead><tr><th>الوقت</th><th>المستخدم</th><th>المهمة</th><th>حجم المرسل</th><th>مستندات</th><th>مراجع</th><th>بيانات أُخفيت</th></tr></thead><tbody>
 ${d.sends.map(s=>`<tr><td>${e(String(s.at).slice(0,16).replace('T',' '))}</td><td>${e(s.by)}</td><td>${e(d.tasks[s.task]||s.task)}</td><td>${Number(s.chars).toLocaleString('ar-EG')} حرف</td><td>${s.docs}</td><td>${s.refs}</td><td>${e(hid(s.hidden))}</td></tr>`).join('')}</tbody></table>`}

/* ── الأوامر ── */
A.mbcReload=()=>load(ST.k);
A.mbcSub=v=>{ST.sub=v;paint();const b=document.getElementById('mbcBox');if(b)b.scrollIntoView({block:'nearest',behavior:'smooth'})};
A.mbcEnable=async(v,el)=>{const on=!!(el&&el.checked);
 if(on&&!confirm('تفعيل التحليل لهذه القضية:\n\n• يُرسل المسبار ملف القضية ومقاطع مختارة من مستنداتها إلى خدمة الذكاء الاصطناعي عند طلب التحليل فقط.\n• تُخفى أرقام الهويات والحسابات والهواتف والبريد قبل الإرسال.\n• يُسجَّل كل إرسال في سجل القضية وسجل التدقيق.\n\nهل تريد التفعيل؟')){if(el)el.checked=false;return}
 try{ST.data=await api('enable',{on});toast(on?'فُعّل التحليل لهذه القضية':'أُوقف التحليل لهذه القضية')}catch(x){toast(x.message)}paint()};
A.mbcRun=async t=>{const n=document.getElementById('mbcNote');ST.note[t]=n?n.value:'';ST.busy=t;paint();
 try{const r=await api('run',{task:t,note:ST.note[t]});ST.data=r;toast('أضاف المسبار '+r.added+(r.added===1?' نتيجة':' نتائج')+' للمراجعة')}catch(x){toast(x.message);if(x.j&&x.j.needEnable)load(ST.k)}
 ST.busy='';paint()};
A.mbcDecide=async v=>{const [id,status]=String(v).split('|');let note='';
 if(status==='rejected'){note=prompt('سبب الرفض (اختياري):','');if(note===null)return}
 try{ST.data=await api('decide',{id,status,note});toast(status==='approved'?'اعتُمدت النتيجة':status==='rejected'?'رُفضت النتيجة':'أعيدت للمراجعة')}catch(x){toast(x.message)}paint()};
async function readOne(id){const x=ST.data.docs.find(d=>String(d.id)===String(id));if(!x||!x.file)return false;
 ST.rd[id]='جارٍ التحضير…';paint();window.MQ_extractStage=t=>{ST.rd[id]=t;paint()};
 try{const r=await MQ_extract(x.file,extOf(x.file));if(!r||String(r.text||'').trim().length<20)throw new Error('لم يُستخرج نص كافٍ من «'+x.title+'».');
  ST.data=await api('doctext',{doc:id,text:r.text,via:r.via,conf:r.conf});delete ST.rd[id];paint();return true}
 catch(er){delete ST.rd[id];toast(er.message);paint();return false}finally{window.MQ_extractStage=null}}
A.mbcRead=async id=>{if(await readOne(id))toast('قُرئ المستند وحُفظ نصه في القضية')};
A.mbcReadAll=async()=>{ST.busy='read';const ids=ST.data.docs.filter(x=>!x.hasText&&x.file&&READABLE.includes(extOf(x.file))).map(x=>x.id);let ok=0;
 for(const id of ids)if(await readOne(id))ok++;ST.busy='';paint();toast('قُرئ '+ok+' من '+ids.length+' مستند')};

const css=document.createElement('style');css.textContent=`
.mbc{display:grid;gap:12px;margin-top:6px}.mbc .m{color:var(--muted,#6b7280)}
.mbc-mk{width:28px;height:28px;border-radius:50%;filter:drop-shadow(0 0 6px rgb(201 162 74 / .55));flex:none}
.mbc-card{background:var(--panel,#FBF6EA);border:1px solid var(--brass,#C9A24A);border-radius:16px;padding:16px}.mbc-err{color:#A33}
.mbc-head{display:flex;flex-wrap:wrap;gap:12px 20px;align-items:center;justify-content:space-between;padding:14px 16px;border-radius:16px;background:linear-gradient(135deg,#0B1B2B,#1B3654);border:1px solid #C9A24A;color:#F2E6C4}
.mbc-ttl{display:flex;gap:10px;align-items:center}.mbc-ttl b{display:block;font-size:17px;color:#F3D58A}.mbc-ttl small{color:#C9D4DB;font-size:12.5px}
.mbc-sw{display:flex;gap:10px;align-items:center;cursor:pointer;max-width:520px}.mbc-sw input{position:absolute;opacity:0;width:1px;height:1px}
.mbc-tg{flex:none;width:44px;height:24px;border-radius:12px;background:#4b5563;position:relative;transition:.2s}.mbc-tg::after{content:"";position:absolute;top:3px;inset-inline-start:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.2s}
.mbc-sw.on .mbc-tg{background:linear-gradient(180deg,#F3D58A,#C9A24A)}.mbc-sw.on .mbc-tg::after{inset-inline-start:23px}
.mbc-sw input:focus-visible+.mbc-tg{outline:2px solid #F3D58A;outline-offset:2px}
.mbc-sw b{display:block;font-size:14px}.mbc-sw small{display:block;color:#C9D4DB;font-size:12px}
.mbc-now{display:flex;gap:12px;align-items:flex-start;padding:12px 16px;border-radius:16px;background:var(--panel,#FBF6EA);border:1px solid var(--brass,#C9A24A);border-inline-start:5px solid #C9A24A}
.mbc-now>div{flex:1}.mbc-now small{color:#8A6A25;font-weight:700}.mbc-now b{display:block;font-size:16px;margin:2px 0}.mbc-now p{margin:2px 0 6px}.mbc-now.empty{align-items:center;color:var(--muted,#6b7280)}
.mbc-tags{display:flex;flex-wrap:wrap;gap:6px;font-size:12px}.mbc-tags span{padding:2px 8px;border-radius:999px;background:#F1E8D2}
.mbc-subs{display:flex;flex-wrap:wrap;gap:6px}.mbc-subs button{border:1px solid var(--line,#e5dccb);background:var(--panel,#FBF6EA);border-radius:999px;padding:7px 14px;font:inherit;cursor:pointer}
.mbc-subs button.on{background:linear-gradient(135deg,#0B1B2B,#1B3654);color:#F3D58A;border-color:#C9A24A}.mbc-subs i{font-style:normal;margin-inline-start:6px;background:#C9A24A;color:#0B1B2B;border-radius:999px;padding:0 7px;font-size:12px}
.mbc-body{display:grid;gap:10px}
.mbc-run{background:var(--panel,#FBF6EA);border:1px solid var(--line,#e5dccb);border-radius:14px;padding:12px 14px}.mbc-run p{margin:0 0 8px}.mbc-run textarea{width:100%;box-sizing:border-box}
.mbc-rowb{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;justify-content:space-between;margin-top:8px}.mbc-rowb small{color:var(--muted,#6b7280);flex:1;min-width:220px}
.mbc-warn{color:#8A4B00;background:#FFF3DC;border:1px solid #F0D49A;border-radius:10px;padding:8px 10px;margin:6px 0 0}.mbc-warn.sm{font-size:12.5px;padding:5px 8px}
.mbc-empty{padding:8px 4px}
.mbc-f{background:#fff;border:1px solid var(--line,#e5dccb);border-radius:14px;padding:12px 14px;border-inline-start:4px solid #C9A24A}
.mbc-f.is-approved{border-inline-start-color:#2F7D4F}.mbc-f.is-rejected{border-inline-start-color:#9CA3AF;opacity:.75}
.mbc-f header{display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center;margin-bottom:8px}.mbc-f header b{flex:1;min-width:200px;font-size:15px}
.mbc-k{font-size:12px;font-weight:700;color:#0B1B2B;background:#F3D58A;border-radius:6px;padding:1px 8px}
.mbc-u,.mbc-s{font-size:11.5px;border-radius:999px;padding:1px 8px}.u-h{background:#FDE2E2;color:#9B1C1C}.u-m{background:#FEF3C7;color:#8A4B00}.u-l{background:#E5F4E4;color:#2F5D3A}
.s-p{background:#EEF2FF;color:#3730A3}.mbc-s.s-a{background:#E5F4E4;color:#2F5D3A}.mbc-s.s-r{background:#F3F4F6;color:#4B5563}
.mbc-chain{display:grid;gap:0;border:1px solid #efe6d0;border-radius:10px;overflow:hidden}
.mbc-ch{display:grid;grid-template-columns:130px 1fr;border-top:1px solid #efe6d0}.mbc-ch:first-child{border-top:0}
.mbc-ch>div{background:#fff}.mbc-ch>span{background:#FBF6EA;color:#8A6A25;font-weight:700;font-size:12.5px;padding:7px 10px}.mbc-ch>div{padding:7px 10px;line-height:1.7}
.mbc-ch.risk>div{background:#FFF8F0}.mbc-ch.reply>div{background:#F4FAF5}
.mbc-ref{border:1px solid #C9A24A;background:#FBF6EA;color:#0B1B2B;border-radius:8px;padding:1px 7px;font:inherit;font-size:12.5px;cursor:pointer;margin:2px 0}.mbc-ref.cmp{border-style:dashed;color:#6b5a3a}
.mbc-doc{display:inline-block;background:#EEF2F7;border-radius:8px;padding:1px 7px;font-size:12.5px;margin:2px 0}.mbc-doc.sm{font-size:11.5px}
.mbc-unv{background:#FFE4E4;color:#A33;padding:0 5px;border-radius:5px;font-size:12px}
.mbc-f footer{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;margin-top:8px}.mbc-f footer small{color:var(--muted,#6b7280)}
.mbc-dec{display:flex;gap:6px}.mbc-who{font-size:12.5px;color:#4B5563}
.mbc-rep{line-height:1.9}.mbc-rep h4{margin:10px 0 4px;color:#8A6A25}.mbc-rep p{margin:4px 0}.mbc-rep ul{margin:4px 0;padding-inline-start:20px}.mbc-refs{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.mbc-mizan{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;align-items:start}.mbc-col{display:grid;gap:8px;background:var(--panel,#FBF6EA);border-radius:14px;padding:10px;border:1px solid var(--line,#e5dccb)}
.mbc-col h4{margin:0;padding:6px 10px;border-radius:10px;color:#fff}.mbc-col.pro h4{background:#2F7D4F}.mbc-col.con h4{background:#9B1C1C}.mbc-col.neu h4{background:#4B5563}
.mbc-col .mbc-ch{grid-template-columns:1fr}.mbc-col .mbc-ch>span{padding:4px 10px}
@media (max-width:980px){.mbc-mizan{grid-template-columns:1fr}}
@media (max-width:640px){.mbc-ch{grid-template-columns:1fr}.mbc-ch>span{padding:4px 10px}}
.mbc-tbl{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;font-size:13.5px}.mbc-tbl th,.mbc-tbl td{padding:8px 10px;border-bottom:1px solid #efe6d0;text-align:start;vertical-align:top}.mbc-tbl th{background:#FBF6EA;color:#8A6A25}
.mbc-ok{color:#2F5D3A}.mbc-prog{color:#8A4B00}
html.night .mbc-f,html.night .mbc-tbl{background:#14213a;color:#e5e7eb}html.night .mbc-ch>span,html.night .mbc-tbl th{background:#1b2a47;color:#F3D58A}`;
document.head.appendChild(css);
})();
