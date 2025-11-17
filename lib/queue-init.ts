import { startQueueProcessor } from './queue-processor'

let initialized = false

export function initQueueProcessor(): void {
  if (initialized) {
    return
  }
  
  if (typeof window === 'undefined') {
    startQueueProcessor()
    initialized = true
    console.log('[QUEUE INIT] Queue processor initialized')
  }
}

if (typeof window === 'undefined') {
  initQueueProcessor()
}

