import { AttributionCapture } from "@/components/attribution-capture";
import { paymentLinks } from "@/lib/payment-links";

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
            <small>Elevated AI · Elevated Associates LLC</small>
          </span>
        </a>
        <a className="header-cta" href="/hermes">
          Open Live Command Center <span aria-hidden="true">→</span>
        </a>
      </header>

      <section className="hero-section" id="top" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="section-kicker">Live AI operations</p>
          <h1 id="hero-title">Describe the work. Elevated AI turns it into action.</h1>
          <p className="hero-lede">
            Skip the client intake form. Open the live command center, tell Hermes what you need,
            and let the system capture the request, reason over the workflow, execute approved
            actions, and verify the result.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="/hermes">
              Launch Live Hermes <span aria-hidden="true">→</span>
            </a>
            <a className="text-link" href="#engagements">
              See implementation packages
            </a>
          </div>
        </div>
        <aside className="hero-card" aria-label="Live command center overview">
          <p>Live workflow</p>
          <dl>
            <div>
              <dt>Input</dt>
              <dd>Voice or chat</dd>
            </div>
            <div>
              <dt>Execution</dt>
              <dd>AI orchestration</dd>
            </div>
            <div>
              <dt>Control</dt>
              <dd>Approval + verification</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="intro-section" aria-labelledby="clarity-title">
        <p className="section-kicker">No intake bottleneck</p>
        <div className="section-heading">
          <h2 id="clarity-title">The interface is the command center, not another form.</h2>
          <p>
            Start with the objective in plain language. Hermes can turn an unstructured request
            into a plan, use connected tools, track execution, and return a verified outcome.
            Human approval remains available for consequential actions.
          </p>
        </div>
        <div className="outcome-grid">
          <article>
            <span>01</span>
            <h3>Speak or type</h3>
            <p>Give the system the goal, context, or task without translating it into a long intake form.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Plan and execute</h3>
            <p>Hermes decomposes the request, selects available tools, and carries out the approved workflow.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Verify and learn</h3>
            <p>Results are checked, surfaced in the command center, and fed back into the next decision.</p>
          </article>
        </div>
      </section>

      <section className="engagement-section" id="engagements" aria-labelledby="engagements-title">
        <div className="section-heading engagement-heading">
          <div>
            <p className="section-kicker">Implementation</p>
            <h2 id="engagements-title">Three fixed-scope packages. Start from the live system.</h2>
          </div>
          <p>
            The live command center is the starting point. Implementation work extends it into the
            workflows, integrations, governance, and operating model your organization needs.
          </p>
        </div>
        <div className="package-grid">
          {packages.map((item) => (
            <article className="package-card" key={item.name}>
              <div className="package-topline">
                <p>{item.investment}</p>
                <span>Fixed fee · {item.duration}</span>
              </div>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <ul>
                {item.includes.map((included) => (
                  <li key={included}>{included}</li>
                ))}
              </ul>
              <a href="/hermes">Launch and explore <span aria-hidden="true">→</span></a>
            </article>
          ))}
        </div>
      </section>

      <section className="intro-section" id="start" aria-labelledby="start-title">
        <p className="section-kicker">Start now</p>
        <div className="section-heading">
          <h2 id="start-title">No waiting for a call. Use the system.</h2>
          <p>
            Open Hermes first. If you later want a scoped implementation, the same command center
            becomes the operating interface for the engagement.
          </p>
        </div>
        <div className="hero-actions">
          <a className="button button-primary" href="/hermes">
            Open Hermes <span aria-hidden="true">→</span>
          </a>
          <a className="text-link" href={paymentLinks.workflowBriefKit}>
            Buy the Workflow Brief Kit · $47
          </a>
        </div>
      </section>

      <section className="process-section" aria-labelledby="process-title">
        <div>
          <p className="section-kicker">How it works</p>
          <h2 id="process-title">From intent to verified action.</h2>
        </div>
        <ol className="process-list">
          <li>
            <span>01</span>
            <div>
              <h3>Command</h3>
              <p>State the outcome you want in natural language.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Orchestrate</h3>
              <p>Hermes plans the work and coordinates the available AI and connected tools.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Verify</h3>
              <p>The system reports what happened, what remains, and what needs approval.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="fit-section" aria-labelledby="fit-title">
        <div>
          <p className="section-kicker">Built to operate</p>
          <h2 id="fit-title">Less intake. More execution.</h2>
        </div>
        <div className="fit-content">
          <p>
            Elevated AI is designed around an active command center rather than a lead form. The
            same interface can support internal operations, client workflows, integrations, and
            repeatable AI execution.
          </p>
          <ul>
            <li>Natural-language commands instead of long intake forms.</li>
            <li>Connected agents and tools instead of manual handoffs.</li>
            <li>Approval, auditability, and verification for consequential work.</li>
          </ul>
        </div>
      </section>

      <section className="discovery-section" id="discovery" aria-labelledby="discovery-title">
        <div className="discovery-copy">
          <p className="section-kicker">Live pilot</p>
          <h2 id="discovery-title">Deploy first. Scope second.</h2>
          <p>
            The pilot is live and usable without submitting a client intake form. Launch Hermes,
            test the workflow, and use the command center to determine what should be automated or
            implemented next.
          </p>
          <p className="discovery-note">
            For paid implementation work, scope and approvals are handled after the live workflow
            proves what is actually needed.
          </p>
        </div>
        <div className="hero-actions">
          <a className="button button-primary" href="/hermes">
            Launch Live Pilot <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>

      <footer className="site-footer">
        <a className="brand" href="#top">
          <span className="brand-mark">E</span>
          <span>
            <strong>EAI</strong>
            <small>Elevated AI · Elevated Associates LLC</small>
          </span>
        </a>
        <p>Live AI command center and workflow implementation</p>
        <nav className="footer-links" aria-label="Legal">
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <a href="/refunds">Refunds</a>
        </nav>
      </footer>
    </main>
  );
}
