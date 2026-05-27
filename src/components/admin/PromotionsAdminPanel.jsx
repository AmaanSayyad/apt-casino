'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FaCopy, FaPlus, FaSync, FaTicketAlt } from 'react-icons/fa';
import { EmptyState, Panel, SectionHeading } from '@/components/admin/ui';

function fmtNum(n) {
  const v = Number(n || 0);
  return Number.isFinite(v) ? v.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0';
}

export default function PromotionsAdminPanel({ adminToken }) {
  const [origin, setOrigin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [promotions, setPromotions] = useState([]);
  const [couponClaims, setCouponClaims] = useState([]);
  const [dealHits, setDealHits] = useState([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    promoType: 'coupon',
    title: '',
    description: '',
    code: '',
    rewardSol: '0.02',
    minDepositUsd: '500',
    bonusUsdAptc: '50',
    bonusBps: '0',
    maxClaims: '',
  });

  const [mutatingId, setMutatingId] = useState('');

  const load = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/admin/promotions', { headers: { 'x-admin-token': adminToken } });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed to load promotions');
      setPromotions(j.promotions || []);
      setCouponClaims(j.couponClaims || []);
      setDealHits(j.dealHits || []);
    } catch (e) {
      setError(e.message || 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!adminToken) return;
    setCreating(true);
    setError('');
    try {
      const payload = {
        promoType: form.promoType,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        code: form.promoType === 'coupon' ? form.code.trim().toUpperCase() : undefined,
        rewardSol: Number(form.rewardSol || 0),
        minDepositUsd: Number(form.minDepositUsd || 0),
        bonusUsdAptc: Number(form.bonusUsdAptc || 0),
        bonusBps: Number(form.bonusBps || 0),
        maxClaims: form.maxClaims ? Number(form.maxClaims) : null,
      };
      const r = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'x-admin-token': adminToken, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Create failed');
      setForm((f) => ({ ...f, title: '', description: '', code: '' }));
      await load();
    } catch (e) {
      setError(e.message || 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const summary = useMemo(
    () => ({
      coupons: promotions.filter((p) => p.promoType === 'coupon').length,
      deals: promotions.filter((p) => p.promoType === 'deposit_deal').length,
    }),
    [promotions],
  );

  const promotionById = useMemo(() => {
    const map = new Map();
    for (const p of promotions) map.set(p.id, p);
    return map;
  }, [promotions]);

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  const patchPromotion = async (id, patch) => {
    if (!adminToken || !id) return;
    setMutatingId(id);
    setError('');
    try {
      const r = await fetch(`/api/admin/promotions/${id}`, {
        method: 'PATCH',
        headers: { 'x-admin-token': adminToken, 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Update failed');
      await load();
    } catch (e) {
      setError(e.message || 'Update failed');
    } finally {
      setMutatingId('');
    }
  };

  const deleteCampaign = async (id) => {
    if (!adminToken || !id) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm('Delete this promotion? This will also remove its claim/deposit logs.')) return;
    setMutatingId(id);
    setError('');
    try {
      const r = await fetch(`/api/admin/promotions/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken },
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Delete failed');
      await load();
    } catch (e) {
      setError(e.message || 'Delete failed');
    } finally {
      setMutatingId('');
    }
  };

  if (!adminToken) return <p className="text-sm text-white/50">Save your admin token above to manage promotions.</p>;

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Promotions portal"
        description="Create coupon credits (e.g. 0.02 SOL) and deposit deal boosts (e.g. $500 => $50 APTC)."
      />

      <Panel>
        <form onSubmit={create} className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm">
            <span className="text-white/60">Type</span>
            <select
              value={form.promoType}
              onChange={(e) => setForm((f) => ({ ...f, promoType: e.target.value }))}
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
            >
              <option value="coupon">Coupon credit</option>
              <option value="deposit_deal">Deposit deal</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-white/60">Title</span>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
              required
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="text-white/60">Description</span>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
            />
          </label>

          {form.promoType === 'coupon' ? (
            <>
              <label className="block text-sm">
                <span className="text-white/60">Coupon code</span>
                <input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 font-mono"
                  placeholder="WELCOME02"
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="text-white/60">Reward SOL</span>
                <input
                  value={form.rewardSol}
                  onChange={(e) => setForm((f) => ({ ...f, rewardSol: e.target.value }))}
                  className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                  type="number"
                  step="0.001"
                  min="0.001"
                />
              </label>
            </>
          ) : (
            <>
              <label className="block text-sm">
                <span className="text-white/60">Min deposit USD</span>
                <input
                  value={form.minDepositUsd}
                  onChange={(e) => setForm((f) => ({ ...f, minDepositUsd: e.target.value }))}
                  className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                  type="number"
                />
              </label>
              <label className="block text-sm">
                <span className="text-white/60">Bonus USD in APTC</span>
                <input
                  value={form.bonusUsdAptc}
                  onChange={(e) => setForm((f) => ({ ...f, bonusUsdAptc: e.target.value }))}
                  className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                  type="number"
                />
              </label>
            </>
          )}

          <label className="block text-sm">
            <span className="text-white/60">Max claims (optional)</span>
            <input
              value={form.maxClaims}
              onChange={(e) => setForm((f) => ({ ...f, maxClaims: e.target.value }))}
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
              type="number"
            />
          </label>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              <FaPlus /> {creating ? 'Creating…' : 'Create promotion'}
            </button>
            <button
              type="button"
              onClick={() => load()}
              className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white/70 hover:text-white"
            >
              <FaSync className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </form>
      </Panel>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      {promotions.length === 0 ? (
        <EmptyState title="No promotions yet" />
      ) : (
        <Panel>
          <div className="mb-3 text-xs text-white/60">
            {summary.coupons} coupon campaigns · {summary.deals} deposit deals
          </div>
          <div className="space-y-2">
            {promotions.map((p) => (
              <div key={p.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">
                        <FaTicketAlt className="inline mr-2 text-blue-300" />
                        {p.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${p.isLive ? 'text-emerald-300' : 'text-white/45'}`}>
                          {p.isLive ? 'live' : 'inactive'}
                        </span>
                        <button
                          type="button"
                          disabled={!!mutatingId}
                          onClick={() => patchPromotion(p.id, { active: !p.active })}
                          className="rounded border border-white/20 px-2 py-0.5 text-[11px] text-white/80 hover:text-white disabled:opacity-40"
                        >
                          {p.active ? 'Stop' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          disabled={!!mutatingId}
                          onClick={() => deleteCampaign(p.id)}
                          className="rounded border border-rose-500/40 px-2 py-0.5 text-[11px] text-rose-300 hover:text-rose-100 disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                <p className="text-xs text-white/60 mt-1">
                  {p.promoType === 'coupon'
                    ? `Code ${p.code || '—'} -> +${fmtNum(p.rewardSol)} SOL`
                    : `Deposit $${fmtNum(p.minDepositUsd)} -> +$${fmtNum(p.bonusUsdAptc)} APTC (${(Number(p.bonusBps || 0) / 100).toFixed(2)}% extra)`}
                </p>
                {p.promoType === 'coupon' && p.code ? (
                  <p className="text-xs text-cyan-300/90 mt-1 font-mono flex items-center gap-2">
                    <span>{`${origin}/c/${p.code}`}</span>
                    <button
                      type="button"
                      className="text-white/50 hover:text-white"
                      title="Copy coupon link"
                      onClick={() => copyText(`${origin}/c/${p.code}`)}
                    >
                      <FaCopy />
                    </button>
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel>
        <p className="text-xs text-white/50 mb-3">Recent coupon claims: {couponClaims.length}</p>
        {couponClaims.length === 0 ? (
          <p className="text-xs text-white/35">No coupon claims yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[980px] text-xs">
              <thead className="bg-white/[0.03] text-left uppercase tracking-wider text-white/45">
                <tr>
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Campaign</th>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Wallet</th>
                  <th className="px-3 py-2">Chain</th>
                  <th className="px-3 py-2">Reward</th>
                  <th className="px-3 py-2">IP hash</th>
                  <th className="px-3 py-2">Device hash</th>
                  <th className="px-3 py-2">User agent</th>
                </tr>
              </thead>
              <tbody>
                {couponClaims.map((c) => {
                  const campaign = promotionById.get(c.campaign_id);
                  return (
                    <tr key={c.id} className="border-t border-white/5 text-white/75">
                      <td className="px-3 py-2">{new Date(c.created_at).toLocaleString()}</td>
                      <td className="px-3 py-2">{campaign?.title || c.campaign_id}</td>
                      <td className="px-3 py-2 font-mono">{c.code}</td>
                      <td className="px-3 py-2 font-mono">{c.wallet}</td>
                      <td className="px-3 py-2">{c.chain}</td>
                      <td className="px-3 py-2">{fmtNum(c.reward_native)} SOL</td>
                      <td className="px-3 py-2 font-mono text-white/55">{c.ip_hash || '—'}</td>
                      <td className="px-3 py-2 font-mono text-white/55">{c.device_hash || '—'}</td>
                      <td className="px-3 py-2 text-white/50 max-w-[300px] truncate" title={c.user_agent || ''}>
                        {c.user_agent || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel>
        <p className="text-xs text-white/50 mb-3">Recent deposit deal hits: {dealHits.length}</p>
        {dealHits.length === 0 ? (
          <p className="text-xs text-white/35">No deposit deal hits yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[820px] text-xs">
              <thead className="bg-white/[0.03] text-left uppercase tracking-wider text-white/45">
                <tr>
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Campaign</th>
                  <th className="px-3 py-2">Wallet</th>
                  <th className="px-3 py-2">Chain</th>
                  <th className="px-3 py-2">Deposit USD</th>
                  <th className="px-3 py-2">Bonus APTC</th>
                  <th className="px-3 py-2">Deposit tx</th>
                </tr>
              </thead>
              <tbody>
                {dealHits.map((d) => {
                  const campaign = promotionById.get(d.campaign_id);
                  return (
                    <tr key={d.id} className="border-t border-white/5 text-white/75">
                      <td className="px-3 py-2">{new Date(d.created_at).toLocaleString()}</td>
                      <td className="px-3 py-2">{campaign?.title || d.campaign_id}</td>
                      <td className="px-3 py-2 font-mono">{d.wallet}</td>
                      <td className="px-3 py-2">{d.chain}</td>
                      <td className="px-3 py-2">${fmtNum(d.deposit_usd)}</td>
                      <td className="px-3 py-2 text-amber-300">{fmtNum(d.bonus_aptc)}</td>
                      <td className="px-3 py-2 font-mono text-white/60">{d.deposit_tx_hash}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
