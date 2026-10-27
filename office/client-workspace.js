/* ── حقيبة الموكل: «مساحة العمل بعمودين» ──
   عمود جانبي ثابت: بطاقة الموكل، قضاياه، سير القضية المفتوحة (قائمة مختصرة)، وأقسام ملف الموكل.
   العمود الرئيسي: القضية المفتوحة أو القسم المختار فقط، مع سطر «الآن» والمؤشرات المختصرة وما ينقص الملف مطوياً.
   طبقة عرض فقط فوق الشاشة القائمة: كل الأزرار والأوامر هي نفسها، فلا يتغير السلوك ولا البيانات. */
(function(){
'use strict';
if(typeof V==='undefined'||typeof V.client!=='function')return;
const E=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const doc=document;
const vclient=V.client;
const ctName=k=>{try{return (CT(k.court)||{}).name||''}catch(_){return ''}};
const nextH=k=>{try{const t=new Date().toISOString().slice(0,10);return (typeof hearings!=='undefined'?hearings:[]).filter(h=>h.k===k.id&&h.date>=t).sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||'')))[0]||null}catch(_){return null}};
const dm=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||'');return m?(+m[3])+'/'+(+m[2]):''};
const unread=c=>{try{return ((typeof messages!=='undefined'?messages:{})[c.id]||[]).filter(m=>m.unread&&m.f!=='me').length}catch(_){return 0}};

/* «نظرة عامة» على الموكل: بطاقات مختصرة لكل قسم، تُفتح بالضغط فقط */
const fmtDate=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||'');return m?(+m[3])+'/'+(+m[2])+'/'+m[1]:''};
function homeView(c,ks,secs,u,due){
 const ms=(typeof messages!=='undefined'&&messages[c.id])||[],last=ms[ms.length-1];
 const t0=new Date().toISOString().slice(0,10),ids=new Set(ks.map(k=>k.id)),kno=id=>(ks.find(k=>k.id===id)||{}).no||'';
 const hs=(typeof hearings!=='undefined'?hearings:[]).filter(h=>ids.has(h.k)&&h.date>=t0).map(h=>({at:h.date,t:'جلسة: '+(h.purpose||''),k:h.k,ic:'⚖'}));
 const dl=(typeof deadlines!=='undefined'?deadlines:[]).filter(d=>ids.has(d.k)&&!d.done&&d.due>=t0).map(d=>({at:d.due,t:'مهلة: '+(d.title||''),k:d.k,ic:'⏳'}));
 const up=hs.concat(dl).sort((a,b)=>a.at.localeCompare(b.at)).slice(0,4);
 const fee=+c.fee||0,paid=+c.paid||0,pct=fee?Math.min(100,Math.round(paid/fee*100)):0;
 const ICO={msgs:'💬',media:'📎',cases:'🧭',settle:'🤝',acct:'₪',mizan:'⟳'};
 const cntOf=b=>{const n=b.querySelector('.tcount');return n?n.textContent.trim():''};
 const lbOf=b=>b.childNodes[0]?b.childNodes[0].textContent.trim():b.textContent.trim();
 const detail=(v,b)=>v==='msgs'?(last?`<p class="cw-q">${last.f==='me'?'أنت: ':''}${E(String(last.t||'').slice(0,110))}</p><small>${E(last.ch||'')} · ${E(fmtDate(last.at))}</small>`:'<small>لا مراسلات بعد</small>')
  :v==='acct'?`<p><b>${due.toLocaleString('en-US')} ₪</b> متبقٍ${fee?' من '+fee.toLocaleString('en-US'):''}</p><div class="cw-bar"><span style="width:${pct}%"></span></div>`
  :`<small>${cntOf(b)?E(cntOf(b))+' عنصر':'افتح القسم'}</small>`;
 const order=['msgs','acct','media','settle','mizan','cases'];
 const tiles=[...secs].sort((a,b)=>order.indexOf(a.dataset.v)-order.indexOf(b.dataset.v)).map(b=>{const v=b.dataset.v,hot=v==='msgs'&&u;
  return `<button type="button" class="cw-tile t-${E(v)} ${hot?'hot':''}" data-act="bagTab" data-v="${E(v)}"><div class="cw-th"><i>${ICO[v]||'•'}</i><b>${E(lbOf(b))}</b>${hot?`<span class="cw-badge">${u} جديدة</span>`:''}<em>فتح ←</em></div>${detail(v,b)}</button>`}).join('');
 return `<div class="cw-home-v"><header class="cw-hh"><h2>نظرة عامة</h2><span class="m">اختر قضية من الجانب أو افتح أحد الأقسام</span></header>
  <section class="cw-up"><h3>القادم في قضايا الموكل</h3>${up.length?`<ul>${up.map(x=>`<li><button type="button" data-act="openCase" data-v="${E(x.k)}"><i>${x.ic}</i><span>${E(x.t)}</span><small class="mono">${E(kno(x.k))}</small><time>${E(fmtDate(x.at))}</time></button></li>`).join('')}</ul>`:'<p class="m">لا جلسات أو مهل قادمة.</p>'}</section>
  <div class="cw-tiles">${tiles}</div></div>`}
