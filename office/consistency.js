/* ── فحص اتساق البيانات: يكشف الثغرات والتناقضات بين الموكلين والقضايا والجلسات والمهل والأتعاب والرسائل ──
   الفحص نفسه دالة نقية (قابلة للاختبار)، والواجهة: تنبيهات القضية داخل ملفها الموحّد + شاشة شاملة للمكتب */
(function(root){
'use strict';
const nz=s=>String(s||'').normalize('NFKC').replace(/[ً-ْـ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/\s+/g,' ').trim();
const dOk=s=>/^\d{4}-\d{2}-\d{2}/.test(String(s||''));
const closed=k=>/منته|مغلق|محفوظ/.test(String(k.status||''));
const normNo=s=>String(s||'').replace(/\s+/g,'').replace(/\\/g,'/');
const days=(a,b)=>Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/864e5);

/* كل نتيجة: {level:'bad'|'warn'|'info', code, text, k?, client?, fix?:[act,v,label]} */
function checks(data,today){
 const out=[],cs=data.clients||[],ks=data.cases||[],hs=data.hearings||[],dl=data.deadlines||[],ms=data.messages||{};
 const cById=new Map(cs.map(c=>[c.id,c])),opp=new Map((data.opponents||[]).map(o=>[o.id,o]));
 const add=(level,code,text,o={})=>out.push({level,code,text,...o});
 const seen=new Map();
 for(const k of ks){
  const c=cById.get(k.client),no=k.no||'قيد التسجيل';
  if(!c){add('bad','case.noClient',`القضية ${no} غير مرتبطة بموكل موجود`,{k:k.id,fix:['openCase',k.id,'فتح القضية']});continue}
  const ops=(k.opps||[]).map(id=>opp.get(id)).filter(Boolean);
  if(!ops.length||ops.every(o=>/غير محدد/.test(o.name||'')))add('warn','case.noOpp',`القضية ${no} بلا خصم محدد`,{k:k.id,client:c.id,fix:['openCase',k.id,'استكمال البيانات']});
  for(const o of ops){const on=nz(o.name);if(on.length>=3){const twin=cs.find(x=>x.id!==c.id&&nz(x.name)===on);if(twin)add('bad','case.conflict',`الخصم «${o.name}» في القضية ${no} موكل لدى المكتب أيضاً: تضارب مصالح محتمل`,{k:k.id,client:c.id,fix:['openClient',twin.id,'فتح حقيبة '+twin.name]})}}
  const n=normNo(k.no);
  if(n&&!/قيد/.test(n)){const key=n+'|'+(k.court||'');if(seen.has(key))add('bad','case.dupNo',`رقم الدعوى ${k.no} مكرر في المحكمة نفسها (ملفان لقضية واحدة؟)`,{k:k.id,client:c.id,fix:['openCase',seen.get(key),'فتح الملف الآخر']});else seen.set(key,k.id)}
  else if(!closed(k)&&dOk(k.opened)&&days(k.opened.slice(0,10),today)>30)add('warn','case.unregistered',`القضية «${k.subject||''}» ما زالت «قيد التسجيل» منذ ${days(k.opened.slice(0,10),today)} يوماً`,{k:k.id,client:c.id,fix:['openCase',k.id,'إدخال رقم الدعوى']});
  if(!closed(k)){
   const mine=hs.filter(h=>h.k===k.id&&dOk(h.date));
   if(!mine.some(h=>h.date>=today))add('warn','case.noNext',`القضية ${no} نشطة بلا جلسة قادمة`,{k:k.id,client:c.id,fix:['hubTab','hearings','تحديد جلسة']});
   const past=mine.filter(h=>h.date<today&&!h.result);
   if(past.length)add('warn','case.noResult',`${past.length===1?'جلسة سابقة':past.length+' جلسات سابقة'} في القضية ${no} بلا قرار مسجّل`,{k:k.id,client:c.id,fix:['hubTab','hearings','تسجيل القرار']});
   const late=dl.filter(d=>d.k===k.id&&dOk(d.due)&&d.due<today&&!d.done);
   if(late.length)add('bad','case.lateDeadline',`${late.length===1?'مهلة':late.length+' مهل'} في القضية ${no} تجاوزت تاريخها دون إقفال: ${late[0].title||''}`,{k:k.id,client:c.id,fix:['hubTab','deadlines','مراجعة المهل']});
  }
  if((+k.fee||0)>0){const paid=(c.payments||[]).filter(p=>p.k===k.id).reduce((t,p)=>t+(+p.amount||0),0);if(paid>+k.fee)add('warn','case.overpaid',`المدفوع للقضية ${no} (${paid}) يتجاوز أتعابها (${k.fee})`,{k:k.id,client:c.id})}
 }
 for(const c of cs){
  const mine=ks.filter(k=>k.client===c.id);
  if((+c.paid||0)>(+c.fee||0)&&(+c.fee||0)>0)add('warn','client.overpaid',`المدفوع من ${c.name} يتجاوز الأتعاب المتفق عليها`,{client:c.id,fix:['openClient',c.id,'مراجعة الأتعاب']});
  if(!mine.length)add('info','client.noCase',`الموكل ${c.name} بلا قضية (استشارة؟)`,{client:c.id,fix:['caseFor',c.id,'فتح قضية']});
  if(mine.filter(k=>!closed(k)).length>1){const un=(ms[c.id]||[]).filter(m=>m.f!=='me'&&m.type!=='notice'&&!m.k&&m.type!=='text').length;
   if(un)add('info','client.untagged',`${un} ${un===1?'مرفق':'مرفقات'} من ${c.name} غير مربوطة بقضية (له أكثر من قضية جارية)`,{client:c.id,fix:['bag',c.id,'ربط المرفقات']})}
 }
 const rank={bad:0,warn:1,info:2};return out.sort((a,b)=>rank[a.level]-rank[b.level]);
}
if(typeof module!=='undefined'&&module.exports){module.exports={checks};return}
if(!root||!root.document)return;

const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const today=()=>typeof iso==='function'?iso(TODAY):new Date().toISOString().slice(0,10);
const DATA=()=>({clients,cases,hearings,deadlines,messages,opponents:typeof opponents!=='undefined'?opponents:[]});
const LV={bad:['bad','يحتاج تصحيحاً'],warn:['warn','للمراجعة'],info:['info','للعلم']};
const row=x=>`<li class="qc-${x.level}"><span class="qc-dot" aria-hidden="true"></span><span class="qc-t">${e(x.text)}</span>${x.fix?`<button type="button" class="btn sm" data-act="qcGo" data-v="${e(x.fix[0]+'|'+x.fix[1]+'|'+(x.k||''))}">${e(x.fix[2])}</button>`:''}</li>`;
root.MQ_checks=()=>checks(DATA(),today());

/* (1) داخل ملف القضية: تنبيهات القضية نفسها فوق السجل */
const ctab=root.caseTab;
if(typeof ctab==='function')root.caseTab=k=>{const h=ctab(k);if(S.caseTab!=='hub')return h;
 const r=checks(DATA(),today()).filter(x=>x.k===k.id&&x.level!=='info');
 return (r.length?`<section class="qc-box"><header><b>ما ينقص هذا الملف (${r.length})</b><span class="m">يُصحَّح من مكانه بضغطة واحدة</span></header><ul>${r.map(row).join('')}</ul></section>`:'')+h};

/* (2) شاشة شاملة للمكتب */
const QC={lv:'all'};
A.qcOpen=()=>{const all=root.MQ_checks(),n=l=>all.filter(x=>x.level===l).length,list=QC.lv==='all'?all:all.filter(x=>x.level===QC.lv);
 const chip=(v,lb,c)=>`<button type="button" class="chip ${QC.lv===v?'on':''}" data-act="qcLv" data-v="${v}">${lb} <small>${c}</small></button>`;
 document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog" aria-label="سلامة بيانات المكتب" style="max-width:820px"><div class="head"><h1 style="font-size:22px">سلامة بيانات المكتب</h1><button class="btn sm" data-act="close">إغلاق</button></div>
  <p class="note">فحص تلقائي يربط الموكلين بالقضايا والجلسات والمهل والأتعاب والمرفقات، ويُظهر ما ينقص أو يتناقض. لا يغيّر شيئاً بنفسه.</p>
  <div class="hub-filters">${chip('all','الكل',all.length)}${chip('bad',LV.bad[1],n('bad'))}${chip('warn',LV.warn[1],n('warn'))}${chip('info',LV.info[1],n('info'))}</div>
  ${list.length?`<ul class="qc-list">${list.map(row).join('')}</ul>`:'<div class="empty">لا ملاحظات. البيانات متسقة ✓</div>'}</div></div>`};
A.qcLv=v=>{QC.lv=v;A.qcOpen()};
A.qcGo=v=>{const [act,id,k]=String(v).split('|');A.close&&A.close();
 if(act==='hubTab'){if(k&&A.openCase)A.openCase(k);return A.hubTab&&A.hubTab(id)}
 if(typeof A[act]==='function')A[act](id)};

/* زر الشاشة مع عدّاد، في رأس «الجلسات والمهل» و«الموكلين» */
function inject(){const pg=document.getElementById('page');if(!pg||!['agenda','clients','cases'].includes(S.view))return;
 const head=pg.querySelector('.head');if(!head||head.querySelector('[data-act="qcOpen"]'))return;
 const all=root.MQ_checks(),bad=all.filter(x=>x.level==='bad').length,warn=all.filter(x=>x.level==='warn').length;
 head.insertAdjacentHTML('beforeend',`<button type="button" class="btn qc-btn ${bad?'bad':warn?'warn':'ok'}" data-act="qcOpen" title="فحص اتساق البيانات">${bad||warn?`سلامة البيانات · <b class="num">${bad+warn}</b>`:'البيانات متسقة ✓'}</button>`)}
const r0=render;render=function(){r0();try{inject()}catch(x){console.warn(x)}};

const css=document.createElement('style');css.textContent=`
.qc-box{border:1px solid #F59E0B;background:color-mix(in srgb,#F59E0B 7%,transparent);border-radius:12px;padding:10px 14px;margin-bottom:12px}
.qc-box header{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;margin-bottom:6px}.qc-box .m{color:var(--muted);font-size:12.5px}
.qc-box ul,.qc-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.qc-box li,.qc-list li{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.qc-t{flex:1;min-width:200px}
.qc-dot{width:9px;height:9px;border-radius:50%;flex:none;background:#94A3B8}.qc-bad .qc-dot{background:#DC2626}.qc-warn .qc-dot{background:#F59E0B}
.qc-list li{border-bottom:1px solid var(--line);padding:8px 0}
.qc-btn.bad{border-color:#DC2626;color:#B91C1C}.qc-btn.warn{border-color:#F59E0B;color:#B45309}.qc-btn.ok{color:#15803D}`;document.head.appendChild(css);
})(typeof window!=='undefined'?window:null);
