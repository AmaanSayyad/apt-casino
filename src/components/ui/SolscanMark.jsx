'use client';

import { SOLSCAN_LOGO_SRC } from '@/lib/config/solscan';

export { SOLSCAN_LOGO_SRC };

export function SolscanMark({ size = 14, className = '' }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SOLSCAN_LOGO_SRC}
      alt=""
      width={size}
      height={size}
      className={`inline-block shrink-0 rounded-sm object-contain ${className}`}
      aria-hidden
    />
  );
}

/** External Solscan link with logo + label */
export function SolscanLink({
  href,
  children = 'Solscan',
  className = '',
  size = 14,
  title = 'View on Solscan',
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className={`inline-flex items-center gap-1.5 transition-colors ${className}`}
    >
      <SolscanMark size={size} />
      {children ? <span>{children}</span> : null}
    </a>
  );
}
