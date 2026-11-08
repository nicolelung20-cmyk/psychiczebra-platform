"use client";

import { FormEvent, useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import styles from "./command.module.css";

type Agent = {
  id: string;
  name: string;
  provider: string | null;
  status: string;
  capabilities: unknown;
  heartbeatFresh?: boolean;
  heartbeatStatus?: string | null;
  lastHeartbeatAt?: string | null;
};
type Project = { id: string; name: string; source: string | null; url: string | null; status: string };
type Job = { id: string; status: string; priority: number; input: { command?: string; routedAgent?: string }; created_at: string };
type Approval = { id: string; action: string; target: string | null; created_at: string };
type Skill = { id: string; name: string; source: string | null; enabled: boolean; metadata: unknown };
type Connection = { id: string; name: string; kind: string; status: string };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!;
const VERIFICATION_URL = `${SUPABASE_URL}/functions/v1/hermes-verify`;

export default function CommandPage() {
  const [command, setCommand] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [status, setStatus] = useState("Connecting");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [audit, setAudit] = useState<any[]>([]);

  async function load() {
    const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setStatus("Sign in required");
      return;
    }
    const response = await fetch("/api/command", {
      headers: { Authorization: `Bearer ${data.session.access_token}` },
      cache: "no-store",
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(response.status === 401 ? "Sign in required" : "Backend unavailable");
      return;
    }
    setAgents(payload.agents ?? []);
    setProjects(payload.projects ?? []);
    setJobs(payload.jobs ?? []);
    setApprovals(payload.approvals ?? []);
    setSkills(payload.skills ?? []);
    setConnections(payload.connections ?? []);
    setAudit(payload.audit ?? []);
    setStatus("Live");
    setError("");
  }

  useEffect(() => {
    // This effect starts an async polling loop; state updates occur after network responses.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const text = command.trim();
    if (!text || busy) return;
    setBusy(true);
    setError("");
    try {
      const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Sign in to issue commands.");
      const response = await fetch("/api/command", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ command: text }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Command failed.");
      setCommand("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Command failed.");
    } finally {
      setBusy(false);
    }
  }

  const liveAgents = agents.filter((agent) => agent.heartbeatFresh === true && agent.heartbeatStatus === "active").length;

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>ELEVAT</div>
          <h1>AI COMMAND CENTER</h1>
          <p>One place to direct the system.</p>
        </div>
        <span className={`${styles.live} ${status === "Live" ? styles.liveOn : ""}`}>● {status}</span>
      </header>

      <section className={styles.commandCard}>
        <div className={styles.commandLabel}>What should happen?</div>
        <form onSubmit={submit} className={styles.form}>
          <textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Build the next feature, research an opportunity, check revenue, or inspect the system…"
            aria-label="Command"
            rows={3}
          />
          <button disabled={busy || !command.trim()}>{busy ? "Routing…" : "Run command"}</button>
        </form>
        {error && <p className={styles.error}>{error}</p>}
        <p className={styles.note}>Commands route through the shared supervisor. Live trading and other high-impact actions remain approval-gated.</p>
      </section>

      <section className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardTitle}><span>Agents</span><b>{liveAgents} live · {agents.length - liveAgents} stale</b></div>
          <div className={styles.list}>
            {agents.map(agent => (
              <div className={styles.row} key={agent.id}>
                <span><i className={agent.heartbeatFresh && agent.heartbeatStatus === "active" ? styles.dot : styles.dotMuted} />{agent.name}</span>
                <small>{agent.heartbeatFresh ? (agent.heartbeatStatus ?? "unknown") : "stale"} · {agent.provider ?? "native"}</small>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}><span>Needs you</span><b>{approvals.length}</b></div>
          {approvals.length === 0 ? <p className={styles.empty}>Nothing waiting for approval.</p> : (
            <div className={styles.list}>
              {approvals.map(item => (
                <div className={styles.approval} key={item.id}>
                  <strong>{item.target ?? "System action"}</strong>
                  <span>{item.action}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardTitle}><span>Active work</span><b>{jobs.length}</b></div>
        {jobs.length === 0 ? <p className={styles.empty}>No commands have been queued yet.</p> : (
          <div className={styles.list}>
            {jobs.slice(0, 8).map(job => (
              <div className={styles.row} key={job.id}>
                <span>{job.input?.command ?? "Command"}</span>
                <small>{job.status} · {job.input?.routedAgent ?? "routing"}</small>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.card}>
        <div className={styles.cardTitle}><span>Recent activity</span><b>{audit.length} events</b></div>
        {audit.length === 0 ? <p className={styles.empty}>No owner-scoped audit events have been recorded yet.</p> : (
          <div className={styles.list}>
            {audit.slice(0, 12).map(item => (
              <div className={styles.row} key={item.id}>
                <span>{item.event_type} · {item.action ?? item.target ?? "System event"}</span>
                <small>{item.status ?? item.actor} · {new Date(item.created_at).toLocaleTimeString()}</small>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.card}>
        <div className={styles.cardTitle}><span>Projects</span><b>{projects.length}</b></div>
        <div className={styles.projectGrid}>
          {projects.map(project => (
            <div className={styles.project} key={project.id}>
              <strong>{project.name}</strong>
              <span>{project.status} · {project.source ?? "Elevat"}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardTitle}><span>Shared skills</span><b>{skills.filter(skill => skill.enabled).length} enabled</b></div>
          {skills.length === 0 ? (
            <p className={styles.empty}>No skills are registered yet. The uploaded Codex archive is deprecated; only reviewed, compatible skills should be enabled.</p>
          ) : (
            <div className={styles.list}>
              {skills.map(skill => (
                <div className={styles.row} key={skill.id}>
                  <span>{skill.name}</span>
                  <small>{skill.enabled ? "enabled" : "disabled"} · {skill.source ?? "local"}</small>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}><span>Connections</span><b>{connections.length} registered</b></div>
          {connections.length === 0 ? (
            <p className={styles.empty}>No external connections are registered in the shared control plane yet.</p>
          ) : (
            <div className={styles.list}>
              {connections.map(connection => (
                <div className={styles.row} key={connection.id}>
                  <span>{connection.name}</span>
                  <small>{connection.status} · {connection.kind}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardTitle}><span>Hermes verification</span><b>Existing Supabase function</b></div>
        <p className={styles.empty}>Open the signed-in verification console to run one non-financial health check and confirm the result is persisted in the shared job ledger.</p>
        <a href={VERIFICATION_URL} target="_blank" rel="noreferrer" style={{ color: "#d7e0d8", fontSize: 13, textDecoration: "underline" }}>
          Open Hermes verification →
        </a>
      </section>

      <nav className={styles.nav} aria-label="Command navigation">
        <a className={styles.active} href="/command">Home</a>
        <a href="/command#projects">Projects</a>
        <a href="/command#agents">Agents</a>
        <a href="/command#me">Me</a>
      </nav>
    </main>
  );
}
