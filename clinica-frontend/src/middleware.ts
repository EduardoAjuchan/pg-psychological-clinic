import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
const PROTECTED_PREFIXES = ['/dashboard', '/pacientes', '/citas'];
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const logged = Boolean(req.cookies.get('auth')?.value);
  const res = NextResponse.next();
  if (isProtected) {
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.headers.set('Pragma', 'no-cache'); res.headers.set('Expires', '0'); res.headers.set('Surrogate-Control', 'no-store');
  }
  if (isProtected && !logged) {
    const url = req.nextUrl.clone(); url.pathname = '/login'; url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
  return res;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|api/health).*)'] };
