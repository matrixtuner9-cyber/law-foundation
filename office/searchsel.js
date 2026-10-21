/* ── بحث بالاسم داخل كل قائمة اختيار طويلة (الموكل، الخصم، القضية، المحكمة…) ──
   يبقى عنصر select الأصلي هو مصدر القيمة (فلا يتغير شيء في منطق الحفظ)؛ عند فتحه تظهر لوحة فيها خانة بحث
   تطابق الكلمات بأي ترتيب، وتتجاهل الهمزات والتشكيل والتاء المربوطة، وتعمل بالفأرة ولوحة المفاتيح واللمس. */
(function(root){
'use strict';
const nz=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[ً-ْـ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\s+/g,' ').trim();
function match(text,q){const t=nz(text),ws=nz(q).split(' ').filter(Boolean);return ws.every(w=>t.includes(w))}
if(typeof module!=='undefined'&&module.exports){module.exports={match,nz};return}
if(!root||!root.document)return;

const MIN=7;
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let P=null; // اللوحة المفتوحة

function eligible(s){return s&&s.tagName==='SELECT'&&!s.multiple&&!s.disabled&&s.options.length>=MIN&&s.dataset.ss!=='off'}
function items(s){const out=[];for(const o of s.options){if(o.hidden)continue;out.push({v:o.value,t:o.textContent.trim(),g:o.parentElement&&o.parentElement.tagName==='OPTGROUP'?o.parentElement.label:'',dis:o.disabled})}return out}

function close(focus){if(!P)return;const s=P.sel;P.box.remove();document.removeEventListener('mousedown',outside,true);window.removeEventListener('resize',place);window.removeEventListener('scroll',onScroll,true);P=null;if(focus)s.focus()}
function outside(ev){if(P&&!P.box.contains(ev.target)&&ev.target!==P.sel)close()}
function onScroll(ev){if(P&&!P.box.contains(ev.target))place()}
function place(){if(!P)return;const r=P.sel.getBoundingClientRect(),b=P.box,vh=innerHeight,vw=innerWidth;
 const w=Math.min(Math.max(r.width,280),vw-16);b.style.width=w+'px';
 let x=r.right-w;if(x<8)x=8;if(x+w>vw-8)x=vw-8-w;b.style.left=x+'px';
 const below=vh-r.bottom,h=Math.min(380,Math.max(below,r.top)-12);b.style.maxHeight=h+'px';
 b.style.top=(below>=Math.min(260,h)||below>=r.top?r.bottom+4:r.top-4-Math.min(b.scrollHeight,h))+'px'}

function draw(){const q=P.inp.value,list=P.all.filter(x=>!q||match(x.t+' '+x.g,q));P.list=list;if(P.i>=list.length)P.i=list.length-1;if(P.i<0&&list.length)P.i=0;
 let lastG=null;
 P.ul.innerHTML=list.length?list.map((x,i)=>{const gh=x.g&&x.g!==lastG?`<li class="ss-g" aria-hidden="true">${e(x.g)}</li>`:'';lastG=x.g;
  return gh+`<li role="option" id="ss_${i}" data-i="${i}" class="${i===P.i?'on':''}${x.v===P.sel.value?' cur':''}${x.dis?' dis':''}" aria-selected="${x.v===P.sel.value}">${e(x.t)}</li>`}).join('')
  :`<li class="ss-none">لا نتائج لـ«${e(q)}»</li>`;
 P.cnt.textContent=q?list.length+' من '+P.all.length:P.all.length+' خياراً';
 const on=P.ul.querySelector('li.on');if(on){on.scrollIntoView({block:'nearest'});P.inp.setAttribute('aria-activedescendant',on.id)}place()}

function choose(i){const x=P.list[i];if(!x||x.dis)return;const s=P.sel;close(true);if(s.value!==x.v){s.value=x.v;s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}))}}

