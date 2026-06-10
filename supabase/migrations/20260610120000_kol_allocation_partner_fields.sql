-- Optional partner metadata on KOL allocations (admin-only).

alter table public.kol_allocations
  add column if not exists x_handle text,
  add column if not exists country text,
  add column if not exists telegram text,
  add column if not exists avg_post_views integer,
  add column if not exists promotion_condition text,
  add column if not exists brought_by text,
  add column if not exists brought_on date;
