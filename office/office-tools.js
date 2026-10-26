/* ── أدوات المكتب: مكبّر القراءة وأدوات يومية للمحامي ──
   زر عائم يفتح لوحة صغيرة فيها:
   • مكبّر القراءة: تكبير الصفحة كلها (يُحفظ)، وعدسة تعرض النص تحت المؤشر بخط كبير (Ctrl+Alt+M)
   • حاسبة المدد: تاريخ + أيام (تقويمية أو أيام عمل)، والفرق بين تاريخين
   • تفقيط المبالغ: رقم ← كتابة بالعربية بالعملة المختارة (للعقود والشيكات والإيصالات)
   • التحويل بين الهجري والميلادي (أم القرى)
   • عدّاد كلمات وأحرف، وتحويل الأرقام الهندية/العربية
   • مؤقّت العمل: ساعات العمل على قضية (للأتعاب بالساعة)
   كل الأدوات تعمل على الجهاز بلا إنترنت. */
(function(root){
'use strict';
/* ── منطق خالص قابل للاختبار ── */
const pad=n=>String(n).padStart(2,'0');
const isoOf=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s||''));return m?new Date(+m[1],+m[2]-1,+m[3]):null};
/* إضافة مدة: أيام تقويمية، أو أيام عمل (تُستثنى الجمعة، والسبت إن طُلب، والعطل المدخلة) */
function addPeriod(start,n,{unit='days',work=false,sat=false,holidays=[]}={}){
 const d=parse(start);if(!d)return null;n=Math.round(+n||0);
 if(unit==='months'){const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+n);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return isoOf(d)}
 if(unit==='years'){const m=d.getMonth(),day=d.getDate();d.setDate(1);d.setFullYear(d.getFullYear()+n);const last=new Date(d.getFullYear(),m+1,0).getDate();d.setMonth(m);d.setDate(Math.min(day,last));return isoOf(d)}
 if(!work){d.setDate(d.getDate()+n);return isoOf(d)}
 const off=x=>x.getDay()===5||(sat&&x.getDay()===6)||holidays.includes(isoOf(x));
 let left=Math.abs(n);const step=n<0?-1:1;
 while(left>0){d.setDate(d.getDate()+step);if(!off(d))left--}
 return isoOf(d);
}
/* إذا وقع آخر يوم في عطلة: يمتد لأول يوم عمل بعده (القاعدة العامة في حساب المواعيد) */
function rollForward(s,{sat=false,holidays=[]}={}){const d=parse(s);if(!d)return null;let moved=0;while(d.getDay()===5||(sat&&d.getDay()===6)||holidays.includes(isoOf(d))){d.setDate(d.getDate()+1);moved++}return {date:isoOf(d),moved}}
function diff(a,b){const x=parse(a),y=parse(b);if(!x||!y)return null;const days=Math.round((y-x)/864e5);
 let s=x<=y?new Date(x):new Date(y),e=x<=y?y:x,yy=e.getFullYear()-s.getFullYear(),mm=e.getMonth()-s.getMonth(),dd=e.getDate()-s.getDate();
 if(dd<0){mm--;dd+=new Date(e.getFullYear(),e.getMonth(),0).getDate()}if(mm<0){yy--;mm+=12}
 return {days,weeks:Math.floor(Math.abs(days)/7),y:yy,m:mm,d:dd}}
