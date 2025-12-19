-- Migration: Create training tables for practice sessions
-- Date: 2025-12-19

-- Training sessions table
CREATE TABLE training_sessions (
  id TEXT PRIMARY KEY,
  duration_minutes INTEGER NOT NULL,
  categories TEXT NOT NULL,               -- JSON-encoded array
  entry_count INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT NOT NULL DEFAULT 'active'   -- 'active' | 'completed' | 'abandoned'
);

CREATE INDEX idx_training_sessions_started ON training_sessions(started_at DESC);
CREATE INDEX idx_training_sessions_status ON training_sessions(status);

-- Training session items table
CREATE TABLE training_session_items (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  entry_id TEXT NOT NULL,
  entry_title TEXT NOT NULL,
  entry_category TEXT NOT NULL,
  time_allocated_seconds INTEGER NOT NULL,
  variation_type TEXT,                    -- 'stance' | 'speed' | 'focus' | 'repetition' | NULL
  variation_text TEXT,                    -- e.g., "in left stance", "at double speed"
  sequence_order INTEGER NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
);

CREATE INDEX idx_session_items_session ON training_session_items(session_id, sequence_order);
CREATE INDEX idx_session_items_entry ON training_session_items(entry_id);
