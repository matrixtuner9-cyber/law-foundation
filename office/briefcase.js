/* ── حقيبة الموكل ── ملف الموكل الكامل في شاشة الإدارة:
   المراسلات (نص، صوت، صور، مستندات) والمرفقات والقضايا والأتعاب */
(function(){
const I={ // أيقونات خطية
 play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',
 pause:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>',
 mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>',
 clip:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11.5l-7.8 7.8a5 5 0 0 1-7.1-7.1l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8"/></svg>',
 send:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5L3 11l7 2.5 2.5 7z" fill="currentColor"/></svg>',
 x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
 check:'<svg viewBox="0 0 16 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M1 5.5l3 3L10 1"/></svg>',
 check2:'<svg viewBox="0 0 20 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M1 5.5l3 3L10 1M8.5 8.5L15 1"/></svg>',
 bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0"/></svg>',
 bag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18M10.5 12.5v2h3v-2"/></svg>'
};
const FT={pdf:['PDF','pdf'],doc:['Word','doc'],docx:['Word','doc'],xls:['Excel','xls'],xlsx:['Excel','xls'],txt:['نص','txt'],rtf:['نص','txt'],odt:['نص','doc']};
const size=n=>!n?'':n<1024*1024?Math.max(1,Math.round(n/1024))+' ك.ب':(n/1048576).toFixed(1)+' م.ب';
const hash=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))|0;return Math.abs(h)};
const bars=(id,n=32)=>{let h=hash(id);return [...Array(n)].map((_,i)=>{h=(h*1103515245+12345)&0x7fffffff;const env=Math.sin(Math.PI*(i+.5)/n)*.55+.45;return Math.round((22+((h>>8)%78))*env)})};
const dayLabel=d=>{const n=diff(d);return n===0?'اليوم':n===-1?'أمس':fmt(d)};
const unreadOf=c=>(messages[c]||[]).filter(m=>m.unread).length;
const media=c=>(messages[c]||[]).filter(m=>m.type==='image'||m.type==='file');

/* حالة الإشعارات على أجهزة الموكل */
function pushLabel(c){const n=(window.MQ&&MQ.push||{})[c]||0;return `<span class="bag-push ${n?'on':''}">${I.bell}${n?(n===1?'الإشعارات مفعّلة على جهاز واحد':'الإشعارات مفعّلة على '+n+' أجهزة'):'لم يفعّل الإشعارات بعد'}</span>`}
window.MQ_pushLabel=pushLabel;

