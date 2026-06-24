'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import GradientBorderButton from './GradientBorderButton';
import { PITCH_DECK_URL } from '@/lib/pitchDeck';
import { LITEPAPER_PATH } from '@/lib/siteMetadata';
import { GRANT_RECIPIENT_LINE, HACKATHON_WINNER_LABEL } from '@/lib/config/socialCredentials';
import { FaLock, FaShieldAlt } from 'react-icons/fa';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribeError, setSubscribeError] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const socialLinks = [
    { name: 'X (Twitter)', url: 'https://x.com/aptcasinofun', icon: '/icons/twitter.svg' },
    { name: 'Telegram', url: 'https://t.me/apt_casino', icon: '/icons/telegram.svg' },
    { name: 'Discord', url: 'https://discord.gg/8dhBmbgMke', icon: '/icons/discord.svg' },
    { name: 'GitHub', url: 'https://github.com/AmaanSayyad/apt-casino', icon: '/icons/github.svg' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/company/apt-casino', icon: '/icons/linkedin.svg' },
  ];

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Games', path: '/game' },
    { name: 'Live', path: '/live' },
    { name: 'Referrals', path: '/referral' },
    { name: 'Stake', path: '/stake' },
    { name: 'Profile', path: '/profile' },
    { name: 'Leaderboard', path: '/leaderboard' },
    { name: 'OTC Lottery', path: '/otc-lottery' },
    { name: 'Litepaper', path: LITEPAPER_PATH },
    { name: 'Pitch deck', path: PITCH_DECK_URL, external: true },
  ];

  const handleSubscribe = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setSubscribing(true);
    setSubscribeError('');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, source: 'footer' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Subscription failed');
      }
      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 3500);
    } catch (err) {
      setSubscribeError(err.message || 'Subscription failed');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer
      id="footer"
      className="relative overflow-hidden border-t border-white/10 bg-[#07030a] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-5 text-white sm:pt-6 sm:pb-4"
    >
      <div className="absolute -top-20 -left-20 h-60 w-60 rounded-full bg-red-magic/10 blur-[100px]" />
      <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-blue-magic/10 blur-[100px]" />
      <div className="mb-4 h-px w-full bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent" />

      <div className="site-page-pad-x mx-auto grid max-w-[1480px] grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-4">
          <Link href="/" className="inline-block transition-transform hover:scale-[1.02]">
            <Image src="/PowerPlay.png" alt="APT-Casino logo" width={172} height={15} />
          </Link>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-white/65">
            Multichain GambleFi on Solana and Aptos with provably fair play and creator rewards.{' '}
            {HACKATHON_WINNER_LABEL}. {GRANT_RECIPIENT_LINE}.
          </p>

          <div className="mt-3 flex items-center gap-2">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10"
              >
                <Image src={social.icon} alt={social.name} width={16} height={16} className="invert" />
              </a>
            ))}
          </div>

        </div>

        <div className="lg:col-span-3">
          <div className="mb-2 flex items-center">
            <div className="mr-2 h-4 w-1 rounded-full magic-gradient" />
            <h3 className="font-display text-lg">Navigation</h3>
          </div>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {navLinks.map(({ name, path, external }) => (
              <li key={path}>
                {external ? (
                  <a
                    href={path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white/65 transition hover:text-white"
                  >
                    {name}
                  </a>
                ) : (
                  <Link href={path} className="text-xs text-white/65 transition hover:text-white">
                    {name}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-3 border-t border-white/10 pt-2">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-white/90">
              <FaShieldAlt className="text-emerald-400" /> Security & Trust
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/75">
                <FaLock className="text-emerald-400" /> SSL Secured
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/75">
                <FaShieldAlt className="text-blue-magic" /> Provably Fair
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="mb-2 flex items-center">
            <div className="mr-2 h-4 w-1 rounded-full magic-gradient" />
            <h3 className="font-display text-lg">Stay Updated</h3>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#120818]/80 p-3">
            <p className="mb-2 text-xs text-white/65">
              Subscribe for product updates, new earning campaigns, and game launches.
            </p>

            <form onSubmit={handleSubscribe}>
              <div className="mb-1.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="email"
                  id="newsletter-email"
                  name="email"
                  autoComplete="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (subscribeError) setSubscribeError('');
                  }}
                  disabled={subscribing}
                  className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-1.5 text-sm focus:border-blue-magic focus:outline-none disabled:opacity-60"
                  required
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Subscribe to newsletter"
                >
                  <GradientBorderButton>{subscribing ? 'Sending...' : 'Subscribe'}</GradientBorderButton>
                </button>
              </div>
              <div className="min-h-[1.25rem] text-xs">
                {isSubscribed && <span className="text-emerald-400">Thanks - you are on the list.</span>}
                {subscribeError && <span className="text-red-400">{subscribeError}</span>}
              </div>
            </form>

            <div className="mt-2.5">
              <Link href="/game" className="inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white magic-gradient hover:opacity-90">
                Launch Game
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="site-page-pad-x mx-auto mt-4 max-w-[1480px]">
        <div className="mb-2 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div className="flex flex-col items-center justify-between gap-2 text-center text-sm text-white/45 md:flex-row md:text-left">
          <p>© {new Date().getFullYear()} APT-Casino. All rights reserved.</p>
          <p className="text-xs text-white/35">
            Play responsibly. 
          </p>
        </div>
      </div>
    </footer>
  );
}
