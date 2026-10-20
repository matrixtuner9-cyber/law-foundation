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
const D={k:'',type:'لائحة جوابية',tpl:'',text:'',web:true,busy:false,res:null,err:'',status:null,listening:false,interim:'',target:'aiText',claims:[],opp:null,reading:false};
async function api(path,body){const r=await fetch('/api/admin/ai/'+path,body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{});
 if(r.status===401){location.replace('/login.html');throw new Error('انتهت الجلسة')}const j=await r.json().catch(()=>({}));if(!r.ok){const er=new Error(j.error||('HTTP '+r.status));er.body=j;throw er}return j}

/* زر في صفحة القضية بجانب «إنشاء مستند» */
const vcase=V.case;V.case=()=>{const h=vcase();if(!online())return h;
 return h.replace(/(<button class="btn" data-act="tplFor" data-v="([^"]+)">إنشاء مستند<\/button>)/,(m,b,id)=>b+`<button class="btn pri" data-act="aiOpen" data-v="${id}" title="أملِ الوقائع بصوتك فتُصاغ لائحة رسمية بمراجعها">🎙 صياغة بالصوت</button>`)};

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
 D.k=v||D.k||(cases[0]||{}).id;if(t&&t.dataset.tpl){D.tpl=t.dataset.tpl;D.type=tplTitle(D.tpl)||D.type}
 D.res=null;D.err='';draw();try{D.status=await api('status');draw()}catch(er){D.err=er.message;draw()}};
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
  <label class="wide rl-ck"><input type="checkbox" id="aiWeb" ${D.web?'checked':''}> البحث عن المراجع في مصادر التشريعات على الإنترنت أيضاً (إضافة إلى مكتبة المكتب)</label>
  <div class="wide ai-note">تُخفى أسماء الأطراف وأرقام الهويات والهواتف قبل الإرسال لخدمة الصياغة وتُعاد بعدها. المراجع تُؤخذ من نصوص موجودة فقط، وما لا سند له يُعلَّم «يحتاج تحقق».${SR&&!isElectron?' الإملاء في المتصفح يمر بخدمة التعرف على الكلام في المتصفح نفسه.':''}</div>
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
A.aiMic=v=>{v=v||'aiText';if(!SR||isElectron){toast('في تطبيق سطح المكتب: ضع المؤشر في مربع النص واضغط Win+H للإملاء');const t=document.getElementById(v);if(t)t.focus();return}
 if(D.listening){const same=D.target===v;stopMic();keep();if(same){draw();return}}
 keep();D.target=v;rec=new SR();rec.lang='ar-PS';rec.continuous=true;rec.interimResults=true;
 rec.onresult=ev=>{let fin='',mid='';for(let i=ev.resultIndex;i<ev.results.length;i++){const r=ev.results[i];if(r.isFinal)fin+=r[0].transcript;else mid+=r[0].transcript}
  const t=document.getElementById(D.target);if(fin&&t){t.value=(t.value&&!/\s$/.test(t.value)?t.value+' ':t.value)+fin.trim();keep()}
  D.interim=mid;const i=document.getElementById('aiInterim');if(i)i.textContent=mid};
 rec.onerror=ev=>{if(ev.error==='not-allowed'||ev.error==='service-not-allowed')toast('اسمح للمتصفح باستخدام المايكروفون');else if(ev.error==='language-not-supported'&&rec){rec.lang='ar-JO';try{rec.start()}catch(_){}return}else if(ev.error!=='no-speech'&&ev.error!=='aborted')toast('تعذّر الإملاء: '+ev.error)};
 rec.onend=()=>{if(D.listening&&rec){try{rec.start()}catch(_){}}else{D.interim='';const b=document.querySelector('.ai-mic');if(b&&!D.listening)draw()}};
 try{rec.start();D.listening=true}catch(er){toast('تعذّر تشغيل المايكروفون')}draw()};
function keep(){const t=document.getElementById('aiText');if(t)D.text=t.value;D.claims.forEach((c,i)=>{const r=document.getElementById('aiR'+i);if(r)c.response=r.value});const ty=document.getElementById('aiType');if(ty)D.type=ty.value;const k=document.getElementById('aiK');if(k)D.k=k.value;const w=document.getElementById('aiWeb');if(w)D.web=w.checked}
function bind(){const t=document.getElementById('aiText');if(t)t.oninput=()=>{D.text=t.value};const k=document.getElementById('aiK');if(k)k.onchange=()=>{keep();draw()}}

document.addEventListener('submit',async ev=>{const f=ev.target;if(f.id!=='fAi'&&f.id!=='fAiKey')return;ev.preventDefault();ev.stopImmediatePropagation();
 if(f.id==='fAiKey'){try{D.status={...D.status,...await api('key',{key:document.getElementById('aiKey').value.trim()})};D.err='';toast('حُفظ المفتاح')}catch(er){D.err=er.message}draw();return}
 if(D.busy||ro())return;stopMic();keep();const k=K(D.k);if(!k){D.err='اختر القضية';return draw()}
 const tplId=D.tpl&&tplTitle(D.tpl)===D.type?D.tpl:(LIB().find(x=>x.title===D.type)||{}).id||'';const tx=tplId?LIB().find(x=>x.id===tplId):null;
 D.busy=true;D.err='';draw();
 try{const r=await api('draft',{docType:D.type,dictation:D.text,case:caseCtx(k),web:D.web,template:tx&&tx.body||'',claims:D.claims});D.res={...r,tpl:tplId};D.busy=false;draw()}
 catch(er){D.busy=false;D.err=er.message;if(er.body&&er.body.needKey)D.status.configured=false;draw()}},true);

