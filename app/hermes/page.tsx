"use client";

import { FormEvent, useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Message = { role: "user" | "assistant"; content: string };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function HermesPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hermes is ready. Ask me to inspect status, run a paper-trading check, or analyze the system." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Connecting…");

  useEffect(() => {
    const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      if (!data.session) {
        setStatus("Sign in required");
        return;
      }
      try {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/hermes-gateway`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
        const j = await r.json();
        setStatus(r.ok && j?.status === "active" ? "Online" : "Degraded");
      } catch {
        setStatus("Offline");
      }
    });
    return () => { mounted = false; };
  }, []);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setBusy(true);
    try {
      const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Sign in to use Hermes.");
      const r = await fetch(`${SUPABASE_URL}/functions/v1/hermes-gateway`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          command: "chat",
          messages: [...messages, { role: "user", content: text }],
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.detail || j?.error || "Hermes request failed");
      setMessages((m) => [...m, { role: "assistant", content: j.message || "Hermes returned no text." }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Unknown error"}` }]);
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
          <p style={{ margin: 0, opacity: .7 }}>Interactive command center</p>
        </div>
        <span aria-live="polite" style={{ padding: "8px 12px", border: "1px solid currentColor", borderRadius: 999, fontSize: 13 }}>
          ● {status}
        </span>
      </header>

      <section aria-label="Hermes conversation" style={{ border: "1px solid rgba(127,127,127,.25)", borderRadius: 18, padding: 14, minHeight: 420 }}>
        <div style={{ display: "grid", gap: 12 }}>
          {messages.map((m, i) => (
            <article key={i} style={{ justifySelf: m.role === "user" ? "end" : "start", maxWidth: "88%", padding: "11px 14px", borderRadius: 14, background: m.role === "user" ? "var(--accent-color, #1f7a4d)" : "rgba(127,127,127,.10)", color: m.role === "user" ? "#fff" : "inherit", whiteSpace: "pre-wrap" }}>
              {m.content}
            </article>
          ))}
          {busy && <article aria-live="polite" style={{ opacity: .65 }}>Hermes is thinking…</article>}
        </div>
      </section>

      <form onSubmit={send} style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <input aria-label="Message Hermes" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Hermes…" disabled={busy} style={{ flex: 1, minWidth: 0, minHeight: 48, borderRadius: 12, border: "1px solid rgba(127,127,127,.35)", padding: "0 14px", fontSize: 16 }} />
        <button type="submit" disabled={busy || !input.trim()} style={{ minWidth: 88, border: 0, borderRadius: 12, padding: "0 18px", fontWeight: 700 }}>
          Send
        </button>
      </form>

      <p style={{ marginTop: 12, fontSize: 12, opacity: .6 }}>
        Hermes commands remain server-authorized. This interface does not expose service keys or enable live trading.
      </p>
    </main>
  );
}
