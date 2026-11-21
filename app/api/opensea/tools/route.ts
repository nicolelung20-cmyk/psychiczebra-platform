import { NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function bearer(request: Request) {
  const value = request.headers.get("authorization") ?? "";
  return value.startsWith("Bearer ") ? value.slice(7) : null;
}

async function authorize(request: Request) {
  const token = bearer(request);
  if (!token) return false;

  const userClient = createUserClient(token);
  const { data, error } = await userClient.auth.getUser(token);
  return !error && Boolean(data.user);
}

export async function GET(request: Request) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "A valid ANNE owner session is required." }, { status: 401 });
  }

  const apiKey = process.env.OPENSEA_API_KEY;
  const headers: Record<string, string> = {
    Accept: "application/json, text/event-stream",
    "Content-Type": "application/json",
  };
  if (apiKey) headers["X-API-KEY"] = apiKey;

  try {
    const init = await fetch("https://mcp.opensea.io/mcp", {
      method: "POST",
      headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "anne-owner-command-center", version: "1.1.0" },
        },
      }),
      cache: "no-store",
    });

    const sessionId = init.headers.get("mcp-session-id");

    if (!init.ok) {
      return NextResponse.json(
        {
          connected: false,
          apiKeyConfigured: Boolean(apiKey),
          status: init.status,
          error: "OpenSea MCP initialization failed. Check the API key configuration and retry.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      connected: true,
      apiKeyConfigured: Boolean(apiKey),
      sessionEstablished: Boolean(sessionId),
      server: "OpenSea Data API",
      capabilities: apiKey ? "authenticated" : "limited",
      nextStep: apiKey ? null : "Create a free OpenSea API key and add it as the server-only Vercel environment variable OPENSEA_API_KEY.",
    });
  } catch {
    return NextResponse.json(
      {
        connected: false,
        apiKeyConfigured: Boolean(apiKey),
        error: "OpenSea MCP is temporarily unreachable.",
      },
      { status: 502 },
    );
  }
}
