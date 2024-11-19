/** Address variants for Supabase lookups (Aptos 0x padding, case). */

export function walletAddressSearchVariants(address: string): string[] {
  const t = address.trim();
  if (!t || t.length < 3) return [];

  const out = new Set<string>([t]);

  if (t.startsWith('0x') || /^[0-9a-fA-F]{64}$/.test(t)) {
    let hex = t.toLowerCase().replace(/^0x/, '');
    hex = hex.padStart(64, '0');
    out.add(`0x${hex}`);
    const stripped = hex.replace(/^0+/, '') || '0';
    out.add(`0x${stripped.padStart(64, '0')}`);
  }

  return [...out];
}

export function normalizeWalletForBanKey(address: string): string {
  const t = address.trim();
  if (t.startsWith('0x')) {
    return `0x${t.toLowerCase().replace(/^0x/, '').padStart(64, '0')}`;
  }
  return t;
}
