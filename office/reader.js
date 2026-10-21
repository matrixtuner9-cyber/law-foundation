/* ── قراءة مرفقات الموكل ──
   زر «قراءة النص» بجوار الصور والمستندات في مراسلات الموكل: يستخرج النص ويعرضه، ويقرؤه صوتياً للمحامي.
   مجاناً وداخل المتصفح أولاً (لا يخرج الملف من جهاز المحامي):
   - TXT وWord: قراءة مباشرة
   - PDF: استخراج النص المضمّن بـ PDF.js، وإن كان ممسوحاً ضوئياً يُتعرّف على صوره بـ Tesseract
   - الصور: التعرّف على النص العربي بـ Tesseract
   ثم، عند الحاجة فقط وبموافقة صريحة: «قراءة أدق بالذكاء الاصطناعي» (Claude) للصور الرديئة وخط اليد
   - النص المستخرج يُحفظ مؤقتاً في هذه الجلسة فقط، ويمكن حفظه في مستندات القضية */
(function(){
'use strict';
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const READ_EXT=['pdf','png','jpg','jpeg','webp','gif','txt','docx'];
const AI_TYPES={pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif'};
const R={cache:{},cur:null,busy:false,err:'',playing:false,prog:'',stage:''};
const extOf=m=>String(m.ext||(String(m.name||m.file||'').split('?')[0].split('.').pop())||'').toLowerCase();
window.MQ_canRead=m=>!!m&&(m.type==='image'||m.type==='file')&&READ_EXT.includes(extOf(m.type==='image'&&!m.ext?{name:'x.jpg'}:m));
const findMsg=id=>{for(const [c,list] of Object.entries(typeof messages!=='undefined'?messages:{})){const m=(list||[]).find(x=>String(x.id)===String(id));if(m)return {c,m}}return null};
const b64=buf=>{let s='';const a=new Uint8Array(buf);for(let i=0;i<a.length;i+=0x8000)s+=String.fromCharCode.apply(null,a.subarray(i,i+0x8000));return btoa(s)};

function modal(){const x=R.cur;if(!x)return;const {m,c}=x,cl=(typeof C==='function'&&C(c))||{},t=R.cache[m.id];
 const ks=(typeof cases!=='undefined'?cases:[]).filter(k=>k.client===c);
 const body=R.busy?`<div class="rd-busy"><div class="src-busy" role="progressbar" aria-label="استخراج النص"><i></i></div><p class="m" id="rdStage">${e(R.stage||'جارٍ استخراج النص…')}</p></div>`
  :R.err&&!t?`<p class="note" style="color:var(--danger)">${e(R.err)}</p>${aiPanel(x)}`
  :t?`${t.unclear&&t.unclear.length?`<p class="note">مواضع غير واضحة في الأصل: ${e(t.unclear.join('، '))}</p>`:''}${t.kind==='no_text'||!t.text?'<p class="note">لم يُعثر على نص مقروء في هذا المرفق.</p>':`<div class="rd-text" dir="auto">${e(t.text)}</div>`}<p class="m">${t.text?t.text.length.toLocaleString('en-US')+' حرفاً':''}${t.via==='ai'?' · نُسخ بالذكاء الاصطناعي: راجع الأصل قبل الاعتماد عليه':t.via==='ocr'?' · تعرّف آلي مجاني على النص'+(t.conf!=null?' (ثقة '+Math.round(t.conf)+'٪)':'')+': راجع الأصل':t.via==='pdf'?' · نص مضمّن في ملف PDF':''}</p>${t.via==='ocr'&&(t.conf<65||t.text.length<20)?'<p class="note">القراءة المجانية ضعيفة لهذا المرفق (صورة غير واضحة أو خط يد). جرّب القراءة الأدق بالذكاء الاصطناعي.</p>':''}${t.via!=='ai'?aiPanel(x):''}`
  :'';
 const acts=t&&t.text?`<div class="toolbar rd-acts"><button class="btn pri" data-act="${R.playing?'rdStop':'rdPlay'}">${R.playing?'⏸ إيقاف القراءة':'🔊 استماع'}</button><span class="m" id="rdProg">${e(R.prog)}</span><button class="btn" data-act="rdCopy">نسخ النص</button>${ks.length&&can()?`<select class="field" id="rdCase" style="max-width:220px">${ks.map(k=>`<option value="${e(k.id)}">${e(k.no)} · ${e(k.subject||'')}</option>`).join('')}</select><button class="btn" data-act="rdSave">حفظ النص في مستندات القضية</button>`:''}</div>`:'';
 document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal rd-modal" role="dialog" aria-label="نص المرفق"><div class="head"><div><h1>${e(m.name||(m.type==='image'?'صورة':'مستند'))}</h1><p class="sub">من الموكل ${e(cl.name||'')} · ${e(String(m.at||'').replace('T',' ').slice(0,16))}</p></div><button class="btn sm" data-act="rdClose">إغلاق</button></div>${acts}${body}</div></div>`;
}
/* القراءة الأدق (مدفوعة): للصور وPDF فقط، وتحتاج موافقة صريحة */
function aiPanel(x){if(!AI_TYPES[x.ext]||!can())return '';
 if(!x.aiOpen)return '<div class="toolbar rd-ai"><button class="btn sm" data-act="rdAiOpen">قراءة أدق بالذكاء الاصطناعي (مدفوعة)</button></div>';
 return `<div class="rd-ai note"><p>تتم القراءة الأدق بإرسال المرفق إلى مزوّد الذكاء الاصطناعي (Claude)، وتُحسب كلفتها من استهلاك المكتب. قد يحتوي المرفق بيانات شخصية أو سرية للموكل.</p><label class="rl-ck"><input type="checkbox" id="rdConsent"> أؤكد أن لدي صلاحية معالجة هذا المستند لدى مزوّد خارجي.</label><div class="toolbar" style="margin-top:8px"><button class="btn pri" data-act="rdAi">قراءة أدق</button></div></div>`}
const can=()=>!!(window.MQ&&MQ.user&&['admin','lawyer'].includes(MQ.user.role)&&!MQ.readOnly);

/* ── المحركات المجانية (تُحمَّل عند أول استخدام من jsdelivr بإصدارات مثبّتة) ── */
const LIB={tess:'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js',tessWorker:'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',tessCore:'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1',
 pdf:'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs',pdfWorker:'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs'};
const stage=t=>{R.stage=t;const el=document.getElementById('rdStage');if(el)el.textContent=t};
const loadScript=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.async=true;s.onload=ok;s.onerror=()=>no(new Error('تعذّر تحميل محرك القراءة. تحقق من الاتصال بالإنترنت.'));document.head.appendChild(s)});
let tessW=null,pdfLib=null;
async function ocrWorker(){if(tessW)return tessW;
 if(!window.Tesseract){stage('جارٍ تحميل محرك القراءة العربية (مرة واحدة على هذا الجهاز)…');await loadScript(LIB.tess)}
 tessW=await Tesseract.createWorker('ara',1,{workerPath:LIB.tessWorker,corePath:LIB.tessCore,logger:l=>{if(l.status==='recognizing text')stage('جارٍ التعرّف على النص… '+Math.round((l.progress||0)*100)+'٪');else if(/load/.test(l.status||''))stage('جارٍ تجهيز اللغة العربية… '+Math.round((l.progress||0)*100)+'٪')}});
 return tessW}
async function ocr(src){const w=await ocrWorker(),r=await w.recognize(src);return {text:String(r.data.text||'').replace(/[ \t]+\n/g,'\n').trim(),conf:r.data.confidence}}
async function pdfjs(){if(pdfLib)return pdfLib;stage('جارٍ تحميل قارئ PDF…');pdfLib=await import(LIB.pdf);pdfLib.GlobalWorkerOptions.workerSrc=LIB.pdfWorker;return pdfLib}
/* ملفات PDF العربية كثيراً ما تخزّن الحروف منفصلة بترتيب العرض (من اليسار) وبأشكال العرض (ﻼ ﺘ…):
   نجمع العناصر في أسطر حسب الارتفاع، ونرتّبها من اليمين للسطور العربية، ونصل الحروف المتجاورة، ثم نوحّد الأشكال (NFKC) */
const AR=/[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
function pdfLines(items){
 const its=items.filter(it=>it.str&&it.str.trim()!==''||it.str===' ').map(it=>({s:it.str,x:it.transform[4],y:it.transform[5],w:it.width||0,h:Math.abs(it.transform[3])||it.height||10}));
 const lines=[];for(const it of its){const l=lines.find(l=>Math.abs(l.y-it.y)<=Math.max(2,it.h*0.35));if(l)l.items.push(it);else lines.push({y:it.y,items:[it]})}
 lines.sort((a,b)=>b.y-a.y);
 return lines.map(l=>{const rtl=l.items.some(it=>AR.test(it.s));const xs=l.items.sort((a,b)=>rtl?(b.x+b.w)-(a.x+a.w):a.x-b.x);let out='';
  for(let i=0;i<xs.length;i++){const it=xs[i];if(i){const p=xs[i-1],gap=rtl?p.x-(it.x+it.w):it.x-(p.x+p.w);if(gap>Math.min(p.h,it.h)*0.18&&!/\s$/.test(out))out+=' '}out+=it.s}
  return out.normalize('NFKC').replace(/[ \t]+/g,' ').trim()}).filter(Boolean).join('\n')}
/* نص مفكك (حروف منفردة بينها مسافات): نعامله كممسوح ونقرؤه بالتعرّف على الصور */
const garbled=t=>{const w=t.split(/\s+/).filter(Boolean);return w.length>8&&w.filter(x=>x.length===1).length/w.length>0.45};
async function readPdf(buf){
 const lib=await pdfjs(),doc=await lib.getDocument({data:new Uint8Array(buf)}).promise,n=Math.min(doc.numPages,30),pages=[];
 for(let i=1;i<=n;i++){stage('جارٍ قراءة الصفحة '+i+' من '+n+'…');const pg=await doc.getPage(i),tc=await pg.getTextContent();
  pages.push(pdfLines(tc.items))}
 const text=pages.join('\n\n').trim();
 if(text.replace(/\s/g,'').length>=Math.max(40,n*25)&&!garbled(text))return {text,via:'pdf'};
 /* ملف ممسوح ضوئياً: نرسم الصفحات ونتعرّف على نصها (حتى 10 صفحات) */
 const m=Math.min(doc.numPages,10),out=[];let conf=0;
 for(let i=1;i<=m;i++){stage('صفحات ممسوحة ضوئياً: تجهيز الصفحة '+i+' من '+m+'…');const pg=await doc.getPage(i),vp=pg.getViewport({scale:2}),cv=document.createElement('canvas');cv.width=vp.width;cv.height=vp.height;
  await pg.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise;const r=await ocr(cv);out.push(r.text);conf+=r.conf}
 return {text:out.join('\n\n').trim(),via:'ocr',conf:m?conf/m:0}}
async function extractFree(m,ext){
 const r=await fetch(m.file,{credentials:'same-origin'});if(!r.ok)throw new Error('تعذّر فتح الملف ('+r.status+').');
 if(ext==='txt')return {text:(await r.text()).trim(),via:'local'};
 if(ext==='docx'){if(!window.MQ_docxText)throw new Error('قارئ Word غير متاح.');return {text:String(await MQ_docxText(await r.arrayBuffer())||'').trim(),via:'local'}}
 if(ext==='pdf')return readPdf(await r.arrayBuffer());
 const res=await ocr(await r.blob());return {...res,via:'ocr'}}
A.rdOpen=async id=>{
 const f=findMsg(id);if(!f)return toast('المرفق غير موجود');
 const ext=f.m.type==='image'&&!f.m.ext?'jpg':extOf(f.m);
 R.cur={...f,ext,aiOpen:false};R.err='';R.prog='';R.playing=false;R.stage='';
 if(!R.cache[f.m.id]){R.busy=true;modal();try{R.cache[f.m.id]=await extractFree(f.m,ext)}catch(er){R.err=er.message||'تعذّرت القراءة'}R.busy=false}
 if(R.cur&&R.cur.m.id===f.m.id)modal();
};
A.rdAiOpen=()=>{if(R.cur){R.cur.aiOpen=true;modal()}};
A.rdAi=async()=>{const x=R.cur;if(!x)return;if(!document.getElementById('rdConsent')?.checked)return toast('أكّد الصلاحية أولاً');
 R.busy=true;R.err='';modal();
 try{const r=await fetch(x.m.file,{credentials:'same-origin'});if(!r.ok)throw new Error('تعذّر فتح الملف ('+r.status+').');
  const buf=await r.arrayBuffer();if(buf.byteLength>10*1024*1024)throw new Error('الملف أكبر من 10 ميغابايت.');
  const type=AI_TYPES[x.ext]||r.headers.get('content-type')||'image/jpeg';
  const res=await fetch('/api/admin/ai/transcribe',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({file:{type,data:b64(buf),name:x.m.name||''}})});
  const j=await res.json().catch(()=>({}));if(!res.ok)throw new Error(j.error||'تعذّرت القراءة');
  R.cache[x.m.id]={text:String(j.text||''),kind:j.kind,unclear:j.unclear||[],title:j.title||'',via:'ai'};x.aiOpen=false;R.err='';
 }catch(er){R.err=er.message}
 R.busy=false;modal()};
A.rdPlay=async()=>{const x=R.cur,t=x&&R.cache[x.m.id];if(!t||!t.text||!window.MQ_readAloud)return;
 const mode=await MQ_readMode({preferFree:true});
 if(mode==='cloud'&&!confirm('لا يوجد صوت عربي مجاني في هذا المتصفح، فسيُقرأ النص ('+t.text.length.toLocaleString('en-US')+' حرفاً) عبر ElevenLabs ويُحسب من رصيد حسابك. للقراءة المجانية افتح ميثاق في Edge أو على الهاتف. متابعة؟'))return;
 R.playing=true;R.prog='';modal();
 MQ_readAloud(t.text,{preferFree:true,onProgress:(i,n)=>{R.prog=n>1?'المقطع '+(i+1)+' من '+n:'';const el=document.getElementById('rdProg');if(el)el.textContent=R.prog},onEnd:()=>{R.playing=false;R.prog='';if(R.cur&&document.querySelector('.rd-modal'))modal()}})};
A.rdStop=()=>{if(window.MQ_readStop)MQ_readStop();R.playing=false;R.prog='';modal()};
A.rdClose=()=>A.close();
/* إغلاق النافذة بأي طريقة يوقف القراءة */
const close0=A.close;A.close=(...a)=>{if(R.cur){if(window.MQ_readStop)MQ_readStop();R.playing=false;R.cur=null}return close0(...a)};
A.rdCopy=async()=>{const t=R.cur&&R.cache[R.cur.m.id];if(!t)return;try{await navigator.clipboard.writeText(t.text);toast('نُسخ النص')}catch(x){toast('تعذّر النسخ')}};
A.rdSave=()=>{const x=R.cur,t=x&&R.cache[x.m.id],k=document.getElementById('rdCase')?.value;if(!t||!k||!can())return;
 docs.push({id:'d'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),k,title:'نص مرفق من الموكل: '+(t.title||x.m.name||'مستند'),kind:'نص مرفق',date:iso(TODAY),src:t.via==='ai'?'نسخ آلي من مرفق':'مرفق الموكل',pages:1,shared:false,text:t.text,sourceMsg:x.m.id});
 if(MQ.saveState)MQ.saveState();toast('حُفظ النص في مستندات القضية');drawNav()};
const css=document.createElement('style');css.textContent='.rd-modal{max-width:860px}.rd-text{white-space:pre-wrap;line-height:2;font-family:var(--f-doc,inherit);font-size:16px;background:var(--panel,#fff);border:1px solid var(--line);border-radius:12px;padding:16px;max-height:55vh;overflow:auto;margin:10px 0}.rd-acts{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0}.rd-busy{padding:10px 0}.bc-read{margin-top:6px;font:inherit;font-size:12.5px;border:1px solid var(--line);background:var(--panel,#fff);border-radius:999px;padding:4px 12px;cursor:pointer;color:var(--ink)}.bc-read:hover{border-color:var(--brass)}.rd-ai{margin-top:8px}';document.head.appendChild(css);
})();
