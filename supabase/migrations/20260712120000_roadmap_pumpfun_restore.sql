-- Restore Pump.fun launch narrative on public roadmap (replaces IPO copy).
UPDATE roadmap_items
SET
  title = 'APTC TGE on Pump.fun',
  excerpt = 'Default Pump.fun launch · SOL bonding curve · ~1% creator dev buy · 1.25% curve trade fee · ~85 SOL graduation → PumpSwap (LP burned) · 100% creator fees to @aptcasinofun.',
  link = NULL,
  updated_at = NOW()
WHERE id = 'a1000001-0001-4001-8001-000000000001';

UPDATE roadmap_items
SET
  title = 'Tier 1 — DEX & trader listings',
  excerpt = 'Pump.fun · PumpSwap · DexScreener Enhanced · Jupiter · Birdeye · GeckoTerminal — bonding curve launch and chart visibility at TGE.',
  link = 'https://pump.fun/create',
  updated_at = NOW()
WHERE id = 'a1000001-0001-4001-8001-000000000037';

UPDATE roadmap_items
SET
  title = 'PumpSwap post-graduation trading',
  excerpt = 'Post-graduation canonical pool depth on PumpSwap — LP burned at migration, treasury support buys, and MM coordination so size doesn’t nuke the chart.',
  link = 'https://pump.fun/docs/fees',
  updated_at = NOW()
WHERE id = 'a1000001-0001-4001-8001-000000000008';
