const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const round = (n) => Math.round(n * 100) / 100;

/**
 * Plans where each dollar should go. Planning only: it returns suggested transfers for the owner to
 * make in the bank app and never moves money. Tax reserve and buffer follow the Elevat standing goals
 * (25-30% of weekly net deposits to tax savings, final percentage with a CPA).
 */
export function planCashFlow(input = {}) {
  const checking = num(input.checking);
  const taxSavings = num(input.taxSavings);
  const personalCash = Math.max(0, num(input.personalCash));
  const monthlyExpenses = Math.max(0, num(input.monthlyExpenses));
  const weeklyDeposits = Math.max(0, num(input.weeklyDeposits));
  const taxRate = Math.min(0.5, Math.max(0, input.taxRate === undefined ? 0.275 : num(input.taxRate)));
  const bufferMonths = Math.max(0, input.bufferMonths === undefined ? 1 : num(input.bufferMonths));

  const alerts = [];
  const transfers = [];
  let operating = checking;
  let personal = personalCash;

  if (operating < 0) {
    const need = round(-operating + 100);
    const fromPersonal = round(Math.min(personal, need));
    alerts.push({ severity: "P0", message: `Business checking is negative by ${round(-operating)}. Overdraft fees can keep growing; cover it first.` });
    if (fromPersonal > 0) {
      transfers.push({ priority: 1, from: "personal cash", to: "business checking", amount: fromPersonal, reason: "Cover the overdraft plus a 100 cushion" });
      operating += fromPersonal;
      personal -= fromPersonal;
    }
    if (fromPersonal < need) alerts.push({ severity: "P0", message: `Still short by ${round(need - fromPersonal)} after personal cash. Call the bank about the overdraft and fees, and use incoming deposits.` });
  }

  const reserve = round(weeklyDeposits * taxRate);
  if (reserve > 0) transfers.push({ priority: 2, from: "weekly deposits", to: "tax savings", amount: reserve, reason: `${round(taxRate * 100)}% of weekly deposits to the tax reserve (CPA confirms the final rate)` });

  const buffer = round(monthlyExpenses * bufferMonths);
  const afterReserve = round(Math.max(0, weeklyDeposits - reserve));
  const gap = round(Math.max(0, buffer - Math.max(0, operating)));
  const topUp = round(Math.min(gap, afterReserve));
  if (topUp > 0) transfers.push({ priority: 3, from: "weekly deposits", to: "business checking", amount: topUp, reason: `Build the ${bufferMonths}-month operating buffer of ${buffer}` });
  if (gap > topUp) alerts.push({ severity: "P2", message: `Operating buffer is ${round(gap - topUp)} short of ${bufferMonths} month(s) of expenses even after this week's deposits.` });

  const idle = round(Math.max(0, Math.max(0, operating) - buffer) + Math.max(0, afterReserve - topUp));
  const runwayMonths = monthlyExpenses > 0 ? round(Math.max(0, operating) / monthlyExpenses) : null;
  if (idle > 0) alerts.push({ severity: "P3", message: `${idle} is idle above the buffer and tax reserve. Candidates: owner draw, Solo 401(k) once profitable (CPA), or a capped amount for paper-proven trading later. No automatic allocation.` });
  if (taxSavings <= 0 && weeklyDeposits > 0) alerts.push({ severity: "P2", message: "No tax savings balance recorded. Open or fund the tax reserve account before taking an owner draw." });

  return { alerts, transfers, buffer, runwayMonths, idle, operatingAfter: round(operating), personalAfter: round(personal) };
}
