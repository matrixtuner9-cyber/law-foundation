// طبقة التخزين داخل Durable Object لكل مكتب: SQLite مدمج (ctx.storage.sql)
// نفس مخطط قاعدة جهاز المكتب (mithaq.db) لتسهيل النقل، مع سجل تدقيق متسلسل بسلسلة HMAC لا يقبل التعديل أو الحذف.
import crypto from 'node:crypto';

export const COLL = ['clients', 'opponents', 'cases', 'hearings', 'deadlines', 'docs', 'rulings', 'lawforms'];

const SCHEMA = `
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
  CREATE TABLE IF NOT EXISTS throttle(k TEXT PRIMARY KEY, n INTEGER NOT NULL, at INTEGER NOT NULL);
`;

export function openStore(ctx) {
  const sql = ctx.storage.sql;
  sql.exec(SCHEMA);
  const all = (q, ...a) => sql.exec(q, ...a).toArray();
  const get = (q, ...a) => all(q, ...a)[0];
  const run = (q, ...a) => { sql.exec(q, ...a) };

  let depth = 0;
  const tx = fn => {
    if (depth) { depth++; try { return fn() } finally { depth-- } }
    depth = 1; try { return ctx.storage.transactionSync(fn) } finally { depth = 0 }
  };

  const kv = {
    get(k, d = null) { const r = get('SELECT value FROM kv WHERE key = ?', k); if (!r) return d; try { return JSON.parse(r.value) } catch (e) { return d } },
    set(k, v) { run('INSERT INTO kv(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', k, JSON.stringify(v)) },
  };

  /* مفتاح سلسلة التدقيق: خاص بكل مكتب، يُنشأ مرة واحدة (أو يُنقل من جهاز المكتب) */
  const auditKey = () => {
    let k = kv.get('audit_key');
    if (!k) { k = crypto.randomBytes(32).toString('hex'); kv.set('audit_key', k) }
    return Buffer.from(k, 'hex');
  };
  const chain = (prev, e) => crypto.createHmac('sha256', auditKey()).update(prev + '|' + [e.at, e.user_id, e.username, e.action, e.entity, e.entity_id, e.detail, e.ip].map(v => v ?? '').join('|')).digest('hex');
  const recPut = (kind, id, js, at, by) => run('INSERT INTO records(kind, id, data, updated_at, updated_by) VALUES(?, ?, ?, ?, ?) ON CONFLICT(kind, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at, updated_by = excluded.updated_by', kind, id, js, at, by);

  const api = {
    sql, all, get, run, tx, kv, COLL,

    loadState() {
      if (!get('SELECT COUNT(*) n FROM records').n && !kv.get('state_saved')) return null;
      const st = Object.fromEntries(COLL.map(c => [c, []]));
      for (const r of all('SELECT kind, data FROM records ORDER BY rowid')) if (st[r.kind]) st[r.kind].push(JSON.parse(r.data));
      st.mzLog = kv.get('mzLog', []);
      return st;
    },

    saveState(prev, next, by, at) {
      const changes = [];
      tx(() => {
        for (const kind of COLL) {
          const before = new Map(((prev && prev[kind]) || []).map(x => [String(x.id), x]));
          const list = (next[kind] || []).filter(x => x && typeof x === 'object');
          const seen = new Set(list.filter(x => x.id != null).map(x => String(x.id)));
          for (const x of list) if (x.id == null) {
            let id = 'a' + crypto.createHash('sha1').update(kind + JSON.stringify(x)).digest('hex').slice(0, 10), n = 1;
            while (seen.has(id)) id = id.replace(/-\d+$/, '') + '-' + (++n);
            x.id = id; seen.add(id);
          }
          const after = new Map(list.map(x => [String(x.id), x]));
          for (const [id, rec] of after) {
            const old = before.get(id), js = JSON.stringify(rec);
            if (!old) { recPut(kind, id, js, at, by); changes.push({ op: 'create', kind, id, rec }) }
            else if (JSON.stringify(old) !== js) { recPut(kind, id, js, at, by); changes.push({ op: 'update', kind, id, rec, fields: diffFields(old, rec) }) }
          }
          for (const [id, rec] of before) if (!after.has(id)) { run('DELETE FROM records WHERE kind = ? AND id = ?', kind, id); changes.push({ op: 'delete', kind, id, rec }) }
        }
        kv.set('mzLog', next.mzLog || []);
        kv.set('state_saved', true);
      });
      return changes;
    },
    /* يكتب نتيجة الدمج الآمن (merge.js) في معاملة واحدة */
    applyWrites(writes, mzLog, by, at) {
      tx(() => {
        for (const w of writes) { if (w.op === 'delete') run('DELETE FROM records WHERE kind = ? AND id = ?', w.kind, w.id); else recPut(w.kind, w.id, JSON.stringify(w.rec), at, by) }
        if (mzLog !== undefined) kv.set('mzLog', mzLog);
        kv.set('state_saved', true);
      });
    },
    putRecord(kind, rec, by, at) { recPut(kind, String(rec.id), JSON.stringify(rec), at, by); kv.set('state_saved', true) },
    resetState() { tx(() => { run('DELETE FROM records'); kv.set('state_saved', false); kv.set('mzLog', []) }) },

    loadMessages() { return all('SELECT data FROM messages ORDER BY at, rowid').map(r => JSON.parse(r.data)) },
    putMessage(m) { run('INSERT INTO messages(id, client, at, data) VALUES(?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data', m.id, m.client, m.at || '', JSON.stringify(m)) },
    putMessages(list) { tx(() => list.forEach(api.putMessage)) },

    audit(e) {
      const row = { at: e.at, user_id: e.user_id || null, username: e.username || null, action: e.action, entity: e.entity || null, entity_id: e.entity_id != null ? String(e.entity_id) : null, detail: e.detail == null ? null : JSON.stringify(e.detail), ip: e.ip || null };
      const prev = (get('SELECT hash FROM audit ORDER BY seq DESC LIMIT 1') || {}).hash || 'GENESIS';
      run('INSERT INTO audit(at, user_id, username, action, entity, entity_id, detail, ip, prev, hash) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        row.at, row.user_id, row.username, row.action, row.entity, row.entity_id, row.detail, row.ip, prev, chain(prev, row));
    },
    auditList({ limit = 200, before = null, action = '', user = '', text = '' } = {}) {
      const w = [], a = [];
      if (before) { w.push('seq < ?'); a.push(+before) }
      if (action) { w.push('action LIKE ?'); a.push(action + '%') }
      if (user) { w.push('username = ?'); a.push(user) }
      if (text) { w.push('(detail LIKE ? OR entity_id LIKE ?)'); a.push('%' + text + '%', '%' + text + '%') }
      const q = `SELECT seq, at, user_id, username, action, entity, entity_id, detail, ip, hash FROM audit ${w.length ? 'WHERE ' + w.join(' AND ') : ''} ORDER BY seq DESC LIMIT ${Math.min(500, Math.max(1, +limit || 200))}`;
      return all(q, ...a).map(r => ({ ...r, detail: r.detail ? JSON.parse(r.detail) : null }));
    },
    auditVerify() {
      let prev = 'GENESIS', n = 0;
      for (const r of sql.exec('SELECT * FROM audit ORDER BY seq')) {
        if (r.prev !== prev || chain(prev, r) !== r.hash) return { ok: false, n, brokenAt: r.seq, at: r.at };
        prev = r.hash; n++;
      }
      return { ok: true, n };
    },

    /* حماية من التخمين: عدّاد لكل مفتاح (عنوان IP + نوع العملية) داخل نافذة زمنية */
    hit(key, max, windowMs) {
      const now = Date.now(), r = get('SELECT n, at FROM throttle WHERE k = ?', key);
      const n = r && now - r.at < windowMs ? r.n + 1 : 1, at = r && now - r.at < windowMs ? r.at : now;
      run('INSERT INTO throttle(k, n, at) VALUES(?, ?, ?) ON CONFLICT(k) DO UPDATE SET n = excluded.n, at = excluded.at', key, n, at);
      if (Math.random() < 0.02) run('DELETE FROM throttle WHERE at < ?', now - 24 * 3600e3);
      return n > max;
    },
    blocked(key, max, windowMs) { const r = get('SELECT n, at FROM throttle WHERE k = ?', key); return !!r && Date.now() - r.at < windowMs && r.n >= max },
  };
  return api;
}

export function diffFields(a, b) {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]), out = [];
  const short = v => { const s = typeof v === 'string' ? v : JSON.stringify(v); return s == null ? '' : s.length > 80 ? s.slice(0, 77) + '…' : s };
  for (const k of keys) if (JSON.stringify((a || {})[k]) !== JSON.stringify((b || {})[k])) out.push({ f: k, from: short((a || {})[k]), to: short((b || {})[k]) });
  return out.slice(0, 20);
}
