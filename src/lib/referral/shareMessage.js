/**
 * Referral broadcast copy — X, Telegram, WhatsApp, clipboard.
 */

export function getReferralBroadcastBody() {
    return [
    'Craziest thing I have ever seen, @aptcasinofun on @solana x @aptos',
    '',
    '50:50 chance casino in the world, first time, fair roulette/mines/plinko/spin wheel like @stake',
    '',
    'literally money making machine, they are sharing their earnings with you, just by sharing the referral link with your friends, you earn 20% of their revenue',
    '',
    '14d cliff OR unlocks early when the referee hits the $100 volume milestone, literal side income for us',
    '',
    'i\'m not gatekeeping the ref link. ape in ↓',
  ].join('\n');
}

/** Full paste-ready message with link once at the bottom. */
export function getReferralBroadcastMessage(link) {
  if (!link) return getReferralBroadcastBody();
  return `${getReferralBroadcastBody()}\n${link}`;
}

/** Shorter body for X (link appended by tweet intent `url` param — no duplicate). */
/** LinkedIn post body (paste after share opens — preview comes from /r/CODE OG tags). */
export function getReferralLinkedInPost(link) {
  if (!link) return getReferralBroadcastBody();
  return `${getReferralBroadcastBody()}\n\n${link}`;
}

export function getReferralTweetText() {
    return [
    'Craziest thing I have ever seen, @aptcasinofun on @solana x @aptos',
    '',
    '50:50 chance casino in the world, first time, fair roulette/mines/plinko/spin wheel like @stake',
    '',
    'literally money making machine, they are sharing their earnings with you, just by sharing the referral link with your friends, you earn 20% of their revenue',
    '',
    '14d cliff OR unlocks early when the referee hits the $100 volume milestone, literal side income for us',
    '',
    'multichain degen pit. free money printer if you know gamblers!',
    '',
    'gg: open the link and connect wallet and deposit 1 SOL or 1 APT to play',
  ].join('\n');
}
