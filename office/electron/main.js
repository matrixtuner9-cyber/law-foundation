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
/* نسخة «production» بمجلد بيانات بجانبها: منفذها من data-here.txt (سطر port=8090)، فلا تلتصق بخادم مكتب آخر يعمل على 8080 فتعرض بياناته */
function homeFile() { const here = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath); for (const d of [here, path.join(here, '..')]) { const f = path.join(d, 'data-here.txt'); if (fs.existsSync(f)) return f } return null }
const HOME_PORT = (() => { const f = homeFile(); if (!f) return 0; const m = /port\s*=\s*(\d{2,5})/i.exec(fs.readFileSync(f, 'utf8')); return m ? +m[1] : 8090 })();
let PORT = +process.env.MQ_DESKTOP_PORT || HOME_PORT || (ED.offline ? 8181 : 8080), BASE = ED.offline ? `http://127.0.0.1:${PORT}` : `http://localhost:${PORT}`;
const setPort = p => { PORT = p; BASE = ED.offline ? `http://127.0.0.1:${p}` : `http://localhost:${p}` };
const dataIdOf = dir => require('crypto').createHash('sha256').update(path.resolve(dir).toLowerCase()).digest('hex').slice(0, 16);
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
/* نسخة «production» (مجلد بيانات بجانبها): ملف إعدادات خاص بها، فلا تتشارك الإعدادات ولا مجلد البيانات مع نسخة مثبّتة على الجهاز نفسه */
const PORTABLE = ED.offline ? null : portableData();
if (PORTABLE) app.setPath('userData', path.join(path.dirname(PORTABLE), 'profile'));
if (!app.requestSingleInstanceLock()) { app.quit(); process.exit(0); }

