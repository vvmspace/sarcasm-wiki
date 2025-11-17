import fs from 'fs/promises'
import path from 'path'

const QUEUE_DIR = path.join(process.cwd(), '.temp')
const QUEUE_FILE = path.join(QUEUE_DIR, 'generation-queue.json')
const STATS_FILE = path.join(QUEUE_DIR, 'generation-stats.json')

interface QueueItem {
  slug: string
  addedAt: string
}

interface GenerationStats {
  inStack: number
  generated: number
  lastGenerated?: string
}

async function ensureQueueDir(): Promise<void> {
  await fs.mkdir(QUEUE_DIR, { recursive: true })
}

export async function addToQueue(slug: string): Promise<boolean> {
  try {
    await ensureQueueDir()
    
    let queue: QueueItem[] = []
    try {
      const content = await fs.readFile(QUEUE_FILE, 'utf-8')
      queue = JSON.parse(content)
    } catch {
      // File doesn't exist, start with empty queue
    }
    
    const exists = queue.some(item => item.slug === slug)
    if (exists) {
      console.log(`[QUEUE] Slug ${slug} already in queue, skipping`)
      return false
    }
    
    queue.unshift({
      slug,
      addedAt: new Date().toISOString(),
    })
    
    await fs.writeFile(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf-8')
    
    console.log(`[QUEUE] Added ${slug} to queue. Queue size: ${queue.length}`)
    console.log(`[QUEUE] Queue after addition: [${queue.map(item => item.slug).join(', ')}]`)
    
    let stats: GenerationStats = { inStack: 0, generated: 0 }
    try {
      const content = await fs.readFile(STATS_FILE, 'utf-8')
      stats = JSON.parse(content)
    } catch {
      // File doesn't exist, will be created by updateStats
    }
    stats.inStack = queue.length
    await fs.writeFile(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8')
    
    return true
  } catch (error) {
    console.error('Error adding to queue:', error)
    return false
  }
}

export async function getNextFromQueue(): Promise<string | null> {
  try {
    await ensureQueueDir()
    
    let queue: QueueItem[] = []
    try {
      const content = await fs.readFile(QUEUE_FILE, 'utf-8')
      queue = JSON.parse(content)
    } catch {
      return null
    }
    
    if (queue.length === 0) {
      console.log('[QUEUE] Queue is empty')
      return null
    }
    
    console.log(`[QUEUE] Getting next from queue. Queue before removal (${queue.length} items): [${queue.map(item => item.slug).join(', ')}]`)
    
    const item = queue.shift()!
    await fs.writeFile(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf-8')
    
    console.log(`[QUEUE] Removed ${item.slug} from queue. Queue after removal (${queue.length} items): [${queue.map(item => item.slug).join(', ')}]`)
    
    let stats: GenerationStats = { inStack: 0, generated: 0 }
    try {
      const content = await fs.readFile(STATS_FILE, 'utf-8')
      stats = JSON.parse(content)
    } catch {
      // File doesn't exist, will be created by updateStats
    }
    stats.inStack = queue.length
    if (stats.lastGenerated) {
      // Preserve lastGenerated when updating inStack
    }
    await fs.writeFile(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8')
    
    return item.slug
  } catch (error) {
    console.error('Error getting from queue:', error)
    return null
  }
}

export async function getQueueLength(): Promise<number> {
  try {
    await ensureQueueDir()
    
    let queue: QueueItem[] = []
    try {
      const content = await fs.readFile(QUEUE_FILE, 'utf-8')
      queue = JSON.parse(content)
    } catch {
      return 0
    }
    
    return queue.length
  } catch (error) {
    console.error('Error getting queue length:', error)
    return 0
  }
}

export async function isInQueue(slug: string): Promise<boolean> {
  try {
    await ensureQueueDir()
    
    let queue: QueueItem[] = []
    try {
      const content = await fs.readFile(QUEUE_FILE, 'utf-8')
      queue = JSON.parse(content)
    } catch {
      return false
    }
    
    return queue.some(item => item.slug === slug)
  } catch (error) {
    console.error('Error checking queue:', error)
    return false
  }
}

export async function updateStats(lastGeneratedSlug?: string): Promise<void> {
  try {
    await ensureQueueDir()
    
    const inStack = await getQueueLength()
    
    let stats: GenerationStats = { inStack: 0, generated: 0 }
    try {
      const content = await fs.readFile(STATS_FILE, 'utf-8')
      stats = JSON.parse(content)
    } catch {
      // File doesn't exist, start with defaults
    }
    
    let generated = 0
    try {
      const { countArticles } = await import('./content')
      generated = await countArticles()
    } catch (error) {
      console.error('Error counting articles:', error)
    }
    
    stats.inStack = inStack
    stats.generated = generated
    if (lastGeneratedSlug) {
      stats.lastGenerated = lastGeneratedSlug
    }
    
    await fs.writeFile(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error updating stats:', error)
  }
}

export async function incrementGenerated(): Promise<void> {
  await updateStats()
}

export async function getStats(): Promise<GenerationStats> {
  try {
    await ensureQueueDir()
    
    const inStack = await getQueueLength()
    
    let stats: GenerationStats = { inStack: 0, generated: 0 }
    try {
      const content = await fs.readFile(STATS_FILE, 'utf-8')
      stats = JSON.parse(content)
    } catch {
      await updateStats()
      try {
        const content = await fs.readFile(STATS_FILE, 'utf-8')
        stats = JSON.parse(content)
      } catch {
        return { inStack: 0, generated: 0 }
      }
    }
    
    stats.inStack = inStack
    
    if (stats.generated === 0 || !stats.lastGenerated) {
      try {
        const { countArticles, getLatestArticles } = await import('./content')
        stats.generated = await countArticles()
        
        if (stats.generated > 0 && !stats.lastGenerated) {
          const latestArticles = await getLatestArticles(1)
          if (latestArticles.length > 0) {
            stats.lastGenerated = latestArticles[0].slug
          }
        }
      } catch (error) {
        console.error('Error getting articles for stats:', error)
      }
    }
    
    return stats
  } catch (error) {
    console.error('Error getting stats:', error)
    return { inStack: 0, generated: 0 }
  }
}

