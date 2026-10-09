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

type StripeCheckoutSession = {
  id?: string;
  mode?: "payment" | "subscription" | "setup";
  amount_total?: number | null;
  currency?: string | null;
  payment_status?: string;
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
  items?: { data?: Array<{ price?: { unit_amount?: number | null; nickname?: string | null; product?: string | null; currency?: string | null } }> };
};

type StripeInvoice = {
  id?: string;
  customer?: string | null;
  subscription?: string | null;
  amount_paid?: number | null;
  currency?: string | null;
  created?: number;
  billing_reason?: string | null;
};

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await request.text();
  if (!secret || !validSignature(request.headers.get("stripe-signature"), body, secret)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  let event: { id?: string; type?: string; data?: { object?: StripeCheckoutSession | StripeSubscription | StripeInvoice } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid event payload." }, { status: 400 });
  }

  const supported = new Set([
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "invoice.payment_succeeded",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ]);
  if (!event.type || !supported.has(event.type)) return NextResponse.json({ received: true });
  if (!event.id) return NextResponse.json({ error: "Stripe event has no id." }, { status: 400 });

  try {
    const supabase = createServiceClient();
    const object = event.data?.object ?? {};

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = object as StripeCheckoutSession;
      // Do not provision unpaid asynchronous sessions. Stripe sends async_payment_succeeded after settlement.
      if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
        return NextResponse.json({ received: true, deferred: true });
      }
      if (!session.id) return NextResponse.json({ error: "Checkout session has no id." }, { status: 400 });

      const stripeCustomerId = session.customer ?? null;
      const email = session.customer_details?.email ?? null;
      const name = session.customer_details?.name ?? null;
      let customerId: string | null = null;

      if (stripeCustomerId) {
        const { data: customer, error } = await supabase.from("customers").upsert(
          { stripe_customer_id: stripeCustomerId, email, name },
          { onConflict: "stripe_customer_id" },
        ).select("id").single();
        if (error) throw error;
        customerId = customer.id;
      } else if (email) {
        const { data: existing, error: lookupError } = await supabase.from("customers")
          .select("id").eq("email", email).maybeSingle();
        if (lookupError) throw lookupError;
        if (existing?.id) customerId = existing.id;
        else {
          const { data: created, error } = await supabase.from("customers")
            .insert({ email, name }).select("id").single();
          if (error) throw error;
          customerId = created.id;
        }
      }

      // For subscriptions, invoice.payment_succeeded is the revenue event. Avoid counting
      // the initial Checkout Session and its first invoice as two separate receipts.
      let revenueEventId: string | null = null;
      if (session.mode !== "subscription") {
        const { data: existingEvent, error: eventLookupError } = await supabase.from("revenue_events")
          .select("id").filter("metadata->>checkout_session_id", "eq", session.id).maybeSingle();
        if (eventLookupError) throw eventLookupError;
        if (existingEvent?.id) {
          revenueEventId = existingEvent.id;
        } else {
          const { data: revenueEvent, error: revenueError } = await supabase.from("revenue_events").upsert(
            {
              customer_id: customerId,
              stripe_event_id: event.id,
              event_type: "checkout_completed",
              amount: session.amount_total == null ? null : session.amount_total / 100,
              currency: session.currency ?? "usd",
              occurred_at: new Date().toISOString(),
              metadata: {
                checkout_session_id: session.id,
                stripe_event_id: event.id,
                income_stream: session.metadata?.income_stream ?? null,
                mode: session.mode ?? null,
                payment_status: session.payment_status ?? null,
                stripe_customer_id: stripeCustomerId,
                user_id: session.metadata?.user_id ?? null,
                product_id: session.metadata?.product_id ?? null,
                price_id: session.metadata?.price_id ?? null,
              },
            },
            { onConflict: "stripe_event_id", ignoreDuplicates: true },
          ).select("id").maybeSingle();
          if (revenueError) throw revenueError;
          revenueEventId = revenueEvent?.id ?? null;
          if (!revenueEventId) {
            const { data: duplicate, error } = await supabase.from("revenue_events")
              .select("id").filter("metadata->>checkout_session_id", "eq", session.id).maybeSingle();
            if (error) throw error;
            revenueEventId = duplicate?.id ?? null;
          }
        }
      }

      // Subscription lifecycle events own the authoritative status; Checkout must not overwrite trialing/canceled states.\n\n      const productId = session.metadata?.product_id;
      if (customerId && productId) {
        const { data: existingJob, error: jobLookupError } = await supabase.from("fulfillment_jobs")
          .select("id").eq("customer_id", customerId).eq("product_id", productId)
          .filter("metadata->>checkout_session_id", "eq", session.id).maybeSingle();
        if (jobLookupError) throw jobLookupError;
        if (!existingJob) {
          const { error } = await supabase.from("fulfillment_jobs").insert({
            customer_id: customerId,
            revenue_event_id: revenueEventId,
            product_id: productId,
            status: "pending",
            delivery_channel: "email",
            delivery_target: email,
            metadata: { checkout_session_id: session.id, stripe_event_id: event.id },
          });
          if (error && error.code !== "23505") throw error;
        }
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
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = object as StripeInvoice;
      if (!invoice.id) return NextResponse.json({ error: "Invoice has no id." }, { status: 400 });
      const { data: existingEvent, error: lookupError } = await supabase.from("revenue_events")
        .select("id").eq("stripe_event_id", event.id).maybeSingle();
      if (lookupError) throw lookupError;
      if (!existingEvent) {
        let customerId: string | null = null;
        if (invoice.customer) {
          const { data: customer, error } = await supabase.from("customers")
            .select("id").eq("stripe_customer_id", invoice.customer).maybeSingle();
          if (error) throw error;
          customerId = customer?.id ?? null;
        }
        const { error } = await supabase.from("revenue_events").upsert({
          customer_id: customerId,
          stripe_event_id: event.id,
          event_type: "invoice_payment_succeeded",
          amount: invoice.amount_paid == null ? null : invoice.amount_paid / 100,
          currency: invoice.currency ?? "usd",
          occurred_at: invoice.created ? new Date(invoice.created * 1000).toISOString() : new Date().toISOString(),
          metadata: {
            invoice_id: invoice.id,
            stripe_event_id: event.id,
            stripe_customer_id: invoice.customer ?? null,
            stripe_subscription_id: invoice.subscription ?? null,
            billing_reason: invoice.billing_reason ?? null,
          },
        }, { onConflict: "stripe_event_id", ignoreDuplicates: true });
        if (error) throw error;
      }
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
          currency: item?.price?.currency ?? subscription.currency ?? "usd",
          current_period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
        }, { onConflict: "stripe_subscription_id" });
        if (error) throw error;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe revenue reconciliation failed:", error);
    return NextResponse.json({ error: "Could not reconcile Stripe event." }, { status: 500 });
  }
}