/* فقاعة الرسالة */
function bubble(m){
 const me=m.f==='me',tick=me?`<span class="bc-tick ${m.seen?'seen':''}" title="${m.seen?'اطّلع عليها الموكل':'أُرسلت'}">${m.seen?I.check2:I.check}</span>`:'';
 const meta=`<span class="bc-meta">${esc(m.ch||'')}${m.ch?' · ':''}${m.at.slice(11)}${tick}</span>`;
 let inner='';
 if(m.type==='voice'){const b=bars(m.id);inner=`<div class="vp" data-src="${m.file}" data-id="${m.id}" data-dur="${m.dur||0}"><button class="vp-btn" data-act="vplay" data-v="${m.id}" aria-label="تشغيل الرسالة الصوتية">${I.play}</button><div class="vp-wave" data-act="vseek" data-v="${m.id}">${b.map(x=>`<i style="height:${x}%"></i>`).join('')}</div><span class="vp-t mono">${MQ.dur(m.dur)}</span></div>`}
 else if(m.type==='image'){inner=`<button class="bc-img" data-act="lightbox" data-v="${m.file}"><img src="${m.file}" alt="${esc(m.name||'صورة')}" loading="lazy"></button>${m.t?`<div class="bc-txt">${esc(m.t)}</div>`:''}${window.MQ_canRead&&MQ_canRead(m)?`<button class="bc-read" data-act="rdOpen" data-v="${esc(m.id)}">📖 قراءة النص</button>`:''}`}
 else if(m.type==='file'){const [lb,cls]=FT[m.ext]||[String(m.ext||'ملف').toUpperCase(),'txt'];inner=`<div class="fcard"><span class="ficon ${cls}">${lb}</span><span class="fmeta"><b>${esc(m.name||'مستند')}</b><small>${size(m.size)}</small></span></div><div class="fact"><a class="btn sm" href="${m.file}" target="_blank" rel="noopener">فتح</a>${!me?`<button class="btn sm" data-act="toCase" data-v="${m.id}">إضافة إلى مستندات القضية</button>`:''}</div>${m.t?`<div class="bc-txt">${esc(m.t)}</div>`:''}${window.MQ_canRead&&MQ_canRead(m)?`<button class="bc-read" data-act="rdOpen" data-v="${esc(m.id)}">📖 قراءة النص</button>`:''}`}
 else if(m.type==='notice')inner=`<div class="bc-notice">${I.bell}<span>إشعار رسمي للموكل</span></div><div class="bc-txt">${esc(m.t)}</div>`;
 else inner=`<div class="bc-txt">${esc(m.t)}</div>`;
 return `<div class="bc ${me?'me':'them'} t-${m.type||'text'} ${m.unread?'new':''}" id="m_${m.id}">${inner}${caseTag(m)}${meta}</div>`;
}
/* وسم القضية: كل رسالة/مرفق ينتمي لقضية محددة حين يكون للموكل أكثر من قضية */
function caseTag(m){if(m.type==='notice')return '';const ks=cases.filter(k=>k.client===S.clientId);if(ks.length<2)return '';
 const k=m.k&&ks.find(x=>x.id===m.k);
 return k?`<span class="bc-case"><button class="link" data-act="openCase" data-v="${k.id}">⚖ <span class="mono">${esc(k.no)}</span></button><button class="link sub" data-act="msgCase" data-v="${esc(m.id)}" title="تغيير القضية">تغيير</button></span>`
  :`<span class="bc-case none"><button class="link" data-act="msgCase" data-v="${esc(m.id)}">⚖ ربط بقضية</button></span>`;
}
function thread(c){
 const ms=messages[c]||[];let last='';
 if(!ms.length)return `<div class="th-empty">${I.bag}<b>لا مراسلات بعد</b><span>ستظهر هنا رسائل الموكل النصية والصوتية والصور والمستندات التي يرسلها من البوابة.</span></div>`;
 return ms.map(m=>{const d=m.at.slice(0,10);const sep=d!==last?`<div class="th-day"><span>${dayLabel(d)}</span></div>`:'';last=d;return sep+bubble(m)}).join('');
}

