# ANNE Kimi Linear provider (private inference)

This adapter is an OpenAI-compatible chat-completions client for a Kimi Linear inference server. It is intended to run from an ANNE process on the same machine or private network as the inference server.

## Zero-spend behavior

- No Moonshot API URL or API key is configured by default.
- No provider request is sent until `ANNE_KIMI_BASE_URL` is explicitly configured.
- Plain HTTP is accepted only for loopback or RFC1918/private-network IPv4 endpoints; public endpoints require HTTPS.
- The optional API key is read only from the server process environment and is never included in request logs.
- This adapter does not install weights, start a model server, create cloud infrastructure, or deploy anything.

## Configure a compatible local server

Set these variables in the private ANNE runtime (not in browser/client code and not in committed files):

```sh
ANNE_KIMI_BASE_URL=http://127.0.0.1:8000/v1
ANNE_KIMI_MODEL=moonshotai/Kimi-Linear-48B-A3B-Instruct
```

If the server requires authentication, set `ANNE_KIMI_API_KEY` in the local secret manager or process environment. Do not use a public endpoint without HTTPS.

Then call:

```js
import { createKimiLinearClientFromEnv } from "./src/providers/kimi-linear.js";

const kimi = createKimiLinearClientFromEnv();
const answer = await kimi.complete({
  messages: [{ role: "user", content: "Summarize this task." }],
});
```

## Hardware and runtime caveat

The uploaded `modular_kimi_linear.py` is model architecture code, not model weights or a packaged inference server. The named model is 48B total parameters; the 3B active-expert figure does not mean the full weights disappear from memory. Do not attempt to download or load it on a constrained laptop without first verifying RAM/VRAM, quantization support, and the model's current Transformers compatibility. The existing Intel MacBook Air should not be assumed capable of hosting this model.

## Integration boundary

The adapter is deliberately separate from the deployed Supabase `hermes-gateway` and `agent-worker`. Supabase Edge Functions cannot reach a private loopback/Tailscale-only model endpoint. Do not point a cloud function at a private laptop address or expose the model publicly to make this adapter work.

The next runtime step is a private ANNE-side worker that:
1. authenticates to the existing owner-scoped job ledger;
2. claims only explicitly assigned Kimi jobs with concurrency-safe locking;
3. calls this adapter from the private runtime;
4. persists the result and provider/model metadata to the existing job/audit ledger; and
5. leaves Linear writes and all consequential actions behind the existing approval controls.

That worker is not enabled by this provider adapter alone. The current Supabase worker remains unchanged until its claim protocol, authentication, and job-routing schema are verified end to end.
