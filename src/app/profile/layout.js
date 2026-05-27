import { buildPageMetadata } from '@/lib/siteMetadata';

export const metadata = buildPageMetadata({
  title: 'Profile | APT Casino',
  description:
    'Your APT Casino player dashboard — house balance, game stats, deposits, withdrawals, and APTC rewards.',
  path: '/profile',
});

export default function ProfileLayout({ children }) {
  return children;
}