let win = null, tray = null, quitting = false, cfg = {};
const CFG_F = () => path.join(app.getPath('userData'), 'config.json');
function loadCfg() {
  try { cfg = JSON.parse(fs.readFileSync(CFG_F(), 'utf8')) } catch (e) { cfg = {} }
  // النسخة الخاصة: بياناتها دائماً في مجلدها هي، حتى لو وُجد ملف إعدادات قديم يشير لغيره
  if (ED.offline && cfg.dataDir !== path.join(app.getPath('userData'), 'data')) { cfg.dataDir = path.join(app.getPath('userData'), 'data'); saveCfg() }
  // نسخة production: مجلد البيانات بجانبها دائماً
  if (PORTABLE) { if (cfg.dataDir !== PORTABLE) { cfg.dataDir = PORTABLE; saveCfg() } return }
  // نسخة مثبّتة لا تستعمل مجلد بيانات نسخة production (كان ملف الإعدادات مشتركاً سابقاً): لا يعمل خادمان على قاعدة واحدة
  if (cfg.dataDir && fs.existsSync(path.join(path.dirname(cfg.dataDir), 'data-here.txt'))) { delete cfg.dataDir }
  if (!cfg.dataDir) {
    // بيانات موجودة سابقاً على الجهاز تُستعمل كما هي، وإلا يُسأل المستخدم أين تُحفظ بيانات المكتب
    const known = ED.offline ? null : ['D:\\Mithaq\\data', path.join(path.dirname(process.execPath), 'data')].find(d => ['mithaq.db', 'messages.json'].some(f => fs.existsSync(path.join(d, f))));
    cfg.dataDir = known || chooseDataDir();
    saveCfg();
  }
}
/* أول تشغيل: اختيار مكان بيانات المكتب. يُقترح قرص غير قرص النظام فتبقى البيانات إن أُعيد تثبيت Windows */
function chooseDataDir() {
  const fallback = path.join(app.getPath('userData'), 'data');
  if (process.platform !== 'win32') return fallback;
  const sysDrive = (process.env.SystemDrive || 'C:').toUpperCase();
  const drive = 'DEFGHIJ'.split('').map(l => l + ':').find(d => d !== sysDrive && (() => { try { fs.accessSync(d + '\\', fs.constants.W_OK); return true } catch (e) { return false } })());
  const suggested = drive ? path.join(drive + '\\', 'Misbar Data') : path.dirname(fallback);
  for (;;) {
    const r = dialog.showMessageBoxSync({ type: 'question', title: TITLE + ' — مكان حفظ البيانات', message: 'أين تريد حفظ بيانات المكتب؟',
      detail: 'القضايا والموكلون والمستندات والنسخ الاحتياطية تُحفظ في هذا المكان على جهازك.' + (drive ? '\nيُنصح بقرص غير قرص النظام ' + sysDrive + '، فتبقى البيانات سليمة إن أُعيد تثبيت Windows.' : ''),
      buttons: ['حفظ في ' + suggested, 'اختيار مجلد آخر…'], defaultId: 0, cancelId: 0, noLink: true });
    if (r === 0) return path.join(suggested, 'data');
    const pick = dialog.showOpenDialogSync({ title: 'اختر القرص أو المجلد لبيانات المكتب', properties: ['openDirectory', 'createDirectory'], buttonLabel: 'اختيار' });
    if (pick && pick[0]) {
      const p = pick[0];
      if (fs.existsSync(path.join(p, 'mithaq.db'))) return p; // مجلد بيانات موجود
      if (fs.existsSync(path.join(p, 'data', 'mithaq.db'))) return path.join(p, 'data');
      return path.join(p, 'Misbar Data', 'data');
    }
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
    const q = http.get(BASE + '/api/edition', r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { const j = JSON.parse(d); res({ id: j.id || 'connected', dataId: j.dataId || '' }) } catch (e) { res({ id: 'connected', dataId: '' }) } }) });
    q.on('error', () => res(null)); q.setTimeout(1500, () => { q.destroy(); res(null) });
  });
}
async function startServer() {
  if (await ping()) { // يعمل خادم على المنفذ مسبقاً: نلتصق به فقط إن كان النسخة نفسها وعلى مجلد البيانات نفسه
    const other = await editionOf();
    if (other && other.id === ED.id && other.dataId && other.dataId === dataIdOf(cfg.dataDir)) return 'external';
    // خادم آخر (نسخة قديمة أو مجلد بيانات مختلف): لا نعرض بياناته؛ نشغّل خادمنا على أول منفذ متاح
    const base = PORT; let free = 0;
    for (let p = base + 1; p <= base + 20 && !free; p++) { setPort(p); if (!(await ping())) free = p }
    if (!free) throw new Error(`المنافذ ${base}–${base + 20} مشغولة. أغلق البرامج الأخرى ثم أعد تشغيل ${ED.name}.`);
    console.log(`[misbar] المنفذ ${base} يستعمله خادم آخر؛ يعمل المسبار على ${free}`);
  }
  fs.mkdirSync(cfg.dataDir, { recursive: true });
  process.env.MQ_DATA = cfg.dataDir; process.env.PORT = String(PORT);
  // فهرس التشريعات والأحكام: نسخة بجانب البيانات إن وُجدت (تحديثها = استبدال الملف)، وإلا النسخة المضمّنة في التطبيق
  if (!process.env.MQ_LAWINDEX) { const cand = [path.join(cfg.dataDir, 'mithaq-lawindex.db'), path.join(ROOT, 'data', 'mithaq-lawindex.db'), path.join(process.resourcesPath || '', 'lawindex', 'mithaq-lawindex.db')].find(f => fs.existsSync(f)); if (cand) process.env.MQ_LAWINDEX = cand }
  // دليل محامي النقابة المضمّن: يُنسخ إلى البيانات عند أول تشغيل إن لم يوجد
  if (!process.env.MQ_BAR_SEED) { const seed = [path.join(process.resourcesPath || '', 'bar', 'lawyers.json'), path.join(ROOT, 'data', 'bar', 'lawyers.json')].find(f => fs.existsSync(f)); if (seed) process.env.MQ_BAR_SEED = seed }
  // النسخ في مجلد بجانب البيانات (وليس داخلها حتى لا تُنسخ النسخ مع النسخ)
  if (!process.env.MQ_BACKUP_DIR) process.env.MQ_BACKUP_DIR = path.join(path.dirname(cfg.dataDir), 'backups');
  // مفاتيح عقل المسبار: ملف ai_keys.cmd محلي بجانب مجلد البيانات (خارج الكود دائماً)، كما يفعل خادم المكتب
  try { const kf = path.join(path.dirname(cfg.dataDir), 'ai_keys.cmd'); if (fs.existsSync(kf)) for (const l of fs.readFileSync(kf, 'utf8').split(/\r?\n/)) { const m = /^\s*(?:set\s+)?"?(DEEPSEEK_API_KEY|ANTHROPIC_API_KEY|MQ_AI_MODEL)=([^"\r\n]*)"?\s*$/i.exec(l); if (m && m[2].trim() && !process.env[m[1].toUpperCase()]) process.env[m[1].toUpperCase()] = m[2].trim() } } catch (e) { console.error('[keys]', e.message) }
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
