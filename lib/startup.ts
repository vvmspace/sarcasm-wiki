import { startCronScheduler } from './cron-scheduler'
import { initQueueProcessor } from './queue-init'
import { startHomeStateRebuildListener } from './home-state'

let isStartupComplete = false

export function runStartupTasks() {
  if (isStartupComplete) {
    console.log('[STARTUP] Startup tasks already completed')
    return
  }

  console.log('[STARTUP] Running startup tasks...')

  // Listen for rebuild events for prebuilt JSON state (e.g. home page)
  startHomeStateRebuildListener()

  // Initialize queue processor
  initQueueProcessor()

  // Start cron scheduler
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
    startCronScheduler()
  } else {
    console.log('[STARTUP] Cron scheduler disabled in development mode')
    console.log('[STARTUP] Set ENABLE_CRON=true to enable in development')
  }

  isStartupComplete = true
  console.log('[STARTUP] Startup tasks completed')
}

// Auto-run on import in production
if (typeof window === 'undefined') { // Server-side only
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
    // Delay startup to ensure everything is initialized
    setTimeout(() => {
      runStartupTasks()
    }, 1000)
  }
}