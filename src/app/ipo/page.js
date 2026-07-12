import { redirect } from 'next/navigation';

/** IPO launch path retired — $APTC launches on Pump.fun. */
export default function IpoRedirectPage() {
  redirect('/#tokenomics');
}
