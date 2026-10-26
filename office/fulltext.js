/* ── عرض النص بشاشة كاملة: نص الحكم أو أي نص طويل، مع تكبير/تصغير الخط وتباعد الأسطر والطباعة والنسخ ──
   A.ftOpen({title, sub, text, q}) — Esc للإغلاق، Ctrl +/- للتكبير والتصغير، Ctrl+P للطباعة. */
(function(){
'use strict';
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const get=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:+v}catch(x){return d}};
const put=(k,v)=>{try{localStorage.setItem(k,String(v))}catch(x){}};
const F={size:get('mq_ft_size',20),lh:get('mq_ft_lh',2),cur:null};
const paras=t=>String(t||'').replace(/[ \t]*(?:شاهد\s+[\u0621-\u064A]+\s*[:：]\s*)?(?:https?:\/\/)?(?:www\.)?maqam\.najah\.edu[^\s،,)\]]*/gi,'').replace(/\r/g,'').split(/\n{2,}|\n(?=\s*[0-9٠-٩]+[.\-)]\s)/).map(x=>x.replace(/[ \t]+/g,' ').trim()).filter(Boolean);
function hl(t,q){t=e(t);const ws=(window.MQ_rnorm?MQ_rnorm(q):String(q||'')).split(' ').filter(w=>w.length>1);if(!ws.length)return t;
 try{const re=new RegExp('('+ws.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/ا/g,'[اأإآ]').replace(/ي/g,'[يى]').replace(/ه/g,'[هة]')).join('|')+')','giu');return t.replace(re,'<mark>$1</mark>')}catch(x){return t}}

function apply(){const b=document.getElementById('ftBody');if(!b)return;b.style.fontSize=F.size+'px';b.style.lineHeight=F.lh;const s=document.getElementById('ftSz');if(s)s.textContent=F.size}
function close(){const v=document.getElementById('ftView');if(v)v.remove();document.body.classList.remove('ft-on');document.removeEventListener('keydown',keys,true);if(F.back)try{F.back.focus()}catch(x){}F.cur=null}
function keys(ev){if(!document.getElementById('ftView'))return;
 if(ev.key==='Escape'){ev.preventDefault();ev.stopPropagation();close()}
 else if((ev.ctrlKey||ev.metaKey)&&(ev.key==='+'||ev.key==='='||ev.key==='-')){ev.preventDefault();A.ftZoom(ev.key==='-'?-2:2)}
 else if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='p'){ev.preventDefault();A.ftPrint()}}

A.ftOpen=o=>{if(!o||!String(o.text||'').trim())return toast('لا يوجد نص لعرضه');close();F.cur=o;F.back=document.activeElement;
 const ps=paras(o.text);
 const v=document.createElement('div');v.id='ftView';v.setAttribute('role','dialog');v.setAttribute('aria-modal','true');v.setAttribute('aria-label',o.title||'عرض النص');v.dir='rtl';
 v.innerHTML=`<header class="ft-bar"><div class="ft-ttl"><b>${e(o.title||'النص الكامل')}</b>${o.sub?`<small>${e(o.sub)}</small>`:''}</div>
  <div class="ft-tools" role="toolbar" aria-label="أدوات العرض">
   <button type="button" class="ft-b" data-act="ftZoom" data-v="-2" title="تصغير الخط (Ctrl -)" aria-label="تصغير الخط">ا−</button>
   <span class="ft-sz" title="حجم الخط"><span id="ftSz">${F.size}</span></span>
   <button type="button" class="ft-b big" data-act="ftZoom" data-v="2" title="تكبير الخط (Ctrl +)" aria-label="تكبير الخط">ا+</button>
   <button type="button" class="ft-b" data-act="ftLh" title="تباعد الأسطر" aria-label="تباعد الأسطر">↕</button>
   <span class="ft-sep"></span>
   <button type="button" class="ft-b txt" data-act="ftCopy" title="نسخ النص">نسخ</button>
   <button type="button" class="ft-b txt pri" data-act="ftPrint" title="طباعة (Ctrl+P)">🖨 طباعة</button>
   <button type="button" class="ft-b x" data-act="ftClose" title="إغلاق (Esc)" aria-label="إغلاق">✕</button>
  </div></header>
  <main class="ft-scroll"><article class="ft-paper"><h1 class="ft-ph">${e(o.title||'')}</h1>${o.sub?`<p class="ft-ps">${e(o.sub)}</p>`:''}<div id="ftBody">${ps.map(p=>`<p>${hl(p,o.q)}</p>`).join('')}</div></article></main>`;
 document.body.appendChild(v);document.body.classList.add('ft-on');apply();document.addEventListener('keydown',keys,true);
 v.querySelector('.ft-b.x').focus();const m=v.querySelector('mark');if(m)m.scrollIntoView({block:'center'})};