/* الحقيبة */
V.client=()=>{
 const c=C(S.clientId),ks=cases.filter(k=>k.client===c.id),u=unreadOf(c.id),md=media(c.id),tab=S.bagTab||'msgs';
 const voiceN=(messages[c.id]||[]).filter(m=>m.type==='voice').length;
 const lastSeen=c.last?(diff(c.last)===0?'نشط اليوم':'آخر دخول '+dmy(c.last)):'لم يدخل البوابة بعد';
 const tabs=[['msgs','المراسلات',u],['media','المرفقات',md.length],['cases','القضايا',ks.length],['acct','الأتعاب والبيانات','']];
 return `<div><button class="link" data-act="nav" data-v="clients">→ كل الموكلين</button></div>
 <section class="bag-head">
  <div class="bag-id"><div class="bag-av">${esc(c.name.trim()[0])}</div><div><div class="bag-k">${I.bag}<span>حقيبة الموكل</span></div><h1>${esc(c.name)}</h1>
   <p>${c.type} · ${esc(c.city)} · رمز البوابة <span class="mono">${c.code}</span> · <span class="${c.portal?'on':'off'} bag-st"><i></i>${c.portal?lastSeen:'البوابة غير مفعّلة'}</span> · <span id="bagPush">${pushLabel(c.id)}</span></p></div></div>
  <div class="bag-stats">
   <button data-act="bagTab" data-v="msgs"><b class="num">${u}</b><span>رسائل غير مقروءة</span></button>
   <button data-act="bagTab" data-v="msgs"><b class="num">${voiceN}</b><span>رسائل صوتية</span></button>
   <button data-act="bagTab" data-v="media"><b class="num">${md.length}</b><span>مرفقات</span></button>
   <button data-act="bagTab" data-v="acct"><b class="num">${(c.fee-c.paid).toLocaleString('en-US')}</b><span>متبقٍ من الأتعاب ₪</span></button>
  </div>
 </section>
 <div class="tabs">${tabs.map(t=>`<button class="${tab===t[0]?'on':''}" data-act="bagTab" data-v="${t[0]}">${t[1]}${t[2]?` <span class="tcount ${t[0]==='msgs'&&u?'hot':''}">${t[2]}</span>`:''}</button>`).join('')}</div>
 <div id="bagBody">${bagBody(c,ks,tab)}</div>`;
};
function bagBody(c,ks,tab){
 if(tab==='msgs')return `<section class="panel chat wa-skin"><div class="th" id="th">${thread(c.id)}</div>
  <div class="rec" id="rec" hidden><span class="rec-dot"></span><span class="mono" id="recT">0:00</span><span class="rec-l">جارٍ التسجيل…</span><canvas id="recWave" width="240" height="28" aria-hidden="true"></canvas><button class="ib" data-act="recCancel" title="إلغاء">${I.x}</button><button class="ib pri" data-act="recStop" title="إرسال التسجيل">${I.send}</button></div>
  <form class="composer" id="fBag"><label class="ib" title="إرفاق صورة أو مستند">${I.clip}<input type="file" id="bagFile" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" hidden></label>
   <button type="button" class="ib ${S.bagNotice?'on':''}" id="noticeBtn" data-act="noticeTgl" title="إرسال كإشعار رسمي" aria-pressed="${!!S.bagNotice}">${I.bell}</button>
   <textarea id="bagT" rows="1" placeholder="${S.bagNotice?'اكتب نص الإشعار الرسمي…':'اكتب رداً على '+esc(c.name.split(' ')[0])+'…'}" aria-label="نص الرسالة"></textarea>
   <button type="button" class="ib" data-act="recStart" title="تسجيل رسالة صوتية">${I.mic}</button><button class="ib pri" title="إرسال">${I.send}</button></form>
  <p class="chat-note">يصل ردّك إلى تطبيق الموكل فوراً مع تنبيه صوتي، حتى لو كان التطبيق مغلقاً (إن فعّل الإشعارات). زر الجرس يرسل النص كإشعار رسمي. ${MQ.online?'':'(الخادم غير متصل: افتح النظام عبر start.bat)'}</p></section>`;
 if(tab==='media'){const md=media(c.id).slice().reverse();
  return md.length?`<div class="mgrid">${md.map(m=>m.type==='image'?`<figure class="mitem"><button class="bc-img" data-act="lightbox" data-v="${m.file}"><img src="${m.file}" alt="${esc(m.name||'صورة')}" loading="lazy"></button><figcaption><b>${esc(m.name||'صورة')}</b><small>${m.f==='them'?'من الموكل':'من المكتب'} · ${dmy(m.at.slice(0,10))}</small></figcaption></figure>`
   :`<figure class="mitem file"><span class="ficon big ${(FT[m.ext]||['','txt'])[1]}">${(FT[m.ext]||[String(m.ext||'').toUpperCase()])[0]}</span><figcaption><b>${esc(m.name)}</b><small>${size(m.size)} · ${m.f==='them'?'من الموكل':'من المكتب'} · ${dmy(m.at.slice(0,10))}</small><span class="fact"><a class="btn sm" href="${m.file}" target="_blank" rel="noopener">فتح</a>${m.f==='them'?`<button class="btn sm" data-act="toCase" data-v="${m.id}">إلى مستندات القضية</button>`:''}</span></figcaption></figure>`).join('')}</div>`
   :`<section class="panel"><div class="th-empty">${I.clip}<b>لا مرفقات بعد</b><span>الصور التي يلتقطها الموكل بالكاميرا أو يختارها من المعرض، والمستندات التي يرفعها من جهازه، تُجمع هنا.</span></div></section>`}
 if(tab==='cases')return `<section class="panel"><div class="list">${ks.map(k=>{const h=nextH(k.id);return `<div class="row clk" data-act="openCase" data-v="${k.id}" style="grid-template-columns:minmax(0,1fr) auto"><div><div class="t">${esc(k.subject)}</div><div class="m"><span class="mono">${k.no}</span> · ${esc(CT(k.court).name)} · ضد ${esc(oppNames(k))} · ${esc(k.stage)}</div></div><div>${h?`<span class="pill acc">${rel(h.date)}</span>`:`<span class="pill ${statusPill(k.status)}">${esc(k.status)}</span>`}</div></div>`}).join('')||'<div class="empty">لا قضايا.</div>'}</div></section>`;
 return `<div class="grid2"><section class="panel"><header><h2>البيانات</h2></header><div class="bd"><dl class="kv"><dt>رقم الهوية/التسجيل</dt><dd class="mono">${esc(c.idNo)}</dd><dt>الهاتف</dt><dd class="mono">${esc(c.phone)}</dd>${c.phone2?`<dt>هاتف إضافي</dt><dd class="mono">${esc(c.phone2)}</dd>`:''}<dt>واتساب</dt><dd>${c.whatsapp?`<a class="link mono" href="https://wa.me/${String(c.whatsapp).replace(/\D/g,'').replace(/^0/,'970')}" target="_blank" rel="noopener">${esc(c.whatsapp)}</a>`:'<span class="m">لم يُضف بعد</span>'}</dd><dt>القناة المفضلة</dt><dd>${esc(c.ch)}</dd><dt>رمز دخول البوابة</dt><dd class="mono">${c.code}</dd><dt>موكل منذ</dt><dd>${dmy(c.since)}</dd><dt>آخر دخول</dt><dd>${c.last?fmt(c.last):'لم يدخل بعد'}</dd></dl></div></section>
 <div class="stack"><section class="panel"><header><h2>الأتعاب</h2></header><div class="bd" style="display:flex;flex-direction:column;gap:8px"><dl class="kv"><dt>المتفق عليه</dt><dd class="num">${money(c.fee)}</dd><dt>المدفوع</dt><dd class="num">${money(c.paid)}</dd><dt>المتبقي</dt><dd class="num" style="font-weight:600;color:${c.fee>c.paid?'var(--warn)':'var(--ok)'}">${money(c.fee-c.paid)}</dd></dl><div class="bar"><span style="width:${Math.round(c.paid/c.fee*100)}%"></span></div><form class="form" id="fPay" style="grid-template-columns:1fr auto"><input class="field" type="number" id="payAmt" min="1" placeholder="تسجيل دفعة بالشيكل"><button class="btn sm">تسجيل</button></form></div></section>
 <section class="panel"><header><h2>بوابة الموكل</h2><button class="sw ${c.portal?'on':''}" data-act="togglePortal" data-v="${c.id}" aria-label="تفعيل البوابة" aria-pressed="${c.portal}"></button></header><div class="bd note" style="border:0">${c.portal?'يدخل الموكل إلى تطبيق البوابة برمز <span class="mono">'+c.code+'</span> فيرى قضاياه وجلساته ومستنداته ويراسل المكتب نصاً وصوتاً ويرفع الوثائق.':'البوابة مغلقة. عند التفعيل يُرسل رمز الدخول عبر '+esc(c.ch)+'.'}</div></section></div></div>`;
}

