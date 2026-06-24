'use client';

import { useCallback, useEffect, useState } from 'react';
import { FaXTwitter } from 'react-icons/fa6';
import { FaExternalLinkAlt } from 'react-icons/fa';
import PlayerAvatar from '@/components/PlayerAvatar';
import { normalizeTwitterHandle, resolveLinkedTwitterHandle } from '@/lib/xProfile';

export default function XProfileConnect({
  wallet,
  chain,
  twitterHandle,
  displayHandle,
  avatarUrl,
  demoMode,
  onSaved,
}) {
  const linkedHandle = resolveLinkedTwitterHandle({ twitterHandle, avatarUrl });
  const [input, setInput] = useState(linkedHandle || '');
  const [editing, setEditing] = useState(!linkedHandle);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setInput(linkedHandle || '');
    setEditing(!linkedHandle);
  }, [linkedHandle]);

  const save = useCallback(
    async (handleValue) => {
      if (demoMode) return;
      setSaving(true);
      setError(null);
      try {
        const normalized = handleValue ? normalizeTwitterHandle(handleValue) : null;
        if (handleValue && !normalized) {
          setError('Enter a valid X username (letters, numbers, underscore).');
          return;
        }
        const r = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet,
            chain,
            twitterHandle: normalized,
          }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) {
          setError(j.error || 'Failed to save X profile');
          return;
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('aptcasino-profile-updated'));
        }
        await onSaved?.();
        setEditing(!normalized);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Network error');
      } finally {
        setSaving(false);
      }
    },
    [wallet, chain, demoMode, onSaved],
  );

  const disconnect = () => save(null);

  if (demoMode) {
    return (
      <div className="w-full rounded-xl border border-white/10 bg-black/30 p-3 lg:min-w-[220px]">
        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
          <FaXTwitter className="text-sky-400/60" /> X profile
        </p>
        <p className="mt-2 text-xs text-white/45">Turn off Demo to link your X account.</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-sky-500/20 bg-gradient-to-br from-sky-950/40 to-black/40 p-3 lg:min-w-[240px]">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-sky-300/80">
        <FaXTwitter className="text-sky-400" /> X profile
      </p>

      {linkedHandle && !editing ? (
        <div className="mt-3 flex items-center gap-3">
          <PlayerAvatar
            avatarUrl={avatarUrl}
            twitterHandle={linkedHandle}
            handle={displayHandle}
            wallet={wallet}
            size={40}
            rounded="rounded-lg"
          />
          <div className="min-w-0 flex-1">
            <a
              href={`https://x.com/${linkedHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 truncate text-sm font-semibold text-white hover:text-sky-300"
            >
              @{linkedHandle}
              <FaExternalLinkAlt className="shrink-0 text-[9px] text-white/40" />
            </a>
            <p className="mt-0.5 text-[10px] text-white/40">Shown on leaderboard &amp; games</p>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/40">@</span>
            <input
              value={input}
              onChange={(e) => {
                setInput(e.target.value.replace(/^@/, ''));
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void save(input);
              }}
              placeholder="username"
              maxLength={15}
              disabled={saving}
              className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/50 disabled:opacity-60"
            />
          </div>
          <p className="mt-1.5 text-[10px] text-white/40">
            Your X photo appears on the leaderboard and across the site.
          </p>
        </div>
      )}

      {error ? (
        <p className="mt-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-300">
          {error}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {linkedHandle && !editing ? (
          <>
            <button
              type="button"
              onClick={() => {
                setInput(linkedHandle);
                setEditing(true);
              }}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10"
            >
              Change
            </button>
            <button
              type="button"
              onClick={disconnect}
              disabled={saving}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/45 hover:text-rose-300 hover:border-rose-500/30 disabled:opacity-50"
            >
              Disconnect
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => save(input)}
              disabled={saving || !input.trim()}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-sky-500 px-3 py-2 text-xs font-bold text-white hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaXTwitter />
              {saving ? 'Connecting…' : linkedHandle ? 'Update' : 'Connect X'}
            </button>
            {linkedHandle ? (
              <button
                type="button"
                onClick={() => {
                  setInput(linkedHandle);
                  setEditing(false);
                  setError(null);
                }}
                disabled={saving}
                className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/60 hover:bg-white/5"
              >
                Cancel
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
