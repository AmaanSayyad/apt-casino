-- SOL play cashback: up to 1% of net deposits, unlocked per bet across all games, claimable when busted.

create table if not exists public.wallet_cashback (
  wallet text not null,
  chain text not null default 'solana',
  currency text not null default 'SOL',
  deposits_net_raw bigint not null default 0,
  cap_raw bigint not null default 0,
  unlocked_raw bigint not null default 0,
  claimed_raw bigint not null default 0,
  total_bets_count integer not null default 0,
  last_accrual_at timestamptz,
  last_claim_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (wallet, chain)
);

create index if not exists wallet_cashback_chain_idx on public.wallet_cashback (chain);

create table if not exists public.cashback_accrual_log (
  id uuid primary key default gen_random_uuid(),
  wallet text not null,
  chain text not null default 'solana',
  game text not null,
  bet_raw bigint not null,
  accrual_raw bigint not null,
  created_at timestamptz not null default now()
);

create index if not exists cashback_accrual_wallet_idx on public.cashback_accrual_log (wallet, chain, created_at desc);
