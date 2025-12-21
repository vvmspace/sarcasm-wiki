'use client'

import { useState, useEffect } from 'react'

interface SitemapStatus {
  success: boolean
  metadata?: {
    generatedAt: string
    totalUrls: number
    sitemapCount: number
    sitemapFiles: string[]
    age: number
    ageHours: number
    maxFileSize?: number
    priorityRange?: {
      min: number
      max: number
    }
  }
  error?: string
}

export default function SitemapAdminPage() {
  const [status, setStatus] = useState<SitemapStatus | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastGeneration, setLastGeneration] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/admin/sitemap')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Error fetching sitemap status:', error)
      setStatus({ success: false, error: 'Failed to fetch status' })
    }
  }

  const triggerGeneration = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/admin/sitemap', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        setLastGeneration(data.timestamp)
        setTimeout(fetchStatus, 1000) // Refresh status after generation
      } else {
        alert(`Generation failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Error triggering generation:', error)
      alert('Failed to trigger generation')
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Sitemap Administration</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={triggerGeneration} 
          disabled={isGenerating}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: isGenerating ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isGenerating ? 'not-allowed' : 'pointer'
          }}
        >
          {isGenerating ? 'Generating...' : 'Generate Sitemap'}
        </button>
        
        <button 
          onClick={fetchStatus}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh Status
        </button>
      </div>

      {lastGeneration && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#d4edda', 
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <span suppressHydrationWarning>
            ✅ Last generation completed at: {new Date(lastGeneration).toLocaleString()}
          </span>
        </div>
      )}

      <div style={{ 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        border: '1px solid #dee2e6',
        borderRadius: '4px'
      }}>
        <h2>Current Status</h2>
        
        {status === null ? (
          <p>Loading...</p>
        ) : status.success && status.metadata ? (
          <div>
            <p><strong>Generated:</strong> <span suppressHydrationWarning>{new Date(status.metadata.generatedAt).toLocaleString()}</span></p>
            <p><strong>Age:</strong> {status.metadata.ageHours.toFixed(1)} hours</p>
            <p><strong>Total URLs:</strong> {status.metadata.totalUrls.toLocaleString()}</p>
            <p><strong>Sitemap Files:</strong> {status.metadata.sitemapCount}</p>
            {status.metadata.maxFileSize && (
              <p><strong>Max File Size:</strong> {(status.metadata.maxFileSize / 1024).toFixed(1)} KB</p>
            )}
            {status.metadata.priorityRange && (
              <p><strong>Priority Range:</strong> {status.metadata.priorityRange.min.toFixed(2)} - {status.metadata.priorityRange.max.toFixed(2)}</p>
            )}
            <p><strong>Status:</strong> 
              <span style={{ 
                color: status.metadata.ageHours > 3 ? '#dc3545' : '#28a745',
                fontWeight: 'bold',
                marginLeft: '5px'
              }}>
                {status.metadata.ageHours > 3 ? 'STALE' : 'FRESH'}
              </span>
            </p>
            
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer' }}>Sitemap Files ({status.metadata.sitemapFiles.length})</summary>
              <ul style={{ marginTop: '10px' }}>
                {status.metadata.sitemapFiles.map((file, index) => (
                  <li key={index}>
                    <a 
                      href={`/sitemaps/${file}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#007bff', textDecoration: 'none' }}
                    >
                      {file}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        ) : (
          <p style={{ color: '#dc3545' }}>❌ {status?.error || 'No sitemap data available'}</p>
        )}
      </div>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#6c757d' }}>
        <p><strong>Automatic Schedule:</strong> Every 3 hours</p>
        <p><strong>Cache Duration:</strong> 3 hours</p>
        <p><strong>URLs per File:</strong> 1000</p>
        <p><strong>Sort Order:</strong> By creation date (newest first)</p>
        <p><strong>Priority Formula:</strong> 0.6 + 0.3 × (file_size / max_file_size)</p>
        <p><strong>Main Sitemap:</strong> <a href="/sitemap.xml" target="_blank">/sitemap.xml</a></p>
      </div>
    </div>
  )
}