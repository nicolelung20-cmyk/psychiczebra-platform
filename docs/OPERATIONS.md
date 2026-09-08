# Operations and pilot checklist

## Offer and pilot

SupportFlow AI serves small support teams that need response drafts for inbound tickets. It measures drafts generated, drafts ready for human review, and failures. Run a paid pilot with a small, consented group before scaling; do not promise revenue outcomes.

## Safety and approval

- The service creates drafts only. It has no endpoint or integration that sends messages.
- Review every draft in the customer's existing helpdesk before delivery.
- Do not submit credentials, payment data, or sensitive customer information in tickets.
- API keys are secrets: store them in the platform's secret manager, rotate them after exposure, and use separate keys per customer.

## Deployment and monitoring

Build from the supplied `Dockerfile`; set `SUPPORTFLOW_API_KEYS` and optionally `OPENROUTER_API_KEY` as deployment secrets. Probe `/v1/health`. Alert on unavailable health checks, failed draft jobs, and sustained rate-limit responses. Inspect `/v1/audit` for pilot diagnostics.

The pilot's in-memory jobs, audits, and rate limits disappear on redeploy and do not work across replicas. For production, migrate them to managed storage such as Supabase/Postgres and use shared rate limiting before enabling multiple instances.

## Supabase schema

Apply this schema only in a controlled Supabase project after choosing retention and access policies:

```sql
create table jobs (
  id uuid primary key,
  account_id uuid not null,
  status text not null check (status in ('queued','processing','ready_for_review','failed')),
  ticket jsonb not null,
  draft text,
  provider text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create table audit_events (
  id uuid primary key,
  account_id uuid not null,
  job_id uuid references jobs(id),
  event text not null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);
```