A.cwTl=()=>{S.cwTlAll=1;render()};
/* القوائم المطوية تُغلق عند اختيار أمر أو الضغط خارجها */
doc.addEventListener('click',ev=>{doc.querySelectorAll('.cw-dd[open],.cw-steps[open]').forEach(d=>{if(d.classList.contains('cw-steps'))return;if(!d.contains(ev.target)||ev.target.closest('.cw-ddi'))d.removeAttribute('open')})},true);
{const oc=A.openClient;A.openClient=v=>{S.cwTlAll=0;if(typeof oc==='function')oc(v);S.bagTab='home';render()}}
{const ok=A.openCase;if(typeof ok==='function')A.openCase=(...a)=>{S.cwTlAll=0;return ok(...a)}}
V.client=function(){
 /* «نظرة عامة» هي الواجهة الافتراضية: لا يُفتح قسم (كالمراسلات) إلا بالضغط عليه */
 const home=!S.bagTab||S.bagTab==='home';if(home)S.bagTab='cases';
 let html;try{html=vclient.apply(this,arguments)}finally{if(home)S.bagTab='home'}
 const c=typeof C==='function'?C(S.clientId):null;if(!c)return html;
 const ks=(typeof cases!=='undefined'?cases:[]).filter(k=>k.client===c.id);
 const t=doc.createElement('template');t.innerHTML=html;const R=t.content;
 const head=R.querySelector('.bag-head'),wa=R.querySelector('#waBar'),hubCases=R.querySelector('.hub-cases'),bagTabs=[...R.children].find(x=>x.classList&&x.classList.contains('tabs')),body=R.querySelector('#bagBody');
 if(!head||!body)return html;
 const back=R.querySelector('[data-act="nav"][data-v="clients"]');
 const u=unread(c),due=Math.max(0,(+c.fee||0)-(+c.paid||0)),tab=S.bagTab||'home';
 /* 1) بطاقة الموكل */
 const card=`<section class="cw-client"><div class="cw-cid"><div class="cw-av">${E(String(c.name||'').trim()[0]||'م')}</div><div><h1><button type="button" class="cw-home" data-act="bagTab" data-v="home" title="نظرة عامة على الموكل">${E(c.name)}</button></h1><small>${E([c.type,c.city,c.phone].filter(Boolean).join(' · '))}</small></div></div>
  <div class="cw-cact">${c.whatsapp||c.phone?`<a class="btn sm cw-wa" target="_blank" rel="noopener" href="https://wa.me/${String(c.whatsapp||c.phone).replace(/\D/g,'').replace(/^0/,'970')}">واتساب</a>`:''}<details class="cw-more"><summary class="btn sm">⋯ المزيد</summary><div class="cw-pop"></div></details></div>
  <div class="cw-portal ${c.portal?'on':''}"><i></i><span>${c.portal?'البوابة مفعّلة'+(c.last?' · آخر دخول '+E(dm(c.last)):''):'البوابة غير مفعّلة'}</span><button type="button" class="sw ${c.portal?'on':''}" data-act="togglePortal" data-v="${E(c.id)}" aria-label="تفعيل أو إيقاف بوابة الموكل" aria-pressed="${c.portal?'true':'false'}" title="${c.portal?'إيقاف البوابة':'تفعيل البوابة وإرسال رمز الدخول'}"></button></div></section>`;
 /* 2) قضايا الموكل */
 const list=`<section class="cw-box"><h3>القضايا <small>${ks.length}</small>${bagTabs&&bagTabs.querySelector('[data-v="cases"]')?`<button type="button" class="cw-st ${tab==='cases'?'on':''}" data-act="bagTab" data-v="cases" title="محطات القضايا: أين وصلت كل قضية">🧭 المحطات</button>`:''}</h3>${ks.map(k=>{const h=nextH(k);const on=tab==='case'&&S.caseId===k.id;return `<button type="button" class="cw-k ${on?'on':''} ${k.status==='منتهية'?'done':''}" data-act="openCase" data-v="${E(k.id)}"><b class="mono">${E(k.no||'جديدة')}</b><span>${E(String(k.subject||'').slice(0,60))}</span><small>${E(ctName(k))}${h?' · جلسة '+E(dm(h.date)):''}${k.status==='منتهية'?' · منتهية':''}</small></button>`}).join('')||'<div class="m">لا قضايا بعد.</div>'}
  ${hubCases&&hubCases.querySelector('[data-act="caseFor"]')?`<button type="button" class="btn sm cw-new" data-act="caseFor" data-v="${E(c.id)}">+ قضية جديدة</button>`:''}</section>`;
 /* 2ب) أوراق قبول القضية: الوكالة + اتفاقية الأتعاب، في مكان ثابت وواضح */
 const kc=tab==='case'&&typeof K==='function'?K(S.caseId):null;
 const pr=kc&&kc.feeTerms&&kc.feeTerms.printedAt;
 const papers=kc?`<button type="button" class="cw-papers ${pr?'ok':''}" data-act="csPrintPoa" data-v="${E(kc.id)}" title="${pr?E(window.MQ_feeTermsLabel?MQ_feeTermsLabel(kc):''):'تُطبع عند قبول القضية والاتفاق على الأتعاب'}"><i>🖨</i><span><b>الوكالة + اتفاقية الأتعاب</b><small>${pr?'✓ طُبعت '+E(dm(kc.feeTerms.printedAt))+(kc.feeTerms.fee?' · '+Number(kc.feeTerms.fee).toLocaleString('en-US')+' ₪':''):'لم تُطبع بعد'}</small></span></button>`:'';
 /* 3) سير القضية (من لوحة الخطوات نفسها، بشكل مختصر) */
 const steps=body.querySelector('.cs-panel');let stepsBox='';
 if(steps&&tab==='case'){const lis=[...steps.querySelectorAll('.cs-list > li')],done=lis.filter(l=>l.classList.contains('cs-done')).length,cur=lis.findIndex(l=>l.classList.contains('cs-cur'));
  const curT=cur>=0?((lis[cur].querySelector('.cs-b b')||{}).textContent||''):'اكتملت المراحل';
  stepsBox=`<details class="cw-box cw-steps"><summary><h3>سير القضية <small>${cur>=0?(cur+1)+' من '+lis.length:'اكتملت'}</small><em>▾</em></h3><div class="cw-prog"><span style="width:${Math.round(done/Math.max(1,lis.length)*100)}%"></span></div><div class="cw-curst">${E(curT)}</div></summary><ol>${lis.map((l,i)=>{const st=l.classList.contains('cs-done')?'done':l.classList.contains('cs-cur')?'cur':'todo';const b=l.querySelector('[data-act="csGo"]');const ti=(l.querySelector('.cs-b b')||{}).textContent||'';const de=(l.querySelector('.cs-b small')||{}).textContent||'';
   return `<li class="${st}">${b?`<button type="button" data-act="csGo" data-v="${E(b.dataset.v)}" title="${E(de)}">`:'<span title="'+E(de)+'">'}<i>${st==='done'?'✓':i+1}</i>${E(ti)}${b?'</button>':'</span>'}</li>`}).join('')}</ol></details>`}
 /* 4) أقسام ملف الموكل (التبويبات السابقة) */
 const secs=bagTabs?[...bagTabs.querySelectorAll('button')].filter(b=>b.dataset.v!=='case'&&b.dataset.v!=='cases'):[];
 const ICO={msgs:'💬',media:'📎',cases:'🧭',settle:'🤝',acct:'₪',mizan:'⟳'};
 const menu=secs.length&&tab!=='home'?`<section class="cw-box"><h3>ملف الموكل <button type="button" class="cw-st" data-act="bagTab" data-v="home">نظرة عامة</button></h3><nav class="cw-menu">${secs.map(b=>{const n=b.querySelector('.tcount');return `<button type="button" data-act="bagTab" data-v="${E(b.dataset.v)}" class="${b.classList.contains('on')?'on':''}"><i>${ICO[b.dataset.v]||'•'}</i>${E(b.childNodes[0]?b.childNodes[0].textContent.trim():b.textContent)}${n&&n.textContent.trim()?`<span class="${n.classList.contains('hot')?'hot':''}">${E(n.textContent.trim())}</span>`:''}</button>`}).join('')}</nav></section>`:'';
 /* 5) العمود الرئيسي */
 if(tab==='home'){body.innerHTML=homeView(c,ks,secs,u,due)}
 else if(tab!=='case'){const bar=doc.createElement('div');bar.className='cw-secbar';bar.innerHTML=`<button type="button" class="link" data-act="bagTab" data-v="home">→ نظرة عامة</button>`;body.prepend(bar)}
 if(tab==='case'){
  if(steps){const cur=steps.querySelector('.cs-list > li.cs-cur');if(cur){const ti=(cur.querySelector('.cs-b b')||{}).textContent||'',go=cur.querySelector('[data-act="csGo"]');
    const now=doc.createElement('div');now.className='cw-now';now.innerHTML=`<span><b>الآن:</b> ${E(ti)}</span>${go?`<button type="button" class="btn sm pri" data-act="csGo" data-v="${E(go.dataset.v)}">الخطوة التالية ←</button>`:''}`;steps.replaceWith(now)}else steps.remove()}
  const qc=body.querySelector('.qc-box');if(qc){const n=(qc.textContent.match(/\((\d+)\)/)||[])[1]||'';const d=doc.createElement('details');d.className='cw-qc';d.innerHTML=`<summary>⚠ ينقص هذا الملف${n?' · '+n+(n==='1'?' أمر':' أمور'):''} <small>اضغط للعرض</small></summary>`;qc.replaceWith(d);d.appendChild(qc)}
  /* إزالة المكرر داخل الحقيبة: الطباعة في «أوراق التوكيل»، والمراسلة من بطاقة الموكل وخانة «رسائل الموكل» */
  body.querySelectorAll('.hub-acts [data-act="csPrintPoa"],.hub-acts [data-act="bag"]').forEach(b=>b.remove());
  /* شريط الأوامر: قائمتان مطويتان «إضافة» و«أدوات» بدل صفّين من الأزرار */
  const acts=body.querySelector('.hub-acts');if(acts){const grps=[...acts.querySelectorAll('.cl-grp')];if(grps.length){const bar=doc.createElement('div');bar.className='cw-acts';
   grps.forEach(g=>{const lb=(g.querySelector('.cl-lb')||{}).textContent||'';const bs=[...g.querySelectorAll('button')];if(!bs.length)return;const d=doc.createElement('details');d.className='cw-dd';d.innerHTML=`<summary class="btn sm ${lb==='إضافة'?'pri':''}">${lb==='إضافة'?'＋ إضافة':'⚙ أدوات'} <em>▾</em></summary><div class="cw-ddm"></div>`;const m=d.querySelector('.cw-ddm');bs.forEach(b=>{b.className='cw-ddi';m.appendChild(b)});bar.appendChild(d)});
   const nowB=body.querySelector('.cw-now');if(nowB){nowB.insertBefore(bar,nowB.querySelector('.btn'));acts.remove()}else acts.replaceWith(bar)}}
  /* سجل القضية: آخر 6 أحداث، والباقي عند الطلب */
  const tl=body.querySelector('.hub-tl');if(tl&&!S.cwTlAll){const lis=tl.querySelectorAll('.hub-list>li');if(lis.length>6||tl.querySelector('.hub-filters')){tl.classList.add('cw-short');const b=doc.createElement('div');b.className='cw-tlmore';b.innerHTML=`<button type="button" class="btn sm" data-act="cwTl">عرض السجل كاملاً وأدوات التصفية${lis.length>6?' ('+lis.length+')':''}</button>`;(tl.querySelector('.bd')||tl).appendChild(b)}}
  /* صف «ترابط بيانات القضية»: الموكل في البطاقة الجانبية والجلسة في «الآن»؛ يبقى سطر مختصر بالمحكمة والخصوم ومرجع ميزان */
  const chain=body.querySelector('.chain');if(chain){const nd=[...chain.querySelectorAll('.node')],tx=el=>el?el.textContent.trim():'';
   const court=nd[2]?tx(nd[2].querySelector('.nm')):'',opp=nd[3]?[...nd[3].querySelectorAll('.nm')].map(n=>{const l=n.nextElementSibling&&n.nextElementSibling.classList.contains('lb')?tx(n.nextElementSibling):'';return E(tx(n))+(l?' <small>(وكيله '+E(l)+')</small>':'')}).join('، '):'',mz=nd[4]?tx(nd[4].querySelector('.nm')):'';
   const m=doc.createElement('div');m.className='cw-meta';m.innerHTML=[court&&`<span><i>المحكمة</i>${E(court)}</span>`,opp&&`<span><i>الخصم</i>${opp}</span>`,mz&&mz!=='—'&&`<span><i>ميزان</i><b class="mono">${E(mz)}</b></span>`].filter(Boolean).join('');chain.replaceWith(m)}
 }
 const pop=doc.createElement('div');if(wa)pop.appendChild(wa);
 const cardT=doc.createElement('template');cardT.innerHTML=card;const pp=cardT.content.querySelector('.cw-pop');if(pp)pp.appendChild(pop);
 const w=doc.createElement('div');w.className='cw';
 const side=doc.createElement('aside');side.className='cw-side';if(back){const bk=back.cloneNode(true);side.appendChild(bk)}side.appendChild(cardT.content);
 const rest=doc.createElement('template');rest.innerHTML=list+papers+stepsBox+menu;side.appendChild(rest.content);
 const main=doc.createElement('div');main.className='cw-main';main.appendChild(body);
 w.append(side,main);
 const out=doc.createElement('div');out.appendChild(w);return out.innerHTML};

