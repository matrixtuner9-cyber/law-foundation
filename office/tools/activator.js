// «مُفعِّل ميثاق» — أداة المطوّر وحده لإصدار أكواد التفعيل. لا تُشحن مع نسخ المكاتب.
//   node tools/activator.js init  [--dir D]              يولّد زوج المفاتيح (الخاص يبقى في D، والعام license.pub يُشحن مع النسخ)
//   node tools/activator.js issue --fp XXXX-XXXX-XXXX-XXXX-XXXX --office "اسم المكتب" [--edition private|connected] [--users 5] [--exp 2027-12-31] [--dir D]
//   node tools/activator.js serve [--dir D] [--port 8777]   واجهة صغيرة على هذا الجهاز فقط (127.0.0.1)
//   node tools/activator.js list  [--dir D]                 سجل الأكواد الصادرة
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), http = require('http');
const L = require('../lib/license');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d };
const DIR = path.resolve(arg('dir', path.join(require('os').homedir(), 'mithaq-activator')));
const PRIV = path.join(DIR, 'activator-private.pem'), PUB = path.join(DIR, 'license.pub'), REG = path.join(DIR, 'issued.csv');
const cmd = process.argv[2];

function init() {
  if (fs.existsSync(PRIV)) { console.log('المفاتيح موجودة مسبقاً في', DIR, '— لا يُعاد توليدها حتى لا تبطل الأكواد الصادرة.'); return }
  fs.mkdirSync(DIR, { recursive: true });
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  fs.writeFileSync(PRIV, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
  fs.writeFileSync(PUB, publicKey.export({ type: 'spki', format: 'pem' }));
  fs.writeFileSync(REG, 'issued_at,office,edition,users,exp,fp,code_id\n');
  console.log('تم. المفتاح الخاص:', PRIV, '\n(احفظ نسخة احتياطية منه في مكان آمن؛ ضياعه يعني عدم القدرة على إصدار أكواد للنسخ الحالية)\nالمفتاح العام للشحن مع النسخ:', PUB);
}
function issue(o) {
  if (!fs.existsSync(PRIV)) throw new Error('شغّل init أولاً');
  const fp = L.normFp(o.fp); if (fp.length !== 20) throw new Error('بصمة الجهاز غير صحيحة (20 حرفاً)');
  const office = String(o.office || '').trim(); if (office.length < 2) throw new Error('اسم المكتب مطلوب');
  const edition = o.edition === 'connected' ? 'connected' : 'private';
  const users = Math.max(1, Math.min(500, parseInt(o.users || '5', 10) || 5));
  const exp = /^\d{4}-\d{2}-\d{2}$/.test(String(o.exp || '')) ? o.exp : '';
  const payload = { v: 1, fp: fp.match(/.{4}/g).join('-'), office, edition, users, exp, iat: new Date().toISOString().slice(0, 10), id: crypto.randomBytes(4).toString('hex') };
  const code = L.sign(payload, fs.readFileSync(PRIV, 'utf8'));
  const chk = L.verify(code, { fp, pub: fs.readFileSync(PUB, 'utf8') }); if (!chk.ok) throw new Error('فشل التحقق الذاتي: ' + chk.error);
  const q = v => '"' + String(v).replace(/"/g, '""') + '"';
  fs.appendFileSync(REG, [payload.iat, q(office), edition, users, exp, payload.fp, payload.id].join(',') + '\n');
  return { code, payload };
}
const PAGE = `<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>مُفعِّل ميثاق</title><style>
body{font-family:Tahoma,Arial;background:#0B1B2B;color:#F2E6C4;margin:0;padding:30px}main{max-width:720px;margin:auto;background:#10263a;border:1px solid #C9A24A;border-radius:16px;padding:24px}
h1{color:#F3D58A;margin-top:0}label{display:block;margin:12px 0 4px;color:#E9D9A8}input,select{width:100%;box-sizing:border-box;padding:10px;border-radius:8px;border:1px solid #C9A24A;background:#0B1B2B;color:#fff;font:inherit}
button{margin-top:16px;padding:12px 20px;border:0;border-radius:10px;background:linear-gradient(180deg,#F3D58A,#C9A24A);color:#0B1B2B;font-weight:700;cursor:pointer}
textarea{width:100%;box-sizing:border-box;min-height:110px;margin-top:12px;direction:ltr;font-family:monospace;background:#0B1B2B;color:#F3D58A;border:1px solid #C9A24A;border-radius:8px;padding:10px}.err{color:#ff9b9b}</style>
<main><h1>مُفعِّل ميثاق</h1><p>أدخل بصمة الجهاز كما تظهر في شاشة التفعيل لدى المكتب.</p>
<label>بصمة الجهاز</label><input id="fp" dir="ltr" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX">
<label>اسم المكتب</label><input id="office"><label>النسخة</label><select id="edition"><option value="private">ميثاق خاص (بلا إنترنت)</option><option value="connected">ميثاق متصل</option></select>
<label>عدد المستخدمين</label><input id="users" type="number" value="5" min="1"><label>تاريخ الانتهاء (اختياري)</label><input id="exp" type="date">
<button id="go">إصدار كود التفعيل</button><p id="msg"></p><textarea id="out" readonly placeholder="يظهر الكود هنا"></textarea></main>
<script>go.onclick=async()=>{msg.textContent='';out.value='';const r=await fetch('/issue',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({fp:fp.value,office:office.value,edition:edition.value,users:users.value,exp:exp.value})});const j=await r.json();if(!r.ok){msg.className='err';msg.textContent=j.error;return}out.value=j.code;out.select();msg.className='';msg.textContent='صدر الكود وسُجّل في issued.csv'}</script></html>`;
function serve() {
  const port = Number(arg('port', 8777));
  http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(PAGE) }
    if (req.method === 'POST' && req.url === '/issue') {
      let b = ''; req.on('data', c => { b += c; if (b.length > 4096) req.destroy() }); req.on('end', () => {
        try { const r = issue(JSON.parse(b || '{}')); res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ code: r.code })) }
        catch (e) { res.writeHead(400, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: e.message })) }
      }); return;
    }
    res.writeHead(404); res.end();
  }).listen(port, '127.0.0.1', () => console.log('مُفعِّل ميثاق: http://127.0.0.1:' + port));
}
try {
  if (cmd === 'init') init();
  else if (cmd === 'issue') { const r = issue({ fp: arg('fp'), office: arg('office'), edition: arg('edition'), users: arg('users'), exp: arg('exp') }); console.log(r.code) }
  else if (cmd === 'serve') serve();
  else if (cmd === 'list') console.log(fs.existsSync(REG) ? fs.readFileSync(REG, 'utf8') : 'لا سجل بعد');
  else console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 6).join('\n'));
} catch (e) { console.error('خطأ:', e.message); process.exit(1) }
