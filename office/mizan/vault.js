// خزنة بيانات الدخول إلى ميزان: تشفير محلي فقط
// على Windows: حماية حساب المستخدم (DPAPI) فلا يفك التشفير إلا نفس حساب Windows على نفس الجهاز
// على غيره: AES-256-GCM بمفتاح محفوظ في مجلد البيانات
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { execFileSync } = require('child_process');
const DIR = path.join(process.env.MQ_DATA || path.join(__dirname, '..', 'data'), 'mizan');
const CRED = path.join(DIR, 'credentials.json'), KEY = path.join(DIR, '.key');
fs.mkdirSync(DIR, { recursive: true });

function ps(script, input) {
  return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script],
    { env: { ...process.env, MQ_IN: input }, encoding: 'utf8', windowsHide: true }).trim();
}
const PROTECT = "Add-Type -AssemblyName System.Security; [Convert]::ToBase64String([Security.Cryptography.ProtectedData]::Protect([Convert]::FromBase64String($env:MQ_IN), $null, 'CurrentUser'))";
const UNPROTECT = "Add-Type -AssemblyName System.Security; [Convert]::ToBase64String([Security.Cryptography.ProtectedData]::Unprotect([Convert]::FromBase64String($env:MQ_IN), $null, 'CurrentUser'))";

function aesKey() { if (!fs.existsSync(KEY)) fs.writeFileSync(KEY, crypto.randomBytes(32), { mode: 0o600 }); return fs.readFileSync(KEY) }
function seal(text) {
  const raw = Buffer.from(text, 'utf8');
  if (process.platform === 'win32') return { m: 'dpapi', d: ps(PROTECT, raw.toString('base64')) };
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', aesKey(), iv);
  const enc = Buffer.concat([c.update(raw), c.final()]);
  return { m: 'aes', d: Buffer.concat([iv, c.getAuthTag(), enc]).toString('base64') };
}
function open(box) {
  if (box.m === 'dpapi') return Buffer.from(ps(UNPROTECT, box.d), 'base64').toString('utf8');
  const b = Buffer.from(box.d, 'base64'), d = crypto.createDecipheriv('aes-256-gcm', aesKey(), b.subarray(0, 12));
  d.setAuthTag(b.subarray(12, 28));
  return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8');
}

exports.save = (username, password) => {
  const u = String(username || '').trim(), p = String(password || '');
  if (!u || !p) throw new Error('أدخل رقم العضوية وكلمة المرور.');
  fs.writeFileSync(CRED, JSON.stringify({ user: u, box: seal(p), savedAt: new Date().toISOString() }));
};
exports.load = () => { if (!fs.existsSync(CRED)) return null; const j = JSON.parse(fs.readFileSync(CRED, 'utf8')); return { username: j.user, password: open(j.box), savedAt: j.savedAt } };
exports.info = () => { if (!fs.existsSync(CRED)) return null; const j = JSON.parse(fs.readFileSync(CRED, 'utf8')); return { user: j.user, savedAt: j.savedAt, method: j.box.m } };
exports.forget = () => { try { fs.unlinkSync(CRED) } catch (e) {} };
exports.DIR = DIR;
