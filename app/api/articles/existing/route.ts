import { NextResponse } from 'next/server'
import { getExistingArticlesSlugs } from '@/lib/content'

export async function GET() {
  try {
    const existingSlugs = await getExistingArticlesSlugs()
    
    return NextResponse.json({
      success: true,
      count: existingSlugs.size,
      articles: Array.from(existingSlugs).sort()
    })
  } catch (error) {
    console.error('Error getting existing articles:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get existing articles' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'