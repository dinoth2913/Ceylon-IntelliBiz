import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Gates the workspace behind the JWT cookie set by lib/auth.ts on login/signup.
// This only checks that a token is present, not that it's still valid — expired
// or tampered tokens are rejected by the backend on the first API call, and the
// client-side apiFetch() helper clears the session on a 401 response.
export function middleware(request: NextRequest) {
  const token = request.cookies.get('intellibiz_token')?.value;

  if (!token) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = '/auth';
    signInUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*']
};