function open(s,seed){if(P&&P.sel===s)return;close();
 const box=document.createElement('div');box.className='ss-pop';box.dir='rtl';
 box.innerHTML=`<div class="ss-h"><input type="search" class="ss-in" placeholder="اكتب للبحث…" aria-label="بحث في القائمة" role="combobox" aria-expanded="true" aria-controls="ssList" autocomplete="off"><small class="ss-c"></small></div><ul class="ss-ul" id="ssList" role="listbox"></ul>`;
 document.body.appendChild(box);
 const all=items(s);P={sel:s,box,inp:box.querySelector('.ss-in'),ul:box.querySelector('.ss-ul'),cnt:box.querySelector('.ss-c'),all,list:all,i:Math.max(0,all.findIndex(x=>x.v===s.value))};
 if(seed)P.inp.value=seed;
 P.inp.addEventListener('input',()=>{P.i=0;draw()});
 P.inp.addEventListener('keydown',ev=>{const n=P.list.length;
  if(ev.key==='ArrowDown'){ev.preventDefault();P.i=Math.min(n-1,P.i+1);draw()}
  else if(ev.key==='ArrowUp'){ev.preventDefault();P.i=Math.max(0,P.i-1);draw()}
  else if(ev.key==='PageDown'){ev.preventDefault();P.i=Math.min(n-1,P.i+8);draw()}
  else if(ev.key==='PageUp'){ev.preventDefault();P.i=Math.max(0,P.i-8);draw()}
  else if(ev.key==='Enter'){ev.preventDefault();choose(P.i)}
  else if(ev.key==='Escape'){ev.preventDefault();ev.stopPropagation();close(true)}
  else if(ev.key==='Tab'){close()}});
 P.ul.addEventListener('mousedown',ev=>ev.preventDefault());
 P.ul.addEventListener('click',ev=>{const li=ev.target.closest('li[data-i]');if(li)choose(+li.dataset.i)});
 document.addEventListener('mousedown',outside,true);window.addEventListener('resize',place);window.addEventListener('scroll',onScroll,true);
 draw();P.inp.focus();if(seed){const v=P.inp.value;P.inp.setSelectionRange(v.length,v.length)}setTimeout(()=>{if(P&&document.activeElement!==P.inp)P.inp.focus()},0)}

/* فتح اللوحة بدل القائمة الأصلية: بالنقر، أو بالكتابة مباشرة، أو بالأسهم/المسافة/Enter */
document.addEventListener('mousedown',ev=>{const s=ev.target.closest&&ev.target.closest('select');if(!eligible(s)||ev.button!==0)return;ev.preventDefault();s.focus();P&&P.sel===s?close():open(s)},true);
document.addEventListener('keydown',ev=>{const s=ev.target;if(!eligible(s)||ev.ctrlKey||ev.metaKey||ev.altKey)return;
 if(ev.key.length===1&&ev.key!==' '){ev.preventDefault();if(P&&P.sel===s){P.inp.value+=ev.key;P.i=0;draw();P.inp.focus()}else open(s,ev.key)}
 else if(['ArrowDown','ArrowUp',' ','Enter','F4'].includes(ev.key)){ev.preventDefault();open(s)}},true);
/* تلميح بصري: عدسة صغيرة على القوائم القابلة للبحث */
function mark(){document.querySelectorAll('select').forEach(s=>{const ok=eligible(s);if(ok&&!s.classList.contains('ss-on')){s.classList.add('ss-on');s.title=s.title||'اضغط واكتب للبحث بالاسم'}else if(!ok&&s.classList.contains('ss-on'))s.classList.remove('ss-on')})}
new MutationObserver(()=>{mark();if(P&&!document.body.contains(P.sel))close()}).observe(document.documentElement,{childList:true,subtree:true});
mark();
root.MQ_selSearch={open,close,match};

const css=document.createElement('style');css.textContent=`
.ss-pop{position:fixed;z-index:10050;background:var(--card,#fff);color:inherit;border:1px solid var(--line,#e5e7eb);border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.18);display:flex;flex-direction:column;overflow:hidden}
.ss-h{display:flex;align-items:center;gap:8px;padding:8px;border-bottom:1px solid var(--line,#e5e7eb)}
.ss-in{flex:1;min-width:0;border:1px solid var(--line,#e5e7eb);border-radius:8px;padding:8px 10px;font:inherit;background:var(--bg,#fff);color:inherit}
.ss-in:focus{outline:2px solid var(--acc,#b8860b);outline-offset:0}
.ss-c{color:var(--muted,#6b7280);font-size:11.5px;white-space:nowrap}
.ss-ul{list-style:none;margin:0;padding:4px;overflow:auto;flex:1}
.ss-ul li{padding:8px 10px;border-radius:8px;cursor:pointer;line-height:1.4}
.ss-ul li.on{background:color-mix(in srgb,var(--acc,#b8860b) 16%,transparent)}
.ss-ul li.cur{font-weight:700}.ss-ul li.cur::after{content:' ✓';color:var(--acc,#b8860b)}
.ss-ul li.dis{opacity:.45;cursor:default}
.ss-ul li.ss-g{font-size:11.5px;color:var(--muted,#6b7280);cursor:default;padding:6px 10px 2px}
.ss-ul li.ss-none{color:var(--muted,#6b7280);cursor:default}
select.ss-on{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239a8a6a' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m20 20-3.5-3.5'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:left 30px center;padding-left:52px}`;
document.head.appendChild(css);
})(typeof window!=='undefined'?window:null);
