-- Drop 9-wallet-era roadmap milestones; refresh excerpts for fair-launch model.

DELETE FROM public.roadmap_items
WHERE id IN (
  'a1000001-0001-4001-8001-000000000031',
  'a1000001-0001-4001-8001-000000000036'
);

UPDATE public.roadmap_items SET
  excerpt = '1B APTC + 40 SOL on Raydium Standard AMM · 0.5% fee tier · ~$5.4k liquidity · ~$2.7k launch MC. Mint revoked. Fair launch.'
WHERE id = 'a1000001-0001-4001-8001-000000000001';

UPDATE public.roadmap_items SET
  excerpt = 'Fixed-term stake pools on /stake — 30/60/90/180-day locks, on-chain SPL deposits, APY from GGR buyback staker share.'
WHERE id = 'a1000001-0001-4001-8001-000000000007';

UPDATE public.roadmap_items SET
  excerpt = 'Seasonal high-volume leaderboard with APTC prize pool funded from protocol GGR — provably logged play events, no fabricated stats.'
WHERE id = 'a1000001-0001-4001-8001-000000000011';

UPDATE public.roadmap_items SET
  excerpt = 'On-chain referral rewards — 14-day cliff, public leaderboard, milestone unlocks, and shareable ROI cards.'
WHERE id = 'a1000001-0001-4001-8001-000000000013';

UPDATE public.roadmap_items SET
  excerpt = 'Published breakdown of GGR, buybacks, burns, staking rewards, and partnership grants — aligned with the 1B fair-launch supply model.'
WHERE id = 'a1000001-0001-4001-8001-000000000018';
