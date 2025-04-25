'use client';

import { useEffect, useRef } from 'react';
import { usePlayWallet } from '@/hooks/usePlayWallet';

const STORAGE_KEY = 'apt_casino_ref';
const COOKIE_KEY = 'apt_casino_ref';
const CODE_RE = /^[A-Z2-9]{8}$/;

function readCookieCode(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]*)`));
  if (!match?.[1]) return null;
  try {
    const v = decodeURIComponent(match[1]).trim().toUpperCase();
    return CODE_RE.test(v) ? v : null;
  } catch {
    return null;
  }
}

/** Prefer localStorage; fall back to cookie (set by `/r/[code]` redirect). */
function readStored(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v) {
      const up = v.trim().toUpperCase();
      if (CODE_RE.test(up)) return up;
    }
  } catch {
    /* ignore */
  }
  return readCookieCode();
}

function writeStored(code: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* ignore */
  }
  try {
    // 90-day cookie so we can still attribute if the user installs/connects later.
    document.cookie = `${COOKIE_KEY}=${encodeURIComponent(code)}; path=/; max-age=${60 * 60 * 24 * 90}; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

function clearStored() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  try {
    document.cookie = `${COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

/**
 * Mounted once at the root. Three jobs:
 *   1. If the URL has `?ref=CODE`, persist it (localStorage + cookie) so we
 *      can attribute later even if the user closes the tab before connecting.
 *   2. If the user arrived via `/r/CODE`, the server set `apt_casino_ref` — mirror
 *      cookie → localStorage on first paint so attribution works the same.
 *   3. When a wallet connects, POST the stored code to /api/referrals/attribute
 *      exactly once. The endpoint is idempotent for the same referee wallet.
 */
export default function ReferralCapture() {
  const { connected, address, chain } = usePlayWallet();
  const attributedFor = useRef<string | null>(null);

  // 1. Capture ?ref=
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      const raw = url.searchParams.get('ref');
      if (!raw) return;
      const code = raw.trim().toUpperCase();
      if (!CODE_RE.test(code)) return;
      writeStored(code);
      // Strip ?ref= from the visible URL without reloading.
      url.searchParams.delete('ref');
      const next = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState({}, '', next || '/');
    } catch {
      /* ignore */
    }
  }, []);

  // 2. Mirror cookie → localStorage (e.g. after `/r/CODE` redirect)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fromCookie = readCookieCode();
    if (!fromCookie) return;
    try {
      const existing = window.localStorage.getItem(STORAGE_KEY);
      if (!existing || !CODE_RE.test(existing.trim().toUpperCase())) {
        writeStored(fromCookie);
      }
    } catch {
      writeStored(fromCookie);
    }
  }, []);

  // 3. Attribute on wallet connect
  useEffect(() => {
    if (!connected || !address) return;
    if (attributedFor.current === address) return;

    const code = readStored();
    if (!code) return;

    attributedFor.current = address;

    (async () => {
      try {
        const res = await fetch('/api/referrals/attribute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            refereeWallet: address,
            chain,
            source: 'wallet_connect',
          }),
        });
        if (res.ok || res.status === 404 || res.status === 400) {
          // Clear regardless of "already attributed" / unknown code so we don't retry forever.
          clearStored();
        }
      } catch {
        // Network blip — keep the code stored and let a later mount retry.
        attributedFor.current = null;
      }
    })();
  }, [connected, address, chain]);

  return null;
}
