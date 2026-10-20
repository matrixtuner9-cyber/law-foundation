// يضيف الإشعارات والهوية العربية إلى ملفات الويب في مشروع Flutter
const fs = require('fs'), path = require('path'), dir = process.argv[2], extra = process.argv[3];
const web = path.join(dir, 'web');
fs.copyFileSync(path.join(extra, 'push-sw.js'), path.join(web, 'push-sw.js'));
let h = fs.readFileSync(path.join(web, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
h = h.replace('<html>', '<html lang="ar" dir="rtl">').replace(/<title>.*?<\/title>/, '<title>بوابة ميثاق</title>')
  .replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="بوابة الموكل - مكتب الميثاق للمحاماة">')
  .replace(/<meta name="apple-mobile-web-app-title" content="[^"]*">/, '<meta name="apple-mobile-web-app-title" content="ميثاق">');
if (!h.includes('apple-mobile-web-app-capable')) h = h.replace('<meta name="mobile-web-app-capable" content="yes">', '<meta name="mobile-web-app-capable" content="yes">\n  <meta name="apple-mobile-web-app-capable" content="yes">');
if (!h.includes('theme-color')) h = h.replace('</head>', '  <meta name="theme-color" content="#11302A">\n</head>');
if (!h.includes('window.mqPush')) h = h.replace('</head>', fs.readFileSync(path.join(extra, 'push-snippet.html'), 'utf8') + '</head>');
if (!h.includes('mq-splash')) h = h.replace('<body>', '<body style="margin:0;background:#11302A">\n  <div id="mq-splash" style="position:fixed;inset:0;display:grid;place-items:center;background:#11302A;color:#E2B866;font:600 18px system-ui">بوابة ميثاق…</div>');
fs.writeFileSync(path.join(web, 'index.html'), h);
const mp = path.join(web, 'manifest.json'), m = JSON.parse(fs.readFileSync(mp, 'utf8'));
Object.assign(m, { name: 'بوابة ميثاق', short_name: 'ميثاق', description: 'بوابة الموكل - مكتب الميثاق للمحاماة', background_color: '#11302A', theme_color: '#11302A', lang: 'ar', dir: 'rtl', start_url: '.', display: 'standalone' });
fs.writeFileSync(mp, JSON.stringify(m, null, 2));
console.log('web patched', h.includes('window.mqPush'), h.includes('dir="rtl"'));
