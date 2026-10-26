// «إدارة نسخ المسبار» — برنامج المورّد وحده (لا يُشحن مع نسخ المكاتب).
// يعمل على هذا الجهاز فقط (127.0.0.1)، ويحفظ سجله في مجلد المُفعِّل بجانب مفتاح التوقيع الخاص.
//   node tools/vendor/vendor.js [--dir D] [--port 8778] [--no-open]
// المكاتب · التراخيص (إصدار/تجديد/إبطال) · عقل المسبار (الاستهلاك والرصيد) · المكاتب السحابية · المدفوعات · النسخ الاحتياطي
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), http = require('http'), os = require('os');
const { DatabaseSync } = require('node:sqlite');
const L = require('../../lib/license');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d };
const DIR = path.resolve(arg('dir', process.env.MQ_VENDOR_DIR || path.join(os.homedir(), 'mithaq-activator')));
const PORT = Number(arg('port', process.env.MQ_VENDOR_PORT || 8778));
const PRIV = path.join(DIR, 'activator-private.pem'), PUB = path.join(DIR, 'license.pub'), REG = path.join(DIR, 'issued.csv');
const SLUG_RE = /^[a-z][a-z0-9-]{2,30}$/, RESERVED = new Set(['www', 'admin', 'ops', 'api', 'ai', 'misbar', 'app', 'portal', 'mail', 'static', 'office', 'support', 'status', 'test', 'demo']);
const KEY = crypto.randomBytes(24).toString('base64url'); // مفتاح الجلسة: يُضمَّن في الصفحة فقط، ويمنع أي موقع آخر من استدعاء البرنامج

