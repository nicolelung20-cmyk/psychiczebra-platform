import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    "elevat.system": { text: process.env.ELEVAT_SYSTEM ?? "READY", number: 1, delta: 0, ttl: 120 },
    "elevat.hermes": { text: process.env.ELEVAT_HERMES ?? "ONLINE", number: 1, delta: 0, ttl: 120 },
    "elevat.revenue": { text: process.env.ELEVAT_REVENUE ?? "ACTIVE", number: 1, delta: 0, ttl: 300 },
    "elevat.paper": { text: process.env.ELEVAT_PAPER ?? "PAPER", number: 0, delta: 0, ttl: 120 },
    "elevat.alerts": { text: process.env.ELEVAT_ALERTS ?? "0", number: 0, delta: 0, ttl: 120 },
    "elevat.deploy": { text: process.env.ELEVAT_DEPLOY ?? "READY", number: 1, delta: 0, ttl: 300 },
  }, { headers: { "Cache-Control": "no-store" } });
}
