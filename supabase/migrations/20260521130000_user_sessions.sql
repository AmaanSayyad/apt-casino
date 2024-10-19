-- Session dwell time for admin "Avg. time spent" (7-day rolling mean).

create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  chain text,
  started_at timestamptz not null default now(),
  last_ping_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists user_sessions_wallet_idx on public.user_sessions (wallet_address);
create index if not exists user_sessions_started_idx on public.user_sessions (started_at desc);
create index if not exists user_sessions_open_idx on public.user_sessions (wallet_address, last_ping_at)
  where ended_at is null;
