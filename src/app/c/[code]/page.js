'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';

/** Coupon short-link landing: /c/CODE -> /profile?coupon=CODE */
export default function CouponShortLinkPage() {
  const params = useParams();
  const code = typeof params?.code === 'string' ? params.code.toUpperCase() : '';

  useEffect(() => {
    const target = code ? `/profile?coupon=${encodeURIComponent(code)}` : '/profile';
    window.location.replace(target);
  }, [code]);

  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center px-6 text-center text-white/80"
      aria-live="polite"
    >
      <p className="text-lg">Taking you to APT Casino…</p>
      {code ? <p className="mt-2 text-sm text-white/50">Coupon {code} loaded.</p> : null}
    </div>
  );
}
