"use client";

import { FormEvent, useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import styles from "./command.module.css";

type Agent = { id: string; name: string; provider: string | null; status: string; capabilities: unknown };
type Project = { id: string; name: string; source: string | null; url: string | null; status: string };
type Job = { id: string; status: string; priority: number; input: { command?: string; routedAgent?: string }; created_at: string };
type Approval = { id: string; action: string; target: string | null; created_at: string };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function CommandPage() {
  const [command, setCommand] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [status, setStatus] = useState("Connecting");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
    setStatus("Live");
    setError("");
  }

  useEffect(() => {
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
        <p className={styles.note}>Commands route through the supervisor. Live trading and other high-impact actions remain approval-gated.</p>
      </section>

      <section className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardTitle}><span>Agents</span><b>{agents.filter(a => a.status === "active").length} active</b></div>
          <div className={styles.list}>
            {agents.map(agent => (
              <div className={styles.row} key={agent.id}>
                <span><i className={agent.status === "active" ? styles.dot : styles.dotMuted} />{agent.name}</span>
                <small>{agent.provider ?? "native"}</small>
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

      <nav className={styles.nav} aria-label="Command navigation">
        <a className={styles.active} href="/command">Home</a>
        <a href="/command#projects">Projects</a>
        <a href="/command#agents">Agents</a>
        <a href="/command#me">Me</a>
      </nav>
    </main>
  );
}
