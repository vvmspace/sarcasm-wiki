import { NextResponse } from 'next/server'
import { getNextFromQueue, incrementGenerated } from '@/lib/queue'
import { getPageMDC } from '@/lib/content'

export async function POST() {
  try {
    const slug = await getNextFromQueue()
    
    if (!slug) {
      return NextResponse.json({ message: 'Queue is empty' })
    }
    
    console.log(`[QUEUE] Processing: ${slug}`)
    
    try {
      const mdcContent = await getPageMDC(slug, true)
      
      if (mdcContent) {
        await incrementGenerated()
        console.log(`[QUEUE] Successfully generated: ${slug}`)
        return NextResponse.json({ 
          success: true, 
          slug,
          message: `Generated: ${slug}` 
        })
      } else {
        console.warn(`[QUEUE] Failed to generate: ${slug}`)
        return NextResponse.json({ 
          success: false, 
          slug,
          message: `Failed to generate: ${slug}` 
        })
      }
    } catch (error: any) {
      if (error.message === 'RATE_LIMIT_EXCEEDED') {
        console.log(`[QUEUE] Rate limit exceeded for: ${slug}, re-adding to queue`)
        const { addToQueue } = await import('@/lib/queue')
        await addToQueue(slug)
        return NextResponse.json({ 
          success: false, 
          slug,
          message: 'Rate limit exceeded, re-queued' 
        }, { status: 429 })
      }
      
      console.error(`[QUEUE] Error processing ${slug}:`, error)
      return NextResponse.json({ 
        success: false, 
        slug,
        message: error.message || 'Unknown error' 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('[QUEUE] Error in process-queue:', error)
    return NextResponse.json({ 
      error: error.message || 'Unknown error' 
    }, { status: 500 })
  }
}

