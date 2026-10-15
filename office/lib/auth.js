// المستخدمون والصلاحيات والجلسات
const crypto = require('crypto');

/* الأدوار: ما يستطيع كل دور فعله */
const ROLES = {
  admin:    { label: 'مدير النظام',   write: true,  all: true,  manage: true  },
  lawyer:   { label: 'محامٍ',          write: true,  all: true,  manage: false },
  external: { label: 'محامٍ خارجي',    write: false, all: false, manage: false },
  viewer:   { label: 'مطّلع',          write: false, all: true,  manage: false },
};
const SESSION_MS = 12 * 3600e3, LOCK_AFTER = 5, LOCK_MS = 15 * 60e3;
const COOKIE = 'mq_s';

const hashPw = (pw, salt) => crypto.scryptSync(String(pw), salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
const tokenHash = t => crypto.createHash('sha256').update(t).digest('hex');
const rid = () => crypto.randomBytes(8).toString('hex');

function pwProblem(pw) {
  pw = String(pw || '');
  if (pw.length < 8) return 'كلمة المرور يجب ألا تقل عن 8 أحرف.';
  if (!/\d/.test(pw) || !/\D/.test(pw)) return 'كلمة المرور يجب أن تحتوي أرقاماً وحروفاً.';
  return null;
}

function parseCookies(h) {
  const out = {}; String(h || '').split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()) });
  return out;
}

