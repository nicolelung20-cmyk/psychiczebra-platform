"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Status = {
  connected: boolean;
  apiKeyConfigured: boolean;
  sessionEstablished?: boolean;
  server?: string;
  capabilities?: string;
  nextStep?: string | null;
  error?: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!;

export default function OpenSeaCommandCenter() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    let active = true;

    async function connect() {
      try {
        const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) {
          if (active) setStatus({
            connected: false,
            apiKeyConfigured: false,
            error: "Sign in to ANNE to access the private OpenSea connection.",
          });
          return;
        }

        const response = await fetch("/api/opensea/tools", {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "OpenSea connection check failed.");
        if (active) setStatus(result);
      } catch (error) {
        if (active) setStatus({
          connected: false,
          apiKeyConfigured: false,
          error: error instanceof Error ? error.message : "OpenSea connection failed.",
        });
      }
    }

    void connect();
    return () => { active = false; };
  }, []);

  return (
    <main style={{ minHeight: "100vh", padding: "48px 24px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <p style={{ letterSpacing: ".12em", textTransform: "uppercase", opacity: .65 }}>ANNE · ELEVAT</p>
        <h1 style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)", margin: "12px 0" }}>OpenSea Command Center</h1>
        <p style={{ maxWidth: 700, fontSize: 18, lineHeight: 1.6, opacity: .8 }}>
          Private, owner-authenticated connection to OpenSea MCP. Market-data and wallet capabilities remain separate from transaction signing.
        </p>
        <section style={{ marginTop: 32, padding: 24, border: "1px solid #555", borderRadius: 20 }}>
          <h2>Connection</h2>
          {!status && <p>Checking owner session…</p>}
          {status && (
            <>
              <p><strong>{status.connected ? "● OpenSea reachable" : "○ Not connected"}</strong></p>
              <p>{status.apiKeyConfigured ? "OpenSea API key configured server-side." : "OpenSea is reachable in limited mode; an API key is required for data tools."}</p>
              {status.server && <p>Service: {status.server}</p>}
              {status.capabilities && <p>Access: {status.capabilities}</p>}
              {status.nextStep && <p>{status.nextStep}</p>}
              {status.error && <p role="alert">{status.error}</p>}
            </>
          )}
        </section>
        <section style={{ marginTop: 24, padding: 24, border: "1px solid #555", borderRadius: 20 }}>
          <h2>Transaction policy</h2>
          <p>Read-only discovery is the default. Listing, purchasing, transfers, wallet signing, minting, and contract deployment remain disabled until separately reviewed and explicitly approved.</p>
        </section>
        <p style={{ marginTop: 32 }}>
          <a href="/">← Back to ANNE</a>
        </p>
      </div>
    </main>
  );
}