/* ── لائحة الخصم: رفعها واستخراج ادعاءاته ليُرد عليها بنداً بنداً ── */
function oppBox(){
 if(D.reading)return `<div class="wide ai-opp"><b>جارٍ قراءة لائحة الخصم واستخراج ادعاءاته…</b></div>`;
 if(!D.claims.length)return `<div class="wide ai-opp"><b>الرد على لائحة الخصم</b> <span class="m">(اختياري)</span> — ارفع لائحته (PDF أو صورة أو Word أو نص) فتُستخرج ادعاءاته بنداً بنداً، وتملي ردك على كل بند.
  <div class="toolbar" style="margin-top:6px"><input type="file" id="aiOppFile" accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.txt"></div></div>`;
 return `<div class="wide ai-opp"><div class="ai-opp-h"><b>ادعاءات الخصم (${D.claims.length})</b>${D.opp&&D.opp.summary?` <span class="m">· ${e(D.opp.summary)}</span>`:''} <button type="button" class="link" data-act="aiOppClear">إزالة</button></div>
  <ol class="ai-claims">${D.claims.map((c,i)=>`<li><div class="ai-claim">${e(c.text)}</div><div class="ai-resp"><textarea class="field" id="aiR${i}" rows="2" placeholder="ردّك على هذا البند (أو اتركه للإنكار العام)">${e(c.response||'')}</textarea><button type="button" class="ai-mic sm ${D.listening&&D.target==='aiR'+i?'on':''}" data-act="aiMic" data-v="aiR${i}" aria-label="إملاء الرد على البند ${i+1}">${D.listening&&D.target==='aiR'+i?'■':'🎙'}</button></div></li>`).join('')}</ol>
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
 const k=K(D.k),nm=f.name.toLowerCase();let body={case:k?caseCtx(k):{}};
 try{if(nm.endsWith('.docx'))body.text=await docxText(await f.arrayBuffer());else if(nm.endsWith('.txt'))body.text=await f.text();
  else{const type=f.type||(nm.endsWith('.pdf')?'application/pdf':'image/jpeg');
   if(!confirm('ملف PDF أو الصورة يُرسل كما هو لخدمة القراءة (لا يمكن إخفاء الأسماء داخله). متابعة؟')){ev.target.value='';return}
   body.file={name:f.name,type,data:b64(await f.arrayBuffer())}}}
 catch(er){toast(er.message);return}
 D.reading=true;D.err='';draw();
 try{const r=await api('extract',body);D.opp=r;D.claims=r.claims.map(t=>({text:t,response:''}));if(!/جوابية/.test(D.type))D.type=/استئناف/.test(r.docType)?'لائحة جوابية على الاستئناف':'لائحة جوابية'}
 catch(er){D.err=er.message}D.reading=false;draw()});

/* ── النتيجة ── */
const ORIGIN={library:'مكتبة التشريعات',web:'مصادر التشريعات',rulings:'مكتبة الاجتهادات'};
function asText(r){return [r.title,r.court?('لدى '+r.court):'', ...r.sections.flatMap(s=>[s.heading,...s.paragraphs])].filter(Boolean).join('\n')}
function refsText(r){return r.references.map(x=>`[${x.id}] ${x.title}${x.ref?' ('+x.ref+')':''}${x.arts.length?' — '+x.arts.join('، '):''}`).join('\n')}
function result(){const r=D.res;const linkR=s=>e(s).replace(/\[(R\d+)\]/g,'<sup class="ai-r">[$1]</sup>').replace(/\[مرجع يحتاج تحقق[^\]]*\]/g,m=>`<mark class="ai-v">${m}</mark>`).replace(/\{[^{}]+\}/g,m=>`<span class="ai-f">${m}</span>`);
 return `<div class="ai-warn"><b>مسودة للمراجعة.</b> راجع الوقائع والأسانيد قبل الإيداع، وأكمل ما بين { }، وتحقق من كل ما عُلّم بالأصفر.</div>
 <div class="ai-doc" id="aiDoc" contenteditable="true" spellcheck="false"><h2>${e(r.title)}</h2>${r.court?`<p class="ai-court">${e('لدى '+r.court)}</p>`:''}${r.sections.map(s=>`<h3>${e(s.heading)}</h3>${s.paragraphs.map(p=>`<p>${linkR(p)}</p>`).join('')}`).join('')}</div>
 <h3 class="ai-h">المراجع المستشهد بها (${r.references.length})</h3>
 ${r.references.length?`<ol class="ai-refs">${r.references.map(x=>`<li><b>[${x.id}]</b> ${e(x.title)}${x.ref?` <span class="mono">${e(x.ref)}</span>`:''}${x.arts.length?' — '+e(x.arts.join('، ')):''} <span class="pill ${x.origin==='library'?'ok':''}">${ORIGIN[x.origin]||''}</span>${x.used_for?`<div class="m">${e(x.used_for)}</div>`:''}</li>`).join('')}</ol>`:'<p class="m">لم يُستشهد بمرجع من المصادر المتاحة.</p>'}
 ${r.unverified.length?`<h3 class="ai-h">أسانيد تحتاج تحقق (${r.unverified.length})</h3><ul class="ai-unv">${r.unverified.map(u=>`<li>${e(u)}</li>`).join('')}</ul>`:''}
 <p class="m">فُحص ${r.considered} مرجعاً من المصادر المتاحة.</p>
 <div class="toolbar"><button class="btn pri" data-act="aiSave">حفظ في مستندات القضية</button><button class="btn" data-act="aiPrint">معاينة وطباعة</button><button class="btn" data-act="aiCopy">نسخ النص</button><button class="btn" data-act="aiBack">تعديل الإملاء وإعادة الصياغة</button></div>`}
const docText=()=>{const d=document.getElementById('aiDoc');return d?d.innerText.trim():asText(D.res)};
A.aiBack=()=>{D.res=null;draw()};
A.aiCopy=()=>{const t=docText()+'\n\nالمراجع:\n'+refsText(D.res);(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('نُسخ النص')).catch(()=>toast('تعذّر النسخ'))};
A.aiSave=()=>{if(ro())return;const k=K(D.k),r=D.res;if(!k||!r)return;
 docs.push({id:'d'+Date.now().toString(36),k:k.id,title:r.title+' (مسودة)',kind:D.type,date:iso(TODAY),src:'الصياغة بالصوت',pages:1,shared:false,text:docText(),refs:r.references.map(x=>({id:x.id,title:x.title,ref:x.ref,arts:x.arts,origin:x.origin})),unverified:r.unverified,aiDraft:true,tpl:r.tpl||undefined,tplStatus:'draft'});
 if(window.MQ&&MQ.saveState)MQ.saveState();toast('حُفظت المسودة في مستندات القضية '+k.no);A.aiClose();S.caseId=k.id;S.view='case';S.caseTab='docs';render()};
A.aiPrint=()=>{if(!window.MQP||!D.res)return;const r=D.res,k=K(D.k),B=MQP.B,E=MQP.esc,lines=docText().split('\n').filter(l=>l.trim());
 MQP.open({label:r.title,build(){return {title:r.title,sub:k?'في الدعوى رقم '+k.no:'',ref:k?k.no:'',file:'draft-'+(k?k.no.replace(/\W+/g,'-'):'doc'),
  blocks:[B.box('<b>مسودة غير معتمدة</b> · لا تُودع قبل مراجعة المحامي وإكمال ما بين { } والتحقق من الأسانيد','warn'),...lines.slice(1).map(l=>B.p(E(l))),
   ...(r.references.length?[B.h('المراجع'),...r.references.map(x=>B.p('<small>['+x.id+'] '+E(x.title)+(x.ref?' ('+E(x.ref)+')':'')+(x.arts.length?' — '+E(x.arts.join('، ')):'')+'</small>','s'))]:[])],
  sign:['المحامي'],mark:'مسودة'}}})};

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
.ai-resp{display:flex;gap:8px;align-items:flex-start}.ai-resp textarea{flex:1;font-family:var(--f-doc,inherit);font-size:15px}.ai-mic.sm{width:38px;height:38px;font-size:17px}
.ai-note{font-size:13px;color:var(--muted);line-height:1.8}.ai-err{color:#B91C1C;background:#FEF2F2;border:1px solid #FCA5A5;border-radius:8px;padding:8px 12px}
.ai-warn{border:1px solid #F59E0B;background:#FFFBEB;color:#78350F;border-radius:10px;padding:10px 14px;margin-bottom:10px;line-height:1.8}
.ai-doc{border:1px solid var(--line);border-radius:10px;padding:16px 22px;background:#fff;font-family:var(--f-doc,inherit);font-size:16px;line-height:2;max-height:52vh;overflow:auto;outline:none}
.ai-doc:focus{border-color:var(--brass)}.ai-doc h2{text-align:center;font-size:20px;margin:4px 0}.ai-doc h3{font-size:16.5px;margin:14px 0 4px;color:var(--brass,#8B6F47)}.ai-doc p{margin:0 0 8px;text-align:justify}.ai-court{text-align:center;font-weight:700}
.ai-r{color:#1D4ED8;font-weight:700}.ai-v{background:#FDE68A}.ai-f{background:#E0EAFD;border-radius:4px;padding:0 3px}
.ai-h{font-size:15.5px;margin:14px 0 6px}.ai-refs{margin:0;padding-inline-start:22px;line-height:1.9;font-size:14px}.ai-refs .m{font-size:12.5px}.ai-unv{line-height:1.9;font-size:14px;color:#78350F}
@media(max-width:700px){.ai-form{grid-template-columns:1fr}}`;
document.head.appendChild(css);
})();
