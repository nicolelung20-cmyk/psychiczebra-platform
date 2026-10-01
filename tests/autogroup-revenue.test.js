import assert from "node:assert/strict";
import test from "node:test";
import { parseBotSummary, summarizeCharges, tokenMatches } from "../src/autogroup-revenue.js";

const charge = (over) => ({ status: "succeeded", paid: true, refunded: false, amount_refunded: 0, currency: "usd", amount: 4700, ...over });

test("counts only paid, unrefunded USD charges", () => {
  const out = summarizeCharges([
    charge({}), charge({}), charge({ amount: 250000 }), charge({ amount: 500000 }),
    charge({ refunded: true }), charge({ amount_refunded: 100 }), charge({ status: "failed", paid: false }),
    charge({ currency: "eur" }), charge({ amount: 2900 }), null,
  ]);
  assert.deepEqual(out, { kits: 2, deposits: 2, chargeCount: 5, grossCents: 4700 * 2 + 250000 + 500000 + 2900 });
});

test("token check rejects missing, wrong and different-length tokens", () => {
  assert.equal(tokenMatches("secret", "secret"), true);
  assert.equal(tokenMatches("secret", "secrex"), false);
  assert.equal(tokenMatches("secret", "secre"), false);
  assert.equal(tokenMatches("secret", undefined), false);
  assert.equal(tokenMatches(undefined, "anything"), false);
  assert.equal(tokenMatches("", ""), false);
});

test("bot summary parser accepts a paper summary and rejects anything else", () => {
  const good = JSON.stringify({ paper_only: true, return_pct: -0.3, closed_trades: 2, fees_paid: 1.18, max_drawdown_pct: 0.35, gate: { days_running: 0.2, net_pnl: -3.2, checks: { days_running: false, closed_trades: false, net_positive_after_fees: false, max_drawdown: true } } });
  assert.deepEqual(parseBotSummary(good)?.checks, { days: false, trades: false, positive: false, drawdown: true });
  assert.equal(parseBotSummary(good)?.closedTrades, 2);
  assert.equal(parseBotSummary("not json"), null);
  assert.equal(parseBotSummary(JSON.stringify({ paper_only: false, gate: { checks: {} } })), null);
  assert.equal(parseBotSummary(JSON.stringify({ paper_only: true })), null);
});
