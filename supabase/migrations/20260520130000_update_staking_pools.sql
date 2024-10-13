-- APTC staking pools: APY tiers + minimum stake as % of 1B max supply
-- 1% = 10M APTC, 2% = 20M, 3% = 30M, 4% = 40M

insert into public.staking_pools (pool_key, lock_days, apy_bps, min_stake, is_active)
values
  ('APTC_30D',  30,   3000, 10000000, true),
  ('APTC_60D',  60,   6000, 20000000, true),
  ('APTC_90D',  90,  18000, 30000000, true),
  ('APTC_180D', 180, 36000, 40000000, true)
on conflict (pool_key) do update set
  lock_days = excluded.lock_days,
  apy_bps = excluded.apy_bps,
  min_stake = excluded.min_stake,
  is_active = excluded.is_active,
  updated_at = now();
