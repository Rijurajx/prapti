import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured, publicEnv } from '@/lib/env';

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const protectedPrefixes = [
    '/dashboard',
    '/schemes',
    '/opportunities',
    '/applications',
    '/profile',
    '/assistant',
    '/household',
    '/family',
    '/reminders',
    '/saved',
    '/settings',
    '/help',
    '/guides',
    '/admin',
    '/app',
  ];

  const isProtectedRoute = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );
  const authRoutes = ['/sign-in', '/sign-up', '/forgot-password'];
  const isAuthRoute = authRoutes.includes(pathname);

  // For public static/marketing pages, return immediately with zero network latency
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next({ request });
  }

  if (!isSupabaseConfigured()) {
    if (isProtectedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/config-required';
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some((c) => c.name.includes('-auth-token'));

  // Fast path: if unauthenticated on protected route, redirect to /sign-in immediately
  if (isProtectedRoute && !hasAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }

  // Fast path: if unauthenticated on auth route, allow access immediately
  if (isAuthRoute && !hasAuthCookie) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    publicEnv.supabaseUrl as string,
    publicEnv.supabaseAnonKey as string,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}
