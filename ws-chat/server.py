"""Private WebSocket bridge to the existing Supabase Hermes gateway."""
from __future__ import annotations
import asyncio, json, os, time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from websockets.asyncio.server import serve
from websockets.datastructures import Headers
from websockets.http11 import Response
from websockets.exceptions import ConnectionClosed

ROOT = Path(__file__).resolve().parent
MAX_TEXT = 2000
GATEWAY = os.environ.get("HERMES_GATEWAY_URL", "https://mlrrexbqdeogcdbtamxa.supabase.co/functions/v1/hermes-gateway")

def encode(kind: str, **fields) -> str:
    return json.dumps({"type": kind, "ts": time.time(), **fields})

def response(status: int, body: bytes, content_type: str) -> Response:
    return Response(status, "OK" if status == 200 else "Not Found",
        Headers([("Content-Type", content_type), ("Content-Length", str(len(body))), ("Cache-Control", "no-store")]), body)

def process_request(connection, request):
    if request.path in ("/", "/index.html"):
        body = (ROOT / "static" / "index.html").read_bytes()
        return response(200, body, "text/html; charset=utf-8")
    if request.path == "/healthz":
        return response(200, b"ok\n", "text/plain; charset=utf-8")
    if request.path != "/ws":
        return response(404, b"not found\n", "text/plain; charset=utf-8")
    return None

def call_gateway(token: str, payload: dict) -> dict:
    raw = json.dumps(payload).encode()
    req = Request(GATEWAY, data=raw, method="POST", headers={
        "Authorization": f"Bearer {token}", "Content-Type": "application/json",
    })
    try:
        with urlopen(req, timeout=45) as res:
            return json.loads(res.read().decode())
    except HTTPError as exc:
        detail = exc.read().decode(errors="replace")[:500]
        raise RuntimeError(f"Hermes returned HTTP {exc.code}: {detail}") from exc
    except (URLError, TimeoutError) as exc:
        raise RuntimeError("Hermes gateway is unreachable") from exc

async def handler(ws) -> None:
    token = None
    await ws.send(encode("welcome", message="Connect your signed-in ANNE/Hermes session to begin."))
    try:
        async for raw in ws:
            try:
                data = json.loads(raw)
            except (TypeError, ValueError):
                await ws.send(encode("error", message="Invalid JSON."))
                continue
            if not isinstance(data, dict):
                await ws.send(encode("error", message="Invalid message."))
                continue
            if data.get("type") == "auth":
                candidate = data.get("access_token")
                if not isinstance(candidate, str) or len(candidate) < 20 or len(candidate) > 8192:
                    await ws.send(encode("error", message="A valid Supabase session access token is required."))
                    continue
                try:
                    status = await asyncio.to_thread(call_gateway, candidate, {"command": "status"})
                    if not status.get("ok") or status.get("policy") != "free_only":
                        raise RuntimeError("Hermes gateway did not confirm free-only status.")
                    token = candidate
                    await ws.send(encode("authenticated", message="Connected to Hermes.", policy="free_only", providers=status.get("providers", [])))
                except Exception as exc:
                    token = None
                    await ws.send(encode("error", message=str(exc)[:500]))
                continue
            if data.get("type") != "chat":
                await ws.send(encode("error", message="Supported messages: auth, chat."))
                continue
            if not token:
                await ws.send(encode("error", message="Authenticate first with your Supabase session token."))
                continue
            text = data.get("text")
            if not isinstance(text, str) or not text.strip():
                await ws.send(encode("error", message="Message text is required."))
                continue
            text = text.strip()[:MAX_TEXT]
            try:
                result = await asyncio.to_thread(call_gateway, token, {
                    "command": "chat", "messages": [{"role": "user", "content": text}]
                })
                if not result.get("ok") or not result.get("message"):
                    raise RuntimeError(result.get("error") or result.get("detail") or "Hermes returned no response.")
                await ws.send(encode("chat", text=result["message"], provider=result.get("provider"), model=result.get("model"), policy=result.get("ai_policy", "free_only")))
            except Exception as exc:
                await ws.send(encode("error", message=str(exc)[:500]))
    except ConnectionClosed:
        pass

async def main():
    host = "0.0.0.0"
    port = int(os.environ.get("PORT", "8000"))
    async with serve(handler, host, port, process_request=process_request, max_size=8192, ping_interval=20, ping_timeout=20):
        print(f"Hermes WebSocket bridge listening on {host}:{port}")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
