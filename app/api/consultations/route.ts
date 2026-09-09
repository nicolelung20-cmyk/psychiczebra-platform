import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const TEAM_SIZES = new Set(["1-50", "51-200", "201-500", "501-1000", "1001+"]);
const BUDGET_RANGES = new Set(["5000-10000", "10000-15000", "15000-plus", "exploring"]);
const TIMELINES = new Set(["within-30-days", "within-90-days", "this-quarter", "next-6-months", "planning"]);

type ConsultationPayload = {
  name: string;
  workEmail: string;
  role: string;
  company: string;
  teamSize: string;
  budgetRange: string;
  primaryGoal: string;
  timeline: string;
};

function isNonEmptyString(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function isValidEmail(value: unknown) {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validate(body: unknown): body is ConsultationPayload {
  if (typeof body !== "object" || body === null) return false;
  const value = body as Record<string, unknown>;
  return (
    isNonEmptyString(value.name, 200) &&
    isValidEmail(value.workEmail) &&
    isNonEmptyString(value.role, 200) &&
    isNonEmptyString(value.company, 200) &&
    typeof value.teamSize === "string" && TEAM_SIZES.has(value.teamSize) &&
    typeof value.budgetRange === "string" && BUDGET_RANGES.has(value.budgetRange) &&
    isNonEmptyString(value.primaryGoal, 4000) &&
    typeof value.timeline === "string" && TIMELINES.has(value.timeline)
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!validate(body)) {
    return NextResponse.json({ error: "Please complete every field with a valid value." }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("consultations").insert({
      name: body.name.trim(),
      work_email: body.workEmail.trim().toLowerCase(),
      role: body.role.trim(),
      company: body.company.trim(),
      team_size: body.teamSize,
      budget_range: body.budgetRange,
      primary_goal: body.primaryGoal.trim(),
      timeline: body.timeline,
    });
    if (error) throw error;

    return NextResponse.json({ message: "Thank you. Your inquiry has been received — we will follow up within one business day." });
  } catch (error) {
    console.error("Consultation submission failed:", error);
    return NextResponse.json({ error: "The service is not configured correctly yet. Please try again shortly." }, { status: 500 });
  }
}
