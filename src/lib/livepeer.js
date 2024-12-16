import Livepeer from "livepeer";

let cachedClient = null;

export function getLivepeerClient() {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.NEXT_PUBLIC_LIVEPEER_API_KEY || process.env.LIVEPEER_API_KEY;
  if (!apiKey) {
    console.warn("Livepeer API key is not set. Set NEXT_PUBLIC_LIVEPEER_API_KEY or LIVEPEER_API_KEY.");
  }
  cachedClient = new Livepeer({ apiKey });
  return cachedClient;
}


