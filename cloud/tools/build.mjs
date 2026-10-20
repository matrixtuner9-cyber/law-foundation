// يجهّز مجلد public من ملفات واجهة ميثاق (المصدر: ../mithaq) ويولّد src/seed.js
import fs from 'node:fs'; import path from 'node:path';
const SRC = process.env.MQ_SRC || path.resolve('../mithaq'), OUT = path.resolve('public');
const UI = ['index.html','app.js','print.js','intake.js','rulings.js','maqamsearch.js','sources.js','guide.js','lawlib-data.js','lawlib.js','legislation.js','aidraft.js','calc-engine.js','calc.js','dash.js','briefcase.js','sync.js','mizan-ui.js','data.js','admin.js','phase2.js','phase2.css','bar.js','bar.css','responsive.js','responsive.css','style.css','dash.css','briefcase.css','mizan.css','admin.css','prestige.css','login.html','login.js','login.css','scales.js','edition.js','hdr-banner.jpg','hdr-side.jpg','hdr-side.webp','hdr-emblem.jpg','hdr-logo.jpg'];
fs.rmSync(path.join(OUT, 'app'), { recursive: true, force: true }); fs.mkdirSync(path.join(OUT, 'app'), { recursive: true });
for (const f of UI) fs.copyFileSync(path.join(SRC, f), path.join(OUT, 'app', f));
// الخطوط المضمّنة محلياً
fs.cpSync(path.join(SRC, 'fonts'), path.join(OUT, 'app', 'fonts'), { recursive: true });
// صفحة الدخول: إعداد أول مدير برابط لمرة واحدة بدل "من جهاز المكتب فقط"
const lj = path.join(OUT, 'app', 'login.js'); let s = fs.readFileSync(lj, 'utf8');
const rep = (a, b) => { if (!s.includes(a)) throw new Error('login.js anchor missing: ' + a); s = s.replace(a, b) };
rep("fetch('/api/auth/status')", "fetch('/api/auth/status?setup=' + encodeURIComponent(SETUP))");
rep("(function () {", "(function () {\n  const SETUP = new URLSearchParams(location.search).get('setup') || '';");
rep("password: $('sp').value })", "password: $('sp').value, setupToken: SETUP })");
rep("إنشاء حساب مدير النظام متاح من جهاز المكتب نفسه فقط. افتح ميثاق على الحاسوب الرئيسي.", "لإنشاء حساب مدير النظام افتح رابط الإعداد الذي وصلك من مزود الخدمة.");
fs.writeFileSync(lj, s);
// بوابة الموكل (نسخة الويب من تطبيق فلاتر) إن وُجدت
const portal = process.env.MQ_PORTAL || path.join(SRC, 'portal');
if (fs.existsSync(portal)) fs.cpSync(portal, path.join(OUT, 'app', 'portal'), { recursive: true });
else { fs.mkdirSync(path.join(OUT, 'app', 'portal'), { recursive: true }); fs.writeFileSync(path.join(OUT, 'app', 'portal', 'index.html'), '<!doctype html><meta charset="utf-8"><title>بوابة الموكل</title><p dir="rtl">بوابة الموكل</p>') }
// صفحة الموقع الرئيسية
fs.mkdirSync(path.join(OUT, 'site'), { recursive: true });
if (!fs.existsSync(path.join(OUT, 'site', 'index.html'))) fs.writeFileSync(path.join(OUT, 'site', 'index.html'), '<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ميثاق</title><body style="font-family:Cairo,Tahoma,sans-serif;background:#F5F0E6;color:#121B2E;display:grid;place-items:center;min-height:100vh;margin:0"><div style="text-align:center"><h1>ميثاق</h1><p>نظام إدارة مكاتب المحاماة</p></div>');
// بيانات ثابتة يحتاجها الخادم (المحاكم ومراحل القضية) من data.js
const d = fs.readFileSync(path.join(SRC, 'data.js'), 'utf8').replace(/if\(typeof module[^\n]*\n?/, '');
fs.writeFileSync('src/seed.js', '// مولّد تلقائياً من data.js — لا تعدّله يدوياً\n' + d + '\nexport { courts, STEPS };\n');
console.log('built', UI.length, 'files, portal:', fs.existsSync(portal));
