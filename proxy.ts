import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!MAINTENANCE_MODE) {
    return NextResponse.next()
  }

  // Allow the maintenance page itself through
  if (pathname === '/maintenance') {
    const res = NextResponse.next()
    res.headers.set('X-Robots-Tag', 'noindex, noarchive, nosnippet')
    return res
  }

  // Block all API routes with 503 — prevents any data exposure
  if (pathname.startsWith('/api')) {
    return new NextResponse(
      JSON.stringify({ error: 'Service temporarily unavailable' }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '3600',
        },
      }
    )
  }

  // Redirect all other routes to the maintenance page
  const url = request.nextUrl.clone()
  url.pathname = '/maintenance'
  return NextResponse.redirect(url, { status: 302 })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|webmanifest)).*)',
  ],
}
