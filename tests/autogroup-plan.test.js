import assert from "node:assert/strict";
import test from "node:test";
import { planCashFlow } from "../src/autogroup-plan.js";

test("negative checking is covered from personal cash first, with a P0 alert", () => {
  const out = planCashFlow({ checking: -500, personalCash: 2000, monthlyExpenses: 1000, weeklyDeposits: 0 });
  assert.equal(out.alerts[0].severity, "P0");
  assert.deepEqual(out.transfers[0], { priority: 1, from: "personal cash", to: "business checking", amount: 600, reason: "Cover the overdraft plus a 100 cushion" });
  assert.equal(out.operatingAfter, 100);
  assert.equal(out.personalAfter, 1400);
});

test("a shortfall beyond personal cash raises a second P0 and never draws the tax reserve", () => {
  const out = planCashFlow({ checking: -500, personalCash: 100, taxSavings: 9000, weeklyDeposits: 0 });
  assert.equal(out.transfers.length, 1);
  assert.equal(out.transfers[0].amount, 100);
  assert.ok(out.alerts.filter((a) => a.severity === "P0").length === 2);
  assert.ok(!out.transfers.some((t) => t.from === "tax savings"));
});

test("weekly deposits split into tax reserve, then buffer top-up, then idle", () => {
  const out = planCashFlow({ checking: 200, taxSavings: 500, monthlyExpenses: 1000, weeklyDeposits: 1000 });
  assert.equal(out.transfers[0].amount, 275);
  assert.equal(out.transfers[0].to, "tax savings");
  assert.equal(out.transfers[1].amount, 725);
  assert.equal(out.idle, 0);
  assert.ok(out.alerts.some((a) => a.severity === "P2" && /75 short/.test(a.message)));
});

test("idle cash above the buffer is flagged without auto-allocation", () => {
  const out = planCashFlow({ checking: 5000, taxSavings: 500, monthlyExpenses: 1000, weeklyDeposits: 0 });
  assert.equal(out.idle, 4000);
  assert.equal(out.runwayMonths, 5);
  assert.equal(out.transfers.length, 0);
  assert.match(out.alerts.at(-1).message, /No automatic allocation/);
});

test("garbage input does not throw and tax rate is clamped", () => {
  const out = planCashFlow({ checking: "abc", weeklyDeposits: 100, taxRate: 9 });
  assert.equal(out.transfers[0].amount, 50);
  assert.equal(planCashFlow().transfers.length, 0);
});
