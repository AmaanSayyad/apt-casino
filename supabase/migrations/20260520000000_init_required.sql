-- APT Casino — required schema only (no demo tournament/stream seeds).
-- Run once in Supabase SQL Editor, or: npx supabase db push
-- Server writes use SUPABASE_SERVICE_ROLE_KEY; anon is only for chat + public stream reads.

create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- Withdrawals & deposits
-- ---------------------------------------------------------------------------

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  chain text not null default 'aptos',
  wallet text not null,
  gross_octas bigint not null,
  gross_apt numeric not null,
  usd_estimate numeric,
  fee_octas bigint not null,
  user_payout_octas bigint not null,
  status text not null default 'pending',
  fee_tx_hash text,
  user_tx_hash text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists withdrawal_requests_wallet_idx on public.withdrawal_requests (wallet);
create index if not exists withdrawal_requests_status_idx on public.withdrawal_requests (status);

create table if not exists public.deposits_log (
  id uuid primary key default gen_random_uuid(),
  chain text not null default 'aptos',
  wallet text not null,
  amount_octas bigint not null,
  amount_native numeric not null,
  fee_octas bigint not null default 0,
  net_credited_octas bigint not null default 0,
  user_tx_hash text not null,
  platform_fee_tx_hash text,
  created_at timestamptz not null default now()
);

create unique index if not exists deposits_log_user_tx_hash_uidx on public.deposits_log (user_tx_hash);
create index if not exists deposits_log_wallet_idx on public.deposits_log (wallet);
create index if not exists deposits_log_chain_idx on public.deposits_log (chain);

-- ---------------------------------------------------------------------------
-- Tournaments & Volume Cup
-- ---------------------------------------------------------------------------

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  game text not null check (game in ('plinko', 'mines', 'roulette', 'wheel', 'all')),
  prize_pool_apt numeric not null default 0,
  entry_fee_apt numeric not null default 0,
  max_participants integer not null default 100,
  starts_at timestamptz not null,
  ends_at timestamptz,
  included_games text[],
  competition_mode text not null default 'volume' check (competition_mode in ('volume', 'registration')),
  rewards_distributed_at timestamptz,
  notes text,
  status text not null default 'open' check (status in ('open', 'live', 'completed', 'cancelled', 'upcoming', 'ended')),
  created_at timestamptz not null default now()
);

create index if not exists tournaments_starts_at_idx on public.tournaments (starts_at);
create index if not exists tournaments_status_idx on public.tournaments (status);

create table if not exists public.tournament_registrations (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  wallet text not null,
  registered_at timestamptz not null default now(),
  unique (tournament_id, wallet)
);

create index if not exists tournament_registrations_tournament_idx on public.tournament_registrations (tournament_id);
create index if not exists tournament_registrations_wallet_idx on public.tournament_registrations (wallet);

-- ---------------------------------------------------------------------------
-- Roadmap & newsletter
-- ---------------------------------------------------------------------------

create table if not exists public.roadmap_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  excerpt text,
  category text not null default 'Platform'
    check (category in ('Platform', 'Governance', 'Partnership', 'Security', 'Community', 'Tournaments')),
  status text not null default 'planned'
    check (status in ('planned', 'in_progress', 'shipped', 'cancelled')),
  eta_date date,
  link text,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists roadmap_items_status_idx on public.roadmap_items (status);
create index if not exists roadmap_items_sort_idx on public.roadmap_items (sort_order, eta_date);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email citext not null,
  source text not null default 'footer',
  user_agent text,
  ip_hash text,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (email)
);

create index if not exists newsletter_subscribers_created_idx
  on public.newsletter_subscribers (created_at desc);

-- ---------------------------------------------------------------------------
-- APTC staking
-- ---------------------------------------------------------------------------

create table if not exists public.staking_pools (
  pool_key text primary key,
  lock_days integer not null check (lock_days > 0),
  apy_bps integer not null check (apy_bps > 0),
  min_stake numeric(30, 8) not null default 1 check (min_stake > 0),
  max_stake numeric(30, 8),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staking_positions (
  id bigint generated always as identity primary key,
  user_address text not null,
  currency text not null default 'APTC',
  pool_key text not null references public.staking_pools(pool_key),
  lock_days integer not null check (lock_days > 0),
  apy_bps integer not null check (apy_bps > 0),
  amount numeric(30, 8) not null check (amount > 0),
  start_at timestamptz not null default now(),
  unlock_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'claimed', 'cancelled')),
  reward_amount numeric(30, 8),
  total_payout numeric(30, 8),
  claimed_at timestamptz,
  tx_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staking_ledger (
  id bigint generated always as identity primary key,
  user_address text not null,
  position_id bigint not null references public.staking_positions(id) on delete cascade,
  currency text not null default 'APTC',
  operation text not null check (operation in ('stake', 'claim')),
  amount numeric(30, 8) not null check (amount >= 0),
  reward_amount numeric(30, 8),
  tx_hash text,
  created_at timestamptz not null default now()
);

