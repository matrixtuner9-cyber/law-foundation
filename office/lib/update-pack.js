// حزمة تحديث المسبار (.mqp): نسخة كاملة من شيفرة التطبيق (resources/app) في ملف واحد مضغوط،
// موقّعة بمفتاح المورّد الخاص (Ed25519، نفس مفتاح التراخيص)؛ التطبيق يتحقق بالمفتاح العام المشحون معه
// فلا يُطبَّق أي تحديث لم يصدر عن المورّد حتى لو اختُرق الخادم أو الطريق إليه.
// الصيغة: gzip( "MQP1" + طول الترويسة (4 بايت) + ترويسة JSON {version, files:[{p,size,sha}]} + محتوى الملفات متتالياً )
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), zlib = require('zlib');

const MAGIC = Buffer.from('MQP1');
const sha256 = b => crypto.createHash('sha256').update(b).digest('hex');
/* ما لا يدخل الحزمة: بيانات المكتب، والنسخ، وأدوات المطوّر، وما يخصّ جهاز البناء */
const SKIP = /^(data|backups|MithaqBackups|tools|tests|dist|dist-private|_bak[^/]*|_new|\.git)(\/|$)|(^|\/)edition\.json$|\.(bat|py|vbs|log)$/i;

const cmpVer = (a, b) => { const x = String(a).split('.').map(n => parseInt(n, 10) || 0), y = String(b).split('.').map(n => parseInt(n, 10) || 0); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0) ? 1 : -1 } return 0 };
const VER_RE = /^\d{1,3}\.\d{1,3}\.\d{1,4}$/;

function walk(root, rel = '', out = []) {
  for (const e of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
    const r = rel ? rel + '/' + e.name : e.name;
    if (SKIP.test(r)) continue;
    if (e.isDirectory()) walk(root, r, out); else if (e.isFile()) out.push(r);
  }
  return out;
}

/* حزم مجلد التطبيق؛ package.json يُكتب برقم الإصدار الجديد */
function pack(appDir, version) {
  if (!VER_RE.test(String(version))) throw new Error('رقم الإصدار بصيغة 1.0.5');
  if (!fs.existsSync(path.join(appDir, 'electron', 'main.js')) || !fs.existsSync(path.join(appDir, 'server.js'))) throw new Error('ليس مجلد تطبيق المسبار: ' + appDir);
  const files = [], bufs = [];
  for (const p of walk(appDir).sort()) {
    let b = fs.readFileSync(path.join(appDir, p));
    if (p === 'package.json') { const j = JSON.parse(b.toString('utf8')); j.version = version; b = Buffer.from(JSON.stringify(j, null, 2)) }
    files.push({ p, size: b.length, sha: sha256(b) }); bufs.push(b);
  }
  const head = Buffer.from(JSON.stringify({ version, at: new Date().toISOString(), files }));
  const len = Buffer.alloc(4); len.writeUInt32BE(head.length);
  const out = zlib.gzipSync(Buffer.concat([MAGIC, len, head, ...bufs]), { level: 9 });
  return { buf: out, sha256: sha256(out), size: out.length, files: files.length };
}

/* فكّ الحزمة إلى مجلد جديد مع التحقق من كل ملف؛ يرفض المسارات الخارجة عن المجلد */
function unpack(buf, dest) {
  const raw = zlib.gunzipSync(buf, { maxOutputLength: 1024 * 1024 * 1024 });
  if (!raw.subarray(0, 4).equals(MAGIC)) throw new Error('ليست حزمة تحديث للمسبار');
  const hl = raw.readUInt32BE(4), head = JSON.parse(raw.subarray(8, 8 + hl).toString('utf8'));
  let off = 8 + hl;
  const base = path.resolve(dest);
  fs.rmSync(base, { recursive: true, force: true }); fs.mkdirSync(base, { recursive: true });
  for (const f of head.files) {
    const target = path.resolve(base, f.p);
    if (!target.startsWith(base + path.sep) || /(^|[\\/])\.\.([\\/]|$)/.test(f.p) || path.isAbsolute(f.p)) throw new Error('مسار غير مسموح في الحزمة: ' + f.p);
    const b = raw.subarray(off, off + f.size); off += f.size;
    if (b.length !== f.size || sha256(b) !== f.sha) throw new Error('ملف تالف في الحزمة: ' + f.p);
    fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, b);
  }
  if (off !== raw.length) throw new Error('حجم الحزمة غير مطابق');
  return head;
}

/* توقيع بيانات الإصدار: الرقم + بصمة الملف + حجمه + أدنى إصدار Electron يلزمه */
const sigText = m => ['MQU1', m.version, m.sha256, m.size, m.min_electron || 0].join('|');
function signRelease(meta, privPem) { return crypto.sign(null, Buffer.from(sigText(meta)), crypto.createPrivateKey(privPem)).toString('base64url') }
function verifyRelease(meta, pubPem) {
  try { return !!pubPem && crypto.verify(null, Buffer.from(sigText(meta)), crypto.createPublicKey(pubPem), Buffer.from(String(meta.sig || ''), 'base64url')) } catch (e) { return false }
}

module.exports = { pack, unpack, signRelease, verifyRelease, sigText, sha256, cmpVer, VER_RE, walk };
