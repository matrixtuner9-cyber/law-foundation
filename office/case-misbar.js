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
const SUBS=[['next','الخطوة التالية'],['facts','خريطة الوقائع'],['brain','الثغرات والتعارضات'],['mizan','ميزان الحجج'],['rebut','الرد على لائحة الخصم'],['hearing','تحضير الجلسة'],['draft','الصياغة'],['client','رسالة للموكل'],['docs','المستندات المقروءة'],['log','سجل الإرسال']];
const HINT={facts:'يرتّب وقائع القضية زمنياً، ويبيّن لكل واقعة: مثبتة بمستند، أم ادعاء بلا دليل، أم متنازع عليها، ويكشف التناقضات وما يلزم جمعه.',
 next:'يفحص: هل يوجد إجراء عاجل؟ ما آخر إجراء مثبت؟ ماذا طلبت المحكمة؟ هل الملف جاهز؟ ثم يقترح الإجراء وسببه والمسؤول.',
 brain:'الاختصاص والصفة والمصلحة والتمثيل والتبليغات والمدد وشروط القبول، والتعارض بين الأقوال والمستندات، والبينات الناقصة.',
 mizan:'ثلاث قراءات مستقلة لكل مسألة: ما يؤيد الموكل، وما قد يدفع به الخصم مع الرد، والفجوات المحايدة.',
 rebut:'ارفع لائحة الخصم كما وصلتك (صورة ممسوحة أو PDF أو Word)، فيقرؤها المسبار على جهازك ثم يُعدّ الرد على كل بند وكل مطلب فيها، مسنداً إلى القوانين الفلسطينية وقرارات المحاكم.',
 client:'يكتب المسبار رسالة قصيرة بلغة بسيطة للموكل عن مستجدات قضيته وما المطلوب منه؛ تراجعها وتعدّلها، ثم ترسلها عبر بوابة الموكل.',
 draft:'يكتب المسبار الورقة كاملة من عقل القضية: الوقائع وبيناتها، وردود ميزان الحجج، والنصوص والأحكام من القاعدة؛ وما لا يعرفه يتركه بين معقوفين [..] لتكمله.',
 hearing:'ورقة جاهزة: ما جرى سابقاً، المطلوب، المستندات، الردود الممكنة، أسئلة الشهود، نقاط المرافعة.'};
const URG={high:['عاجل','u-h'],medium:['متوسط','u-m'],low:['عادي','u-l']};
const STAT={proposed:['مقترح — بانتظار المراجعة','s-p'],approved:['معتمد','s-a'],rejected:['مرفوض','s-r']};
const VIA={pdf:'نص PDF',ocr:'تعرّف على النص',docx:'Word',txt:'نص',local:'محلي',manual:'يدوي',draft:'مسودة في التطبيق'};
const ST={k:null,data:null,err:'',busy:'',sub:'next',rd:{},note:{},ff:'',added:{},stage:'',dtype:''};
const DICON={claim:'⚖️',answer:'🛡️',evidence_list:'📋',evidence_request:'📑',reply:'↩️'};
const DDESC={claim:'الأطراف، الوقائع المسندة، الأسانيد، الطلبات',answer:'الدفوع الشكلية، الرد بنداً بنداً، الطلبات',evidence_list:'البينات الخطية والشهود والخبرة، كل بينة بواقعتها',evidence_request:'بيان ما قُدّم وما تبقى، أو إلزام الخصم بحصر بيناته',reply:'كل دفع للخصم ورده المسند'};
const THINK=['يقرأ ملف القضية…','يستخرج الوقائع والتواريخ…','يطابق كل واقعة ببينتها…','يبحث في التشريعات والأحكام…','يختبر حجج الخصم…','يكشف التناقضات والثغرات…','يصوغ النتيجة بسندها…'];let thinkT=null;
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
 return `${head(d)}${chg(d)}${now(d)}
 <nav class="mbc-subs" role="tablist">${SUBS.map(([id,lb])=>{const n=id==='docs'?unread:id==='log'?0:cnt(id);return `<button type="button" class="${ST.sub===id?'on':''}" data-act="mbcSub" data-v="${id}">${lb}${n?`<i>${n}</i>`:''}</button>`}).join('')}</nav>
 <div class="mbc-body">${ST.sub==='docs'?docsView(d):ST.sub==='log'?logView(d):taskView(d,ST.sub)}</div>`}

function head(d){return `<section class="mbc-head">
 <div class="mbc-ttl">${MK}<div><b>المِسْبار · عقل القضية</b><small>يحلل ويقترح ويكشف النواقص؛ الاعتماد لطاقم العمل على القضية.</small></div></div>
 <label class="mbc-sw ${d.enabled?'on':''}" title="${d.enabled?'فعّله '+e(d.enabledBy)+' في '+e(String(d.enabledAt).slice(0,10)):''}"><input type="checkbox" data-act="mbcEnable" ${d.enabled?'checked':''} ${d.canWrite?'':'disabled'}><span class="mbc-tg"></span>
  <span><b>${d.enabled?'التحليل مفعّل لهذه القضية':'التحليل غير مفعّل لهذه القضية'}</b><small>يُرسل ما يلزم من مقاطع فقط، بعد إخفاء أرقام الهويات والحسابات والهواتف والبريد.</small></span></label></section>`}

/* ما تغيّر في القضية منذ آخر تحليل */
function chg(d){if(!(d.changes||[]).length)return '';
 return `<section class="mbc-chg"><div><b>🔄 تغيّر في القضية منذ آخر تحليل${d.snapAt?' ('+e(String(d.snapAt).slice(0,10))+')':''}</b><ul>${d.changes.map(x=>`<li>${e(x)}</li>`).join('')}</ul></div>${d.canWrite?`<button type="button" class="btn pri mbc-go" data-act="mbcRefresh" ${ST.busy?'disabled':''}>${MK}<span>تحديث عقل القضية</span></button>`:''}</section>`}
/* «المسبار يوصي الآن»: آخر خطوة تالية معتمدة أو مقترحة */
function now(d){const f=d.findings.filter(x=>x.kind==='next_step'&&x.status!=='rejected').sort((a,b)=>(a.status==='approved'?-1:0)-(b.status==='approved'?-1:0)||String(b.at).localeCompare(String(a.at)))[0];
 if(!f)return `<section class="mbc-now empty">${MK}<span>لم يحدد المسبار الخطوة التالية بعد. ${d.enabled?'شغّل «الخطوة التالية».':'فعّل التحليل لهذه القضية ثم شغّل «الخطوة التالية».'}</span></section>`;
 const u=URG[f.urgency]||URG.medium,s=STAT[f.status]||STAT.proposed;
 return `<section class="mbc-now">${MK}<div><small>المسبار يوصي الآن</small><b>${e(f.title)}</b><p>${e(f.reply||f.conclusion||'')}</p>
  <div class="mbc-tags"><span class="mbc-u ${u[1]}">${u[0]}</span>${f.due?`<span>الموعد: ${e(f.due)} (بعد التحقق)</span>`:''}${f.owner?`<span>المسؤول: ${e(f.owner)}</span>`:''}<span class="mbc-s ${s[1]}">${s[0]}</span></div></div>
  ${f.status==='proposed'?`<button type="button" class="btn sm gold" data-act="mbcSub" data-v="next">مراجعة</button>`:''}</section>`}

