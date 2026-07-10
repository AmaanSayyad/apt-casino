'use client';

import { explorerAddressUrl, solanaExplorerAddressUrl } from '@/lib/chains/explorer';
import { SolscanMark } from '@/components/ui/SolscanMark';

export function fmtNum(n, maxFrac = 4) {
  if (n === undefined || n === null || !Number.isFinite(n)) return '—';
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}

/** Bynomo-style dwell time (7-day session sample). */
export function fmtAvgSession(seconds, sampleCount) {
  if (!sampleCount || !Number.isFinite(seconds) || seconds <= 0) return '—';
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function shortWallet(w) {
  if (!w) return '—';
  const s = String(w);
  return s.length > 14 ? `${s.slice(0, 8)}…${s.slice(-4)}` : s;
}

/** Guess chain from address shape when API omits chain (Aptos = 0x…, else Solana base58). */
export function inferChainFromAddress(wallet) {
  const w = String(wallet || '').trim();
  if (w.startsWith('0x')) return 'aptos';
  return 'solana';
}

/** Truncated wallet label linking to chain explorer (Solana → solscan.io). */
export function WalletExplorerLink({ wallet, chain, className = '' }) {
  if (!wallet) return <span className={className}>—</span>;
  const chainId = String(chain || inferChainFromAddress(wallet)).toLowerCase();
  const href =
    chainId === 'solana'
      ? solanaExplorerAddressUrl(wallet)
      : explorerAddressUrl(chainId, wallet);
  const label = shortWallet(wallet);

  if (!href) {
    return <span className={className}>{label}</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={String(wallet)}
      className={`inline-flex items-center gap-1 text-cyan-400/90 hover:text-cyan-300 hover:underline underline-offset-2 transition-colors ${className}`}
    >
      {chainId === 'solana' ? <SolscanMark size={12} /> : null}
      {label}
    </a>
  );
}

const STAT_VARIANTS = {
  default: 'from-[#1f0018] to-[#120010] border-white/10',
  accent: 'from-violet-950/80 to-[#120010] border-violet-500/25',
  success: 'from-emerald-950/40 to-[#120010] border-emerald-500/20',
  warning: 'from-amber-950/40 to-[#120010] border-amber-500/20',
  danger: 'from-rose-950/40 to-[#120010] border-rose-500/20',
};

export function StatBox({ label, value, hint, variant = 'default', icon }) {
  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-4 transition-all hover:border-white/25 hover:shadow-lg hover:shadow-purple-900/10 ${STAT_VARIANTS[variant] || STAT_VARIANTS.default}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/45">{label}</p>
        {icon ? <span className="text-white/25 text-sm">{icon}</span> : null}
      </div>
      <p className="mt-2 text-2xl font-display font-bold text-white tabular-nums tracking-tight">{value}</p>
      {hint ? <p className="mt-1.5 text-[11px] leading-snug text-white/40">{hint}</p> : null}
    </div>
  );
}

