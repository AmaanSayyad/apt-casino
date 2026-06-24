-- Atomic promo coupon + cashback claims (credit only after successful reservation).

create or replace function public.claim_promo_coupon_atomic(
  p_campaign_id uuid,
  p_code text,
  p_wallet text,
  p_chain text,
  p_reward_raw bigint,
  p_ip_hash text,
  p_device_hash text,
  p_user_agent text,
  p_max_claims integer
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  claim_count integer;
  new_bal bigint;
begin
  if p_reward_raw <= 0 then
    raise exception 'invalid_reward';
  end if;

  perform 1
  from public.promo_campaigns
  where id = p_campaign_id
  for update;

  if p_max_claims is not null and p_max_claims > 0 then
    select count(*)::integer
    into claim_count
    from public.promo_coupon_claims
    where campaign_id = p_campaign_id;

    if claim_count >= p_max_claims then
      raise exception 'coupon_limit_reached';
    end if;
  end if;

  insert into public.promo_coupon_claims (
    campaign_id,
    code,
    wallet,
    chain,
    reward_native,
    reward_raw,
    ip_hash,
    device_hash,
    user_agent
  ) values (
    p_campaign_id,
    p_code,
    p_wallet,
    p_chain,
    (p_reward_raw::numeric / 1000000000.0),
    p_reward_raw,
    p_ip_hash,
    p_device_hash,
    p_user_agent
  );

  new_bal := public.credit_house_balance(p_wallet, p_chain, 'SOL', p_reward_raw);
  return new_bal;
exception
  when unique_violation then
    raise exception 'already_claimed';
end;
$$;

create or replace function public.claim_cashback_sol_atomic(
  p_wallet text
) returns table (credited_raw bigint, balance_raw bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  wc public.wallet_cashback%rowtype;
  house_bal bigint;
  claimable bigint;
  bust_threshold bigint := 50000;
  new_claimed bigint;
  out_balance bigint;
begin
  select *
  into wc
  from public.wallet_cashback
  where wallet = p_wallet
    and chain = 'solana'
  for update;

  if not found then
    raise exception 'no_cashback_record';
  end if;

  select coalesce(uhb.balance_raw, 0)
  into house_bal
  from public.user_house_balances uhb
  where uhb.user_address = p_wallet
    and uhb.chain = 'solana'
    and uhb.currency = 'SOL'
  for update;

  house_bal := coalesce(house_bal, 0);

  if house_bal > bust_threshold then
    raise exception 'not_busted';
  end if;

  claimable := greatest(wc.cap_raw - wc.claimed_raw, 0);
  if claimable <= 0 then
    raise exception 'nothing_to_claim';
  end if;

  new_claimed := wc.claimed_raw + claimable;

  update public.wallet_cashback
  set claimed_raw = new_claimed,
      unlocked_raw = greatest(unlocked_raw, wc.cap_raw),
      last_claim_at = now(),
      updated_at = now()
  where wallet = p_wallet
    and chain = 'solana';

  out_balance := public.credit_house_balance(p_wallet, 'solana', 'SOL', claimable);

  credited_raw := claimable;
  balance_raw := out_balance;
  return next;
end;
$$;

grant execute on function public.claim_promo_coupon_atomic(uuid, text, text, text, bigint, text, text, text, integer) to service_role;
grant execute on function public.claim_cashback_sol_atomic(text) to service_role;
