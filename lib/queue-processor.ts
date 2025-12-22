import { getNextFromQueue, addToQueue } from './queue'
import { getPageMDC } from './content'

declare global {
  var __queueProcessorIntervalId: NodeJS.Timeout | null | undefined
  var __queueProcessorStarted: boolean | undefined
}

let isProcessing = false

export function startQueueProcessor(): void {
  if (global.__queueProcessorIntervalId || global.__queueProcessorStarted) {
    return
  }
  
  global.__queueProcessorStarted = true
  console.log('[QUEUE PROCESSOR] Starting queue processor (120 seconds interval)')
  
  global.__queueProcessorIntervalId = setInterval(async () => {
    if (isProcessing) {
      console.log('[QUEUE PROCESSOR] Already processing, skipping')
      return
    }
    
    isProcessing = true
    
    try {
      const slug = await getNextFromQueue()
      
      if (!slug) {
        console.log('[QUEUE PROCESSOR] Queue is empty')
        isProcessing = false
        return
      }
      
      console.log(`[QUEUE PROCESSOR] Processing: ${slug}`)
      
      try {
        const mdcContent = await getPageMDC(slug, true, true)
        
        if (mdcContent) {
          console.log(`[QUEUE PROCESSOR] Successfully generated: ${slug}`)
        } else {
          console.warn(`[QUEUE PROCESSOR] Failed to generate: ${slug} (not found on Wikipedia and invalid for mini-article)`)
          // Do NOT re-add to queue if it simply doesn't exist
        }
      } catch (error: any) {
        if (error.message === 'RATE_LIMIT_EXCEEDED' || error.message === 'API_ERROR' || error.message === 'GENERATE_ERROR' || error.message === 'REWRITE_ERROR') {
          console.log(`[QUEUE PROCESSOR] Retriable error (${error.message}) for: ${slug}, re-adding to queue`)
          await addToQueue(slug)
        } else {
          console.error(`[QUEUE PROCESSOR] Permanent or unknown error processing ${slug}:`, {
            message: error.message,
            stack: error.stack,
            error: error
          })
          // Don't re-add unknown errors to avoid infinite loops
        }
      }
    } catch (error) {
      console.error('[QUEUE PROCESSOR] Error:', error)
    } finally {
      isProcessing = false
    }
  }, 120 * 1000)
}

export function stopQueueProcessor(): void {
  if (global.__queueProcessorIntervalId) {
    clearInterval(global.__queueProcessorIntervalId)
    global.__queueProcessorIntervalId = null
    global.__queueProcessorStarted = false
    console.log('[QUEUE PROCESSOR] Stopped')
  }
}

