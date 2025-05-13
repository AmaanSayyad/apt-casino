'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge, EmptyState, Panel, SectionHeading } from '@/components/admin/ui';

function fmtDuration(sec) {
  const m = Math.floor((sec || 0) / 60);
  const s = (sec || 0) % 60;
  return `${m}m ${s}s`;
}

function shortLink(url) {
  if (!url) return '—';
  const t = String(url);
  if (t.length <= 48) return t;
  return `${t.slice(0, 24)}…${t.slice(-12)}`;
}

export default function StreamerRewardsAdminPanel({ adminToken }) {
  const [sessions, setSessions] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filter, setFilter] = useState('all');
  const [rewardFilter, setRewardFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    setError('');
    try {
      const q = new URLSearchParams();
      if (filter !== 'all') q.set('status', filter);
      if (rewardFilter !== 'all') q.set('rewardStatus', rewardFilter);
      const r = await fetch(`/api/admin/stream-sessions?${q}`, {
        headers: { 'x-admin-token': adminToken },
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setSessions(j.sessions ?? []);
      setMeta(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [adminToken, filter, rewardFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchSession(id, body) {
    setBusyId(id);
    try {
      const r = await fetch(`/api/admin/stream-sessions/${id}`, {
        method: 'PATCH',
        headers: { 'x-admin-token': adminToken, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Update failed');
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  }

  if (!adminToken) {
    return (
      <p className="text-sm text-white/50">Save your admin token above to manage streamer rewards.</p>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Streamer rewards"
        subtitle="Live sessions, duration tiers, socials, and payout workflow"
      />

      {meta?.rewardTiers?.length > 0 && (
        <Panel className="p-4 bg-violet-500/5 border-violet-500/20">
          <p className="text-xs text-white/50 mb-2">Reward tiers (% of estimated platform revenue)</p>
          <ul className="text-sm text-white/80 space-y-1">
            {meta.rewardTiers.map((t) => (
              <li key={t.minMinutes}>{t.label}</li>
            ))}
          </ul>
          <p className="text-xs text-white/40 mt-3">
            Est. platform revenue (all-time house edge, USD):{' '}
            <span className="text-white/70 font-mono">
              ${Number(meta.platformRevenueUsdEstimate || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            {meta.pendingRewards > 0 && (
              <span className="ml-2 text-amber-300/90">· {meta.pendingRewards} pending payout(s)</span>
            )}
          </p>
        </Panel>
      )}

      <div className="flex flex-wrap gap-2">
        {['all', 'live', 'ended'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
              filter === s
                ? 'bg-violet-600/30 border-violet-400/40 text-white'
                : 'border-white/10 text-white/50'
            }`}
          >
            {s === 'all' ? 'All sessions' : s}
          </button>
        ))}
        {['all', 'pending', 'approved', 'paid', 'ineligible'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setRewardFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
              rewardFilter === s
                ? 'bg-emerald-600/20 border-emerald-400/30 text-white'
                : 'border-white/10 text-white/50'
            }`}
          >
            Reward: {s}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void load()}
          className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/60 hover:text-white"
        >
          Refresh
        </button>
      </div>

      {error && <p className="text-sm text-rose-300/90">{error}</p>}
      {loading && <p className="text-sm text-white/50">Loading sessions…</p>}

      {!loading && sessions.length === 0 && (
        <EmptyState title="No stream sessions" description="Streamers appear here after going live on /live." />
      )}

      <div className="space-y-4">
        {sessions.map((s) => (
          <Panel key={s.id} className="p-4 border-white/10">
            <div className="flex flex-wrap gap-4">
              {s.thumbnailUrl ? (
                <img
                  src={s.thumbnailUrl}
                  alt=""
                  className="w-32 h-20 object-cover rounded-lg border border-white/10 shrink-0"
                />
              ) : (
                <div className="w-32 h-20 rounded-lg bg-white/5 border border-white/10 shrink-0 flex items-center justify-center text-xs text-white/30">
                  No thumb
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={s.isLive ? 'success' : 'neutral'}>{s.sessionStatus}</Badge>
                  <Badge tone="neutral">{s.source}</Badge>
                  <Badge
                    tone={
                      s.rewardStatus === 'paid'
                        ? 'success'
                        : s.rewardStatus === 'approved'
                          ? 'accent'
                          : s.rewardStatus === 'ineligible'
                            ? 'neutral'
                            : 'warning'
                    }
                  >
                    {s.rewardStatus}
                  </Badge>
                  {s.rewardTierPct > 0 && (
                    <span className="text-xs text-amber-200/90 font-medium">
                      {s.rewardTierLabel}
                      {s.estimatedRewardUsd != null && (
                        <span className="text-white/50 font-normal">
                          {' '}
                          (~${s.estimatedRewardUsd.toFixed(2)} est.)
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/80 font-mono truncate" title={s.playbackId}>
                  {shortLink(s.playbackId)}
                </p>
                <p className="text-xs text-white/50">
                  Wallet: {s.wallet?.slice(0, 8)}… · {fmtDuration(s.durationSeconds)} · Started{' '}
                  {new Date(s.startedAt).toLocaleString()}
                  {s.endedAt ? ` · Ended ${new Date(s.endedAt).toLocaleString()}` : ''}
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-white/55">
                  {s.xHandle && <span>X: @{s.xHandle}</span>}
                  {s.telegramUsername && <span>TG: @{s.telegramUsername}</span>}
                  {s.rewardUnlockAt && (
                    <span>
                      Unlocks {new Date(s.rewardUnlockAt).toLocaleDateString()} (14-day lock)
                    </span>
                  )}
                  {s.solanaPayoutWallet && (
                    <span className="font-mono">SOL payout: {s.solanaPayoutWallet.slice(0, 4)}…</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/10">
              <button
                type="button"
                disabled={busyId === s.id || s.rewardStatus === 'approved'}
                onClick={() => patchSession(s.id, { rewardStatus: 'approved' })}
                className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 disabled:opacity-40"
              >
                Approve reward
              </button>
              <button
                type="button"
                disabled={busyId === s.id || s.rewardStatus === 'paid'}
                onClick={() => patchSession(s.id, { rewardStatus: 'paid' })}
                className="px-3 py-1.5 text-xs rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-200 disabled:opacity-40"
              >
                Mark paid
              </button>
              <button
                type="button"
                disabled={busyId === s.id}
                onClick={() => {
                  const notes = window.prompt('Admin notes', s.adminRewardNotes || '');
                  if (notes !== null) patchSession(s.id, { adminRewardNotes: notes });
                }}
                className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-white/60"
              >
                Notes
              </button>
              <a
                href={s.playbackId.startsWith('http') ? s.playbackId : `https://livepeercdn.com/hls/${s.playbackId}/index.m3u8`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-cyan-300/90"
              >
                Open stream
              </a>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
