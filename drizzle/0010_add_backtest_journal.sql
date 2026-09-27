CREATE TABLE `backtest_strategies` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `initial_capital` real NOT NULL,
  `drawdown_limit_pct` real NOT NULL,
  `commission_usd` real NOT NULL,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `backtest_strategies_created_at_idx` ON `backtest_strategies` (`created_at`);
--> statement-breakpoint
CREATE TABLE `backtest_trades` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `strategy_id` integer NOT NULL,
  `result` text NOT NULL CHECK (`result` IN ('win', 'loss')),
  `amount_usd` real NOT NULL,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `backtest_trades_strategy_created_at_idx` ON `backtest_trades` (`strategy_id`, `created_at`);
