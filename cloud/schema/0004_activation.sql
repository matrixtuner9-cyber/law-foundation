-- التفعيل عبر الإنترنت لنسخ المسبار المكتبية: حساب تفعيل لكل مكتب (معرّف + كلمة مرور) وأجهزته
CREATE TABLE IF NOT EXISTS act_accounts (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  salt TEXT, hash TEXT, iter INTEGER,          -- PBKDF2-SHA256 لكلمة مرور التفعيل (لا تُحفظ الكلمة نفسها)
  seats INTEGER NOT NULL DEFAULT 1,            -- عدد الأجهزة الرئيسية المسموح تفعيلها
  edition TEXT NOT NULL DEFAULT 'connected',
  users INTEGER NOT NULL DEFAULT 5,
  exp TEXT,                                    -- YYYY-MM-DD أو فارغ = دائم
  ai INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',       -- active | suspended
  fails INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS act_devices (
  id TEXT PRIMARY KEY,                         -- معرّف الترخيص (8 hex) — يُبطَل به
  slug TEXT NOT NULL, fp TEXT NOT NULL, device TEXT, version TEXT, ip TEXT,
  status TEXT NOT NULL DEFAULT 'active',       -- active | revoked
  activated_at TEXT, last_seen TEXT,
  UNIQUE (slug, fp)
);
