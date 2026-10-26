/* ── نسخة المِسْبار في الواجهة: «المِسْبار الخاص» أو «المِسْبار المتصل» ──
   يقرأ النسخة من الخادم (/api/edition) ويضع شارتها في الشريط الجانبي وصفحة الدخول.
   في «المِسْبار الخاص» يُخفي كل ما يحتاج الإنترنت: بوابة الموكل ورسائلها ورموزها، دعوات واتساب، الربط مع ميزان،
   البحث في الأحكام والاستيراد برابط، تحديث دليل المحامين، والروابط الخارجية. الخادم يرفض هذه الطلبات أيضاً. */
(function(){
const HIDE_NAV=['portal','mizan'];
const HIDE_ACT=['portalFor','togglePortal','waInvite','rotateWeak','rotateCode','barRefresh','mzRun','mzEdit','mzForget'];
const css=`body.mq-private ${HIDE_ACT.map(a=>`[data-act="${a}"]`).join(',body.mq-private ')},
body.mq-private [data-act="nav"][data-v="portal"],body.mq-private [data-act="nav"][data-v="mizan"],
body.mq-private .rl-src,body.mq-private a[href^="http://"]:not([href^="http://localhost"]):not([href^="http://127."]),body.mq-private a[href^="https://"]{display:none!important}
.mq-ed{display:flex;align-items:center;gap:8px;margin:10px 12px 4px;padding:8px 10px;border-radius:10px;font-size:12px;line-height:1.5;border:1px solid rgba(212,175,55,.35);background:rgba(212,175,55,.08);color:#E6D5B8}
.mq-ed b{color:#D4AF37;font-size:13px;display:block}.mq-ed svg{width:18px;height:18px;flex:none;stroke:#D4AF37;fill:none;stroke-width:1.8}
.mq-ed-login{margin:10px auto 0;display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;font-size:12.5px;border:1px solid rgba(184,134,61,.45);color:#8B6F47;background:rgba(212,175,55,.10)}
.mq-ed-login svg{width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
const LOCK='<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const LINK='<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>';

function apply(ed){
 window.MQ_ED=ed;const priv=!!ed.offline;
 document.body.classList.toggle('mq-private',priv);document.body.dataset.edition=ed.id;
 /* صفحة الدخول */
 const sub=document.querySelector('.lg .card .sub');
 if(sub&&!document.querySelector('.mq-ed-login'))sub.insertAdjacentHTML('afterend',`<div style="text-align:center"><span class="mq-ed-login" title="${ed.tagline}">${priv?LOCK:LINK}${ed.name}</span></div>`);
 if(typeof NAV==='undefined')return;
 /* شاشة المكتب */
 if(priv){for(let i=NAV.length-1;i>=0;i--)if(HIDE_NAV.includes(NAV[i][0]))NAV.splice(i,1);
  if(typeof A!=='undefined'&&A.nav&&!A.nav._ed){const n0=A.nav;A.nav=v=>n0(HIDE_NAV.includes(v)?'dash':v);A.nav._ed=1}
  if(typeof S!=='undefined'&&HIDE_NAV.includes(S.view))S.view='dash'}
 badge();
 if(typeof render==='function'&&window.MQ&&MQ.ready)render();
}
function badge(){
 const ed=window.MQ_ED;if(!ed)return;const rs=document.getElementById('railSync');if(!rs||document.querySelector('.mq-ed'))return;
 const rf=rs.closest('.rail-foot')||rs;
 rf.insertAdjacentHTML('beforebegin',`<div class="mq-ed" title="${ed.tagline}">${ed.offline?LOCK:LINK}<div><b>${ed.name}</b>${ed.tagline}</div></div>`);
 if(ed.offline&&rf!==rs)rf.hidden=true; /* «متصل بميزان» لا معنى لها في النسخة الخاصة */
}
/* الشارة تُعاد بعد كل رسم للقائمة */
if(typeof window.drawNav==='function'){const d0=window.drawNav;window.drawNav=function(){d0.apply(this,arguments);badge()}}
fetch('/api/edition',{credentials:'same-origin'}).then(r=>r.ok?r.json():null).then(ed=>{if(ed&&ed.id)apply(ed)}).catch(()=>{});
})();
