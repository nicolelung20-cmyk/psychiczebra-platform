import { NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/, "");
  if (!accessToken) return NextResponse.json({ error: "Please sign in to upgrade." }, { status: 401 });
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!stripeKey || !priceId || !appUrl) {
    return NextResponse.json({ error: "Billing is not configured yet." }, { status: 503 });
  }

  try {
    const supabase = createUserClient(accessToken);
    const { data: auth, error } = await supabase.auth.getUser();
    if (error || !auth.user?.email) return NextResponse.json({ error: "Your session has expired. Sign in again." }, { status: 401 });
    const parameters = new URLSearchParams({
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      success_url: `${appUrl}/?upgraded=true`,
      cancel_url: `${appUrl}/?billing=cancelled`,
      customer_email: auth.user.email,
      "metadata[user_id]": auth.user.id,
    });
    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: parameters,
    });
    const result = await stripeResponse.json() as { url?: string; error?: { message?: string } };
    if (!stripeResponse.ok || !result.url) {
      console.error("Stripe checkout creation failed:", result.error?.message);
      return NextResponse.json({ error: "Unable to create a checkout session." }, { status: 502 });
    }
    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error("Checkout request failed:", error);
    return NextResponse.json({ error: "Billing is not configured correctly yet." }, { status: 500 });
  }
}
