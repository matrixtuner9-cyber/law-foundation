/* ── التمرير فوق الهيدر: الهيدر ثابت في الخلف، والمحتوى يعبر فوقه بأرضية بيج مصمتة (بلا زجاج ولا توهّج، للوضوح) ──
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
/* «ستارة» بيج مصمتة تبدأ تحت الهيدر وتتحرك مع المحتوى: ما يمرّ فوق الهيدر يبقى على أرضية الصفحة نفسها، ولا يظهر الهيدر من الفراغات بين الأقسام */
function cut(){const p=page();if(!p||!head)return;p.style.setProperty('--gsCut',(head.offsetTop+head.offsetHeight)+'px')}
function setup(){const p=page();if(!p)return;
 const h=[...p.children].find(x=>x.matches&&x.matches(HEAD))||null;
 if(h===head&&(!h||h.classList.contains('gs-head'))){document.body.classList.toggle('gs-on',!!h);cut();return mark()}
 if(head&&head!==h)head.classList.remove('gs-head');
 head=h;document.body.classList.toggle('gs-on',!!h);
 if(h){h.classList.add('gs-head');document.documentElement.style.setProperty('--gsTop',topOffset()+'px')}
 cut()
 mark()}
function mark(){raf=0;return; // أُلغيت إضاءة الأسطر فوق الهيدر بطلب المستخدم: الوضوح أولاً
 if(!head||!document.body.classList.contains('gs-on'))return;
 const hb=head.getBoundingClientRect().bottom,p=page();
 document.body.classList.toggle('gs-over',head.getBoundingClientRect().top<=parseFloat(getComputedStyle(head).top||0)+1&&(window.scrollY>24||(page().parentElement&&page().parentElement.scrollTop>24)));
 p.querySelectorAll(LIT).forEach(el=>{if(head.contains(el))return;const r=el.getBoundingClientRect();const on=r.height>0&&r.top<hb-6&&r.bottom>0;if(on!==el.classList.contains('gs-lit'))el.classList.toggle('gs-lit',on)})}
document.addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(mark)},{passive:true,capture:true});
window.addEventListener('resize',()=>{if(head){document.documentElement.style.setProperty('--gsTop',topOffset()+'px');cut()}if(!raf)raf=requestAnimationFrame(mark)});
const start=()=>{const p=page();if(!p)return setTimeout(start,200);new MutationObserver(()=>{head=head&&p.contains(head)?head:null;setup()}).observe(p,{childList:true});setup()};
start();

const css=document.createElement('style');css.textContent=`
body.gs-on #page{position:relative}
body.gs-on #page>.gs-head{position:sticky;top:var(--gsTop,80px);z-index:1}
body.gs-on #page::before{content:'';position:absolute;left:-12px;right:-12px;top:var(--gsCut,0);bottom:0;background:#F8F6F0;z-index:2;pointer-events:none}
html.night body.gs-on #page::before{background:var(--bg)}
body.gs-on #page>:not(.gs-head):not(.mb-wrap){position:relative;z-index:3}
body.gs-on #page .card,body.gs-on #page .panel,body.gs-on #page .k,body.gs-on #page .kpis>*,body.gs-on #page .xp-sum>div{background:#FBF6EA;-webkit-backdrop-filter:none;backdrop-filter:none}
html.night body.gs-on #page .card,html.night body.gs-on #page .panel,html.night body.gs-on #page .k{background:#14213A}
@media (max-width:700px){body.gs-on #page>.gs-head{position:relative;top:auto}body.gs-on #page::before{display:none}}`;
document.head.appendChild(css);
})();
