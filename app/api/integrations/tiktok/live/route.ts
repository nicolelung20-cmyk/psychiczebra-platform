import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type TikTokEvent = {
  type?: unknown;
  username?: unknown;
  nickname?: unknown;
  comment?: unknown;
  value?: unknown;
  viewerCount?: unknown;
  timestamp?: unknown;
  metadata?: unknown;
};

const allowed = new Set([
  "connect","disconnect","follow","share","comment","gift","like",
  "join","viewer_count","live_end","subscribe","poll","battle"
]);

function authorized(request: Request) {
  const expected = process.env.TIKTOK_EVENT_SECRET;
  const provided = request.headers.get("x-tiktok-event-secret");
  return Boolean(expected && provided && provided === expected);
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: TikTokEvent;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const type = typeof body.type === "string" ? body.type.toLowerCase() : "";
  if (!allowed.has(type)) {
    return NextResponse.json({ error: "Unsupported event type." }, { status: 400 });
  }

  const actor = typeof body.nickname === "string"
    ? body.nickname
    : typeof body.username === "string" ? body.username : "tiktok";
  const detail = {
    source: "tiktok_live",
    username: typeof body.username === "string" ? body.username : null,
    nickname: typeof body.nickname === "string" ? body.nickname : null,
    comment: typeof body.comment === "string" ? body.comment : null,
    value: typeof body.value === "number" ? body.value : null,
    viewerCount: typeof body.viewerCount === "number" ? body.viewerCount : null,
    timestamp: typeof body.timestamp === "string" ? body.timestamp : new Date().toISOString(),
    metadata: body.metadata ?? null,
  };

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("command_audit").insert({
    event_type: `tiktok.${type}`,
    actor,
    action: type,
    status: "received",
    target: "TikTok LIVE",
    details: detail,
  }).select("id,event_type,actor,action,status,target,details,created_at").single();

  if (error) {
    console.error("TikTok event ingest failed:", error);
    return NextResponse.json({ error: "Event storage failed." }, { status: 503 });
  }

  return NextResponse.json({ ok: true, event: data }, { status: 202 });
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("command_audit")
    .select("id,event_type,actor,action,status,target,details,created_at")
    .like("event_type", "tiktok.%")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: "Event feed unavailable." }, { status: 503 });
  return NextResponse.json({ ok: true, events: data ?? [] });
}
