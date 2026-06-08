import KolPortalClient from './KolPortalClient';
import { buildPageMetadata } from '@/lib/siteMetadata';

export const metadata = {
  ...buildPageMetadata({
    title: 'KOL Partner Portal',
    description: 'Private APTC allocation portal for APT Casino partners.',
  }),
  robots: { index: false, follow: false },
};

export default async function KolPortalPage({ params }) {
  const { slug } = await params;
  return (
    <div className="site-page-top site-page-pad-x relative min-h-[100dvh] bg-[#070005] py-10 text-white sm:py-14 md:min-h-screen md:py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-16 left-[10%] h-72 w-72 rounded-full bg-fuchsia-600/12 blur-3xl" />
        <div className="absolute bottom-20 right-[8%] h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/5 blur-3xl" />
      </div>
      <div className="relative z-10">
        <KolPortalClient slug={slug} />
      </div>
    </div>
  );
}
