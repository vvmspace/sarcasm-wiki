import { getNextFromQueue, incrementGenerated } from './queue'
import { getPageMDC } from './content'

let isProcessing = false
let intervalId: NodeJS.Timeout | null = null

export function startQueueProcessor(): void {
  if (intervalId) {
    return
  }
  
  console.log('[QUEUE PROCESSOR] Starting queue processor (1 minute interval)')
  
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
          await incrementGenerated()
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
  }, 60 * 1000)
}

export function stopQueueProcessor(): void {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
    console.log('[QUEUE PROCESSOR] Stopped')
  }
}