function create(store) {
  const db = store.raw;
  const q = {
    count: db.prepare('SELECT COUNT(*) n FROM users'),
    byName: db.prepare('SELECT * FROM users WHERE username = ?'),
    byId: db.prepare('SELECT * FROM users WHERE id = ?'),
    all: db.prepare('SELECT * FROM users ORDER BY created_at'),
    ins: db.prepare('INSERT INTO users(id, username, name, role, salt, hash, active, must_change, cases, created_at) VALUES(?, ?, ?, ?, ?, ?, 1, ?, ?, ?)'),
    fail: db.prepare('UPDATE users SET failed = ?, locked_until = ? WHERE id = ?'),
    okLogin: db.prepare('UPDATE users SET failed = 0, locked_until = 0, last_login = ? WHERE id = ?'),
    setPw: db.prepare('UPDATE users SET salt = ?, hash = ?, must_change = ? WHERE id = ?'),
    upd: db.prepare('UPDATE users SET name = ?, role = ?, active = ?, cases = ? WHERE id = ?'),
    sIns: db.prepare('INSERT INTO sessions(token, user_id, created, expires, ip, ua) VALUES(?, ?, ?, ?, ?, ?)'),
    sGet: db.prepare('SELECT * FROM sessions WHERE token = ?'),
    sTouch: db.prepare('UPDATE sessions SET expires = ? WHERE token = ?'),
    sDel: db.prepare('DELETE FROM sessions WHERE token = ?'),
    sDelUser: db.prepare('DELETE FROM sessions WHERE user_id = ?'),
    sGc: db.prepare('DELETE FROM sessions WHERE expires < ?'),
  };

  const pub = u => u && ({ id: u.id, username: u.username, name: u.name, role: u.role, roleLabel: (ROLES[u.role] || {}).label, active: !!u.active, mustChange: !!u.must_change, cases: JSON.parse(u.cases || '[]'), lastLogin: u.last_login, createdAt: u.created_at, locked: u.locked_until > Date.now() });

  const A = {
    ROLES, COOKIE,
    hasUsers: () => q.count.get().n > 0,
    list: () => q.all.all().map(pub),
    get: id => pub(q.byId.get(id)),
    pub,

    createUser({ username, name, role, password, cases = [], mustChange = false }, at) {
      username = String(username || '').trim();
      if (!/^[A-Za-z0-9._-]{3,32}$/.test(username)) throw new Error('اسم المستخدم: 3–32 حرفاً لاتينياً أو أرقاماً أو . _ -');
      if (!String(name || '').trim()) throw new Error('الاسم مطلوب.');
      if (!ROLES[role]) throw new Error('دور غير معروف.');
      const p = pwProblem(password); if (p) throw new Error(p);
      if (q.byName.get(username)) throw new Error('اسم المستخدم مستخدم من قبل.');
      const id = 'u' + rid(), salt = rid() + rid();
      q.ins.run(id, username, String(name).trim().slice(0, 80), role, salt, hashPw(password, salt), mustChange ? 1 : 0, JSON.stringify(cases), at);
      return pub(q.byId.get(id));
    },

    updateUser(id, { name, role, active, cases }, actorId) {
      const u = q.byId.get(id); if (!u) throw new Error('المستخدم غير موجود.');
      const next = { name: name != null ? String(name).trim().slice(0, 80) : u.name, role: role || u.role, active: active == null ? u.active : (active ? 1 : 0), cases: cases ? JSON.stringify(cases) : u.cases };
      if (!ROLES[next.role]) throw new Error('دور غير معروف.');
      if (id === actorId && (next.role !== 'admin' || !next.active)) throw new Error('لا يمكنك إلغاء صلاحية الإدارة أو تعطيل حسابك بنفسك.');
      if (u.role === 'admin' && (next.role !== 'admin' || !next.active)) {
        const admins = q.all.all().filter(x => x.role === 'admin' && x.active && x.id !== id).length;
        if (!admins) throw new Error('يجب أن يبقى مدير نظام واحد فعّال على الأقل.');
      }
      q.upd.run(next.name, next.role, next.active, next.cases, id);
      if (!next.active || next.role !== u.role) q.sDelUser.run(id);
      return { before: pub(u), after: pub(q.byId.get(id)) };
    },

    setPassword(id, password, mustChange = false) {
      const p = pwProblem(password); if (p) throw new Error(p);
      const salt = rid() + rid(); q.setPw.run(salt, hashPw(password, salt), mustChange ? 1 : 0, id);
    },
    checkPassword(id, password) { const u = q.byId.get(id); return !!u && crypto.timingSafeEqual(Buffer.from(hashPw(password, u.salt), 'hex'), Buffer.from(u.hash, 'hex')) },

    /* تسجيل الدخول: يعيد {user, token} أو {error, user?} */
    login(username, password, ip, ua, at) {
      const u = q.byName.get(String(username || '').trim());
      if (!u) { hashPw(password, 'x'.repeat(32)); return { error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' } }
      if (!u.active) return { error: 'هذا الحساب معطّل. راجع مدير النظام.', user: u };
      if (u.locked_until > Date.now()) return { error: `الحساب مقفل مؤقتاً بعد محاولات خاطئة متكررة. حاول بعد ${Math.ceil((u.locked_until - Date.now()) / 60e3)} دقيقة.`, user: u, locked: true };
      const ok = crypto.timingSafeEqual(Buffer.from(hashPw(password, u.salt), 'hex'), Buffer.from(u.hash, 'hex'));
      if (!ok) {
        const f = u.failed + 1, lock = f >= LOCK_AFTER ? Date.now() + LOCK_MS : 0;
        q.fail.run(lock ? 0 : f, lock, u.id);
        return { error: lock ? 'أُقفل الحساب 15 دقيقة بعد 5 محاولات خاطئة.' : 'اسم المستخدم أو كلمة المرور غير صحيحة.', user: u, locked: !!lock };
      }
      q.okLogin.run(at, u.id);
      const token = crypto.randomBytes(32).toString('base64url');
      q.sIns.run(tokenHash(token), u.id, Date.now(), Date.now() + SESSION_MS, ip || null, String(ua || '').slice(0, 200));
      q.sGc.run(Date.now());
      return { user: pub(q.byId.get(u.id)), token };
    },

    logout(token) { if (token) q.sDel.run(tokenHash(token)) },
    logoutUser(id) { q.sDelUser.run(id) },

    /* المستخدم صاحب الطلب (من الكوكي) أو null */
    fromReq(req) {
      const t = parseCookies(req.headers.cookie)[COOKIE]; if (!t) return null;
      const s = q.sGet.get(tokenHash(t)); if (!s || s.expires < Date.now()) return null;
      const u = q.byId.get(s.user_id); if (!u || !u.active) return null;
      if (s.expires - Date.now() < SESSION_MS / 2) q.sTouch.run(Date.now() + SESSION_MS, s.token); // تجديد عند النشاط
      return { ...pub(u), token: t };
    },
    cookie(token) { return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MS / 1000}` },
    clearCookie() { return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0` },
    can: (u, what) => !!(u && ROLES[u.role] && ROLES[u.role][what]),
  };
  return A;
}

module.exports = { create, ROLES, pwProblem, parseCookies };
