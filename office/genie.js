/* ── «جنّي المسبار»: رأس صغير يطلّ أحياناً من يسار الشاشة ويخبر عن آخر قرارات محكمة النقض الفلسطينية ──
   - وجهه صورة رأس واقعية بشبكة رقمية (genie-face.webp) في إطار دائري ذهبي، يتوهّج وهو «يتكلم» ويمرّ عليه خط مسح خفيف.
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

/* ── الظهور والكلام ── */
function el(){let w=document.getElementById('mqGenie');if(w)return w;
 w=document.createElement('div');w.id='mqGenie';w.setAttribute('role','status');w.setAttribute('aria-live','polite');
 w.innerHTML=`<div class="mqg-head" aria-hidden="true"><img src="genie-face.webp" alt="" draggable="false"><span class="mqg-scan"></span><span class="mqg-wisp"></span></div>
  <div class="mqg-bub"><button type="button" class="mqg-x" data-act="genieClose" aria-label="إغلاق">✕</button><b class="mqg-name">جنّي المسبار</b><p class="mqg-lead"></p><p class="mqg-txt"></p>
  <div class="mqg-acts"><button type="button" class="mqg-go" data-act="genieOpen">اقرأ الحكم ←</button><button type="button" class="mqg-mute" data-act="genieMute">لا تُظهره اليوم</button></div></div>`;
 document.body.appendChild(w);
 w.addEventListener('mouseenter',()=>{G.hover=true;clearTimeout(G.hideT)});w.addEventListener('mouseleave',()=>{G.hover=false;G.hideT=setTimeout(hide,6000)});
 return w}
function busy(){const m=document.getElementById('modal');return (m&&m.innerHTML.trim())||!window.MQ||!MQ.user||document.hidden||/login/.test(location.pathname)}
async function show(){if(off()||G.shown||busy())return;await load();if(!G.items.length)return;
 const x=G.items[G.i%G.items.length];G.i++;G.cur=x;const s=say(x);
 const w=el();w.querySelector('.mqg-lead').textContent=s.lead;const tx=w.querySelector('.mqg-txt');tx.textContent='';
 w.classList.add('on');G.shown=true;
 // كتابة حرفاً حرفاً والفم يتحرك
 let i=0;G.talking=true;w.classList.add('talk');clearInterval(G.typeT);G.typeT=setInterval(()=>{tx.textContent=s.body.slice(0,++i);if(i>=s.body.length){clearInterval(G.typeT);G.talking=false;w.classList.remove('talk')}},38);
 clearTimeout(G.hideT);G.hideT=setTimeout(()=>{if(!G.hover)hide()},SHOW)}
function hide(){const w=document.getElementById('mqGenie');if(w)w.classList.remove('on','talk');G.shown=false;G.talking=false;clearInterval(G.typeT)}
function schedule(){clearTimeout(G.timer);G.timer=setTimeout(async()=>{await show();schedule()},G.first?EVERY+Math.random()*120e3:FIRST);G.first=true}
A.genieClose=()=>hide();
A.genieMute=()=>{try{localStorage.setItem(LS,today())}catch(e){}hide();if(typeof toast==='function')toast('لن يظهر جنّي المسبار حتى الغد')};
A.genieOpen=()=>{const x=G.cur;hide();if(!x)return;if(A.nav)A.nav('misbar');setTimeout(()=>{if(A.mbOpen)A.mbOpen(x.id)},350)};
window.MQ_genie={show,hide};

