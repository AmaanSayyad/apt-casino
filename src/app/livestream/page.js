import { redirect } from 'next/navigation';

/** Alias: streaming UI lives at `/live`. */
export default function LivestreamPage() {
  redirect('/live');
}
