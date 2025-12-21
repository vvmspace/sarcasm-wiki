// Серверная функция для получения данных производительности при SSR
export interface PerformanceData {
  cacheStats: {
    sharedCacheSize: number
    fileCacheSize: number
    markdownCacheSize: number
  }
  serverMetrics: {
    startupTime: number
    memoryUsage: number
    cacheHitRate: number
  }
  timestamp: string
}

// Глобальные переменные для отслеживания кэшей
declare global {
  var __performanceStats: {
    sharedCacheAccess: number
    sharedCacheHits: number
    fileCacheAccess: number
    fileCacheHits: number
  } | undefined
}

export function trackCacheHit(cacheType: 'shared' | 'file', isHit: boolean) {
  if (!global.__performanceStats) {
    global.__performanceStats = {
      sharedCacheAccess: 0,
      sharedCacheHits: 0,
      fileCacheAccess: 0,
      fileCacheHits: 0
    }
  }
  
  if (cacheType === 'shared') {
    global.__performanceStats.sharedCacheAccess++
    if (isHit) global.__performanceStats.sharedCacheHits++
  } else {
    global.__performanceStats.fileCacheAccess++
    if (isHit) global.__performanceStats.fileCacheHits++
  }
}

export async function getPerformanceData(): Promise<PerformanceData> {
  const memoryUsage = process.memoryUsage()
  
  // Вычисляем реальный cache hit rate
  let cacheHitRate = 85 // Базовое значение
  if (global.__performanceStats) {
    const totalAccess = global.__performanceStats.sharedCacheAccess + global.__performanceStats.fileCacheAccess
    const totalHits = global.__performanceStats.sharedCacheHits + global.__performanceStats.fileCacheHits
    if (totalAccess > 0) {
      cacheHitRate = Math.round((totalHits / totalAccess) * 100)
    }
  }
  
  return {
    cacheStats: {
      sharedCacheSize: Math.floor(Math.random() * 100) + 50, // Можно заменить на реальные данные
      fileCacheSize: Math.floor(Math.random() * 50) + 20,
      markdownCacheSize: Math.floor(Math.random() * 200) + 100
    },
    serverMetrics: {
      startupTime: Date.now() - (process.uptime() * 1000),
      memoryUsage: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      cacheHitRate
    },
    timestamp: new Date().toISOString()
  }
}