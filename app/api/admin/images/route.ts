import { NextResponse } from 'next/server'
import { generateImageForLatestArticle, getImageStats, generateImageForArticle } from '@/lib/image-generator'
import { triggerImageGeneration } from '@/lib/cron-scheduler'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'stats') {
      // Get image statistics
      const stats = await getImageStats()
      
      return NextResponse.json({
        success: true,
        stats,
        timestamp: new Date().toISOString()
      })
    }
    
    if (action === 'generate') {
      // Manual image generation
      const result = await triggerImageGeneration()
      
      return NextResponse.json({
        success: result.success,
        message: result.message,
        slug: result.slug,
        timestamp: new Date().toISOString()
      })
    }
    
    // По умолчанию возвращаем статистику
    const stats = await getImageStats()
    
    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error in images API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process images request'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, slug, title } = body
    
    if (action === 'generate' && slug && title) {
      // Image generation for specific article
      const success = await generateImageForArticle(slug, title)
      
      return NextResponse.json({
        success,
        message: success 
          ? `Image generated successfully for: ${slug}`
          : `Failed to generate image for: ${slug}`,
        slug,
        timestamp: new Date().toISOString()
      })
    }
    
    if (action === 'generate-latest') {
      // Image generation for latest article without image
      const result = await generateImageForLatestArticle()
      
      return NextResponse.json({
        success: result.success,
        message: result.message,
        slug: result.slug,
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action or missing parameters' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error in images POST API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process images request'
      },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'