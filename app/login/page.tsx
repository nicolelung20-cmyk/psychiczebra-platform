import Link from "next/link";
import { AuthPanel } from "@/components/auth-panel";
import { isSupabaseConfigured } from "@/lib/supabase/browser";

export const metadata = {
  title: "Sign in | ELEVAT",
  description: "Secure sign-in to the ELEVAT owner command center.",
};

export default function LoginPage() {
  return (
    <main className="site-shell" style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px" }}>
      <header style={{ marginBottom: 24 }}>
        <Link href="/" className="brand" aria-label="ELEVAT home">
          <span className="brand-mark">E</span>
          <span>
            <strong>EAI</strong>
            <small>Elevated AI · Secure access</small>
          </span>
        </Link>
      </header>
      <AuthPanel configured={isSupabaseConfigured()} />
      <p style={{ marginTop: 20, textAlign: "center" }}>
        <Link href="/">Back to ELEVAT</Link>
      </p>
    </main>
  );
}
