export const DEFAULT_REPOS = ["nicolelung20-cmyk/supergrok", "nicolelung20-cmyk/psychiczebra-platform", "nicolelung20-cmyk/awesome-grok"];

const BAD = new Set(["failure", "timed_out", "cancelled", "action_required", "startup_failure"]);

/** Reduces GitHub check runs to failing, pending or passing; no runs reports none. */
export function ciState(checkRuns = []) {
  const runs = checkRuns.filter(Boolean);
  if (!runs.length) return "none";
  if (runs.some((r) => r.status === "completed" && BAD.has(r.conclusion))) return "failing";
  if (runs.some((r) => r.status !== "completed")) return "pending";
  return "passing";
}

/** Parses AUTOGROUP_REPOS ("owner/name,owner/name"); only well-formed names are kept. */
export function parseRepos(raw) {
  const list = String(raw ?? "").split(",").map((s) => s.trim()).filter((s) => /^[\w.-]+\/[\w.-]+$/.test(s) && s.split("/").every((part) => part !== "." && part !== ".."));
  return list.length ? list : DEFAULT_REPOS;
}

export function shapePull(repo, pr, ci) {
  return { repo, number: pr.number, title: String(pr.title ?? "").slice(0, 120), draft: pr.draft === true, url: pr.html_url, ci };
}

/** Picks the newest project update from a Linear GraphQL project payload. */
export function shapeLinear(project) {
  if (!project) return null;
  const update = project.projectUpdates?.nodes?.[0] ?? null;
  return {
    name: project.name,
    state: project.state,
    url: project.url,
    update: update ? { health: update.health ?? null, createdAt: update.createdAt, body: String(update.body ?? "").slice(0, 1200) } : null,
  };
}
