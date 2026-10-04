import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.OPENSEA_API_KEY;
  const headers: Record<string, string> = {};
  if (apiKey) headers["X-API-KEY"] = apiKey;

  const transport = new StreamableHTTPClientTransport(
    new URL("https://mcp.opensea.io/mcp"),
    { requestInit: { headers } },
  );
  const client = new Client({ name: "elevated-ai-command-center", version: "1.0.0" });

  try {
    await client.connect(transport);
    const result = await client.listTools();
    return NextResponse.json({
      connected: true,
      endpoint: "https://mcp.opensea.io/mcp",
      authenticated: Boolean(apiKey),
      toolCount: result.tools.length,
      tools: result.tools.map((tool) => tool.name),
    });
  } catch (error) {
    return NextResponse.json(
      {
        connected: false,
        endpoint: "https://mcp.opensea.io/mcp",
        authenticated: Boolean(apiKey),
        error: error instanceof Error ? error.message : "OpenSea MCP connection failed",
      },
      { status: 502 },
    );
  } finally {
    await client.close().catch(() => undefined);
  }
}
