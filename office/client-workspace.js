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

V.client=function(){
 const html=vclient.apply(this,arguments);
 const c=typeof C==='function'?C(S.clientId):null;if(!c)return html;
 const ks=(typeof cases!=='undefined'?cases:[]).filter(k=>k.client===c.id);
 const t=doc.createElement('template');t.innerHTML=html;const R=t.content;
 const head=R.querySelector('.bag-head'),wa=R.querySelector('#waBar'),hubCases=R.querySelector('.hub-cases'),bagTabs=[...R.children].find(x=>x.classList&&x.classList.contains('tabs')),body=R.querySelector('#bagBody');
 if(!head||!body)return html;
 const back=R.querySelector('[data-act="nav"][data-v="clients"]');
 const u=unread(c),due=Math.max(0,(+c.fee||0)-(+c.paid||0)),tab=S.bagTab||'msgs';
 /* 1) بطاقة الموكل */
 const card=`<section class="cw-client"><div class="cw-cid"><div class="cw-av">${E(String(c.name||'').trim()[0]||'م')}</div><div><h1>${E(c.name)}</h1><small>${E([c.type,c.city,c.phone].filter(Boolean).join(' · '))}</small></div></div>
  <div class="cw-stats"><button data-act="bagTab" data-v="msgs" class="${u?'hot':''}"><b>${u}</b><span>رسائل جديدة</span></button><button data-act="bagTab" data-v="acct"><b>${due.toLocaleString('en-US')}</b><span>متبقٍ ₪</span></button></div>
  <div class="cw-cact">${c.whatsapp||c.phone?`<a class="btn sm cw-wa" target="_blank" rel="noopener" href="https://wa.me/${String(c.whatsapp||c.phone).replace(/\D/g,'').replace(/^0/,'970')}">واتساب</a>`:''}<details class="cw-more"><summary class="btn sm">⋯ المزيد</summary><div class="cw-pop"></div></details></div>
  <div class="cw-portal ${c.portal?'on':''}"><i></i>${c.portal?'البوابة مفعّلة'+(c.last?' · آخر دخول '+E(dm(c.last)):''):'البوابة غير مفعّلة'}</div></section>`;
 /* 2) قضايا الموكل */
 const list=`<section class="cw-box"><h3>القضايا <small>${ks.length}</small></h3>${ks.map(k=>{const h=nextH(k);const on=tab==='case'&&S.caseId===k.id;return `<button type="button" class="cw-k ${on?'on':''} ${k.status==='منتهية'?'done':''}" data-act="openCase" data-v="${E(k.id)}"><b class="mono">${E(k.no||'جديدة')}</b><span>${E(String(k.subject||'').slice(0,60))}</span><small>${E(ctName(k))}${h?' · جلسة '+E(dm(h.date)):''}${k.status==='منتهية'?' · منتهية':''}</small></button>`}).join('')||'<div class="m">لا قضايا بعد.</div>'}
  ${hubCases&&hubCases.querySelector('[data-act="caseFor"]')?`<button type="button" class="btn sm cw-new" data-act="caseFor" data-v="${E(c.id)}">+ قضية جديدة</button>`:''}</section>`;
 /* 3) سير القضية (من لوحة الخطوات نفسها، بشكل مختصر) */
 const steps=body.querySelector('.cs-panel');let stepsBox='';
 if(steps&&tab==='case'){const lis=[...steps.querySelectorAll('.cs-list > li')],done=lis.filter(l=>l.classList.contains('cs-done')).length,cur=lis.findIndex(l=>l.classList.contains('cs-cur'));
  stepsBox=`<section class="cw-box cw-steps"><h3>سير القضية <small>${cur>=0?(cur+1)+' من '+lis.length:'اكتملت'}</small></h3><div class="cw-prog"><span style="width:${Math.round(done/Math.max(1,lis.length)*100)}%"></span></div><ol>${lis.map((l,i)=>{const st=l.classList.contains('cs-done')?'done':l.classList.contains('cs-cur')?'cur':'todo';const b=l.querySelector('[data-act="csGo"]');const ti=(l.querySelector('.cs-b b')||{}).textContent||'';const de=(l.querySelector('.cs-b small')||{}).textContent||'';
   return `<li class="${st}">${b?`<button type="button" data-act="csGo" data-v="${E(b.dataset.v)}" title="${E(de)}">`:'<span title="'+E(de)+'">'}<i>${st==='done'?'✓':i+1}</i>${E(ti)}${b?'</button>':'</span>'}</li>`}).join('')}</ol></section>`}
 /* 4) أقسام ملف الموكل (التبويبات السابقة) */
 const secs=bagTabs?[...bagTabs.querySelectorAll('button')].filter(b=>b.dataset.v!=='case'):[];
 const ICO={msgs:'💬',media:'📎',cases:'🧭',settle:'🤝',acct:'₪',mizan:'⟳'};
 const menu=secs.length?`<section class="cw-box"><h3>ملف الموكل</h3><nav class="cw-menu">${secs.map(b=>{const n=b.querySelector('.tcount');return `<button type="button" data-act="bagTab" data-v="${E(b.dataset.v)}" class="${b.classList.contains('on')?'on':''}"><i>${ICO[b.dataset.v]||'•'}</i>${E(b.childNodes[0]?b.childNodes[0].textContent.trim():b.textContent)}${n&&n.textContent.trim()?`<span class="${n.classList.contains('hot')?'hot':''}">${E(n.textContent.trim())}</span>`:''}</button>`}).join('')}</nav></section>`:'';
 /* 5) العمود الرئيسي */
 if(tab==='case'){
  if(steps){const cur=steps.querySelector('.cs-list > li.cs-cur');if(cur){const ti=(cur.querySelector('.cs-b b')||{}).textContent||'',go=cur.querySelector('[data-act="csGo"]');
    const now=doc.createElement('div');now.className='cw-now';now.innerHTML=`<span><b>الآن:</b> ${E(ti)}</span>${go?`<button type="button" class="btn sm pri" data-act="csGo" data-v="${E(go.dataset.v)}">الخطوة التالية ←</button>`:''}`;steps.replaceWith(now)}else steps.remove()}
  const qc=body.querySelector('.qc-box');if(qc){const n=(qc.textContent.match(/\((\d+)\)/)||[])[1]||'';const d=doc.createElement('details');d.className='cw-qc';d.innerHTML=`<summary>⚠ ينقص هذا الملف${n?' · '+n+(n==='1'?' أمر':' أمور'):''} <small>اضغط للعرض</small></summary>`;qc.replaceWith(d);d.appendChild(qc)}
 }
 const pop=doc.createElement('div');if(wa)pop.appendChild(wa);
 const cardT=doc.createElement('template');cardT.innerHTML=card;const pp=cardT.content.querySelector('.cw-pop');if(pp)pp.appendChild(pop);
 const w=doc.createElement('div');w.className='cw';
 const side=doc.createElement('aside');side.className='cw-side';if(back){const bk=back.cloneNode(true);side.appendChild(bk)}side.appendChild(cardT.content);
 const rest=doc.createElement('template');rest.innerHTML=list+stepsBox+menu;side.appendChild(rest.content);
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
.cw-box h3{margin:0 0 8px;font-size:14px;display:flex;justify-content:space-between;align-items:center}.cw-box h3 small{font-weight:400;color:var(--muted,#7A8592);font-size:12px}
.cw-k{all:unset;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;gap:1px;width:100%;padding:8px 10px;border:1px solid var(--line,#E5DCC8);border-radius:10px;margin-bottom:6px;font-size:13px}
.cw-k b{font-size:14px}.cw-k span{color:var(--ink,#1F2A36)}.cw-k small{font-size:11.5px;color:var(--muted,#7A8592)}
.cw-k:hover{border-color:#C9A24A}.cw-k.on{border-color:#C9A24A;background:#FBF3DD;box-shadow:0 0 0 2px rgb(201 162 74 / .22)}.cw-k.done{opacity:.7}
.cw-new{width:100%;justify-content:center}
.cw-prog{height:6px;border-radius:99px;background:#EFE6D2;overflow:hidden;margin-bottom:8px}.cw-prog span{display:block;height:100%;background:linear-gradient(90deg,#2F7D4A,#C9A24A)}
.cw-steps ol{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}
.cw-steps li>button,.cw-steps li>span{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;gap:8px;width:100%;padding:5px 7px;border-radius:8px;font-size:13px}
.cw-steps li i{flex:0 0 20px;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:11px;font-weight:700}
.cw-steps li.done{color:#2F7D4A}.cw-steps li.done i{background:#2F7D4A;color:#fff}
.cw-steps li.cur>*{background:#F6E7BF;color:#0B1B2B;font-weight:700}.cw-steps li.cur i{background:#C9A24A;color:#0B1B2B}
.cw-steps li.todo{color:#9AA2AC}.cw-steps li.todo i{background:#EFE6D2;color:#7A6A48}.cw-steps li.todo>span{cursor:default}
.cw-steps li>button:hover{background:#F8F3E6}
.cw-menu{display:flex;flex-direction:column;gap:2px}.cw-menu button{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:9px;font-size:13.5px}
.cw-menu button i{font-style:normal;width:22px;text-align:center}.cw-menu button span{margin-inline-start:auto;font-size:11px;background:#EFE6D2;border-radius:999px;padding:1px 7px}.cw-menu button span.hot{background:#B23A3A;color:#fff}
.cw-menu button:hover{background:#F8F3E6}.cw-menu button.on{background:#0B1B2B;color:#F3D58A}
.cw-main{min-width:0}
.cw-main .cl-case>.head{margin-bottom:4px}.cw-main .cl-case>.head h1{font-size:22px!important}
.cw-main .chain{display:flex!important;flex-wrap:wrap;gap:6px;margin:4px 0 10px!important;padding:0!important;border:0!important;background:none!important}
.cw-main .chain .link-line{display:none!important}
.cw-main .chain .node{all:unset;box-sizing:border-box;display:flex;flex-direction:column;padding:5px 10px;border:1px solid var(--line,#E5DCC8);border-radius:10px;background:var(--surface,#fff);font-size:12px;max-width:240px;cursor:default}
.cw-main .chain button.node{cursor:pointer}.cw-main .chain .node *{font-size:12px!important;margin:0!important;line-height:1.5!important}
.cw-now{display:flex;justify-content:space-between;align-items:center;gap:10px;background:#FBF6EA;border:1px solid #EADFC4;border-radius:12px;padding:9px 14px;margin:0 0 10px;font-size:14.5px}
.cw-main .hub-strip{gap:8px!important;margin:0 0 10px!important}.cw-main .hub-f{padding:7px 10px!important}.cw-main .hub-f b{font-size:15px}
.cw-qc{margin:0 0 10px;border:1px solid #E9B7B7;background:#FFF7F7;border-radius:12px}
.cw-qc>summary{cursor:pointer;padding:9px 14px;font-weight:700;color:#B23A3A;list-style:none}.cw-qc>summary::-webkit-details-marker{display:none}.cw-qc>summary small{font-weight:400;color:#9A6060;margin-inline-start:6px}
.cw-qc[open]>summary small{display:none}.cw-qc .qc-box{margin:0 10px 10px!important}
html.night .cw-box,html.night .cw-k,html.night .cw-main .chain .node{background:#132433;border-color:#2B4256;color:#E9E2D0}html.night .cw-k.on,html.night .cw-steps li.cur>*{background:#2A2618;color:#F3D58A}html.night .cw-now{background:#1A2A38;border-color:#2B4256}
@media print{.cw{display:block}.cw-side{display:none}}`;
doc.head.appendChild(css);
})();
