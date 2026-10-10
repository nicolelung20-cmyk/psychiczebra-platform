"use client";

import { useState } from "react";
import { paymentLinks } from "@/lib/payment-links";

const questions = [
  { title: "Can a prospect understand your offer and price?", area: "Offer clarity", fix: "Write a one-sentence offer naming the buyer, outcome, scope, and price." },
  { title: "Is there one obvious next step to inquire or buy?", area: "Call to action", fix: "Choose one primary action and make it easy to find." },
  { title: "Do inquiries land somewhere you reliably check?", area: "Lead capture", fix: "Route inquiries to one inbox or tracker and assign an owner." },
  { title: "Do you follow up within two business days?", area: "Follow-up", fix: "Use a short follow-up and record the next action." },
  { title: "Can customers pay or book without confusing back-and-forth?", area: "Checkout", fix: "Make scope, price, payment instructions, and confirmation clear." },
  { title: "Is post-payment delivery and customer confirmation defined?", area: "Delivery", fix: "Set intake requirements, delivery deadline, acceptance check, and support boundary." },
];

export default function FreeRevenueCheckPage() {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [copied, setCopied] = useState(false);
  const score = questions.reduce((sum, _question, index) => sum + Number(answers[index] ?? 0), 0);
  const gaps = questions.filter((_question, index) => answers[index] !== "2");
  const title = score >= 10
    ? "Strong foundation—tighten the remaining gaps."
    : score >= 6
      ? "Some foundations are in place; prioritize the weak links."
      : "Start with the basics: make the path to payment clear and reliable.";
  const snapshot = [
    "Elevat AI — Free Revenue Leak Check",
    "Checklist coverage score: " + score + " / 12 (not a revenue forecast)",
    title,
    "",
    "Recommended first actions:",
    ...(gaps.length ? gaps.map((item) => "- " + item.area + ": " + item.fix) : ["- Test the full path with a prospect and measure the result."]),
    "",
    "Self-assessment only. No revenue increase is guaranteed.",
  ].join("\n");

  return (
    <main className="site-shell" style={{ maxWidth: 900, paddingTop: 48, paddingBottom: 80 }}>
      <a className="text-link" href="/">← Elevated AI home</a>
      <p className="section-kicker" style={{ marginTop: 40 }}>Free · no signup · private self-check</p>
      <h1 style={{ maxWidth: 800 }}>Find the leak between lead and cash.</h1>
      <p className="hero-lede">Answer six questions for a practical snapshot of your lead-to-cash process. Answers stay in this page and are not submitted or saved to a server.</p>

      <section aria-label="Revenue flow self-check" style={{ marginTop: 36, borderTop: "1px solid var(--line)" }}>
        {questions.map((question, index) => (
          <fieldset key={question.area} style={{ border: 0, borderBottom: "1px solid var(--line)", padding: "22px 0", margin: 0 }}>
            <legend style={{ fontWeight: 700, marginBottom: 12 }}>{index + 1}. {question.title}</legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
              {[["2", "Yes"], ["1", "Partly / sometimes"], ["0", "No"]].map(([value, label]) => (
                <label key={value} style={{ display: "inline-flex", gap: 8, alignItems: "center", color: "var(--ash)" }}>
                  <input
                    type="radio"
                    name={"q" + index}
                    value={value}
                    checked={answers[index] === value}
                    onChange={() => { setAnswers((current) => ({ ...current, [index]: value })); setShowResult(false); }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <div className="hero-actions">
          <button className="button button-primary" type="button" onClick={() => setShowResult(true)} disabled={Object.keys(answers).length !== questions.length}>
            Show my free snapshot →
          </button>
          <button className="text-link" type="button" onClick={() => { setAnswers({}); setShowResult(false); setCopied(false); }} style={{ background: "transparent", color: "inherit", border: 0, cursor: "pointer" }}>
            Reset
          </button>
        </div>
        {Object.keys(answers).length !== questions.length && <p style={{ color: "var(--ash)", fontSize: 12 }}>Answer all six questions to generate the snapshot.</p>}
      </section>

      {showResult && (
        <section aria-live="polite" style={{ background: "var(--forest)", borderTop: "2px solid var(--lime)", padding: 28, marginTop: 42 }}>
          <p className="section-kicker">Your snapshot</p>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)" }}>{title}</h2>
          <p style={{ color: "var(--lime)", fontWeight: 700 }}>Checklist coverage: {score} / 12</p>
          <p style={{ color: "var(--ash)", fontSize: 13 }}>This score measures checklist coverage, not actual revenue performance or expected financial results.</p>
          <ul style={{ lineHeight: 1.7 }}>
            {(gaps.length ? gaps : [{ area: "Next test", fix: "Test the complete path with a prospect and record real outcomes." }]).map((item) => (
              <li key={item.area}><strong>{item.area}:</strong> {item.fix}</li>
            ))}
          </ul>
          <div className="hero-actions">
            <button className="button" type="button" onClick={async () => {
              try {
                await navigator.clipboard.writeText(snapshot);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}>{copied ? "Snapshot copied ✓" : "Copy snapshot"}</button>
            <a className="button button-primary" href={paymentLinks.workflowBriefKit} target="_blank" rel="noreferrer">
              Get the Workflow Brief Kit · $47 ↗
            </a>
          </div>
          <p style={{ color: "var(--ash)", fontSize: 12, marginTop: 20 }}>The paid kit is optional. Checkout and delivery must be confirmed independently; no revenue or outcome is guaranteed.</p>
        </section>
      )}
      <footer className="site-footer" style={{ marginTop: 64 }}>
        <p>Elevated AI · Free self-check · No lead capture or analytics on this page.</p>
        <a href="/">Return home</a>
      </footer>
    </main>
  );
}
