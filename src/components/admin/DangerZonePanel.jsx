'use client';

import { useState } from 'react';
import { fmtNum, shortWallet, AdminTable, THead, TableRow, Panel, SectionHeading, Badge } from '@/components/admin/ui';

function StatMini({ label, value, highlight }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5">
      <p className="text-[9px] uppercase tracking-wider text-white/40">{label}</p>
      <p className={`text-sm font-bold tabular-nums mt-1 ${highlight ? 'text-amber-300' : 'text-white/90'}`}>
        {value}
      </p>
    </div>
  );
}

function adminFetch(path, token, init = {}) {
  return fetch(path, {
    ...init,
    headers: {
      ...(init.headers || {}),
      'x-admin-token': token,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
}

export default function DangerZonePanel({
  adminToken,
  danger,
  bannedWallets,
  onRefresh,
  onApproveWithdrawal,
  onRejectWithdrawal,
  wdActionId,
  banAddressInput,
  setBanAddressInput,
  banReasonInput,
  setBanReasonInput,
}) {
  const [statusBusy, setStatusBusy] = useState(null);

  const addBan = async () => {
    const addr = banAddressInput.trim();
    if (!addr || !adminToken) return;
    const r = await adminFetch('/api/admin/banned-wallets', adminToken, {
      method: 'POST',
      body: JSON.stringify({ walletAddress: addr, reason: banReasonInput || undefined }),
    });
    const j = await r.json();
    if (!r.ok) {
      alert(j.error || 'Ban failed');
      return;
    }
    setBanAddressInput('');
    setBanReasonInput('');
    onRefresh();
  };

  const removeBan = async (wallet) => {
    if (!adminToken || !window.confirm(`Remove global ban for ${shortWallet(wallet)}?`)) return;
    const r = await adminFetch(
      `/api/admin/banned-wallets?walletAddress=${encodeURIComponent(wallet)}`,
      adminToken,
      { method: 'DELETE' },
    );
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      alert(j.error || 'Unban failed');
      return;
    }
    onRefresh();
  };

  const unbanAndWipe = async (wallet) => {
    if (
      !adminToken ||
      !window.confirm('Unban and zero all house balances for this wallet? On-chain funds are not reversed.')
    )
      return;
    const r = await adminFetch('/api/admin/unban-wallet', adminToken, {
      method: 'POST',
      body: JSON.stringify({ walletAddress: wallet }),
    });
    const j = await r.json();
    if (!r.ok) {
      alert(j.error || 'Unban failed');
      return;
    }
    onRefresh();
  };

  const updateStatus = async (wallet, status) => {
    if (!adminToken) return;
    setStatusBusy(wallet + status);
    try {
      const r = await adminFetch('/api/admin/users/status', adminToken, {
        method: 'POST',
        body: JSON.stringify({ userAddress: wallet, status }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Status update failed');
      onRefresh();
    } catch (e) {
      alert(e.message || 'Failed');
    } finally {
      setStatusBusy(null);
    }
  };

  const frequencyUsers = danger?.frequencyUsers ?? [];
  const suspiciousUsers = danger?.suspiciousUsers ?? [];

  return (
    <div className="space-y-10">
      <SectionHeading
        title="Compliance & enforcement"
        description="High-frequency withdrawers, global bans, and suspicious win streaks."
      />

      {frequencyUsers.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-amber-300">
              Manual review — high withdrawal frequency
            </h3>
            <Badge tone="warning">{frequencyUsers.length}</Badge>
          </div>
          <p className="text-xs text-white/45 max-w-3xl">
            Wallets with {danger?.frequencyThreshold}+ total withdrawals. Review full financial profile before
            approving pending requests.
          </p>
          {frequencyUsers.map((u) => (
            <Panel key={u.wallet} variant="warning" className="p-5 space-y-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{shortWallet(u.wallet)}</span>
                    <Badge tone="warning">Frequency flag</Badge>
                    <Badge tone="neutral">{u.accountStatus}</Badge>
                  </div>
                  <p className="text-[10px] text-white/30 font-mono mt-1 break-all">{u.wallet}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBanAddressInput(u.wallet);
                    setBanReasonInput('High-frequency withdrawals');
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
                >
                  Pre-fill ban
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <StatMini label="Total withdrawals" value={u.totalWithdrawals} highlight />
                <StatMini label="Completed" value={u.completedWithdrawals} />
                <StatMini label="Pending review" value={u.pendingWithdrawals} highlight />
                <StatMini label="Total deposited" value={fmtNum(u.totalDeposited)} />
                <StatMini label="Total withdrawn" value={fmtNum(u.totalWithdrawn)} />
                <StatMini label="Avail. balance" value={fmtNum(u.totalAvailableBalance)} highlight />
              </div>
              <p className={`text-xs font-mono ${u.netPnl >= 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                Player P&L {u.netPnl >= 0 ? '+' : ''}
                {fmtNum(u.netPnl)}
                {u.netPnl >= 0 ? ' — user net-up (house lost)' : ' — user net-down'}
              </p>
              {u.pendingRequests?.length > 0 && (
                <AdminTable>
                  <THead cols={['ID', 'Chain', 'Amount', 'USD', 'Requested', 'Actions']} />
                  <tbody>
                    {u.pendingRequests.map((r) => (
                      <tr key={r.id} className="border-t border-white/5 text-xs">
                        <td className="px-3 py-2 font-mono text-white/40">{String(r.id).slice(0, 8)}…</td>
                        <td className="px-3 py-2 capitalize">{r.chain}</td>
                        <td className="px-3 py-2 font-mono">{fmtNum(r.gross_apt)}</td>
                        <td className="px-3 py-2">${fmtNum(r.usd_estimate, 2)}</td>
                        <td className="px-3 py-2">{new Date(r.created_at).toLocaleString()}</td>
                        <td className="px-3 py-2">
                          {r.chain === 'aptos' || r.chain === 'solana' ? (
                            <div className="flex gap-1">
                              {onApproveWithdrawal ? (
                                <button
                                  type="button"
                                  disabled={wdActionId === r.id}
                                  onClick={() => onApproveWithdrawal(r.id)}
                                  className="px-2 py-1 rounded bg-emerald-600 text-white disabled:opacity-50"
                                >
                                  Accept
                                </button>
                              ) : null}
                              {onRejectWithdrawal ? (
                                <button
                                  type="button"
                                  disabled={wdActionId === r.id}
                                  onClick={() => onRejectWithdrawal(r.id)}
                                  className="px-2 py-1 rounded border border-rose-500/50 text-rose-300 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </AdminTable>
              )}
            </Panel>
          ))}
        </section>
      )}

      <Panel variant="danger" className="p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-rose-300">Global wallet ban list</h3>
        <p className="text-sm text-white/50">
          Blocks deposits, bets, and withdrawals. Erases all house ledger, play history, referrals, and profile data for the wallet.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={banAddressInput}
            onChange={(e) => setBanAddressInput(e.target.value)}
            placeholder="Wallet address"
            className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm font-mono"
          />
          <input
            value={banReasonInput}
            onChange={(e) => setBanReasonInput(e.target.value)}
            placeholder="Reason"
            className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void addBan()}
            className="px-4 py-2 rounded-lg bg-rose-600/80 text-sm font-bold hover:bg-rose-500"
          >
            Ban wallet
          </button>
        </div>
        <AdminTable>
          <THead cols={['Address', 'Reason', 'Added', '']} />
          <tbody>
            {bannedWallets.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-white/40 text-sm">
                  No global bans
                </td>
              </tr>
            ) : (
              bannedWallets.map((b) => (
                <tr key={b.wallet_address} className="border-t border-white/5 text-sm">
                  <td className="px-4 py-2 font-mono text-xs break-all">{b.wallet_address}</td>
                  <td className="px-4 py-2 text-white/60">{b.reason || '—'}</td>
                  <td className="px-4 py-2 text-xs">{new Date(b.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => void unbanAndWipe(b.wallet_address)}
                      className="text-xs text-amber-300 underline"
                    >
                      Unban + wipe
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeBan(b.wallet_address)}
                      className="text-xs text-white/60 underline"
                    >
                      Remove ban
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </AdminTable>
      </Panel>

      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
          Suspicious win streaks ({danger?.winStreakThreshold}+ consecutive wins)
        </h3>
        <AdminTable stickyHeader>
          <THead cols={['Node identity', 'Max streak', 'Pattern', 'Balance', 'Status', 'Ops']} />
          <tbody>
            {suspiciousUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/40 text-sm">
                  No suspicious activity detected
                </td>
              </tr>
            ) : (
              suspiciousUsers.map((u) => (
                <TableRow key={u.wallet}>
                  <td className="px-4 py-3 font-mono text-xs">{shortWallet(u.wallet)}</td>
                  <td className="px-4 py-3 text-rose-400 font-bold">{u.maxStreak}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-0.5">
                      {(u.latestBets || []).map((won, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-4 rounded-sm ${won ? 'bg-emerald-500' : 'bg-white/10'}`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{fmtNum(u.totalBalance)}</td>
                  <td className="px-4 py-3 text-xs uppercase">{u.accountStatus}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap gap-1 justify-end">
                      {u.accountStatus !== 'frozen' && u.accountStatus !== 'banned' && (
                        <button
                          type="button"
                          disabled={!!statusBusy}
                          onClick={() => void updateStatus(u.wallet, 'frozen')}
                          className="text-xs px-2 py-1 rounded border border-amber-500/40 text-amber-300"
                        >
                          Freeze
                        </button>
                      )}
                      {u.accountStatus !== 'banned' && (
                        <button
                          type="button"
                          disabled={!!statusBusy}
                          onClick={() => void updateStatus(u.wallet, 'banned')}
                          className="text-xs px-2 py-1 rounded border border-rose-500/40 text-rose-300"
                        >
                          Ban
                        </button>
                      )}
                      {(u.accountStatus === 'frozen' || u.accountStatus === 'banned') && (
                        <button
                          type="button"
                          disabled={!!statusBusy}
                          onClick={() => void updateStatus(u.wallet, 'active')}
                          className="text-xs px-2 py-1 rounded border border-white/20 text-white/70"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </TableRow>
              ))
            )}
          </tbody>
        </AdminTable>
      </section>
    </div>
  );
}
