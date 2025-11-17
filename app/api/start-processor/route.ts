import { NextResponse } from 'next/server'
import { startQueueProcessor } from '@/lib/queue-processor'

export async function POST() {
  try {
    startQueueProcessor()
    return NextResponse.json({ message: 'Queue processor started' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

