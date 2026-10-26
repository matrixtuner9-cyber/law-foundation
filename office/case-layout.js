/* ترتيب شاشة القضية بلا تكرار (يُحمَّل بعد كل الوحدات التي تضيف أزراراً وتبويبات):
   - شريط أوامر واحد بمجموعتين: «إضافة» و«أدوات»، بدل الأزرار المكررة في رأس الصفحة.
   - أربعة تبويبات فقط: سجل القضية · الدراسة والقرار · مسار التقاضي · ملف 360°.
   - الجلسات والمستندات والمهل والمراسلات وميزان والاجتهادات تُفتح من «سجل القضية» (المرشحات) أو من أزرار الإضافة،
     وتظهر معها عودة واضحة إلى السجل. */
(function(){
'use strict';
if(typeof V==='undefined'||typeof V.case!=='function')return;
const MAIN=[['hub','نظرة عامة'],['study','1 · الدراسة والقرار'],['hearings','2 · الجلسات ومحاضرها'],['track','3 · الأحكام والطعن'],['c360','ملف 360°']];
const SUB={docs:'المستندات',deadlines:'المهل',msgs:'مراسلات الموكل',mz:'سجل ميزان',rulings:'الاجتهادات المرتبطة',gather:'الدراسة والقرار'};
const v0=V.case;
V.case=function(){const html=v0.apply(this,arguments);const k=K(S.caseId);if(!k)return html;
 const t=document.createElement('template');t.innerHTML=html;const R=t.content;
 /* 1) رأس الصفحة: إبقاء الشارات والحالة فقط */
 R.querySelectorAll('.head .toolbar button, .head .toolbar a.btn').forEach(b=>b.remove());
 /* المرحلة والخطوة التالية أولاً: ماذا أفعل الآن؟ */
 const SS=window.MQ_station;
 if(window.MQ_steps){const box=document.createElement('div');box.innerHTML=MQ_steps.panel(k);const anchor=R.querySelector('.hub-strip')||R.querySelector('.hub-acts')||R.querySelector('.tabs');if(anchor)anchor.before(box.firstElementChild)}
 else if(SS&&SS.nextOf){const st=SS.stationOf(k),[nt,na]=SS.nextOf(k),ST=[['study','التقييم'],['pending','التسجيل'],['active','التقاضي'],['judgment','الحكم'],['appeal','الاستئناف'],['exec','التنفيذ'],['closed','مغلقة']].filter(x=>x[0]!=='appeal'||st==='appeal'||(k.track||[]).some(t=>/استئناف|نقض|إعادة محاكمة/.test(t.lvl||'')));
  const si=ST.findIndex(x=>x[0]===st);const box=document.createElement('section');box.className='cl-next';
  box.innerHTML=`<ol class="cl-steps">${ST.map((x,i)=>`<li class="${i<si?'done':i===si?'cur':''}">${x[1]}</li>`).join('')}</ol><div class="cl-now"><div><small>المرحلة الآن</small><b>${SS.stageOf(k)}</b></div><button class="btn pri" ${na}>الخطوة التالية: ${nt} ←</button></div>`;
  const anchor=R.querySelector('.hub-strip')||R.querySelector('.hub-acts')||R.querySelector('.tabs');if(anchor)anchor.before(box)}
 /* 2) شريط أوامر واحد */
 const acts=R.querySelector('.hub-acts');
 if(acts){const all=[...acts.querySelectorAll('button')];const add=[],tools=[];
  all.forEach(b=>{const tx=b.textContent.trim();(tx.startsWith('+')?add:tools).push(b)});
  const pb=document.createElement('button');pb.type='button';pb.className='btn sm';pb.dataset.act='printCase';pb.dataset.v=k.id;pb.textContent='طباعة';
  const doc=document.createElement('button');doc.type='button';doc.className='btn sm';doc.dataset.act='tplFor';doc.dataset.v=k.id;doc.textContent='مستند من نموذج';
  const seen=new Set();const uniq=a=>a.filter(b=>{const key=b.textContent.replace(/[^\p{L}\s]/gu,'').trim();if(seen.has(key))return false;seen.add(key);return true});
  const poa=document.createElement('button');poa.type='button';poa.className='btn sm';poa.dataset.act='csPrintPoa';poa.dataset.v=k.id;poa.textContent='طباعة الوكالة والأتعاب';
  const tl=uniq([...tools,poa,doc]);if(!tl.some(b=>/طباعة/.test(b.textContent)))tl.push(pb);
  tl.forEach(b=>b.classList.remove('gold'));
  acts.innerHTML='';acts.classList.add('cl-acts');
  const grp=(lb,bs)=>{const g=document.createElement('div');g.className='cl-grp';g.innerHTML=`<span class="cl-lb">${lb}</span>`;bs.forEach(b=>g.appendChild(b));return g};
  acts.appendChild(grp('إضافة',uniq(add)));acts.appendChild(grp('أدوات',tl))}
 /* 3) أربعة تبويبات */
 const tabs=R.querySelector('.tabs');
 if(tabs){const cur=S.caseTab==='gather'?'study':S.caseTab;
  tabs.innerHTML=MAIN.map(([id,lb])=>`<button class="${cur===id?'on':''}" data-act="caseTab" data-v="${id}">${lb}</button>`).join('');
  if(SUB[S.caseTab]&&S.caseTab!=='gather'){const bar=document.createElement('div');bar.className='cl-sub';bar.innerHTML=`<button type="button" class="link" data-act="caseTab" data-v="hub">→ نظرة عامة</button><b>${SUB[S.caseTab]}</b>`;tabs.after(bar)}}
 /* 4) مرشحات السجل: إضافة الاجتهادات وميزان كمداخل، دون تكرار */
 const fl=R.querySelector('.hub-filters');
 if(fl&&!fl.querySelector('[data-v="rulings"]')){const b=document.createElement('button');b.type='button';b.className='chip';b.dataset.act='caseTab';b.dataset.v='rulings';b.textContent='الاجتهادات';fl.appendChild(b)}
 const out=document.createElement('div');out.className='cl-case';out.appendChild(R.cloneNode(true));return out.outerHTML};
/* ملف القضية داخل حقيبة الموكل: كل الإجراءات في مكان واحد */
window.MQ_caseInBag=(c,ks)=>{if(!S.caseId||!ks.some(k=>k.id===S.caseId))S.caseId=(ks[0]||{}).id;if(!S.caseId)return '<section class="panel"><div class="empty">لا قضايا لهذا الموكل.</div></section>';
 const pick=ks.length>1?`<div class="cl-pick">${ks.map(k=>`<button type="button" class="chip ${k.id===S.caseId?'on':''}" data-act="openCase" data-v="${k.id}">${k.no&&k.no!=='قيد التسجيل'?k.no:'جديدة'} · ${String(k.subject||'').slice(0,30)}</button>`).join('')}</div>`:'';
 const t=document.createElement('template');t.innerHTML=V.case();const R=t.content;
 R.querySelectorAll('.hub-crumbs, [data-act="nav"][data-v="cases"]').forEach(x=>{const p=x.closest('nav,div');(p&&p.parentNode===R.firstElementChild?x:x).remove()});
 const out=document.createElement('div');out.className='cl-inbag';out.appendChild(R.cloneNode(true));return out.innerHTML};
{const oc=A.openCase;A.openCase=(v,...r)=>{const k=K(v);if(!k)return oc&&oc(v,...r);S.view='client';S.clientId=k.client;S.bagTab='case';S.caseId=v;if(!S.caseTab||!['hub','study','hearings','track','c360','docs','deadlines','msgs','mz','rulings','gather'].includes(S.caseTab)||S.lastCase!==v)S.caseTab='hub';S.lastCase=v;window.scrollTo(0,0);render()}}
A.printCase=v=>{if(window.MQP&&MQP.D&&MQP.D.case)MQP.open(MQP.D.case(v));else toast('الطباعة غير متاحة')};
const css=document.createElement('style');css.textContent=`
.cl-acts{display:flex!important;flex-wrap:wrap;gap:10px 22px!important;align-items:center}
.cl-grp{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.cl-lb{font-size:12px;color:var(--muted);font-weight:700;margin-inline-end:4px}
.cl-sub{display:flex;gap:12px;align-items:center;margin:8px 16px 0;font-size:14px}
.cl-sub b{font-weight:700}
.cl-case{display:contents}
.cl-pick{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}
.cl-inbag .head h1{font-size:24px}
.cl-case .head .toolbar .btn{display:none!important}
.cl-next{margin:10px 16px 4px;border:1px solid var(--brass,#B9965A);border-radius:16px;padding:12px 14px;background:linear-gradient(180deg,rgb(185 150 90 / .10),transparent)}
.cl-steps{list-style:none;display:flex;flex-wrap:wrap;gap:4px;margin:0 0 10px;padding:0;counter-reset:c}
.cl-steps li{counter-increment:c;font-size:12.5px;padding:4px 10px 4px 12px;border-radius:999px;background:var(--surface,#F2EEE6);color:var(--muted)}
.cl-steps li::before{content:counter(c) ' · '}
.cl-steps li.done{color:var(--ok,#2E7D5B)}.cl-steps li.done::before{content:'✓ '}
.cl-steps li.cur{background:var(--brass,#B9965A);color:#fff;font-weight:700}
.cl-now{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;justify-content:space-between}.cl-now small{display:block;color:var(--muted);font-size:12px}.cl-now b{font-size:15.5px}`;document.head.appendChild(css);
})();
/* «الاستعلامات والتقارير»: باب واحد يضم الموكلين والقضايا والجلسات والمستندات والمراسلات والتقارير بدل تناثرها في القائمة الجانبية */
(function(){
if(typeof NAV==='undefined'||typeof V==='undefined')return;
const Q=[['clients','الموكلون'],['cases','القضايا'],['agenda','الجلسات والمواعيد'],['docs','المستندات'],['chats','المراسلات'],['reports','التقارير']];
const IDS=Q.map(q=>q[0]);
const tidy=()=>{for(let i=NAV.length-1;i>=0;i--)if(IDS.includes(NAV[i][0])&&NAV[i][0]!=='reports')NAV.splice(i,1);
 const r=NAV.findIndex(n=>n[0]==='reports');if(r>=0){const [x]=NAV.splice(r,1);x[1]='الاستعلامات والتقارير';const d=NAV.findIndex(n=>n[0]==='dash');NAV.splice(d+1,0,x)}};
tidy();
const strip=cur=>`<div class="tabs rq-tabs" role="tablist" aria-label="الاستعلامات">${Q.map(([id,lb])=>`<button class="${cur===id?'on':''}" data-act="nav" data-v="${id}">${lb}</button>`).join('')}</div>`;
IDS.forEach(id=>{const f=V[id];if(typeof f!=='function')return;V[id]=function(){const h=f.apply(this,arguments);return strip(id)+(id==='cases'?h.replace('<h1>القضايا</h1>','<h1>استعلام القضايا</h1>'):h)}});
/* إبراز «الاستعلامات والتقارير» في القائمة عند أي من هذه الشاشات */
const dn=window.drawNav;if(typeof dn==='function')window.drawNav=function(){dn.apply(this,arguments);if(IDS.includes(S.view)||S.view==='client'||S.view==='case'){const b=document.querySelector('#nav button[data-v="reports"]');if(b){document.querySelectorAll('#nav button.on').forEach(x=>x.classList.remove('on'));b.classList.add('on')}}};
const css=document.createElement('style');css.textContent='.rq-tabs{margin:0 0 14px!important}';document.head.appendChild(css);
})();
/* «المكتبة القانونية» تضم العقود والنماذج */
(function(){
if(typeof NAV==='undefined'||typeof V==='undefined')return;
const Q=[['lawlib','المكتبة القانونية'],['tpls','العقود والنماذج']],IDS=Q.map(q=>q[0]);
const t=NAV.findIndex(n=>n[0]==='tpls');if(t>=0)NAV.splice(t,1);
const strip=cur=>`<div class="tabs rq-tabs" role="tablist" aria-label="المكتبة القانونية">${Q.map(([id,lb])=>`<button class="${cur===id?'on':''}" data-act="nav" data-v="${id}">${lb}</button>`).join('')}</div>`;
IDS.forEach(id=>{const f=V[id];if(typeof f==='function')V[id]=function(){return strip(id)+f.apply(this,arguments)}});
const dn=window.drawNav;if(typeof dn==='function')window.drawNav=function(){dn.apply(this,arguments);if(S.view==='tpls'){const b=document.querySelector('#nav button[data-v="lawlib"]');if(b){document.querySelectorAll('#nav button.on').forEach(x=>x.classList.remove('on'));b.classList.add('on')}}};
})();
