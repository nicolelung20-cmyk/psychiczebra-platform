"use client";

import { AuthPanel } from "@/components/auth-panel";
import { ChatWorkspace } from "@/components/chat-workspace";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/browser";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) return;
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, [configured]);

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">PSYCHICZEBRA</p>
          <h1>Make your next move with AI.</h1>
          <p className="lede">A calm, capable workspace for turning a question into useful, finished work.</p>
        </div>
        <div className="hero-note">
          <span>OPENROUTER POWERED</span>
          <strong>One focused conversation at a time.</strong>
        </div>
      </section>
      {user ? <ChatWorkspace user={user} /> : <AuthPanel configured={configured} />}
    </main>
  );
}
