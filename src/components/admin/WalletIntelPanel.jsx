'use client';

import { getPlayChainConfig } from '@/lib/chains/registry';
import { explorerTxUrl } from '@/lib/chains/explorer';
import { fmtNum, shortWallet, StatBox, AdminTable, THead, TableRow, Panel, Badge, SectionHeading } from '@/components/admin/ui';

function chainSymbol(chain) {
  return getPlayChainConfig(String(chain))?.nativeSymbol ?? String(chain).toUpperCase();
}

function octasToNative(chain, octas) {
  const units = getPlayChainConfig(String(chain))?.units ?? 1e9;
  return Number(octas) / units;
}

function withdrawalStatusTone(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'completed' || s === 'auto') return 'success';
  if (s === 'pending') return 'warning';
  if (s === 'rejected') return 'danger';
  return 'neutral';
}

function TxLink({ chain, hash }) {
  const href = explorerTxUrl(chain, hash);
  if (!href || !hash) return <span className="text-white/30">—</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-cyan-400/90 hover:text-cyan-300 hover:underline underline-offset-2 font-mono text-[10px]"
      title={hash}
    >
      {String(hash).slice(0, 8)}…
    </a>
  );
}

function LedgerHistoryTable({ title, subtitle, empty, cols, rows }) {
  return (
    <Panel className="p-0 overflow-hidden">
      <div className="px-5 pt-5 pb-3 border-b border-white/5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{title}</p>
        {subtitle ? <p className="text-xs text-white/35 mt-1">{subtitle}</p> : null}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-white/40 px-5 py-8">{empty}</p>
      ) : (
        <AdminTable className="border-0 rounded-none max-h-80 overflow-y-auto">
          <THead cols={cols} />
          <tbody>{rows}</tbody>
        </AdminTable>
      )}
    </Panel>
  );
}

