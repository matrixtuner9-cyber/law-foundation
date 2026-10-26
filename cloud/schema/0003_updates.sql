-- التحديث التلقائي لنسخ المسبار المكتبية (misbar.palgaz.net/updates)
CREATE TABLE IF NOT EXISTS app_releases (
  version TEXT PRIMARY KEY,               -- 1.0.5
  channel TEXT NOT NULL DEFAULT 'stable', -- stable | beta
  size INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  sig TEXT NOT NULL,                      -- توقيع المورّد (Ed25519) على version|sha256|size|min_electron
  min_electron INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  rollout INTEGER NOT NULL DEFAULT 0,     -- نسبة المكاتب التي تستلمه 0–100 (طرح تدريجي)
  status TEXT NOT NULL DEFAULT 'paused',  -- active | paused | withdrawn
  uploaded INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS update_offices (
  slug TEXT PRIMARY KEY,
  channel TEXT NOT NULL DEFAULT 'stable', -- beta: يستلم الإصدارات التجريبية أولاً
  hold INTEGER NOT NULL DEFAULT 0,        -- 1: لا تحديثات لهذا المكتب
  max_version TEXT,                       -- تثبيت المكتب على إصدار أقصى
  note TEXT
);
CREATE TABLE IF NOT EXISTS update_seen (
  slug TEXT NOT NULL, fp TEXT NOT NULL,
  version TEXT, electron INTEGER, offered TEXT, downloaded TEXT,
  last_check TEXT, last_download TEXT,
  PRIMARY KEY (slug, fp)
);
