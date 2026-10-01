export type AgentId = "orchestrator" | "researcher" | "coder" | "reviewer" | "ops" | "security" | "revenue";

export type AgentEvent = {
  id: string;
  ts: string;
  from: AgentId;
  to: AgentId | "all";
  type: "task" | "progress" | "finding" | "artifact" | "review" | "blocker" | "completion";
  summary: string;
  correlationId: string;
  data?: Record<string, unknown>;
};

const AGENTS: AgentId[] = [
  "orchestrator",
  "researcher",
  "coder",
  "reviewer",
  "ops",
  "security",
  "revenue",
];

export function allAgents(): AgentId[] {
  return [...AGENTS];
}

export function broadcast(event: Omit<AgentEvent, "id" | "ts">): AgentEvent {
  return {
    ...event,
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    to: "all",
  };
}

/**
 * Global-loop contract:
 * every meaningful state transition is broadcast to every agent.
 * Agents consume compact events, not entire transcripts.
 */
export function createAgentEvent(
  event: Omit<AgentEvent, "id" | "ts">,
): AgentEvent {
  return {
    ...event,
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
  };
}

export const GLOBAL_AGENT_LOOP = {
  enabled: true,
  delivery: "broadcast",
  stateSource: "persistent",
  contextMode: "compact-task-packets",
  requiredAgents: AGENTS,
  guarantees: [
    "new task broadcast",
    "progress broadcast",
    "finding broadcast",
    "artifact broadcast",
    "review/blocker broadcast",
    "completion broadcast",
  ],
  isolation: "agents receive relevant compact state; secrets are never broadcast",
};