function runBox(d,t){
 const used=d.docs.filter(x=>x.hasText).length,unread=d.docs.filter(x=>!x.hasText&&x.file&&READABLE.includes(extOf(x.file))).length;
 if(ST.busy===t)return `<div class="mbc-think" role="status" aria-live="polite"><div class="mbc-orb">${MK}<i></i><i></i><i></i></div><div><b>عقل المسبار يعمل</b><span id="mbcStage">${e(ST.stage||THINK[0])}</span></div></div>`;
 return `<div class="mbc-run"><p>${e(HINT[t])}</p>
  <details class="mbc-opt"${ST.note[t]?' open':''}><summary>توجيه للمسبار (اختياري)</summary><textarea class="field" id="mbcNote" rows="2" maxlength="600" placeholder="مثلاً: ركّز على التبليغات، أو على شهادة الشاهد الثاني">${e(ST.note[t]||'')}</textarea></details>
  <div class="mbc-rowb"><small>${d.enabled?'':'سيُطلب منك تفعيل التحليل لهذه القضية أولاً. '}${unread?`سيقرأ أولاً ${unread} مستنداً لم يُقرأ بعد (على هذا الجهاز)، ثم `:''}يرسل ملف القضية ومقاطع من ${used+unread} مستند بعد إخفاء الأرقام الحساسة.</small>
  <button type="button" class="btn pri mbc-go" data-act="mbcRun" data-v="${t}" ${ST.busy||!d.canWrite?'disabled':''}>${MK}<span>${e(t==='draft'?(ST.dtype?'صياغة «'+d.drafts[ST.dtype]+'»':'اختر نوع الورقة أولاً'):(d.tasks[t]||'تشغيل'))}</span></button></div></div>`}

