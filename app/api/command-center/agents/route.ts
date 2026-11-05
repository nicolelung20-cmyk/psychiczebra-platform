import { NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabase/server";

const HEARTBEAT_STALE_AFTER_MS = 5 * 60 * 1000;

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!accessToken) {
    return NextResponse.json({ status: "unauthenticated", error: "Sign in to view agent health." }, { status: 401 });
  }

  try {
    const supabase = createUserClient(accessToken);
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) {
      return NextResponse.json({ status: "unauthenticated", error: "Your session has expired." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("command_agents")
      .select("id,status,updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ status: "unavailable", error: "Agent heartbeat records are not readable for this account." }, { status: 503 });
    }

    const now = Date.now();
    const agents = (data ?? []).map((agent) => {
      const heartbeatAt = agent.updated_at ? new Date(agent.updated_at).getTime() : NaN;
      const fresh = Number.isFinite(heartbeatAt) && now - heartbeatAt <= HEARTBEAT_STALE_AFTER_MS;
      return {
        id: agent.id,
        reportedStatus: agent.status,
        heartbeatAt: agent.updated_at,
        status: fresh && agent.status === "active" ? "live" : "stale",
        ageSeconds: Number.isFinite(heartbeatAt) ? Math.max(0, Math.floor((now - heartbeatAt) / 1000)) : null,
      };
    });

    return NextResponse.json({
      status: agents.length > 0 && agents.every((agent) => agent.status === "live") ? "live" : "degraded",
      staleAfterSeconds: HEARTBEAT_STALE_AFTER_MS / 1000,
      source: "command_agents.updated_at",
      agents,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "unavailable", error: "Agent health could not be loaded." }, { status: 503 });
  }
}
