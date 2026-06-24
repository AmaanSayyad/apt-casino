#!/usr/bin/env node
/**
 * Site-wide smoke test: pages, redirects, and public APIs.
 * Usage: node scripts/qa-smoke-test.mjs [baseUrl]
 */
const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');

const PAGES = [
  '/',
  '/game',
  '/game/plinko',
  '/game/mines',
  '/game/roulette',
  '/game/wheel',
  '/live',
  '/livestream',
  '/stake',
  '/staking',
  '/bank',
  '/profile',
  '/leaderboard',
  '/competition',
  '/referral',
  '/otc-lottery',
  '/litepaper',
  '/dashboard',
  '/history',
  '/rewards',
  '/fairness/verify',
  '/games',
  '/volume-cup',
  '/this-route-does-not-exist-qa',
];

const APIS = [
  { method: 'GET', path: '/api/stats/public' },
  { method: 'GET', path: '/api/stats/live' },
  { method: 'GET', path: '/api/leaderboard?limit=5' },
  { method: 'GET', path: '/api/staking/pools' },
  { method: 'GET', path: '/api/staking/aptc-stats' },
  { method: 'GET', path: '/api/tournaments' },
  { method: 'GET', path: '/api/competitions/active' },
  { method: 'GET', path: '/api/referrals/config' },
  { method: 'GET', path: '/api/referrals/leaderboard?limit=5' },
  { method: 'GET', path: '/api/players/count' },
  { method: 'GET', path: '/api/games/stats?game=mines' },
  { method: 'POST', path: '/api/profile/cashback/claim', body: { wallet: 'fake', chain: 'solana' }, expect: [400, 401] },
  { method: 'POST', path: '/api/staking/claim', body: { userAddress: 'fake', positionId: 1 }, expect: [400, 401] },
  { method: 'POST', path: '/api/log-game', body: { gameType: 'mines', playerAddress: 'x', betAmount: -1, result: 'loss', payout: 0 }, expect: [400, 401] },
];

async function fetchOne(url, opts = {}) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(url, { redirect: 'manual', signal: controller.signal, ...opts });
    const ms = Date.now() - started;
    let finalUrl = url;
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (loc) finalUrl = loc.startsWith('http') ? loc : new URL(loc, url).href;
    }
    return { status: res.status, ms, finalUrl, ok: res.ok || res.status === 404 };
  } catch (e) {
    return { status: 0, ms: Date.now() - started, error: e.message, ok: false };
  } finally {
    clearTimeout(timer);
  }
}

async function testPage(path) {
  const url = `${BASE}${path}`;
  const r = await fetchOne(url);
  const pass =
    r.status === 200 ||
    (path.includes('does-not-exist') && r.status === 404) ||
    (['/games', '/volume-cup', '/staking', '/bank', '/livestream'].includes(path) && [301, 302, 307, 308].includes(r.status));
  return { kind: 'page', path, ...r, pass };
}

async function testApi({ method, path, body, expect }) {
  const url = `${BASE}${path}`;
  const opts = { method, headers: body ? { 'Content-Type': 'application/json' } : {} };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetchOne(url, opts);
  const allowed = expect || [200];
  const pass = allowed.includes(r.status);
  return { kind: 'api', path, method, ...r, pass, expected: allowed };
}

async function main() {
  console.log(`QA smoke test → ${BASE}\n`);

  const pageResults = [];
  for (const p of PAGES) {
    pageResults.push(await testPage(p));
  }

  const apiResults = [];
  for (const a of APIS) {
    apiResults.push(await testApi(a));
  }

  const all = [...pageResults, ...apiResults];
  const failed = all.filter((r) => !r.pass);

  console.log('--- Pages ---');
  for (const r of pageResults) {
    const icon = r.pass ? '✓' : '✗';
    const extra = r.status >= 300 && r.status < 400 ? ` → ${r.finalUrl}` : '';
    console.log(`${icon} ${r.status} ${r.ms}ms ${r.path}${extra}${r.error ? ` ERR:${r.error}` : ''}`);
  }

  console.log('\n--- APIs ---');
  for (const r of apiResults) {
    const icon = r.pass ? '✓' : '✗';
    console.log(
      `${icon} ${r.method} ${r.status} ${r.ms}ms ${r.path} (expected ${r.expected?.join('|')})${r.error ? ` ERR:${r.error}` : ''}`,
    );
  }

  console.log(`\n${all.length - failed.length}/${all.length} passed`);
  if (failed.length) {
    console.log('\nFAILED:');
    for (const r of failed) {
      console.log(` - ${r.kind} ${r.method || 'GET'} ${r.path} → ${r.status} ${r.error || ''}`);
    }
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
