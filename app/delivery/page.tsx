import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  const validSession = typeof sessionId === "string" && /^cs_live_[A-Za-z0-9]+$/.test(sessionId);

  return (
    <main className="site-shell" style={{ maxWidth: 760, paddingTop: 64, paddingBottom: 96 }}>
      <p className="section-kicker">Elevat AI · Secure digital delivery</p>
      <h1>{validSession ? "Your Workflow Brief Kit" : "Find your secure delivery link"}</h1>
      <p className="hero-lede">
        {validSession
          ? "Download is unlocked only after Stripe confirms a completed, paid purchase of the Workflow Brief Kit. The download request verifies your order directly with Stripe."
          : "Open this page from the post-checkout confirmation link. If you completed checkout, use the same browser session or the link in your confirmation."}
      </p>
      {validSession ? (
        <div className="hero-actions" style={{ marginTop: 32 }}>
          <a className="button button-primary" href={`/api/delivery/workflow-brief-kit?session_id=${encodeURIComponent(sessionId)}`}>
            Verify payment and download kit →
          </a>
        </div>
      ) : (
        <div className="hero-actions" style={{ marginTop: 32 }}>
          <a className="button button-primary" href="https://buy.stripe.com/3cI9AL52R8t34QM1Mi2Fa00">
            Return to Workflow Brief Kit checkout →
          </a>
        </div>
      )}
      <p style={{ color: "var(--ash)", fontSize: 13, marginTop: 28 }}>
        Never send card numbers by email. If you were charged but delivery is blocked, contact support with the Stripe receipt ID; do not share full payment details.
      </p>
      <Link className="text-link" href="/" style={{ display: "inline-block", marginTop: 24 }}>← Return to Elevat AI</Link>
    </main>
  );
}
