document.documentElement.lang='ar';document.documentElement.dir='rtl';
const TODAY=(d=>new Date(d.getFullYear(),d.getMonth(),d.getDate()))(new Date());
const DAYS=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const OFFICE={name:'مكتب الميثاق للمحاماة والاستشارات القانونية',lawyer:'المحامي سامر عبد الله',city:'نابلس'};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pd=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const diff=s=>Math.round((pd(s)-TODAY)/864e5);
const dmy=s=>{if(!s||typeof s!=='string')return '—';const x=pd(s);return isNaN(x)?'—':x.getDate()+'/'+(x.getMonth()+1)+'/'+x.getFullYear()};
const fmt=s=>DAYS[pd(s).getDay()]+' '+dmy(s);
const daysW=n=>n===1?'يوم':n===2?'يومين':(n>=3&&n<=10)?n+' أيام':n+' يوماً';
const rel=s=>{const n=diff(s);if(n===0)return 'اليوم';if(n===1)return 'غداً';if(n===-1)return 'أمس';return n>0?'بعد '+daysW(n):'قبل '+daysW(-n)};
const money=n=>Number(n||0).toLocaleString('en-US')+' ₪';
const iso=dt=>dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');

/* البيانات التجريبية في ملف data.js */
const MZ_INCOMING=[
 {k:'k3',kind:'جلسة',t:'تعديل موعد جلسة المرافعة الختامية من 19/10 إلى 26/10/2026 بقرار من المحكمة',apply(){const h=hearings.find(x=>x.id==='h6');if(h)h.date='2026-10-26'}},
 {k:'k5',kind:'قرار',t:'قرار بتكليف النيابة إحضار الشاهد بمذكرة إحضار للجلسة القادمة',apply(){docs.push({id:'d'+Date.now(),k:'k5',title:'قرار تكليف بإحضار شاهد',kind:'قرار',date:iso(TODAY),src:'ميزان',pages:1,shared:true})}},
 {k:'k2',kind:'مستند',t:'إيداع لائحة جوابية من وكيل المدعى عليه (6 صفحات)',apply(){docs.push({id:'d'+Date.now()+1,k:'k2',title:'اللائحة الجوابية للمدعى عليه',kind:'لائحة',date:iso(TODAY),src:'ميزان',pages:6,shared:false})}}];

const S={view:'dash',caseId:null,caseTab:'c360',clientId:null,cf:'الكل',cq:'',tpl:'t1',tplCase:'k1',tplVals:{},pc:'c2',pch:'البوابة',syncing:false,pending:[],lastSync:'2026-10-12 08:15',docK:'all',rules:{mz:true,remind:true,doc:true,pay:false}};

const C=id=>clients.find(x=>x.id===id), K=id=>cases.find(x=>x.id===id), O=id=>opponents.find(x=>x.id===id), CT=id=>courts.find(x=>x.id===id);
const oppNames=k=>(k.opps||[]).map(o=>(O(o)||{}).name||'').filter(Boolean).join(' و');
const nextH=kid=>hearings.filter(h=>h.k===kid&&diff(h.date)>=0).sort((a,b)=>a.date.localeCompare(b.date))[0];
const sevOf=n=>n<=3?'bad':n<=10?'warn':'ok';
const statusPill=s=>({'نشطة':'acc','تنفيذ':'mz','محكوم':'warn','منتهية':''}[s]??'');

/* ── الملاحة ── */
const NAV=[
 ['dash','الرئيسية'],['cases','الملفات والقضايا'],['clients','العملاء'],['agenda','المواعيد والجلسات'],['docs','المستندات'],['tpls','العقود والنماذج'],['finance','المالية والفواتير'],['tasks','المهام'],['reports','التقارير'],
 ['أدوات'],['portal','بوابة الموكل'],['opps','الخصومة وتعارض المصالح'],['courts','المحاكم'],['mizan','الربط مع ميزان']];
function navCount(v){
 if(v==='cases')return cases.filter(k=>k.status!=='منتهية').length;
 if(v==='agenda'){const n=hearings.filter(h=>{const d=diff(h.date);return d>=0&&d<=7}).length;return n}
 if(v==='clients')return clients.length;
 if(v==='docs')return docs.length;
 if(v==='portal'){const n=Object.values(messages).flat().filter(m=>m.unread).length;return n?n+' جديدة':''}
 if(v==='mizan')return S.pending.length?S.pending.length+' تحديث':'';
 return '';
}
function drawNav(){
 document.getElementById('nav').innerHTML=NAV.map(n=>n.length===1?`<div class="grp">${n[0]}</div>`:
  `<button data-act="nav" data-v="${n[0]}" class="${S.view===n[0]||(S.view==='case'&&n[0]==='cases')||(S.view==='client'&&n[0]==='clients')?'on':''}">${n[1]}<span class="cnt ${['portal','mizan'].includes(n[0])&&navCount(n[0])?'hot':''}">${navCount(n[0])}</span></button>`).join('');
 document.getElementById('railSync').textContent='آخر مزامنة '+S.lastSync.slice(11);
}

/* ── الواجهات ── */
const V={};
/* الشاشة الرئيسية الحية: في ملف dash.js */
function hRow(h){const k=K(h.k),x=pd(h.date);return `<div class="row clk" data-act="openCase" data-v="${k.id}">
  <div class="when"><b class="num">${x.getDate()}</b><span>${DAYS[x.getDay()]}</span></div>
  <div style="min-width:0"><div class="t">${esc(h.purpose)}</div><div class="m"><span class="mono">${k.no}</span> · ${esc(CT(k.court).name)} · ${esc(C(k.client).name)}</div></div>
  <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end"><span class="pill mono">${h.time}</span>${h.attend?'<span class="pill warn">حضور الموكل</span>':''}${h.mz?'<span class="pill mz">ميزان</span>':''}</div></div>`}

V.agenda=()=>{
 const ev=[...hearings.filter(h=>diff(h.date)>=0).map(h=>({d:h.date,type:'h',h})),...deadlines.filter(x=>diff(x.due)>=0).map(x=>({d:x.due,type:'d',x}))].sort((a,b)=>a.d.localeCompare(b.d));
 const by={};ev.forEach(e=>(by[e.d]=by[e.d]||[]).push(e));
 return `<div class="head"><div><h1>الجلسات والمهل</h1><p class="sub">كل المواعيد القادمة مرتبة زمنياً، والجلسات المؤكدة من ميزان مُعلَّمة</p></div><button class="btn" data-act="nav" data-v="mizan">مزامنة الجلسات</button></div>
 <div class="stack">${Object.entries(by).map(([d,list])=>`<section class="panel"><header><h2>${fmt(d)}</h2><span class="pill ${sevOf(diff(d))}">${rel(d)}</span></header>
  <div class="list">${list.map(e=>e.type==='h'?hRow(e.h):(()=>{const k=K(e.x.k);return `<div class="row clk" data-act="openCase" data-v="${k.id}"><div class="when"><span class="pill bad">مهلة</span></div><div><div class="t">${esc(e.x.title)}</div><div class="m"><span class="mono">${k.no}</span> · ${esc(C(k.client).name)} · ${esc(e.x.kind)}</div></div><span></span></div>`})()).join('')}</div></section>`).join('')}</div>`;
};

V.cases=()=>{
 const fs=['الكل','نشطة','تنفيذ','محكوم'];
 return `<div class="head"><div><h1>القضايا</h1><p class="sub">كل قضية مربوطة بموكلها وخصومها ومحكمتها ومستنداتها ورقمها في ميزان</p></div><button class="btn pri" data-act="newCase">قضية جديدة</button></div>
 <div class="toolbar"><div class="chips">${fs.map(f=>`<button class="chip ${S.cf===f?'on':''}" data-act="cf" data-v="${f}">${f}</button>`).join('')}</div>${window.catFilter?catFilter():''}
  <input class="field" id="cq" placeholder="تصفية بالرقم أو الموضوع أو الاسم" value="${esc(S.cq)}" style="flex:1;max-width:340px"></div>
 <section class="panel tablewrap"><table><thead><tr><th>رقم القضية</th><th>الموضوع</th><th>الموكل</th><th>الخصم</th><th>المحكمة</th><th>الدرجة والمرحلة</th><th>الجلسة القادمة</th></tr></thead><tbody id="ctb">${caseRows()}</tbody></table></section>`;
};
function caseRows(){
 const q=S.cq.trim();
 const list=cases.filter(k=>(S.cf==='الكل'||k.status===S.cf)&&(!S.cat||!window.catOf||catOf(k).k===S.cat)&&(!q||[k.no,k.subject,k.type,C(k.client).name,oppNames(k)].join(' ').includes(q)));
 return list.map(k=>{const h=nextH(k.id);return `<tr class="clk" data-act="openCase" data-v="${k.id}"><td><span class="mono" style="font-weight:500">${k.no}</span><div class="m">${window.catOf?esc(catOf(k).n):esc(k.type)}</div></td><td>${esc(k.subject)}</td><td>${esc(C(k.client).name)}<div class="m">${esc(k.role)}</div></td><td>${esc(oppNames(k))}</td><td>${esc(CT(k.court).name)}</td><td>${window.levelPill?levelPill(k):''}<span class="pill ${statusPill(k.status)}">${esc(k.stage)}</span></td><td>${h?`${dmy(h.date)}<div class="m">${rel(h.date)}</div>`:'<span class="m">—</span>'}</td></tr>`}).join('')||'<tr><td colspan="7" class="empty">لا قضايا تطابق التصفية.</td></tr>';
}

