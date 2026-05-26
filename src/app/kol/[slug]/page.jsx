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
    <div className="site-page-top site-page-pad-x min-h-[100dvh] bg-[#070005] py-12 text-white md:min-h-screen md:py-16">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-fuchsia-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10">
        <KolPortalClient slug={slug} />
      </div>
    </div>
  );
}
