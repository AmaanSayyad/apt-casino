'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FaExternalLinkAlt, FaPlus, FaSync } from 'react-icons/fa';
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

      const r = await fetch('/api/admin/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({
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
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Create failed');
      setSuccess(`Created “${j.tournament?.name}”. It will appear on ${j.tournament?.competitionMode === 'volume' ? '/competition' : 'the homepage'} when live.`);
      setForm(defaultForm());
      await load();
    } catch (err) {
      setError(err.message || 'Create failed');
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
            <h3 className="text-lg font-semibold text-white">Create contest</h3>
            <p className="text-xs text-white/50 mt-1">
              Volume Cup → <code className="text-violet-200/80">/competition</code> · Registration events → homepage
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm(defaultForm())}
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
            <span className="text-xs uppercase tracking-wide text-white/50">Prize pool (APT label)</span>
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
            <span className="text-xs uppercase tracking-wide text-white/50">Entry fee</span>
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
              {saving ? 'Creating…' : 'Create contest'}
            </button>
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
                      {t.maxParticipants} registered · pool {t.prizePoolApt} APT
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
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
    </div>
  );
}
