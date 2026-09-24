CREATE TABLE watchlist_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX watchlist_items_symbol_uidx ON watchlist_items (symbol);
--> statement-breakpoint
CREATE TABLE price_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('above', 'below')),
  target_price REAL NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  triggered_at INTEGER,
  triggered_price REAL
);
--> statement-breakpoint
CREATE INDEX price_alerts_active_idx ON price_alerts (active);
