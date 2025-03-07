'use client';

import { useEffect, useState } from 'react';
import { ThemeProvider } from 'next-themes';

/**
 * Mount next-themes only on the client so its inline script is not hydrated
 * against DOM mutated by wallet browser extensions (Leather, Phantom, etc.).
 */
export default function ClientThemeProvider({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return children;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
    </ThemeProvider>
  );
}
