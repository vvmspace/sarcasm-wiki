import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { generateSitemaps } from '../../scripts/generate-sitemap'

const SITEMAP_DIR = path.join(process.cwd(), 'public', 'sitemaps')
const CACHE_DURATION = 3 * 60 * 60 * 1000 // 3 hours in milliseconds

interface SitemapMetadata {
  generatedAt: string
  totalUrls: number
  sitemapCount: number
  sitemapFiles: string[]
}

async function getSitemapMetadata(): Promise<SitemapMetadata | null> {
  try {
    const metadataPath = path.join(SITEMAP_DIR, 'metadata.json')
    const content = await fs.readFile(metadataPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

async function isSitemapStale(metadata: SitemapMetadata): Promise<boolean> {
  const generatedAt = new Date(metadata.generatedAt).getTime()
  const now = Date.now()
  return (now - generatedAt) > CACHE_DURATION
}

async function getSitemapIndex(): Promise<string | null> {
  try {
    const indexPath = path.join(SITEMAP_DIR, 'sitemap-index.xml')
    return await fs.readFile(indexPath, 'utf-8')
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('[SITEMAP] Request for /sitemap.xml')
    
    // Check existing sitemaps
    const metadata = await getSitemapMetadata()
    let sitemapContent = await getSitemapIndex()
    
    // If sitemap is missing or stale
    if (!metadata || !sitemapContent || await isSitemapStale(metadata)) {
      console.log('[SITEMAP] Sitemap is missing or stale, regenerating...')
      
      // If there's an old sitemap, serve it and start regeneration in background
      if (sitemapContent) {
        console.log('[SITEMAP] Serving stale sitemap while regenerating in background')
        
        // Start regeneration in background (don't wait for completion)
        generateSitemaps().catch(error => {
          console.error('[SITEMAP] Background regeneration failed:', error)
        })
        
        return new NextResponse(sitemapContent, {
          status: 200,
          headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600', // 1 hour browser cache
          },
        })
      }
      
      // If no old sitemap exists, generate synchronously
      console.log('[SITEMAP] No existing sitemap, generating synchronously...')
      try {
        await generateSitemaps()
        sitemapContent = await getSitemapIndex()
        
        if (!sitemapContent) {
          throw new Error('Failed to generate sitemap content')
        }
      } catch (error) {
        console.error('[SITEMAP] Synchronous generation failed:', error)
        // Return a minimal fallback sitemap
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sarcasm.wiki'
        const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`
        
        return new NextResponse(fallbackSitemap, {
          status: 200,
          headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=300', // 5 minutes cache on error
          },
        })
      }
    }
    
    console.log('[SITEMAP] Serving fresh sitemap')
    return new NextResponse(sitemapContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // 1 hour browser cache
      },
    })
    
  } catch (error) {
    console.error('[SITEMAP] Error serving sitemap:', error)
    
    // In case of error, try to serve old sitemap
    const fallbackContent = await getSitemapIndex()
    if (fallbackContent) {
      console.log('[SITEMAP] Serving fallback sitemap due to error')
      return new NextResponse(fallbackContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=300', // 5 minutes cache on error
        },
      })
    }
    
    // If nothing exists, return minimal sitemap
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sarcasm.wiki'
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`
    
    return new NextResponse(fallbackSitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300',
      },
    })
  }
}