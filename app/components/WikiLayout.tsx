import Navigation from './Navigation'
import Button from './Button'
import ArticleContent from './ArticleContent'
import AnalyticsEvent from './AnalyticsEvent'
import AIBadge from './AIBadge'

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
      
      <Navigation />
      
      <main className="container">
        <div className="article-header">
          <Button 
            variant="ghost" 
            href="/"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
              </svg>
            }
          >
            Back to Home
          </Button>
          
          {metadata?.previousArticle && (
            <Button 
              variant="outline" 
              size="sm"
              href={`/${encodeURIComponent(metadata.previousArticle.slug)}`}
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
                </svg>
              }
            >
              {metadata.previousArticle.title}
            </Button>
          )}
        </div>

        <article className="article">
          <header className="article-title-section">
            <h1 style={{ color: isFuturePage ? 'var(--accent-red)' : 'inherit' }}>
              {title}
            </h1>
            
            {/* AI Badge - показываем только для статей с AI метаданными */}
            {!isFuturePage && (
              <AIBadge
                aiProvider={metadata?.aiProvider}
                aiModel={metadata?.aiModel}
                contentType={metadata?.contentType}
                isOriginalContent={metadata?.isOriginalContent}
              />
            )}
          </header>
          
          <div className="article-content">
            <ArticleContent htmlContent={htmlContent} />
            
            {isFuturePage && (
              <div className="future-notice">
                <div className="future-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,17A1.5,1.5 0 0,1 10.5,15.5A1.5,1.5 0 0,1 12,14A1.5,1.5 0 0,1 13.5,15.5A1.5,1.5 0 0,1 12,17M12,10.5C10.9,10.5 10,9.6 10,8.5C10,7.4 10.9,6.5 12,6.5C13.1,6.5 14,7.4 14,8.5C14,9.6 13.1,10.5 12,10.5Z" />
                  </svg>
                </div>
                <div className="future-content">
                  <p className="future-message">
                    "This article is currently in the generation queue. I'm busy making it actually worth reading. 
                    Check back when you've developed some patience."
                  </p>
                  <p className="future-author">
                    — <a href="/Emma_AI">Emma AI</a>
                  </p>
                </div>
              </div>
            )}
          </div>
        </article>
      </main>
    </>
  )
}
