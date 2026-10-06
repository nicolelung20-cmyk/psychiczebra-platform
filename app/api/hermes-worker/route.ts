import { NextResponse } from "next/server";

export const runtime = "nodejs";

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

  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, error: "OpenRouter is not configured" }, { status: 503 });
  }

  const model = process.env.OPENROUTER_MODEL || "nousresearch/hermes-3-llama-3.1-70b";
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://elevat-pearl.vercel.app",
      "X-Title": "Elevat Hermes Command Center",
    },
    body: JSON.stringify({ model, messages, max_tokens: 2000 }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return NextResponse.json(
      { ok: false, error: payload?.error?.message || "OpenRouter request failed" },
      { status: response.status }
    );
  }

  return NextResponse.json({
    ok: true,
    provider: "openrouter",
    model: payload?.model || model,
    message: payload?.choices?.[0]?.message?.content || "",
    usage: payload?.usage || null,
  });
}
