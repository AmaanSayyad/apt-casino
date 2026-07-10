-- Mark shipped platform milestones as completed (shipped).
-- Public roadmap API shows shipped items with a Completed badge.

UPDATE roadmap_items SET status = 'shipped'
WHERE id IN (
  'a1000001-0001-4001-8001-000000000002', -- Multichain connect wallet
  'a1000001-0001-4001-8001-000000000003', -- Aptos mainnet games
  'a1000001-0001-4001-8001-000000000005'  -- GGR buyback dashboard
);

UPDATE roadmap_items SET
  excerpt = 'Fixed-price IPO · 250M APTC · $100K raise target · Metaplex Genesis settlement · MetaDAO-inspired architecture · PinkSale-style 3-level affiliates · Pyth oracle · opens July 11, 2026 · 3:30 AM.'
WHERE id = 'a1000001-0001-4001-8001-000000000001';
