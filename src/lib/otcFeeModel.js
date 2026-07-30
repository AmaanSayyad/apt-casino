/**
 * OTC vs DEX fee model — sourced wallet/platform rates for calculator UI.
 * Model uses a conservative Uniswap-style pool fee for DEX comparison vs OTC allotments.
 */

/** Uniswap-style pool fee estimate */
export const APTC_DEX_POOL_FEE = {
  totalBps: 30,
  totalLabel: '0.30%',
  venue: 'DEX pool (Uniswap-style)',
  detail:
    'Estimated Uniswap-style pool fee for DEX comparison. Actual fees depend on the live trading pool when published.',
  sources: [
    {
      label: 'DexScreener',
      url: 'https://dexscreener.com/',
    },
  ],
};

/** @deprecated Use APTC_DEX_POOL_FEE */
export const BAGS_TOKEN_TAX = APTC_DEX_POOL_FEE;

/** @typedef {'phantom'|'solflare'|'glow'|'backpack'|'jupiter'|'metamask'|'conservative'} WalletFeeId */

/**
 * Platform / wallet markup on top of Jupiter routing (bps). null = quote-only at swap time.
 * @type {Array<{
 *   id: WalletFeeId;
 *   name: string;
 *   swapFeeBps: number | null;
 *   swapFeeLabel: string;
 *   notes: string;
 *   sources: { label: string; url: string }[];
 * }>}
 */
export const WALLET_SWAP_FEES = [
  {
    id: 'phantom',
    name: 'Phantom',
    swapFeeBps: 85,
    swapFeeLabel: '0.85%',
    notes: 'Phantom fee on select in-wallet swap pairs; network fee + price impact are separate.',
    sources: [
      {
        label: 'Phantom Help — Swap fees',
        url: 'https://help.phantom.com/hc/en-us/articles/5985106844435',
      },
    ],
  },
  {
    id: 'solflare',
    name: 'Solflare',
    swapFeeBps: 0,
    swapFeeLabel: '0% (wallet)',
    notes: 'In-wallet swaps still pay network gas and DEX pool fees.',
    sources: [
      { label: 'Solflare — FAQ', url: 'https://www.solflare.com/faq/' },
      { label: 'Jupiter — Swap fees', url: 'https://docs.jup.ag/user-docs/trade/swap/fees' },
    ],
  },
  {
    id: 'glow',
    name: 'Glow',
    swapFeeBps: 0,
    swapFeeLabel: '0% (advertised)',
    notes: 'Glow markets zero-fee swaps; confirm the live quote before you sign — network + token taxes still apply.',
    sources: [{ label: 'Glow', url: 'https://glow.app/' }],
  },
  {
    id: 'backpack',
    name: 'Backpack',
    swapFeeBps: 0,
    swapFeeLabel: '0% (Solana)',
    notes: 'Backpack promotes zero-fee Solana swaps for wallet users; eligibility/promos can change — always read the quote.',
    sources: [
      {
        label: 'Backpack — Zero-fee Solana swaps',
        url: 'https://learn.backpack.exchange/articles/zero-fee-swaps-bridges-solana',
      },
    ],
  },
  {
    id: 'jupiter',
    name: 'Jupiter (direct)',
    swapFeeBps: 0,
    swapFeeLabel: '0% (Manual / Market)',
    notes: 'Jupiter Manual (market) mode: no Jupiter commission; Ultra mode can add up to ~0.5% depending on pair.',
    sources: [
      { label: 'Jupiter — Fees', url: 'https://docs.jup.ag/user-docs/trade/swap/fees' },
    ],
  },
  {
    id: 'metamask',
    name: 'MetaMask',
    swapFeeBps: null,
    swapFeeLabel: 'Quote at swap',
    notes: 'Solana swaps show network + priority (+ rent for new ATAs). Use the pre-confirm quote — no fixed public % for all Solana pairs.',
    sources: [
      {
        label: 'MetaMask — Navigating Solana',
        url: 'https://support.metamask.io/configure/networks/navigating-solana/',
      },
    ],
  },
  {
    id: 'conservative',
    name: 'Conservative est.',
    swapFeeBps: 85,
    swapFeeLabel: '0.85%',
    notes: 'Uses Phantom’s published rate as a planning default when you are unsure which wallet you will use.',
    sources: [
      {
        label: 'Phantom Help — Swap fees',
        url: 'https://help.phantom.com/hc/en-us/articles/5985106844435',
      },
    ],
  },
];

/** Typical Solana base fee per signed transaction (planning constant). */
export const SOLANA_TX_FEE_SOL = 0.000005;

/** Default slippage tolerance on many Solana routers (planning; actual quote may differ). */
export const DEFAULT_SLIPPAGE_BPS = 30;

