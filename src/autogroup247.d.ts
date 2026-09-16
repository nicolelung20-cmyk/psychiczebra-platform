export declare const STATES: {
  readonly GREEN: "GREEN";
  readonly AMBER: "AMBER";
  readonly RED: "RED";
  readonly OFFLINE: "OFFLINE";
};

export declare function buildAutogroupSnapshot(accounts?: unknown[], now?: Date): {
  system: string;
  status: "GREEN" | "AMBER" | "RED" | "OFFLINE";
  verified: boolean;
  generatedAt: string;
  monitoring: { intervalSeconds: number; failClosed: boolean };
  accounts: Array<Record<string, unknown> & { id: string; name: string; institution: string; balance: number | null; availableBalance: number | null; lastSync: string | null; state: string }>;
  totals: { accounts: number; green: number; amber: number; red: number; offline: number; balance: number; availableBalance: number };
  alerts: Array<{ severity: string; accountId: string; message: string }>;
  controlFlow: string[];
};

export declare function createAutogroupMonitor(config?: { accounts?: unknown[]; intervalMs?: number }): {
  getSnapshot(): ReturnType<typeof buildAutogroupSnapshot>;
  refresh(accounts?: unknown[]): ReturnType<typeof buildAutogroupSnapshot>;
  subscribe(listener: (snapshot: ReturnType<typeof buildAutogroupSnapshot>) => void): () => void;
  stop(): void;
};
