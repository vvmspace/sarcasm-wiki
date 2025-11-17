'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface QueuedPageProps {
  slug: string
  title: string
}

interface LatestArticle {
  slug: string
  title: string
}

export default function QueuedPage({ slug, title }: QueuedPageProps) {
  const [latestArticles, setLatestArticles] = useState<LatestArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const response = await fetch('/api/latest-articles')
        if (response.ok) {
          const data = await response.json()
          setLatestArticles(data)
        }
      } catch (error) {
        console.error('Error fetching latest articles:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLatest()
  }, [])

  return (
    <main style={{ 
      padding: '2rem', 
      maxWidth: '800px', 
      margin: '0 auto',
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center'
    }}>
      <div style={{
        background: '#fff',
        padding: '3rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '1rem'
        }}>📋</div>
        
        <h1 style={{
          fontSize: '2rem',
          marginBottom: '1rem',
          color: '#333',
          fontWeight: '600'
        }}>
          {title}
        </h1>
        
        <p style={{
          fontSize: '1.1rem',
          color: '#666',
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          This article has been added to the generation queue.
          <br />
          It will be generated automatically. Please check back later.
        </p>
        
        <div style={{
          background: '#f5f5f5',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <div style={{
            fontSize: '0.9rem',
            color: '#888',
            marginBottom: '0.5rem'
          }}>
            Pages are processed one per minute
          </div>
        </div>

        {latestArticles.length > 0 && (
          <div style={{
            marginBottom: '2rem',
            textAlign: 'left',
            width: '100%'
          }}>
            <h2 style={{
              fontSize: '1.2rem',
              marginBottom: '1rem',
              color: '#333',
              fontWeight: '600'
            }}>
              Recently Generated:
            </h2>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              {latestArticles.map((article) => (
                <li key={article.slug} style={{
                  marginBottom: '0.75rem'
                }}>
                  <Link
                    href={`/${encodeURIComponent(article.slug)}`}
                    style={{
                      color: '#0066cc',
                      textDecoration: 'none',
                      fontSize: '1rem',
                      display: 'block',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f0f0f0'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    {article.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link 
            href="/"
            style={{
              color: '#0066cc',
              textDecoration: 'none',
              padding: '0.75rem 1.5rem',
              border: '1px solid #0066cc',
              borderRadius: '6px',
              transition: 'all 0.2s',
              display: 'inline-block'
            }}
          >
            ← Back to Home
          </Link>
          
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#0066cc',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#0052a3'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#0066cc'
            }}
          >
            Refresh
          </button>
        </div>
      </div>
    </main>
  )
}

