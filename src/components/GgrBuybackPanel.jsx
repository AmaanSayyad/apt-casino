'use client';

import { useCallback, useEffect, useState } from 'react';

export default function GgrBuybackPanel({ adminToken }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    periodStart: '',
    periodEnd: '',
    ggrUsd: '',
    buybackUsd: '',
    aptcBought: '',
    aptcBurned: '',
    txSignature: '',
    notes: '',
  });
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/ggr/buyback');
      setData(await r.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!adminToken) return;
    setMsg('');
    try {
      const r = await fetch('/api/ggr/buyback/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({
          periodStart: form.periodStart || new Date(Date.now() - 7 * 864e5).toISOString(),
          periodEnd: form.periodEnd || new Date().toISOString(),
          ggrUsd: Number(form.ggrUsd),
          buybackUsd: Number(form.buybackUsd),
          aptcBought: form.aptcBought ? Number(form.aptcBought) : undefined,
          aptcBurned: form.aptcBurned ? Number(form.aptcBurned) : undefined,
          txSignature: form.txSignature || undefined,
          notes: form.notes || undefined,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed');
      setMsg('Snapshot recorded.');
      setForm({ periodStart: '', periodEnd: '', ggrUsd: '', buybackUsd: '', aptcBought: '', aptcBurned: '', txSignature: '', notes: '' });
      load();
    } catch (err) {
      setMsg(err.message || 'Error');
    }
  };

  const cfg = data?.config;
  const est = data?.estimates;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <Tile label="Buyback % of GGR" value={cfg ? `${cfg.buybackPctOfGgr}%` : '…'} />
        <Tile label="Burn % of buyback" value={cfg ? `${cfg.burnPctOfBuyback}%` : '…'} />
        <Tile label="30d est. GGR" value={est?.ggrUsd30d != null ? `$${fmt(est.ggrUsd30d)}` : '…'} />
        <Tile label="30d est. buyback" value={est?.projectedBuybackUsd30d != null ? `$${fmt(est.projectedBuybackUsd30d)}` : '…'} />
      </div>

      {loading ? (
        <p className="text-white/50 text-sm">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/[0.04] text-white/55">
              <tr>
                <th className="px-3 py-2">Period end</th>
                <th className="px-3 py-2">GGR USD</th>
                <th className="px-3 py-2">Buyback USD</th>
                <th className="px-3 py-2">APTC burned</th>
                <th className="px-3 py-2">TX</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentSnapshots ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-white/45">
                    No buyback executions logged yet.
                  </td>
                </tr>
              ) : (
                data.recentSnapshots.map((s) => (
                  <tr key={s.id} className="border-t border-white/[0.06]">
                    <td className="px-3 py-2 text-xs text-white/70">
                      {new Date(s.period_end).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 font-mono">${Number(s.ggr_usd).toFixed(2)}</td>
                    <td className="px-3 py-2 font-mono">${Number(s.buyback_usd).toFixed(2)}</td>
                    <td className="px-3 py-2 font-mono">{s.aptc_burned ?? '—'}</td>
                    <td className="px-3 py-2 font-mono text-xs truncate max-w-[120px]">
                      {s.tx_signature ? `${String(s.tx_signature).slice(0, 8)}…` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {adminToken ? (
        <form onSubmit={submit} className="rounded-lg border border-white/10 p-4 space-y-3">
          <p className="text-sm font-medium text-white">Log buyback execution</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="GGR USD" value={form.ggrUsd} onChange={(v) => setForm((f) => ({ ...f, ggrUsd: v }))} />
            <Field label="Buyback USD" value={form.buybackUsd} onChange={(v) => setForm((f) => ({ ...f, buybackUsd: v }))} />
            <Field label="APTC bought" value={form.aptcBought} onChange={(v) => setForm((f) => ({ ...f, aptcBought: v }))} />
            <Field label="APTC burned" value={form.aptcBurned} onChange={(v) => setForm((f) => ({ ...f, aptcBurned: v }))} />
            <Field label="Solana TX" value={form.txSignature} onChange={(v) => setForm((f) => ({ ...f, txSignature: v }))} className="sm:col-span-2" />
            <Field label="Notes" value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} className="sm:col-span-2" />
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-sm hover:bg-emerald-500/30">
            Record snapshot
          </button>
          {msg && <p className="text-sm text-white/70">{msg}</p>}
        </form>
      ) : (
        <p className="text-sm text-white/45">Unlock admin token above to log buyback runs.</p>
      )}
    </div>
  );
}

function Tile({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
      <p className="text-[10px] uppercase tracking-wider text-white/45">{label}</p>
      <p className="text-white font-semibold mt-1">{value}</p>
    </div>
  );
}

function Field({ label, value, onChange, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs text-white/50">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-[#150018] border border-white/15 rounded px-2 py-1.5 text-sm"
      />
    </label>
  );
}

function fmt(n) {
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
}
