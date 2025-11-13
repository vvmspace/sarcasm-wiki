'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface RateLimitPageProps {
  initialRemainingSeconds: number
  lastSlug?: string
}

export default function RateLimitPage({ initialRemainingSeconds, lastSlug }: RateLimitPageProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(initialRemainingSeconds)

  useEffect(() => {
    if (initialRemainingSeconds <= 0) {
      return
    }

    let intervalId: NodeJS.Timeout | null = null

    const updateTimer = () => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (intervalId) {
            clearInterval(intervalId)
          }
          return 0
        }
        return prev - 1
      })
    }

    intervalId = setInterval(updateTimer, 1000)

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [initialRemainingSeconds])

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60

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
        }}>⏳</div>
        
        <h1 style={{
          fontSize: '2rem',
          marginBottom: '1rem',
          color: '#333',
          fontWeight: '600'
        }}>
          Page Generation in Progress
        </h1>
        
        <p style={{
          fontSize: '1.1rem',
          color: '#666',
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          {lastSlug ? (
            <>The article <strong>{lastSlug.replace(/_/g, ' ')}</strong> is currently being generated.</>
          ) : (
            <>A page is currently being generated.</>
          )}
          <br />
          Please try again in a moment.
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
            Estimated wait time:
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#0066cc'
          }}>
            {minutes > 0 ? `${minutes}m ` : ''}{seconds}s
          </div>
        </div>
        
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