const css=document.createElement('style');css.textContent=`
#mqGenie{position:fixed;left:18px;bottom:82px;z-index:180;display:flex;align-items:flex-end;gap:10px;direction:rtl;pointer-events:none;opacity:0;transform:translateX(-30px) scale(.92);transition:opacity .45s ease,transform .45s cubic-bezier(.2,.9,.3,1.3)}
#mqGenie.on{opacity:1;transform:none;pointer-events:auto}
.mqg-head{position:relative;width:104px;height:104px;flex:none;order:2;animation:mqgBob 3.2s ease-in-out infinite;filter:drop-shadow(0 6px 14px rgb(0 0 0 / .35))}
.mqg-head img{width:104px;height:104px;display:block;border-radius:50%;border:2px solid #C9A24A;box-shadow:0 0 0 3px rgb(11 27 43 / .55),0 0 14px rgb(64 200 210 / .35);transition:box-shadow .3s ease;user-select:none}
#mqGenie.talk .mqg-head img{animation:mqgTalk 1s ease-in-out infinite}
.mqg-scan{position:absolute;inset:2px;border-radius:50%;overflow:hidden;pointer-events:none}
.mqg-scan::after{content:'';position:absolute;left:0;right:0;height:22%;top:-25%;background:linear-gradient(180deg,transparent,rgb(120 230 240 / .28),transparent);animation:mqgScan 3.6s linear infinite}
@keyframes mqgTalk{0%,100%{box-shadow:0 0 0 3px rgb(11 27 43 / .55),0 0 12px rgb(64 200 210 / .35)}50%{box-shadow:0 0 0 3px rgb(11 27 43 / .55),0 0 26px rgb(64 220 230 / .8),0 0 6px rgb(243 213 138 / .7)}}
@keyframes mqgScan{to{top:110%}}
.mqg-wisp{position:absolute;left:38px;top:92px;width:28px;height:30px;border-radius:0 0 50% 50%;background:radial-gradient(ellipse at top,rgb(243 213 138 / .5),rgb(64 200 210 / .18) 60%,transparent 75%);filter:blur(2px);animation:mqgWisp 2.4s ease-in-out infinite}
.mqg-bub{order:1;position:relative;max-width:min(340px,70vw);background:#FBF6EA;color:#0F2A45;border:1px solid #C9A24A;border-radius:16px 16px 16px 4px;padding:10px 14px 10px 30px;box-shadow:0 12px 30px rgb(11 27 43 / .25);font-size:13.5px;line-height:1.8;margin-bottom:46px}
.mqg-bub::after{content:'';position:absolute;left:-7px;bottom:12px;width:12px;height:12px;background:#FBF6EA;border-left:1px solid #C9A24A;border-bottom:1px solid #C9A24A;transform:rotate(45deg)}
.mqg-name{display:block;font-size:12px;color:#8A6A1F}
.mqg-lead{margin:2px 0 0;color:#6B5E44;font-size:12.5px}.mqg-txt{margin:0;font-weight:700;min-height:1.8em}
.mqg-x{position:absolute;left:6px;top:6px;width:22px;height:22px;border-radius:50%;border:0;background:transparent;color:#6B5E44;cursor:pointer;font-size:12px}.mqg-x:hover{background:#F1E6CC}
.mqg-acts{display:flex;gap:10px;align-items:center;margin-top:4px}
.mqg-go{border:0;background:#0B1B2B;color:#F3D58A;border-radius:999px;padding:4px 12px;font:inherit;font-size:12.5px;cursor:pointer}
.mqg-mute{border:0;background:transparent;color:#8A7A5A;font:inherit;font-size:11.5px;cursor:pointer;text-decoration:underline}
@keyframes mqgBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes mqgWisp{0%,100%{opacity:.8;transform:scaleY(1)}50%{opacity:.5;transform:scaleY(1.25) translateX(2px)}}
@media (prefers-reduced-motion:reduce){.mqg-head,.mqg-wisp,.mqg-scan::after,#mqGenie.talk .mqg-head img{animation:none}#mqGenie{transition:opacity .2s}}
@media (max-width:700px){#mqGenie{left:8px;bottom:12px}.mqg-head,.mqg-head img{width:72px;height:72px}}
html.night .mqg-bub{background:#14213A;color:#F2E6C4;border-color:#5C4E2E}html.night .mqg-bub::after{background:#14213A;border-color:#5C4E2E}`;
document.head.appendChild(css);
schedule();
})();