/* بعد العرض: تمرير المحادثة للأسفل وتعليم الرسائل كمقروءة */
function afterBag(){
 if(!((S.view==='client'&&(S.bagTab||'msgs')==='msgs')||(S.view==='chats'&&S.chatOpen&&S.clientId)))return;
 const th=document.getElementById('th');if(th)th.scrollTop=th.scrollHeight;
 if(unreadOf(S.clientId)&&window.MQ&&MQ.read)setTimeout(()=>MQ.read(S.clientId),1200);
 const t=document.getElementById('bagT');if(t){t.oninput=()=>{t.style.height='auto';t.style.height=Math.min(140,t.scrollHeight)+'px'};t.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();t.form.requestSubmit()}}}
 const f=document.getElementById('bagFile');if(f)f.onchange=e=>{const file=e.target.files[0];if(file)upFile(file);e.target.value=''};
}
const r0=render;render=function(){r0();afterBag()};
window.MQ_bag={thread,bubble,bagBody:(c,tab)=>bagBody(c,cases.filter(k=>k.client===c.id),tab||'msgs'),refreshThread,unreadOf:id=>unreadOf(id),I};
function refreshThread(){const th=document.getElementById('th');if(!th)return render();const atEnd=th.scrollHeight-th.scrollTop-th.clientHeight<80;th.innerHTML=thread(S.clientId);if(atEnd)th.scrollTop=th.scrollHeight}
window.MQ_onMsg=m=>{
 if(S.view==='chats'&&window.MQ_chatMsg)return MQ_chatMsg(m);
 if(S.view==='client'&&S.clientId===m.client){if((S.bagTab||'msgs')==='msgs'){refreshThread();if(m.from==='client'&&MQ.read)setTimeout(()=>MQ.read(m.client),1200)}else render()}
 else if((S.view==='portal'&&S.pc===m.client)||(S.view==='case'&&S.caseTab==='msgs'&&K(S.caseId).client===m.client))render();
};

