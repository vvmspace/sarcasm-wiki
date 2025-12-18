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
export const revalidate = false

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
  
  try {
    const mdcContent = await getPageMDC(slug)
    
    if (!mdcContent) {
      return {
        title: slug.replace(/_/g, ' '),
        alternates: {
          canonical: url,
        },
      }
    }
    
    return {
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
  } catch (error: any) {
    if (error.message === 'RATE_LIMIT_EXCEEDED') {
      return {
        title: `${slug.replace(/_/g, ' ')} - Generation in Progress`,
        description: 'This page is currently being generated. Please try again in a moment.',
        alternates: {
          canonical: url,
        },
      }
    }
    return {
      title: slug.replace(/_/g, ' '),
      alternates: {
        canonical: url,
      },
    }
  }
}

export default async function WikiPage({ params }: PageProps) {
  const rawSlug = params.slug.join('/')
  const slug = decodeSlug(rawSlug)
  const headersList = await headers()
  const referer = headersList.get('referer') || undefined
  const userAgent = headersList.get('user-agent') || undefined
  
  if (slug.includes('_next') || slug.includes('webpack') || slug.includes('hot-update') || slug.startsWith('.')) {
    await logNotFound(slug, referer, userAgent)
    notFound()
  }
  
  try {
    const mdcContent = await getPageMDC(slug)

    if (!mdcContent) {
      const inQueue = await isInQueue(slug)
      if (!inQueue) {
        await addToQueue(slug)
      }
      // Instead of rendering here, we call notFound() to return 404 status code.
      // The custom not-found.tsx will then use the same layout.
      notFound()
    }

    const { content, metadata } = mdcContent
    const htmlContent = await renderMarkdownToHtml(content)

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
      
      const remainingSeconds = rateLimitInfo?.remainingSeconds || 60
      const lastSlug = rateLimitInfo?.lastSlug
      
      return (
        <RateLimitPage 
          initialRemainingSeconds={remainingSeconds}
          lastSlug={lastSlug}
        />
      )
    }
    throw error
  }
}

