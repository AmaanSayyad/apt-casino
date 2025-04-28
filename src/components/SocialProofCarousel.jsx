'use client';

import { motion } from 'framer-motion';

/** Single advisor reveal — blurred teaser (matches Bynomo landing pattern). */
const ADVISOR_IMAGE = '/Lucas Advisor.JPG';
const ADVISOR_ALT = 'Confirmed advisor — BNB Chain ecosystem';

export default function SocialProofCarousel() {
  return (
    <div className="relative z-10 w-full max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="apt-social-card overflow-hidden rounded-2xl md:rounded-3xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ADVISOR_IMAGE}
            alt={ADVISOR_ALT}
            className="apt-advisor-photo w-full h-auto block"
            style={{ filter: 'blur(8px)', transform: 'scale(1.05)' }}
          />
          <div className="apt-social-badge">
            <span className="apt-social-badge-dot" />
            Confirmed
          </div>
        </div>
      </motion.div>
    </div>
  );
}
