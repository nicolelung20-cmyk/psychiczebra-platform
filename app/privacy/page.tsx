import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy Policy | EAI — Elevated AI" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This policy explains what Elevated Associates LLC collects through this website, why, and
        the choices you have. We do not sell your personal information.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Consultation requests:</strong> the name, work email, role, company,
          organization size, budget range, goal, and timeline you enter in the contact form.
        </li>
        <li>
          <strong>Account data:</strong> your email address when you sign in with an emailed link,
          plus your plan and usage counts.
        </li>
        <li>
          <strong>AI feature content:</strong> messages you send to AI features, so we can return a
          response.
        </li>
        <li>
          <strong>Campaign information:</strong> standard UTM tags from the link that brought you
          here (for example, which ad or post), stored in your browser and attached to checkout.
        </li>
        <li>
          <strong>Payment records:</strong> Stripe handles card details; we receive only the
          transaction status, amount, and customer reference, never your full card number.
        </li>
      </ul>

      <h2>How we use it</h2>
      <p>
        To respond to consultation requests, provide and secure your account, enforce usage
        limits, process payments, understand which marketing channels work, and meet legal and
        tax obligations.
      </p>

      <h2>Service providers</h2>
      <p>
        We share data only with providers that run the service for us: Supabase (database and
        sign-in), Stripe (payments), OpenRouter and the AI model providers it routes to (AI
        responses), and our website host. Each processes data under its own terms and privacy
        policy.
      </p>

      <h2>Retention</h2>
      <p>
        We keep consultation requests and account data while they are needed for the purposes
        above, and payment records as long as tax law requires. You can ask us to delete your
        data at any time, subject to those legal requirements.
      </p>

      <h2>Your choices</h2>
      <p>
        You can ask to access, correct, or delete your personal information, or to stop marketing
        emails, through the contact form. Depending on where you live, you may have additional
        rights under local privacy law, and we will honor them.
      </p>

      <h2>Security</h2>
      <p>
        We use encrypted connections, server-side access controls, and signed payment webhooks.
        No system is perfectly secure, so please avoid sending sensitive personal information
        through AI features or forms.
      </p>

      <h2>Children</h2>
      <p>This site is for business use and is not directed to children under 16.</p>
    </LegalPage>
  );
}
