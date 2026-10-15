// المستخدمون والصلاحيات والجلسات (نفس منطق جهاز المكتب، وكلمات المرور الحالية تعمل كما هي: scrypt بنفس المعاملات)
import crypto from 'node:crypto';

export const ROLES = {
  admin:    { label: 'مدير النظام',   write: true,  all: true,  manage: true  },
  lawyer:   { label: 'محامٍ',          write: true,  all: true,  manage: false },
  external: { label: 'محامٍ خارجي',    write: false, all: false, manage: false },
  viewer:   { label: 'مطّلع',          write: false, all: true,  manage: false },
};
const SESSION_MS = 12 * 3600e3, LOCK_AFTER = 5, LOCK_MS = 15 * 60e3;
export const COOKIE = 'mq_s';

const hashPw = (pw, salt) => crypto.scryptSync(String(pw), salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
const tokenHash = t => crypto.createHash('sha256').update(t).digest('hex');
const rid = () => crypto.randomBytes(8).toString('hex');
const same = (a, b) => { const x = Buffer.from(a, 'hex'), y = Buffer.from(b, 'hex'); return x.length === y.length && crypto.timingSafeEqual(x, y) };

export function pwProblem(pw) {
  pw = String(pw || '');
  if (pw.length < 8) return 'كلمة المرور يجب ألا تقل عن 8 أحرف.';
  if (!/\d/.test(pw) || !/\D/.test(pw)) return 'كلمة المرور يجب أن تحتوي أرقاماً وحروفاً.';
  return null;
}

export function parseCookies(h) {
  const out = {}; String(h || '').split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) { try { out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()) } catch (e) {} } });
  return out;
}

