-- Replay protection, RLS on sensitive ledger tables, atomic staking claims.

-- ---------------------------------------------------------------------------
-- Wallet auth signature consumption (one-time use per signature)
-- ---------------------------------------------------------------------------

create table if not exists public.wallet_auth_consumed (
  signature_hash text primary key,
  wallet text not null,
  chain text not null,
  purpose text,
  consumed_at timestamptz not null default now()
);

create index if not exists wallet_auth_consumed_at_idx
  on public.wallet_auth_consumed (consumed_at desc);

-- ---------------------------------------------------------------------------
-- RLS: deny anon/authenticated direct access; service_role bypasses RLS
-- ---------------------------------------------------------------------------

alter table if exists public.user_house_balances enable row level security;
alter table if exists public.staking_positions enable row level security;
alter table if exists public.staking_ledger enable row level security;
alter table if exists public.wallet_cashback enable row level security;
alter table if exists public.deposits_log enable row level security;
alter table if exists public.withdrawal_requests enable row level security;
alter table if exists public.game_play_events enable row level security;
alter table if exists public.wallet_daily_streaks enable row level security;
alter table if exists public.daily_streak_claims enable row level security;

-- ---------------------------------------------------------------------------
-- Atomic staking claim: lock position row before on-chain payout
-- ---------------------------------------------------------------------------

create or replace function public.claim_staking_position_atomic(
  p_position_id bigint,
  p_user_address text
) returns table (
  amount numeric,
  apy_bps integer,
  lock_days integer,
  reward numeric,
  payout numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  pos public.staking_positions%rowtype;
  v_reward numeric;
  v_payout numeric;
begin
  select *
  into pos
  from public.staking_positions
  where id = p_position_id
  for update;

  if not found then
    raise exception 'position_not_found';
  end if;

  if pos.user_address <> p_user_address then
    raise exception 'position_owner_mismatch';
  end if;

  if pos.status <> 'active' then
    raise exception 'position_not_claimable';
  end if;

  if pos.unlock_at > now() then
    raise exception 'position_still_locked';
  end if;

  v_reward := round(pos.amount * (pos.apy_bps::numeric / 10000.0) * (pos.lock_days::numeric / 365.0), 8);
  v_payout := round(pos.amount + v_reward, 8);

  update public.staking_positions
  set status = 'claimed',
      reward_amount = v_reward,
      total_payout = v_payout,
      claimed_at = now(),
      updated_at = now()
  where id = p_position_id;

  amount := pos.amount;
  apy_bps := pos.apy_bps;
  lock_days := pos.lock_days;
  reward := v_reward;
  payout := v_payout;
  return next;
end;
$$;

grant execute on function public.claim_staking_position_atomic(bigint, text) to service_role;
