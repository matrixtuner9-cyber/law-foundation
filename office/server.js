// خادم ميثاق: يقدّم شاشة المكتب (بعد تسجيل الدخول) وبوابة الموكل (Flutter) وواجهة برمجية للرسائل والملفات
// التخزين في قاعدة SQLite مدمجة داخل مجلد data، مع مستخدمين وأدوار وسجل تدقيق متسلسل.
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const PORT = process.env.PORT || 8080, ROOT = __dirname;
const DATA = process.env.MQ_DATA || path.join(ROOT, 'data'), MEDIA = path.join(DATA, 'media'), PORTAL = path.join(ROOT, 'portal');
fs.mkdirSync(MEDIA, { recursive: true });

const SEED = require('./data.js');
const Store = require('./lib/db'), Auth = require('./lib/auth'), Merge = require('./lib/merge');
const OFFICE = { name: 'مكتب الميثاق للمحاماة والاستشارات القانونية', lawyer: 'المحامي سامر عبد الله', city: 'نابلس', phone: '09-233-0000', hours: 'الأحد – الخميس · 8:30 – 16:00' };
const STATE_F = path.join(DATA, 'state.json'), MSG_F = path.join(DATA, 'messages.json');
const VAPID_F = path.join(DATA, 'vapid.json'), PUSH_F = path.join(DATA, 'push.json');

/* ── أدوات عامة ── */
const rid = () => crypto.randomBytes(6).toString('hex');
const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')) } catch (e) { return d } };
const save = (f, obj) => { const t = f + '.tmp'; fs.writeFileSync(t, JSON.stringify(obj, null, 1)); fs.renameSync(t, f) };
const pad = n => String(n).padStart(2, '0');
const stamp = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
const stampS = (d = new Date()) => stamp(d) + ':' + pad(d.getSeconds());

/* ── قاعدة البيانات + نقل البيانات القديمة (JSON) مرة واحدة ── */
const store = Store.open(DATA), auth = Auth.create(store);
const audit = (e) => { try { store.audit({ at: stampS(), ...e }) } catch (err) { console.error('[audit]', err.message) } };
(function migrate() {
  if (store.kv.get('migrated_v1')) return;
  const st = readJSON(STATE_F, null); let ms = readJSON(MSG_F, null);
  if (!ms) { ms = []; for (const [c, list] of Object.entries(SEED.messages)) list.forEach(m => ms.push({ id: rid(), client: c, from: m.f === 'them' ? 'client' : 'lawyer', type: 'text', text: m.t, ch: m.ch, at: m.at, read: !m.unread, seen: true })) }
  store.tx(() => { if (st) store.saveState(null, st, 'migration', stampS()); ms.forEach(store.putMessage); store.kv.set('migrated_v1', true) });
  for (const f of [STATE_F, MSG_F]) if (fs.existsSync(f)) fs.renameSync(f, f + '.migrated-backup');
  audit({ action: 'system.migrate', detail: { state: !!st, records: st ? Store.COLL.reduce((n, c) => n + ((st[c] || []).length), 0) : 0, messages: ms.length } });
  console.log('نُقلت البيانات إلى قاعدة البيانات mithaq.db');
})();
/* إصلاح لمرة واحدة: سجلات بلا معرّف (المهل) لم تُنقل في الإصدار الأول من النقل */
(function repairNoId() {
  if (store.kv.get('repair_noid_v1')) return;
  const bak = readJSON(STATE_F + '.migrated-backup', null), cur0 = store.loadState();
  if (bak && cur0) {
    const next = JSON.parse(JSON.stringify(cur0)); let added = 0;
    for (const k of Store.COLL) {
      const have = new Set((next[k] || []).map(x => JSON.stringify({ ...x, id: undefined })));
      for (const x of bak[k] || []) if (x.id == null && !have.has(JSON.stringify({ ...x, id: undefined }))) { (next[k] = next[k] || []).push({ ...x }); added++ }
    }
    if (added) { store.saveState(cur0, next, 'system', stampS()); audit({ action: 'system.repair', detail: { records: added, note: 'سجلات بلا معرّف (المهل)' } }) }
  }
  store.kv.set('repair_noid_v1', true);
})();
let state = store.loadState();
const msgs = store.loadMessages();
const settings = () => ({ edition: 'office', officeName: OFFICE.name, lawyerName: OFFICE.lawyer, city: OFFICE.city, phone: OFFICE.phone, hours: OFFICE.hours, ...store.kv.get('settings', {}) });
/* بيانات المكتب كما تظهر للموكلين: من الإعدادات */
const officeInfo = () => { const s = settings(); return { name: s.officeName, lawyer: s.lawyerName, city: s.city, phone: s.phone, hours: s.hours } };

/* مدد الطعن: جدول قابل للتعديل من مدير النظام. القيم الافتراضية متحقق منها من أحكام منشورة إلا ما عُلّم verified:false */
const DEFAULT_RULES = [
  { id: 'civ-appeal', name: 'استئناف حكم حقوقي', nature: 'civil', to: 'استئناف', from: ['صلح', 'بداية'], urgent: false, days: 30, start: 'judgment', ref: 'م205/1 وم193 من قانون أصول المحاكمات المدنية والتجارية رقم 2 لسنة 2001', verified: true },
  { id: 'civ-appeal-urgent', name: 'استئناف في المواد المستعجلة', nature: 'civil', to: 'استئناف', from: ['صلح', 'بداية'], urgent: true, days: 15, start: 'judgment', ref: 'م205/2 من قانون أصول المحاكمات المدنية والتجارية', verified: true },
  { id: 'civ-cassation', name: 'نقض حكم حقوقي', nature: 'civil', to: 'نقض', from: ['استئناف'], urgent: false, days: 40, start: 'judgment', ref: 'م227 وم193/1 من قانون أصول المحاكمات المدنية والتجارية', verified: true },
  { id: 'crim-appeal', name: 'استئناف حكم جزائي', nature: 'criminal', to: 'استئناف', from: ['صلح', 'بداية'], urgent: false, days: 15, start: 'judgment', ref: 'م328 من قانون الإجراءات الجزائية رقم 3 لسنة 2001 المعدلة بالقرار بقانون 17 لسنة 2014', verified: true },
  { id: 'crim-cassation', name: 'نقض حكم جزائي', nature: 'criminal', to: 'نقض', from: ['استئناف'], urgent: false, days: 40, start: 'judgment', ref: 'قانون الإجراءات الجزائية رقم 3 لسنة 2001 (يحتاج تأكيد المادة والمدة)', verified: false },
];
const rules = () => { const saved = store.kv.get('appeal_rules', {}); return DEFAULT_RULES.map(r => ({ ...r, ...(saved[r.id] || {}) })) };