export default function WalletIntelPanel({
  walletQuery,
  setWalletQuery,
  onAnalyze,
  loading,
  error,
  intel,
  onBanPrefill,
}) {
  const a = intel?.aggregates;
  const fin = a?.financial;
  const bet = a?.betting;
  const deposits = intel?.depositHistory ?? intel?.recentDeposits ?? [];
  const withdrawals = intel?.withdrawalHistory ?? [];

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <SectionHeading
        title="Wallet intelligence"
        description="Cross-chain lookup: balances, deposits, withdrawals, play, referrals, staking, and OTC."
      />

      <div className="flex w-full min-w-0 flex-col gap-3 sm:max-w-3xl sm:flex-row">
        <input
          value={walletQuery}
          onChange={(e) => setWalletQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAnalyze()}
          placeholder="Solana base58 or 0x Aptos address…"
          className="min-w-0 w-full flex-1 rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm font-mono focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
        />
        <button
          type="button"
          onClick={onAnalyze}
          disabled={loading}
          className="w-full shrink-0 px-8 py-3 rounded-xl magic-gradient font-display font-bold text-sm disabled:opacity-50 shadow-lg shadow-violet-900/20 sm:w-auto"
        >
          {loading ? 'Scanning…' : 'Analyze'}
        </button>
      </div>

      {error ? (
        <p className="text-sm text-rose-300 font-mono bg-rose-500/10 border border-rose-500/25 rounded-xl px-4 py-3">
          {error}
        </p>
      ) : null}

      {intel && (
        <div className="space-y-8 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="max-w-full break-all px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 font-mono text-xs sm:text-sm">
              {shortWallet(intel.query)}
            </span>
            {intel.bannedGlobally && <Badge tone="danger">Globally banned</Badge>}
            <Badge
              tone={
                intel.accountStatus === 'active'
                  ? 'success'
                  : intel.accountStatus === 'frozen'
                    ? 'warning'
                    : 'danger'
              }
            >
              {intel.accountStatus}
            </Badge>
            {bet?.betsTruncated && (
              <span className="text-amber-300/80 text-xs">Bets capped at {bet.betsCappedAt}</span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatBox label="Player P&L" value={fmtNum(fin?.playerPnL)} hint="withdrawn + balance − deposited" variant="accent" />
            <StatBox label="House P&L" value={fmtNum(fin?.housePnL)} />
            <StatBox label="Betting net" value={fmtNum(a?.summary?.netBettingProfitLoss)} />
            <StatBox label="House edge" value={fmtNum(a?.summary?.houseEdgeFromBets)} variant="success" />
            <StatBox label="Win rate" value={`${((bet?.winRate ?? 0) * 100).toFixed(1)}%`} />
            <StatBox label="Total bets" value={bet?.totalBets ?? 0} />
            <StatBox label="Deposits" value={fin?.depositCount ?? 0} />
            <StatBox
              label="Pending WD"
              value={fin?.pendingWithdrawals ?? 0}
              variant={(fin?.pendingWithdrawals ?? 0) > 0 ? 'warning' : 'default'}
            />
          </div>

          {intel.timeOnPlatform && (
            <Panel className="p-5 border-violet-500/20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-300/70 mb-4">
                Time on platform
              </p>
              <div className="grid sm:grid-cols-3 gap-6 text-sm">
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider">First seen</p>
                  <p className="font-mono text-xs mt-2 text-white/80">
                    {intel.timeOnPlatform.firstSeen
                      ? new Date(intel.timeOnPlatform.firstSeen).toLocaleString()
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider">Last seen</p>
                  <p className="font-mono text-xs mt-2 text-white/80">
                    {intel.timeOnPlatform.lastSeen
                      ? new Date(intel.timeOnPlatform.lastSeen).toLocaleString()
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider">Chains</p>
                  <p className="mt-2 capitalize">{(intel.timeOnPlatform.chains || []).join(', ') || '—'}</p>
                </div>
              </div>
            </Panel>
          )}

          <div className="grid lg:grid-cols-2 gap-5">
            <Panel className="p-5 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">House balances</p>
              {!intel.balances?.length ? (
                <p className="text-sm text-white/40 py-4">No balance rows.</p>
              ) : (
                intel.balances.map((b) => (
                  <div
                    key={`${b.chain}-${b.currency}`}
                    className="flex flex-col gap-1 border-b border-white/5 pb-3 text-sm last:border-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-white/70">
                      {b.chain} · {b.currency}
                    </span>
                    <span className="font-mono text-white/90 break-all sm:text-right">
                      {fmtNum(b.balance)}{' '}
                      <span className="text-white/35 text-xs">wd {fmtNum(b.withdrawableNow)}</span>
                    </span>
                  </div>
                ))
              )}
            </Panel>

            <Panel className="p-5 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Cash flow</p>
              {Object.entries(fin?.totalDepositsByCurrency || {}).map(([c, v]) => (
                <div key={`d-${c}`} className="flex flex-col gap-0.5 text-sm font-mono sm:flex-row sm:justify-between">
                  <span className="text-white/50">Σ deposit {c}</span>
                  <span className="text-emerald-400 break-all sm:text-right">+{fmtNum(v)}</span>
                </div>
              ))}
              {Object.entries(fin?.totalWithdrawalsByCurrency || {}).map(([c, v]) => (
                <div key={`w-${c}`} className="flex flex-col gap-0.5 text-sm font-mono sm:flex-row sm:justify-between">
                  <span className="text-white/50">Σ withdraw {c}</span>
                  <span className="text-rose-400 break-all sm:text-right">−{fmtNum(v)}</span>
                </div>
              ))}
            </Panel>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <LedgerHistoryTable
              title={`Deposits (${deposits.length})`}
              subtitle={
                fin?.totalDeposited != null
                  ? `Total deposited: ${fmtNum(fin.totalDeposited)} across ${fin.depositCount ?? deposits.length} tx`
                  : undefined
              }
              empty="No deposits logged for this wallet."
              cols={['When', 'Chain', 'Amount', 'Net credited', 'TX']}
              rows={deposits.map((d) => {
                const sym = chainSymbol(d.chain);
                const net = octasToNative(d.chain, d.net_credited_octas ?? d.amount_octas);
                return (
                  <TableRow key={d.id}>
                    <td className="px-4 py-2.5 text-xs text-white/50 whitespace-nowrap">
                      {new Date(d.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-xs capitalize">{d.chain}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-emerald-400">
                      +{fmtNum(d.amount_native)} {sym}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">
                      {fmtNum(net)} {sym}
                    </td>
                    <td className="px-4 py-2.5">
                      <TxLink chain={d.chain} hash={d.user_tx_hash} />
                    </td>
                  </TableRow>
                );
              })}
            />

            <LedgerHistoryTable
              title={`Withdrawals (${withdrawals.length})`}
              subtitle={
                fin?.totalWithdrawn != null
                  ? `Completed: ${fmtNum(fin.totalWithdrawn)} · Pending: ${fin.pendingWithdrawals ?? 0}`
                  : undefined
              }
              empty="No withdrawal requests for this wallet."
              cols={['When', 'Chain', 'Gross', 'Net paid', 'Status', 'TX']}
              rows={withdrawals.map((w) => {
                const sym = chainSymbol(w.chain);
                const net = octasToNative(w.chain, w.user_payout_octas);
                const when = w.processed_at || w.created_at;
                return (
                  <TableRow key={w.id}>
                    <td className="px-4 py-2.5 text-xs text-white/50 whitespace-nowrap">
                      {when ? new Date(when).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs capitalize">{w.chain}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-rose-300">
                      −{fmtNum(w.gross_apt)} {sym}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">
                      {w.status === 'completed' || w.status === 'auto' ? (
                        <span className="text-white/80">
                          {fmtNum(net)} {sym}
                        </span>
                      ) : (
                        <span className="text-white/35">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={withdrawalStatusTone(w.status)}>{w.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <TxLink chain={w.chain} hash={w.user_tx_hash} />
                    </td>
                  </TableRow>
                );
              })}
            />
          </div>

          {bet?.byChain && Object.keys(bet.byChain).length > 0 && (
            <Panel className="p-0 overflow-hidden">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-5 pt-5 pb-3">
                Betting by chain
              </p>
              <AdminTable className="border-0 rounded-none">
                <THead cols={['Chain', 'Bets', 'Wagered', 'Payout', 'House net']} />
                <tbody>
                  {Object.entries(bet.byChain).map(([chain, row]) => (
                    <TableRow key={chain}>
                      <td className="px-4 py-3 capitalize">{chain}</td>
                      <td className="px-4 py-3">{row.bets}</td>
                      <td className="px-4 py-3 font-mono">{fmtNum(row.wagered)}</td>
                      <td className="px-4 py-3 font-mono">{fmtNum(row.payout)}</td>
                      <td className="px-4 py-3 font-mono text-emerald-400">{fmtNum(row.net)}</td>
                    </TableRow>
                  ))}
                </tbody>
              </AdminTable>
            </Panel>
          )}

          {onBanPrefill && (
            <button
              type="button"
              onClick={() => onBanPrefill(intel.query)}
              className="text-xs px-4 py-2 rounded-xl border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 transition-colors"
            >
              Open in Danger zone →
            </button>
          )}

          {intel.recentBets?.length > 0 && (
            <Panel className="p-5">
              <details className="group">
                <summary className="text-sm font-semibold cursor-pointer list-none flex items-center justify-between">
                  <span>Recent bets ({intel.recentBets.length})</span>
                  <span className="text-white/30 text-xs group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <AdminTable className="mt-4 max-h-72 overflow-y-auto border-0 bg-transparent">
                  <THead cols={['Time', 'Chain', 'Game', 'Bet', 'Payout', 'Won']} />
                  <tbody>
                    {intel.recentBets.map((b) => (
                      <TableRow key={b.id}>
                        <td className="px-3 py-2 text-xs text-white/50">{new Date(b.created_at).toLocaleString()}</td>
                        <td className="px-3 py-2 text-xs capitalize">{b.chain}</td>
                        <td className="px-3 py-2 text-xs">{b.game}</td>
                        <td className="px-3 py-2 font-mono text-xs">{fmtNum(b.betNative)}</td>
                        <td className="px-3 py-2 font-mono text-xs">{fmtNum(b.payoutNative)}</td>
                        <td className="px-3 py-2">{b.won ? <Badge tone="success">W</Badge> : '—'}</td>
                      </TableRow>
                    ))}
                  </tbody>
                </AdminTable>
              </details>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}
