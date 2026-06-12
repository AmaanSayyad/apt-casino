'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePlayWallet } from '@/hooks/usePlayWallet';
import ChainConnectModal from '@/components/wallet/ChainConnectModal';
import {
  FaCopy,
  FaCheck,
  FaTwitter,
  FaTelegram,
  FaWhatsapp,
  FaFacebookF,
  FaLinkedin,
  FaReddit,
  FaDiscord,
  FaEnvelope,
  FaTrophy,
  FaGift,
  FaShareAlt,
  FaLink,
  FaCalculator,
  FaCheckCircle,
  FaClock,
  FaUserPlus,
} from 'react-icons/fa';
import PageShell, { PageCard, SectionHeading } from '@/components/layout/PageShell';
import ReferralLinkCard from '@/components/referral/ReferralLinkCard';
import { buildReferralShortLink, getPublicShareOrigin } from '@/lib/siteMetadata';
import { getReferralBroadcastMessage } from '@/lib/referral/shareMessage';
import {
  APT_CASINO_DISCORD_INVITE,
  buildReferralShareChannels,
  getLinkedInShareUrl,
  getReferralLinkedInPost,
  getReferralLinkForPreview,
  getReferralTweetText,
} from '@/lib/referral/shareIntents';
import { referralChainForWallet } from '@/lib/referral/walletChain';

function short(addr) {
  if (!addr) return '—';
  const s = String(addr);
  return s.length > 14 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
}

