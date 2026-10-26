// تطبيق «المِسْبار» لسطح المكتب
// يشغّل خادم المكتب داخلياً (قواعد البيانات وفهرس التشريعات والأحكام على الجهاز نفسه، فالبحث يعمل بلا إنترنت)،
// ويعرض لوحة المكتب في نافذة مستقلة، ويبقى بجانب الساعة عند إغلاق النافذة.
// النسخ الاحتياطي: نسخة تلقائية يومية، ونسخة عند إغلاق التطبيق، وتذكير بحفظ نسخة خارج الجهاز كل 48 ساعة.
const { app, BrowserWindow, Tray, Menu, shell, dialog, nativeImage, Notification, session, ipcMain } = require('electron');
const path = require('path'), fs = require('fs'), http = require('http');

const ROOT = path.join(__dirname, '..');
/* «ميثاق خاص»: لا إنترنت. الخادم على 127.0.0.1 فقط، والنافذة لا تطلب أي عنوان خارج الجهاز ولا تفتح روابط خارجية */
const ED = require(path.join(ROOT, 'lib', 'edition.js')).load();
// منفذ مختلف لكل نسخة، فيمكن تثبيت «ميثاق خاص» و«ميثاق متصل» على جهاز واحد دون تداخل
const PORT = ED.offline ? 8181 : 8080, BASE = ED.offline ? `http://127.0.0.1:${PORT}` : `http://localhost:${PORT}`;
// صفحات التطبيق نفسه فقط (نفس الأصل)، والروابط الخارجية تُفتح في المتصفح إن كانت http/https فقط
const isAppUrl = u => { try { return new URL(u).origin === new URL(BASE).origin } catch (e) { return false } };
const isWebUrl = u => { try { return ['http:', 'https:'].includes(new URL(u).protocol) } catch (e) { return false } };
const isLocalUrl = u => { try { const x = new URL(u); return !/^(https?|wss?):$/.test(x.protocol) || ['127.0.0.1', 'localhost', '[::1]'].includes(x.hostname) } catch (e) { return false } };
const ICON = path.join(__dirname, 'icon.png');

// كل نسخة باسمها ومجلد إعداداتها الخاص (%APPDATA%\Mithaq Private) — لا تقرأ الخاصة إعدادات «ميثاق متصل» ولا مجلد بياناته
if (ED.offline) { app.setName('Mithaq Private'); app.setPath('userData', path.join(app.getPath('appData'), 'Mithaq Private')) }
const TITLE = ED.offline ? 'المِسْبار الخاص' : 'المِسْبار';
/* نسخة «production»: مجلد البيانات بجانب التطبيق نفسه (مثل E:\production misbar v1.0\data) إن وُجد ملف data-here.txt أو مجلد data بجانب الملف التنفيذي */
function portableData() {
  // النسخة المحمولة تُفكّ في مجلد مؤقت، ومجلدها الحقيقي في PORTABLE_EXECUTABLE_DIR
  const here = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);
  for (const d of [here, path.join(here, '..')]) { if (fs.existsSync(path.join(d, 'data-here.txt')) || fs.existsSync(path.join(d, 'data', 'mithaq.db'))) return path.join(d, 'data') }
  return null;
}
if (!app.requestSingleInstanceLock()) { app.quit(); process.exit(0); }

let win = null, tray = null, quitting = false, cfg = {};
const CFG_F = () => path.join(app.getPath('userData'), 'config.json');
function loadCfg() {
  try { cfg = JSON.parse(fs.readFileSync(CFG_F(), 'utf8')) } catch (e) { cfg = {} }
  // النسخة الخاصة: بياناتها دائماً في مجلدها هي، حتى لو وُجد ملف إعدادات قديم يشير لغيره
  if (ED.offline && cfg.dataDir !== path.join(app.getPath('userData'), 'data')) { cfg.dataDir = path.join(app.getPath('userData'), 'data'); saveCfg() }
  if (!cfg.dataDir) {
    // يستخدم مجلد البيانات الحالي إن وُجد، وإلا مجلداً خاصاً بالتطبيق
    // النسخة الخاصة لا تلتقط بيانات نسخة متصلة مثبّتة على الجهاز نفسه: مجلدها الخاص فقط
    const known = ED.offline ? null : portableData() || ['D:\\Mithaq\\data', path.join(path.dirname(process.execPath), 'data')].find(d => ['mithaq.db', 'messages.json'].some(f => fs.existsSync(path.join(d, f))));
    cfg.dataDir = known || path.join(app.getPath('userData'), 'data');
    saveCfg();
  }
}
function saveCfg() { fs.mkdirSync(path.dirname(CFG_F()), { recursive: true }); fs.writeFileSync(CFG_F(), JSON.stringify(cfg, null, 1)) }

function ping() {
  return new Promise(res => {
    const q = http.get(BASE + '/api/health', r => { r.resume(); res(r.statusCode === 200) });
    q.on('error', () => res(false)); q.setTimeout(1500, () => { q.destroy(); res(false) });
  });
}

