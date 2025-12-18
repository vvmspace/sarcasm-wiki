import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
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