function taskView(d,t){const fs=d.findings.filter(f=>f.task===t);
 if(t==='draft')return draftView(d,fs);
 if(t==='rebut')return rebutView(d,fs);
 if(t==='client')return runBox(d,t)+(fs.filter(f=>f.kind==='client_msg').map(clientCard).join('')||'<p class="m mbc-empty">لا رسائل بعد.</p>');
 if(t==='facts')return runBox(d,t)+(fs.length?fs.map(mapView).join(''):'<p class="m mbc-empty">لم تُبنَ خريطة الوقائع بعد. اضغط الزر أعلاه، وسيقرأ المسبار المستندات ويرتّب الوقائع.</p>');
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

const FST={proven:['مثبتة بمستند','ok'],claimed:['ادعاء بلا دليل','warn'],disputed:['متنازع عليها','bad']};
const fmtD=f=>f.date?new Date(f.date+'T12:00:00').toLocaleDateString('ar-EG-u-nu-latn',{day:'numeric',month:'long',year:'numeric'}):(f.date_text||'بلا تاريخ');
function mapView(f){const s=STAT[f.status]||STAT.proposed,fs=f.facts||[],c=f.contradictions||[];
 const n=st=>fs.filter(x=>x.status===st).length,pv=n('proven'),pct=fs.length?Math.round(pv/fs.length*100):0;
 const show=fs.filter(x=>!ST.ff||x.status===ST.ff);
 const chip=(v,lb,cnt,cls)=>`<button type="button" class="mbc-fc ${cls} ${ST.ff===v?'on':''}" data-act="mbcFF" data-v="${v}"><b>${cnt}</b>${lb}</button>`;
 const dec=f.status==='proposed'&&ST.data.canWrite?`<div class="mbc-dec"><button type="button" class="btn sm pri" data-act="mbcDecide" data-v="${e(f.id)}|approved">اعتماد الخريطة</button><button type="button" class="btn sm" data-act="mbcDecide" data-v="${e(f.id)}|rejected">رفض</button></div>`
  :f.status!=='proposed'?`<div class="mbc-who">${s[0]} بواسطة ${e(f.decidedName||f.decidedBy)} · ${e(String(f.decidedAt||'').slice(0,16).replace('T',' '))}${ST.data.canWrite?` <button type="button" class="link" data-act="mbcDecide" data-v="${e(f.id)}|proposed">تراجع</button>`:''}</div>`:'';
 return `<article class="mbc-map is-${e(f.status)}">
 <header class="mbc-mhead"><div class="mbc-ring" style="--p:${pct}"><b>${pct}٪</b><small>تغطية الإثبات</small></div>
  <div class="mbc-msum"><b>خريطة وقائع القضية</b><small>${fs.length} واقعة مرتبة زمنياً · ${e(String(f.at).slice(0,16).replace('T',' '))} · <span class="mbc-s ${s[1]}">${s[0]}</span></small>
  <div class="mbc-fcs">${chip('','الكل',fs.length,'all')}${chip('proven','مثبتة بمستند',pv,'ok')}${chip('claimed','بلا دليل',n('claimed'),'warn')}${chip('disputed','متنازع عليها',n('disputed'),'bad')}${c.length?`<a class="mbc-fc bolt" href="#mbcCx"><b>${c.length}</b>تعارض</a>`:''}</div></div></header>
 <ol class="mbc-tl">${show.map(x=>{const st=FST[x.status]||FST.claimed,i=fs.indexOf(x),key=f.id+':'+i;return `<li class="${st[1]} imp-${e(x.importance)}"><span class="mbc-dot"></span>
  <div class="mbc-date">${e(fmtD(x))}</div>
  <div class="mbc-fx"><p>${e(x.fact)}</p><div class="mbc-meta"><span class="mbc-st ${st[1]}">${st[0]}</span>${x.party?`<span class="mbc-pt">${e(x.party)}</span>`:''}${x.source?`<span class="m">${e(x.source)}</span>`:''}${(x.evidence||[]).map(docChip).join('')}</div>
  ${x.downgraded?'<p class="mbc-warn sm">قدّمها التحليل كمثبتة دون مقطع مستند يثبتها، فاعتبرها المسبار ادعاءً حتى يُرفق دليلها.</p>':''}
  ${x.status!=='proven'&&x.need?`<div class="mbc-need"><span>🔎 ما يلزم: ${e(x.need)}</span>${ST.data.canWrite?(ST.added[key]?'<b class="mbc-ok">✓ أُضيف لقائمة الجمع</b>':`<button type="button" class="btn sm" data-act="mbcNeed" data-v="${e(key)}">+ إلى قائمة البينات المطلوبة</button>`):''}</div>`:''}</div></li>`}).join('')||'<li class="m">لا وقائع بهذا التصنيف.</li>'}</ol>
 ${c.length?`<section class="mbc-cx" id="mbcCx"><h4>⚡ تعارضات كشفها المسبار</h4>${c.map(x=>`<div class="mbc-cxi"><b>${e(x.title)}</b><div class="mbc-vs"><div>${e(x.a)}</div><span>⚡</span><div>${e(x.b)}</div></div>${(x.evidence||[]).length?`<div class="mbc-meta">${x.evidence.map(docChip).join('')}</div>`:''}${x.risk?`<p><span class="mbc-l">الأثر:</span> ${e(x.risk)}</p>`:''}${x.reply?`<p><span class="mbc-l">المعالجة:</span> ${e(x.reply)}</p>`:''}</div>`).join('')}</section>`:''}
 <footer><small>لا تُعدّ واقعة «مثبتة» إلا بمقطع من مستندات القضية. راجع الخريطة قبل اعتمادها.</small>${dec}</footer></article>`}

/* ── الرد على لائحة الخصم بنداً بنداً ── */
const POSC={'إنكار':'bad','تسليم':'ok','تسليم جزئي':'warn','غير منتج':'neu'};
function rebutView(d,fs){
 if(ST.busy==='rebut')return runBox(d,'rebut');
 const docsT=d.docs.filter(x=>x.hasText||(x.file&&READABLE.includes(extOf(x.file))));
 const up=d.canWrite?`<label class="mbc-drop"><input type="file" id="mbcPlFile" accept="image/*,.pdf,.docx,.txt" multiple hidden><span class="mbc-di">📥</span><b>ارفع لائحة الخصم من جهازك</b><small>صورة ممسوحة (يمكن اختيار عدة صفحات بالترتيب) أو PDF أو Word — تُقرأ على هذا الجهاز ثم يُعدّ المسبار الرد على كل بند ومطلب.</small></label>`:'';
 const pick=docsT.length?`<div class="mbc-rowb mbc-or"><small>أو اختر لائحة موجودة في مستندات القضية:</small><select class="field" id="mbcPlDoc">${docsT.map(x=>`<option value="${e(x.id)}">${e(x.title)}${x.hasText?'':' (ستُقرأ أولاً)'}</option>`).join('')}</select><button type="button" class="btn pri mbc-go" data-act="mbcRebutDoc" ${ST.busy||!d.canWrite?'disabled':''}>${MK}<span>الرد على هذه اللائحة</span></button></div>`:'';
 return `<div class="mbc-run"><p>${e(HINT.rebut)}</p>${up}${d.canWrite?`<details class="mbc-paste"${MIC.on?' open':''}><summary>✍️ أو الصق نص اللائحة أو أملِه بصوتك</summary><div class="mbc-rowb"><small>للإملاء: اضغط المايكروفون واقرأ اللائحة بنداً بنداً، ثم اضغط مرة أخرى للإيقاف.</small><button type="button" class="btn sm mbc-mic ${MIC.on?'on':''}" data-act="mbcMic">🎙️ ${MIC.on?'إيقاف الإملاء':'إملاء صوتي'}</button></div><textarea class="field" id="mbcPlText" rows="7" placeholder="الصق هنا نص لائحة الخصم كما هو، ببنوده وطلباته…"></textarea><div class="mbc-rowb"><small>يُحفظ النص في مستندات القضية باسم «لائحة الخصم (نص)».</small><button type="button" class="btn pri mbc-go" data-act="mbcRebutText" ${ST.busy?'disabled':''}>${MK}<span>الرد على هذا النص</span></button></div></details>`:''}${pick}
  <details class="mbc-opt"${ST.note.rebut?' open':''}><summary>توجيه للمسبار (اختياري)</summary><textarea class="field" id="mbcNote" rows="2" maxlength="600" placeholder="مثلاً: الموكل ينكر استلام الدفعة الثانية، وركّز على عدم الاختصاص القيمي">${e(ST.note.rebut||'')}</textarea></details></div>
  ${fs.filter(f=>f.kind==='rebuttal').map(rebutCard).join('')||'<p class="m mbc-empty">لم يُعدّ ردّ على لائحة بعد.</p>'}`}
function rebutCard(f){const s=STAT[f.status]||STAT.proposed;
 const lawB=a=>(a||[]).length?`<div class="mbc-meta">${a.map(refBtn).join('')}</div>`:'<span class="mbc-unv">بلا سند من القاعدة — يحتاج تحقق</span>';
 const dec=f.status==='proposed'&&ST.data.canWrite?`<button type="button" class="btn sm" data-act="mbcDecide" data-v="${e(f.id)}|approved">اعتماد الردود</button><button type="button" class="btn sm" data-act="mbcDecide" data-v="${e(f.id)}|rejected">رفض</button>`:f.status!=='proposed'?`<span class="mbc-who">${s[0]} بواسطة ${e(f.decidedName||f.decidedBy)}</span>`:'';
 return `<article class="mbc-rb is-${e(f.status)}"><header><span class="mbc-di">🛡️</span><div><b>${e(f.title)}</b>${f.summary?`<small>${e(f.summary)}</small>`:''}</div><span class="mbc-s ${s[1]}">${s[0]}</span></header>
 ${(f.formal||[]).length?`<section class="mbc-rbs"><h4>الدفوع الشكلية</h4>${f.formal.map(x=>`<div class="mbc-fd"><div><b>${e(x.defense)}</b><span class="mbc-u ${x.strength==='قوي'?'u-l':x.strength==='ضعيف'?'u-h':'u-m'}">${e(x.strength)}</span></div><p>${e(x.basis)}</p>${lawB(x.law)}</div>`).join('')}</section>`:''}
 <section class="mbc-rbs"><h4>الرد على بنود اللائحة</h4>${(f.points||[]).map(x=>`<div class="mbc-pt2"><div class="mbc-cl"><span class="mbc-pn">البند ${e(x.n)}</span><p>${e(x.claim)}</p></div>
  <div class="mbc-rp"><span class="mbc-pos ${POSC[x.position]||'neu'}">${e(x.position)}</span><p>${e(x.reply)}</p>${lawB(x.law)}${(x.evidence||[]).length?`<div class="mbc-meta">${x.evidence.map(docChip).join('')}</div>`:''}${x.needed?`<div class="mbc-need"><span>🔎 يلزم لدعم الرد: ${e(x.needed)}</span></div>`:''}</div></div>`).join('')}</section>
 ${(f.requests||[]).length?`<section class="mbc-rbs"><h4>الرد على المطالب</h4>${f.requests.map(x=>`<div class="mbc-pt2"><div class="mbc-cl"><span class="mbc-pn">المطلب</span><p>${e(x.request)}</p></div><div class="mbc-rp"><p>${e(x.reply)}</p>${lawB(x.law)}</div></div>`).join('')}</section>`:''}
 ${(f.notes||[]).length?`<div class="mbc-notes"><b>للتحقق قبل التقديم</b><ul>${f.notes.map(n=>`<li>${e(n)}</li>`).join('')}</ul></div>`:''}
 <footer><div class="mbc-dec"><button type="button" class="btn sm pri" data-act="mbcToAnswer" data-v="${e(f.id)}" ${ST.data.canWrite?'':'disabled'}>تحويلها إلى لائحة جوابية كاملة ←</button><button type="button" class="btn sm" data-act="mbcRbSave" data-v="${e(f.id)}">حفظ الردود في المستندات</button><button type="button" class="btn sm" data-act="mbcRbCopy" data-v="${e(f.id)}">نسخ</button></div><div class="mbc-dec">${dec}</div></footer></article>`}
const refName=l=>'('+l.title+')';
function rebutText(f){const L=[`الرد على «${f.docTitle}»`,''];
 if((f.formal||[]).length){L.push('أولاً: الدفوع الشكلية');f.formal.forEach((x,i)=>L.push(`${i+1}. ${x.defense}: ${x.basis} ${(x.law||[]).map(refName).join(' ')}`.trim()));L.push('')}
 L.push('ثانياً: الرد على بنود اللائحة');(f.points||[]).forEach(x=>L.push(`- البند ${x.n} (${x.position}): ${x.reply} ${(x.law||[]).map(refName).join(' ')}`.trim()));
 if((f.requests||[]).length){L.push('','ثالثاً: الرد على المطالب');f.requests.forEach(x=>L.push(`- ${x.request}: ${x.reply} ${(x.law||[]).map(refName).join(' ')}`.trim()))}
 return L.join('\n')}

function clientCard(f){const s=STAT[f.status]||STAT.proposed,sent=f.status==='approved'&&/أُرسلت/.test(f.note||'');
 return `<article class="mbc-cm is-${e(f.status)}"><header><span class="mbc-di">💬</span><b>${e(f.title)}</b><span class="mbc-s ${s[1]}">${sent?'أُرسلت عبر البوابة':s[0]}</span></header>
 <textarea class="field mbc-cmt" id="mbcCm_${e(f.id)}" rows="6" ${sent?'readonly':''}>${e(f.text||'')}</textarea>
 <footer><small>${sent?'أرسلها '+e(f.decidedName||f.decidedBy)+' · '+e(String(f.decidedAt||'').slice(0,16).replace('T',' ')):'راجع الرسالة وعدّلها قبل الإرسال؛ تصل إلى الموكل في تطبيقه.'}</small><div class="mbc-dec">${!sent&&ST.data.canWrite?`<button type="button" class="btn sm pri" data-act="mbcSendClient" data-v="${e(f.id)}">إرسال عبر البوابة</button>`:''}<button type="button" class="btn sm" data-act="mbcCopyCm" data-v="${e(f.id)}">نسخ</button></div></footer></article>`}

function draftView(d,fs){const rec=/مدع[يى]\s*عليه|مدعى عليها|مستأنف ضده/.test(d.role||'')?'answer':'claim';
 const tiles=Object.entries(d.drafts||{}).map(([id,lb])=>`<button type="button" class="mbc-dt ${ST.dtype===id?'on':''}" data-act="mbcDT" data-v="${id}"><span class="mbc-di">${DICON[id]||'📄'}</span><b>${e(lb)}</b><small>${e(DDESC[id]||'')}</small>${id===rec?'<i>مقترح لصفة الموكل</i>':''}</button>`).join('');
 const list=fs.filter(f=>f.kind==='draft').map(draftCard).join('');
 return `<div class="mbc-dts">${tiles}</div>${runBox(d,'draft')}${list||'<p class="m mbc-empty">لا مسودات بعد. اختر نوع الورقة ثم اضغط «صياغة».</p>'}`}
function draftCard(f){const s=STAT[f.status]||STAT.proposed,lb=(ST.data.drafts||{})[f.dtype]||'مسودة';
 const dec=f.status==='proposed'&&ST.data.canWrite?`<button type="button" class="btn sm" data-act="mbcDecide" data-v="${e(f.id)}|approved">اعتماد</button><button type="button" class="btn sm" data-act="mbcDecide" data-v="${e(f.id)}|rejected">رفض</button>`:f.status!=='proposed'?`<span class="mbc-who">${s[0]} بواسطة ${e(f.decidedName||f.decidedBy)}</span>`:'';
 return `<article class="mbc-draft is-${e(f.status)}"><header><span class="mbc-di">${DICON[f.dtype]||'📄'}</span><b>${e(lb)}</b><span class="mbc-s ${s[1]}">${s[0]}</span><small>${e(String(f.at).slice(0,16).replace('T',' '))} · ${e(f.byName||f.by)}</small></header>
 <div class="mbc-paper">${richText(f.text||'',f)}</div>
 ${f.notes?`<div class="mbc-notes"><b>ملاحظات المسبار للمراجعة قبل التقديم</b>${richText(f.notes,f)}</div>`:''}
 ${(f.law||[]).length?`<div class="mbc-refs">${f.law.map(refBtn).join('')}</div>`:''}
 <footer><div class="mbc-dec">${ST.data.canWrite?`<button type="button" class="btn sm pri" data-act="mbcSaveDraft" data-v="${e(f.id)}">${typeof docs!=='undefined'&&docs.some(x=>x.mbFinding===f.id)?'✓ محفوظة في المستندات':'حفظ في مستندات القضية'}</button>`:''}<button type="button" class="btn sm" data-act="mbcViewDraft" data-v="${e(f.id)}">شاشة كاملة وطباعة</button><button type="button" class="btn sm" data-act="mbcCopyDraft" data-v="${e(f.id)}">نسخ</button></div><div class="mbc-dec">${dec}</div></footer></article>`}

function docsView(d){
 if(!d.docs.length)return '<p class="m mbc-empty">لا مستندات في هذه القضية بعد. أضف المستندات من «سجل القضية».</p>';
 const can=d.canWrite&&typeof window.MQ_extract==='function';
 const pend=d.docs.filter(x=>!x.hasText&&x.file&&READABLE.includes(extOf(x.file)));
 return `<div class="mbc-run"><p>يقرأ المسبار المستندات على هذا الجهاز دون إنترنت: نص PDF مباشرة، والصفحات الممسوحة والصور بالتعرّف على النص العربي، وملفات Word. لا يخرج الملف من المكتب.</p>
 ${can&&pend.length?`<div class="mbc-rowb"><small>${pend.length} مستند قابل للقراءة لم يُقرأ بعد.</small><button type="button" class="btn pri" data-act="mbcReadAll" ${ST.busy?'disabled':''}>قراءة كل المستندات غير المقروءة</button></div>`:''}</div>
 <table class="mbc-tbl"><thead><tr><th>المستند</th><th>النوع</th><th>التاريخ</th><th>النص</th><th></th></tr></thead><tbody>
 ${d.docs.map(x=>{const ext=extOf(x.file),st=ST.rd[x.id];return `<tr><td><b>${e(x.title)}</b></td><td>${e(x.kind)}</td><td>${e(x.date)}</td>
  <td>${st?`<span class="mbc-prog">${e(st)}</span>`:x.hasText?`<span class="mbc-ok">✓ ${Number(x.chars).toLocaleString('en')} حرف · ${e(VIA[x.via]||x.via)}</span>`:x.file?(READABLE.includes(ext)?'<span class="m">لم يُقرأ</span>':'<span class="m">نوع لا يُقرأ آلياً</span>'):'<span class="m">لا ملف مرفق</span>'}</td>
  <td>${can&&x.file&&READABLE.includes(ext)&&!st?`<button type="button" class="btn sm" data-act="mbcRead" data-v="${e(x.id)}">${x.hasText?'إعادة القراءة':'قراءة'}</button>`:''}</td></tr>`}).join('')}</tbody></table>`}

function logView(d){
 if(!d.sends.length)return '<p class="m mbc-empty">لم يُرسل شيء من هذه القضية للتحليل.</p>';
 const hid=h=>Object.entries(h||{}).map(([k,n])=>k+' '+n).join('، ')||'لا شيء';
 return `<p class="m">كل إرسال لعقل المسبار الواعي من هذه القضية مسجّل هنا وفي سجل التدقيق.</p><table class="mbc-tbl"><thead><tr><th>الوقت</th><th>المستخدم</th><th>المهمة</th><th>حجم المرسل</th><th>مستندات</th><th>مراجع</th><th>بيانات أُخفيت</th></tr></thead><tbody>
 ${d.sends.map(s=>`<tr><td>${e(String(s.at).slice(0,16).replace('T',' '))}</td><td>${e(s.by)}</td><td>${e(d.tasks[s.task]||s.task)}</td><td>${Number(s.chars).toLocaleString('en')} حرف</td><td>${s.docs}</td><td>${s.refs}</td><td>${e(hid(s.hidden))}</td></tr>`).join('')}</tbody></table>`}

/* ── الأوامر ── */
A.mbcReload=()=>load(ST.k);
A.mbcSub=v=>{ST.sub=v;paint();const b=document.getElementById('mbcBox');if(b)b.scrollIntoView({block:'nearest',behavior:'smooth'})};
const ENABLE_MSG='تفعيل التحليل لهذه القضية:\n\n• يقرأ عقل المسبار الواعي ملف القضية ومقاطع مختارة من مستنداتها عند طلب التحليل فقط.\n• تُخفى أرقام الهويات والحسابات والهواتف والبريد قبل الإرسال.\n• يُسجَّل كل إرسال في سجل القضية وسجل التدقيق.\n\nهل تريد التفعيل؟';
A.mbcEnable=async(v,el)=>{const on=!!(el&&el.checked);
 if(on&&!confirm(ENABLE_MSG)){if(el)el.checked=false;return}
 try{ST.data=await api('enable',{on});toast(on?'فُعّل التحليل لهذه القضية':'أُوقف التحليل لهذه القضية')}catch(x){toast(x.message)}paint()};
A.mbcRun=async t=>{const n=document.getElementById('mbcNote');ST.note[t]=n?n.value:'';
 if(!ST.data.enabled){if(!confirm(ENABLE_MSG))return;try{ST.data=await api('enable',{on:true})}catch(x){return toast(x.message)}}
 ST.busy=t;ST.stage=THINK[0];paint();let i=0;clearInterval(thinkT);thinkT=setInterval(()=>{i=(i+1)%THINK.length;ST.stage=THINK[i];const el=document.getElementById('mbcStage');if(el){el.classList.remove('in');void el.offsetWidth;el.textContent=ST.stage;el.classList.add('in')}},2200);
 try{
  /* قراءة المستندات غير المقروءة أولاً، على هذا الجهاز */
  const ids=typeof window.MQ_extract==='function'?ST.data.docs.filter(x=>!x.hasText&&x.file&&READABLE.includes(extOf(x.file))).map(x=>x.id):[];
  for(const id of ids)await readOne(id,true);
  if(t==='draft'&&!ST.dtype)throw new Error('اختر نوع الورقة أولاً.');
  const r=await api('run',{task:t,note:ST.note[t],dtype:t==='draft'?ST.dtype:undefined});ST.data=r;ST.ff='';
  toast(t==='facts'?'بُنيت خريطة الوقائع':'أضاف المسبار '+r.added+(r.added===1?' نتيجة':' نتائج')+' للمراجعة')}
 catch(x){toast(x.message);if(x.j&&x.j.needEnable)load(ST.k)}
 clearInterval(thinkT);ST.busy='';paint()};
A.mbcDT=v=>{ST.dtype=v;paint()};
/* حفظ المسودة في مستندات القضية: المراجع الداخلية [M..] و[D..] تُستبدل بأسمائها */
const cleanDraft=f=>String(f.text||'').replace(/\[M(\d+)\]/g,(m,n)=>{const x=(f.law||[]).find(r=>r.id===Number(n));return x?'('+x.title+')':''}).replace(/\[(D\d+(?:\.\d+)?)\]/g,(m,t)=>{const x=(f.evidence||[]).find(v=>v.tag===t);return x?'(مبرز: '+x.title+')':''}).replace(/^#{1,4}\s*/gm,'').replace(/\*\*([^*]+)\*\*/g,'$1').replace(/[ \t]+\n/g,'\n').trim();
A.mbcSaveDraft=id=>{const f=ST.data.findings.find(x=>x.id===id);if(!f||typeof docs==='undefined')return;
 if(docs.some(d=>d.mbFinding===f.id))return toast('المسودة محفوظة في مستندات القضية');
 const did='d'+Date.now().toString(36);docs.push({id:did,k:ST.k,title:(ST.data.drafts[f.dtype]||'مسودة')+' (مسودة المِسْبار)',kind:ST.data.drafts[f.dtype]||'مسودة',date:new Date().toISOString().slice(0,10),src:'المِسْبار',pages:1,shared:false,mbFinding:f.id,text:cleanDraft(f),refs:(f.law||[]).map(x=>({id:x.ref,title:x.title,src:x.source}))});
 if(window.MQ&&MQ.saveState)MQ.saveState();paint();toast('حُفظت المسودة في مستندات القضية؛ يمكنك تعديلها من «المستندات»')};
A.mbcViewDraft=id=>{const f=ST.data.findings.find(x=>x.id===id);if(f&&A.ftOpen)A.ftOpen({title:ST.data.drafts[f.dtype]||'مسودة',sub:'مسودة المِسْبار — تُراجع قبل الاعتماد',text:cleanDraft(f)})};
A.mbcCopyDraft=id=>{const f=ST.data.findings.find(x=>x.id===id);if(f)navigator.clipboard.writeText(cleanDraft(f)).then(()=>toast('نُسخ نص المسودة'),()=>toast('تعذّر النسخ'))};
/* رفع لائحة الخصم: قراءة محلية لكل صفحة، ثم حفظها في مستندات القضية، ثم الرد بنداً بنداً */
async function ensureEnabled(){if(ST.data.enabled)return true;if(!confirm(ENABLE_MSG))return false;ST.data=await api('enable',{on:true});return true}
function think(on){clearInterval(thinkT);if(!on)return;let i=0;thinkT=setInterval(()=>{if(/^يقرأ/.test(ST.stage))return;i=(i+1)%THINK.length;ST.stage=THINK[i];const el=document.getElementById('mbcStage');if(el){el.classList.remove('in');void el.offsetWidth;el.textContent=ST.stage;el.classList.add('in')}},2400)}
const setStage=t=>{ST.stage=t;const el=document.getElementById('mbcStage');if(el)el.textContent=t};
async function runRebut(docId){const n=document.getElementById('mbcNote');ST.note.rebut=n?n.value:'';
 const r=await api('run',{task:'rebut',doc:docId,note:ST.note.rebut});ST.data=r;toast('أُعدّت الردود على اللائحة بنداً بنداً')}
A.mbcPlPick=async(v,el)=>{const files=[...((el&&el.files)||[])];if(!files.length)return;el.value='';
 try{if(!(await ensureEnabled()))return}catch(x){return toast(x.message)}
 ST.busy='rebut';ST.stage='يقرأ اللائحة…';paint();think(true);
 try{const texts=[],stored=[];
  for(let i=0;i<files.length;i++){const f=files[i],ext=extOf(f.name),url=URL.createObjectURL(f);
   window.MQ_extractStage=t=>setStage('يقرأ '+(files.length>1?'الصفحة '+(i+1)+' من '+files.length:'اللائحة')+': '+t);
   try{const r=await MQ_extract(url,ext);texts.push(String(r.text||'').trim())}finally{URL.revokeObjectURL(url);window.MQ_extractStage=null}
   setStage('يحفظ اللائحة في مستندات القضية…');
   const up=await fetch('/api/admin/case-file?name='+encodeURIComponent(f.name),{method:'POST',headers:{'content-type':f.type||'application/octet-stream'},credentials:'same-origin',body:f});const j=await up.json().catch(()=>({}));if(!up.ok)throw new Error(j.error||'تعذّر حفظ الملف');stored.push(j.file)}
  const text=texts.filter(Boolean).join('\n\n');if(text.replace(/\s/g,'').length<80)throw new Error('لم يُقرأ نص كافٍ من اللائحة. جرّب صورة أوضح أو ملف PDF.');
  const did='d'+Date.now().toString(36),name=files[0].name.replace(/\.[^.]+$/,'');
  docs.push({id:did,k:ST.k,title:'لائحة الخصم — '+name,kind:'لائحة الخصم',date:new Date().toISOString().slice(0,10),src:'رفع إلى المسبار',pages:files.length,shared:false,file:stored[0],files:stored});
  MQ.saveState();if(MQ.flush)await MQ.flush();
  ST.data=await api('doctext',{doc:did,text,via:'ocr'});
  ST.stage=THINK[0];await runRebut(did)}
 catch(x){toast(x.message)}think(false);ST.busy='';paint()};
document.addEventListener('change',ev=>{if(ev.target&&ev.target.id==='mbcPlFile')A.mbcPlPick(null,ev.target)});
/* الإملاء الصوتي في مربع اللائحة (عبر خدمة التعرف على الكلام في المتصفح) */
const MIC={on:false,rec:null};
A.mbcMic=()=>{const SRc=window.SpeechRecognition||window.webkitSpeechRecognition,ta=()=>document.getElementById('mbcPlText');
 if(MIC.on){MIC.on=false;try{MIC.rec&&MIC.rec.stop()}catch(x){}MIC.rec=null;const v=ta()&&ta().value;paint();const t2=ta();if(t2&&v)t2.value=v;return}
 if(!SRc||/electron/i.test(navigator.userAgent)){toast('في تطبيق سطح المكتب: ضع المؤشر في مربع النص واضغط Win+H للإملاء');const t=ta();if(t)t.focus();return}
 const r=new SRc();r.lang='ar-PS';r.continuous=true;r.interimResults=false;
 r.onresult=ev=>{let fin='';for(let i=ev.resultIndex;i<ev.results.length;i++)if(ev.results[i].isFinal)fin+=ev.results[i][0].transcript;const t=ta();if(fin&&t){t.value=(t.value&&!/\s$/.test(t.value)?t.value+' ':t.value)+fin.trim()}};
 r.onerror=ev=>{if(ev.error==='not-allowed'||ev.error==='service-not-allowed'){toast('اسمح للمتصفح باستخدام المايكروفون');MIC.on=false}else if(ev.error==='language-not-supported'){r.lang='ar-JO'}else if(ev.error==='network'){toast('الإملاء الصوتي في المتصفح يحتاج اتصالاً بالإنترنت');MIC.on=false}};
 r.onend=()=>{if(MIC.on){try{r.start()}catch(x){}}};
 const keep=ta()&&ta().value;try{r.start();MIC.on=true;MIC.rec=r}catch(x){return toast('تعذّر تشغيل المايكروفون')}
 paint();const det=document.querySelector('.mbc-paste');if(det)det.open=true;const t=ta();if(t){if(keep)t.value=keep;t.focus()}};
A.mbcRebutText=async()=>{const ta=document.getElementById('mbcPlText');const text=String(ta&&ta.value||'').trim();if(text.replace(/\s/g,'').length<80)return toast('الصق نص اللائحة كاملاً (80 حرفاً على الأقل).');
 try{if(!(await ensureEnabled()))return}catch(x){return toast(x.message)}
 ST.busy='rebut';ST.stage='يحفظ نص اللائحة في مستندات القضية…';paint();think(true);
 try{const did='d'+Date.now().toString(36);docs.push({id:did,k:ST.k,title:'لائحة الخصم (نص) — '+new Date().toISOString().slice(0,10),kind:'لائحة الخصم',date:new Date().toISOString().slice(0,10),src:'لصق في المسبار',pages:1,shared:false});
  MQ.saveState();if(MQ.flush)await MQ.flush();ST.data=await api('doctext',{doc:did,text,via:'manual'});ST.stage=THINK[0];await runRebut(did)}catch(x){toast(x.message)}
 think(false);ST.busy='';paint()};
A.mbcRebutDoc=async()=>{const sel=document.getElementById('mbcPlDoc');const id=sel&&sel.value;if(!id)return;
 try{if(!(await ensureEnabled()))return}catch(x){return toast(x.message)}
 ST.busy='rebut';ST.stage=THINK[0];paint();think(true);
 try{const x=ST.data.docs.find(d=>String(d.id)===String(id));if(x&&!x.hasText){if(!(await readOne(id,true)))throw new Error('تعذّرت قراءة اللائحة.')}await runRebut(id)}catch(er){toast(er.message)}
 think(false);ST.busy='';paint()};
A.mbcToAnswer=async id=>{const f=ST.data.findings.find(x=>x.id===id);if(!f)return;ST.sub='draft';ST.dtype='answer';ST.note.draft='ابنِ اللائحة الجوابية على الردود المعدّة بنداً بنداً على «'+f.docTitle+'»، بالترتيب نفسه، مع الدفوع الشكلية أولاً.';paint();await A.mbcRun('draft')};
A.mbcRbCopy=id=>{const f=ST.data.findings.find(x=>x.id===id);if(f)navigator.clipboard.writeText(rebutText(f)).then(()=>toast('نُسخت الردود'),()=>toast('تعذّر النسخ'))};
A.mbcRbSave=id=>{const f=ST.data.findings.find(x=>x.id===id);if(!f||typeof docs==='undefined')return;if(docs.some(d=>d.mbFinding===f.id))return toast('الردود محفوظة في مستندات القضية');
 docs.push({id:'d'+Date.now().toString(36),k:ST.k,title:'الردود على '+f.docTitle+' (المِسْبار)',kind:'مذكرة',date:new Date().toISOString().slice(0,10),src:'المِسْبار',pages:1,shared:false,mbFinding:f.id,text:rebutText(f)});MQ.saveState();toast('حُفظت الردود في مستندات القضية')};
A.mbcRefresh=async()=>{ST.sub='next';paint();await A.mbcRun('next');if(!ST.err){ST.sub='facts';paint();await A.mbcRun('facts')}};
A.mbcCopyCm=id=>{const t=document.getElementById('mbcCm_'+id);if(t)navigator.clipboard.writeText(t.value).then(()=>toast('نُسخت الرسالة'),()=>toast('تعذّر النسخ'))};
A.mbcSendClient=async id=>{const t=document.getElementById('mbcCm_'+id),text=String(t&&t.value||'').trim();if(text.length<10)return toast('اكتب نص الرسالة');
 const c=ST.data.case.client;if(!c)return toast('لا موكل مرتبط بهذه القضية');if(!confirm('إرسال هذه الرسالة إلى الموكل عبر البوابة الآن؟'))return;
 try{const r=await fetch('/api/admin/messages',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify({client:c,text,k:ST.k})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'تعذّر الإرسال');
  if(typeof messages!=='undefined'){(messages[c]=messages[c]||[]).push(j)}
  ST.data=await api('decide',{id,status:'approved',note:'أُرسلت عبر البوابة'});toast('أُرسلت الرسالة إلى الموكل')}catch(x){toast(x.message)}paint()};
A.mbcFF=v=>{ST.ff=v||'';paint()};
A.mbcNeed=key=>{const [fid,i]=String(key).split(':'),f=ST.data.findings.find(x=>x.id===fid),x=f&&f.facts[+i];const k=typeof K==='function'?K(ST.k):null;if(!x||!k)return;
 k.gather=k.gather||{};const need=k.gather.need||[];if(need.some(n=>n.t===x.need))return toast('موجود في قائمة البينات المطلوبة');
 k.gather.need=[...need,{id:'n'+Date.now().toString(36),t:x.need,st:'client',src:'المسبار',note:x.fact}];if(window.MQ&&MQ.saveState)MQ.saveState();
 ST.added[key]=1;paint();toast('أُضيف إلى البينات المطلوبة في «الدراسة والقرار»')};
A.mbcDecide=async v=>{const [id,status]=String(v).split('|');let note='';
 if(status==='rejected'){note=prompt('سبب الرفض (اختياري):','');if(note===null)return}
 try{ST.data=await api('decide',{id,status,note});toast(status==='approved'?'اعتُمدت النتيجة':status==='rejected'?'رُفضت النتيجة':'أعيدت للمراجعة')}catch(x){toast(x.message)}paint()};
async function readOne(id,quiet){const x=ST.data.docs.find(d=>String(d.id)===String(id));if(!x||!x.file)return false;
 ST.rd[id]='جارٍ التحضير…';if(!quiet)paint();window.MQ_extractStage=t=>{ST.rd[id]=t;if(quiet){const el=document.getElementById('mbcStage');if(el)el.textContent='يقرأ «'+x.title+'»: '+t}else paint()};
 try{const r=await MQ_extract(x.file,extOf(x.file));if(!r||String(r.text||'').trim().length<20)throw new Error('لم يُستخرج نص كافٍ من «'+x.title+'».');
  ST.data=await api('doctext',{doc:id,text:r.text,via:r.via,conf:r.conf});delete ST.rd[id];if(!quiet)paint();return true}
 catch(er){delete ST.rd[id];if(!quiet)toast(er.message);paint();return false}finally{window.MQ_extractStage=null}}
A.mbcRead=async id=>{if(await readOne(id))toast('قُرئ المستند وحُفظ نصه في القضية')};
A.mbcReadAll=async()=>{ST.busy='read';const ids=ST.data.docs.filter(x=>!x.hasText&&x.file&&READABLE.includes(extOf(x.file))).map(x=>x.id);let ok=0;
 for(const id of ids)if(await readOne(id))ok++;ST.busy='';paint();toast('قُرئ '+ok+' من '+ids.length+' مستند')};

/* ── «اليوم في قضاياك» في الصفحة الرئيسية ── */
const TD={data:null,at:0,busy:false};
async function loadToday(){if(TD.busy)return;TD.busy=true;try{const r=await fetch('/api/admin/misbar/case/today',{credentials:'same-origin'});if(r.ok){TD.data=await r.json();TD.at=Date.now()}}catch(x){}TD.busy=false;const b=document.getElementById('mbToday');if(b)b.outerHTML=todayHtml()}
function todayHtml(){const d=TD.data;if(!d||(!d.cases.length&&!d.hearings.length&&!d.deadlines.length))return '<div id="mbToday"></div>';
 const dd=s=>{try{return new Date(s+'T12:00:00').toLocaleDateString('ar-EG-u-nu-latn',{weekday:'short',day:'numeric',month:'short'})}catch(x){return s}};
 return `<section id="mbToday" class="mbt"><header>${MK}<div><b>المِسْبار · اليوم في قضاياك</b><small>ما يوصي به عقل القضية، وما ينتظر مراجعتك، وما يقترب موعده</small></div></header>
 <div class="mbt-g">${d.cases.length?`<div class="mbt-c"><h4>توصيات المسبار</h4>${d.cases.map(c=>`<button type="button" class="mbt-r" data-act="mbtOpen" data-v="${e(c.id)}"><span class="mbt-no">${e(c.no)}</span><span class="mbt-t"><b>${e(c.next?c.next.title:c.subject)}</b><small>${e(c.client)}${c.next&&c.next.due?' · الموعد '+e(c.next.due):''}</small></span><span class="mbt-tags">${c.next&&c.next.urgency==='high'?'<i class="h">عاجل</i>':''}${c.changes?`<i class="c">🔄 ${c.changes} تغيير</i>`:''}${c.pending?`<i class="p">${c.pending} للمراجعة</i>`:''}</span></button>`).join('')}</div>`:''}
 ${d.hearings.length||d.deadlines.length?`<div class="mbt-c"><h4>خلال الأيام القادمة</h4>${d.hearings.map(h=>`<button type="button" class="mbt-r" data-act="mbtOpen" data-v="${e(h.id)}"><span class="mbt-no">⚖️ ${e(dd(h.date))}${h.time?' '+e(h.time):''}</span><span class="mbt-t"><b>جلسة: ${e(h.purpose||h.subject)}</b><small>${e(h.no)} · ${e(h.client)}</small></span></button>`).join('')}${d.deadlines.map(x=>`<button type="button" class="mbt-r" data-act="mbtOpen" data-v="${e(x.id)}"><span class="mbt-no">⏳ ${e(dd(x.due))}</span><span class="mbt-t"><b>${e(x.title)}</b><small>${e(x.no)} · ${e(x.client)}${x.kind?' · '+e(x.kind):''}</small></span></button>`).join('')}</div>`:''}</div></section>`}
A.mbtOpen=id=>{S.caseId=id;S.caseTab='misbar';if(A.openCase)A.openCase(id);else{S.view='case';render()}setTimeout(()=>{if(S.caseTab!=='misbar'&&A.caseTab)A.caseTab('misbar')},50)};
if(typeof V.dash==='function'){const d0=V.dash;V.dash=function(){const html=d0.apply(this,arguments);if(!TD.data||Date.now()-TD.at>60e3)setTimeout(loadToday,30);
 const i=html.indexOf('<div class="dgrid">');return i<0?todayHtml()+html:html.slice(0,i)+todayHtml()+html.slice(i)}}

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
.mbc-opt summary{cursor:pointer;color:#8A6A25;font-size:13px;margin-bottom:6px}
.mbc-go{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;font-size:15px;background:linear-gradient(135deg,#0B1B2B,#1B3654)!important;color:#F3D58A!important;border:1px solid #C9A24A!important;box-shadow:0 0 0 0 rgb(201 162 74 / .5);animation:mbcPulse 2.4s ease-in-out infinite}
.mbc-go .mbc-mk{width:22px;height:22px}.mbc-go:disabled{animation:none;opacity:.6}
@keyframes mbcPulse{0%,100%{box-shadow:0 0 0 0 rgb(201 162 74 / .45)}50%{box-shadow:0 0 0 8px rgb(201 162 74 / 0)}}
.mbc-think{display:flex;gap:18px;align-items:center;padding:18px 20px;border-radius:16px;background:radial-gradient(circle at 85% 50%,#1B3654,#0B1B2B 70%);border:1px solid #C9A24A;color:#F2E6C4;min-height:86px}
.mbc-think b{display:block;color:#F3D58A;font-size:16px;margin-bottom:4px}.mbc-think span{display:block;font-size:14px}.mbc-think span.in{animation:mbcIn .5s ease}
@keyframes mbcIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.mbc-orb{position:relative;width:64px;height:64px;flex:none;display:grid;place-items:center}.mbc-orb .mbc-mk{width:40px;height:40px;animation:mbcGlow 1.6s ease-in-out infinite}
.mbc-orb i{position:absolute;inset:0;border-radius:50%;border:2px solid transparent;border-top-color:#F3D58A;animation:mbcSpin 1.4s linear infinite}
.mbc-orb i:nth-child(3){inset:6px;border-top-color:transparent;border-left-color:#C9A24A;animation-duration:2.1s;animation-direction:reverse}.mbc-orb i:nth-child(4){inset:-6px;border-top-color:rgb(243 213 138 / .35);animation-duration:3.2s}
@keyframes mbcSpin{to{transform:rotate(360deg)}}@keyframes mbcGlow{50%{filter:drop-shadow(0 0 14px rgb(243 213 138 / .9))}}
.mbc-map{background:#fff;border:1px solid var(--brass,#C9A24A);border-radius:16px;padding:14px 16px;display:grid;gap:12px}
.mbc-mhead{display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.mbc-ring{--p:0;width:92px;height:92px;border-radius:50%;flex:none;display:grid;place-content:center;text-align:center;background:radial-gradient(closest-side,#fff 78%,transparent 79%),conic-gradient(#2F7D4F calc(var(--p)*1%),#F1E8D2 0)}
.mbc-ring b{font-size:22px;color:#0B1B2B;line-height:1}.mbc-ring small{font-size:10.5px;color:#8A6A25}
.mbc-msum{flex:1;min-width:240px}.mbc-msum>b{font-size:17px;display:block}.mbc-msum>small{color:var(--muted,#6b7280)}
.mbc-fcs{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.mbc-fc{display:inline-flex;gap:6px;align-items:center;border:1px solid var(--line,#e5dccb);background:#FBF6EA;border-radius:999px;padding:4px 12px;font:inherit;font-size:13px;cursor:pointer;color:inherit;text-decoration:none}
.mbc-fc b{font-size:15px}.mbc-fc.on{outline:2px solid #C9A24A}.mbc-fc.ok b{color:#2F7D4F}.mbc-fc.warn b{color:#B45309}.mbc-fc.bad b{color:#9B1C1C}.mbc-fc.bolt{background:#FDE2E2}
.mbc-tl{list-style:none;margin:0;padding:0 0 0 0;position:relative}.mbc-tl::before{content:"";position:absolute;inset-inline-start:118px;top:6px;bottom:6px;width:2px;background:linear-gradient(#C9A24A,#efe6d0)}
.mbc-tl>li{display:grid;grid-template-columns:104px 28px 1fr;align-items:start;padding:8px 0;animation:mbcIn .4s ease both}
.mbc-tl>li:nth-child(n+2){animation-delay:.04s}.mbc-date{grid-column:1;text-align:end;font-size:12.5px;color:#8A6A25;font-weight:700;padding-top:3px}
.mbc-dot{grid-column:2;justify-self:center;width:14px;height:14px;border-radius:50%;margin-top:4px;border:3px solid #fff;box-shadow:0 0 0 2px #C9A24A;background:#C9A24A;position:relative;z-index:1}
.mbc-tl li.ok .mbc-dot{background:#2F7D4F;box-shadow:0 0 0 2px #2F7D4F}.mbc-tl li.warn .mbc-dot{background:#F59E0B;box-shadow:0 0 0 2px #F59E0B}.mbc-tl li.bad .mbc-dot{background:#B91C1C;box-shadow:0 0 0 2px #B91C1C}
.mbc-tl li.imp-high .mbc-fx p:first-child{font-weight:700}
.mbc-fx{grid-column:3;background:#FCFAF4;border:1px solid #efe6d0;border-radius:12px;padding:8px 12px}.mbc-fx p{margin:0 0 6px;line-height:1.75}
.mbc-meta{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:12px}.mbc-st{border-radius:999px;padding:1px 8px;font-weight:700}.mbc-st.ok{background:#E5F4E4;color:#2F5D3A}.mbc-st.warn{background:#FEF3C7;color:#92400E}.mbc-st.bad{background:#FDE2E2;color:#9B1C1C}
.mbc-pt{background:#EEF2F7;border-radius:999px;padding:1px 8px}
.mbc-need{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;margin-top:8px;padding:6px 10px;border-radius:10px;background:#FFF8EB;border:1px dashed #F0D49A;font-size:13px}
.mbc-cx{border-top:1px solid #efe6d0;padding-top:10px}.mbc-cx h4{margin:0 0 8px;color:#9B1C1C}.mbc-cxi{border:1px solid #F5C2C2;background:#FFF7F7;border-radius:12px;padding:10px 12px;margin-bottom:8px}
.mbc-vs{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;margin:6px 0}.mbc-vs>div{background:#fff;border:1px solid #f1d5d5;border-radius:10px;padding:6px 10px;font-size:13.5px}.mbc-vs>span{font-size:20px}
.mbc-l{font-weight:700;color:#8A6A25}.mbc-map footer{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between}.mbc-map footer small{color:var(--muted,#6b7280)}
@media (max-width:640px){.mbc-tl::before{inset-inline-start:13px}.mbc-tl>li{grid-template-columns:28px 1fr}.mbc-date{grid-column:2;text-align:start}.mbc-dot{grid-column:1;grid-row:1}.mbc-fx{grid-column:2}.mbc-vs{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){.mbc-go,.mbc-orb i,.mbc-orb .mbc-mk,.mbc-tl>li{animation:none}}
.mbc-dts{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px}
.mbc-dt{position:relative;display:grid;gap:4px;text-align:start;padding:12px 14px;border-radius:14px;border:1px solid var(--line,#e5dccb);background:#fff;font:inherit;cursor:pointer;transition:.15s}
.mbc-dt:hover{border-color:#C9A24A;transform:translateY(-1px)}.mbc-dt.on{background:linear-gradient(135deg,#0B1B2B,#1B3654);color:#F2E6C4;border-color:#C9A24A;box-shadow:0 6px 18px rgb(11 27 43 / .18)}
.mbc-dt b{font-size:15px}.mbc-dt.on b{color:#F3D58A}.mbc-dt small{color:var(--muted,#6b7280);font-size:12px}.mbc-dt.on small{color:#C9D4DB}
.mbc-dt i{position:absolute;top:8px;inset-inline-end:8px;font-style:normal;font-size:10.5px;background:#C9A24A;color:#0B1B2B;border-radius:999px;padding:1px 7px}
.mbc-di{font-size:22px;line-height:1}
.mbc-draft{background:#fff;border:1px solid var(--brass,#C9A24A);border-radius:16px;padding:14px 16px;display:grid;gap:10px}
.mbc-draft header{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.mbc-draft header b{font-size:16px;flex:1}.mbc-draft header small{color:var(--muted,#6b7280);width:100%}
.mbc-paper{background:#FFFEFA;border:1px solid #eadcb8;border-radius:6px;padding:28px 34px;font-family:'Amiri','Traditional Arabic',serif;font-size:17px;line-height:2.05;box-shadow:inset 0 0 0 6px #fbf7ec,0 2px 10px rgb(0 0 0 / .05);max-height:620px;overflow:auto}
.mbc-paper h4{text-align:center;color:#0B1B2B}.mbc-paper p{margin:2px 0}
.mbc-notes{background:#FFF8EB;border:1px dashed #F0D49A;border-radius:12px;padding:10px 14px;font-size:13.5px}.mbc-notes b{color:#8A4B00}
.mbc-draft footer{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between}
@media (max-width:640px){.mbc-paper{padding:16px;font-size:15.5px}}
html.night .mbc-dt,html.night .mbc-draft{background:#14213a;color:#e5e7eb}html.night .mbc-paper{background:#0f1a2e;color:#e5e7eb}
.mbc-drop{display:grid;justify-items:center;gap:4px;text-align:center;padding:22px 16px;margin:6px 0 10px;border:2px dashed #C9A24A;border-radius:16px;background:linear-gradient(180deg,#FFFDF6,#FBF3DE);cursor:pointer;transition:.15s}
.mbc-drop:hover{background:#FBF0D2;transform:translateY(-1px)}.mbc-drop b{font-size:16px;color:#0B1B2B}.mbc-drop small{color:var(--muted,#6b7280);max-width:560px}.mbc-drop .mbc-di{font-size:32px}
.mbc-or select{flex:1;min-width:200px}
.mbc-paste{margin:0 0 10px}.mbc-mic.on{background:#9B1C1C!important;color:#fff!important;animation:mbcPulse 1.2s infinite}.mbc-paste summary{cursor:pointer;font-weight:700;color:#0B1B2B;padding:6px 0}.mbc-paste textarea{width:100%;box-sizing:border-box;margin-top:6px}
.mbc-rb{background:#fff;border:1px solid var(--brass,#C9A24A);border-radius:16px;padding:14px 16px;display:grid;gap:12px}
.mbc-rb>header{display:flex;gap:10px;align-items:flex-start}.mbc-rb>header>div{flex:1}.mbc-rb>header b{font-size:16px;display:block}.mbc-rb>header small{color:var(--muted,#6b7280)}
.mbc-rbs h4{margin:0 0 8px;padding:6px 12px;border-radius:10px;background:linear-gradient(135deg,#0B1B2B,#1B3654);color:#F3D58A;font-size:14px}
.mbc-fd{border:1px solid #efe6d0;border-radius:12px;padding:8px 12px;margin-bottom:8px;background:#FCFAF4}.mbc-fd>div{display:flex;gap:8px;align-items:center;justify-content:space-between}.mbc-fd p{margin:4px 0}
.mbc-pt2{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,3fr);gap:0;border:1px solid #efe6d0;border-radius:12px;overflow:hidden;margin-bottom:8px}
.mbc-cl{background:#F7F3EA;padding:10px 12px;border-inline-end:3px solid #C9A24A}.mbc-cl p{margin:4px 0 0;color:#4B5563;font-size:13.5px;line-height:1.75}
.mbc-pn{font-size:12px;font-weight:700;color:#8A6A25}
.mbc-rp{padding:10px 12px;display:grid;gap:6px}.mbc-rp p{margin:0;line-height:1.85}
.mbc-pos{justify-self:start;font-size:12px;font-weight:700;border-radius:999px;padding:1px 10px}.mbc-pos.bad{background:#FDE2E2;color:#9B1C1C}.mbc-pos.ok{background:#E5F4E4;color:#2F5D3A}.mbc-pos.warn{background:#FEF3C7;color:#92400E}.mbc-pos.neu{background:#F3F4F6;color:#4B5563}
.mbc-rb footer{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between}
@media (max-width:760px){.mbc-pt2{grid-template-columns:1fr}.mbc-cl{border-inline-end:0;border-bottom:3px solid #C9A24A}}
html.night .mbc-rb,html.night .mbc-rp{background:#14213a;color:#e5e7eb}html.night .mbc-cl,html.night .mbc-fd{background:#1b2a47;color:#e5e7eb}
.mbc-chg{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:space-between;padding:12px 16px;border-radius:16px;background:#EEF6FF;border:1px solid #9CC3EE}
.mbc-chg b{color:#1E3A5F}.mbc-chg ul{margin:6px 0 0;padding-inline-start:20px;font-size:13.5px}
.mbc-cm{background:#fff;border:1px solid var(--brass,#C9A24A);border-radius:16px;padding:14px 16px;display:grid;gap:10px}.mbc-cm header{display:flex;gap:8px;align-items:center}.mbc-cm header b{flex:1}
.mbc-cmt{width:100%;box-sizing:border-box;font-size:15px;line-height:1.9;background:#F4FAF5}.mbc-cm footer{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between}.mbc-cm footer small{color:var(--muted,#6b7280)}
html.night .mbc-cm{background:#14213a;color:#e5e7eb}
.mbt{margin:0 0 16px;border-radius:18px;border:1px solid #C9A24A;background:linear-gradient(135deg,#0B1B2B,#1B3654);padding:14px 16px;color:#F2E6C4;animation:mbcIn .4s ease}
.mbt header{display:flex;gap:10px;align-items:center;margin-bottom:10px}.mbt header b{display:block;color:#F3D58A;font-size:17px}.mbt header small{color:#C9D4DB}
.mbt-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:12px}.mbt-c{background:rgb(255 255 255 / .05);border:1px solid rgb(201 162 74 / .35);border-radius:14px;padding:8px}
.mbt-c h4{margin:2px 6px 6px;color:#F3D58A;font-size:13.5px}
.mbt-r{display:flex;gap:10px;align-items:center;width:100%;text-align:start;background:transparent;border:0;border-top:1px solid rgb(255 255 255 / .08);color:inherit;font:inherit;padding:8px 6px;cursor:pointer;border-radius:8px}
.mbt-r:first-of-type{border-top:0}.mbt-r:hover{background:rgb(243 213 138 / .1)}
.mbt-no{flex:none;font-size:12px;color:#F3D58A;min-width:92px}.mbt-t{flex:1;min-width:0}.mbt-t b{display:block;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mbt-t small{color:#C9D4DB;font-size:12px}
.mbt-tags{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}.mbt-tags i{font-style:normal;font-size:11px;border-radius:999px;padding:1px 7px}.mbt-tags .h{background:#9B1C1C;color:#fff}.mbt-tags .c{background:#1E3A5F;color:#cfe3ff}.mbt-tags .p{background:#C9A24A;color:#0B1B2B}
html.night .mbc-map,html.night .mbc-fx{background:#14213a;color:#e5e7eb}
html.night .mbc-f,html.night .mbc-tbl{background:#14213a;color:#e5e7eb}html.night .mbc-ch>span,html.night .mbc-tbl th{background:#1b2a47;color:#F3D58A}`;
document.head.appendChild(css);
})();
