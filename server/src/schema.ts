import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const marketSnapshots = sqliteTable(
  "market_snapshots",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    fetchedAt: integer("fetched_at", { mode: "timestamp_ms" }).notNull(),
    score: integer("score").notNull(),
    sentiment: text("sentiment").notNull(),
    payload: text("payload").notNull(),
  },
  (table) => [index("market_snapshots_fetched_at_idx").on(table.fetchedAt)],
);

export const watchlistItems = sqliteTable(
  "watchlist_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    symbol: text("symbol").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [uniqueIndex("watchlist_items_symbol_uidx").on(table.symbol)],
);

export const priceAlerts = sqliteTable(
  "price_alerts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    symbol: text("symbol").notNull(),
    direction: text("direction", { enum: ["above", "below"] }).notNull(),
    targetPrice: real("target_price").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    triggeredAt: integer("triggered_at", { mode: "timestamp_ms" }),
    triggeredPrice: real("triggered_price"),
  },
  (table) => [index("price_alerts_active_idx").on(table.active)],
);

export const marketAlertPreferences = sqliteTable("market_alert_preferences", {
  id: integer("id").primaryKey(),
  extremeFear: integer("extreme_fear", { mode: "boolean" }).notNull().default(false),
  extremeGreed: integer("extreme_greed", { mode: "boolean" }).notNull().default(false),
  lastState: text("last_state"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const marketAlertEvents = sqliteTable(
  "market_alert_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kind: text("kind", { enum: ["extreme_fear", "extreme_greed"] }).notNull(),
    score: integer("score").notNull(),
    fearGreed: integer("fear_greed").notNull(),
    triggeredAt: integer("triggered_at", { mode: "timestamp_ms" }).notNull(),
    dismissed: integer("dismissed", { mode: "boolean" }).notNull().default(false),
  },
  (table) => [index("market_alert_events_triggered_at_idx").on(table.triggeredAt)],
);

export const dailyMarketUpdates = sqliteTable(
  "daily_market_updates",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    generatedAt: integer("generated_at", { mode: "timestamp_ms" }).notNull(),
    marketAsOf: integer("market_as_of", { mode: "timestamp_ms" }).notNull(),
    payload: text("payload").notNull(),
  },
  (table) => [index("daily_market_updates_generated_at_idx").on(table.generatedAt)],
);

export const portfolioHoldings = sqliteTable(
  "portfolio_holdings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    symbol: text("symbol").notNull(),
    assetName: text("asset_name"),
    tier: text("tier", { enum: ["large", "mid", "low"] }),
    quantity: real("quantity").notNull(),
    averageCost: real("average_cost"),
    manualPrice: real("manual_price"),
    acquiredOn: text("acquired_on"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [uniqueIndex("portfolio_holdings_symbol_uidx").on(table.symbol)],
);

export const notificationPreferences = sqliteTable("notification_preferences", {
  id: integer("id").primaryKey(),
  priceAlerts: integer("price_alerts", { mode: "boolean" }).notNull().default(false),
  marketAlerts: integer("market_alerts", { mode: "boolean" }).notNull().default(false),
  weeklyDigest: integer("weekly_digest", { mode: "boolean" }).notNull().default(false),
  signalAlerts: integer("signal_alerts", { mode: "boolean" }).notNull().default(false),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const tradingSignalEvents = sqliteTable(
  "trading_signal_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    symbol: text("symbol").notNull(),
    previousVerdict: text("previous_verdict").notNull(),
    newVerdict: text("new_verdict").notNull(),
    confidence: integer("confidence").notNull(),
    triggeredAt: integer("triggered_at", { mode: "timestamp_ms" }).notNull(),
    dismissed: integer("dismissed", { mode: "boolean" }).notNull().default(false),
  },
  (table) => [index("trading_signal_events_triggered_at_idx").on(table.triggeredAt)],
);

export const weeklyMarketDigests = sqliteTable(
  "weekly_market_digests",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    generatedAt: integer("generated_at", { mode: "timestamp_ms" }).notNull(),
    marketAsOf: integer("market_as_of", { mode: "timestamp_ms" }).notNull(),
    payload: text("payload").notNull(),
  },
  (table) => [index("weekly_market_digests_generated_at_idx").on(table.generatedAt)],
);

export const tradingSignalSnapshots = sqliteTable(
  "trading_signal_snapshots",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    symbol: text("symbol").notNull(),
    generatedAt: integer("generated_at", { mode: "timestamp_ms" }).notNull(),
    marketAsOf: integer("market_as_of", { mode: "timestamp_ms" }).notNull(),
    payload: text("payload").notNull(),
  },
  (table) => [index("trading_signal_snapshots_symbol_generated_at_idx").on(table.symbol, table.generatedAt)],
);
