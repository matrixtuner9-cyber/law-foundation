// يجهّز مجلد public من ملفات واجهة ميثاق (المصدر: ../office أو MQ_SRC) ويولّد src/seed.js
import fs from 'node:fs'; import path from 'node:path';
const SRC = process.env.MQ_SRC || path.resolve('../office'), OUT = path.resolve('public');
const UI = ['index.html','app.js','ready-templates-palestine.js','legal-shelf.js','print.js','intake.js','rulings.js','guide.js','workflow.js','casework.js','stations.js','hearing-report.js','case-layout.js','case-steps.js','announce.js','reader.js','case-hub.js','case-wizard.js','consistency.js','searchsel.js','wa-chat.js','fulltext.js','ai-mark.js','night.css','qrcode.js','app-invite.js','avatar.js','wa-skin.js','case360.js','hearing-prep.js','draft-versions.js','reference-check.js','legal-qa.js','reference-ui.js','lawlib-data.js','lawlib.js','legislation.js','misbar.js','misbar-emblem.webp','misbar-hero.webp','misbar-banner.webp','aidraft.js','calc-engine.js','calc.js','dash.js','briefcase.js','settlements.js','sync.js','mizan-ui.js','data.js','admin.js','phase2.js','phase2.css','bar.js','bar.css','responsive.js','responsive.css','style.css','dash.css','briefcase.css','mizan.css','admin.css','prestige.css','login.html','login.js','login.css','scales.js','edition.js','hdr-banner.jpg','hdr-side.jpg','hdr-side.webp','hdr-emblem.jpg','hdr-logo.jpg'];
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
rep("إنشاء حساب مدير النظام متاح من جهاز المكتب نفسه فقط. افتح المِسْبار على الحاسوب الرئيسي.", "لإنشاء حساب مدير النظام افتح رابط الإعداد الذي وصلك من مزود الخدمة.");
fs.writeFileSync(lj, s);
// بوابة الموكل (نسخة الويب من تطبيق فلاتر) إن وُجدت
const portal = process.env.MQ_PORTAL || path.join(SRC, 'portal');
// لا تُنشر صفحة بديلة وهمية: إن غابت نسخة Flutter Web يتوقف البناء برسالة واضحة
if (!fs.existsSync(path.join(portal, 'main.dart.js'))) throw new Error('بوابة الموكل غير موجودة في ' + portal + ': شغّل flutter build web --release --base-href /portal/ وانسخ build/web إليها قبل بناء السحابة.');
fs.cpSync(portal, path.join(OUT, 'app', 'portal'), { recursive: true });
// صفحة الموقع الرئيسية
fs.mkdirSync(path.join(OUT, 'site'), { recursive: true });
if (!fs.existsSync(path.join(OUT, 'site', 'index.html'))) fs.writeFileSync(path.join(OUT, 'site', 'index.html'), '<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ميثاق</title><body style="font-family:Cairo,Tahoma,sans-serif;background:#F5F0E6;color:#121B2E;display:grid;place-items:center;min-height:100vh;margin:0"><div style="text-align:center"><h1>ميثاق</h1><p>نظام إدارة مكاتب المحاماة</p></div>');
// بيانات ثابتة يحتاجها الخادم (المحاكم ومراحل القضية) من data.js
const d = fs.readFileSync(path.join(SRC, 'data.js'), 'utf8').replace(/if\(typeof module[^\n]*\n?/, '');
fs.writeFileSync('src/seed.js', '// مولّد تلقائياً من data.js — لا تعدّله يدوياً\n' + d + '\nexport { courts, STEPS };\n');
// نواة «مِسْبار» (ESM) تُولَّد من office/lib/misbar.js حتى تبقى نسخة واحدة للمنطق
{ let m = fs.readFileSync(path.join(SRC, 'lib', 'misbar.js'), 'utf8');
  const cut = m.indexOf('/* محوّل خادم المكتب'); if (cut < 0) throw new Error('misbar.js: openFile anchor missing'); m = m.slice(0, cut);
  m = m.replace("'use strict';", '').replace(/\n\/\/ [^\n]*\n/, '\n');
  fs.writeFileSync('src/misbar.js', '// مولّد تلقائياً من office/lib/misbar.js — لا تعدّله يدوياً\n' + m + '\nexport { SOURCES, STATUS, CHUNK, CHUNK_BASE, norm, ftsQuery, snippet, createMisbar, adapters };\n');
  let ai = fs.readFileSync(path.join(SRC, 'lib', 'misbar-ai.js'), 'utf8').replace("'use strict';", '').replace(/module\.exports\s*=\s*\{[^}]*\};?\s*$/, '');
  fs.writeFileSync('src/misbar-ai.js', '// مولّد تلقائياً من office/lib/misbar-ai.js — لا تعدّله يدوياً\n' + ai + '\nexport { TASKS, LANGS, DS_MODEL, AN_MODEL, createAnalyzer, callDeepSeek, callClaude, citedRefs };\n'); }
console.log('built', UI.length, 'files, portal:', fs.existsSync(portal));
