-- Daily login streak rewards (APTC). One claim per wallet+chain per UTC day.

create table if not exists public.wallet_daily_streaks (
  wallet text not null,
  chain text not null,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_check_in_date date,
  total_aptc_claimed numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (wallet, chain)
);

create index if not exists wallet_daily_streaks_chain_idx on public.wallet_daily_streaks (chain);

create table if not exists public.daily_streak_claims (
  id uuid primary key default gen_random_uuid(),
  wallet text not null,
  chain text not null,
  streak_day integer not null,
  reward_aptc numeric not null,
  payout_wallet text,
  claim_tx_hash text,
  created_at timestamptz not null default now()
);

create index if not exists daily_streak_claims_wallet_idx
  on public.daily_streak_claims (wallet, chain, created_at desc);
