// نقطة بدء تطبيق المسبار: تختار الشيفرة التي تعمل — المشحونة مع التطبيق، أو آخر تحديث مُنزَّل وموقّع من المورّد —
// ثم تحمّل electron/main.js منها. هذا الملف نفسه لا يتغير بالتحديثات (يبقى من المثبّت) ليبقى الرجوع ممكناً دائماً.
'use strict';
const { app } = require('electron');
const path = require('path'), fs = require('fs');
const BUNDLED = path.join(__dirname, '..');
const bundledVersion = require(path.join(BUNDLED, 'package.json')).version;

function portableRoot() {
  const here = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);
  for (const d of [here, path.join(here, '..')]) if (fs.existsSync(path.join(d, 'data-here.txt')) || fs.existsSync(path.join(d, 'data', 'mithaq.db'))) return d;
  return null;
}

let dir = BUNDLED, version = bundledVersion, UPD = null, locked = false;
try {
  const ED = require(path.join(BUNDLED, 'lib', 'edition.js')).load();
  // النسخة الخاصة لا تتصل بالإنترنت إطلاقاً، فلا تحديث تلقائي لها (تُحدَّث بمثبّت جديد)
  if (!ED.offline && !process.env.MQ_NO_UPDATE) {
    const U = require(path.join(BUNDLED, 'lib', 'updater.js')), root = portableRoot();
    // نسخة واحدة فقط تعمل؛ والتشغيل الثاني (وهي تعمل) لا يُحسب محاولة لتشغيل التحديث
    if (root) app.setPath('userData', path.join(root, 'profile'));
    if (!app.requestSingleInstanceLock()) { app.quit(); process.exit(0) }
    locked = true;
    UPD = U.updatesDir(app.getPath('userData'), root);
    const r = U.select(UPD, bundledVersion);
    if (r) { dir = r.dir; version = r.version }
  }
} catch (e) { console.error('[boot]', e.message); dir = BUNDLED; version = bundledVersion }

globalThis.MQ_BOOT = {
  bundled: BUNDLED, bundledVersion, dir, version, updatesDir: UPD,
  updated: dir !== BUNDLED, locked,
  confirm() { if (!UPD) return {}; try { return require(path.join(BUNDLED, 'lib', 'updater.js')).confirm(UPD) } catch (e) { return {} } },
  fail() { if (UPD && dir !== BUNDLED) try { require(path.join(BUNDLED, 'lib', 'updater.js')).fail(UPD) } catch (e) {} },
};

try { require(path.join(dir, 'electron', 'main.js')) }
catch (e) {
  // الإصدار المحدَّث لا يُحمَّل أصلاً: يُعلَّم معطّلاً ويُعاد التشغيل بالشيفرة السابقة
  console.error('[boot] load failed', e);
  if (dir !== BUNDLED) { globalThis.MQ_BOOT.fail(); app.relaunch(); app.exit(0) } else throw e;
}