/* ── إشعارات الدفع (Web Push) ── */
let webpush = null;
try { webpush = require('web-push') } catch (e) { console.log('تنبيه: مكتبة web-push غير مثبتة.') }
let vapid = readJSON(VAPID_F, null), pushSubs = readJSON(PUSH_F, {});
if (webpush) { if (!vapid) { vapid = webpush.generateVAPIDKeys(); save(VAPID_F, vapid) } webpush.setVapidDetails('mailto:office@mithaq.ps', vapid.publicKey, vapid.privateKey) }
const pushCount = () => Object.fromEntries(Object.entries(pushSubs).map(([k, v]) => [k, v.length]));
function preview(m) {
  if (m.type === 'voice') return 'رسالة صوتية (' + Math.floor((m.dur || 0) / 60) + ':' + String(Math.round(m.dur || 0) % 60).padStart(2, '0') + ')';
  if (m.type === 'image') return 'أرسل لك صورة' + (m.text ? ': ' + m.text : '');
  if (m.type === 'file') return 'أرسل لك مستنداً: ' + (m.name || '');
  return String(m.text || '').slice(0, 160);
}
function pushTo(client, payload) {
  if (!webpush) return;
  (pushSubs[client] || []).forEach(s => webpush.sendNotification(s, JSON.stringify(payload), { TTL: 86400, urgency: 'high' })
    .catch(err => { if (err.statusCode === 404 || err.statusCode === 410) { pushSubs[client] = (pushSubs[client] || []).filter(x => x.endpoint !== s.endpoint); save(PUSH_F, pushSubs); broadcast('push', pushCount()) } }));
}

/* ── الربط مع ميزان ── */
const vault = require('./mizan/vault'), { match: mzMatch } = require('./mizan/match'), { spawn } = require('child_process');
const MZ_STATUS_F = path.join(DATA, 'mizan', 'status.json');
let mz = readJSON(MZ_STATUS_F, {}), mzRun = null;
function mzStatus() {
  const i = vault.info();
  return { configured: !!i, cred: i && { user: i.user.replace(/.(?=.{3})/g, '•'), savedAt: i.savedAt, method: i.method }, running: !!mzRun, last: mz.last || null, captures: mz.captures || 0 };
}
function mzStart(mode, show) {
  if (mzRun) return false;
  const args = [path.join(ROOT, 'mizan', 'connector.js'), mode]; if (show) args.push('--show');
  const ch = spawn(process.execPath, args, { cwd: ROOT, windowsHide: true, env: { ...process.env, ...(process.versions.electron ? { ELECTRON_RUN_AS_NODE: '1' } : {}) } }); mzRun = ch; let buf = '', done = false;
  broadcast('mizan', { stage: 'start', msg: mode === 'capture' ? 'بدء قراءة صفحات القضايا من ميزان…' : 'بدء تجربة الدخول إلى ميزان…' });
  ch.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1);
    try { const o = JSON.parse(line); if (o.done) { done = true; mz.last = { ok: o.ok, mode, at: stamp(), error: o.error || null }; if (o.ok && mode === 'capture') mz.captures = (mz.captures || 0) + 1; save(MZ_STATUS_F, mz); audit({ action: 'mizan.result', detail: { mode, ok: o.ok, error: o.error || null } }) } broadcast('mizan', o) } catch (e) {} } });
  ch.stderr.on('data', d => console.error('[mizan]', String(d).trim().slice(0, 300)));
  ch.on('exit', () => { mzRun = null; if (!done) { mz.last = { ok: false, mode, at: stamp(), error: 'توقف الموصل بشكل غير متوقع.' }; save(MZ_STATUS_F, mz); broadcast('mizan', { done: true, ok: false, error: mz.last.error }) } broadcast('mizan', { stage: 'exit', status: mzStatus() }) });
  return true;
}
const backup = require('./lib/backup').create({ store, DATA, audit: e => audit(e), stampS });
if (process.env.MQ_BACKUP !== 'off') backup.schedule();
const bar = require('./lib/bar').create({ store, DATA, ROOT, audit: e => audit(e), broadcast: (t, p) => broadcast(t, p), stampS });
const isLocal = req => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress) && !req.headers['cf-connecting-ip'];
/* نطاق المكتب عبر الإنترنت (بموافقة المالك): يفتح شاشة المحامي فقط إذا مرّ الطلب عبر Cloudflare Access،
   وإلا يُرفض. أي نطاق آخر عبر النفق يرى بوابة الموكل فقط. */
const OFFICE_HOSTS = String(process.env.MQ_OFFICE_HOSTS || 'office.palgaz.net').toLowerCase().split(',').map(x => x.trim()).filter(Boolean);
const viaTunnel = req => !!(req.headers['cf-connecting-ip'] || req.headers['cf-ray']);
const officeHost = req => OFFICE_HOSTS.includes(String(req.headers.host || '').toLowerCase().split(':')[0]);
const sec = (req, c) => viaTunnel(req) ? c + '; Secure' : c;
const sockIp = req => String(req.socket.remoteAddress || '').replace('::ffff:', '');
/* عنوان الزائر: نثق بترويسة Cloudflare فقط إن جاء الطلب من النفق على الجهاز نفسه، وإلا يمكن لأي جهاز في الشبكة تزويرها */
const ipOf = req => (['127.0.0.1', '::1'].includes(sockIp(req)) && req.headers['cf-connecting-ip']) || sockIp(req);

const cur = () => state || { clients: SEED.clients, opponents: SEED.opponents, cases: SEED.cases, hearings: SEED.hearings, deadlines: SEED.deadlines, docs: SEED.docs, mzLog: SEED.mzLog };
const pub = m => ({ ...m, file: m.file ? '/api/media/' + m.file : null });
const labelOf = r => r && (r.name || r.no || r.title || r.purpose || r.subject || r.id);

