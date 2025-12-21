'use client'

import { useState } from 'react'
import Link from 'next/link'
import { type PerformanceData } from '@/lib/performance-data'

interface QueueStats {
  inStack: number
  generated: number
  lastGenerated?: string
}

interface ClientLayoutProps {
  children: React.ReactNode
  queueStats: QueueStats
  performanceData: PerformanceData
}

export default function ClientLayout({ children, queueStats, performanceData }: ClientLayoutProps) {
  const [showPerformance, setShowPerformance] = useState(false)

  // Обработчик клавиш для показа метрик производительности
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      setShowPerformance(!showPerformance)
    }
  }

  const getPerformanceStatus = () => {
    const hitRate = performanceData.serverMetrics.cacheHitRate
    if (hitRate >= 90) return { status: 'lightning', color: '#00ff00', icon: '⚡' }
    if (hitRate >= 75) return { status: 'fast', color: '#ffff00', icon: '🚀' }
    return { status: 'slow', color: '#ff0000', icon: '🐌' }
  }

  const perfStatus = getPerformanceStatus()

  return (
    <div onKeyDown={handleKeyPress} tabIndex={-1} style={{ outline: 'none' }}>
      {children}
      
      {/* Queue Status Footer */}
      <footer className="footer" suppressHydrationWarning>
        <div className="footer-content">
          <div className="footer-stats">
            <div className="stat">
              <span className="stat-label">In Queue</span>
              <span className="stat-value">{queueStats.inStack}</span>
            </div>
            
            <div className="stat">
              <span className="stat-label">Generated</span>
              <span className="stat-value">{queueStats.generated}</span>
            </div>
            
            {queueStats.lastGenerated && (
              <div className="stat">
                <span className="stat-label">Latest</span>
                <Link
                  href={`/${encodeURIComponent(queueStats.lastGenerated)}`}
                  className="stat-link"
                >
                  {queueStats.lastGenerated.replace(/_/g, ' ')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* Performance Monitor */}
      {showPerformance && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 9999,
          border: `2px solid ${perfStatus.color}`,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          minWidth: '250px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '12px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {perfStatus.icon} 
            <span style={{ color: perfStatus.color }}>
              {perfStatus.status.toUpperCase()}
            </span>
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <strong>Cache Stats:</strong>
          </div>
          <div>Shared Cache: {performanceData.cacheStats.sharedCacheSize} items</div>
          <div>File Cache: {performanceData.cacheStats.fileCacheSize} items</div>
          <div>Markdown Cache: {performanceData.cacheStats.markdownCacheSize} items</div>
          
          <div style={{ marginTop: '8px', marginBottom: '8px' }}>
            <strong>Server Metrics:</strong>
          </div>
          <div>Memory: {performanceData.serverMetrics.memoryUsage} MB</div>
          <div>Cache Hit Rate: {performanceData.serverMetrics.cacheHitRate}%</div>
          
          <div style={{ 
            marginTop: '12px', 
            fontSize: '10px', 
            opacity: 0.7,
            borderTop: '1px solid #333',
            paddingTop: '8px'
          }}>
            <div>Generated: {new Date(performanceData.timestamp).toLocaleTimeString()}</div>
            <div>Press Ctrl+Shift+P to toggle</div>
          </div>
        </div>
      )}
    </div>
  )
}