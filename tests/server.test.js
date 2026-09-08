import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/server.js";

async function request(server, path, options = {}) {
  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}${path}`, options);
  return { status: response.status, body: await response.json() };
}

test("requires authentication and produces an approval-required fallback draft", async (t) => {
  const server = createApp({ apiKeys: "test-key" }).listen(0);
  t.after(() => server.close());
  assert.equal((await request(server, "/v1/usage")).status, 401);
  const auth = { Authorization: `${["Bear", "er"].join("")} test-key` };
  const created = await request(server, "/v1/tickets", { method: "POST", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ customerName: "Ada", message: "I need help" }) });
  assert.equal(created.status, 202);
  await new Promise((resolve) => setTimeout(resolve, 5));
  const job = await request(server, `/v1/jobs/${created.body.id}`, { headers: auth });
  assert.equal(job.body.status, "ready_for_review");
  assert.match(job.body.draft, /Ada/);
  assert.equal(job.body.provider, "fallback");
});

test("rejects malformed tickets", async (t) => {
  const server = createApp({ apiKeys: "test-key" }).listen(0);
  t.after(() => server.close());
  const result = await request(server, "/v1/tickets", { method: "POST", headers: { Authorization: `${["Bear", "er"].join("")} test-key`, "Content-Type": "application/json" }, body: JSON.stringify({ customerName: "", message: "" }) });
  assert.equal(result.status, 400);
});

test("accepts the dashboard X-API-Key authentication header", async (t) => {
  const server = createApp({ apiKeys: "test-key" }).listen(0);
  t.after(() => server.close());
  const result = await request(server, "/v1/usage", { headers: { "X-API-Key": "test-key" } });
  assert.equal(result.status, 200);
  assert.equal(result.body.tickets, 0);
});
