// تفعيل نسخة المِسْبار: لا يعمل التطبيق إطلاقاً دون كود تفعيل صادر لهذا الجهاز.
// البصمة: SHA-256 لعناوين MAC الفعلية + معرّف الجهاز (Windows MachineGuid / machine-id) + اسم الجهاز، تُعرض مختصرة.
// الكود: حمولة JSON موقّعة بمفتاح «مُفعِّل المِسْبار» الخاص (Ed25519) لدى المطوّر فقط؛ التطبيق يحمل المفتاح العام ويتحقق محلياً بلا إنترنت.
'use strict';
const crypto = require('crypto'), os = require('os'), fs = require('fs'), path = require('path');

/* المفتاح العام للمُفعِّل (يُستبدل عند توليد مفتاح الإنتاج بأداة tools/activator.js init) */
function readPub() {
  if (process.env.MQ_LICENSE_PUB) return process.env.MQ_LICENSE_PUB;
  try { return fs.readFileSync(path.join(__dirname, '..', 'license.pub'), 'utf8') } catch (e) { return '' }
}
const PUBLIC_KEY_PEM = readPub();
/* مفتاح التفعيل عبر الإنترنت (خادم المسبار يوقّع به عند التفعيل باسم المكتب وكلمة المرور)؛ مفتاح المورّد الخاص يبقى على جهازه.
   التحديثات لا تقبل إلا مفتاح المورّد (license.pub) — هذا المفتاح للتراخيص فقط */
function readActPub() {
  if (process.env.MQ_ACTIVATION_PUB) return process.env.MQ_ACTIVATION_PUB;
  try { return fs.readFileSync(path.join(__dirname, '..', 'activation.pub'), 'utf8') } catch (e) { return '' }
}
const ACTIVATION_PUB = readActPub();
const pubList = pub => (Array.isArray(pub) ? pub : [pub]).filter(k => k && !String(k).startsWith('__'));

const b64u = b => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');

