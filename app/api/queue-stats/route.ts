import { NextResponse } from 'next/server'
import { getStats } from '@/lib/queue'

export const revalidate = 60

export async function GET() {
  try {
    const stats = await getStats()
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60',
      },
    })
  } catch (error: any) {
    console.error('Error getting queue stats:', error)
    return NextResponse.json(
      { inStack: 0, generated: 0, lastGenerated: undefined },
      { status: 500 }
    )
  }
}