/* تفقيط */
const ONES=['','واحد','اثنان','ثلاثة','أربعة','خمسة','ستة','سبعة','ثمانية','تسعة','عشرة','أحد عشر','اثنا عشر','ثلاثة عشر','أربعة عشر','خمسة عشر','ستة عشر','سبعة عشر','ثمانية عشر','تسعة عشر'];
const TENS=['','','عشرون','ثلاثون','أربعون','خمسون','ستون','سبعون','ثمانون','تسعون'];
const HUN=['','مائة','مئتان','ثلاثمائة','أربعمائة','خمسمائة','ستمائة','سبعمائة','ثمانمائة','تسعمائة'];
function w999(n){const h=Math.floor(n/100),r=n%100,p=[];if(h)p.push(HUN[h]);if(r){if(r<20)p.push(ONES[r]);else{const o=r%10,t=Math.floor(r/10);p.push(o?ONES[o]+' و'+TENS[t]:TENS[t])}}return p.join(' و')}
function scale(n,one,two,few,many){if(!n)return '';if(n===1)return one;if(n===2)return two;if(n<=10)return w999(n)+' '+few;return w999(n)+' '+many}
function words(v){v=Math.floor(Math.abs(Number(v)||0));if(!v)return 'صفر';
 const b=Math.floor(v/1e9)%1000,m=Math.floor(v/1e6)%1000,t=Math.floor(v/1e3)%1000,r=v%1000,p=[];
 if(b)p.push(scale(b,'مليار','ملياران','مليارات','مليار'));if(m)p.push(scale(m,'مليون','مليونان','ملايين','مليون'));if(t)p.push(scale(t,'ألف','ألفان','آلاف','ألف'));if(r)p.push(w999(r));
 return p.join(' و')}
const CUR={ILS:['شيكل','أغورة',100],JOD:['دينار أردني','فلس',1000],USD:['دولار أمريكي','سنت',100],EGP:['جنيه مصري','قرش',100],EUR:['يورو','سنت',100]};
function tafqeet(v,cur='ILS'){const c=CUR[cur]||CUR.ILS,n=Math.abs(+String(v).replace(/[,\s]/g,'')||0),whole=Math.floor(n),frac=Math.round((n-whole)*c[2]);
 return 'فقط '+words(whole)+' '+c[0]+(frac?' و'+words(frac)+' '+c[1]:'')+' لا غير'}
/* هجري ← ميلادي بالبحث (أم القرى عبر Intl) */
const HJ=(()=>{try{return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn',{day:'numeric',month:'numeric',year:'numeric'})}catch(e){return null}})();
function toHijri(s){const d=parse(s);if(!d||!HJ)return null;const p=Object.fromEntries(HJ.formatToParts(d).map(x=>[x.type,x.value]));return {y:+p.year,m:+p.month,d:+p.day}}
function fromHijri(y,m,dd){if(!HJ)return null;y=+y;m=+m;dd=+dd;if(!y||!m||!dd)return null;
 let g=new Date(Math.round(622+(y-1)*0.970229),0,1);for(let i=0;i<500;i++){const h=toHijri(isoOf(g));const cmp=(h.y-y)*400+(h.m-m)*31+(h.d-dd);if(cmp===0)return isoOf(g);g.setDate(g.getDate()+(cmp<0?Math.max(1,Math.floor(-cmp*0.97)):-Math.max(1,Math.floor(cmp*0.97))))}return null}
const HMONTHS=['محرم','صفر','ربيع الأول','ربيع الآخر','جمادى الأولى','جمادى الآخرة','رجب','شعبان','رمضان','شوال','ذو القعدة','ذو الحجة'];
const toLatinDigits=s=>String(s).replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[۰-۹]/g,c=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(c));
const toArabicDigits=s=>String(s).replace(/\d/g,c=>'٠١٢٣٤٥٦٧٨٩'[c]);
const countText=s=>{s=String(s||'');const w=(s.trim().match(/\S+/g)||[]).length;return {words:w,chars:s.length,charsNoSpace:s.replace(/\s/g,'').length,lines:s?s.split(/\n/).length:0,pages:Math.ceil(w/250)}};
const T={addPeriod,rollForward,diff,words,tafqeet,toHijri,fromHijri,toLatinDigits,toArabicDigits,countText,CUR};
if(typeof module!=='undefined'&&module.exports){module.exports=T;return}
root.MQTOOLS=T;
if(!root.document)return;

/* ── الواجهة ── */
const doc=root.document,e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LS=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(_){return d}},SV=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};
const today=()=>isoOf(new Date()),dm=s=>{const d=parse(s);return d?d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear():'—'};
const DAYS=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const ST={tab:LS('mq_tools_tab','zoom'),zoom:LS('mq_zoom',100),lens:false,timer:LS('mq_timer',{run:false,start:0,acc:0,label:''}),log:LS('mq_timer_log',[])};

