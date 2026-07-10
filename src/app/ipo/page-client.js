'use client';

import { Suspense } from 'react';
import PageShell from '@/components/layout/PageShell';
import IpoPurchasePanel from '@/components/IpoPurchasePanel';
import IpoRefCapture from '@/components/IpoRefCapture';
import IpoSubhead from '@/components/IpoSubhead';
import IpoStackLogos from '@/components/IpoStackLogos';
import { IPO_COPY, IPO_SALE, APTC_LOGO_SRC } from '@/lib/config/ipo';

export default function IpoPageClient() {
  return (
    <PageShell maxWidth="1600">
      <Suspense fallback={null}>
        <IpoRefCapture />
      </Suspense>

      <div className="w-full pb-8 md:pb-10">
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={APTC_LOGO_SRC}
              alt="APTC"
              className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/10"
            />
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/45 mb-1">
                Powered by {IPO_SALE.poweredBy} · on Solana
              </p>
              <h1 className="text-3xl md:text-4xl font-bold font-display text-white tracking-tight">
                {IPO_COPY.headline}
              </h1>
            </div>
          </div>
          <IpoSubhead className="mt-2" alignWithTitle />
          <IpoStackLogos className="mt-5" />
        </div>

        <IpoPurchasePanel showBanner showFullPageCta={false} />
      </div>
    </PageShell>
  );
}
