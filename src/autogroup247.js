const STATES = Object.freeze({ GREEN: "GREEN", AMBER: "AMBER", RED: "RED", OFFLINE: "OFFLINE" });

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function accountState(account) {
  if (!account || account.enabled === false) return STATES.OFFLINE;
  if (account.securityAlert === true || account.unauthorizedActivity === true || account.failedCriticalPayment === true) return STATES.RED;
  if (account.reconciliationStatus === "mismatch" || account.overdue === true) return STATES.RED;
  if (account.reconciliationStatus === "unverified" || account.dataFresh === false || account.reserveBelowMinimum === true || account.unknownTransactions > 0) return STATES.AMBER;
  if (number(account.balance) === null || !account.lastSync) return STATES.OFFLINE;
  return STATES.GREEN;
}

function worst(states) {
  if (states.includes(STATES.RED)) return STATES.RED;
  if (states.includes(STATES.AMBER)) return STATES.AMBER;
  if (states.includes(STATES.OFFLINE)) return STATES.OFFLINE;
  return STATES.GREEN;
}

function parseAccounts(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function buildAutogroupSnapshot(accounts = [], now = new Date()) {
  const normalized = accounts.map((account) => ({
    id: String(account.id ?? "unknown"),
    name: String(account.name ?? "Unnamed account"),
    institution: String(account.institution ?? "Unknown institution"),
    balance: number(account.balance),
    availableBalance: number(account.availableBalance),
    lastSync: account.lastSync ?? null,
    reconciliationStatus: account.reconciliationStatus ?? "unverified",
    overdue: account.overdue === true,
    reserveBelowMinimum: account.reserveBelowMinimum === true,
    unknownTransactions: Number.isFinite(Number(account.unknownTransactions)) ? Number(account.unknownTransactions) : 0,
    securityAlert: account.securityAlert === true,
    unauthorizedActivity: account.unauthorizedActivity === true,
    failedCriticalPayment: account.failedCriticalPayment === true,
  })).map((account) => ({ ...account, state: accountState(account) }));

  const states = normalized.map((account) => account.state);
  const balances = normalized.map((a) => a.balance).filter((n) => n !== null);
  const available = normalized.map((a) => a.availableBalance).filter((n) => n !== null);
  const alerts = [];

  for (const account of normalized) {
    if (account.state === STATES.OFFLINE) alerts.push({ severity: "P2", accountId: account.id, message: "Account data cannot currently be verified." });
    if (account.state === STATES.AMBER && account.unknownTransactions > 0) alerts.push({ severity: "P2", accountId: account.id, message: `${account.unknownTransactions} unknown transaction(s) require review.` });
    if (account.securityAlert || account.unauthorizedActivity) alerts.push({ severity: "P0", accountId: account.id, message: "Security event requires immediate review." });
    if (account.failedCriticalPayment || account.overdue) alerts.push({ severity: "P1", accountId: account.id, message: "Critical payment or overdue obligation requires review." });
    if (account.reconciliationStatus === "mismatch") alerts.push({ severity: "P1", accountId: account.id, message: "Expected and reported balances do not reconcile." });
  }

  const status = normalized.length === 0 ? STATES.OFFLINE : worst(states);
  return {
    system: "AUTOGROUP 247",
    status,
    verified: normalized.length > 0 && normalized.every((a) => a.state === STATES.GREEN),
    generatedAt: now.toISOString(),
    monitoring: { intervalSeconds: 60, failClosed: true },
    accounts: normalized,
    totals: {
      accounts: normalized.length,
      green: normalized.filter((a) => a.state === STATES.GREEN).length,
      amber: normalized.filter((a) => a.state === STATES.AMBER).length,
      red: normalized.filter((a) => a.state === STATES.RED).length,
      offline: normalized.filter((a) => a.state === STATES.OFFLINE).length,
      balance: balances.reduce((sum, n) => sum + n, 0),
      availableBalance: available.reduce((sum, n) => sum + n, 0),
    },
    alerts,
    controlFlow: ["observe", "verify", "flag", "authorize", "execute", "reconcile"],
  };
}

export function createAutogroupMonitor(config = {}) {
  let accounts = config.accounts ?? parseAccounts(process.env.AUTOGROUP_ACCOUNTS);
  let snapshot = buildAutogroupSnapshot(accounts);
  const listeners = new Set();
  const intervalMs = Math.max(15_000, Number(config.intervalMs ?? process.env.AUTOGROUP_INTERVAL_MS ?? 60_000));

  const refresh = (nextAccounts = accounts) => {
    accounts = nextAccounts;
    snapshot = buildAutogroupSnapshot(accounts);
    for (const listener of listeners) listener(snapshot);
    return snapshot;
  };

  const timer = setInterval(() => refresh(), intervalMs);
  timer.unref?.();

  return {
    getSnapshot: () => snapshot,
    refresh,
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    stop: () => clearInterval(timer),
  };
}

export { STATES };
