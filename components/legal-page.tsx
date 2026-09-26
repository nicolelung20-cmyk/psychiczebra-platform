import Link from "next/link";
import type { ReactNode } from "react";

export const LEGAL_LAST_UPDATED = "September 26, 2026";

export function LegalPage({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <main className="site-shell legal-page">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Elevated AI home">
          <span className="brand-mark">E</span>
          <span>
            <strong>EAI</strong>
            <small>Elevated AI &middot; Elevated Associates LLC</small>
          </span>
        </Link>
      </header>
      <article className="legal-body">
        <h1>{title}</h1>
        <p className="legal-updated">Last updated: {LEGAL_LAST_UPDATED}</p>
        {children}
        <h2>Contact</h2>
        <p>
          Questions about this page? Reach Elevated Associates LLC through the{" "}
          <Link href="/#discovery">contact form</Link> on our home page.
        </p>
      </article>
    </main>
  );
}
