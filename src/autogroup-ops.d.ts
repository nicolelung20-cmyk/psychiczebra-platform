export declare const DEFAULT_REPOS: string[];
export declare function ciState(checkRuns?: Array<{ status?: string; conclusion?: string | null } | null>): "failing" | "pending" | "passing" | "none";
export declare function parseRepos(raw: unknown): string[];
export declare function shapePull(repo: string, pr: { number: number; title?: string; draft?: boolean; html_url?: string }, ci: string): { repo: string; number: number; title: string; draft: boolean; url?: string; ci: string };
export declare function shapeLinear(project: unknown): null | { name?: string; state?: string; url?: string; update: null | { health: string | null; createdAt?: string; body: string } };