V.case=()=>{
 const k=K(S.caseId),cl=C(k.client),ct=CT(k.court),h=nextH(k.id);
 const tabs=[['c360','ملف القضية 360°'],['track','مسار التقاضي'],['hearings','الجلسات'],['docs','المستندات'],['deadlines','المهل'],['msgs','مراسلات الموكل'],['mz','سجل ميزان']];
 return `<div><button class="link" data-act="nav" data-v="cases">→ كل القضايا</button></div>
 <div class="head"><div><h1>${esc(k.subject)}</h1><p class="sub"><span class="mono">${k.no}</span> · ${esc(k.type)} · فُتحت ${dmy(k.opened)} · قيمة الدعوى ${money(k.value)}</p></div>
  <div class="toolbar">${window.caseBadges?caseBadges(k):''}<span class="pill ${statusPill(k.status)}">${esc(k.status)}</span><span class="pill ${k.pri==='عالية'?'bad':''}">أولوية ${k.pri}</span><button class="btn" data-act="tplFor" data-v="${k.id}">إنشاء مستند</button></div></div>
 <div class="chain" aria-label="ترابط بيانات القضية">
  <button class="node" style="all:unset;cursor:pointer;flex:1 1 150px;background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:10px 12px" data-act="openClient" data-v="${cl.id}"><div class="lb">الموكل · ${esc(k.role)}</div><div class="nm">${esc(cl.name)}</div><div class="lb">${esc(cl.phone)}</div></button>
  <div class="link-line"></div>
  <div class="node core"><div class="lb">القضية · ${STEPS[k.step]}</div><div class="nm mono">${k.no}</div><div class="lb">${esc(k.stage)}</div></div>
  <div class="link-line"></div>
  <div class="node"><div class="lb">المحكمة</div><div class="nm">${esc(ct.name)}</div><div class="lb">${h?'الجلسة القادمة '+dmy(h.date):'لا جلسة محددة'}</div></div>
  <div class="link-line"></div>
  <div class="node"><div class="lb">الخصوم ووكلاؤهم</div>${k.opps.map(o=>`<div class="nm">${esc(O(o).name)}</div><div class="lb">${esc(O(o).lawyer)}</div>`).join('')}</div>
  <div class="link-line"></div>
  <div class="node" style="border-color:var(--brass)"><div class="lb">مرجع ميزان</div><div class="nm mono" style="font-size:13px">${k.mz||"—"}</div><div class="lb">مزامنة يومية</div></div>
 </div>
 <div class="tabs">${tabs.map(t=>`<button class="${S.caseTab===t[0]?'on':''}" data-act="caseTab" data-v="${t[0]}">${t[1]}</button>`).join('')}</div>
 <div>${caseTab(k)}</div>`;
};
function caseTab(k){
 if(S.caseTab==='track'&&window.trackTab)return trackTab(k);
 if(S.caseTab==='c360'&&window.case360Tab)return case360Tab(k);
 if(S.caseTab==='hearings'){
  const hs=hearings.filter(h=>h.k===k.id).sort((a,b)=>a.date.localeCompare(b.date));const nx=nextH(k.id);
  return `<div class="grid2"><section class="panel"><header><h2>سير الجلسات</h2><span class="pill">${hs.length}</span></header><div class="bd"><div class="timeline">${hs.map(h=>`<div class="tl ${nx&&h.id===nx.id?'next':''}"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><b>${fmt(h.date)}</b><span class="pill mono">${h.time}</span>${h.mz?'<span class="pill mz">ميزان</span>':''}${diff(h.date)>=0?`<span class="pill acc">${rel(h.date)}</span>`:''}</div><div>${esc(h.purpose)}</div>${h.result?`<div class="m">القرار: ${esc(h.result)}</div>`:''}</div>`).join('')}</div></div></section>
  <section class="panel"><header><h2>إضافة جلسة</h2></header><div class="bd"><form class="form" id="fH"><label>التاريخ<input class="field" type="date" id="hD" required value="2026-11-02"></label><label>الوقت<input class="field" type="time" id="hT" value="10:00"></label><label class="wide">الغاية<input class="field" id="hP" required placeholder="مثال: سماع شهود الدفاع"></label><label class="wide" style="flex-direction:row;align-items:center;gap:8px;color:var(--ink)"><input type="checkbox" id="hA"> تتطلب حضور الموكل شخصياً</label><button class="btn pri">حفظ وإشعار الموكل</button></form></div></section></div>`;}
 if(S.caseTab==='docs'){const ds=docs.filter(d=>d.k===k.id);return docTable(ds,false)}
 if(S.caseTab==='deadlines'){const ds=deadlines.filter(d=>d.k===k.id);return `<section class="panel">${ds.map(x=>{const n=diff(x.due);return `<div class="sev ${n<0?'':sevOf(n)}"><i></i><div><b>${esc(x.title)}</b><div style="font-size:12.5px;color:var(--muted)">${esc(x.kind)} · ${fmt(x.due)}</div></div><span class="pill ${n<0?'':sevOf(n)}">${rel(x.due)}</span></div>`}).join('')||'<div class="empty">لا مهل مسجلة لهذه القضية.</div>'}</section>`}
 if(S.caseTab==='msgs'){const ms=messages[k.client]||[];return `<section class="panel"><header><h2>${esc(C(k.client).name)}</h2><button class="btn sm" data-act="portalFor" data-v="${k.client}">فتح المحادثة</button></header><div class="bd thread">${ms.map(bubble).join('')||'<div class="empty">لا مراسلات بعد.</div>'}</div></section>`}
 if(S.caseTab==='mz'){const ls=mzLog.filter(l=>l.k===k.id);return `<section class="panel"><div class="feed">${ls.map(l=>`<div><time>${l.at}</time>${esc(l.t)}</div>`).join('')||'<div class="empty">لا أحداث من ميزان لهذه القضية بعد.</div>'}</div></section>`}
}
function bubble(m){return `<div class="bubble ${m.f}">${esc(m.t)}<small>${esc(m.ch)} · ${m.at.slice(5).replace('-','/')}</small></div>`}
function docTable(ds,showCase){return `<section class="panel tablewrap"><table><thead><tr><th>المستند</th>${showCase?'<th>القضية</th>':''}<th>النوع</th><th>المصدر</th><th>التاريخ</th><th>الصفحات</th><th>في بوابة الموكل</th></tr></thead><tbody>${ds.map(d=>`<tr><td style="font-weight:500">${esc(d.title)}${d.text?` <button type="button" class="link" data-act="tplDraftOpen" data-v="${esc(d.id)}">عرض المسودة</button> <button type="button" class="link" data-act="qaOpenDoc" data-v="${esc(d.id)}">تدقيق قانوني</button>${(d.aiDraft||d.templateStatus==='draft'||d.tplStatus==='draft')?` <button type="button" class="link" data-act="dvOpenDoc" data-v="${esc(d.id)}">إصدارات المسودة</button>`:''}`:''}</td>${showCase?`<td><button class="link mono" data-act="openCase" data-v="${d.k}">${K(d.k).no}</button><div class="m">${esc(C(K(d.k).client).name)}</div></td>`:''}<td>${esc(d.kind)}</td><td><span class="pill ${d.src==='ميزان'?'mz':d.src==='مولّد من نموذج'?'acc':''}">${esc(d.src)}</span></td><td class="num">${dmy(d.date)}</td><td class="num">${d.pages}</td><td><button class="sw ${d.shared?'on':''}" data-act="share" data-v="${d.id}" aria-label="مشاركة مع الموكل" aria-pressed="${d.shared}"></button></td></tr>`).join('')||'<tr><td colspan="7" class="empty">لا مستندات.</td></tr>'}</tbody></table></section>`}

const clientCards=list=>`<div class="grid-eq">${list.map(c=>{const ks=cases.filter(k=>k.client===c.id);const p=Math.round(c.paid/c.fee*100);return `<button class="client-card" data-act="openClient" data-v="${c.id}"><div style="display:flex;justify-content:space-between;gap:8px"><span class="nm">${esc(c.name)}</span><span class="pill">${c.type}</span></div>
 <dl class="kv"><dt>القضايا</dt><dd>${ks.map(k=>`<span class="mono">${k.no}</span>`).join('، ')}</dd><dt>التواصل</dt><dd>${esc(c.ch)}</dd><dt>البوابة</dt><dd>${c.portal?`<span class="pill ok">مفعّلة</span>`:'<span class="pill">غير مفعّلة</span>'}</dd></dl>
 <div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--muted)"><span>الأتعاب المحصّلة</span><span class="num">${money(c.paid)} / ${money(c.fee)}</span></div><div class="bar"><span style="width:${p}%"></span></div></button>`}).join('')}</div>`;
/* ── سجلات الموكلين: جدول قابل للبحث والفرز والطباعة، بديلاً عن البطاقات ── */
const CR={mode:(()=>{try{return localStorage.getItem('mq_clients_view')||'cards'}catch(e){return 'cards'}})(),q:'',sort:'new',dir:1,f:'all',type:'',city:'',ch:'',from:'',to:''};
/* وقت إضافة الموكل: تاريخ «موكل منذ»، ثم وقت الإنشاء المضمَّن في معرّفه لترتيب من أُضيفوا في اليوم نفسه */
const crAdded=c=>{const d=String(c.since||'');let t=0;const m=/^c([0-9a-z]{8})/.exec(String(c.id||''));if(m){const v=parseInt(m[1],36);if(v>1.5e12&&v<4e12)t=v}return d+'|'+String(t).padStart(14,'0')};
const crRow=c=>{const ks=cases.filter(k=>k.client===c.id),act=ks.filter(k=>k.status!=='منتهية'),fee=+c.fee||0,paid=+c.paid||0,un=(messages[c.id]||[]).filter(m=>m.unread&&m.f!=='me').length;
 return {c,ks,act,fee,paid,due:Math.max(0,fee-paid),pct:fee?Math.round(paid/fee*100):0,un,weak:window.MQ_isWeak?MQ_isWeak(c):false}};
