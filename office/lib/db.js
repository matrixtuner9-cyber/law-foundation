// طبقة التخزين: قاعدة بيانات SQLite مدمجة (node:sqlite) بدل ملفات JSON
// - السجلات (موكلون، قضايا، جلسات…) تُحفظ سجلاً سجلاً، فيُعرف بالضبط ما تغيّر ومن غيّره
// - سجل التدقيق مسلسل بسلسلة HMAC ولا يقبل التعديل أو الحذف (Triggers)
const fs = require('fs'), path = require('path'), crypto = require('crypto');
process.removeAllListeners('warning'); // تحذير "experimental" في إصدارات Node الأقدم
const { DatabaseSync } = require('node:sqlite');

const COLL = ['clients', 'opponents', 'cases', 'hearings', 'deadlines', 'docs', 'rulings', 'lawforms', 'legalRefs'];

function open(DATA) {
  fs.mkdirSync(DATA, { recursive: true });
  const db = new DatabaseSync(path.join(DATA, 'mithaq.db'));
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    CREATE TABLE IF NOT EXISTS records(kind TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, updated_at TEXT, updated_by TEXT, PRIMARY KEY(kind, id));
    CREATE TABLE IF NOT EXISTS kv(key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY, client TEXT, at TEXT, data TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS messages_client ON messages(client);
    CREATE TABLE IF NOT EXISTS users(
      id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE, name TEXT NOT NULL, role TEXT NOT NULL,
      salt TEXT NOT NULL, hash TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, failed INTEGER NOT NULL DEFAULT 0,
      locked_until INTEGER NOT NULL DEFAULT 0, must_change INTEGER NOT NULL DEFAULT 0, cases TEXT NOT NULL DEFAULT '[]',
      created_at TEXT, last_login TEXT);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id TEXT NOT NULL, created INTEGER, expires INTEGER, ip TEXT, ua TEXT);
    CREATE TABLE IF NOT EXISTS audit(
      seq INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, user_id TEXT, username TEXT, action TEXT NOT NULL,
      entity TEXT, entity_id TEXT, detail TEXT, ip TEXT, prev TEXT NOT NULL, hash TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS audit_action ON audit(action);
    CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit BEGIN SELECT RAISE(ABORT, 'audit log is append-only'); END;
    CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit BEGIN SELECT RAISE(ABORT, 'audit log is append-only'); END;
  `);

  // صلاحيات مخصّصة لكل مستخدم (JSON)؛ فارغ = حسب دوره
  if (!db.prepare("SELECT 1 FROM pragma_table_info('users') WHERE name = 'perms'").get()) db.exec('ALTER TABLE users ADD COLUMN perms TEXT');

  let depth = 0; // معاملات متداخلة: الخارجية فقط تفتح وتغلق
  const tx = fn => {
    if (depth) { depth++; try { return fn() } finally { depth-- } }
    db.exec('BEGIN IMMEDIATE'); depth = 1;
    try { const r = fn(); db.exec('COMMIT'); return r } catch (e) { db.exec('ROLLBACK'); throw e } finally { depth = 0 }
  };
  const q = {
    kvGet: db.prepare('SELECT value FROM kv WHERE key = ?'),
    kvSet: db.prepare('INSERT INTO kv(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'),
    recAll: db.prepare('SELECT kind, data FROM records ORDER BY rowid'),
    recCount: db.prepare('SELECT COUNT(*) n FROM records'),
    recPut: db.prepare('INSERT INTO records(kind, id, data, updated_at, updated_by) VALUES(?, ?, ?, ?, ?) ON CONFLICT(kind, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at, updated_by = excluded.updated_by'),
    recDel: db.prepare('DELETE FROM records WHERE kind = ? AND id = ?'),
    recWipe: db.prepare('DELETE FROM records'),
    msgAll: db.prepare('SELECT data FROM messages ORDER BY at, rowid'),
    msgPut: db.prepare('INSERT INTO messages(id, client, at, data) VALUES(?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data'),
    auditLast: db.prepare('SELECT hash FROM audit ORDER BY seq DESC LIMIT 1'),
    auditAdd: db.prepare('INSERT INTO audit(at, user_id, username, action, entity, entity_id, detail, ip, prev, hash) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'),
  };

  /* مفتاح سلسلة التدقيق: ملف منفصل عن قاعدة البيانات */
  const KEY_F = path.join(DATA, 'audit.key');
  let auditKey; try { auditKey = fs.readFileSync(KEY_F) } catch (e) { auditKey = crypto.randomBytes(32); fs.writeFileSync(KEY_F, auditKey, { mode: 0o600 }) }
  const chain = (prev, e) => crypto.createHmac('sha256', auditKey).update(prev + '|' + [e.at, e.user_id, e.username, e.action, e.entity, e.entity_id, e.detail, e.ip].map(v => v ?? '').join('|')).digest('hex');

  const api = {
    raw: db, tx, COLL,
    kv: {
      get(k, d = null) { const r = q.kvGet.get(k); if (!r) return d; try { return JSON.parse(r.value) } catch (e) { return d } },
      set(k, v) { q.kvSet.run(k, JSON.stringify(v)) },
    },

    /* بيانات المكتب: null إن لم يُحفظ شيء بعد (تُستخدم البيانات التجريبية) */
    loadState() {
      if (!q.recCount.get().n && !api.kv.get('state_saved')) return null;
      const st = Object.fromEntries(COLL.map(c => [c, []]));
      for (const r of q.recAll.all()) if (st[r.kind]) st[r.kind].push(JSON.parse(r.data));
      st.mzLog = api.kv.get('mzLog', []);
      return st;
    },

    /* يحفظ الحالة الجديدة ويعيد قائمة بما تغيّر فعلاً (للتدقيق) */
    saveState(prev, next, by, at) {
      const changes = [];
      tx(() => {
        for (const kind of COLL) {
          const before = new Map(((prev && prev[kind]) || []).map(x => [String(x.id), x]));
          const list = (next[kind] || []).filter(x => x && typeof x === 'object');
          const seen = new Set(list.filter(x => x.id != null).map(x => String(x.id)));
          for (const x of list) if (x.id == null) { // سجلات بلا معرّف (مثل المهل): معرّف ثابت من محتواها
            let id = 'a' + crypto.createHash('sha1').update(kind + JSON.stringify(x)).digest('hex').slice(0, 10), n = 1;
            while (seen.has(id)) id = id.replace(/-\d+$/, '') + '-' + (++n);
            x.id = id; seen.add(id);
          }
          const after = new Map(list.map(x => [String(x.id), x]));
          for (const [id, rec] of after) {
            const old = before.get(id), js = JSON.stringify(rec);
            if (!old) { q.recPut.run(kind, id, js, at, by); changes.push({ op: 'create', kind, id, rec }) }
            else if (JSON.stringify(old) !== js) { q.recPut.run(kind, id, js, at, by); changes.push({ op: 'update', kind, id, rec, fields: diffFields(old, rec) }) }
          }
          for (const [id, rec] of before) if (!after.has(id)) { q.recDel.run(kind, id); changes.push({ op: 'delete', kind, id, rec }) }
        }
        api.kv.set('mzLog', next.mzLog || []);
        api.kv.set('state_saved', true);
      });
      return changes;
    },
    /* يكتب نتيجة الدمج الآمن (lib/merge.js) في معاملة واحدة */
    applyWrites(writes, mzLog, by, at) {
      tx(() => {
        for (const w of writes) {
          if (w.op === 'delete') q.recDel.run(w.kind, w.id);
          else q.recPut.run(w.kind, w.id, JSON.stringify(w.rec), at, by);
        }
        if (mzLog !== undefined) api.kv.set('mzLog', mzLog);
        api.kv.set('state_saved', true);
      });
    },
    putRecord(kind, rec, by, at) { q.recPut.run(kind, String(rec.id), JSON.stringify(rec), at, by); api.kv.set('state_saved', true) },
    resetState() { tx(() => { q.recWipe.run(); api.kv.set('state_saved', false); api.kv.set('mzLog', []) }) },

    /* الرسائل */
    loadMessages() { return q.msgAll.all().map(r => JSON.parse(r.data)) },
    putMessage(m) { q.msgPut.run(m.id, m.client, m.at || '', JSON.stringify(m)) },
    putMessages(list) { tx(() => list.forEach(api.putMessage)) },

    /* سجل التدقيق */
    audit(e) {
      const row = { at: e.at, user_id: e.user_id || null, username: e.username || null, action: e.action, entity: e.entity || null, entity_id: e.entity_id != null ? String(e.entity_id) : null, detail: e.detail == null ? null : JSON.stringify(e.detail), ip: e.ip || null };
      const prev = (q.auditLast.get() || {}).hash || 'GENESIS';
      const hash = chain(prev, row);
      q.auditAdd.run(row.at, row.user_id, row.username, row.action, row.entity, row.entity_id, row.detail, row.ip, prev, hash);
    },
    /* عمليات الذكاء الاصطناعي منذ تاريخ (لملخص الاستهلاك) */
    aiAudit(since) { return db.prepare("SELECT at, username, action, detail FROM audit WHERE action LIKE 'ai.%' AND at >= ? ORDER BY seq DESC LIMIT 20000").all(String(since || '')) },
    auditList({ limit = 200, before = null, action = '', user = '', text = '' } = {}) {
      const w = [], a = [];
      if (before) { w.push('seq < ?'); a.push(+before) }
      if (action) { w.push('action LIKE ?'); a.push(action + '%') }
      if (user) { w.push('username = ?'); a.push(user) }
      if (text) { w.push('(detail LIKE ? OR entity_id LIKE ?)'); a.push('%' + text + '%', '%' + text + '%') }
      const sql = `SELECT seq, at, user_id, username, action, entity, entity_id, detail, ip, hash FROM audit ${w.length ? 'WHERE ' + w.join(' AND ') : ''} ORDER BY seq DESC LIMIT ${Math.min(500, Math.max(1, +limit || 200))}`;
      return db.prepare(sql).all(...a).map(r => ({ ...r, detail: r.detail ? JSON.parse(r.detail) : null }));
    },
    auditVerify() {
      let prev = 'GENESIS', n = 0;
      for (const r of db.prepare('SELECT * FROM audit ORDER BY seq').iterate()) {
        if (r.prev !== prev || chain(prev, r) !== r.hash) return { ok: false, n, brokenAt: r.seq, at: r.at };
        prev = r.hash; n++;
      }
      return { ok: true, n };
    },
  };
  return api;
}

/* الحقول التي تغيّرت بين نسختين من السجل (قيم مختصرة للعرض في سجل التدقيق) */
function diffFields(a, b) {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]), out = [];
  const short = v => { const s = typeof v === 'string' ? v : JSON.stringify(v); return s == null ? '' : s.length > 80 ? s.slice(0, 77) + '…' : s };
  for (const k of keys) if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) out.push({ f: k, from: short(a[k]), to: short(b[k]) });
  return out.slice(0, 20);
}

module.exports = { open, COLL, diffFields };
