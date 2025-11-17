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
      return false
    }
    
    queue.unshift({
      slug,
      addedAt: new Date().toISOString(),
    })
    
    await fs.writeFile(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf-8')
    await updateStats()
    
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
      return null
    }
    
    const item = queue.shift()!
    await fs.writeFile(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf-8')
    await updateStats()
    
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

async function updateStats(): Promise<void> {
  try {
    await ensureQueueDir()
    
    const inStack = await getQueueLength()
    
    let generated = 0
    try {
      const { getAllArticles } = await import('./content')
      const articles = await getAllArticles()
      generated = articles.length
    } catch (error) {
      console.error('Error counting articles:', error)
    }
    
    const stats: GenerationStats = { inStack, generated }
    await fs.writeFile(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error updating stats:', error)
  }
}

export async function incrementGenerated(): Promise<void> {
  try {
    await ensureQueueDir()
    
    const inStack = await getQueueLength()
    
    let generated = 0
    try {
      const { getAllArticles } = await import('./content')
      const articles = await getAllArticles()
      generated = articles.length
    } catch (error) {
      console.error('Error counting articles:', error)
    }
    
    const stats: GenerationStats = { inStack, generated }
    await fs.writeFile(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error updating generated count:', error)
  }
}

export async function getStats(): Promise<GenerationStats> {
  try {
    await ensureQueueDir()
    
    const inStack = await getQueueLength()
    
    let generated = 0
    try {
      const { getAllArticles } = await import('./content')
      const articles = await getAllArticles()
      generated = articles.length
    } catch (error) {
      console.error('Error counting articles:', error)
    }
    
    return { inStack, generated }
  } catch (error) {
    console.error('Error getting stats:', error)
    return { inStack: 0, generated: 0 }
  }
}

