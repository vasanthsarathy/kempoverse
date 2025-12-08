-- Create entries table
CREATE TABLE entries (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  belts TEXT,            -- JSON-encoded array: '["Green", "Brown 3rd"]'
  tags TEXT NOT NULL,    -- JSON-encoded array: '["haymaker", "club-defense"]'
  content_md TEXT NOT NULL,
  reference_urls TEXT,   -- JSON-encoded array: '["https://youtube.com/..."]'
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Index for category filtering (primary use case)
CREATE INDEX idx_entries_category ON entries(category);

-- Index for tag-based searches
CREATE INDEX idx_entries_tags ON entries(tags);

-- Index for subcategory filtering
CREATE INDEX idx_entries_subcategory ON entries(subcategory) WHERE subcategory IS NOT NULL;

-- Full-text search index on title and content
CREATE VIRTUAL TABLE entries_fts USING fts5(
  id UNINDEXED,
  title,
  content_md,
  content='entries',
  content_rowid='rowid'
);

-- Triggers to keep FTS index in sync
CREATE TRIGGER entries_fts_insert AFTER INSERT ON entries BEGIN
  INSERT INTO entries_fts(id, title, content_md)
  VALUES (new.id, new.title, new.content_md);
END;

CREATE TRIGGER entries_fts_delete AFTER DELETE ON entries BEGIN
  DELETE FROM entries_fts WHERE id = old.id;
END;

CREATE TRIGGER entries_fts_update AFTER UPDATE ON entries BEGIN
  UPDATE entries_fts SET title = new.title, content_md = new.content_md
  WHERE id = old.id;
END;
