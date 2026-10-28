// عروض المِسْبار — برنامج مستقل للترويج للتطبيق لدى المحامين من دليل نقابة المحامين.
// يعمل على هذا الجهاز فقط (localhost)، بلا حزم خارجية: Node 22+ (node:sqlite).
// لا يُرسل شيء تلقائياً: كل رسالة تُفتح في واتساب/الرسائل/البريد ليراجعها المرسل ويرسلها بنفسه، واحدة واحدة.
// الاستعمال: node server.js  [--port 8795] [--data <مجلد البيانات>] [--bar <مسار lawyers.json>]
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), { DatabaseSync } = require('node:sqlite');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d };
const ROOT = __dirname, PORT = Number(arg('port', process.env.OFFERS_PORT || 8795));
const DATA = path.resolve(arg('data', process.env.OFFERS_DATA || path.join(ROOT, 'data')));
fs.mkdirSync(DATA, { recursive: true });
const db = new DatabaseSync(path.join(DATA, 'offers.db'));
db.exec(`PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS lawyers(mno TEXT PRIMARY KEY, name TEXT, status TEXT, city TEXT, office TEXT, address TEXT, phones TEXT, email TEXT, norm TEXT, mobile TEXT DEFAULT '');
CREATE INDEX IF NOT EXISTS lw_city ON lawyers(city); CREATE INDEX IF NOT EXISTS lw_status ON lawyers(status);
CREATE TABLE IF NOT EXISTS contacts(mno TEXT PRIMARY KEY, stage TEXT DEFAULT '', note TEXT DEFAULT '', fav INTEGER DEFAULT 0, optout INTEGER DEFAULT 0, last_at TEXT DEFAULT '', count INTEGER DEFAULT 0, next_at TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS log(id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT, mno TEXT, name TEXT, channel TEXT, tpl TEXT, tone TEXT, text TEXT);
CREATE INDEX IF NOT EXISTS log_mno ON log(mno); CREATE INDEX IF NOT EXISTS log_at ON log(at);
CREATE TABLE IF NOT EXISTS templates(id TEXT PRIMARY KEY, cat TEXT, title TEXT, formal TEXT, short TEXT, custom INTEGER DEFAULT 1, hidden INTEGER DEFAULT 0, sort INTEGER DEFAULT 100);
CREATE TABLE IF NOT EXISTS kv(k TEXT PRIMARY KEY, v TEXT);`);