/* معرّف الجهاز الثابت من نظام التشغيل (لا يتغير بتغيير كرت الشبكة وحده) */
function machineId() {
  try {
    if (process.platform === 'win32') {
      const out = require('child_process').execFileSync('reg', ['query', 'HKLM\\SOFTWARE\\Microsoft\\Cryptography', '/v', 'MachineGuid'], { encoding: 'utf8', windowsHide: true, timeout: 5000 });
      const m = out.match(/MachineGuid\s+REG_SZ\s+([0-9a-f-]+)/i); if (m) return m[1].toLowerCase();
    }
    for (const f of ['/etc/machine-id', '/var/lib/dbus/machine-id']) if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8').trim();
    if (process.platform === 'darwin') { const out = require('child_process').execFileSync('ioreg', ['-rd1', '-c', 'IOPlatformExpertDevice'], { encoding: 'utf8', timeout: 5000 }); const m = out.match(/IOPlatformUUID"\s*=\s*"([^"]+)"/); if (m) return m[1] }
  } catch (e) { /* يبقى MAC واسم الجهاز */ }
  return '';
}
/* عناوين MAC الفعلية فقط (بلا الافتراضية ولا الحلقة)، مرتبة حتى لا تتغير البصمة بترتيب الكروت */
function macs(ifs = os.networkInterfaces()) {
  const virt = /virtual|vmware|vbox|hyper-v|vethernet|docker|wsl|loopback|bluetooth|tap|tun|zerotier|tailscale|npcap/i;
  const set = new Set();
  for (const [name, list] of Object.entries(ifs || {})) {
    if (virt.test(name)) continue;
    for (const i of list || []) if (i.mac && i.mac !== '00:00:00:00:00:00' && !i.internal) set.add(i.mac.toLowerCase());
  }
  return [...set].sort();
}
/* البصمة: تعتمد على معرّف الجهاز أساساً، وعلى أول MAC فعلي (أقل تغيراً) */
function fingerprint({ id = machineId(), mac = macs(), host = os.hostname() } = {}) {
  const basis = ['mithaq-v1', id || '-', (mac[0] || '-'), id ? '' : String(host).toLowerCase()].join('|');
  const h = crypto.createHash('sha256').update(basis).digest();
  /* رمز للعرض: 20 حرفاً بأبجدية خالية من الالتباس، مجموعات من 4 */
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = '';
  for (let i = 0; i < 20; i++) s += A[h[i] % 32];
  return s.match(/.{4}/g).join('-');
}
const normFp = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

/* الكود: MQ1.<payload>.<signature> */
function sign(payload, privateKeyPem) {
  const body = b64u(JSON.stringify(payload));
  const sig = crypto.sign(null, Buffer.from('MQ1.' + body), crypto.createPrivateKey(privateKeyPem));
  return 'MQ1.' + body + '.' + b64u(sig);
}
function verify(code, { fp, now = new Date(), pub = [PUBLIC_KEY_PEM, ACTIVATION_PUB] } = {}) {
  const c = String(code || '').replace(/\s+/g, '').trim();
  const m = c.match(/^MQ1\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/);
  if (!m) return { ok: false, error: 'صيغة كود التفعيل غير صحيحة.' };
  const keys = pubList(pub);
  if (!keys.length) return { ok: false, error: 'هذه النسخة لم تُجهَّز بمفتاح التحقق بعد.' };
  let good = false;
  for (const k of keys) { try { if (crypto.verify(null, Buffer.from('MQ1.' + m[1]), crypto.createPublicKey(k), unb64u(m[2]))) { good = true; break } } catch (e) {} }
  if (!good) return { ok: false, error: 'كود التفعيل غير صالح.' };
  let p; try { p = JSON.parse(unb64u(m[1]).toString('utf8')) } catch (e) { return { ok: false, error: 'كود التفعيل تالف.' } }
  if (normFp(p.fp) !== normFp(fp)) return { ok: false, error: 'هذا الكود صادر لجهاز آخر. أرسل بصمة هذا الجهاز للحصول على كود جديد.', payload: p };
  if (p.exp && String(now.toISOString()).slice(0, 10) > p.exp) return { ok: false, expired: true, error: `انتهت مدة الترخيص في ${p.exp}. تواصل معنا للتجديد.`, payload: p };
  return { ok: true, payload: p };
}

/* حالة التفعيل على هذا الخادم: ملف license.key في مجلد البيانات */
function createLicense({ dataDir, pub = [PUBLIC_KEY_PEM, ACTIVATION_PUB], fp = null, now = () => new Date(), enforce = true } = {}) {
  const file = path.join(dataDir, 'license.key');
  const myFp = fp || fingerprint();
  let cache = null, at = 0;
  function status() {
    if (!enforce) return { ok: true, enforced: false, fp: myFp };
    if (cache && Date.now() - at < 60e3) return cache;
    let code = ''; try { code = fs.readFileSync(file, 'utf8').trim() } catch (e) {}
    const r = code ? verify(code, { fp: myFp, now: now(), pub }) : { ok: false, error: 'النسخة غير مفعّلة.' };
    cache = { ...r, enforced: true, fp: myFp, office: r.payload && r.payload.office, edition: r.payload && r.payload.edition, exp: r.payload && r.payload.exp, users: r.payload && r.payload.users };
    at = Date.now(); return cache;
  }
  function activate(code) {
    const r = verify(code, { fp: myFp, now: now(), pub });
    if (!r.ok) return r;
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(file, String(code).replace(/\s+/g, '').trim() + '\n', { mode: 0o600 });
    try { fs.unlinkSync(path.join(dataDir, 'license.note')) } catch (e) {}
    cache = null; return { ...status(), activated: true };
  }
  /* إبطال من المورّد: يُنقل الملف جانباً فتعود شاشة التفعيل */
  function revokeLocal(reason) { try { fs.renameSync(file, path.join(dataDir, 'license.revoked')) } catch (e) {} try { fs.writeFileSync(path.join(dataDir, 'license.note'), String(reason || '')) } catch (e) {} cache = null }
  function code() { try { return fs.readFileSync(file, 'utf8').trim() } catch (e) { return '' } }
  function note() { try { return fs.readFileSync(path.join(dataDir, 'license.note'), 'utf8') } catch (e) { return '' } }
  return { status, activate, revokeLocal, code, note, fp: myFp, file, reset: () => { cache = null } };
}

module.exports = { fingerprint, macs, machineId, sign, verify, createLicense, normFp, PUBLIC_KEY_PEM, ACTIVATION_PUB };
