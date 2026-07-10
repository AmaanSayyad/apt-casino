-- APTC IPO / presale tables

create table if not exists public.ipo_referral_attribution (
  wallet text primary key,
  referrer_wallet text not null,
  attributed_at timestamptz not null default now(),
  constraint ipo_referral_no_self check (wallet <> referrer_wallet)
);

create index if not exists idx_ipo_referral_referrer
  on public.ipo_referral_attribution(referrer_wallet);

create table if not exists public.ipo_purchases (
  id bigint generated always as identity primary key,
  buyer_wallet text not null,
  sol_amount numeric(20, 9) not null check (sol_amount > 0),
  sol_usd_price numeric(20, 8) not null check (sol_usd_price > 0),
  usd_value numeric(20, 8) not null check (usd_value > 0),
  aptc_amount numeric(30, 8) not null check (aptc_amount > 0),
  aptc_price_usd numeric(20, 10) not null check (aptc_price_usd > 0),
  sol_tx_hash text not null unique,
  aptc_tx_hash text,
  referrer_wallet text,
  status text not null default 'pending'
    check (status in ('pending', 'fulfilled', 'failed')),
  staking_position_id bigint references public.staking_positions(id) on delete set null,
  error_message text,
  created_at timestamptz not null default now(),
  fulfilled_at timestamptz
);

create index if not exists idx_ipo_purchases_buyer
  on public.ipo_purchases(buyer_wallet, created_at desc);
create index if not exists idx_ipo_purchases_status
  on public.ipo_purchases(status, created_at desc);

create table if not exists public.ipo_affiliate_rewards (
  id bigint generated always as identity primary key,
  beneficiary_wallet text not null,
  purchase_id bigint not null references public.ipo_purchases(id) on delete cascade,
  level smallint not null check (level between 1 and 3),
  aptc_amount numeric(30, 8) not null check (aptc_amount > 0),
  status text not null default 'accrued'
    check (status in ('accrued', 'withdrawal_requested', 'paid', 'cancelled')),
  withdrawable_at timestamptz not null,
  paid_tx_hash text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists idx_ipo_affiliate_beneficiary
  on public.ipo_affiliate_rewards(beneficiary_wallet, status, created_at desc);

create table if not exists public.ipo_affiliate_withdrawals (
  id bigint generated always as identity primary key,
  wallet text not null,
  aptc_amount numeric(30, 8) not null check (aptc_amount > 0),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'paid', 'rejected')),
  reward_ids bigint[] not null default '{}',
  tx_hash text,
  admin_note text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_ipo_affiliate_withdrawals_wallet
  on public.ipo_affiliate_withdrawals(wallet, requested_at desc);

-- IPO auto-stake pool (30-day, 30% APY)
insert into public.staking_pools (pool_key, lock_days, apy_bps, min_stake, max_stake, is_active)
values ('IPO_30D', 30, 3000, 0.000001, null, true)
on conflict (pool_key) do update set
  lock_days = excluded.lock_days,
  apy_bps = excluded.apy_bps,
  min_stake = excluded.min_stake,
  is_active = excluded.is_active,
  updated_at = now();

alter table if exists public.ipo_referral_attribution enable row level security;
alter table if exists public.ipo_purchases enable row level security;
alter table if exists public.ipo_affiliate_rewards enable row level security;
alter table if exists public.ipo_affiliate_withdrawals enable row level security;
