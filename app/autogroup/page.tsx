"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { planCashFlow } from "../../src/autogroup-plan.js";
import { parseBotSummary } from "../../src/autogroup-revenue.js";
import styles from "./autogroup.module.css";

type Snapshot = {
  status: "GREEN" | "AMBER" | "RED" | "OFFLINE";
  generatedAt: string;
  monitoring: { intervalSeconds: number; failClosed: boolean };
  totals: { accounts: number; green: number; amber: number; red: number; offline: number; balance: number; availableBalance: number };
  alerts: { severity: string; message: string; accountId?: string }[];
  accounts: { id: string; name: string; institution: string; balance: number | null; lastSync: string | null; state: string }[];
  controlFlow: string[];
};

const money = (value: number | null) => value == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(value);

const SEVERITY_ORDER = ["P0", "P1", "P2", "P3"];
const STATE_ORDER = ["RED", "AMBER", "OFFLINE", "GREEN"];
const REVENUE_DEADLINE = "2026-10-31";
const KITS_GOAL = 5;
const STORAGE_KEY = "autogroup_manual_v1";
const TOKEN_KEY = "autogroup_dash_token";
const MONEY_KEY = "autogroup_money_v1";

type Money = { checking: string; taxSavings: string; personalCash: string; monthlyExpenses: string; weeklyDeposits: string };
const EMPTY_MONEY: Money = { checking: "", taxSavings: "", personalCash: "", monthlyExpenses: "", weeklyDeposits: "" };
const MONEY_FIELDS: [keyof Money, string][] = [
  ["checking", "Business checking (negative if overdrawn)"],
  ["taxSavings", "Tax savings balance"],
  ["personalCash", "Personal cash available to cover"],
  ["monthlyExpenses", "Monthly business expenses"],
  ["weeklyDeposits", "Expected weekly deposits"],
];

function loadMoney(): Money {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(MONEY_KEY) ?? "null");
    if (!parsed) return EMPTY_MONEY;
    const out = { ...EMPTY_MONEY };
    for (const [key] of MONEY_FIELDS) out[key] = typeof parsed[key] === "string" ? parsed[key] : "";
    return out;
  } catch {
    return EMPTY_MONEY;
  }
}

type Bot = NonNullable<ReturnType<typeof parseBotSummary>>;
type Revenue = { connected: boolean; reason?: string; kits?: number; deposits?: number; chargeCount?: number; grossCents?: number; truncated?: boolean; since?: string };
type Ops = {
  reason?: string;
  github?: { connected: boolean; reason?: string; pulls?: { repo: string; number: number; title: string; draft: boolean; url?: string; ci: string }[] };
  linear?: { connected: boolean; reason?: string; project?: { name?: string; state?: string; url?: string; update: { health: string | null; createdAt?: string; body: string } | null } | null };
};
type Manual = { kits: number; deposit: boolean; gate: boolean[]; bot: Bot | null };
const GATE_ITEMS = [
  "90+ days of paper trading",
  "30+ closed paper trades",
  "Positive after fees",
  "Max drawdown under 10%",
  "Kill-switch tested",
];
const DEFAULT_MANUAL: Manual = { kits: 0, deposit: false, gate: GATE_ITEMS.map(() => false), bot: null };

const LAUNCH: { label: string; href: string; note: string }[] = [
  { label: "Robin", href: "https://github.com/nicolelung20-cmyk/robin#installation", note: "Dark web OSINT (run locally)" },
  { label: "Stripe", href: "https://dashboard.stripe.com", note: "Sales" },
  { label: "Linear HQ", href: "https://linear.app/elevat/project/elevated-associates-llc-hq-c886186a448e", note: "Current state" },
  { label: "Elevat Pro", href: "https://eai-workspace.floot.app", note: "Floot app" },
  { label: "PocketSmith", href: "https://my.pocketsmith.com", note: "Budget" },
  { label: "Alpaca paper", href: "https://app.alpaca.markets/paper/dashboard/overview", note: "Paper trading" },
  { label: "GitHub", href: "https://github.com/notifications", note: "PRs and CI" },
  { label: "Connectors", href: "https://claude.ai/settings/connectors", note: "QuickBooks, Gmail, Stripe" },
];

