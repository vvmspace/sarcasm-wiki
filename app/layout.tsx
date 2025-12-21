import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import 'katex/dist/katex.min.css'
import './globals.css'

// Import startup tasks (server-side only)
import '../lib/startup'

export const metadata: Metadata = {
  title: 'Sarcasm Wiki - AI-Enhanced Knowledge',
  description: 'Wikipedia articles reimagined with artificial intelligence. Discover knowledge with a fresh perspective.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1976d2',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Lightning Performance Optimizations ⚡ */}
        
        {/* DNS Prefetch for performance */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        
        {/* Preconnect for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Load fonts */}
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" 
        />
        
        {/* Critical CSS inline for instant rendering */}
        <style suppressHydrationWarning dangerouslySetInnerHTML={{
          __html: `
            body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
            .loading { opacity: 0; animation: fadeIn 0.3s ease-in-out forwards; }
            @keyframes fadeIn { to { opacity: 1; } }
            .lightning-fast { will-change: transform; transform: translateZ(0); }
          `
        }} />
        
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="lightning-fast" suppressHydrationWarning>
        {/* Lightning fast analytics ⚡ */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-FTMHQLQ4LN"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-FTMHQLQ4LN');
          `}
        </Script>
        
        {children}
      </body>
    </html>
  )
}