function editionOf() {
  return new Promise(res => {
    const q = http.get(BASE + '/api/edition', r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d).id || 'connected') } catch (e) { res('connected') } }) });
    q.on('error', () => res(null)); q.setTimeout(1500, () => { q.destroy(); res(null) });
  });
}
async function startServer() {
  if (await ping()) { // يعمل خادم ميثاق مسبقاً (مثلاً عبر start.bat): نتأكد أنه من النسخة نفسها
    const other = await editionOf();
    if (other && other !== ED.id) throw new Error(`المنفذ ${PORT} مستخدم من نسخة أخرى من المِسْبار. أغلقها ثم أعد تشغيل ${ED.name}.`);
    return 'external';
  }
  fs.mkdirSync(cfg.dataDir, { recursive: true });
  process.env.MQ_DATA = cfg.dataDir; process.env.PORT = String(PORT);
  // فهرس التشريعات والأحكام: نسخة بجانب البيانات إن وُجدت (تحديثها = استبدال الملف)، وإلا النسخة المضمّنة في التطبيق
  if (!process.env.MQ_LAWINDEX) { const cand = [path.join(cfg.dataDir, 'mithaq-lawindex.db'), path.join(ROOT, 'data', 'mithaq-lawindex.db'), path.join(process.resourcesPath || '', 'lawindex', 'mithaq-lawindex.db')].find(f => fs.existsSync(f)); if (cand) process.env.MQ_LAWINDEX = cand }
  // النسخ في مجلد بجانب البيانات (وليس داخلها حتى لا تُنسخ النسخ مع النسخ)
  if (!process.env.MQ_BACKUP_DIR) process.env.MQ_BACKUP_DIR = path.join(path.dirname(cfg.dataDir), 'backups');
  require(path.join(ROOT, 'server.js'));
  for (let i = 0; i < 50; i++) { if (await ping()) return 'internal'; await new Promise(r => setTimeout(r, 200)) }
  throw new Error(`تعذّر تشغيل خادم المكتب على المنفذ ${PORT}. تأكد أن برنامجاً آخر لا يستخدمه، ثم أعد تشغيل ${ED.name}.`);
}

function show() { if (!win) return createWindow(); if (win.isMinimized()) win.restore(); win.show(); win.focus() }

function createWindow() {
  win = new BrowserWindow({
    width: 1440, height: 920, minWidth: 1000, minHeight: 640, title: TITLE, icon: ICON,
    backgroundColor: '#0B1B2B', autoHideMenuBar: true, show: false,
    webPreferences: { contextIsolation: true, spellcheck: false, preload: path.join(__dirname, 'preload.js') },
  });
  win.loadURL(BASE);
  win.once('ready-to-show', () => { win.maximize(); win.show() });
  // الروابط الخارجية وفتح الملفات تذهب للمتصفح الافتراضي
  // في النسخة الخاصة: لا يُفتح أي رابط خارجي (لا متصفح ولا إنترنت)؛ ملفات المكتب المحلية تُفتح في نافذة داخلية
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!ED.offline) { if (isWebUrl(url)) shell.openExternal(url); return { action: 'deny' } }
    return isAppUrl(url) ? { action: 'allow', overrideBrowserWindowOptions: { autoHideMenuBar: true, icon: ICON } } : { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => { if (!isAppUrl(url)) { e.preventDefault(); if (!ED.offline && isWebUrl(url)) shell.openExternal(url) } });
  win.on('close', e => {
    if (quitting) return;
    e.preventDefault(); win.hide();
    if (!cfg.trayHint) {
      new Notification({ title: TITLE + ' يعمل في الخلفية', body: 'يستمر العمل والنسخ الاحتياطي. افتح المِسْبار من الأيقونة بجانب الساعة.', icon: ICON }).show();
      cfg.trayHint = true; saveCfg();
    }
  });
  win.on('closed', () => { win = null });
}

function createTray() {
  tray = new Tray(nativeImage.createFromPath(ICON).resize({ width: 16, height: 16 }));
  tray.setToolTip(ED.offline ? 'المِسْبار الخاص · بياناتك لا تغادر مكتبك' : 'المِسْبار · نظام مكتب المحاماة');
  const login = () => app.getLoginItemSettings().openAtLogin;
  const menu = () => Menu.buildFromTemplate([
    { label: 'فتح لوحة المكتب', click: show },
    ...(ED.features.portal ? [{ label: 'فتح بوابة الموكل في المتصفح', click: () => shell.openExternal(BASE + '/portal/') }] : []),
    { type: 'separator' },
    { label: 'نسخة احتياطية الآن', click: () => { const r = backupNow('tray'); new Notification({ title: TITLE, body: r.ok ? 'تمت النسخة الاحتياطية (' + Math.round(r.size / 1048576) + ' م.ب)' : 'تعذّر النسخ: ' + r.error, icon: ICON }).show() } },
    { label: 'حفظ نسخة على قرص خارجي…', click: exportBackup },
    { label: 'فتح مجلد النسخ الاحتياطية', click: () => { const b = globalThis.MQ_DESKTOP; shell.openPath(b ? b.backup.ROOT : path.dirname(cfg.dataDir)) } },
    { label: 'فتح مجلد البيانات', click: () => shell.openPath(cfg.dataDir) },
    { label: 'تشغيل المِسْبار مع بدء Windows', type: 'checkbox', checked: login(), click: i => { app.setLoginItemSettings({ openAtLogin: i.checked, args: ['--hidden'] }); tray.setContextMenu(menu()) } },
    { type: 'separator' },
    { label: 'إغلاق المِسْبار نهائياً', click: () => { quitting = true; app.quit() } },
  ]);
  tray.setContextMenu(menu());
  tray.on('click', show);
}

