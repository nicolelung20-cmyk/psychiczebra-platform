"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type Manual = { kits: number; deposit: boolean; gate: boolean[] };
const GATE_ITEMS = [
  "90+ days of paper trading",
  "30+ closed paper trades",
  "Positive after fees",
  "Max drawdown under 10%",
  "Kill-switch tested",
];
const DEFAULT_MANUAL: Manual = { kits: 0, deposit: false, gate: GATE_ITEMS.map(() => false) };

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

  const refresh = useCallback(() =>
    fetch("/api/autogroup/status", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Status endpoint returned ${response.status}`);
        return response.json();
      })
      .then((snapshot: Snapshot) => { setData(snapshot); setError(null); })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to read AUTOGROUP status")),
  []);

  useEffect(() => {
    const initial = setTimeout(() => { setManual(loadManual()); setReady(true); refresh(); }, 0);
    return () => clearTimeout(initial);
  }, [refresh]);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(manual)); } catch { /* storage blocked: manual tracker just won't persist */ }
  }, [manual, ready]);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const intervalMs = (data?.monitoring.intervalSeconds ?? 60) * 1000;
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(refresh, intervalMs);
    return () => clearInterval(timer);
  }, [paused, refresh, intervalMs]);

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
  const goalDone = manual.kits + (manual.deposit ? 1 : 0);
  const goalPct = Math.round((goalDone / (KITS_GOAL + 1)) * 100);
  const gateDone = manual.gate.filter(Boolean).length;

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
          <p className={styles.muted} style={{ margin: 0 }}>{KITS_GOAL} paid kits + 1 signed sprint deposit by {REVENUE_DEADLINE}. Manual entry until Stripe is connected.</p>
          <div className={styles.bar} role="progressbar" aria-valuenow={goalPct} aria-valuemin={0} aria-valuemax={100} aria-label="Revenue goal progress"><div className={styles.barFill} style={{ width: `${goalPct}%` }} /></div>
          <label className={styles.field}>Kits sold ($47)
            <input className={styles.input} type="number" min={0} max={KITS_GOAL} value={manual.kits} onChange={(e) => setManual({ ...manual, kits: Math.min(KITS_GOAL, Math.max(0, Number(e.target.value) || 0)) })} />
          </label>
          <label className={styles.field}>Sprint deposit signed ($2,500)
            <input type="checkbox" checked={manual.deposit} onChange={(e) => setManual({ ...manual, deposit: e.target.checked })} />
          </label>
        </section>

        <section className={styles.card}>
          <h2>Paper-to-live gate · {gateDone}/{GATE_ITEMS.length}</h2>
          <p className={styles.muted} style={{ margin: "0 0 8px" }}>Tick each item only after checking the bot&apos;s summary. Agents never place live orders.</p>
          {GATE_ITEMS.map((item, i) => (
            <label key={item} className={styles.check}>
              <input type="checkbox" checked={manual.gate[i]} onChange={(e) => setManual({ ...manual, gate: manual.gate.map((v, j) => (j === i ? e.target.checked : v)) })} />
              {item}
            </label>
          ))}
        </section>
      </div>

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
