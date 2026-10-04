import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
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
          clientInfo: { name: "elevated-ai-command-center", version: "1.0.0" },
        },
      }),
      cache: "no-store",
    });

    const sessionId = init.headers.get("mcp-session-id");
    const body = await init.text();

    if (!init.ok) {
      return NextResponse.json(
        { connected: false, authenticated: Boolean(apiKey), status: init.status, error: body },
        { status: 502 },
      );
    }

    return NextResponse.json({
      connected: true,
      authenticated: Boolean(apiKey),
      endpoint: "https://mcp.opensea.io/mcp",
      sessionEstablished: Boolean(sessionId),
      initializeResponse: body.slice(0, 4000),
    });
  } catch (error) {
    return NextResponse.json(
      { connected: false, authenticated: Boolean(apiKey), error: error instanceof Error ? error.message : "OpenSea MCP connection failed" },
      { status: 502 },
    );
  }
}
