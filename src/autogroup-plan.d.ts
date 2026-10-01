export type PlanInput = { checking?: unknown; taxSavings?: unknown; personalCash?: unknown; monthlyExpenses?: unknown; weeklyDeposits?: unknown; taxRate?: number; bufferMonths?: number };
export declare function planCashFlow(input?: PlanInput): {
  alerts: Array<{ severity: string; message: string }>;
  transfers: Array<{ priority: number; from: string; to: string; amount: number; reason: string }>;
  buffer: number;
  runwayMonths: number | null;
  idle: number;
  operatingAfter: number;
  personalAfter: number;
};
