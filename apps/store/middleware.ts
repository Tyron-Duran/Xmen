import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // 1. Enforce HTTPS redirect in production if forwarded as http
  const proto = req.headers.get('x-forwarded-proto');
  if (process.env.NODE_ENV === 'production' && proto && proto !== 'https') {
    const httpsUrl = req.nextUrl.clone();
    httpsUrl.protocol = 'https:';
    return NextResponse.redirect(httpsUrl, 301);
  }

  // 2. Set HSTS and HTTPS transport protection security headers
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return res;
}

export const config = {
  matcher: ['/api/:path*']
};
