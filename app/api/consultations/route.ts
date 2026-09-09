import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const MAX_REQUEST_BYTES = 16 * 1024;

const fieldLimits = {
  name: 120,
  workEmail: 254,
  company: 160,
  role: 120,
  teamSize: 80,
  primaryGoal: 1_000,
  budgetRange: 80,
  timeline: 80,
} as const;

type ConsultationLead = {
  -readonly [Field in keyof typeof fieldLimits]: string;
};

type BodyReadResult =
  | { kind: "ok"; value: unknown }
  | { kind: "invalid" }
  | { kind: "too-large" };

function response(body: { error: string } | { success: true }, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasValidText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength &&
    !/[\u0000-\u001F\u007F]/.test(value);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateLead(value: unknown): ConsultationLead | null {
  if (!isPlainObject(value)) return null;

  const fields = Object.keys(fieldLimits) as Array<keyof ConsultationLead>;
  if (Object.keys(value).length !== fields.length || !fields.every((field) => Object.hasOwn(value, field))) {
    return null;
  }

  const lead = {} as ConsultationLead;
  for (const field of fields) {
    const fieldValue = value[field];
    if (!hasValidText(fieldValue, fieldLimits[field])) return null;
    lead[field] = fieldValue.trim();
  }

  return isValidEmail(lead.workEmail) ? lead : null;
}

async function readJsonBody(request: Request): Promise<BodyReadResult> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const declaredLength = Number(contentLength);
    if (!Number.isInteger(declaredLength) || declaredLength < 0) return { kind: "invalid" };
    if (declaredLength > MAX_REQUEST_BYTES) return { kind: "too-large" };
  }

  if (!request.body) return { kind: "invalid" };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      totalBytes += value.byteLength;
      if (totalBytes > MAX_REQUEST_BYTES) {
        await reader.cancel();
        return { kind: "too-large" };
      }
      chunks.push(value);
    }

    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return {
      kind: "ok",
      value: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
    };
  } catch {
    return { kind: "invalid" };
  }
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type");
  if (contentType?.split(";", 1)[0]?.trim().toLowerCase() !== "application/json") {
    return response({ error: "Content-Type must be application/json." }, 415);
  }

  const parsedBody = await readJsonBody(request);
  if (parsedBody.kind === "too-large") {
    return response({ error: "Request body is too large." }, 413);
  }
  if (parsedBody.kind === "invalid") {
    return response({ error: "Request body must be valid JSON." }, 400);
  }

  const lead = validateLead(parsedBody.value);
  if (!lead) {
    return response({ error: "Submit all required consultation details in the expected format." }, 400);
  }

  try {
    const { error } = await createServiceClient()
      .from("consultation_leads")
      .insert({
        name: lead.name,
        work_email: lead.workEmail,
        company: lead.company,
        role: lead.role,
        team_size: lead.teamSize,
        primary_goal: lead.primaryGoal,
        budget_range: lead.budgetRange,
        timeline: lead.timeline,
      });

    if (error) {
      console.error("Consultation lead insertion failed", { code: error.code });
      return response({ error: "Unable to submit your consultation request. Please try again." }, 503);
    }
  } catch {
    console.error("Consultation lead service is unavailable");
    return response({ error: "Unable to submit your consultation request. Please try again." }, 503);
  }

  return response({ success: true }, 201);
}
