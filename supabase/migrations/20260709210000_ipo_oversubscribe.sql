-- Allow IPO purchases queued when treasury APTC inventory is temporarily insufficient (oversubscription)

alter table public.ipo_purchases drop constraint if exists ipo_purchases_status_check;
alter table public.ipo_purchases add constraint ipo_purchases_status_check
  check (status in ('pending', 'fulfilled', 'failed', 'pending_supply'));

create index if not exists idx_ipo_purchases_pending_supply
  on public.ipo_purchases(status, created_at)
  where status = 'pending_supply';