const kv = { get: (k, d) => { const r = db.prepare('SELECT v FROM kv WHERE k=?').get(k); try { return r ? JSON.parse(r.v) : d } catch { return d } }, set: (k, v) => db.prepare('INSERT OR REPLACE INTO kv(k,v) VALUES(?,?)').run(k, JSON.stringify(v)) };
const now = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}` };
const today = () => now().slice(0, 10);

/* توحيد الكتابة العربية للبحث (كما في دليل المكتب) */
const norm = s => String(s || '').normalize('NFKC').replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').toLowerCase().replace(/\s+/g, ' ').trim();
const digits = s => String(s || '').replace(/\D/g, '');
/* جوال صالح لواتساب: 059/056 فلسطيني (970)، و05x الأخرى (972) */
function waNumber(p) {
  let d = String(p || '').replace(/[^\d+]/g, ''); if (!d) return '';
  if (d.startsWith('+')) d = d.slice(1); else if (d.startsWith('00')) d = d.slice(2);
  if (/^(970|972)5\d{8}$/.test(d)) return d;
  if (/^05\d{8}$/.test(d)) return (/^05[69]/.test(d) ? '970' : '972') + d.slice(1);
  if (/^5\d{8}$/.test(d)) return (/^5[69]/.test(d) ? '970' : '972') + d;
  return '';
}
/* حالات لا تُراسل أبداً (متوفى، مشطوب، موقوف) */
const NEVER = /متوف|مشطوب|موقوف(?!\s+عن\s+التدريب)/;

/* ── استيراد الدليل من نسخة نقابة المحامين (lawyers.json الذي يجمعه تطبيق المكتب) ── */
const DEFAULT_BAR = ['D:\\Misbar Data\\data\\bar\\lawyers.json', path.join(DATA, 'lawyers.json')];
function importBar(file) {
  const f = file || kv.get('bar_path', '') || DEFAULT_BAR.find(p => fs.existsSync(p));
  if (!f || !fs.existsSync(f)) throw new Error('لم يُعثر على ملف الدليل lawyers.json — حدّد مساره في الإعدادات');
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  const pick = (info, re, not) => { const k = Object.keys(info || {}).find(k => re.test(k) && !(not && not.test(k))); return k ? info[k] : '' };
  const ins = db.prepare('INSERT OR REPLACE INTO lawyers(mno,name,status,city,office,address,phones,email,norm,mobile) VALUES(?,?,?,?,?,?,?,?,?,?)');
  db.exec('BEGIN'); db.exec('DELETE FROM lawyers');
  let n = 0;
  for (const l of d.lawyers || []) {
    if (!l || !l.mno) continue;
    const phones = (l.phones || []).map(p => String(p).replace(/[^\d+]/g, '')).filter(Boolean);
    const city = pick(l.info, /مدين/), office = pick(l.info, /اسم|مكتب/, /عنوان/), address = pick(l.info, /عنوان/);
    ins.run(l.mno, l.name || '', l.status || '', city, office, address, JSON.stringify(phones), l.email || '', [norm(l.name), norm(l.mno), phones.map(digits).join(' '), norm(office), norm(city), norm(l.email)].join(' | '), phones.map(waNumber).find(Boolean) || '');
    n++;
  }
  db.exec('COMMIT');
  kv.set('bar_meta', { file: f, fetchedAt: d.fetchedAt || '', source: d.source || '', total: n, importedAt: now() });
  return { total: n, file: f, fetchedAt: d.fetchedAt || '' };
}
if (!db.prepare('SELECT COUNT(*) n FROM lawyers').get().n) { try { const r = importBar(arg('bar', '')); console.log('الدليل:', r.total, 'محامياً من', r.file) } catch (e) { console.error('[الدليل]', e.message) } }

/* ── القوالب: الباقة الجاهزة تُزرع مرة، ويمكن تعديلها أو إضافة غيرها ── */
const SEED = require('./templates.js');
{ const ins = db.prepare('INSERT OR IGNORE INTO templates(id,cat,title,formal,short,custom,sort) VALUES(?,?,?,?,?,0,?)'); SEED.forEach((t, i) => ins.run(t.id, t.cat, t.title, t.formal, t.short, i)) }
const DEFAULT_SETTINGS = { waMode: 'app', sender: '', role: '', company: 'المِسْبار — نظام إدارة مكاتب المحاماة', phone: '', email: '', link: '', offer: '', offerEnd: '', dailyLimit: 40, optoutLine: true };
const settings = () => ({ ...DEFAULT_SETTINGS, ...kv.get('settings', {}) });

/* ── البحث في الدليل مع حالة التواصل ── */
function rowOut(r) {
  const phones = JSON.parse(r.phones || '[]'), mobiles = phones.map(waNumber).filter(Boolean);
  return { mno: r.mno, name: r.name, status: r.status, city: r.city, office: r.office, address: r.address, phones, mobile: mobiles[0] || '', email: r.email,
    stage: r.stage || '', note: r.note || '', fav: !!r.fav, optout: !!r.optout, last_at: r.last_at || '', count: r.count || 0, next_at: r.next_at || '', never: NEVER.test(r.status || '') };
}
const SEL = 'SELECT l.*, c.stage, c.note, c.fav, c.optout, c.last_at, c.count, c.next_at FROM lawyers l LEFT JOIN contacts c ON c.mno=l.mno';
function where(q) {
  const w = [], a = [];
  const t = norm(q.q || ''); if (t) for (const word of t.split(' ').slice(0, 6)) { w.push('l.norm LIKE ?'); a.push('%' + (/^\d+$/.test(word) ? word.replace(/^0+/, '') : word) + '%') }
  if (q.city) { w.push('l.city=?'); a.push(q.city) }
  if (q.status) { w.push('l.status=?'); a.push(q.status) }
  if (q.mobile === '1') w.push("l.mobile<>''");
  if (q.contacted === '1') w.push("COALESCE(c.last_at,'')<>''");
  if (q.email === '1') w.push("l.email<>''");
  if (q.fav === '1') w.push('c.fav=1');
  if (q.stage) { if (q.stage === 'none') w.push("COALESCE(c.stage,'')=''"); else { w.push('c.stage=?'); a.push(q.stage) } }
  if (q.fresh) { w.push("(COALESCE(c.last_at,'')='' OR c.last_at < ?)"); a.push(daysAgo(Number(q.fresh) || 30)) }
  if (q.due === '1') { w.push("c.next_at<>'' AND c.next_at<=?"); a.push(today()) }
  if (q.active !== '0') { w.push('COALESCE(c.optout,0)=0'); w.push("l.status NOT LIKE '%متوف%' AND l.status NOT LIKE '%مشطوب%' AND l.status NOT IN ('محامي موقوف','')") }
  return { W: w.length ? ' WHERE ' + w.join(' AND ') : '', a };
}
const daysAgo = n => { const d = new Date(Date.now() - n * 864e5), p = x => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` };
function search(q) {
  const { W, a } = where(q), lim = Math.min(200, Math.max(1, Number(q.limit) || 30)), off = Math.max(0, Number(q.offset) || 0);
  const order = q.sort === 'recent' ? 'c.last_at DESC' : q.sort === 'next' ? 'c.next_at ASC' : 'l.name';
  const total = db.prepare(`SELECT COUNT(*) n FROM lawyers l LEFT JOIN contacts c ON c.mno=l.mno${W}`).get(...a).n;
  const rows = db.prepare(`${SEL}${W} ORDER BY ${order} LIMIT ? OFFSET ?`).all(...a, lim, off).map(rowOut);
  return { total, rows };
}
function facets() {
  return {
    cities: db.prepare("SELECT city c, COUNT(*) n FROM lawyers WHERE city<>'' GROUP BY city ORDER BY n DESC").all(),
    statuses: db.prepare("SELECT status s, COUNT(*) n FROM lawyers GROUP BY status ORDER BY n DESC").all(),
    meta: kv.get('bar_meta', {})
  };
}
const contact = mno => db.prepare('SELECT * FROM contacts WHERE mno=?').get(mno) || null;
function upsertContact(mno, patch) {
  const c = contact(mno) || { mno, stage: '', note: '', fav: 0, optout: 0, last_at: '', count: 0, next_at: '' };
  const n = { ...c, ...patch };
  db.prepare('INSERT OR REPLACE INTO contacts(mno,stage,note,fav,optout,last_at,count,next_at) VALUES(?,?,?,?,?,?,?,?)').run(mno, n.stage || '', n.note || '', n.fav ? 1 : 0, n.optout ? 1 : 0, n.last_at || '', n.count || 0, n.next_at || '');
  return n;
}
function stats() {
  const t = today();
  return {
    today: db.prepare('SELECT COUNT(*) n FROM log WHERE substr(at,1,10)=?').get(t).n,
    week: db.prepare('SELECT COUNT(*) n FROM log WHERE at>=?').get(daysAgo(7)).n,
    total: db.prepare('SELECT COUNT(*) n FROM log').get().n,
    people: db.prepare("SELECT COUNT(*) n FROM contacts WHERE count>0").get().n,
    stages: db.prepare("SELECT stage s, COUNT(*) n FROM contacts WHERE stage<>'' GROUP BY stage").all(),
    optout: db.prepare('SELECT COUNT(*) n FROM contacts WHERE optout=1').get().n,
    due: db.prepare("SELECT COUNT(*) n FROM contacts WHERE next_at<>'' AND next_at<=? AND optout=0").get(t).n,
    byChannel: db.prepare('SELECT channel c, COUNT(*) n FROM log GROUP BY channel').all(),
    limit: Number(settings().dailyLimit) || 40
  };
}

