import { startQueueProcessor } from './queue-processor'

declare global {
  var __queueProcessorInitialized: boolean | undefined
}

export function initQueueProcessor(): void {
  if (typeof window !== 'undefined') {
    return
  }
  
  if (global.__queueProcessorInitialized) {
    return
  }
  
  startQueueProcessor()
  global.__queueProcessorInitialized = true
  console.log('[QUEUE INIT] Queue processor initialized')
}