/** Verified doc URLs for OTC “market loss” explainer (checked May 2026). */
export const MARKET_LOSS_DOC_URLS = {
  priceImpact:
    'https://docs.jup.ag/user-docs/trade/swap/tokens-and-trading',
  slippage: 'https://docs.jup.ag/user-docs/trade/swap/risks',
  /** AMM LP / pool trading fees (generic; Solana pools follow the same model). */
  lpFee: 'https://developers.uniswap.org/docs/get-started/concepts/fees',
  /** Wallet swap settings — price impact & slippage on in-wallet swaps */
  phantomSwapSettings:
    'https://help.phantom.com/hc/en-us/articles/27085326202515',
};

/**
 * Why DEX buys often return less token value than you spent (USD/SOL notional).
 */
export const DEX_VALUE_LOSS_SOURCES = [
  {
    id: 'swap',
    label: 'Wallet swap fee',
    detail: 'e.g. Phantom charges 0.85% on select pairs — goes to the wallet, not the pool.',
  },
  {
    id: 'tax',
    label: 'Uniswap pool fee (APTC)',
    detail: 'Estimated Uniswap-style DEX pool fee. Actual pool fee depends on the live pair when published.',
  },
  {
    id: 'priceImpact',
    label: 'Price impact',
    detail:
      'Large buys move the pool price against you. Bigger trade vs smaller liquidity = worse fill.',
    url: MARKET_LOSS_DOC_URLS.priceImpact,
    learnMoreLabel: 'Jupiter: price impact',
  },
  {
    id: 'slippage',
    label: 'Slippage',
    detail:
      'Price can change between the quote screen and on-chain execution. Routers use a slippage tolerance (often ~0.3%+).',
    url: MARKET_LOSS_DOC_URLS.slippage,
    learnMoreLabel: 'Jupiter: slippage',
  },
  {
    id: 'lp',
    label: 'Liquidity provider (AMM) fee',
    detail:
      'Pool fee paid to LPs (often ~0.25–1% depending on venue). Usually baked into the swap quote.',
    url: MARKET_LOSS_DOC_URLS.lpFee,
    learnMoreLabel: 'Uniswap: pool fees',
  },
];

/**
 * Estimate extra % lost to price impact + slippage + LP friction (bps).
 * Uses pool depth when known; otherwise USD tiers tuned so ~$300 ≈ 5–6% market loss.
 * @param {number} usdNotional
 * @param {number | null | undefined} poolLiquidityUsd — DexScreener TVL for APTC pair
 */
export function estimateMarketLossBps(usdNotional, poolLiquidityUsd = null) {
  if (!usdNotional || usdNotional <= 0) return 0;

  if (poolLiquidityUsd && poolLiquidityUsd > 0) {
    const ratio = usdNotional / poolLiquidityUsd;
    // ratio 0.11 in a thin ~$2.7k pool ≈ 550 bps (~5.5%), capped for UI sanity
    const bps = Math.round(Math.min(2000, Math.max(25, ratio * 5000)));
    return bps + DEFAULT_SLIPPAGE_BPS;
  }

  if (usdNotional < 25) return 50 + DEFAULT_SLIPPAGE_BPS;
  if (usdNotional < 75) return 150 + DEFAULT_SLIPPAGE_BPS;
  if (usdNotional < 150) return 250 + DEFAULT_SLIPPAGE_BPS;
  if (usdNotional < 350) return 550 + DEFAULT_SLIPPAGE_BPS;
  if (usdNotional < 750) return 750 + DEFAULT_SLIPPAGE_BPS;
  if (usdNotional < 2000) return 1000 + DEFAULT_SLIPPAGE_BPS;
  return 1500 + DEFAULT_SLIPPAGE_BPS;
}

/**
 * @param {number} solAmount
 * @param {number} solPriceUsd
 * @param {number} aptcPriceUsd
 * @param {number} swapFeeBps
 * @param {number} tokenTaxBps
 */
export function estimateDexAptcFromSol(solAmount, solPriceUsd, aptcPriceUsd, swapFeeBps, tokenTaxBps) {
  if (!solAmount || !solPriceUsd || !aptcPriceUsd) {
    return { aptc: 0, swapFeeUsd: 0, tokenTaxUsd: 0, netUsd: 0 };
  }
  const grossUsd = solAmount * solPriceUsd;
  const swapFeeUsd = grossUsd * (swapFeeBps / 10_000);
  const afterSwapUsd = grossUsd - swapFeeUsd;
  const tokenTaxUsd = afterSwapUsd * (tokenTaxBps / 10_000);
  const netUsd = afterSwapUsd - tokenTaxUsd;
  const aptc = netUsd / aptcPriceUsd;
  return {
    aptc: Math.round(aptc * 1e6) / 1e6,
    swapFeeUsd: Math.round(swapFeeUsd * 100) / 100,
    tokenTaxUsd: Math.round(tokenTaxUsd * 100) / 100,
    netUsd: Math.round(netUsd * 100) / 100,
  };
}

