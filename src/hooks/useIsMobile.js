'use client';

import { useEffect, useState } from 'react';

/** Matches Tailwind `lg` — mobile-first game ordering below this width. */
const MOBILE_MQ = '(max-width: 1023px)';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isMobile;
}