/* رفع ملف من المحامي */
function upFile(file){if(!MQ.online)return toast('شغّل النظام عبر start.bat لإرسال الملفات');
 toast('جارٍ رفع «'+file.name+'»…');MQ.upload('file',S.clientId,file,{name:file.name}).then(()=>{refreshThread();toast('أُرسل الملف إلى الموكل')}).catch(e=>toast(e.message))}

/* تشغيل الرسائل الصوتية */
const audio=new Audio();let playing=null;
function setPlay(id,on){const el=document.querySelector(`.vp[data-id="${id}"]`);if(!el)return;el.classList.toggle('on',on);el.querySelector('.vp-btn').innerHTML=on?I.pause:I.play}
audio.ontimeupdate=()=>{if(!playing)return;const el=document.querySelector(`.vp[data-id="${playing}"]`);if(!el)return;const d=isFinite(audio.duration)?audio.duration:+el.dataset.dur||1,p=Math.min(1,audio.currentTime/d);
 const bs=el.querySelectorAll('.vp-wave i'),n=Math.round(p*bs.length);bs.forEach((b,i)=>b.classList.toggle('pl',i<n));el.querySelector('.vp-t').textContent=MQ.dur(audio.currentTime)};
audio.onended=()=>{const id=playing;playing=null;setPlay(id,false);const el=document.querySelector(`.vp[data-id="${id}"]`);if(el){el.querySelectorAll('.vp-wave i').forEach(b=>b.classList.remove('pl'));el.querySelector('.vp-t').textContent=MQ.dur(+el.dataset.dur)}};
A.vplay=v=>{const el=document.querySelector(`.vp[data-id="${v}"]`);if(!el)return;
 if(playing===v){if(audio.paused){audio.play();setPlay(v,true)}else{audio.pause();setPlay(v,false)}return}
 if(playing){const p=playing;audio.pause();audio.onended();setPlay(p,false)}
 playing=v;audio.src=el.dataset.src;audio.play().then(()=>setPlay(v,true)).catch(()=>{toast('تعذّر تشغيل التسجيل');playing=null})};
