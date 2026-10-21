/* ── الصياغة بالصوت: لوائح ومذكرات ونماذج قانونية من إملاء المحامي ──
   المحامي يفتح المايكروفون ويملي الوقائع وما يريده، فيُصاغ المستند رسمياً بأقسامه، بمراجع من مصادر موثقة فقط
   (مكتبة التشريعات، الاجتهادات، البحث في المصادر)، وما لا سند له يُعلَّم «يحتاج تحقق». الناتج مسودة تُحفظ في مستندات القضية.
   الإملاء: Web Speech API في Chrome/Edge والهاتف، وفي تطبيق سطح المكتب إملاء ويندوز (Win+H). */
(function(){
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const online=()=>!!(window.MQ&&MQ.online)&&!document.body.classList.contains('mq-private');
const can2=w=>!!(window.MQ&&MQ.user&&({admin:{write:1,manage:1},lawyer:{write:1}}[MQ.user.role]||{})[w]);
const ro=()=>{if(window.MQ&&MQ.readOnly){toast('صلاحيتك للاطلاع فقط');return true}return false};
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const isElectron=/Electron/i.test(navigator.userAgent);
const D={k:'',type:'لائحة جوابية',tpl:'',text:'',web:false,busy:false,res:null,err:'',status:null,listening:false,interim:'',target:'aiText',claims:[],opp:null,reading:false,consent:false};
async function api(path,body){const r=await fetch('/api/admin/ai/'+path,body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{});
 if(r.status===401){location.replace('/login.html');throw new Error('انتهت الجلسة')}const j=await r.json().catch(()=>({}));if(!r.ok){const er=new Error(j.error||('HTTP '+r.status));er.body=j;throw er}return j}

/* زر في صفحة القضية بجانب «إنشاء مستند» */
const vcase=V.case;V.case=()=>{const h=vcase();if(!online())return h;
 return h.replace(/(<button class="btn" data-act="tplFor" data-v="([^"]+)">إنشاء مستند<\/button>)/,(m,b,id)=>b+`<button class="btn pri" data-act="aiOpen" data-v="${id}" title="أملِ الوقائع بصوتك فتُصاغ لائحة رسمية بمراجعها">🎙 صياغة بالصوت</button><button class="btn" data-act="asOpen" data-v="${id}" title="ملخص قبل الجلسة، الدفوع الشكلية والمهل، سؤال قانوني">⚖ مساعد القضية</button>`)};

/* اختصار في الشاشة الرئيسية: مساعد المحامي الذكي */
const vdash=V.dash;V.dash=()=>{const h=vdash();if(!online()||!can2('write'))return h;
 const Q=[['brief','📋','ملخص قبل الجلسة'],['question','❓','سؤال قانوني'],['defences','🛡','الدفوع والمهل'],['contract','📑','مراجعة عقد'],['opponent','🔍','تحليل مستند للخصم'],['gaps','🧩','ثغرات مستند'],['appeal','⚖️','أسباب الطعن'],['minutes','📝','محضر اجتماع'],['client_msg','💬','رسالة للموكل'],['translate','🌐','ترجمة'],['calc','🧮','الحاسبات القانونية']];
 const card=`<section class="card reveal as-home" aria-label="مساعد المحامي الذكي"><div class="as-home-h"><div><h2>مساعد المحامي الذكي</h2><p>صياغة اللوائح بالصوت، وتحليل القضايا والمستندات، والإجابة من نصوص التشريعات</p></div>
  <button class="btn pri" data-act="aiOpen" data-v="${e(homeCase())}">🎙 صياغة بالصوت</button></div>
  <div class="as-home-q">${Q.map(([m,i,t])=>m==='calc'?`<button class="as-q" data-act="nav" data-v="calc"><span aria-hidden="true">${i}</span>${t}</button>`:`<button class="as-q" data-act="asOpen" data-v="${e(homeCase())}" data-mode="${m}"><span aria-hidden="true">${i}</span>${t}</button>`).join('')}</div></section>`;
 return h.replace('<div class="dgrid">',card+'<div class="dgrid">')};
/* القضية الافتراضية: صاحبة أقرب جلسة قادمة */
function homeCase(){const n=hearings.filter(x=>diff(x.date)>=0).sort((a,b)=>a.date.localeCompare(b.date))[0];return n?n.k:((cases.find(k=>k.status!=='منتهية')||cases[0]||{}).id||'')}
const LIB=()=>((window.MQ_LAWLIB||{}).items||[]);
/* زر في نافذة أي نموذج من المكتبة القانونية: يصوغ على بنية النموذج نفسه */
new MutationObserver(()=>{const m=document.querySelector('#modal .ll-modal .head');if(!m||!online()||m.querySelector('[data-act="aiOpen"]'))return;
 const id=(document.querySelector('#modal #fLaw')||{}).dataset?.id||(window.LS_open||'');const t=document.querySelector('#modal .ll-modal .head .m.mono');
 const tid=id||(t?t.textContent.split('·')[0].trim():'');if(!tid)return;
 const b=document.createElement('button');b.className='btn pri sm';b.dataset.act='aiOpen';b.dataset.v=S.caseId||'';b.dataset.tpl=tid;b.textContent='🎙 صياغة بالصوت';b.style.marginInlineStart='auto';
 m.insertBefore(b,m.lastElementChild)}).observe(document.getElementById('modal')||document.body,{childList:true,subtree:true});
const tplTitle=id=>{const x=LIB().find(i=>i.id===id);return x?x.title:''};
function caseCtx(k){const cl=C(k.client)||{},ct=CT(k.court)||{},s=(window.MQ&&MQ.settings)||{};
 return {no:k.no,court:ct.name||'',type:k.type,subject:k.subject,role:k.role,stage:k.stage,value:k.value,client:cl.name||'',opponents:(k.opps||[]).map(o=>(O(o)||{}).name).filter(Boolean),
  opponentLawyers:(k.opps||[]).map(o=>(O(o)||{}).lawyer).filter(Boolean),lawyer:s.lawyerName||OFFICE.lawyer||'',office:s.officeName||OFFICE.name||''}}

A.aiOpen=async(v,t)=>{if(ro())return;if(!can2('write'))return toast('الصياغة متاحة للمحامين ومدير المكتب');
 /* تغيير القضية يمسح نص القضية السابقة وادعاءاتها وموافقتها حتى لا تختلط الملفات */
 const nextId=v||D.k||(cases[0]||{}).id;if(nextId!==D.k){D.text='';D.claims=[];D.opp=null;D.consent=false;D.tpl=''}D.k=nextId;if(t&&t.dataset.tpl){D.tpl=t.dataset.tpl;D.type=tplTitle(D.tpl)||D.type}
 D.res=null;D.err='';draw();try{D.status=await api('status');draw()}catch(er){D.err=er.message;draw()}};
A.aiOpenWith=(id,text,type)=>{if(id&&id!==D.k)D.k=id;D.text=String(text||'');if(type)D.type=type;D.tpl='';D.claims=[];D.opp=null;D.consent=false;return A.aiOpen(id)};
function draw(){const m=document.getElementById('modal');m.innerHTML=`<div class="modal-bg" data-act="close"><div class="modal ai-modal" role="dialog" aria-label="الصياغة بالصوت">${body()}</div></div>`;bind()}
A.aiClose=()=>{stopMic();document.getElementById('modal').innerHTML=''};
const close0=A.close;A.close=()=>{stopMic();close0()};
function body(){const st=D.status,k=K(D.k);
 const head=`<div class="head"><div><h1 style="font-size:23px">الصياغة بالصوت</h1><p class="sub">أملِ الوقائع والدفوع والطلبات، فيُصاغ المستند رسمياً بمراجعه القانونية</p></div><button class="btn sm" data-act="aiClose">إغلاق</button></div>`;
 if(!st)return head+`<div class="lg-empty">${D.err?e(D.err):'جارٍ التحضير…'}</div>`;
 if(!st.configured)return head+keyBox(st);
 if(D.res)return head+result();
 const types=[...new Set([...(st.types||[]),...LIB().filter(x=>/لائحة|مذكرة|طلب|إنذار|شكوى|استئناف|اعتراض|عقد|وكالة|اتفاق/.test(x.title)).map(x=>x.title)])];
 return head+`<form class="form ai-form" id="fAi">
  <label>القضية<select class="field" id="aiK">${cases.map(c=>`<option value="${c.id}" ${c.id===D.k?'selected':''}>${e(c.no)} · ${e((C(c.client)||{}).name||'')} · ${e(c.subject||'')}</option>`).join('')}</select></label>
  <label>نوع المستند<input class="field" id="aiType" list="aiTypes" value="${e(D.type)}" required><datalist id="aiTypes">${types.map(t=>`<option value="${e(t)}">`).join('')}</datalist></label>
  ${k?`<div class="wide ai-case"><b>${e(k.no)}</b> · ${e(k.type)} · ${e((CT(k.court)||{}).name||'')} · موكلنا ${e(k.role)}: ${e((C(k.client)||{}).name||'')} · الخصم: ${e((k.opps||[]).map(o=>(O(o)||{}).name).join('، '))}</div>`:''}
  ${oppBox()}
  <div class="wide ai-dict">
   <div class="ai-mic-row"><button type="button" class="ai-mic ${D.listening&&D.target==='aiText'?'on':''}" data-act="aiMic" data-v="aiText" aria-pressed="${D.listening}" aria-label="${D.listening?'إيقاف الإملاء':'بدء الإملاء'}">${D.listening?'■':'🎙'}</button>
    <div>${D.listening?'<b>يستمع…</b> تكلّم بوضوح، واضغط مرة أخرى للإيقاف':SR&&!isElectron?'اضغط المايكروفون وأملِ: الوقائع، ثم الدفوع أو الأسباب، ثم الطلبات':'<b>الإملاء الصوتي:</b> ضع المؤشر في المربع واضغط <kbd>Win</kbd>+<kbd>H</kbd> (إملاء ويندوز يدعم العربية)، أو اكتب مباشرة'}</div></div>
   <textarea class="field ai-text" id="aiText" rows="7" placeholder="مثال: موكلنا المدعى عليه استلم البضاعة ودفع ثمنها نقداً بموجب إيصال… نطلب رد الدعوى لأن…">${e(D.text)}</textarea>
   <div class="ai-interim" id="aiInterim">${e(D.interim)}</div></div>
  <label class="wide rl-ck"><input type="checkbox" id="aiWeb" ${D.web?'checked':''}> البحث عن المراجع في المصادر الخارجية أيضاً (اختياري)</label>
  <div class="wide ai-note">يحاول ميثاق إخفاء بعض الأسماء وبيانات الاتصال في النصوص، لكن الإخفاء غير مضمون وقد تبقى أرقام القضايا وتفاصيل تعرّف الأطراف. لا ترفع ملفات موكلين حساسة دون تصريح مناسب. المراجع غير المثبتة تُعلَّم «يحتاج تحقق».${SR&&!isElectron?' قد يعالج المتصفح الإملاء الصوتي بخدمة خارجية.':''}</div>
  <label class="wide rl-ck"><input type="checkbox" id="aiConsent" ${D.consent?'checked':''}> أؤكد صلاحية استخدام بيانات هذه القضية وإرسال النص المطلوب إلى مزود الذكاء الاصطناعي لإعداد مسودة للمراجعة.</label>
  ${D.err?`<div class="wide ai-err">${e(D.err)}</div>`:''}
  <div class="wide toolbar"><button class="btn pri" ${D.busy?'disabled':''}>${D.busy?'جارٍ الصياغة…':'صياغة المستند'}</button>${D.busy?'<span class="m" id="aiProg">يحلل الإملاء ويبحث عن المراجع ثم يصوغ؛ قد يستغرق دقيقة</span>':''}</div>
 </form>`}
function keyBox(st){return st.canManage?`<form class="form" id="fAiKey"><div class="wide ai-note">لتفعيل الصياغة يلزم مفتاح API من Anthropic (console.anthropic.com). يُحفظ المفتاح في خادم المكتب فقط ولا يظهر بعد حفظه لأي مستخدم.</div>
 <label class="wide">مفتاح API<input class="field mono" id="aiKey" type="password" autocomplete="off" placeholder="sk-ant-…" required dir="ltr"></label>
 <div class="wide toolbar"><button class="btn pri">حفظ المفتاح</button></div>${D.err?`<div class="wide ai-err">${e(D.err)}</div>`:''}</form>`
 :`<div class="lg-empty">الصياغة غير مفعّلة بعد. يضيف مدير المكتب مفتاح الذكاء الاصطناعي من هذه الشاشة.</div>`}

/* ── الإملاء ── */
let rec=null;
function stopMic(){D.listening=false;if(rec){try{rec.stop()}catch(_){}rec=null}}
const rd=()=>{if(D.target==='asQ'){asKeep();asDraw()}else draw()};
A.aiMic=v=>{v=v||'aiText';if(!SR||isElectron){toast('في تطبيق سطح المكتب: ضع المؤشر في مربع النص واضغط Win+H للإملاء');const t=document.getElementById(v);if(t)t.focus();return}
 if(D.listening){const same=D.target===v;stopMic();keep();if(same){rd();return}}
 keep();D.target=v;rec=new SR();rec.lang='ar-PS';rec.continuous=true;rec.interimResults=true;
 rec.onresult=ev=>{let fin='',mid='';for(let i=ev.resultIndex;i<ev.results.length;i++){const r=ev.results[i];if(r.isFinal)fin+=r[0].transcript;else mid+=r[0].transcript}
  const t=document.getElementById(D.target);if(fin&&t){t.value=(t.value&&!/\s$/.test(t.value)?t.value+' ':t.value)+fin.trim();keep()}
  D.interim=mid;const i=document.getElementById('aiInterim');if(i)i.textContent=mid};
 rec.onerror=ev=>{if(ev.error==='not-allowed'||ev.error==='service-not-allowed')toast('اسمح للمتصفح باستخدام المايكروفون');else if(ev.error==='language-not-supported'&&rec){rec.lang='ar-JO';try{rec.start()}catch(_){}return}else if(ev.error!=='no-speech'&&ev.error!=='aborted')toast('تعذّر الإملاء: '+ev.error)};
 rec.onend=()=>{if(D.listening&&rec){try{rec.start()}catch(_){}}else{D.interim='';const b=document.querySelector('.ai-mic');if(b&&!D.listening)rd()}};
 try{rec.start();D.listening=true}catch(er){toast('تعذّر تشغيل المايكروفون')}rd()};
function keep(){const t=document.getElementById('aiText');if(t)D.text=t.value;D.claims.forEach((c,i)=>{const r=document.getElementById('aiR'+i);if(r)c.response=r.value;const s=document.getElementById('aiStance'+i);if(s)c.stance=s.value});const ty=document.getElementById('aiType');if(ty)D.type=ty.value;const k=document.getElementById('aiK');if(k)D.k=k.value;const w=document.getElementById('aiWeb');if(w)D.web=w.checked;const cs=document.getElementById('aiConsent');if(cs)D.consent=cs.checked}
function bind(){const t=document.getElementById('aiText');if(t)t.oninput=()=>{D.text=t.value};const k=document.getElementById('aiK');if(k)k.onchange=()=>{const before=D.k;keep();if(before!==D.k){D.text='';D.claims=[];D.opp=null;D.consent=false;D.tpl='';D.res=null}draw()}}

document.addEventListener('submit',async ev=>{const f=ev.target;if(f.id!=='fAi'&&f.id!=='fAiKey')return;ev.preventDefault();ev.stopImmediatePropagation();
 if(f.id==='fAiKey'){try{D.status={...D.status,...await api('key',{key:document.getElementById('aiKey').value.trim()})};D.err='';toast('حُفظ المفتاح')}catch(er){D.err=er.message}draw();return}
 if(D.busy||ro())return;stopMic();keep();const k=K(D.k);if(!k){D.err='اختر القضية';return draw()}
 if(!D.consent){D.err='يجب تأكيد السماح باستخدام البيانات مع مزود الذكاء الاصطناعي قبل الصياغة.';return draw()}
 if(D.claims.length&&/جوابي|جوابية|رد على لائحة/.test(D.type)){const bad=D.claims.findIndex(c=>!['admit','deny','partial'].includes(c.stance)||(c.stance==='partial'&&(c.response||'').trim().length<5));if(bad!==-1){D.err='راجع موقف المحامي من الادعاء رقم '+(bad+1)+' قبل صياغة اللائحة.';return draw()}}
 const tplId=D.tpl&&tplTitle(D.tpl)===D.type?D.tpl:(LIB().find(x=>x.title===D.type)||{}).id||'';const tx=tplId?LIB().find(x=>x.id===tplId):null;
 D.busy=true;D.err='';draw();
 try{const r=await api('draft',{caseId:k.id,docType:D.type,dictation:D.text,case:caseCtx(k),web:D.web,template:tx&&tx.body||'',claims:D.claims});D.res={...r,tpl:tplId};D.busy=false;draw()}
 catch(er){D.busy=false;D.err=er.message;if(er.body&&er.body.needKey)D.status.configured=false;draw()}},true);

/* ── لائحة الخصم: رفعها واستخراج ادعاءاته ليُرد عليها بنداً بنداً ── */
function oppBox(){
 if(D.reading)return `<div class="wide ai-opp"><b>جارٍ قراءة لائحة الخصم واستخراج ادعاءاته…</b></div>`;
 if(!D.claims.length)return `<div class="wide ai-opp"><b>الرد على لائحة الخصم</b> <span class="m">(اختياري)</span> — ارفع لائحته (PDF أو صورة أو Word أو نص) فتُستخرج ادعاءاته بنداً بنداً، وتملي ردك على كل بند.
  <div class="toolbar" style="margin-top:6px"><input type="file" id="aiOppFile" accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.txt"></div></div>`;
 return `<div class="wide ai-opp"><div class="ai-opp-h"><b>ادعاءات الخصم (${D.claims.length})</b>${D.opp&&D.opp.summary?` <span class="m">· ${e(D.opp.summary)}</span>`:''} <button type="button" class="link" data-act="aiOppClear">إزالة</button></div>
  <p class="ai-note">حدد موقف الموكل من كل ادعاء صراحة؛ لا يُفترض الإنكار ولا الإقرار تلقائياً. «يحتاج استيضاحاً» يمنع إنشاء اللائحة حتى اكتمال المراجعة.</p>
  <ol class="ai-claims">${D.claims.map((c,i)=>`<li><div class="ai-claim">${e(c.text)}</div><label class="ai-stance-label">موقف الموكل <select class="field" id="aiStance${i}" aria-label="موقف الموكل من الادعاء ${i+1}"><option value="" ${!c.stance?'selected':''}>— لم يُحدد بعد —</option>${[['admit','إقرار'],['deny','إنكار'],['partial','إقرار جزئي'],['clarify','يحتاج استيضاحاً']].map(([v,lb])=>`<option value="${v}" ${c.stance===v?'selected':''}>${lb}</option>`).join('')}</select></label><div class="ai-resp"><textarea class="field" id="aiR${i}" rows="2" placeholder="تفصيل موقف المحامي والأدلة المؤيدة، وإلزامي عند الإقرار الجزئي">${e(c.response||'')}</textarea><button type="button" class="ai-mic sm ${D.listening&&D.target==='aiR'+i?'on':''}" data-act="aiMic" data-v="aiR${i}" aria-label="إملاء الرد على البند ${i+1}">${D.listening&&D.target==='aiR'+i?'■':'🎙'}</button></div></li>`).join('')}</ol>
  ${D.opp&&D.opp.requests&&D.opp.requests.length?`<div class="m">طلبات الخصم: ${e(D.opp.requests.join('؛ '))}</div>`:''}</div>`}
A.aiOppClear=()=>{keep();D.claims=[];D.opp=null;draw()};
const b64=buf=>{let s='';const u=new Uint8Array(buf);for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)};
async function docxText(buf){const u8=new Uint8Array(buf),dv=new DataView(buf),td=new TextDecoder();let eocd=-1;
 for(let i=u8.length-22;i>=Math.max(0,u8.length-65557);i--)if(dv.getUint32(i,true)===0x06054b50){eocd=i;break}if(eocd<0)throw new Error('ملف Word غير صالح');
 const n=dv.getUint16(eocd+10,true);let p=dv.getUint32(eocd+16,true);
 for(let k=0;k<n;k++){const method=dv.getUint16(p+10,true),cs=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),off=dv.getUint32(p+42,true),nm=td.decode(u8.subarray(p+46,p+46+nl));
  if(nm==='word/document.xml'){const ln=dv.getUint16(off+26,true),lx=dv.getUint16(off+28,true),data=u8.subarray(off+30+ln+lx,off+30+ln+lx+cs);
   const raw=method===0?data:new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
   return td.decode(raw).replace(/<\/w:p>/g,'\n').replace(/<w:tab\/>/g,' ').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/\n{3,}/g,'\n\n').trim()}
  p+=46+nl+xl+cl}throw new Error('لم يُعثر على نص في ملف Word')}
