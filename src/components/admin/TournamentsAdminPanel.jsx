'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FaExternalLinkAlt, FaPlus, FaSync, FaEdit, FaTrophy } from 'react-icons/fa';
import { Badge, EmptyState, Panel } from '@/components/admin/ui';

const GAMES = ['plinko', 'mines', 'roulette', 'wheel'];
const STATUSES = ['open', 'live', 'upcoming', 'completed', 'cancelled', 'ended'];

function toLocalDatetimeValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localToIso(local) {
  if (!local) return null;
  const ms = new Date(local).getTime();
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

function tournamentToForm(t) {
  const games = { plinko: false, mines: false, roulette: false, wheel: false };
  (t.includedGames || []).forEach((g) => {
    if (games[g] !== undefined) games[g] = true;
  });
  if (!t.includedGames?.length) {
    games.plinko = games.mines = games.roulette = games.wheel = true;
  }
  return {
    name: t.name || '',
    game: t.game || 'all',
    prizePoolApt: String(t.prizePoolAptc ?? t.prizePoolApt ?? ''),
    entryFeeApt: String(t.entryFeeAptc ?? t.entryFeeApt ?? ''),
    maxParticipants: String(t.maxParticipants ?? ''),
    startsAt: toLocalDatetimeValue(t.startsAt),
    endsAt: toLocalDatetimeValue(t.endsAt),
    competitionMode: t.competitionMode || 'volume',
    status: t.status || 'open',
    notes: t.notes || '',
    includedGames: games,
  };
}

function defaultForm() {
  const start = new Date();
  const end = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);
  return {
    name: 'Volume Cup',
    game: 'all',
    prizePoolApt: '100',
    entryFeeApt: '0',
    maxParticipants: '500',
    startsAt: toLocalDatetimeValue(start.toISOString()),
    endsAt: toLocalDatetimeValue(end.toISOString()),
    competitionMode: 'volume',
    status: 'live',
    notes: '',
    includedGames: { plinko: true, mines: true, roulette: true, wheel: true },
  };
}

function statusTone(status) {
  if (status === 'live') return 'success';
  if (status === 'open' || status === 'upcoming') return 'accent';
  if (status === 'cancelled') return 'danger';
  return 'neutral';
}

