// Server component for displaying performance statistics
// Renders only on server, once per page

export default async function ServerPerformanceStats() {
  // Get performance data on server
  const memoryUsage = process.memoryUsage()
  const uptime = process.uptime()
  
  const stats = {
    memoryUsage: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
    uptime: Math.round(uptime), // seconds
    timestamp: new Date().toISOString(),
    status: 'lightning' as const
  }

  return (
    <div 
      suppressHydrationWarning
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '10px 14px',
        borderRadius: '8px',
        fontSize: '11px',
        fontFamily: 'monospace',
        zIndex: 1000,
        border: '2px solid #00ff00',
        boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)',
        display: 'none' // Hidden by default, shown on footer hover
      }}
      className="server-perf-stats"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{ fontSize: '16px' }}>⚡</span>
        <span style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '13px' }}>LIGHTNING</span>
        <span style={{ 
          background: '#00ff00', 
          color: '#000', 
          padding: '2px 6px', 
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 'bold'
        }}>
          GREEN ZONE
        </span>
      </div>
      <div style={{ opacity: 0.9 }}>Memory: {stats.memoryUsage} MB</div>
      <div style={{ opacity: 0.9 }}>Uptime: {stats.uptime}s</div>
      <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '4px' }}>
        SSR: {new Date(stats.timestamp).toLocaleTimeString()}
      </div>
    </div>
  )
}