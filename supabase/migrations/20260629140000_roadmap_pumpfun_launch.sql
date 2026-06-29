-- Refresh public roadmap for Pump.fun APTC launch.

UPDATE roadmap_items SET
  title = 'APTC TGE on Pump.fun',
  excerpt = 'Default Pump.fun launch · SOL bonding curve · ~1% creator dev buy · 1.25% curve fee · ~85 SOL graduation → PumpSwap · 100% creator fees to @aptcasinofun.',
  link = 'https://pump.fun/create'
WHERE id = 'a1000001-0001-4001-8001-000000000031';

UPDATE roadmap_items SET
  title = 'APTC TGE on Pump.fun',
  excerpt = 'Default Pump.fun launch · SOL bonding curve · ~1% creator dev buy · 1.25% curve fee · ~85 SOL graduation → PumpSwap · 100% creator fees to @aptcasinofun.',
  link = 'https://pump.fun/create'
WHERE id = 'a1000001-0001-4001-8001-000000000001';

UPDATE roadmap_items SET
  title = 'PumpSwap post-graduation trading',
  excerpt = 'Post-graduation canonical pool depth on PumpSwap — LP burned at migration, treasury support buys, and MM coordination.',
  link = 'https://pump.fun/docs/fees'
WHERE id = 'a1000001-0001-4001-8001-000000000008';

UPDATE roadmap_items SET
  excerpt = 'Scheduled open-market buys on Jupiter & PumpSwap from gross gaming revenue — burn, staker, treasury splits published live.'
WHERE id = 'a1000001-0001-4001-8001-000000000009';