document.addEventListener('change',async ev=>{if(ev.target.id!=='aiOppFile')return;const f=ev.target.files[0];if(!f)return;keep();
 if(f.size>10*1024*1024){toast('الملف أكبر من 10 ميغابايت');return}
 const k=K(D.k),nm=f.name.toLowerCase();if(!k){toast('اختر القضية قبل قراءة لائحة الخصم');return}let body={caseId:k.id,case:caseCtx(k)};
 try{if(nm.endsWith('.docx'))body.text=await docxText(await f.arrayBuffer());else if(nm.endsWith('.txt'))body.text=await f.text();
  else{const type=f.type||(nm.endsWith('.pdf')?'application/pdf':'image/jpeg');
   if(!confirm('ملف PDF أو الصورة يُرسل كما هو لخدمة القراءة (لا يمكن إخفاء الأسماء داخله). متابعة؟')){ev.target.value='';return}
   body.file={name:f.name,type,data:b64(await f.arrayBuffer())}}}
 catch(er){toast(er.message);return}
 D.reading=true;D.err='';draw();
 try{const r=await api('extract',body);D.opp=r;D.claims=r.claims.map(t=>({text:t,stance:'',response:''}));if(!/جوابية/.test(D.type))D.type=/استئناف/.test(r.docType)?'لائحة جوابية على الاستئناف':'لائحة جوابية'}
 catch(er){D.err=er.message}D.reading=false;draw()});

