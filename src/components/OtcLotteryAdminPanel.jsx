'use client';

import { useCallback, useEffect, useState } from 'react';
import { FaCheck, FaTimes, FaGift } from 'react-icons/fa';

function fmtNum(n) {
  if (n == null || !Number.isFinite(Number(n))) return '—';
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function short(a) {
  if (!a) return '—';
  const s = String(a);
  return s.length > 10 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
}

export default function OtcLotteryAdminPanel({ adminToken }) {
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('pending_review');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);

  const load = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`/api/otc-lottery/admin/entries?status=${filter}`, {
        headers: { 'x-admin-token': adminToken },
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed to load');
      setEntries(j.entries || []);
    } catch (e) {
      setError(e.message || 'Load failed');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [adminToken, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (entryId, action, rejectReason) => {
    setActionId(entryId);
    try {
      const r = await fetch('/api/otc-lottery/admin/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({ entryId, action, rejectReason }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Review failed');
      await load();
    } catch (e) {
      alert(e.message || 'Review failed');
    } finally {
      setActionId(null);
    }
  };

  const fulfill = async (entry) => {
    const tx = window.prompt('APTC fulfillment tx signature (Solana)?', '');
    if (tx === null) return;
    const aptc = window.prompt(
      'APTC amount sent?',
      String(entry.estimatedAptc || ''),
    );
    if (aptc === null) return;
    setActionId(entry.id);
    try {
      const r = await fetch('/api/otc-lottery/admin/fulfill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({
          entryId: entry.id,
          fulfillmentTxHash: tx.trim() || undefined,
          actualAptcSent: parseFloat(aptc),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Fulfill failed');
      await load();
    } catch (e) {
      alert(e.message || 'Fulfill failed');
    } finally {
      setActionId(null);
    }
  };

  if (!adminToken) {
    return (
      <p className="text-sm text-white/50">
        Save your admin token above to manage OTC lottery entries.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <h3 className="text-lg font-semibold">OTC lottery entries</h3>
        <div className="flex gap-1 flex-wrap">
          {['pending_review', 'approved', 'rejected', 'fulfilled', 'all'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`text-xs px-2 py-1 rounded-full border ${
                filter === s
                  ? 'bg-purple-500/30 border-purple-400/50 text-white'
                  : 'border-white/15 text-white/60 hover:text-white'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-white/50">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-white/50">No entries in this filter.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[900px] text-xs">
            <thead className="bg-white/[0.03] text-left text-[10px] uppercase tracking-widest text-white/40">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Sender</th>
                <th className="px-3 py-2">SOL</th>
                <th className="px-3 py-2">Est. APTC</th>
                <th className="px-3 py-2">Unlock</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-white/5 text-white/80">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {e.solSentAt ? new Date(e.solSentAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-3 py-2 font-mono">{short(e.solSenderWallet)}</td>
                  <td className="px-3 py-2">{fmtNum(e.solAmount)}</td>
                  <td className="px-3 py-2">{fmtNum(e.estimatedAptc)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {e.unlockAt ? new Date(e.unlockAt).toLocaleString() : '—'}
                    {e.isUnlocked && <span className="ml-1 text-emerald-400">(unlocked)</span>}
                  </td>
                  <td className="px-3 py-2">
                    <span className="uppercase font-bold text-[10px]">{e.status}</span>
                  </td>
                  <td className="px-3 py-2 text-right space-x-1">
                    {e.status === 'pending_review' && (
                      <>
                        <button
                          type="button"
                          disabled={actionId === e.id}
                          onClick={() => review(e.id, 'approve')}
                          className="inline-flex items-center gap-0.5 px-2 py-1 rounded bg-emerald-600/80 hover:bg-emerald-500 text-white"
                          title="Approve"
                        >
                          <FaCheck /> Approve
                        </button>
                        <button
                          type="button"
                          disabled={actionId === e.id}
                          onClick={() => {
                            const reason = window.prompt('Reject reason?') || 'Rejected';
                            void review(e.id, 'reject', reason);
                          }}
                          className="inline-flex items-center gap-0.5 px-2 py-1 rounded bg-rose-600/80 hover:bg-rose-500 text-white"
                          title="Reject"
                        >
                          <FaTimes /> Reject
                        </button>
                      </>
                    )}
                    {e.status === 'approved' && e.isUnlocked && (
                      <button
                        type="button"
                        disabled={actionId === e.id}
                        onClick={() => fulfill(e)}
                        className="inline-flex items-center gap-0.5 px-2 py-1 rounded bg-blue-600/80 hover:bg-blue-500 text-white"
                      >
                        <FaGift /> Mark fulfilled
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
