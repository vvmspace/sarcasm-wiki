import { NextResponse } from 'next/server'
import { getSecurityStats } from '@/lib/security-logger'

export async function GET() {
  try {
    const stats = await getSecurityStats()
    
    return NextResponse.json({
      success: true,
      ...stats
    })
  } catch (error) {
    console.error('Error getting security stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get security stats' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'