function crList(){const q=CR.q.trim();let rs=clients.map(crRow).filter(r=>(!q||[r.c.name,r.c.phone,r.c.idNo,r.c.ch,...r.ks.map(k=>k.no+' '+(k.subject||''))].join(' ').includes(q))
  &&(CR.f==='all'||(CR.f==='portal'&&r.c.portal)||(CR.f==='noportal'&&!r.c.portal)||(CR.f==='due'&&r.due>0)||(CR.f==='active'&&r.act.length)||(CR.f==='unread'&&r.un)||(CR.f==='nocase'&&!r.ks.length)||(CR.f==='weak'&&r.weak&&r.c.portal))
  &&(!CR.type||r.c.type===CR.type)&&(!CR.city||r.c.city===CR.city)&&(!CR.ch||(r.c.ch||'')===CR.ch)
  &&(!CR.from||String(r.c.since||'')>=CR.from)&&(!CR.to||String(r.c.since||'')<=CR.to));
 if(CR.sort==='new'||CR.sort==='old'){const d=CR.sort==='new'?-1:1;return rs.sort((a,b)=>crAdded(a.c).localeCompare(crAdded(b.c))*d||a.c.name.localeCompare(b.c.name,'ar'))}
 if(CR.sort==='last')return rs.sort((a,b)=>String(b.c.last||'').localeCompare(String(a.c.last||'')));
 const key={name:r=>r.c.name,cases:r=>r.ks.length,fee:r=>r.fee,paid:r=>r.paid,due:r=>r.due,ch:r=>r.c.ch||'',portal:r=>(r.c.portal?1:0)*1e9+(r.c.last?Date.parse(r.c.last)/1e3:0)}[CR.sort]||(r=>r.c.name);
 return rs.sort((a,b)=>{const x=key(a),y=key(b);return (typeof x==='string'?x.localeCompare(y,'ar'):x-y)*CR.dir})}
const crTh=(k,t,cls)=>`<th class="${cls||''}"><button class="crs ${CR.sort===k?'on':''}" data-act="crSort" data-v="${k}">${t}${CR.sort===k?(CR.dir>0?' ▲':' ▼'):''}</button></th>`;
function clientRecords(){const rs=crList(),T=rs.reduce((t,r)=>({fee:t.fee+r.fee,paid:t.paid+r.paid,due:t.due+r.due,ks:t.ks+r.ks.length}),{fee:0,paid:0,due:0,ks:0});
 return `<section class="panel tablewrap cr-wrap"><table class="cr-t"><thead><tr>${crTh('name','الموكل')}${crTh('cases','القضايا')}${crTh('fee','الأتعاب','num')}${crTh('paid','المحصّل','num')}${crTh('due','المتبقي','num')}${crTh('ch','قناة التواصل')}${crTh('portal','البوابة')}</tr></thead>
 <tbody>${rs.map(r=>{const c=r.c;return `<tr class="clk" data-act="openClient" data-v="${c.id}"><td><b>${esc(c.name)}</b>${r.un?` <span class="newdot" title="${r.un} رسائل جديدة">${r.un}</span>`:''}<div class="m">${esc(c.type||'')}${c.phone?' · <span class="mono" dir="ltr">'+esc(c.phone)+'</span>':''}</div></td>
  <td>${r.ks.length?r.ks.map(k=>`<span class="mono ${k.status==='منتهية'?'m':''}">${k.no}</span>`).join('، '):'<span class="m">—</span>'}${r.ks.length?`<div class="m">${r.act.length} جارية</div>`:''}</td>
  <td class="num">${money(r.fee)}</td><td class="num">${money(r.paid)}<div class="bar cr-bar"><span style="width:${r.pct}%"></span></div></td><td class="num ${r.due?'cr-due':''}">${r.due?money(r.due):'—'}</td>
  <td>${esc(c.ch||'—')}</td>
  <td>${c.portal?`<span class="pill ok">مفعّلة</span><div class="m">${c.last?'آخر دخول '+dmy(c.last):'لم يدخل بعد'}</div>`:'<span class="pill">غير مفعّلة</span>'}${r.weak&&c.portal?'<div class="m cr-weak">رمز ضعيف</div>':''}</td></tr>`}).join('')||'<tr><td colspan="7" class="empty">لا موكلين مطابقين.</td></tr>'}</tbody>
 ${rs.length?`<tfoot><tr><td><b>${rs.length} موكلاً</b></td><td>${T.ks} قضية</td><td class="num">${money(T.fee)}</td><td class="num">${money(T.paid)}</td><td class="num">${money(T.due)}</td><td colspan="2"></td></tr></tfoot>`:''}</table></section>`}
const crUniq=f=>[...new Set(clients.map(f).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'ar'));
const crOpt=(v,list,all)=>`<option value="">${all}</option>`+list.map(x=>`<option value="${esc(x)}" ${v===x?'selected':''}>${esc(x)}</option>`).join('');
function crFilters(){const n=crList().length,on=!!(CR.q||CR.f!=='all'||CR.type||CR.city||CR.ch||CR.from||CR.to);
 return `<div class="cr-bar-top cr-filters"><input class="field" id="crQ" value="${esc(CR.q)}" placeholder="بحث بالاسم أو الهاتف أو الهوية أو رقم القضية…" aria-label="بحث في الموكلين">
 <select class="field" id="crSortSel" aria-label="الترتيب">${[['new','الأحدث أولاً'],['old','الأقدم أولاً'],['name','الاسم (أ-ي)'],['due','الأعلى متبقياً'],['cases','الأكثر قضايا'],['last','آخر دخول للبوابة']].map(([v,t])=>`<option value="${v}" ${CR.sort===v?'selected':''}>${t}</option>`).join('')}</select>
 <select class="field" id="crF" aria-label="الحالة">${[['all','كل الحالات'],['active','لهم قضايا جارية'],['nocase','بلا قضايا'],['due','عليهم أتعاب متبقية'],['unread','لهم رسائل غير مقروءة'],['portal','البوابة مفعّلة'],['noportal','البوابة غير مفعّلة'],['weak','رمز بوابة ضعيف']].map(([v,t])=>`<option value="${v}" ${CR.f===v?'selected':''}>${t}</option>`).join('')}</select>
 <select class="field" id="crType" aria-label="النوع">${crOpt(CR.type,crUniq(c=>c.type),'كل الأنواع')}</select>
 <select class="field" id="crCity" aria-label="المدينة">${crOpt(CR.city,crUniq(c=>c.city),'كل المدن')}</select>
 <select class="field" id="crCh" aria-label="قناة التواصل">${crOpt(CR.ch,crUniq(c=>c.ch),'كل القنوات')}</select>
 <label class="cr-date">من <input type="date" class="field" id="crFrom" value="${esc(CR.from)}"></label><label class="cr-date">إلى <input type="date" class="field" id="crTo" value="${esc(CR.to)}"></label>
 <span class="m cr-count">${n} من ${clients.length}</span>${on?'<button class="btn sm" data-act="crClear">مسح الفلاتر</button>':''}</div>`}
function crRefresh(){const b=document.getElementById('crBody');if(!b)return render();b.innerHTML=CR.mode==='records'?clientRecords():clientCards(crList().map(r=>r.c));const n=document.querySelector('.cr-count');if(n)n.textContent=crList().length+' من '+clients.length;const clr=document.querySelector('[data-act="crClear"]'),on=!!(CR.q||CR.f!=='all'||CR.type||CR.city||CR.ch||CR.from||CR.to);if(!!clr!==on){const f=document.querySelector('.cr-filters');if(f)f.outerHTML=crFilters()}}
V.clients=()=>{const rec=CR.mode==='records';return `<div class="head"><div><h1>الموكلون</h1><p class="sub">ملف كل موكل يجمع قضاياه وأتعابه وقناة تواصله المفضلة وحالة دخوله للبوابة</p></div>
 <div class="toolbar"><div class="seg" role="group" aria-label="طريقة العرض"><button class="${rec?'':'on'}" data-act="crMode" data-v="cards" aria-pressed="${!rec}">بطاقات</button><button class="${rec?'on':''}" data-act="crMode" data-v="records" aria-pressed="${rec}">سجلات</button></div>${rec?'<button class="btn sm" data-act="crPrint">طباعة السجل</button>':''}</div></div>
 ${crFilters()}<div id="crBody">${rec?clientRecords():clientCards(crList().map(r=>r.c))}</div>`};
document.addEventListener('input',ev=>{if(ev.target.id!=='crQ')return;CR.q=ev.target.value;crRefresh()});
document.addEventListener('change',ev=>{const k={crF:'f',crType:'type',crCity:'city',crCh:'ch',crFrom:'from',crTo:'to',crSortSel:'sort'}[ev.target.id];if(!k)return;CR[k]=ev.target.value;if(k==='sort')CR.dir=['fee','paid','due','cases'].includes(CR.sort)?-1:1;crRefresh()});

