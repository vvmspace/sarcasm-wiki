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
              padding: '1.5rem', 
              background: '#fcfcfc', 
              borderRadius: '8px',
              borderLeft: '4px solid #8b0000',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <p style={{ margin: 0, color: '#444', fontSize: '1.1rem', fontStyle: 'italic' }}>
                "This article is currently in the generation queue. I'm busy making it actually worth reading. 
                Check back when you've developed some patience."
              </p>
              <p style={{ marginTop: '0.5rem', marginBottom: 0, color: '#888', fontSize: '0.9rem' }}>
                — <a href="/Emma_AI" style={{ color: '#0066cc', textDecoration: 'none' }}>Emma AI</a>
              </p>
            </div>
          )}
        </article>
      </main>
    </>
  )
}
