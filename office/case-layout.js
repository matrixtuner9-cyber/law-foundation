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
 if(SS&&SS.nextOf){const st=SS.stationOf(k),[nt,na]=SS.nextOf(k),ST=[['study','التقييم'],['pending','التسجيل'],['active','التقاضي'],['judgment','الحكم'],['appeal','الاستئناف'],['exec','التنفيذ'],['closed','مغلقة']].filter(x=>x[0]!=='appeal'||st==='appeal'||(k.track||[]).some(t=>/استئناف|نقض|إعادة محاكمة/.test(t.lvl||'')));
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
  const tl=uniq([...tools,doc]);if(!tl.some(b=>/طباعة/.test(b.textContent)))tl.push(pb);
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
A.printCase=v=>{if(window.MQP&&MQP.D&&MQP.D.case)MQP.open(MQP.D.case(v));else toast('الطباعة غير متاحة')};
const css=document.createElement('style');css.textContent=`
.cl-acts{display:flex!important;flex-wrap:wrap;gap:10px 22px!important;align-items:center}
.cl-grp{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.cl-lb{font-size:12px;color:var(--muted);font-weight:700;margin-inline-end:4px}
.cl-sub{display:flex;gap:12px;align-items:center;margin:8px 16px 0;font-size:14px}
.cl-sub b{font-weight:700}
.cl-case{display:contents}
.cl-case .head .toolbar .btn{display:none!important}
.cl-next{margin:10px 16px 4px;border:1px solid var(--brass,#B9965A);border-radius:16px;padding:12px 14px;background:linear-gradient(180deg,rgb(185 150 90 / .10),transparent)}
.cl-steps{list-style:none;display:flex;flex-wrap:wrap;gap:4px;margin:0 0 10px;padding:0;counter-reset:c}
.cl-steps li{counter-increment:c;font-size:12.5px;padding:4px 10px 4px 12px;border-radius:999px;background:var(--surface,#F2EEE6);color:var(--muted)}
.cl-steps li::before{content:counter(c) ' · '}
.cl-steps li.done{color:var(--ok,#2E7D5B)}.cl-steps li.done::before{content:'✓ '}
.cl-steps li.cur{background:var(--brass,#B9965A);color:#fff;font-weight:700}
.cl-now{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;justify-content:space-between}.cl-now small{display:block;color:var(--muted);font-size:12px}.cl-now b{font-size:15.5px}`;document.head.appendChild(css);
})();