V.client=()=>{const c=C(S.clientId),ks=cases.filter(k=>k.client===c.id);
 return `<div><button class="link" data-act="nav" data-v="clients">→ كل الموكلين</button></div>
 <div class="head"><div><h1>${esc(c.name)}</h1><p class="sub">${c.type} · ${esc(c.city)} · موكل منذ ${dmy(c.since)}</p></div><div class="toolbar"><button class="btn" data-act="portalFor" data-v="${c.id}">مراسلة عبر البوابة</button></div></div>
 <div class="grid2"><div class="stack"><section class="panel"><header><h2>قضايا الموكل</h2><span class="pill">${ks.length}</span></header><div class="list">${ks.map(k=>{const h=nextH(k.id);return `<div class="row clk" data-act="openCase" data-v="${k.id}" style="grid-template-columns:minmax(0,1fr) auto"><div><div class="t">${esc(k.subject)}</div><div class="m"><span class="mono">${k.no}</span> · ${esc(CT(k.court).name)} · ضد ${esc(oppNames(k))}</div></div><div>${h?`<span class="pill acc">${rel(h.date)}</span>`:`<span class="pill ${statusPill(k.status)}">${esc(k.status)}</span>`}</div></div>`}).join('')}</div></section>
 <section class="panel"><header><h2>المراسلات الأخيرة</h2></header><div class="bd thread">${(messages[c.id]||[]).slice(-3).map(bubble).join('')||'<div class="empty">لا مراسلات.</div>'}</div></section></div>
 <div class="stack"><section class="panel"><header><h2>البيانات</h2></header><div class="bd"><dl class="kv"><dt>رقم الهوية/التسجيل</dt><dd class="mono">${esc(c.idNo)}</dd><dt>الهاتف</dt><dd class="mono">${esc(c.phone)}</dd><dt>القناة المفضلة</dt><dd>${esc(c.ch)}</dd><dt>رمز دخول البوابة</dt><dd class="mono">${c.code}</dd><dt>آخر دخول</dt><dd>${c.last?fmt(c.last):'لم يدخل بعد'}</dd></dl></div></section>
 <section class="panel"><header><h2>الأتعاب</h2></header><div class="bd" style="display:flex;flex-direction:column;gap:8px"><dl class="kv"><dt>المتفق عليه</dt><dd class="num">${money(c.fee)}</dd><dt>المدفوع</dt><dd class="num">${money(c.paid)}</dd><dt>المتبقي</dt><dd class="num" style="font-weight:600;color:${c.fee>c.paid?'var(--warn)':'var(--ok)'}">${money(c.fee-c.paid)}</dd></dl><div class="bar"><span style="width:${Math.round(c.paid/c.fee*100)}%"></span></div><form class="form" id="fPay" style="grid-template-columns:1fr auto"><input class="field" type="number" id="payAmt" min="1" placeholder="تسجيل دفعة بالشيكل"><button class="btn sm">تسجيل</button></form></div></section>
 <section class="panel"><header><h2>بوابة الموكل</h2><button class="sw ${c.portal?'on':''}" data-act="togglePortal" data-v="${c.id}" aria-label="تفعيل البوابة" aria-pressed="${c.portal}"></button></header><div class="bd note" style="border:0">${c.portal?'يرى الموكل حالة قضاياه وجلساته والمستندات المشاركة ويراسل المكتب.':'البوابة مغلقة. عند التفعيل يُرسل رمز الدخول عبر '+esc(c.ch)+'.'}</div></section></div></div>`;
};

V.opps=()=>`<div class="head"><div><h1>الخصوم وتضارب المصالح</h1><p class="sub">افحص أي اسم قبل قبول توكيل جديد مقابل سجل الموكلين والخصوم</p></div></div>
 <section class="panel"><header><h2>فحص تضارب المصالح</h2></header><div class="bd conflict"><input class="field" id="cfq" placeholder="اكتب اسم الطرف المحتمل، مثال: خالد حمدان" style="max-width:480px"><div id="cfr"><div class="note">يبحث الفحص في أسماء الموكلين والخصوم ووكلائهم ويعرض القضايا المرتبطة.</div></div></div></section>
 <section class="panel tablewrap"><table><thead><tr><th>الخصم</th><th>الصفة</th><th>وكيل الخصم</th><th>القضايا المرتبطة</th><th>ضد موكلي المكتب</th></tr></thead><tbody>${opponents.map(o=>{const ks=cases.filter(k=>(k.opps||[]).includes(o.id));return `<tr><td style="font-weight:500">${esc(o.name)}</td><td>${o.type}</td><td>${esc(o.lawyer)}</td><td>${ks.map(k=>`<button class="link mono" data-act="openCase" data-v="${k.id}">${k.no}</button>`).join('، ')}</td><td>${[...new Set(ks.map(k=>C(k.client).name))].map(esc).join('، ')}${ks.length>1?' <span class="pill warn">خصم متكرر</span>':''}</td></tr>`}).join('')}</tbody></table></section>`;
function conflict(q){
 q=q.trim();if(q.length<2)return '<div class="note">يبحث الفحص في أسماء الموكلين والخصوم ووكلائهم ويعرض القضايا المرتبطة.</div>';
 const parts=q.split(/\s+/).filter(p=>p.length>1);
 const hit=n=>parts.some(p=>String(n||'').includes(p));
 const cl=clients.filter(c=>hit(c.name)),op=opponents.filter(o=>hit(o.name)||hit(o.lawyer));
 if(!cl.length&&!op.length)return `<div class="verdict ok">لا يوجد تطابق مع أي موكل أو خصم مسجل. يمكن المتابعة بقبول التوكيل.</div>`;
 const full=n=>parts.every(p=>String(n||'').includes(p));
 const strong=op.some(o=>full(o.name));
 return `<div class="verdict ${strong?'bad':'warn'}">${strong?'تضارب محتمل: الاسم مطابق لخصم في قضايا قائمة للمكتب. لا يُقبل التوكيل ضد موكلينا الحاليين.':'تطابق جزئي: راجع الأسماء أدناه قبل القرار.'}</div>
 ${cl.map(c=>`<div class="note">موكل لدى المكتب: <b>${esc(c.name)}</b> · ${cases.filter(k=>k.client===c.id).map(k=>k.no).join('، ')}</div>`).join('')}
 ${op.map(o=>`<div class="note">خصم في: ${cases.filter(k=>(k.opps||[]).includes(o.id)).map(k=>`<button class="link mono" data-act="openCase" data-v="${k.id}">${k.no}</button> (ضد ${esc(C(k.client).name)})`).join('، ')} · <b>${esc(o.name)}</b>${hit(o.lawyer)&&!hit(o.name)?' · تطابق في اسم الوكيل '+esc(o.lawyer):''}</div>`).join('')}`;
}

V.courts=()=>`<div class="head"><div><h1>المحاكم</h1><p class="sub">درجات التقاضي التي يترافع أمامها المكتب وقضاياه في كل منها</p></div></div>
 <div class="grid-eq">${courts.map(ct=>{const ks=cases.filter(k=>k.court===ct.id);const hs=hearings.filter(h=>ks.some(k=>k.id===h.k)&&diff(h.date)>=0).sort((a,b)=>a.date.localeCompare(b.date));return `<section class="panel"><header><h2>${esc(ct.name)}</h2><span class="pill">${ct.type}</span></header><div class="bd" style="display:flex;flex-direction:column;gap:8px"><dl class="kv"><dt>المدينة</dt><dd>${ct.city}</dd><dt>قضايا المكتب</dt><dd class="num">${ks.length}</dd><dt>أقرب جلسة</dt><dd>${hs[0]?fmt(hs[0].date)+' · <span class="mono">'+hs[0].time+'</span>':'—'}</dd></dl>${ks.map(k=>`<button class="link" style="font-size:13px" data-act="openCase" data-v="${k.id}"><span class="mono">${k.no}</span> · ${esc(C(k.client).name)}</button>`).join('')}</div></section>`}).join('')}</div>`;

/* أرشيف المستندات: بحث وفلاتر (القضية، الموكل، النوع، المصدر، الفترة، الظهور في البوابة) */
const DF={q:'',client:'',kind:'',src:'',share:'',from:'',to:''};
function docList(){const q=DF.q;return docs.filter(d=>{const k=K(d.k)||{},c=C(k.client)||{};
  if(S.docK!=='all'&&d.k!==S.docK)return false;if(DF.client&&k.client!==DF.client)return false;if(DF.kind&&(d.kind||'')!==DF.kind)return false;
  if(DF.src&&(d.src||'')!==DF.src)return false;if(DF.share==='y'&&!d.shared)return false;if(DF.share==='n'&&d.shared)return false;
  if(DF.from&&String(d.date)<DF.from)return false;if(DF.to&&String(d.date)>DF.to)return false;
  if(q&&!(window.MQ_selSearch?MQ_selSearch.match:(t,x)=>t.includes(x))([d.title,d.kind,d.src,k.no,k.subject,c.name].join(' '),q))return false;return true}).sort((a,b)=>String(b.date).localeCompare(String(a.date)))}
