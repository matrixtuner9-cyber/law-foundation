// النسخ الاحتياطي التلقائي لخادم المكتب
// - نسخة يومية متسقة للقاعدة الحية (VACUUM INTO) + المفاتيح + المرفقات (تراكمياً، فالمرفقات لا تتغير بعد رفعها)
// - فحص سلامة النسخة بعد أخذها (integrity_check) وبصمات SHA-256 في ملف manifest.json
// - الاحتفاظ بآخر 14 نسخة يومية، ونسخة إضافية اختيارية في مسار ثانٍ (قرص خارجي أو مجلد مزامنة سحابية) عبر MQ_BACKUP_MIRROR
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

function create({ store, DATA, audit, stampS, log = console }) {
  const ROOT = process.env.MQ_BACKUP_DIR || path.resolve(DATA, '..', '..', 'MithaqBackups');
  const MIRROR = process.env.MQ_BACKUP_MIRROR || '';
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

  function run(reason = 'schedule') {
    if (running) return { ok: false, error: 'نسخة قيد التنفيذ' };
    running = true; const t0 = Date.now();
    try {
      const dir = path.join(ROOT, 'auto_' + stampF()); fs.mkdirSync(dir, { recursive: true });
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
      const pruned = prune(ROOT);
      const res = { ok: true, at: manifest.at, dir, size: manifest.files[0].size, counts, newMedia, mediaCount, mirror, pruned, ms: Date.now() - t0 };
      store.kv.set('backup_last', res);
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

  function status() {
    const last = store.kv.get('backup_last') || null;
    return { dir: ROOT, mirror: MIRROR || null, keep: KEEP, everyHours: EVERY_H, running, last };
  }

  /* الجدولة: بعد دقيقة من التشغيل إن مرّ أكثر من الفترة، ثم فحص كل ساعة */
  function schedule() {
    const due = () => { const l = store.kv.get('backup_last'); if (!l || !l.ok || !l.at) return true; const t = Date.parse(String(l.at).replace(' ', 'T')); return !t || Date.now() - t > EVERY_H * 3600e3 - 5 * 60e3 };
    setTimeout(() => { if (due()) run('startup') }, 60e3).unref();
    setInterval(() => { if (due()) run('schedule') }, 3600e3).unref();
  }

  return { run, status, schedule, ROOT };
}
module.exports = { create };
