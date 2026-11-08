import test from "node:test";
import assert from "node:assert/strict";
import { attachHeartbeatStatus } from "../src/command-snapshot.js";

const now = Date.parse("2026-11-08T12:00:00.000Z");

test("marks only recently checked agents as live", () => {
  const agents = [{ id: "fresh" }, { id: "stale" }, { id: "missing" }];
  const heartbeats = [
    { agent_id: "fresh", status: "active", checked_at: "2026-11-08T11:56:00.000Z" },
    { agent_id: "stale", status: "active", checked_at: "2026-11-08T11:54:00.000Z" },
  ];

  const result = attachHeartbeatStatus(agents, heartbeats, now);

  assert.equal(result[0].heartbeatFresh, true);
  assert.equal(result[1].heartbeatFresh, false);
  assert.equal(result[2].heartbeatFresh, false);
  assert.equal(result[2].lastHeartbeatAt, null);
});

test("uses the newest heartbeat even when results are unordered", () => {
  const result = attachHeartbeatStatus(
    [{ id: "hermes" }],
    [
      { agent_id: "hermes", status: "stale", checked_at: "2026-11-08T11:40:00.000Z" },
      { agent_id: "hermes", status: "active", checked_at: "2026-11-08T11:59:00.000Z" },
    ],
    now,
  );

  assert.equal(result[0].heartbeatStatus, "active");
  assert.equal(result[0].lastHeartbeatAt, "2026-11-08T11:59:00.000Z");
  assert.equal(result[0].heartbeatFresh, true);
});

test("fails closed for invalid and future-dated heartbeat timestamps", () => {
  const result = attachHeartbeatStatus(
    [{ id: "invalid" }, { id: "future" }],
    [
      { agent_id: "invalid", status: "active", checked_at: "not-a-date" },
      { agent_id: "future", status: "active", checked_at: "2026-11-08T12:05:00.000Z" },
    ],
    now,
  );

  assert.equal(result[0].heartbeatFresh, false);
  assert.equal(result[1].heartbeatFresh, false);
});