create index if not exists idx_staking_positions_user
  on public.staking_positions(user_address, created_at desc);
create index if not exists idx_staking_positions_status_unlock
  on public.staking_positions(status, unlock_at);
create index if not exists idx_staking_ledger_user
  on public.staking_ledger(user_address, created_at desc);

insert into public.staking_pools (pool_key, lock_days, apy_bps, min_stake, is_active)
values
  ('APTC_30D',  30,   3000, 10000000, true),
  ('APTC_60D',  60,   6000, 20000000, true),
  ('APTC_90D',  90,  18000, 30000000, true),
  ('APTC_180D', 180, 36000, 40000000, true)
on conflict (pool_key) do update set
  lock_days = excluded.lock_days,
  apy_bps = excluded.apy_bps,
  min_stake = excluded.min_stake,
  is_active = excluded.is_active,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Referrals
-- ---------------------------------------------------------------------------

create table if not exists public.referral_codes (
  code text primary key,
  wallet text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_referral_codes_wallet on public.referral_codes(wallet);

create table if not exists public.referrals (
  id bigint generated always as identity primary key,
  referrer_wallet text not null,
  referee_wallet text not null unique,
  code text not null,
  attributed_at timestamptz not null default now(),
  source text,
  user_agent text,
  is_valid boolean not null default false,
  first_deposit_at timestamptz,
  first_deposit_octas numeric(30, 0),
  first_deposit_tx_hash text,
  referrer_reward_octas numeric(30, 0) not null default 0,
  referrer_reward_aptc numeric(24, 6) not null default 0,
  reward_status text not null default 'none'
    check (reward_status in ('none', 'locked', 'unlocked', 'paid', 'pending')),
  unlock_at timestamptz,
  referee_volume_usd numeric(20, 4) not null default 0,
  constraint chk_no_self_referral check (referrer_wallet <> referee_wallet)
);

create index if not exists idx_referrals_referrer on public.referrals(referrer_wallet, attributed_at desc);
create index if not exists idx_referrals_code on public.referrals(code);
create index if not exists idx_referrals_valid on public.referrals(referrer_wallet, is_valid, attributed_at desc);

create table if not exists public.referral_rewards_log (
  id bigint generated always as identity primary key,
  referrer_wallet text not null,
  referee_wallet text not null,
  code text not null,
  deposit_tx_hash text not null unique,
  deposit_octas numeric(30, 0) not null,
  fee_octas numeric(30, 0) not null,
  reward_octas numeric(30, 0) not null,
  reward_aptc numeric(24, 6),
  reward_currency text not null default 'APTC',
  status text not null check (status in ('paid', 'pending', 'failed')),
  payout_tx_hash text,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_referral_rewards_referrer
  on public.referral_rewards_log(referrer_wallet, created_at desc);

create or replace view public.referral_leaderboard as
select
  r.referrer_wallet as wallet,
  count(*) filter (where r.is_valid)::int as referrals,
  coalesce(sum(case when r.is_valid then r.referrer_reward_octas else 0 end), 0)::numeric(30, 0) as earned_octas,
  min(r.attributed_at) filter (where r.is_valid) as first_referral_at,
  max(r.first_deposit_at) as last_referral_at,
  rank() over (
    order by count(*) filter (where r.is_valid) desc,
             min(r.attributed_at) filter (where r.is_valid) asc nulls last
  )::int as rank
from public.referrals r
group by r.referrer_wallet
having count(*) filter (where r.is_valid) > 0;

-- ---------------------------------------------------------------------------
-- Profiles, players, multichain play
-- ---------------------------------------------------------------------------

create table if not exists public.user_profiles (
  wallet text primary key,
  handle text,
  handle_lower text generated always as (lower(handle)) stored,
  avatar_url text,
  bio text,
  twitter_handle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_user_profile_handle_len check (handle is null or char_length(handle) between 2 and 24),
  constraint chk_user_profile_bio_len check (bio is null or char_length(bio) <= 280),
  constraint chk_user_profile_twitter_len check (twitter_handle is null or char_length(twitter_handle) <= 32),
  constraint chk_user_profile_avatar_len check (avatar_url is null or char_length(avatar_url) <= 512)
);

create unique index if not exists user_profiles_handle_lower_unique
  on public.user_profiles (handle_lower)
  where handle_lower is not null;

create table if not exists public.tracked_wallets (
  wallet text primary key,
  chain text not null default 'aptos',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists tracked_wallets_chain_idx on public.tracked_wallets (chain);

create table if not exists public.user_house_balances (
  user_address text not null,
  chain text not null default 'solana',
  currency text not null default 'SOL',
  balance_raw bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_address, chain, currency)
);

create index if not exists user_house_balances_chain_idx on public.user_house_balances (chain);

create table if not exists public.game_play_events (
  id uuid primary key default gen_random_uuid(),
  chain text not null,
  game text not null,
  wallet text not null,
  bet_raw bigint not null default 0,
  payout_raw bigint not null default 0,
  currency text not null,
  result text,
  created_at timestamptz not null default now()
);

create index if not exists game_play_events_chain_game_idx on public.game_play_events (chain, game);
create index if not exists game_play_events_created_idx on public.game_play_events (created_at desc);
create index if not exists game_play_events_wallet_idx on public.game_play_events (wallet);

-- ---------------------------------------------------------------------------
-- Live streams (RLS: public read approved only)
-- ---------------------------------------------------------------------------

create table if not exists public.streams (
  id uuid primary key default gen_random_uuid(),
  playback_id text not null,
  source text not null check (source in ('youtube', 'hls', 'livepeer')),
  wallet text not null,
  title text,
  description text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint streams_playback_id_unique unique (playback_id),
  constraint streams_playback_id_len check (char_length(playback_id) between 4 and 2048),
  constraint streams_wallet_len check (char_length(wallet) between 3 and 128)
);

create index if not exists streams_wallet_created_idx on public.streams (wallet, created_at desc);
create index if not exists streams_approved_created_idx on public.streams (is_approved, created_at desc);

alter table public.streams enable row level security;

drop policy if exists streams_select_approved on public.streams;
create policy streams_select_approved
  on public.streams for select to anon, authenticated
  using (is_approved = true);

-- ---------------------------------------------------------------------------
-- OTC lottery
-- ---------------------------------------------------------------------------

create table if not exists public.otc_lottery_entries (
  id uuid primary key default gen_random_uuid(),
  sol_sender_wallet text not null,
  sol_tx_signature text not null,
  sol_amount numeric not null check (sol_amount > 0),
  sol_sent_at timestamptz not null,
  aptc_receive_wallet text not null,
  optional_email text,
  optional_telegram text,
  user_notes text,
  sol_price_usd numeric,
  aptc_price_usd numeric,
  estimated_aptc numeric,
  swap_platform_fee_bps integer not null default 25,
  token_trade_tax_bps integer not null default 200,
  unlock_at timestamptz not null,
  status text not null default 'pending_review'
    check (status in ('pending_review', 'approved', 'rejected', 'fulfilled')),
  reviewed_at timestamptz,
  reviewed_by text,
  reject_reason text,
  fulfilled_at timestamptz,
  fulfillment_tx_hash text,
  actual_aptc_sent numeric,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists otc_lottery_entries_tx_unique on public.otc_lottery_entries (sol_tx_signature);
create index if not exists otc_lottery_entries_sender_idx on public.otc_lottery_entries (sol_sender_wallet);
create index if not exists otc_lottery_entries_status_idx on public.otc_lottery_entries (status);
create index if not exists otc_lottery_entries_unlock_idx on public.otc_lottery_entries (unlock_at);

-- ---------------------------------------------------------------------------
-- GGR buyback ledger
-- ---------------------------------------------------------------------------

create table if not exists public.ggr_buyback_snapshots (
  id bigint generated always as identity primary key,
  period_start timestamptz not null,
  period_end timestamptz not null,
  ggr_usd numeric(20, 4) not null,
  buyback_usd numeric(20, 4) not null,
  aptc_bought numeric(24, 6),
  aptc_burned numeric(24, 6),
  tx_signature text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ggr_buyback_created on public.ggr_buyback_snapshots(created_at desc);

-- ---------------------------------------------------------------------------
-- Live chat (client anon key — RLS allows read/write for chat only)
-- ---------------------------------------------------------------------------

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null default 'guest',
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_created_idx on public.chat_messages (created_at desc);

alter table public.chat_messages enable row level security;

drop policy if exists chat_messages_select_all on public.chat_messages;
create policy chat_messages_select_all
  on public.chat_messages for select to anon, authenticated using (true);

drop policy if exists chat_messages_insert_all on public.chat_messages;
create policy chat_messages_insert_all
  on public.chat_messages for insert to anon, authenticated with check (true);
