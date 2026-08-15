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