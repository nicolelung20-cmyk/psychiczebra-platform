import { NextResponse } from "next/server";
import { summarizeCharges, tokenMatches } from "../../../../src/autogroup-revenue.js";

export const dynamic = "force-dynamic";

const WINDOW_START = Math.floor(new Date("2026-09-28T00:00:00Z").getTime() / 1000);

/** Read-only revenue counts from Stripe. Needs AUTOGROUP_DASH_TOKEN (viewer) and STRIPE_READ_KEY (restricted key with charges:read). */
export async function GET(request: Request) {
  const expected = process.env.AUTOGROUP_DASH_TOKEN;
  if (!expected) return NextResponse.json({ connected: false, reason: "AUTOGROUP_DASH_TOKEN is not set" }, { status: 503 });
  if (!tokenMatches(expected, request.headers.get("x-dash-token") ?? undefined)) {
    return NextResponse.json({ connected: false, reason: "Invalid dashboard token" }, { status: 401 });
  }
  const key = process.env.STRIPE_READ_KEY;
  if (!key) return NextResponse.json({ connected: false, reason: "STRIPE_READ_KEY is not set" });
  try {
    const response = await fetch(`https://api.stripe.com/v1/charges?limit=100&created[gte]=${WINDOW_START}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ connected: false, reason: `Stripe returned ${response.status}` });
    const body = (await response.json()) as { data?: unknown[]; has_more?: boolean };
    return NextResponse.json({
      connected: true,
      ...summarizeCharges(body.data ?? []),
      truncated: body.has_more === true,
      since: new Date(WINDOW_START * 1000).toISOString().slice(0, 10),
      generatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ connected: false, reason: "Could not reach Stripe" });
  }
}