A.vseek=(v,t,e)=>{if(playing!==v)return A.vplay(v);const r=t.getBoundingClientRect();let p=(r.right-e.clientX)/r.width;p=Math.max(0,Math.min(1,p));if(isFinite(audio.duration))audio.currentTime=p*audio.duration};

/* تسجيل رسالة صوتية من المحامي */
let rec=null,recChunks=[],recT0=0,recTimer=null,recStream=null,recCancel=false,an=null,raf=0;
A.recStart=async()=>{
 if(!MQ.online)return toast('شغّل النظام عبر start.bat لإرسال الرسائل الصوتية');
 if(!navigator.mediaDevices||!window.MediaRecorder)return toast('المتصفح لا يدعم التسجيل الصوتي');
 try{recStream=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){return toast('لم يُسمح باستخدام الميكروفون')}
 const type=['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/mp4'].find(t=>MediaRecorder.isTypeSupported(t))||'';
 rec=new MediaRecorder(recStream,type?{mimeType:type}:{});recChunks=[];recCancel=false;
 rec.ondataavailable=e=>e.data.size&&recChunks.push(e.data);
 rec.onstop=()=>{recStream.getTracks().forEach(t=>t.stop());cancelAnimationFrame(raf);clearInterval(recTimer);const re=document.getElementById('rec'),fb=document.getElementById('fBag');if(re)re.hidden=true;if(fb)fb.hidden=false;
  if(recCancel)return;const dur=(performance.now()-recT0)/1000;if(dur<1)return toast('التسجيل قصير جداً');
  const blob=new Blob(recChunks,{type:(rec.mimeType||'audio/webm').split(';')[0]});
  MQ.upload('voice',S.clientId,blob,{dur:dur.toFixed(1)}).then(()=>{refreshThread();toast('أُرسلت الرسالة الصوتية')}).catch(e=>toast(e.message))};
 rec.start();recT0=performance.now();
 document.getElementById('rec').hidden=false;document.getElementById('fBag').hidden=true;
 recTimer=setInterval(()=>{const el=document.getElementById('recT');if(el)el.textContent=MQ.dur((performance.now()-recT0)/1000)},250);
 try{const ac=new AudioContext(),src=ac.createMediaStreamSource(recStream);an=ac.createAnalyser();an.fftSize=256;src.connect(an);const buf=new Uint8Array(an.frequencyBinCount),cv=document.getElementById('recWave'),g=cv.getContext('2d'),col=getComputedStyle(document.documentElement).getPropertyValue('--danger');
  (function draw(){raf=requestAnimationFrame(draw);an.getByteFrequencyData(buf);g.clearRect(0,0,cv.width,cv.height);g.fillStyle=col;for(let i=0;i<40;i++){const v=buf[i*2]/255,h=Math.max(2,v*cv.height);g.fillRect(cv.width-(i*6+4),(cv.height-h)/2,3,h)}})()}catch(e){}
};
A.recStop=()=>{if(rec&&rec.state!=='inactive')rec.stop()};
A.recCancel=()=>{recCancel=true;A.recStop()};

