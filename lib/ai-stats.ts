import fs from 'fs/promises'
import path from 'path'

const CACHE_DIR = path.join(process.cwd(), '.temp')
const AI_STATS_CACHE = path.join(CACHE_DIR, 'ai-stats.json')

export interface AIStatsData {
  totalArticlesWithAI: number
  totalArticles: number
  providerCounts: Record<string, number>
  modelCounts: Record<string, number>
  providerModelBreakdown: Record<string, Record<string, number>>
  contentTypeCounts: { rewritten: number, created: number }
  originalContentCounts: { original: number, rewritten: number }
  topProvider: string
  topModel: string
  lastUpdated: string
}

/**
 * Читает статистику AI из кэша
 */
export async function getAIStats(): Promise<AIStatsData> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true })
    const content = await fs.readFile(AI_STATS_CACHE, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    // Если файл не существует, возвращаем пустую статистику
    return {
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
}

/**
 * Сохраняет статистику AI в кэш
 */
async function saveAIStats(stats: AIStatsData): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true })
    await fs.writeFile(AI_STATS_CACHE, JSON.stringify(stats, null, 2), 'utf-8')
    console.log(`[AI-STATS] Statistics saved: ${stats.totalArticlesWithAI} articles with AI metadata`)
  } catch (error) {
    console.error('[AI-STATS] Error saving statistics:', error)
  }
}

/**
 * Вычисляет топ провайдера и модели
 */
function calculateTopItems(stats: AIStatsData): void {
  // Топ провайдер
  const providerEntries = Object.entries(stats.providerCounts)
  if (providerEntries.length > 0) {
    stats.topProvider = providerEntries.sort(([,a], [,b]) => b - a)[0][0]
  } else {
    stats.topProvider = 'none'
  }

  // Топ модель
  const modelEntries = Object.entries(stats.modelCounts)
  if (modelEntries.length > 0) {
    stats.topModel = modelEntries.sort(([,a], [,b]) => b - a)[0][0]
  } else {
    stats.topModel = 'none'
  }
}

/**
 * Обновляет статистику при добавлении новой статьи
 */
export async function updateAIStatsOnAdd(metadata: {
  aiProvider?: string
  aiModel?: string
  contentType?: 'rewritten' | 'created'
  isOriginalContent?: boolean
}): Promise<void> {
  try {
    const stats = await getAIStats()
    
    // Увеличиваем общее количество статей
    stats.totalArticles++
    
    // Если есть AI метаданные
    if (metadata.aiProvider) {
      stats.totalArticlesWithAI++
      
      // Обновляем счетчик провайдера
      stats.providerCounts[metadata.aiProvider] = (stats.providerCounts[metadata.aiProvider] || 0) + 1
      
      // Обновляем счетчик модели
      if (metadata.aiModel) {
        stats.modelCounts[metadata.aiModel] = (stats.modelCounts[metadata.aiModel] || 0) + 1
        
        // Обновляем разбивку провайдер-модель
        if (!stats.providerModelBreakdown[metadata.aiProvider]) {
          stats.providerModelBreakdown[metadata.aiProvider] = {}
        }
        stats.providerModelBreakdown[metadata.aiProvider][metadata.aiModel] = 
          (stats.providerModelBreakdown[metadata.aiProvider][metadata.aiModel] || 0) + 1
      }
    }
    
    // Обновляем счетчики типов контента
    if (metadata.contentType) {
      stats.contentTypeCounts[metadata.contentType]++
    }
    
    // Обновляем счетчики оригинального контента
    if (metadata.isOriginalContent === true) {
      stats.originalContentCounts.original++
    } else if (metadata.isOriginalContent === false) {
      stats.originalContentCounts.rewritten++
    }
    
    // Обновляем топ провайдера и модели
    calculateTopItems(stats)
    
    stats.lastUpdated = new Date().toISOString()
    await saveAIStats(stats)
  } catch (error) {
    console.error('[AI-STATS] Error updating statistics on add:', error)
  }
}

/**
 * Обновляет статистику при обновлении существующей статьи
 */
