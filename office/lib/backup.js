// النسخ الاحتياطي التلقائي لخادم المكتب
// - نسخة يومية متسقة للقاعدة الحية (VACUUM INTO) + المفاتيح + المرفقات (تراكمياً، فالمرفقات لا تتغير بعد رفعها)
// - فحص سلامة النسخة بعد أخذها (integrity_check) وبصمات SHA-256 في ملف manifest.json
// - الاحتفاظ بآخر 14 نسخة يومية، ونسخة إضافية اختيارية في مسار ثانٍ (قرص خارجي أو مجلد مزامنة سحابية) عبر MQ_BACKUP_MIRROR
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

function create({ store, DATA, audit, stampS, log = console }) {
  const ROOT = process.env.MQ_BACKUP_DIR || path.resolve(DATA, '..', '..', 'MithaqBackups');
  /* إعدادات تُضبط من شاشة الإعدادات (تتقدّم عليها متغيرات البيئة إن وُجدت) */
  const cfg = () => ({ mirror: '', remindHours: 48, ...(store.kv.get('backup_cfg') || {}) });
  const mirrorDir = () => process.env.MQ_BACKUP_MIRROR || cfg().mirror || '';
  const KEEP = Math.max(3, +process.env.MQ_BACKUP_KEEP || 14);
  const EVERY_H = Math.max(1, +process.env.MQ_BACKUP_HOURS || 24);
  let running = false;

  const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
  const stampF = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const copyIfMissing = (src, dst) => { if (!fs.existsSync(dst)) { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); return 1 } return 0 };

  function copyTree(src, dst, skip = () => false) {
    let n = 0; if (!fs.existsSync(src)) return 0;
    for (const e of fs.readdirSync(src, { withFileTypes: true })) {
      const s = path.join(src, e.name), d = path.join(dst, e.name);
      if (skip(s)) continue;
      if (e.isDirectory()) n += copyTree(s, d, skip); else n += copyIfMissing(s, d);
    }
    return n;
  }

  function prune(root) {
    if (!fs.existsSync(root)) return 0;
    const dirs = fs.readdirSync(root).filter(d => /^auto_/.test(d)).sort();
    let n = 0; while (dirs.length > KEEP) { fs.rmSync(path.join(root, dirs.shift()), { recursive: true, force: true }); n++ }
    return n;
  }

  function run(reason = 'schedule', prefix = 'auto') {
    if (running) return { ok: false, error: 'نسخة قيد التنفيذ' };
    running = true; const t0 = Date.now();
    const MIRROR = mirrorDir();
    try {
      let dir = path.join(ROOT, prefix + '_' + stampF());
      for (let i = 2; fs.existsSync(dir); i++) dir = path.join(ROOT, prefix + '_' + stampF() + '-' + i); // نسختان في الثانية نفسها
      fs.mkdirSync(dir, { recursive: true });
      const dbFile = path.join(dir, 'mithaq.db');
      store.raw.exec(`VACUUM INTO '${dbFile.replace(/'/g, "''")}'`);
      // المفاتيح والإعدادات (بدون جلسة متصفح ميزان المؤقتة)
      const files = [];
      for (const f of ['audit.key', 'vapid.json', 'push.json']) { const s = path.join(DATA, f); if (fs.existsSync(s)) { fs.copyFileSync(s, path.join(dir, f)); files.push(f) } }
      for (const f of ['credentials.json', '.key']) { const s = path.join(DATA, 'mizan', f); if (fs.existsSync(s)) { fs.mkdirSync(path.join(dir, 'mizan'), { recursive: true }); fs.copyFileSync(s, path.join(dir, 'mizan', f)); files.push('mizan/' + f) } }
      // المرفقات: مجلد مشترك تراكمي (اسم كل ملف عشوائي فريد ولا يُعدّل بعد رفعه)
      const newMedia = copyTree(path.join(DATA, 'media'), path.join(ROOT, 'media'));
      // التحقق: افتح النسخة وافحص سلامتها وعدّ السجلات
      const chk = new DatabaseSync(dbFile, { readOnly: true });
      const integrity = chk.prepare('PRAGMA integrity_check').get().integrity_check;
      const counts = {}; for (const t of ['records', 'messages', 'users', 'audit']) counts[t] = chk.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n;
      chk.close();
      const mediaCount = fs.existsSync(path.join(DATA, 'media')) ? fs.readdirSync(path.join(DATA, 'media')).length : 0;
      const manifest = { at: stampS(), reason, integrity, counts, mediaCount, files: [{ f: 'mithaq.db', sha256: sha(dbFile), size: fs.statSync(dbFile).size }, ...files.map(f => ({ f, sha256: sha(path.join(dir, f)) }))] };
      fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 1));
      if (integrity !== 'ok') throw new Error('فحص سلامة النسخة فشل: ' + integrity);
      let mirror = null;
      if (MIRROR) {
        try { const md = path.join(MIRROR, path.basename(dir)); copyTree(dir, md); copyTree(path.join(ROOT, 'media'), path.join(MIRROR, 'media')); prune(MIRROR); mirror = { ok: true, dir: md } }
        catch (e) { mirror = { ok: false, error: e.message } }
      }
      const pruned = prune(ROOT); prunePre();
      const res = { ok: true, at: manifest.at, dir, size: manifest.files[0].size, counts, newMedia, mediaCount, mirror, pruned, ms: Date.now() - t0 };
      store.kv.set('backup_last', res);
      if (mirror && mirror.ok) store.kv.set('backup_ext_last', { t: Date.now(), at: manifest.at, dir: mirror.dir, how: 'mirror' });
      if (/^(manual|export|exit|tray)/.test(reason)) store.kv.set('backup_user_last', { t: Date.now(), at: manifest.at, reason });
      audit({ action: 'system.backup', detail: { reason, dir: path.basename(dir), records: counts.records, messages: counts.messages, newMedia, mirror: mirror ? mirror.ok : null } });
      return res;
    } catch (e) {
      const res = { ok: false, at: stampS(), error: e.message };
      store.kv.set('backup_last', { ...(store.kv.get('backup_last') || {}), failed: res });
      audit({ action: 'system.backup_failed', detail: { reason, error: e.message } });
      log.error('[backup]', e);
      return res;
    } finally { running = false }
  }

  function prunePre() {
    const dirs = fs.existsSync(ROOT) ? fs.readdirSync(ROOT).filter(d => /^pre-restore_/.test(d)).sort() : [];
    while (dirs.length > 5) fs.rmSync(path.join(ROOT, dirs.shift()), { recursive: true, force: true });
  }

  const ID_RX = /^(auto|pre-restore)_\d{4}-\d\d-\d\dT\d\d-\d\d-\d\d(-\d{1,3})?$/;
  /* قائمة النسخ المحفوظة على هذا الجهاز، الأحدث أولاً */
  function list() {
    if (!fs.existsSync(ROOT)) return [];
    const ts = d => d.replace(/^[^_]+_/, '');
    return fs.readdirSync(ROOT).filter(d => ID_RX.test(d)).sort((a, b) => ts(b).localeCompare(ts(a))).map(id => {
      let m = {}; try { m = JSON.parse(fs.readFileSync(path.join(ROOT, id, 'manifest.json'), 'utf8')) } catch (e) {}
      return { id, at: m.at || null, reason: m.reason || '', integrity: m.integrity || null, counts: m.counts || null, size: ((m.files || [])[0] || {}).size || 0 };
    });
  }

  /* تحقق نسخة قبل الوثوق بها: البصمة تطابق البيان، وفحص السلامة ناجح */
  function verify(dir) {
    const man = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
    const db = path.join(dir, 'mithaq.db'), f = (man.files || []).find(x => x.f === 'mithaq.db');
    if (!f || !fs.existsSync(db)) throw new Error('ملف القاعدة غير موجود في النسخة');
    if (sha(db) !== f.sha256) throw new Error('بصمة النسخة لا تطابق بيانها — قد تكون تلفت');
    const chk = new DatabaseSync(db, { readOnly: true });
    try { const r = chk.prepare('PRAGMA integrity_check').get().integrity_check; if (r !== 'ok') throw new Error('فحص سلامة النسخة فشل: ' + r) } finally { chk.close() }
    return man;
  }

  /* حفظ نسخة خارج الجهاز (قرص خارجي، فلاشة، مجلد مزامنة): نسخة جديدة الآن ثم نقلها مع المرفقات والتحقق منها هناك */
  function exportTo(target, by = '') {
    target = String(target || '').trim();
    if (!target || !path.isAbsolute(target)) return { ok: false, error: 'اختر مجلداً كاملاً، مثل F:\\ أو مجلد على قرص خارجي' };
    if (!fs.existsSync(target)) return { ok: false, error: 'المجلد غير موجود أو القرص غير موصول: ' + target };
    if (path.resolve(target).startsWith(path.resolve(ROOT))) return { ok: false, error: 'اختر مكاناً غير مجلد النسخ نفسه' };
    const r = run('export:' + by); if (!r.ok) return r;
    try {
      const base = path.join(target, 'Misbar-Backups'), dst = path.join(base, path.basename(r.dir));
      copyTree(r.dir, dst); const newMedia = copyTree(path.join(ROOT, 'media'), path.join(base, 'media'));
      verify(dst); prune(base);
      const ext = { t: Date.now(), at: r.at, dir: dst, how: 'export' };
      store.kv.set('backup_ext_last', ext);
      audit({ action: 'system.backup_export', detail: { dir: dst, by, newMedia } });
      return { ok: true, at: r.at, dir: dst, size: r.size, counts: r.counts, newMedia };
    } catch (e) { audit({ action: 'system.backup_failed', detail: { reason: 'export', error: e.message } }); return { ok: false, error: 'تعذّر الحفظ في ' + target + ': ' + e.message } }
  }

  /* الاستعادة: تُتحقق النسخة، وتؤخذ نسخة «ما قبل الاستعادة» من الوضع الحالي، ثم تُطبَّق عند إعادة التشغيل التالية (قبل فتح القاعدة) */
  function restore(id, by = '') {
    if (!ID_RX.test(String(id || ''))) return { ok: false, error: 'نسخة غير معروفة' };
    const src = path.join(ROOT, id);
    if (!fs.existsSync(src)) return { ok: false, error: 'النسخة غير موجودة' };
    let man; try { man = verify(src) } catch (e) { return { ok: false, error: e.message } }
    const pre = run('pre-restore:' + by, 'pre-restore');
    if (!pre.ok) return { ok: false, error: 'تعذّر أخذ نسخة من الوضع الحالي قبل الاستعادة: ' + pre.error };
    fs.writeFileSync(path.join(DATA, 'restore.pending.json'), JSON.stringify({ src, media: path.join(ROOT, 'media'), id, at: stampS(), by, pre: path.basename(pre.dir) }, null, 1));
    audit({ action: 'system.restore_requested', detail: { id, by, pre: path.basename(pre.dir), records: (man.counts || {}).records } });
    return { ok: true, id, pre: path.basename(pre.dir), restart: true };
  }

  /* التذكير الدوري: يحين إذا مرّ «remindHours» دون نسخة خارج الجهاز أو نسخة يدوية أو تأجيل */
  function remind(now = Date.now()) {
    const c = cfg(), hours = c.remindHours || 48;
    const ext = store.kv.get('backup_ext_last') || null, usr = store.kv.get('backup_user_last') || null, sn = store.kv.get('backup_snooze') || null;
    const base = Math.max(ext ? ext.t || 0 : 0, usr ? usr.t || 0 : 0, sn ? sn.t || 0 : 0);
    if (!base) { // أول تشغيل: لا تذكير قبل أن يمضي على التطبيق «remindHours»
      const first = store.kv.get('backup_first_seen') || (store.kv.set('backup_first_seen', now), now);
      return { due: now - first >= hours * 3600e3, hours, lastExternal: ext, lastUser: usr, last: store.kv.get('backup_last') || null };
    }
    return { due: now - base >= hours * 3600e3, hours, next: base + hours * 3600e3, lastExternal: ext, lastUser: usr, last: store.kv.get('backup_last') || null };
  }
  function snooze() { store.kv.set('backup_snooze', { t: Date.now() }); return remind() }

  function setCfg(x = {}) {
    const c = cfg();
    if ('mirror' in x) { const m = String(x.mirror || '').trim(); if (m && !path.isAbsolute(m)) return { ok: false, error: 'مسار النسخة الثانية يجب أن يكون كاملاً، مثل F:\\Misbar' }; if (m && !fs.existsSync(m)) return { ok: false, error: 'المجلد غير موجود أو القرص غير موصول: ' + m }; c.mirror = m }
    if ('remindHours' in x) { const h = Math.round(+x.remindHours); if (!(h >= 12 && h <= 336)) return { ok: false, error: 'فترة التذكير بين 12 ساعة وأسبوعين' }; c.remindHours = h }
    store.kv.set('backup_cfg', c); audit({ action: 'system.backup_cfg', detail: c });
    return { ok: true, ...status() };
  }

  function status() {
    const last = store.kv.get('backup_last') || null, MIRROR = mirrorDir();
    return { dir: ROOT, mirror: MIRROR || null, mirrorFromEnv: !!process.env.MQ_BACKUP_MIRROR, keep: KEEP, everyHours: EVERY_H, remindHours: cfg().remindHours, running, last, lastExternal: store.kv.get('backup_ext_last') || null, list: list().slice(0, 20) };
  }

  /* الجدولة: بعد دقيقة من التشغيل إن مرّ أكثر من الفترة، ثم فحص كل ساعة */
  function schedule() {
    const due = () => { const l = store.kv.get('backup_last'); if (!l || !l.ok || !l.at) return true; const t = Date.parse(String(l.at).replace(' ', 'T')); return !t || Date.now() - t > EVERY_H * 3600e3 - 5 * 60e3 };
    setTimeout(() => { if (due()) run('startup') }, 60e3).unref();
    setInterval(() => { if (due()) run('schedule') }, 3600e3).unref();
  }

  return { run, status, schedule, list, verify, exportTo, restore, remind, snooze, setCfg, ROOT };
}

