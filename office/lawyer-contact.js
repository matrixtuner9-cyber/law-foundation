/* ── تواصل مع محامٍ بخصوص القضية ──
   زر في ملف القضية: يختار المحامي من دليل النقابة (محامي الخصم يُقترح تلقائياً)، ويجهّز رسالة بتفاصيل القضية
   تُرسل عبر واتساب أو تُنسخ أو يُتصل بالرقم. كل تواصل يُسجَّل ملاحظةً في سجل القضية.
   لا يُرسل شيء تلقائياً: الرسالة تُفتح في واتساب ليراجعها المحامي ويضغط إرسال بنفسه.
   ملاحظة مهنية: التواصل مع وكيل الخصم لا مع الخصم نفسه. */
(function(){
'use strict';
const root=typeof window!=='undefined'?window:globalThis;
/* رقم واتساب دولي من رقم محلي: 059/056 جوال فلسطيني (970)، و05x الأخرى إسرائيلي (972)؛ الأرضي لا يصلح لواتساب */
function waNumber(p){let d=String(p||'').replace(/[^\d+]/g,'');if(!d)return '';
 if(d.startsWith('+'))d=d.slice(1);else if(d.startsWith('00'))d=d.slice(2);
 if(/^(970|972)5\d{8}$/.test(d))return d;
 if(/^05\d{8}$/.test(d))return (/^05[69]/.test(d)?'970':'972')+d.slice(1);
 if(/^5\d{8}$/.test(d))return (/^5[69]/.test(d)?'970':'972')+d;
 return ''}
const isMobile=p=>!!waNumber(p);
/* اسم المحامي دون اللقب، للبحث في الدليل */
const bare=s=>String(s||'').replace(/^(?:الأستاذة?|الاستاذة?|المحامية?|أ\.|ا\.|د\.)\s*/g,'').replace(/^(?:الأستاذة?|المحامية?)\s*/,'').trim();
const REASONS=[['','— بدون —'],['coord','تنسيق بخصوص الجلسة القادمة'],['settle','بحث إمكانية التسوية الودية'],['exchange','تبادل اللوائح أو البينات'],['adjourn','طلب التأجيل باتفاق الطرفين'],['proxy','الإنابة في حضور الجلسة'],['other','أخرى']];
const REASON_TXT={coord:'أرجو التنسيق معك بخصوص الجلسة القادمة.',settle:'أود بحث إمكانية التسوية الودية في هذه القضية إن كان ذلك مناسباً لموكلك.',exchange:'بخصوص تبادل اللوائح والبينات في القضية.',adjourn:'أود الاتفاق على طلب تأجيل الجلسة القادمة إن لم يكن لديك مانع.',proxy:'أرجو إن أمكن إنابتك عني في حضور الجلسة القادمة، وسأرسل لك ملخص القضية وما هو مطلوب.',other:''};
function compose(k,o){const s=(root.MQ&&MQ.settings)||{},me=(root.MQ&&MQ.user&&MQ.user.name)||s.lawyerName||'';
 // الدليل لا يذكر الجنس، والتخمين من الاسم غير مضمون (دعاء، وفاء، علاء…): صيغة محايدة يعدّلها المحامي
 const lines=[`الزميل/ة الأستاذ/ة ${o.name||''} المحترم/ة،`,'تحية طيبة وبعد،',
  `معك ${me?('المحامي '+me):'المحامي'}${(s.officeName||o.office)?' من '+(s.officeName||o.office):''}.`,
  `أتواصل معك بخصوص القضية رقم ${o.no||'—'}${o.court?' لدى '+o.court:''}${o.subject?' ('+o.subject+')':''}.`];
 if(o.next)lines.push(`الجلسة القادمة بتاريخ ${o.next}.`);
 if(REASON_TXT[o.reason])lines.push(REASON_TXT[o.reason]);
 if(o.extra)lines.push(o.extra);
 lines.push('','مع الاحترام،',me||'');return lines.join('\n').trim()}
if(typeof module!=='undefined')module.exports={waNumber,isMobile,bare,compose};
if(typeof document==='undefined')return;

const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const st={k:null,q:'',rows:[],sel:null,reason:'',extra:'',busy:false,total:0,manual:''};
const courtName=k=>{try{const c=(typeof courts!=='undefined'?courts:[]).find(c=>c.id===k.court);return c?c.name:(k.court||'')}catch(x){return ''}};
const nextHearing=k=>{try{const t=new Date().toISOString().slice(0,10);const h=(typeof hearings!=='undefined'?hearings:[]).filter(h=>h.k===k.id&&h.date>=t).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0];if(!h)return '';const[y,m,d]=h.date.split('-');return `${+d}/${+m}/${y}${h.time?' الساعة '+h.time:''}`}catch(x){return ''}};
const oppLawyers=k=>{try{return (k.opps||[]).map(id=>(typeof opponents!=='undefined'?opponents:[]).find(o=>o.id===id)).filter(o=>o&&o.lawyer&&!/النيابة/.test(o.lawyer)).map(o=>({lawyer:bare(o.lawyer),opp:o.name}))}catch(x){return []}};
function msgText(){const k=st.k,o=st.sel||{};return compose(k,{name:o.name||'',no:k.no,court:courtName(k),subject:k.subject,next:nextHearing(k),reason:st.reason,extra:st.extra})}
function search(q){st.q=q;st.busy=true;draw();
 fetch('/api/bar?limit=12&q='+encodeURIComponent(q)).then(r=>r.ok?r.json():{rows:[],total:0}).then(d=>{if(st.q!==q)return;st.rows=d.rows||[];st.total=d.total||0;st.busy=false;draw()}).catch(()=>{st.busy=false;st.rows=[];draw()})}
let tq=null;
function modal(){const k=st.k,ops=oppLawyers(k);
 document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal lc-m" role="dialog" aria-label="تواصل مع محامٍ"><div class="head"><h1 style="font-size:22px">تواصل مع محامٍ بخصوص القضية ${e(k.no||'')}</h1><button class="x" data-act="close" aria-label="إغلاق">✕</button></div>
  <div class="lc-grid"><div class="lc-left">
   ${ops.length?`<div class="lc-ops"><span>وكيل الخصم في القضية:</span>${ops.map(x=>`<button type="button" class="chip" data-act="lcQ" data-v="${e(x.lawyer)}">${e(x.lawyer)} <small>· عن ${e(x.opp)}</small></button>`).join('')}</div>`:''}
   <input class="field" id="lcQ" placeholder="ابحث في دليل النقابة بالاسم أو رقم العضوية أو الهاتف…" value="${e(st.q)}" autocomplete="off">
   <div id="lcRes" class="lc-res"></div>
  </div><div class="lc-right" id="lcMsg"></div></div></div></div>`;
 const i=document.getElementById('lcQ');i.addEventListener('input',()=>{clearTimeout(tq);const v=i.value.trim();tq=setTimeout(()=>v.length>=2?search(v):(st.rows=[],draw()),250)});
 if(!st.q&&ops[0]){i.value=ops[0].lawyer;search(ops[0].lawyer)}else draw();i.focus()}
function draw(){const r=document.getElementById('lcRes'),m=document.getElementById('lcMsg');if(!r||!m)return;
 r.innerHTML=st.busy?'<div class="m">جارٍ البحث في الدليل…</div>':st.rows.length?st.rows.map((x,i)=>{const mob=(x.phones||[]).filter(isMobile);return `<button type="button" class="lc-row ${st.sel&&st.sel.mno===x.mno?'on':''}" data-act="lcPick" data-v="${i}"><b>${e(x.name)}</b><span>${e(x.mno)} · ${e(x.city||'')} · ${e(x.status||'')}</span><span class="mono" dir="ltr">${e((x.phones||[]).join(' · ')||'لا رقم في الدليل')}</span>${mob.length?'':'<em>لا جوال لواتساب</em>'}</button>`}).join('')+(st.total>st.rows.length?`<div class="m">${st.total} نتيجة — دقّق البحث لتضييقها</div>`:''):st.q.length>=2?'<div class="m">لا نتائج في الدليل. تأكد من الاسم، أو اكتب الرقم يدوياً في الجهة المقابلة.</div>':'<div class="m">اكتب اسم المحامي للبحث في دليل النقابة.</div>';
 const o=st.sel;const phones=o?(o.phones||[]):[];const mob=phones.map(waNumber).filter(Boolean);const manual=waNumber(st.manual);const wa=mob[0]||manual;
 m.innerHTML=`${o?`<div class="lc-who"><b>${e(o.name)}</b><span>${e(o.mno)} · ${e(o.city||'')}${o.office?' · '+e(o.office):''}</span></div>`:'<div class="lc-who m">اختر المحامي من القائمة</div>'}
  <label>سبب التواصل<select class="field" id="lcR">${REASONS.map(([v,t])=>`<option value="${v}"${v===st.reason?' selected':''}>${t}</option>`).join('')}</select></label>
  <label>إضافة<input class="field" id="lcX" value="${e(st.extra)}" placeholder="جملة تضيفها للرسالة (اختياري)"></label>
  <label>الرسالة <small class="m">يمكنك تعديلها قبل الإرسال</small><textarea class="field" id="lcT" rows="9">${e(o?msgText():'')}</textarea></label>
  ${o&&!mob.length?`<label>رقم جوال المحامي (غير موجود في الدليل)<input class="field mono" id="lcPh" dir="ltr" value="${e(st.manual)}" placeholder="059xxxxxxx"></label>`:''}
  <div class="lc-acts"><button type="button" class="btn pri" data-act="lcSend" ${o&&wa?'':'disabled'}>إرسال عبر واتساب</button>${o&&phones[0]?`<a class="btn" href="tel:${e(phones[0])}" data-act="lcCall">اتصال ${e(phones[0])}</a>`:''}<button type="button" class="btn" data-act="lcCopy" ${o?'':'disabled'}>نسخ الرسالة</button></div>
  <p class="m lc-note">تُفتح الرسالة في واتساب لتراجعها وتضغط إرسال بنفسك، ويُسجَّل التواصل في سجل القضية. التواصل يكون مع وكيل الخصم لا مع الخصم نفسه.</p>`;
 const R=document.getElementById('lcR'),X=document.getElementById('lcX'),P=document.getElementById('lcPh'),T=document.getElementById('lcT');
 const re=()=>{if(T&&st.sel)T.value=msgText()};
 if(R)R.onchange=()=>{st.reason=R.value;re()};if(X)X.oninput=()=>{st.extra=X.value;re()};
 if(P)P.oninput=()=>{st.manual=P.value;const b=document.querySelector('[data-act="lcSend"]');if(b)b.disabled=!waNumber(P.value)}}
function log(how){const k=st.k,o=st.sel;if(!k||!o)return;const s=(root.MQ&&MQ.user&&MQ.user.name)||'';const at=new Date();const p=n=>String(n).padStart(2,'0');
 const why=(REASONS.find(r=>r[0]===st.reason)||['',''])[1];
 k.notes=[...(k.notes||[]),{id:'n'+Date.now().toString(36),at:`${at.getFullYear()}-${p(at.getMonth()+1)}-${p(at.getDate())} ${p(at.getHours())}:${p(at.getMinutes())}`,by:s,kind:'lawyer-contact',text:`تواصل مع المحامي ${o.name} (عضوية ${o.mno}) ${how}${st.reason&&st.reason!=='other'?' — '+why:''}`}];
 if(root.MQ&&MQ.saveState)MQ.saveState()}

A.lcOpen=v=>{const k=(typeof K==='function')?K(v||S.caseId):null;if(!k)return;Object.assign(st,{k,q:'',rows:[],sel:null,reason:'',extra:'',manual:'',total:0});modal()};
A.lcQ=v=>{const i=document.getElementById('lcQ');if(i)i.value=v;search(v)};
A.lcPick=v=>{st.sel=st.rows[+v]||null;st.manual='';draw()};
A.lcSend=()=>{const o=st.sel;if(!o)return;const T=document.getElementById('lcT');const n=(o.phones||[]).map(waNumber).find(Boolean)||waNumber(st.manual);if(!n)return;
 window.open('https://wa.me/'+n+'?text='+encodeURIComponent(T?T.value:msgText()),'_blank','noopener');log("عبر واتساب");if(typeof toast==="function")toast('فُتحت الرسالة في واتساب وسُجّل التواصل في القضية');A.close();typeof render==='function'&&render()};
A.lcCall=()=>{log('باتصال هاتفي')};
A.lcCopy=()=>{const T=document.getElementById('lcT');const t=T?T.value:msgText();(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>{log('برسالة منسوخة');typeof toast==='function'&&toast('نُسخت الرسالة وسُجّل التواصل في القضية')}).catch(()=>{if(T){T.select();document.execCommand('copy');log('برسالة منسوخة')}})};
/* الزر في شريط أوامر القضية (قبل أن يرتبه case-layout.js في مجموعة «أدوات») */
if(typeof V!=='undefined'&&typeof V.case==='function'){const v0=V.case;V.case=function(){const h=v0.apply(this,arguments);const k=K(S.caseId);if(!k)return h;
 return h.replace(/(<div class="hub-acts"[^>]*>)/,`$1<button type="button" class="btn sm" data-act="lcOpen" data-v="${e(k.id)}">تواصل مع محامٍ</button>`)}}
const css=document.createElement('style');css.textContent=`
.lc-m{max-width:980px;width:min(980px,96vw)}
.lc-grid{display:grid;grid-template-columns:1fr 1.1fr;gap:16px}@media(max-width:800px){.lc-grid{grid-template-columns:1fr}}
.lc-ops{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:8px}.lc-ops>span{font-size:12.5px;color:var(--muted,#6B5E44)}
.lc-res{margin-top:8px;max-height:52vh;overflow:auto;display:flex;flex-direction:column;gap:6px}
.lc-row{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:right;padding:9px 12px;border:1px solid var(--line,#E5DCC6);border-radius:10px;background:var(--surface,#fff);cursor:pointer;font:inherit}
.lc-row:hover{border-color:#C9A24A}.lc-row.on{border-color:#C9A24A;background:#FBF3DD;box-shadow:0 0 0 2px rgb(201 162 74 / .25)}
.lc-row span{font-size:12.5px;color:var(--muted,#6B5E44)}.lc-row em{font-size:11.5px;color:#9A6B00;font-style:normal}
.lc-right{display:flex;flex-direction:column;gap:8px}.lc-right label{display:flex;flex-direction:column;gap:4px;font-size:13px}
.lc-who{padding:10px 12px;border-radius:10px;background:#0B1B2B;color:#F2E6C4}.lc-who b{display:block;color:#F3D58A}.lc-who span{font-size:12.5px}.lc-who.m{background:var(--surface,#F4F1EA);color:inherit}
.lc-right textarea{font-size:14px;line-height:1.9}
.lc-acts{display:flex;gap:8px;flex-wrap:wrap}.lc-note{font-size:12px}
html.night .lc-row.on{background:#2A2618}`;
document.head.appendChild(css);
})();
