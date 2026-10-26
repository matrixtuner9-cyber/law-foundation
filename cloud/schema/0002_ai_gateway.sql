-- الخادم الوسيط لعقل المسبار: استهلاك كل مكتب شهرياً، وإيقاف/رصيد مكتب، والتراخيص المُبطلة
CREATE TABLE IF NOT EXISTS ai_usage(slug TEXT NOT NULL, month TEXT NOT NULL, requests INTEGER NOT NULL DEFAULT 0, tokens_in INTEGER NOT NULL DEFAULT 0, tokens_out INTEGER NOT NULL DEFAULT 0, updated_at TEXT, PRIMARY KEY(slug, month));
CREATE TABLE IF NOT EXISTS ai_offices(slug TEXT PRIMARY KEY, status TEXT NOT NULL DEFAULT 'active', monthly_tokens INTEGER, note TEXT);
CREATE TABLE IF NOT EXISTS ai_revoked(id TEXT PRIMARY KEY, at TEXT);
