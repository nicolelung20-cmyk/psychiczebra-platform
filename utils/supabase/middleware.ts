import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

function isProtectedPath(pathname: string) {
  return pathname === "/hermes" || pathname.startsWith("/hermes/");
}

function getLoginRedirect(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

function getSupabaseSettings() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return url && publishableKey ? { publishableKey, url } : null;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const settings = getSupabaseSettings();

  if (!settings) {
    return isProtectedPath(request.nextUrl.pathname) ? getLoginRedirect(request) : response;
  }

  const supabase = createServerClient(settings.url, settings.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  // getClaims verifies the JWT signature before using claims for route protection.
  const { data, error } = await supabase.auth.getClaims();
  if (isProtectedPath(request.nextUrl.pathname) && (error || !data?.claims)) {
    return getLoginRedirect(request);
  }

  return response;
}
