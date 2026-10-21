/* ── مراسلات الموكل بشكل واتساب (داخل حقيبة الموكل فقط) ──
   الألوان والخلفية والفقاعات وشريط الكتابة كواتساب، مع الوضع الداكن. لا يغيّر منطق الإرسال أو التسجيل. */
(function(){
'use strict';
/* الميكروفون عند فراغ الخانة، وزر الإرسال عند الكتابة (كواتساب) */
document.addEventListener('input',ev=>{const t=ev.target;if(t.id==='bagT'&&t.form)t.form.classList.toggle('typing',!!t.value.trim())});
const css=document.createElement('style');css.textContent=`
:root{--wa-green:#00a884;--wa-badge:#25d366;--wa-me:#d9fdd3;--wa-them:#fff;--wa-ink:#111b21;--wa-meta:#667781;--wa-bg:#efeae2;--wa-panel:#fff;--wa-head:#f0f2f5;--wa-hover:#f5f6f6;--wa-on:#f0f2f5;--wa-line:#e9edef;--wa-seen:#53bdeb;--wa-doodle:rgba(0,0,0,.045)}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--wa-me:#005c4b;--wa-them:#202c33;--wa-ink:#e9edef;--wa-meta:#8696a0;--wa-bg:#0b141a;--wa-panel:#111b21;--wa-head:#202c33;--wa-hover:#202c33;--wa-on:#2a3942;--wa-line:#222d34;--wa-doodle:rgba(255,255,255,.035)}}
:root[data-theme="dark"]{--wa-me:#005c4b;--wa-them:#202c33;--wa-ink:#e9edef;--wa-meta:#8696a0;--wa-bg:#0b141a;--wa-panel:#111b21;--wa-head:#202c33;--wa-hover:#202c33;--wa-on:#2a3942;--wa-line:#222d34;--wa-doodle:rgba(255,255,255,.035)}

/* جلد واتساب للمحادثة (هنا وفي حقيبة الموكل) */
.wa-skin{background:var(--wa-bg);border-color:var(--wa-line)}
.wa-skin .th{background-color:var(--wa-bg);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg fill='none' stroke='%23000' stroke-opacity='.035' stroke-width='1.3' stroke-linecap='round'%3E%3Cpath d='M18 22l8-8 8 8-8 8z'/%3E%3Ccircle cx='86' cy='20' r='6'/%3E%3Cpath d='M56 54c6-6 14 2 8 8s-14-2-8-8zM12 78h16M20 70v16M92 70l12 12M104 70l-12 12M50 100a8 8 0 0 1 16 0M80 106l6-10 6 10z'/%3E%3C/g%3E%3C/svg%3E");background-size:240px 240px;padding:14px 6%;gap:2px}
:root[data-theme="dark"] .wa-skin .th{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg fill='none' stroke='%23fff' stroke-opacity='.04' stroke-width='1.3' stroke-linecap='round'%3E%3Cpath d='M18 22l8-8 8 8-8 8z'/%3E%3Ccircle cx='86' cy='20' r='6'/%3E%3Cpath d='M56 54c6-6 14 2 8 8s-14-2-8-8zM12 78h16M20 70v16M92 70l12 12M104 70l-12 12M50 100a8 8 0 0 1 16 0M80 106l6-10 6 10z'/%3E%3C/g%3E%3C/svg%3E")}
.wa-skin .th-day{margin:10px 0 6px}
.wa-skin .th-day span{background:var(--wa-them);border:0;color:var(--wa-meta);font-size:12.5px;padding:5px 12px;border-radius:8px;box-shadow:0 1px .5px rgb(11 20 26 / .13)}
.wa-skin .bc{position:relative;border-radius:8px;padding:6px 9px 6px;gap:3px;max-width:min(65%,560px);box-shadow:0 1px .5px rgb(11 20 26 / .13);color:var(--wa-ink);border:0;animation:none;margin-top:2px}
.wa-skin .bc.them{background:var(--wa-them)}
.wa-skin .bc.me{background:var(--wa-me);color:var(--wa-ink)}
.wa-skin .bc.them:not(.bc.them+.bc.them),.wa-skin .bc.me:not(.bc.me+.bc.me){margin-top:10px}
.wa-skin .bc.them:not(.bc.them+.bc.them){border-top-right-radius:0}
.wa-skin .bc.me:not(.bc.me+.bc.me){border-top-left-radius:0}
.wa-skin .bc.them:not(.bc.them+.bc.them)::before,.wa-skin .bc.me:not(.bc.me+.bc.me)::before{content:"";position:absolute;top:0;width:8px;height:13px}
.wa-skin .bc.them:not(.bc.them+.bc.them)::before{left:100%;background:var(--wa-them);clip-path:polygon(0 0,100% 0,0 100%)}
.wa-skin .bc.me:not(.bc.me+.bc.me)::before{right:100%;background:var(--wa-me);clip-path:polygon(0 0,100% 0,100% 100%)}
.wa-skin .bc.new{box-shadow:0 1px .5px rgb(11 20 26 / .13),0 0 0 2px color-mix(in srgb,var(--wa-badge) 55%,transparent)}
.wa-skin .bc-txt{font-size:14.2px;line-height:1.55}
.wa-skin .bc-meta{color:var(--wa-meta);opacity:1;font-size:11px;margin-top:-2px}
.wa-skin .bc.me .bc-meta{color:var(--wa-meta)}
.wa-skin .bc-tick{color:var(--wa-meta)}.wa-skin .bc-tick.seen{color:var(--wa-seen)}
.wa-skin .bc-tick svg{width:16px;height:10px}
.wa-skin .bc.t-notice{background:#fff5c4;color:#54460c}
:root[data-theme="dark"] .wa-skin .bc.t-notice{background:#3b3416;color:#f4e6a3}
.wa-skin .vp-btn{background:transparent;color:var(--wa-meta);width:34px;height:34px}
.wa-skin .vp-btn svg{width:24px;height:24px}
.wa-skin .bc.me .vp-btn{background:transparent;color:var(--wa-meta)}
.wa-skin .bc .vp-wave{color:var(--wa-meta)}
.wa-skin .bc.them .vp-wave{color:var(--wa-seen)}
.wa-skin .bc.me .vp-wave{color:#00a884}
.wa-skin .bc .fcard{background:color-mix(in srgb,var(--wa-ink) 6%,transparent);border-radius:6px;padding:8px 10px}
.wa-skin .bc.me .fact .btn,.wa-skin .bc .fact .btn{background:transparent;border:0;color:#027eb5;padding:4px 6px}
:root[data-theme="dark"] .wa-skin .bc .fact .btn{color:#53bdeb}
.wa-skin .bc-read{background:transparent!important;border:0!important;border-top:1px solid color-mix(in srgb,var(--wa-ink) 12%,transparent)!important;border-radius:0!important;color:#027eb5!important;box-shadow:none!important}
:root[data-theme="dark"] .wa-skin .bc-read{color:#53bdeb!important}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .wa-skin .bc-read{color:#53bdeb!important}}

.wa-skin .bc-case{background:color-mix(in srgb,var(--wa-ink) 7%,transparent)}
/* شريط الكتابة */
.wa-skin .composer{background:var(--wa-head);border-top:0;padding:8px 14px;gap:6px;align-items:center}
.wa-skin .composer textarea{background:var(--wa-panel);color:var(--wa-ink);border:0;border-radius:8px;padding:10px 14px;font-size:15px}
.wa-skin .composer .ib{color:var(--wa-meta);width:42px;height:42px}
.wa-skin .composer .ib.pri,.wa-skin .composer [data-act="recStart"]{background:var(--wa-green);color:#fff}
.wa-skin .composer [data-act="recStart"]:hover{filter:brightness(1.08);background:var(--wa-green);color:#fff}
.wa-skin .composer:not(.typing) .ib.pri{display:none}
.wa-skin .composer.typing [data-act="recStart"]{display:none}
.wa-skin .composer .ib.on{background:#fff5c4;color:#8a6d0b;box-shadow:none}
.wa-skin .rec{background:var(--wa-head);color:var(--wa-ink);border-top:0}
.wa-skin .rec .ib.pri{background:var(--wa-green);color:#fff}
.wa-skin .chat-note{background:var(--wa-head);color:var(--wa-meta);text-align:center;padding:0 16px 8px}

@media (max-width:560px){.wa-skin .th{padding:10px 3%}.wa-skin .bc{max-width:85%}}
`;document.head.appendChild(css);
})();
