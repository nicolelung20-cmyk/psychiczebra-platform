"use client";

import { useEffect, useState } from "react";

type Snapshot = {
  status: "GREEN" | "AMBER" | "RED" | "OFFLINE";
  generatedAt: string;
  monitoring: { intervalSeconds: number; failClosed: boolean };
  totals: { accounts: number; green: number; amber: number; red: number; offline: number; balance: number; availableBalance: number };
  alerts: { severity: string; message: string }[];
  accounts: { id: string; name: string; institution: string; balance: number | null; lastSync: string | null; state: string }[];
  controlFlow: string[];
};

const money = (value: number | null) => value == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(value);

export default function AutogroupPage() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = () =>
      fetch("/api/autogroup/status", { cache: "no-store" })
        .then((response) => {
          if (!response.ok) throw new Error(`Status endpoint returned ${response.status}`);
          return response.json();
        })
        .then((snapshot: Snapshot) => {
          if (!active) return;
          setData(snapshot);
          setError(null);
        })
        .catch((err) => {
          if (active) setError(err instanceof Error ? err.message : "Unable to read AUTOGROUP status");
        });
    refresh();
    const timer = setInterval(refresh, 60_000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 32, fontFamily: "system-ui", color: "#182230" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
        <div><h1 style={{ marginBottom: 4 }}>AUTOGROUP 247</h1><p style={{ marginTop: 0, color: "#667085" }}>Financial operations & security command center</p></div>
        <strong style={{ padding: "8px 14px", borderRadius: 999, background: data?.status === "GREEN" ? "#dff6e7" : data?.status === "RED" ? "#ffd9d9" : "#fff0c2" }}>{data?.status ?? "LOADING"}</strong>
      </header>
      {error && <p role="alert">{error}</p>}
      {data && <>
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginTop: 24 }}>
          {[['Accounts', data.totals.accounts], ['Verified', data.totals.green], ['Available cash', money(data.totals.availableBalance)], ['Alerts', data.alerts.length]].map(([label, value]) => <article key={String(label)} style={{ border: "1px solid #e4e7ec", borderRadius: 12, padding: 18 }}><small>{label}</small><div style={{ fontSize: 25, fontWeight: 800, marginTop: 6 }}>{value}</div></article>)}
        </section>
        <section style={{ marginTop: 24, border: "1px solid #e4e7ec", borderRadius: 12, padding: 18 }}><h2>Control flow</h2><p>{data.controlFlow.join(" → ")}</p></section>
        <section style={{ marginTop: 24, border: "1px solid #e4e7ec", borderRadius: 12, padding: 18 }}><h2>Action Center</h2>{data.alerts.length ? data.alerts.map((a, i) => <p key={i}><strong>{a.severity}</strong> · {a.message}</p>) : <p>No unresolved alerts.</p>}</section>
        <section style={{ marginTop: 24, border: "1px solid #e4e7ec", borderRadius: 12, padding: 18 }}><h2>Accounts</h2>{data.accounts.length ? data.accounts.map(a => <div key={a.id} style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #eee", padding: "14px 0" }}><div><strong>{a.name}</strong><div style={{ color: "#667085" }}>{a.institution} · {a.lastSync ?? "no sync"}</div></div><div><strong>{a.state}</strong><div>{money(a.balance)}</div></div></div>) : <p><strong>No financial account connectors are configured.</strong> The control plane is installed and fail-closed; connect verified account sources before declaring GREEN.</p>}</section>
        <p style={{ marginTop: 18, color: "#667085" }}>Last evaluation: {new Date(data.generatedAt).toLocaleString()} · Polling every {data.monitoring.intervalSeconds}s · Fail-closed: {String(data.monitoring.failClosed)}</p>
      </>}
    </main>
  );
}
