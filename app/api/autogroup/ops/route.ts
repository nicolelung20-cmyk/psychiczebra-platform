import { NextResponse } from "next/server";
import { tokenMatches } from "../../../../src/autogroup-revenue.js";
import { ciState, parseRepos, shapeLinear, shapePull } from "../../../../src/autogroup-ops.js";
import { FACTORY_ASSETS, factorySummary } from "../../../../src/factory/catalog.js";

export const dynamic = "force-dynamic";

const LINEAR_PROJECT_ID = "5670e2d4-ec09-4c07-9bd9-3c1f6cf039bc";

type Pull = { number: number; title?: string; draft?: boolean; html_url?: string; head?: { sha?: string } };

async function github(token: string | undefined, repos: string[]) {
  if (!token) return { connected: false, reason: "GITHUB_READ_TOKEN is not set" };
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  try {
    const perRepo = await Promise.all(repos.map(async (repo) => {
      const res = await fetch(`https://api.github.com/repos/${repo}/pulls?state=open&per_page=10`, { headers, cache: "no-store" });
      if (!res.ok) throw new Error(`GitHub returned ${res.status} for ${repo}`);
      const pulls = (await res.json()) as Pull[];
      return Promise.all(pulls.map(async (pr) => {
        const checks = await fetch(`https://api.github.com/repos/${repo}/commits/${pr.head?.sha}/check-runs?per_page=50`, { headers, cache: "no-store" });
        const body = checks.ok ? ((await checks.json()) as { check_runs?: Array<{ status?: string; conclusion?: string | null }> }) : { check_runs: [] };
        return shapePull(repo, pr, checks.ok ? ciState(body.check_runs) : "none");
      }));
    }));
    return { connected: true, pulls: perRepo.flat() };
  } catch (error) {
    return { connected: false, reason: error instanceof Error ? error.message : "GitHub request failed" };
  }
}

async function linear(key: string | undefined) {
  if (!key) return { connected: false, reason: "LINEAR_API_KEY is not set" };
  try {
    const res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: { Authorization: key, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "query($id:String!){project(id:$id){name state url projectUpdates(first:1){nodes{health body createdAt}}}}",
        variables: { id: LINEAR_PROJECT_ID },
      }),
      cache: "no-store",
    });
    if (!res.ok) return { connected: false, reason: `Linear returned ${res.status}` };
    const body = (await res.json()) as { data?: { project?: unknown } };
    return { connected: true, project: shapeLinear(body.data?.project) };
  } catch {
    return { connected: false, reason: "Could not reach Linear" };
  }
}

/** Read-only ops feed: open PRs with CI state, and the Linear HQ project's latest update. Token-gated like the revenue endpoint. */
export async function GET(request: Request) {
  const expected = process.env.AUTOGROUP_DASH_TOKEN;
  if (!expected) return NextResponse.json({ reason: "AUTOGROUP_DASH_TOKEN is not set" }, { status: 503 });
  if (!tokenMatches(expected, request.headers.get("x-dash-token") ?? undefined)) {
    return NextResponse.json({ reason: "Invalid dashboard token" }, { status: 401 });
  }
  const [gh, lin] = await Promise.all([
    github(process.env.GITHUB_READ_TOKEN, parseRepos(process.env.AUTOGROUP_REPOS)),
    linear(process.env.LINEAR_API_KEY),
  ]);
  return NextResponse.json({\n    github: gh,\n    linear: lin,\n    factory: { ...factorySummary(), assets: FACTORY_ASSETS },\n    generatedAt: new Date().toISOString(),\n  });
}
