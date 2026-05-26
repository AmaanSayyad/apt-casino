import { buildPageMetadata, DEFAULT_DESCRIPTION, SITE_NAME } from '@/lib/siteMetadata';
import { isValidReferralCode } from '@/lib/server/referrals';

export async function generateMetadata({ params }) {
  const { code: raw } = await params;
  const code = raw?.trim().toUpperCase() ?? '';

  if (!isValidReferralCode(code)) {
    return buildPageMetadata();
  }

  return buildPageMetadata({
    title: `Join ${SITE_NAME} — invited by ${code}`,
    description: `You're invited to ${SITE_NAME}. Use code ${code} — provably fair games on Solana & Aptos. Deposit, play, and earn APTC via referrals.`,
    path: `/r/${code}`,
    ogImagePath: `/r/${code}/opengraph-image`,
  });
}

export default function ReferralShortLinkLayout({ children }) {
  return children;
}