/* ── النتيجة ── */
const ORIGIN={library:'مكتبة التشريعات',web:'مصادر التشريعات',rulings:'مكتبة الاجتهادات'};
const originOf=x=>x.kind==='ruling'&&x.origin==='web'?'حكم منشور':(ORIGIN[x.origin]||'');
const srcLine=x=>x.url?`<div class="as-src"><a href="${e(x.url)}" target="_blank" rel="noopener">فتح الحكم في المصدر ↗</a>${can2('write')&&x.kind==='ruling'?` <button type="button" class="btn sm" data-act="rImportUrl" data-v="${e(x.url)}">حفظ في مكتبة الاجتهادات</button>`:''}</div>`:'';
function asText(r){return [r.title,r.court?('لدى '+r.court):'', ...r.sections.flatMap(s=>[s.heading,...s.paragraphs])].filter(Boolean).join('\n')}
function refsText(r){return r.references.map(x=>`[${x.id}] ${x.title}${x.ref?' ('+x.ref+')':''}${x.arts.length?' — '+x.arts.join('، '):''}`).join('\n')}
function result(){const r=D.res;const linkR=s=>e(s).replace(/\[(R\d+)\]/g,'<sup class="ai-r">[$1]</sup>').replace(/\[مرجع يحتاج تحقق[^\]]*\]/g,m=>`<mark class="ai-v">${m}</mark>`).replace(/\{[^{}]+\}/g,m=>`<span class="ai-f">${m}</span>`);
 return `<div class="ai-warn"><b>مسودة للمراجعة.</b> راجع الوقائع والأسانيد قبل الإيداع، وأكمل ما بين { }، وتحقق من كل ما عُلّم بالأصفر.</div>
 <div class="ai-doc" id="aiDoc" contenteditable="true" spellcheck="false"><h2>${e(r.title)}</h2>${r.court?`<p class="ai-court">${e('لدى '+r.court)}</p>`:''}${r.sections.map(s=>`<h3>${e(s.heading)}</h3>${s.paragraphs.map(p=>`<p>${linkR(p)}</p>`).join('')}`).join('')}</div>
 <h3 class="ai-h">المراجع المستشهد بها (${r.references.length})</h3>
 ${r.references.length?`<ol class="ai-refs">${r.references.map(x=>`<li><b>[${x.id}]</b> ${e(x.title)}${x.ref?` <span class="mono">${e(x.ref)}</span>`:''}${x.arts.length?' — '+e(x.arts.join('، ')):''} <span class="pill ${x.origin==='library'?'ok':''}">${originOf(x)}</span>${x.url?` <a href="${e(x.url)}" target="_blank" rel="noopener">المصدر ↗</a>`:''}${x.used_for?`<div class="m">${e(x.used_for)}</div>`:''}</li>`).join('')}</ol>`:'<p class="m">لم يُستشهد بمرجع من المصادر المتاحة.</p>'}
 ${r.unverified.length?`<h3 class="ai-h">أسانيد تحتاج تحقق (${r.unverified.length})</h3><ul class="ai-unv">${r.unverified.map(u=>`<li>${e(u)}</li>`).join('')}</ul>`:''}
 <p class="m">فُحص ${r.considered} مرجعاً من المصادر المتاحة.</p>
 <div class="toolbar"><button class="btn pri" data-act="aiSave">حفظ في مستندات القضية</button><button class="btn" data-act="aiPrint">معاينة وطباعة</button><button class="btn" data-act="aiCopy">نسخ النص</button><button class="btn" data-act="aiBack">تعديل الإملاء وإعادة الصياغة</button></div>`}
