import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Refund Policy | EAI — Elevated AI" };

export default function RefundsPage() {
  return (
    <LegalPage title="Refund Policy">
      <h2>Digital products</h2>
      <p>
        If a downloadable product (such as a template kit) is not what you expected, ask for a
        refund within 14 days of purchase and we will issue a full refund to your original
        payment method.
      </p>

      <h2>Subscriptions</h2>
      <p>
        You can cancel a subscription at any time; it stays active until the end of the period
        you already paid for, and you will not be charged again. If you were charged for a
        renewal you did not intend, contact us within 7 days of that charge for a refund of it.
      </p>

      <h2>Consulting engagements</h2>
      <p>
        Fixed-scope engagements are refunded according to the payment and cancellation terms in
        their written agreement or statement of work. If you cancel before work begins, we refund
        the full amount paid.
      </p>

      <h2>How refunds are paid</h2>
      <p>
        Approved refunds go back to the original payment method through Stripe and usually
        appear within 5&ndash;10 business days, depending on your bank.
      </p>
    </LegalPage>
  );
}
