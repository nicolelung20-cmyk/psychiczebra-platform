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
  const event = JSON.parse(body) as { type?: string; data?: { object?: { metadata?: { user_id?: string }; subscription?: string } } };
  if (event.type !== "checkout.session.completed") return NextResponse.json({ received: true });

  const session = event.data?.object;
  const userId = session?.metadata?.user_id;
  if (!userId) return NextResponse.json({ error: "Checkout session has no user metadata." }, { status: 400 });
  try {
    const { error } = await createServiceClient()
      .from("profiles")
      .update({ plan: "pro", stripe_subscription_id: session.subscription ?? null, usage_count: 0, usage_period_started_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw error;
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook profile update failed:", error);
    return NextResponse.json({ error: "Could not activate subscription." }, { status: 500 });
  }
}
