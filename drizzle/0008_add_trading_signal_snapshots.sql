CREATE TABLE `trading_signal_snapshots` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `symbol` text NOT NULL,
  `generated_at` integer NOT NULL,
  `market_as_of` integer NOT NULL,
  `payload` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `trading_signal_snapshots_symbol_generated_at_idx` ON `trading_signal_snapshots` (`symbol`, `generated_at`);
