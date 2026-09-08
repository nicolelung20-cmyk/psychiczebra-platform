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
          <p className="eyebrow">ELEVATED AI</p>
          <h1>Turn ambition into your unfair advantage.</h1>
          <p className="lede">The executive AI workspace for leaders who need sharper strategy, faster decisions, and work that creates measurable growth.</p>
        </div>
        <div className="hero-note">
          <span>BUILT FOR DECISIVE TEAMS</span>
          <strong>From critical question to confident action.</strong>
        </div>
      </section>
      {user ? <ChatWorkspace user={user} /> : <AuthPanel configured={configured} />}
      <footer>
        <span>Elevated AI</span>
        <span>A product of Elevated Associates LLC</span>
      </footer>
    </main>
  );
}