window.MQ_docList=docList;
const docOn=()=>!!(DF.q||DF.client||DF.kind||DF.src||DF.share||DF.from||DF.to||S.docK!=='all');
function docBody(){const ds=docList();return `<div class="cr-count doc-count">${ds.length===docs.length?'كل المستندات ('+ds.length+')':ds.length+' من '+docs.length+' مستنداً'}${docOn()?' <button type="button" class="link" data-act="docClear">مسح الفلاتر</button>':''}</div>${ds.length?docTable(ds,true):'<div class="empty">لا مستندات تطابق البحث والفلاتر.</div>'}`}
function docRefresh(){const b=document.getElementById('docBody');if(b)b.innerHTML=docBody()}
V.docs=()=>{const uniq=a=>[...new Set(a.filter(Boolean))].sort((x,y)=>x.localeCompare(y,'ar'));
 const kinds=uniq(docs.map(d=>d.kind)),srcs=uniq(docs.map(d=>d.src)),cl=clients.filter(c=>cases.some(k=>k.client===c.id)).sort((a,b)=>a.name.localeCompare(b.name,'ar'));
 const opt=(v,t,cur)=>`<option value="${esc(v)}" ${cur===v?'selected':''}>${esc(t)}</option>`;
 return `<div class="head"><div><h1>أرشيف المستندات</h1><p class="sub">${docs.length} مستنداً: لوائح وبينات وأحكام ومحاضر، بعضها يصل تلقائياً من ميزان</p></div>
  <label class="btn pri" style="cursor:pointer">رفع مستند<input type="file" id="upl" hidden></label></div>
 <div class="cr-filters doc-filters">
  <input class="field" type="search" id="dfQ" placeholder="بحث: اسم المستند، رقم القضية، اسم الموكل…" value="${esc(DF.q)}" aria-label="بحث في المستندات">
  <select class="field" id="docK" aria-label="القضية"><option value="all">كل القضايا</option>${cases.filter(k=>!DF.client||k.client===DF.client).map(k=>`<option value="${k.id}" ${S.docK===k.id?'selected':''}>${k.no} · ${esc((C(k.client)||{}).name||'')}</option>`).join('')}</select>
  <select class="field" id="dfClient" aria-label="الموكل"><option value="">كل الموكلين</option>${cl.map(c=>opt(c.id,c.name,DF.client)).join('')}</select>
  <select class="field" id="dfKind" aria-label="النوع"><option value="">كل الأنواع</option>${kinds.map(x=>opt(x,x,DF.kind)).join('')}</select>
  <select class="field" id="dfSrc" aria-label="المصدر"><option value="">كل المصادر</option>${srcs.map(x=>opt(x,x,DF.src)).join('')}</select>
  <select class="field" id="dfShare" aria-label="بوابة الموكل"><option value="">البوابة: الكل</option>${opt('y','ظاهر للموكل',DF.share)}${opt('n','غير ظاهر للموكل',DF.share)}</select>
  <label class="cr-date">من<input class="field" type="date" id="dfFrom" value="${esc(DF.from)}"></label><label class="cr-date">إلى<input class="field" type="date" id="dfTo" value="${esc(DF.to)}"></label>
 </div>
 <div id="docBody">${docBody()}</div><p class="note">في هذه النسخة التجريبية يُسجَّل اسم الملف المرفوع فقط، ولا يُخزَّن محتواه.</p>`};
document.addEventListener('input',ev=>{if(ev.target.id==='dfQ'){DF.q=ev.target.value;docRefresh()}});
document.addEventListener('change',ev=>{const m={dfClient:'client',dfKind:'kind',dfSrc:'src',dfShare:'share',dfFrom:'from',dfTo:'to'}[ev.target.id];if(!m)return;DF[m]=ev.target.value;
 if(m==='client'){if(S.docK!=='all'&&(K(S.docK)||{}).client!==DF.client&&DF.client)S.docK='all';render();return}docRefresh()});

/* النماذج */
const TPL={
 t1:{name:'وكالة خاصة',hint:'توكيل للمرافعة في دعوى محددة',fields:[],body:['وكالة خاصة','','أنا الموقّع أدناه {client}، أوكّل وأنيب عني {lawyer} من {office}، للمرافعة والمدافعة عني لدى {court} في الدعوى رقم {no} بصفتي {role} ضد {opp}، وموضوعها {subject}.','','وللوكيل في سبيل ذلك حق تقديم اللوائح والمذكرات والطلبات والبينات والطعن فيها، وحضور الجلسات، والصلح والإقرار والإبراء وقبض المبالغ، والطعن في الأحكام بطرق الطعن كافة، ومتابعة التنفيذ لدى دوائر التنفيذ المختصة، وتوكيل الغير بذلك كله أو ببعضه.','','وأقرّ بأن كل ما يقوم به الوكيل المذكور ضمن حدود هذه الوكالة صادر عني وبرضاي.','','تحريراً في {city} بتاريخ {date}','','الموكّل: {client}          التوقيع: ................','','أشهد بأن الموكّل وقّع أمامي','{lawyer}']},
 t2:{name:'إنذار عدلي',hint:'مطالبة قبل رفع الدعوى',fields:[['days','مهلة الإنذار بالأيام','15']],body:['إنذار عدلي','بواسطة كاتب العدل في {city}','','المنذِر: {client}، بواسطة وكيله {lawyer}.','المنذَر إليه: {opp}.','الموضوع: {subject}.','','حيث إن ذمتكم مشغولة لموكلي بمبلغ {amount} شيكل، وحيث تعذّر تحصيله بالطرق الودية رغم المطالبات المتكررة،','','لذلك أنذركم بوجوب دفع المبلغ المذكور خلال مدة أقصاها {days} يوماً من تاريخ تبلّغكم هذا الإنذار، وإلا سأضطر لاتخاذ الإجراءات القانونية كافة بحقكم أمام المحاكم المختصة، مع تضمينكم الرسوم والمصاريف وأتعاب المحاماة.','','{city} في {date}','المنذِر بواسطة وكيله','{lawyer}']},
 t3:{name:'لائحة دعوى حقوقية',hint:'مطالبة مالية أمام محكمة الصلح أو البداية',fields:[['fact','الواقعة الأولى','تعاقدت المدعية مع المدعى عليها على توريد مواد بناء، ووفّت بالتزاماتها كاملة']],body:['لدى {court} الموقرة','لائحة دعوى حقوقية','','المدعي: {client}، وكيله {lawyer} من {office}، {city}.','المدعى عليه: {opp}.','موضوع الدعوى: {subject}.','قيمة الدعوى: {amount} شيكل لغايات الرسم.','','الوقائع:','1. {fact}.','2. وحيث امتنع المدعى عليه عن الوفاء بالتزامه رغم مطالبته مراراً، ومنها بموجب إنذار عدلي.','3. وحيث إن للمدعي الحق في المطالبة بالمبلغ المذكور مع الفائدة القانونية.','','الأسانيد القانونية:','[يستكملها الوكيل]','','الطلبات:','لكل ما تقدم يلتمس المدعي من محكمتكم الموقرة دعوة المدعى عليه للمحاكمة، وبالنتيجة الحكم بإلزامه بدفع مبلغ {amount} شيكل، مع الرسوم والمصاريف وأتعاب المحاماة والفائدة القانونية من تاريخ المطالبة حتى السداد التام.','','قائمة البينات مرفقة.','باحترام','وكيل المدعي','{lawyer}  ·  {date}']},
 t4:{name:'طلب تأجيل جلسة',hint:'يُقدّم قبل موعد الجلسة',fields:[['reason','سبب التأجيل','سفر الموكل خارج البلاد لأسباب علاجية، ومرفق ما يثبت ذلك']],body:['لدى {court} الموقرة','في الدعوى رقم {no}','طلب تأجيل جلسة','','المستدعي: {client}، بواسطة وكيله {lawyer}.','المستدعى ضده: {opp}.','','يلتمس المستدعي تأجيل الجلسة المحددة بتاريخ {hearing} للأسباب الآتية:','1. {reason}.','2. إن التأجيل لا يلحق ضرراً بالمستدعى ضده ولا يُقصد منه المماطلة.','','لذلك نلتمس الموافقة على تأجيل الجلسة إلى موعد تراه المحكمة مناسباً.','','باحترام','{lawyer}  ·  {date}']},
 t5:{name:'قائمة بينات',hint:'البينات الخطية والشخصية',fields:[['e1','البينة الخطية الأولى','العقد الموقّع بين الطرفين'],['w1','الشاهد الأول','محاسب الشركة، ويُدعى على عنوانه']],body:['لدى {court} الموقرة','في الدعوى رقم {no}','قائمة بينات {role}','','أولاً: البينات الخطية','1. {e1}.','2. المراسلات المتبادلة بين الطرفين.','','ثانياً: البينة الشخصية','1. {w1}.','','ثالثاً: يحتفظ {role} بحقه في تقديم أي بينة أخرى تقتضيها الدعوى وفي تقديم بينة دفعية.','','باحترام','{lawyer}  ·  {date}']},
 t6:{name:'اتفاقية أتعاب',hint:'بين المكتب والموكل',fields:[['fee','الأتعاب المتفق عليها','8,000'],['plan','طريقة الدفع','نصفها عند التوقيع والباقي عند صدور الحكم'],['exp','طريقة دفع المصاريف','يدفعها الطرف الأول عن الطرف الثاني عند الحاجة ويستردها منه بموجب إيصالاتها'],['expDays','مهلة سداد كشف المصاريف (أيام)','7']],body:['اتفاقية أتعاب محاماة','','الطرف الأول: {lawyer}، {office}.','الطرف الثاني: {client}.','موضوع التوكيل: {subject}، الدعوى رقم {no} لدى {court}.','','1. يتقاضى الطرف الأول أتعاباً مقطوعة مقدارها {fee} شيكل، تُدفع {plan}.','2. لا تشمل الأتعاب الرسوم والمصاريف القضائية (رسوم المحكمة والطوابع والتبليغ والخبرة والترجمة وكاتب العدل ودائرة التنفيذ والتنقل)، ويتحملها الطرف الثاني؛ {exp}.','3. يقدّم الطرف الأول للطرف الثاني كشفاً بالمصاريف المدفوعة عنه مرفقاً بإيصالاتها، ويلتزم الطرف الثاني بسدادها خلال {expDays} أيام من تقديمه، وهي مستقلة عن الأتعاب ولا تُخصم منها.','4. يحتاج الطعن بالاستئناف أو النقض إلى اتفاق أتعاب مستقل.','5. يلتزم الطرف الثاني بتزويد الطرف الأول بالمستندات والمعلومات اللازمة في مواعيدها.','6. تخضع هذه الاتفاقية للقوانين والأنظمة النافذة في فلسطين ولأنظمة نقابة المحامين.','','حُررت في {city} بتاريخ {date} من نسختين.','','الطرف الأول ................          الطرف الثاني ................']},
 t7:{name:'لائحة استئناف',hint:'طعن في حكم صلح أو بداية',fields:[['jdate','تاريخ الحكم المستأنف','30/9/2026'],['ground','سبب إضافي','أخطأت المحكمة إذ لم ترد على دفوع المستأنف الجوهرية']],body:['لدى محكمة الاستئناف الموقرة','لائحة استئناف','','المستأنف: {client}، بواسطة وكيله {lawyer}.','المستأنف ضده: {opp}.','الحكم المستأنف: الحكم الصادر عن {court} في الدعوى رقم {no} بتاريخ {jdate}.','','أسباب الاستئناف:','1. أخطأت المحكمة في تطبيق القانون وتفسيره.','2. أخطأت المحكمة في وزن البينة وتقديرها.','3. {ground}.','','الطلبات:','قبول الاستئناف شكلاً لتقديمه ضمن المدة القانونية، وفي الموضوع فسخ الحكم المستأنف والحكم وفق ما ورد في لائحة الدعوى، مع تضمين المستأنف ضده الرسوم والمصاريف وأتعاب المحاماة عن درجتي التقاضي.','','باحترام','{lawyer}  ·  {date}']}};
