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
/* القائمة الجانبية المختصرة: خمسة أبواب، وداخل كل باب تبويبات بدل تناثر العناصر */
(function(){
if(typeof NAV==='undefined'||typeof V==='undefined')return;
const GROUPS=[
 {id:'reports',lb:'الاستعلامات والتقارير',tabs:[['clients','الموكلون'],['cases','القضايا'],['agenda','المواعيد والجلسات'],['docs','المستندات'],['chats','المراسلات'],['reports','التقارير']],alsoOn:['client','case']},
 {id:'lawlib',lb:'المكتبة القانونية',tabs:[['lawlib','المكتبة القانونية'],['tpls','العقود والنماذج']]}];
const groupOf=v=>GROUPS.find(g=>g.tabs.some(t=>t[0]===v)||(g.alsoOn||[]).includes(v));
const strip=(g,cur)=>`<div class="tabs rq-tabs" role="tablist" aria-label="${g.lb}">${g.tabs.map(([id,lb])=>`<button class="${cur===id?'on':''}" data-act="nav" data-v="${id}">${lb}</button>`).join('')}</div>`;
/* يُعاد مع كل رسم للقائمة لأن بعض الوحدات تضيف عناصرها لاحقاً. الأقسام القانونية الأخرى تبقى بأسمائها الكاملة ومكانها */
function tidy(){const grp=new Set(GROUPS.flatMap(g=>g.tabs.map(t=>t[0])));let changed=false;
 GROUPS.forEach(g=>{const entry=g.tabs[0][0];g.entry=entry;
  for(let i=NAV.length-1;i>=0;i--){const n=NAV[i];if(n.length>1&&grp.has(n[0])&&g.tabs.some(t=>t[0]===n[0])&&n[0]!==entry){NAV.splice(i,1);changed=true}}
  let e=NAV.findIndex(n=>n[0]===entry);
  if(e<0){const d=NAV.findIndex(n=>n[0]==='dash');NAV.splice(d+1+GROUPS.indexOf(g),0,[entry,g.lb]);changed=true}else if(NAV[e][1]!==g.lb){NAV[e][1]=g.lb;changed=true}});
 const r=NAV.findIndex(n=>n[0]==='clients'),d=NAV.findIndex(n=>n[0]==='dash');if(r>d+1){const [x]=NAV.splice(r,1);NAV.splice(d+1,0,x)}
 GROUPS.forEach(g=>g.tabs.forEach(([id])=>{const f=V[id];if(typeof f!=='function'||f._grp)return;const w=function(){const h=f.apply(this,arguments);return strip(g,id)+(id==='cases'?h.replace('<h1>القضايا</h1>','<h1>استعلام القضايا</h1>'):h)};w._grp=1;V[id]=w}))}
tidy();
const dn=window.drawNav;if(typeof dn==='function')window.drawNav=function(){tidy();dn.apply(this,arguments);const g=groupOf(S.view);if(g){const b=document.querySelector(`#nav button[data-v="${g.entry}"]`);if(b){document.querySelectorAll('#nav button.on').forEach(x=>x.classList.remove('on'));b.classList.add('on')}}};
const css=document.createElement('style');css.textContent='.rq-tabs{margin:0 0 14px!important}';document.head.appendChild(css);
window.MQ_navGroups=GROUPS;
})();
/* الرئيسية: «ما يحتاج انتباهك الآن» — قائمة واحدة مرتبة بالأولوية، لكل بند زر واحد */
(function(){
if(typeof V==='undefined'||typeof V.dash!=='function')return;
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function items(){const T=iso(TODAY),tm=(()=>{const d=new Date(T+'T00:00:00');d.setDate(d.getDate()+1);return iso(d)})(),H=typeof hearings!=='undefined'?hearings:[],DL=typeof deadlines!=='undefined'?deadlines:[];
 const live=k=>k&&k.status!=='منتهية'&&!k.closed;const out=[];const nm=k=>(C(k.client)||{}).name||'';
 H.filter(h=>(h.date===T||h.date===tm)&&!h.result&&live(K(h.k))).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).forEach(h=>{const k=K(h.k);
  out.push({p:1,ic:'⚖️',cls:'hot',t:`جلسة ${h.date===T?'اليوم':'غداً'} ${esc(h.time||'')} · ${esc(k.no)}`,s:`${esc(nm(k))} · ${esc((CT(k.court)||{}).name||'')}${h.purpose?' · '+esc(h.purpose):''}${h.attend?' · حضور الموكل مطلوب':''}`,b:['تحضير الجلسة','hpGoCase',k.id]})});
 H.filter(h=>h.date<T&&!h.result&&live(K(h.k))).sort((a,b)=>b.date.localeCompare(a.date)).forEach(h=>{const k=K(h.k);
  out.push({p:2,ic:'📝',cls:'warn',t:`ما جرى في جلسة ${dmy(h.date)} · ${esc(k.no)}`,s:`${esc(nm(k))} ينتظر الخبر${h.purpose?' · '+esc(h.purpose):''}`,b:['تسجيل ما جرى','hrOpen',h.id]})});
 DL.filter(d=>live(K(d.k))&&diff(d.due)<=3&&!d.done).sort((a,b)=>a.due.localeCompare(b.due)).forEach(d=>{const k=K(d.k),n=diff(d.due);
  out.push({p:n<0?0:2,ic:'⏳',cls:n<=0?'hot':'warn',t:`${esc(d.title)}`,s:`${n<0?'متأخرة '+(-n)+' يوم':n===0?'آخر يوم اليوم':'بعد '+n+' يوم'} · ${esc(k.no)} · ${esc(nm(k))}`,b:['فتح القضية','openCase',k.id]})});
 if(window.MQ_station)(typeof cases!=='undefined'?cases:[]).filter(live).forEach(k=>{const st=MQ_station.stationOf(k);
  if(st==='judgment'&&!(k.post&&k.post.rec&&k.post.rec!=='wait'))out.push({p:2,ic:'📜',cls:'warn',t:`حكم بانتظار قرارك · ${esc(k.no)}`,s:`${esc(nm(k))} · ${esc(MQ_station.stageOf(k))}`,b:['استئناف أم تنفيذ؟','stPostOpen',k.id]});
  if((st==='study'||st==='pending')&&window.MQ_steps){const c=MQ_steps.current(k);out.push({p:3,ic:'📂',cls:'',t:`${esc(k.subject||'قضية جديدة')} · الخطوة ${String(c.n).padStart(2,'0')}`,s:`${esc(nm(k))} · ${esc(c.t)}`,b:['متابعة','csGo',k.id+'|'+c.id]})}});
 (typeof clients!=='undefined'?clients:[]).forEach(c=>{const u=window.MQ_bag&&MQ_bag.unreadOf?MQ_bag.unreadOf(c.id):0;if(u)out.push({p:2,ic:'💬',cls:'',t:`${u} ${u===1?'رسالة':'رسائل'} من ${esc(c.name)}`,s:'لم تُقرأ بعد',b:['قراءة والرد','bag',c.id]})});
 return out.sort((a,b)=>a.p-b.p)}
const d0=V.dash;V.dash=function(){const html=d0.apply(this,arguments),it=items();
 const box=`<section class="now-box" aria-label="ما يحتاج انتباهك الآن"><header><b>ما يحتاج انتباهك الآن</b><span>${it.length?it.length+' بند، الأهم أولاً':'لا شيء عاجل اليوم 👌'}</span></header>${it.length?`<ol>${it.slice(0,12).map(x=>`<li class="${x.cls}"><span class="ic" aria-hidden="true">${x.ic}</span><div><b>${x.t}</b><small>${x.s}</small></div><button class="btn sm ${x.cls==='hot'?'pri':''}" data-act="${x.b[1]}" data-v="${esc(x.b[2])}">${x.b[0]} ←</button></li>`).join('')}</ol>${it.length>12?`<p class="more">و${it.length-12} بنود أخرى في «الاستعلامات والتقارير»</p>`:''}`:''}</section>`;
 const t=document.createElement('template');t.innerHTML=html;t.content.querySelectorAll('.hb48,.hr-due').forEach(x=>x.remove());const o=document.createElement('div');o.appendChild(t.content.cloneNode(true));
 return box+o.innerHTML};
const css=document.createElement('style');css.textContent=`.now-box{margin:0 0 16px;border:1px solid var(--line,#E5E0D6);border-radius:16px;background:var(--panel,#fff);overflow:hidden}
.now-box header{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:baseline;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--line,#E5E0D6);background:linear-gradient(180deg,rgb(185 150 90 / .12),transparent)}
.now-box header b{font-size:17px}.now-box header span{color:var(--muted);font-size:13px}
.now-box ol{list-style:none;margin:0;padding:6px 10px 10px;display:grid;gap:6px}
.now-box li{display:flex;gap:12px;align-items:center;padding:8px 10px;border-radius:12px;border:1px solid var(--line,#E5E0D6)}
.now-box li.hot{border-color:#E8A3A3;background:#FFF5F5}.now-box li.warn{border-color:#F1DDB0;background:#FFFBF0}
.now-box li .ic{font-size:18px}.now-box li div{flex:1;min-width:0}.now-box li b{display:block;font-size:14px}.now-box li small{color:var(--muted);font-size:12.5px}
.now-box .more{margin:0 14px 10px;color:var(--muted);font-size:12.5px}`;document.head.appendChild(css);
})();
