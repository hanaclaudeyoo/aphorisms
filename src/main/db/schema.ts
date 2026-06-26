export const CURRENT_SCHEMA_VERSION = 2;

export const CREATE_SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tag_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  name TEXT NOT NULL COLLATE NOCASE,
  color_hex TEXT CHECK (
    color_hex IS NULL
    OR color_hex GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'
  ),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES tag_groups(id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_group_name
  ON tags(group_id, name);

CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  body TEXT NOT NULL CHECK (length(trim(body)) > 0),
  entry_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_entries_entry_date
  ON entries(entry_date);

CREATE TABLE IF NOT EXISTS entry_chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL,
  body TEXT NOT NULL CHECK (length(trim(body)) > 0),
  start_offset INTEGER,
  end_offset INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE,
  UNIQUE (entry_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_entry_chunks_entry_id
  ON entry_chunks(entry_id);

CREATE TABLE IF NOT EXISTS entry_tags (
  entry_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (entry_id, tag_id),
  FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_entry_tags_tag_id
  ON entry_tags(tag_id);

CREATE VIRTUAL TABLE IF NOT EXISTS entry_chunks_fts
  USING fts5(body, content='entry_chunks', content_rowid='id');

CREATE TRIGGER IF NOT EXISTS entry_chunks_ai AFTER INSERT ON entry_chunks BEGIN
  INSERT INTO entry_chunks_fts(rowid, body) VALUES (new.id, new.body);
END;

CREATE TRIGGER IF NOT EXISTS entry_chunks_ad AFTER DELETE ON entry_chunks BEGIN
  INSERT INTO entry_chunks_fts(entry_chunks_fts, rowid, body)
  VALUES('delete', old.id, old.body);
END;

CREATE TRIGGER IF NOT EXISTS entry_chunks_au AFTER UPDATE ON entry_chunks BEGIN
  INSERT INTO entry_chunks_fts(entry_chunks_fts, rowid, body)
  VALUES('delete', old.id, old.body);
  INSERT INTO entry_chunks_fts(rowid, body) VALUES (new.id, new.body);
END;

CREATE TABLE IF NOT EXISTS chunk_embeddings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chunk_id INTEGER NOT NULL,
  model TEXT NOT NULL,
  dimensions INTEGER NOT NULL,
  embedding BLOB NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chunk_id) REFERENCES entry_chunks(id) ON DELETE CASCADE,
  UNIQUE (chunk_id, model)
);

CREATE INDEX IF NOT EXISTS idx_chunk_embeddings_model
  ON chunk_embeddings(model);
`;
