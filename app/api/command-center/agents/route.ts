import { NextResponse } from "next/server";
import { allAgents, GLOBAL_AGENT_LOOP } from "@/src/agent-bus";

export async function GET() {
  return NextResponse.json({
    active: true,
    globalLoop: GLOBAL_AGENT_LOOP,
    agents: allAgents().map((id) => ({
      id,
      subscribed: true,
      receives: "all meaningful task-state events",
    })),
  });
}
