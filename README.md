# SupportFlow AI

SupportFlow AI is an approval-first SaaS starter for small support teams. It accepts support tickets, produces an AI reply draft, and records an audit trail. It never sends customer messages: a human must review and send every draft in the customer's helpdesk.

This is a deployable MVP, not a revenue guarantee. Its measurable outcome is reducing time spent drafting routine support replies while retaining human approval.

## Quick start

```bash
cp .env.example .env
# Set SUPPORTFLOW_API_KEYS to a long random value.
npm start
```

Open `http://localhost:3000` for the operator dashboard. Run the checks with:

```bash
npm test
```

## API

Every `/v1` endpoint except `/v1/health` requires an `X-API-Key` header.

```bash
curl -X POST http://localhost:3000/v1/tickets \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Ada","message":"Where is my order?","tone":"friendly"}'
```

The response contains a job ID. Retrieve the approved-for-review draft with `GET /v1/jobs/:id`; retrieve usage with `GET /v1/usage`; and retrieve the traceable event log with `GET /v1/audit`.

## Configuration and deployment

| Variable | Required | Description |
| --- | --- | --- |
| `SUPPORTFLOW_API_KEYS` | Yes | Comma-separated API keys. Do not use the example value in production. |
| `OPENROUTER_API_KEY` | No | Enables OpenRouter draft generation. Without it, the service uses a clearly marked safe fallback draft. |
| `OPENROUTER_MODEL` | No | Model ID; defaults to `openai/gpt-4o-mini`. |
| `PORT` | No | HTTP port; defaults to `3000`. |

Deploy with the included `Dockerfile`; configure values as platform-managed secrets. The in-memory job store is intentionally suitable only for a pilot or single instance. Before production, replace it with the supplied Supabase schema, place rate limiting in shared storage, and configure platform monitoring/alerts.

See [docs/OPERATIONS.md](docs/OPERATIONS.md) for the pilot checklist, monitoring, and required approval workflow.
