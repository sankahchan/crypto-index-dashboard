CREATE TABLE market_alert_preferences (
  id INTEGER PRIMARY KEY,
  extreme_fear INTEGER NOT NULL DEFAULT 0,
  extreme_greed INTEGER NOT NULL DEFAULT 0,
  last_state TEXT,
  updated_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE market_alert_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('extreme_fear', 'extreme_greed')),
  score INTEGER NOT NULL,
  fear_greed INTEGER NOT NULL,
  triggered_at INTEGER NOT NULL,
  dismissed INTEGER NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE INDEX market_alert_events_triggered_at_idx ON market_alert_events (triggered_at);
