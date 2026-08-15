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

-- Example Insert based on previous draft
-- INSERT INTO stations (id, name, category_id, stream_url, fallback_urls, logo_url, status, clear_keys, subscription_type)
-- VALUES (
--   'SuriaFM',
--   'SURIA FM',
--   'RADIO',
--   'https://playerservices.streamtheworld.com/api/livestream-redirect/SURIA_FMAAC',
--   'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Suria_logo-01.png/1280px-Suria_logo-01.png',
--   'working',
--   '[{"keyid": "", "key": ""}]',
--   'FREE'
-- );