/* ── النسخ الاحتياطي من داخل التطبيق (الخادم الداخلي يصدّر backup عبر MQ_DESKTOP) ── */
function backupNow(reason) { const b = globalThis.MQ_DESKTOP; if (!b) return { ok: false, error: 'الخادم يعمل خارج التطبيق' }; try { return b.backup.run(reason) } catch (e) { return { ok: false, error: e.message } } }
async function pickFolder(title) {
  const r = await dialog.showOpenDialog(win || undefined, { title: title || 'اختر المجلد', properties: ['openDirectory', 'createDirectory'], buttonLabel: 'اختيار' });
  return r.canceled || !r.filePaths[0] ? null : r.filePaths[0];
}
async function exportBackup() {
  const b = globalThis.MQ_DESKTOP; if (!b) return;
  const dir = await pickFolder('اختر القرص الخارجي أو المجلد الذي تُحفظ فيه نسخة بيانات المكتب'); if (!dir) return;
  const r = b.backup.exportTo(dir, 'desktop');
  if (r.ok) new Notification({ title: TITLE, body: 'حُفظت النسخة وتُحقق منها: ' + r.dir, icon: ICON }).show();
  else dialog.showErrorBox(TITLE, r.error);
}
ipcMain.handle('mq:pickFolder', (e, title) => pickFolder(title));
ipcMain.handle('mq:openPath', (e, p) => { if (typeof p === 'string' && path.isAbsolute(p)) shell.openPath(p); return true });
ipcMain.handle('mq:info', () => ({ version: app.getVersion(), dataDir: cfg.dataDir, edition: ED.id }));

/* تذكير سطح المكتب كل 48 ساعة (أو ما ضُبط في الإعدادات) بحفظ نسخة خارج الجهاز — يعمل حتى والنافذة مغلقة */
let lastRemind = 0;
function remindCheck() {
  const b = globalThis.MQ_DESKTOP; if (!b || Date.now() - lastRemind < 6 * 3600e3) return;
  let r; try { r = b.backup.remind() } catch (e) { return }
  if (!r.due) return; lastRemind = Date.now();
  const n = new Notification({ title: TITLE + ' — حان وقت النسخة الاحتياطية', body: 'مرّت ' + r.hours + ' ساعة دون حفظ نسخة خارج الجهاز. اضغط لحفظ نسخة على قرص خارجي الآن.', icon: ICON, timeoutType: 'never' });
  n.on('click', exportBackup); n.show();
}
setInterval(remindCheck, 15 * 60e3).unref();

app.on('second-instance', show);
app.on('before-quit', e => {
  quitting = true;
  // نسخة عند الإغلاق: متسقة وسريعة (ثوانٍ)، فتبقى آخر حالة للمكتب محفوظة دائماً
  if (globalThis.MQ_DESKTOP && !app.__exitBackup) { app.__exitBackup = true; try { backupNow('exit') } catch (x) {} }
});
app.on('window-all-closed', () => { /* يبقى التطبيق في شريط المهام */ });

app.whenReady().then(async () => {
  app.setAppUserModelId(ED.offline ? 'ps.mithaq.private' : 'ps.mithaq.desktop');
  loadCfg();
  // السماح للوحة المكتب بالميكروفون (الرسائل الصوتية) والإشعارات
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(['media', 'notifications', 'clipboard-sanitized-write'].includes(perm) && wc.getURL().startsWith(BASE)));
  session.defaultSession.setPermissionCheckHandler((wc, perm, origin) => ['media', 'notifications'].includes(perm) && String(origin || '').startsWith(BASE));
  if (ED.offline) {
    // حجب كل طلب شبكي من النوافذ إلى خارج الجهاز (خطوط، صور، روابط، اتصالات خلفية)
    session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] }, (d, cb) => cb({ cancel: !isLocalUrl(d.url) }));
    process.env.MQ_EDITION = 'private';
  }
  try { await startServer() } catch (e) { dialog.showErrorBox(TITLE, e.message); app.exit(1); return }
  createTray(); setTimeout(remindCheck, 90e3);
  if (!process.argv.includes('--hidden')) createWindow();
});
