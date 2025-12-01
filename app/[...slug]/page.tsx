import { notFound } from 'next/navigation'
import { getPageMDC } from '@/lib/content'
import type { Metadata } from 'next'
import RateLimitPage from '../components/RateLimitPage'
import QueuedPage from '../components/QueuedPage'
import { getRateLimitInfo } from '@/lib/rate-limit'
import { renderMarkdownToHtml } from '@/lib/markdown-server'
import Link from 'next/link'
import ArticleContent from '../components/ArticleContent'
import AnalyticsEvent from '../components/AnalyticsEvent'
import { logNotFound } from '@/lib/not-found-logger'
import { addToQueue, isInQueue } from '@/lib/queue'
import { headers } from 'next/headers'
import '@/lib/queue-init'

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
      
      const title = slug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      
      if (!inQueue) {
        const added = await addToQueue(slug)
        if (added) {
          console.log(`[PAGE] Added ${slug} to generation queue`)
        }
      }
      
      return <QueuedPage slug={slug} title={title} />
    }

    const { content, metadata } = mdcContent
    const pageTitle = metadata.title
    const htmlContent = await renderMarkdownToHtml(content)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sarcasm.wiki'
    const url = `${baseUrl}/${rawSlug}`

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: pageTitle,
      description: metadata.description,
      url: url,
      datePublished: metadata.createdAt,
      dateModified: metadata.updatedAt,
      author: {
        '@type': 'Organization',
        name: 'Sarcasm Wiki',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Sarcasm Wiki',
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url,
      },
    }

  const contentType = metadata.contentType || 'rewritten'
  const eventName = contentType === 'created' ? 'content_created' : 'content_rewritten'

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <AnalyticsEvent
        eventName={eventName}
        eventCategory="content"
        eventLabel={contentType}
        slug={slug}
      />
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link 
            href="/"
            style={{
              color: '#0066cc',
              textDecoration: 'none',
              fontSize: '0.9rem'
            }}
          >
            ← Back to home
          </Link>
          {metadata.previousArticle && (
            <Link
              href={`/${encodeURIComponent(metadata.previousArticle.slug)}`}
              style={{
                color: '#0066cc',
                textDecoration: 'none',
                fontSize: '0.9rem'
              }}
            >
              ← {metadata.previousArticle.title}
            </Link>
          )}
        </div>
        <h1>{pageTitle}</h1>
        <article 
          style={{ 
            marginTop: '2rem',
            background: '#fff',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <ArticleContent htmlContent={htmlContent} />
        </article>
      </main>
    </>
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

