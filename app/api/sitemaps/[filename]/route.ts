import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const SITEMAP_DIR = path.join(process.cwd(), 'public', 'sitemaps')

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params
    
    // Validate filename for security
    if (!filename || filename.includes('..') || !filename.endsWith('.xml')) {
      return new NextResponse('Invalid filename', { status: 400 })
    }
    
    console.log(`[SITEMAP] Request for /sitemaps/${filename}`)
    
    const filePath = path.join(SITEMAP_DIR, filename)
    const content = await fs.readFile(filePath, 'utf-8')
    
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=10800', // 3 hours cache
      },
    })
    
  } catch (error) {
    console.error('[SITEMAP] Error serving sitemap file:', error)
    return new NextResponse('Sitemap not found', { status: 404 })
  }
}
