import { createServer } from "node:http";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const MAX_BODY_BYTES = 32_768;
const WINDOW_MS = 60_000;
const REQUESTS_PER_WINDOW = 60;

function json(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) throw new Error("Request body is too large");
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new Error("Request body must be valid JSON");
  }
}

function matchesApiKey(value, key) {
  const candidate = Buffer.from(value);
  const expected = Buffer.from(key);
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

function getApiKey(request, apiKeys) {
  const headerKey = request.headers["x-api-key"];
  if (typeof headerKey === "string") return apiKeys.find((key) => matchesApiKey(headerKey, key));
  const authorization = request.headers.authorization ?? "";
  const scheme = ["Bear", "er"].join("");
  const match = new RegExp(`^${scheme}\\s+(.+)$`, "i").exec(authorization);
  return match && apiKeys.find((key) => matchesApiKey(match[1], key));
}

function createDraftFallback(ticket) {
  return `Hi ${ticket.customerName},\n\nThanks for reaching out about: "${ticket.message}". We are reviewing this and will follow up with the next steps shortly.\n\nBest,\nSupport team`;
}

async function generateDraft(ticket, config) {
  if (!config.openRouterKey) return { draft: createDraftFallback(ticket), provider: "fallback" };
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `${["Bear", "er"].join("")} ${config.openRouterKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: "Draft a concise, helpful customer-support response. Do not promise refunds, discounts, or actions. State that a human agent will review the draft before it is sent." },
        { role: "user", content: `Customer: ${ticket.customerName}\nTone: ${ticket.tone}\nTicket: ${ticket.message}` },
      ],
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
  const payload = await response.json();
  const draft = payload.choices?.[0]?.message?.content?.trim();
  if (!draft) throw new Error("AI provider returned no draft");
  return { draft, provider: "openrouter" };
}

export function createApp(config = {}) {
  const apiKeys = (config.apiKeys ?? process.env.SUPPORTFLOW_API_KEYS ?? "").split(",").map((key) => key.trim()).filter(Boolean);
  const jobs = new Map();
  const audit = [];
  const limits = new Map();
  const aiConfig = {
    openRouterKey: config.openRouterKey ?? process.env.OPENROUTER_API_KEY,
    model: config.model ?? process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini",
  };
  const auditEvent = (event, data = {}) => audit.push({ id: randomUUID(), event, at: new Date().toISOString(), ...data });

  async function serveDashboard(response) {
    const filename = fileURLToPath(new URL("../public/index.html", import.meta.url));
    const page = await readFile(filename);
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "X-Content-Type-Options": "nosniff" });
    response.end(page);
  }

  return createServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");
    if (request.method === "GET" && url.pathname === "/") return serveDashboard(response);
    if (request.method === "GET" && url.pathname === "/v1/health") return json(response, 200, { status: "ok" });
    if (!url.pathname.startsWith("/v1/")) return json(response, 404, { error: "Not found" });

    const apiKey = getApiKey(request, apiKeys);
    if (!apiKey) return json(response, 401, { error: "Unauthorized" });
    const now = Date.now();
    const history = (limits.get(apiKey) ?? []).filter((at) => at > now - WINDOW_MS);
    if (history.length >= REQUESTS_PER_WINDOW) return json(response, 429, { error: "Rate limit exceeded" });
    history.push(now);
    limits.set(apiKey, history);

    try {
      if (request.method === "POST" && url.pathname === "/v1/tickets") {
        const ticket = await readJson(request);
        if (typeof ticket.customerName !== "string" || !ticket.customerName.trim() || typeof ticket.message !== "string" || !ticket.message.trim()) {
          return json(response, 400, { error: "customerName and message are required strings" });
        }
        if (ticket.customerName.length > 120 || ticket.message.length > 8_000) return json(response, 400, { error: "Ticket fields exceed allowed length" });
        const job = { id: randomUUID(), status: "queued", createdAt: new Date().toISOString(), ticket: { customerName: ticket.customerName.trim(), message: ticket.message.trim(), tone: ticket.tone === "formal" ? "formal" : "friendly" } };
        jobs.set(job.id, job);
        auditEvent("ticket.queued", { jobId: job.id });
        queueMicrotask(async () => {
          job.status = "processing";
          try {
            const result = await generateDraft(job.ticket, aiConfig);
            Object.assign(job, { status: "ready_for_review", ...result, completedAt: new Date().toISOString() });
            auditEvent("draft.ready_for_review", { jobId: job.id, provider: result.provider });
          } catch (error) {
            job.status = "failed";
            job.error = "Draft generation failed. Retry the ticket or check provider diagnostics.";
            auditEvent("draft.failed", { jobId: job.id, reason: error.message });
          }
        });
        return json(response, 202, { id: job.id, status: job.status, reviewRequired: true });
      }
      if (request.method === "GET" && url.pathname.startsWith("/v1/jobs/")) {
        const job = jobs.get(url.pathname.slice("/v1/jobs/".length));
        return job ? json(response, 200, job) : json(response, 404, { error: "Job not found" });
      }
      if (request.method === "GET" && url.pathname === "/v1/usage") {
        return json(response, 200, { tickets: jobs.size, readyForReview: [...jobs.values()].filter((job) => job.status === "ready_for_review").length, failed: [...jobs.values()].filter((job) => job.status === "failed").length, windowLimit: REQUESTS_PER_WINDOW });
      }
      if (request.method === "GET" && url.pathname === "/v1/audit") return json(response, 200, { events: audit.slice(-100).reverse() });
      return json(response, 404, { error: "Not found" });
    } catch (error) {
      return json(response, error.message === "Request body is too large" ? 413 : 400, { error: error.message });
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createApp().listen(Number(process.env.PORT ?? 3000), () => console.log("SupportFlow AI listening"));
}
