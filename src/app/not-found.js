import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="site-page-top site-page-pad-x min-h-[60vh] flex flex-col items-center justify-center text-center text-white px-4">
      <p className="text-sm uppercase tracking-widest text-fuchsia-300/80 mb-2">404</p>
      <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">Page not found</h1>
      <p className="text-white/60 max-w-md mb-8">
        This route does not exist or may have moved. Use the links below to get back on track.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/"
          className="px-5 py-2.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400"
        >
          Home
        </Link>
        <Link
          href="/game"
          className="px-5 py-2.5 rounded-lg border border-white/20 hover:bg-white/5 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
        >
          Games
        </Link>
        <Link
          href="/live"
          className="px-5 py-2.5 rounded-lg border border-white/20 hover:bg-white/5 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
        >
          Live
        </Link>
      </div>
    </div>
  );
}
