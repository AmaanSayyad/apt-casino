-- Volume Cup APTC entry fees and manual prize approval tracking.

alter table public.tournament_registrations
  add column if not exists entry_fee_tx_hash text,
  add column if not exists entry_fee_amount numeric,
  add column if not exists prize_approved_at timestamptz,
  add column if not exists prize_tx_hash text,
  add column if not exists prize_amount numeric;

create unique index if not exists tournament_registrations_entry_fee_tx_idx
  on public.tournament_registrations (entry_fee_tx_hash)
  where entry_fee_tx_hash is not null;

comment on column public.tournament_registrations.entry_fee_tx_hash is
  'Solana SPL transfer signature for APTC entry fee to platform fee wallet.';
comment on column public.tournament_registrations.prize_approved_at is
  'Set when admin manually approves and records prize payout for this registrant.';