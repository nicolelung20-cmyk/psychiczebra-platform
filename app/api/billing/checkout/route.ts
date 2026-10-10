import { NextResponse } from "next/server";
import { normalizeAttribution } from "@/lib/attribution";
import { createUserClient } from "@/lib/supabase/server";
import { incomeStreamCatalog, resolveIncomeStream, resolvePriceId } from "@/lib/income-streams";

type CheckoutRequest = { attribution?: unknown; stream?: unknown };

async function parseCheckoutRequest(request: Request): Promise<CheckoutRequest> {
  const body = await request.text();
  if (!body) return {};
  const value: unknown = JSON.parse(body);
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Request body must be an object.");
  return value as CheckoutRequest;
}

export async function POST(request: Request) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/, "");
  if (!accessToken) return NextResponse.json({ error: "Please sign in to upgrade." }, { status: 401 });
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!stripeKey || !appUrl) return NextResponse.json({ error: "Billing is not configured yet." }, { status: 503 });

  let checkoutRequest: CheckoutRequest;
  try { checkoutRequest = await parseCheckoutRequest(request); }
  catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }

  const stream = resolveIncomeStream(checkoutRequest.stream);
  const streamConfig = incomeStreamCatalog[stream];
  const priceId = resolvePriceId(stream);
  if (!priceId) return NextResponse.json({ error: "The selected income stream is not configured." }, { status: 503 });

  let attribution;
  try { attribution = normalizeAttribution(checkoutRequest.attribution); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Attribution is invalid." }, { status: 400 }); }

  try {
    const supabase = createUserClient(accessToken);
    const { data: auth, error } = await supabase.auth.getUser();
    if (error || !auth.user?.email) return NextResponse.json({ error: "Your session has expired. Sign in again." }, { status: 401 });

    // Stripe IDs travel in signed Checkout metadata; the webhook maps the
    // Stripe product ID to the internal revenue_products UUID before fulfillment.
    const metadata = {
      user_id: auth.user.id,
      income_stream: stream,
      product_id: streamConfig.product,
      price_id: priceId,
      ...attribution,
    };
    const mode = streamConfig.mode;
    const params: Record<string, string> = {
      mode,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      success_url: `${appUrl}/?checkout=success&stream=${stream}`,
      cancel_url: `${appUrl}/?billing=cancelled&stream=${stream}`,
      customer_email: auth.user.email,
    };
    // Stable customer IDs are required to reconcile one-time payments safely.
    if (mode === "payment") params.customer_creation = "always";
    for (const [key, value] of Object.entries(metadata)) {
      params[`metadata[${key}]`] = value;
      if (mode === "subscription") params[`subscription_data[metadata][${key}]`] = value;
    }

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params),
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
