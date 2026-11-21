import test from "node:test";
import assert from "node:assert/strict";
import { createKimiLinearClient } from "../src/providers/kimi-linear.js";

test("sends a chat completion to the configured private OpenAI-compatible Kimi endpoint", async () => {
  let request;
  const client = createKimiLinearClient({
    baseUrl: "http://127.0.0.1:8000/v1",
    model: "moonshotai/Kimi-Linear-48B-A3B-Instruct",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return Response.json({ choices: [{ message: { content: "Ready." } }] });
    },
  });

  const result = await client.complete({
    messages: [{ role: "user", content: "Check ANNE status." }],
  });

  assert.equal(request.url, "http://127.0.0.1:8000/v1/chat/completions");
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.headers.authorization, undefined);
  assert.equal(JSON.parse(request.options.body).model, "moonshotai/Kimi-Linear-48B-A3B-Instruct");
  assert.equal(result.text, "Ready.");
});

test("adds bearer auth only when an API key is explicitly configured", async () => {
  let headers;
  const client = createKimiLinearClient({
    baseUrl: "https://inference.example.test/v1",
    apiKey: "test-key",
    fetchImpl: async (_url, options) => {
      headers = options.headers;
      return Response.json({ choices: [{ message: { content: "Authenticated." } }] });
    },
  });

  await client.complete({ messages: [{ role: "user", content: "Hello" }] });
  assert.equal(headers.authorization, "Bearer test-key");
});

test("rejects non-local plain HTTP endpoints before making a network request", async () => {
  let called = false;
  const client = createKimiLinearClient({
    baseUrl: "http://inference.example.test/v1",
    fetchImpl: async () => { called = true; return Response.json({}); },
  });

  await assert.rejects(
    client.complete({ messages: [{ role: "user", content: "Hello" }] }),
    /HTTPS is required/,
  );
  assert.equal(called, false);
});

test("reports malformed provider responses and non-success HTTP statuses", async () => {
  const malformed = createKimiLinearClient({
    baseUrl: "http://localhost:8000/v1",
    fetchImpl: async () => Response.json({ choices: [] }),
  });
  await assert.rejects(
    malformed.complete({ messages: [{ role: "user", content: "Hello" }] }),
    /did not return a message/,
  );

  const unavailable = createKimiLinearClient({
    baseUrl: "http://localhost:8000/v1",
    fetchImpl: async () => new Response("offline", { status: 503 }),
  });
  await assert.rejects(
    unavailable.complete({ messages: [{ role: "user", content: "Hello" }] }),
    /HTTP 503/,
  );
});
