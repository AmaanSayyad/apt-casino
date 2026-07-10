'use client';

import Link from 'next/link';

/**
 * Shared full-page shell: breadcrumb, hero, gradient background.
 */
export default function PageShell({
  breadcrumbs = [],
  badge,
  title,
  description,
  descriptionClassName = '',
  children,
  maxWidth = '6xl',
  className = '',
}) {
  const maxW = {
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    '1600': 'max-w-[1600px]',
  }[maxWidth] || 'max-w-6xl';
  const hasHeader = Boolean(badge || title || description);

  return (
    <div
      className={`site-page-top site-page-pad-x min-h-[100dvh] bg-gradient-to-b from-sharp-black via-[#0a0008] to-[#150012] pb-[max(4rem,env(safe-area-inset-bottom))] text-white md:min-h-screen md:pb-16 ${className}`}
    >
      <div className={`${maxW} mx-auto`}>
        {breadcrumbs.length > 0 && (
          <nav className="site-breadcrumb mb-5 flex items-center gap-2 text-sm text-white/45 md:mb-6" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.label} className="flex items-center gap-2">
                {i > 0 && <span className="text-white/25">/</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-white transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-white/75">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        {hasHeader ? (
          <header className="mb-6 md:mb-8">
            {badge && (
              <p className="mb-2 text-[10px] uppercase tracking-[0.35em] text-purple-300/80 md:mb-3">{badge}</p>
            )}
            {title ? (
              <h1 className="font-display text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
                {typeof title === 'string' ? (
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-magic via-fuchsia-400 to-blue-magic">
                    {title}
                  </span>
                ) : (
                  title
                )}
              </h1>
            ) : null}
            {description && (
              <p
                className={`mt-4 text-sm md:text-base text-white/60 leading-relaxed ${
                  descriptionClassName || 'max-w-3xl'
                }`}
              >
                {description}
              </p>
            )}
          </header>
        ) : null}

        {children}
      </div>
    </div>
  );
}

export function PageCard({ children, className = '', gradient = 'from-red-magic/40 to-blue-magic/40' }) {
  return (
    <div className={`p-[1px] bg-gradient-to-r ${gradient} rounded-2xl ${className}`}>
      <div className="bg-[#120010] rounded-2xl p-6 md:p-8 h-full">{children}</div>
    </div>
  );
}

export function SectionHeading({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <h2 className="text-xl font-display font-semibold text-white">{title}</h2>
        </div>
        {subtitle && <p className="text-sm text-white/50 max-w-2xl">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