const css=`
#mqtBtn{position:fixed;left:18px;bottom:18px;z-index:900;width:48px;height:48px;border-radius:14px;border:1px solid #C9A24A;background:#0B1B2B;color:#F3D58A;display:grid;place-items:center;cursor:pointer;box-shadow:0 6px 18px rgb(0 0 0 / .25)}
#mqtBtn:hover{background:#13304B}#mqtBtn svg{width:24px;height:24px}#mqtBtn.lens-on{outline:3px solid #F3D58A}
#mqtPanel{position:fixed;left:18px;bottom:76px;z-index:901;width:min(420px,calc(100vw - 36px));max-height:min(640px,calc(100vh - 110px));display:flex;flex-direction:column;background:#FBF8F1;border:1px solid #E2D7BF;border-radius:16px;box-shadow:0 18px 50px rgb(11 27 43 / .28);font-size:14px;color:#1F2A36}
#mqtPanel[hidden]{display:none}
#mqtPanel header{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid #E9E0CC}#mqtPanel header b{flex:1;font-size:15px}
#mqtPanel .x{border:0;background:none;font-size:20px;cursor:pointer;color:#7A6A48}
#mqtTabs{display:flex;flex-wrap:wrap;gap:4px;padding:8px 10px;border-bottom:1px solid #E9E0CC}
#mqtTabs button{border:1px solid #E2D7BF;background:#fff;border-radius:999px;padding:5px 10px;font:inherit;font-size:12.5px;cursor:pointer;color:#3B4654}
#mqtTabs button.on{background:#0B1B2B;color:#F3D58A;border-color:#0B1B2B}
#mqtBody{padding:12px 14px;overflow:auto}
#mqtBody label{display:block;margin:6px 0;color:#5B6470;font-size:12.5px}
#mqtBody input,#mqtBody select,#mqtBody textarea{width:100%;box-sizing:border-box;margin-top:3px;padding:8px 10px;border:1px solid #DCD0B5;border-radius:9px;font:inherit;background:#fff;color:#1F2A36}
#mqtBody .row{display:flex;gap:8px}#mqtBody .row>*{flex:1}
#mqtBody .res{margin-top:10px;padding:10px 12px;background:#fff;border:1px solid #E9E0CC;border-radius:10px;line-height:1.9}
#mqtBody .res b.big{font-size:18px;color:#0B1B2B}#mqtBody .m{color:#7A8592;font-size:12px}
#mqtBody .btns{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
#mqtBody .btns button{border:1px solid #C9A24A;background:#fff;color:#0B1B2B;border-radius:9px;padding:7px 12px;font:inherit;cursor:pointer}
#mqtBody .btns button.p{background:#0B1B2B;color:#F3D58A;border-color:#0B1B2B}
#mqtBody .zoomv{font-size:28px;font-weight:700;text-align:center;color:#0B1B2B}
#mqtLens{position:fixed;z-index:950;pointer-events:none;max-width:min(720px,90vw);padding:14px 18px;background:#FFFDF6;border:2px solid #C9A24A;border-radius:14px;box-shadow:0 14px 40px rgb(0 0 0 / .3);font-size:26px;line-height:1.7;color:#111;direction:rtl;white-space:pre-wrap}
#mqtLens[hidden]{display:none}
.mqt-lens-hl{outline:2px dashed #C9A24A!important;outline-offset:2px}
html.night #mqtPanel{background:#132433;color:#E9E2D0;border-color:#2B4256}html.night #mqtBody .res,html.night #mqtBody input,html.night #mqtBody select,html.night #mqtBody textarea,html.night #mqtTabs button{background:#0E1C29;color:#E9E2D0;border-color:#2B4256}
@media print{#mqtBtn,#mqtPanel,#mqtLens{display:none!important}}`;
const st=doc.createElement('style');st.textContent=css;doc.head.appendChild(st);

