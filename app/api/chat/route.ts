import { NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabase/server";

type Message = { role: "user" | "assistant"; content: string };

function getAccessToken(request: Request) {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : "";
}

function validMessages(value: unknown): value is Message[] {
  return Array.isArray(value) && value.length > 0 && value.length <= 12 &&
    value.every((message) =>
      typeof message === "object" && message !== null &&
      (message.role === "user" || message.role === "assistant") &&
      typeof message.content === "string" && message.content.length > 0 && message.content.length <= 12_000,
    );
}

export async function POST(request: Request) {
  const accessToken = getAccessToken(request);
  if (!accessToken) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });

  let body: { messages?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!validMessages(body.messages)) {
    return NextResponse.json({ error: "Send between 1 and 12 valid messages." }, { status: 400 });
  }

  try {
    const supabase = createUserClient(accessToken);
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) return NextResponse.json({ error: "Your session has expired. Sign in again." }, { status: 401 });

    const { data: allowed, error: usageError } = await supabase.rpc("consume_message");
    if (usageError) throw usageError;
    if (!allowed) return NextResponse.json({ error: "You have reached your monthly message limit. Upgrade to Pro to continue." }, { status: 402 });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured.");
    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "PsychicZebra",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: "You are PsychicZebra: direct, thoughtful, practical, and concise. Help the user make concrete progress." },
          ...body.messages,
        ],
        max_tokens: 1000,
      }),
    });
    if (!aiResponse.ok) {
      const detail = await aiResponse.text();
      console.error("OpenRouter request failed:", aiResponse.status, detail);
      return NextResponse.json({ error: "The AI provider is temporarily unavailable. Please try again." }, { status: 502 });
    }
    const payload = await aiResponse.json() as { choices?: Array<{ message?: { content?: string } }> };
    const message = payload.choices?.[0]?.message?.content?.trim();
    if (!message) return NextResponse.json({ error: "The AI provider returned no response. Please try again." }, { status: 502 });
    return NextResponse.json({ message });
  } catch (error) {
    console.error("Chat request failed:", error);
    return NextResponse.json({ error: "The service is not configured correctly yet." }, { status: 500 });
  }
}
