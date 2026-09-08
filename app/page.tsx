import { ConsultationForm } from "@/components/consultation-form";

const packages = [
  {
    name: "Executive AI Opportunity Sprint",
    investment: "$5k",
    description:
      "A focused working session for leadership teams that need to align on the business case, priorities, and first moves.",
    includes: ["Executive alignment session", "Opportunity and risk assessment", "90-day decision brief"],
  },
  {
    name: "AI Adoption Blueprint",
    investment: "$10k",
    description:
      "A practical operating plan for teams ready to move from isolated experiments to an accountable implementation path.",
    includes: ["Workflow prioritization", "Governance recommendations", "Implementation roadmap"],
  },
  {
    name: "Implementation Partnership",
    investment: "$15k",
    description:
      "Hands-on support to turn a defined priority into a well-governed, team-ready AI capability.",
    includes: ["Pilot design and rollout", "Leadership operating cadence", "Change enablement guidance"],
  },
];

export default function Home() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Elevated AI home">
          <span className="brand-mark">E</span>
          <span>
            <strong>Elevated AI</strong>
            <small>A product of Elevated Associates LLC</small>
          </span>
        </a>
        <a className="header-cta" href="#discovery">
          Start with a discovery call <span aria-hidden="true">→</span>
        </a>
      </header>

      <section className="hero-section" id="top" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="section-kicker">AI implementation for executive teams</p>
          <h1 id="hero-title">Make AI a disciplined advantage, not another experiment.</h1>
          <p className="hero-lede">
            Elevated AI helps leadership teams choose the right opportunities, establish the
            operating model, and put responsible AI to work where it matters most.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#discovery">
              Book an executive discovery call <span aria-hidden="true">→</span>
            </a>
            <a className="text-link" href="#engagements">
              Explore implementation packages
            </a>
          </div>
        </div>
        <aside className="hero-card" aria-label="Engagement overview">
          <p>Built for the decisions that cannot wait</p>
          <dl>
            <div>
              <dt>Engagements</dt>
              <dd>$5k–$15k</dd>
            </div>
            <div>
              <dt>Starting point</dt>
              <dd>Executive discovery</dd>
            </div>
            <div>
              <dt>Focus</dt>
              <dd>Strategy to implementation</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="intro-section" aria-labelledby="clarity-title">
        <p className="section-kicker">The leadership problem</p>
        <div className="section-heading">
          <h2 id="clarity-title">Clarity before capability.</h2>
          <p>
            AI initiatives often stall when the business problem, ownership, and operating
            constraints are unclear. We create the shared direction your team needs before effort
            is spent on tools, pilots, or change programs.
          </p>
        </div>
        <div className="outcome-grid">
          <article>
            <span>01</span>
            <h3>Choose with conviction</h3>
            <p>Identify the decisions, workflows, and constraints that deserve leadership attention first.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Design for adoption</h3>
            <p>Connect the implementation approach to the people, governance, and habits that make it usable.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Move with control</h3>
            <p>Give executive sponsors an accountable path from a defined priority to informed execution.</p>
          </article>
        </div>
      </section>

      <section className="engagement-section" id="engagements" aria-labelledby="engagements-title">
        <div className="section-heading engagement-heading">
          <div>
            <p className="section-kicker">Engagements</p>
            <h2 id="engagements-title">The right level of support for the decision in front of you.</h2>
          </div>
          <p>
            Every engagement begins with an executive conversation. We scope the work to your
            organization&apos;s priorities, readiness, and internal capacity.
          </p>
        </div>
        <div className="package-grid">
          {packages.map((item) => (
            <article className="package-card" key={item.name}>
              <div className="package-topline">
                <p>{item.investment}</p>
                <span>Starting investment</span>
              </div>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <ul>
                {item.includes.map((included) => (
                  <li key={included}>{included}</li>
                ))}
              </ul>
              <a href="#discovery">Discuss this engagement <span aria-hidden="true">→</span></a>
            </article>
          ))}
        </div>
      </section>

      <section className="process-section" aria-labelledby="process-title">
        <div>
          <p className="section-kicker">A practical process</p>
          <h2 id="process-title">High-stakes work needs an operating rhythm.</h2>
        </div>
        <ol className="process-list">
          <li>
            <span>01</span>
            <div>
              <h3>Listen</h3>
              <p>We begin with the business context, decision makers, and concerns that shape a responsible path forward.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Focus</h3>
              <p>Together, we define a worthwhile priority and the conditions required to make progress with confidence.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Activate</h3>
              <p>Your team leaves with clear ownership, a sequenced plan, and the context to lead the next decision well.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="fit-section" aria-labelledby="fit-title">
        <div>
          <p className="section-kicker">Is this the right conversation?</p>
          <h2 id="fit-title">Designed for leaders accountable for what happens next.</h2>
        </div>
        <div className="fit-content">
          <p>
            Elevated AI is a fit for executive teams that are ready to treat AI as an operating
            decision—not a novelty, content experiment, or self-serve software purchase.
          </p>
          <ul>
            <li>You have a business priority that needs a clearer AI point of view.</li>
            <li>You need cross-functional alignment before investing in implementation.</li>
            <li>You want practical guidance that accounts for adoption and responsible use.</li>
          </ul>
        </div>
      </section>

      <section className="discovery-section" id="discovery" aria-labelledby="discovery-title">
        <div className="discovery-copy">
          <p className="section-kicker">Executive discovery call</p>
          <h2 id="discovery-title">Bring the decision. We&apos;ll bring a sharper way to frame it.</h2>
          <p>
            Tell us what is at stake and where your team is today. If there is a strong fit, we
            will follow up to schedule a focused conversation about the most appropriate next step.
          </p>
          <p className="discovery-note">
            This is an inquiry for implementation engagements, not a product demo or subscription trial.
          </p>
        </div>
        <ConsultationForm />
      </section>

      <footer className="site-footer">
        <a className="brand" href="#top">
          <span className="brand-mark">E</span>
          <span>
            <strong>Elevated AI</strong>
            <small>A product of Elevated Associates LLC</small>
          </span>
        </a>
        <p>Executive AI implementation engagements</p>
      </footer>
    </main>
  );
}
