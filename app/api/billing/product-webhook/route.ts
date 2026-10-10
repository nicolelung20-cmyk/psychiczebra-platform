import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAYMENT_LINK_ID = "plink_1UGfrw0t6SDBlU8gNn6N5MwR";
const PRODUCT_ID = "prod_VHEKO9lALM6JKQ";
const PRICE_CENTS = 4700;

function isValidSignature(signature: string | null, body: string, secret: string) {
  if (!signature) return false;
  const parts = Object.fromEntries(signature.split(",").map((part) => {
    const [key, value] = part.split("=");
    return [key, value];
  }));
  const timestamp = parts.t;
  const received = parts.v1;
  if (!timestamp || !received || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return received.length === expected.length && timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

type CheckoutSession = {
  id?: string;
  status?: string;
  payment_status?: string;
  mode?: string;
  payment_link?: string | null;
  payment_intent?: string | { id?: string } | null;
  amount_total?: number | null;
  currency?: string | null;
  metadata?: Record<string, string>;
  customer_details?: { email?: string | null } | null;
  customer_email?: string | null;
};

type StripeEvent = { id?: string; type?: string; data?: { object?: CheckoutSession } };

export async function POST(request: Request) {
  const secret = process.env.STRIPE_PRODUCT_WEBHOOK_SECRET;
  const body = await request.text();
  if (!secret || !isValidSignature(request.headers.get("stripe-signature"), body, secret)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(body) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid event payload." }, { status: 400 });
  }

  if (!event.id || !event.type) return NextResponse.json({ error: "Invalid event envelope." }, { status: 400 });
  if (!["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const session = event.data?.object;
  if (!session?.id) return NextResponse.json({ error: "Missing Checkout Session." }, { status: 400 });
  if (session.payment_link !== PAYMENT_LINK_ID && session.metadata?.product_sku !== "workflow-brief-kit") {
    return NextResponse.json({ received: true, ignored: true });
  }
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true, skipped: "payment_not_confirmed" });
  }
  if (
    session.status !== "complete" ||
    session.mode !== "payment" ||
    session.amount_total !== PRICE_CENTS ||
    session.currency !== "usd" ||
    (session.metadata?.product_id && session.metadata.product_id !== PRODUCT_ID)
  ) {
    return NextResponse.json({ error: "Paid session does not match the expected product and price." }, { status: 400 });
  }

  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id ?? null;

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("revenue_transactions").upsert({
      stripe_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      email: session.customer_details?.email ?? session.customer_email ?? null,
      product: "Elevat Workflow Brief Kit",
      amount_cents: PRICE_CENTS,
      currency: "usd",
      status: "paid",
      updated_at: new Date().toISOString(),
    }, { onConflict: "stripe_session_id" });
    if (error) throw error;
    return NextResponse.json({ received: true, payment_confirmed: true, product: "workflow-brief-kit" });
  } catch {
    // A 500 asks Stripe to retry; do not acknowledge a payment record that failed.
    return NextResponse.json({ error: "Could not record confirmed payment." }, { status: 500 });
  }
}
