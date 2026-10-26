/* ── التمرير الزجاجي: الهيدر ثابت في الخلف، والمحتوى يعبر فوقه بزجاج شفاف ──
   يعمل في كل شاشة يكون أول ما فيها «هيدر» مصوّر: لافتة الرئيسية (.banner)، ورأس حقيبة الموكل (.bag-head).
   - الهيدر يثبت أسفل الشريط العلوي، وبقية الشاشة تعلوه بطبقة زجاجية ضبابية فيبقى ظاهراً من خلفها.
   - كل سطر أو عنوان يمر فوق الهيدر يتحول إلى زجاج داكن شفاف، ويصير عنوانه نصاً ذهبياً مضيئاً.
   (المسبار «عقل القانون» له المعالجة نفسها داخل misbar.js) */
(function(){
'use strict';
const page=()=>document.getElementById('page');
const HEAD='.banner,.bag-head';
const LIT='.kpis>*,.k,.row,.dlist>*,.card>header,.card .hdr,.panel>header,.bd .list>*,.feed>*,.tline>*,tbody tr,.mbt-r,.bc-row,.upd,.kl-card,.mbc-f>header';
let head=null,raf=0;
function topOffset(){const t=document.querySelector('.top');if(!t)return 0;const cs=getComputedStyle(t);return (parseFloat(cs.top)||0)+t.offsetHeight+8}
function setup(){const p=page();if(!p)return;
 const h=[...p.children].find(x=>x.matches&&x.matches(HEAD))||null;
 if(h===head&&(!h||h.classList.contains('gs-head'))){document.body.classList.toggle('gs-on',!!h);return mark()}
 if(head&&head!==h)head.classList.remove('gs-head');
 head=h;document.body.classList.toggle('gs-on',!!h);
 if(h){h.classList.add('gs-head');document.documentElement.style.setProperty('--gsTop',topOffset()+'px')}
 mark()}
function mark(){raf=0;if(!head||!document.body.classList.contains('gs-on'))return;
 const hb=head.getBoundingClientRect().bottom,p=page();
 document.body.classList.toggle('gs-over',head.getBoundingClientRect().top<=parseFloat(getComputedStyle(head).top||0)+1&&(window.scrollY>24||(page().parentElement&&page().parentElement.scrollTop>24)));
 p.querySelectorAll(LIT).forEach(el=>{if(head.contains(el))return;const r=el.getBoundingClientRect();const on=r.height>0&&r.top<hb-6&&r.bottom>0;if(on!==el.classList.contains('gs-lit'))el.classList.toggle('gs-lit',on)})}
document.addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(mark)},{passive:true,capture:true});
window.addEventListener('resize',()=>{if(head)document.documentElement.style.setProperty('--gsTop',topOffset()+'px');if(!raf)raf=requestAnimationFrame(mark)});
const start=()=>{const p=page();if(!p)return setTimeout(start,200);new MutationObserver(()=>{head=head&&p.contains(head)?head:null;setup()}).observe(p,{childList:true});setup()};
start();

const css=document.createElement('style');css.textContent=`
body.gs-on #page>.gs-head{position:sticky;top:var(--gsTop,80px);z-index:1}
body.gs-on #page>:not(.gs-head):not(.mb-wrap){position:relative;z-index:2}
body.gs-on #page .mbt{background:linear-gradient(135deg,rgb(11 27 43 / .62),rgb(27 54 84 / .62));-webkit-backdrop-filter:blur(14px) saturate(1.4);backdrop-filter:blur(14px) saturate(1.4)}
body.gs-on #page .mbt-c{background:rgb(255 255 255 / .04)}
body.gs-on #page .card,body.gs-on #page .panel,body.gs-on #page .k,body.gs-on #page .kpis>*,body.gs-on #page .xp-sum>div{background:rgb(251 246 234 / .66);-webkit-backdrop-filter:blur(16px) saturate(1.35);backdrop-filter:blur(16px) saturate(1.35);border-color:rgb(255 255 255 / .55);transition:box-shadow .35s ease,background-color .35s ease}
body.gs-on.gs-over #page .card,body.gs-on.gs-over #page .panel{box-shadow:0 18px 44px rgb(11 27 43 / .20),inset 0 1px 0 rgb(255 255 255 / .7),0 0 0 1px rgb(201 162 74 / .22)}
body.gs-on #page .gs-lit{background:rgb(11 27 43 / .46)!important;-webkit-backdrop-filter:blur(6px) saturate(1.5);backdrop-filter:blur(6px) saturate(1.5);box-shadow:inset 0 0 0 1px rgb(243 213 138 / .25);transition:background-color .25s ease}
body.gs-on #page .gs-lit,body.gs-on #page .gs-lit *{color:#F2E6C4}
body.gs-on #page .gs-lit :is(h2,h3,b,strong,.t,.tt,.num){color:#FFF6DA!important;text-shadow:0 0 6px rgb(243 213 138 / .95),0 0 16px rgb(243 213 138 / .7),0 0 32px rgb(201 162 74 / .5)}
body.gs-on #page .gs-lit mark{background:#F3D58A!important;color:#0B1B2B!important}
body.gs-on #page .gs-lit .pill,body.gs-on #page .gs-lit .chip{background:rgb(255 255 255 / .12)!important;color:#F3D58A!important;border-color:rgb(243 213 138 / .35)!important}
@supports not ((backdrop-filter:blur(2px)) or (-webkit-backdrop-filter:blur(2px))){body.gs-on #page .card,body.gs-on #page .panel,body.gs-on #page .k{background:rgb(251 246 234 / .95)}}
html.night body.gs-on #page .card,html.night body.gs-on #page .panel,html.night body.gs-on #page .k{background:rgb(20 33 58 / .7)}
@media (max-width:700px){body.gs-on #page>.gs-head{position:relative;top:auto}}
@media (prefers-reduced-motion:reduce){body.gs-on #page .gs-lit{transition:none}}`;
document.head.appendChild(css);
})();
