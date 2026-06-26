/** Normalize wallet auth signatures from strings, hex, bytes, or nested wallet objects. */
export function normalizeWalletAuthSignature(signature: unknown): string | null {
  if (typeof signature === 'string') {
    const s = signature.trim();
    return s || null;
  }
  if (signature instanceof Uint8Array) {
    return `0x${Buffer.from(signature).toString('hex')}`;
  }
  if (Array.isArray(signature)) {
    return `0x${Buffer.from(signature).toString('hex')}`;
  }
  if (signature && typeof signature === 'object') {
    const nested = (signature as { signature?: unknown }).signature;
    if (nested != null) return normalizeWalletAuthSignature(nested);
  }
  return null;
}
