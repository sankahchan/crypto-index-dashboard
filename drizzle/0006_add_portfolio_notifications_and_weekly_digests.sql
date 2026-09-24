CREATE TABLE `portfolio_holdings` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `symbol` text NOT NULL,
  `quantity` real NOT NULL,
  `average_cost` real,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `portfolio_holdings_symbol_uidx` ON `portfolio_holdings` (`symbol`);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
  `id` integer PRIMARY KEY NOT NULL,
  `price_alerts` integer DEFAULT false NOT NULL,
  `market_alerts` integer DEFAULT false NOT NULL,
  `weekly_digest` integer DEFAULT false NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `weekly_market_digests` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `generated_at` integer NOT NULL,
  `market_as_of` integer NOT NULL,
  `payload` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `weekly_market_digests_generated_at_idx` ON `weekly_market_digests` (`generated_at`);
