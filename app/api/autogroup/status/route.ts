import { NextResponse } from "next/server";
import { buildAutogroupSnapshot } from "../../../../../src/autogroup247.js";

export const dynamic = "force-dynamic";

export async function GET() {
  const raw = process.env.AUTOGROUP_ACCOUNTS ?? "[]";
  let accounts: unknown[] = [];
  try {
    const parsed = JSON.parse(raw);
    accounts = Array.isArray(parsed) ? parsed : [];
  } catch {
    accounts = [];
  }
  return NextResponse.json(buildAutogroupSnapshot(accounts));
}
