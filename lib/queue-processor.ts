import { getNextFromQueue, addToQueue } from './queue'
import { getPageMDC } from './content'

let isProcessing = false
let intervalId: NodeJS.Timeout | null = null
let isStarted = false

export function startQueueProcessor(): void {
  if (intervalId || isStarted) {
    return
  }
  
  isStarted = true
  console.log('[QUEUE PROCESSOR] Starting queue processor (45 seconds interval)')
  
  intervalId = setInterval(async () => {
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
        const mdcContent = await getPageMDC(slug, true)
        
        if (mdcContent) {
          console.log(`[QUEUE PROCESSOR] Successfully generated: ${slug}`)
        } else {
          console.warn(`[QUEUE PROCESSOR] Failed to generate: ${slug}`)
        }
      } catch (error: any) {
        if (error.message === 'RATE_LIMIT_EXCEEDED') {
          console.log(`[QUEUE PROCESSOR] Rate limit exceeded for: ${slug}, re-adding to queue`)
          const { addToQueue } = await import('./queue')
          await addToQueue(slug)
        } else {
          console.error(`[QUEUE PROCESSOR] Error processing ${slug}:`, error)
        }
      }
    } catch (error) {
      console.error('[QUEUE PROCESSOR] Error:', error)
    } finally {
      isProcessing = false
    }
  }, 45 * 1000)
}

export function stopQueueProcessor(): void {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
    isStarted = false
    console.log('[QUEUE PROCESSOR] Stopped')
  }
}

