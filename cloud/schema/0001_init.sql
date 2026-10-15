-- القاعدة المركزية المشتركة (D1): سجل المكاتب + دليل المحامين العام. لا بيانات موكلين هنا إطلاقاً.
CREATE TABLE IF NOT EXISTS offices(slug TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', plan TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS bar_dir(mno TEXT PRIMARY KEY, name TEXT, status TEXT, city TEXT, office TEXT, address TEXT, phones TEXT, email TEXT, page INTEGER, norm TEXT);
CREATE INDEX IF NOT EXISTS bar_city ON bar_dir(city);
CREATE INDEX IF NOT EXISTS bar_status ON bar_dir(status);