/* أدوات أخرى */
A.noticeTgl=()=>{S.bagNotice=!S.bagNotice;const b=document.getElementById('noticeBtn'),t=document.getElementById('bagT'),c=C(S.clientId);if(b){b.classList.toggle('on',S.bagNotice);b.setAttribute('aria-pressed',S.bagNotice)}if(t){t.placeholder=S.bagNotice?'اكتب نص الإشعار الرسمي…':'اكتب رداً على '+c.name.split(' ')[0]+'…';t.focus()}};
A.bag=v=>{S.view='client';S.clientId=v;S.bagTab='msgs';window.scrollTo(0,0);render()};
A.openClient=v=>{S.view='client';S.clientId=v;S.bagTab=unreadOf(v)?'msgs':(S.bagTab||'msgs');window.scrollTo(0,0);render()};
A.bagTab=v=>{S.bagTab=v;render()};
A.msgCase=id=>{const m=(messages[S.clientId]||[]).find(x=>x.id===id);if(!m)return;const ks=cases.filter(k=>k.client===S.clientId);
 document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog"><h2>إلى أي قضية تنتمي هذه ${m.type==='voice'?'الرسالة الصوتية':m.type==='text'?'الرسالة':'الوثيقة'}؟</h2>${ks.map(k=>`<button class="btn ${m.k===k.id?'pri':''}" data-act="msgCaseK" data-v="${k.id}|${id}" style="justify-content:flex-start"><span class="mono">${esc(k.no)}</span> · ${esc(k.subject)}</button>`).join('')}${m.k?`<button class="btn sm" data-act="msgCaseK" data-v="|${id}">إزالة الربط</button>`:''}<button class="btn sm" data-act="close">إلغاء</button></div></div>`};
A.msgCaseK=v=>{const [k,id]=v.split('|'),m=(messages[S.clientId]||[]).find(x=>x.id===id);if(!m)return;
 const done=()=>{m.k=k;A.close();render();toast(k?'رُبطت بالقضية '+((cases.find(x=>x.id===k)||{}).no||''):'أُزيل الربط')};
 if(window.MQ&&MQ.msgCase)MQ.msgCase(id,k).then(done).catch(e=>toast(e.message));else done()};
const pf=A.portalFor;A.portalFor=v=>{pf(v);if(window.MQ&&MQ.read)MQ.read(v)};
A.lightbox=src=>{document.getElementById('modal').innerHTML=`<div class="modal-bg lb" data-act="close"><img src="${src}" alt=""><button class="ib lbx" data-act="close" aria-label="إغلاق">${I.x}</button><a class="btn sm lbo" href="${src}" target="_blank" rel="noopener">فتح بالحجم الكامل</a></div>`};
A.toCase=id=>{const m=(messages[S.clientId]||[]).find(x=>x.id===id);if(!m)return;const ks=cases.filter(k=>k.client===S.clientId);if(!ks.length)return toast('لا قضايا لهذا الموكل');
 const add=kid=>{docs.push({id:'d'+Date.now(),k:kid,title:m.name||'مرفق من الموكل',kind:m.type==='image'?'صورة':'مستند من الموكل',date:iso(TODAY),src:'من الموكل',pages:1,shared:true,file:m.file});A.close();toast('أُضيف إلى مستندات القضية '+K(kid).no);render()};
 if(ks.length===1)return add(ks[0].id);
 document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog"><h2>إلى أي قضية يُضاف «${esc(m.name||'المرفق')}»؟</h2>${ks.map(k=>`<button class="btn" data-act="toCaseK" data-v="${k.id}|${id}" style="justify-content:flex-start"><span class="mono">${k.no}</span> · ${esc(k.subject)}</button>`).join('')}<button class="btn sm" data-act="close">إلغاء</button></div></div>`;
 A.toCaseK=v=>add(v.split('|')[0])};
document.addEventListener('submit',e=>{if(e.target.id!=='fBag')return;e.preventDefault();e.stopImmediatePropagation();
 const t=document.getElementById('bagT'),txt=t.value.trim();if(!txt)return;
 if(!MQ.online)return toast('شغّل النظام عبر start.bat لإرسال الرسائل');
 t.value='';t.style.height='auto';MQ.send(S.clientId,txt,'البوابة',S.bagNotice?'notice':'text').then(()=>refreshThread()).catch(er=>{toast(er.message);t.value=txt})},true);

/* بطاقات الموكلين: شارة الرسائل الجديدة */
const vc=V.clients;V.clients=()=>vc().replace(/data-act="openClient" data-v="(c[^"]+)"><div style="display:flex;justify-content:space-between;gap:8px"><span class="nm">/g,(s,id)=>{const u=unreadOf(id);return s+(u?`<span class="newdot" title="${u} رسائل جديدة">${u}</span>`:'')});
})();
