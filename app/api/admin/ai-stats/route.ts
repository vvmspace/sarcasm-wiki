import { NextResponse } from 'next/server'
import { getAIManager } from '@/lib/ai-providers'
import { getAIStats, rebuildAIStats } from '@/lib/ai-stats'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rebuild = searchParams.get('rebuild') === 'true'
    
    const aiManager = getAIManager()
    const managerStats = aiManager.getStats()
    
    // Test a simple generation to verify providers are working
    let testResult = null
    try {
      testResult = await aiManager.generateContent(
        'Say "AI providers working" in exactly those words.',
        'You are a test assistant. Respond with exactly what the user asks for.'
      )
    } catch (error: any) {
      testResult = `Error: ${error.message}`
    }
    
    // Get AI provider usage statistics from cache
    let providerUsageStats
    try {
      if (rebuild) {
        console.log('[AI-STATS] Rebuilding statistics from all articles...')
        await rebuildAIStats()
      }
      
      providerUsageStats = await getAIStats()
    } catch (error: any) {
      console.error('Error getting AI usage stats:', error)
      providerUsageStats = { 
        error: error.message,
        totalArticlesWithAI: 0,
        totalArticles: 0,
        providerCounts: {},
        modelCounts: {},
        providerModelBreakdown: {},
        contentTypeCounts: { rewritten: 0, created: 0 },
        originalContentCounts: { original: 0, rewritten: 0 },
        topProvider: 'none',
        topModel: 'none',
        lastUpdated: new Date().toISOString()
      }
    }
    
    return NextResponse.json({
      success: true,
      ...managerStats,
      testGeneration: testResult,
      providerUsage: providerUsageStats,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error getting AI stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get AI stats',
        availableProviders: 0,
        providers: [],
        testGeneration: null,
        providerUsage: null
      },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'