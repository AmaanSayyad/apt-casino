-- Erase all staking positions/ledger (IPO + pool stakes).
-- Canonical vault: 2ei9VY2TtJ6GkvVMs1su5b348p98ajLaU45MzvE6gYaq (app config / env).

update public.ipo_purchases
set staking_position_id = null
where staking_position_id is not null;

truncate table public.staking_ledger, public.staking_positions restart identity cascade;
