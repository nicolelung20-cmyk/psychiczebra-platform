export function attachHeartbeatStatus(agents, heartbeats, now = Date.now(), freshnessMs = 5 * 60 * 1000) {
  const latestByAgent = new Map();

  for (const heartbeat of heartbeats ?? []) {
    if (!heartbeat?.agent_id) continue;
    const timestamp = Date.parse(heartbeat.checked_at ?? "");
    if (!Number.isFinite(timestamp)) continue;
    const previous = latestByAgent.get(heartbeat.agent_id);
    if (!previous || timestamp > previous.timestamp) {
      latestByAgent.set(heartbeat.agent_id, { heartbeat, timestamp });
    }
  }

  return (agents ?? []).map((agent) => {
    const latest = latestByAgent.get(agent.id);
    const age = latest ? now - latest.timestamp : Number.POSITIVE_INFINITY;
    const heartbeatFresh = age >= -30_000 && age <= freshnessMs;

    return {
      ...agent,
      heartbeatStatus: latest?.heartbeat.status ?? null,
      lastHeartbeatAt: latest?.heartbeat.checked_at ?? null,
      heartbeatFresh,
    };
  });
}
