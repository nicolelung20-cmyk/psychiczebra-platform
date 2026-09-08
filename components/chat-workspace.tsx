"use client";

import { FormEvent, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Message = { role: "user" | "assistant"; content: string };

export function ChatWorkspace({ user }: { user: User }) {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: "What would you like to make progress on today?" }]);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const content = prompt.trim();
    if (!content || working) return;
    setWorking(true);
    setError("");
    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setPrompt("");
    const { data: { session } } = await getSupabaseBrowserClient().auth.getSession();
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
      body: JSON.stringify({ messages: nextMessages.slice(-12) }),
    });
    const payload = await response.json() as { error?: string; message?: string };
    if (!response.ok || !payload.message) {
      setError(payload.error ?? "The AI request could not be completed.");
      setMessages(nextMessages);
    } else {
      setMessages([...nextMessages, { role: "assistant", content: payload.message }]);
    }
    setWorking(false);
  }

  async function upgrade() {
    const { data: { session } } = await getSupabaseBrowserClient().auth.getSession();
    const response = await fetch("/api/billing/checkout", { method: "POST", headers: { Authorization: `Bearer ${session?.access_token ?? ""}` } });
    const payload = await response.json() as { url?: string; error?: string };
    if (payload.url) window.location.assign(payload.url);
    else setError(payload.error ?? "Billing is not configured yet.");
  }

  return (
    <section className="workspace">
      <aside className="sidebar">
        <div><strong>{user.email}</strong><p>Free accounts include 20 messages. Upgrade for 500 per month.</p></div>
        <button className="upgrade" onClick={upgrade}>Upgrade to Pro</button>
      </aside>
      <div className="chat">
        <div className="messages">
          {messages.map((message, index) => <div className={`message ${message.role}`} key={`${message.role}-${index}`}>{message.content}</div>)}
          {working && <div className="message assistant">Thinking...</div>}
          {error && <p className="error">{error}</p>}
        </div>
        <form className="composer" onSubmit={submit}>
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ask anything..." aria-label="Message" />
          <button disabled={working}>Send</button>
        </form>
      </div>
    </section>
  );
}
