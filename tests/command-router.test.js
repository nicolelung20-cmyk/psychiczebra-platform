import test from "node:test";
import assert from "node:assert/strict";
import { routeCommand } from "../src/command-router.js";

test("routes build commands to the registered Coder agent", () => {
  assert.deepEqual(routeCommand("build the command center"), { agent: "Coder", approvalRequired: false });
});

test("routes trading commands to Trading Research Agent and requires approval", () => {
  assert.deepEqual(routeCommand("run the memecoin trading bot"), { agent: "Trading Research Agent", approvalRequired: true });
});

test("routes unknown commands to Orchestrator", () => {
  assert.deepEqual(routeCommand("show me system status"), { agent: "Orchestrator", approvalRequired: false });
});
