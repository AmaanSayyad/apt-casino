# APTC Launch Trigger System

## Overview

The entire site now uses a **centralized launch trigger system** that automatically updates everything when you add the token contract address (CA).

## The Trigger

**Single source of truth**: `NEXT_PUBLIC_APTC_SOLANA_MINT` environment variable

When this is set with a valid Solana token address, the entire site automatically switches from "Launching Soon" to "Live" state.

## What Updates Automatically

### 1. **Hero Section** (`src/components/HeroSection.js`)
- ✅ Badge changes: Amber "Launching Soon" → Green "Live on Solana"
- ✅ Hero image changes: `/images/HeroImage.png` → `/images/APTC-Launched.jpg`
- ✅ CTA text: "Learn more →" → "Trade now →"

### 2. **Announcement Marquee** (`src/components/HeroAnnouncementsMarquee.jsx`)
- ✅ Badge color: Amber "Soon" → Green "Live"
- ✅ Text: "$APTC Launching Soon on Solana" → "$APTC is now Live on Solana"

### 3. **DexScreener Section** (`src/components/DexscreenerEmbedSection.jsx`)
- ✅ Badge: Amber "Launching Soon" → Green "Live on Dexscreener"
- ✅ Chart: Shows placeholder → Shows live iframe when pair is indexed
- ✅ Description text updates based on launch state

### 4. **Tokenomics Section** (`src/components/TokenomicsSection.jsx`)
- ✅ Badge: "$APTC · Launching Soon" → "$APTC · Live on Solana"
- ✅ Token address: "Launching soon" → Full CA with Solscan link
- ✅ Trade & Research links: Generic URLs → Token-specific URLs

### 5. **Trade & Research Tool Links**
**Pre-launch** (generic URLs):
- IPO: `/ipo`
- Jupiter: `https://jup.ag/`
- DexScreener: `https://dexscreener.com/solana`
- Birdeye: `https://birdeye.so/`
- GeckoTerminal: `https://www.geckoterminal.com/`
- DexTools: `https://www.dextools.io/`
- GMGN: `https://gmgn.ai/`
- Axiom: `https://axiom.trade/`
- Photon: `https://photon-sol.tinyastro.io/`
- Solscan: `https://solscan.io/`
- Plus: CoinGecko, CMC, Raydium

**Post-launch** (token-specific URLs):
- IPO: `/ipo` (during sale) then Raydium / Jupiter
- Jupiter: Swap SOL to token
- DexScreener: Token pair page
- Birdeye: Token analytics
- GeckoTerminal: Token pool page
- DexTools: Pair explorer
- GMGN: Token page
- Axiom: Token page
- Photon: LP page
- Solscan: Token mint page
- Plus all others with token URLs

### 6. **Stake Page** (`src/app/stake/page.js`)
- ✅ Pre-launch warning: Shows amber banner → Hides when launched
- ✅ Warning text: User-friendly "Launching Soon" message

### 7. **Litepaper** (`src/lib/litepaper/sections.js`)
- ✅ Documentation text updated to reference automatic launch detection

## How to Launch the Token

### Method 1: Set Environment Variable

1. **Local development** (`.env`):
   ```bash
   NEXT_PUBLIC_APTC_SOLANA_MINT=<your-token-address>
   NEXT_PUBLIC_APTC_DEXSCREENER_PAIR=<pair-address> # optional, for DexScreener embed
   ```

2. **Vercel production**:
   ```bash
   vercel env add NEXT_PUBLIC_APTC_SOLANA_MINT production
   # paste your token address when prompted
   
   vercel env add NEXT_PUBLIC_APTC_DEXSCREENER_PAIR production
   # paste your pair address when prompted
   ```

3. **Redeploy**:
   ```bash
   git add .
   git commit -m "Launch APTC token"
   git push
   ```

### Method 2: Tell the Agent

Simply say:
```
Launch the token with CA: <address>
Pair: <pair-address>
```

The agent will update the environment variables and redeploy for you.

## Central Configuration File

All launch logic lives in: **`src/lib/config/launchStatus.js`**

This file provides:
- `isAptcLaunched()` - Check if token is launched
- `getAptcMint()` - Get mint address or "Launching soon"
- `getAptcPairAddress()` - Get DexScreener pair address
- `getLaunchStatusText()` - Get status text for badges
- `getLaunchBadgeVariant()` - Get 'live' or 'soon'
- `getLaunchStyles()` - Get colors and styling for badges
- `getHeroImagePath()` - Get correct hero image
- `getHeroImageDimensions()` - Get hero image dimensions
- `getLaunchCtaText()` - Get CTA link text

## Files Modified

1. ✅ `src/lib/config/launchStatus.js` - NEW central config
2. ✅ `src/lib/config/tokenomics.js` - Uses launch status
3. ✅ `src/components/HeroSection.js` - Conditional hero + badge
4. ✅ `src/components/HeroAnnouncementsMarquee.jsx` - Conditional marquee
5. ✅ `src/components/DexscreenerEmbedSection.jsx` - Conditional chart
6. ✅ `src/components/TokenomicsSection.jsx` - Conditional badge + CA + trade links
7. ✅ `src/app/stake/page.js` - Conditional pre-launch warning
8. ✅ `src/lib/litepaper/sections.js` - Updated documentation

## Testing

### Pre-launch state (current):
```bash
# .env
# NEXT_PUBLIC_APTC_SOLANA_MINT=
# NEXT_PUBLIC_APTC_DEXSCREENER_PAIR=
```

**Expected behavior:**
- Amber "Launching Soon" badges everywhere
- Original hero image shows
- Generic trade links
- Pre-launch warnings visible
- Token address shows "Launching soon"
- DexScreener shows placeholder

### Post-launch state:
```bash
# .env
NEXT_PUBLIC_APTC_SOLANA_MINT=ApTCoJG15om8W9gRpJJbdmG9JDBdF5ZJmiCf9F1RBRg
NEXT_PUBLIC_APTC_DEXSCREENER_PAIR=C9ej1qVPj9tycKgWZSUkL9RDuz65VzX2WfG7rfhAqSaL
```

**Expected behavior:**
- Green "Live" badges everywhere
- "Launched" hero image shows
- Token-specific trade links with CA
- No pre-launch warnings
- Full token address with Solscan link
- DexScreener shows live chart (when indexed)

## Notes

- The system checks if `NEXT_PUBLIC_APTC_SOLANA_MINT` is:
  1. Defined
  2. Not empty
  3. Not "Launching soon"
  4. Longer than 20 characters (valid Solana address)
  
- All components import from the central config to ensure consistency
- No manual updates needed - everything is automatic
- Works in both development and production
- The hero image, badges, links, warnings, and charts all update together

## Quick Launch Checklist

When you're ready to launch:

- [ ] Open `/ipo` fixed-price sale · 250M APTC · $100K raise · listings-first treasury ops
- [ ] No wash · no fake FDV · no dumps
- [ ] Set `NEXT_PUBLIC_APTC_SOLANA_MINT` in Vercel
- [ ] Set `NEXT_PUBLIC_APTC_DEXSCREENER_PAIR` in Vercel (optional, for faster chart)
- [ ] Redeploy to production
- [ ] ✅ Site automatically updates to "Live" state everywhere!
