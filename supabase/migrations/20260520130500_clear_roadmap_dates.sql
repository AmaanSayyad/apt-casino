-- Remove ETA dates from public roadmap (no dates in UI)
update public.roadmap_items set eta_date = null, updated_at = now() where eta_date is not null;
