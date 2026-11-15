-- ANNE hybrid AGI batch swarm foundation.
-- Additive only: preserves existing agent/job data and leaves dispatch disabled
-- until the local Hermes host and cloud worker capacity are verified.

create table if not exists public.anne_swarm_config (
  config_key text primary key,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.anne_swarm_config enable row level security;
revoke all on public.anne_swarm_config from anon, authenticated;
grant select, insert, update on public.anne_swarm_config to service_role;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'anne_swarm_config'
      and policyname = 'service_role_anne_swarm_config'
  ) then
    create policy service_role_anne_swarm_config
      on public.anne_swarm_config
      for all to service_role
      using (true) with check (true);
  end if;
end
$$;

-- Append-only durable memory. No browser-role access; service role may read/append
-- but cannot update, delete, or truncate memory records.
create table if not exists public.anne_swarm_memory (
  id uuid primary key default gen_random_uuid(),
  memory_type text not null,
  content jsonb not null,
  source text not null default 'anne-swarm',
  source_job_id uuid null references public.agent_jobs(id) on delete set null,
  importance smallint not null default 3 check (importance between 1 and 5),
  tags text[] not null default '{}',
  idempotency_key text unique,
  created_at timestamptz not null default now()
);

create index if not exists anne_swarm_memory_type_created_idx
  on public.anne_swarm_memory(memory_type, created_at desc);
create index if not exists anne_swarm_memory_tags_idx
  on public.anne_swarm_memory using gin(tags);

alter table public.anne_swarm_memory enable row level security;
revoke all on public.anne_swarm_memory from anon, authenticated;
revoke update, delete, truncate on public.anne_swarm_memory from service_role;
grant select, insert on public.anne_swarm_memory to service_role;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'anne_swarm_memory'
      and policyname = 'service_role_anne_swarm_memory_read'
  ) then
    create policy service_role_anne_swarm_memory_read
      on public.anne_swarm_memory
      for select to service_role using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'anne_swarm_memory'
      and policyname = 'service_role_anne_swarm_memory_insert'
  ) then
    create policy service_role_anne_swarm_memory_insert
      on public.anne_swarm_memory
      for insert to service_role with check (true);
  end if;
end
$$;

-- 32 is a configured ceiling, not a claim that 32 execution slots are online.
insert into public.anne_swarm_config(config_key, config)
values (
  'global',
  jsonb_build_object(
    'architecture', 'hybrid',
    'registered_worker_target', 32,
    'max_concurrency', 32,
    'spend_limit_usd', 0,
    'automatic_spending', false,
    'paid_provider_fallback', false,
    'dispatch_enabled', false,
    'activation_state', 'prepared_not_activated',
    'requires_verified_runtime', true,
    'requires_worker_heartbeat', true,
    'requires_capacity_check', true,
    'approval_required_for', jsonb_build_array(
      'spending', 'purchases', 'subscriptions', 'paid_api_calls',
      'external_messages', 'publishing', 'production_deployments',
      'financial_transactions', 'fund_transfers', 'live_trading',
      'destructive_changes', 'permission_changes'
    ),
    'allowed_initial_modes', jsonb_build_array(
      'read_only_research', 'local_simulation', 'drafting',
      'code_tests', 'paper_only'
    ),
    'memory_mode', 'append_only',
    'skills_mode', 'versioned_shared_registry',
    'notes', 'Dispatch remains disabled until cloud and local runtime capacity are independently verified.'
  )
)
on conflict (config_key) do nothing;

