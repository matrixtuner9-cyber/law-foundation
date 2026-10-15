/* ── دليل محامي النقابة: بحث في أسماء المحامين المسجلين وأرقام التواصل ── */
(function(){
const B={q:'',city:'',status:null,phone:false,offset:0,data:null,busy:false,poll:null};
const i=NAV.findIndex(n=>n[0]==='courts');NAV.splice(i+1,0,['bar','دليل المحامين']);
const navCount0=window.navCount;window.navCount=v=>v==='bar'?(B.data&&B.data.meta?B.data.meta.total.toLocaleString('en-US'):''):navCount0(v);
const can=()=>MQ.user&&MQ.user.role==='admin';
const fmtPhone=p=>p.replace(/^\+970/,'0').replace(/^(05\d{2})(\d{3})(\d{3})$/,'$1-$2-$3');
const ago=iso=>{if(!iso)return '';const d=new Date(iso);return d.toLocaleDateString('ar-PS-u-nu-latn',{day:'numeric',month:'long',year:'numeric'})};

function load(keep){if(B.busy)return;B.busy=true;if(!keep)B.offset=0;
 const q=new URLSearchParams({q:B.q,city:B.city,status:B.status||'',phone:B.phone?'1':'',offset:B.offset,limit:100});
 fetch('/api/bar?'+q).then(r=>{if(r.status===401)location.replace('/login.html');return r.json()}).then(d=>{
  if(B.status===null){const pr=(d.facets.statuses||[]).find(s=>/مزاول/.test(s.s)&&!/غير/.test(s.s));B.status=pr?pr.s:'';B.busy=false;return load()}
  B.data=d;if(d.running)startPoll()}).catch(e=>toast(e.message)).finally(()=>{B.busy=false;if(S.view==='bar')draw();else drawNav()})}
function startPoll(){if(B.poll)return;B.poll=setInterval(()=>fetch('/api/bar/status').then(r=>r.json()).then(s=>{if(B.data){B.data.running=s.running;B.data.progress=s.progress}
 if(!s.running){clearInterval(B.poll);B.poll=null;toast(s.progress&&s.progress.ok?'اكتمل تحديث الدليل: '+(s.progress.imported||s.progress.total)+' محامياً':'توقف التحديث'+(s.progress&&s.progress.error?': '+s.progress.error:''));load()}
 else if(S.view==='bar')drawProg()}),3000)}
function drawProg(){const el=document.getElementById('barProg');if(!el||!B.data)return;const p=B.data.progress||{};const pct=p.pages?Math.round(p.page/p.pages*100):0;
 el.innerHTML=B.data.running?`<div class="bar-prog"><span style="width:${pct}%"></span></div><small>جارٍ القراءة من موقع النقابة: صفحة ${p.page||0} من ${p.pages||'…'} · ${(p.total||0).toLocaleString('en-US')} محامياً حتى الآن</small>`:''}
function draw(){const p=document.getElementById('page');if(S.view!=='bar'||!p)return;const res=p.querySelector('#barRes'),sel=p.querySelector('#barStatus');if(res&&sel&&sel.options.length>1){res.outerHTML=results();drawProg();drawNav()}else render()}

function results(){const d=B.data;if(!d)return '<div id="barRes" class="empty">جارٍ التحميل…</div>';
 if(!d.meta)return `<div id="barRes" class="panel bar-empty"><div class="bd"><b>الدليل فارغ بعد.</b><p>${can()?'اضغط «تحديث من موقع النقابة» لقراءة القائمة العامة للمحامين (حوالي 20 دقيقة للقائمة كاملة).':'اطلب من مدير النظام تحديث الدليل من موقع النقابة.'}</p></div></div>`;
 const from=d.total?B.offset+1:0,to=Math.min(B.offset+100,d.total);
 return `<div id="barRes"><section class="panel tablewrap"><table class="bar-t"><thead><tr><th>المحامي</th><th>رقم العضوية</th><th>الحالة</th><th>المدينة</th><th>المكتب</th><th>التواصل</th></tr></thead><tbody>
 ${d.rows.map(r=>`<tr><td style="font-weight:600">${esc(r.name)}</td><td class="mono">${esc(r.mno)}</td><td><span class="pill ${/غير|متوف|موقوف|مشطوب/.test(r.status)?'':/متدرب/.test(r.status)?'acc':'ok'}">${esc(r.status)}</span></td><td>${esc(r.city||'—')}</td>
  <td>${r.office?`<div>${esc(r.office)}</div>`:''}${r.address?`<div class="m">${esc(r.address)}</div>`:''}${!r.office&&!r.address?'<span class="m">—</span>':''}</td>
  <td class="bar-c">${r.phones.map(ph=>`<span class="ph"><a class="mono" href="tel:${esc(ph)}">${esc(fmtPhone(ph))}</a><button class="cp" data-act="barCopy" data-v="${esc(ph)}" title="نسخ الرقم" aria-label="نسخ الرقم">نسخ</button></span>`).join('')}${r.email?`<a class="mail" href="mailto:${esc(r.email)}" dir="ltr">${esc(r.email)}</a>`:''}${!r.phones.length&&!r.email?'<span class="m">غير منشور</span>':''}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">لا نتائج مطابقة.</td></tr>'}</tbody></table></section>
 <div class="toolbar bar-pg"><span class="m">${from.toLocaleString('en-US')}–${to.toLocaleString('en-US')} من ${d.total.toLocaleString('en-US')}</span><button class="btn sm" data-act="barPg" data-v="-1" ${B.offset?'':'disabled'}>السابق</button><button class="btn sm" data-act="barPg" data-v="1" ${to<d.total?'':'disabled'}>التالي</button></div></div>`}

V.bar=()=>{if(!B.data&&!B.busy)load();const d=B.data||{},f=d.facets||{cities:[],statuses:[]},m=d.meta;
 return `<div class="head"><div><h1>دليل المحامين</h1><p class="sub">المحامون المسجلون في نقابة المحامين الفلسطينيين وأرقام التواصل المنشورة، للبحث السريع عند الحاجة لمراسلة زميل أو وكيل خصم</p></div>
  <div class="toolbar">${can()?`<button class="btn" data-act="barRefresh" ${d.running?'disabled':''}>${d.running?'<span class="spin"></span> جارٍ التحديث…':'تحديث من موقع النقابة'}</button>`:''}</div></div>
 <div id="barProg"></div>
 <div class="toolbar bar-f"><input class="field" id="barQ" type="search" placeholder="ابحث بالاسم أو رقم العضوية أو رقم الهاتف…" value="${esc(B.q)}" autocomplete="off" style="flex:1;min-width:240px">
  <select class="field" id="barCity"><option value="">كل المدن</option>${f.cities.map(c=>`<option value="${esc(c.c)}" ${B.city===c.c?'selected':''}>${esc(c.c)} (${c.n})</option>`).join('')}</select>
  <select class="field" id="barStatus"><option value="" ${B.status===''?'selected':''}>كل الحالات</option>${f.statuses.map(s=>`<option value="${esc(s.s)}" ${B.status===s.s?'selected':''}>${esc(s.s)} (${s.n})</option>`).join('')}</select>
  <label class="ck"><input type="checkbox" id="barPh" ${B.phone?'checked':''}> لديه رقم هاتف</label></div>
 ${results()}
 ${m?`<p class="note">المصدر: <a href="${esc(m.source)}" target="_blank" rel="noopener">الصفحة العامة لنقابة المحامين الفلسطينيين</a> · آخر تحديث ${esc(ago(m.fetchedAt))} · ${m.total.toLocaleString('en-US')} محامياً، منهم ${(f.withPhone||0).toLocaleString('en-US')} بأرقام منشورة. تُحفظ الحقول المعروضة على الصفحة فقط، للاستخدام المهني الداخلي.</p>`:''}`};

A.barPg=v=>{B.offset=Math.max(0,B.offset+(+v)*100);load(true)};
A.barCopy=v=>{try{navigator.clipboard.writeText(v).then(()=>toast('نُسخ الرقم '+v))}catch(e){toast(v)}};
A.barRefresh=()=>{fetch('/api/bar/refresh',{method:'POST'}).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error);B.data.running=true;B.data.progress=j.progress;toast('بدأ التحديث من موقع النقابة، يستغرق حوالي 20 دقيقة');render();startPoll()}).catch(e=>toast(e.message))};
let t;document.addEventListener('input',e=>{if(e.target.id==='barQ'){clearTimeout(t);t=setTimeout(()=>{B.q=e.target.value.trim();load()},300)}});
document.addEventListener('change',e=>{if(e.target.id==='barCity'){B.city=e.target.value;load()}if(e.target.id==='barStatus'){B.status=e.target.value;load()}if(e.target.id==='barPh'){B.phone=e.target.checked;load()}});
})();
