-- Promotions engine: coupons + deposit deal boosts

create table if not exists public.promo_campaigns (
  id uuid primary key default gen_random_uuid(),
  promo_type text not null check (promo_type in ('coupon', 'deposit_deal')),
  title text not null,
  description text,
  code text unique,
  active boolean not null default true,
  reward_sol numeric(18, 9) not null default 0,
  min_deposit_usd numeric(18, 4) not null default 0,
  bonus_usd_aptc numeric(18, 6) not null default 0,
  bonus_bps integer not null default 0 check (bonus_bps >= 0 and bonus_bps <= 10000),
  max_claims integer,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists promo_campaigns_type_idx on public.promo_campaigns (promo_type);
create index if not exists promo_campaigns_active_idx on public.promo_campaigns (active, starts_at, ends_at);

create table if not exists public.promo_coupon_claims (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.promo_campaigns(id) on delete cascade,
  code text not null,
  wallet text not null,
  chain text not null default 'solana',
  reward_native numeric(18, 9) not null default 0,
  reward_raw numeric(30, 0) not null default 0,
  ip_hash text,
  device_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

create unique index if not exists promo_coupon_claims_unique_wallet
  on public.promo_coupon_claims (campaign_id, wallet, chain);
create unique index if not exists promo_coupon_claims_unique_ip
  on public.promo_coupon_claims (campaign_id, ip_hash)
  where ip_hash is not null;
create unique index if not exists promo_coupon_claims_unique_device
  on public.promo_coupon_claims (campaign_id, device_hash)
  where device_hash is not null;

create table if not exists public.promo_deposit_deal_hits (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.promo_campaigns(id) on delete cascade,
  wallet text not null,
  chain text not null,
  deposit_tx_hash text not null unique,
  deposit_usd numeric(18, 4) not null default 0,
  bonus_aptc numeric(18, 6) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists promo_deposit_deal_hits_wallet_idx
  on public.promo_deposit_deal_hits (wallet, created_at desc);
