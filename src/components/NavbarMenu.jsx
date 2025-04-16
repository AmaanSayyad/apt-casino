'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const MENU_LINKS = [
  { label: 'Leaderboard', href: '/leaderboard', accent: 'bg-yellow-500' },
  { label: 'Volume Cup', href: '/competition', accent: 'bg-orange-500' },
  { label: 'Referrals', href: '/referral', accent: 'bg-emerald-500' },
  { label: 'Stake', href: '/stake', accent: 'bg-blue-500' },
  { label: 'OTC Lottery', href: '/otc-lottery', accent: 'bg-fuchsia-500' },
  { label: 'Profile', href: '/profile', accent: 'bg-purple-500' },
];

export default function NavbarMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    const onOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  return (
    <div className="relative hidden lg:block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-full transition-all active:scale-95 group"
      >
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">
          More
        </span>
        <div className="flex flex-col gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
          <div className="w-3 h-px bg-white" />
          <div className="w-2 h-px bg-white" />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute top-full right-0 z-[110] mt-2 w-56 overflow-hidden rounded-2xl border border-white/5 bg-black/90 shadow-2xl backdrop-blur-xl"
          >
            <div className="p-2 space-y-0.5">
              {MENU_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-all group ${
                    pathname === item.href ? 'bg-white/5' : ''
                  }`}
                >
                  <div className={`w-0.5 h-4 rounded-full ${item.accent} opacity-60 group-hover:opacity-100`} />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white/85 group-hover:text-white">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