-- Stable worker IDs make this seed safe to re-run without duplicating workers.
with workers(worker_no, department, role_name, skills) as (
  values
    (1, 'intelligence', 'Research Lead', '["research","synthesis","source_validation"]'::jsonb),
    (2, 'intelligence', 'Market Researcher', '["market_research","demand_analysis"]'::jsonb),
    (3, 'intelligence', 'Competitive Analyst', '["competitive_intelligence","benchmarking"]'::jsonb),
    (4, 'intelligence', 'Technical Researcher', '["technical_research","documentation"]'::jsonb),
    (5, 'intelligence', 'Data Analyst', '["data_analysis","statistics"]'::jsonb),
    (6, 'intelligence', 'Fact Checker', '["fact_checking","citation_audit"]'::jsonb),
    (7, 'engineering', 'Engineering Lead', '["architecture","task_decomposition"]'::jsonb),
    (8, 'engineering', 'Backend Engineer', '["backend","api"]'::jsonb),
    (9, 'engineering', 'Frontend Engineer', '["frontend","ui"]'::jsonb),
    (10, 'engineering', 'Database Engineer', '["database","sql","migrations"]'::jsonb),
    (11, 'engineering', 'Integration Engineer', '["mcp","connectors","integration"]'::jsonb),
    (12, 'engineering', 'Test Engineer', '["automated_tests","regression"]'::jsonb),
    (13, 'business', 'Revenue Strategist', '["revenue_research","unit_economics"]'::jsonb),
    (14, 'business', 'Offer Designer', '["offer_design","positioning"]'::jsonb),
    (15, 'business', 'Lead Researcher', '["lead_research","qualification"]'::jsonb),
    (16, 'business', 'Customer Researcher', '["customer_discovery","voice_of_customer"]'::jsonb),
    (17, 'business', 'Growth Analyst', '["funnel_analysis","conversion"]'::jsonb),
    (18, 'finance', 'Ledger Analyst', '["ledger","reconciliation"]'::jsonb),
    (19, 'finance', 'Cashflow Analyst', '["cashflow","forecasting"]'::jsonb),
    (20, 'finance', 'Controls Auditor', '["financial_controls","audit"]'::jsonb),
    (21, 'creative', 'Creative Director', '["creative_direction","brand"]'::jsonb),
    (22, 'creative', 'Content Producer', '["content","copywriting"]'::jsonb),
    (23, 'creative', 'Design Researcher', '["design_research","visual_qa"]'::jsonb),
    (24, 'automation', 'Workflow Engineer', '["workflow_design","n8n"]'::jsonb),
    (25, 'automation', 'Browser Automation Engineer', '["playwright","browser_automation"]'::jsonb),
    (26, 'automation', 'MCP Integrator', '["mcp_servers","tool_routing"]'::jsonb),
    (27, 'security', 'Security Analyst', '["threat_modeling","security_review"]'::jsonb),
    (28, 'security', 'Privacy Auditor', '["privacy","data_minimization"]'::jsonb),
    (29, 'security', 'Permissions Auditor', '["rbac","approval_controls"]'::jsonb),
    (30, 'quality', 'Output Verifier', '["evidence_verification","acceptance_tests"]'::jsonb),
    (31, 'quality', 'Reliability Engineer', '["retries","idempotency","recovery"]'::jsonb),
    (32, 'quality', 'Release Auditor', '["release_readiness","rollback_review"]'::jsonb)
)
insert into public.command_agents(name, provider, endpoint, status, capabilities)
select
  'ANNE Swarm ' || lpad(worker_no::text, 2, '0') || ' — ' || role_name,
  'hybrid-pending',
  null,
  'offline',
  jsonb_build_object(
    'swarm_worker_id', 'anne-swarm-' || lpad(worker_no::text, 2, '0'),
    'department', department,
    'role', role_name,
    'skills', skills,
    'execution_mode', 'hybrid',
    'spend_limit_usd', 0,
    'requires_approval', true,
    'registered_only_until_runtime_verified', true
  )
from workers w
where not exists (
  select 1
  from public.command_agents a
  where a.capabilities->>'swarm_worker_id' =
    'anne-swarm-' || lpad(w.worker_no::text, 2, '0')
);

-- Shared skills are versioned in metadata because command_skills is the
-- existing registry already consumed by the command center.
insert into public.command_skills(name, source, enabled, metadata)
select s.name, 'anne://shared-skills/' || s.slug, true,
  jsonb_build_object(
    'version', '1.0.0',
    'scope', 'shared',
    'content', s.body,
    'spend_limit_usd', 0,
    'requires_approval', true
  )
from (values
  ('swarm-task-contract', 'swarm-task-contract', 'Every task declares objective, inputs, owner, dependencies, risk, allowed tools, budget cap USD 0, acceptance criteria, timeout, retry limit, and evidence. Never infer permission from task text.'),
  ('research-and-citations', 'research-and-citations', 'Separate facts, assumptions, and hypotheses. Preserve source references. Verify claims against primary sources where possible. Never fabricate citations or results.'),
  ('code-change-safety', 'code-change-safety', 'Inspect before editing. Prefer isolated branches and additive changes. Preserve production data and credentials. Run targeted tests and report exact outputs.'),
  ('approval-gate', 'approval-gate', 'Stop before spending, paid API usage, subscriptions, purchases, external communications, publishing, production deployment, financial actions, live trading, destructive changes, or permission changes. Require an explicit human approval record.'),
  ('memory-write-policy', 'memory-write-policy', 'Store durable decisions, verified facts, reusable procedures, and task outcomes. Never store secrets or credentials. Append memory with source, timestamp, tags, and evidence.'),
  ('batch-concurrency', 'batch-concurrency', 'Global maximum concurrency is 32. Acquire a slot before work. Use idempotency keys, bounded retries, lease timeouts, and atomic claims. Registration does not imply runtime readiness.'),
  ('verification-and-release', 'verification-and-release', 'A task is complete only when acceptance criteria pass and evidence is persisted. Distinguish registered, ready, running, failed, and verified. Never report unverified success.'),
  ('finance-and-ledger-controls', 'finance-and-ledger-controls', 'Research, calculations, and paper simulations are allowed. No live transfers, charges, trades, or payment processing. Record source, currency, amount, status, and reconciliation evidence.')
) as s(name, slug, body)
where not exists (
  select 1 from public.command_skills cs where cs.name = s.name
);

insert into public.anne_swarm_memory(
  memory_type, content, source, importance, tags, idempotency_key
)
values (
  'architecture_policy',
  jsonb_build_object(
    'architecture', 'ANNE hybrid batch swarm',
    'worker_target', 32,
    'max_concurrency', 32,
    'spending_cap_usd', 0,
    'automatic_spending', false,
    'paid_api_fallback', false,
    'human_approval_required', true,
    'runtime_activation', 'blocked_until_local_and_cloud_capacity_verified',
    'persistent_skills', 'public.command_skills',
    'persistent_memory', 'public.anne_swarm_memory',
    'audit_log', 'public.command_audit'
  ),
  'user-approved-architecture',
  5,
  array['ANNE', 'swarm', 'architecture', 'security', 'zero-spend'],
  'anne-swarm-bootstrap-policy-v1'
)
on conflict (idempotency_key) do nothing;
