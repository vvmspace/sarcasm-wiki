import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import 'katex/dist/katex.min.css'
import './globals.css'
import QueueStatus from './components/QueueStatus'

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
        {/* DNS Prefetch for performance */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        
        {/* Preconnect for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-FTMHQLQ4LN"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-FTMHQLQ4LN');
          `}
        </Script>
        {children}
        <QueueStatus />
      </body>
    </html>
  )
}

