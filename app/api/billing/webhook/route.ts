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

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await request.text();
  if (!secret || !validSignature(request.headers.get("stripe-signature"), body, secret)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  let event: { type?: string; data?: { object?: {
    id?: string; mode?: string; amount_total?: number | null; currency?: string | null;
    payment_status?: string; customer?: string | null; subscription?: string | null;
    metadata?: Record<string, string>;
  } } };
  try { event = JSON.parse(body); }
  catch { return NextResponse.json({ error: "Invalid event payload." }, { status: 400 }); }

  if (event.type !== "checkout.session.completed") return NextResponse.json({ received: true });

  const session = event.data?.object;
  const userId = session?.metadata?.user_id;
  const externalId = session?.id;
  if (!externalId) return NextResponse.json({ error: "Checkout session has no id." }, { status: 400 });

  try {
    const supabase = createServiceClient();
    const { error: revenueError } = await supabase.from("revenue_events").upsert({
      event_type: "checkout_completed",
      external_id: externalId,
      amount: session.amount_total == null ? null : session.amount_total / 100,
      currency: session.currency ?? "usd",
      metadata: {
        income_stream: session.metadata?.income_stream ?? "unknown",
        mode: session.mode ?? null,
        payment_status: session.payment_status ?? null,
        customer_id: session.customer ?? null,
        subscription_id: session.subscription ?? null,
        user_id: userId ?? null,
      },
    }, { onConflict: "event_type,external_id", ignoreDuplicates: true });
    if (revenueError) throw revenueError;

    if (userId && session.metadata?.income_stream === "elevat-pro" && session.mode === "subscription") {
      const { error } = await supabase.from("profiles").update({
        plan: "pro",
        stripe_subscription_id: session.subscription ?? null,
        usage_count: 0,
        usage_period_started_at: new Date().toISOString(),
      }).eq("id", userId);
      if (error) throw error;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe revenue event processing failed:", error);
    return NextResponse.json({ error: "Could not reconcile payment." }, { status: 500 });
  }
}
