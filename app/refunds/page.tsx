import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Refund Policy | EAI — Elevated AI" };

export default function RefundsPage() {
  return (
    <LegalPage title="Refund Policy">
      <h2>Digital products</h2>
      <p>
        Downloadable products (such as template kits) are delivered immediately and are final
        sale: we do not offer refunds once a digital product has been delivered. If a file is
        missing, corrupted, or not what the product page described, contact us and we will send
        a working copy.
      </p>

      <h2>Subscriptions</h2>
      <p>
        You can cancel a subscription at any time. It stays active until the end of the period
        you already paid for, and you will not be charged again. We do not give refunds or
        partial credits for unused time.
      </p>

      <h2>Consulting engagements</h2>
      <p>
        Fixed-scope engagements are refunded according to the payment and cancellation terms in
        their written agreement or statement of work. If you cancel before work begins, we refund
        the full amount paid.
      </p>

      <h2>Where the law requires otherwise</h2>
      <p>
        Nothing in this policy limits any refund right you have under the consumer protection
        laws that apply to you.
      </p>

      <h2>How refunds are paid</h2>
      <p>
        Approved refunds go back to the original payment method through Stripe and usually
        appear within 5&ndash;10 business days, depending on your bank.
      </p>
    </LegalPage>
  );
}
