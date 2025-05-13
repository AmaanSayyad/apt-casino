'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FaCopy, FaExternalLinkAlt, FaGift, FaPlus, FaSync, FaUserFriends } from 'react-icons/fa';
import { Badge, EmptyState, Panel, SectionHeading } from '@/components/admin/ui';

function fmtNum(n) {
  if (n == null || !Number.isFinite(Number(n))) return '—';
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
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

function countdownLabel(unlockAt) {
  const diff = new Date(unlockAt).getTime() - Date.now();
  if (diff <= 0) return 'Unlocked';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${d}d ${h}h ${m}m`;
}

const STATUS_BADGE = {
  locked: 'warning',
  ready: 'success',
  fulfilled: 'accent',
  revoked: 'danger',
};

export default function KolAllocationsAdminPanel({ adminToken }) {
  const [allocations, setAllocations] = useState([]);
  const [defaults, setDefaults] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);
  const [createdCreds, setCreatedCreds] = useState(null);

  const [form, setForm] = useState({
    slug: '',
    displayName: '',
    walletAddress: '',
    portalPassword: '',
    autoGeneratePassword: true,
    adminNotes: '',
  });

  const load = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`/api/admin/kol-allocations?status=${filter}`, {
        headers: { 'x-admin-token': adminToken },
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed to load');
      setAllocations(j.allocations || []);
      setDefaults(j.defaults || null);
    } catch (e) {
      setError(e.message || 'Load failed');
      setAllocations([]);
    } finally {
      setLoading(false);
    }
  }, [adminToken, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const createAllocation = async (e) => {
    e.preventDefault();
    setActionId('create');
    setCreatedCreds(null);
    try {
      const r = await fetch('/api/admin/kol-allocations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Create failed');
      setCreatedCreds({
        slug: j.allocation.slug,
        portalUrl: j.allocation.portalUrl,
        password: j.portalPassword,
      });
      setForm({
        slug: '',
        displayName: '',
        walletAddress: '',
        portalPassword: '',
        autoGeneratePassword: true,
        adminNotes: '',
      });
      await load();
    } catch (err) {
      alert(err.message || 'Create failed');
    } finally {
      setActionId(null);
    }
  };

  const patchAllocation = async (id, patch) => {
    setActionId(id);
    try {
      const r = await fetch(`/api/admin/kol-allocations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify(patch),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Update failed');
      await load();
    } catch (err) {
      alert(err.message || 'Update failed');
    } finally {
      setActionId(null);
    }
  };

  const fulfill = async (row) => {
    const tx = window.prompt('APTC transfer tx signature (Solana)?', row.fulfillmentTxHash || '');
    if (tx === null) return;
    setActionId(row.id);
    try {
      const r = await fetch(`/api/admin/kol-allocations/${row.id}/fulfill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({ fulfillmentTxHash: tx.trim() || undefined }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Fulfill failed');
      await load();
    } catch (err) {
      alert(err.message || 'Fulfill failed');
    } finally {
      setActionId(null);
    }
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  const summary = useMemo(() => {
    const total = allocations.reduce((s, a) => s + Number(a.amountAptc || 0), 0);
    return { count: allocations.length, totalAptc: total };
  }, [allocations]);

  if (!adminToken) {
    return (
      <p className="text-sm text-white/50">Save your admin token above to manage KOL allocations.</p>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        title="KOL allocations"
        description={
          defaults
            ? `${fmtNum(defaults.amountAptc)} APTC (${defaults.pctOfSupply}% supply) · ${defaults.lockDays}-day lock · password portal at /kol/[slug]`
            : 'Partner token allocations with 14-day lock'
        }
      />

      {createdCreds ? (
        <Panel className="border-emerald-500/30 bg-emerald-950/20">
          <p className="text-emerald-200 font-medium mb-2">KOL created — share these credentials privately</p>
          <div className="space-y-2 text-sm font-mono">
            <p>
              Portal:{' '}
              <a href={createdCreds.portalUrl} className="text-cyan-300 underline" target="_blank" rel="noreferrer">
                {createdCreds.portalUrl}
              </a>
              <button type="button" className="ml-2 text-white/50 hover:text-white" onClick={() => copyText(createdCreds.portalUrl)}>
                <FaCopy />
              </button>
            </p>
            <p>
              Password: <span className="text-white">{createdCreds.password}</span>
              <button type="button" className="ml-2 text-white/50 hover:text-white" onClick={() => copyText(createdCreds.password)}>
                <FaCopy />
              </button>
            </p>
          </div>
        </Panel>
      ) : null}

      <Panel>
        <form onSubmit={createAllocation} className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="text-white/60">URL slug</span>
            <input
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
              placeholder="kol-alice"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/60">Display name</span>
            <input
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
              placeholder="Alice Crypto"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              required
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="text-white/60">Solana wallet (payout address)</span>
            <input
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 font-mono text-xs"
              placeholder="Base58 wallet address"
              value={form.walletAddress}
              onChange={(e) => setForm((f) => ({ ...f, walletAddress: e.target.value }))}
              required
            />
          </label>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.autoGeneratePassword}
              onChange={(e) => setForm((f) => ({ ...f, autoGeneratePassword: e.target.checked }))}
            />
            Auto-generate portal password
          </label>
          {!form.autoGeneratePassword ? (
            <label className="block text-sm md:col-span-2">
              <span className="text-white/60">Portal password</span>
              <input
                type="password"
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                value={form.portalPassword}
                onChange={(e) => setForm((f) => ({ ...f, portalPassword: e.target.value }))}
                minLength={6}
              />
            </label>
          ) : null}
          <label className="block text-sm md:col-span-2">
            <span className="text-white/60">Admin notes (optional)</span>
            <textarea
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 min-h-[72px]"
              value={form.adminNotes}
              onChange={(e) => setForm((f) => ({ ...f, adminNotes: e.target.value }))}
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={actionId === 'create'}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              <FaPlus /> Create KOL allocation
            </button>
          </div>
        </form>
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {['all', 'locked', 'ready', 'fulfilled', 'revoked'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`text-xs px-2 py-1 rounded-full border ${
                filter === s ? 'bg-purple-500/30 border-purple-400/50 text-white' : 'border-white/15 text-white/60'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-white/50">
          <span>{summary.count} KOLs · {fmtNum(summary.totalAptc)} APTC allocated</span>
          <button type="button" onClick={() => load()} className="text-white/70 hover:text-white">
            <FaSync className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error ? <p className="text-rose-300 text-sm">{error}</p> : null}

      {loading && allocations.length === 0 ? (
        <EmptyState title="Loading KOL allocations…" />
      ) : allocations.length === 0 ? (
        <EmptyState title="No KOL allocations yet" />
      ) : (
        <div className="space-y-3">
          {allocations.map((row) => (
            <Panel key={row.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-white">{row.displayName}</h4>
                    <Badge tone={STATUS_BADGE[row.effectiveStatus] || 'neutral'}>{row.effectiveStatus}</Badge>
                    <span className="text-xs text-white/40 font-mono">/{row.slug}</span>
                  </div>
                  <p className="text-sm text-white/60 mt-1">
                    {fmtNum(row.amountAptc)} APTC ({row.pctOfSupply}% supply) · wallet {short(row.walletAddress)}
                  </p>
                  <p className="text-xs text-white/45 mt-1">
                    Locked {fmtDate(row.lockedAt)} → unlock {fmtDate(row.unlockAt)}
                    {row.effectiveStatus === 'locked' ? ` · ${countdownLabel(row.unlockAt)} left` : ''}
                  </p>
                  {row.fulfillmentTxHash ? (
                    <p className="text-xs text-cyan-300/80 mt-1 font-mono">TX {short(row.fulfillmentTxHash)}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={row.portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-2 py-1 rounded border border-white/15 hover:bg-white/5 inline-flex items-center gap-1"
                  >
                    <FaExternalLinkAlt /> Portal
                  </a>
                  <button
                    type="button"
                    className="text-xs px-2 py-1 rounded border border-white/15 hover:bg-white/5"
                    onClick={() => {
                      const w = window.prompt('Update wallet address', row.walletAddress);
                      if (w != null && w.trim()) patchAllocation(row.id, { walletAddress: w.trim() });
                    }}
                  >
                    Edit wallet
                  </button>
                  <button
                    type="button"
                    className="text-xs px-2 py-1 rounded border border-white/15 hover:bg-white/5 inline-flex items-center gap-1"
                    onClick={() => {
                      const p = window.prompt('New portal password (min 6 chars)');
                      if (p != null && p.trim()) patchAllocation(row.id, { portalPassword: p.trim() });
                    }}
                  >
                    Reset password
                  </button>
                  {(row.effectiveStatus === 'ready' || row.status === 'ready') && row.status !== 'fulfilled' ? (
                    <button
                      type="button"
                      disabled={actionId === row.id}
                      className="text-xs px-2 py-1 rounded bg-emerald-600/80 hover:bg-emerald-600 inline-flex items-center gap-1 disabled:opacity-50"
                      onClick={() => fulfill(row)}
                    >
                      <FaGift /> Mark fulfilled
                    </button>
                  ) : null}
                  {row.status !== 'revoked' && row.status !== 'fulfilled' ? (
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded border border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
                      onClick={() => {
                        if (window.confirm('Revoke this KOL allocation?')) {
                          patchAllocation(row.id, { status: 'revoked' });
                        }
                      }}
                    >
                      Revoke
                    </button>
                  ) : null}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
