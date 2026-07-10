'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const STORAGE_KEY = 'apt_casino_ipo_ref';
const ADDR_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function readStored(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)?.trim();
    return v && ADDR_RE.test(v) ? v : null;
  } catch {
    return null;
  }
}

function writeStored(addr: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, addr);
  } catch {
    /* ignore */
  }
}

export function getStoredIpoReferrer(): string | null {
  return readStored();
}

/** Capture ?ref=WALLET for IPO 3-level affiliate attribution */
export default function IpoRefCapture() {
  const params = useSearchParams();

  useEffect(() => {
    const ref = params.get('ref')?.trim();
    if (!ref || !ADDR_RE.test(ref)) return;
    writeStored(ref);
  }, [params]);

  return null;
}

export function useIpoReferrerWallet() {
  return readStored();
}
