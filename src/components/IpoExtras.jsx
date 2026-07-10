'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  APTC_LOGO_SRC,
  IPO_APTC_MINT_DEFAULT,
  IPO_SALE,
  resolveIpoSaleState,
} from '@/lib/config/ipo';
import { SolscanLink } from '@/components/ui/SolscanMark';

function copyText(value) {
  return navigator.clipboard.writeText(value).then(
    () => true,
    () => false,
  );
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function splitCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    mins: Math.floor((total % 3600) / 60),
    secs: total % 60,
  };
}

/** Shared live countdown for IPO CTA / panels */
export function useIpoCountdown({ phase: phaseProp, startAt, endAt } = {}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const saleState = resolveIpoSaleState(now);
  const phase = phaseProp || saleState.phase;

  const startIso =
    startAt ||
    (phase === 'live' ? saleState.activeRound?.startAtIso : saleState.nextRound?.startAtIso) ||
    IPO_SALE.startAtIso;
  const endIso =
    endAt ||
    (phase === 'live' ? saleState.activeRound?.endAtIso : saleState.nextRound?.endAtIso) ||
    IPO_SALE.endAtIso;

  const ms =
    phase === 'live'
      ? Math.max(0, Date.parse(endIso) - now)
      : phase === 'upcoming' || phase === 'between_rounds'
        ? Math.max(0, Date.parse(startIso) - now)
        : 0;

  const parts = splitCountdown(ms);

  const compactLabel = useMemo(() => {
    if (phase === 'ended') return 'Sale ended';
    if (phase === 'live') {
      if (parts.days > 0) return `Ends in ${parts.days}d ${pad(parts.hours)}h ${pad(parts.mins)}m`;
      return `Ends in ${pad(parts.hours)}:${pad(parts.mins)}:${pad(parts.secs)}`;
    }
    if (phase === 'between_rounds') {
      if (parts.days > 0) return `Next round in ${parts.days}d ${pad(parts.hours)}h`;
      return `Next round in ${pad(parts.hours)}:${pad(parts.mins)}:${pad(parts.secs)}`;
    }
    if (parts.days > 0) return `Opens in ${parts.days}d ${pad(parts.hours)}h ${pad(parts.mins)}m ${pad(parts.secs)}s`;
    return `Opens in ${pad(parts.hours)}:${pad(parts.mins)}:${pad(parts.secs)}`;
  }, [phase, parts.days, parts.hours, parts.mins, parts.secs]);

  return { phase, parts, ms, compactLabel, startIso, endIso, saleState };
}

function formatLocal(iso) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  try {
    return new Date(t).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return new Date(t).toLocaleString('en-US', { timeZone: 'America/New_York' });
  }
}

