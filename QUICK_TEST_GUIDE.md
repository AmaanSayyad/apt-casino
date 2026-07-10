# Quick Test Guide - Launch Trigger System

## Current State (Pre-Launch)

Your site is currently in "Launching Soon" mode because `NEXT_PUBLIC_APTC_SOLANA_MINT` is not configured.

### What You Should See Now:

1. **Homepage Hero**
   - Amber badge: "$APTC Launching Soon on Solana"
   - Original hero image (`HeroImage.png`)
   - Link text: "Learn more →"

2. **Announcement Marquee**
   - Amber badge with "Soon"
   - Text: "$APTC Launching Soon on Solana"

3. **DexScreener Section**
   - Amber badge: "$APTC Launching Soon"
   - Placeholder text: "Live chart and trading data will appear here once APTC launches on Raydium"

4. **Tokenomics Section**
   - Amber badge: "$APTC · Launching Soon"
   - Token address box: "Token address: Launching soon" (amber)
   - Trade & Research: Generic URLs (e.g., `/ipo`, `https://jup.ag/`)

5. **Stake Page**
   - Amber warning banner: "$APTC Launching Soon on Solana"

## Testing the Launch Trigger

### Option 1: Test Locally

1. Open `.env` file
2. Add these lines:
   ```bash
   NEXT_PUBLIC_APTC_SOLANA_MINT=ApTCoJG15om8W9gRpJJbdmG9JDBdF5ZJmiCf9F1RBRg
   NEXT_PUBLIC_APTC_DEXSCREENER_PAIR=C9ej1qVPj9tycKgWZSUkL9RDuz65VzX2WfG7rfhAqSaL
   ```
3. Restart dev server: `npm run dev`
4. Refresh browser

### Expected Changes After Adding CA:

1. **Homepage Hero**
   - ✅ Badge turns GREEN: "$APTC is now Live on Solana"
   - ✅ Hero image changes to `APTC-Launched.jpg`
   - ✅ Link text: "Trade now →"

2. **Announcement Marquee**
   - ✅ Badge turns GREEN with "Live"
   - ✅ Text: "$APTC is now Live on Solana"
   - ✅ Text color changes to emerald

3. **DexScreener Section**
   - ✅ Badge turns GREEN: "$APTC live on Dexscreener"
   - ✅ Shows live chart iframe (when pair is indexed)
   - ✅ Description updates to real-time data

4. **Tokenomics Section**
   - ✅ Badge turns GREEN: "$APTC · Live on Solana"
   - ✅ Token address box shows full CA with Solscan link (green)
   - ✅ Trade & Research: Token-specific URLs
     - IPO / Raydium: `/ipo` then Raydium pair
     - Jupiter: `https://jup.ag/swap/SOL-<mint>`
     - DexScreener: `https://dexscreener.com/solana/ApT...`
     - Birdeye: `https://birdeye.so/token/ApT...?chain=solana`
     - etc.

5. **Stake Page**
   - ✅ Warning banner DISAPPEARS
   - ✅ All live functionality enabled

### Option 2: Deploy and Test on Vercel

When you're ready to launch for real:

1. Set environment variables in Vercel:
   ```bash
   vercel env add NEXT_PUBLIC_APTC_SOLANA_MINT production
   # paste: ApTCoJG15om8W9gRpJJbdmG9JDBdF5ZJmiCf9F1RBRg
   
   vercel env add NEXT_PUBLIC_APTC_DEXSCREENER_PAIR production
   # paste: C9ej1qVPj9tycKgWZSUkL9RDuz65VzX2WfG7rfhAqSaL
   ```

2. Redeploy:
   ```bash
   git add .
   git commit -m "Add launch trigger system"
   git push
   ```

3. Visit your production site - everything should be "Live"!

## Reverting to "Launching Soon"

To go back to pre-launch state:

1. **Locally**: Comment out the env vars in `.env`:
   ```bash
   # NEXT_PUBLIC_APTC_SOLANA_MINT=...
   # NEXT_PUBLIC_APTC_DEXSCREENER_PAIR=...
   ```

2. **Vercel**: Remove the env vars:
   ```bash
   vercel env rm NEXT_PUBLIC_APTC_SOLANA_MINT production
   vercel env rm NEXT_PUBLIC_APTC_DEXSCREENER_PAIR production
   ```

3. Redeploy

## What to Tell the Agent for Future Launches

When you create a new token and want to launch, just say:

```
Launch the token:
CA: <your-new-token-address>
Pair: <your-new-pair-address>
```

The agent will:
1. Update the environment variables
2. Commit and push changes
3. Everything automatically updates to "Live" state!

## Files You Can Review

- **Central Config**: `src/lib/config/launchStatus.js`
- **Full Documentation**: `LAUNCH_TRIGGER_SYSTEM.md`
- **Test Locally**: Just toggle the env vars and restart!
