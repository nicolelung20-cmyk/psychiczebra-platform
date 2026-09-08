"use client";

import { FormEvent, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AuthPanel({ configured }: { configured: boolean }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    const { error } = await getSupabaseBrowserClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setMessage(error ? error.message : "Check your inbox for your secure sign-in link.");
    setSending(false);
  }

  return (
    <section className="panel">
      <p className="eyebrow">GET STARTED</p>
      <h2>{configured ? "Your work, amplified." : "Add your credentials to launch."}</h2>
      {configured ? (
        <form onSubmit={signIn}>
          <p>Sign in with a magic link. New accounts start with 20 free AI requests.</p>
          <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" aria-label="Email address" />
          <button disabled={sending}>{sending ? "Sending..." : "Email me a sign-in link"}</button>
          {message && <p className={message.startsWith("Check") ? "fineprint" : "error"}>{message}</p>}
        </form>
      ) : (
        <p>Copy <code>.env.example</code> to <code>.env.local</code>, add your Supabase credentials, and restart the app. Full launch instructions are in the README.</p>
      )}
    </section>
  );
}
