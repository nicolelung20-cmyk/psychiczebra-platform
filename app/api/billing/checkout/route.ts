import { NextResponse } from "next/server";
import { normalizeAttribution } from "@/lib/attribution";
import { createServiceClient, createUserClient } from "@/lib/supabase/server";
import { incomeStreamCatalog, resolveIncomeStream } from "@/lib/income-streams";

type CheckoutRequest = { attribution?: unknown; stream?: unknown };

async function parseCheckoutRequest(request: Request): Promise<CheckoutRequest> {
  const body = await request.text();
  if (!body) return {};
  const value: unknown = JSON.parse(body);
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Request body must be an object.");
  return value as CheckoutRequest;
}

export async function POST(request: Request) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\\s+/, "");
  if (!accessToken) return NextResponse.json({ error: "Please sign in to upgrade." }, { status: 401 });
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!stripeKey || !appUrl) return NextResponse.json({ error: "Billing is not configured yet." }, { status: 503 });

  let checkoutRequest: CheckoutRequest;
  try { checkoutRequest = await parseCheckoutRequest(request); }
  catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }

  if (checkoutRequest.stream !== undefined && (typeof checkoutRequest.stream !== "string" || !Object.hasOwn(incomeStreamCatalog, checkoutRequest.stream))) {
    return NextResponse.json({ error: "The selected income stream is not supported." }, { status: 400 });
  }
  const stream = resolveIncomeStream(checkoutRequest.stream);

  let attribution;
  try { attribution = normalizeAttribution(checkoutRequest.attribution); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Attribution is invalid." }, { status: 400 }); }

  try {
    const userSupabase = createUserClient(accessToken);
    const { data: auth, error } = await userSupabase.auth.getUser();
    if (error || !auth.user?.email) return NextResponse.json({ error: "Your session has expired. Sign in again." }, { status: 401 });

    // The database catalog is the source of truth for internal fulfillment IDs and Stripe price IDs.
    const serviceSupabase = createServiceClient();
    const { data: product, error: productError } = await serviceSupabase
      .from("revenue_products")
      .select("id, stream_key, stripe_product_id, stripe_price_id, billing_type, active")
      .eq("stream_key", stream.replaceAll("-", "_"))
      .eq("active", true)
      .maybeSingle();

    if (productError) throw productError;
    if (!product?.id || !product.stripe_price_id || !product.stripe_product_id) {
      return NextResponse.json({ error: "This offer is not fully configured for checkout." }, { status: 503 });
    }

    const mode = product.billing_type === "one_time" ? "payment" : product.billing_type === "recurring" ? "subscription" : null;
    if (!mode) return NextResponse.json({ error: "The offer has an unsupported billing configuration." }, { status: 503 });

    const metadata = {
      ...attribution,
      user_id: auth.user.id,
      income_stream: stream,
      product_id: product.id,
      price_id: product.stripe_price_id,
      stripe_product_id: product.stripe_product_id,
    };
    const parameters = new URLSearchParams({
      mode,
      ...(mode === "payment" ? { customer_creation: "always" } : {}),
      "line_items[0][price]": product.stripe_price_id,
      "line_items[0][quantity]": "1",
      success_url: `${appUrl}/?checkout=success&stream=${stream}`,
      cancel_url: `${appUrl}/?billing=cancelled&stream=${stream}`,
      customer_email: auth.user.email,
      ...Object.fromEntries(Object.entries(metadata).flatMap(([key, value]) => [
        [`metadata[${key}]`, value],
        ...(mode === "subscription" ? [[`subscription_data[metadata][${key}]`, value]] : []),
      ])),
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
