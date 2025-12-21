import { notFound } from 'next/navigation'
import { getPageMDC } from '@/lib/content'
import type { Metadata } from 'next'
import RateLimitPage from '../components/RateLimitPage'
import { getRateLimitInfo } from '@/lib/rate-limit'
import { renderMarkdownToHtml } from '@/lib/markdown-server'
import { logNotFound } from '@/lib/not-found-logger'
import { addToQueue, isInQueue } from '@/lib/queue'
import { headers } from 'next/headers'
import '@/lib/queue-init'

import WikiLayout from '../components/WikiLayout'

interface PageProps {
  params: {
    slug: string[]
  }
}

export const dynamicParams = true
export const revalidate = process.env.NODE_ENV === 'development' ? 0 : false

// Development cache for faster page loads
const devCache = new Map<string, { data: any, timestamp: number }>()
const DEV_CACHE_TTL = 30000 // 30 seconds in dev mode

function getFromDevCache<T>(key: string): T | null {
  if (process.env.NODE_ENV !== 'development') return null
  
  const cached = devCache.get(key)
  if (!cached) return null
  
  if (Date.now() - cached.timestamp > DEV_CACHE_TTL) {
    devCache.delete(key)
    return null
  }
  
  return cached.data as T
}

function setDevCache<T>(key: string, data: T): void {
  if (process.env.NODE_ENV !== 'development') return
  
  devCache.set(key, {
    data,
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const rawSlug = params.slug.join('/')
  const slug = decodeSlug(rawSlug)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sarcasm.wiki'
  const url = `${baseUrl}/${rawSlug}`
  
  // Check dev cache first
  const cacheKey = `metadata:${slug}`
  const cached = getFromDevCache<Metadata>(cacheKey)
  if (cached) {
    return cached
  }
  
  try {
    const mdcContent = await getPageMDC(slug)
    
    let metadata: Metadata
    if (!mdcContent) {
      metadata = {
        title: slug.replace(/_/g, ' '),
        alternates: {
          canonical: url,
        },
      }
    } else {
      metadata = {
        title: mdcContent.metadata.title,
        description: mdcContent.metadata.description,
        keywords: mdcContent.metadata.keywords,
        alternates: {
          canonical: url,
        },
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
    
    setDevCache(cacheKey, metadata)
    return metadata
  } catch (error: any) {
    let metadata: Metadata
    if (error.message === 'RATE_LIMIT_EXCEEDED') {
      metadata = {
        title: `${slug.replace(/_/g, ' ')} - Generation in Progress`,
        description: 'This page is currently being generated. Please try again in a moment.',
        alternates: {
          canonical: url,
        },
      }
    } else {
      metadata = {
        title: slug.replace(/_/g, ' '),
        alternates: {
          canonical: url,
        },
      }
    }
    
    setDevCache(cacheKey, metadata)
    return metadata
  }
}

export default async function WikiPage({ params }: PageProps) {
  const rawSlug = params.slug.join('/')
  const slug = decodeSlug(rawSlug)
  
  // Fast path for development assets
  if (slug.includes('_next') || slug.includes('webpack') || slug.includes('hot-update') || slug.startsWith('.')) {
    notFound()
  }
  
  // Check dev cache first
  const cacheKey = `page:${slug}`
  const cached = getFromDevCache<any>(cacheKey)
  if (cached) {
    return cached
  }
  
  const headersList = await headers()
  const referer = headersList.get('referer') || undefined
  const userAgent = headersList.get('user-agent') || undefined
  
  try {
    const mdcContent = await getPageMDC(slug)

    if (!mdcContent) {
      const inQueue = await isInQueue(slug)
      const isValidSlug = /^[A-Za-z0-9_,:\- ]+$/.test(slug)
      
      if (!inQueue && isValidSlug) {
        await addToQueue(slug)
      }
      
      if (!isValidSlug) {
        await logNotFound(slug, referer, userAgent)
      }
      
      notFound()
    }

    const { content, metadata } = mdcContent
    const htmlContent = await renderMarkdownToHtml(content)

    const pageComponent = (
      <WikiLayout
        title={metadata.title}
        htmlContent={htmlContent}
        slug={slug}
        metadata={metadata}
        rawSlug={rawSlug}
      />
    )
    
    setDevCache(cacheKey, pageComponent)
    return pageComponent
  } catch (error: any) {
    if (error.message === 'RATE_LIMIT_EXCEEDED') {
      const rateLimitInfo = await getRateLimitInfo()
      
      const remainingSeconds = rateLimitInfo?.remainingSeconds || 60
      const lastSlug = rateLimitInfo?.lastSlug
      
      const rateLimitComponent = (
        <RateLimitPage 
          initialRemainingSeconds={remainingSeconds}
          lastSlug={lastSlug}
        />
      )
      
      setDevCache(cacheKey, rateLimitComponent)
      return rateLimitComponent
    }
    throw error
  }
}

