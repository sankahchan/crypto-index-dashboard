CREATE TABLE `daily_market_updates` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `generated_at` integer NOT NULL,
  `market_as_of` integer NOT NULL,
  `payload` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `daily_market_updates_generated_at_idx` ON `daily_market_updates` (`generated_at`);
