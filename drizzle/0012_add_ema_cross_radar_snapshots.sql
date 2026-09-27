CREATE TABLE `ema_cross_radar_snapshots` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `generated_at` integer NOT NULL,
  `payload` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ema_cross_radar_snapshots_generated_at_idx` ON `ema_cross_radar_snapshots` (`generated_at`);
