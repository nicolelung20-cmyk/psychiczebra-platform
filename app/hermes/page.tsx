"use client";

import { FormEvent, useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Message = { role: "user" | "assistant"; content: string };
type JobSnapshot = {
  id: string;
  status: string;
  output?: { text?: string; message?: string; provider?: string; model?: string } | null;
  error?: string | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!;

async function waitForJob(jobId: string, accessToken: string, maxWaitMs = 30_000): Promise<JobSnapshot | null> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const response = await fetch("/api/command", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const snapshot = await response.json();
    const job = (snapshot.jobs ?? []).find((item: JobSnapshot) => item.id === jobId) as JobSnapshot | undefined;
    if (job && (job.status === "succeeded" || job.status === "failed")) return job;
    await new Promise((resolve) => window.setTimeout(resolve, 2000));
  }
  return null;
}

export default function HermesPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hermes is online. Tell me what you want done. I’ll plan it, route it, execute through the available worker pipeline, and report the verified result." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Connecting…");
  const [email, setEmail] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      if (!data.session) {
        setStatus("Sign in required");
        setSessionReady(false);
        return;
      }
      setSessionReady(true);
      try {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/hermes-gateway`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
          cache: "no-store",
        });
        const j = await r.json();
        setStatus(r.ok && j?.status === "active" ? "Gateway connected" : "Gateway degraded");
      } catch {
        setStatus("Gateway unavailable");
      }
    });
    return () => { mounted = false; };
  }, []);

  async function signIn(e: FormEvent) {
    e.preventDefault();
    setAuthMessage("");
    const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/auth/callback?next=/hermes" },
    });
    setAuthMessage(error ? error.message : "Check your email for the secure Hermes sign-in link.");
  }

  async function run(e?: FormEvent) {
    e?.preventDefault();
    const commandText = input.trim();
    if (!commandText || busy || !sessionReady) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: commandText }]);
    setBusy(true);
    try {
      const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Secure Hermes session required.");
      const r = await fetch(`${SUPABASE_URL}/functions/v1/hermes-gateway`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          command: "run",
          input: commandText,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.detail || j?.error || "Hermes execution failed");

      if (!j.job_id) {
        setMessages((m) => [...m, { role: "assistant", content: j.message || "Hermes returned no job identifier; no completion is being assumed." }]);
        setStatus("Accepted");
        return;
      }

      setStatus("Queued · checking shared ledger");
      const job = await waitForJob(j.job_id, data.session.access_token);
      if (job?.status === "succeeded") {
        const output = job.output?.text ?? job.output?.message ?? JSON.stringify(job.output ?? {});
        setMessages((m) => [...m, { role: "assistant", content: output || "The worker marked the job successful but returned no text output." }]);
        setStatus("Verified complete");
      } else if (job?.status === "failed") {
        setMessages((m) => [...m, { role: "assistant", content: `Job failed: ${job.error || "No error detail was recorded."}` }]);
        setStatus("Failed");
      } else {
        setMessages((m) => [...m, {
          role: "assistant",
          content: `Job ${j.job_id} was accepted and is still queued or running. The shared worker has not recorded a verified completion yet.`,
        }]);
        setStatus("Awaiting worker");
      }
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Unknown error"}` }]);
      setStatus("Degraded");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 18px", minHeight: "70vh" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 20 }}>
        <div>
          <p style={{ margin: 0, opacity: .65, fontSize: 13 }}>ELEVAT AI</p>
          <h1 style={{ margin: "4px 0", fontSize: 30 }}>Hermes</h1>
          <p style={{ margin: 0, opacity: .7 }}>Owner command center · shared job ledger</p>
        </div>
        <span aria-live="polite" style={{ padding: "8px 12px", border: "1px solid currentColor", borderRadius: 999, fontSize: 13 }}>
          ● {status}
        </span>
      </header>

      {!sessionReady && status === "Sign in required" && (
        <section aria-label="Hermes sign in" style={{ marginBottom: 14, padding: 16, border: "1px solid rgba(127,127,127,.25)", borderRadius: 14 }}>
          <strong>One secure sign-in to activate your owner session</strong>
          <form onSubmit={signIn} style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" aria-label="Email address" style={{ flex: 1, minWidth: 0, minHeight: 44, borderRadius: 10, border: "1px solid rgba(127,127,127,.35)", padding: "0 12px" }} />
            <button type="submit" style={{ border: 0, borderRadius: 10, padding: "0 14px", fontWeight: 700 }}>Activate</button>
          </form>
          {authMessage && <p style={{ marginBottom: 0, fontSize: 13, opacity: .75 }}>{authMessage}</p>}
        </section>
      )}

      <section aria-label="Hermes conversation" style={{ border: "1px solid rgba(127,127,127,.25)", borderRadius: 18, padding: 14, minHeight: 420 }}>
        <div style={{ display: "grid", gap: 12 }}>
          {messages.map((m, i) => (
            <article key={i} style={{ justifySelf: m.role === "user" ? "end" : "start", maxWidth: "88%", padding: "11px 14px", borderRadius: 14, background: m.role === "user" ? "var(--accent-color, #1f7a4d)" : "rgba(127,127,127,.10)", color: m.role === "user" ? "#fff" : "inherit", whiteSpace: "pre-wrap" }}>
              {m.content}
            </article>
          ))}
          {busy && <article aria-live="polite" style={{ opacity: .65 }}>Hermes is checking the shared job ledger…</article>}
        </div>
      </section>

      <form onSubmit={run} style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <input aria-label="Command Hermes" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tell Hermes what you want done…" disabled={busy || !sessionReady} style={{ flex: 1, minWidth: 0, minHeight: 48, borderRadius: 12, border: "1px solid rgba(127,127,127,.35)", padding: "0 14px", fontSize: 16 }} />
        <button type="submit" disabled={busy || !sessionReady || !input.trim()} style={{ minWidth: 88, border: 0, borderRadius: 12, padding: "0 18px", fontWeight: 800 }}>
          {busy ? "Checking…" : "Run"}
        </button>
      </form>

      <p style={{ marginTop: 12, fontSize: 12, opacity: .6 }}>
        Commands are confirmed against the shared job ledger. Consequential financial transfers, live trading, contracts, and similar high-impact actions remain approval-gated.
      </p>
    </main>
  );
}
