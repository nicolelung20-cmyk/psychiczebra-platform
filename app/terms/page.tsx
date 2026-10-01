import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of Service | EAI — Elevated AI" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These terms govern your use of this website and any products or services you buy from
        Elevated Associates LLC (&ldquo;Elevated AI&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By using the site or
        buying from us, you agree to them.
      </p>

      <h2>Services and engagements</h2>
      <p>
        Consulting engagements (such as the Executive AI Readiness Sprint, Priority Workflow Pilot,
        and Executive AI Implementation) are delivered under a separate written agreement or
        statement of work. If that agreement conflicts with these terms, the agreement controls.
        Package descriptions on this site are summaries, not guarantees of specific business
        results.
      </p>

      <h2>Accounts</h2>
      <p>
        Some features require signing in with an emailed link. You are responsible for activity
        under your account and for keeping access to your email secure. We may suspend accounts
        that abuse the service, attempt to bypass usage limits, or break the law.
      </p>

      <h2>AI-generated output</h2>
      <p>
        Features that use AI models produce drafts that can be inaccurate or incomplete. Review
        output before relying on it, and do not submit passwords, payment card data, or sensitive
        personal information to AI features.
      </p>

      <h2>Payments</h2>
      <p>
        Payments are processed by Stripe. Prices are shown before checkout. Subscriptions renew
        automatically until cancelled, and you can cancel at any time to stop future charges.
        Refunds follow our <a href="/refunds">Refund Policy</a>.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The site, its content, and our templates remain our property. Deliverables created for you
        under an engagement are owned as set out in that engagement&rsquo;s agreement.
      </p>

      <h2>Disclaimers and limitation of liability</h2>
      <p>
        The site and any free features are provided &ldquo;as is&rdquo; without warranties of any kind. To the
        extent the law allows, our total liability for any claim relating to the site or a
        purchase is limited to the amount you paid us for it in the 12 months before the claim,
        and we are not liable for indirect or consequential losses.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. The date at the top shows the latest version; continued use
        after a change means you accept it.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of the state in which Elevated Associates LLC is
        organized, without regard to conflict-of-law rules.
      </p>
    </LegalPage>
  );
}