const docText=()=>{const d=document.getElementById('aiDoc');return d?d.innerText.trim():asText(D.res)};
A.aiBack=()=>{D.res=null;draw()};
A.aiCopy=()=>{const t=docText()+'\n\nالمراجع:\n'+refsText(D.res);(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('نُسخ النص')).catch(()=>toast('تعذّر النسخ'))};
A.aiSave=()=>{if(ro())return;const k=K(D.k),r=D.res;if(!k||!r)return;
 docs.push({id:'d'+Date.now().toString(36),k:k.id,title:r.title+' (مسودة)',kind:D.type,date:iso(TODAY),src:'الصياغة بالصوت',pages:1,shared:false,text:docText(),refs:r.references.map(x=>({id:x.id,kind:x.kind,title:x.title,ref:x.ref,arts:x.arts,origin:x.origin,url:x.url||''})),unverified:r.unverified,aiDraft:true,tpl:r.tpl||undefined,tplStatus:'draft'});
 if(window.MQ&&MQ.saveState)MQ.saveState();toast('حُفظت المسودة في مستندات القضية '+k.no);A.aiClose();S.caseId=k.id;S.view='case';S.caseTab='docs';render()};
A.aiPrint=()=>{if(!window.MQP||!D.res)return;const r=D.res,k=K(D.k),B=MQP.B,E=MQP.esc,lines=docText().split('\n').filter(l=>l.trim());
 MQP.open({label:r.title,build(){return {title:r.title,sub:k?'في الدعوى رقم '+k.no:'',ref:k?k.no:'',file:'draft-'+(k?k.no.replace(/\W+/g,'-'):'doc'),
  blocks:[B.box('<b>مسودة غير معتمدة</b> · لا تُودع قبل مراجعة المحامي وإكمال ما بين { } والتحقق من الأسانيد','warn'),...lines.slice(1).map(l=>B.p(E(l))),
   ...(r.references.length?[B.h('المراجع'),...r.references.map(x=>B.p('<small>['+x.id+'] '+E(x.title)+(x.ref?' ('+E(x.ref)+')':'')+(x.arts.length?' — '+E(x.arts.join('، ')):'')+'</small>','s'))]:[])],
  sign:['المحامي'],mark:'مسودة'}}})};

