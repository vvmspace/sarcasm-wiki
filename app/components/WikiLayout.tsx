import Link from 'next/link'
import ArticleContent from './ArticleContent'
import AnalyticsEvent from './AnalyticsEvent'

interface WikiLayoutProps {
  title: string
  htmlContent: string
  isFuturePage?: boolean
  slug: string
  metadata?: any
  rawSlug: string
}

export default function WikiLayout({ 
  title, 
  htmlContent, 
  isFuturePage, 
  slug, 
  metadata,
  rawSlug 
}: WikiLayoutProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sarcasm.wiki'
  const url = `${baseUrl}/${rawSlug}`

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: metadata?.description || 'Future article in queue',
    url: url,
    datePublished: metadata?.createdAt,
    dateModified: metadata?.updatedAt,
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

  const contentType = metadata?.contentType || 'rewritten'
  const eventName = contentType === 'created' ? 'content_created' : 'content_rewritten'

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {!isFuturePage && (
        <AnalyticsEvent
          eventName={eventName}
          eventCategory="content"
          eventLabel={contentType}
          slug={slug}
        />
      )}
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
          {metadata?.previousArticle && (
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
        <h1 style={{ color: isFuturePage ? '#8b0000' : 'inherit' }}>{title}</h1>
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
          {isFuturePage && (
            <div style={{ 
              marginTop: '2rem', 
              padding: '1rem', 
              background: '#f9f9f9', 
              borderRadius: '4px',
              borderLeft: '4px solid #8b0000'
            }}>
              <p style={{ margin: 0, color: '#666' }}>
                This article is currently in the generation queue. It will be available shortly.
              </p>
            </div>
          )}
        </article>
      </main>
    </>
  )
}
