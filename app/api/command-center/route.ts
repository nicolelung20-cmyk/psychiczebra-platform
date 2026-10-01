import { NextResponse } from "next/server";
import { GLOBAL_AGENT_LOOP, allAgents } from "@/src/agent-bus";

export async function GET() {
  return NextResponse.json({
    status: "active",
    architecture: "limitless-control-plane",
    globalLoop: GLOBAL_AGENT_LOOP,
    agents: allAgents(),
    flow: [
      "intake",
      "broadcast",
      "classify",
      "compact-context",
      "route",
      "execute",
      "broadcast-progress",
      "review",
      "approval",
      "deploy",
      "broadcast-completion",
      "telemetry",
    ],
  });
}