/* تطبيق استعادة معلّقة عند بدء الخادم، قبل فتح القاعدة */
function applyPending(DATA, log = console) {
  const P = path.join(DATA, 'restore.pending.json');
  if (!fs.existsSync(P)) return null;
  let job; try { job = JSON.parse(fs.readFileSync(P, 'utf8')) } catch (e) { fs.renameSync(P, P + '.bad'); return null }
  const done = r => { fs.writeFileSync(path.join(DATA, 'restore.done.json'), JSON.stringify({ ...job, ...r, appliedAt: new Date().toISOString() }, null, 1)); fs.rmSync(P, { force: true }); return r };
  try {
    const db = path.join(job.src, 'mithaq.db');
    if (!fs.existsSync(db)) return done({ ok: false, error: 'ملف النسخة غير موجود' });
    for (const x of ['-wal', '-shm']) fs.rmSync(path.join(DATA, 'mithaq.db' + x), { force: true });
    fs.copyFileSync(db, path.join(DATA, 'mithaq.db'));
    for (const f of ['audit.key', 'vapid.json', 'push.json', 'mizan/credentials.json', 'mizan/.key']) { const s = path.join(job.src, f); if (fs.existsSync(s)) { fs.mkdirSync(path.dirname(path.join(DATA, f)), { recursive: true }); fs.copyFileSync(s, path.join(DATA, f)) } }
    let media = 0;
    const walk = (s, d) => { if (!fs.existsSync(s)) return; for (const e of fs.readdirSync(s, { withFileTypes: true })) { const a = path.join(s, e.name), b = path.join(d, e.name); if (e.isDirectory()) walk(a, b); else if (!fs.existsSync(b)) { fs.mkdirSync(d, { recursive: true }); fs.copyFileSync(a, b); media++ } } };
    walk(job.media, path.join(DATA, 'media'));
    log.log('[backup] restored', job.id, 'media', media);
    return done({ ok: true, media });
  } catch (e) { log.error('[backup] restore failed', e); return done({ ok: false, error: e.message }) }
}
module.exports = { create, applyPending };
