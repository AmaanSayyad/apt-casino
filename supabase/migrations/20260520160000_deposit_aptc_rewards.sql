-- Deposit bonus: 5% of deposit USD value as APTC, claimable after 14-day lock

create table if not exists public.deposit_aptc_rewards (
  id uuid primary key default gen_random_uuid(),
  wallet text not null,
  chain text not null check (chain in ('solana', 'aptos')),
  deposit_tx_hash text not null,
  deposit_native numeric not null,
  deposit_usd numeric not null,
  reward_aptc numeric not null default 0,
  status text not null default 'locked' check (status in ('locked', 'claimed')),
  unlock_at timestamptz not null,
  claimed_at timestamptz,
  claim_tx_hash text,
  created_at timestamptz not null default now(),
  constraint deposit_aptc_rewards_tx_unique unique (deposit_tx_hash)
);

create index if not exists deposit_aptc_rewards_wallet_status_idx
  on public.deposit_aptc_rewards (wallet, status);

create index if not exists deposit_aptc_rewards_wallet_unlock_idx
  on public.deposit_aptc_rewards (wallet, unlock_at);

comment on table public.deposit_aptc_rewards is 'Per-deposit APTC bonus (5% USD value); claim after 14-day lock';