function loadManual(): Manual {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!parsed) return DEFAULT_MANUAL;
    return {
      kits: Math.min(KITS_GOAL, Math.max(0, Number(parsed.kits) || 0)),
      deposit: parsed.deposit === true,
      gate: GATE_ITEMS.map((_, i) => parsed.gate?.[i] === true),
      bot: parsed.bot ?? null,
    };
  } catch {
    return DEFAULT_MANUAL;
  }
}

export default function AutogroupPage() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [manual, setManual] = useState<Manual>(DEFAULT_MANUAL);
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [botError, setBotError] = useState<string | null>(null);
  const [ops, setOps] = useState<Ops | null>(null);
  const [cash, setCash] = useState<Money>(EMPTY_MONEY);

  const refresh = useCallback(() =>
    fetch("/api/autogroup/status", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Status endpoint returned ${response.status}`);
        return response.json();
      })
      .then((snapshot: Snapshot) => { setData(snapshot); setError(null); })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to read AUTOGROUP status")),
  []);

  const loadRevenue = useCallback((dashToken: string) => {
    if (!dashToken) { setRevenue(null); return Promise.resolve(); }
    return fetch("/api/autogroup/revenue", { cache: "no-store", headers: { "x-dash-token": dashToken } })
      .then((response) => response.json())
      .then((body: Revenue) => setRevenue(body))
      .catch(() => setRevenue({ connected: false, reason: "Could not reach the revenue endpoint" }));
  }, []);

  const loadOps = useCallback((dashToken: string) => {
    if (!dashToken) { setOps(null); return Promise.resolve(); }
    return fetch("/api/autogroup/ops", { cache: "no-store", headers: { "x-dash-token": dashToken } })
      .then((response) => response.json())
      .then((body: Ops) => setOps(body))
      .catch(() => setOps({ reason: "Could not reach the ops endpoint" }));
  }, []);

  useEffect(() => {
    const initial = setTimeout(() => {
      setManual(loadManual());
      setCash(loadMoney());
      let saved = "";
      try { saved = window.localStorage.getItem(TOKEN_KEY) ?? ""; } catch { /* storage blocked: token must be re-entered */ }
      setToken(saved);
      setReady(true);
      refresh();
      loadRevenue(saved);
      loadOps(saved);
    }, 0);
    return () => clearTimeout(initial);
  }, [refresh, loadRevenue, loadOps]);

  const saveToken = (value: string) => {
    setToken(value);
    try { window.localStorage.setItem(TOKEN_KEY, value); } catch { /* storage blocked: token will not persist */ }
    loadRevenue(value);
    loadOps(value);
  };

  const importBot = (text: string) => {
    const parsed = parseBotSummary(text);
    if (!parsed) { setBotError("Not a paper-bot summary.json (needs paper_only and gate.checks)."); return; }
    setBotError(null);
    setManual((current) => ({ ...current, bot: parsed }));
  };

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(manual)); } catch { /* storage blocked: manual tracker just won't persist */ }
  }, [manual, ready]);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(MONEY_KEY, JSON.stringify(cash)); } catch { /* storage blocked: figures just won't persist */ }
  }, [cash, ready]);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const intervalMs = (data?.monitoring.intervalSeconds ?? 60) * 1000;
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => { refresh(); loadRevenue(token); loadOps(token); }, intervalMs);
    return () => clearInterval(timer);
  }, [paused, refresh, intervalMs, loadRevenue, loadOps, token]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (event.key === "r") refresh();
      if (event.key === "p") setPaused((value) => !value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [refresh]);

  const ageSeconds = data ? Math.max(0, Math.round((now - new Date(data.generatedAt).getTime()) / 1000)) : null;
  const stale = data != null && ageSeconds != null && ageSeconds > data.monitoring.intervalSeconds * 3;
  // Fail closed: a failed or stale read is shown as OFFLINE, never as the last known GREEN.
  const shownStatus = data == null ? "LOADING" : error || stale ? "OFFLINE" : data.status;

  const alerts = useMemo(
    () => [...(data?.alerts ?? [])].sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)),
    [data],
  );
  const accounts = useMemo(
    () => [...(data?.accounts ?? [])].sort((a, b) => STATE_ORDER.indexOf(a.state) - STATE_ORDER.indexOf(b.state)),
    [data],
  );

  const daysLeft = Math.ceil((new Date(`${REVENUE_DEADLINE}T23:59:59`).getTime() - now) / 86_400_000);
  const stripeLive = revenue?.connected === true;
  const kits = stripeLive ? Math.min(KITS_GOAL, revenue?.kits ?? 0) : manual.kits;
  const depositSigned = stripeLive ? (revenue?.deposits ?? 0) > 0 : manual.deposit;
  const goalDone = kits + (depositSigned ? 1 : 0);
  const goalPct = Math.round((goalDone / (KITS_GOAL + 1)) * 100);
  const botChecks = manual.bot ? [manual.bot.checks.days, manual.bot.checks.trades, manual.bot.checks.positive, manual.bot.checks.drawdown] : null;
  const gateValue = (i: number) => (botChecks && i < botChecks.length ? botChecks[i] : manual.gate[i]);
  const gateDone = GATE_ITEMS.filter((_, i) => gateValue(i)).length;

  const plan = useMemo(() => planCashFlow(cash), [cash]);
  const planHasInput = Object.values(cash).some((v) => v.trim() !== "");

  const exportSnapshot = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), snapshot: data, manual }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `autogroup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>AUTOGROUP 247</h1>
          <p className={styles.sub}>Financial operations &amp; security command center</p>
        </div>
        <div className={styles.controls}>
          <span className={`${styles.pill} ${styles[shownStatus]}`} aria-live="polite">{shownStatus}</span>
          <button className={styles.btn} onClick={refresh} title="Shortcut: R">Refresh</button>
          <button className={styles.btn} onClick={() => setPaused((value) => !value)} aria-pressed={paused} title="Shortcut: P">{paused ? "Resume" : "Pause"}</button>
          <button className={styles.btn} onClick={exportSnapshot} disabled={!data}>Export JSON</button>
        </div>
      </header>

      {error && <p role="alert" className={`${styles.banner} ${styles.bannerBad}`}>{error}. Showing OFFLINE until a fresh read succeeds.</p>}
      {stale && !error && <p role="alert" className={`${styles.banner} ${styles.bannerBad}`}>Data is {ageSeconds}s old (expected every {data?.monitoring.intervalSeconds}s). Treating as OFFLINE.</p>}

      {data && <>
        <section className={styles.grid} aria-label="Totals">
          {([
            ["Accounts", data.totals.accounts],
            ["Verified", data.totals.green],
            ["Needs review", data.totals.amber + data.totals.red],
            ["Offline", data.totals.offline],
            ["Available cash", money(data.totals.availableBalance)],
            ["Open alerts", data.alerts.length],
          ] as const).map(([label, value]) => (
            <article key={label} className={styles.stat}><div className={styles.statLabel}>{label}</div><div className={styles.statValue}>{value}</div></article>
          ))}
        </section>

        <div className={styles.cols}>
          <section className={styles.card}>
            <h2>Action Center</h2>
            {alerts.length ? alerts.map((a, i) => (
              <div key={i} className={styles.row}><span><span className={`${styles.sev} ${styles[a.severity] ?? styles.P3}`}>{a.severity}</span>{a.message}</span>{a.accountId && <span className={styles.muted}>{a.accountId}</span>}</div>
            )) : <p className={styles.muted}>No unresolved alerts.</p>}
          </section>

          <section className={styles.card}>
            <h2>Accounts</h2>
            {accounts.length ? accounts.map((a) => (
              <div key={a.id} className={styles.row}>
                <div><strong>{a.name}</strong><div className={styles.muted}>{a.institution} · {a.lastSync ?? "no sync"}</div></div>
                <div style={{ textAlign: "right" }}><span className={`${styles.pill} ${styles[a.state] ?? styles.OFFLINE}`} style={{ padding: "2px 10px" }}>{a.state}</span><div>{money(a.balance)}</div></div>
              </div>
            )) : <p className={styles.muted}><strong>No financial account connectors are configured.</strong> The control plane is installed and fail-closed; connect verified account sources before declaring GREEN.</p>}
          </section>
        </div>
      </>}

      <div className={styles.cols}>
        <section className={styles.card}>
          <h2>Revenue goal · {daysLeft >= 0 ? `${daysLeft} days left` : "deadline passed"}</h2>
          <p className={styles.muted} style={{ margin: 0 }}>{KITS_GOAL} paid kits + 1 signed sprint deposit by {REVENUE_DEADLINE}. {stripeLive ? `Live from Stripe (read-only) since ${revenue?.since}${revenue?.truncated ? ", first 100 charges only" : ""}.` : "Manual entry until Stripe is connected."}</p>
          <div className={styles.bar} role="progressbar" aria-valuenow={goalPct} aria-valuemin={0} aria-valuemax={100} aria-label="Revenue goal progress"><div className={styles.barFill} style={{ width: `${goalPct}%` }} /></div>
          {stripeLive ? <>
            <div className={styles.field}>Kits sold ($47)<strong>{kits} / {KITS_GOAL}</strong></div>
            <div className={styles.field}>Sprint deposit ($2,500+)<strong>{depositSigned ? "Yes" : "No"}</strong></div>
            <div className={styles.field}>Gross paid since start<strong>{money((revenue?.grossCents ?? 0) / 100)}</strong></div>
          </> : <>
            <label className={styles.field}>Kits sold ($47)
              <input className={styles.input} type="number" min={0} max={KITS_GOAL} value={manual.kits} onChange={(e) => setManual({ ...manual, kits: Math.min(KITS_GOAL, Math.max(0, Number(e.target.value) || 0)) })} />
            </label>
            <label className={styles.field}>Sprint deposit signed ($2,500)
              <input type="checkbox" checked={manual.deposit} onChange={(e) => setManual({ ...manual, deposit: e.target.checked })} />
            </label>
          </>}
          <label className={styles.field}>Dashboard token
            <input className={styles.input} style={{ width: "10rem" }} type="password" autoComplete="off" value={token} onChange={(e) => saveToken(e.target.value)} placeholder="AUTOGROUP_DASH_TOKEN" />
          </label>
          {token && !stripeLive && revenue?.reason && <p className={styles.muted} style={{ margin: "4px 0 0" }}>Stripe not connected: {revenue.reason}.</p>}
        </section>

        <section className={styles.card}>
          <h2>Paper-to-live gate · {gateDone}/{GATE_ITEMS.length}</h2>
          <p className={styles.muted} style={{ margin: "0 0 8px" }}>Import the bot&apos;s summary.json to fill in the first four checks. Kill-switch is always manual. Agents never place live orders.</p>
          {manual.bot && <p className={styles.muted} style={{ margin: "0 0 8px" }}>Bot: {manual.bot.closedTrades ?? "?"} closed trades · {manual.bot.daysRunning ?? "?"} days · return {manual.bot.returnPct ?? "?"}% · fees ${manual.bot.feesPaid ?? "?"} · max drawdown {manual.bot.maxDrawdownPct ?? "?"}%</p>}
          {GATE_ITEMS.map((item, i) => (
            <label key={item} className={styles.check}>
              <input type="checkbox" checked={gateValue(i)} disabled={botChecks != null && i < botChecks.length} onChange={(e) => setManual({ ...manual, gate: manual.gate.map((v, j) => (j === i ? e.target.checked : v)) })} />
              {item}
            </label>
          ))}
          <label className={styles.field} style={{ marginTop: 8 }}>Import summary.json
            <input type="file" accept="application/json,.json" onChange={(e) => { const file = e.target.files?.[0]; if (file) file.text().then(importBot); e.target.value = ""; }} />
          </label>
          {botError && <p role="alert" className={styles.muted} style={{ margin: "4px 0 0" }}>{botError}</p>}
        </section>
      </div>

      <section className={styles.card} style={{ marginTop: 16 }}>
        <h2>Money flow plan</h2>
        <p className={styles.muted} style={{ margin: "0 0 8px" }}>Type your balances (kept only in this browser). It suggests where each dollar should go; you make the transfers in your bank app. Nothing here moves money. Confirm the tax rate and retirement plan with a CPA.</p>
        {MONEY_FIELDS.map(([key, label]) => (
          <label key={key} className={styles.field}>{label}
            <input className={styles.input} style={{ width: "8rem" }} type="number" inputMode="decimal" value={cash[key]} onChange={(e) => setCash({ ...cash, [key]: e.target.value })} />
          </label>
        ))}
        {planHasInput && <>
          {plan.alerts.map((a, i) => (
            <div key={i} className={styles.row}><span><span className={`${styles.sev} ${styles[a.severity] ?? styles.P3}`}>{a.severity}</span>{a.message}</span></div>
          ))}
          {plan.transfers.map((t, i) => (
            <div key={i} className={styles.row}><span><strong>{i + 1}.</strong> {t.from} → {t.to}: <strong>{money(t.amount)}</strong><span className={styles.muted}> · {t.reason}</span></span></div>
          ))}
          <p className={styles.muted} style={{ margin: "8px 0 0" }}>Operating buffer target {money(plan.buffer)} · runway {plan.runwayMonths ?? "—"} months · idle {money(plan.idle)}</p>
        </>}
      </section>

      <section className={styles.card} style={{ marginTop: 16 }}>
        <h2>Ops feed</h2>
        {!token && <p className={styles.muted}>Enter the dashboard token to load open PRs, CI and the Linear HQ update.</p>}
        {token && ops?.reason && <p className={styles.muted}>Ops feed unavailable: {ops.reason}.</p>}
        {ops?.github && (ops.github.connected ? (
          ops.github.pulls?.length ? ops.github.pulls.map((pr) => (
            <div key={`${pr.repo}#${pr.number}`} className={styles.row}>
              <span><a href={pr.url} target="_blank" rel="noopener noreferrer">{pr.repo.split("/")[1]}#{pr.number}</a> {pr.title}{pr.draft ? " (draft)" : ""}</span>
              <span className={`${styles.pill} ${pr.ci === "failing" ? styles.RED : pr.ci === "pending" ? styles.AMBER : pr.ci === "passing" ? styles.GREEN : styles.OFFLINE}`} style={{ padding: "2px 10px" }}>{pr.ci}</span>
            </div>
          )) : <p className={styles.muted}>No open PRs.</p>
        ) : <p className={styles.muted}>GitHub not connected: {ops.github.reason}.</p>)}
        {ops?.linear && (ops.linear.connected ? (
          ops.linear.project ? <div className={styles.row} style={{ display: "block" }}>
            <strong>{ops.linear.project.name}</strong> · {ops.linear.project.state}{ops.linear.project.update?.health ? ` · ${ops.linear.project.update.health}` : ""}
            {ops.linear.project.update && <p className={styles.muted} style={{ whiteSpace: "pre-wrap", margin: "6px 0 0" }}>{ops.linear.project.update.body}</p>}
          </div> : <p className={styles.muted}>Linear project not found.</p>
        ) : <p className={styles.muted}>Linear not connected: {ops.linear.reason}.</p>)}
      </section>

      <section className={styles.card} style={{ marginTop: 16 }}>
        <h2>Launchpad</h2>
        <div className={styles.launch}>
          {LAUNCH.map((l) => (
            <a key={l.label} className={styles.link} href={l.href} target="_blank" rel="noopener noreferrer"><strong>{l.label}</strong><span className={styles.linkNote}>{l.note}</span></a>
          ))}
        </div>
      </section>

      {data && <p className={styles.foot}>
        Last evaluation {new Date(data.generatedAt).toLocaleString()} ({ageSeconds}s ago) · {paused ? "auto-refresh paused" : `refreshing every ${data.monitoring.intervalSeconds}s`} · Fail-closed: {String(data.monitoring.failClosed)} · Keys: R refresh, P pause · Money movement stays authorization-gated.
      </p>}
    </main>
  );
}