function tplCtx(){if(!K(S.tplCase)&&cases.length)S.tplCase=cases[0].id;if(!TPL[S.tpl])S.tpl=Object.keys(TPL)[0];const k=K(S.tplCase)||{id:'',opps:[],no:'……',subject:'……',role:'……'},h=k.id?nextH(k.id):null,t=TPL[S.tpl];const c={client:(C(k.client)||{}).name||'……',opp:oppNames(k)||'……',court:(CT(k.court)||{}).name||'……',no:k.no,subject:k.subject,amount:Number(k.value||0).toLocaleString('en-US'),role:k.role,lawyer:OFFICE.lawyer,office:OFFICE.name,city:OFFICE.city,date:dmy(iso(TODAY)),hearing:h?dmy(h.date):'....'};t.fields.forEach(([key,,def])=>c[key]=S.tplVals[key]??def);return c}
function tplText(html){const c=tplCtx();return TPL[S.tpl].body.join('\n').split(/(\{\w+\})/).map(p=>{const m=p.match(/^\{(\w+)\}$/);if(m){const v=c[m[1]]??p;return html?`<span class="fill">${esc(v)}</span>`:v}return html?esc(p):p}).join('')}
V.tpls=()=>{const t=TPL[S.tpl];return `<div class="head"><div><h1>النماذج الجاهزة</h1><p class="sub">اختر نموذجاً وقضية، فتُملأ بيانات الموكل والخصم والمحكمة ورقم الدعوى تلقائياً</p></div></div>
 <div class="tplgrid"><section class="panel tpllist">${Object.entries(TPL).map(([id,x])=>`<button class="${S.tpl===id?'on':''}" data-act="tpl" data-v="${id}"><b>${x.name}</b><small>${x.hint}</small></button>`).join('')}</section>
 <div class="stack"><section class="panel"><div class="bd"><div class="form"><label>القضية<select class="field" id="tplCase">${cases.map(k=>`<option value="${k.id}" ${S.tplCase===k.id?'selected':''}>${k.no} · ${esc(C(k.client).name)}</option>`).join('')}</select></label>${t.fields.map(([key,lb,def])=>`<label class="wide">${lb}<input class="field" id="tf_${key}" data-tf="${key}" value="${esc(S.tplVals[key]??def)}"></label>`).join('')}</div>
 <div class="toolbar" style="margin-top:12px"><button class="btn pri" data-act="saveTpl">حفظ في مستندات القضية</button><button class="btn" data-act="copyTpl">نسخ النص</button><span class="note" style="border:0;padding:0">المقاطع المظللة مأخوذة من ملف القضية</span></div></div></section>
 <div class="paper" id="paper">${tplText(true)}</div></div></div>`};

