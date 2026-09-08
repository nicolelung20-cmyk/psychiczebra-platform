import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabaseSettings() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase public credentials are not configured.");
  }

  return { publishableKey, url };
}

export function createClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const { publishableKey, url } = getSupabaseSettings();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot persist cookies; proxy.ts performs session refreshes instead.
        }
      },
    },
  });
}