const ICO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5M8 10.5h5M10.5 8v5"/></svg>';
const btn=doc.createElement('button');btn.id='mqtBtn';btn.type='button';btn.title='أدوات المكتب: المكبّر وحاسبة المدد والتفقيط (Ctrl+Alt+T)';btn.setAttribute('aria-label','أدوات المكتب');btn.innerHTML=ICO;
const panel=doc.createElement('section');panel.id='mqtPanel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','أدوات المكتب');
const lens=doc.createElement('div');lens.id='mqtLens';lens.hidden=true;
const TABS=[['zoom','المكبّر'],['dates','حاسبة المدد'],['taf','تفقيط'],['hijri','هجري/ميلادي'],['text','عدّاد النص'],['timer','مؤقّت العمل']];

function applyZoom(){const z=Math.max(80,Math.min(200,ST.zoom));doc.documentElement.style.zoom=z===100?'':String(z/100);SV('mq_zoom',z)}
function setLens(on){ST.lens=on;btn.classList.toggle('lens-on',on);if(!on){lens.hidden=true;clearHl()}draw()}
let hlEl=null;const clearHl=()=>{if(hlEl){hlEl.classList.remove('mqt-lens-hl');hlEl=null}};
function lensMove(ev){if(!ST.lens)return;if(panel.contains(ev.target)||ev.target===btn){lens.hidden=true;clearHl();return}
 let el=ev.target;while(el&&el!==doc.body&&(!el.innerText||el.innerText.trim().length<2||el.innerText.length>900))el=el.parentElement;
 if(!el||el===doc.body){lens.hidden=true;clearHl();return}
 if(el!==hlEl){clearHl();hlEl=el;el.classList.add('mqt-lens-hl');lens.textContent=el.innerText.trim().slice(0,700)}
 lens.hidden=false;const W=lens.offsetWidth,H=lens.offsetHeight;let x=ev.clientX-W/2,y=ev.clientY+28;if(y+H>innerHeight-8)y=ev.clientY-H-28;
 lens.style.left=Math.max(8,Math.min(innerWidth-W-8,x))+'px';lens.style.top=Math.max(8,y)+'px'}

function fmtDur(ms){const s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h+':'+pad(m)+':'+pad(s%60)}
const timerMs=()=>ST.timer.acc+(ST.timer.run?Date.now()-ST.timer.start:0);
const caseOpts=()=>{try{return (root.cases||[]).filter(k=>k.status!=='منتهية').slice(0,300).map(k=>`<option value="${e(k.no+' · '+(k.subject||''))}">`).join('')}catch(_){return ''}};

