import { NextResponse } from "next/server";
import { createServiceClient, createUserClient } from "@/lib/supabase/server";
import { routeCommand } from "@/src/command-router";

export const dynamic = "force-dynamic";

function bearer(request: Request) {
  const value = request.headers.get("authorization") ?? "";
  return value.startsWith("Bearer ") ? value.slice(7) : null;
}

async function authorize(request: Request) {
  const token = bearer(request);
  if (!token) return null;
  const userClient = createUserClient(token);
  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function POST(request: Request) {
  const user = await authorize(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { command?: unknown; priority?: unknown };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const command = typeof body.command === "string" ? body.command.trim() : "";
  if (!command) return NextResponse.json({ error: "command is required." }, { status: 400 });
  if (command.length > 4000) return NextResponse.json({ error: "command is too long." }, { status: 400 });

  const routing = routeCommand(command);
  const priority = typeof body.priority === "number" && Number.isFinite(body.priority)
    ? Math.max(1, Math.min(100, Math.round(body.priority))) : 50;
  const supabase = createServiceClient();

  const { data: agent, error: agentError } = await supabase.from("command_agents")
    .select("id,name,provider,endpoint,status,capabilities").eq("name", routing.agent).maybeSingle();
  if (agentError) return NextResponse.json({ error: "Could not route command." }, { status: 503 });

  const status = routing.approvalRequired ? "awaiting_approval" : "queued";
  const { data: job, error: jobError } = await supabase.from("agent_jobs").insert({
    owner_id: user.id, job_type: "command", status, priority,
    input: { command, requestedBy: user.id, routedAgent: routing.agent },
  }).select("id,job_type,status,priority,input,created_at,attempts,max_attempts").single();
  if (jobError) return NextResponse.json({ error: "Could not enqueue command." }, { status: 503 });

  let approval = null;
  if (routing.approvalRequired) {
    const { data, error } = await supabase.from("command_approvals").insert({
      action: command, target: routing.agent, requested_by: "user", status: "pending",
      details: { jobId: job.id, ownerId: user.id },
    }).select("id,action,target,status,created_at").single();
    if (error) return NextResponse.json({ error: "Command queued but approval creation failed.", job }, { status: 503 });
    approval = data;
  }

  await supabase.from("command_audit").insert({
    event_type: "command.queued", actor: "user", action: command, status,
    target: routing.agent, details: { jobId: job.id, ownerId: user.id, approvalId: approval?.id ?? null },
  });
  return NextResponse.json({ ok: true, job, routedAgent: routing.agent, approval }, { status: 202 });
}

export async function GET(request: Request) {
  const user = await authorize(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const [agents, projects, jobs, approvals, audit] = await Promise.all([
    supabase.from("command_agents").select("id,name,provider,endpoint,status,capabilities,updated_at").order("name"),
    supabase.from("command_projects").select("id,name,source,url,status,metadata,updated_at").order("name"),
    supabase.from("agent_jobs").select("id,job_type,status,priority,input,output,error,started_at,finished_at,created_at,attempts,max_attempts").eq("owner_id", user.id).order("created_at", { ascending: false }).limit(25),
    supabase.from("command_approvals").select("id,action,target,requested_by,status,details,created_at,resolved_at").eq("status", "pending").order("created_at", { ascending: false }).limit(25),
    supabase.from("command_audit").select("id,event_type,actor,action,status,target,details,created_at").order("created_at", { ascending: false }).limit(25),
  ]);

  const firstError = [agents, projects, jobs, approvals, audit].find((result) => result.error)?.error;
  if (firstError) {
    console.error("Command snapshot failed:", firstError);
    return NextResponse.json({ error: "Command backend unavailable." }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email ?? null },
    agents: agents.data ?? [],
    projects: projects.data ?? [],
    jobs: jobs.data ?? [],
    approvals: approvals.data ?? [],
    audit: audit.data ?? [],
    generatedAt: new Date().toISOString(),
  });
}

