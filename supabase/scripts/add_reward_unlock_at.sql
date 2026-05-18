-- Run in Supabase Dashboard → SQL Editor if you see:
--   column streams.reward_unlock_at does not exist

alter table public.streams
  add column if not exists reward_unlock_at timestamptz;

comment on column public.streams.reward_unlock_at is
  'Earliest time admin may pay streamer reward (14-day lock after session ends)';
