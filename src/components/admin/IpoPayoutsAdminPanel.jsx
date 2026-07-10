'use client';

import { useCallback, useEffect, useState } from 'react';
import { FaCheck, FaGift, FaSync, FaTimes } from 'react-icons/fa';
import { Badge, EmptyState, Panel, SectionHeading, StatBox } from '@/components/admin/ui';

function fmtNum(n, opts = {}) {
  if (n == null || !Number.isFinite(Number(n))) return '—';
  return Number(n).toLocaleString(undefined, opts);
}

function short(a) {
  if (!a) return '—';
  const s = String(a);
  return s.length > 12 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function solscanTx(tx) {
  if (!tx) return null;
  return `https://solscan.io/tx/${tx}`;
}

export default function IpoPayoutsAdminPanel({ adminToken }) {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('due');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionKey, setActionKey] = useState(null);

  const load = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`/api/admin/ipo-payouts?filter=${filter}`, {
        headers: { 'x-admin-token': adminToken },
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed to load');
      setData(j);
    } catch (e) {
      setError(e.message || 'Load failed');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [adminToken, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const pay = async (payload) => {
    const key = JSON.stringify(payload);
    setActionKey(key);
    try {
      const r = await fetch('/api/admin/ipo-payouts/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Payout failed');
      await load();
      return j;
    } catch (e) {
      alert(e.message || 'Payout failed');
      return null;
    } finally {
      setActionKey(null);
    }
  };

  const recordStakingPayout = async (row) => {
    const tx = window.prompt(
      `Paste Solana tx signature after manually sending ${fmtNum(row.rewardAmount, { maximumFractionDigits: 4 })} APTC to ${row.userAddress}:`,
      '',
    );
    if (tx === null || !tx.trim()) return;
    await pay({ type: 'staking_reward', ids: [row.id], txHash: tx.trim() });
  };

  const recordAffiliatePayout = async (row) => {
    const tx = window.prompt(
      `Paste Solana tx signature after manually sending ${fmtNum(row.aptcAmount, { maximumFractionDigits: 4 })} APTC to ${row.beneficiaryWallet}:`,
      '',
    );
    if (tx === null || !tx.trim()) return;
    await pay({ type: 'affiliate_reward', ids: [row.id], txHash: tx.trim() });
  };

  const recordWithdrawalPayout = async (wd) => {
    const tx = window.prompt(
      `Paste Solana tx signature after manually sending ${fmtNum(wd.aptcAmount, { maximumFractionDigits: 4 })} APTC to ${wd.wallet}:`,
      '',
    );
    if (tx === null || !tx.trim()) return;
    await pay({ type: 'affiliate_withdrawal', withdrawalId: wd.id, action: 'pay', txHash: tx.trim() });
  };

  const rejectWithdrawal = async (wd) => {
    const note = window.prompt('Rejection note (optional):', '') ?? '';
    await pay({
      type: 'affiliate_withdrawal',
      withdrawalId: wd.id,
      action: 'reject',
      adminNote: note.trim() || undefined,
    });
  };

  if (!adminToken) {
    return (
      <p className="text-sm text-white/50">Save your admin token above to manage IPO reward payouts.</p>
    );
  }

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeading
          title="IPO payout queue"
          description="Record manual APTC payouts for IPO staking rewards (post-unlock) and 3-level affiliate accruals. Send from your wallet first, then log the tx."
        />
        <div className="flex flex-wrap gap-2 items-center">
          {['due', 'upcoming', 'all'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full border uppercase tracking-wider ${
                filter === f
                  ? 'bg-fuchsia-500/25 border-fuchsia-400/40 text-white'
                  : 'border-white/15 text-white/55 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-white/15 text-white/70 hover:text-white"
          >
            <FaSync className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">{error}</p>
      )}

      {summary && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatBox
            label="Staking rewards due"
            value={summary.stakingDueCount}
            hint={`${fmtNum(summary.stakingDueAptc, { maximumFractionDigits: 2 })} APTC`}
            variant="accent"
          />
          <StatBox
            label="Affiliate due"
            value={summary.affiliateDueCount}
            hint={`${fmtNum(summary.affiliateDueAptc, { maximumFractionDigits: 2 })} APTC`}
          />
          <StatBox
            label="Withdrawal requests"
            value={summary.withdrawalPendingCount}
            hint={`${fmtNum(summary.withdrawalPendingAptc, { maximumFractionDigits: 2 })} APTC`}
          />
          <StatBox
            label="Total due APTC"
            value={fmtNum(summary.totalDueAptc, { maximumFractionDigits: 2 })}
            variant="success"
          />
        </div>
      )}

      <Panel className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
          <h4 className="text-sm font-semibold text-white">IPO staking rewards</h4>
          <p className="text-xs text-white/45 mt-1">30-day lock positions · principal in staking vault · pay reward (+ principal on claim) after unlock</p>
        </div>
        {loading && !data ? (
          <EmptyState title="Loading payout queue…" />
        ) : (data?.stakingRewards ?? []).length === 0 ? (
          <p className="text-sm text-white/45 px-4 py-6">No staking rewards in this filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-xs">
              <thead className="bg-white/[0.03] text-left text-[10px] uppercase tracking-widest text-white/40">
                <tr>
                  <th className="px-3 py-2">Unlock</th>
                  <th className="px-3 py-2">Wallet</th>
                  <th className="px-3 py-2">Stake</th>
                  <th className="px-3 py-2">Reward</th>
                  <th className="px-3 py-2">IPO #</th>
                  <th className="px-3 py-2">Due</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {data.stakingRewards.map((row) => (
                  <tr key={row.id} className="text-white/80">
                      <td className="px-3 py-2 whitespace-nowrap">{fmtDate(row.unlockAt)}</td>
                      <td className="px-3 py-2 font-mono">{row.userAddress}</td>
                      <td className="px-3 py-2 tabular-nums">{fmtNum(row.amount, { maximumFractionDigits: 2 })}</td>
                      <td className="px-3 py-2 tabular-nums text-emerald-300">{fmtNum(row.rewardAmount, { maximumFractionDigits: 4 })}</td>
                      <td className="px-3 py-2">{row.purchaseId ?? '—'}</td>
                      <td className="px-3 py-2">
                        <Badge tone={row.due ? 'success' : 'neutral'}>{row.due ? 'Due' : 'Locked'}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          disabled={!row.due}
                          onClick={() => recordStakingPayout(row)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded border border-emerald-500/30 text-emerald-200 disabled:opacity-40"
                        >
                          <FaGift /> Record payout
                        </button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
          <h4 className="text-sm font-semibold text-white">Affiliate accruals</h4>
          <p className="text-xs text-white/45 mt-1">3% / 1.5% / 0.5% · withdrawable after 10-day cliff</p>
        </div>
        {(data?.affiliateRewards ?? []).length === 0 ? (
          <p className="text-sm text-white/45 px-4 py-6">No affiliate rewards in this filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-xs">
              <thead className="bg-white/[0.03] text-left text-[10px] uppercase tracking-widest text-white/40">
                <tr>
                  <th className="px-3 py-2">Withdrawable</th>
                  <th className="px-3 py-2">Beneficiary</th>
                  <th className="px-3 py-2">L</th>
                  <th className="px-3 py-2">APTC</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Due</th>
                  <th className="px-3 py-2">Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {data.affiliateRewards.map((row) => (
                  <tr key={row.id} className="text-white/80">
                    <td className="px-3 py-2 whitespace-nowrap">{fmtDate(row.withdrawableAt)}</td>
                    <td className="px-3 py-2 font-mono">{row.beneficiaryWallet}</td>
                    <td className="px-3 py-2">L{row.level}</td>
                    <td className="px-3 py-2 tabular-nums text-violet-200">{fmtNum(row.aptcAmount, { maximumFractionDigits: 4 })}</td>
                    <td className="px-3 py-2">{row.status}</td>
                    <td className="px-3 py-2">
                      <Badge tone={row.due ? 'success' : 'neutral'}>{row.due ? 'Due' : 'Cliff'}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        disabled={!row.due}
                        onClick={() => recordAffiliatePayout(row)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-violet-500/30 text-violet-200 disabled:opacity-40"
                      >
                        <FaCheck /> Record payout
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
          <h4 className="text-sm font-semibold text-white">Affiliate withdrawal requests</h4>
        </div>
        {(data?.affiliateWithdrawals ?? []).length === 0 ? (
          <p className="text-sm text-white/45 px-4 py-6">No pending withdrawal requests.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-xs">
              <thead className="bg-white/[0.03] text-left text-[10px] uppercase tracking-widest text-white/40">
                <tr>
                  <th className="px-3 py-2">Requested</th>
                  <th className="px-3 py-2">Wallet</th>
                  <th className="px-3 py-2">APTC</th>
                  <th className="px-3 py-2">Rewards</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {data.affiliateWithdrawals.map((wd) => (
                  <tr key={wd.id} className="text-white/80">
                    <td className="px-3 py-2 whitespace-nowrap">{fmtDate(wd.requestedAt)}</td>
                    <td className="px-3 py-2 font-mono">{wd.wallet}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtNum(wd.aptcAmount, { maximumFractionDigits: 4 })}</td>
                    <td className="px-3 py-2">{wd.rewardIds?.length ?? 0}</td>
                    <td className="px-3 py-2">{wd.status}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => recordWithdrawalPayout(wd)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded border border-emerald-500/30 text-emerald-200"
                        >
                          <FaGift /> Record payout
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectWithdrawal(wd)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded border border-rose-500/30 text-rose-200"
                        >
                          <FaTimes /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="text-[11px] text-white/35 leading-relaxed">
        Staking and affiliate rewards are never sent automatically. Send APTC from your ops wallet, then paste the
        Solana transaction signature to mark the queue item paid.
      </p>
    </div>
  );
}