/* ── مساعد القضية: ملخص قبل الجلسة، الدفوع الشكلية والمهل، سؤال قانوني بمراجعه ── */
const AS={k:'',mode:'brief',q:'',busy:false,res:null,err:'',doc:null,lang:'en'};
const MODES={brief:['ملخص قبل الجلسة','أين وصلت الدعوى، والمطلوب في الجلسة القادمة، والنواقص والمهل'],defences:['الدفوع الشكلية والمهل','الدفوع الإجرائية الممكنة لموكلك والمهل الواجب مراقبتها، بمراجعها'],question:['سؤال قانوني','اسأل عن أي مسألة، فيُجاب من نصوص التشريعات والأحكام فقط'],contract:['مراجعة عقد','البنود الضارة بموكلك والناقصة والغامضة، مع صياغة مقترحة'],opponent:['تحليل مستند للخصم','ما يثبته وما لا يثبته، ومواطن ضعفه وأوجه الطعن فيه'],gaps:['ثغرات مستند قانوني','ارفع أي مستند في القضية أو أملِ وقائعه، فتُحلَّل ثغراته الشكلية والموضوعية والمخاطر والخطوات'],appeal:['أسباب الطعن في حكم','ارفع الحكم فيُحدَّد طريق الطعن ومهلته وأسبابه بسندها، ثم صِغ لائحة الطعن'],similar:['أحكام مشابهة','الأقرب لقضيتك من مكتبة الاجتهادات، وكيف يُستفاد منها'],client_msg:['رسالة للموكل','تحديث مبسّط عن قضيته، تراجعه ثم ترسله من المحادثة'],minutes:['محضر اجتماع بالصوت','أملِ ما دار في الاجتماع فيُنظَّم محضراً بالمهام والمواعيد'],translate:['ترجمة قانونية','إلى الإنجليزية أو العبرية أو العربية']};
const QPH={gaps:'تعليمات أو وقائع إضافية (اختياري)، أو أملِ الوقائع هنا بدل رفع مستند…',appeal:'ملاحظات اختيارية: مثلاً «موكلنا هو المدعى عليه، والتبليغ بالحكم كان بتاريخ…»',question:'مثال: ما مدة تقادم المطالبة بالأجور المتأخرة؟ وهل يقطعها الإنذار العدلي؟',client_msg:'ملاحظة اختيارية: مثلاً «طمئنه أن التأجيل إجرائي، واطلب منه إحضار كشوف الرواتب»',minutes:'أملِ ما دار: من حضر، وما بُحث، وما اتُّفق عليه، والمهام ومواعيدها…',translate:'الصق النص المراد ترجمته، أو ارفع ملفاً'};
const LANGS={en:'الإنجليزية',he:'العبرية',ar:'العربية'};
function history(k){const hs=hearings.filter(h=>h.k===k.id).sort((a,b)=>a.date.localeCompare(b.date)),ds=deadlines.filter(d=>d.k===k.id),dc=docs.filter(d=>d.k===k.id),ml=typeof mzLog!=='undefined'?mzLog.filter(l=>l.k===k.id):[];
 return [`اليوم: ${iso(TODAY)}`,hs.length&&'الجلسات:\n'+hs.map(h=>`- ${h.date} ${h.time||''}: ${h.purpose||''}${h.result?' — القرار: '+h.result:''}`).join('\n'),
  ds.length&&'المهل:\n'+ds.map(d=>`- ${d.due}: ${d.title} (${d.kind||''})`).join('\n'),dc.length&&'المستندات:\n'+dc.map(d=>`- ${d.date||''}: ${d.title} (${d.kind||''})`).join('\n'),
  ml.length&&'أحداث ميزان:\n'+ml.slice(-15).map(l=>`- ${l.at}: ${l.t}`).join('\n')].filter(Boolean).join('\n\n')}
A.asOpen=async(v,t)=>{if(ro())return;if(!can2('write'))return toast('المساعد متاح للمحامين ومدير المكتب');AS.k=v!=null&&v!==''?v:(AS.k||homeCase());if(t&&t.dataset.mode&&MODES[t.dataset.mode]&&t.dataset.mode!==AS.mode){AS.mode=t.dataset.mode;AS.doc=null}AS.res=null;AS.err='';asDraw();
 if(!D.status)try{D.status=await api('status')}catch(er){AS.err=er.message}asDraw()};
