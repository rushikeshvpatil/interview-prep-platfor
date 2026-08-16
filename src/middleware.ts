import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname, search } = req.nextUrl;

  const isAuthPage = pathname.startsWith('/signin');
  const protectedRoutes = [
    '/dashboard',
    '/problems',
    '/mock-interview',
    '/interview',
    '/behavioral',
    '/bookmarks',
    '/progress',
    '/profile',
  ];

  const isProtectedPage = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!isLoggedIn && isProtectedPage) {
    const callbackUrl = encodeURIComponent(`${pathname}${search}`);
    return NextResponse.redirect(new URL(`/signin?callbackUrl=${callbackUrl}`, req.nextUrl));
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