/* ── الخادم ── */
const send = (res, code, body, type = 'application/json; charset=utf-8') => { res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' }); res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body)) };
const readBody = req => new Promise((ok, no) => { let b = ''; req.on('data', c => { b += c; if (b.length > 2e6) req.destroy() }); req.on('end', () => { try { ok(b ? JSON.parse(b) : {}) } catch (e) { no(e) } }); req.on('error', no) });
const csvCell = v => /[",\n]/.test(String(v ?? '')) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v ?? '');

const server = http.createServer(async (req, res) => {
  /* محلي فقط: لا يُقبل اتصال من جهاز آخر */
  const ra = req.socket.remoteAddress || ''; if (!/^(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$/.test(ra)) return send(res, 403, { error: 'local only' });
  const u = new URL(req.url, 'http://x'), p = u.pathname, M = req.method, q = Object.fromEntries(u.searchParams);
  try {
    if (p === '/' || p === '/index.html') return send(res, 200, fs.readFileSync(path.join(ROOT, 'index.html')), 'text/html; charset=utf-8');
    if (p === '/app.js') return send(res, 200, fs.readFileSync(path.join(ROOT, 'app.js')), 'text/javascript; charset=utf-8');
    if (p === '/api/dir' && M === 'GET') return send(res, 200, search(q));
    if (p === '/api/facets') return send(res, 200, facets());
    if (p === '/api/stats') return send(res, 200, stats());
    if (p.startsWith('/api/lawyer/') && M === 'GET') {
      const mno = decodeURIComponent(p.slice(12)), r = db.prepare(SEL + ' WHERE l.mno=?').get(mno);
      if (!r) return send(res, 404, { error: 'غير موجود' });
      return send(res, 200, { ...rowOut(r), log: db.prepare('SELECT * FROM log WHERE mno=? ORDER BY id DESC LIMIT 50').all(mno) });
    }
    if (p === '/api/settings') { if (M === 'POST') { const b = await readBody(req); const s = { ...settings() }; for (const k of Object.keys(DEFAULT_SETTINGS)) if (k in b) s[k] = b[k]; if (typeof b.bar_path === 'string') kv.set('bar_path', b.bar_path.trim()); kv.set('settings', s) } return send(res, 200, { ...settings(), bar_path: kv.get('bar_path', '') }) }
    if (p === '/api/templates') {
      if (M === 'GET') return send(res, 200, db.prepare('SELECT * FROM templates WHERE hidden=0 ORDER BY sort, title').all());
      if (M === 'POST') {
        const b = await readBody(req); const id = String(b.id || ('c' + Date.now().toString(36))).slice(0, 40);
        if (!String(b.title || '').trim() || !String(b.formal || b.short || '').trim()) return send(res, 400, { error: 'العنوان والنص مطلوبان' });
        const old = db.prepare('SELECT * FROM templates WHERE id=?').get(id);
        db.prepare('INSERT OR REPLACE INTO templates(id,cat,title,formal,short,custom,hidden,sort) VALUES(?,?,?,?,?,?,0,?)').run(id, b.cat || 'custom', String(b.title).trim(), String(b.formal || b.short), String(b.short || b.formal), old ? old.custom : 1, old ? old.sort : 200);
        return send(res, 200, { ok: true, id });
      }
    }
    if (p.startsWith('/api/templates/') && M === 'DELETE') { const id = decodeURIComponent(p.slice(15)); const t = db.prepare('SELECT custom FROM templates WHERE id=?').get(id); if (t && t.custom) db.prepare('DELETE FROM templates WHERE id=?').run(id); else db.prepare('UPDATE templates SET hidden=1 WHERE id=?').run(id); return send(res, 200, { ok: true }) }
    if (p === '/api/templates/reset' && M === 'POST') { const up = db.prepare('UPDATE templates SET cat=?, title=?, formal=?, short=?, hidden=0 WHERE id=?'); const ins = db.prepare('INSERT OR IGNORE INTO templates(id,cat,title,formal,short,custom,sort) VALUES(?,?,?,?,?,0,?)'); SEED.forEach((t, i) => { ins.run(t.id, t.cat, t.title, t.formal, t.short, i); up.run(t.cat, t.title, t.formal, t.short, t.id) }); return send(res, 200, { ok: true }) }
    /* تسجيل إرسال: يُستدعى حين يضغط المرسل زر القناة (الرسالة تُفتح في تطبيقها ليرسلها بنفسه) */
    if (p === '/api/log' && M === 'POST') {
      const b = await readBody(req), r = db.prepare('SELECT name, status FROM lawyers WHERE mno=?').get(b.mno || '');
      if (!r) return send(res, 404, { error: 'غير موجود' });
      const c = contact(b.mno);
      if (c && c.optout) return send(res, 409, { error: 'هذا المحامي طلب عدم مراسلته' });
      if (NEVER.test(r.status || '')) return send(res, 409, { error: 'لا تُرسل عروض لهذه الحالة: ' + r.status });
      const at = now();
      db.prepare('INSERT INTO log(at,mno,name,channel,tpl,tone,text) VALUES(?,?,?,?,?,?,?)').run(at, b.mno, r.name, String(b.channel || ''), String(b.tpl || ''), String(b.tone || ''), String(b.text || '').slice(0, 4000));
      const n = upsertContact(b.mno, { last_at: at, count: ((c && c.count) || 0) + 1, stage: (c && c.stage && c.stage !== 'none') ? c.stage : 'sent' });
      return send(res, 200, { ok: true, contact: n, stats: stats() });
    }
    if (p === '/api/contact' && M === 'POST') {
      const b = await readBody(req); if (!db.prepare('SELECT 1 FROM lawyers WHERE mno=?').get(b.mno || '')) return send(res, 404, { error: 'غير موجود' });
      const patch = {}; for (const k of ['stage', 'note', 'fav', 'optout', 'next_at']) if (k in b) patch[k] = b[k];
      return send(res, 200, { ok: true, contact: upsertContact(b.mno, patch) });
    }
    if (p === '/api/history' && M === 'GET') {
      const w = [], a = []; if (q.q) { w.push('(name LIKE ? OR mno LIKE ?)'); a.push('%' + q.q + '%', '%' + q.q + '%') } if (q.from) { w.push('at>=?'); a.push(q.from) }
      return send(res, 200, db.prepare(`SELECT * FROM log${w.length ? ' WHERE ' + w.join(' AND ') : ''} ORDER BY id DESC LIMIT ?`).all(...a, Math.min(500, Number(q.limit) || 100)));
    }
    if (p === '/api/import' && M === 'POST') { const b = await readBody(req); return send(res, 200, importBar(b.path || '')) }
    if (p === '/api/export.csv') {
      const rows = db.prepare(`SELECT l.mno, l.name, l.status, l.city, l.office, l.phones, l.email, c.stage, c.count, c.last_at, c.next_at, c.optout, c.note FROM contacts c JOIN lawyers l ON l.mno=c.mno ORDER BY c.last_at DESC`).all();
      const head = ['رقم العضوية', 'الاسم', 'الحالة', 'المدينة', 'المكتب', 'الهواتف', 'البريد', 'المرحلة', 'عدد الرسائل', 'آخر تواصل', 'المتابعة', 'لا يُراسل', 'ملاحظة'];
      const csv = '\uFEFF' + [head, ...rows.map(r => [r.mno, r.name, r.status, r.city, r.office, JSON.parse(r.phones || '[]').join(' '), r.email, r.stage, r.count, r.last_at, r.next_at, r.optout ? 'نعم' : '', r.note])].map(r => r.map(csvCell).join(',')).join('\r\n');
      res.writeHead(200, { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="offers-${today()}.csv"` }); return res.end(csv);
    }
    return send(res, 404, { error: 'not found' });
  } catch (e) { console.error(e); return send(res, 500, { error: e.message }) }
});
/* يبدأ على المنفذ المطلوب، وإن كان مشغولاً فعلى أي منفذ متاح؛ يعيد المنفذ الفعلي */
function start(port = PORT) {
  return new Promise((ok, no) => {
    const tryListen = p => { server.once('error', err => { if (err.code === 'EADDRINUSE' && p !== 0) return tryListen(0); no(err) }); server.listen(p, '127.0.0.1', () => ok(server.address().port)) };
    tryListen(port);
  });
}
if (require.main === module) start().then(p => console.log(`عروض المِسْبار تعمل: http://localhost:${p}`));
module.exports = { server, start, waNumber, importBar, search, stats, db, DATA };
