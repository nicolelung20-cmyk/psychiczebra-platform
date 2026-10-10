import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

function validSignature(signature: string | null, body: string, secret: string) {
  if (!signature) return false;
  const values = Object.fromEntries(signature.split(",").map((item) => item.split("=")));
  const timestamp = values.t;
  const received = values.v1;
  if (!timestamp || !received || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return received.length === expected.length && timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

type CheckoutSession = {
  id?: string;
  mode?: "payment" | "subscription" | "setup";
  amount_total?: number | null;
  currency?: string | null;
  payment_status?: string;
  payment_link?: string | null;
  payment_intent?: string | { id?: string } | null;
  customer?: string | null;
  subscription?: string | null;
  metadata?: Record<string, string>;
  customer_details?: { email?: string | null; name?: string | null };
};
type StripeSubscription = {
  id?: string;
  status?: string;
  customer?: string | null;
  currency?: string | null;
  current_period_end?: number | null;
  metadata?: Record<string, string>;
  items?: { data?: Array<{ price?: { unit_amount?: number | null; nickname?: string | null; product?: string | null } }> };
};
type StripeInvoice = {
  id?: string;
  customer?: string | null;
  subscription?: string | { id?: string } | null;
  amount_paid?: number | null;
  currency?: string | null;
  status_transitions?: { paid_at?: number | null };
};

const json = (body: unknown, status = 200) => NextResponse.json(body, { status });

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await request.text();
  if (!secret || !validSignature(request.headers.get("stripe-signature"), body, secret)) {
    return json({ error: "Invalid webhook signature." }, 400);
  }

  let event: { id?: string; type?: string; data?: { object?: CheckoutSession | StripeSubscription | StripeInvoice } };
  try { event = JSON.parse(body); }
  catch { return json({ error: "Invalid event payload." }, 400); }

  const supported = new Set([
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "invoice.payment_succeeded",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ]);
  if (!event.type || !supported.has(event.type)) return json({ received: true });

  try {
    const supabase = createServiceClient();
    const object = event.data?.object ?? {};
    const stripeEventId = event.id;
    if (!stripeEventId) return json({ error: "Stripe event has no id." }, 400);

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = object as CheckoutSession;
      // Checkout can complete before an asynchronous payment settles.
      if (session.payment_status !== "paid" || !session.id) return json({ received: true, skipped: "payment_not_paid" });

      // One-time Workflow Brief Kit orders use the existing minimal revenue ledger.
      // Do this before subscription/customer reconciliation: Payment Links may not
      // create a Stripe Customer, and delivery must depend on a confirmed payment.
      if (session.payment_link === "plink_1UGfrw0t6SDBlU8gNn6N5MwR" ||
          session.metadata?.product_sku === "workflow-brief-kit") {
        if (session.mode !== "payment" || session.amount_total !== 4700 || session.currency !== "usd") {
          throw new Error("Workflow Brief Kit checkout does not match the expected one-time USD price.");
        }
        const paymentIntentId = typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;
        const { error } = await supabase.from("revenue_transactions").upsert({
          stripe_session_id: session.id,
          stripe_payment_intent_id: paymentIntentId,
          email: session.customer_details?.email ?? null,
          product: "Elevat Workflow Brief Kit",
          amount_cents: session.amount_total,
          currency: "usd",
          status: "paid",
          updated_at: new Date().toISOString(),
        }, { onConflict: "stripe_session_id" });
        if (error) throw error;
        return json({ received: true, payment_confirmed: true, product: "workflow-brief-kit" });
      }

      const stripeCustomerId = session.customer ?? null;
      const email = session.customer_details?.email ?? null;
      const name = session.customer_details?.name ?? null;
      if (!stripeCustomerId) throw new Error("Paid Checkout Session has no Stripe customer ID.");

      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .upsert({ stripe_customer_id: stripeCustomerId, email, name }, { onConflict: "stripe_customer_id" })
        .select("id")
        .single();
      if (customerError) throw customerError;

      const revenuePayload = {
        customer_id: customer.id,
        stripe_event_id: stripeEventId,
        event_type: "checkout_completed",
        amount: session.mode === "subscription" || session.amount_total == null ? null : session.amount_total / 100,
        currency: session.currency ?? "usd",
        occurred_at: new Date().toISOString(),
        metadata: {
          checkout_session_id: session.id,
          income_stream: session.metadata?.income_stream ?? null,
          mode: session.mode ?? null,
          payment_status: session.payment_status,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: session.subscription ?? null,
          user_id: session.metadata?.user_id ?? null,
          stripe_product_id: session.metadata?.product_id ?? null,
          stripe_price_id: session.metadata?.price_id ?? null,
        },
      };
      const { data: revenueEvent, error: revenueError } = await supabase
        .from("revenue_events")
        .upsert(revenuePayload, { onConflict: "stripe_event_id", ignoreDuplicates: true })
        .select("id")
        .maybeSingle();
      if (revenueError && revenueError.code !== "23505") throw revenueError;

      // Recover the existing event when Stripe retries or emits a second event
      // for the same Checkout Session, including after a partial prior attempt.
      let revenueEventId = revenueEvent?.id ?? null;
      if (!revenueEventId) {
        const { data: existing, error } = await supabase
          .from("revenue_events")
          .select("id")
          .eq("metadata->>checkout_session_id", session.id)
          .maybeSingle();
        if (error) throw error;
        revenueEventId = existing?.id ?? null;
      }

      if (revenueEventId && session.metadata?.product_id) {
        const { data: product, error: productError } = await supabase
          .from("revenue_products")
          .select("id")
          .eq("stripe_product_id", session.metadata.product_id)
          .eq("active", true)
          .maybeSingle();
        if (productError) throw productError;
        if (!product) throw new Error("No active revenue_products row matches the Stripe product in Checkout metadata.");

        const { error } = await supabase.from("fulfillment_jobs").insert({
          customer_id: customer.id,
          revenue_event_id: revenueEventId,
          product_id: product.id,
          status: "pending",
          delivery_channel: "email",
          delivery_target: email,
          metadata: { checkout_session_id: session.id, stripe_event_id: stripeEventId },
        });
        // A unique index on (Checkout Session ID, product UUID) makes retries safe.
        if (error && error.code !== "23505") throw error;
      }

      if (session.metadata?.user_id && session.metadata?.income_stream === "elevat-pro" && session.mode === "subscription") {
        const { error } = await supabase.from("profiles").update({
          plan: "pro",
          stripe_subscription_id: session.subscription ?? null,
          usage_count: 0,
          usage_period_started_at: new Date().toISOString(),
        }).eq("id", session.metadata.user_id);
        if (error) throw error;
      }

      if (session.subscription) {
        const { error } = await supabase.from("subscriptions").upsert({
          customer_id: customer.id,
          stripe_subscription_id: session.subscription,
          status: "active",
          plan: session.metadata?.income_stream ?? null,
          amount: session.amount_total == null ? null : session.amount_total / 100,
          currency: session.currency ?? "usd",
        }, { onConflict: "stripe_subscription_id" });
        if (error) throw error;
      }
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = object as StripeInvoice;
      if (!invoice.id) return json({ error: "Stripe invoice has no id." }, 400);
      const stripeCustomerId = invoice.customer ?? null;
      let customerId: string | null = null;
      if (stripeCustomerId) {
        const { data: customer, error } = await supabase
          .from("customers")
          .select("id")
          .eq("stripe_customer_id", stripeCustomerId)
          .maybeSingle();
        if (error) throw error;
        customerId = customer?.id ?? null;
      }
      const subscriptionId = typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription?.id ?? null;
      const { error } = await supabase.from("revenue_events").upsert({
        customer_id: customerId,
        stripe_event_id: stripeEventId,
        event_type: "invoice_payment_succeeded",
        amount: invoice.amount_paid == null ? null : invoice.amount_paid / 100,
        currency: invoice.currency ?? "usd",
        occurred_at: invoice.status_transitions?.paid_at
          ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
          : new Date().toISOString(),
        metadata: { invoice_id: invoice.id, stripe_customer_id: stripeCustomerId, stripe_subscription_id: subscriptionId },
      }, { onConflict: "stripe_event_id", ignoreDuplicates: true });
      if (error) throw error;
    }

    if (event.type.startsWith("customer.subscription.")) {
      const subscription = object as StripeSubscription;
      if (subscription.id) {
        const stripeCustomerId = subscription.customer ?? null;
        const { data: customer, error: customerError } = stripeCustomerId
          ? await supabase.from("customers").select("id").eq("stripe_customer_id", stripeCustomerId).maybeSingle()
          : { data: null, error: null };
        if (customerError) throw customerError;
        const item = subscription.items?.data?.[0];
        const { error } = await supabase.from("subscriptions").upsert({
          customer_id: customer?.id ?? null,
          stripe_subscription_id: subscription.id,
          status: subscription.status ?? null,
          plan: subscription.metadata?.income_stream ?? item?.price?.nickname ?? null,
          amount: item?.price?.unit_amount == null ? null : item.price.unit_amount / 100,
          currency: subscription.currency ?? "usd",
          current_period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
        }, { onConflict: "stripe_subscription_id" });
        if (error) throw error;
      }
    }

    return json({ received: true });
  } catch (error) {
    console.error("Stripe revenue reconciliation failed:", error);
    return json({ error: "Could not reconcile Stripe event." }, 500);
  }
}
