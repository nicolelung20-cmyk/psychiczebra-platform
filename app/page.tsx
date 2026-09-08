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
          <h1 id="hero-title">Executive AI implementation with accountable ownership.</h1>
          <p className="hero-lede">
            Elevated AI helps leadership teams prioritize workflows, define an operating model,
            and establish governance for implementation decisions.
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
          <p>Structured support for AI implementation decisions</p>
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
        <p className="section-kicker">Implementation readiness</p>
        <div className="section-heading">
          <h2 id="clarity-title">Define the operating model before implementation.</h2>
          <p>
            AI initiatives can lose momentum when the business priority, accountable ownership,
            and governance requirements are undefined. We establish the decision criteria needed
            to prioritize implementation work.
          </p>
        </div>
        <div className="outcome-grid">
          <article>
            <span>01</span>
            <h3>Prioritize workflows</h3>
            <p>Identify the decisions, workflows, and constraints that warrant executive attention first.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Design for adoption</h3>
            <p>Connect the implementation approach to the people, governance, and operating practices that support adoption.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Establish control</h3>
            <p>Give executive sponsors an implementation roadmap with accountable ownership and measurable decision criteria.</p>
          </article>
        </div>
      </section>

      <section className="engagement-section" id="engagements" aria-labelledby="engagements-title">
        <div className="section-heading engagement-heading">
          <div>
            <p className="section-kicker">Engagements</p>
            <h2 id="engagements-title">Implementation support aligned to your executive priorities.</h2>
          </div>
          <p>
            Every engagement begins with executive discovery. We scope the work to your
            organization&apos;s priorities, implementation readiness, and internal capacity.
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
          <p className="section-kicker">Implementation process</p>
          <h2 id="process-title">A defined process for executive implementation.</h2>
        </div>
        <ol className="process-list">
          <li>
            <span>01</span>
            <div>
              <h3>Assess</h3>
              <p>We document the business context, decision makers, workflow constraints, and governance requirements.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Prioritize</h3>
              <p>We define the highest-value workflow priority, accountable ownership, and measurable decision criteria.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Plan</h3>
              <p>Your team receives an implementation roadmap, acceptance criteria, and the operating cadence for next decisions.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="fit-section" aria-labelledby="fit-title">
        <div>
          <p className="section-kicker">Engagement fit</p>
          <h2 id="fit-title">For leaders accountable for implementation outcomes.</h2>
        </div>
        <div className="fit-content">
          <p>
            Elevated AI is for executive teams treating AI as an operating-model and
            implementation decision, rather than a self-serve software purchase.
          </p>
          <ul>
            <li>You have a business priority that requires workflow prioritization and defined decision criteria.</li>
            <li>You need cross-functional alignment before committing to implementation.</li>
            <li>You require practical guidance for governance, adoption, and accountable ownership.</li>
          </ul>
        </div>
      </section>

      <section className="discovery-section" id="discovery" aria-labelledby="discovery-title">
        <div className="discovery-copy">
          <p className="section-kicker">Executive discovery call</p>
          <h2 id="discovery-title">Assess the right next step for your AI implementation.</h2>
          <p>
            Share your primary goal, implementation timeline, and current operating context. If
            there is a fit, we will schedule an executive discussion to confirm scope and next steps.
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