/* ── الصلاحيات حسب الدور: المحامي الخارجي يرى القضايا المسندة إليه فقط ── */
function scope(u, S) {
  if (auth.can(u, 'all')) return S;
  const ids = new Set(u.cases || []), cases = S.cases.filter(k => ids.has(k.id));
  const cl = new Set(cases.map(k => k.client)), op = new Set(cases.flatMap(k => k.opps || []));
  return { clients: S.clients.filter(c => cl.has(c.id)), opponents: S.opponents.filter(o => op.has(o.id)), cases,
    hearings: S.hearings.filter(h => ids.has(h.k)), deadlines: S.deadlines.filter(d => ids.has(d.k)), docs: S.docs.filter(d => ids.has(d.k)), mzLog: (S.mzLog || []).filter(l => ids.has(l.k)) };
}
const canSeeClient = (u, cid) => auth.can(u, 'all') || cur().cases.some(k => k.client === cid && (u.cases || []).includes(k.id));

/* ── البث المباشر لشاشة المكتب (SSE) لكل مستخدم ما يحق له رؤيته ── */
const streams = new Map();
function broadcast(type, payload) {
  const s = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  streams.forEach((u, r) => {
    if (type === 'mizan' && u.role !== 'admin') return;
    if (payload && payload.client && !canSeeClient(u, payload.client)) return;
    r.write(s);
  });
}
setInterval(() => streams.forEach((u, r) => r.write(': ping\n\n')), 25000);
/* بث السجلات المعدّلة لزملاء المكتب فوراً، فلا يعمل أحد على نسخة قديمة (المحامي الخارجي يراها عند إعادة التحميل) */
function broadcastRecords(recs, byId, del = []) {
  if (!recs.length && !del.length) return;
  const s = `event: records\ndata: ${JSON.stringify({ by: byId, recs, del })}\n\n`;
  streams.forEach((u, r) => { if (auth.can(u, 'all')) r.write(s) });
}

function addMsg(m) {
  const msg = { id: rid(), at: stamp(), read: m.from === 'lawyer', seen: m.from === 'client', ...m }; msgs.push(msg); store.putMessage(msg); broadcast('message', pub(msg));
  if (msg.from === 'lawyer') pushTo(msg.client, { title: msg.type === 'notice' ? 'إشعار من ' + officeInfo().name : 'رسالة من ' + officeInfo().lawyer, body: preview(msg), tag: 'mq-' + msg.id, url: './' });
  return msg;
}

