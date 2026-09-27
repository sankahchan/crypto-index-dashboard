ALTER TABLE `ema_cross_radar_snapshots` ADD `timeframe` text DEFAULT '1D' NOT NULL;
--> statement-breakpoint
CREATE INDEX `ema_cross_radar_snapshots_timeframe_generated_at_idx` ON `ema_cross_radar_snapshots` (`timeframe`,`generated_at`);