function asDraw(){const m=document.getElementById('modal');m.innerHTML=`<div class="modal-bg" data-act="close"><div class="modal ai-modal" role="dialog" aria-label="مساعد القضية">${asBody()}</div></div>`}
function asBody(){const k=K(AS.k),st=D.status;
 const head=`<div class="head"><div><h1 style="font-size:23px">مساعد المحامي الذكي</h1><p class="sub">${k?`${e(k.no)} · ${e(k.subject||'')}`:'دون قضية محددة'}</p></div><button class="btn sm" data-act="aiClose">إغلاق</button></div>
  <label class="as-case">القضية <select class="field" id="asK"><option value="">— دون قضية محددة —</option>${cases.map(c=>`<option value="${c.id}" ${c.id===AS.k?'selected':''}>${e(c.no)} · ${e((C(c.client)||{}).name||'')} · ${e(c.subject||'')}</option>`).join('')}</select></label>`;
 if(!st)return head+`<div class="lg-empty">${AS.err?e(AS.err):'جارٍ التحضير…'}</div>`;
 if(!st.configured)return head+`<div class="lg-empty">المساعد يحتاج مفتاح الذكاء الاصطناعي. ${st.canManage?'<button class="btn pri sm" data-act="aiOpen" data-v="'+e(AS.k)+'">ضبط المفتاح</button>':'يضيفه مدير المكتب.'}</div>`;
 const tabs=`<div class="as-modes">${Object.entries(MODES).map(([id,[t,d]])=>`<button type="button" class="as-mode ${AS.mode===id?'on':''}" data-act="asMode" data-v="${id}"><b>${t}</b><span>${d}</span></button>`).join('')}</div>`;
 const tr=AS.mode==='translate';
 const q=QPH[AS.mode]&&!(tr&&AS.doc)?`<div class="ai-dict" style="margin-top:10px">${tr?`<label class="as-lang">الترجمة إلى <select class="field" id="asLang">${Object.entries(LANGS).map(([v,t])=>`<option value="${v}" ${AS.lang===v?'selected':''}>${t}</option>`).join('')}</select></label>`:''}<div class="ai-resp"><textarea class="field ai-text" id="asQ" rows="${AS.mode==='minutes'||tr?6:3}" placeholder="${QPH[AS.mode]}">${e(AS.q)}</textarea><button type="button" class="ai-mic sm ${D.listening&&D.target==='asQ'?'on':''}" data-act="asMic" aria-label="إملاء السؤال">${D.listening&&D.target==='asQ'?'■':'🎙'}</button></div><div class="ai-interim" id="aiInterim"></div></div>`:'';
 const dk=AS.mode==='contract'||AS.mode==='opponent'||AS.mode==='gaps'||AS.mode==='appeal'||tr;
 const dbox=dk?`<div class="ai-opp" style="margin-top:10px">${AS.doc?`<b>${e(AS.doc.name)}</b> <span class="m">${AS.doc.text?'(نص · تُخفى الأسماء قبل الإرسال)':'(يُرسل الملف كما هو)'}</span> <button type="button" class="link" data-act="asDocClear">تغيير</button>`
  :`<b>${tr?'أو ارفع ملفاً للترجمة':AS.mode==='contract'?'ارفع العقد':AS.mode==='gaps'?'ارفع المستند (لائحة، عقد، حكم، تقرير، إفادة…) أو أملِ وقائعه أعلاه':AS.mode==='appeal'?'ارفع الحكم المراد الطعن فيه':'ارفع مستند الخصم'}</b> <span class="m">(Word أو PDF أو صورة أو نص)</span><div class="toolbar" style="margin-top:6px"><input type="file" id="asFile" accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.txt"></div>`}</div>`:'';
 const sim=AS.mode==='similar'&&!(typeof rulings!=='undefined'&&rulings.length)?`<div class="ai-note" style="margin-top:8px">مكتبة الاجتهادات فارغة حالياً؛ أضف أحكاماً من «البحث في الأحكام» أو «الاجتهادات القضائية» أولاً.</div>`:'';
 const go=`<div class="toolbar" style="margin-top:10px"><button class="btn pri" data-act="asRun" ${AS.busy?'disabled':''}>${AS.busy?'جارٍ التحضير…':'ابدأ'}</button>${AS.busy?'<span class="m">'+(AS.mode==='brief'?'يقرأ سجل القضية…':AS.mode==='similar'?'يبحث في مكتبة الاجتهادات…':'يقرأ ويبحث في التشريعات والأحكام؛ قد يستغرق دقيقة')+'</span>':''}</div>`;
 return head+tabs+q+dbox+sim+(AS.err?`<div class="ai-err" style="margin-top:10px">${e(AS.err)}</div>`:'')+(AS.res?asResult():go)}
A.asMode=v=>{asKeep();if(AS.busy)return;if(v!==AS.mode)AS.doc=null;AS.mode=v;AS.res=null;AS.err='';asDraw()};
A.asDocClear=()=>{AS.doc=null;AS.res=null;asDraw()};
document.addEventListener('change',ev=>{if(ev.target.id!=='asK')return;asKeep();AS.res=null;AS.err='';asDraw()});
document.addEventListener('change',async ev=>{if(ev.target.id!=='asFile')return;const f=ev.target.files[0];if(!f)return;asKeep();
 if(f.size>10*1024*1024){toast('الملف أكبر من 10 ميغابايت');return}const nm=f.name.toLowerCase();
 try{if(nm.endsWith('.docx'))AS.doc={name:f.name,text:await docxText(await f.arrayBuffer())};else if(nm.endsWith('.txt'))AS.doc={name:f.name,text:await f.text()};
  else{if(!confirm('ملف PDF أو الصورة يُرسل كما هو لخدمة القراءة (لا يمكن إخفاء الأسماء داخله). متابعة؟')){ev.target.value='';return}
   AS.doc={name:f.name,file:{name:f.name,type:f.type||(nm.endsWith('.pdf')?'application/pdf':'image/jpeg'),data:b64(await f.arrayBuffer())}}}}
 catch(er){toast(er.message);return}AS.err='';asDraw()});
const asKeep=()=>{const kk=document.getElementById('asK');if(kk)AS.k=kk.value;const t=document.getElementById('asQ');if(t)AS.q=t.value;const l=document.getElementById('asLang');if(l)AS.lang=l.value};
A.asMic=()=>{asKeep();if(D.listening&&D.target!=='asQ')stopMic();A.aiMic('asQ')};
const NEEDK=new Set(['brief','defences','similar','client_msg','opponent']);
A.asRun=async()=>{if(AS.busy)return;stopMic();asKeep();const k=AS.k?K(AS.k):null;if(!k&&NEEDK.has(AS.mode)){AS.err='اختر القضية أولاً';return asDraw()}if((AS.mode==='contract'||AS.mode==='opponent')&&!AS.doc){AS.err='ارفع المستند أولاً';return asDraw()}
 if(AS.mode==='minutes'&&AS.q.trim().length<20){AS.err='أملِ ملاحظات الاجتماع أولاً';return asDraw()}
 if(AS.mode==='translate'&&!AS.doc&&AS.q.trim().length<5){AS.err='الصق النص أو ارفع الملف';return asDraw()}if((AS.mode==='gaps'||AS.mode==='appeal')&&!AS.doc&&AS.q.trim().length<40){AS.err=AS.mode==='appeal'?'ارفع الحكم أو الصق نصه':'ارفع المستند أو أملِ وقائعه بوضوح';return asDraw()}if(AS.mode==='question'&&AS.q.trim().length<8){AS.err='اكتب السؤال أو أمله بوضوح';return asDraw()}
 AS.busy=true;AS.err='';asDraw();
 const m=AS.mode,docm=m==='contract'||m==='opponent'||m==='translate'||m==='gaps'||m==='appeal';
 try{AS.res=await api('assist',{mode:m,caseId:k?k.id:'',case:k?caseCtx(k):{},history:m==='translate'||!k?'':history(k),question:m==='translate'||((m==='gaps'||m==='appeal')&&!AS.doc)?'':AS.q,lang:AS.lang,web:true,...(docm?(AS.doc?(AS.doc.text?{text:AS.doc.text}:{file:AS.doc.file}):{text:AS.q}):{})})}catch(er){AS.err=er.message;if(er.body&&er.body.needKey)D.status.configured=false}
 AS.busy=false;asDraw()};
