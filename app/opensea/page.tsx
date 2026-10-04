"use client";

import { useEffect, useState } from "react";

type Status = {
  connected: boolean;
  authenticated: boolean;
  toolCount?: number;
  tools?: string[];
  error?: string;
};

export default function OpenSeaCommandCenter() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/opensea/tools")
      .then((r) => r.json())
      .then(setStatus)
      .catch((error) => setStatus({ connected: false, authenticated: false, error: String(error) }));
  }, []);

  return (
    <main style={{ minHeight: "100vh", padding: "48px 24px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <p style={{ letterSpacing: ".12em", textTransform: "uppercase", opacity: .65 }}>Elevated AI</p>
        <h1 style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)", margin: "12px 0" }}>OpenSea Command Center</h1>
        <p style={{ maxWidth: 700, fontSize: 18, lineHeight: 1.6, opacity: .8 }}>
          Direct server-side connection to OpenSea MCP. This is the Web3 market-data layer for the Elevat / Hermes stack.
        </p>
        <section style={{ marginTop: 32, padding: 24, border: "1px solid #ddd", borderRadius: 20 }}>
          <h2>Connection</h2>
          {!status && <p>Connecting…</p>}
          {status && (
            <>
              <p><strong>{status.connected ? "● Connected" : "○ Offline"}</strong></p>
              <p>{status.authenticated ? "API-key authenticated" : "Handshake/tool discovery available; add OPENSEA_API_KEY for data tools"}</p>
              {status.toolCount !== undefined && <p><strong>{status.toolCount}</strong> MCP tools discovered.</p>}
              {status.error && <pre style={{ whiteSpace: "pre-wrap" }}>{status.error}</pre>}
            </>
          )}
        </section>
        {status?.tools?.length ? (
          <section style={{ marginTop: 24, padding: 24, border: "1px solid #ddd", borderRadius: 20 }}>
            <h2>Available capabilities</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
              {status.tools.map((tool) => (
                <span key={tool} style={{ padding: "8px 12px", borderRadius: 999, background: "#f1f1f1", fontSize: 13 }}>
                  {tool}
                </span>
              ))}
            </div>
          </section>
        ) : null}
        <p style={{ marginTop: 32 }}>
          <a href="/">← Back to Elevated AI</a>
        </p>
      </div>
    </main>
  );
}