export default function TournamentsAdminPanel({ adminToken }) {
  const [form, setForm] = useState(defaultForm);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionId, setActionId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [resultsId, setResultsId] = useState(null);
  const [resultsData, setResultsData] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/admin/tournaments?limit=80', {
        headers: { 'x-admin-token': adminToken },
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed to load tournaments');
      setTournaments(j.tournaments ?? []);
    } catch (e) {
      setError(e.message || 'Load failed');
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const includedGamesList = useMemo(
    () => GAMES.filter((g) => form.includedGames[g]),
    [form.includedGames],
  );

  const createContest = async (e) => {
    e.preventDefault();
    if (!adminToken) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const startsAt = localToIso(form.startsAt);
      const endsAt = localToIso(form.endsAt);
      if (!startsAt) throw new Error('Start time is required.');
      if (!endsAt) throw new Error('End time is required.');

      const payload = {
        name: form.name.trim(),
        game: form.game,
        prizePoolApt: parseFloat(form.prizePoolApt) || 0,
        entryFeeApt: parseFloat(form.entryFeeApt) || 0,
        maxParticipants: parseInt(form.maxParticipants, 10) || 100,
        startsAt,
        endsAt,
        includedGames: form.competitionMode === 'volume' ? includedGamesList : null,
        competitionMode: form.competitionMode,
        status: form.status,
        notes: form.notes.trim() || null,
      };

      const r = await fetch(
        editId ? `/api/admin/tournaments/${editId}` : '/api/admin/tournaments',
        {
          method: editId ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': adminToken,
          },
          body: JSON.stringify(payload),
        },
      );
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || (editId ? 'Update failed' : 'Create failed'));
      setSuccess(
        editId
          ? `Updated “${j.tournament?.name}”.`
          : `Created “${j.tournament?.name}”. It will appear on ${j.tournament?.competitionMode === 'volume' ? '/competition' : 'the homepage'} when live.`,
      );
      setEditId(null);
      setForm(defaultForm());
      await load();
    } catch (err) {
      setError(err.message || (editId ? 'Update failed' : 'Create failed'));
    } finally {
      setSaving(false);
    }
  };

  const patchStatus = async (id, status) => {
    if (!adminToken) return;
    setActionId(id);
    try {
      const r = await fetch(`/api/admin/tournaments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({ status }),
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

  const openEdit = (t) => {
    setEditId(t.id);
    setForm(tournamentToForm(t));
    setResultsId(null);
    setResultsData(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadResults = async (id) => {
    if (!adminToken) return;
    setResultsId(id);
    setResultsLoading(true);
    setResultsData(null);
    try {
      const r = await fetch(`/api/admin/tournaments/${id}`, {
        headers: { 'x-admin-token': adminToken },
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed to load results');
      setResultsData(j);
    } catch (err) {
      alert(err.message || 'Failed to load results');
      setResultsId(null);
    } finally {
      setResultsLoading(false);
    }
  };

  const approvePrize = async (tournamentId, wallet, prizePoolAptc) => {
    const tx = window.prompt('APTC prize transfer tx signature (Solana)?', '');
    if (tx === null) return;
    const amountStr = window.prompt('Prize amount (APTC)?', String(prizePoolAptc || ''));
    if (amountStr === null) return;
    setActionId(wallet);
    try {
      const r = await fetch(`/api/admin/tournaments/${tournamentId}/approve-prize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({
          wallet,
          prizeTxHash: tx.trim() || undefined,
          prizeAmount: parseFloat(amountStr) || undefined,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Approve failed');
      await loadResults(tournamentId);
    } catch (err) {
      alert(err.message || 'Approve failed');
    } finally {
      setActionId(null);
    }
  };

  const markAllDistributed = async (tournamentId) => {
    if (!window.confirm('Mark all prizes as distributed for this contest?')) return;
    setActionId(tournamentId);
    try {
      const r = await fetch(`/api/admin/tournaments/${tournamentId}/approve-prize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({ markAllDistributed: true }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Update failed');
      await loadResults(tournamentId);
      await load();
    } catch (err) {
      alert(err.message || 'Update failed');
    } finally {
      setActionId(null);
    }
  };

  if (!adminToken) {
    return (
      <p className="text-sm text-white/50">Save your admin token above to create contests.</p>
    );
  }

  return (
    <div className="space-y-6">
      <Panel className="p-5 md:p-6 border-violet-500/20">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{editId ? 'Edit contest' : 'Create contest'}</h3>
            <p className="text-xs text-white/50 mt-1">
              Volume Cup → <code className="text-violet-200/80">/competition</code> · Registration events → homepage
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditId(null);
              setForm(defaultForm());
            }}
            className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/70 hover:bg-white/5"
          >
            Reset form
          </button>
        </div>

        <form onSubmit={createContest} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block md:col-span-2">
            <span className="text-xs uppercase tracking-wide text-white/50">Name</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
              placeholder="Volume Cup Season 1"
            />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wide text-white/50">Mode</span>
            <select
              value={form.competitionMode}
              onChange={(e) => setForm((f) => ({ ...f, competitionMode: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
            >
              <option value="volume">Volume Cup (wager leaderboard)</option>
              <option value="registration">Registration event</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wide text-white/50">Status</span>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wide text-white/50">Featured game</span>
            <select
              value={form.game}
              onChange={(e) => setForm((f) => ({ ...f, game: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
            >
              <option value="all">All games</option>
              {GAMES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wide text-white/50">Prize pool (APTC)</span>
            <input
              type="number"
              min="0"
              step="any"
              value={form.prizePoolApt}
              onChange={(e) => setForm((f) => ({ ...f, prizePoolApt: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wide text-white/50">Entry fee (APTC)</span>
            <input
              type="number"
              min="0"
              step="any"
              value={form.entryFeeApt}
              onChange={(e) => setForm((f) => ({ ...f, entryFeeApt: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wide text-white/50">Max participants</span>
            <input
              type="number"
              min="1"
              value={form.maxParticipants}
              onChange={(e) => setForm((f) => ({ ...f, maxParticipants: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wide text-white/50">Starts</span>
            <input
              type="datetime-local"
              required
              value={form.startsAt}
              onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wide text-white/50">Ends</span>
            <input
              type="datetime-local"
              required
              value={form.endsAt}
              onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
            />
          </label>

          {form.competitionMode === 'volume' ? (
            <fieldset className="md:col-span-2 rounded-lg border border-white/10 p-3">
              <legend className="text-xs uppercase tracking-wide text-white/50 px-1">Qualifying games</legend>
              <div className="flex flex-wrap gap-4 mt-2">
                {GAMES.map((g) => (
                  <label key={g} className="flex items-center gap-2 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={form.includedGames[g]}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          includedGames: { ...f.includedGames, [g]: e.target.checked },
                        }))
                      }
                      className="rounded border-white/20"
                    />
                    {g}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          <label className="block md:col-span-2">
            <span className="text-xs uppercase tracking-wide text-white/50">Notes (internal)</span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm resize-y"
            />
          </label>

          {error ? (
            <p className="md:col-span-2 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/25 rounded-lg px-3 py-2">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="md:col-span-2 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-3 py-2">
              {success}
            </p>
          ) : null}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl magic-gradient text-sm font-semibold disabled:opacity-50"
            >
              <FaPlus size={12} />
              {saving ? (editId ? 'Saving…' : 'Creating…') : editId ? 'Save changes' : 'Create contest'}
            </button>
            {editId ? (
              <button
                type="button"
                onClick={() => {
                  setEditId(null);
                  setForm(defaultForm());
                }}
                className="ml-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 text-sm text-white/70 hover:text-white"
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">All contests</h3>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/70 hover:bg-white/5"
        >
          <FaSync className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading && tournaments.length === 0 ? (
        <EmptyState title="Loading contests…" />
      ) : tournaments.length === 0 ? (
        <EmptyState title="No contests yet" subtitle="Create one above." />
      ) : (
        <div className="space-y-3">
          {tournaments.map((t) => {
            const now = Date.now();
            const liveWindow =
              t.endsAt &&
              new Date(t.startsAt).getTime() <= now &&
              new Date(t.endsAt).getTime() >= now;
            return (
              <Panel key={t.id} className="p-4 border-white/10">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-white">{t.name}</h4>
                      <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                      <Badge tone="neutral">{t.competitionMode}</Badge>
                      {liveWindow && t.competitionMode === 'volume' ? (
                        <Badge tone="success">active window</Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-white/45 mt-1 font-mono">{t.id}</p>
                    <p className="text-sm text-white/60 mt-2">
                      {new Date(t.startsAt).toLocaleString()} →{' '}
                      {t.endsAt ? new Date(t.endsAt).toLocaleString() : '—'} · {t.participants}/
                      {t.maxParticipants} registered · pool {t.prizePoolAptc ?? t.prizePoolApt} APTC · fee{' '}
                      {t.entryFeeAptc ?? t.entryFeeApt} APTC
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(t)}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-violet-500/30 text-violet-200 hover:bg-violet-500/10"
                    >
                      <FaEdit size={10} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void loadResults(t.id)}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-amber-500/30 text-amber-200 hover:bg-amber-500/10"
                    >
                      <FaTrophy size={10} /> Results
                    </button>
                    {t.competitionMode === 'volume' ? (
                      <Link
                        href="/competition"
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-violet-500/30 text-violet-200 hover:bg-violet-500/10"
                      >
                        Volume Cup <FaExternalLinkAlt size={10} />
                      </Link>
                    ) : null}
                    {t.status !== 'live' ? (
                      <button
                        type="button"
                        disabled={actionId === t.id}
                        onClick={() => void patchStatus(t.id, 'live')}
                        className="text-xs px-2 py-1 rounded-lg border border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/10"
                      >
                        Set live
                      </button>
                    ) : null}
                    {t.status !== 'ended' && t.status !== 'cancelled' ? (
                      <button
                        type="button"
                        disabled={actionId === t.id}
                        onClick={() => void patchStatus(t.id, 'ended')}
                        className="text-xs px-2 py-1 rounded-lg border border-white/10 text-white/60 hover:bg-white/5"
                      >
                        End
                      </button>
                    ) : null}
                    {t.status !== 'cancelled' ? (
                      <button
                        type="button"
                        disabled={actionId === t.id}
                        onClick={() => {
                          if (window.confirm('Cancel this contest?')) void patchStatus(t.id, 'cancelled');
                        }}
                        className="text-xs px-2 py-1 rounded-lg border border-rose-500/30 text-rose-200 hover:bg-rose-500/10"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      {resultsId ? (
        <Panel className="p-4 border-amber-500/25">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-white">Contest results & prize approval</h3>
            <button
              type="button"
              onClick={() => {
                setResultsId(null);
                setResultsData(null);
              }}
              className="text-xs px-2 py-1 rounded border border-white/15 text-white/60"
            >
              Close
            </button>
          </div>
          {resultsLoading ? (
            <p className="text-sm text-white/50">Loading results…</p>
          ) : resultsData ? (
            <>
              <p className="text-sm text-white/60 mb-4">
                {resultsData.tournament?.name} · {resultsData.results?.length ?? 0} registrants ·{' '}
                {resultsData.totalEntryFeesCollected?.toLocaleString()} APTC entry fees collected ·{' '}
                {resultsData.prizesApproved} prizes approved
              </p>
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-xs">
                  <thead className="bg-white/[0.04] text-left text-white/45 uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2">Rank</th>
                      <th className="px-3 py-2">Wallet</th>
                      <th className="px-3 py-2 text-right">Volume</th>
                      <th className="px-3 py-2 text-right">Bets</th>
                      <th className="px-3 py-2">Entry fee</th>
                      <th className="px-3 py-2">Prize</th>
                      <th className="px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(resultsData.results ?? []).map((row) => (
                      <tr key={row.wallet} className="border-t border-white/5">
                        <td className="px-3 py-2">{row.rank != null ? `#${row.rank}` : '—'}</td>
                        <td className="px-3 py-2 font-mono">{row.walletShort || row.wallet}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{row.volumeApt}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{row.bets}</td>
                        <td className="px-3 py-2">
                          {row.entryFeeAmount ? `${row.entryFeeAmount} APTC` : '—'}
                          {row.entryFeeTxHash ? (
                            <span className="block text-[10px] text-white/35 font-mono truncate max-w-[120px]">
                              {row.entryFeeTxHash.slice(0, 8)}…
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2">
                          {row.prizeApprovedAt ? (
                            <span className="text-emerald-300">
                              ✓ {row.prizeAmount ? `${row.prizeAmount} APTC` : 'Approved'}
                            </span>
                          ) : (
                            <span className="text-white/40">Pending</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {!row.prizeApprovedAt && row.rank != null && row.rank <= 10 ? (
                            <button
                              type="button"
                              disabled={actionId === row.wallet}
                              onClick={() =>
                                void approvePrize(
                                  resultsId,
                                  row.wallet,
                                  resultsData.tournament?.prizePoolAptc,
                                )
                              }
                              className="text-[10px] px-2 py-1 rounded bg-emerald-600/80 hover:bg-emerald-600 text-white disabled:opacity-50"
                            >
                              Approve prize
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!resultsData.tournament?.rewardsDistributedAt ? (
                <button
                  type="button"
                  disabled={actionId === resultsId}
                  onClick={() => void markAllDistributed(resultsId)}
                  className="mt-4 text-xs px-3 py-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  Mark all prizes distributed
                </button>
              ) : (
                <p className="mt-4 text-xs text-emerald-300">
                  Prizes marked distributed{' '}
                  {new Date(resultsData.tournament.rewardsDistributedAt).toLocaleString()}
                </p>
              )}
            </>
          ) : null}
        </Panel>
      ) : null}
    </div>
  );
}
