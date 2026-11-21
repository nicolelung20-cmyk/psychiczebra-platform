const DEFAULT_MODEL = "moonshotai/Kimi-Linear-48B-A3B-Instruct";
const DEFAULT_TIMEOUT_MS = 120_000;

function isPrivateIpv4(hostname) {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return parts[0] === 10
    || parts[0] === 127
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168)
    || (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127);
}

function validateBaseUrl(value) {
  if (!value) throw new Error("ANNE_KIMI_BASE_URL is required; no provider request was sent.");
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Kimi provider base URL must be a valid absolute URL.");
  }

  const localHost = ["localhost", "127.0.0.1", "::1"].includes(url.hostname)
    || isPrivateIpv4(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && localHost)) {
    throw new Error("HTTPS is required unless the Kimi endpoint is loopback or a private-network address.");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("Kimi provider base URL must not contain credentials, query parameters, or a fragment.");
  }
  return url.toString().replace(/\/$/, "");
}

export function createKimiLinearClient({
  baseUrl,
  model = DEFAULT_MODEL,
  apiKey,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  fetchImpl = globalThis.fetch,
} = {}) {
  const endpoint = validateBaseUrl(baseUrl);
  if (typeof fetchImpl !== "function") throw new Error("A Fetch-compatible implementation is required.");

  return {
    async complete({ messages, temperature = 0.2, maxTokens = 2048 } = {}) {
      if (!Array.isArray(messages) || messages.length === 0) {
        throw new Error("At least one chat message is required.");
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl(`${endpoint}/chat/completions`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
          },
          body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream: false,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Kimi provider request failed with HTTP ${response.status}.`);
        }

        const payload = await response.json();
        const text = payload?.choices?.[0]?.message?.content;
        if (typeof text !== "string") {
          throw new Error("Kimi provider did not return a message in choices[0].message.content.");
        }
        return {
          text,
          model: payload.model ?? model,
          usage: payload.usage ?? null,
          provider: "kimi-linear",
        };
      } catch (error) {
        if (error?.name === "AbortError") {
          throw new Error(`Kimi provider request timed out after ${timeoutMs}ms.`);
        }
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

export function createKimiLinearClientFromEnv(env = process.env, fetchImpl = globalThis.fetch) {
  return createKimiLinearClient({
    baseUrl: env.ANNE_KIMI_BASE_URL,
    model: env.ANNE_KIMI_MODEL || DEFAULT_MODEL,
    apiKey: env.ANNE_KIMI_API_KEY || undefined,
    fetchImpl,
  });
}
