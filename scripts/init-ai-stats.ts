#!/usr/bin/env tsx

/**
 * Скрипт для инициализации статистики AI
 * Запуск: npx tsx scripts/init-ai-stats.ts
 */

import { rebuildAIStats } from '../lib/ai-stats'

async function main() {
  console.log('🚀 Initializing AI statistics...')
  
  try {
    await rebuildAIStats()
    console.log('✅ AI statistics initialized successfully!')
  } catch (error) {
    console.error('❌ Error initializing AI statistics:', error)
    process.exit(1)
  }
}

main()