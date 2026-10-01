export declare const KIT_AMOUNT_CENTS: 4700;
export declare const DEPOSIT_MIN_CENTS: 250000;
export declare function summarizeCharges(charges?: unknown[]): { kits: number; deposits: number; chargeCount: number; grossCents: number };
export declare function tokenMatches(expected: string | undefined, provided: unknown): boolean;
export declare function parseBotSummary(text: string): null | {
  returnPct: number | null; closedTrades: number | null; feesPaid: number | null; maxDrawdownPct: number | null;
  daysRunning: number | null; netPnl: number | null;
  checks: { days: boolean; trades: boolean; positive: boolean; drawdown: boolean };
};
