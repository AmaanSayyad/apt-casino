const MAX_CHAT_LENGTH = 500;

/** Strip HTML tags and normalize whitespace for safe plain-text chat. */
export function sanitizeChatContent(raw) {
  const noTags = String(raw || '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  return noTags.replace(/\s+/g, ' ').trim().slice(0, MAX_CHAT_LENGTH);
}

export function isValidChatContent(raw) {
  const cleaned = sanitizeChatContent(raw);
  return cleaned.length >= 1 && cleaned.length <= MAX_CHAT_LENGTH;
}

export function sanitizeChatWalletLabel(raw) {
  const s = sanitizeChatContent(raw).slice(0, 64);
  if (!s || s === 'guest') return 'Guest';
  return s;
}
