-- Streamer rewards: session tracking, thumbnails, social handles, admin payout workflow

alter table public.streams drop constraint if exists streams_playback_id_unique;

alter table public.streams
  add column if not exists chain text,
  add column if not exists session_status text not null default 'live'
    check (session_status in ('live', 'ended')),
  add column if not exists started_at timestamptz not null default now(),
  add column if not exists ended_at timestamptz,
  add column if not exists last_heartbeat_at timestamptz not null default now(),
  add column if not exists duration_seconds integer not null default 0,
  add column if not exists reward_tier_pct numeric(5,2) not null default 0,
  add column if not exists thumbnail_url text,
  add column if not exists x_handle text,
  add column if not exists telegram_username text,
  add column if not exists discord_handle text,
  add column if not exists solana_payout_wallet text,
  add column if not exists reward_status text not null default 'pending'
    check (reward_status in ('pending', 'approved', 'paid', 'ineligible')),
  add column if not exists admin_reward_notes text,
  add column if not exists reward_paid_at timestamptz,
  add column if not exists reward_unlock_at timestamptz;

comment on column public.streams.reward_unlock_at is 'Earliest time admin may pay streamer reward (14-day lock after session ends)';

create index if not exists streams_session_status_idx on public.streams (session_status, started_at desc);
create index if not exists streams_reward_status_idx on public.streams (reward_status, ended_at desc nulls last);
create index if not exists streams_wallet_live_idx on public.streams (wallet) where session_status = 'live';

-- Legacy rows: treat as ended sessions
update public.streams
set session_status = 'ended',
    ended_at = coalesce(ended_at, created_at),
    duration_seconds = 0,
    reward_tier_pct = 0,
    reward_status = 'ineligible'
where ended_at is null and started_at is not null;

comment on column public.streams.reward_tier_pct is 'Share of platform revenue: 0.1 (5+ min), 0.2 (15+ min), 0.3 (30+ min)';
comment on column public.streams.solana_payout_wallet is 'Optional Solana address for streamer reward payouts';

-- Public bucket for stream thumbnails (API also auto-creates via service role if missing)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'stream-thumbnails',
  'stream-thumbnails',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set public = true;

drop policy if exists stream_thumbnails_public_read on storage.objects;
create policy stream_thumbnails_public_read
  on storage.objects for select
  to public
  using (bucket_id = 'stream-thumbnails');