function open() {
  fs.mkdirSync(DIR, { recursive: true });
  const db = new DatabaseSync(path.join(DIR, 'vendor.db'));
  db.exec(`PRAGMA journal_mode=WAL;
  CREATE TABLE IF NOT EXISTS offices(slug TEXT PRIMARY KEY, name TEXT NOT NULL, contact TEXT, phone TEXT, email TEXT, city TEXT, kind TEXT DEFAULT 'desktop', price REAL DEFAULT 0, currency TEXT DEFAULT '₪', cycle TEXT DEFAULT 'yearly', status TEXT DEFAULT 'active', notes TEXT, created_at TEXT);
  CREATE TABLE IF NOT EXISTS licenses(id TEXT PRIMARY KEY, slug TEXT NOT NULL, fp TEXT NOT NULL, device TEXT, edition TEXT, users INTEGER, exp TEXT, ai INTEGER, code TEXT, issued_at TEXT, status TEXT DEFAULT 'active', revoked_at TEXT, note TEXT, renewed_from TEXT);
  CREATE INDEX IF NOT EXISTS lic_slug ON licenses(slug);
  CREATE TABLE IF NOT EXISTS payments(id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL, amount REAL NOT NULL, currency TEXT, paid_at TEXT, method TEXT, purpose TEXT, note TEXT, created_at TEXT);
  CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT, slug TEXT, action TEXT, detail TEXT);
  CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY, value TEXT);`);
  return db;
}
const now = () => new Date().toISOString().replace('T', ' ').slice(0, 16), today = () => new Date().toISOString().slice(0, 10);
function create(db) {
  const meta = (k, d) => { const r = db.prepare('SELECT value FROM meta WHERE key=?').get(k); try { return r ? JSON.parse(r.value) : d } catch (e) { return d } };
  const setMeta = (k, v) => db.prepare('INSERT INTO meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(k, JSON.stringify(v));
  const log = (slug, action, detail) => db.prepare('INSERT INTO events(at,slug,action,detail) VALUES(?,?,?,?)').run(now(), slug || '', action, JSON.stringify(detail || {}));
  const settings = () => ({ opsHost: 'test.palgaz.net', opsTokenFile: 'E:\\methaq-final-folder21102026\\cloud-deploy\\.ops_token', backupDir: '', cloudBase: 'palgaz.net', ...meta('settings', {}) });

  /* ── السحابة: لوحة المشغّل (/_ops) برمز سري يُقرأ من ملفه ولا يُعرض ── */
  async function ops(method, p, body, fetchImpl = fetch) {
    const s = settings(); let tok = process.env.MQ_OPS_TOKEN || '';
    if (!tok) { try { tok = fs.readFileSync(s.opsTokenFile, 'utf8').trim() } catch (e) {} }
    if (!tok) throw new Error('رمز لوحة المشغّل غير موجود؛ حدّد ملفه في الإعدادات');
    const r = await fetchImpl(`https://${s.opsHost}${p}`, { method, headers: { authorization: 'Bearer ' + tok, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const t = await r.text(); let j; try { j = JSON.parse(t) } catch (e) { j = { raw: t.slice(0, 200) } }
    if (!r.ok) throw new Error((j && j.error) || ('خطأ من السحابة ' + r.status));
    return j;
  }

  /* ── المكاتب ── */
  function saveOffice(b) {
    const slug = String(b.slug || '').trim().toLowerCase();
    const ex = db.prepare('SELECT slug FROM offices WHERE slug=?').get(slug);
    if (!ex) { if (!SLUG_RE.test(slug) || RESERVED.has(slug)) throw new Error('المعرّف: 3–31 حرفاً لاتينياً صغيراً أو أرقاماً أو -، يبدأ بحرف، وليس كلمة محجوزة'); }
    const name = String(b.name || '').trim(); if (name.length < 2) throw new Error('اسم المكتب مطلوب');
    const v = [name, b.contact || '', b.phone || '', b.email || '', b.city || '', ['desktop', 'cloud', 'both'].includes(b.kind) ? b.kind : 'desktop', Math.max(0, +b.price || 0), b.currency || '₪', ['yearly', 'monthly', 'once'].includes(b.cycle) ? b.cycle : 'yearly', ['active', 'suspended', 'ended'].includes(b.status) ? b.status : 'active', String(b.notes || '').slice(0, 2000)];
    if (ex) db.prepare('UPDATE offices SET name=?,contact=?,phone=?,email=?,city=?,kind=?,price=?,currency=?,cycle=?,status=?,notes=? WHERE slug=?').run(...v, slug);
    else db.prepare('INSERT INTO offices(name,contact,phone,email,city,kind,price,currency,cycle,status,notes,slug,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').run(...v, slug, now());
    log(slug, ex ? 'office.update' : 'office.create', { name }); return office(slug);
  }
  const licState = l => l.status === 'revoked' ? 'revoked' : l.exp && l.exp < today() ? 'expired' : l.exp && l.exp <= addDays(30) ? 'expiring' : 'active';
  const addDays = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  function balance(o) {
    const paid = db.prepare('SELECT COALESCE(SUM(amount),0) s FROM payments WHERE slug=?').get(o.slug).s;
    // المستحق: سعر الاشتراك × عدد الدورات منذ الإنشاء (سنوي/شهري)، أو مرة واحدة
    const start = new Date(String(o.created_at || today()).slice(0, 10)), months = Math.max(0, (new Date().getFullYear() - start.getFullYear()) * 12 + new Date().getMonth() - start.getMonth());
    const periods = o.cycle === 'once' ? 1 : o.cycle === 'monthly' ? months + 1 : Math.floor(months / 12) + 1;
    const due = Math.round((o.price || 0) * periods * 100) / 100;
    return { paid, due, remaining: Math.round((due - paid) * 100) / 100 };
  }
  function office(slug) {
    const o = db.prepare('SELECT * FROM offices WHERE slug=?').get(slug); if (!o) return null;
    const licenses = db.prepare('SELECT id,slug,fp,device,edition,users,exp,ai,code,issued_at,status,revoked_at,note,renewed_from FROM licenses WHERE slug=? ORDER BY issued_at DESC').all(slug).map(l => ({ ...l, state: licState(l) }));
    const payments = db.prepare('SELECT * FROM payments WHERE slug=? ORDER BY paid_at DESC, id DESC').all(slug);
    const events = db.prepare('SELECT at,action,detail FROM events WHERE slug=? ORDER BY id DESC LIMIT 30').all(slug);
    return { ...o, licenses, payments, events, balance: balance(o) };
  }
  function offices() {
    return db.prepare('SELECT * FROM offices ORDER BY created_at DESC').all().map(o => {
      const ls = db.prepare('SELECT status,exp FROM licenses WHERE slug=?').all(o.slug).map(licState);
      return { ...o, licActive: ls.filter(s => s === 'active' || s === 'expiring').length, licExpiring: ls.filter(s => s === 'expiring').length, licExpired: ls.filter(s => s === 'expired').length, balance: balance(o) };
    });
  }

  /* ── التراخيص ── */
  function issue(b, renewedFrom = null) {
    if (!fs.existsSync(PRIV)) throw new Error('مفتاح التوقيع غير موجود في ' + DIR + '. شغّل: node tools/activator.js init');
    const o = db.prepare('SELECT * FROM offices WHERE slug=?').get(String(b.slug || '')); if (!o) throw new Error('المكتب غير موجود');
    const fp = L.normFp(b.fp); if (fp.length !== 20) throw new Error('بصمة الجهاز غير صحيحة: 20 حرفاً كما تظهر في «ترخيص المكتب» لدى المكتب');
    const edition = b.edition === 'private' ? 'private' : 'connected';
    const users = Math.max(1, Math.min(500, parseInt(b.users || '5', 10) || 5));
    const exp = /^\d{4}-\d{2}-\d{2}$/.test(String(b.exp || '')) ? b.exp : '';
    const ai = edition === 'private' ? 0 : Math.max(0, Math.round(+b.ai || 0));
    const id = crypto.randomBytes(4).toString('hex');
    const payload = { v: 2, fp: fp.match(/.{4}/g).join('-'), office: o.name, slug: o.slug, edition, users, exp, ai, iat: today(), id };
    const code = L.sign(payload, fs.readFileSync(PRIV, 'utf8'));
    const chk = L.verify(code, { fp, pub: fs.readFileSync(PUB, 'utf8') }); if (!chk.ok) throw new Error('فشل التحقق الذاتي: ' + chk.error);
    db.prepare('INSERT INTO licenses(id,slug,fp,device,edition,users,exp,ai,code,issued_at,status,note,renewed_from) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(id, o.slug, payload.fp, String(b.device || '').slice(0, 80), edition, users, exp, ai, code, now(), 'active', String(b.note || '').slice(0, 300), renewedFrom);
    const q = v => '"' + String(v).replace(/"/g, '""') + '"';
    try { if (!fs.existsSync(REG)) fs.writeFileSync(REG, 'issued_at,office,slug,edition,users,exp,ai,fp,code_id\n'); fs.appendFileSync(REG, [payload.iat, q(o.name), o.slug, edition, users, exp, ai, payload.fp, id].join(',') + '\n') } catch (e) {}
    log(o.slug, renewedFrom ? 'license.renew' : 'license.issue', { id, fp: payload.fp, exp, ai, device: b.device || '' });
    return { id, code, payload };
  }
  async function revoke(id, fetchImpl) {
    const l = db.prepare('SELECT * FROM licenses WHERE id=?').get(String(id)); if (!l) throw new Error('الترخيص غير موجود');
    db.prepare("UPDATE licenses SET status='revoked', revoked_at=? WHERE id=?").run(now(), l.id);
    let cloud = 'ok'; try { await ops('POST', '/_ops/ai/revoke', { id: l.id }, fetchImpl) } catch (e) { cloud = e.message }
    log(l.slug, 'license.revoke', { id: l.id, cloud }); return { ok: true, cloud };
  }
  async function renew(id, b) {
    const l = db.prepare('SELECT * FROM licenses WHERE id=?').get(String(id)); if (!l) throw new Error('الترخيص غير موجود');
    const r = issue({ slug: l.slug, fp: l.fp, device: l.device, edition: l.edition, users: b.users || l.users, exp: b.exp, ai: b.ai != null && b.ai !== '' ? b.ai : l.ai, note: 'تجديد ' + l.id }, l.id);
    db.prepare("UPDATE licenses SET status='revoked', revoked_at=? WHERE id=?").run(now(), l.id); // القديم يُستبدل بالجديد
    return r;
  }

  /* ── المدفوعات ── */
  function pay(b) {
    if (!db.prepare('SELECT 1 FROM offices WHERE slug=?').get(String(b.slug || ''))) throw new Error('المكتب غير موجود');
    const amount = Math.round((+b.amount || 0) * 100) / 100; if (!(amount > 0)) throw new Error('المبلغ غير صحيح');
    const r = db.prepare('INSERT INTO payments(slug,amount,currency,paid_at,method,purpose,note,created_at) VALUES(?,?,?,?,?,?,?,?)').run(b.slug, amount, b.currency || '₪', /^\d{4}-\d{2}-\d{2}$/.test(b.paid_at || '') ? b.paid_at : today(), b.method || 'نقداً', b.purpose || 'اشتراك', String(b.note || '').slice(0, 300), now());
    log(b.slug, 'payment.add', { amount, currency: b.currency || '₪' }); return { ok: true, id: Number(r.lastInsertRowid) };
  }
  function unpay(id) { const p = db.prepare('SELECT * FROM payments WHERE id=?').get(+id); if (!p) throw new Error('غير موجود'); db.prepare('DELETE FROM payments WHERE id=?').run(+id); log(p.slug, 'payment.delete', { amount: p.amount }); return { ok: true } }

  /* ── الملخص ── */
  function summary() {
    const os_ = offices(), lic = db.prepare('SELECT * FROM licenses').all().map(l => ({ ...l, state: licState(l) }));
    const mon = today().slice(0, 7);
    const income = db.prepare("SELECT currency, COALESCE(SUM(amount),0) s FROM payments WHERE substr(paid_at,1,7)=? GROUP BY currency").all(mon);
    const owed = os_.filter(o => o.balance.remaining > 0).map(o => ({ slug: o.slug, name: o.name, remaining: o.balance.remaining, currency: o.currency }));
    const expiring = lic.filter(l => l.state === 'expiring' || l.state === 'expired').map(l => ({ id: l.id, slug: l.slug, exp: l.exp, state: l.state, device: l.device, name: (os_.find(o => o.slug === l.slug) || {}).name || l.slug })).sort((a, b) => String(a.exp).localeCompare(String(b.exp)));
    const lb = meta('last_backup', null);
    return { offices: os_.length, active: os_.filter(o => o.status === 'active').length, licenses: lic.filter(l => l.state !== 'revoked').length, expiring, income, owed, lastBackup: lb, backupDue: !lb || Date.now() - lb.t > 7 * 864e5, keyReady: fs.existsSync(PRIV), dir: DIR };
  }

  /* ── النسخ الاحتياطي: السجل + مفتاح التوقيع الخاص + المفتاح العام + سجل الأكواد، إلى قرص خارجي ── */
  function backup(dirIn) {
    const target = String(dirIn || settings().backupDir || '').trim();
    if (!target || !path.isAbsolute(target)) throw new Error('اختر مجلداً كاملاً، مثل F:\\');
    if (!fs.existsSync(target)) throw new Error('المجلد غير موجود أو القرص غير موصول: ' + target);
    const dst = path.join(target, 'Misbar-Vendor-Backup', new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)); fs.mkdirSync(dst, { recursive: true });
    db.exec(`VACUUM INTO '${path.join(dst, 'vendor.db').replace(/'/g, "''")}'`);
    const files = ['vendor.db']; for (const f of [PRIV, PUB, REG]) if (fs.existsSync(f)) { fs.copyFileSync(f, path.join(dst, path.basename(f))); files.push(path.basename(f)) }
    const sums = Object.fromEntries(files.map(f => [f, crypto.createHash('sha256').update(fs.readFileSync(path.join(dst, f))).digest('hex')]));
    fs.writeFileSync(path.join(dst, 'manifest.json'), JSON.stringify({ at: now(), files: sums }, null, 1));
    const v = { t: Date.now(), at: now(), dir: dst }; setMeta('last_backup', v); log('', 'vendor.backup', v); return { ok: true, ...v, files };
  }

  return { db, meta, setMeta, settings, ops, saveOffice, office, offices, issue, revoke, renew, pay, unpay, summary, backup, log };
}

/* ── الخادم المحلي ── */
function serve(V, { port = PORT, fetchImpl } = {}) {
  const page = fs.readFileSync(path.join(__dirname, 'vendor.html'), 'utf8').replace('__VK__', KEY);
  const send = (res, code, obj) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(obj)) };
  const body = req => new Promise((ok, no) => { let b = ''; req.on('data', c => { b += c; if (b.length > 1e6) req.destroy() }); req.on('end', () => { try { ok(b ? JSON.parse(b) : {}) } catch (e) { no(new Error('طلب غير صالح')) } }) });
  const srv = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x'), p = u.pathname, M = req.method;
    const host = String(req.headers.host || ''); if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host)) { res.writeHead(403); return res.end() }
    if (p === '/' && M === 'GET') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-frame-options': 'DENY', 'content-security-policy': "default-src 'self' 'unsafe-inline'; img-src 'self' data:" }); return res.end(page) }
    if (!p.startsWith('/api/')) { res.writeHead(404); return res.end() }
    if (req.headers['x-vk'] !== KEY) return send(res, 403, { error: 'جلسة غير صالحة؛ أعد فتح البرنامج' });
    try {
      let m;
      if (p === '/api/summary') return send(res, 200, V.summary());
      if (p === '/api/offices' && M === 'GET') return send(res, 200, V.offices());
      if (p === '/api/offices' && M === 'POST') return send(res, 200, V.saveOffice(await body(req)));
      if ((m = /^\/api\/offices\/([a-z0-9-]+)$/.exec(p)) && M === 'GET') { const o = V.office(m[1]); return o ? send(res, 200, o) : send(res, 404, { error: 'غير موجود' }) }
      if (p === '/api/licenses' && M === 'POST') return send(res, 200, V.issue(await body(req)));
      if ((m = /^\/api\/licenses\/([a-f0-9]{8})\/revoke$/.exec(p)) && M === 'POST') return send(res, 200, await V.revoke(m[1], fetchImpl));
      if ((m = /^\/api\/licenses\/([a-f0-9]{8})\/renew$/.exec(p)) && M === 'POST') return send(res, 200, await V.renew(m[1], await body(req)));
      if (p === '/api/payments' && M === 'POST') return send(res, 200, V.pay(await body(req)));
      if ((m = /^\/api\/payments\/(\d+)$/.exec(p)) && M === 'DELETE') return send(res, 200, V.unpay(m[1]));
      if (p === '/api/ai' && M === 'GET') {
        const mon = /^\d{4}-\d{2}$/.test(u.searchParams.get('month') || '') ? u.searchParams.get('month') : new Date().toISOString().slice(0, 7);
        const rows = await V.ops('GET', '/_ops/ai/usage?month=' + mon, null, fetchImpl); const names = Object.fromEntries(V.offices().map(o => [o.slug, o.name]));
        return send(res, 200, { month: mon, rows: rows.map(r => ({ ...r, name: names[r.slug] || '' })) });
      }
      if (p === '/api/ai/office' && M === 'POST') { const b = await body(req); const r = await V.ops('POST', '/_ops/ai/office', b, fetchImpl); V.log(b.slug, 'ai.office', b); return send(res, 200, r) }
      if (p === '/api/cloud/offices' && M === 'GET') return send(res, 200, await V.ops('GET', '/_ops/offices', null, fetchImpl));
      if (p === '/api/cloud/create' && M === 'POST') { const b = await body(req); const o = V.office(b.slug); if (!o) throw new Error('المكتب غير موجود'); const r = await V.ops('POST', '/_ops/offices', { slug: o.slug, name: o.name }, fetchImpl); V.log(o.slug, 'cloud.create', {}); return send(res, 200, r) }
      if (p === '/api/cloud/setup-link' && M === 'POST') { const b = await body(req); const r = await V.ops('POST', `/_ops/offices/${encodeURIComponent(b.slug)}/setup-link`, {}, fetchImpl); V.log(b.slug, 'cloud.setup_link', {}); return send(res, 200, r) }
      if (p === '/api/cloud/status' && M === 'POST') { const b = await body(req); const r = await V.ops('POST', `/_ops/offices/${encodeURIComponent(b.slug)}/status`, { status: b.status }, fetchImpl); V.log(b.slug, 'cloud.status', { status: b.status }); return send(res, 200, r) }
      if (p === '/api/settings' && M === 'GET') return send(res, 200, { ...V.settings(), tokenFound: (() => { try { return !!(process.env.MQ_OPS_TOKEN || fs.readFileSync(V.settings().opsTokenFile, 'utf8').trim()) } catch (e) { return false } })(), dir: DIR });
      if (p === '/api/settings' && M === 'POST') { const b = await body(req); const s = { ...V.settings() }; for (const k of ['opsHost', 'opsTokenFile', 'backupDir', 'cloudBase']) if (k in b) s[k] = String(b[k] || '').trim(); V.setMeta('settings', s); return send(res, 200, s) }
      if (p === '/api/backup' && M === 'POST') { const b = await body(req); return send(res, 200, V.backup(b.dir)) }
      return send(res, 404, { error: 'غير موجود' });
    } catch (e) { return send(res, 400, { error: e.message }) }
  });
  return new Promise((ok, no) => { srv.once('error', no); srv.listen(port, '127.0.0.1', () => ok(srv)) });
}

if (require.main === module) {
  const V = create(open());
  serve(V).then(() => {
    const url = `http://127.0.0.1:${PORT}/`; console.log('إدارة نسخ المسبار:', url);
    if (!process.argv.includes('--no-open')) require('child_process').exec(process.platform === 'win32' ? `start "" "${url}"` : `xdg-open ${url}`);
  }).catch(e => {
    // البرنامج مفتوح مسبقاً: نفتح صفحته فقط
    if (e.code === 'EADDRINUSE') { const url = `http://127.0.0.1:${PORT}/`; require('child_process').exec(process.platform === 'win32' ? `start "" "${url}"` : `xdg-open ${url}`); setTimeout(() => process.exit(0), 1500); return }
    console.error(e.message); process.exit(1);
  });
}
module.exports = { open, create, serve, KEY, DIR };