/** Full APTC if no DEX swap markup and no Uniswap pool fee (OTC allotment model). */
export function estimateOtcAptcFromSol(solAmount, solPriceUsd, aptcPriceUsd) {
  if (!solAmount || !solPriceUsd || !aptcPriceUsd) return { aptc: 0, networkFeeUsd: 0 };
  const grossUsd = solAmount * solPriceUsd;
  const networkFeeUsd = SOLANA_TX_FEE_SOL * solPriceUsd;
  const aptc = grossUsd / aptcPriceUsd;
  return {
    aptc: Math.round(aptc * 1e6) / 1e6,
    networkFeeUsd: Math.round(networkFeeUsd * 1e4) / 1e4,
  };
}

/**
 * Compare splitting the same total SOL across N DEX buys vs one OTC deposit.
 * @param {{
 *   totalSol: number;
 *   numBuys: number;
 *   solPriceUsd: number;
 *   aptcPriceUsd: number;
 *   walletId?: WalletFeeId;
 *   swapFeeBps?: number;
 *   tokenTaxBps?: number;
 * }} input
 */
export function compareDexVsOtc(input) {
  const {
    totalSol,
    numBuys,
    solPriceUsd,
    aptcPriceUsd,
    walletId = 'conservative',
    tokenTaxBps = APTC_DEX_POOL_FEE.totalBps,
  } = input;

  const wallet =
    WALLET_SWAP_FEES.find((w) => w.id === walletId) ||
    WALLET_SWAP_FEES.find((w) => w.id === 'conservative');
  const swapFeeBps =
    input.swapFeeBps != null
      ? input.swapFeeBps
      : wallet.swapFeeBps != null
        ? wallet.swapFeeBps
        : 85;

  const buys = Math.max(1, Math.floor(numBuys) || 1);
  const solPerBuy = totalSol / buys;

  const dexPerBuy = estimateDexAptcFromSol(
    solPerBuy,
    solPriceUsd,
    aptcPriceUsd,
    swapFeeBps,
    tokenTaxBps,
  );
  const dexTotal = {
    aptc: Math.round(dexPerBuy.aptc * buys * 1e6) / 1e6,
    swapFeeUsd: Math.round(dexPerBuy.swapFeeUsd * buys * 100) / 100,
    tokenTaxUsd: Math.round(dexPerBuy.tokenTaxUsd * buys * 100) / 100,
  };

  const networkFeeSol = SOLANA_TX_FEE_SOL * buys;
  const networkFeeUsd = Math.round(networkFeeSol * solPriceUsd * 1e4) / 1e4;

  const otc = estimateOtcAptcFromSol(totalSol, solPriceUsd, aptcPriceUsd);
  const extraAptc = Math.round((otc.aptc - dexTotal.aptc) * 1e6) / 1e6;
  const extraUsd = Math.round(extraAptc * aptcPriceUsd * 100) / 100;
  const totalDexFeesUsd =
    Math.round((dexTotal.swapFeeUsd + dexTotal.tokenTaxUsd + networkFeeUsd) * 100) / 100;

  return {
    wallet,
    swapFeeBps,
    tokenTaxBps,
    numBuys: buys,
    solPerBuy,
    totalSol,
    dex: { ...dexTotal, networkFeeUsd, networkFeeSol },
    otc,
    benefit: {
      extraAptc,
      extraUsd,
      totalDexFeesUsd,
      pctMoreAptc:
        dexTotal.aptc > 0 ? Math.round((extraAptc / dexTotal.aptc) * 10_000) / 100 : 0,
    },
  };
}

export function getWalletById(id) {
  return WALLET_SWAP_FEES.find((w) => w.id === id) || WALLET_SWAP_FEES.find((w) => w.id === 'conservative');
}

/**
 * Per DEX purchase: full value loss — swap fee, market loss (impact/slippage/LP), Uniswap pool fee.
 * @param {number} solIn
 * @param {number} swapFeeBps
 * @param {number} tokenTaxBps
 * @param {{ solPriceUsd?: number | null; poolLiquidityUsd?: number | null; marketLossBps?: number }} [opts]
 */
