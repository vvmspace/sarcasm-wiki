import { NextResponse } from 'next/server'
import { getStats } from '@/lib/queue'

export async function GET() {
  try {
    const stats = await getStats()
    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('Error getting queue stats:', error)
    return NextResponse.json(
      { inStack: 0, generated: 0 },
      { status: 500 }
    )
  }
}