const asLink=s=>e(s).replace(/\[(R\d+)\]/g,'<sup class="ai-r">[$1]</sup>').replace(/\[مرجع يحتاج تحقق[^\]]*\]/g,m=>`<mark class="ai-v">${m}</mark>`);
function asResult(){const r=AS.res;
 const ltr=r.mode==='translate'&&r.lang==='en';
 return `<div class="ai-doc as-doc" id="asDoc" ${ltr?'dir="ltr" style="text-align:left"':''}>${r.sections.map(s=>`${s.heading?`<h3>${e(s.heading)}</h3>`:''}${r.mode==='translate'||r.mode==='client_msg'?s.items.map(i=>`<p>${asLink(i)}</p>`).join(''):`<ul>${s.items.map(i=>`<li>${asLink(i)}</li>`).join('')}</ul>`}`).join('')||'<p class="m">لا نتيجة.</p>'}</div>
 ${r.references.length?`<h3 class="ai-h">المراجع (${r.references.length})</h3><ol class="ai-refs">${r.references.map(x=>`<li><details><summary><b>[${x.id}]</b> ${e(x.title)}${x.ref?` <span class="mono">${e(x.ref)}</span>`:''}${x.arts.length?' — '+e(x.arts.join('، ')):''} <span class="pill ${x.origin==='library'?'ok':''}">${originOf(x)}</span></summary>${srcLine(x)}<div class="as-txt">${e(x.text||'')}</div></details></li>`).join('')}</ol>`:(AS.mode==='brief'?'':'<p class="m">لم يُعثر على نص في المصادر المتاحة يُستند إليه.</p>')}
 ${r.unverified.length?`<h3 class="ai-h">يحتاج تحقق (${r.unverified.length})</h3><ul class="ai-unv">${r.unverified.map(u=>`<li>${e(u)}</li>`).join('')}</ul>`:''}
 <div class="ai-warn" style="margin-top:10px">${r.mode==='translate'?'ترجمة آلية للمراجعة؛ الأسماء تبقى بلغتها الأصلية. لا تُعتمد رسمياً إلا بعد مراجعة مترجم قانوني.':r.mode==='client_msg'?'راجع الرسالة قبل إرسالها؛ لا تُرسل تلقائياً.':'مساعدة أولية للمحامي، وليست رأياً قانونياً نهائياً. راجع النصوص المرفقة قبل الاعتماد عليها.'}</div>
 <div class="toolbar"><button class="btn pri" data-act="asSave">حفظ في مستندات القضية</button><button class="btn" data-act="asPrint">طباعة</button><button class="btn" data-act="asCopy">نسخ</button>${r.mode==='client_msg'?'<button class="btn" data-act="asToChat">فتح في محادثة الموكل</button>':''}${r.mode==='appeal'?'<button class="btn" data-act="asToDraft" data-v="لائحة استئناف">صياغة لائحة استئناف</button><button class="btn" data-act="asToDraft" data-v="لائحة نقض">صياغة لائحة نقض</button>':r.mode==='gaps'?'<button class="btn" data-act="asToDraft" data-v="مذكرة دفاع">صياغة مذكرة من هذا التحليل</button>':''}<button class="btn" data-act="asAgain">طلب جديد</button></div>`}
const asPlain=()=>{const r=AS.res;return [MODES[r.mode][0]+' — '+(K(AS.k)||{}).no,...r.sections.flatMap(s=>[s.heading,...s.items.map(i=>r.mode==='translate'||r.mode==='client_msg'?i:'• '+i)].filter(Boolean)),...(r.references.length?['المراجع:',...r.references.map(x=>`[${x.id}] ${x.title}${x.ref?' ('+x.ref+')':''}${x.arts.length?' — '+x.arts.join('، '):''}`)]:[]),...(r.unverified.length?['يحتاج تحقق:',...r.unverified.map(u=>'• '+u)]:[])].join('\n')};
A.asAgain=()=>{AS.res=null;asDraw()};
/* نقل نتيجة التحليل إلى الصياغة كإملاء جاهز (لائحة استئناف/نقض أو مذكرة) */
A.asToDraft=v=>{const r=AS.res;if(!r)return;const t=r.sections.map(s=>(s.heading||s.title||'')+':\n'+s.items.join('\n')).join('\n\n');const k=AS.k;A.aiClose();A.aiOpenWith(k,'بناءً على التحليل التالي:\n\n'+t,String(v||''))};
A.asToChat=()=>{const k=K(AS.k),r=AS.res;if(!k||!r)return;const t=r.sections.flatMap(s=>s.items).join('\n\n');A.aiClose();A.portalFor(k.client);
 setTimeout(()=>{const m=document.getElementById('msgT');if(m){m.value=t;m.focus()}},150)};
A.asCopy=()=>{(navigator.clipboard?navigator.clipboard.writeText(asPlain()):Promise.reject()).then(()=>toast('نُسخ')).catch(()=>toast('تعذّر النسخ'))};
A.asSave=()=>{if(ro())return;const k=AS.k?K(AS.k):null,r=AS.res;if(!r)return;if(!k)return toast('اختر القضية لحفظ النتيجة في مستنداتها');
 docs.push({id:'d'+Date.now().toString(36),k:k.id,title:MODES[r.mode][0]+(r.mode==='question'?': '+AS.q.slice(0,60):AS.doc?': '+AS.doc.name:'')+' — '+iso(TODAY),kind:{translate:'ترجمة',minutes:'محضر اجتماع',client_msg:'مراسلة'}[r.mode]||'مذكرة داخلية',date:iso(TODAY),src:'مساعد القضية',pages:1,shared:false,text:asPlain(),refs:r.references.map(x=>({id:x.id,kind:x.kind,title:x.title,ref:x.ref,arts:x.arts,origin:x.origin,url:x.url||''})),unverified:r.unverified,aiDraft:true});
 if(window.MQ&&MQ.saveState)MQ.saveState();toast('حُفظت في مستندات القضية '+k.no)};
