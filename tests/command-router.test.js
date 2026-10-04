import test from "node:test";
import assert from "node:assert/strict";
import { routeCommand } from "../src/command-router.js";

test("routes build commands to Builder", () => {
  assert.deepEqual(routeCommand("build the command center"), { agent: "Builder", approvalRequired: false });
});

test("routes trading commands to Trading and requires approval", () => {
  assert.deepEqual(routeCommand("run the memecoin trading bot"), { agent: "Trading", approvalRequired: true });
});

test("routes unknown commands to Supervisor", () => {
  assert.deepEqual(routeCommand("show me system status"), { agent: "Supervisor", approvalRequired: false });
});
