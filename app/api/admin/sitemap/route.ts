import { NextRequest, NextResponse } from 'next/server'
import { triggerSitemapGeneration } from '../../../../lib/cron-scheduler'

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication here
    // const authHeader = request.headers.get('authorization')
    // if (authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    console.log('[API] Manual sitemap generation requested')
    const result = await triggerSitemapGeneration()
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: result.message,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.message 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('[API] Error in manual sitemap generation:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    
    const metadataPath = path.join(process.cwd(), 'public', 'sitemaps', 'metadata.json')
    
    try {
      const content = await fs.readFile(metadataPath, 'utf-8')
      const metadata = JSON.parse(content)
      
      return NextResponse.json({
        success: true,
        metadata: {
          ...metadata,
          age: Date.now() - new Date(metadata.generatedAt).getTime(),
          ageHours: Math.round((Date.now() - new Date(metadata.generatedAt).getTime()) / (1000 * 60 * 60) * 100) / 100
        }
      })
    } catch {
      return NextResponse.json({
        success: false,
        error: 'No sitemap metadata found'
      }, { status: 404 })
    }
  } catch (error) {
    console.error('[API] Error getting sitemap status:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}