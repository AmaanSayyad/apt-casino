-- Atomic house balance mutations and deposit tx idempotency (security hardening).

create or replace function public.credit_house_balance(
  p_wallet text,
  p_chain text,
  p_currency text,
  p_delta bigint
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_bal bigint;
begin
  if p_delta <= 0 then
    raise exception 'credit_delta_must_be_positive';
  end if;

  insert into public.user_house_balances (user_address, chain, currency, balance_raw, updated_at)
  values (p_wallet, p_chain, p_currency, p_delta, now())
  on conflict (user_address, chain, currency)
  do update set
    balance_raw = public.user_house_balances.balance_raw + p_delta,
    updated_at = now()
  returning balance_raw into new_bal;

  return new_bal;
end;
$$;

create or replace function public.debit_house_balance(
  p_wallet text,
  p_chain text,
  p_currency text,
  p_delta bigint
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_bal bigint;
begin
  if p_delta <= 0 then
    raise exception 'debit_delta_must_be_positive';
  end if;

  update public.user_house_balances
  set balance_raw = balance_raw - p_delta,
      updated_at = now()
  where user_address = p_wallet
    and chain = p_chain
    and currency = p_currency
    and balance_raw >= p_delta
  returning balance_raw into new_bal;

  if not found then
    raise exception 'insufficient_balance';
  end if;

  return new_bal;
end;
$$;

-- Returns true when this caller won the race to process a deposit tx hash.
create or replace function public.claim_deposit_tx(
  p_tx_hash text,
  p_chain text,
  p_wallet text,
  p_amount_octas bigint,
  p_amount_native numeric,
  p_fee_octas bigint,
  p_net_credited_octas bigint
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.deposits_log (
    chain,
    wallet,
    amount_octas,
    amount_native,
    fee_octas,
    net_credited_octas,
    user_tx_hash
  ) values (
    p_chain,
    p_wallet,
    p_amount_octas,
    p_amount_native,
    p_fee_octas,
    p_net_credited_octas,
    p_tx_hash
  );
  return true;
exception
  when unique_violation then
    return false;
end;
$$;

-- Daily streak: mark today claimed atomically before payout.
create or replace function public.claim_daily_streak_slot(
  p_wallet text,
  p_chain text,
  p_today date,
  p_yesterday date,
  p_max_day int,
  p_reward_aptc numeric,
  p_new_streak int,
  p_longest_streak int,
  p_total_claimed numeric
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated int;
begin
  insert into public.wallet_daily_streaks (
    wallet,
    chain,
    current_streak,
    longest_streak,
    last_check_in_date,
    total_aptc_claimed,
    updated_at
  ) values (
    p_wallet,
    p_chain,
    p_new_streak,
    p_longest_streak,
    p_today,
    p_total_claimed,
    now()
  )
  on conflict (wallet, chain) do update set
    current_streak = excluded.current_streak,
    longest_streak = excluded.longest_streak,
    last_check_in_date = excluded.last_check_in_date,
    total_aptc_claimed = excluded.total_aptc_claimed,
    updated_at = now()
  where public.wallet_daily_streaks.last_check_in_date is distinct from p_today
    and (
      public.wallet_daily_streaks.last_check_in_date = p_yesterday
      or public.wallet_daily_streaks.last_check_in_date is null
      or public.wallet_daily_streaks.last_check_in_date < p_yesterday
    );

  get diagnostics updated = row_count;
  return updated > 0;
end;
$$;

grant execute on function public.credit_house_balance(text, text, text, bigint) to service_role;
grant execute on function public.debit_house_balance(text, text, text, bigint) to service_role;
grant execute on function public.claim_deposit_tx(text, text, text, bigint, numeric, bigint, bigint) to service_role;
grant execute on function public.claim_daily_streak_slot(text, text, date, date, int, numeric, int, int, numeric) to service_role;

-- Consume one open play stake atomically (prevents double-credit on same stake).
create or replace function public.consume_pending_stake(
  p_wallet text,
  p_chain text,
  p_credit_raw bigint,
  p_max_multiplier int default 2000
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  stake_id uuid;
  bet_raw bigint;
  max_credit bigint;
begin
  if p_credit_raw <= 0 then
    raise exception 'credit_must_be_positive';
  end if;

  select id, bet_raw::bigint
  into stake_id, bet_raw
  from public.play_pending_stakes
  where wallet = p_wallet
    and chain = p_chain
    and consumed_at is null
    and expires_at > now()
  order by created_at desc
  limit 1
  for update skip locked;

  if stake_id is null or bet_raw is null or bet_raw <= 0 then
    raise exception 'no_open_stake';
  end if;

  max_credit := bet_raw * greatest(p_max_multiplier, 1);
  if p_credit_raw > max_credit then
    raise exception 'payout_exceeds_multiplier';
  end if;

  update public.play_pending_stakes
  set consumed_at = now()
  where id = stake_id
    and consumed_at is null;

  if not found then
    raise exception 'stake_already_consumed';
  end if;

  return bet_raw;
end;
$$;

grant execute on function public.consume_pending_stake(text, text, bigint, int) to service_role;
