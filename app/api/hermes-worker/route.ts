import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Result = {
  provider: string;
  model: string;
  message: string;
  usage: unknown;
};

async function openRouterFree(key: string, messages: unknown[]): Promise<Result> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://elevat-pearl.vercel.app",
      "X-Title": "Elevat Hermes Command Center",
    },
    body: JSON.stringify({ model: "openrouter/free", messages, max_tokens: 2000 }),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || `OpenRouter free route failed (${response.status})`);
  }
  return {
    provider: "openrouter-free",
    model: payload?.model || "openrouter/free",
    message: payload?.choices?.[0]?.message?.content || "",
    usage: payload?.usage || null,
  };
}

async function geminiFree(key: string, messages: Array<{ role: string; content: unknown }>): Promise<Result> {
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content) }],
    }));
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => String(m.content))
    .join("\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        contents,
        generationConfig: { maxOutputTokens: 2000 },
      }),
      cache: "no-store",
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Gemini free route failed (${response.status})`);
  }

  return {
    provider: "gemini-free",
    model: "gemini-2.5-flash",
    message: payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") || "",
    usage: payload?.usageMetadata || null,
  };
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized worker caller" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  if (!messages.length) {
    return NextResponse.json({ ok: false, error: "messages required" }, { status: 400 });
  }

  // HARD POLICY: the worker only uses zero-price AI routes.
  // Paid OpenAI/Anthropic models and OPENROUTER_MODEL are intentionally ignored.
  const errors: string[] = [];

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    try {
      const result = await openRouterFree(openRouterKey, messages);
      return NextResponse.json({ ok: true, ...result, ai_policy: "free_only" });
    } catch (error) {
      errors.push(`openrouter: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const result = await geminiFree(geminiKey, messages);
      return NextResponse.json({ ok: true, ...result, ai_policy: "free_only" });
    } catch (error) {
      errors.push(`gemini: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return NextResponse.json(
    {
      ok: false,
      error: "No free AI provider succeeded",
      detail: errors.join(" | ") || "Configure OPENROUTER_API_KEY and/or GEMINI_API_KEY",
      ai_policy: "free_only",
      paid_models_allowed: false,
    },
    { status: 503 },
  );
}
