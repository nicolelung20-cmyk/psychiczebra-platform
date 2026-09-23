import { ConsultationForm } from "@/components/consultation-form";
import { AttributionCapture } from "@/components/attribution-capture";

const packages = [
  {
    name: "Executive AI Readiness Sprint",
    investment: "$5k",
    duration: "2 weeks",
    description:
      "For leadership teams that know AI matters but haven't agreed where to start. You leave with one priority workflow and a 90-day plan.",
    includes: ["Stakeholder workshop", "Workflow and data-risk assessment", "Prioritized use-case brief", "90-day roadmap"],
  },
  {
    name: "Priority Workflow Pilot",
    investment: "$10k",
    duration: "3–4 weeks",
    description:
      "Everything in the Sprint, plus a working prototype of your top workflow, so your team tests AI on real work before committing further.",
    includes: ["Sprint deliverables", "One workflow configured or prototyped", "Acceptance criteria and baseline metrics", "Team enablement session"],
  },
  {
    name: "Executive AI Implementation",
    investment: "$15k",
    duration: "4–6 weeks",
    description:
      "Everything in the Pilot, extended to two related workflows, with the governance and handoff your team needs to run them without us.",
    includes: ["Pilot deliverables", "Up to two workflow implementations", "Governance playbook", "Leadership readout and handoff plan"],
  },
];

export default function Home() {
  return (
    <main className="site-shell">
      <AttributionCapture />
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Elevated AI home">
          <span className="brand-mark">E</span>
          <span>
            <strong>EAI</strong>
            <small>Elevated AI &middot; Elevated Associates LLC</small>
          </span>
        </a>
        <a className="header-cta" href="#discovery">
          Book a free fit call <span aria-hidden="true">→</span>
        </a>
      </header>

      <section className="hero-section" id="top" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="section-kicker">Fixed-scope AI implementation for leadership teams</p>
          <h1 id="hero-title">Get one high-value workflow running on AI in weeks, not quarters.</h1>
          <p className="hero-lede">
            Most AI efforts stall between the pilot and the payoff. We pick the workflow worth
            automating first, build it with your team, and hand over the guardrails to keep it
            running. Fixed scope, fixed fee, from $5k.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#discovery">
              Book a free 30-minute fit call <span aria-hidden="true">→</span>
            </a>
            <a className="text-link" href="#engagements">
              See packages and pricing
            </a>
          </div>
        </div>
        <aside className="hero-card" aria-label="Engagement overview">
          <p>What you can expect</p>
          <dl>
            <div>
              <dt>Fixed fee</dt>
              <dd>$5k–$15k</dd>
            </div>
            <div>
              <dt>Timeline</dt>
              <dd>2–6 weeks</dd>
            </div>
            <div>
              <dt>You keep</dt>
              <dd>The workflow, roadmap, and playbook</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="intro-section" aria-labelledby="clarity-title">
        <p className="section-kicker">Why AI projects stall</p>
        <div className="section-heading">
          <h2 id="clarity-title">Experiments are easy. Getting one into daily work is the hard part.</h2>
          <p>
            Teams run scattered AI trials, nobody owns the result, and legal or IT raises risks
            late. We fix the order of operations: one workflow, one accountable owner, clear
            guardrails, and a baseline so you can see whether it worked.
          </p>
        </div>
        <div className="outcome-grid">
          <article>
            <span>01</span>
            <h3>Pick the right workflow</h3>
            <p>We score candidate workflows on value, effort, and data risk, and agree on the one to tackle first.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Build it with your team</h3>
            <p>Your people help build and test it, so it fits how they actually work and they keep using it.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Measure and govern it</h3>
            <p>You get a before-and-after baseline, a named owner, and guardrails your risk and IT leads can sign off on.</p>
          </article>
        </div>
      </section>

      <section className="engagement-section" id="engagements" aria-labelledby="engagements-title">
        <div className="section-heading engagement-heading">
          <div>
            <p className="section-kicker">Engagements</p>
            <h2 id="engagements-title">Three fixed-scope packages. Pick the depth you need.</h2>
          </div>
          <p>
            Every engagement starts with a free 30-minute fit call. If we&apos;re not the right fit,
            we&apos;ll tell you on the call.
          </p>
        </div>
        <div className="package-grid">
          {packages.map((item) => (
            <article className="package-card" key={item.name}>
              <div className="package-topline">
                <p>{item.investment}</p>
                <span>Fixed fee &middot; {item.duration}</span>
              </div>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <ul>
                {item.includes.map((included) => (
                  <li key={included}>{included}</li>
                ))}
              </ul>
              <a href="#discovery">Ask about this package <span aria-hidden="true">→</span></a>
            </article>
          ))}
        </div>
      </section>

      <section className="process-section" aria-labelledby="process-title">
        <div>
          <p className="section-kicker">How it works</p>
          <h2 id="process-title">From first call to working workflow.</h2>
        </div>
        <ol className="process-list">
          <li>
            <span>01</span>
            <div>
              <h3>Fit call (free, 30 minutes)</h3>
              <p>We learn your goal, your candidate workflows, and your constraints, then recommend a package or tell you honestly that you aren&apos;t ready yet.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Scope and build</h3>
              <p>We agree on a fixed scope and acceptance criteria, then work with your team to assess, prioritize, and build.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Hand over</h3>
              <p>You keep everything we produce: the workflow, the roadmap, the governance playbook, and the baseline to measure against.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="fit-section" aria-labelledby="fit-title">
        <div>
          <p className="section-kicker">Is this for you?</p>
          <h2 id="fit-title">Built for leaders who need AI to show up in real work.</h2>
        </div>
        <div className="fit-content">
          <p>
            A good fit is a CEO, COO, or functional leader at a growing company with a real
            workflow in mind and a team that can give it a few hours a week.
          </p>
          <ul>
            <li>You have a slow, repetitive, or error-prone workflow you suspect AI could improve.</li>
            <li>You have tried AI tools, but nothing has stuck across the team.</li>
            <li>You want clear guardrails on data, risk, and ownership before scaling further.</li>
          </ul>
        </div>
      </section>

      <section className="discovery-section" id="discovery" aria-labelledby="discovery-title">
        <div className="discovery-copy">
          <p className="section-kicker">Free 30-minute fit call</p>
          <h2 id="discovery-title">Tell us the workflow you want to fix.</h2>
          <p>
            Share your goal and timeline. We reply within one business day. If there&apos;s a fit, we&apos;ll
            book a 30-minute call to recommend a package.
          </p>
          <p className="discovery-note">
            No obligation. We frame results as hypotheses to test together, never as guarantees.
          </p>
        </div>
        <ConsultationForm />
      </section>

      <footer className="site-footer">
        <a className="brand" href="#top">
          <span className="brand-mark">E</span>
          <span>
            <strong>EAI</strong>
            <small>Elevated AI &middot; Elevated Associates LLC</small>
          </span>
        </a>
        <p>Fixed-scope AI implementation for leadership teams</p>
      </footer>
    </main>
  );
}