A.ftClose=close;
A.ftZoom=d=>{F.size=Math.max(14,Math.min(40,F.size+Number(d||0)));put('mq_ft_size',F.size);apply()};
A.ftLh=()=>{F.lh=F.lh>=2.4?1.6:Math.round((F.lh+.4)*10)/10;put('mq_ft_lh',F.lh);apply()};
A.ftCopy=()=>{const t=F.cur?String(F.cur.text):'';(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('نُسخ النص')).catch(()=>toast('تعذّر النسخ'))};
A.ftPrint=()=>{document.body.classList.add('ft-print');setTimeout(()=>{window.print();setTimeout(()=>document.body.classList.remove('ft-print'),300)},30)};

const css=document.createElement('style');css.textContent=`
#ftView{position:fixed;inset:0;z-index:10060;display:flex;flex-direction:column;background:#f4f1ea;color:#1c1a16}
html.night #ftView{background:#15130f;color:#ece6da}
.ft-on{overflow:hidden}
.ft-bar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:10px 18px;background:#fff;border-bottom:1px solid #e6dfd0;box-shadow:0 2px 10px rgba(0,0,0,.05)}
html.night .ft-bar{background:#1f1c17;border-color:#3a342a}
.ft-ttl{flex:1;min-width:200px;display:flex;flex-direction:column}.ft-ttl b{font-size:16px}.ft-ttl small{color:#7b7262;font-size:12.5px}
.ft-tools{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.ft-b{min-width:40px;height:38px;border:1px solid #ddd3bf;background:transparent;border-radius:9px;cursor:pointer;font:inherit;font-size:15px;color:inherit;padding:0 10px}
.ft-b:hover{background:rgba(0,0,0,.05)}.ft-b.big{font-size:19px;font-weight:700}
.ft-b.pri{background:#1f2937;color:#fff;border-color:#1f2937}html.night .ft-b.pri{background:#d4b26a;color:#1c1a16;border-color:#d4b26a}
.ft-b.x{font-size:18px}
.ft-sz{min-width:32px;text-align:center;font-variant-numeric:tabular-nums;color:#7b7262;font-size:13px}
.ft-sep{width:1px;height:26px;background:#ddd3bf;margin:0 4px}
.ft-scroll{flex:1;overflow:auto;padding:28px 16px 60px}
.ft-paper{max-width:900px;margin:0 auto;background:#fffdf8;border:1px solid #ebe3d2;border-radius:14px;padding:40px clamp(18px,5vw,64px);box-shadow:0 8px 30px rgba(60,45,20,.08)}
html.night .ft-paper{background:#1c1914;border-color:#3a342a}
.ft-ph{font-size:1.35em;margin:0 0 6px;text-align:center}.ft-ps{text-align:center;color:#7b7262;margin:0 0 24px}
#ftBody p{margin:0 0 .9em;text-align:justify;white-space:pre-wrap}
#ftBody mark{background:#ffe08a;color:inherit;border-radius:3px;padding:0 2px}
@media (max-width:640px){.ft-bar{padding:8px 10px}.ft-ttl{min-width:100%}.ft-paper{padding:22px 16px;border-radius:10px}.ft-scroll{padding:12px 8px 40px}}
@media print{
 body.ft-print>*:not(#ftView){display:none!important}
 body.ft-print #ftView{position:static;display:block;background:#fff;color:#000}
 body.ft-print .ft-bar{display:none}
 body.ft-print .ft-scroll{overflow:visible;padding:0}
 body.ft-print .ft-paper{border:0;box-shadow:none;max-width:none;padding:0;background:#fff}
 body.ft-print #ftBody mark{background:none;font-weight:700}
}`;document.head.appendChild(css);
})();
