import { NextResponse } from 'next/server'
import { getLatestArticles } from '@/lib/content'

export async function GET() {
  try {
    const articles = await getLatestArticles(3)
    return NextResponse.json(articles.map(article => ({
      slug: article.slug,
      title: article.title,
    })))
  } catch (error: any) {
    console.error('Error getting latest articles:', error)
    return NextResponse.json(
      [],
      { status: 500 }
    )
  }
}

