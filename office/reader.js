/* ── قراءة مرفقات الموكل ──
   زر «قراءة النص» بجوار الصور والمستندات في مراسلات الموكل: يستخرج النص ويعرضه، ويقرؤه صوتياً للمحامي.
   - TXT وWord: يُقرأ النص في المتصفح نفسه دون إرسال شيء للخارج
   - الصور وPDF: يُنسخ النص بالذكاء الاصطناعي (Claude) بعد موافقة صريحة، لأن الملف يُرسل إلى المزوّد
   - النص المستخرج يُحفظ مؤقتاً في هذه الجلسة فقط، ويمكن حفظه في مستندات القضية */
(function(){
'use strict';
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const READ_EXT=['pdf','png','jpg','jpeg','webp','gif','txt','docx'];
const AI_TYPES={pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif'};
const R={cache:{},cur:null,busy:false,err:'',playing:false,prog:''};
const extOf=m=>String(m.ext||(String(m.name||m.file||'').split('?')[0].split('.').pop())||'').toLowerCase();
window.MQ_canRead=m=>!!m&&(m.type==='image'||m.type==='file')&&READ_EXT.includes(extOf(m.type==='image'&&!m.ext?{name:'x.jpg'}:m));
const findMsg=id=>{for(const [c,list] of Object.entries(typeof messages!=='undefined'?messages:{})){const m=(list||[]).find(x=>String(x.id)===String(id));if(m)return {c,m}}return null};
const b64=buf=>{let s='';const a=new Uint8Array(buf);for(let i=0;i<a.length;i+=0x8000)s+=String.fromCharCode.apply(null,a.subarray(i,i+0x8000));return btoa(s)};

function modal(){const x=R.cur;if(!x)return;const {m,c}=x,cl=(typeof C==='function'&&C(c))||{},t=R.cache[m.id];
 const ks=(typeof cases!=='undefined'?cases:[]).filter(k=>k.client===c);
 const body=R.busy?'<div class="rd-busy"><div class="src-busy" role="progressbar" aria-label="استخراج النص"><i></i></div><p class="m">جارٍ استخراج النص…</p></div>'
  :R.err?`<p class="note" style="color:var(--danger)">${e(R.err)}</p>`
  :t?`${t.unclear&&t.unclear.length?`<p class="note">مواضع غير واضحة في الأصل: ${e(t.unclear.join('، '))}</p>`:''}${t.kind==='no_text'||!t.text?'<p class="note">لم يُعثر على نص مقروء في هذا المرفق.</p>':`<div class="rd-text" dir="auto">${e(t.text)}</div>`}<p class="m">${t.text?t.text.length.toLocaleString('en-US')+' حرفاً':''}${t.via==='ai'?' · نُسخ بالذكاء الاصطناعي: راجع الأصل قبل الاعتماد عليه':''}</p>`
  :x.needConsent?`<p>هذا المرفق ${x.ext==='pdf'?'ملف PDF':'صورة'}، وقراءة نصه تتم بإرساله إلى مزوّد الذكاء الاصطناعي (Claude) ليُنسخ نصه. قد يحتوي بيانات شخصية أو سرية للموكل.</p><label class="rl-ck"><input type="checkbox" id="rdConsent"> أؤكد أن لدي صلاحية معالجة هذا المستند لدى مزوّد خارجي.</label><div class="toolbar" style="margin-top:10px"><button class="btn pri" data-act="rdAi">استخراج النص</button></div>`:'';
 const acts=t&&t.text?`<div class="toolbar rd-acts"><button class="btn pri" data-act="${R.playing?'rdStop':'rdPlay'}">${R.playing?'⏸ إيقاف القراءة':'🔊 استماع'}</button><span class="m" id="rdProg">${e(R.prog)}</span><button class="btn" data-act="rdCopy">نسخ النص</button>${ks.length&&can()?`<select class="field" id="rdCase" style="max-width:220px">${ks.map(k=>`<option value="${e(k.id)}">${e(k.no)} · ${e(k.subject||'')}</option>`).join('')}</select><button class="btn" data-act="rdSave">حفظ النص في مستندات القضية</button>`:''}</div>`:'';
 document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal rd-modal" role="dialog" aria-label="نص المرفق"><div class="head"><div><h1>${e(m.name||(m.type==='image'?'صورة':'مستند'))}</h1><p class="sub">من الموكل ${e(cl.name||'')} · ${e(String(m.at||'').replace('T',' ').slice(0,16))}</p></div><button class="btn sm" data-act="rdClose">إغلاق</button></div>${acts}${body}</div></div>`;
}
const can=()=>!!(window.MQ&&MQ.user&&['admin','lawyer'].includes(MQ.user.role)&&!MQ.readOnly);

async function extractLocal(m,ext){
 const r=await fetch(m.file,{credentials:'same-origin'});if(!r.ok)throw new Error('تعذّر فتح الملف ('+r.status+').');
 if(ext==='txt')return {text:(await r.text()).trim(),via:'local'};
 if(!window.MQ_docxText)throw new Error('قارئ Word غير متاح.');
 return {text:String(await MQ_docxText(await r.arrayBuffer())||'').trim(),via:'local'};
}
A.rdOpen=async id=>{
 const f=findMsg(id);if(!f)return toast('المرفق غير موجود');
 const ext=f.m.type==='image'&&!f.m.ext?'jpg':extOf(f.m);
 R.cur={...f,ext,needConsent:!R.cache[f.m.id]&&!!AI_TYPES[ext]};R.err='';R.prog='';R.playing=false;
 if(!R.cache[f.m.id]&&!AI_TYPES[ext]){R.busy=true;modal();try{R.cache[f.m.id]=await extractLocal(f.m,ext)}catch(er){R.err=er.message}R.busy=false}
 modal();
};
A.rdAi=async()=>{const x=R.cur;if(!x)return;if(!document.getElementById('rdConsent')?.checked)return toast('أكّد الصلاحية أولاً');
 R.busy=true;R.err='';modal();
 try{const r=await fetch(x.m.file,{credentials:'same-origin'});if(!r.ok)throw new Error('تعذّر فتح الملف ('+r.status+').');
  const buf=await r.arrayBuffer();if(buf.byteLength>10*1024*1024)throw new Error('الملف أكبر من 10 ميغابايت.');
  const type=AI_TYPES[x.ext]||r.headers.get('content-type')||'image/jpeg';
  const res=await fetch('/api/admin/ai/transcribe',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({file:{type,data:b64(buf),name:x.m.name||''}})});
  const j=await res.json().catch(()=>({}));if(!res.ok)throw new Error(j.error||'تعذّرت القراءة');
  R.cache[x.m.id]={text:String(j.text||''),kind:j.kind,unclear:j.unclear||[],title:j.title||'',via:'ai'};x.needConsent=false;
 }catch(er){R.err=er.message}
 R.busy=false;modal()};
A.rdPlay=async()=>{const x=R.cur,t=x&&R.cache[x.m.id];if(!t||!t.text||!window.MQ_readAloud)return;
 const mode=await MQ_readMode();
 if(mode==='cloud'&&t.text.length>1500&&!confirm('ستُقرأ '+t.text.length.toLocaleString('en-US')+' حرفاً عبر ElevenLabs، وتُحسب من رصيد حسابك هناك. متابعة؟'))return;
 R.playing=true;R.prog='';modal();
 MQ_readAloud(t.text,{onProgress:(i,n)=>{R.prog=n>1?'المقطع '+(i+1)+' من '+n:'';const el=document.getElementById('rdProg');if(el)el.textContent=R.prog},onEnd:()=>{R.playing=false;R.prog='';if(R.cur&&document.querySelector('.rd-modal'))modal()}})};
A.rdStop=()=>{if(window.MQ_readStop)MQ_readStop();R.playing=false;R.prog='';modal()};
A.rdClose=()=>A.close();
/* إغلاق النافذة بأي طريقة يوقف القراءة */
const close0=A.close;A.close=(...a)=>{if(R.cur){if(window.MQ_readStop)MQ_readStop();R.playing=false;R.cur=null}return close0(...a)};
A.rdCopy=async()=>{const t=R.cur&&R.cache[R.cur.m.id];if(!t)return;try{await navigator.clipboard.writeText(t.text);toast('نُسخ النص')}catch(x){toast('تعذّر النسخ')}};
A.rdSave=()=>{const x=R.cur,t=x&&R.cache[x.m.id],k=document.getElementById('rdCase')?.value;if(!t||!k||!can())return;
 docs.push({id:'d'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),k,title:'نص مرفق من الموكل: '+(t.title||x.m.name||'مستند'),kind:'نص مرفق',date:iso(TODAY),src:t.via==='ai'?'نسخ آلي من مرفق':'مرفق الموكل',pages:1,shared:false,text:t.text,sourceMsg:x.m.id});
 if(MQ.saveState)MQ.saveState();toast('حُفظ النص في مستندات القضية');drawNav()};
const css=document.createElement('style');css.textContent='.rd-modal{max-width:860px}.rd-text{white-space:pre-wrap;line-height:2;font-family:var(--f-doc,inherit);font-size:16px;background:var(--panel,#fff);border:1px solid var(--line);border-radius:12px;padding:16px;max-height:55vh;overflow:auto;margin:10px 0}.rd-acts{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0}.rd-busy{padding:10px 0}.bc-read{margin-top:6px;font:inherit;font-size:12.5px;border:1px solid var(--line);background:var(--panel,#fff);border-radius:999px;padding:4px 12px;cursor:pointer;color:var(--ink)}.bc-read:hover{border-color:var(--brass)}';document.head.appendChild(css);
})();
