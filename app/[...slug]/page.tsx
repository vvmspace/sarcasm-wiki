import { notFound } from 'next/navigation'
import { getPageMDC } from '@/lib/content'
import type { Metadata } from 'next'
import RateLimitPage from '../components/RateLimitPage'
import { getRateLimitInfo } from '@/lib/rate-limit'
import { renderMarkdownToHtml } from '@/lib/markdown-server'
import Link from 'next/link'
import ArticleContent from '../components/ArticleContent'

interface PageProps {
  params: {
    slug: string[]
  }
}

export const revalidate = 3600

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = params.slug.join('/')
  
  try {
    const mdcContent = await getPageMDC(slug)
    
    if (!mdcContent) {
      return {
        title: slug.replace(/_/g, ' '),
      }
    }
    
    return {
      title: mdcContent.metadata.title,
      description: mdcContent.metadata.description,
      keywords: mdcContent.metadata.keywords,
      openGraph: {
        title: mdcContent.metadata.title,
        description: mdcContent.metadata.description,
        type: 'article',
      },
    }
  } catch (error: any) {
    if (error.message === 'RATE_LIMIT_EXCEEDED') {
      return {
        title: `${slug.replace(/_/g, ' ')} - Generation in Progress`,
        description: 'This page is currently being generated. Please try again in a moment.',
      }
    }
    return {
      title: slug.replace(/_/g, ' '),
    }
  }
}

export default async function WikiPage({ params }: PageProps) {
  const slug = params.slug.join('/')
  
  if (slug.includes('_next') || slug.includes('webpack') || slug.includes('hot-update') || slug.startsWith('.')) {
    notFound()
  }
  
  try {
    const mdcContent = await getPageMDC(slug)

    if (!mdcContent) {
      notFound()
    }

    const { content, metadata } = mdcContent
    const title = metadata.title
    const htmlContent = await renderMarkdownToHtml(content)

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1rem' }}>
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
      </div>
      <h1>{title}</h1>
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

