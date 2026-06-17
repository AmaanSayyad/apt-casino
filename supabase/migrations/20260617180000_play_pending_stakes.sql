-- Pending bet stakes: debit must precede any server-side credit (anti-exploit).

create table if not exists public.play_pending_stakes (
  id uuid primary key default gen_random_uuid(),
  wallet text not null,
  chain text not null,
  bet_raw bigint not null,
  game text,
  created_at timestamptz not null default now(),
  consumed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '15 minutes')
);

create index if not exists play_pending_stakes_wallet_chain_idx
  on public.play_pending_stakes (wallet, chain)
  where consumed_at is null;

create index if not exists play_pending_stakes_expires_idx
  on public.play_pending_stakes (expires_at)
  where consumed_at is null;
