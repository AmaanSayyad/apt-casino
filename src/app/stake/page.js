'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import PageShell from '@/components/layout/PageShell';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import {
  buildAptcStakeTransaction,
  waitForSolanaSignatureConfirmed,
  formatSolanaError,
} from '@/lib/solana/client';
import {
  FaChartLine,
  FaCoins,
  FaLock,
  FaClock,
  FaCalculator,
  FaExternalLinkAlt,
  FaInfoCircle,
} from 'react-icons/fa';
const STAKING_ENABLED =
  (process.env.NEXT_PUBLIC_APTC_STAKING_ENABLED || 'false').toLowerCase() === 'true';
const APTC_MINT = process.env.NEXT_PUBLIC_APTC_SOLANA_MINT || '';
const STAKING_VAULT = process.env.NEXT_PUBLIC_APTC_STAKING_VAULT || '2ei9VY2TtJ6GkvVMs1su5b348p98ajLaU45MzvE6gYaq';

function fmtUsd(n) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  if (n > 0 && n < 0.01) return '<$0.01';
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPriceUsd(n) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  if (n >= 1) {
    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  }
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  if (n >= 0.0001) return `$${n.toFixed(6)}`;
  const fixed = n.toFixed(8).replace(/\.?0+$/, '');
  return `$${fixed}`;
}

