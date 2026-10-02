# Elevat Command Center State

Last verified: 2026-10-01

## Production safety
- Secrets remain server-side only.
- Production deployment is approval-gated.
- Financial actions, fund movement, paid resources, permissions, and external outreach require explicit authorization.
- Never claim revenue, customers, deployments, or profitability without verification.

## Primary repository
- Repository: nicolelung20-cmyk/psychiczebra-platform
- Main branch: main
- Product: Elevated AI / Elevat AI platform
- Known-good application baseline: c16a6b8746a95a72bcee63e585ff8de2c01ea304
- Latest merged repair: 5eac249df9b2376ff53c55ac307d308cc5de0dd3
- Repair: restored app/api/autogroup/ops/route.ts to remove runtime coupling to the factory catalog after production build failures.

## Deployment state
- Vercel project ID: prj_bIgx0lky5gHYOAjeCJRpuR6a0tHO
- Vercel MCP currently has no usable team scope (list_teams returned zero teams).
- Git integration may trigger deployments after main changes; verify the resulting deployment before calling production healthy.
- Vercel CLI is the fallback control plane. It supports preview deploys, production deploys, protected-deployment verification via vercel curl, and deployment logs.

## CI
- .github/workflows/elevat-agent-factory.yml runs install, typecheck, lint, tests, and production build.
- Factory workflow does not deploy, spend money, move funds, or perform external outreach.
- Default tests cover server, autogroup revenue, autogroup ops, and autogroup plan suites.

## Command Center architecture
Orchestrator -> Researcher verification -> Coder -> Reviewer -> approval -> deploy.

Revenue loop:
DEMAND -> LEAD -> QUALIFY -> OFFER -> CHECKOUT -> DELIVERY -> MEASURE -> IMPROVE -> REPEAT

## Immediate priorities
1. Verify the post-repair Vercel production deployment.
2. Keep the autogroup runtime route dependency-light.
3. Preserve build/typecheck/lint/test gates.
4. Improve revenue surfaces only through measurable funnel changes.
5. Keep autonomous work bounded, reversible, and approval-gated at production/financial boundaries.

## New-chat rule
Read this file first. Treat it as state, not proof of current deployment health. Re-verify live deployment/CI status before making production claims.