V.portal=()=>{const c=C(S.pc),ks=cases.filter(k=>k.client===c.id);const ms=messages[c.id]||[];
 const nh=ks.map(k=>({k,h:nextH(k.id)})).filter(x=>x.h).sort((a,b)=>a.h.date.localeCompare(b.h.date))[0];
 const sd=docs.filter(d=>d.shared&&ks.some(k=>k.id===d.k));
 const quick=[['remind','تذكير بالجلسة'],['docs','طلب مستندات'],['update','تحديث الحالة'],['pay','تذكير بالدفعة']];
 return `<div class="head"><div><h1>بوابة الموكل</h1><p class="sub">ما يراه الموكل على هاتفه، وأدوات المكتب للتواصل والإشعارات التلقائية</p></div>
  <select class="field" id="pc">${clients.map(x=>`<option value="${x.id}" ${x.id===c.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div>
 <div class="portal"><div class="stack">
  <section class="panel"><header><h2>مراسلة ${esc(c.name)}</h2><span class="pill">القناة المفضلة: ${esc(c.ch)}</span></header><div class="bd stack" style="gap:12px">
   <div class="thread" style="max-height:260px;overflow:auto">${ms.map(bubble).join('')||'<div class="empty">ابدأ أول محادثة.</div>'}</div>
   <div class="chips">${quick.map(q=>`<button class="chip" data-act="quick" data-v="${q[0]}">${q[1]}</button>`).join('')}</div>
   <form id="fMsg" class="stack" style="gap:8px"><textarea class="field" id="msgT" rows="3" required placeholder="اكتب رسالة للموكل…"></textarea>
   <div class="toolbar"><div class="chips">${['البوابة','واتساب','رسالة SMS','البريد الإلكتروني'].map(ch=>`<button type="button" class="chip ${S.pch===ch?'on':''}" data-act="pch" data-v="${ch}">${ch}</button>`).join('')}</div><button class="btn pri" style="margin-inline-start:auto">إرسال</button></div></form></div></section>
  <section class="panel"><header><h2>إشعارات تلقائية للموكلين</h2></header><div class="bd">
   ${[['mz','إبلاغ الموكل فور وصول موعد جلسة أو قرار من ميزان'],['remind','تذكير قبل الجلسة بـ 48 ساعة، مع تنبيه خاص إن كان الحضور إلزامياً'],['doc','إشعار عند مشاركة مستند جديد في البوابة'],['pay','تذكير شهري بالأتعاب المستحقة']].map(([k,t])=>`<div class="toggle"><span>${t}</span><button class="sw ${S.rules[k]?'on':''}" data-act="rule" data-v="${k}" aria-pressed="${S.rules[k]}" aria-label="${t}"></button></div>`).join('')}</div></section>
  <p class="note">الإرسال عبر واتساب والرسائل القصيرة والبريد يتطلب ربط حسابات المكتب لدى مزوّدي هذه الخدمات. في هذه النسخة تُسجَّل الرسائل في سجل المحادثة فقط.</p>
 </div>
 <div class="phone" aria-label="معاينة البوابة كما يراها الموكل"><div class="ph-top"><small>${esc(OFFICE.name)}</small><b>أهلاً ${esc(c.name.split(' ')[0])}</b><small>${c.portal?'رمز الدخول '+c.code:'البوابة غير مفعّلة لهذا الموكل'}</small></div>
  <div class="ph-body">
   ${nh?`<div class="pcard" style="border-color:var(--accent)"><h3>جلستك القادمة</h3><b>${fmt(nh.h.date)} · <span class="mono">${nh.h.time}</span></b><div>${esc(CT(nh.k.court).name)}</div><div style="color:var(--muted)">${esc(nh.h.purpose)}</div><div style="margin-top:6px">${nh.h.attend?'<span class="pill warn">حضورك شخصياً مطلوب</span>':'<span class="pill ok">يحضر المحامي نيابة عنك</span>'}</div></div>`:''}
   ${ks.map(k=>`<div class="pcard"><h3>قضية رقم <span class="mono">${k.no}</span></h3><b>${esc(k.subject)}</b><div style="color:var(--muted)">المرحلة الحالية: ${STEPS[k.step]}</div><div class="steps">${STEPS.map((s,i)=>`<span class="${i<=k.step?'d':''}" title="${s}"></span>`).join('')}</div></div>`).join('')}
   <div class="pcard"><h3>مستندات مشاركة معك</h3>${sd.map(d=>`<div style="display:flex;justify-content:space-between;gap:8px;padding:3px 0"><span>${esc(d.title)}</span><span style="color:var(--muted)" class="num">${d.pages} ص</span></div>`).join('')||'<span style="color:var(--muted)">لا مستندات بعد</span>'}</div>
   <div class="pcard"><h3>الأتعاب</h3><div style="display:flex;justify-content:space-between"><span>المدفوع</span><b class="num">${money(c.paid)}</b></div><div style="display:flex;justify-content:space-between"><span>المتبقي</span><b class="num">${money(c.fee-c.paid)}</b></div><div class="bar" style="margin-top:6px"><span style="width:${Math.round(c.paid/c.fee*100)}%"></span></div></div>
   <div class="pcard"><h3>محادثتك مع المكتب</h3><div class="thread">${ms.slice(-3).map(m=>`<div class="bubble ${m.f==='me'?'them':'me'}">${esc(m.t)}</div>`).join('')}</div></div>
  </div></div></div>`};

V.mizan=()=>`<div class="head"><div><h1>الربط مع ميزان</h1><p class="sub">مطابقة قضايا المكتب مع أرقامها في نظام إدارة القضايا الفلسطيني وجلب الجلسات والقرارات والمستندات</p></div></div>
 <div class="mz-head"><div class="seal" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="color:var(--brass)"><path d="M12 3v17M7 20h10M4 7h16M6 7l-3 6a3 3 0 0 0 6 0L6 7zm12 0l-3 6a3 3 0 0 0 6 0l-3-6z"/></svg></div>
  <div><b style="font-size:16px">الحالة: متصل</b><div style="color:var(--muted);font-size:13px">آخر مزامنة ${S.lastSync} · ${cases.length} قضايا مطابقة · مزامنة تلقائية يومياً الساعة 8:15 صباحاً</div></div>
  <button class="btn pri" data-act="sync" ${S.syncing?'disabled':''}>${S.syncing?'<span class="spin"></span> جارٍ الجلب…':'مزامنة الآن'}</button></div>
 <div class="grid2"><div class="stack">
  <section class="panel"><header><h2>تحديثات بانتظار المراجعة</h2><span class="pill ${S.pending.length?'mz':''}">${S.pending.length}</span></header>
   <div>${S.pending.map((u,i)=>`<div class="upd"><div><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span class="pill mz">${u.kind}</span><button class="link mono" data-act="openCase" data-v="${u.k}">${K(u.k).no}</button><span style="font-size:12.5px;color:var(--muted)">${esc(C(K(u.k).client).name)}</span></div><div style="margin-top:4px">${esc(u.t)}</div></div><div class="toolbar"><button class="btn sm pri" data-act="applyU" data-v="${i}">اعتماد</button><button class="btn sm" data-act="dropU" data-v="${i}">تجاهل</button></div></div>`).join('')||'<div class="empty">لا تحديثات معلقة. اضغط «مزامنة الآن» لجلب المستجدات.</div>'}</div></section>
  <section class="panel tablewrap"><header><h2>مطابقة أرقام القضايا</h2></header><table><thead><tr><th>رقم المكتب</th><th>مرجع ميزان</th><th>المحكمة</th><th>الحالة</th></tr></thead><tbody>${cases.map(k=>`<tr class="clk" data-act="openCase" data-v="${k.id}"><td class="mono">${k.no}</td><td class="mono">${k.mz}</td><td>${esc(CT(k.court).name)}</td><td><span class="pill ok">مطابقة</span></td></tr>`).join('')}</tbody></table></section></div>
 <div class="stack"><section class="panel"><header><h2>سجل المزامنة</h2></header><div class="feed">${mzLog.map(l=>`<div><time>${l.at} · <span class="mono">${esc((K(l.k)||{}).no||'—')}</span></time>${esc(l.t)}</div>`).join('')}</div></section>
  <p class="note">هذه واجهة ربط تجريبية تحاكي البيانات. الربط الفعلي مع ميزان يتطلب صلاحيات وصول واتفاقية مع الجهة المشغلة للنظام، ثم يُوصل هذا القسم بها دون تغيير بقية النظام.</p></div></div>`;

/* ── العرض ── */
function render(){const p=document.getElementById('page');let h;
 try{h=(V[S.view]||V.dash)()}catch(e){console.error('render',S.view,e);h=`<section class="panel"><div class="bd"><b>تعذّر عرض هذه الشاشة.</b><p class="m">${esc(String(e&&e.message||e))}</p><button class="btn sm" data-act="nav" data-v="dash">العودة إلى الرئيسية</button></div></section>`}
 p.innerHTML=h;drawNav();bindLocal()}
function bindLocal(){
 const cq=document.getElementById('cq');if(cq)cq.oninput=e=>{S.cq=e.target.value;document.getElementById('ctb').innerHTML=caseRows()};
 const cf=document.getElementById('cfq');if(cf)cf.oninput=e=>{document.getElementById('cfr').innerHTML=conflict(e.target.value)};
 const tc=document.getElementById('tplCase');if(tc)tc.onchange=e=>{S.tplCase=e.target.value;document.getElementById('paper').innerHTML=tplText(true)};
 document.querySelectorAll('[data-tf]').forEach(i=>i.oninput=e=>{S.tplVals[e.target.dataset.tf]=e.target.value;document.getElementById('paper').innerHTML=tplText(true)});
 const pc=document.getElementById('pc');if(pc)pc.onchange=e=>{S.pc=e.target.value;render()};
 const dk=document.getElementById('docK');if(dk)dk.onchange=e=>{S.docK=e.target.value;docRefresh()};
 const up=document.getElementById('upl');if(up)up.onchange=e=>{const f=e.target.files[0];if(!f)return;docs.push({id:'d'+Date.now(),k:S.docK==='all'?cases[0].id:S.docK,title:f.name,kind:'مرفوع',date:iso(TODAY),src:'رفع يدوي',pages:1,shared:false});toast('سُجّل المستند «'+f.name+'»');render()};
}
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,2600)}
function nowStamp(){const n=new Date();return iso(TODAY)+' '+String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0')}
function sendMsg(cid,t,ch){(messages[cid]=messages[cid]||[]).push({f:'me',ch,t,at:nowStamp()})}

const A={
 crMode:v=>{CR.mode=v==='records'?'records':'cards';try{localStorage.setItem('mq_clients_view',CR.mode)}catch(e){}render()},
 docClear:()=>{Object.assign(DF,{q:'',client:'',kind:'',src:'',share:'',from:'',to:''});S.docK='all';render()},
 crSort:v=>{if(CR.sort===v)CR.dir=-CR.dir;else{CR.sort=v;CR.dir=['fee','paid','due','cases','portal'].includes(v)?-1:1}const b=document.getElementById('crBody');if(b)b.innerHTML=clientRecords();const sel=document.getElementById('crSortSel');if(sel)sel.value=['new','old','name','due','cases','last'].includes(v)?v:''},
 crClear:()=>{Object.assign(CR,{q:'',f:'all',type:'',city:'',ch:'',from:'',to:''});render()},
 crPrint:()=>{if(!window.MQP)return;const rs=crList(),M=MQP,B=M.B,E=M.esc;MQP.open({label:'سجل الموكلين',build(){return {title:'سجل الموكلين',sub:rs.length+' موكلاً'+(CR.q?' · بحث: '+CR.q:''),ref:'مك/'+iso(TODAY),file:'سجل الموكلين - '+iso(TODAY),orient:'land',sign:[],blocks:[B.t(['#','الموكل','الهاتف','القضايا','الأتعاب','المحصّل','المتبقي','قناة التواصل','البوابة'],rs.map((r,i)=>[i+1,E(r.c.name),'<span dir="ltr">'+E(r.c.phone||'')+'</span>',E(r.ks.map(k=>k.no).join('، ')||'—'),money(r.fee),money(r.paid),r.due?money(r.due):'—',E(r.c.ch||'—'),r.c.portal?('مفعّلة'+(r.c.last?' · '+dmy(r.c.last):'')):'غير مفعّلة']),{w:['4%','18%','12%','16%','10%','10%','10%','10%','10%']})]}}})},
 nav:v=>{S.view=v;window.scrollTo(0,0);render()},
 openCase:v=>{S.view='case';S.caseId=v;S.caseTab='c360';window.scrollTo(0,0);render()},
 openClient:v=>{S.view='client';S.clientId=v;window.scrollTo(0,0);render()},
 caseTab:v=>{S.caseTab=v;render()},
 cf:v=>{S.cf=v;render()},
 tpl:v=>{S.tpl=v;S.tplVals={};render()},
 tplFor:v=>{S.tplCase=v;S.view='tpls';render()},
 portalFor:v=>{S.pc=v;S.view='portal';(messages[v]||[]).forEach(m=>m.unread=false);render()},
 pch:v=>{S.pch=v;document.querySelectorAll('[data-act="pch"]').forEach(b=>b.classList.toggle('on',b.dataset.v===v))},
 rule:v=>{S.rules[v]=!S.rules[v];render()},
 share:v=>{const d=docs.find(x=>x.id===v);d.shared=!d.shared;toast(d.shared?'أصبح المستند ظاهراً في بوابة الموكل':'أُخفي المستند من البوابة');render()},
 togglePortal:v=>{const c=C(v);c.portal=!c.portal;if(c.portal)sendMsg(v,'تم تفعيل حسابك في بوابة الموكلين. رمز الدخول: '+c.code,c.ch);toast(c.portal?'فُعّلت البوابة وأُرسل رمز الدخول':'أُغلقت البوابة');render()},
 quick:v=>{const c=C(S.pc),ks=cases.filter(k=>k.client===c.id);const nh=ks.map(k=>({k,h:nextH(k.id)})).filter(x=>x.h).sort((a,b)=>a.h.date.localeCompare(b.h.date))[0];
  const t={remind:nh?`تذكير: لديك جلسة يوم ${fmt(nh.h.date)} الساعة ${nh.h.time} في ${CT(nh.k.court).name} في القضية رقم ${nh.k.no}.${nh.h.attend?' حضورك شخصياً إلزامي.':' حضورك غير مطلوب.'}`:'لا توجد جلسات محددة حالياً، وسنبلغك فور تحديد موعد.',
   docs:'نرجو تزويد المكتب بالمستندات التالية قبل الجلسة القادمة: ',
   update:ks.map(k=>`القضية ${k.no}: وصلت إلى مرحلة ${k.stage}.`).join(' '),
   pay:`نود تذكيرك بأن المتبقي من الأتعاب المتفق عليها هو ${money(c.fee-c.paid)}. شاكرين تعاونكم.`}[v];
  const ta=document.getElementById('msgT');ta.value=t;ta.focus()},
 copyTpl:(v,b)=>{const t=tplText(false);const fb=()=>{const r=document.createRange();r.selectNodeContents(document.getElementById('paper'));const s=getSelection();s.removeAllRanges();s.addRange(r);toast('النص محدد، انسخه يدوياً')};try{navigator.clipboard.writeText(t).then(()=>toast('نُسخ النص'),fb)}catch(e){fb()}},
 saveTpl:()=>{const k=K(S.tplCase);docs.push({id:'d'+Date.now(),k:k.id,title:TPL[S.tpl].name+' · '+C(k.client).name,kind:TPL[S.tpl].name,date:iso(TODAY),src:'مولّد من نموذج',pages:1,shared:false});toast('حُفظ في مستندات القضية '+k.no);drawNav()},
 sync:()=>{S.syncing=true;render();setTimeout(()=>{S.syncing=false;S.lastSync=nowStamp();const fresh=MZ_INCOMING.filter(u=>!u.done&&!S.pending.includes(u)&&K(u.k));S.pending.push(...fresh);mzLog.unshift({at:S.lastSync,k:(fresh[0]||{}).k||((cases[0]||{}).id)||'',t:fresh.length?'جُلبت '+fresh.length+' تحديثات جديدة':'لا مستجدات'});toast(fresh.length?'وصلت '+fresh.length+' تحديثات من ميزان':'لا مستجدات في ميزان');render()},1400)},
 applyU:v=>{const u=S.pending[v];u.apply();u.done=true;S.pending.splice(v,1);mzLog.unshift({at:nowStamp(),k:u.k,t:'اعتُمد: '+u.t});
  if(S.rules.mz){const k=K(u.k);sendMsg(k.client,'مستجد في قضيتك رقم '+k.no+': '+u.t,C(k.client).ch)}
  toast(S.rules.mz?'اعتُمد التحديث وأُبلغ الموكل':'اعتُمد التحديث');render()},
 dropU:v=>{const u=S.pending[v];u.done=true;S.pending.splice(v,1);render()},
 newCase:()=>openModal(),
 close:()=>{document.getElementById('modal').innerHTML=''}
};
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-act]');
 if(!e.target.closest('.search'))document.getElementById('gres').hidden=true;
 if(!t)return;
 if(t.dataset.act==='close'&&e.target!==t)return;
 A[t.dataset.act]?.(t.dataset.v,t,e);
 if(t.closest('.results')){document.getElementById('gres').hidden=true;document.getElementById('gq').value=''}
});
document.addEventListener('submit',e=>{e.preventDefault();const f=e.target;
 if(f.id==='fH'){hearings.push({id:'h'+Date.now(),k:S.caseId,date:f.hD.value,time:f.hT.value,purpose:f.hP.value,attend:f.hA.checked,mz:false});const k=K(S.caseId);
  if(S.rules.mz)sendMsg(k.client,`حُددت جلسة في قضيتك رقم ${k.no} يوم ${fmt(f.hD.value)} الساعة ${f.hT.value}: ${f.hP.value}.${f.hA.checked?' حضورك شخصياً مطلوب.':''}`,C(k.client).ch);
  toast('أُضيفت الجلسة'+(S.rules.mz?' وأُبلغ الموكل':''));render()}
 if(f.id==='fMsg'){const t=f.msgT.value.trim();if(!t)return;sendMsg(S.pc,t,S.pch);toast('سُجّلت الرسالة عبر '+S.pch);render()}
 if(f.id==='fPay'){const n=Number(f.payAmt.value);if(n>0){C(S.clientId).paid+=n;toast('سُجّلت دفعة بقيمة '+money(n));render()}}
 if(f.id==='fCase'){const id='k'+Date.now();let cid=f.ncC.value;
  if(cid==='new'){cid='c'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);clients.push({id:cid,name:f.ncN.value.trim()||'موكل جديد',type:'فرد',idNo:'—',phone:f.ncPh.value.trim()||'—',city:OFFICE.city,ch:'واتساب',portal:false,last:null,fee:Math.max(0,Number(f.ncF.value)||0),paid:0,since:iso(TODAY),code:window.MQ_code?MQ_code():''})}
  else if(Number(f.ncF.value)>0){const cl=C(cid);cl.fee=(Number(cl.fee)||0)+Number(f.ncF.value)} /* أتعاب القضية الجديدة تُضاف لأتعاب الموكل */
  let oid=opponents.find(o=>o.name===f.ncO.value.trim())?.id;if(!oid){oid='o'+Date.now();opponents.push({id:oid,name:f.ncO.value.trim()||'خصم غير محدد',type:'—',lawyer:'—'})}
  cases.push({id,no:f.ncNo.value||'قيد التسجيل',court:f.ncCt.value,type:f.ncT.value,subject:f.ncS.value,client:cid,opps:[oid],role:f.ncR.value,stage:'قيد التسجيل',step:0,status:'نشطة',value:Number(f.ncV.value)||0,fee:Math.max(0,Number(f.ncF.value)||0),opened:iso(TODAY),mz:'بانتظار الإسناد',pri:'متوسطة'});
  A.close();A.openCase(id);toast('فُتح ملف القضية')}
});
function openModal(){document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog" aria-label="قضية جديدة"><div class="head"><h1 style="font-size:24px">فتح ملف قضية</h1><button class="btn sm" data-act="close">إغلاق</button></div>
 <form class="form" id="fCase"><label class="wide">موضوع الدعوى<input class="field" id="ncS" required placeholder="مثال: مطالبة ببدل إيجار متأخر"></label>
 <label>نوع القضية<select class="field" id="ncT">${['حقوقية · مطالبة مالية','عمالية','جزائية','إخلاء مأجور','تنفيذ','شرعية','استئناف حقوقي'].map(x=>`<option>${x}</option>`).join('')}</select></label>
 <label>المحكمة<select class="field" id="ncCt">${courts.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></label>
 <label>الموكل<select class="field" id="ncC"><option value="new">موكل جديد…</option>${clients.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></label>
 <label>صفة الموكل<select class="field" id="ncR">${['مدعٍ','مدعى عليه','مستأنف','مستأنف ضده','مشتكى عليه','مشتكٍ'].map(x=>`<option>${x}</option>`).join('')}</select></label>
 <label>اسم الموكل الجديد<input class="field" id="ncN" placeholder="يُترك فارغاً عند اختيار موكل"></label><label>هاتف الموكل<input class="field" id="ncPh"></label>
 <label class="wide">الخصم<input class="field" id="ncO" required list="oppl" placeholder="اسم الخصم"><datalist id="oppl">${opponents.map(o=>`<option value="${esc(o.name)}">`).join('')}</datalist></label>
 <label>رقم الدعوى (إن وُجد)<input class="field mono" id="ncNo" placeholder="0000/2026"></label><label>قيمة الدعوى ₪<input class="field" id="ncV" type="number" min="0"></label><label>الأتعاب ₪<input class="field" id="ncF" type="number" min="0"></label>
 <p class="note wide">قبل الحفظ، تأكد من فحص تضارب المصالح على اسم الخصم من قسم «الخصوم».</p>
 <button class="btn pri">فتح الملف</button></form></div></div>`;document.getElementById('ncS').focus()}

/* البحث الشامل */
const gq=document.getElementById('gq'),gr=document.getElementById('gres');
gq.oninput=()=>{const q=gq.value.trim();if(q.length<2){gr.hidden=true;return}
 const r=[...cases.filter(k=>[k.no,k.subject].join(' ').includes(q)).map(k=>`<button data-act="openCase" data-v="${k.id}"><span><span class="mono">${k.no}</span> · ${esc(k.subject)}</span><small>قضية</small></button>`),
  ...clients.filter(c=>c.name.includes(q)).map(c=>`<button data-act="openClient" data-v="${c.id}"><span>${esc(c.name)}</span><small>موكل</small></button>`),
  ...opponents.filter(o=>o.name.includes(q)).map(o=>{const k=cases.find(k=>k.opps.includes(o.id));return `<button data-act="openCase" data-v="${k?k.id:''}"><span>${esc(o.name)}</span><small>خصم${k?' · '+k.no:''}</small></button>`}),
  ...docs.filter(d=>d.title.includes(q)).map(d=>`<button data-act="openCase" data-v="${d.k}"><span>${esc(d.title)}</span><small>مستند · ${K(d.k).no}</small></button>`)];
 gr.innerHTML=r.slice(0,10).join('')||'<div class="empty">لا نتائج.</div>';gr.hidden=false};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){A.close();gr.hidden=true}});
addEventListener('DOMContentLoaded',()=>render());
