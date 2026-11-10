# ANNE AGI Batch Swarm — Hybrid Foundation

## Intent

Prepare the existing ANNE / Elevat system for 32 registered specialist workers and a hard target ceiling of 32 concurrent executions. Reuse the existing Supabase project, `command_agents`, `command_skills`, `agent_jobs`, `command_approvals`, and `command_audit` records. Do not create a second control plane.

## Operating boundaries

- Spend limit: **USD 0**. Automatic spending and paid-provider fallback are disabled.
- Human approval is required for paid API usage, purchases, subscriptions, external communications, publishing, production deployments, financial transactions, transfers, live trading, destructive changes, and permission changes.
- Initial permitted work: read-only research, drafting, local simulations, code tests, and paper-only analysis.
- No credentials, tokens, or secrets are stored in skills or memory.
- Shared memory is append-only from the application service role. Browser roles have no access.
- Skills are shared, versioned registry entries in the existing `command_skills` table.
- Worker records are registered as **offline** until a real runtime heartbeat is received.

## Worker allocation

| Department | Workers |
|---|---:|
| Intelligence and research | 6 |
| Software engineering | 6 |
| Business and revenue | 5 |
| Finance and reconciliation | 3 |
| Creative and content | 3 |
| Automation and integrations | 3 |
| Security and compliance | 3 |
| Quality and verification | 3 |
| **Total** | **32** |

Each record receives a stable `swarm_worker_id`, department, role, skill list, zero-spend limit, and approval requirement.

## Hybrid execution topology

- **Cloud control plane:** Supabase stores configuration, jobs, approvals, skills, append-only memory, and audit events.
- **Local execution:** the existing private Hermes host / Mac runs local models and tools where reachable.
- **Cloud execution:** only already-configured, free-tier routes may be used; no paid fallback is allowed.
- **Browser automation:** Playwright is restricted to approved, non-financial tasks and test environments.
- **Orchestration:** the existing Hermes gateway and worker are retained; no replacement project is introduced.

## Activation gate

The migration deliberately writes `dispatch_enabled=false` and `activation_state=prepared_not_activated`. The 32-concurrency value is a ceiling, not proof of 32 available execution slots.

Before dispatch is enabled, all of the following must pass:

1. A fresh local Hermes heartbeat is recorded.
2. The cloud worker returns a fresh heartbeat using its existing authenticated worker-token path.
3. A no-cost health-check job completes through the real queue and its output is read back from `agent_jobs`.
4. An atomic-claim / idempotency test proves that parallel workers do not process the same job.
5. The scheduler has a fresh successful run; old cron definitions alone are not evidence.
6. A bounded 32-worker load test passes within actual free local/cloud compute limits.
7. The security advisor shows no new public access or RLS regression.

If capacity cannot be verified, keep the workers registered but offline and dispatch disabled. Do not silently reduce the configured ceiling or switch to paid models.

## Existing blockers observed before this change

- The live Supabase project reported 10 existing command agents and 0 shared skill rows.
- Historical job failures included missing supported model credentials and missing `OPENROUTER_API_KEY`. No credentials were created or modified.
- The live project reported 83 failed and 4 successful historical jobs in the inspected aggregate. Historical failures are not automatically retried or deleted.
- The local Desktop Commander / Mac connection was offline during the initial inspection.
- Existing security-advisor findings and the stale worker/cron heartbeat history must be reviewed before enabling dispatch.

## Database objects added by the migration

- `anne_swarm_config`: one global configuration record; service-role only.
- `anne_swarm_memory`: append-only durable memory; service-role select/insert only, with update/delete/truncate revoked.
- 32 stable worker identities in the existing `command_agents` registry.
- Eight reusable skills in the existing `command_skills` registry.

The migration is additive and idempotent. It does not alter existing job rows, production user records, auth configuration, secrets, payment settings, or existing edge-function code.

## Verification checklist after migration is applied

Run the following read-only SQL and retain its output with the deployment record:

```sql
select
  (select count(*) from public.command_agents
   where capabilities ? 'swarm_worker_id') as registered_workers,
  (select count(*) from public.command_agents
   where capabilities ? 'swarm_worker_id' and status = 'offline') as offline_workers,
  (select count(*) from public.command_skills
   where source like 'anne://shared-skills/%') as shared_skills,
  (select config->>'max_concurrency'
   from public.anne_swarm_config where config_key = 'global') as max_concurrency,
  (select config->>'dispatch_enabled'
   from public.anne_swarm_config where config_key = 'global') as dispatch_enabled,
  (select count(*) from public.anne_swarm_memory) as memory_records;
```

Expected after applying the migration: 32 registered workers, 32 offline workers, 8 shared skills, max concurrency 32, dispatch disabled, and at least one bootstrap memory record.

Then independently test:
- Anonymous and authenticated browser roles cannot read or write swarm config or memory.
- Service role can read and append memory but cannot update, delete, or truncate it.
- Existing owner-scoped job access and existing approval/audit behavior remain unchanged.
- A 32-way contention test yields one successful claim per job ID.
- The 32-way execution test is run only after actual local/cloud capacity is measured.

## Current delivery status

This branch contains the additive migration and this implementation record. The direct Supabase migration attempt was rejected by the connected database tool with `cannot execute CREATE TABLE in a read-only transaction`. Therefore the migration has **not** been applied to the live project, no worker records have been created there, and no runtime has been activated. Keep production unchanged until the migration can be applied through an authorized writable migration path and the verification checklist passes.
