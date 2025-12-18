'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';

/** Referral short link landing — OG tags come from layout; users redirect to home. */
export default function ReferralShortLinkPage() {
  const params = useParams();
  const code = typeof params?.code === 'string' ? params.code : '';

  useEffect(() => {
    window.location.replace('/');
  }, []);

  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center px-6 text-center text-white/80"
      aria-live="polite"
    >
      <p className="text-lg">Taking you to APT Casino…</p>
      {code ? (
        <p className="mt-2 text-sm text-white/50">Referral {code.toUpperCase()} saved.</p>
      ) : null}
    </div>
  );
}
