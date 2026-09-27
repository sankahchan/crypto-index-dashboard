UPDATE `market_alert_preferences`
SET `extreme_fear` = 1,
    `extreme_greed` = 1,
    `last_state` = NULL,
    `updated_at` = (unixepoch('now') * 1000)
WHERE `id` = 1;
--> statement-breakpoint
UPDATE `notification_preferences`
SET `price_alerts` = 1,
    `market_alerts` = 1,
    `weekly_digest` = 1,
    `signal_alerts` = 1,
    `updated_at` = (unixepoch('now') * 1000)
WHERE `id` = 1;
