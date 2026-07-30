'use client';

import { useCallback, useState } from 'react';
import { ArrowLeftRight, Wallet, Lock, ChartCandlestick } from 'lucide-react';
import {
  APTC_LOGO_SRC,
  IPO_SALE,
  getIpoAptcDistributor,
  getIpoSolTreasury,
  getIpoStakingVault,
} from '@/lib/config/ipo';

import { SolscanLink, SolscanMark, SOLSCAN_LOGO_SRC } from '@/components/ui/SolscanMark';

const SOLSCAN_TX = 'https://solscan.io/tx/';
const SOLSCAN_ACCOUNT = 'https://solscan.io/account/';
const SOLSCAN_TOKEN = 'https://solscan.io/token/';

export { SOLSCAN_LOGO_SRC };

function shortAddr(addr, head = 6, tail = 6) {
  if (!addr || addr.length < head + tail + 2) return addr || '—';
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function CopyButton({ value, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    if (!value) return;
    const ok = await copyText(value);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }, [value]);

  return (
    <button
      type="button"
      onClick={onCopy}
      disabled={!value}
      className="rounded-lg border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70 hover:text-white hover:border-white/25 disabled:opacity-40 transition-colors"
    >
      {copied ? 'Copied' : label}
    </button>
  );
}

/** Always-visible 4-step journey — no nested accordion */
export function IpoWhatHappensNext({
  lockDays = IPO_SALE.stakingLockDays,
  apyPct = IPO_SALE.stakingApyPct,
  className = '',
  bare = false,
}) {
  const steps = [
    {
      id: 'buy',
      Icon: ArrowLeftRight,
      title: 'Buy APTC with SOL',
      body: 'Deposit SOL. Collector receives it; distributor funds your lock.',
      tone: 'from-fuchsia-500/20 to-fuchsia-500/5 border-fuchsia-400/25 text-fuchsia-100',
    },
    {
      id: 'vault',
      Icon: Lock,
      title: 'Locked in staking vault',
      body: 'APTC goes to the vault — not your wallet. Position is attributed to you.',
      tone: 'from-violet-500/20 to-violet-500/5 border-violet-400/25 text-violet-100',
    },
    {
      id: 'stake',
      Icon: Wallet,
      title: `${lockDays}d @ ${apyPct}% · My position`,
      body: 'Track unlock date and rewards under My position while tokens stay locked.',
      tone: 'from-amber-500/20 to-amber-500/5 border-amber-400/25 text-amber-100',
    },
    {
      id: 'raydium',
      Icon: ChartCandlestick,
      title: 'Unlock → trade on Raydium',
      body: 'After the lock, claim to your wallet — then trade on Raydium / Jupiter.',
      tone: 'from-emerald-500/20 to-emerald-500/5 border-emerald-400/25 text-emerald-100',
    },
  ];

  return (
    <div className={className}>
      {!bare ? (
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40 mb-3">How it works</p>
      ) : (
        <div className="mb-4">
          <p className="text-base font-semibold text-white">From deposit to Raydium</p>
          <p className="mt-1 text-[12px] text-white/45 leading-relaxed">
            Four steps. You sign once — APTC locks in the vault, then unlocks to trade after IPO.
          </p>
        </div>
      )}

      {/* Desktop: horizontal flow */}
      <ol className="hidden md:grid md:grid-cols-4 gap-0 relative">
        <span
          className="pointer-events-none absolute left-[12%] right-[12%] top-[22px] h-px bg-gradient-to-r from-fuchsia-400/40 via-amber-400/25 to-emerald-400/40"
          aria-hidden
        />
        {steps.map((step, i) => {
          const Icon = step.Icon;
          return (
            <li key={step.id} className="relative flex flex-col items-center text-center px-2">
              <span
                className={`relative z-[1] mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border bg-gradient-to-b ${step.tone}`}
              >
                <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35 mb-1">
                Step {i + 1}
              </p>
              <p className="text-sm font-semibold text-white leading-snug mb-1.5">{step.title}</p>
              <p className="text-[11px] leading-relaxed text-white/45">{step.body}</p>
            </li>
          );
        })}
      </ol>

      {/* Mobile: stacked journey with connector */}
      <ol className="md:hidden relative space-y-0 pl-1">
        <span
          className="pointer-events-none absolute left-[21px] top-5 bottom-5 w-px bg-gradient-to-b from-fuchsia-400/45 via-amber-400/25 to-emerald-400/40"
          aria-hidden
        />
        {steps.map((step, i) => {
          const Icon = step.Icon;
          return (
            <li key={step.id} className="relative flex gap-3 pb-4 last:pb-0">
              <span
                className={`relative z-[1] mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border bg-gradient-to-b ${step.tone}`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0 pt-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
                  Step {i + 1}
                </p>
                <p className="text-sm font-semibold text-white leading-snug mt-0.5">{step.title}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-white/45">{step.body}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-4 text-[11px] text-white/35 leading-relaxed border-t border-white/[0.06] pt-3">
        Non-custodial · verify wallets on Solscan before you send · never send SOL to the APTC distributor
      </p>
    </div>
  );
}


/** Read-only SOL collector + APTC distributor for Solscan verification */
export function IpoVerifyWallets({
  treasury,
  distributor,
  stakingVault,
  mint,
  className = '',
  bare = false,
}) {
  const solCollector = treasury || getIpoSolTreasury() || '';
  const aptcDist = distributor || getIpoAptcDistributor() || '';
  const vault = stakingVault || getIpoStakingVault() || '';
  const aptcMint = mint || process.env.NEXT_PUBLIC_APTC_SOLANA_MINT?.trim() || '';

  const rows = [
    {
      id: 'sol',
      label: 'SOL collector',
      hint: 'Receive-only — buyers send SOL here',
      value: solCollector,
      href: solCollector ? `${SOLSCAN_ACCOUNT}${solCollector}` : null,
    },
    {
      id: 'aptc',
      label: 'APTC distributor',
      hint: 'Signs the lock transfer after deposit verifies',
      value: aptcDist,
      href: aptcDist ? `${SOLSCAN_ACCOUNT}${aptcDist}` : null,
    },
    {
      id: 'vault',
      label: 'Staking vault',
      hint: 'Where your IPO APTC is locked (not your wallet)',
      value: vault,
      href: vault ? `${SOLSCAN_ACCOUNT}${vault}` : null,
    },
    {
      id: 'mint',
      label: 'APTC mint',
      hint: 'Token mint — claim to wallet after unlock',
      value: aptcMint,
      href: aptcMint ? `${SOLSCAN_TOKEN}${aptcMint}` : null,
      logo: APTC_LOGO_SRC,
    },
  ].filter((row) => Boolean(row.value));

  if (!rows.length) {
    return (
      <div className={className}>
        {!bare ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40 mb-1">
            Verify before you send
          </p>
        ) : null}
        <p className="text-[11px] text-white/45 leading-relaxed">
          IPO wallets and mint are not published. Addresses appear here only when configured.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {!bare ? (
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40 mb-1">
          Verify before you send
        </p>
      ) : null}
      <p className="text-[11px] text-white/40 mb-3 leading-relaxed inline-flex flex-wrap items-center gap-1.5">
        <span>Check these addresses on</span>
        <span className="inline-flex items-center gap-1 text-white/55">
          <SolscanMark size={14} />
          Solscan
        </span>
        <span>. Never send SOL to the APTC distributor.</span>
      </p>
      <ul className="space-y-2.5">
        {rows.map((row) => (
          <li
            key={row.id}
            className="rounded-lg border border-white/[0.08] bg-black/20 px-3 py-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 min-w-0">
                {row.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.logo} alt="" className="h-5 w-5 rounded object-cover" />
                ) : null}
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-white/80">{row.label}</p>
                  <p className="text-[10px] text-white/35">{row.hint}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <CopyButton value={row.value} />
                <SolscanLink
                  href={row.href}
                  size={13}
                  className="rounded-lg border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70 hover:text-white hover:border-white/25"
                />
              </div>
            </div>
            <p className="font-mono text-[11px] text-white/55 break-all">{row.value}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One-click IPO referral link for the connected wallet */
export function IpoReferralShare({ wallet, className = '', bare = false }) {
  const [copied, setCopied] = useState(false);
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://aptcasino.fun';
  const link = wallet ? `${origin}/ipo?ref=${wallet}` : '';

  const onCopy = useCallback(async () => {
    if (!link) return;
    const ok = await copyText(link);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }, [link]);

  const shell = bare
    ? className
    : `rounded-xl border border-violet-400/20 bg-violet-500/[0.06] p-4 ${className}`;

  if (!wallet) {
    return (
      <div className={bare ? className : `rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-4 ${className}`}>
        {!bare ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">
            Your referral link
          </p>
        ) : null}
        <p className="text-xs text-white/45">Connect your wallet to copy your personal IPO referral link.</p>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        {!bare ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200/80">
            Your referral link
          </p>
        ) : (
          <p className="text-xs text-white/50">Share this link to earn L1–L3 APTC</p>
        )}
        <button
          type="button"
          onClick={onCopy}
          className="rounded-full border border-violet-400/35 bg-violet-500/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-100 hover:bg-violet-500/25 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
      <p className="font-mono text-[11px] text-white/55 break-all leading-relaxed">{link}</p>
      <p className="text-[10px] text-white/35 mt-2">
        Earn L1–L3 APTC on referred buys · payout after {IPO_SALE.affiliateWithdrawMinDays}-day cliff
      </p>
    </div>
  );
}

function statusLabel(status) {
  if (status === 'fulfilled') return { text: 'Fulfilled', className: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10' };
  if (status === 'pending_supply') return { text: 'Queued', className: 'text-amber-200 border-amber-400/30 bg-amber-500/10' };
  if (status === 'pending') return { text: 'Settling', className: 'text-sky-200 border-sky-400/30 bg-sky-500/10' };
  return { text: status || '—', className: 'text-white/50 border-white/15 bg-white/5' };
}

function fmtAmt(n, digits = 4) {
  if (!Number.isFinite(Number(n))) return '—';
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: digits });
}

/** Purchase rows with Solscan tx links */
export function IpoPurchaseHistory({ purchases = [], className = '' }) {
  if (!purchases?.length) return null;

  return (
    <div className={`rounded-xl border border-white/10 overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.03]">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
          Purchase history
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[520px]">
          <thead className="text-[10px] uppercase tracking-wider text-white/35">
            <tr>
              <th className="px-4 py-2.5 font-medium">When</th>
              <th className="px-4 py-2.5 font-medium">SOL</th>
              <th className="px-4 py-2.5 font-medium">APTC</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Tx</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {purchases.map((p) => {
              const st = statusLabel(p.status);
              return (
                <tr key={p.id} className="text-white/75">
                  <td className="px-4 py-2.5 text-xs text-white/50 whitespace-nowrap">
                    {p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-xs">{fmtAmt(p.solAmount, 4)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-xs">{fmtAmt(p.aptcAmount, 2)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${st.className}`}>
                      {st.text}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex flex-wrap justify-end gap-1.5">
                      {p.solTxHash ? (
                        <SolscanLink
                          href={`${SOLSCAN_TX}${p.solTxHash}`}
                          size={12}
                          title={p.solTxHash}
                          className="text-[10px] font-semibold text-fuchsia-300/90 hover:text-fuchsia-200"
                        >
                          SOL {shortAddr(p.solTxHash, 4, 4)}
                        </SolscanLink>
                      ) : null}
                      {p.aptcTxHash ? (
                        <SolscanLink
                          href={`${SOLSCAN_TX}${p.aptcTxHash}`}
                          size={12}
                          title={p.aptcTxHash}
                          className="text-[10px] font-semibold text-emerald-300/90 hover:text-emerald-200"
                        >
                          APTC {shortAddr(p.aptcTxHash, 4, 4)}
                        </SolscanLink>
                      ) : null}
                      {!p.solTxHash && !p.aptcTxHash ? (
                        <span className="text-[10px] text-white/30">—</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
