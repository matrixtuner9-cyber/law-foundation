// بناء «المِسْبار الخاص» (بلا إنترنت) لويندوز: node tools/build-private.js
// - يكتب edition.json = private (يقرؤه الخادم وElectron)، ويحذفه بعد البناء فيبقى مجلد التطوير «المِسْبار المتصل»
// - اسم ومعرّف مختلفان (Mithaq Private / ps.mithaq.private) فيمكن تثبيت النسختين على جهاز واحد ببيانات منفصلة
// - مثبّت NSIS فقط (لا نسخة محمولة) لأنه يضيف قاعدة جدار الحماية، ويُثبَّت لكل المستخدمين (يطلب صلاحية المدير)
// - لا يضم بوابة الموكل ولا متصفح الأتمتة (playwright-core) الذي يستخدمه ميزان ودليل النقابة
'use strict';
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..'), pkg = require(path.join(ROOT, 'package.json')), V = pkg.version;
const EDF = path.join(ROOT, 'edition.json');
const cfg = JSON.parse(JSON.stringify(pkg.build));
Object.assign(cfg, { appId: 'ps.mithaq.private', productName: 'Mithaq Private', directories: { output: 'dist-private' } });
cfg.files = [...cfg.files, '!portal/**', '!node_modules/playwright-core/**', '!bar/**', '!mizan/connector.js'];
cfg.win = { ...cfg.win, target: ['nsis'] };
cfg.nsis = { ...cfg.nsis, perMachine: true, shortcutName: 'المِسْبار الخاص', include: 'electron/private.nsh', artifactName: `Mithaq-Private-${V}-Setup.\${ext}` };
delete cfg.portable;
const CF = path.join(ROOT, 'electron', 'builder-private.json');
fs.writeFileSync(EDF, JSON.stringify({ edition: 'private', builtAt: new Date().toISOString() }, null, 1));
fs.writeFileSync(CF, JSON.stringify(cfg, null, 1));
let code = 1;
try {
  const bin = path.join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'electron-builder.cmd' : 'electron-builder');
  const r = spawnSync(bin, ['--win', '--config', CF, ...process.argv.slice(2)], { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' });
  code = r.status ?? 1;
} finally { fs.rmSync(EDF, { force: true }); fs.rmSync(CF, { force: true }) }
console.log(code === 0 ? `تم: dist-private/Mithaq-Private-${V}-Setup.exe` : 'فشل البناء'); process.exit(code);
