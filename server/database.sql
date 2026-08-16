-- Turso (SQLite) database schema for Malaysian Radios

CREATE TABLE IF NOT EXISTS stations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category_id TEXT,
  stream_url TEXT NOT NULL,
  logo_url TEXT,
  status TEXT DEFAULT 'working',
  clear_keys TEXT, -- Store as JSON string, e.g., '[{"keyid": "...", "key": "..."}]'
  subscription_type TEXT DEFAULT 'FREE'
);

CREATE TABLE IF NOT EXISTS blocked_tokens (
  token TEXT PRIMARY KEY,
  blocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reason TEXT
);