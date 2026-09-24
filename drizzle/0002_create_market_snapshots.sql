DROP TABLE IF EXISTS entries;
--> statement-breakpoint
CREATE TABLE market_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fetched_at INTEGER NOT NULL,
  score INTEGER NOT NULL,
  sentiment TEXT NOT NULL,
  payload TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX market_snapshots_fetched_at_idx ON market_snapshots (fetched_at);
