import { redirect } from 'next/navigation';

// Backwards compatibility: the page was renamed from /rewards to /referral.
// Keep this redirect so externally-shared bookmarks and tweets keep working.
export default function RewardsRedirect() {
  redirect('/referral');
}
