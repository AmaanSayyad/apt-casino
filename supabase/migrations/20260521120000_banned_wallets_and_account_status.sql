-- Global bans + per-wallet account status (freeze / ban) for ops dashboard.

create table if not exists public.banned_wallets (
  wallet_address text primary key,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists banned_wallets_created_idx on public.banned_wallets (created_at desc);

create table if not exists public.wallet_account_status (
  wallet text primary key,
  status text not null default 'active'
    check (status in ('active', 'frozen', 'banned')),
  reason text,
  updated_at timestamptz not null default now()
);

create index if not exists wallet_account_status_status_idx on public.wallet_account_status (status);