const VIEWS={
 zoom:()=>`<p class="m">تكبير الشاشة كلها يبقى محفوظاً لهذا الجهاز. العدسة تعرض النص تحت المؤشر بخط كبير دون تغيير الصفحة.</p>
  <div class="zoomv">${ST.zoom}%</div><div class="btns" style="justify-content:center"><button data-z="-10">A−</button><button data-z="0">100%</button><button data-z="10">A+</button><button data-z="25">كبير جداً</button></div>
  <div class="btns" style="justify-content:center;margin-top:12px"><button class="${ST.lens?'':'p'}" data-lens="1">${ST.lens?'إيقاف عدسة القراءة':'تشغيل عدسة القراءة'}</button></div>
  <p class="m" style="text-align:center">اختصارات: Ctrl+Alt+M للعدسة · Ctrl + / Ctrl − للتكبير والتصغير</p>`,
 dates:()=>`<div class="row"><label>من تاريخ<input type="date" id="tdS" value="${e(LS('mq_td_s',today()))}"></label><label>المدة<input type="number" id="tdN" value="${e(LS('mq_td_n',30))}"></label></div>
  <div class="row"><label>الوحدة<select id="tdU"><option value="days">أيام</option><option value="months">أشهر</option><option value="years">سنوات</option></select></label><label>الحساب<select id="tdW"><option value="cal">أيام تقويمية</option><option value="work">أيام عمل (دون الجمعة)</option><option value="work6">أيام عمل (دون الجمعة والسبت)</option></select></label></div>
  <label>عطل رسمية (تواريخ مفصولة بفواصل، اختياري)<input id="tdH" placeholder="2026-11-15, 2026-12-25" value="${e(LS('mq_td_h',''))}"></label>
  <div class="res" id="tdR"></div>
  <hr style="border:0;border-top:1px solid #E9E0CC;margin:14px 0"><b>المدة بين تاريخين</b>
  <div class="row"><label>من<input type="date" id="tdA" value="${today()}"></label><label>إلى<input type="date" id="tdB" value="${today()}"></label></div><div class="res" id="tdR2"></div>
  <p class="m">تحقّق دائماً من بداية سريان المدة (من اليوم التالي للتبليغ مثلاً) ومن النص الخاص بها في القانون.</p>`,
 taf:()=>`<div class="row"><label>المبلغ<input id="tfV" inputmode="decimal" placeholder="12500.50" value="${e(LS('mq_tf_v',''))}"></label><label>العملة<select id="tfC">${Object.entries(CUR).map(([k,v])=>`<option value="${k}"${LS('mq_tf_c','ILS')===k?' selected':''}>${v[0]}</option>`).join('')}</select></label></div>
  <div class="res" id="tfR"></div><div class="btns"><button class="p" data-copy="tfR">نسخ</button></div>`,
 hijri:()=>`<b>ميلادي ← هجري</b><label>التاريخ الميلادي<input type="date" id="hjG" value="${today()}"></label><div class="res" id="hjR"></div>
  <hr style="border:0;border-top:1px solid #E9E0CC;margin:14px 0"><b>هجري ← ميلادي</b>
  <div class="row"><label>اليوم<input type="number" id="hjD" min="1" max="30" value="1"></label><label>الشهر<select id="hjM">${HMONTHS.map((m,i)=>`<option value="${i+1}">${m}</option>`).join('')}</select></label><label>السنة<input type="number" id="hjY" value="${(toHijri(today())||{}).y||1448}"></label></div><div class="res" id="hjR2"></div>
  <p class="m">حسب تقويم أم القرى؛ قد يختلف يوماً عن الرؤية المحلية.</p>`,
 text:()=>`<label>الصق النص<textarea id="txT" rows="7" placeholder="الصق نص اللائحة أو المذكرة هنا"></textarea></label><div class="res" id="txR"></div>
  <div class="btns"><button data-dg="lat">أرقام 123</button><button data-dg="ar">أرقام ١٢٣</button><button data-copy="txT">نسخ النص</button></div>`,
 timer:()=>`<label>على ماذا تعمل؟<input id="tmL" list="tmCases" placeholder="رقم القضية أو العمل" value="${e(ST.timer.label||'')}"><datalist id="tmCases">${caseOpts()}</datalist></label>
  <div class="zoomv" id="tmV">${fmtDur(timerMs())}</div>
  <div class="btns" style="justify-content:center">${ST.timer.run?'<button data-tm="pause">إيقاف مؤقت</button>':'<button class="p" data-tm="start">'+(ST.timer.acc?'متابعة':'ابدأ')+'</button>'}<button data-tm="save">إنهاء وتسجيل</button><button data-tm="reset">تصفير</button></div>
  ${ST.log.length?`<div class="res"><b>آخر الجلسات</b>${ST.log.slice(0,8).map(l=>`<div class="m">${e(l.at)} · <b>${e(fmtDur(l.ms))}</b> · ${e(l.label||'—')}</div>`).join('')}<div class="m" style="margin-top:6px">المجموع: ${fmtDur(ST.log.reduce((t,l)=>t+l.ms,0))}</div></div><div class="btns"><button data-tm="csv">تصدير CSV</button><button data-tm="clear">مسح السجل</button></div>`:''}
  <p class="m">يبقى المؤقّت يعمل حتى لو أُغلقت اللوحة أو أُعيد تحميل الصفحة.</p>`,
};
function calc(){
 const g=id=>doc.getElementById(id);
 if(ST.tab==='dates'&&g('tdS')){const s=g('tdS').value,n=+g('tdN').value,u=g('tdU').value,w=g('tdW').value,hol=(g('tdH').value.match(/\d{4}-\d{2}-\d{2}/g)||[]);
  SV('mq_td_s',s);SV('mq_td_n',n);SV('mq_td_h',g('tdH').value);
  const r=addPeriod(s,n,{unit:u,work:u==='days'&&w!=='cal',sat:w==='work6',holidays:hol});
  if(!r){g('tdR').innerHTML='<span class="m">أدخل تاريخاً صحيحاً</span>'}else{const rf=rollForward(r,{sat:w==='work6',holidays:hol}),dd=parse(r);
   g('tdR').innerHTML=`ينتهي في: <b class="big">${DAYS[dd.getDay()]} ${dm(r)}</b>${rf&&rf.moved?`<div>يقع في عطلة؛ يمتد إلى أول يوم عمل: <b>${DAYS[parse(rf.date).getDay()]} ${dm(rf.date)}</b></div>`:''}<div class="m">${(()=>{const d=diff(today(),r);return d.days>=0?'بعد '+d.days+' يوماً من اليوم':'مضى عليه '+(-d.days)+' يوماً'})()}</div>`}
  const d=diff(g('tdA').value,g('tdB').value);g('tdR2').innerHTML=d?`<b class="big">${Math.abs(d.days)} يوماً</b> · ${d.weeks} أسبوعاً<div>${d.y?d.y+' سنة و':''}${d.m} شهراً و${d.d} يوماً</div>`:''}
 if(ST.tab==='taf'&&g('tfV')){SV('mq_tf_v',g('tfV').value);SV('mq_tf_c',g('tfC').value);const v=toLatinDigits(g('tfV').value);g('tfR').textContent=v.trim()?tafqeet(v,g('tfC').value):''}
 if(ST.tab==='hijri'&&g('hjG')){const h=toHijri(g('hjG').value);g('hjR').innerHTML=h?`<b class="big">${h.d} ${HMONTHS[h.m-1]} ${h.y} هـ</b>`:'';
  const gg=fromHijri(g('hjY').value,g('hjM').value,g('hjD').value);g('hjR2').innerHTML=gg?`<b class="big">${DAYS[parse(gg).getDay()]} ${dm(gg)} م</b>`:'<span class="m">تاريخ غير صحيح</span>'}
 if(ST.tab==='text'&&g('txT')){const c=countText(g('txT').value);g('txR').innerHTML=`<b>${c.words}</b> كلمة · ${c.chars} حرفاً (${c.charsNoSpace} دون مسافات) · ${c.lines} سطراً · قرابة ${c.pages} صفحة`}
}
function draw(){panel.innerHTML=`<header><b>أدوات المكتب</b><button class="x" data-close="1" aria-label="إغلاق">×</button></header>
 <nav id="mqtTabs">${TABS.map(([k,l])=>`<button type="button" data-tab="${k}" class="${ST.tab===k?'on':''}">${l}</button>`).join('')}</nav><div id="mqtBody">${VIEWS[ST.tab]()}</div>`;
 if(ST.tab==='dates'){const u=LS('mq_td_u','days'),w=LS('mq_td_w','cal');panel.querySelector('#tdU').value=u;panel.querySelector('#tdW').value=w}
 calc()}