export async function updateAIStatsOnUpdate(
  oldMetadata: {
    aiProvider?: string
    aiModel?: string
    contentType?: 'rewritten' | 'created'
    isOriginalContent?: boolean
  },
  newMetadata: {
    aiProvider?: string
    aiModel?: string
    contentType?: 'rewritten' | 'created'
    isOriginalContent?: boolean
  }
): Promise<void> {
  try {
    const stats = await getAIStats()
    
    // Удаляем старые данные
    if (oldMetadata.aiProvider) {
      stats.totalArticlesWithAI--
      stats.providerCounts[oldMetadata.aiProvider] = Math.max(0, (stats.providerCounts[oldMetadata.aiProvider] || 0) - 1)
      
      if (oldMetadata.aiModel) {
        stats.modelCounts[oldMetadata.aiModel] = Math.max(0, (stats.modelCounts[oldMetadata.aiModel] || 0) - 1)
        
        if (stats.providerModelBreakdown[oldMetadata.aiProvider]?.[oldMetadata.aiModel]) {
          stats.providerModelBreakdown[oldMetadata.aiProvider][oldMetadata.aiModel] = 
            Math.max(0, stats.providerModelBreakdown[oldMetadata.aiProvider][oldMetadata.aiModel] - 1)
        }
      }
    }
    
    if (oldMetadata.contentType) {
      stats.contentTypeCounts[oldMetadata.contentType] = Math.max(0, stats.contentTypeCounts[oldMetadata.contentType] - 1)
    }
    
    if (oldMetadata.isOriginalContent === true) {
      stats.originalContentCounts.original = Math.max(0, stats.originalContentCounts.original - 1)
    } else if (oldMetadata.isOriginalContent === false) {
      stats.originalContentCounts.rewritten = Math.max(0, stats.originalContentCounts.rewritten - 1)
    }
    
    // Добавляем новые данные
    if (newMetadata.aiProvider) {
      stats.totalArticlesWithAI++
      stats.providerCounts[newMetadata.aiProvider] = (stats.providerCounts[newMetadata.aiProvider] || 0) + 1
      
      if (newMetadata.aiModel) {
        stats.modelCounts[newMetadata.aiModel] = (stats.modelCounts[newMetadata.aiModel] || 0) + 1
        
        if (!stats.providerModelBreakdown[newMetadata.aiProvider]) {
          stats.providerModelBreakdown[newMetadata.aiProvider] = {}
        }
        stats.providerModelBreakdown[newMetadata.aiProvider][newMetadata.aiModel] = 
          (stats.providerModelBreakdown[newMetadata.aiProvider][newMetadata.aiModel] || 0) + 1
      }
    }
    
    if (newMetadata.contentType) {
      stats.contentTypeCounts[newMetadata.contentType]++
    }
    
    if (newMetadata.isOriginalContent === true) {
      stats.originalContentCounts.original++
    } else if (newMetadata.isOriginalContent === false) {
      stats.originalContentCounts.rewritten++
    }
    
    // Обновляем топ провайдера и модели
    calculateTopItems(stats)
    
    stats.lastUpdated = new Date().toISOString()
    await saveAIStats(stats)
  } catch (error) {
    console.error('[AI-STATS] Error updating statistics on update:', error)
  }
}

/**
 * Полная перестройка статистики из всех статей (для миграции или восстановления)
 */
export async function rebuildAIStats(): Promise<void> {
  try {
    console.log('[AI-STATS] Starting full statistics rebuild...')
    const { getAllArticles } = await import('./content')
    const articles = await getAllArticles()
    
    const stats: AIStatsData = {
      totalArticlesWithAI: 0,
      totalArticles: articles.length,
      providerCounts: {},
      modelCounts: {},
      providerModelBreakdown: {},
      contentTypeCounts: { rewritten: 0, created: 0 },
      originalContentCounts: { original: 0, rewritten: 0 },
      topProvider: 'none',
      topModel: 'none',
      lastUpdated: new Date().toISOString()
    }
    
    articles.forEach(article => {
      // Подсчет типов контента
      if (article.contentType) {
        stats.contentTypeCounts[article.contentType]++
      }
      
      // Подсчет оригинального контента
      if (article.isOriginalContent === true) {
        stats.originalContentCounts.original++
      } else if (article.isOriginalContent === false) {
        stats.originalContentCounts.rewritten++
      }
      
      if (article.aiProvider) {
        stats.totalArticlesWithAI++
        stats.providerCounts[article.aiProvider] = (stats.providerCounts[article.aiProvider] || 0) + 1
        
        if (!stats.providerModelBreakdown[article.aiProvider]) {
          stats.providerModelBreakdown[article.aiProvider] = {}
        }
        
        if (article.aiModel) {
          stats.modelCounts[article.aiModel] = (stats.modelCounts[article.aiModel] || 0) + 1
          stats.providerModelBreakdown[article.aiProvider][article.aiModel] = 
            (stats.providerModelBreakdown[article.aiProvider][article.aiModel] || 0) + 1
        }
      }
    })
    
    calculateTopItems(stats)
    await saveAIStats(stats)
    
    console.log(`[AI-STATS] Rebuild complete: ${stats.totalArticlesWithAI}/${stats.totalArticles} articles with AI metadata`)
  } catch (error) {
    console.error('[AI-STATS] Error rebuilding statistics:', error)
    throw error
  }
}