/** Live D / H / M / S countdown + local timezone helper */
export function IpoLiveCountdown({
  phase: phaseProp,
  startAt,
  endAt,
  launchLabel,
  endLabel,
  className = '',
}) {
  const { phase, parts, startIso, endIso, saleState } = useIpoCountdown({
    phase: phaseProp,
    startAt,
    endAt,
  });
  const localStart = formatLocal(startIso);
  const localEnd = formatLocal(endIso);
  const label =
    phase === 'upcoming'
      ? 'Starts in'
      : phase === 'live'
        ? 'Ends in'
        : phase === 'between_rounds'
          ? 'Next round in'
          : 'Sale closed';
  const subLabel =
    phase === 'ended'
      ? endLabel || IPO_SALE.endLabel
      : phase === 'live' && saleState?.activeRound
        ? saleState.activeRound.label
        : phase === 'between_rounds' && saleState?.nextRound
          ? saleState.nextRound.label
          : launchLabel || IPO_SALE.launchLabel;

  return (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-950/30 via-[#0c000a] to-[#080008] p-4 md:p-5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-fuchsia-200/70">{label}</p>
        <p className="text-[10px] text-white/35">{subLabel}</p>
      </div>

      {phase === 'ended' ? (
        <p className="text-2xl font-bold text-white/80">Closed</p>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {[
            { k: 'Days', v: parts.days },
            { k: 'Hrs', v: pad(parts.hours) },
            { k: 'Min', v: pad(parts.mins) },
            { k: 'Sec', v: pad(parts.secs) },
          ].map((cell) => (
            <div
              key={cell.k}
              className="rounded-xl border border-white/10 bg-black/35 px-2 py-3 text-center"
            >
              <p className="text-xl sm:text-2xl font-bold tabular-nums text-white leading-none">{cell.v}</p>
              <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">{cell.k}</p>
            </div>
          ))}
        </div>
      )}

      {(localStart || localEnd) && (
        <div className="mt-3 space-y-1 border-t border-white/[0.06] pt-3">
          {localStart ? (
            <p className="text-[11px] text-white/45">
              <span className="text-white/30">Opens (New York) · </span>
              {localStart}
            </p>
          ) : null}
          {localEnd ? (
            <p className="text-[11px] text-white/45">
              <span className="text-white/30">Ends (New York) · </span>
              {localEnd}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

/** Soft buy guidance under the swap card */
export function IpoBuyGuidance({ className = '' }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <p className="text-[11px] text-white/45 leading-relaxed">
        Keep ~0.01 SOL for fees · suggested 0.1–50000 SOL
      </p>
      <p className="text-[10px] text-white/30 leading-relaxed">
        Max fills spendable balance minus a fee buffer so the purchase doesn’t fail.
      </p>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    id: 'rounds',
    q: 'How do the 3 IPO rounds work?',
    a: 'Round 1 (11–14 Jul ET) at 1× ($0.0004), Round 2 (20–23 Jul) at 2×, Round 3 (27–30 Jul) at 3×. Each soft-caps at $25k. After soft cap, buys keep filling at 1.5× / 2.5× / 3.5× until that window ends or 250M sells out. Times are Eastern (New York).',
  },
  {
    id: 'oversub',
    q: 'What is oversubscription?',
    a: 'When a round hits its $25k soft cap, further buys in that window fill at the oversub multiple (1.5× / 2.5× / 3.5×) until the round ends — or until the full 250M APTC inventory is sold.',
  },
  {
    id: 'lock',
    q: 'Can I sell during the 30-day lock?',
    a: 'No. Purchased APTC goes to the staking vault (not your wallet) and stays locked 30 days at 30% APY. After unlock, claim to your wallet — then trade on Raydium.',
  },
  {
    id: 'raydium',
    q: 'When does Raydium listing happen?',
    a: 'After Round 3 closes. Listing targets 5× the IPO base ($0.002). CEX Tier 3 targets 20× ($0.008).',
  },
  {
    id: 'affiliate',
    q: 'When do affiliate rewards pay out?',
    a: `Rewards accrue in APTC on referred buys (3% / 1.5% / 0.5%). Withdrawals open after a ${IPO_SALE.affiliateWithdrawMinDays}-day cliff.`,
  },
  {
    id: 'wallet',
    q: 'Which wallet should I use?',
    a: 'Use any Solana wallet to deposit SOL. APTC locks in the vault under that wallet’s address — connect the same wallet to see My position, unlock time, and history.',
  },
];

export function IpoFaq({ className = '' }) {
  const [open, setOpen] = useState(FAQ_ITEMS[0].id);

  return (
    <div className={className}>
      <p className="text-sm text-white/55 mb-3">Quick answers before you buy.</p>
      <ul className="space-y-2">
        {FAQ_ITEMS.map((item) => {
          const isOpen = open === item.id;
          return (
            <li key={item.id} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : item.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left"
              >
                <span className="text-sm font-medium text-white/85">{item.q}</span>
                <span className="text-white/35 text-xs shrink-0">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen ? (
                <p className="px-3.5 pb-3 text-[12px] leading-relaxed text-white/50 border-t border-white/[0.05] pt-2">
                  {item.a}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Copy mint + Solscan link for adding APTC to wallet */
export function IpoAddToken({ mint, className = '' }) {
  const [copied, setCopied] = useState(false);
  const tokenMint = mint || process.env.NEXT_PUBLIC_APTC_SOLANA_MINT?.trim() || IPO_APTC_MINT_DEFAULT;

  const onCopy = useCallback(async () => {
    const ok = await copyText(tokenMint);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }, [tokenMint]);

  return (
    <div className={`rounded-xl border border-white/10 bg-white/[0.03] p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={APTC_LOGO_SRC} alt="" className="h-7 w-7 rounded-lg object-cover ring-1 ring-white/10" />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Add APTC to wallet</p>
          <p className="text-[11px] text-white/45">
            Copy the mint, then search it in your wallet → Tokens to import.
          </p>
        </div>
      </div>
      <p className="font-mono text-[11px] text-white/55 break-all mb-3">{tokenMint}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCopy}
          className="rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/75 hover:text-white"
        >
          {copied ? 'Copied mint' : 'Copy mint'}
        </button>
        <SolscanLink
          href={`https://solscan.io/token/${tokenMint}`}
          size={13}
          className="rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/75 hover:text-white"
        />
      </div>
    </div>
  );
}

/** Share “I bought X APTC” to X / Telegram / clipboard */
export function IpoSharePurchase({ aptcAmount, solAmount, className = '' }) {
  const [copied, setCopied] = useState(false);
  const amount = Number(aptcAmount);
  const sol = Number(solAmount);
  const hasBuy = Number.isFinite(amount) && amount > 0;
  const ipoUrl = 'https://aptcasino.fun/ipo';

  // Body only — link goes in X `url` param so newlines stay as real line breaks
  const body = useMemo(() => {
    if (!hasBuy) {
      return [
        'yo $APTC IPO on @aptcasinofun is actually live',
        '',
        'fixed price SOL → APTC, no bonding curve games',
        '3 rounds · $25k soft · oversub fills rest',
        'Raydium after Round 3',
        '',
        "not gatekeeping ↓",
      ].join('\n');
    }
    const aptcStr = amount.toLocaleString(undefined, { maximumFractionDigits: 0 });
    const solStr =
      Number.isFinite(sol) && sol > 0
        ? `${sol.toLocaleString(undefined, { maximumFractionDigits: 3 })} SOL → ${aptcStr} $APTC`
        : `${aptcStr} $APTC secured`;
    return [
      'aped into the $APTC IPO on @aptcasinofun',
      '',
      solStr,
      'locked 30d earning 30% APY while we wait for Raydium',
      '',
      'lfg ↓',
    ].join('\n');
  }, [amount, sol, hasBuy]);

  const fullText = `${body}\n${ipoUrl}`;

  // Same pattern as referral share: text + separate url (newlines → %0A)
  const tweetHref = `https://x.com/intent/post?text=${encodeURIComponent(body)}&url=${encodeURIComponent(ipoUrl)}`;
  const tgHref = `https://t.me/share/url?url=${encodeURIComponent(ipoUrl)}&text=${encodeURIComponent(body)}`;

  const onCopy = useCallback(async () => {
    const ok = await copyText(fullText);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }, [fullText]);

  return (
    <div className={`rounded-xl border border-white/10 bg-white/[0.03] p-4 ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 mb-2">Share</p>
      <p className="text-[12px] text-white/50 leading-relaxed mb-3 whitespace-pre-line">{fullText}</p>
      <div className="flex flex-wrap gap-2">
        <a
          href={tweetHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/75 hover:text-white"
        >
          Post on X
        </a>
        <a
          href={tgHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-100 hover:bg-sky-500/20"
        >
          Telegram
        </a>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-fuchsia-100 hover:bg-fuchsia-500/20"
        >
          {copied ? 'Copied' : 'Copy text'}
        </button>
      </div>
    </div>
  );
}
