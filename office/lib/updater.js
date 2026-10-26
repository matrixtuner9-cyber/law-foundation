// التحديث التلقائي لنسخ المسبار المكتبية.
// - الفحص: مرة بعد التشغيل ثم كل 6 ساعات، من misbar.palgaz.net/updates برمز الترخيص (لا تحديث لترخيص منتهٍ أو مُبطل).
// - التنزيل في الخلفية، ثم التحقق من البصمة وتوقيع المورّد، ثم الفك في مجلد مستقل (updates/<الإصدار>).
// - التطبيق عند إعادة التشغيل التالية (نسخة احتياطية عند الإغلاق تسبقه دائماً)؛ الشيفرة القديمة تبقى كما هي.
// - الأمان: إن تعطّل الإصدار الجديد قبل أن يعمل خادمه مرتين متتاليتين يعود التطبيق تلقائياً للإصدار السابق ولا يُعاد تنزيله.
'use strict';
const fs = require('fs'), path = require('path');
const P = require('./update-pack');

const STATE = dir => path.join(dir, 'state.json');
function read(dir) { try { return { bad: [], tries: 0, ...JSON.parse(fs.readFileSync(STATE(dir), 'utf8')) } } catch (e) { return { bad: [], tries: 0 } } }
function write(dir, s) { fs.mkdirSync(dir, { recursive: true }); const t = STATE(dir) + '.tmp'; fs.writeFileSync(t, JSON.stringify(s, null, 1)); fs.renameSync(t, STATE(dir)) }
const valid = (dir, v) => !!v && P.VER_RE.test(v) && fs.existsSync(path.join(dir, v, 'electron', 'main.js')) && fs.existsSync(path.join(dir, v, 'server.js'));
const MAX_TRIES = 2;

/* عند الإقلاع (قبل تحميل التطبيق): أي شيفرة نشغّل؟ null = المشحونة مع التطبيق */
function select(dir, bundled) {
  const s = read(dir); let changed = false;
  if (s.pending) {
    if (valid(dir, s.pending) && P.cmpVer(s.pending, bundled) > 0) { s.previous = s.current || null; s.current = s.pending; s.tries = 0; s.justUpdated = s.current }
    s.pending = null; changed = true;
  }
  for (let guard = 0; guard < 3; guard++) {
    if (!s.current || !valid(dir, s.current) || P.cmpVer(s.current, bundled) <= 0) { if (s.current) { s.current = null; changed = true } break }
    if ((s.tries || 0) >= MAX_TRIES) { // تعطّل مرتين قبل أن يعمل: رجوع
      s.bad = [...new Set([...(s.bad || []), s.current])]; s.reverted = s.current; s.current = s.previous && s.previous !== s.current ? s.previous : null; s.previous = null; s.tries = 0; s.justUpdated = null; changed = true; continue;
    }
    s.tries = (s.tries || 0) + 1; write(dir, s);
    return { dir: path.join(dir, s.current), version: s.current };
  }
  if (changed) write(dir, s);
  return null;
}
/* بعد أن يعمل الخادم والنافذة: الإصدار سليم */
function confirm(dir) {
  const s = read(dir), out = { justUpdated: s.justUpdated || null, reverted: s.reverted || null };
  if (s.tries || s.justUpdated || s.reverted) { s.tries = 0; s.justUpdated = null; s.reverted = null; write(dir, s) }
  return out;
}
/* فشل تشغيل الإصدار الحالي (مثلاً تعذّر تشغيل الخادم): يُعلَّم ويعود للسابق في التشغيل التالي */
function fail(dir) { const s = read(dir); if (s.current) { s.tries = MAX_TRIES; write(dir, s) } }

function create({ dir, current, electron = 0, token, gateway, pub, fetchImpl = fetch, log = () => {} }) {
  const st = { status: 'idle', current, version: null, notes: '', error: '', at: null };
  const gw = () => String(typeof gateway === 'function' ? gateway() : gateway).replace(/\/+$/, '');
  const auth = () => { const t = token(); if (!t) throw Object.assign(new Error('لا يوجد ترخيص فعّال على هذا الجهاز'), { quiet: true }); return { authorization: 'Bearer ' + t } };

  async function check() {
    const r = await fetchImpl(`${gw()}/updates/check?v=${encodeURIComponent(current)}&e=${electron}`, { headers: auth() });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j.error && j.error.message) || j.error || ('خادم التحديثات ' + r.status));
    if (!j.update) return null;
    if (!P.VER_RE.test(String(j.version)) || P.cmpVer(j.version, current) <= 0) return null;
    if ((read(dir).bad || []).includes(j.version)) return null; // تعطّل سابقاً على هذا الجهاز
    if (!P.verifyRelease(j, pub)) throw new Error('توقيع الإصدار غير صحيح؛ لم يُنزَّل');
    return j;
  }
  async function download(m) {
    const s = read(dir);
    if (s.pending === m.version && valid(dir, m.version)) return m.version;
    const r = await fetchImpl(gw() + (m.url || '/updates/file/' + m.version), { headers: auth() });
    if (!r.ok) throw new Error('تعذّر تنزيل التحديث (' + r.status + ')');
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length !== Number(m.size) || P.sha256(buf) !== m.sha256) throw new Error('ملف التحديث غير مطابق لبصمته؛ لم يُطبَّق');
    const tmp = path.join(dir, m.version + '.tmp'), fin = path.join(dir, m.version);
    const head = P.unpack(buf, tmp);
    if (head.version !== m.version) { fs.rmSync(tmp, { recursive: true, force: true }); throw new Error('رقم الإصدار داخل الحزمة غير مطابق') }
    fs.rmSync(fin, { recursive: true, force: true }); fs.renameSync(tmp, fin);
    const s2 = read(dir); s2.pending = m.version; s2.pendingNotes = m.notes || ''; write(dir, s2);
    prune(); return m.version;
  }
  /* لا يبقى إلا الحالي والسابق والمنتظر */
  function prune() {
    const s = read(dir), keep = new Set([s.current, s.previous, s.pending].filter(Boolean));
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) if (e.isDirectory() && !keep.has(e.name)) { try { fs.rmSync(path.join(dir, e.name), { recursive: true, force: true }) } catch (x) {} }
  }
  async function run() { await run_(); return status() }
  async function run_() {
    if (st.status === 'checking' || st.status === 'downloading') return st;
    st.status = 'checking'; st.error = ''; st.at = new Date().toISOString();
    try {
      const m = await check();
      if (!m) { st.status = read(dir).pending ? 'ready' : 'uptodate'; return st }
      st.version = m.version; st.notes = m.notes || '';
      if (Number(m.min_electron || 0) > electron) { st.status = 'installer'; return st } // يلزمه مثبّت كامل جديد
      st.status = 'downloading'; await download(m); st.status = 'ready'; log('update.ready', m.version);
    } catch (e) { st.status = e.quiet ? 'idle' : 'error'; st.error = e.message; if (!e.quiet) log('update.error', e.message) }
    return st;
  }
  const status = () => ({ ...st, pending: read(dir).pending || null });
  return { check, download, run, status, prune };
}

/* مجلد التحديثات: بجانب البيانات في نسخة production، وإلا في مجلد إعدادات المستخدم (قابل للكتابة دائماً) */
function updatesDir(userData, portableRoot) { return portableRoot ? path.join(portableRoot, 'updates') : path.join(userData, 'updates') }

module.exports = { select, confirm, fail, create, read, updatesDir, MAX_TRIES };
