# ANNE / Elevat verified system map

This is an integration of the existing deployment and Supabase control plane. It is not a new Vercel or Supabase project.

## Existing system of record

- **Application:** Vercel project `elevated-ai` in the `Elevat` team.
- **Application source:** `nicolelung20-cmyk/psychiczebra-platform`, production branch `main`.
- **Database and control plane:** Supabase project `Elevat` (`mlrrexbqdeogcdbtamxa`).
- **Shared execution records:** `agent_jobs`, `command_audit`, `command_approvals`, `command_agent_heartbeats`.
- **Shared registries:** `command_projects`, `command_agents`, `command_skills`, `command_connections`.

## Request and verification path

1. The existing `/hermes` interface authenticates the user with Supabase Auth.
2. A command is submitted to the existing `hermes-gateway` Edge Function.
3. The gateway creates an `agent_jobs` row. It does not claim the work is complete at enqueue time.
4. The existing `agent-worker` is intended to claim queued jobs, call the same Hermes gateway, and persist the result.
5. The interface reads the user's job from `/api/command` and reports success or failure only after the persisted job reaches a terminal state.
6. The existing `hermes-verify` Edge Function provides a separate signed-in, non-financial verification console. It writes to `agent_jobs`, calls `hermes-gateway`, reads the result back, and reports whether persistence was verified. A separate `hermes_verifications` table is not part of this implementation.

## Verification UI

The command dashboard links to the already-deployed verification console:

`/functions/v1/hermes-verify`

The console requires a valid Supabase user session before it runs. Its supported test is a single non-financial health check; it does not authorize trading, transfers, or spending.

## Skills archive handling

The uploaded `skills-codex-sync-astra-openai-docs.zip` identifies itself as deprecated. It must not be bulk-installed or treated as the current source of truth. Codex Agent Skills are not automatically Hermes runtime plugins. Review individual skills, refresh them from current official sources, and register only compatible, approved entries in `command_skills`. The dashboard reads that registry rather than assuming that a skill is installed because its archive exists.

## Runtime separation

The `hermes-webui` Vercel project is not the primary execution host. Its recent runtime errors include repeated 300-second `/python` timeouts and a failed restart because the `hermes` executable was not present in the serverless runtime. Keep the full Hermes agent on its private host (the Mac/Tailscale path) and use Vercel for the existing application/control-panel surface.

## Known production blocker — worker scheduling

The Supabase cron jobs for command heartbeat and worker dispatch are marked active, but the latest `cron.job_run_details` record inspected was **2026-10-21 00:14 UTC**. The database clock was **2026-11-08**, and the latest stored command-agent heartbeat was also **2026-10-21**. This means the background dispatcher cannot currently be treated as live, even though the cron definitions remain present.

Do not claim that queued work is executing until a fresh worker heartbeat and a persisted test-job round trip are observed. The scheduler needs a separate Supabase runtime investigation; blindly recreating jobs or changing database settings is not a safe substitute for identifying why the scheduler stopped.

## Security and spending boundaries

- Keep Supabase service-role credentials server-side.
- Keep the existing user authentication and owner-scoped job reads.
- Do not add broad anonymous policies to make the dashboard appear functional.
- Do not use paid model routes, create subscriptions, or incur API credits.
- Keep live trades, purchases, transfers, payouts, and other external financial actions blocked or approval-gated.
- Treat a deployment marked READY as deployment evidence only; it does not prove that background workers or local devices are connected.
