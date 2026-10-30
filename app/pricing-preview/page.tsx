"use client";

import { useState } from "react";
import styles from "./pricing-preview.module.css";

const plans = [
  {
    name: "Starter",
    eyebrow: "A focused first step",
    monthly: 1200,
    description: "A clear starting point for teams ready to bring one repeatable workflow into a more reliable operating rhythm.",
    features: ["One priority workflow", "Workflow and tool-fit review", "Implementation brief", "Monthly progress review"],
    action: "Explore Starter",
  },
  {
    name: "Growth",
    eyebrow: "Most popular",
    monthly: 3200,
    featured: true,
    description: "For teams ready to connect workflows, reduce manual handoffs, and build a measurable operating system.",
    features: ["Multiple connected workflows", "Automation opportunity map", "Execution and measurement plan", "Priority review cadence"],
    action: "Explore Growth",
  },
  {
    name: "Scale",
    eyebrow: "For growing operations",
    custom: true,
    description: "A tailored program for teams coordinating more people, processes, and systems across the business.",
    features: ["Cross-team workflow planning", "Integration and governance review", "Phased rollout roadmap", "Leadership progress reviews"],
    action: "Discuss Scale",
  },
  {
    name: "Partner",
    eyebrow: "Ongoing collaboration",
    custom: true,
    description: "An ongoing partnership shaped around your operating priorities, adoption needs, and delivery roadmap.",
    features: ["Collaborative roadmap", "Ongoing optimization", "Governance and enablement", "Quarterly strategy review"],
    action: "Discuss Partnership",
  },
];

const money = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);

export default function PricingPreviewPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="Elevated AI home">
          <span className={styles.mark}>E</span>
          <span><strong>ELEVAT AI</strong><small>ELEVATED ASSOCIATES</small></span>
        </a>
        <span className={styles.previewBadge}>PRIVATE PREVIEW · NOT LIVE PRICING</span>
      </header>

      <section className={styles.hero} aria-labelledby="pricing-title">
        <p className={styles.kicker}>Simple plans. Thoughtful execution.</p>
        <h1 id="pricing-title">Make room for<br /><em>better work.</em></h1>
        <p className={styles.lede}>Practical AI workflows, built around the way your team actually operates. Choose a starting point and shape the scope as your needs grow.</p>

        <div className={styles.billing} role="group" aria-label="Billing frequency">
          <button type="button" className={!annual ? styles.activeBilling : ""} aria-pressed={!annual} onClick={() => setAnnual(false)}>Monthly</button>
          <button type="button" className={annual ? styles.activeBilling : ""} aria-pressed={annual} onClick={() => setAnnual(true)}>Yearly <span>Save 20%</span></button>
        </div>
        <p className={styles.billingNote}>{annual ? "Annual pricing shown as a monthly equivalent; annual total is listed on each plan." : "Flexible monthly pricing. No checkout is connected in this preview."}</p>
      </section>

      <section className={styles.grid} aria-label="Subscription plans">
        {plans.map((plan) => {
          const monthlyPrice = plan.monthly;
          const displayedPrice = plan.custom ? "Custom" : money(annual ? monthlyPrice * 0.8 : monthlyPrice);
          return (
            <article key={plan.name} className={`${styles.card} ${plan.featured ? styles.featured : ""}`}>
              <div className={styles.cardTop}>
                <span className={styles.planEyebrow}>{plan.eyebrow}</span>
                {plan.featured && <span className={styles.recommended}>RECOMMENDED</span>}
              </div>
              <h2>{plan.name}</h2>
              <p className={styles.description}>{plan.description}</p>
              <div className={styles.priceLine}>
                <span className={styles.price}>{displayedPrice}</span>
                {!plan.custom && <span className={styles.period}>/ month{annual ? "*" : ""}</span>}
              </div>
              {annual && !plan.custom && <p className={styles.annualTotal}>{money(monthlyPrice * 0.8 * 12)} billed annually</p>}
              {plan.custom && <p className={styles.annualTotal}>Scope and pricing tailored to your needs</p>}
              <div className={styles.rule} />
              <p className={styles.includes}>WHAT'S INCLUDED</p>
              <ul>{plan.features.map((feature) => <li key={feature}><span aria-hidden="true">+</span>{feature}</li>)}</ul>
              <a className={styles.cta} href="/hermes">{plan.action}<span aria-hidden="true"> ↗</span></a>
              <p className={styles.ctaNote}>Preview only · no payment is taken</p>
            </article>
          );
        })}
      </section>

      <footer className={styles.footer}>
        <p>* Annual equivalents reflect a proposed 20% discount and are illustrative until billing terms are approved.</p>
        <a href="/">← Return to current Elevated AI site</a>
      </footer>
    </main>
  );
}
