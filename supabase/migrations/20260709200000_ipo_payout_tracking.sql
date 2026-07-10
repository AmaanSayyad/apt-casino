-- IPO manual reward payout tracking on staking positions (principal already sent at purchase)

alter table public.staking_positions
  add column if not exists reward_paid_tx_hash text,
  add column if not exists reward_paid_at timestamptz;

create index if not exists idx_staking_positions_ipo_reward_due
  on public.staking_positions(pool_key, unlock_at)
  where reward_paid_at is null and status = 'active';
