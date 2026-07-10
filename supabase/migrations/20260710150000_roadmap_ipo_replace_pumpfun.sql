-- Replace Pump.fun roadmap copy with IPO / Raydium launch narrative.

UPDATE roadmap_items SET
  title = '$APTC public IPO on Solana',
  excerpt = 'Fixed-price IPO · 250M APTC · $100K raise target · Metaplex Genesis settlement · MetaDAO-inspired architecture · PinkSale-style 3-level affiliates · Pyth oracle · opens July 11, 2026 3:30 AM ET.',
  link = '/ipo',
  category = 'Platform',
  status = 'in_progress',
  sort_order = 10
WHERE id = 'a1000001-0001-4001-8001-000000000001';

UPDATE roadmap_items SET
  title = 'Raydium post-IPO trading',
  excerpt = 'Canonical APTC/SOL pool on Raydium after IPO closes — treasury support buys and MM coordination as secondary volume scales.',
  link = 'https://raydium.io/',
  category = 'Partnership',
  status = 'planned',
  sort_order = 35
WHERE id = 'a1000001-0001-4001-8001-000000000008';

UPDATE roadmap_items SET
  title = 'Automated GGR → APTC buyback pipeline',
  excerpt = 'Scheduled open-market buys on Jupiter & Raydium from gross gaming revenue — burn, staker, treasury splits published live.',
  link = '/litepaper#ggr-flywheel',
  category = 'Platform',
  status = 'planned',
  sort_order = 40
WHERE id = 'a1000001-0001-4001-8001-000000000009';

-- Drop superseded Pump.fun-only milestone if still present.
DELETE FROM roadmap_items
WHERE id = 'a1000001-0001-4001-8001-000000000031';
