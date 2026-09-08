export const attributionKeys = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type AttributionKey = (typeof attributionKeys)[number];
export type Attribution = Partial<Record<AttributionKey, string>>;

const attributionStorageKey = "elevated-ai-attribution";
const attributionValuePattern = /^[a-z0-9][a-z0-9_-]{0,63}$/;

function isAttributionKey(value: string): value is AttributionKey {
  return attributionKeys.includes(value as AttributionKey);
}

export function normalizeAttribution(value: unknown): Attribution {
  if (value === undefined) return {};
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Attribution must be an object.");
  }

  const attribution: Attribution = {};
  for (const [key, rawValue] of Object.entries(value)) {
    if (!isAttributionKey(key)) {
      throw new Error(`Attribution key ${key} is not supported.`);
    }
    if (typeof rawValue !== "string") {
      throw new Error(`Attribution value for ${key} must be a string.`);
    }

    const normalizedValue = rawValue.trim().toLowerCase();
    if (!attributionValuePattern.test(normalizedValue)) {
      throw new Error(`Attribution value for ${key} is invalid.`);
    }
    attribution[key] = normalizedValue;
  }

  return attribution;
}

export function captureAttribution(search: string): void {
  const value = Object.fromEntries(Array.from(new URLSearchParams(search).entries()).filter(
    ([key]) => isAttributionKey(key),
  ));
  const attribution = normalizeAttribution(
    value,
  );
  if (Object.keys(attribution).length > 0) {
    window.localStorage.setItem(attributionStorageKey, JSON.stringify(attribution));
  }
}

export function getStoredAttribution(): Attribution {
  const value = window.localStorage.getItem(attributionStorageKey);
  if (!value) return {};

  try {
    return normalizeAttribution(JSON.parse(value));
  } catch {
    window.localStorage.removeItem(attributionStorageKey);
    return {};
  }
}
