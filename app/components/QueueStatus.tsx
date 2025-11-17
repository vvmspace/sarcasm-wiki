'use client'

import { useEffect, useState } from 'react'

export default function QueueStatus() {
  const [stats, setStats] = useState({ inStack: 0, generated: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/queue-stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching queue stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 5000)
    
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return null
  }

  return (
    <footer style={{
      marginTop: '3rem',
      padding: '1.5rem',
      borderTop: '1px solid #e0e0e0',
      textAlign: 'center',
      fontSize: '0.9rem',
      color: '#666'
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <span>
          <strong>In stack:</strong> {stats.inStack}
        </span>
        <span>
          <strong>Generated:</strong> {stats.generated}
        </span>
      </div>
    </footer>
  )
}

