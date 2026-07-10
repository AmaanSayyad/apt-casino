/** Shared IPO round shape used by server config + API routes. */

export type IpoRound = {
  id: number;
  key: string;
  label: string;
  shortLabel: string;
  multiple: number;
  oversubMultiple: number;
  softCapUsd: number;
  startAtIso: string;
  endAtIso: string;
  windowLabel: string;
  blurb: string;
  priceUsd: number;
  oversubPriceUsd: number;
  softCapAptc: number;
};

export type IpoPurchasePricing = {
  priceUsd: number;
  tranche: 'primary' | 'oversub';
  oversubscribed: boolean;
  softCapUsd: number;
  multiple?: number;
};

export type IpoSalePhase = 'upcoming' | 'live' | 'between_rounds' | 'ended' | 'unknown';

export type IpoSaleState = {
  phase: IpoSalePhase;
  activeRound: IpoRound | null;
  nextRound: IpoRound | null;
  previousRound: IpoRound | null;
  rounds: IpoRound[];
};
