import { createBrowserClient } from "@supabase/ssr";

function getSupabaseSettings() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase public credentials are not configured.");
  }

  return { publishableKey, url };
}

export function createClient() {
  const { publishableKey, url } = getSupabaseSettings();
  return createBrowserClient(url, publishableKey);
}
