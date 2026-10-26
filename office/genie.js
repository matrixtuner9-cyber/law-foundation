/* ── «جنّي المسبار»: رأس صغير يطلّ أحياناً من يسار الشاشة ويخبر عن آخر قرارات محكمة النقض الفلسطينية ──
   - وجهه حروف وأرقام عربية تنهمر (مطر رقمي) داخل رأس شفاف، وعينان ذهبيتان ترمشان، وفم يتحرك وهو «يتكلم».
   - المصدر: فهرس المسبار المحلي نفسه (أحدث أحكام النقض الفلسطينية بتاريخها)، فلا يحتاج إنترنت على نسخة المكتب.
   - يظهر بعد دقيقة من فتح التطبيق ثم كل ربع ساعة تقريباً، ويختفي وحده بعد ثوانٍ (يتوقف الاختفاء عند مرور المؤشر).
   - إغلاق ✕ يخفيه الآن، و«لا تُظهره اليوم» تخفيه حتى الغد (تفضيل لهذا المتصفح فقط). */
(function(){
'use strict';
if(typeof document==='undefined')return;
const FIRST=60e3,EVERY=15*60e3,SHOW=20e3,LS='mq_genie_off';
const today=()=>new Date().toISOString().slice(0,10);
const off=()=>{try{return localStorage.getItem(LS)===today()}catch(e){return false}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const G={items:[],at:0,i:0,timer:null,hideT:null,typeT:null,raf:0,talking:false,shown:false,hover:false};

/* ── البيانات: أحدث أحكام محكمة النقض الفلسطينية ── */
async function load(){if(G.items.length&&Date.now()-G.at<3600e3)return;
 try{const q=new URLSearchParams({kind:'ruling',country:'PS',court:'محكمة النقض',sort:'date_desc',per:'12',facets:'0'});
  const r=await fetch('/api/admin/misbar/search?'+q,{credentials:'same-origin'});if(!r.ok)return;const d=await r.json();
  G.items=(d.results||[]).filter(x=>x.case_no||x.title);G.at=Date.now();G.i=Math.floor(Math.random()*Math.max(1,G.items.length))}catch(e){}}
const fmtD=s=>{const m=/^(\d{4})-(\d\d)-(\d\d)/.exec(s||'');return m?`${+m[3]}/${+m[2]}/${m[1]}`:''};
const topic=x=>{const p=String(x.subject||'').split('›').map(s=>s.trim()).filter(Boolean);return p.length?p[p.length-1]:''};
const OPEN=['من أحدث ما وصل من محكمة النقض:','قرار جديد نسبياً من محكمة النقض:','هل اطّلعت على هذا القرار من محكمة النقض؟','للعلم، من قرارات محكمة النقض الأخيرة:'];
function say(x){const d=fmtD(x.date),t=topic(x);
 return {lead:OPEN[Math.floor(Math.random()*OPEN.length)],body:`الطعن رقم ${x.case_no||'—'}${d?' بتاريخ '+d:''}${t?' — '+t:''}.`}}

/* ── الرأس: مطر رقمي داخل شكل الرأس ── */
const GL='ابتثجحخدذرزسشصضطظعغفقكلمنهوي٠١٢٣٤٥٦٧٨٩§';
let cols=null,blink=0,nextBlink=0,mouth=0;
function draw(cv,t){const c=cv.getContext('2d'),W=cv.width,H=cv.height,s=W/80;
 c.clearRect(0,0,W,H);
 // شكل الرأس: بيضاوي مع ذقن
 const head=new Path2D();head.ellipse(40*s,36*s,25*s,29*s,0,0,Math.PI*2);
 c.save();c.clip(head);
 const g=c.createRadialGradient(40*s,30*s,4*s,40*s,40*s,40*s);g.addColorStop(0,'#0F3A2C');g.addColorStop(1,'#04140F');c.fillStyle=g;c.fillRect(0,0,W,H);
 const fs=7*s,n=Math.ceil(W/fs);if(!cols||cols.length!==n)cols=Array.from({length:n},()=>({y:Math.random()*H,v:(.35+Math.random()*.6)*s}));
 c.font=`${fs}px monospace`;c.textAlign='center';
 cols.forEach((k,i)=>{for(let j=0;j<6;j++){const y=k.y-j*fs;if(y<-fs||y>H+fs)continue;c.fillStyle=j?`rgba(57,227,138,${.55-j*.08})`:'#C8FFE0';c.fillText(GL[(i*7+j+Math.floor(t/140))%GL.length],i*fs+fs/2,y)}
  k.y+=k.v*(matchMedia('(prefers-reduced-motion: reduce)').matches?0:1);if(k.y-6*fs>H)k.y=-Math.random()*20*s});
 c.restore();
 // حافة الرأس المضيئة
 c.strokeStyle='rgba(243,213,138,.75)';c.lineWidth=1.6*s;c.stroke(head);
 // العينان: ذهبيتان مضيئتان، ترمشان
 if(t>nextBlink){blink=1;nextBlink=t+2500+Math.random()*3500}const eh=blink>0?Math.max(.15,1-blink):1;if(blink>0)blink-=.12;
 c.shadowColor='#F3D58A';c.shadowBlur=8*s;c.fillStyle='#FFE9A8';
 for(const x of[31,49]){c.beginPath();c.ellipse(x*s,33*s,4.6*s,2.6*s*eh,0,0,Math.PI*2);c.fill()}
 // الفم: يتحرك وهو يتكلم
 mouth=G.talking?(Math.sin(t/70)+1)/2:Math.max(0,mouth-.08);
 c.shadowBlur=5*s;c.strokeStyle='#F3D58A';c.lineWidth=1.4*s;c.beginPath();c.ellipse(40*s,48*s,6*s,(.6+mouth*3)*s,0,0,Math.PI*2);c.stroke();c.shadowBlur=0}
function loop(t){const cv=document.getElementById('mqgCv');if(!cv||!G.shown){G.raf=0;return}draw(cv,t);G.raf=requestAnimationFrame(loop)}

/* ── الظهور والكلام ── */
function el(){let w=document.getElementById('mqGenie');if(w)return w;
 w=document.createElement('div');w.id='mqGenie';w.setAttribute('role','status');w.setAttribute('aria-live','polite');
 w.innerHTML=`<div class="mqg-head" aria-hidden="true"><canvas id="mqgCv" width="160" height="160"></canvas><span class="mqg-wisp"></span></div>
  <div class="mqg-bub"><button type="button" class="mqg-x" data-act="genieClose" aria-label="إغلاق">✕</button><b class="mqg-name">جنّي المسبار</b><p class="mqg-lead"></p><p class="mqg-txt"></p>
  <div class="mqg-acts"><button type="button" class="mqg-go" data-act="genieOpen">اقرأ الحكم ←</button><button type="button" class="mqg-mute" data-act="genieMute">لا تُظهره اليوم</button></div></div>`;
 document.body.appendChild(w);
 w.addEventListener('mouseenter',()=>{G.hover=true;clearTimeout(G.hideT)});w.addEventListener('mouseleave',()=>{G.hover=false;G.hideT=setTimeout(hide,6000)});
 return w}
function busy(){const m=document.getElementById('modal');return (m&&m.innerHTML.trim())||!window.MQ||!MQ.user||document.hidden||/login/.test(location.pathname)}
async function show(){if(off()||G.shown||busy())return;await load();if(!G.items.length)return;
 const x=G.items[G.i%G.items.length];G.i++;G.cur=x;const s=say(x);
 const w=el();w.querySelector('.mqg-lead').textContent=s.lead;const tx=w.querySelector('.mqg-txt');tx.textContent='';
 w.classList.add('on');G.shown=true;if(!G.raf)G.raf=requestAnimationFrame(loop);
 // كتابة حرفاً حرفاً والفم يتحرك
 let i=0;G.talking=true;clearInterval(G.typeT);G.typeT=setInterval(()=>{tx.textContent=s.body.slice(0,++i);if(i>=s.body.length){clearInterval(G.typeT);G.talking=false}},38);
 clearTimeout(G.hideT);G.hideT=setTimeout(()=>{if(!G.hover)hide()},SHOW)}
function hide(){const w=document.getElementById('mqGenie');if(w)w.classList.remove('on');G.shown=false;G.talking=false;clearInterval(G.typeT)}
function schedule(){clearTimeout(G.timer);G.timer=setTimeout(async()=>{await show();schedule()},G.first?EVERY+Math.random()*120e3:FIRST);G.first=true}
A.genieClose=()=>hide();
A.genieMute=()=>{try{localStorage.setItem(LS,today())}catch(e){}hide();if(typeof toast==='function')toast('لن يظهر جنّي المسبار حتى الغد')};
A.genieOpen=()=>{const x=G.cur;hide();if(!x)return;if(A.nav)A.nav('misbar');setTimeout(()=>{if(A.mbOpen)A.mbOpen(x.id)},350)};
window.MQ_genie={show,hide};

const css=document.createElement('style');css.textContent=`
#mqGenie{position:fixed;left:18px;bottom:22px;z-index:180;display:flex;align-items:flex-end;gap:10px;direction:rtl;pointer-events:none;opacity:0;transform:translateX(-30px) scale(.92);transition:opacity .45s ease,transform .45s cubic-bezier(.2,.9,.3,1.3)}
#mqGenie.on{opacity:1;transform:none;pointer-events:auto}
.mqg-head{position:relative;width:80px;height:80px;flex:none;order:2;animation:mqgBob 3.2s ease-in-out infinite;filter:drop-shadow(0 6px 14px rgb(0 0 0 / .35))}
.mqg-head canvas{width:80px;height:80px;display:block}
.mqg-wisp{position:absolute;left:28px;top:70px;width:24px;height:26px;border-radius:0 0 50% 50%;background:radial-gradient(ellipse at top,rgb(243 213 138 / .55),rgb(57 227 138 / .15) 60%,transparent 75%);filter:blur(2px);animation:mqgWisp 2.4s ease-in-out infinite}
.mqg-bub{order:1;position:relative;max-width:min(340px,70vw);background:#FBF6EA;color:#0F2A45;border:1px solid #C9A24A;border-radius:16px 16px 16px 4px;padding:10px 14px 10px 30px;box-shadow:0 12px 30px rgb(11 27 43 / .25);font-size:13.5px;line-height:1.8;margin-bottom:34px}
.mqg-bub::after{content:'';position:absolute;left:-7px;bottom:12px;width:12px;height:12px;background:#FBF6EA;border-left:1px solid #C9A24A;border-bottom:1px solid #C9A24A;transform:rotate(45deg)}
.mqg-name{display:block;font-size:12px;color:#8A6A1F}
.mqg-lead{margin:2px 0 0;color:#6B5E44;font-size:12.5px}.mqg-txt{margin:0;font-weight:700;min-height:1.8em}
.mqg-x{position:absolute;left:6px;top:6px;width:22px;height:22px;border-radius:50%;border:0;background:transparent;color:#6B5E44;cursor:pointer;font-size:12px}.mqg-x:hover{background:#F1E6CC}
.mqg-acts{display:flex;gap:10px;align-items:center;margin-top:4px}
.mqg-go{border:0;background:#0B1B2B;color:#F3D58A;border-radius:999px;padding:4px 12px;font:inherit;font-size:12.5px;cursor:pointer}
.mqg-mute{border:0;background:transparent;color:#8A7A5A;font:inherit;font-size:11.5px;cursor:pointer;text-decoration:underline}
@keyframes mqgBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes mqgWisp{0%,100%{opacity:.8;transform:scaleY(1)}50%{opacity:.5;transform:scaleY(1.25) translateX(2px)}}
@media (prefers-reduced-motion:reduce){.mqg-head,.mqg-wisp{animation:none}#mqGenie{transition:opacity .2s}}
@media (max-width:700px){#mqGenie{left:8px;bottom:12px}.mqg-head,.mqg-head canvas{width:60px;height:60px}}
html.night .mqg-bub{background:#14213A;color:#F2E6C4;border-color:#5C4E2E}html.night .mqg-bub::after{background:#14213A;border-color:#5C4E2E}`;
document.head.appendChild(css);
schedule();
})();