export function createAuth(store) {
  const { get, all, run } = store;
  const byName = n => get('SELECT * FROM users WHERE username = ?', n);
  const byId = id => get('SELECT * FROM users WHERE id = ?', id);
  const pub = u => u && ({ id: u.id, username: u.username, name: u.name, role: u.role, roleLabel: (ROLES[u.role] || {}).label, active: !!u.active, mustChange: !!u.must_change, cases: JSON.parse(u.cases || '[]'), lastLogin: u.last_login, createdAt: u.created_at, locked: u.locked_until > Date.now() });

  const A = {
    ROLES, COOKIE, pub,
    hasUsers: () => get('SELECT COUNT(*) n FROM users').n > 0,
    list: () => all('SELECT * FROM users ORDER BY created_at').map(pub),
    get: id => pub(byId(id)),

    createUser({ username, name, role, password, cases = [], mustChange = false }, at) {
      username = String(username || '').trim();
      if (!/^[A-Za-z0-9._-]{3,32}$/.test(username)) throw new Error('اسم المستخدم: 3–32 حرفاً لاتينياً أو أرقاماً أو . _ -');
      if (!String(name || '').trim()) throw new Error('الاسم مطلوب.');
      if (!ROLES[role]) throw new Error('دور غير معروف.');
      const p = pwProblem(password); if (p) throw new Error(p);
      if (byName(username)) throw new Error('اسم المستخدم مستخدم من قبل.');
      const id = 'u' + rid(), salt = rid() + rid();
      run('INSERT INTO users(id, username, name, role, salt, hash, active, must_change, cases, created_at) VALUES(?, ?, ?, ?, ?, ?, 1, ?, ?, ?)',
        id, username, String(name).trim().slice(0, 80), role, salt, hashPw(password, salt), mustChange ? 1 : 0, JSON.stringify(cases), at);
      return pub(byId(id));
    },

    updateUser(id, { name, role, active, cases }, actorId) {
      const u = byId(id); if (!u) throw new Error('المستخدم غير موجود.');
      const next = { name: name != null ? String(name).trim().slice(0, 80) : u.name, role: role || u.role, active: active == null ? u.active : (active ? 1 : 0), cases: cases ? JSON.stringify(cases) : u.cases };
      if (!ROLES[next.role]) throw new Error('دور غير معروف.');
      if (id === actorId && (next.role !== 'admin' || !next.active)) throw new Error('لا يمكنك إلغاء صلاحية الإدارة أو تعطيل حسابك بنفسك.');
      if (u.role === 'admin' && (next.role !== 'admin' || !next.active)) {
        const admins = all('SELECT id FROM users WHERE role = ? AND active = 1 AND id <> ?', 'admin', id).length;
        if (!admins) throw new Error('يجب أن يبقى مدير نظام واحد فعّال على الأقل.');
      }
      run('UPDATE users SET name = ?, role = ?, active = ?, cases = ? WHERE id = ?', next.name, next.role, next.active, next.cases, id);
      if (!next.active || next.role !== u.role) run('DELETE FROM sessions WHERE user_id = ?', id);
      return { before: pub(u), after: pub(byId(id)) };
    },

    setPassword(id, password, mustChange = false) {
      const p = pwProblem(password); if (p) throw new Error(p);
      const salt = rid() + rid(); run('UPDATE users SET salt = ?, hash = ?, must_change = ? WHERE id = ?', salt, hashPw(password, salt), mustChange ? 1 : 0, id);
    },
    checkPassword(id, password) { const u = byId(id); return !!u && same(hashPw(password, u.salt), u.hash) },

    login(username, password, ip, ua, at) {
      const u = byName(String(username || '').trim());
      if (!u) { hashPw(password, 'x'.repeat(32)); return { error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' } }
      if (!u.active) return { error: 'هذا الحساب معطّل. راجع مدير النظام.', user: u };
      if (u.locked_until > Date.now()) return { error: `الحساب مقفل مؤقتاً بعد محاولات خاطئة متكررة. حاول بعد ${Math.ceil((u.locked_until - Date.now()) / 60e3)} دقيقة.`, user: u, locked: true };
      if (!same(hashPw(password, u.salt), u.hash)) {
        const f = u.failed + 1, lock = f >= LOCK_AFTER ? Date.now() + LOCK_MS : 0;
        run('UPDATE users SET failed = ?, locked_until = ? WHERE id = ?', lock ? 0 : f, lock, u.id);
        return { error: lock ? 'أُقفل الحساب 15 دقيقة بعد 5 محاولات خاطئة.' : 'اسم المستخدم أو كلمة المرور غير صحيحة.', user: u, locked: !!lock };
      }
      run('UPDATE users SET failed = 0, locked_until = 0, last_login = ? WHERE id = ?', at, u.id);
      const token = crypto.randomBytes(32).toString('base64url');
      run('INSERT INTO sessions(token, user_id, created, expires, ip, ua) VALUES(?, ?, ?, ?, ?, ?)', tokenHash(token), u.id, Date.now(), Date.now() + SESSION_MS, ip || null, String(ua || '').slice(0, 200));
      run('DELETE FROM sessions WHERE expires < ?', Date.now());
      return { user: pub(byId(u.id)), token };
    },

    logout(token) { if (token) run('DELETE FROM sessions WHERE token = ?', tokenHash(token)) },
    logoutUser(id) { run('DELETE FROM sessions WHERE user_id = ?', id) },

    fromReq(req) {
      const t = parseCookies(req.headers.get('cookie'))[COOKIE]; if (!t) return null;
      const s = get('SELECT * FROM sessions WHERE token = ?', tokenHash(t)); if (!s || s.expires < Date.now()) return null;
      const u = byId(s.user_id); if (!u || !u.active) return null;
      if (s.expires - Date.now() < SESSION_MS / 2) run('UPDATE sessions SET expires = ? WHERE token = ?', Date.now() + SESSION_MS, s.token);
      return { ...pub(u), token: t };
    },
    cookie(token, secure) { return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MS / 1000}${secure ? '; Secure' : ''}` },
    clearCookie(secure) { return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}` },
    can: (u, what) => !!(u && ROLES[u.role] && ROLES[u.role][what]),
  };
  return A;
}
