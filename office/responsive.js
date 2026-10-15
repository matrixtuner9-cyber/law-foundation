/* ── تكيّف شاشة المكتب: زر القائمة والدرج الجانبي، وتسميات الجداول لعرضها بطاقاتٍ على الجوال ── */
(function(){
const top=document.querySelector('.top');
top.insertAdjacentHTML('afterbegin',`<button class="menu-btn" id="menuBtn" aria-label="القائمة" aria-expanded="false" aria-controls="nav"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg><span class="lbl">القائمة</span><span class="cnt" id="menuCnt"></span></button>`);
document.body.insertAdjacentHTML('beforeend','<div class="scrim" id="scrim"></div>');
const open=v=>{document.body.classList.toggle('nav-open',v);document.getElementById('menuBtn').setAttribute('aria-expanded',v)};
document.getElementById('menuBtn').onclick=()=>open(!document.body.classList.contains('nav-open'));
document.getElementById('scrim').onclick=()=>open(false);
document.addEventListener('keydown',e=>{if(e.key==='Escape')open(false)});
document.getElementById('nav').addEventListener('click',e=>{if(e.target.closest('button'))open(false)});

/* تسميات خلايا الجداول من رؤوسها (تظهر عند عرض الصفوف بطاقاتٍ على الجوال) */
function label(root){root.querySelectorAll('.tablewrap table').forEach(t=>{const hs=[...t.querySelectorAll('thead th')].map(th=>th.textContent.trim());
 t.querySelectorAll('tbody tr').forEach(tr=>[...tr.children].forEach((td,i)=>{if(!td.hasAttribute('data-label'))td.setAttribute('data-label',td.colSpan>1?'':(hs[i]||''))}))})}
/* عدد التنبيهات على زر القائمة: رسائل جديدة وتحديثات ميزان */
function badge(){const n=[...document.querySelectorAll('#nav .cnt.hot')].map(x=>parseInt(x.textContent)||0).reduce((a,b)=>a+b,0);const c=document.getElementById('menuCnt');if(c)c.textContent=n?String(n):''}
let raf=0;const mo=new MutationObserver(()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;label(document.getElementById('page'));badge()})});
mo.observe(document.getElementById('page'),{childList:true,subtree:true});
mo.observe(document.getElementById('nav'),{childList:true,subtree:true,characterData:true});
})();
