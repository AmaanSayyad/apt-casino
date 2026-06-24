'use client';

import { useCallback, useState } from 'react';

export default function ProfileEditModal({ initial, wallet, chain, onClose, onSaved }) {
  const [handle, setHandle] = useState(initial?.handle || '');
  const [bio, setBio] = useState(initial?.bio || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const r = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet,
          chain,
          handle: handle || null,
          bio: bio || null,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(j.error || 'Failed to save profile');
        return;
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('aptcasino-profile-updated'));
      }
      await onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setSaving(false);
    }
  }, [wallet, chain, handle, bio, onSaved, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1A0015] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-xl font-bold text-white">Edit profile</h3>
        <p className="mt-1 text-xs text-white/45">
          Set a display name and bio. Link your X account from the profile card above.
        </p>

        <div className="mt-5 space-y-3">
          <Field label="Display handle (2–24 chars)">
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="satoshi42"
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-purple-400/60"
              maxLength={24}
            />
          </Field>
          <Field label={`Bio (${bio.length}/280)`}>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 280))}
              placeholder="Player on Solana · Aptos"
              rows={3}
              className="w-full resize-none rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-purple-400/60"
            />
          </Field>
        </div>

        {error ? (
          <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="rounded-lg bg-gradient-to-r from-red-magic to-blue-magic px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-white/45">{label}</p>
      {children}
    </label>
  );
}
