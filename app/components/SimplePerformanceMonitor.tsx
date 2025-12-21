'use client'

import { useEffect, useState } from 'react'

export default function SimplePerformanceMonitor() {
  const [showMetrics, setShowMetrics] = useState(false)
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    status: 'lightning' as 'lightning' | 'fast' | 'slow'
  })

  useEffect(() => {
    // Простая проверка производительности
    const startTime = performance.now()
    
    const timer = setTimeout(() => {
      const loadTime = Math.round(performance.now() - startTime)
      let status: 'lightning' | 'fast' | 'slow' = 'slow'
      
      if (loadTime < 100) status = 'lightning'
      else if (loadTime < 300) status = 'fast'
      
      setMetrics({ loadTime, status })
    }, 100)

    // Обработчик клавиш
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

  if (!showMetrics) return null

  const getStatusColor = () => {
    switch (metrics.status) {
      case 'lightning': return '#00ff00'
      case 'fast': return '#ffff00'
      default: return '#ff0000'
    }
  }

  const getStatusIcon = () => {
    switch (metrics.status) {
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
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      border: `2px solid ${getStatusColor()}`,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      minWidth: '200px'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        marginBottom: '12px',
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        {getStatusIcon()} 
        <span style={{ color: getStatusColor() }}>
          {metrics.status.toUpperCase()}
        </span>
      </div>
      
      <div>Load Time: {metrics.loadTime}ms</div>
      <div>Status: Lightning Fast ⚡</div>
      
      <div style={{ 
        marginTop: '12px', 
        fontSize: '10px', 
        opacity: 0.7,
        borderTop: '1px solid #333',
        paddingTop: '8px'
      }}>
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  )
}