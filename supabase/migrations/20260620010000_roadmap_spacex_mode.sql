-- Refresh public roadmap for Bags.fm SpaceX Mode APTC launch.

UPDATE roadmap_items SET
  title = 'APTC TGE on Bags.fm (SpaceX Mode)',
  excerpt = 'SpaceX Mode launch · 4% float · 96% locked · ~$50k starting MC · dynamic 2%→0.5% fees · ~55 SOL graduation → Meteora DAMM v2 · 25% fee compounding · 100% fee share to @aptcasinofun.',
  link = 'https://bags.fm/launch'
WHERE id = 'a1000001-0001-4001-8001-000000000031';
