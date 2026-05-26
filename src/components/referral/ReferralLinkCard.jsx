'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { FaCheck, FaCopy, FaExternalLinkAlt } from 'react-icons/fa';

function parseLinkParts(link) {
  if (!link) return null;
  try {
    const u = new URL(link);
    return { host: u.host, path: `${u.pathname}${u.search}`, href: link };
  } catch {
    return { host: '', path: link, href: link };
  }
}

export default function ReferralLinkCard({
  link,
  code,
  copied,
  onCopyLink,
  onCopyMessage,
}) {
  const parts = useMemo(() => parseLinkParts(link), [link]);

  if (!parts) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-fuchsia-500/25 bg-gradient-to-br from-[#1a0015] via-[#0c0009] to-black shadow-[0_0_48px_-16px_rgba(236,72,153,0.4)]">
      <div className="border-b border-white/10 bg-white/[0.03] px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-[140px]">
            <div className="relative h-8 w-8 shrink-0">
              <Image
                src="/referral/referral-logo.png"
                alt="Referral logo"
                fill
                sizes="32px"
                className="rounded-xl border border-white/10 bg-black/40"
              />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-300/90">
              Your invite link
            </p>
          </div>
          {code ? (
            <span className="rounded-full border border-purple-400/35 bg-purple-500/15 px-3 py-1 font-mono text-xs tracking-widest text-purple-100">
              {code}
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <a
          href={parts.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group block rounded-xl border border-white/10 bg-black/55 transition-colors hover:border-fuchsia-500/35 hover:bg-black/70"
        >
          <div className="flex items-start gap-3 px-4 py-3.5 sm:px-5 sm:py-4">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">Share URL</p>
              <p className="mt-1 truncate font-medium text-base text-fuchsia-200/95 sm:text-lg">
                {parts.host}
              </p>
              <p className="mt-0.5 break-all font-mono text-sm leading-snug text-white/90 sm:text-base">
                {parts.path}
              </p>
            </div>
            <span
              className="mt-1 shrink-0 rounded-lg border border-white/10 p-2 text-white/45 transition-colors group-hover:border-white/20 group-hover:text-white/80"
              aria-hidden
            >
              <FaExternalLinkAlt className="h-3.5 w-3.5" />
            </span>
          </div>
        </a>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCopyLink}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-magic to-blue-magic px-5 py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            {copied === 'short' ? (
              <>
                <FaCheck /> Copied link
              </>
            ) : (
              <>
                <FaCopy /> Copy link
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCopyMessage}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/[0.08]"
          >
            {copied === 'message' ? (
              <>
                <FaCheck /> Copied message
              </>
            ) : (
              <>
                <FaCopy /> Copy full hype
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
