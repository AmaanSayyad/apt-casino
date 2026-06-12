-- Public referral leaderboard: include all invites (not only validated first deposits).
-- Must DROP first: CREATE OR REPLACE cannot insert/rename view columns in Postgres.

drop view if exists public.referral_leaderboard;

create view public.referral_leaderboard as
select
  r.referrer_wallet as wallet,
  count(*)::int as total_referrals,
  count(*) filter (where r.is_valid)::int as referrals,
  coalesce(sum(case when r.is_valid then r.referrer_reward_octas else 0 end), 0)::numeric(30, 0) as earned_octas,
  min(r.attributed_at) as first_referral_at,
  max(coalesce(r.first_deposit_at, r.attributed_at)) as last_referral_at,
  rank() over (
    order by count(*) desc,
             count(*) filter (where r.is_valid) desc,
             min(r.attributed_at) asc nulls last
  )::int as rank
from public.referrals r
group by r.referrer_wallet
having count(*) > 0;
