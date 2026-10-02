# Elevat Agent Factory

This repository is the first product/control-plane node for the Elevat GitHub estate.

## What it does

- Verifies the production application with install, typecheck, lint, test, and build gates.
- Runs on push, nightly schedule, or manual dispatch.
- Produces a machine-readable verification artifact for the Command Center.
- Keeps deployment, spending, financial actions, and external outreach outside this workflow.

## GitHub estate to reuse

| Asset | Role |
|---|---|
| psychiczebra-platform | Core Elevat product/control-plane |
| skills | Reusable agent/skill library |
| mini-swe-agent | Coding-agent substrate |
| supergrok | Quant/trading research substrate; financial execution remains separately authorized |
| high-yield-extensions | Product experiments; privacy/compliance review required before monetization |
| eve-chat-template / 1eve-chat-template | Chat/product UI substrate |
| my-project | Tool-calling and agent experiments |
| awesome-grok | Existing Elevat ops/dashboard experiments |
| money | Financial automation research; no autonomous money movement |

## Operating boundary

The factory can verify, package, and surface actionable engineering work. It does not claim revenue, send outreach, spend money, move funds, or deploy production without explicit downstream authorization.

GitHub documents reusable workflows as a way to centralize deterministic, repeatable logic. This workflow uses explicit read-only permissions. External actions should be pinned to full commit SHAs when repository policy requires immutable references.
