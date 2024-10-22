-- Optional fairness audit trail for Solana play logs (display-only VRF records)
alter table public.game_play_events
  add column if not exists fairness_proof jsonb,
  add column if not exists proof_reference text;

create index if not exists game_play_events_proof_ref_idx
  on public.game_play_events (proof_reference)
  where proof_reference is not null;