function fmtDate(input) {
  if (!input) return '—';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

function ordinal(n) {
  if (n === null || n === undefined) return '—';
  const v = Math.abs(n) % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (v % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function fmtApt(apt) {
  const n = Number(apt);
  if (!Number.isFinite(n)) return '0';
  if (n === 0) return '0';
  if (n > 0 && n < 0.0001) return n.toExponential(2);
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

const HOW_IT_WORKS = [
  { icon: <FaShareAlt className="text-blue-magic" />, title: 'Share your link', body: 'Copy the hype message or blast it on X / TG / WA — ref saves automatically when they land.' },
  { icon: <FaUserPlus className="text-emerald-300" />, title: 'Friend deposits', body: 'When they make a first deposit, you accrue APTC worth 20% of that deposit (not native APT).' },
  { icon: <FaGift className="text-pink-300" />, title: 'Unlock & claim', body: 'Rewards unlock after the cliff or when your referee hits the volume milestone.' },
];

export default function ReferralsPage() {
  const { connected, address, chain } = usePlayWallet();
  const [connectOpen, setConnectOpen] = useState(false);

  const [code, setCode] = useState(null);
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [totalValid, setTotalValid] = useState(0);
  const [totalInvites, setTotalInvites] = useState(0);
  const [config, setConfig] = useState(null);
  const [loadingCode, setLoadingCode] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [copied, setCopied] = useState(null);
  const [error, setError] = useState(null);
  const [customName, setCustomName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState(null);
  const [nameSaved, setNameSaved] = useState(false);

  const [calcReferrals, setCalcReferrals] = useState('10');
  const [calcAvgDeposit, setCalcAvgDeposit] = useState('5');

  const publicOrigin = getPublicShareOrigin();
  const referralChain = useMemo(
    () => referralChainForWallet(address, chain),
    [address, chain],
  );

  const referralLinkShort = useMemo(
    () => (code ? buildReferralShortLink(code) : ''),
    [code],
  );
  const referralLinkPreview = useMemo(
    () => getReferralLinkForPreview(referralLinkShort),
    [referralLinkShort],
  );
  const referralLinkQuery = useMemo(
    () => (code ? `${publicOrigin}/?ref=${code}` : ''),
    [code, publicOrigin],
  );

  const refreshLeaderboard = useCallback(async () => {
    setLoadingBoard(true);
    try {
      const r = await fetch('/api/referrals/leaderboard?limit=50');
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        setLeaderboard(j.entries || []);
        setTotalValid(Number(j.totalValidReferrals || 0));
        setTotalInvites(Number(j.totalInvites || 0));
      } else {
        setLeaderboard([]);
      }
    } catch {
      setLeaderboard([]);
    } finally {
      setLoadingBoard(false);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    if (!address) {
      setStats(null);
      return;
    }
    setLoadingStats(true);
    try {
      const qs = `wallet=${encodeURIComponent(address)}&chain=${encodeURIComponent(referralChain)}`;
      const r = await fetch(`/api/referrals/stats?${qs}`);
      const j = await r.json().catch(() => ({}));
      if (r.ok) setStats(j);
      else setStats(null);
    } catch {
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, [address, referralChain]);

  const refreshConfig = useCallback(async () => {
    try {
      const r = await fetch('/api/referrals/config');
      const j = await r.json();
      if (r.ok) setConfig(j);
    } catch {
      /* ignore */
    }
  }, []);

  const ensureCode = useCallback(async () => {
    if (!address) return;
    setLoadingCode(true);
    setError(null);
    try {
      const qs = `wallet=${encodeURIComponent(address)}&chain=${encodeURIComponent(referralChain)}`;
      const r = await fetch(`/api/referrals/code?${qs}`);
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.code) {
        setCode(j.code);
      } else {
        setError(j.error || 'Could not load or generate your referral code.');
      }
    } catch {
      setError('Network error while loading your referral code.');
    } finally {
      setLoadingCode(false);
    }
  }, [address, referralChain]);

  useEffect(() => {
    void refreshConfig();
    void refreshLeaderboard();
    const id = setInterval(refreshLeaderboard, 60_000);
    return () => clearInterval(id);
  }, [refreshLeaderboard, refreshConfig]);

  useEffect(() => {
    void refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    if (connected && address) {
      void ensureCode();
    } else {
      setCode(null);
      setCustomName('');
    }
  }, [connected, address, ensureCode]);

  useEffect(() => {
    if (code) setCustomName(code);
  }, [code]);

  const saveCustomName = useCallback(async () => {
    if (!address || !customName.trim()) return;
    setSavingName(true);
    setNameError(null);
    setNameSaved(false);
    try {
      const r = await fetch('/api/referrals/code', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: address,
          chain: referralChain,
          name: customName.trim(),
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setNameError(j.error || 'Could not update referral name.');
        return;
      }
      if (j.code) {
        setCode(j.code);
        setCustomName(j.code);
        setNameSaved(true);
        setTimeout(() => setNameSaved(false), 2500);
      }
    } catch {
      setNameError('Network error while saving referral name.');
    } finally {
      setSavingName(false);
    }
  }, [address, customName, referralChain]);

  const broadcastMessage = useMemo(
    () => getReferralBroadcastMessage(referralLinkShort),
    [referralLinkShort],
  );

  const handleCopy = useCallback(
    async (which) => {
      let value = which === 'query' ? referralLinkQuery : referralLinkShort;
      if (which === 'message') value = broadcastMessage;
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        setCopied(which);
        setTimeout(() => setCopied(null), 1800);
      } catch {
        /* ignore */
      }
    },
    [referralLinkQuery, referralLinkShort, broadcastMessage],
  );

  const tweetIntent = useMemo(() => {
    if (!referralLinkShort) return null;
    const text = encodeURIComponent(getReferralTweetText());
    const url = encodeURIComponent(referralLinkShort);
    return `https://x.com/intent/post?text=${text}&url=${url}`;
  }, [referralLinkShort]);

  const shareChannels = useMemo(
    () =>
      buildReferralShareChannels({
        referralLink: referralLinkShort,
        tweetIntent,
      }),
    [referralLinkShort, tweetIntent],
  );

  const handleDiscordShare = useCallback(async () => {
    if (!broadcastMessage) return;
    try {
      await navigator.clipboard.writeText(broadcastMessage);
      setCopied('discord');
      setTimeout(() => setCopied(null), 1800);
      window.open(APT_CASINO_DISCORD_INVITE, '_blank', 'noopener,noreferrer');
    } catch {
      /* ignore */
    }
  }, [broadcastMessage]);

  const handleLinkedInShare = useCallback(async () => {
    const preview = referralLinkPreview || referralLinkShort;
    if (!preview) return;
    const linkedInUrl = getLinkedInShareUrl(preview);
    if (!linkedInUrl) return;
    try {
      await navigator.clipboard.writeText(getReferralLinkedInPost(preview));
      setCopied('linkedin');
      setTimeout(() => setCopied(null), 1800);
      window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
    } catch {
      window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
    }
  }, [referralLinkPreview, referralLinkShort]);

  const calcReferralsN = Math.max(0, Number(calcReferrals) || 0);
  const calcAvgDepositN = Math.max(0, Number(calcAvgDeposit) || 0);
  const referrerSharePct = config?.referrerSharePct ?? 20;
  const depositFeePct = config?.depositFeePct ?? 10;
  const usdPerReferral = (calcAvgDepositN * referrerSharePct) / 100;
  const aptcPrice = config?.aptcPriceUsd ?? 0.001;
  const earningsPerReferralAptc = aptcPrice > 0 ? usdPerReferral / aptcPrice : 0;
  const totalEarningsAptc = earningsPerReferralAptc * calcReferralsN;
  const cliffDays = config?.cliffDays ?? 14;
  const volumeUnlock = config?.refereeVolumeUnlockUsd ?? 100;

  return (
    <PageShell
      badge="Earn APTC"
      title="Referrals"
      description="Share your link. When a friend connects and makes their first deposit, you earn 20% of that deposit in APTC — locked for a cliff period or until they hit the volume milestone."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Referrals' }]}
    >
      <section className="mb-10">
        <SectionHeading
          icon={<FaCalculator className="text-cyan-300" />}
          title="Earnings calculator"
          subtitle={
            config
              ? `You earn APTC worth ${referrerSharePct}% of each referee's first deposit — paid in APTC after unlock.`
              : `Estimate your APTC referral rewards (${referrerSharePct}% of each qualifying first deposit).`
          }
        />
        <div className="rounded-xl border border-cyan-400/20 bg-[#1A0015]/80 p-4 sm:p-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="rounded-lg border border-white/10 bg-black/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Valid referrals</p>
              <input
                type="number"
                min={0}
                step="1"
                inputMode="numeric"
                value={calcReferrals}
                onChange={(e) => setCalcReferrals(e.target.value)}
                placeholder="e.g. 25"
                className="mt-2 w-full bg-transparent text-lg font-bold text-white outline-none placeholder:text-white/30"
              />
              <div className="mt-2 flex gap-1.5 flex-wrap">
                {[5, 25, 100, 500].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCalcReferrals(String(n))}
                    className="rounded border border-white/15 px-2 py-0.5 text-[10px] font-bold text-white/70 hover:text-white hover:border-white/40"
                  >
                    {n.toLocaleString()}
                  </button>
                ))}
              </div>
            </label>
            <label className="rounded-lg border border-white/10 bg-black/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                Avg. first deposit (USD)
              </p>
              <input
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={calcAvgDeposit}
                onChange={(e) => setCalcAvgDeposit(e.target.value)}
                placeholder="e.g. 5"
                className="mt-2 w-full bg-transparent text-lg font-bold text-white outline-none placeholder:text-white/30"
              />
              <div className="mt-2 flex gap-1.5 flex-wrap">
                {[1, 5, 20, 100].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCalcAvgDeposit(String(n))}
                    className="rounded border border-white/15 px-2 py-0.5 text-[10px] font-bold text-white/70 hover:text-white hover:border-white/40"
                  >
                    ${n}
                  </button>
                ))}
              </div>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <CalcTile
              tint="emerald"
              label="APTC per referral"
              main={`${fmtApt(earningsPerReferralAptc)} APTC`}
              sub={`≈ $${fmtApt(usdPerReferral)} at ${referrerSharePct}% share`}
            />
            <CalcTile
              tint="purple"
              label="Total APTC"
              main={`${fmtApt(totalEarningsAptc)} APTC`}
              sub={`${calcReferralsN.toLocaleString()} × ${fmtApt(earningsPerReferralAptc)} APTC`}
            />
            <CalcTile
              tint="cyan"
              label="Unlock rules"
              main={`${cliffDays}d cliff`}
              sub={`or $${volumeUnlock} referee volume`}
            />
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-white/70 leading-relaxed">
            Referrers earn <strong className="text-white">APTC</strong>, not APT. Rewards accrue on the
            referee&apos;s first deposit, stay <strong className="text-white">locked</strong> for {cliffDays} days,
            and unlock early if your referee wagers ${volumeUnlock} (USD equivalent).
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <SummaryTile
          icon={<FaCheckCircle className="text-emerald-300" />}
          label="Valid referrals"
          value={!connected ? '—' : loadingStats ? '…' : String(stats?.validReferrals ?? 0)}
          hint={
            connected
              ? stats?.pendingReferrals
                ? `${stats.pendingReferrals} pending first deposit`
                : 'Counted on first deposit'
              : 'Connect your wallet'
          }
        />
        <SummaryTile
          icon={<FaGift className="text-pink-300" />}
          label="APTC earned"
          value={
            !connected
              ? '—'
              : loadingStats
                ? '…'
                : `${fmtApt((stats?.paidAptc ?? 0) + (stats?.unlockedAptc ?? 0))}`
          }
          hint={
            stats?.lockedAptc > 0
              ? `${fmtApt(stats.lockedAptc)} locked · ${fmtApt(stats?.claimableAptc ?? 0)} claimable`
              : 'Paid in APTC after unlock'
          }
        />
        <SummaryTile
          icon={<FaTrophy className="text-amber-300" />}
          label="Your rank"
          value={
            !connected
              ? '—'
              : stats?.rank
                ? ordinal(stats.rank)
                : (stats?.validReferrals ?? 0) > 0
                  ? '—'
                  : 'Unranked'
          }
          hint="Global leaderboard"
        />
        <SummaryTile
          icon={<FaShareAlt className="text-blue-magic" />}
          label="People invited"
          value={totalInvites.toLocaleString()}
          hint={`${totalValid.toLocaleString()} validated · public leaderboard`}
        />
      </section>

      <section id="referral-leaderboard" className="mb-10 scroll-mt-24">
        <SectionHeading
          icon={<FaTrophy className="text-amber-300" />}
          title="Public referral leaderboard"
          subtitle="Anyone can view this — ranked by people invited. Validated = first deposit completed."
          action={
            <span className="text-xs text-white/45 tabular-nums">
              {loadingBoard ? 'Updating…' : `${leaderboard.length} referrers`}
            </span>
          }
        />
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1A0015]/80">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-white/[0.03] text-left text-[11px] uppercase tracking-widest text-white/40">
                <tr>
                  <th className="px-4 py-3 w-16">Rank</th>
                  <th className="px-4 py-3">Referrer</th>
                  <th className="px-4 py-3 text-right">Invited</th>
                  <th className="px-4 py-3 text-right">Validated</th>
                  <th className="px-4 py-3 text-right">APTC earned</th>
                  <th className="px-4 py-3">Latest</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-white/45 text-center" colSpan={6}>
                      {loadingBoard
                        ? 'Loading leaderboard…'
                        : 'No referrals yet. Share your link — you appear here once someone signs up with it.'}
                    </td>
                  </tr>
                )}
                {leaderboard.map((row) => {
                  const isYou =
                    address &&
                    (chain === 'solana'
                      ? row.wallet === address
                      : row.wallet?.toLowerCase() === address?.toLowerCase());
                  const displayCode = row.code || short(row.wallet);
                  return (
                    <tr
                      key={row.wallet}
                      className={`border-t border-white/5 ${isYou ? 'bg-purple-500/5 text-white' : 'text-white/80'}`}
                    >
                      <td className="px-4 py-3 font-bold">
                        <RankBadge rank={row.rank} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white">{displayCode}</p>
                        <p className="font-mono text-[11px] text-white/40">{short(row.wallet)}</p>
                        {isYou && (
                          <span className="mt-1 inline-block rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                            You
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-blue-magic">
                        {Number(row.totalReferrals ?? row.referrals ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-300">
                        {Number(row.validReferrals ?? row.referrals ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-amber-300">
                        {fmtApt(row.earnedApt)} APTC
                      </td>
                      <td className="px-4 py-3 text-xs text-white/55">{fmtDate(row.last_referral_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4 mb-10">
        {HOW_IT_WORKS.map((step) => (
          <div key={step.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <div className="w-10 h-10 rounded-full bg-[#250020] flex items-center justify-center mb-3">
              {step.icon}
            </div>
            <p className="font-semibold text-white text-sm">{step.title}</p>
            <p className="text-xs text-white/50 mt-2 leading-relaxed">{step.body}</p>
          </div>
        ))}
      </section>

      <PageCard className="mb-10" gradient="from-red-magic/50 via-fuchsia-500/30 to-blue-magic/50">
        <SectionHeading
          icon={<FaLink className="text-blue-magic" />}
          title="Your referral link"
          subtitle="Recipients tap your link — we store the referral in the browser, then attribute on first deposit."
          action={
            code ? (
              <span className="rounded-full bg-purple-500/15 border border-purple-400/30 px-3 py-1 text-xs font-mono tracking-wider text-purple-200">
                {code}
              </span>
            ) : null
          }
        />

        {!connected ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-900/15 p-5 text-sm text-amber-200">
            <p>Connect your wallet (Solana or Aptos) to mint your unique referral code.</p>
            <button
              type="button"
              onClick={() => setConnectOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-magic to-blue-magic px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
            >
              Connect wallet
            </button>
            <ChainConnectModal open={connectOpen} onClose={() => setConnectOpen(false)} />
          </div>
        ) : loadingCode && !code ? (
          <div className="rounded-xl border border-white/10 bg-black/30 p-5 text-sm text-white/60 animate-pulse">
            Allocating your unique code…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : (
          <>
            <ReferralLinkCard
              link={referralLinkShort}
              code={code}
              copied={copied}
              onCopyLink={() => handleCopy('short')}
              onCopyMessage={() => handleCopy('message')}
            />

            <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                Custom referral name
              </p>
              <p className="mt-1 text-xs text-white/55 leading-relaxed">
                Pick a memorable name for your link (e.g. <span className="font-mono text-white/70">MYNAME</span> →{' '}
                <span className="font-mono text-white/70">aptcasino.fun/r/MYNAME</span>). You can change it once every
                24 hours.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center rounded-lg border border-white/15 bg-black/40 px-3 py-2">
                  <span className="shrink-0 text-xs text-white/40">/r/</span>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => {
                      setCustomName(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''));
                      setNameError(null);
                      setNameSaved(false);
                    }}
                    maxLength={20}
                    placeholder="YOUR-NAME"
                    className="min-w-0 flex-1 bg-transparent font-mono text-sm text-white outline-none placeholder:text-white/25"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void saveCustomName()}
                  disabled={savingName || !customName.trim() || customName.trim().toUpperCase() === code}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-red-magic to-blue-magic px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-40"
                >
                  {savingName ? 'Saving…' : nameSaved ? 'Saved!' : 'Save name'}
                </button>
              </div>
              {nameError ? (
                <p className="mt-2 text-xs text-rose-300">{nameError}</p>
              ) : (
                <p className="mt-2 text-[11px] text-white/35">
                  3–20 characters · letters, numbers, hyphen, underscore
                </p>
              )}
            </div>

            {shareChannels.length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/10 space-y-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">
                    Quick share
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {shareChannels
                      .filter((c) => c.tier === 'primary')
                      .map((channel) => (
                        <SharePill
                          key={channel.id}
                          href={channel.href}
                          onClick={
                            channel.action === 'copy-discord' ? handleDiscordShare : undefined
                          }
                          icon={shareChannelIcon(channel.id, false)}
                          label={channel.shortLabel || channel.label}
                          accent={channel.id}
                        />
                      ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">
                    More platforms
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {shareChannels
                      .filter((c) => c.tier === 'more')
                      .map((channel) => (
                        <ShareIconChip
                          key={channel.id}
                          href={channel.href}
                          onClick={
                            channel.action === 'copy-discord'
                              ? handleDiscordShare
                              : channel.action === 'copy-linkedin'
                                ? handleLinkedInShare
                                : undefined
                          }
                          icon={shareChannelIcon(
                            channel.id,
                            (copied === 'discord' && channel.id === 'discord') ||
                              (copied === 'linkedin' && channel.id === 'linkedin'),
                          )}
                          label={
                            channel.id === 'discord' && copied === 'discord'
                              ? 'Copied'
                              : channel.id === 'linkedin' && copied === 'linkedin'
                                ? 'Copied'
                                : channel.shortLabel || channel.label
                          }
                          accent={channel.id}
                        />
                      ))}
                  </div>
                </div>
              </div>
            )}

            {referralLinkQuery && referralLinkQuery !== referralLinkShort && (
              <div className="mt-4 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Alternate URL (same tracking)
                </p>
                <p className="mt-2 break-all font-mono text-xs leading-relaxed text-white/70 sm:text-sm">
                  {referralLinkQuery}
                </p>
                <button
                  type="button"
                  onClick={() => handleCopy('query')}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10"
                >
                  {copied === 'query' ? (
                    <>
                      <FaCheck /> Copied
                    </>
                  ) : (
                    <>
                      <FaCopy /> Copy alternate
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {connected && (stats?.recent?.length ?? 0) > 0 && (
          <div className="mt-6 border-t border-white/10 pt-6">
            <p className="text-xs font-bold uppercase tracking-widest text-white/45 mb-2">Recent referrals</p>
            <div className="rounded-xl border border-white/10 bg-black/30 divide-y divide-white/5">
              {stats.recent.map((r) => (
                <div
                  key={`${r.refereeWallet}-${r.attributedAt}`}
                  className="flex items-center justify-between px-4 py-2 text-sm gap-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {r.isValid ? (
                      <FaCheckCircle className="text-emerald-400 shrink-0" title="Validated" />
                    ) : (
                      <FaClock className="text-amber-400 shrink-0" title="Awaiting first deposit" />
                    )}
                    <span className="font-mono text-white/80 truncate">{short(r.refereeWallet)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/50 shrink-0">
                    {r.isValid ? (
                      <span className="text-emerald-300">
                        +{fmtApt(r.rewardAptc ?? 0)} APTC
                        {r.rewardStatus === 'locked' ? ' · locked' : ''}
                      </span>
                    ) : (
                      <span className="text-amber-300">pending deposit</span>
                    )}
                    <span className="hidden sm:inline">{fmtDate(r.attributedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </PageCard>

      <PageCard gradient="from-pink-500/40 to-amber-400/40" className="mb-10">
        <SectionHeading icon={<FaGift className="text-pink-300" />} title="Referral competition · Prize pool" />
        <p className="text-white/70 text-sm max-w-3xl leading-relaxed">
          On top of the revenue share, we&apos;ll seed a recurring prize pool for top referrers. Wallets at the top of
          this leaderboard at each window close split the pot pro-rata to validated referral count.
        </p>
        <ul className="mt-4 text-sm text-white/55 space-y-2 list-disc list-inside">
          <li>Only validated referrals (first deposit completed) count.</li>
          <li>Self-referrals and duplicates are rejected at the DB level.</li>
          <li>Reward payouts are independent of the prize pool — you get both.</li>
        </ul>
      </PageCard>

    </PageShell>
  );
}

function SummaryTile({ icon, label, value, hint }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#1A0015]/80 p-4 hover:border-white/20 transition-colors">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/45">
        {icon} <span>{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-white tabular-nums">{value}</p>
      <p className="mt-1 text-[11px] text-white/40">{hint}</p>
    </div>
  );
}

function CalcTile({ tint, label, main, sub }) {
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
      <p className="mt-1 text-2xl font-bold">{main}</p>
      <p className="mt-0.5 text-[11px] opacity-70">{sub}</p>
    </div>
  );
}

const SHARE_ICONS = {
  x: FaTwitter,
  telegram: FaTelegram,
  whatsapp: FaWhatsapp,
  facebook: FaFacebookF,
  linkedin: FaLinkedin,
  reddit: FaReddit,
  email: FaEnvelope,
  discord: FaDiscord,
};

const SHARE_ACCENT = {
  x: 'text-white group-hover:text-white',
  telegram: 'text-sky-400',
  whatsapp: 'text-emerald-400',
  facebook: 'text-blue-400',
  linkedin: 'text-sky-300',
  reddit: 'text-orange-400',
  email: 'text-white/70',
  discord: 'text-indigo-300',
};

function shareChannelIcon(id, discordCopied) {
  const Icon = SHARE_ICONS[id] || FaShareAlt;
  if ((id === 'discord' || id === 'linkedin') && discordCopied) {
    return <FaCheck className="text-emerald-400" />;
  }
  return <Icon />;
}

function SharePill({ href, onClick, icon, label, accent }) {
  const iconTone = SHARE_ACCENT[accent] || 'text-white/80';
  const shell =
    'w-full inline-flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/90 transition-all hover:border-white/20 hover:bg-white/[0.08]';
  const inner = (
    <>
      <span className={`text-base ${iconTone}`}>{icon}</span>
      <span>{label}</span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={shell}>
        {inner}
      </button>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={shell}>
      {inner}
    </a>
  );
}

function ShareIconChip({ href, onClick, icon, label, accent }) {
  const iconTone = SHARE_ACCENT[accent] || 'text-white/70';
  const shell =
    'group inline-flex flex-col items-center gap-1.5 rounded-xl border border-transparent px-2 py-1.5 transition-colors hover:border-white/10 hover:bg-white/[0.04]';
  const inner = (
    <>
      <span
        className={`w-11 h-11 rounded-xl border border-white/10 bg-black/40 flex items-center justify-center text-lg transition-colors group-hover:border-white/20 group-hover:bg-white/[0.06] ${iconTone}`}
      >
        {icon}
      </span>
      <span className="text-[10px] font-medium text-white/45 group-hover:text-white/65 max-w-[4.5rem] truncate">
        {label}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={shell} title={label}>
        {inner}
      </button>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={shell} title={label}>
      {inner}
    </a>
  );
}

function RankBadge({ rank }) {
  if (!rank) return <span className="text-white/40">—</span>;
  const palette =
    rank === 1
      ? 'bg-amber-500/20 border-amber-400/40 text-amber-200'
      : rank === 2
        ? 'bg-zinc-300/15 border-zinc-300/40 text-zinc-200'
        : rank === 3
          ? 'bg-orange-700/20 border-orange-500/40 text-orange-200'
          : 'bg-white/5 border-white/15 text-white/70';
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[2.25rem] rounded-full border px-2 py-0.5 text-xs font-bold ${palette}`}
    >
      #{rank}
    </span>
  );
}