export function calculateDexFeesPerBuySol(solIn, swapFeeBps, tokenTaxBps, opts = {}) {
  if (!solIn || solIn <= 0) {
    return {
      solIn: 0,
      usdIn: 0,
      swapFeeSol: 0,
      marketLossSol: 0,
      tokenTaxSol: 0,
      networkFeeSol: SOLANA_TX_FEE_SOL,
      totalLossSol: 0,
      netSol: 0,
      totalLossPct: 0,
      marketLossBps: 0,
      effectiveFeePct: 0,
    };
  }

  const solPriceUsd = opts.solPriceUsd && opts.solPriceUsd > 0 ? opts.solPriceUsd : null;
  const usdIn = solPriceUsd ? solIn * solPriceUsd : null;
  const marketLossBps =
    opts.marketLossBps != null
      ? opts.marketLossBps
      : estimateMarketLossBps(usdIn ?? solIn * 150, opts.poolLiquidityUsd);

  let remaining = solIn;
  const swapFeeSol = remaining * (swapFeeBps / 10_000);
  remaining -= swapFeeSol;
  const marketLossSol = remaining * (marketLossBps / 10_000);
  remaining -= marketLossSol;
  const tokenTaxSol = remaining * (tokenTaxBps / 10_000);
  remaining -= tokenTaxSol;

  const networkFeeSol = SOLANA_TX_FEE_SOL;
  const netSol = remaining;
  const totalLossSol = solIn - netSol;
  const totalLossPct = solIn > 0 ? (totalLossSol / solIn) * 100 : 0;
  const tradeFeesOnly = swapFeeSol + tokenTaxSol;
  const effectiveFeePct = solIn > 0 ? (tradeFeesOnly / solIn) * 100 : 0;

  const roundSol = (n) => Math.round(n * 1e6) / 1e6;
  const roundUsd = (n) => (n != null ? Math.round(n * 100) / 100 : null);

  return {
    solIn,
    usdIn: roundUsd(usdIn),
    swapFeeSol: roundSol(swapFeeSol),
    marketLossSol: roundSol(marketLossSol),
    marketLossBps,
    tokenTaxSol: roundSol(tokenTaxSol),
    networkFeeSol,
    totalLossSol: roundSol(totalLossSol),
    totalTradeFeesSol: roundSol(tradeFeesOnly),
    netSol: roundSol(netSol),
    netUsd: roundUsd(usdIn != null ? (usdIn * netSol) / solIn : null),
    totalLossPct: Math.round(totalLossPct * 100) / 100,
    effectiveFeePct: Math.round(effectiveFeePct * 100) / 100,
  };
}

/** OTC: one SOL transfer; no swap markup or DEX trade fee on the buy. */
export function calculateOtcPerBuySol(solIn) {
  const networkFeeSol = SOLANA_TX_FEE_SOL;
  return {
    solIn,
    totalFeesSol: networkFeeSol,
    netSol: Math.max(0, solIn - networkFeeSol),
  };
}

/**
 * @param {{
 *   solPerBuy: number;
 *   numPurchases?: number;
 *   walletId?: WalletFeeId;
 *   tokenTaxBps?: number;
 *   swapFeeBps?: number;
 *   solPriceUsd?: number | null;
 *   poolLiquidityUsd?: number | null;
 * }} input
 */
export function compareDexVsOtcSol(input) {
  const { solPerBuy, numPurchases = 1, walletId = 'phantom', tokenTaxBps = APTC_DEX_POOL_FEE.totalBps } =
    input;
  const wallet = getWalletById(walletId);
  const swapFeeBps =
    input.swapFeeBps != null
      ? input.swapFeeBps
      : wallet.swapFeeBps != null
        ? wallet.swapFeeBps
        : 85;

  const feeOpts = {
    solPriceUsd: input.solPriceUsd,
    poolLiquidityUsd: input.poolLiquidityUsd,
  };

  const purchases = Math.max(1, Math.floor(numPurchases) || 1);
  const perBuyDex = calculateDexFeesPerBuySol(solPerBuy, swapFeeBps, tokenTaxBps, feeOpts);
  const perBuyOtc = calculateOtcPerBuySol(solPerBuy);

  const scale = (n) => Math.round(n * purchases * 1e6) / 1e6;
  const scaleUsd = (n) => (n != null ? Math.round(n * purchases * 100) / 100 : null);

  return {
    wallet,
    swapFeeBps,
    tokenTaxBps,
    solPriceUsd: input.solPriceUsd ?? null,
    poolLiquidityUsd: input.poolLiquidityUsd ?? null,
    numPurchases: purchases,
    solPerBuy,
    totalSolSpent: scale(solPerBuy),
    dex: {
      perBuy: perBuyDex,
      totalLossSol: scale(perBuyDex.totalLossSol),
      totalNetSol: scale(perBuyDex.netSol),
      totalNetUsd: scaleUsd(perBuyDex.netUsd),
      totalUsdIn: scaleUsd(perBuyDex.usdIn),
    },
    otc: {
      perBuy: perBuyOtc,
      totalNetSol: scale(perBuyOtc.netSol),
    },
    savedVsDexSol: scale(perBuyDex.totalLossSol - perBuyOtc.totalFeesSol),
  };
}
