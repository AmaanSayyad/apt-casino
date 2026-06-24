'use client';

import { useMemo, useState } from 'react';
import {
  resolvePlayerAvatarUrl,
  resolvePlayerDisplayName,
} from '@/lib/xProfile';

/**
 * Player avatar — uses stored URL or X profile photo when handle is linked.
 */
export default function PlayerAvatar({
  avatarUrl,
  twitterHandle,
  handle,
  wallet,
  size = 40,
  className = '',
  rounded = 'rounded-full',
  showInitials = true,
}) {
  const [imgFailed, setImgFailed] = useState(false);

  const src = useMemo(
    () => resolvePlayerAvatarUrl({ avatarUrl, twitterHandle }),
    [avatarUrl, twitterHandle],
  );

  const label = useMemo(
    () =>
      resolvePlayerDisplayName({
        handle,
        twitterHandle,
        avatarUrl,
        wallet,
      }),
    [handle, twitterHandle, avatarUrl, wallet],
  );

  const initials = String(label || '?')
    .replace(/^@/, '')
    .slice(0, 2)
    .toUpperCase();

  const dim = typeof size === 'number' ? `${size}px` : size;
  const showImage = src && !imgFailed;

  return (
    <div
      className={`relative shrink-0 overflow-hidden border border-white/10 bg-gradient-to-br from-red-magic/25 to-blue-magic/25 flex items-center justify-center ${rounded} ${className}`}
      style={{ width: dim, height: dim }}
      title={label}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : showInitials ? (
        <span
          className="font-bold uppercase text-white/85"
          style={{ fontSize: Math.max(10, Math.round(Number.parseInt(String(size), 10) * 0.32) || 12) }}
        >
          {initials}
        </span>
      ) : null}
    </div>
  );
}
