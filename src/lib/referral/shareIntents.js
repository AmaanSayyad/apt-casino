import { getPublicShareOrigin } from '@/lib/siteMetadata';
import {
  getReferralBroadcastBody,
  getReferralBroadcastMessage,
  getReferralLinkedInPost,
  getReferralTweetText,
} from '@/lib/referral/shareMessage';

export {
  getReferralBroadcastBody,
  getReferralBroadcastMessage,
  getReferralLinkedInPost,
  getReferralTweetText,
};

export const APT_CASINO_DISCORD_INVITE = 'https://discord.gg/8dhBmbgMke';

/**
 * @param {{ referralLink: string; tweetIntent?: string | null }} input
 * @returns {Array<{
 *   id: string;
 *   label: string;
 *   href?: string;
 *   className: string;
 *   action?: 'copy-discord' | 'copy-linkedin';
 * }>}
 */
/**
 * Public /r/CODE URL for crawlers (LinkedIn, Facebook). Falls back to referralLink.
 */
export function getReferralLinkForPreview(referralLink) {
  if (!referralLink) return '';
  try {
    const parsed = new URL(referralLink);
    const match = parsed.pathname.match(/^\/r\/([^/]+)$/i);
    if (match) {
      return `${getPublicShareOrigin()}/r/${match[1].toUpperCase()}`;
    }
  } catch {
    /* ignore */
  }
  return referralLink;
}

export function getLinkedInShareUrl(referralLink) {
  const previewUrl = getReferralLinkForPreview(referralLink);
  if (!previewUrl) return null;
  const url = encodeURIComponent(previewUrl);
  const text = encodeURIComponent(getReferralLinkedInPost(previewUrl));
  return `https://www.linkedin.com/feed/?shareActive=true&text=${text}&url=${url}`;
}

export function buildReferralShareChannels({ referralLink, tweetIntent = null }) {
  if (!referralLink) return [];

  const previewLink = getReferralLinkForPreview(referralLink);
  const broadcastMessage = getReferralBroadcastMessage(referralLink);
  const bodyOnly = getReferralBroadcastBody();
  const full = encodeURIComponent(broadcastMessage);
  const url = encodeURIComponent(previewLink);
  const title = encodeURIComponent('Join APT Casino — referral link');

  const channels = [
    {
      id: 'telegram',
      label: 'Telegram',
      shortLabel: 'Telegram',
      tier: 'primary',
      href: `https://t.me/share/url?url=${url}&text=${encodeURIComponent(bodyOnly)}`,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      shortLabel: 'WhatsApp',
      tier: 'primary',
      href: `https://api.whatsapp.com/send?text=${full}`,
    },
    {
      id: 'facebook',
      label: 'Facebook',
      shortLabel: 'Facebook',
      tier: 'more',
      href: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodeURIComponent(bodyOnly)}`,
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      shortLabel: 'LinkedIn',
      tier: 'more',
      action: 'copy-linkedin',
      href: getLinkedInShareUrl(referralLink) || undefined,
    },
    {
      id: 'reddit',
      label: 'Reddit',
      shortLabel: 'Reddit',
      tier: 'more',
      href: `https://www.reddit.com/submit?url=${url}&title=${title}`,
    },
    {
      id: 'email',
      label: 'Email',
      shortLabel: 'Email',
      tier: 'more',
      href: `mailto:?subject=${title}&body=${full}`,
    },
    {
      id: 'discord',
      label: 'Discord',
      shortLabel: 'Discord',
      tier: 'more',
      action: 'copy-discord',
    },
  ];

  if (tweetIntent) {
    channels.unshift({
      id: 'x',
      label: 'Post on X',
      shortLabel: 'X',
      tier: 'primary',
      href: tweetIntent,
    });
  }

  return channels;
}
