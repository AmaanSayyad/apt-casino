'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FaCopy, FaExternalLinkAlt, FaFileExport, FaGift, FaPlus, FaSync, FaTrash } from 'react-icons/fa';
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

function toDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addDays(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + Number(days || 0));
  return d;
}

function todayDateString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function localDateKeyFromIso(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Derive URL slug from @handle or raw name. */
function slugFromHandle(raw) {
  const input = String(raw || '').trim().toLowerCase().replace(/^@+/, '');
  const chars = [];
  let prevHyphen = false;
  for (const ch of input) {
    const code = ch.charCodeAt(0);
    const isLower = code >= 97 && code <= 122;
    const isDigit = code >= 48 && code <= 57;
    if (isLower || isDigit) {
      chars.push(ch);
      prevHyphen = false;
      continue;
    }
    if (ch === '-' && !prevHyphen && chars.length > 0) {
      chars.push('-');
      prevHyphen = true;
    }
  }
  while (chars.length > 0 && chars[chars.length - 1] === '-') chars.pop();
  return chars.join('').slice(0, 48);
}

const DEFAULT_PROMOTION = '1 post before and 1 post after token launch';

const DEFAULT_PARTNER_FIELDS = {
  xHandle: '',
  country: '',
  telegram: '',
  avgPostViews: '1000',
  promotionCondition: DEFAULT_PROMOTION,
  broughtBy: '',
  broughtOn: todayDateString(),
};

function freshPartnerFields() {
  return {
    ...DEFAULT_PARTNER_FIELDS,
    broughtOn: todayDateString(),
  };
}

function suggestUnlockPlusDays(allocations, matchDate, plusDays = 4) {
  const sample = allocations.find(
    (row) =>
      row.status !== 'fulfilled' &&
      row.status !== 'revoked' &&
      localDateKeyFromIso(row.unlockAt) === matchDate,
  );
  if (!sample) return '';
  const d = new Date(sample.unlockAt);
  d.setDate(d.getDate() + plusDays);
  return toDatetimeLocal(d.toISOString());
}

function freshCreateForm(defaults) {
  return {
    slug: '',
    slugManuallyEdited: false,
    walletAddress: '',
    amountAptc: String(defaults?.amountAptc ?? ''),
    cliffDays: String(defaults?.cliffDays ?? ''),
    lockDays: String(defaults?.lockDays ?? ''),
    lockedAt: '',
    portalPassword: '',
    autoGeneratePassword: true,
    adminNotes: '',
    ...freshPartnerFields(),
  };
}

function computeSchedulePreview({ lockedAt, cliffDays, lockDays, unlockAt, useExactUnlock }) {
  const start = fromDatetimeLocal(lockedAt);
  if (!start) return null;
  const cliff = addDays(start, Number(cliffDays) || 0);
  const unlock = useExactUnlock
    ? fromDatetimeLocal(unlockAt)
    : addDays(start, Number(lockDays) || 0);
  if (!unlock) return null;
  return { cliffEndsAt: cliff, unlockAt: unlock };
}

const STATUS_BADGE = {
  locked: 'warning',
  ready: 'success',
  fulfilled: 'accent',
  revoked: 'danger',
};

const EMPTY_PARTNER_FIELDS = DEFAULT_PARTNER_FIELDS;

function partnerFieldsFromRow(row) {
  return {
    xHandle: row.xHandle || '',
    country: row.country || '',
    telegram: row.telegram || '',
    avgPostViews: row.avgPostViews != null ? String(row.avgPostViews) : '',
    promotionCondition: row.promotionCondition || '',
    broughtBy: row.broughtBy || '',
    broughtOn: row.broughtOn || '',
  };
}

export default function KolAllocationsAdminPanel({ adminToken }) {
  const [allocations, setAllocations] = useState([]);
  const [defaults, setDefaults] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);
  const [createdCreds, setCreatedCreds] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [detailsId, setDetailsId] = useState(null);
  const [detailsForm, setDetailsForm] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [bulkUnlock, setBulkUnlock] = useState({ matchUnlockDate: '', newUnlockAt: '' });
  const [bulkBusy, setBulkBusy] = useState(false);

  const [form, setForm] = useState(() => freshCreateForm(null));

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

  useEffect(() => {
    if (!defaults) return;
    setForm((f) => ({
      ...f,
      amountAptc: f.amountAptc || String(defaults.amountAptc ?? ''),
      cliffDays: f.cliffDays || String(defaults.cliffDays ?? ''),
      lockDays: f.lockDays || String(defaults.lockDays ?? ''),
    }));
  }, [defaults]);

  const createAllocation = async (e) => {
    e.preventDefault();
    const amountAptc = Number(form.amountAptc);
    const cliffDays = Number(form.cliffDays);
    const lockDays = Number(form.lockDays);
    if (!Number.isFinite(amountAptc) || amountAptc <= 0) {
      alert('Enter a valid APTC allocation amount');
      return;
    }
    if (!Number.isFinite(lockDays) || lockDays < 1) {
      alert('Lock duration must be at least 1 day');
      return;
    }
    if (!Number.isFinite(cliffDays) || cliffDays < 0 || cliffDays > lockDays) {
      alert('Cliff period must be between 0 and the lock duration');
      return;
    }
    setActionId('create');
    setCreatedCreds(null);
    try {
      const r = await fetch('/api/admin/kol-allocations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({
          slug: slugFromHandle(form.slug) || form.slug.trim(),
          walletAddress: form.walletAddress,
          amountAptc: Number(form.amountAptc),
          cliffDays: Number(form.cliffDays),
          lockDays: Number(form.lockDays),
          lockedAt: form.lockedAt ? new Date(form.lockedAt).toISOString() : undefined,
          portalPassword: form.portalPassword,
          autoGeneratePassword: form.autoGeneratePassword,
          adminNotes: form.adminNotes,
          xHandle: form.xHandle,
          country: form.country,
          telegram: form.telegram,
          avgPostViews: form.avgPostViews ? Number(form.avgPostViews) : undefined,
          promotionCondition: form.promotionCondition,
          broughtBy: form.broughtBy,
          broughtOn: form.broughtOn,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Create failed');
      setCreatedCreds({
        slug: j.allocation.slug,
        portalUrl: j.allocation.portalUrl,
        password: j.portalPassword,
      });
      setForm(freshCreateForm(defaults));
      await load();
    } catch (err) {
      alert(err.message || 'Create failed');
    } finally {
      setActionId(null);
    }
  };

  const deleteAllocation = async (row) => {
    const label = row.displayName || row.slug;
    const warn =
      row.status === 'fulfilled'
        ? `Permanently delete "${label}"? This fulfilled allocation will be removed from records.`
        : row.status === 'locked' || row.effectiveStatus === 'locked' || row.effectiveStatus === 'ready'
          ? `Permanently delete "${label}"? Their portal will stop working immediately.`
          : `Permanently delete "${label}"? This cannot be undone.`;
    if (!window.confirm(warn)) return;

    setActionId(row.id);
    try {
      const r = await fetch(`/api/admin/kol-allocations/${row.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken },
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Delete failed');
      await load();
    } catch (err) {
      alert(err.message || 'Delete failed');
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

  const openEditSchedule = (row) => {
    setEditId(row.id);
    setEditForm({
      amountAptc: String(row.amountAptc),
      lockedAt: toDatetimeLocal(row.lockedAt),
      cliffDays: String(row.cliffDays ?? row.lockDays),
      lockDays: String(row.lockDays),
      unlockAt: toDatetimeLocal(row.unlockAt),
      useExactUnlock: false,
    });
  };

  const openEditDetails = (row) => {
    setDetailsId(row.id);
    setDetailsForm(partnerFieldsFromRow(row));
    setEditId(null);
    setEditForm(null);
  };

  const saveEditDetails = async () => {
    if (!detailsForm || !detailsId) return;
    await patchAllocation(detailsId, {
      ...detailsForm,
      avgPostViews: detailsForm.avgPostViews ? Number(detailsForm.avgPostViews) : null,
      broughtOn: detailsForm.broughtOn || null,
    });
    setDetailsId(null);
    setDetailsForm(null);
  };

  const saveEditSchedule = async () => {
    if (!editForm || !editId) return;
    const amountAptc = Number(editForm.amountAptc);
    const cliffDays = Number(editForm.cliffDays);
    const lockDays = Number(editForm.lockDays);
    const lockedAt = fromDatetimeLocal(editForm.lockedAt);
    if (!lockedAt) {
      alert('Enter a valid lock start date/time');
      return;
    }
    if (!Number.isFinite(amountAptc) || amountAptc <= 0) {
      alert('Enter a valid APTC allocation amount');
      return;
    }
    if (!Number.isFinite(lockDays) || lockDays < 1) {
      alert('Lock duration must be at least 1 day');
      return;
    }
    if (!Number.isFinite(cliffDays) || cliffDays < 0 || cliffDays > lockDays) {
      alert('Cliff period must be between 0 and the lock duration');
      return;
    }

    const patch = {
      amountAptc,
      cliffDays,
      lockedAt: lockedAt.toISOString(),
    };

    if (editForm.useExactUnlock) {
      const unlockAt = fromDatetimeLocal(editForm.unlockAt);
      if (!unlockAt || unlockAt <= lockedAt) {
        alert('Unlock time must be after lock start');
        return;
      }
      patch.unlockAt = unlockAt.toISOString();
    } else {
      patch.lockDays = lockDays;
    }

    await patchAllocation(editId, patch);
    setEditId(null);
    setEditForm(null);
  };

  const syncEditUnlockFromDays = (next) => {
    const preview = computeSchedulePreview({ ...next, useExactUnlock: false });
    if (preview) next.unlockAt = toDatetimeLocal(preview.unlockAt.toISOString());
    next.useExactUnlock = false;
    return next;
  };

  const editPreview = editForm ? computeSchedulePreview(editForm) : null;

  const createPreview = computeSchedulePreview({
    lockedAt: form.lockedAt || toDatetimeLocal(new Date().toISOString()),
    cliffDays: form.cliffDays,
    lockDays: form.lockDays,
    unlockAt: '',
    useExactUnlock: false,
  });

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  const applyBulkUnlock = async () => {
    if (!bulkUnlock.newUnlockAt) {
      alert('Pick the new unlock date and time');
      return;
    }
    if (!bulkUnlock.matchUnlockDate) {
      alert('Pick which unlock date to replace');
      return;
    }
    const label = `${bulkMatchCount} KOL${bulkMatchCount === 1 ? '' : 's'}`;
    if (
      !window.confirm(
        `Reschedule unlock to ${fmtDate(new Date(bulkUnlock.newUnlockAt).toISOString())} for ${label} currently unlocking on ${bulkUnlock.matchUnlockDate}?`,
      )
    ) {
      return;
    }
    setBulkBusy(true);
    try {
      const r = await fetch('/api/admin/kol-allocations/bulk-unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({
          newUnlockAt: new Date(bulkUnlock.newUnlockAt).toISOString(),
          matchUnlockDate: bulkUnlock.matchUnlockDate,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Bulk update failed');
      alert(`Updated ${j.updated} KOL unlock date${j.updated === 1 ? '' : 's'} (${j.skipped} skipped).`);
      await load();
    } catch (err) {
      alert(err.message || 'Bulk update failed');
    } finally {
      setBulkBusy(false);
    }
  };

  const exportAllToGoogleSheets = async () => {
    setExporting(true);
    setExportMessage('');
    try {
      const r = await fetch('/api/admin/kol-allocations/export', {
        method: 'POST',
        headers: { 'x-admin-token': adminToken },
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Export failed');

      if (j.mode === 'sheet' && j.sheetUrl) {
        window.open(j.sheetUrl, '_blank', 'noopener,noreferrer');
        setExportMessage(`Exported ${j.rowCount} KOLs to Google Sheets.`);
        return;
      }

      if (j.csv) {
        try {
          await navigator.clipboard.writeText(j.csv);
          window.open('https://sheets.new', '_blank', 'noopener,noreferrer');
          setExportMessage(
            `Copied ${j.rowCount} KOL rows — paste into the new Google Sheet (⌘/Ctrl+V).`,
          );
        } catch {
          const blob = new Blob([j.csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `aptc-kol-allocations-${new Date().toISOString().slice(0, 10)}.csv`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
          window.open('https://sheets.new', '_blank', 'noopener,noreferrer');
          setExportMessage(
            `Downloaded ${j.rowCount} KOL rows as CSV — import into the new Google Sheet (File → Import).`,
          );
        }
        return;
      }

      throw new Error('Export response missing data');
    } catch (err) {
      alert(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const summary = useMemo(() => {
    const total = allocations.reduce((s, a) => s + Number(a.amountAptc || 0), 0);
    return { count: allocations.length, totalAptc: total };
  }, [allocations]);

  const commonUnlockDate = useMemo(() => {
    const counts = {};
    for (const row of allocations) {
      if (row.status === 'fulfilled' || row.status === 'revoked') continue;
      const key = localDateKeyFromIso(row.unlockAt);
      if (!key) continue;
      counts[key] = (counts[key] || 0) + 1;
    }
    let best = '';
    let bestN = 0;
    for (const [k, n] of Object.entries(counts)) {
      if (n > bestN) {
        best = k;
        bestN = n;
      }
    }
    return best ? { date: best, count: bestN } : null;
  }, [allocations]);

  const bulkMatchCount = useMemo(() => {
    if (!bulkUnlock.matchUnlockDate) return 0;
    return allocations.filter((row) => {
      if (row.status === 'fulfilled' || row.status === 'revoked') return false;
      return localDateKeyFromIso(row.unlockAt) === bulkUnlock.matchUnlockDate;
    }).length;
  }, [allocations, bulkUnlock.matchUnlockDate]);

  useEffect(() => {
    if (!commonUnlockDate?.date) return;
    setBulkUnlock((b) => {
      if (b.matchUnlockDate) return b;
      const sample = allocations.find(
        (row) =>
          row.status !== 'fulfilled' &&
          row.status !== 'revoked' &&
          localDateKeyFromIso(row.unlockAt) === commonUnlockDate.date,
      );
      if (!sample) {
        return { matchUnlockDate: commonUnlockDate.date, newUnlockAt: b.newUnlockAt };
      }
      return {
        matchUnlockDate: commonUnlockDate.date,
        newUnlockAt: suggestUnlockPlusDays(allocations, commonUnlockDate.date, 4) || b.newUnlockAt,
      };
    });
  }, [commonUnlockDate, allocations]);

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
            ? `Defaults: ${fmtNum(defaults.amountAptc)} APTC · ${defaults.cliffDays}-day cliff · ${defaults.lockDays}-day lock · portal at /kol/[slug]`
            : 'Partner token allocations with customizable cliff and lock'
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
          <label className="block text-sm md:col-span-2">
            <span className="text-white/60">KOL name</span>
            <input
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
              placeholder="amaanbiz — used in portal URL /kol/amaanbiz"
              value={form.slug}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  slug: e.target.value,
                  slugManuallyEdited: true,
                }))
              }
              required
            />
            <span className="mt-1 block text-[11px] text-white/40">
              Portal URL: /kol/{slugFromHandle(form.slug) || 'name'}
            </span>
          </label>
          <label className="block text-sm">
            <span className="text-white/60">APTC allocation</span>
            <input
              type="number"
              min="1"
              step="1"
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
              placeholder={defaults ? String(defaults.amountAptc) : '1000000'}
              value={form.amountAptc}
              onChange={(e) => setForm((f) => ({ ...f, amountAptc: e.target.value }))}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/60">% of max supply</span>
            <input
              readOnly
              className="mt-1 w-full rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-white/50"
              value={
                form.amountAptc
                  ? `${((Number(form.amountAptc) / 1_000_000_000) * 100).toFixed(4)}%`
                  : '—'
              }
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/60">Cliff period (days)</span>
            <input
              type="number"
              min="0"
              step="1"
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
              placeholder={defaults ? String(defaults.cliffDays) : '14'}
              value={form.cliffDays}
              onChange={(e) => setForm((f) => ({ ...f, cliffDays: e.target.value }))}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/60">Lock duration (days)</span>
            <input
              type="number"
              min="1"
              step="1"
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
              placeholder={defaults ? String(defaults.lockDays) : '14'}
              value={form.lockDays}
              onChange={(e) => setForm((f) => ({ ...f, lockDays: e.target.value }))}
              required
            />
            <span className="mt-1 block text-[11px] text-white/40">Must be ≥ cliff. Unlock date = lock start + lock duration.</span>
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="text-white/60">Lock start (optional)</span>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
              value={form.lockedAt}
              onChange={(e) => setForm((f) => ({ ...f, lockedAt: e.target.value }))}
            />
            <span className="mt-1 block text-[11px] text-white/40">Leave blank to start the lock immediately on create.</span>
          </label>
          {createPreview ? (
            <div className="md:col-span-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/50">
              Preview: cliff ends {fmtDate(createPreview.cliffEndsAt.toISOString())} · unlock{' '}
              {fmtDate(createPreview.unlockAt.toISOString())}
            </div>
          ) : null}
          <div className="md:col-span-2 pt-2 border-t border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-3">
              Partner details (optional)
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm">
                <span className="text-white/60">X</span>
                <input
                  className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                  placeholder="@handle"
                  value={form.xHandle}
                  onChange={(e) => setForm((f) => ({ ...f, xHandle: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="text-white/60">Country</span>
                <input
                  className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                  placeholder="United States"
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="text-white/60">Tg</span>
                <input
                  className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                  placeholder="@username"
                  value={form.telegram}
                  onChange={(e) => {
                    const telegram = e.target.value;
                    setForm((f) => {
                      const next = { ...f, telegram };
                      if (!f.slugManuallyEdited) {
                        const fromTg = slugFromHandle(telegram);
                        if (fromTg) next.slug = fromTg;
                      }
                      return next;
                    });
                  }}
                />
              </label>
              <label className="block text-sm">
                <span className="text-white/60">Avg post views</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                  placeholder="1000"
                  value={form.avgPostViews}
                  onChange={(e) => setForm((f) => ({ ...f, avgPostViews: e.target.value }))}
                />
              </label>
              <label className="block text-sm md:col-span-2">
                <span className="text-white/60">Promotion condition</span>
                <textarea
                  className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 min-h-[72px]"
                  placeholder={DEFAULT_PROMOTION}
                  value={form.promotionCondition}
                  onChange={(e) => setForm((f) => ({ ...f, promotionCondition: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="text-white/60">Brought by</span>
                <input
                  className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                  placeholder="Referrer or team member"
                  value={form.broughtBy}
                  onChange={(e) => setForm((f) => ({ ...f, broughtBy: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="text-white/60">Brought on</span>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                  value={form.broughtOn}
                  onChange={(e) => setForm((f) => ({ ...f, broughtOn: e.target.value }))}
                />
              </label>
            </div>
          </div>
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

      {allocations.length > 0 ? (
        <Panel className="border-amber-500/25 bg-amber-950/10">
          <p className="text-sm font-medium text-amber-100 mb-1">Bulk reschedule unlock</p>
          <p className="text-xs text-white/45 mb-4">
            Move every KOL that unlocks on one date to a new unlock date in one click.
            {commonUnlockDate
              ? ` Most common unlock date: ${commonUnlockDate.date} (${commonUnlockDate.count} KOLs).`
              : ''}
          </p>
          <div className="flex flex-wrap gap-4 items-end">
            <label className="block text-sm">
              <span className="text-white/60">Only KOLs unlocking on</span>
              <input
                type="date"
                className="mt-1 block rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                value={bulkUnlock.matchUnlockDate}
                onChange={(e) => {
                  const matchUnlockDate = e.target.value;
                  setBulkUnlock((b) => ({
                    matchUnlockDate,
                    newUnlockAt:
                      suggestUnlockPlusDays(allocations, matchUnlockDate, 4) || b.newUnlockAt,
                  }));
                }}
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/60">New unlock date &amp; time</span>
              <input
                type="datetime-local"
                className="mt-1 block rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                value={bulkUnlock.newUnlockAt}
                onChange={(e) => setBulkUnlock((b) => ({ ...b, newUnlockAt: e.target.value }))}
              />
            </label>
            <button
              type="button"
              disabled={bulkBusy || bulkMatchCount === 0}
              onClick={() => void applyBulkUnlock()}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Apply to {bulkMatchCount || 0} KOL{bulkMatchCount === 1 ? '' : 's'}
            </button>
          </div>
        </Panel>
      ) : null}

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
        <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
          <button
            type="button"
            disabled={exporting}
            onClick={() => void exportAllToGoogleSheets()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-50"
          >
            <FaFileExport className={exporting ? 'animate-pulse' : ''} />
            {exporting ? 'Exporting…' : 'Export all to Google Sheets'}
          </button>
          <span>{summary.count} KOLs · {fmtNum(summary.totalAptc)} APTC allocated</span>
          <button type="button" onClick={() => load()} className="text-white/70 hover:text-white">
            <FaSync className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {exportMessage ? <p className="text-emerald-300 text-sm">{exportMessage}</p> : null}
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
                  </div>
                  <p className="text-sm text-white/60 mt-1">
                    {fmtNum(row.amountAptc)} APTC ({row.pctOfSupply}% supply) · cliff {row.cliffDays}d · lock {row.lockDays}d · wallet {short(row.walletAddress)}
                  </p>
                  <p className="text-xs text-white/45 mt-1">
                    Locked {fmtDate(row.lockedAt)} → cliff ends {fmtDate(row.cliffEndsAt)} → unlock {fmtDate(row.unlockAt)}
                    {row.effectiveStatus === 'locked' ? ` · ${countdownLabel(row.unlockAt)} left` : ''}
                  </p>
                  {row.xHandle || row.country || row.telegram || row.avgPostViews != null || row.promotionCondition || row.broughtBy || row.broughtOn ? (
                    <p className="text-xs text-white/45 mt-2 leading-relaxed">
                      {row.xHandle ? <span className="mr-3">X: {row.xHandle}</span> : null}
                      {row.country ? <span className="mr-3">{row.country}</span> : null}
                      {row.telegram ? <span className="mr-3">Tg: {row.telegram}</span> : null}
                      {row.avgPostViews != null ? (
                        <span className="mr-3">Avg views: {fmtNum(row.avgPostViews)}</span>
                      ) : null}
                      {row.broughtBy ? <span className="mr-3">Brought by: {row.broughtBy}</span> : null}
                      {row.broughtOn ? <span className="mr-3">Brought on: {row.broughtOn}</span> : null}
                    </p>
                  ) : null}
                  {row.promotionCondition ? (
                    <p className="text-xs text-white/40 mt-1">Promotion: {row.promotionCondition}</p>
                  ) : null}
                  <p className="text-xs text-white/45 mt-1 flex flex-wrap items-center gap-2">
                    <span>Portal password:</span>
                    {row.portalPassword ? (
                      <>
                        <span className="font-mono text-white/75">{row.portalPassword}</span>
                        <button
                          type="button"
                          className="text-white/40 hover:text-white"
                          onClick={() => copyText(row.portalPassword)}
                          title="Copy password"
                        >
                          <FaCopy />
                        </button>
                      </>
                    ) : (
                      <span className="text-white/30 italic">
                        Not on file — use Reset password to set and store
                      </span>
                    )}
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
                    className={`text-xs px-2 py-1 rounded border hover:bg-white/5 ${
                      detailsId === row.id ? 'border-violet-400/50 bg-violet-500/10 text-white' : 'border-white/15'
                    }`}
                    onClick={() =>
                      detailsId === row.id
                        ? (setDetailsId(null), setDetailsForm(null))
                        : openEditDetails(row)
                    }
                  >
                    {detailsId === row.id ? 'Close details' : 'Edit details'}
                  </button>
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
                  {row.status !== 'fulfilled' && row.status !== 'revoked' ? (
                    <button
                      type="button"
                      className={`text-xs px-2 py-1 rounded border hover:bg-white/5 ${
                        editId === row.id ? 'border-violet-400/50 bg-violet-500/10 text-white' : 'border-white/15'
                      }`}
                      onClick={() => {
                        if (editId === row.id) {
                          setEditId(null);
                          setEditForm(null);
                        } else {
                          setDetailsId(null);
                          setDetailsForm(null);
                          openEditSchedule(row);
                        }
                      }}
                    >
                      {editId === row.id ? 'Close editor' : 'Edit schedule'}
                    </button>
                  ) : null}
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
                  <button
                    type="button"
                    disabled={actionId === row.id}
                    className="text-xs px-2 py-1 rounded border border-rose-500/50 text-rose-300 hover:bg-rose-500/15 inline-flex items-center gap-1 disabled:opacity-50"
                    onClick={() => deleteAllocation(row)}
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>

              {detailsId === row.id && detailsForm ? (
                <div className="mt-4 rounded-xl border border-cyan-500/25 bg-cyan-950/10 p-4">
                  <p className="text-sm font-medium text-white mb-3">Partner details</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block text-sm">
                      <span className="text-white/60">X</span>
                      <input
                        className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                        value={detailsForm.xHandle}
                        onChange={(e) => setDetailsForm((f) => ({ ...f, xHandle: e.target.value }))}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-white/60">Country</span>
                      <input
                        className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                        value={detailsForm.country}
                        onChange={(e) => setDetailsForm((f) => ({ ...f, country: e.target.value }))}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-white/60">Tg</span>
                      <input
                        className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                        value={detailsForm.telegram}
                        onChange={(e) => setDetailsForm((f) => ({ ...f, telegram: e.target.value }))}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-white/60">Avg post views</span>
                      <input
                        type="number"
                        min="0"
                        className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                        value={detailsForm.avgPostViews}
                        onChange={(e) => setDetailsForm((f) => ({ ...f, avgPostViews: e.target.value }))}
                      />
                    </label>
                    <label className="block text-sm md:col-span-2">
                      <span className="text-white/60">Promotion condition</span>
                      <textarea
                        className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 min-h-[72px]"
                        value={detailsForm.promotionCondition}
                        onChange={(e) => setDetailsForm((f) => ({ ...f, promotionCondition: e.target.value }))}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-white/60">Brought by</span>
                      <input
                        className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                        value={detailsForm.broughtBy}
                        onChange={(e) => setDetailsForm((f) => ({ ...f, broughtBy: e.target.value }))}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-white/60">Brought on</span>
                      <input
                        type="date"
                        className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                        value={detailsForm.broughtOn}
                        onChange={(e) => setDetailsForm((f) => ({ ...f, broughtOn: e.target.value }))}
                      />
                    </label>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={actionId === row.id}
                      onClick={() => saveEditDetails()}
                      className="text-xs px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50"
                    >
                      Save details
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDetailsId(null);
                        setDetailsForm(null);
                      }}
                      className="text-xs px-3 py-1.5 rounded border border-white/15 text-white/70 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}

              {editId === row.id && editForm ? (
                <div className="mt-4 rounded-xl border border-violet-500/25 bg-violet-950/15 p-4">
                  <p className="text-sm font-medium text-white mb-3">Edit allocation & schedule</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block text-sm md:col-span-2">
                      <span className="text-white/60">APTC allocation</span>
                      <input
                        type="number"
                        min="1"
                        className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                        value={editForm.amountAptc}
                        onChange={(e) => setEditForm((f) => ({ ...f, amountAptc: e.target.value }))}
                      />
                    </label>
                    <label className="block text-sm md:col-span-2">
                      <span className="text-white/60">Lock started</span>
                      <input
                        type="datetime-local"
                        className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                        value={editForm.lockedAt}
                        onChange={(e) =>
                          setEditForm((f) => syncEditUnlockFromDays({ ...f, lockedAt: e.target.value }))
                        }
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-white/60">Cliff period (days)</span>
                      <input
                        type="number"
                        min="0"
                        className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                        value={editForm.cliffDays}
                        onChange={(e) => setEditForm((f) => ({ ...f, cliffDays: e.target.value }))}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-white/60">Lock duration (days)</span>
                      <input
                        type="number"
                        min="1"
                        disabled={editForm.useExactUnlock}
                        className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 disabled:opacity-50"
                        value={editForm.lockDays}
                        onChange={(e) =>
                          setEditForm((f) => syncEditUnlockFromDays({ ...f, lockDays: e.target.value }))
                        }
                      />
                    </label>
                    <label className="block text-sm md:col-span-2">
                      <span className="text-white/60">Unlock at (exact time)</span>
                      <input
                        type="datetime-local"
                        className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                        value={editForm.unlockAt}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            unlockAt: e.target.value,
                            useExactUnlock: true,
                          }))
                        }
                      />
                      <span className="mt-1 block text-[11px] text-white/40">
                        Edit this to set an exact unlock datetime. Otherwise lock duration (days) is used.
                      </span>
                    </label>
                    {editPreview ? (
                      <div className="md:col-span-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/55">
                        Cliff ends {fmtDate(editPreview.cliffEndsAt.toISOString())} · Unlock{' '}
                        {fmtDate(editPreview.unlockAt.toISOString())}
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={actionId === row.id}
                      onClick={() => saveEditSchedule()}
                      className="text-xs px-3 py-1.5 rounded bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50"
                    >
                      Save schedule
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditId(null);
                        setEditForm(null);
                      }}
                      className="text-xs px-3 py-1.5 rounded border border-white/15 text-white/70 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