function fmtNum(n) {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return '—';
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function fmtDate(input) {
  if (!input) return '—';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

function fmtStakeAmount(n) {
  if (!Number.isFinite(n) || n <= 0) return '';
  const rounded = Math.floor(n * 1e6) / 1e6;
  return String(rounded);
}

export default function StakePage() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { getWalletAuth } = useWalletAuth();
  const { connection } = useConnection();
  const address = publicKey?.toBase58() || null;

  const [aptcBalance, setAptcBalance] = useState(null);

  const [pools, setPools] = useState([]);
  const [positions, setPositions] = useState([]);
  const [stats, setStats] = useState(null);
  const [amountByPool, setAmountByPool] = useState({});
  const [submittingPool, setSubmittingPool] = useState(null);
  const [claimingId, setClaimingId] = useState(null);
  const [calcAmount, setCalcAmount] = useState('');
  const [calcPoolKey, setCalcPoolKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const refreshStats = useCallback(async () => {
    try {
      const r = await fetch('/api/staking/aptc-stats');
      const j = await r.json();
      if (r.ok) setStats(j);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshPools = useCallback(async () => {
    try {
      const r = await fetch('/api/staking/pools');
      const j = await r.json();
      if (r.ok) setPools(j.pools || []);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshPositions = useCallback(async () => {
    if (!address) {
      setPositions([]);
      return;
    }
    try {
      const r = await fetch(`/api/staking/positions?userAddress=${encodeURIComponent(address)}`);
      const j = await r.json();
      if (r.ok) setPositions(j.positions || []);
    } catch {
      /* ignore */
    }
  }, [address]);

  const refreshAptcBalance = useCallback(async () => {
    if (!address || !APTC_MINT || !connection) {
      setAptcBalance(null);
      return;
    }
    try {
      const res = await connection.getParsedTokenAccountsByOwner(new PublicKey(address), {
        mint: new PublicKey(APTC_MINT),
      });
      const bal = res.value.reduce(
        (sum, acc) => sum + Number(acc.account.data.parsed.info.tokenAmount.uiAmount || 0),
        0,
      );
      setAptcBalance(bal);
    } catch {
      setAptcBalance(null);
    }
  }, [address, connection]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await Promise.all([refreshStats(), refreshPools(), refreshPositions(), refreshAptcBalance()]);
      if (!cancelled) setLoading(false);
    })();
    const id = setInterval(refreshStats, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [refreshStats, refreshPools, refreshPositions, refreshAptcBalance]);

  useEffect(() => {
    if (!calcPoolKey && pools.length) setCalcPoolKey(pools[0].pool_key);
  }, [pools, calcPoolKey]);

  const priceUsd = stats?.priceUsd ?? null;
  const usd = useCallback(
    (aptc) => (priceUsd !== null && Number.isFinite(aptc) ? aptc * priceUsd : null),
    [priceUsd],
  );

  const calcPool = useMemo(
    () => pools.find((p) => p.pool_key === calcPoolKey) ?? pools[0] ?? null,
    [calcPoolKey, pools],
  );
  const calcPrincipal = useMemo(() => {
    const n = Number(calcAmount);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [calcAmount]);
  const calcApyPct = Number(calcPool?.apy_bps || 0) / 100;
  const calcDays = Number(calcPool?.lock_days || 0);
  const calcReward = useMemo(() => {
    if (!calcPool || calcPrincipal <= 0) return 0;
    return Math.round(calcPrincipal * (calcApyPct / 100) * (calcDays / 365) * 1e8) / 1e8;
  }, [calcApyPct, calcDays, calcPool, calcPrincipal]);
  const calcPayout = calcPrincipal + calcReward;
  const calcRoiPct = calcPrincipal > 0 ? (calcReward / calcPrincipal) * 100 : 0;
  const calcDaily = calcDays > 0 ? calcReward / calcDays : 0;
  const calcMonthly = calcDays > 0 ? calcReward * (30 / calcDays) : 0;

  const setMaxForPool = useCallback(
    (pool) => {
      setError(null);
      if (!connected || !address) {
        setError('Connect your wallet first.');
        return;
      }
      if (aptcBalance == null || aptcBalance <= 0) {
        setError('No APTC balance found in your wallet.');
        return;
      }
      let max = aptcBalance;
      if (pool.max_stake) max = Math.min(max, Number(pool.max_stake));
      if (max < Number(pool.min_stake || 0)) {
        setError(`Wallet balance is below the ${fmtNum(pool.min_stake)} APTC minimum for this pool.`);
        return;
      }
      setAmountByPool((prev) => ({ ...prev, [pool.pool_key]: fmtStakeAmount(max) }));
    },
    [address, aptcBalance, connected],
  );

  const handleStake = useCallback(
    async (pool) => {
      setError(null);
      setSuccess(null);

      if (!address) {
        setError('Connect your wallet first.');
        return;
      }
      if (!sendTransaction) {
        setError('Your wallet cannot send transactions. Try Phantom or Solflare.');
        return;
      }
      if (!STAKING_ENABLED) {
        setError('APTC staking is not available yet — please check back soon.');
        return;
      }
      if (!STAKING_VAULT) {
        setError('Staking vault is not configured.');
        return;
      }
      if (!APTC_MINT) {
        setError('APTC mint is not configured.');
        return;
      }

      if (STAKING_VAULT && address === STAKING_VAULT) {
        setError('Connect a personal wallet with APTC — the staking vault wallet cannot stake to itself.');
        return;
      }

      const raw = amountByPool[pool.pool_key] || '';
      const amount = Number(raw);
      if (!Number.isFinite(amount) || amount <= 0) {
        setError('Enter a valid amount.');
        return;
      }
      if (amount < Number(pool.min_stake)) {
        setError(
          pool.min_stake_label
            ? `${pool.min_stake_label} (≥ ${fmtNum(pool.min_stake)} APTC).`
            : `Minimum stake for this pool is ${fmtNum(pool.min_stake)} APTC.`,
        );
        return;
      }

      setSubmittingPool(pool.pool_key);
      try {
        const tx = await buildAptcStakeTransaction(amount, address, STAKING_VAULT, connection);
        const txHash = await sendTransaction(tx, connection);
        await waitForSolanaSignatureConfirmed(connection, txHash);

        let json;
        let res;
        for (let attempt = 0; attempt < 6; attempt++) {
          res = await fetch('/api/staking/stake', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userAddress: address,
              poolKey: pool.pool_key,
              amount,
              txHash,
            }),
          });
          json = await res.json();
          if (res.ok) break;
          if (res.status !== 400 || attempt === 5) break;
          await new Promise((r) => setTimeout(r, 2500 * (attempt + 1)));
        }
        if (!res.ok) throw new Error(json.error || 'Failed to record stake');

        setAmountByPool((prev) => ({ ...prev, [pool.pool_key]: '' }));
        setSuccess(
          `Staked ${fmtNum(amount)} APTC in the ${pool.lock_days}-day pool. Tx: ${txHash.slice(0, 8)}…`,
        );
        await Promise.all([refreshPositions(), refreshStats(), refreshAptcBalance()]);
      } catch (e) {
        setError(formatSolanaError(e));
      } finally {
        setSubmittingPool(null);
      }
    },
    [address, amountByPool, connection, refreshPositions, refreshStats, refreshAptcBalance, sendTransaction],
  );

  const handleClaim = useCallback(
    async (positionId) => {
      setError(null);
      setSuccess(null);
      if (!address) {
        setError('Connect your wallet first.');
        return;
      }
      setClaimingId(positionId);
      try {
        const walletAuth = await getWalletAuth(address, 'solana', { fresh: true });
        if (!walletAuth) {
          throw new Error('Sign the wallet ownership prompt in your wallet to claim.');
        }
        const res = await fetch('/api/staking/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userAddress: address, positionId, walletAuth }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to claim');
        setSuccess(`Claim recorded. Payout: ${fmtNum(json.payout)} APTC.`);
        await Promise.all([refreshPositions(), refreshStats()]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to claim');
      } finally {
        setClaimingId(null);
      }
    },
    [address, getWalletAuth, refreshPositions, refreshStats],
  );

  const totalStakedByUser = useMemo(
    () =>
      positions
        .filter((p) => p.status === 'active')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [positions],
  );
  const claimable = useMemo(
    () => positions.filter((p) => p.status === 'active' && new Date(p.unlock_at).getTime() <= Date.now()),
    [positions],
  );

  return (
    <PageShell
      badge="APTC"
      title="Stake APTC"
      description="Fixed-term APTC staking pools on Solana. Stake APTC, earn yield at lock, claim principal + rewards at maturity."
      descriptionClassName="max-w-none md:whitespace-nowrap"
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Stake' }]}
      maxWidth="7xl"
    >
        {/* APTC market trends */}
        <section className="mb-10 p-[1px] bg-gradient-to-r from-red-magic/50 to-blue-magic/50 rounded-xl">
          <div className="bg-[#1A0015] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center">
                <FaChartLine className="text-blue-magic mr-2" />
                <h2 className="text-xl font-display font-medium">APTC Market</h2>
              </div>
              {stats?.pairUrl ? (
                <a
                  href={stats.pairUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-white/60 hover:text-white inline-flex items-center gap-1"
                >
                  View on DexScreener <FaExternalLinkAlt className="text-[10px]" />
                </a>
              ) : (
                <span className="text-xs text-white/40">DexScreener · {stats?.dexId || 'pre-launch'}</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatTile
                label="APTC Price"
                value={fmtPriceUsd(stats?.priceUsd)}
                hint={
                  stats?.priceChange24h !== null && stats?.priceChange24h !== undefined ? (
                    <span
                      className={stats.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}
                    >
                      {stats.priceChange24h >= 0 ? '↑' : '↓'} {Math.abs(stats.priceChange24h).toFixed(2)}%
                      <span className="text-white/40"> 24h</span>
                    </span>
                  ) : (
                    <span className="text-white/40">No 24h change</span>
                  )
                }
              />
              <StatTile
                label="Market Cap"
                value={fmtUsd(stats?.marketCapUsd ?? stats?.fdvUsd)}
                hint={stats?.fdvUsd ? `FDV ${fmtUsd(stats.fdvUsd)}` : ' '}
              />
              <StatTile
                label="Total Value Locked"
                value={fmtUsd(stats?.tvlUsd)}
                hint={
                  stats?.staking?.activeAptc
                    ? `${fmtNum(stats.staking.activeAptc)} APTC staked`
                    : 'DEX liquidity + staked APTC'
                }
              />
              <StatTile
                label="24h Volume"
                value={fmtUsd(stats?.volume24hUsd)}
                hint={stats?.fetchedAt ? `Updated ${new Date(stats.fetchedAt).toLocaleTimeString()}` : ' '}
              />
            </div>
          </div>
        </section>

        {/* Personal summary */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          <div className="rounded-xl border border-white/10 bg-[#1A0015]/80 p-4">
            <p className="text-xs uppercase tracking-widest text-white/40">Wallet</p>
            <p className="mt-2 text-sm text-white/80 break-all">
              {address ? `${address.slice(0, 8)}…${address.slice(-6)}` : 'Not connected'}
            </p>
            {!connected && (
              <p className="mt-2 text-[11px] text-white/40">
                Connect your wallet from the navbar to stake and view positions.
              </p>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-[#1A0015]/80 p-4">
            <p className="text-xs uppercase tracking-widest text-white/40">Total Pool Staked</p>
            <p className="mt-2 text-2xl font-bold text-blue-300">
              {stats?.staking?.activeAptc ? fmtNum(stats.staking.activeAptc) : '—'} APTC
            </p>
            <p className="mt-1 text-[11px] text-white/35">
              {stats?.staking?.activePositions 
                ? `${stats.staking.activePositions} active positions`
                : 'All users combined'
              }
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#1A0015]/80 p-4">
            <p className="text-xs uppercase tracking-widest text-white/40">Your Active Stake</p>
            <p className="mt-2 text-2xl font-bold text-emerald-300">{fmtNum(totalStakedByUser)} APTC</p>
            <p className="mt-1 text-[11px] text-white/35">≈ {fmtUsd(usd(totalStakedByUser))}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#1A0015]/80 p-4">
            <p className="text-xs uppercase tracking-widest text-white/40">Positions Open</p>
            <p className="mt-2 text-2xl font-bold text-purple-300">
              {positions.filter((p) => p.status === 'active').length}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#1A0015]/80 p-4">
            <p className="text-xs uppercase tracking-widest text-white/40">Claimable Now</p>
            <p className="mt-2 text-2xl font-bold text-amber-300">{claimable.length}</p>
          </div>
        </section>

        {STAKING_VAULT && (
          <div className="mb-8 rounded-xl border border-white/10 bg-[#1A0015]/60 px-4 py-3 text-xs text-white/70 flex flex-wrap items-center justify-between gap-2">
            <span>
              Staking vault (Solana):{' '}
              <span className="font-mono text-cyan-200/90 break-all">{STAKING_VAULT}</span>
            </span>
            <span className="text-white/40">All stakes flow wallet → vault.</span>
          </div>
        )}

        {STAKING_VAULT && address === STAKING_VAULT && (
          <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            You are connected with the <strong>staking vault</strong> wallet. Switch to a personal wallet
            that holds APTC to stake — this address only receives deposits.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </div>
        )}

        {/* Staking pools */}
        <section className="mb-12">
          <div className="flex items-center mb-4">
            <FaCoins className="text-yellow-400 mr-2" />
            <h2 className="text-xl font-display font-medium">Stake Pools</h2>
          </div>

          {loading && pools.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-[#1A0015]/80 p-5 animate-pulse">
                  <div className="h-6 w-20 bg-white/10 rounded mb-3" />
                  <div className="h-4 w-32 bg-white/10 rounded mb-2" />
                  <div className="h-10 w-full bg-white/10 rounded mt-4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {pools.map((pool) => {
                const disabled = !connected || !STAKING_ENABLED || submittingPool === pool.pool_key;
                return (
                  <div
                    key={pool.pool_key}
                    className="rounded-xl border border-white/10 bg-[#1A0015]/80 p-5 shadow-[0_10px_40px_-24px_rgba(168,85,247,0.45)]"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white">{pool.lock_days} Days</h3>
                      <span className="rounded-full bg-purple-500/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-purple-200">
                        {(pool.apy_bps / 100).toFixed(2)}% APY
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-white/60">
                      {pool.min_stake_label || `Min ${fmtNum(pool.min_stake)} APTC`}
                      {pool.min_supply_pct != null ? (
                        <span className="block text-xs text-white/40 mt-0.5">
                          ≥ {fmtNum(pool.min_stake)} APTC
                        </span>
                      ) : null}
                      {pool.max_stake ? ` · Max ${fmtNum(pool.max_stake)} APTC` : ''}
                    </p>

                    <div className="mt-4 flex gap-2">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        value={amountByPool[pool.pool_key] || ''}
                        onChange={(e) =>
                          setAmountByPool((prev) => ({ ...prev, [pool.pool_key]: e.target.value }))
                        }
                        placeholder="Amount"
                        className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-purple-400/60"
                        disabled={!connected || !STAKING_ENABLED}
                      />
                      <button
                        type="button"
                        onClick={() => void handleStake(pool)}
                        disabled={disabled}
                        className="shrink-0 rounded-xl border border-purple-400/30 bg-purple-500/15 px-4 py-2 text-xs font-bold uppercase tracking-widest text-purple-200 transition-all duration-200 hover:bg-purple-500/25 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {submittingPool === pool.pool_key ? 'Staking…' : 'Stake'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMaxForPool(pool)}
                        disabled={disabled || aptcBalance == null || aptcBalance <= 0}
                        className="shrink-0 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-xs font-bold uppercase tracking-widest text-white/80 transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                        title={
                          aptcBalance != null
                            ? `Use full wallet balance (${fmtNum(aptcBalance)} APTC)`
                            : 'Wallet balance unavailable'
                        }
                      >
                        Max
                      </button>
                    </div>

                    {!STAKING_ENABLED && (
                      <p className="mt-2 text-[11px] text-amber-300/80 flex items-center gap-1">
                        <FaClock className="text-[10px]" /> Coming soon
                      </p>
                    )}
                    {!connected && STAKING_ENABLED && (
                      <p className="mt-2 text-[11px] text-white/45">Connect wallet to stake.</p>
                    )}
                  </div>
                );
              })}
              {!pools.length && (
                <div className="col-span-full rounded-xl border border-white/10 bg-[#1A0015]/80 p-6 text-center text-white/50">
                  No staking pools configured yet.
                </div>
              )}
            </div>
          )}
        </section>

        {/* Calculator */}
        <section className="mb-12">
          <div className="flex items-center mb-4">
            <FaCalculator className="text-cyan-300 mr-2" />
            <h2 className="text-xl font-display font-medium">Staking Calculator</h2>
          </div>

          <div className="rounded-xl border border-cyan-400/20 bg-[#1A0015]/80 p-4 sm:p-5 space-y-4">
            <p className="text-xs text-white/60">
              Simulate your expected payout at any pool size. Reward = Principal × (APY/100) × (LockDays/365).
            </p>
            <p className="text-[10px] text-white/40">
              Indicative USD uses DexScreener APTC price. 1 APTC ≈{' '}
              <span className="font-mono text-cyan-200/90">
                {priceUsd !== null ? `$${priceUsd.toFixed(6)}` : '—'}
              </span>
              {priceUsd === null && ' — price unavailable.'}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="rounded-lg border border-white/10 bg-black/40 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                  Stake amount (APTC)
                </p>
                <input
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  placeholder="e.g. 10000"
                  className="mt-2 w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/30"
                />
                {calcPrincipal > 0 && (
                  <p className="mt-1 text-[10px] text-white/35">≈ {fmtUsd(usd(calcPrincipal))}</p>
                )}
              </label>

              <label className="rounded-lg border border-white/10 bg-black/40 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Pool term</p>
                <select
                  value={calcPool?.pool_key || ''}
                  onChange={(e) => setCalcPoolKey(e.target.value)}
                  className="mt-2 w-full bg-transparent text-sm font-semibold text-white outline-none"
                  disabled={!pools.length}
                >
                  {pools.map((p) => (
                    <option key={p.pool_key} value={p.pool_key} className="bg-[#0b0d13]">
                      {p.lock_days} Days ({(p.apy_bps / 100).toFixed(2)}% APY)
                    </option>
                  ))}
                  {!pools.length && (
                    <option value="" disabled>
                      No pools available
                    </option>
                  )}
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <CalcTile label="Estimated reward" tint="emerald" main={`${fmtNum(calcReward)} APTC`} sub={fmtUsd(usd(calcReward))} />
              <CalcTile label="Total payout" tint="purple" main={`${fmtNum(calcPayout)} APTC`} sub={fmtUsd(usd(calcPayout))} />
              <CalcTile label="ROI at unlock" tint="cyan" main={`${calcRoiPct.toFixed(2)}%`} sub=" " />
              <CalcTile label="Daily equivalent" tint="white" main={`${fmtNum(calcDaily)} /day`} sub={`${fmtUsd(usd(calcDaily))} /day`} />
            </div>

            <div className="rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-white/70">
              Monthly run-rate ≈ <span className="font-semibold text-white">{fmtNum(calcMonthly)} APTC</span>{' '}
              <span className="text-white/45">({fmtUsd(usd(calcMonthly))})</span>
            </div>
          </div>
        </section>

        {/* Positions */}
        <section className="mb-12">
          <div className="flex items-center mb-4">
            <FaLock className="text-emerald-300 mr-2" />
            <h2 className="text-xl font-display font-medium">My Positions</h2>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1A0015]/80">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-white/[0.03] text-left text-[11px] uppercase tracking-widest text-white/40">
                  <tr>
                    <th className="px-4 py-3">Pool</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">APY</th>
                    <th className="px-4 py-3">Unlock</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Payout</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.length === 0 && (
                    <tr>
                      <td className="px-4 py-5 text-white/45" colSpan={7}>
                        {loading
                          ? 'Loading positions…'
                          : !address
                            ? 'Connect your wallet to view your stake positions.'
                            : 'No staking positions yet. Stake into a pool above to start earning APTC yield.'}
                      </td>
                    </tr>
                  )}

                  {positions.map((p) => {
                    const unlocked = p.status === 'active' && new Date(p.unlock_at).getTime() <= Date.now();
                    const estReward =
                      Math.round(
                        Number(p.amount) *
                          (p.apy_bps / 10_000) *
                          (p.lock_days / 365) *
                          1e8,
                      ) / 1e8;
                    const estPayout = Number(p.total_payout || Number(p.amount) + estReward);
                    return (
                      <tr key={p.id} className="border-t border-white/5 text-white/80">
                        <td className="px-4 py-3 font-semibold">{p.lock_days}D</td>
                        <td className="px-4 py-3">
                          <div>{fmtNum(Number(p.amount))}</div>
                          {usd(Number(p.amount)) !== null && (
                            <p className="mt-0.5 text-[10px] text-white/35">≈ {fmtUsd(usd(Number(p.amount)))}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">{(p.apy_bps / 100).toFixed(2)}%</td>
                        <td className="px-4 py-3">{fmtDate(p.unlock_at)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                              p.status === 'claimed'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : unlocked
                                  ? 'bg-purple-500/20 text-purple-300'
                                  : 'bg-white/10 text-white/60'
                            }`}
                          >
                            {p.status === 'active' && unlocked ? 'claimable' : p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            {p.status === 'claimed'
                              ? `${fmtNum(Number(p.total_payout || 0))} APTC`
                              : `${fmtNum(estPayout)} APTC (est.)`}
                          </div>
                          {usd(p.status === 'claimed' ? Number(p.total_payout || 0) : estPayout) !== null && (
                            <p className="mt-0.5 text-[10px] text-white/35">
                              ≈{' '}
                              {fmtUsd(
                                usd(p.status === 'claimed' ? Number(p.total_payout || 0) : estPayout),
                              )}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {p.status === 'active' && unlocked ? (
                            <button
                              type="button"
                              onClick={() => void handleClaim(p.id)}
                              disabled={claimingId === p.id}
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white disabled:opacity-50"
                            >
                              {claimingId === p.id ? 'Claiming…' : 'Claim'}
                            </button>
                          ) : (
                            <span className="text-xs text-white/40">
                              {p.status === 'claimed' ? fmtDate(p.claimed_at) : '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Info cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoCard
            icon={<FaCoins className="text-yellow-400" />}
            title="How APTC Staking Works"
            body={
              <ol className="space-y-3 text-sm text-white/70">
                <li className="flex gap-3">
                  <Step n={1} /> Pick a lock term (30 / 60 / 90 / 365 days). Longer locks ⇒ higher APY.
                </li>
                <li className="flex gap-3">
                  <Step n={2} /> Stake APTC from your wallet — it moves to the staking vault on Solana.
                </li>
                <li className="flex gap-3">
                  <Step n={3} /> At maturity, claim principal + reward back to your wallet.
                </li>
              </ol>
            }
          />
          <InfoCard
            icon={<FaInfoCircle className="text-blue-magic" />}
            title="Why Fixed-Term Pools?"
            body={
              <ul className="space-y-2 text-sm text-white/70">
                <li>• Predictable, simple-interest yield fixed at stake time.</li>
                <li>• Rewards aren&apos;t affected by post-stake APY changes.</li>
                <li>• No collateral, no liquidation — your stake is yours.</li>
                <li>• Backed by the casino&apos;s treasury operations and on-chain payouts.</li>
              </ul>
            }
          />
        </section>
    </PageShell>
  );
}

function StatTile({ label, value, hint }) {
  return (
    <div className="bg-[#250020] p-4 rounded-lg hover:bg-[#350030] transition-colors">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white/70 text-sm">{label}</span>
        <FaInfoCircle className="text-white/30" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-white/50 text-xs mt-1">{hint}</div>
    </div>
  );
}

function CalcTile({ label, tint, main, sub }) {
  const tints = {
    emerald: 'border-emerald-400/20 bg-emerald-500/5 text-emerald-300',
    purple: 'border-purple-400/20 bg-purple-500/5 text-purple-300',
    cyan: 'border-cyan-400/20 bg-cyan-500/5 text-cyan-300',
    white: 'border-white/10 bg-white/[0.03] text-white',
  };
  const tone = tints[tint] || tints.white;
  return (
    <div className={`rounded-lg border p-3 ${tone}`}>
      <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-1 text-lg font-bold">{main}</p>
      <p className="mt-0.5 text-[11px] opacity-70">{sub}</p>
    </div>
  );
}

function InfoCard({ icon, title, body }) {
  return (
    <div className="p-[1px] bg-gradient-to-r from-red-magic/30 to-blue-magic/30 rounded-xl hover:from-red-magic hover:to-blue-magic transition-all duration-300">
      <div className="bg-[#1A0015] rounded-xl p-6 h-full">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-[#250020] flex items-center justify-center mr-3">
            {icon}
          </div>
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
        {body}
      </div>
    </div>
  );
}

function Step({ n }) {
  return (
    <span className="w-6 h-6 rounded-full bg-[#250020] flex items-center justify-center shrink-0 mt-0.5 text-sm">
      {n}
    </span>
  );
}
