export type AgentHeartbeat = {
  agent_id: string;
  status: string | null;
  checked_at: string;
};

export type AgentWithHeartbeat<T extends { id: string }> = T & {
  heartbeatStatus: string | null;
  lastHeartbeatAt: string | null;
  heartbeatFresh: boolean;
};

export function attachHeartbeatStatus<T extends { id: string }>(
  agents: T[],
  heartbeats: AgentHeartbeat[],
  now?: number,
  freshnessMs?: number,
): AgentWithHeartbeat<T>[];
