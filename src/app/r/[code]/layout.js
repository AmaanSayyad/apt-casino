import { buildPageMetadata, DEFAULT_DESCRIPTION, SITE_NAME } from '@/lib/siteMetadata';
import { isValidReferralCode } from '@/lib/server/referrals';

export async function generateMetadata({ params }) {
  const { code: raw } = await params;
  const code = raw?.trim().toUpperCase() ?? '';

  if (!isValidReferralCode(code)) {
    return buildPageMetadata();
  }

  return buildPageMetadata({
    title: `Join ${SITE_NAME} — referral ${code}`,
    description: `You were invited to ${SITE_NAME}. ${DEFAULT_DESCRIPTION}`,
    path: `/r/${code}`,
  });
}

export default function ReferralShortLinkLayout({ children }) {
  return children;
}
