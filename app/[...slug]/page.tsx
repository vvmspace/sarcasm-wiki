import { notFound } from 'next/navigation'
import { getPageMDC } from '@/lib/content'
import type { Metadata } from 'next'
import RateLimitPage from '../components/RateLimitPage'
import { getRateLimitInfo } from '@/lib/rate-limit'
import { renderMarkdownToHtml } from '@/lib/markdown-server'
import { logNotFound } from '@/lib/not-found-logger'
import { addToQueue, isInQueue } from '@/lib/queue'
import { headers } from 'next/headers'

import WikiLayout from '../components/WikiLayout'

interface PageProps {
  params: {
    slug: string[]
  }
}

export const dynamicParams = true
export const revalidate = process.env.NODE_ENV === 'development' ? 0 : 300 // Lightning fast: 5min revalidation ⚡
export const fetchCache = 'default-cache' // Aggressive caching
export const runtime = 'nodejs' // Fastest runtime

// Lightning fast cache settings ⚡
const sharedCache = new Map<string, { 
  mdcContent: any, 
  htmlContent?: string,
  metadata?: Metadata,
  timestamp: number 
}>()
const CACHE_TTL = process.env.NODE_ENV === 'development' ? 15000 : 600000 // 15s dev, 10min prod (more aggressive)

// Lightning fast cache with LRU eviction
const MAX_CACHE_SIZE = 1000
function maintainCacheSize() {
  if (sharedCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(sharedCache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    // Remove oldest 20% of entries
    const toRemove = Math.floor(MAX_CACHE_SIZE * 0.2)
    for (let i = 0; i < toRemove; i++) {
      sharedCache.delete(entries[i][0])
    }
  }
}

function getFromSharedCache(key: string) {
  const cached = sharedCache.get(key)
  if (!cached) return null
  
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    sharedCache.delete(key)
    return null
  }
  
  return cached
}

function setSharedCache(key: string, data: any): void {
  maintainCacheSize() // Lightning fast cache management ⚡
  sharedCache.set(key, {
    ...data,
    timestamp: Date.now()
  })
}

function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug)
  } catch {
    return slug
  }
}

// Fast path checks
function shouldBlock(slug: string): boolean {
  const blockedPaths = [
    'wp-admin', 'wp-content', 'wp-includes', 'wp-login.php', 'wp-config.php',
    'xmlrpc.php', 'admin', 'administrator', 'phpmyadmin', '.env', '.git',
    'config', 'setup-config.php', 'install.php', 'readme.html', 'license.txt'
  ]
  
  return blockedPaths.some(blocked => slug.startsWith(blocked) || slug.includes(`/${blocked}`)) ||
         slug.includes('_next') || slug.includes('webpack') || slug.includes('hot-update') || slug.startsWith('.')
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const rawSlug = params.slug.join('/')
  const slug = decodeSlug(rawSlug)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sarcasm.wiki'
  const url = `${baseUrl}/${rawSlug}`
  
  // Fast path for blocked content
  if (shouldBlock(slug)) {
    return {
      title: '404 - Page Not Found',
      alternates: { canonical: url }
    }
  }
  
  const cacheKey = `content:${slug}`
  let cached = getFromSharedCache(cacheKey)
  
  // If we have cached metadata, return it immediately
  if (cached?.metadata) {
    return cached.metadata
  }
  
  try {
    // Only fetch MDC if not cached
    let mdcContent = cached?.mdcContent
    if (!mdcContent) {
      mdcContent = await getPageMDC(slug)
      // Cache the MDC content for reuse in the page component
      setSharedCache(cacheKey, { mdcContent })
      cached = getFromSharedCache(cacheKey)
    }
    
    let metadata: Metadata
    if (!mdcContent) {
      metadata = {
        title: slug.replace(/_/g, ' '),
        alternates: { canonical: url }
      }
    } else {
      metadata = {
        title: mdcContent.metadata.title,
        description: mdcContent.metadata.description,
        keywords: mdcContent.metadata.keywords,
        alternates: { canonical: url },
        openGraph: {
          title: mdcContent.metadata.title,
          description: mdcContent.metadata.description,
          type: 'article',
          url: url,
          publishedTime: mdcContent.metadata.createdAt,
          modifiedTime: mdcContent.metadata.updatedAt,
          siteName: 'Sarcasm Wiki',
        },
        twitter: {
          card: 'summary_large_image',
          title: mdcContent.metadata.title,
          description: mdcContent.metadata.description,
        },
      }
    }
    
    // Cache the metadata
    if (cached) {
      cached.metadata = metadata
    }
    
    return metadata
  } catch (error: any) {
    const metadata: Metadata = error.message === 'RATE_LIMIT_EXCEEDED' 
      ? {
          title: `${slug.replace(/_/g, ' ')} - Generation in Progress`,
          description: 'This page is currently being generated. Please try again in a moment.',
          alternates: { canonical: url }
        }
      : {
          title: slug.replace(/_/g, ' '),
          alternates: { canonical: url }
        }
    
    // Cache error metadata too
    if (cached) {
      cached.metadata = metadata
    }
    
    return metadata
  }
}

export default async function WikiPage({ params }: PageProps) {
  const rawSlug = params.slug.join('/')
  const slug = decodeSlug(rawSlug)
  
  // Fast path for blocked content
  if (shouldBlock(slug)) {
    notFound()
  }
  
  const cacheKey = `content:${slug}`
  let cached = getFromSharedCache(cacheKey)
  
  try {
    // Reuse MDC content from metadata generation if available
    let mdcContent = cached?.mdcContent
    if (!mdcContent) {
      mdcContent = await getPageMDC(slug)
      if (!cached) {
        setSharedCache(cacheKey, { mdcContent })
        cached = getFromSharedCache(cacheKey)
      } else {
        cached.mdcContent = mdcContent
      }
    }

    if (!mdcContent) {
      // Handle missing content asynchronously to avoid blocking render
      const handleMissingContent = async () => {
        try {
          const [inQueue, isValidSlug] = await Promise.all([
            isInQueue(slug),
            Promise.resolve(/^[A-Za-z0-9_,:\- ]+$/.test(slug))
          ])
          
          if (!inQueue && isValidSlug) {
            // Don't await - fire and forget
            addToQueue(slug).catch(console.error)
          }
          
          if (!isValidSlug) {
            // Don't await - fire and forget
            const headersList = await headers()
            const referer = headersList.get('referer') || undefined
            const userAgent = headersList.get('user-agent') || undefined
            logNotFound(slug, referer, userAgent).catch(console.error)
          }
        } catch (error) {
          console.error('Error handling missing content:', error)
        }
      }
      
      // Fire and forget
      handleMissingContent()
      notFound()
    }

    const { content, metadata } = mdcContent
    
    // Check if HTML is already cached
    let htmlContent = cached?.htmlContent
    if (!htmlContent) {
      htmlContent = await renderMarkdownToHtml(content)
      if (cached) {
        cached.htmlContent = htmlContent
      }
    }

    return (
      <WikiLayout
        title={metadata.title}
        htmlContent={htmlContent}
        slug={slug}
        metadata={metadata}
        rawSlug={rawSlug}
      />
    )
  } catch (error: any) {
    if (error.message === 'RATE_LIMIT_EXCEEDED') {
      const rateLimitInfo = await getRateLimitInfo()
      
      return (
        <RateLimitPage 
          initialRemainingSeconds={rateLimitInfo?.remainingSeconds || 60}
          lastSlug={rateLimitInfo?.lastSlug}
        />
      )
    }
    throw error
  }
}

