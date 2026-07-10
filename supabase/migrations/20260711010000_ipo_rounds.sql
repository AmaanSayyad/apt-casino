-- Multi-round IPO: tag purchases with round + tranche (primary | oversub)

alter table public.ipo_purchases
  add column if not exists round_id smallint,
  add column if not exists tranche text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'ipo_purchases_tranche_check'
  ) then
    alter table public.ipo_purchases
      add constraint ipo_purchases_tranche_check
      check (tranche is null or tranche in ('primary', 'oversub'));
  end if;
end $$;

create index if not exists idx_ipo_purchases_round_status
  on public.ipo_purchases(round_id, status);

comment on column public.ipo_purchases.round_id is 'IPO sale round (1–3)';
comment on column public.ipo_purchases.tranche is 'primary = soft-cap price; oversub = oversub multiple';
