// عروض المِسْبار — نافذة سطح المكتب (Electron). الخادم يعمل داخل التطبيق على هذا الجهاز فقط.
// البيانات: مجلد data بجانب البرنامج (E:\laywers-offers\data) إن أمكنت الكتابة فيه، وإلا مجلد المستخدم.
'use strict';
const { app, BrowserWindow, shell, Menu, dialog } = require('electron');
const path = require('path'), fs = require('fs');

function dataDir() {
  const exeDir = path.dirname(process.execPath);
  /* البرنامج المبني في …\laywers-offers\app\ → البيانات في …\laywers-offers\data */
  const cands = app.isPackaged ? [path.join(exeDir, '..', 'data'), path.join(exeDir, 'data')] : [path.join(__dirname, 'data')];
  for (const d of cands) { try { fs.mkdirSync(d, { recursive: true }); fs.accessSync(d, fs.constants.W_OK); return path.resolve(d) } catch { } }
  return path.join(app.getPath('userData'), 'data');
}

if (!app.requestSingleInstanceLock()) app.quit();
let win = null;
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus() } });

app.whenReady().then(async () => {
  process.env.OFFERS_DATA = dataDir();
  let port;
  try { port = await require('./server.js').start(8795) }
  catch (e) { dialog.showErrorBox('عروض المِسْبار', 'تعذّر تشغيل البرنامج: ' + e.message); return app.quit() }
  Menu.setApplicationMenu(null);
  win = new BrowserWindow({ width: 1480, height: 900, minWidth: 1000, minHeight: 640, title: 'عروض المِسْبار', backgroundColor: '#f4efe4', autoHideMenuBar: true,
    icon: fs.existsSync(path.join(__dirname, 'icon.ico')) ? path.join(__dirname, 'icon.ico') : undefined,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false } });
  const home = `http://localhost:${port}/`;
  /* واتساب والرسائل والبريد والاتصال تُفتح في تطبيقاتها على الجهاز؛ لا يُفتح داخل النافذة إلا البرنامج نفسه */
  const external = url => { if (/^(whatsapp|sms|mailto|tel):/i.test(url) || /^https:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//i.test(url) || /^https?:\/\//i.test(url) && !url.startsWith(home)) { shell.openExternal(url).catch(() => { }); return true } return false };
  win.webContents.setWindowOpenHandler(({ url }) => { external(url); return { action: 'deny' } });
  win.webContents.on('will-navigate', (ev, url) => { if (!url.startsWith(home)) { ev.preventDefault(); external(url) } });
  win.loadURL(home);
  win.maximize();
});
app.on('window-all-closed', () => app.quit());
