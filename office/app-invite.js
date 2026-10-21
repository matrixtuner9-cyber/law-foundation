/* ── دعوة الموكل إلى تطبيق الآيفون/أندرويد: رمز QR لرابط الدعوة، يُمسح بكاميرا الهاتف فيُفتح التطبيق ويدخل الموكل مباشرة ──
   الرابط نفسه المرسل عبر واتساب (…/p/MQ-…)؛ إن لم يكن التطبيق مثبّتاً يفتح بوابة الويب. يعتمد qrcode.js (MIT, Kazuhiko Arase). */
(function(){
'use strict';
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function qrSvg(text,cell){if(typeof qrcode!=='function')return '';const q=qrcode(0,'M');q.addData(text);q.make();return q.createSvgTag({cellSize:cell||6,margin:2,scalable:true})}
function card(c,link){const o=(typeof OFFICE!=='undefined'?OFFICE:{});
 return `<div class="ai-skip inv-card"><div class="inv-qr">${qrSvg(link,7)}</div><div class="inv-t"><b>${e(c.name)}</b><span>${e(o.name||'')}</span>
 <ol><li>ثبّت تطبيق «ميثاق» من الرابط الذي يرسله لك المكتب.</li><li>افتح كاميرا الهاتف ووجّهها إلى الرمز، ثم اضغط الرابط الظاهر.</li><li>يُفتح التطبيق ويُسجَّل دخولك تلقائياً.</li></ol>
 <small dir="ltr">${e(link)}</small><small>رمز الدخول: <b dir="ltr">${e(c.code)}</b> — لا تشاركه مع أحد.</small></div></div>`}
A.appQr=id=>{const c=C(id);if(!c)return;if(!c.portal)return toast('فعّل بوابة الموكل لهذا الموكل أولاً');if(!window.MQ_loginLink)return;const link=MQ_loginLink(c);
 document.getElementById('modal').innerHTML=`<div class="modal-bg" data-act="close"><div class="modal" role="dialog" aria-label="رمز الدخول للتطبيق" style="max-width:640px"><div class="head"><h1 style="font-size:22px">رمز QR لتطبيق الموكل</h1><button class="btn sm" data-act="close">إغلاق</button></div>
 ${card(c,link)}<div class="toolbar" style="justify-content:flex-start;margin-top:12px"><button class="btn pri" data-act="appQrPrint" data-v="${e(id)}">طباعة البطاقة</button><button class="btn" data-act="copyLink" data-v="${e(id)}">نسخ الرابط</button></div>
 <p class="note">امسح الرمز أمام الموكل في المكتب، أو اطبع البطاقة وسلّمها له. الرمز يحمل رابط دعوته الخاص، فاحفظ البطاقة كأي مستند سري.</p></div></div>`};
A.appQrPrint=id=>{const c=C(id);if(!c||!window.MQ_loginLink)return;const html=`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>دعوة ${e(c.name)}</title><style>body{font-family:Cairo,Tahoma,sans-serif;margin:0;padding:24mm 18mm;color:#111}${CSS}.inv-card{border:1px solid #ccc}</style></head><body>${card(c,MQ_loginLink(c))}</body></html>`;
 const f=document.createElement('iframe');f.style.cssText='position:fixed;width:0;height:0;border:0;right:0;bottom:0';document.body.appendChild(f);f.contentDocument.open();f.contentDocument.write(html);f.contentDocument.close();
 setTimeout(()=>{try{f.contentWindow.focus();f.contentWindow.print()}catch(x){}setTimeout(()=>f.remove(),1500)},250)};
/* زر في حقيبة الموكل بجانب «إرسال رابط الدخول عبر واتساب» */
const r0=render;render=function(){r0();try{if(S.view!=='client')return;const b=document.getElementById('waBar');if(b&&!b.querySelector('[data-act="appQr"]'))b.insertAdjacentHTML('beforeend',`<button class="btn sm" data-act="appQr" data-v="${e(S.clientId)}" title="رمز يُمسح بكاميرا الهاتف فيفتح التطبيق ويُدخل الموكل">▦ رمز QR للتطبيق</button>`)}catch(x){}};
const CSS=`.inv-card{display:flex;gap:18px;align-items:center;flex-wrap:wrap;background:#fff;color:#111B27;border-radius:14px;padding:16px}.inv-qr{width:210px;flex:none}.inv-qr svg{width:100%;height:auto;display:block}.inv-t{flex:1;min-width:220px;display:flex;flex-direction:column;gap:6px}.inv-t b{font-size:18px}.inv-t span{color:#6B7280}.inv-t ol{margin:4px 0;padding-inline-start:18px;line-height:1.8}.inv-t small{color:#555;word-break:break-all}`;
const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
})();
