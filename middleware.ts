import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Block WordPress and common scanner paths
  const blockedPaths = [
    '/wp-admin',
    '/wp-content',
    '/wp-includes',
    '/wp-login.php',
    '/wp-config.php',
    '/xmlrpc.php',
    '/admin',
    '/administrator',
    '/phpmyadmin',
    '/.env',
    '/.git',
    '/config',
    '/setup-config.php',
    '/install.php',
    '/readme.html',
    '/license.txt'
  ]
  
  // Check if path starts with any blocked path
  if (blockedPaths.some(blocked => pathname.startsWith(blocked))) {
    // Log blocked request (async, don't wait)
    const userAgent = request.headers.get('user-agent')
    const ip = request.ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    
    // Import and log asynchronously
    import('./lib/security-logger').then(({ logBlockedRequest }) => {
      logBlockedRequest(pathname, userAgent, ip, 'blocked_path')
    }).catch(() => {}) // Ignore logging errors
    
    return new NextResponse(null, { status: 404 })
  }
  
  // Block common scanner user agents
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || ''
  const blockedAgents = [
    'sqlmap',
    'nikto',
    'nessus',
    'openvas',
    'masscan',
    'nmap',
    'dirb',
    'dirbuster',
    'gobuster',
    'wpscan'
  ]
  
  if (blockedAgents.some(agent => userAgent.includes(agent))) {
    // Log blocked request (async, don't wait)
    const ip = request.ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    
    // Import and log asynchronously
    import('./lib/security-logger').then(({ logBlockedRequest }) => {
      logBlockedRequest(pathname, userAgent, ip, 'blocked_agent')
    }).catch(() => {}) // Ignore logging errors
    
    return new NextResponse(null, { status: 403 })
  }
  
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



