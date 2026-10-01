export const KIT_AMOUNT_CENTS = 4700;
export const DEPOSIT_MIN_CENTS = 250000;

/** Counts paid, unrefunded Stripe charges. Kits are exact-$47 charges; the deposit is any charge of $2,500 or more. */
export function summarizeCharges(charges = []) {
  const paid = charges.filter((c) => c && c.status === "succeeded" && c.paid === true && !c.refunded && !(c.amount_refunded > 0) && c.currency === "usd");
  return {
    kits: paid.filter((c) => c.amount === KIT_AMOUNT_CENTS).length,
    deposits: paid.filter((c) => c.amount >= DEPOSIT_MIN_CENTS).length,
    chargeCount: paid.length,
    grossCents: paid.reduce((sum, c) => sum + c.amount, 0),
  };
}

/** Constant-time-ish token comparison so the dashboard token is not leaked by timing. */
export function tokenMatches(expected, provided) {
  if (!expected || typeof provided !== "string" || provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  return diff === 0;
}

/** Validates a paper-bot summary.json pasted into the dashboard; returns null when it is not one. */
export function parseBotSummary(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  const checks = data?.gate?.checks;
  if (!data || data.paper_only !== true || !checks || typeof checks !== "object") return null;
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
  return {
    returnPct: num(data.return_pct),
    closedTrades: num(data.closed_trades),
    feesPaid: num(data.fees_paid),
    maxDrawdownPct: num(data.max_drawdown_pct),
    daysRunning: num(data.gate?.days_running),
    netPnl: num(data.gate?.net_pnl),
    checks: {
      days: checks.days_running === true,
      trades: checks.closed_trades === true,
      positive: checks.net_positive_after_fees === true,
      drawdown: checks.max_drawdown === true,
    },
  };
}
