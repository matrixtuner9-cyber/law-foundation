/* ── محرك الطباعة الموحد · ميثاق ──
   محرك واحد لكل ما يُطبع في النظام: ملفات القضايا، بطاقات الموكلين، كشوف الحساب، سندات القبض،
   النماذج والعقود، جداول الجلسات، والسجلات. يرقّم الصفحات بنفسه (فالمعاينة مطابقة للورقة حرفياً)،
   ويكرر رؤوس الجداول، ويمنع انقسام الصفوف والعناوين، ويضع الترويسة والتذييل والعلامة المائية وبصمة المستند. */
(function(){
const P=window.MQP={};
const PAPER={A4:[210,297],A5:[148,210],Letter:[216,279]};
const DEF={paper:'A4',orient:'auto',head:true,mark:'',size:13,eco:false,sign:true,hijri:true};
const ld=()=>{try{return {...DEF,...JSON.parse(localStorage.getItem('mq_print')||'{}')}}catch(e){return {...DEF}}};
const sv=o=>{try{localStorage.setItem('mq_print',JSON.stringify(o))}catch(e){}};
let OPT=ld(),CUR=null,LIST=[];

/* ── أدوات ── */
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const two=n=>String(n).padStart(2,'0');
const isoD=d=>d.getFullYear()+'-'+two(d.getMonth()+1)+'-'+two(d.getDate());
const dm=s=>{if(!s)return '—';const [y,m,d]=String(s).slice(0,10).split('-').map(Number);return d+'/'+m+'/'+y};
const hijri=d=>{try{return new Intl.DateTimeFormat('ar-u-ca-islamic-umalqura-nu-latn',{day:'numeric',month:'long',year:'numeric'}).format(d)}catch(x){return ''}};
const nowS=()=>{const n=new Date();return dm(isoD(n))+' '+two(n.getHours())+':'+two(n.getMinutes())};
const cur=n=>Number(n||0).toLocaleString('en-US');
const fp=s=>{let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0}const x=h.toString(16).toUpperCase().padStart(8,'0');return x.slice(0,4)+'-'+x.slice(4)};
P.esc=e;P.dm=dm;

/* تفقيط المبالغ بالعربية: 5250 ← خمسة آلاف ومئتان وخمسون */
const ONES=['','واحد','اثنان','ثلاثة','أربعة','خمسة','ستة','سبعة','ثمانية','تسعة','عشرة','أحد عشر','اثنا عشر','ثلاثة عشر','أربعة عشر','خمسة عشر','ستة عشر','سبعة عشر','ثمانية عشر','تسعة عشر'];
const TENS=['','','عشرون','ثلاثون','أربعون','خمسون','ستون','سبعون','ثمانون','تسعون'];
const HUN=['','مائة','مئتان','ثلاثمائة','أربعمائة','خمسمائة','ستمائة','سبعمائة','ثمانمائة','تسعمائة'];
function w999(n){const h=Math.floor(n/100),r=n%100,p=[];if(h)p.push(HUN[h]);if(r){if(r<20)p.push(ONES[r]);else{const o=r%10,t=Math.floor(r/10);p.push(o?ONES[o]+' و'+TENS[t]:TENS[t])}}return p.join(' و')}
function scale(n,one,two,few,many){if(!n)return '';if(n===1)return one;if(n===2)return two;if(n<=10)return w999(n)+' '+few;return w999(n)+' '+many}
P.words=function(v){v=Math.floor(Math.abs(Number(v)||0));if(!v)return 'صفر';
 const m=Math.floor(v/1e6)%1000,t=Math.floor(v/1e3)%1000,r=v%1000,p=[];
 if(m)p.push(scale(m,'مليون','مليونان','ملايين','مليون'));
 if(t)p.push(scale(t,'ألف','ألفان','آلاف','ألف'));
 if(r)p.push(w999(r));
 return p.join(' و')};
P.amount=v=>'فقط '+P.words(v)+' شيكل لا غير';

/* ── لبنات المستند ── */
const B=P.B={
 h:t=>`<h2 class="ph">${e(t)}</h2>`,
 p:(t,cls)=>`<p class="pp ${cls||''}">${t}</p>`,
 kv:(rows,cols=2)=>{const r=rows.filter(Boolean);let h='';for(let i=0;i<r.length;i+=cols){h+='<tr>'+r.slice(i,i+cols).map(([a,b,c])=>`<th>${e(a)}</th><td${c?' class="'+c+'"':''}>${b??'—'}</td>`).join('')+(r.slice(i,i+cols).length<cols?'<th></th><td></td>'.repeat(cols-r.slice(i,i+cols).length):'')+'</tr>'}return `<table class="kv c${cols}"><tbody>${h}</tbody></table>`},
 t:(head,rows,o={})=>`<table class="pt${o.cls?' '+o.cls:''}"><thead><tr>${head.map((x,i)=>`<th${o.w&&o.w[i]?` style="width:${o.w[i]}"`:''}${o.num&&o.num.includes(i)?' class="n"':''}>${e(x)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map((c,i)=>`<td${o.num&&o.num.includes(i)?' class="n"':''}>${c??''}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${head.length}" class="empty">لا توجد بيانات</td></tr>`}</tbody>${o.foot?`<tfoot><tr>${o.foot.map((c,i)=>`<td${o.num&&o.num.includes(i)?' class="n"':''}>${c??''}</td>`).join('')}</tr></tfoot>`:''}</table>`,
 stats:a=>`<div class="pstats">${a.map(([l,v,c])=>`<div class="${c||''}"><b>${v}</b><span>${e(l)}</span></div>`).join('')}</div>`,
 box:(t,cls)=>`<div class="pbox ${cls||''}">${t}</div>`,
 sp:()=>`<div class="psp"></div>`,
 br:()=>`<div class="pbr"></div>`
};

/* ── الرؤوس والتذييل ── */
const SEAL=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v17M7 20h10M4 7h16M6 7l-3 6a3 3 0 0 0 6 0L6 7zm12 0l-3 6a3 3 0 0 0 6 0l-3-6z"/><circle cx="12" cy="4" r=".9" fill="currentColor"/></svg>`;
function office(){const s=(window.MQ&&MQ.settings)||{};return {name:s.officeName||OFFICE.name,lawyer:s.lawyerName||OFFICE.lawyer,city:s.city||OFFICE.city,phone:s.phone||'',email:s.email||'',address:s.address||'',license:s.license||'',tag:s.tagline||'محامون ومستشارون قانونيون'}}
function headFull(o,d){return `<header class="lh">
 <div class="lh-r"><b>${e(o.name)}</b><span>${e(o.tag)}</span><span>${e(o.lawyer)}${o.license?' · عضوية النقابة '+e(o.license):''}</span></div>
 <div class="lh-c"><div class="seal">${SEAL}</div></div>
 <div class="lh-l">${o.address||o.city?`<span>${e(o.address||o.city)}${o.address&&o.city&&!o.address.includes(o.city)?' · '+e(o.city):''}</span>`:''}${o.phone?`<span dir="ltr">${e(o.phone)}</span>`:''}${o.email?`<span dir="ltr">${e(o.email)}</span>`:''}</div>
</header><div class="lh-rule"><i></i><i></i></div>`}
function headMini(o,d){return `<header class="lh mini"><span>${e(o.name)}</span><span>${e(d.title)}${d.ref?' · '+e(d.ref):''}</span></header><div class="lh-rule thin"><i></i></div>`}
function titleBlock(d){const now=new Date();return `<div class="ttl"><h1>${e(d.title)}</h1>${d.sub?`<div class="sub">${e(d.sub)}</div>`:''}
 <div class="meta">${d.ref?`<span>الرقم المرجعي: <b dir="ltr">${e(d.ref)}</b></span>`:''}<span>التاريخ: <b>${dm(isoD(now))} م</b></span>${OPT.hijri&&hijri(now)?`<span>الموافق: <b>${e(hijri(now))}</b></span>`:''}</div></div>`}
function signBlock(d){const s=d.sign||[];if(!s.length)return '';return `<div class="sign">${s.map(x=>`<div><span>${e(x)}</span><i></i><small>الاسم والتوقيع</small></div>`).join('')}${d.stamp===true?'<div class="stamp"><span>ختم المكتب</span></div>':''}</div>`}

/* ── بناء المستند داخل إطار المعاينة ── */
const FONT=location.origin+'/fonts/fonts.css'; /* خطوط مضمّنة محلياً */
function shell(d,o){
 const [pw,ph]=PAPER[OPT.paper]||PAPER.A4;const land=(OPT.orient==='auto'?d.orient==='land':OPT.orient==='land');
 const W=land?ph:pw,H=land?pw:ph;
 return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${e(d.file||d.title)}</title>
<link rel="stylesheet" href="${FONT}"><style>${CSS(W,H)}</style></head>
<body class="${OPT.eco?'eco':''} ${OPT.paper==='A5'?'a5':''}" style="--fs:${OPT.paper==='A5'?OPT.size-1.5:OPT.size}pt">
<div id="src">${d.noTitle?'':titleBlock(d)}${d.blocks.join('')}${OPT.sign&&d.sign&&d.sign.length?signBlock(d):''}</div>
<div id="pages"></div>
<template id="tFirst"><section class="sheet">${OPT.head?headFull(o,d):'<div class="blank-head"></div>'}<div class="pbody"></div>${foot(o,d)}${(d.mark||OPT.mark)?`<div class="wm">${e(d.mark||OPT.mark)}</div>`:''}</section></template>
<template id="tNext"><section class="sheet">${OPT.head?headMini(o,d):'<div class="blank-head mini"></div>'}<div class="pbody"></div>${foot(o,d)}${(d.mark||OPT.mark)?`<div class="wm">${e(d.mark||OPT.mark)}</div>`:''}</section></template>
</body></html>`}
function foot(o,d){return `<footer class="pf"><span>${e(o.name)}${o.phone?' · <span dir="ltr">'+e(o.phone)+'</span>':''}</span><span class="pg">صفحة <b class="pn">1</b> من <b class="pt2">1</b></span><span>بصمة <b dir="ltr" class="fpr"></b> · طُبع ${nowS()}${window.MQ&&MQ.user?' · '+e(MQ.user.name||MQ.user.username):''}</span></footer>`}

/* التقسيم إلى صفحات: يقيس كل لبنة بالخط الفعلي ويوزعها، ويقسم الجداول صفاً صفاً مع تكرار الرأس */
function paginate(doc){
 const src=doc.getElementById('src'),pages=doc.getElementById('pages');
 const tpl=id=>doc.getElementById(id).content.firstElementChild.cloneNode(true);
 let body;const add=first=>{const s=tpl(first?'tFirst':'tNext');pages.appendChild(s);body=s.querySelector('.pbody');return body};
 const over=()=>body.scrollHeight>body.clientHeight+1;
 add(true);
 const blocks=[...src.children];
 for(let i=0;i<blocks.length;i++){const b=blocks[i];
  if(b.classList&&b.classList.contains('pbr')){if(body.children.length)add(false);continue} /* فاصل صفحة صريح */
  body.appendChild(b);
  if(!over())continue;
  if(b.tagName==='TABLE'&&b.classList.contains('pt')&&b.tBodies[0]&&b.tBodies[0].rows.length>1){
   const rows=[...b.tBodies[0].rows],tf=b.tFoot;b.tBodies[0].innerHTML='';if(tf)tf.remove();
   let t=b;
   if(over()){t.remove();const prev=body.lastElementChild;add(false);if(prev&&prev.classList.contains('ph')&&prev.parentNode!==body){body.appendChild(prev)}body.appendChild(t)}
   for(const r of rows){t.tBodies[0].appendChild(r);if(over()&&t.tBodies[0].rows.length>1){r.remove();const n=t.cloneNode(false);n.appendChild(t.tHead.cloneNode(true));n.appendChild(doc.createElement('tbody'));n.classList.add('cont');add(false);body.appendChild(n);n.tBodies[0].appendChild(r);t=n}}
   if(tf){t.appendChild(tf);if(over()){tf.remove();const n=t.cloneNode(false);n.appendChild(t.tHead.cloneNode(true));n.appendChild(doc.createElement('tbody'));n.appendChild(tf);n.classList.add('cont');add(false);body.appendChild(n)}}
   continue}
  if(body.children.length>1){b.remove();const prev=body.lastElementChild;add(false);
   if(prev&&prev.classList.contains('ph')){body.appendChild(prev)} /* لا يبقى عنوان يتيماً أسفل الصفحة */
   body.appendChild(b)}
  /* لبنة أطول من صفحة كاملة: تُقسم فقراتها */
  if(over()&&b.classList.contains('pp-flow')){const kids=[...b.childNodes];b.innerHTML='';let cur=b;for(const k of kids){cur.appendChild(k);if(over()&&cur.childNodes.length>1){k.remove();const n=b.cloneNode(false);add(false);body.appendChild(n);n.appendChild(k);cur=n}}}
 }
 const ss=[...pages.children],txt=src.textContent+pages.textContent;const f=fp(txt);
 ss.forEach((s,i)=>{s.querySelector('.pn').textContent=i+1;s.querySelector('.pt2').textContent=ss.length;s.querySelector('.fpr').textContent=f});
 src.remove();return ss.length}

/* ── نافذة المعاينة ── */
const UICSS=`
.pv-bg{position:fixed;inset:0;z-index:300;background:rgb(11 27 43/.55);backdrop-filter:blur(3px);display:flex;align-items:stretch;justify-content:center;padding:18px;animation:pvIn .18s ease-out}
@keyframes pvIn{from{opacity:0}to{opacity:1}}
.pv{width:min(1240px,100%);background:#F9F6EF;border-radius:14px;display:grid;grid-template-columns:300px 1fr;overflow:hidden;box-shadow:0 30px 80px rgb(0 0 0/.35);font-family:Cairo,sans-serif;color:#111B27}
.pv-side{background:#0B1B2B;color:#F9F6EF;padding:18px 18px 16px;display:flex;flex-direction:column;gap:12px;overflow:auto;border-left:1px solid #B9965A}
.pv-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}.pv-h b{font-size:17px;color:#E6C77A}
.pv-x{background:transparent;border:1px solid rgb(249 246 239/.25);color:#F9F6EF;width:30px;height:30px;border-radius:8px;cursor:pointer}
.pv-side label{display:flex;flex-direction:column;gap:5px;font-size:12.5px;color:rgb(249 246 239/.8)}
.pv-side select{background:#13263A;color:#F9F6EF;border:1px solid rgb(185 150 90/.35);border-radius:8px;padding:7px 8px;font:inherit;font-size:13px}
.pv-g{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pv-side .pvck{flex-direction:row;align-items:flex-start;gap:8px;font-size:12.5px}.pv-side .pvck small{display:block;color:rgb(249 246 239/.55);font-size:11px}
.pv-side .pvck input{margin-top:3px;accent-color:#B9965A}
.pv-info{font-size:12.5px;color:#E6C77A;background:rgb(185 150 90/.12);border-radius:8px;padding:8px 10px}
.pv-act{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:auto}
.pv-act .btn{justify-content:center;height:40px}
.pv-act .btn.gold{background:#B9965A;color:#0B1B2B;border:0;font-weight:700}.pv-act .btn.gold:hover{background:#8B6F3D;color:#F9F6EF}
.pv-act .btn:not(.gold){background:transparent;color:#F9F6EF;border:1px solid rgb(249 246 239/.3)}
.pv-tip{font-size:11.5px;line-height:1.6;color:rgb(249 246 239/.55);margin:0}
.pv-f{border:1px solid rgb(185 150 90/.3);border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;gap:6px}.pv-f legend{color:#E6C77A;font-size:12px;padding:0 4px}
.pv-main{position:relative;background:#E9E4DA;min-width:0}
#pvF{width:100%;height:100%;border:0;display:block;background:#E9E4DA}
.pv-load{position:absolute;inset:0;display:grid;place-items:center;color:#8B6F3D;font-weight:600;background:#E9E4DA}
.pv-load[hidden]{display:none}
@media (max-width:900px){.pv{grid-template-columns:1fr;grid-template-rows:auto 1fr}.pv-side{max-height:44vh;border-left:0;border-bottom:1px solid #B9965A}.pv-main{min-height:55vh}.pv-bg{padding:0}.pv{border-radius:0;height:100%}.pv-bg{align-items:stretch}}
@media print{.pv-bg{display:none!important}}
`;
function ui(){return `<style>${UICSS}</style><div class="pv-bg" id="pvBg"><div class="pv" role="dialog" aria-label="معاينة الطباعة">
 <aside class="pv-side">
  <div class="pv-h"><b>معاينة الطباعة</b><button class="ib pv-x" data-act="pvClose" aria-label="إغلاق">✕</button></div>
  ${LIST.length>1?`<label>المستند<select id="pvDoc">${LIST.map((x,i)=>`<option value="${i}" ${x===CUR?'selected':''}>${e(x.label)}</option>`).join('')}</select></label>`:''}
  ${CUR&&CUR.opts?CUR.opts():''}
  <div class="pv-g"><label>حجم الورق<select id="pvPaper">${Object.keys(PAPER).map(k=>`<option ${OPT.paper===k?'selected':''}>${k}</option>`).join('')}</select></label>
  <label>الاتجاه<select id="pvOr"><option value="auto" ${OPT.orient==='auto'?'selected':''}>تلقائي</option><option value="port" ${OPT.orient==='port'?'selected':''}>عمودي</option><option value="land" ${OPT.orient==='land'?'selected':''}>أفقي</option></select></label></div>
  <div class="pv-g"><label>حجم الخط<select id="pvSz">${[11,12,13,14,15].map(n=>`<option value="${n}" ${+OPT.size===n?'selected':''}>${n}</option>`).join('')}</select></label>
  <label>علامة مائية<select id="pvMk">${[['','بدون'],['مسودة','مسودة'],['نسخة','نسخة'],['سري','سري'],['نسخة الموكل','نسخة الموكل']].map(([v,l])=>`<option value="${v}" ${OPT.mark===v?'selected':''}>${l}</option>`).join('')}</select></label></div>
  <label class="pvck"><input type="checkbox" id="pvHead" ${OPT.head?'checked':''}><span>ترويسة المكتب</span> <small>ألغِها عند الطباعة على ورق مروّس جاهز</small></label>
  <label class="pvck"><input type="checkbox" id="pvSign" ${OPT.sign?'checked':''}><span>خانات التوقيع والختم</span></label>
  <label class="pvck"><input type="checkbox" id="pvHj" ${OPT.hijri?'checked':''}><span>التاريخ الهجري الموافق</span></label>
  <label class="pvck"><input type="checkbox" id="pvEco" ${OPT.eco?'checked':''}><span>طباعة اقتصادية بالأسود</span></label>
  <div class="pv-info" id="pvInfo">…</div>
  <div class="pv-act"><button class="btn gold" data-act="pvPrint">طباعة</button><button class="btn" data-act="pvPdf">حفظ PDF</button></div>
  <p class="pv-tip">لحفظ PDF اختر «حفظ بتنسيق PDF» في نافذة الطباعة، وأبقِ «الرؤوس والتذييلات» مُلغاة و«رسومات الخلفية» مفعّلة.</p>
 </aside>
 <div class="pv-main"><iframe id="pvF" title="معاينة المستند"></iframe><div class="pv-load" id="pvLoad">جارٍ تجهيز الصفحات…</div></div>
</div></div>`}

let gen=0;
async function draw(){
 const f=document.getElementById('pvF');if(!f||!CUR)return;const my=++gen;
 document.getElementById('pvLoad').hidden=false;
 const d=CUR.build();CUR.last=d;
 f.srcdoc=shell(d,office());
 await new Promise(r=>f.onload=r);if(my!==gen)return;
 const doc=f.contentDocument;
 try{await Promise.race([Promise.all(['400 16px Amiri','700 16px Amiri','600 12px Cairo'].map(x=>doc.fonts.load(x))).then(()=>doc.fonts.ready),new Promise(r=>setTimeout(r,3500))])}catch(x){}
 if(my!==gen)return;
 const n=paginate(doc);fit();
 document.getElementById('pvInfo').innerHTML=`<b>${n}</b> ${n===1?'صفحة':n===2?'صفحتان':n<=10?'صفحات':'صفحة'} · ${OPT.paper} ${(doc.querySelector('.sheet')||{}).offsetWidth>(doc.querySelector('.sheet')||{}).offsetHeight?'أفقي':'عمودي'}`;
 document.getElementById('pvLoad').hidden=true}
function fit(){const f=document.getElementById('pvF');if(!f||!f.contentDocument)return;const doc=f.contentDocument,s=doc.querySelector('.sheet');if(!s)return;
 const z=Math.min(1.25,(f.clientWidth-40)/s.offsetWidth);doc.getElementById('pages').style.zoom=z>0?z:1}
addEventListener('resize',()=>{if(document.getElementById('pvF'))fit()});

P.open=function(list,idx=0){LIST=Array.isArray(list)?list:[list];CUR=LIST[idx]||LIST[0];
 document.getElementById('modal').innerHTML=ui();bind();draw()};
function bind(){
 const g=id=>document.getElementById(id);
 const on=(id,fn)=>{const x=g(id);if(x)x.onchange=fn};
 on('pvDoc',ev=>{CUR=LIST[+ev.target.value];document.getElementById('modal').innerHTML=ui();bind();draw()});
 on('pvPaper',ev=>{OPT.paper=ev.target.value;sv(OPT);draw()});
 on('pvOr',ev=>{OPT.orient=ev.target.value;sv(OPT);draw()});
 on('pvSz',ev=>{OPT.size=+ev.target.value;sv(OPT);draw()});
 on('pvMk',ev=>{OPT.mark=ev.target.value;sv(OPT);draw()});
 [['pvHead','head'],['pvSign','sign'],['pvHj','hijri'],['pvEco','eco']].forEach(([id,k])=>on(id,ev=>{OPT[k]=ev.target.checked;sv(OPT);draw()}));
 document.querySelectorAll('#pvBg [data-po]').forEach(x=>x.onchange=()=>{CUR.state=CUR.state||{};CUR.state[x.dataset.po]=x.type==='checkbox'?x.checked:x.value;draw()});
 g('pvBg').addEventListener('click',ev=>{if(ev.target.id==='pvBg')A.pvClose()});
}
A.pvClose=()=>{gen++;document.getElementById('modal').innerHTML=''};
A.pvPrint=()=>{const f=document.getElementById('pvF');if(!f||document.getElementById('pvLoad').hidden===false)return toast('انتظر اكتمال تجهيز الصفحات');
 const z=f.contentDocument.getElementById('pages');const old=z.style.zoom;z.style.zoom=1;
 if(window.MQ&&MQ.audit)try{MQ.audit('print',CUR.last&&CUR.last.title)}catch(x){}
 f.contentWindow.focus();f.contentWindow.print();setTimeout(()=>{z.style.zoom=old},400)};
A.pvPdf=()=>{toast('اختر «حفظ بتنسيق PDF» كوجهة الطباعة');A.pvPrint()};

/* ── أنماط الورقة ── */
function CSS(W,H){return `
@page{size:${W}mm ${H}mm;margin:0}
*{box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
body{margin:0;background:#E9E4DA;font-family:Amiri,'Traditional Arabic','Simplified Arabic','Times New Roman',serif;font-size:var(--fs);color:#111B27;font-variant-numeric:lining-nums tabular-nums;font-kerning:normal}
#src{position:absolute;visibility:hidden;width:${W-36}mm}
#pages{padding:18px 0;display:flex;flex-direction:column;align-items:center;gap:18px}
.sheet{position:relative;width:${W}mm;height:${H}mm;background:#fff;padding:${H<220?10:13}mm ${W<160?12:17}mm ${H<220?8:10}mm;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 1px 2px rgb(0 0 0/.08),0 8px 28px rgb(11 27 43/.16)}
.pbody{flex:1;min-height:0;overflow:hidden;position:relative;z-index:1}
@media print{body{background:#fff}#pages{padding:0;gap:0;display:block;zoom:1!important}.sheet{box-shadow:none;break-after:page;page-break-after:always}.sheet:last-child{break-after:auto;page-break-after:auto}}
/* الترويسة */
.lh{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:6mm;color:#0B1B2B}
.lh-r{display:flex;flex-direction:column;gap:.6mm}.lh-r b{font-size:1.55em;line-height:1.25;font-weight:700}.lh-r span{font-family:Cairo,sans-serif;font-size:.62em;color:#3c4a5a;font-weight:600}
.lh-l{display:flex;flex-direction:column;gap:.8mm;align-items:flex-end;text-align:left;font-family:Cairo,sans-serif;font-size:.62em;color:#3c4a5a;font-weight:500}
.seal{width:17mm;height:17mm;border-radius:50%;display:grid;place-items:center;color:#B9965A;background:#0B1B2B;box-shadow:0 0 0 .6mm #fff,0 0 0 1mm #B9965A}.seal svg{width:10mm;height:10mm}
.lh-rule{display:flex;flex-direction:column;gap:.7mm;margin:3.5mm 0 4mm}.lh-rule i{display:block;height:.9mm;background:#0B1B2B}.lh-rule i+i{height:.3mm;background:#B9965A}
.lh-rule.thin{margin:2mm 0 4mm}.lh-rule.thin i{height:.3mm;background:#B9965A}
.lh.mini{display:flex;justify-content:space-between;font-family:Cairo,sans-serif;font-size:.62em;font-weight:600;color:#3c4a5a}
.blank-head{height:30mm}.blank-head.mini{height:8mm}
/* العنوان */
.ttl{text-align:center;margin:0 0 5mm}.ttl h1{margin:0;font-size:1.7em;font-weight:700;color:#0B1B2B;letter-spacing:0}
.ttl .sub{font-size:.95em;color:#4b5563;margin-top:1mm}
.ttl .meta{display:flex;justify-content:center;flex-wrap:wrap;gap:2mm 7mm;margin-top:2.5mm;font-family:Cairo,sans-serif;font-size:.62em;color:#4b5563}.ttl .meta b{color:#111B27;font-weight:600}
.ttl:after{content:"";display:block;width:26mm;height:.4mm;background:#B9965A;margin:3mm auto 0}
/* المحتوى */
.ph{font-size:1.08em;font-weight:700;color:#0B1B2B;margin:5mm 0 2mm;padding-bottom:1mm;border-bottom:.3mm solid #E2D3B6;display:flex;align-items:center;gap:2mm}
.ph:before{content:"";width:1.3mm;height:1.3em;background:#B9965A;border-radius:.3mm}
.pp{margin:0 0 2.2mm;line-height:1.9;text-align:justify;text-justify:inter-word;orphans:3;widows:3}
.pp.c{text-align:center}.pp.b{font-weight:700}.pp.big{font-size:1.25em;font-weight:700;text-align:center;color:#0B1B2B;margin:2mm 0 4mm}.pp.r{text-align:right;font-weight:700}
.pp.gap{height:2.5mm;margin:0}
.pp.s{font-size:.82em;color:#6B5B45;overflow-wrap:anywhere}
.pp.q{border-right:.8mm solid #C9A87A;background:#FBF8F2;padding:2mm 3.5mm;margin:0 0 3mm;font-family:Amiri,serif;font-size:1.05em}
.psp{height:4mm}
table{width:100%;border-collapse:collapse;margin:0 0 3mm}
.kv th{font-family:Cairo,sans-serif;font-size:.64em;font-weight:600;color:#4b5563;text-align:right;white-space:nowrap;padding:1.6mm 2.2mm;background:#F7F2E7;border:.25mm solid #E5DAC6;width:1%}
.kv td{padding:1.6mm 2.6mm;border:.25mm solid #E5DAC6;font-size:.92em}
.pt{font-size:.82em}
.pt thead th{font-family:Cairo,sans-serif;font-size:.78em;font-weight:700;color:#fff;background:#0B1B2B;padding:1.8mm 2mm;text-align:right;border:.25mm solid #0B1B2B}
.pt td{padding:1.5mm 2mm;border-bottom:.25mm solid #E5DAC6;vertical-align:top;line-height:1.45}
.pt tbody tr:nth-child(even) td{background:#FBF8F2}
.pt tr{break-inside:avoid}
.pt .n{text-align:left;direction:ltr;white-space:nowrap;font-variant-numeric:tabular-nums}
.pt tfoot td{font-weight:700;background:#F2EAD9;border-top:.5mm solid #B9965A;padding:1.8mm 2mm}
.pt.cont thead th{background:#1F2D3D}
.pt .empty{text-align:center;color:#6B7280;padding:4mm}
.pt small{display:block;color:#6B7280;font-size:.85em}
.mono{font-family:'IBM Plex Mono',Consolas,monospace;direction:ltr;unicode-bidi:isolate;font-size:.9em}
.pstats{display:grid;grid-template-columns:repeat(auto-fit,minmax(30mm,1fr));gap:2.5mm;margin:0 0 3mm}
.pstats>div{border:.3mm solid #E5DAC6;border-radius:1.5mm;padding:2mm 3mm;background:#FBF8F2;border-top:.8mm solid #B9965A}
.pstats b{display:block;font-size:1.25em;color:#0B1B2B;font-variant-numeric:tabular-nums}.pstats span{font-family:Cairo,sans-serif;font-size:.6em;color:#4b5563;font-weight:600}
.pstats .warn{border-top-color:#F59E0B}.pstats .ok{border-top-color:#22C55E}.pstats .bad{border-top-color:#EF4444}
.pbox{border:.3mm solid #E5DAC6;border-radius:1.5mm;padding:3mm 4mm;margin:0 0 3mm;background:#FBF8F2;line-height:1.8}
.pbox.ok{border-color:#22C55E;background:#F0FDF4}.pbox.bad{border-color:#EF4444;background:#FEF2F2}.pbox.warn{border-color:#F59E0B;background:#FFFBEB}
.pbox.amt{text-align:center;font-size:1.1em;font-weight:700;border-style:dashed;border-color:#B9965A}
.tag{display:inline-block;font-family:Cairo,sans-serif;font-size:.72em;font-weight:600;padding:0 2mm;border-radius:1mm;background:#EADCC6;color:#5b4520}
.tag.ok{background:#DCFCE7;color:#166534}.tag.warn{background:#FEF3C7;color:#92400E}.tag.bad{background:#FEE2E2;color:#991B1B}
/* التوقيع */
.sign{display:flex;gap:10mm;align-items:flex-end;margin-top:9mm;break-inside:avoid}
.sign>div{flex:1;display:flex;flex-direction:column;gap:1.5mm;font-weight:700;color:#0B1B2B}
.sign i{display:block;border-bottom:.3mm dotted #6B7280;height:12mm}.sign small{font-family:Cairo,sans-serif;font-size:.58em;color:#6B7280;font-weight:500}
.sign .stamp{flex:0 0 26mm;height:26mm;border:.4mm dashed #B9965A;border-radius:50%;display:grid;place-items:center;text-align:center}
.sign .stamp span{font-family:Cairo,sans-serif;font-size:.58em;color:#8B6F3D;font-weight:600}
/* التذييل */
.pf{display:grid;grid-template-columns:1fr auto 1fr;gap:4mm;align-items:end;margin-top:3mm;padding-top:2mm;border-top:.3mm solid #E2D3B6;font-family:Cairo,sans-serif;font-size:.54em;color:#6B7280;position:relative;z-index:1}
.pf>span:last-child{text-align:left}.pf .pg{font-size:1.15em;color:#0B1B2B}.pf b{font-weight:600}
.wm{position:absolute;inset:0;display:grid;place-items:center;font-size:${Math.round(W/4.2)}pt;font-weight:700;color:rgb(11 27 43/.055);transform:rotate(-32deg);pointer-events:none;z-index:0;white-space:nowrap}
/* اقتصادي */
body.eco .seal{background:#fff;color:#111;box-shadow:0 0 0 .4mm #111}.body.eco .lh-rule i{background:#111}
body.eco .pt thead th{background:#fff;color:#111;border-bottom:.6mm solid #111}body.eco .pt tbody tr:nth-child(even) td{background:none}
body.eco .lh-rule i{background:#111}body.eco .lh-rule i+i,body.eco .ttl:after,body.eco .ph:before{background:#777}
body.eco .kv th,body.eco .pstats>div,body.eco .pbox,body.eco .pt tfoot td{background:none}
body.eco .lh,body.eco .ttl h1,body.eco .ph{color:#111}
body.a5 .lh-r b{font-size:1.3em}body.a5 .seal{width:13mm;height:13mm}body.a5 .seal svg{width:8mm;height:8mm}
`}

/* ═════════ مكتبة المستندات ═════════ */
const D=P.D={};
const caseHearings=k=>hearings.filter(h=>h.k===k.id).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
const clientCases=c=>cases.filter(k=>k.client===c.id);
const pays=c=>(c.payments||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
const fname=(t,x)=>(t+' - '+x).replace(/[\\/:*?"<>|]+/g,'-');

D.case=kid=>({label:'ملف القضية الكامل',build(){const k=K(kid),c=C(k.client),ct=CT(k.court),hs=caseHearings(k),nh=nextH(k.id);
 const dl=deadlines.filter(x=>x.k===k.id).sort((a,b)=>a.due.localeCompare(b.due)),ds=docs.filter(x=>x.k===k.id).sort((a,b)=>a.date.localeCompare(b.date));
 const st=this.state||{};
 const bl=[B.kv([['رقم الدعوى',`<span class="mono">${e(k.no)}</span>`],['نوع القضية',e(k.type)],['المحكمة',e(ct.name)],['الحالة',`<span class="tag">${e(k.status)}</span>`],['المرحلة',e(k.stage)],['الأولوية',e(k.pri)],['تاريخ الفتح',dm(k.opened)],['قيمة الدعوى',cur(k.value)+' ₪'],['مرجع ميزان',`<span class="mono">${e(k.mz)}</span>`],['الجلسة القادمة',nh?dm(nh.date)+' · '+e(nh.time):'لا جلسة محددة']]),
  B.h('أطراف الدعوى'),
  B.t(['الطرف','الصفة','الاسم','الهاتف / الوكيل'],[['الموكل',e(k.role),'<b>'+e(c.name)+'</b>','<span class="mono">'+e(c.phone)+'</span>'],...k.opps.map(o=>{const x=O(o);return ['الخصم','—','<b>'+e(x.name)+'</b>',e(x.lawyer||'—')]})],{w:['16%','16%','38%','30%']})];
 if(st.hear!==false){bl.push(B.h('سجل الجلسات ('+hs.length+')'),B.t(['#','التاريخ','الوقت','الغاية','القرار / النتيجة'],hs.map((h,i)=>[i+1,dm(h.date),h.time||'',e(h.purpose)+(h.attend?'<small>حضور الموكل مطلوب</small>':''),h.result?e(h.result):(diff(h.date)>=0?'<span class="tag warn">قادمة</span>':'—')]),{w:['6%','13%','9%','34%','38%'],num:[0,1,2]}))}
 if(st.dl!==false&&dl.length){bl.push(B.h('المهل القانونية'),B.t(['المهلة','النوع','الاستحقاق','الوضع'],dl.map(x=>{const n=diff(x.due);return [e(x.title),e(x.kind||''),dm(x.due),n<0?'<span class="tag bad">منقضية</span>':n<=3?'<span class="tag warn">بعد '+n+' يوم</span>':'<span class="tag ok">متبقٍ '+n+' يوماً</span>']}),{w:['50%','16%','15%','19%'],num:[2]}))}
 if(st.docs!==false){bl.push(B.h('المستندات ('+ds.length+')'),B.t(['المستند','النوع','المصدر','التاريخ','صفحات'],ds.map(d=>['<b>'+e(d.title)+'</b>',e(d.kind),e(d.src),dm(d.date),d.pages||'']),{w:['42%','18%','18%','13%','9%'],num:[3,4]}))}
 return {title:'ملخص ملف قضية',sub:k.subject,ref:'ق/'+k.no,file:fname('ملف قضية',k.no),blocks:bl,sign:['المحامي المسؤول']}},
 opts:()=>`<fieldset class="pv-f"><legend>الأقسام</legend><label class="pvck"><input type="checkbox" data-po="hear" checked><span>سجل الجلسات</span></label><label class="pvck"><input type="checkbox" data-po="dl" checked><span>المهل</span></label><label class="pvck"><input type="checkbox" data-po="docs" checked><span>المستندات</span></label></fieldset>`});

D.client=cid=>({label:'بطاقة الموكل',build(){const c=C(cid),ks=clientCases(c);
 return {title:'بطاقة موكل',sub:c.name,ref:'م/'+c.code,file:fname('بطاقة موكل',c.name),blocks:[
  B.kv([['الاسم','<b>'+e(c.name)+'</b>'],['الصفة',e(c.type)],['رقم الهوية / التسجيل',`<span class="mono">${e(c.idNo)}</span>`],['الهاتف',`<span class="mono">${e(c.phone)}</span>`],['واتساب',`<span class="mono">${e(c.whatsapp||c.phone)}</span>`],['البريد الإلكتروني',e(c.email||'—')],['المدينة',e(c.city)],['العنوان',e(c.address||'—')],['قناة التواصل المفضلة',e(c.ch)],['موكل منذ',dm(c.since)],['رمز البوابة',`<span class="mono">${e(c.code)}</span>`],['حالة البوابة',c.portal?'<span class="tag ok">مفعّلة</span>':'<span class="tag">غير مفعّلة</span>']]),
  B.h('القضايا ('+ks.length+')'),
  B.t(['رقم الدعوى','الموضوع','المحكمة','الخصم','المرحلة','الجلسة القادمة'],ks.map(k=>{const h=nextH(k.id);return [`<span class="mono">${e(k.no)}</span>`,e(k.subject),e(CT(k.court).name),e(oppNames(k)),e(k.stage),h?dm(h.date):'—']}),{w:['13%','27%','17%','17%','14%','12%'],num:[5]}),
  B.h('الأتعاب'),
  B.stats([['الأتعاب المتفق عليها',cur(c.fee)+' ₪'],['المدفوع',cur(c.paid)+' ₪','ok'],['المتبقي',cur(c.fee-c.paid)+' ₪',c.fee>c.paid?'warn':'ok']])
 ],sign:[]}}});

D.statement=cid=>({label:'كشف حساب الأتعاب',build(){const c=C(cid),ps=pays(c);let bal=c.fee;
 const rows=[[dm(c.since),'الأتعاب المتفق عليها','—',cur(c.fee),'',cur(c.fee)]];
 ps.forEach(p=>{bal-=p.amount;rows.push([dm(p.date),'دفعة'+(p.method?' · '+e(p.method):'')+(payInfo(p)?'<br><small>'+e(payInfo(p))+'</small>':''),`<span class="mono">${e(p.no||'')}</span>`,'',cur(p.amount),cur(bal)])});
 const legacy=c.paid-ps.reduce((s,p)=>s+p.amount,0);
 if(legacy>0){bal-=legacy;rows.push(['—','دفعات سابقة مسجلة إجمالاً','—','',cur(legacy),cur(bal)])}
 return {title:'كشف حساب أتعاب',sub:c.name,ref:'ح/'+c.code,file:fname('كشف حساب',c.name),blocks:[
  B.kv([['الموكل','<b>'+e(c.name)+'</b>'],['رقم الهوية / التسجيل',`<span class="mono">${e(c.idNo)}</span>`],['القضايا',clientCases(c).map(k=>`<span class="mono">${e(k.no)}</span>`).join('، ')||'—'],['تاريخ الكشف',dm(isoD(new Date()))]]),
  B.stats([['الأتعاب',cur(c.fee)+' ₪'],['المدفوع',cur(c.paid)+' ₪','ok'],['الرصيد المستحق',cur(c.fee-c.paid)+' ₪',c.fee>c.paid?'warn':'ok']]),
  B.h('الحركات'),
  B.t(['التاريخ','البيان','رقم السند','مدين ₪','دائن ₪','الرصيد ₪'],rows,{w:['13%','32%','15%','13%','13%','14%'],num:[0,3,4,5],foot:['','الإجمالي','',cur(c.fee),cur(c.paid),cur(c.fee-c.paid)]}),
  B.box('الرصيد المستحق: <b>'+cur(c.fee-c.paid)+' ₪</b> — '+e(P.amount(c.fee-c.paid)),'amt')
 ],sign:['المحاسب','المحامي']}}});

D.receipt=(cid,pid)=>({label:'سند قبض',build(){const c=C(cid),ps=pays(c),p=(pid?ps.find(x=>x.id===pid):ps[ps.length-1])||{amount:0,date:isoD(new Date()),no:'—'};
 return {title:'سند قبض',ref:p.no,file:fname('سند قبض',p.no),orient:'port',stamp:true,blocks:[
  B.kv([['رقم السند',`<b class="mono">${e(p.no)}</b>`],['التاريخ',dm(p.date)],['استلمنا من','<b>'+e(c.name)+'</b>'],['رقم الهوية',`<span class="mono">${e(c.idNo)}</span>`],['طريقة الدفع',e(p.method||'نقداً')+(payInfo(p)?'<br><small>'+e(payInfo(p))+'</small>':'')],['القضية',p.k&&K(p.k)?`<span class="mono">${e(K(p.k).no)}</span>`:(clientCases(c).map(k=>k.no).join('، ')||'—')]]),
  B.box(`<div style="font-size:1.6em;color:#0B1B2B">${cur(p.amount)} ₪</div>${e(P.amount(p.amount))}`,'amt'),
  B.p('وذلك عن: '+e(p.note||'دفعة من أتعاب المحاماة المتفق عليها')+'.'),
  B.kv([['إجمالي الأتعاب',cur(c.fee)+' ₪'],['مجموع المدفوع',cur(c.paid)+' ₪'],['المتبقي',cur(c.fee-c.paid)+' ₪']],3)
 ],sign:['المستلم','الدافع']}}});

D.intake=cid=>({label:'نموذج استقبال موكل',build(){const c=C(cid),cf=c.conflict||{};
 return {title:'نموذج استقبال موكل جديد',sub:c.name,ref:'س/'+c.code,file:fname('استقبال موكل',c.name),blocks:[
  B.h('بيانات الموكل'),
  B.kv([['الاسم الكامل','<b>'+e(c.name)+'</b>'],['الصفة',e(c.type)],['رقم الهوية / التسجيل',`<span class="mono">${e(c.idNo)}</span>`],['الهاتف',`<span class="mono">${e(c.phone)}</span>`],['واتساب',`<span class="mono">${e(c.whatsapp||c.phone)}</span>`],['البريد الإلكتروني',e(c.email||'—')],['المدينة',e(c.city)],['العنوان',e(c.address||'—')],['قناة التواصل',e(c.ch)],['مصدر الإحالة',e(c.source||'—')],['تاريخ الاستقبال',dm(c.since)],['موظف الاستقبال',e(c.by||'—')]]),
  c.matter?B.h('موضوع الاستشارة / النزاع'):'',c.matter?B.box(e(c.matter)):'',
  B.h('فحص تضارب المصالح'),
  B.box((cf.result==='clear'?'<b>لا تضارب:</b> لم يُعثر على تطابق مع أي خصم أو موكل مسجل.':cf.result?'<b>تطابق تمت مراجعته:</b> '+e((cf.matches||[]).join('؛ '))+(cf.note?'<br>قرار المراجعة: '+e(cf.note):''):'لم يُسجّل فحص.')+(cf.other?'<br>الطرف الآخر المتوقع: <b>'+e(cf.other)+'</b>':'')+(cf.at?'<br><small>أُجري الفحص في '+e(cf.at)+(cf.by?' بواسطة '+e(cf.by):'')+'</small>':''),cf.result==='clear'?'ok':cf.result?'warn':''),
  B.h('الأتعاب والبوابة'),
  B.kv([['الأتعاب المتفق عليها',cur(c.fee)+' ₪'],['الدفعة المقدمة',cur(c.paid)+' ₪'],['بوابة الموكل',c.portal?'مفعّلة · رمز الدخول <span class="mono">'+e(c.code)+'</span>':'غير مفعّلة'],['رابط الدخول',c.portal&&window.MQ_loginLink?'<span class="mono" style="font-size:.75em">'+e(MQ_loginLink(c))+'</span>':'—']]),
  B.h('إقرار الموكل'),
  B.p('أُقرّ أنا الموقّع أدناه بصحة البيانات المذكورة أعلاه، وأوافق على أن يتواصل معي المكتب عبر القناة المختارة، وعلى حفظ بياناتي ومستنداتي إلكترونياً لغايات متابعة قضاياي فقط، وأتعهد بإبلاغ المكتب بأي تغيير يطرأ عليها، وبعدم مشاركة رمز دخول البوابة مع أي شخص.')
 ],sign:['الموكل','المحامي']}}});

D.tpl=()=>({label:'المستند من النموذج',build(){const t=TPL[S.tpl],k=K(S.tplCase),lines=tplText(false).split('\n');let started=false,first=true;
 const bl=lines.map((l,i)=>{const s=l.trim();if(!s){started=true;return '<p class="pp gap"></p>'}
  if(!started){const r=/^لدى|^في الدعوى|^بواسطة/.test(s);const out=B.p(e(s),r?'r':first?'big':'c b');first=false;return out}
  if(/^(الوقائع|الطلبات|أسباب|أولاً|ثانياً|ثالثاً|رابعاً|لذلك|الطلب)[:\s]?/.test(s)&&s.length<60)return B.p(e(s),'b');
  return B.p(e(s))});
 const sig=t.name.includes('اتفاقية')?['الطرف الأول','الطرف الثاني']:t.name.includes('وكالة')?['الموكّل']:['وكيل '+(k.role||'')];
 return {title:t.name,ref:'ن/'+k.no,file:fname(t.name,C(k.client).name),blocks:bl,sign:sig,noTitle:true,stamp:true}}});

D.agenda=()=>({label:'جدول الجلسات',build(){const st=this.state||{};const r=st.range||'30';
 const from=isoD(TODAY),to=r==='all'?'9999':isoD(new Date(TODAY.getTime()+Number(r)*864e5));
 const hs=hearings.filter(h=>h.date>=from&&h.date<=to).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 const rows=[];let last='';hs.forEach(h=>{const k=K(h.k);if(!k)return;const day=h.date!==last;last=h.date;rows.push([day?'<b>'+DAYS[pd(h.date).getDay()]+'</b><small>'+dm(h.date)+'</small>':'',h.time||'',`<span class="mono">${e(k.no)}</span>`,e(CT(k.court).name),e(C(k.client).name)+'<small>ضد '+e(oppNames(k))+'</small>',e(h.purpose)+(h.attend?' <span class="tag warn">حضور الموكل</span>':''),'<span style="display:inline-block;width:5mm;height:5mm;border:.3mm solid #999"></span>'])});
 return {title:'جدول الجلسات',sub:r==='all'?'جميع الجلسات القادمة':'من '+dm(from)+' إلى '+dm(to),ref:'ج/'+from,file:fname('جدول الجلسات',from),orient:'land',blocks:[
  B.stats([['عدد الجلسات',hs.length],['تتطلب حضور الموكل',hs.filter(h=>h.attend).length,'warn'],['المحاكم',new Set(hs.map(h=>K(h.k)&&K(h.k).court)).size]]),
  B.t(['اليوم','الوقت','رقم الدعوى','المحكمة','الموكل / الخصم','الغاية','تم'],rows,{w:['12%','7%','12%','17%','22%','25%','5%'],num:[1]})],sign:[]}},
 opts:()=>`<label>الفترة<select data-po="range"><option value="7">7 أيام</option><option value="30" selected>30 يوماً</option><option value="90">3 أشهر</option><option value="all">كل القادمة</option></select></label>`});

D.cases=()=>({label:'سجل القضايا',build(){const st=this.state||{},f=st.f||S.cf||'الكل';const ks=cases.filter(k=>f==='الكل'||k.status===f).sort((a,b)=>String(a.opened).localeCompare(String(b.opened)));
 return {title:'سجل القضايا',sub:f==='الكل'?'جميع القضايا':'القضايا: '+f,ref:'س/'+isoD(TODAY),file:fname('سجل القضايا',isoD(TODAY)),orient:'land',blocks:[
  B.stats([['العدد',ks.length],['نشطة',ks.filter(k=>k.status==='نشطة').length],['مجموع قيم الدعاوى',cur(ks.reduce((s,k)=>s+(+k.value||0),0))+' ₪']]),
  B.t(['#','رقم الدعوى','الموضوع','الموكل','الخصم','المحكمة','المرحلة','الحالة','الجلسة القادمة'],ks.map((k,i)=>{const h=nextH(k.id);return [i+1,`<span class="mono">${e(k.no)}</span>`,e(k.subject),e(C(k.client).name),e(oppNames(k)),e(CT(k.court).name),e(k.stage),e(k.status),h?dm(h.date):'—']}),{w:['4%','10%','20%','14%','14%','13%','11%','6%','8%'],num:[0,8]})],sign:[]}},
 opts:()=>`<label>الحالة<select data-po="f">${['الكل','نشطة','تنفيذ','محكوم','منتهية'].map(x=>`<option ${(S.cf||'الكل')===x?'selected':''}>${x}</option>`).join('')}</select></label>`});

D.clients=()=>({label:'سجل الموكلين',build(){return {title:'سجل الموكلين',ref:'م/'+isoD(TODAY),file:fname('سجل الموكلين',isoD(TODAY)),orient:'land',blocks:[
 B.t(['#','الموكل','الصفة','الهوية / التسجيل','الهاتف','المدينة','القضايا','الأتعاب ₪','المدفوع ₪','المتبقي ₪'],clients.map((c,i)=>[i+1,'<b>'+e(c.name)+'</b>',e(c.type),`<span class="mono">${e(c.idNo)}</span>`,`<span class="mono">${e(c.phone)}</span>`,e(c.city),clientCases(c).length,cur(c.fee),cur(c.paid),cur(c.fee-c.paid)]),{w:['4%','20%','7%','12%','12%','9%','6%','10%','10%','10%'],num:[0,6,7,8,9],foot:['','الإجمالي','','','','',cases.length,cur(clients.reduce((s,c)=>s+c.fee,0)),cur(clients.reduce((s,c)=>s+c.paid,0)),cur(clients.reduce((s,c)=>s+c.fee-c.paid,0))]})],sign:[]}}});

D.fees=()=>({label:'تقرير الأتعاب والذمم',build(){const rs=clients.map(c=>({c,o:c.fee-c.paid})).sort((a,b)=>b.o-a.o),T=k=>clients.reduce((s,c)=>s+(k==='o'?c.fee-c.paid:c[k]),0);
 return {title:'تقرير الأتعاب والذمم',ref:'ت/'+isoD(TODAY),file:fname('تقرير الأتعاب',isoD(TODAY)),blocks:[
  B.stats([['إجمالي الأتعاب',cur(T('fee'))+' ₪'],['المحصّل',cur(T('paid'))+' ₪','ok'],['الذمم المستحقة',cur(T('o'))+' ₪','warn'],['نسبة التحصيل',Math.round(T('paid')/Math.max(1,T('fee'))*100)+'%']]),
  B.t(['الموكل','الأتعاب ₪','المدفوع ₪','المتبقي ₪','التحصيل'],rs.map(({c,o})=>['<b>'+e(c.name)+'</b>',cur(c.fee),cur(c.paid),cur(o),Math.round(c.paid/Math.max(1,c.fee)*100)+'%']),{w:['40%','15%','15%','15%','15%'],num:[1,2,3,4],foot:['الإجمالي',cur(T('fee')),cur(T('paid')),cur(T('o')),'']})],sign:['المحاسب']}}});

D.docs=()=>({label:'سجل المستندات',build(){const ds=window.MQ_docList?MQ_docList():docs.filter(d=>S.docK==='all'||d.k===S.docK).sort((a,b)=>b.date.localeCompare(a.date));
 return {title:'سجل المستندات',ref:'د/'+isoD(TODAY),file:fname('سجل المستندات',isoD(TODAY)),orient:'land',blocks:[B.t(['#','المستند','القضية','الموكل','النوع','المصدر','التاريخ','صفحات'],ds.map((d,i)=>[i+1,'<b>'+e(d.title)+'</b>',K(d.k)?`<span class="mono">${e(K(d.k).no)}</span>`:'',K(d.k)?e(C(K(d.k).client).name):'',e(d.kind),e(d.src),dm(d.date),d.pages||'']),{w:['4%','30%','11%','17%','12%','11%','9%','6%'],num:[0,6,7]})],sign:[]}}});

/* أي جدول ظاهر في الشاشة */
D.table=(title,tb)=>({label:title,build(){const hd=[...tb.querySelectorAll('thead th')].map(th=>th.textContent.trim());const rows=[...tb.querySelectorAll('tbody tr')].filter(r=>r.cells.length===hd.length).map(r=>[...r.cells].map(td=>e(td.innerText.trim()).replace(/\n+/g,'<small>')+''));
 return {title,ref:'ط/'+isoD(TODAY),file:fname(title,isoD(TODAY)),orient:hd.length>5?'land':'port',blocks:[B.t(hd,rows)],sign:[]}}});

/* الحزمة: مجموعة مستندات في نافذة واحدة */
P.client=cid=>P.open([D.client(cid),D.statement(cid),D.intake(cid),...((C(cid).payments||[]).length?[D.receipt(cid)]:[])]);
P.case=kid=>P.open([D.case(kid),D.tplFor?D.tplFor(kid):null].filter(Boolean));
P.auto=function(){const v=S.view;
 if(v==='case')return P.case(S.caseId);
 if(v==='client')return P.client(S.clientId);
 if(v==='tpls')return P.open(D.tpl());
 if(v==='agenda'||v==='dash')return P.open([D.agenda(),D.cases(),D.fees()]);
 if(v==='cases')return P.open([D.cases(),D.agenda()]);
 if(v==='clients')return P.open([D.clients(),D.fees()]);
 if(v==='finance'||v==='reports')return P.open([D.fees(),D.clients(),D.cases()]);
 if(v==='docs')return P.open(D.docs());
 const tb=document.querySelector('#page table');const h=document.querySelector('#page h1');
 if(tb)return P.open(D.table(h?h.textContent.trim():'تقرير',tb));
 P.open([D.cases(),D.clients(),D.agenda()])};

/* ── ربط المحرك بالواجهة ── */
A.print=()=>P.auto();
A.printCase=v=>P.case(v||S.caseId);
A.printClient=v=>P.client(v||S.clientId);
A.printReceipt=v=>{const [cid,pid]=String(v).split('|');P.open([D.receipt(cid,pid),D.statement(cid)])};
A.printTpl=()=>P.open(D.tpl());
document.addEventListener('keydown',ev=>{if((ev.ctrlKey||ev.metaKey)&&!ev.shiftKey&&(ev.key==='p'||ev.key==='P'||ev.key==='ح')){ev.preventDefault();ev.stopPropagation();if(!document.getElementById('pvBg'))P.auto();else A.pvPrint()}},true);

const PI='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/></svg>';
P.icon=PI;
function inject(){
 const v=S.view,pg=document.getElementById('page');if(!pg)return;
 if(v==='case'){const tb=pg.querySelector('.head .toolbar');if(tb&&!tb.querySelector('[data-act="printCase"]'))tb.insertAdjacentHTML('beforeend',`<button class="btn" data-act="printCase" data-v="${S.caseId}">${PI} طباعة</button>`)}
 if(v==='client'){const w=document.getElementById('waBar')||pg.querySelector('.bag-head .bag-id>div:last-child');if(w&&!pg.querySelector('[data-act="printClient"]'))w.insertAdjacentHTML('beforeend',`<button class="btn sm" data-act="printClient" data-v="${S.clientId}">${PI} طباعة</button>`);
  const fp=document.getElementById('fPay');if(PAYF.c!==S.clientId){PAYF.c=S.clientId;PAYF.k=undefined}if(fp&&!document.getElementById('payRc')){fp.insertAdjacentHTML('afterend',payBox(C(S.clientId)))}}
 if(v==='tpls'){const tb=pg.querySelector('.toolbar');if(tb&&!tb.querySelector('[data-act="printTpl"]'))tb.insertAdjacentHTML('afterbegin',`<button class="btn gold" data-act="printTpl">${PI} طباعة / PDF</button>`)}
 const host=document.getElementById('topIcons');if(host&&!document.getElementById('tbPrint'))host.insertAdjacentHTML('afterbegin',`<button class="ib" id="tbPrint" data-act="print" title="طباعة (Ctrl+P)" aria-label="طباعة">${PI}</button>`);
}
const r0=render;render=function(){r0();try{inject()}catch(x){console.warn(x)}};

/* ── تفاصيل طريقة الدفع (شيك، تحويل، بطاقة) وقائمة الدفعات وطباعتها ── */
const METHODS=['نقداً','شيك','تحويل بنكي','بطاقة'];
const PAYF={m:'نقداً',v:{}};
const payField=(id,label,type,ph,extra)=>`<label class="pay-f"><span>${label}</span><input class="field${type==='text'&&/رقم|آخر/.test(label)?' mono':''}" id="${id}" type="${type}" ${ph?`placeholder="${ph}"`:''} value="${e(PAYF.v[id]||'')}" ${extra||''}></label>`;
function payDet(){const m=PAYF.m;
 if(m==='شيك')return payField('pdChq','رقم الشيك','text','000123','inputmode="numeric" required')+payField('pdBank','البنك','text','بنك فلسطين','required list="pdBanks"')+payField('pdDue','تاريخ الاستحقاق','date','','required')+payField('pdDrawer','اسم الساحب (إن اختلف)','text','');
 if(m==='تحويل بنكي')return payField('pdBank','البنك المحوَّل منه','text','بنك فلسطين','required list="pdBanks"')+payField('pdRef','رقم الحوالة / المرجع','text','TRX…','required')+payField('pdDate','تاريخ التحويل','date','','');
 if(m==='بطاقة')return `<label class="pay-f"><span>نوع البطاقة</span><select class="field" id="pdCardT">${['فيزا','ماستركارد','أخرى'].map(x=>`<option ${PAYF.v.pdCardT===x?'selected':''}>${x}</option>`).join('')}</select></label>`+payField('pdCard4','آخر 4 أرقام','text','1234','inputmode="numeric" maxlength="4" pattern="[0-9]{4}" required')+payField('pdRef','رقم العملية / الموافقة','text','','required');
 return '';}
const BANKS=['بنك فلسطين','البنك الإسلامي الفلسطيني','البنك العربي','بنك القدس','البنك الوطني','بنك الاستثمار الفلسطيني','البنك الإسلامي العربي','بنك الأردن','بنك القاهرة عمان','بنك الإسكان','البنك التجاري الأردني','مصرف الصفا'];
const payInfo=p=>{const x=[];if(p.chq)x.push('شيك رقم '+p.chq);if(p.bank)x.push(p.bank);if(p.due)x.push('يستحق '+dm(p.due));if(p.drawer)x.push('الساحب: '+p.drawer);if(p.card4)x.push((p.cardType||'بطاقة')+' ••••'+p.card4);if(p.ref)x.push('مرجع '+p.ref);if(p.tdate)x.push('حُوّل '+dm(p.tdate));return x.join(' · ')};
P.payInfo=payInfo;
/* كل دفعة تُنسب إلى قضية (أو «عام» لأتعاب غير مرتبطة)؛ الافتراضي: القضية النشطة الوحيدة */
const casesOfC=c=>(typeof cases!=='undefined'?cases:[]).filter(k=>k.client===(c&&c.id));
function payKDefault(c){const ks=casesOfC(c);if(window.MQ_payCase){const pk=window.MQ_payCase;window.MQ_payCase=null;if(ks.some(k=>k.id===pk)){PAYF.k=pk;return pk}}if(PAYF.k!==undefined&&(PAYF.k===''||ks.some(k=>k.id===PAYF.k)))return PAYF.k;const act=ks.filter(k=>k.status!=='منتهية');return act.length===1?act[0].id:''}
function payBox(c){const ps=pays(c||{}).slice().reverse(),ks=casesOfC(c),dk=payKDefault(c),kno=id=>(ks.find(k=>k.id===id)||{}).no;
 return `<div class="pay-x"><label class="pvck"><input type="checkbox" id="payRc" checked><span>إصدار سند قبض</span></label><select class="field" id="payM" aria-label="طريقة الدفع">${METHODS.map(x=>`<option ${PAYF.m===x?'selected':''}>${x}</option>`).join('')}</select>${ks.length?`<select class="field" id="payK" aria-label="القضية"><option value="">أتعاب عامة (غير مرتبطة بقضية)</option>${ks.map(k=>`<option value="${e(k.id)}" ${dk===k.id?'selected':''}>القضية ${e(k.no)}</option>`).join('')}</select>`:''}</div>
 <div class="pay-det" id="payDet">${payDet()}</div><datalist id="pdBanks">${BANKS.map(b=>`<option value="${b}">`).join('')}</datalist>
 ${ps.length?`<div class="pay-all"><div class="pay-h"><b>الدفعات (${ps.length})</b><button type="button" class="btn sm" data-act="printPays" data-v="${c.id}">${PI} طباعة كشف الدفعات والمتبقي</button></div>
  <table class="pay-t"><thead><tr><th>السند</th><th>التاريخ</th><th>المبلغ</th><th>الطريقة</th></tr></thead><tbody>${ps.map(p=>`<tr><td><button class="link mono" data-act="printReceipt" data-v="${c.id}|${p.id}" title="طباعة السند">${e(p.no)}</button></td><td class="num">${dm(p.date)}</td><td class="num">${cur(p.amount)} ₪</td><td>${e(p.method||'نقداً')}${payInfo(p)?`<div class="m">${e(payInfo(p))}</div>`:''}${p.k&&kno(p.k)?`<div class="m">القضية <button class="link mono" data-act="openCase" data-v="${e(p.k)}">${e(kno(p.k))}</button></div>`:''}</td></tr>`).join('')}</tbody></table></div>`:''}`}
document.addEventListener('change',ev=>{const t=ev.target;if(t.id==='payK'){PAYF.k=t.value;return}if(t.id==='payM'){PAYF.m=t.value;const d=document.getElementById('payDet');if(d)d.innerHTML=payDet();const f=d&&d.querySelector('input,select');if(f)f.focus()}
 else if(t.id&&t.id.startsWith('pd'))PAYF.v[t.id]=t.value});
document.addEventListener('input',ev=>{const t=ev.target;if(t.id&&t.id.startsWith('pd'))PAYF.v[t.id]=t.value});
A.printPays=v=>{const c=C(v);if(c)P.open([D.statement(c.id),D.client?D.client(c.id):null].filter(Boolean))};
/* التحقق قبل التسجيل (مرحلة الالتقاط، قبل أن يضيف التطبيق المبلغ)، وحفظ التفاصيل لأن العرض يُعاد بعد التسجيل */
let pendingPay=null;
document.addEventListener('submit',ev=>{const f=ev.target;if(f.id!=='fPay')return;const n=Number(f.payAmt&&f.payAmt.value);if(!(n>0))return;
 const g=id=>((document.getElementById(id)||{}).value||'').trim(),m=g('payM')||'نقداً',det={};
 const need=(id,msg)=>{if(!g(id)){ev.preventDefault();ev.stopImmediatePropagation();toast(msg);const x=document.getElementById(id);if(x)x.focus();return false}return true};
 if(m==='شيك'){if(!need('pdChq','اكتب رقم الشيك')||!need('pdBank','اختر البنك')||!need('pdDue','حدّد تاريخ استحقاق الشيك'))return;Object.assign(det,{chq:g('pdChq'),bank:g('pdBank'),due:g('pdDue'),drawer:g('pdDrawer')})}
 if(m==='تحويل بنكي'){if(!need('pdBank','اختر البنك')||!need('pdRef','اكتب رقم الحوالة أو المرجع'))return;Object.assign(det,{bank:g('pdBank'),ref:g('pdRef'),tdate:g('pdDate')})}
 if(m==='بطاقة'){if(!/^\d{4}$/.test(g('pdCard4'))){ev.preventDefault();ev.stopImmediatePropagation();toast('اكتب آخر 4 أرقام من البطاقة');return}if(!need('pdRef','اكتب رقم العملية أو الموافقة'))return;Object.assign(det,{cardType:g('pdCardT')||'بطاقة',card4:g('pdCard4'),ref:g('pdRef')})}
 Object.keys(det).forEach(k=>{if(!det[k])delete det[k]});
 pendingPay={method:m,det,k:g('payK'),want:!!(document.getElementById('payRc')||{}).checked};PAYF.v={};
},true);

/* سندات القبض: كل دفعة تُسجَّل برقم متسلسل */
const nextNo=()=>{const y=TODAY.getFullYear();let m=0;clients.forEach(c=>(c.payments||[]).forEach(p=>{const r=String(p.no||'').match(/^R-(\d{4})-(\d+)$/);if(r&&+r[1]===y)m=Math.max(m,+r[2])}));return 'R-'+y+'-'+String(m+1).padStart(4,'0')};
P.nextNo=nextNo;
P.addPayment=(c,amount,o={})=>{const p={id:'p'+Date.now(),no:nextNo(),amount:Number(amount),date:o.date||isoD(new Date()),method:o.method||'نقداً',note:o.note||'',k:o.k||'',by:window.MQ&&MQ.user?MQ.user.username:'',...(o.det||{})};(c.payments=c.payments||[]).push(p);return p};
document.addEventListener('submit',ev=>{const f=ev.target;if(f.id!=='fPay')return;
 const n=Number(f.payAmt&&f.payAmt.value);if(!(n>0))return;
 const pp=pendingPay||{method:'نقداً',det:{},want:true};pendingPay=null;
 setTimeout(()=>{const c=C(S.clientId);if(!c)return;const p=P.addPayment(c,n,{method:pp.method,det:pp.det,k:pp.k});render();if(pp.want)P.open([D.receipt(c.id,p.id),D.statement(c.id)])},0)});
})();
