import { redirect } from 'next/navigation';

/** IPO launch path retired — $APTC launches via Virtuals Protocol on Robinhood Chain. */
export default function IpoRedirectPage() {
  redirect('/#tokenomics');
}
