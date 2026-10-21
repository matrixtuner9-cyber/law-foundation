/* ── تمييز كل ما يعمل بالذكاء الاصطناعي: لون متدرّج (بنفسجي → نيلي → سماوي)، وبريق ✦، ونبض حيّ خفيف ──
   يُطبَّق تلقائياً على أي زر أو رابط يُشغّل الذكاء الاصطناعي، في كل الشاشات والنوافذ، دون تعديل كل وحدة على حدة.
   يحترم «تقليل الحركة» في النظام، ولا ينبض الزر المعطّل. */
(function(){
'use strict';
/* أوامر تُشغّل الذكاء الاصطناعي مباشرة */
const ACTS=new Set(['aiOpen','aiOpenWith','asOpen','asRun','asAgain','asToDraft','hpOpen','hpAssist','qaAI','qaRun','rdAi','rdAiOpen','rAiExtract','srcAi','hubDraft','hubPrep','hubAssist','gdStartAnswer','clDraft','dashAi','aiAnswer']);
/* أو نص الزر يدل على ذلك */
const RX=/الذكاء الاصطناعي|بالذكاء|الذكي|صياغة بالصوت|صياغة لائحة|الصياغة بالصوت|مساعد القضية|مساعد المحامي|مساعد الصياغة|مساعد التحضير|تحضير جلسة|تدقيق قانوني|التحليل الذكي|\bAI\b/;
const NOT=/^(إلغاء|إغلاق|حذف|المساعدة)$/;
const SPARK='<svg class="ai-spark" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9z"/><path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>';

function isAi(el){const a=el.getAttribute('data-act');if(a&&ACTS.has(a))return true;
 if(el.closest('.ai-skip,.ft-bar,#gdPanel,.gd,.wa-app,nav,#nav'))return false;
 const t=(el.textContent||'').replace(/\s+/g,' ').trim();return t.length>0&&t.length<=60&&!NOT.test(t)&&RX.test(t)}
function mark(root){(root||document).querySelectorAll('button,a.btn,[data-act]:not(input):not(select):not(textarea):not(label):not(form)').forEach(el=>{
 if(el.dataset.aiChecked)return;el.dataset.aiChecked='1';if(!isAi(el))return;
 const link=el.classList.contains('link')||el.tagName==='A'&&!el.classList.contains('btn');
 el.classList.add(link?'ai-link':'ai-btn');if(!el.title)el.title='يعمل بالذكاء الاصطناعي — راجع الناتج قبل اعتماده';
 if(!el.querySelector('.ai-spark'))el.insertAdjacentHTML('afterbegin',SPARK)})}
let raf=0;const later=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;mark()})};
new MutationObserver(later).observe(document.documentElement,{childList:true,subtree:true,characterData:false});
later();
window.MQ_aiMark=mark;

const css=document.createElement('style');css.textContent=`
:root{--ai-a:#7c3aed;--ai-b:#4f46e5;--ai-c:#0ea5e9;--ai-glow:124 58 237}
.ai-btn{position:relative;isolation:isolate;overflow:hidden;
 background:linear-gradient(120deg,var(--ai-a),var(--ai-b) 48%,var(--ai-c))!important;background-size:180% 180%!important;
 color:#fff!important;border:1px solid rgba(255,255,255,.18)!important;font-weight:600!important;
 box-shadow:0 2px 10px rgb(var(--ai-glow) / .35),inset 0 1px 0 rgba(255,255,255,.25)!important;
 animation:ai-pulse 2.8s ease-in-out infinite,ai-flow 6s ease-in-out infinite;display:inline-flex;align-items:center;gap:6px}
.ai-btn::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,.35) 50%,transparent 70%);transform:translateX(120%);animation:ai-shine 4.5s ease-in-out infinite}
.ai-btn:hover{filter:brightness(1.08) saturate(1.1);transform:translateY(-1px);box-shadow:0 6px 18px rgb(var(--ai-glow) / .45),inset 0 1px 0 rgba(255,255,255,.3)!important}
.ai-btn:active{transform:translateY(0)}
.ai-btn:focus-visible{outline:3px solid #c4b5fd!important;outline-offset:2px}
.ai-btn[disabled],.ai-btn.disabled{animation:none;filter:grayscale(.5) opacity(.7)}.ai-btn[disabled]::after{display:none}
.ai-btn .ai-spark{width:15px;height:15px;flex:none;fill:#fff;animation:ai-twinkle 2.8s ease-in-out infinite;filter:drop-shadow(0 0 3px rgba(255,255,255,.8))}
.ai-btn svg:not(.ai-spark){stroke:currentColor}
.ai-link{background:linear-gradient(90deg,var(--ai-a),var(--ai-c));-webkit-background-clip:text;background-clip:text;color:transparent!important;font-weight:600;display:inline-flex;align-items:center;gap:4px}
.ai-link .ai-spark{width:13px;height:13px;flex:none;fill:var(--ai-a);animation:ai-twinkle 2.8s ease-in-out infinite}
html.night{--ai-glow:167 139 250}
@keyframes ai-pulse{0%,100%{box-shadow:0 2px 10px rgb(var(--ai-glow) / .30),0 0 0 0 rgb(var(--ai-glow) / .45),inset 0 1px 0 rgba(255,255,255,.25)}
 50%{box-shadow:0 2px 14px rgb(var(--ai-glow) / .45),0 0 0 6px rgb(var(--ai-glow) / 0),inset 0 1px 0 rgba(255,255,255,.25)}}
@keyframes ai-flow{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes ai-shine{0%,60%{transform:translateX(120%)}85%,100%{transform:translateX(-120%)}}
@keyframes ai-twinkle{0%,100%{transform:scale(1) rotate(0);opacity:1}50%{transform:scale(1.18) rotate(12deg);opacity:.85}}
.ai-btn:nth-child(3n+2){animation-delay:-.9s,-2s}.ai-btn:nth-child(3n+2)::after{animation-delay:-1.5s}.ai-btn:nth-child(3n){animation-delay:-1.8s,-4s}.ai-btn:nth-child(3n)::after{animation-delay:-3s}
@media (prefers-reduced-motion:reduce){.ai-btn,.ai-btn::after,.ai-btn .ai-spark,.ai-link .ai-spark{animation:none!important}.ai-btn::after{display:none}}
@media print{.ai-btn{background:none!important;color:inherit!important;box-shadow:none!important}.ai-spark{display:none}}`;
document.head.appendChild(css);
})();