A.asPrint=()=>{if(!window.MQP||!AS.res)return;const r=AS.res,k=K(AS.k),B=MQP.B,E=MQP.esc;
 MQP.open({label:MODES[r.mode][0],build(){return {title:MODES[r.mode][0],sub:k?'في الدعوى رقم '+k.no:'',ref:k?k.no:'',file:'brief-'+(k?k.no.replace(/\W+/g,'-'):'case'),
  blocks:[...(r.mode==='question'?[B.box('<b>السؤال:</b> '+E(AS.q))]:[]),...r.sections.flatMap(s=>[...(s.heading?[B.h(E(s.heading))]:[]),...s.items.map(i=>B.p((r.mode==='translate'||r.mode==='client_msg'?'':'• ')+E(i)))]),
   ...(r.references.length?[B.h('المراجع'),...r.references.map(x=>B.p('<small>['+x.id+'] '+E(x.title)+(x.ref?' ('+E(x.ref)+')':'')+(x.arts.length?' — '+E(x.arts.join('، ')):'')+'</small>','s'))]:[]),
   ...(r.unverified.length?[B.h('يحتاج تحقق'),...r.unverified.map(u=>B.p('• '+E(u)))]:[])],sign:['المحامي'],mark:'داخلي'}}})};

const css=document.createElement('style');css.textContent=`
.ai-modal{max-width:980px}.ai-form{grid-template-columns:1fr 1fr}
.ai-case{background:var(--sunk);border:1px solid var(--line);border-radius:10px;padding:8px 12px;font-size:13.5px}
.ai-dict{border:1px solid var(--line);border-radius:12px;padding:12px;background:var(--surface)}
.ai-mic-row{display:flex;gap:12px;align-items:center;margin-bottom:10px;font-size:14px;line-height:1.7}
.ai-mic{all:unset;cursor:pointer;width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;background:linear-gradient(135deg,#E2C46A,#D4AF37 50%,#B8863D);box-shadow:0 6px 16px rgba(184,134,61,.35);flex:none}
.ai-mic.on{background:#DC2626;color:#fff;animation:aiPulse 1.4s infinite}.ai-mic:focus-visible{outline:3px solid var(--brass);outline-offset:3px}
@keyframes aiPulse{0%{box-shadow:0 0 0 0 rgba(220,38,38,.5)}70%{box-shadow:0 0 0 16px rgba(220,38,38,0)}100%{box-shadow:0 0 0 0 rgba(220,38,38,0)}}
.ai-text{font-family:var(--f-doc,inherit);font-size:16px;line-height:1.9;width:100%;box-sizing:border-box}.ai-interim{color:var(--muted);min-height:1.4em;font-size:14px;margin-top:4px}
.ai-opp{border:1px dashed var(--brass);border-radius:12px;padding:10px 14px;line-height:1.8;font-size:14px}.ai-opp-h{margin-bottom:6px}
.ai-claims{margin:0;padding-inline-start:22px;max-height:38vh;overflow:auto}.ai-claims li{margin-bottom:10px}.ai-claim{background:var(--sunk);border-radius:8px;padding:6px 10px;margin-bottom:4px}
.ai-stance-label{display:flex;gap:10px;align-items:center;margin:5px 0 8px;font-weight:600}.ai-stance-label select{flex:1;max-width:240px;font-weight:400}.ai-resp{display:flex;gap:8px;align-items:flex-start}.ai-resp textarea{flex:1;font-family:var(--f-doc,inherit);font-size:15px}.ai-mic.sm{width:38px;height:38px;font-size:17px}
.ai-note{font-size:13px;color:var(--muted);line-height:1.8}.ai-err{color:#B91C1C;background:#FEF2F2;border:1px solid #FCA5A5;border-radius:8px;padding:8px 12px}
.ai-warn{border:1px solid #F59E0B;background:#FFFBEB;color:#78350F;border-radius:10px;padding:10px 14px;margin-bottom:10px;line-height:1.8}
.ai-doc{border:1px solid var(--line);border-radius:10px;padding:16px 22px;background:#fff;font-family:var(--f-doc,inherit);font-size:16px;line-height:2;max-height:52vh;overflow:auto;outline:none}
.ai-doc:focus{border-color:var(--brass)}.ai-doc h2{text-align:center;font-size:20px;margin:4px 0}.ai-doc h3{font-size:16.5px;margin:14px 0 4px;color:var(--brass,#8B6F47)}.ai-doc p{margin:0 0 8px;text-align:justify}.ai-court{text-align:center;font-weight:700}
.ai-r{color:#1D4ED8;font-weight:700}.ai-v{background:#FDE68A}.ai-f{background:#E0EAFD;border-radius:4px;padding:0 3px}
.ai-h{font-size:15.5px;margin:14px 0 6px}.ai-refs{margin:0;padding-inline-start:22px;line-height:1.9;font-size:14px}.ai-refs .m{font-size:12.5px}.ai-unv{line-height:1.9;font-size:14px;color:#78350F}
.ai-modal>*{flex-shrink:0}.as-modes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}@media(max-width:700px){.as-modes{grid-template-columns:repeat(2,minmax(0,1fr))}.as-mode span{display:none}}.as-mode{all:unset;cursor:pointer;border:1px solid var(--line);border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:3px;background:var(--surface);line-height:1.6}
.as-mode span{font-size:12.5px;color:var(--muted)}.as-mode.on{border-color:var(--brass);box-shadow:0 0 0 2px rgba(184,134,61,.25);background:var(--sunk)}.as-mode:focus-visible{outline:3px solid var(--brass)}
.as-home{margin:0 0 16px;padding:16px 18px}.as-home-h{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:12px}.as-home-h h2{margin:0;font-size:18px}.as-home-h p{margin:2px 0 0;color:var(--muted);font-size:13.5px}
.as-home-q{display:flex;flex-wrap:nowrap;gap:6px;overflow-x:auto;scrollbar-width:thin;padding-bottom:2px}.as-q{all:unset;cursor:pointer;flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;text-align:center;padding:7px 3px;border:1px solid var(--line);border-radius:10px;background:var(--surface);font-size:11.5px;font-weight:600;line-height:1.35;box-sizing:border-box}
.as-q span{font-size:16px}@media(max-width:760px){.as-q{min-width:76px}}.as-q:hover{border-color:var(--brass);background:var(--sunk)}.as-q:focus-visible{outline:3px solid var(--brass);outline-offset:2px}

.as-case{display:flex;gap:8px;align-items:center;margin:0 0 10px;font-size:14px}.as-case select{flex:1;min-width:0}
.as-lang{display:flex;gap:8px;align-items:center;margin-bottom:8px;font-size:14px}.as-lang select{width:auto}.as-doc ul{margin:0 0 6px;padding-inline-start:20px}.as-doc li{margin-bottom:4px;text-align:justify}.as-src{margin:6px 0;font-size:13.5px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}.as-txt{white-space:pre-wrap;font-size:13px;background:var(--sunk);border-radius:8px;padding:8px 10px;margin:4px 0 8px;max-height:30vh;overflow:auto}
@media(max-width:700px){.ai-form{grid-template-columns:1fr}}`;
document.head.appendChild(css);
})();