/* ── أدوات HTTP ── */
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.wasm': 'application/wasm', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.webm': 'audio/webm', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.mp4': 'audio/mp4', '.aac': 'audio/aac', '.wav': 'audio/wav', '.map': 'application/json', '.frag': 'text/plain', '.bin': 'application/octet-stream', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.heic': 'image/heic', '.pdf': 'application/pdf', '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.txt': 'text/plain; charset=utf-8', '.rtf': 'application/rtf', '.odt': 'application/vnd.oasis.opendocument.text' };
const FILE_EXT = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heic', 'image/gif': 'gif', 'application/pdf': 'pdf', 'application/msword': 'doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx', 'application/vnd.ms-excel': 'xls', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx', 'text/plain': 'txt' };
const EXT_OK = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'rtf', 'odt']);
const AUDIO_EXT = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/m4a': 'm4a', 'audio/x-m4a': 'm4a', 'audio/aac': 'aac', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/mpeg': 'mp3' };
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type, x-client', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
const SEC = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'SAMEORIGIN' };
function json(res, code, obj, extra = {}) { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...CORS, ...SEC, ...extra }); res.end(JSON.stringify(obj)) }
function body(req, limit = 15 * 1024 * 1024) {
  return new Promise((ok, bad) => { const chunks = []; let n = 0;
    req.on('data', c => { n += c.length; if (n > limit) { bad(new Error('too large')); req.destroy() } else chunks.push(c) });
    req.on('end', () => ok(Buffer.concat(chunks))); req.on('error', bad) });
}
const jbody = async (req, limit = 4 * 1024 * 1024) => { try { return JSON.parse((await body(req, limit)).toString('utf8') || '{}') } catch (e) { return {} } };
function sendFile(req, res, file) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, CORS); return res.end('Not found') }
    const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
    if (range) {
      const start = range[1] ? +range[1] : 0, end = range[2] ? Math.min(+range[2], st.size - 1) : st.size - 1;
      if (!st.size || start > end || start >= st.size) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}`, ...CORS }); return res.end() } // نطاق خاطئ كان يُسقط الخادم
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, ...CORS });
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store', ...CORS, ...SEC });
    fs.createReadStream(file).pipe(res);
  });
}

/* ── بيانات بوابة الموكل ── */
function clientByCode(code) { return cur().clients.find(x => (x.code || '').toUpperCase() === String(code || '').trim().toUpperCase()) }
/* صفحة رابط الدخول المرسل عبر واتساب: تتحقق من الرمز ثم تحفظه لبوابة الموكل وتفتحها */
const PLINK = code => `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta name="referrer" content="no-referrer"><title>الدخول إلى بوابة الموكل</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F9F6EF;color:#111B27;font-family:Cairo,Tahoma,sans-serif}.c{background:#fff;border:1px solid #EADCC6;border-radius:16px;padding:28px 24px;max-width:360px;width:calc(100% - 32px);text-align:center;box-shadow:0 10px 30px rgb(11 27 43 / .08)}h1{font-size:20px;margin:6px 0 10px}p{color:#6B7280;margin:0 0 16px;line-height:1.7}.s{width:34px;height:34px;border:3px solid #EADCC6;border-top-color:#B9965A;border-radius:50%;margin:8px auto;animation:r 1s linear infinite}@keyframes r{to{transform:rotate(1turn)}}a{display:inline-block;background:#0B1B2B;color:#F9F6EF;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:700}</style></head>
<body><div class="c" id="c"><div class="s"></div><h1>جارٍ تسجيل دخولك…</h1><p>لحظات ونفتح لك بوابة الموكل.</p></div>
<script>(async()=>{const code=${JSON.stringify(code)},c=document.getElementById('c');
const fail=m=>{c.innerHTML='<h1>تعذّر الدخول</h1><p>'+m+'</p><a href="/portal/">الدخول برمز الموكل</a>'};
try{const r=await fetch('/api/portal/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code})});const j=await r.json().catch(()=>({}));
if(!r.ok)return fail(j.error||'الرابط غير صالح أو منتهي.');
localStorage.setItem('flutter.code',JSON.stringify(j.code||code));history.replaceState(null,'','/portal/');location.replace('/portal/')}catch(e){fail('تحقق من اتصالك بالإنترنت ثم أعد فتح الرابط.')}})()</script></body></html>`;

function portalHome(cl) {
  const S = cur();
  const cases = S.cases.filter(k => k.client === cl.id).map(k => {
    const court = SEED.courts.find(c => c.id === k.court);
    const hs = S.hearings.filter(h => h.k === k.id).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    return { id: k.id, no: k.no, subject: k.subject, type: k.type, role: k.role, stage: k.stage, step: k.step, status: k.status, court: court ? court.name : '',
      opponents: k.opps.map(o => (S.opponents.find(x => x.id === o) || {}).name).filter(Boolean),
      hearings: hs.map(h => ({ date: h.date, time: h.time, purpose: h.purpose, result: h.result || null, attend: !!h.attend })) };
  });
  const docs = S.docs.filter(d => d.shared && cases.some(k => k.id === d.k)).sort((a, b) => b.date.localeCompare(a.date))
    .map(d => ({ title: d.title, kind: d.kind, date: d.date, pages: d.pages, caseNo: (S.cases.find(k => k.id === d.k) || {}).no }));
  return { client: { id: cl.id, name: cl.name, code: cl.code, type: cl.type, fee: cl.fee, paid: cl.paid, ch: cl.ch, phone: cl.phone || '', phone2: cl.phone2 || '', whatsapp: cl.whatsapp || '' }, office: officeInfo(), steps: SEED.STEPS, cases, docs };
}
function ensureState() { if (!state) { state = JSON.parse(JSON.stringify(cur())); store.saveState(null, state, 'system', stampS()) } }
function touchClient(cl) { if (!state) return; const c = state.clients.find(x => x.id === cl.id); if (c) { c.last = stamp().slice(0, 10); c._v = (c._v || 0) + 1; store.putRecord('clients', c, 'portal:' + cl.code, stampS()); broadcastRecords([{ kind: 'clients', rec: c }], null) } }

/* محاولات فاشلة على البوابة لكل عنوان IP: 20 خطأ خلال 15 دقيقة توقف العنوان (يشمل كل مسارات البوابة، لا الدخول فقط) */
const pfails = new Map();
const pBlocked = ip => { const t = pfails.get(ip); return !!t && Date.now() - t.at < 15 * 60e3 && t.n >= 20 };
const pFail = ip => { const now = Date.now(), t = pfails.get(ip); if (!t || now - t.at > 15 * 60e3) pfails.set(ip, { n: 1, at: now }); else t.n++; if (pfails.size > 5000) for (const [k, v] of pfails) if (now - v.at > 15 * 60e3) pfails.delete(k) };

/* محاولات الدخول لكل عنوان IP (حماية من التخمين) */
const tries = new Map();
function throttled(ip) { const now = Date.now(), t = tries.get(ip) || { n: 0, at: now }; if (now - t.at > 10 * 60e3) { t.n = 0; t.at = now } t.n++; tries.set(ip, t); return t.n > 30 }

/* ── التوجيه ── */
async function api(req, res, u) {
  const p = u.pathname, M = req.method, ip = ipOf(req);
  if (M === 'OPTIONS') { res.writeHead(204, CORS); return res.end() }
  if (p === '/api/health') return json(res, 200, { ok: true, at: stamp() });
  if (p === '/api/portal/push-key') return json(res, 200, { enabled: !!webpush, key: vapid ? vapid.publicKey : null });

  // ملفات الرسائل الصوتية والمرفقات (أسماؤها عشوائية غير قابلة للتخمين)
  if (p.startsWith('/api/media/')) { const f = path.basename(p); return sendFile(req, res, path.join(MEDIA, f)) }

  /* ── بوابة الموكل ── */
  if (p.startsWith('/api/portal/') && pBlocked(ip)) return json(res, 429, { error: 'محاولات كثيرة. حاول بعد قليل.' });
  if (p === '/api/portal/login' && M === 'POST') {
    if (throttled(ip)) return json(res, 429, { error: 'محاولات كثيرة. حاول بعد قليل.' });
    const { code } = await jbody(req); const cl = clientByCode(code);
    if (!cl) { pFail(ip); return json(res, 401, { error: 'رمز الدخول غير صحيح. تأكد من الرمز الذي وصلك من المكتب.' }) }
    if (!cl.portal) return json(res, 403, { error: 'البوابة غير مفعّلة لحسابك بعد. تواصل مع المكتب لتفعيلها.' });
    touchClient(cl); audit({ username: 'portal:' + cl.code, action: 'portal.login', entity: 'clients', entity_id: cl.id, detail: { label: cl.name }, ip });
    return json(res, 200, { ok: true, name: cl.name, code: cl.code });
  }
  if (p.startsWith('/api/portal/')) {
    const cl = clientByCode(req.headers['x-client'] || u.searchParams.get('code'));
    if (!cl || !cl.portal) { if (!cl) pFail(ip); return json(res, 401, { error: 'انتهت الجلسة، يرجى الدخول من جديد.' }) }
    const who = { username: 'portal:' + cl.code, ip };
    if (p === '/api/portal/home') return json(res, 200, portalHome(cl));
    if (p === '/api/portal/profile' && M === 'POST') {
      const b = await jbody(req), ok = v => /^[+\d][\d\s-]{5,19}$/.test(v), clean = v => String(v || '').trim().slice(0, 20);
      const upd = { phone: clean(b.phone), phone2: clean(b.phone2), whatsapp: clean(b.whatsapp) };
      if (Object.values(upd).some(v => v && !ok(v))) return json(res, 400, { error: 'تحقق من الأرقام: أرقام فقط، ويمكن أن تبدأ بـ +' });
      ensureState();
      const c = state.clients.find(x => x.id === cl.id), before = { ...c }; Object.assign(c, upd); c._v = (c._v || 0) + 1; store.putRecord('clients', c, who.username, stampS()); broadcastRecords([{ kind: 'clients', rec: c }], null);
      audit({ ...who, action: 'record.update', entity: 'clients', entity_id: c.id, detail: { label: c.name, fields: Store.diffFields(before, c), via: 'portal' } });
      broadcast('profile', { client: cl.id, ...upd });
      return json(res, 200, upd);
    }
    if (p === '/api/portal/push-subscribe' && M === 'POST') {
      const s = await jbody(req); if (!s || !s.endpoint || !s.keys) return json(res, 400, { error: 'اشتراك غير صالح' });
      const list = (pushSubs[cl.id] = pushSubs[cl.id] || []); if (!list.some(x => x.endpoint === s.endpoint)) { list.push({ endpoint: s.endpoint, keys: s.keys }); save(PUSH_F, pushSubs); broadcast('push', pushCount()) }
      return json(res, 200, { ok: true });
    }
    if (p === '/api/portal/messages' && M === 'GET') {
      const changed = [];
      if (!u.searchParams.get('peek')) msgs.forEach(m => { if (m.client === cl.id && m.from === 'lawyer' && !m.seen) { m.seen = true; changed.push(m) } });
      if (changed.length) { store.putMessages(changed); broadcast('seen', { client: cl.id }) }
      return json(res, 200, msgs.filter(m => m.client === cl.id).map(pub));
    }
    if (p === '/api/portal/messages' && M === 'POST') {
      const { text } = await jbody(req); const t = String(text || '').trim().slice(0, 4000);
      if (!t) return json(res, 400, { error: 'الرسالة فارغة.' });
      const m = addMsg({ client: cl.id, from: 'client', type: 'text', text: t, ch: 'البوابة' });
      audit({ ...who, action: 'message.receive', entity: 'messages', entity_id: m.id, detail: { client: cl.id, label: cl.name, type: 'text' } });
      return json(res, 201, pub(m));
    }
    if (p === '/api/portal/voice' && M === 'POST') return voice(req, res, u, cl.id, 'client', who);
    if (p === '/api/portal/file' && M === 'POST') return attach(req, res, u, cl.id, 'client', who);
    return json(res, 404, { error: 'not found' });
  }

  /* ── تسجيل الدخول لشاشة المكتب ── */
  if (p === '/api/auth/status') return json(res, 200, { setup: !auth.hasUsers(), local: isLocal(req), office: settings().officeName, lawyer: settings().lawyerName });
  if (p === '/api/auth/setup' && M === 'POST') {
    if (auth.hasUsers()) return json(res, 409, { error: 'تم إعداد النظام مسبقاً.' });
    if (!isLocal(req)) return json(res, 403, { error: 'إنشاء حساب المدير الأول متاح من جهاز المكتب فقط.' });
    const b = await jbody(req);
    let user; try { user = auth.createUser({ username: b.username, name: b.name, role: 'admin', password: b.password }, stampS()) } catch (e) { return json(res, 400, { error: e.message }) }
    audit({ user_id: user.id, username: user.username, action: 'auth.setup', entity: 'users', entity_id: user.id, detail: { label: user.name }, ip });
    const r = auth.login(b.username, b.password, ip, req.headers['user-agent'], stampS());
    audit({ user_id: user.id, username: user.username, action: 'auth.login', ip });
    return json(res, 200, { user: r.user }, { 'Set-Cookie': sec(req, auth.cookie(r.token)) });
  }
  if (p === '/api/auth/login' && M === 'POST') {
    if (throttled(ip)) return json(res, 429, { error: 'محاولات كثيرة من هذا الجهاز. حاول بعد 10 دقائق.' });
    const b = await jbody(req), r = auth.login(b.username, b.password, ip, req.headers['user-agent'], stampS());
    if (r.error) {
      audit({ user_id: r.user && r.user.id, username: String(b.username || '').slice(0, 40), action: r.locked ? 'auth.locked' : 'auth.login_failed', ip });
      return json(res, 401, { error: r.error });
    }
    audit({ user_id: r.user.id, username: r.user.username, action: 'auth.login', ip });
    return json(res, 200, { user: r.user }, { 'Set-Cookie': sec(req, auth.cookie(r.token)) });
  }
  if (p === '/api/auth/logout' && M === 'POST') {
    const me = auth.fromReq(req); if (me) { auth.logout(me.token); audit({ user_id: me.id, username: me.username, action: 'auth.logout', ip }) }
    return json(res, 200, { ok: true }, { 'Set-Cookie': sec(req, auth.clearCookie()) });
  }

  /* كل ما بعد هذا يتطلب مستخدماً مسجلاً */
  const me = auth.fromReq(req);
  if (!me) return json(res, 401, { error: 'انتهت الجلسة. سجّل الدخول من جديد.', login: true });
  const who = { user_id: me.id, username: me.username, ip };
  const need = what => { if (!auth.can(me, what)) { json(res, 403, { error: 'لا تملك صلاحية لهذا الإجراء.' }); return false } return true };

  if (p === '/api/auth/me') return json(res, 200, { user: { ...me, token: undefined }, roles: Object.fromEntries(Object.entries(auth.ROLES).map(([k, v]) => [k, v.label])), settings: settings() });
  if (p === '/api/me/password' && M === 'POST') {
    const b = await jbody(req);
    if (!auth.checkPassword(me.id, b.current)) return json(res, 400, { error: 'كلمة المرور الحالية غير صحيحة.' });
    try { auth.setPassword(me.id, b.password, false) } catch (e) { return json(res, 400, { error: e.message }) }
    audit({ ...who, action: 'user.password_change', entity: 'users', entity_id: me.id });
    return json(res, 200, { ok: true });
  }

  // البث المباشر لشاشة المكتب
  if (p === '/api/stream') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
    res.write('retry: 3000\n\n'); streams.set(res, me); req.on('close', () => streams.delete(res)); return;
  }

  /* الإعدادات */
  if (p === '/api/settings' && M === 'GET') return json(res, 200, settings());
  /* النسخ الاحتياطي: حالة آخر نسخة، وتشغيل يدوي */
  if (p === '/api/backup/status') { if (!need('manage')) return; return json(res, 200, backup.status()) }
  if (p === '/api/backup/run' && M === 'POST') { if (!need('manage')) return; const r = backup.run('manual:' + me.username); return json(res, r.ok ? 200 : 500, r.ok ? r : { error: 'تعذّر النسخ الاحتياطي: ' + r.error }) }
  if (p === '/api/settings' && M === 'POST') {
    if (!need('manage')) return;
    const b = await jbody(req), before = settings();
    const t = (v, d, n) => String(v == null ? d : v).trim().slice(0, n) || d;
    const next = { edition: ['office', 'insurance'].includes(b.edition) ? b.edition : before.edition, officeName: t(b.officeName, before.officeName, 120), lawyerName: t(b.lawyerName, before.lawyerName, 80), city: t(b.city, before.city, 40), phone: t(b.phone, before.phone, 30), hours: t(b.hours, before.hours, 80) };
    store.kv.set('settings', next);
    audit({ ...who, action: 'settings.update', detail: { fields: Store.diffFields(before, next) } });
    return json(res, 200, settings());
  }

  /* دليل محامي النقابة (نسخة من الصفحة العامة) */
  if (p === '/api/bar' && M === 'GET') { const s = u.searchParams; return json(res, 200, bar.search({ q: s.get('q') || '', city: s.get('city') || '', status: s.get('status') || '', phone: s.get('phone') || '', offset: s.get('offset'), limit: s.get('limit') })) }
  if (p === '/api/bar/status') return json(res, 200, bar.status());
  if (p === '/api/bar/refresh' && M === 'POST') {
    if (!need('manage')) return;
    if (!isLocal(req)) return json(res, 403, { error: 'التحديث متاح من جهاز المكتب فقط.' });
    if (!bar.refresh(who)) return json(res, 409, { error: 'التحديث قيد التنفيذ.' });
    return json(res, 202, bar.status());
  }

  /* مدد الطعن */
  if (p === '/api/rules' && M === 'GET') return json(res, 200, rules());
  if (p === '/api/rules' && M === 'POST') {
    if (!need('manage')) return;
    const b = await jbody(req), before = rules(), saved = store.kv.get('appeal_rules', {}), changes = [];
    for (const r of Array.isArray(b) ? b : []) {
      const d = DEFAULT_RULES.find(x => x.id === r.id); if (!d) continue;
      const days = Math.round(+r.days); if (!(days >= 1 && days <= 365)) return json(res, 400, { error: 'المدة يجب أن تكون بين 1 و365 يوماً.' });
      const next = { days, verified: !!r.verified, ref: String(r.ref || d.ref).slice(0, 200) }, old = before.find(x => x.id === r.id);
      const f = Store.diffFields({ days: old.days, verified: old.verified, ref: old.ref }, next);
      if (f.length) { saved[r.id] = next; changes.push({ id: r.id, name: d.name, fields: f }) }
    }
    store.kv.set('appeal_rules', saved);
    changes.forEach(c => audit({ ...who, action: 'rules.update', entity: 'rules', entity_id: c.id, detail: { label: c.name, fields: c.fields } }));
    return json(res, 200, rules());
  }

  /* المستخدمون (مدير النظام فقط) */
  if (p === '/api/users' && M === 'GET') { if (!need('manage')) return; return json(res, 200, auth.list()) }
  if (p === '/api/users' && M === 'POST') {
    if (!need('manage')) return;
    const b = await jbody(req);
    let user; try { user = auth.createUser({ username: b.username, name: b.name, role: b.role, password: b.password, cases: Array.isArray(b.cases) ? b.cases : [], mustChange: true }, stampS()) } catch (e) { return json(res, 400, { error: e.message }) }
    audit({ ...who, action: 'user.create', entity: 'users', entity_id: user.id, detail: { label: user.name, username: user.username, role: user.role, cases: user.cases } });
    return json(res, 201, user);
  }
  const um = /^\/api\/users\/([\w]+)(\/password)?$/.exec(p);
  if (um && M === 'POST') {
    if (!need('manage')) return;
    const b = await jbody(req);
    if (um[2]) {
      try { auth.setPassword(um[1], b.password, true); auth.logoutUser(um[1]) } catch (e) { return json(res, 400, { error: e.message }) }
      audit({ ...who, action: 'user.password_reset', entity: 'users', entity_id: um[1], detail: { label: (auth.get(um[1]) || {}).name } });
      return json(res, 200, { ok: true });
    }
    let r; try { r = auth.updateUser(um[1], { name: b.name, role: b.role, active: b.active, cases: Array.isArray(b.cases) ? b.cases : null }, me.id) } catch (e) { return json(res, 400, { error: e.message }) }
    const strip = x => ({ name: x.name, role: x.role, active: x.active, cases: x.cases });
    audit({ ...who, action: 'user.update', entity: 'users', entity_id: um[1], detail: { label: r.after.name, fields: Store.diffFields(strip(r.before), strip(r.after)) } });
    return json(res, 200, r.after);
  }

  /* سجل التدقيق (مدير النظام فقط) */
  if (p === '/api/audit') { if (!need('manage')) return; const s = u.searchParams; return json(res, 200, store.auditList({ limit: s.get('limit'), before: s.get('before'), action: s.get('action') || '', user: s.get('user') || '', text: s.get('q') || '' })) }
  if (p === '/api/audit/verify') { if (!need('manage')) return; return json(res, 200, store.auditVerify()) }

  /* الربط مع ميزان: لمدير النظام ومن جهاز المكتب فقط */
  if (p.startsWith('/api/mizan/')) {
    if (!need('manage')) return;
    if (!isLocal(req)) return json(res, 403, { error: 'إعدادات ميزان متاحة من جهاز المكتب فقط.' });
    if (p === '/api/mizan/status') return json(res, 200, mzStatus());
    if (p === '/api/mizan/credentials' && M === 'POST') {
      const { username, password } = await jbody(req);
      try { vault.save(username, password) } catch (e) { return json(res, 400, { error: e.message }) }
      audit({ ...who, action: 'mizan.credentials', detail: { user: String(username || '').replace(/.(?=.{3})/g, '•') } });
      return json(res, 200, mzStatus());
    }
    if (p === '/api/mizan/forget' && M === 'POST') {
      vault.forget(); fs.rmSync(path.join(vault.DIR, 'browser-profile'), { recursive: true, force: true });
      audit({ ...who, action: 'mizan.forget' });
      return json(res, 200, mzStatus());
    }
    if (p === '/api/mizan/run' && M === 'POST') {
      const { mode, show } = await jbody(req);
      if (!vault.info()) return json(res, 400, { error: 'احفظ بيانات الدخول إلى ميزان أولاً.' });
      if (!mzStart(mode === 'capture' ? 'capture' : 'test', !!show)) return json(res, 409, { error: 'عملية قراءة من ميزان قيد التنفيذ حالياً.' });
      audit({ ...who, action: 'mizan.run', detail: { mode: mode === 'capture' ? 'capture' : 'test' } });
      return json(res, 202, mzStatus());
    }
    if (p === '/api/mizan/match' && M === 'POST') {
      const { records } = await jbody(req); const S = cur();
      return json(res, 200, mzMatch(Array.isArray(records) ? records : [], { cases: S.cases.map(k => ({ ...k, courtName: (SEED.courts.find(c => c.id === k.court) || {}).name })), clients: S.clients, hearings: S.hearings }));
    }
    return json(res, 404, { error: 'not found' });
  }

  /* ── شاشة المكتب ── */
  if (p === '/api/admin/bootstrap') {
    const st = auth.can(me, 'all') ? state : scope(me, cur());
    return json(res, 200, { state: st, messages: msgs.filter(m => canSeeClient(me, m.client)).map(pub), push: pushCount(), pushReady: !!webpush, user: { ...me, token: undefined }, settings: settings() });
  }
  /* الحفظ الآمن: المتصفح يرسل السجلات المتغيرة فقط مع رقم إصدار كل سجل (lib/merge.js) */
  if (p === '/api/admin/state' && M === 'POST') {
    if (!need('write')) return;
    const b = await jbody(req, 25 * 1024 * 1024);
    const first = !state, at = stampS();
    const r = Merge.plan(state, b, { randomBytes: n => crypto.randomBytes(n), hashId: (k, x) => 'a' + crypto.createHash('sha1').update(k + JSON.stringify(x)).digest('hex').slice(0, 10) });
    if (!r) return json(res, 400, { error: 'طلب حفظ غير صالح' });
    store.applyWrites(r.writes, r.next.mzLog, me.username, at); state = r.next;
    if (first) audit({ ...who, action: 'state.init', detail: { records: r.writes.length } });
    else r.writes.forEach(c => audit({ ...who, action: 'record.' + c.op, entity: c.kind, entity_id: c.id, detail: { label: labelOf(c.rec), ...(c.fields ? { fields: c.fields } : {}) } }));
    r.codes.filter(([id]) => r.writes.some(w => w.op === 'create' && w.id === id)).forEach(([id]) => audit({ ...who, action: 'portal.code_issue', entity: 'clients', entity_id: id }));
    if (r.conflicts.length) audit({ ...who, action: 'state.conflict', detail: { n: r.conflicts.length, ids: r.conflicts.slice(0, 20).map(c => c.kind + ':' + c.id) } });
    broadcastRecords(r.writes.filter(w => w.op !== 'delete').map(w => ({ kind: w.kind, rec: w.rec })), String(req.headers['x-mq-tab'] || '').slice(0, 16) || null, r.writes.filter(w => w.op === 'delete').map(w => ({ kind: w.kind, id: w.id })));
    return json(res, 200, { ok: true, changed: r.writes.length, versions: r.versions, conflicts: r.conflicts, codes: r.codes });
  }
  /* تجديد رمز دخول موكل (عند الشك بتسريبه)، أو كل الرموز القديمة الضعيفة دفعة واحدة */
  if ((p === '/api/admin/client-code' || p === '/api/admin/rotate-weak') && M === 'POST') {
    if (!need(p.endsWith('weak') ? 'manage' : 'write')) return;
    if (!state) return json(res, 409, { error: 'لا توجد بيانات محفوظة بعد.' });
    const { client } = p.endsWith('weak') ? {} : await jbody(req);
    if (!p.endsWith('weak') && !state.clients.some(c => c.id === client)) return json(res, 404, { error: 'الموكل غير موجود' });
    const done = Merge.rotate(state, p.endsWith('weak') ? 'weak' : [client], { randomBytes: n => crypto.randomBytes(n) }), at = stampS();
    store.applyWrites(done.map(d => ({ op: 'update', kind: 'clients', id: d.rec.id, rec: d.rec })), undefined, me.username, at);
    done.forEach(d => audit({ ...who, action: 'portal.code_rotate', entity: 'clients', entity_id: d.rec.id, detail: { label: d.rec.name } }));
    broadcastRecords(done.map(d => ({ kind: 'clients', rec: d.rec })), null);
    return json(res, 200, { ok: true, n: done.length, clients: done.map(d => ({ id: d.rec.id, code: d.rec.code, _v: d.rec._v })) });
  }
  if (p === '/api/admin/messages' && M === 'POST') {
    if (!need('write')) return;
    const { client, text, ch, type } = await jbody(req); const t = String(text || '').trim().slice(0, 4000);
    if (!client || !t) return json(res, 400, { error: 'missing' });
    const m = addMsg({ client, from: 'lawyer', type: type === 'notice' ? 'notice' : 'text', text: t, ch: ch || 'البوابة', by: me.username });
    audit({ ...who, action: 'message.send', entity: 'messages', entity_id: m.id, detail: { client, label: (cur().clients.find(c => c.id === client) || {}).name, type: m.type, preview: t.slice(0, 80) } });
    return json(res, 201, pub(m));
  }
  if (p === '/api/admin/voice' && M === 'POST') { if (!need('write')) return; return voice(req, res, u, u.searchParams.get('client'), 'lawyer', who) }
  if (p === '/api/admin/file' && M === 'POST') { if (!need('write')) return; return attach(req, res, u, u.searchParams.get('client'), 'lawyer', who) }
  if (p === '/api/admin/read' && M === 'POST') {
    const { client } = await jbody(req);
    if (!canSeeClient(me, client)) return json(res, 403, { error: 'لا تملك صلاحية لهذا الموكل.' });
    const changed = []; msgs.forEach(m => { if (m.client === client && m.from === 'client' && !m.read) { m.read = true; changed.push(m) } });
    if (changed.length) { store.putMessages(changed); broadcast('read', { client }) }
    return json(res, 200, { ok: true, n: changed.length });
  }
  if (p === '/api/admin/reset' && M === 'POST') {
    if (!need('manage')) return;
    state = null; store.resetState(); audit({ ...who, action: 'state.reset' });
    return json(res, 200, { ok: true });
  }
  return json(res, 404, { error: 'not found' });
}

async function voice(req, res, u, client, from, who) {
  if (!client) return json(res, 400, { error: 'missing client' });
  const type = String(req.headers['content-type'] || 'audio/webm').split(';')[0].trim().toLowerCase();
  const ext = AUDIO_EXT[type]; if (!ext) return json(res, 415, { error: 'صيغة الصوت غير مدعومة: ' + type });
  let buf; try { buf = await body(req) } catch (e) { return json(res, 413, { error: 'الرسالة الصوتية أكبر من المسموح (15 ميغابايت).' }) }
  if (buf.length < 200) return json(res, 400, { error: 'التسجيل قصير جداً.' });
  const id = rid(), file = `${id}.${ext}`; fs.writeFileSync(path.join(MEDIA, file), buf);
  const dur = Math.max(1, Math.round(+u.searchParams.get('dur') || 0));
  const m = addMsg({ id, client, from, type: 'voice', file, dur, ch: 'البوابة', text: '', ...(from === 'lawyer' ? { by: who.username } : {}) });
  audit({ ...who, action: from === 'lawyer' ? 'message.send' : 'message.receive', entity: 'messages', entity_id: id, detail: { client, type: 'voice', dur, sha256: crypto.createHash('sha256').update(buf).digest('hex') } });
  return json(res, 201, pub(m));
}

// المرفقات: صور الكاميرا والمعرض والوثائق (PDF وWord وغيرها)
async function attach(req, res, u, client, from, who) {
  if (!client) return json(res, 400, { error: 'missing client' });
  const name = String(u.searchParams.get('name') || 'مرفق').replace(/[\\/:*?"<>|]/g, '_').slice(0, 120);
  const type = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  let ext = (path.extname(name).slice(1) || FILE_EXT[type] || '').toLowerCase(); if (ext === 'jpeg') ext = 'jpg';
  if (!EXT_OK.has(ext)) return json(res, 415, { error: 'نوع الملف غير مدعوم. المسموح: الصور وPDF وWord وExcel والنصوص.' });
  let buf; try { buf = await body(req, 25 * 1024 * 1024) } catch (e) { return json(res, 413, { error: 'الملف أكبر من المسموح (25 ميغابايت).' }) }
  if (!buf.length) return json(res, 400, { error: 'الملف فارغ.' });
  const id = rid(), file = `${id}.${ext}`; fs.writeFileSync(path.join(MEDIA, file), buf);
  const isImg = ['jpg', 'png', 'webp', 'gif', 'heic'].includes(ext);
  const caption = String(u.searchParams.get('caption') || '').trim().slice(0, 500);
  const m = addMsg({ id, client, from, type: isImg ? 'image' : 'file', file, name, size: buf.length, ext, text: caption, ch: 'البوابة', ...(from === 'lawyer' ? { by: who.username } : {}) });
  audit({ ...who, action: from === 'lawyer' ? 'message.send' : 'message.receive', entity: 'messages', entity_id: id, detail: { client, type: m.type, name, size: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') } });
  return json(res, 201, pub(m));
}

/* ملفات شاشة المكتب: قائمة محددة فقط، وكلها تتطلب تسجيل الدخول عدا صفحة الدخول */
const ADMIN_FILES = new Set(['index.html', 'app.js', 'print.js', 'intake.js', 'dash.js', 'briefcase.js', 'sync.js', 'mizan-ui.js', 'data.js', 'admin.js', 'phase2.js', 'phase2.css', 'bar.js', 'bar.css', 'responsive.js', 'responsive.css', 'style.css', 'dash.css', 'briefcase.css', 'mizan.css', 'admin.css', 'prestige.css', 'hdr-banner.jpg', 'hdr-side.jpg', 'hdr-side.webp', 'hdr-emblem.jpg', 'hdr-logo.jpg']);
const PUBLIC_FILES = new Set(['login.html', 'login.js', 'login.css', 'scales.js', 'prestige.css']);

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  /* وضع النشر العام: الزيارات القادمة عبر نفق Cloudflare ترى بوابة الموكل فقط */
  if (viaTunnel(req) && officeHost(req)) {
    if (!req.headers['cf-access-jwt-assertion']) { res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('شاشة المكتب مغلقة: لم تُفعَّل حماية Cloudflare Access لهذا النطاق بعد.') }
    res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'same-origin');
  } else if (viaTunnel(req)) {
    const q = u.pathname;
    const ok = q === '/portal' || q.startsWith('/portal/') || q.startsWith('/p/') || q.startsWith('/api/portal/') || q.startsWith('/api/media/') || q === '/api/health';
    if (!ok) {
      if (req.method === 'GET' && !q.startsWith('/api/')) { res.writeHead(302, { location: '/portal/' }); return res.end() }
      res.writeHead(404); return res.end()
    }
  }
  if (u.pathname.startsWith('/api/')) return api(req, res, u).catch(e => { console.error(e); json(res, 500, { error: 'خطأ في الخادم' }) });
  let p; try { p = decodeURIComponent(u.pathname) } catch (e) { res.writeHead(400); return res.end() }
  { const m = /^\/p\/(MQ-[A-Za-z0-9]{3,12})$/i.exec(p); if (m) { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }); return res.end(PLINK(m[1].toUpperCase())) } }
  if (p === '/portal') { res.writeHead(302, { Location: '/portal/' }); return res.end() }
  if (p.startsWith('/portal/')) {
    let f = path.join(PORTAL, path.normalize(p.slice(7)));
    if (!f.startsWith(PORTAL)) { res.writeHead(403); return res.end() }
    if (p.endsWith('/') || !fs.existsSync(f)) f = path.join(PORTAL, 'index.html');
    return sendFile(req, res, f);
  }
  const name = p === '/' ? 'index.html' : p.slice(1);
  if (PUBLIC_FILES.has(name)) {
    if (name === 'login.html' && auth.fromReq(req)) { res.writeHead(302, { Location: '/' }); return res.end() }
    return sendFile(req, res, path.join(ROOT, name));
  }
  if (!ADMIN_FILES.has(name)) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Not found') }
  if (!auth.fromReq(req)) {
    if (name.endsWith('.html')) { res.writeHead(302, { Location: '/login.html' }); return res.end() }
    res.writeHead(401); return res.end();
  }
  sendFile(req, res, path.join(ROOT, name));
}).listen(PORT, '0.0.0.0', () => {
  audit({ action: 'system.start', detail: { pid: process.pid, electron: process.versions.electron || null } });
  console.log('Mithaq is running');
  console.log('  شاشة المكتب:    http://localhost:' + PORT + (auth.hasUsers() ? '' : '  (أول مرة: أنشئ حساب مدير النظام)'));
  console.log('  بوابة الموكل:   http://localhost:' + PORT + '/portal/');
});
