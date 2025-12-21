// Серверный компонент для отображения статистики производительности
// Рендерится только на сервере, один раз на страницу

export default async function ServerPerformanceStats() {
  // Получаем данные производительности на сервере
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
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '11px',
        fontFamily: 'monospace',
        zIndex: 1000,
        border: '1px solid #00ff00',
        display: 'none' // Скрыто по умолчанию
      }}
      className="server-perf-stats"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <span>⚡</span>
        <span style={{ color: '#00ff00', fontWeight: 'bold' }}>LIGHTNING</span>
      </div>
      <div>Memory: {stats.memoryUsage} MB</div>
      <div>Uptime: {stats.uptime}s</div>
      <div style={{ fontSize: '9px', opacity: 0.7, marginTop: '4px' }}>
        SSR: {new Date(stats.timestamp).toLocaleTimeString()}
      </div>
    </div>
  )
}