# Codex + GitHub + Vercel + Supabase architecture

## Control flow

1. **Codex** is the primary implementation agent.
2. **GitHub** is the source of truth; changes land on a feature branch and are reviewed through a pull request.
3. **GitHub Actions** is the merge/deployment gate: install, typecheck, lint, test, build, and verify the Vercel/Supabase contract.
4. **Vercel** is the intended Next.js deployment target. `vercel.json` defines the build contract.
5. **Supabase** is the backend authority for Postgres/Auth/Storage. Production schema changes should be represented as migrations and deployed through the repository CI/CD path.
6. **External model review (Empire)** is an optional review layer only; no Empire connector is currently exposed, so no unverified external model is treated as an active deployment gate.

## Environments

- Pull requests: GitHub verification gate; Vercel Preview and Supabase preview/branching can be connected in the provider dashboards.
- Main: GitHub verification gate followed by the connected Vercel/Supabase production integrations.
- Secrets: never commit `.env.local`, Supabase secret/service-role keys, Stripe secrets, or model API keys.

## Current backend targets

- Supabase project `Elevat`: `mlrrexbqdeogcdbtamxa`
- Supabase project `my project`: `kqidlsjjsocnnqfftynj`

The active Elevat project currently has production migrations including funnel events and paper-trading/token schemas. The repository should be migrated toward checked-in Supabase migrations before automated production schema deployment is enabled.

## Safety gate

No production database migration or deployment is performed by this branch automatically. A pull request must pass the verification job first; production integration settings remain the final deployment authority.
