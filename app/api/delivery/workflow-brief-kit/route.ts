import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { WORKFLOW_BRIEF_KIT } from "@/lib/workflow-brief-kit";
import { getStripeMode, getStripeSecretKey } from "@/lib/stripe-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAYMENT_LINK_ID = "plink_1UGfrw0t6SDBlU8gNn6N5MwR";
const PRODUCT_ID = "prod_VHEKO9lALM6JKQ";
const PRICE_CENTS = 4700;

type StripeSession = {
  id?: string;
  status?: string;
  payment_status?: string;
  mode?: string;
  payment_link?: string | null;
  payment_intent?: string | { id?: string } | null;
  amount_total?: number | null;
  currency?: string | null;
  customer_details?: { email?: string | null; name?: string | null } | null;
  customer_email?: string | null;
  livemode?: boolean;
};

type StripeLineItems = {
  data?: Array<{
    amount_total?: number;
    price?: { product?: string | { id?: string } | null; unit_amount?: number | null };
  }>;
};

const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status });

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id");
  const stripeMode = getStripeMode();
  const expectedPrefix = stripeMode === "test" ? "cs_test_" : "cs_live_";
  if (!sessionId || !sessionId.startsWith(expectedPrefix) || !/^cs_(?:test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    return fail("A checkout session for the configured Stripe mode is required.", 400);
  }

  const secret = getStripeSecretKey();
  if (!secret) return fail("Secure delivery is not configured for this Stripe mode. Contact support with your receipt.", 503);
  const paymentLinkId = stripeMode === "test"
    ? process.env.STRIPE_WORKFLOW_BRIEF_KIT_PAYMENT_LINK_ID_TEST
    : process.env.STRIPE_WORKFLOW_BRIEF_KIT_PAYMENT_LINK_ID ?? PAYMENT_LINK_ID;
  const productId = stripeMode === "test"
    ? process.env.STRIPE_WORKFLOW_BRIEF_KIT_PRODUCT_ID_TEST
    : process.env.STRIPE_WORKFLOW_BRIEF_KIT_PRODUCT_ID ?? PRODUCT_ID;
  if (!paymentLinkId || !productId) return fail("Workflow Brief Kit is not configured for this Stripe mode.", 503);

  try {
    const headers = { Authorization: `Bearer ${secret}` };
    const sessionResponse = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      { headers, cache: "no-store" },
    );
    if (!sessionResponse.ok) return fail("Payment could not be verified. Refresh after checkout or contact support.", 403);

    const session = await sessionResponse.json() as StripeSession;
    if (
      session.id !== sessionId ||
      session.livemode !== (stripeMode === "live") ||
      session.status !== "complete" ||
      session.payment_status !== "paid" ||
      session.mode !== "payment" ||
      session.payment_link !== paymentLinkId ||
      session.amount_total !== PRICE_CENTS ||
      session.currency !== "usd"
    ) {
      return fail("This order is not confirmed as a paid Workflow Brief Kit purchase.", 403);
    }

    const itemsResponse = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}/line_items?limit=10`,
      { headers, cache: "no-store" },
    );
    if (!itemsResponse.ok) return fail("The purchased item could not be verified. Contact support with your receipt.", 503);

    const items = await itemsResponse.json() as StripeLineItems;
    const ownsKit = (items.data ?? []).some((item) => {
      const product = item.price?.product;
      const lineItemProductId = typeof product === "string" ? product : product?.id;
      return lineItemProductId === productId && item.price?.unit_amount === PRICE_CENTS;
    });
    if (!ownsKit) return fail("This checkout does not include the Workflow Brief Kit.", 403);

    // Delivery is not released until the server-only revenue ledger confirms the paid order.
    try {
      const supabase = createServiceClient();
      const paymentIntent = typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;
      const { error } = await supabase.from("revenue_transactions").upsert({
        stripe_session_id: sessionId,
        stripe_payment_intent_id: paymentIntent,
        email: session.customer_details?.email ?? session.customer_email ?? null,
        product: "Elevat Workflow Brief Kit",
        amount_cents: PRICE_CENTS,
        currency: "usd",
        status: "delivered",
        updated_at: new Date().toISOString(),
      }, { onConflict: "stripe_session_id" });
      if (error) throw error;
    } catch {
      return fail("Payment is verified, but delivery is paused until its revenue record is confirmed. Retry shortly.", 503);
    }

    return new Response(WORKFLOW_BRIEF_KIT, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": 'attachment; filename="Elevat-AI-Workflow-Brief-Kit.md"',
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return fail("Secure delivery is temporarily unavailable. Please retry or contact support with your receipt.", 503);
  }
}