export function SectionHeading({ title, description, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h2 className="text-lg font-display font-semibold text-white">{title}</h2>
        {description ? <p className="text-sm text-white/45 mt-1 max-w-2xl">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Panel({ children, className = '', variant = 'default' }) {
  const borders =
    variant === 'danger'
      ? 'border-rose-500/30 bg-gradient-to-br from-rose-950/30 to-[#0e000c]'
      : variant === 'warning'
        ? 'border-amber-500/25 bg-gradient-to-br from-amber-950/20 to-[#0e000c]'
        : 'border-white/10 bg-[#0e000c]/90';
  return (
    <div className={`rounded-2xl border backdrop-blur-sm ${borders} ${className}`}>{children}</div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center">
      <p className="text-sm font-medium text-white/70">{title}</p>
      {description ? <p className="mt-2 text-xs text-white/40 max-w-md mx-auto">{description}</p> : null}
    </div>
  );
}

export function Badge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-white/5 border-white/15 text-white/70',
    success: 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300',
    warning: 'bg-amber-500/10 border-amber-400/30 text-amber-300',
    danger: 'bg-rose-500/10 border-rose-400/30 text-rose-300',
    accent: 'bg-violet-500/10 border-violet-400/30 text-violet-300',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${tones[tone] || tones.neutral}`}
    >
      {children}
    </span>
  );
}

export function TabBtn({ active, onClick, children, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
        active
          ? 'bg-gradient-to-r from-violet-600/35 to-fuchsia-600/25 border border-violet-400/40 text-white shadow-md shadow-violet-900/20'
          : 'border border-transparent text-white/50 hover:text-white hover:bg-white/5 hover:border-white/10'
      }`}
    >
      {children}
      {badge != null && badge > 0 ? (
        <span className="min-w-[1.125rem] h-[1.125rem] px-1 flex items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </button>
  );
}

export function TabNav({ groups, activeTab, onSelect }) {
  return (
    <nav className="space-y-4">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 px-1 mb-2">{g.label}</p>
          <div className="flex flex-wrap gap-1.5 lg:flex-col lg:gap-1">
            {g.tabs.map((t) => (
              <TabBtn
                key={t.id}
                active={activeTab === t.id}
                onClick={() => onSelect(t.id)}
                badge={t.badge}
              >
                {t.label}
              </TabBtn>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AdminTable({ children, className = '', stickyHeader }) {
  return (
    <div
      className={`max-w-full overflow-x-auto rounded-2xl border border-white/10 bg-black/20 shadow-inner shadow-black/40 ${className}`}
    >
      <table className={`w-full min-w-0 sm:min-w-[640px] text-sm text-left ${stickyHeader ? '[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10' : ''}`}>
        {children}
      </table>
    </div>
  );
}

function normalizeHeadCol(col) {
  if (typeof col === 'string') return { key: col, label: col, sortable: false };
  return { key: col.key ?? col.label, label: col.label, sortable: Boolean(col.sortable) };
}

export function THead({ cols, sortKey, sortDir, onSort }) {
  const normalized = cols.map(normalizeHeadCol);

  return (
    <thead className="bg-[#1a0015]/95 backdrop-blur-md text-[10px] uppercase tracking-widest text-white/45 border-b border-white/10">
      <tr>
        {normalized.map((col) => {
          const active = sortKey === col.key;
          const sortable = col.sortable && onSort;

          return (
            <th key={col.key} className="px-4 py-3.5 font-semibold whitespace-nowrap">
              {sortable ? (
                <button
                  type="button"
                  onClick={() => onSort(col.key)}
                  className={`inline-flex items-center gap-1.5 transition-colors hover:text-white/80 ${
                    active ? 'text-violet-300' : ''
                  }`}
                >
                  {col.label}
                  <span className="text-[9px] tabular-nums" aria-hidden>
                    {active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                  </span>
                </button>
              ) : (
                col.label
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

export function TableRow({ children, onClick }) {
  return (
    <tr
      onClick={onClick}
      className={`border-t border-white/[0.06] transition-colors hover:bg-white/[0.03] ${onClick ? 'cursor-pointer' : ''}`}
    >
      {children}
    </tr>
  );
}

export function NetworkEconomicsTable({ rows, title, subtitle }) {
  const entries = rows ? Object.entries(rows) : [];
  if (entries.length === 0) {
    return (
      <EmptyState
        title="No chain economics yet"
        description="House P&L by chain appears after play events are logged to Supabase."
      />
    );
  }
  const sorted = entries.sort((a, b) => Math.abs(b[1].platformPnL) - Math.abs(a[1].platformPnL));
  return (
    <Panel className="overflow-hidden p-0">
      <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-violet-950/30 to-transparent">
        <p className="text-[10px] font-bold uppercase tracking-widest text-violet-300/80">{title}</p>
        <p className="text-xs text-white/40 mt-1">
          {subtitle ??
            'Σ(bet − gross return) per chain from game_play_events. Positive = house kept edge on settled play.'}
        </p>
      </div>
      <AdminTable className="border-0 rounded-none">
        <THead cols={['Chain', 'Token', 'Wagered', 'Returned', 'House P&L', 'Edge %', 'Rounds']} />
        <tbody>
          {sorted.map(([chain, row]) => {
            const edgePct = row.volume > 0 ? (row.platformPnL / row.volume) * 100 : 0;
            return (
              <TableRow key={chain}>
                <td className="px-4 py-3 capitalize font-medium text-white/90">{chain}</td>
                <td className="px-4 py-3 text-white/50">{row.currency}</td>
                <td className="px-4 py-3 text-right tabular-nums font-mono text-sm">
                  {fmtNum(row.volume, 4)} <span className="text-white/35">{row.currency}</span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-mono text-sm">
                  {fmtNum(row.payout, 4)} <span className="text-white/35">{row.currency}</span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-mono text-sm font-semibold">
                  <span className={row.platformPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {row.platformPnL >= 0 ? '+' : ''}
                    {fmtNum(row.platformPnL, 4)}
                  </span>{' '}
                  <span className="text-white/35">{row.currency}</span>
                </td>
                <td
                  className={`px-4 py-3 text-right tabular-nums font-mono text-sm ${
                    edgePct >= 0 ? 'text-emerald-400/90' : 'text-rose-400/90'
                  }`}
                >
                  {fmtNum(edgePct, 2)}%
                </td>
                <td className="px-4 py-3 text-right text-white/70">{row.bets}</td>
              </TableRow>
            );
          })}
        </tbody>
      </AdminTable>
    </Panel>
  );
}

export function TreasuryFlowTable({ rows, title }) {
  const entries = rows ? Object.entries(rows) : [];
  if (entries.length === 0) {
    return (
      <EmptyState
        title="No treasury flows yet"
        description="Deposit and withdrawal totals appear after the first on-chain transfers are logged."
      />
    );
  }
  const sorted = entries.sort((a, b) => b[1].netFlow - a[1].netFlow);
  return (
    <Panel className="overflow-hidden p-0">
      <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-950/25 to-transparent">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300/80">{title}</p>
        <p className="text-xs text-white/40 mt-1">
          Gross deposits minus completed withdrawals — float in house custody, not the same as play P&L.
        </p>
      </div>
      <AdminTable className="border-0 rounded-none">
        <THead cols={['Chain', 'Token', 'Deposits in', 'Withdrawals out', 'Net float', 'Counts']} />
        <tbody>
          {sorted.map(([chain, row]) => (
            <TableRow key={chain}>
              <td className="px-4 py-3 capitalize font-medium text-white/90">{chain}</td>
              <td className="px-4 py-3 text-white/50">{row.currency}</td>
              <td className="px-4 py-3 text-right tabular-nums font-mono text-sm text-emerald-300/90">
                {fmtNum(row.depositsGross, 4)} {row.currency}
              </td>
              <td className="px-4 py-3 text-right tabular-nums font-mono text-sm text-amber-200/90">
                {fmtNum(row.withdrawalsGross, 4)} {row.currency}
              </td>
              <td className="px-4 py-3 text-right tabular-nums font-mono text-sm font-semibold">
                <span className={row.netFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {row.netFlow >= 0 ? '+' : ''}
                  {fmtNum(row.netFlow, 4)}
                </span>{' '}
                <span className="text-white/35">{row.currency}</span>
              </td>
              <td className="px-4 py-3 text-right text-xs text-white/50">
                {row.depositCount} dep · {row.withdrawalCount} wd
              </td>
            </TableRow>
          ))}
        </tbody>
      </AdminTable>
    </Panel>
  );
}

export function ChainPills({ options, value, onChange }) {
  return (
    <div className="inline-flex p-1 rounded-xl bg-black/40 border border-white/10 gap-0.5">
      {options.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`text-xs px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
            value === c
              ? 'bg-violet-500/35 text-white shadow-sm'
              : 'text-white/45 hover:text-white/80'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder, className = '' }) {
  return (
    <div className={`relative max-w-md w-full ${className}`}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs pointer-events-none">
        ⌕
      </span>
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-black/40 pl-9 pr-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-shadow"
      />
    </div>
  );
}
