import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Proxy sitemap requests from /sitemaps/ to /api/sitemaps/
  if (pathname.startsWith('/sitemaps/')) {
    const filename = pathname.replace('/sitemaps/', '')
    const url = request.nextUrl.clone()
    url.pathname = `/api/sitemaps/${filename}`
    return NextResponse.rewrite(url)
  }
  
  // Store the current path in a header so it can be accessed in not-found.tsx
  const requestHeaders = new Headers(request.headers)
  const url = new URL(request.url)
  requestHeaders.set('x-current-path', url.pathname)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  // Apply to all routes except api, static files, etc.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}


