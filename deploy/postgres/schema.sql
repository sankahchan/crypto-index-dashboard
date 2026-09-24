-- Standalone Postgres starting schema.
-- This mirrors the current single-user Muse tables; add an authenticated owner_id
-- before launching as a multi-user service.

create table if not exists market_snapshots (
  id bigint generated always as identity primary key,
  fetched_at timestamptz not null,
  score integer not null check (score between 0 and 100),
  sentiment text not null,
  payload jsonb not null
);
create index if not exists market_snapshots_fetched_at_idx on market_snapshots (fetched_at desc);

create table if not exists watchlist_items (
  id bigint generated always as identity primary key,
  symbol text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists price_alerts (
  id bigint generated always as identity primary key,
  symbol text not null,
  direction text not null check (direction in ('above', 'below')),
  target_price double precision not null check (target_price > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  triggered_at timestamptz,
  triggered_price double precision
);
create index if not exists price_alerts_active_idx on price_alerts (active);

create table if not exists market_alert_preferences (
  id integer primary key,
  extreme_fear boolean not null default false,
  extreme_greed boolean not null default false,
  last_state text,
  updated_at timestamptz not null default now()
);

create table if not exists market_alert_events (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('extreme_fear', 'extreme_greed')),
  score integer not null check (score between 0 and 100),
  fear_greed integer not null check (fear_greed between 0 and 100),
  triggered_at timestamptz not null,
  dismissed boolean not null default false
);
create index if not exists market_alert_events_triggered_at_idx on market_alert_events (triggered_at desc);

create table if not exists daily_market_updates (
  id bigint generated always as identity primary key,
  generated_at timestamptz not null,
  market_as_of timestamptz not null,
  payload jsonb not null
);
create index if not exists daily_market_updates_generated_at_idx on daily_market_updates (generated_at desc);

create table if not exists portfolio_holdings (
  id bigint generated always as identity primary key,
  symbol text not null unique,
  asset_name text,
  tier text check (tier in ('large', 'mid', 'low')),
  quantity double precision not null check (quantity >= 0),
  average_cost double precision check (average_cost >= 0),
  manual_price double precision check (manual_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notification_preferences (
  id integer primary key,
  price_alerts boolean not null default false,
  market_alerts boolean not null default false,
  weekly_digest boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists weekly_market_digests (
  id bigint generated always as identity primary key,
  generated_at timestamptz not null,
  market_as_of timestamptz not null,
  payload jsonb not null
);
create index if not exists weekly_market_digests_generated_at_idx on weekly_market_digests (generated_at desc);
