"use client";

import { FormEvent, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const AUTH_CALLBACK = "/auth/callback?next=/hermes";

export function AuthPanel({ configured }: { configured: boolean }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setMessage("");
    try {
      const { error } = await getSupabaseBrowserClient().auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + AUTH_CALLBACK },
      });
      setMessage(error ? error.message : "Check your inbox for your secure sign-in link.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start email sign-in.");
    } finally {
      setSending(false);
    }
  }

  async function signInWithApple() {
    setSending(true);
    setMessage("");
    try {
      const { error } = await getSupabaseBrowserClient().auth.signInWithOAuth({
        provider: "apple",
        options: { redirectTo: window.location.origin + AUTH_CALLBACK },
      });
      if (error) setMessage(error.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start Apple sign-in.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="panel">
      <p className="eyebrow">GET STARTED</p>
      <h2>{configured ? "Make every decision count." : "Add your credentials to launch."}</h2>
      {configured ? (
        <>
          <button
            type="button"
            onClick={signInWithApple}
            disabled={sending}
            aria-label="Sign in with Apple"
            style={{
              display: "flex",
              width: "100%",
              minHeight: 48,
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              border: "1px solid #000",
              borderRadius: 8,
              background: "#000",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              cursor: sending ? "wait" : "pointer",
              opacity: sending ? 0.7 : 1,
            }}
          >
            <svg aria-hidden="true" viewBox="0 0 20 24" width="17" height="20" fill="currentColor">
              <path d="M16.7 12.7c0-2.1 1.7-3.1 1.8-3.2-1-1.5-2.6-1.7-3.2-1.8-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.7-.4 6.6 1.1 8.8.7 1.1 1.6 2.3 2.7 2.2 1.1 0 1.5-.7 2.9-.7s1.8.7 2.9.7c1.2 0 1.9-1.1 2.6-2.2.8-1.2 1.1-2.4 1.1-2.5-.1 0-2-.8-2-3.5ZM14.4 6.2c.6-.8 1-1.9.9-3-1 .1-2.2.7-2.9 1.5-.6.7-1.1 1.8-1 2.9 1.1.1 2.3-.6 3-1.4Z" />
            </svg>
            {sending ? "Connecting…" : "Sign in with Apple"}
          </button>
          <p style={{ textAlign: "center", margin: "12px 0", opacity: 0.65 }}>or continue with email</p>
          <form onSubmit={signIn}>
            <p>Sign in with a secure magic link. Start with 20 complimentary requests and see what strategic momentum feels like.</p>
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" aria-label="Email address" />
            <button disabled={sending}>{sending ? "Sending..." : "Email me a sign-in link"}</button>
          </form>
          {message && <p role="status" className={message.startsWith("Check") ? "fineprint" : "error"}>{message}</p>}
        </>
      ) : (
        <p>Copy <code>.env.example</code> to <code>.env.local</code>, add your Supabase credentials, and restart the app. Full launch instructions are in the README.</p>
      )}
    </section>
  );
}