const css=doc.createElement('style');css.textContent=`
.cw{display:grid;grid-template-columns:290px minmax(0,1fr);gap:16px;align-items:start}
@media(max-width:1100px){.cw{grid-template-columns:1fr}.cw-side{position:static!important}}
.cw-side{position:sticky;top:96px;display:flex;flex-direction:column;gap:10px;max-height:calc(100vh - 110px);overflow:auto;padding-bottom:6px}
.cw-side>.link{align-self:flex-start;font-size:13px}
.cw-client{background:linear-gradient(150deg,#0B1B2B,#17344F);color:#F2E6C4;border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:10px;box-shadow:0 8px 22px rgb(11 27 43 / .22)}
.cw-cid{display:flex;gap:10px;align-items:center}.cw-cid h1{margin:0!important;font-size:18px!important;line-height:1.35!important;color:#F3D58A!important;font-weight:800}.cw-cid small{font-size:12px;color:#C9D4DB}
.cw-av{flex:0 0 46px;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:20px;color:#0B1B2B;background:linear-gradient(180deg,#F3D58A,#C9A24A)}
.cw-stats{display:grid;grid-template-columns:1fr 1fr;gap:6px}.cw-stats button{all:unset;cursor:pointer;text-align:center;background:rgb(255 255 255 / .08);border-radius:10px;padding:7px 4px}.cw-stats b{display:block;font-size:18px;color:#fff}.cw-stats span{font-size:11px;color:#C9D4DB}.cw-stats .hot b{color:#FFB4A8}
.cw-cact{display:flex;gap:6px;align-items:flex-start;position:relative}.cw-wa{background:#1F9D55!important;color:#fff!important;border:0!important}
.cw-more{position:relative}.cw-more>summary{list-style:none;background:transparent!important;color:#F3D58A!important;border:1px solid #C9A24A!important;cursor:pointer}.cw-more>summary::-webkit-details-marker{display:none}
.cw-pop{position:absolute;top:34px;inset-inline-start:0;z-index:30;background:#fff;color:#1F2A36;border:1px solid #E5DCC8;border-radius:12px;padding:10px;box-shadow:0 14px 34px rgb(0 0 0 / .22);width:270px}
.cw-pop .wa-bar{display:flex;flex-direction:column;align-items:stretch;gap:6px}.cw-pop .wa-bar>*{width:100%;justify-content:center}
.cw-portal{font-size:11.5px;color:#C9D4DB;display:flex;align-items:center;gap:6px}.cw-portal i{width:8px;height:8px;border-radius:50%;background:#9AA2AC}.cw-portal.on i{background:#3DDC84}
.cw-box{background:var(--surface,#fff);border:1px solid var(--line,#E5DCC8);border-radius:14px;padding:10px 12px}
.cw-box h3{margin:0 0 8px;font-size:14px;display:flex;justify-content:space-between;align-items:center}.cw-box h3 small{margin-inline-start:6px;margin-inline-end:auto;font-weight:400;color:var(--muted,#7A8592);font-size:12px}
.cw-k{all:unset;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;gap:1px;width:100%;padding:8px 10px;border:1px solid var(--line,#E5DCC8);border-radius:10px;margin-bottom:6px;font-size:13px}
.cw-k b{font-size:14px}.cw-k span{color:var(--ink,#1F2A36)}.cw-k small{font-size:11.5px;color:var(--muted,#7A8592)}
.cw-k:hover{border-color:#C9A24A}.cw-k.on{border-color:#C9A24A;background:#FBF3DD;box-shadow:0 0 0 2px rgb(201 162 74 / .22)}.cw-k.done{opacity:.7}
.cw-new{width:100%;justify-content:center}
.cw-print{width:100%;justify-content:center;font-weight:700}.cw-pst{margin-top:7px;font-size:12px;color:#9A6B00;line-height:1.6}.cw-pst.ok{color:#2F7D4A}.cw-pst small{color:var(--muted,#7A8592)}
.cw-prog{height:6px;border-radius:99px;background:#EFE6D2;overflow:hidden;margin-bottom:8px}.cw-prog span{display:block;height:100%;background:linear-gradient(90deg,#2F7D4A,#C9A24A)}
.cw-steps ol{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}
.cw-steps li>button,.cw-steps li>span{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;gap:8px;width:100%;padding:5px 7px;border-radius:8px;font-size:13px}
.cw-steps li i{flex:0 0 20px;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:11px;font-weight:700}
.cw-steps li.done{color:#2F7D4A}.cw-steps li.done i{background:#2F7D4A;color:#fff}
.cw-steps li.cur>*{background:#F6E7BF;color:#0B1B2B;font-weight:700}.cw-steps li.cur i{background:#C9A24A;color:#0B1B2B}
.cw-steps li.todo{color:#9AA2AC}.cw-steps li.todo i{background:#EFE6D2;color:#7A6A48}.cw-steps li.todo>span{cursor:default}
.cw-steps li>button:hover{background:#F8F3E6}
.cw-meta{display:flex;flex-wrap:wrap;gap:6px 18px;margin:2px 0 10px;font-size:13.5px}.cw-meta i{font-style:normal;color:var(--muted,#6B7280);margin-inline-end:6px;font-size:12px}.cw-meta small{color:var(--muted,#6B7280)}
.cw-portal{display:flex;align-items:center;gap:8px}.cw-portal .sw{margin-inline-start:auto}
.cw-st{all:unset;cursor:pointer;margin-inline-start:auto;font-size:12px;padding:2px 9px;border-radius:999px;background:#F3ECDC;color:#5B4310}.cw-st:hover,.cw-st.on{background:#0B1B2B;color:#F3D58A}
.cw-menu{display:flex;flex-direction:column;gap:2px}.cw-menu button{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:9px;font-size:13.5px}
.cw-menu button i{font-style:normal;width:22px;text-align:center}.cw-menu button span{margin-inline-start:auto;font-size:11px;background:#EFE6D2;border-radius:999px;padding:1px 7px}.cw-menu button span.hot{background:#B23A3A;color:#fff}
.cw-menu button:hover{background:#F8F3E6}.cw-menu button.on{background:#0B1B2B;color:#F3D58A}
.cw-main{min-width:0}
.cw-home{all:unset;cursor:pointer}.cw-home:hover{text-decoration:underline;text-underline-offset:4px}
.cw-papers{all:unset;box-sizing:border-box;cursor:pointer;display:flex;gap:10px;align-items:center;width:100%;padding:9px 12px;border-radius:12px;border:1px dashed #C9A24A;background:#FFFAEE}.cw-papers:hover{background:#FBF1D6}
.cw-papers i{font-style:normal;font-size:18px}.cw-papers b{display:block;font-size:13px}.cw-papers small{font-size:11.5px;color:#9A6B00}.cw-papers.ok{border-style:solid;border-color:#BFDCC7;background:#F3FAF5}.cw-papers.ok small{color:#2F7D4A}
.cw-steps>summary{list-style:none;cursor:pointer}.cw-steps>summary::-webkit-details-marker{display:none}.cw-steps h3 em{font-style:normal;color:var(--muted,#7A8592);transition:transform .2s}.cw-steps[open] h3 em{transform:rotate(180deg)}
.cw-curst{font-size:12.5px;font-weight:700;color:#0B1B2B;margin-top:-2px}.cw-steps[open] .cw-curst{display:none}.cw-steps[open] ol{margin-top:6px}
.cw-secbar{margin:0 0 8px}
.cw-acts{display:flex;gap:6px;margin:0 0 10px;flex-wrap:wrap}.cw-now .cw-acts{margin:0;margin-inline-start:auto}.cw-now .cw-acts .btn{padding:4px 10px!important;font-size:12px!important}
.cw-dd{position:relative}.cw-dd>summary{list-style:none;cursor:pointer;gap:6px}.cw-dd>summary::-webkit-details-marker{display:none}.cw-dd>summary em{font-style:normal;font-size:11px;opacity:.7}
.cw-ddm{position:absolute;top:calc(100% + 6px);inset-inline-start:0;z-index:40;min-width:230px;background:#fff;border:1px solid #E5DCC8;border-radius:12px;box-shadow:0 14px 34px rgb(0 0 0 / .18);padding:6px;display:flex;flex-direction:column;gap:2px}
.cw-ddi{all:unset!important;box-sizing:border-box!important;cursor:pointer!important;display:flex!important;align-items:center;gap:8px;padding:8px 10px!important;border-radius:8px!important;font-size:13.5px!important;color:#1F2A36!important}.cw-ddi:hover{background:#F8F3E6!important}.cw-ddi svg{width:15px;height:15px}.cw-ddi .lc-ic{display:inline-flex}
.cw-main .tabs{display:flex!important;flex-wrap:wrap!important;gap:4px!important;padding:3px!important;border-radius:12px;background:#F3EEE2;margin:0 0 10px!important;scrollbar-width:thin}
.cw-main .tabs>button{flex:0 0 auto!important;padding:6px 12px!important;font-size:13px!important;border-radius:9px!important;min-height:0!important;border:0!important;background:transparent!important;box-shadow:none!important;white-space:nowrap}
.cw-main .tabs>button.on{background:#0B1B2B!important;color:#F3D58A!important}
.hub-tl.cw-short .hub-filters,.hub-tl.cw-short .note,.hub-tl.cw-short>header .m,.hub-tl.cw-short .hub-list>li:nth-child(n+7),.hub-tl.cw-short .bd>.toolbar{display:none!important}
.cw-tlmore{display:flex;justify-content:center;margin-top:8px}
.cw-hh{display:flex;align-items:baseline;gap:12px;margin:2px 0 12px}.cw-hh h2{margin:0;font-size:20px}
.cw-up{background:var(--surface,#fff);border:1px solid var(--line,#E5DCC8);border-radius:14px;padding:10px 14px;margin-bottom:12px}.cw-up h3{margin:0 0 6px;font-size:14px}
.cw-up ul{list-style:none;margin:0;padding:0}.cw-up li button{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;gap:10px;width:100%;padding:7px 6px;border-radius:9px;font-size:13.5px}.cw-up li button:hover{background:#F8F3E6}
.cw-up li i{font-style:normal}.cw-up li span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cw-up li small{color:var(--muted,#7A8592)}.cw-up li time{font-weight:700;color:#0B1B2B;font-size:13px}
.cw-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}
.cw-tile{all:unset;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;gap:6px;padding:12px 14px;border-radius:14px;background:var(--surface,#fff);border:1px solid var(--line,#E5DCC8);min-height:104px;transition:border-color .15s,box-shadow .15s}
.cw-tile:hover{border-color:#C9A24A;box-shadow:0 6px 18px rgb(11 27 43 / .08)}.cw-tile.hot{border-color:#E3A3A3;background:#FFF9F8}
.cw-th{display:flex;align-items:center;gap:8px}.cw-th i{font-style:normal;width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:#F3ECDC}.cw-th b{font-size:15px}.cw-th em{margin-inline-start:auto;font-style:normal;font-size:12px;color:#9A6B00;opacity:0;transition:opacity .15s}.cw-tile:hover .cw-th em{opacity:1}
.cw-badge{background:#B23A3A;color:#fff;border-radius:999px;padding:1px 8px;font-size:11px}.cw-cnt{background:#EFE6D2;border-radius:999px;padding:1px 8px;font-size:11px}
.cw-tile p{margin:0;font-size:13.5px;line-height:1.6}.cw-tile .cw-q{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:#334155}.cw-tile small{font-size:11.5px;color:var(--muted,#7A8592)}
.cw-bar{height:6px;border-radius:99px;background:#EFE6D2;overflow:hidden}.cw-bar span{display:block;height:100%;background:linear-gradient(90deg,#2F7D4A,#C9A24A)}
html.night .cw-tile,html.night .cw-up,html.night .cw-ddm{background:#132433;border-color:#2B4256;color:#E9E2D0}html.night .cw-ddi{color:#E9E2D0!important}html.night .cw-main .tabs{background:#132433}html.night .cw-th i{background:#1F3346}html.night .cw-curst,html.night .cw-up li time{color:#F3D58A}html.night .cw-papers{background:#1A2A38}
.cw-main .cl-case>.head{margin-bottom:4px}.cw-main .cl-case>.head h1{font-size:22px!important}
.cw-main .chain{display:flex!important;flex-wrap:wrap;gap:6px;margin:4px 0 10px!important;padding:0!important;border:0!important;background:none!important}
.cw-main .chain .link-line{display:none!important}
.cw-main .chain .node{all:unset;box-sizing:border-box;display:flex;flex-direction:column;padding:5px 10px;border:1px solid var(--line,#E5DCC8);border-radius:10px;background:var(--surface,#fff);font-size:12px;max-width:240px;cursor:default}
.cw-main .chain button.node{cursor:pointer}.cw-main .chain .node *{font-size:12px!important;margin:0!important;line-height:1.5!important}
.cw-now{display:flex;justify-content:space-between;align-items:center;gap:10px;background:#FBF6EA;border:1px solid #EADFC4;border-radius:10px;padding:5px 6px 5px 12px;margin:0 0 8px;font-size:13px}.cw-now .btn{padding:4px 10px!important;font-size:12px!important}
.cw-main .hub-strip{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(118px,1fr))!important;gap:6px!important;margin:0 0 8px!important}
.cw-main .hub-f{min-width:0;flex-direction:row!important;flex-wrap:wrap;align-items:baseline;gap:2px 6px!important;padding:5px 9px!important;border-radius:9px!important;min-height:0!important}
.cw-main .hub-f>span{font-size:11px!important;color:var(--muted,#7A8592)}.cw-main .hub-f>b{font-size:13px!important;line-height:1.4!important}
.cw-main .hub-f>small{flex-basis:100%;font-size:10.5px!important;line-height:1.35!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--muted,#8A93A0)}
.cw-qc{margin:0 0 10px;border:1px solid #E9B7B7;background:#FFF7F7;border-radius:12px}
.cw-qc>summary{cursor:pointer;padding:9px 14px;font-weight:700;color:#B23A3A;list-style:none}.cw-qc>summary::-webkit-details-marker{display:none}.cw-qc>summary small{font-weight:400;color:#9A6060;margin-inline-start:6px}
.cw-qc[open]>summary small{display:none}.cw-qc .qc-box{margin:0 10px 10px!important}
html.night .cw-box,html.night .cw-k,html.night .cw-main .chain .node{background:#132433;border-color:#2B4256;color:#E9E2D0}html.night .cw-k.on,html.night .cw-steps li.cur>*{background:#2A2618;color:#F3D58A}html.night .cw-now{background:#1A2A38;border-color:#2B4256}
@media print{.cw{display:block}.cw-side{display:none}}`;
doc.head.appendChild(css);
})();
