-- ViGlobal P0 financial integrity tables.
-- - Monthly Hall of Fame (read-only client projection).
-- - Monthly reward distributions (durable idempotent payouts).
-- - Charity ledger (1% platform-net-revenue contribution events).

create table if not exists public.monthly_hall_of_fame (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  month_key text not null, -- YYYY-MM (UTC)
  rank smallint not null check (rank between 1 and 3),
  child_nickname text not null,
  city_label text not null,
  avatar_emoji text not null,
  parent_id text not null,
  vietkids_points integer not null default 0,
  achievement_label text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (country_code, month_key, rank)
);

create table if not exists public.monthly_reward_distributions (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  month_key text not null, -- YYYY-MM (UTC)
  rank smallint not null check (rank between 1 and 3),
  parent_id text not null,
  amount_vig_tokens integer not null check (amount_vig_tokens > 0),
  reason text not null,
  idempotency_key text not null unique,
  processed_at timestamptz not null default timezone('utc', now()),
  unique (country_code, month_key, rank, parent_id)
);

create table if not exists public.charity_ledger (
  id uuid primary key default gen_random_uuid(),
  amount_added_usd numeric(18,6) not null check (amount_added_usd >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_monthly_hof_country_month
  on public.monthly_hall_of_fame (country_code, month_key);

create index if not exists idx_monthly_reward_country_month
  on public.monthly_reward_distributions (country_code, month_key);

create index if not exists idx_charity_ledger_created_at
  on public.charity_ledger (created_at desc);
