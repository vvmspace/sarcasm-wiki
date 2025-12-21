'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  cacheHits: number
  status: 'lightning' | 'fast' | 'slow'
}

function PerformanceMonitorClient() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [showMetrics, setShowMetrics] = useState(false)

  useEffect(() => {
    // Lightning performance monitoring ⚡
    const startTime = performance.now()
    
    const measurePerformance = () => {
      const loadTime = performance.now() - startTime
      const renderTime = performance.getEntriesByType('measure').length
      
      // Simulate cache hit detection (in real app, this would come from server)
      const cacheHits = Math.floor(Math.random() * 10) + 5
      
      let status: 'lightning' | 'fast' | 'slow' = 'slow'
      if (loadTime < 100) status = 'lightning'
      else if (loadTime < 300) status = 'fast'
      
      setMetrics({
        loadTime: Math.round(loadTime),
        renderTime,
        cacheHits,
        status
      })
    }

    // Measure after initial render
    const timer = setTimeout(measurePerformance, 100)
    
    // Show metrics on key combination (Ctrl+Shift+P)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setShowMetrics(!showMetrics)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [showMetrics])

  if (!showMetrics || !metrics) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lightning': return '#00ff00' // Green
      case 'fast': return '#ffff00' // Yellow
      default: return '#ff0000' // Red
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'lightning': return '⚡'
      case 'fast': return '🚀'
      default: return '🐌'
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      border: `2px solid ${getStatusColor(metrics.status)}`,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        {getStatusIcon(metrics.status)} 
        <span style={{ color: getStatusColor(metrics.status) }}>
          {metrics.status.toUpperCase()}
        </span>
      </div>
      
      <div>Load: {metrics.loadTime}ms</div>
      <div>Renders: {metrics.renderTime}</div>
      <div>Cache hits: {metrics.cacheHits}</div>
      
      <div style={{ 
        marginTop: '8px', 
        fontSize: '10px', 
        opacity: 0.7 
      }}>
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  )
}

// Динамический импорт только для клиента
const PerformanceMonitor = dynamic(() => Promise.resolve(PerformanceMonitorClient), {
  ssr: false
})

export default PerformanceMonitor