ALTER TABLE `portfolio_holdings` ADD `acquired_on` text;
--> statement-breakpoint
ALTER TABLE `notification_preferences` ADD `signal_alerts` integer DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE TABLE `trading_signal_events` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `symbol` text NOT NULL,
  `previous_verdict` text NOT NULL,
  `new_verdict` text NOT NULL,
  `confidence` integer NOT NULL,
  `triggered_at` integer NOT NULL,
  `dismissed` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX `trading_signal_events_triggered_at_idx` ON `trading_signal_events` (`triggered_at`);