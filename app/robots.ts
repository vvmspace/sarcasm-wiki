import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sarcasm.wiki'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/wp-admin/',
          '/wp-content/',
          '/wp-includes/',
          '/admin/',
          '/administrator/',
          '/phpmyadmin/',
          '/.env',
          '/.git/',
          '/config/',
        ],
      },
      // Block known scanners
      {
        userAgent: [
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
        ],
        disallow: '/',
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