const toast=t=>{if(typeof root.toast==='function')root.toast(t)};
panel.addEventListener('input',()=>{const u=panel.querySelector('#tdU'),w=panel.querySelector('#tdW');if(u)SV('mq_td_u',u.value);if(w)SV('mq_td_w',w.value);if(panel.querySelector('#tmL')){ST.timer.label=panel.querySelector('#tmL').value;SV('mq_timer',ST.timer)}calc()});
panel.addEventListener('change',()=>calc());
panel.addEventListener('click',ev=>{const t=ev.target.closest('button');if(!t)return;const D=t.dataset;
 if(D.close){panel.hidden=true;return}
 if(D.tab){ST.tab=D.tab;SV('mq_tools_tab',D.tab);draw();return}
 if(D.z!=null){ST.zoom=+D.z===0?100:Math.max(80,Math.min(200,ST.zoom+ +D.z));applyZoom();draw();return}
 if(D.lens){setLens(!ST.lens);if(ST.lens){panel.hidden=true;toast('عدسة القراءة تعمل: مرّر المؤشر على أي نص. Ctrl+Alt+M للإيقاف')}return}
 if(D.copy){const el=doc.getElementById(D.copy);const txt=el.value!=null?el.value:el.textContent;navigator.clipboard&&navigator.clipboard.writeText(txt).then(()=>toast('نُسخ'));return}
 if(D.dg){const a=doc.getElementById('txT');a.value=D.dg==='lat'?toLatinDigits(a.value):toArabicDigits(a.value);calc();return}
 if(D.tm){const T0=ST.timer;
  if(D.tm==='start'){T0.run=true;T0.start=Date.now()}
  if(D.tm==='pause'&&T0.run){T0.acc+=Date.now()-T0.start;T0.run=false}
  if(D.tm==='save'){const ms=timerMs();if(ms>=1000){ST.log.unshift({at:new Date().toLocaleString('en-GB').slice(0,17),ms,label:T0.label||''});ST.log=ST.log.slice(0,200);SV('mq_timer_log',ST.log);toast('سُجّل '+fmtDur(ms))}T0.run=false;T0.acc=0}
  if(D.tm==='reset'){T0.run=false;T0.acc=0}
  if(D.tm==='clear'&&confirm('مسح سجل المؤقّت؟')){ST.log=[];SV('mq_timer_log',[])}
  if(D.tm==='csv'){const rows=[['التاريخ','المدة (دقائق)','العمل'],...ST.log.map(l=>[l.at,Math.round(l.ms/60000),l.label])];const a=doc.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n')],{type:'text/csv'}));a.download='ساعات-العمل.csv';a.click()}
  SV('mq_timer',T0);draw();return}
});
btn.addEventListener('click',()=>{panel.hidden=!panel.hidden;if(!panel.hidden)draw()});
doc.addEventListener('mousemove',lensMove,{passive:true});
doc.addEventListener('keydown',ev=>{
 if(ev.ctrlKey&&ev.altKey&&(ev.key==='m'||ev.key==='M'||ev.code==='KeyM')){ev.preventDefault();setLens(!ST.lens);toast(ST.lens?'عدسة القراءة تعمل':'أُوقفت عدسة القراءة')}
 if(ev.ctrlKey&&ev.altKey&&(ev.code==='KeyT')){ev.preventDefault();panel.hidden=!panel.hidden;if(!panel.hidden)draw()}
 if(ev.ctrlKey&&!ev.altKey&&(ev.key==='='||ev.key==='+')){ev.preventDefault();ST.zoom=Math.min(200,ST.zoom+10);applyZoom();if(!panel.hidden)draw()}
 if(ev.ctrlKey&&!ev.altKey&&ev.key==='-'){ev.preventDefault();ST.zoom=Math.max(80,ST.zoom-10);applyZoom();if(!panel.hidden)draw()}
 if(ev.key==='Escape'&&ST.lens)setLens(false)});
setInterval(()=>{if(!panel.hidden&&ST.tab==='timer'&&ST.timer.run){const v=doc.getElementById('tmV');if(v)v.textContent=fmtDur(timerMs())}},1000);
function mount(){if(!doc.body)return setTimeout(mount,50);if(!doc.getElementById('nav'))return; doc.body.append(btn,panel,lens);applyZoom()}
mount();
})(typeof window!=='undefined'?window:globalThis);
