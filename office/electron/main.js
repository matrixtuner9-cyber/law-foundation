// تطبيق ميثاق لسطح المكتب
// يشغّل خادم المكتب داخلياً، ويعرض لوحة الإدارة في نافذة مستقلة،
// ويبقى بجانب الساعة عند إغلاق النافذة ليستمر استقبال رسائل الموكلين وإشعاراتهم.
const { app, BrowserWindow, Tray, Menu, shell, dialog, nativeImage, Notification, session } = require('electron');
const path = require('path'), fs = require('fs'), http = require('http');

const ROOT = path.join(__dirname, '..');
/* «ميثاق خاص»: لا إنترنت. الخادم على 127.0.0.1 فقط، والنافذة لا تطلب أي عنوان خارج الجهاز ولا تفتح روابط خارجية */
const ED = require(path.join(ROOT, 'lib', 'edition.js')).load();
const PORT = 8080, BASE = ED.offline ? `http://127.0.0.1:${PORT}` : `http://localhost:${PORT}`;
const isLocalUrl = u => { try { const x = new URL(u); return !/^(https?|wss?):$/.test(x.protocol) || ['127.0.0.1', 'localhost', '[::1]'].includes(x.hostname) } catch (e) { return false } };
const ICON = path.join(__dirname, 'icon.png');

if (!app.requestSingleInstanceLock()) { app.quit(); process.exit(0); }

let win = null, tray = null, quitting = false, cfg = {};
const CFG_F = () => path.join(app.getPath('userData'), 'config.json');
function loadCfg() {
  try { cfg = JSON.parse(fs.readFileSync(CFG_F(), 'utf8')) } catch (e) { cfg = {} }
  if (!cfg.dataDir) {
    // يستخدم مجلد البيانات الحالي إن وُجد، وإلا مجلداً خاصاً بالتطبيق
    // النسخة الخاصة لا تلتقط بيانات نسخة متصلة مثبّتة على الجهاز نفسه: مجلدها الخاص فقط
    const known = ED.offline ? null : ['D:\\Mithaq\\data', path.join(path.dirname(process.execPath), 'data')].find(d => ['mithaq.db', 'messages.json'].some(f => fs.existsSync(path.join(d, f))));
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

async function startServer() {
  if (await ping()) return 'external'; // يعمل خادم ميثاق مسبقاً (مثلاً عبر start.bat)
  fs.mkdirSync(cfg.dataDir, { recursive: true });
  process.env.MQ_DATA = cfg.dataDir;
  require(path.join(ROOT, 'server.js'));
  for (let i = 0; i < 50; i++) { if (await ping()) return 'internal'; await new Promise(r => setTimeout(r, 200)) }
  throw new Error('تعذّر تشغيل خادم المكتب على المنفذ 8080. تأكد أن برنامجاً آخر لا يستخدمه، ثم أعد تشغيل ميثاق.');
}

function show() { if (!win) return createWindow(); if (win.isMinimized()) win.restore(); win.show(); win.focus() }

function createWindow() {
  win = new BrowserWindow({
    width: 1440, height: 920, minWidth: 1000, minHeight: 640, title: ED.offline ? 'ميثاق خاص' : 'ميثاق', icon: ICON,
    backgroundColor: '#11302A', autoHideMenuBar: true, show: false,
    webPreferences: { contextIsolation: true, spellcheck: false },
  });
  win.loadURL(BASE);
  win.once('ready-to-show', () => { win.maximize(); win.show() });
  // الروابط الخارجية وفتح الملفات تذهب للمتصفح الافتراضي
  // في النسخة الخاصة: لا يُفتح أي رابط خارجي (لا متصفح ولا إنترنت)؛ ملفات المكتب المحلية تُفتح في نافذة داخلية
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!ED.offline) { shell.openExternal(url); return { action: 'deny' } }
    return isLocalUrl(url) ? { action: 'allow', overrideBrowserWindowOptions: { autoHideMenuBar: true, icon: ICON } } : { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith(BASE)) { e.preventDefault(); if (!ED.offline) shell.openExternal(url) } });
  win.on('close', e => {
    if (quitting) return;
    e.preventDefault(); win.hide();
    if (!cfg.trayHint) {
      new Notification({ title: 'ميثاق يعمل في الخلفية', body: 'يستمر استقبال رسائل الموكلين وإشعاراتهم. افتح ميثاق من الأيقونة بجانب الساعة.', icon: ICON }).show();
      cfg.trayHint = true; saveCfg();
    }
  });
  win.on('closed', () => { win = null });
}

function createTray() {
  tray = new Tray(nativeImage.createFromPath(ICON).resize({ width: 16, height: 16 }));
  tray.setToolTip(ED.offline ? 'ميثاق خاص · بياناتك لا تغادر مكتبك' : 'ميثاق · مكتب المحاماة');
  const login = () => app.getLoginItemSettings().openAtLogin;
  const menu = () => Menu.buildFromTemplate([
    { label: 'فتح لوحة المكتب', click: show },
    ...(ED.features.portal ? [{ label: 'فتح بوابة الموكل في المتصفح', click: () => shell.openExternal(BASE + '/portal/') }] : []),
    { type: 'separator' },
    { label: 'فتح مجلد البيانات', click: () => shell.openPath(cfg.dataDir) },
    { label: 'تشغيل ميثاق مع بدء Windows', type: 'checkbox', checked: login(), click: i => { app.setLoginItemSettings({ openAtLogin: i.checked, args: ['--hidden'] }); tray.setContextMenu(menu()) } },
    { type: 'separator' },
    { label: 'إغلاق ميثاق نهائياً', click: () => { quitting = true; app.quit() } },
  ]);
  tray.setContextMenu(menu());
  tray.on('click', show);
}

app.on('second-instance', show);
app.on('before-quit', () => { quitting = true });
app.on('window-all-closed', () => { /* يبقى التطبيق في شريط المهام */ });

app.whenReady().then(async () => {
  app.setAppUserModelId('ps.mithaq.desktop');
  loadCfg();
  // السماح للوحة المكتب بالميكروفون (الرسائل الصوتية) والإشعارات
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(['media', 'notifications', 'clipboard-sanitized-write'].includes(perm) && wc.getURL().startsWith(BASE)));
  session.defaultSession.setPermissionCheckHandler((wc, perm, origin) => ['media', 'notifications'].includes(perm) && String(origin || '').startsWith(BASE));
  if (ED.offline) {
    // حجب كل طلب شبكي من النوافذ إلى خارج الجهاز (خطوط، صور، روابط، اتصالات خلفية)
    session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] }, (d, cb) => cb({ cancel: !isLocalUrl(d.url) }));
    process.env.MQ_EDITION = 'private';
  }
  try { await startServer() } catch (e) { dialog.showErrorBox('ميثاق', e.message); app.exit(1); return }
  createTray();
  if (!process.argv.includes('--hidden')) createWindow();
});
