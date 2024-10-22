-- KOL partner allocations: 0.1% of max APTC supply (1M tokens), 14-day lock before payout.

create table if not exists public.kol_allocations (
  id uuid primary key default gen_random_uuid(),
  kol_slug text not null,
  display_name text not null,
  wallet_address text not null,
  amount_aptc numeric(24, 6) not null default 1000000,
  pct_of_supply numeric(8, 4) not null default 0.1,
  lock_days integer not null default 14,
  locked_at timestamptz not null default now(),
  unlock_at timestamptz not null,
  status text not null default 'locked'
    check (status in ('locked', 'ready', 'fulfilled', 'revoked')),
  portal_password_hash text not null,
  fulfillment_tx_hash text,
  fulfilled_at timestamptz,
  created_by text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kol_allocations_slug_unique unique (kol_slug)
);

create index if not exists kol_allocations_status_idx on public.kol_allocations (status);
create index if not exists kol_allocations_unlock_idx on public.kol_allocations (unlock_at);
create index if not exists kol_allocations_wallet_idx on public.kol_allocations (wallet_address);
