import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Middleware for PalAI authentication and legacy route consolidation.
 *
 * - Redirects /auth/signin and /auth/signup to /auth (legacy consolidation)
 * - Allows /auth, /api/auth/*, and static assets through without auth check
 * - Redirects unauthenticated users to /auth for all other (protected) routes
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Legacy route consolidation: redirect /auth/signin and /auth/signup to /auth
  if (pathname === '/auth/signin' || pathname === '/auth/signup') {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    return NextResponse.redirect(url);
  }

  // Allow API auth routes and homepage through without auth check
  if (pathname === '/' || pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Auth page: allow unauthenticated users, redirect authenticated users away
  if (pathname === '/auth') {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (token) {
      const url = request.nextUrl.clone();
      url.pathname = token.isOnboarded ? '/' : '/onboarding';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Check authentication for all other routes
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    return NextResponse.redirect(url);
  }

  // Redirect new users to onboarding (unless they're already there)
  if (!token.isOnboarded && pathname !== '/onboarding') {
    const url = request.nextUrl.clone();
    url.pathname = '/onboarding';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
