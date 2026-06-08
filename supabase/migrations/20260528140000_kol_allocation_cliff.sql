-- Per-KOL cliff period (days before unlock eligibility) separate from total lock duration.

alter table public.kol_allocations
  add column if not exists cliff_days integer not null default 14;

comment on column public.kol_allocations.cliff_days is
  'Cliff period in days from locked_at. Must be <= lock_days. unlock_at uses lock_days.';

-- Backfill: legacy rows treated cliff as equal to total lock.
update public.kol_allocations
set cliff_days = lock_days;
