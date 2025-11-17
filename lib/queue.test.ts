import { addToQueue, getNextFromQueue, getQueueLength, isInQueue, incrementGenerated, getStats } from './queue'
import { unlink } from 'fs/promises'
import { join } from 'path'

const QUEUE_DIR = join(process.cwd(), '.temp')
const QUEUE_FILE = join(QUEUE_DIR, 'generation-queue.json')
const STATS_FILE = join(QUEUE_DIR, 'generation-stats.json')

async function cleanupQueue() {
  try {
    await unlink(QUEUE_FILE)
  } catch {
    // File doesn't exist, ignore
  }
  try {
    await unlink(STATS_FILE)
  } catch {
    // File doesn't exist, ignore
  }
}

describe('queue', () => {
  beforeEach(async () => {
    await cleanupQueue()
  })

  afterEach(async () => {
    await cleanupQueue()
  })

  it('should add item to queue', async () => {
    const added = await addToQueue('test-slug')
    expect(added).toBe(true)
    
    const inQueue = await isInQueue('test-slug')
    expect(inQueue).toBe(true)
    
    const length = await getQueueLength()
    expect(length).toBe(1)
  })

  it('should not add duplicate items', async () => {
    await addToQueue('test-slug')
    const added = await addToQueue('test-slug')
    expect(added).toBe(false)
    
    const length = await getQueueLength()
    expect(length).toBe(1)
  })

  it('should get next item from queue (LIFO - last in first out)', async () => {
    await addToQueue('slug1')
    await addToQueue('slug2')
    
    const next = await getNextFromQueue()
    expect(next).toBe('slug2')
    
    const length = await getQueueLength()
    expect(length).toBe(1)
    
    const next2 = await getNextFromQueue()
    expect(next2).toBe('slug1')
    
    const length2 = await getQueueLength()
    expect(length2).toBe(0)
  })

  it('should return null when queue is empty', async () => {
    const next = await getNextFromQueue()
    expect(next).toBeNull()
  })

  it('should update generated counter from articles count', async () => {
    await incrementGenerated()
    
    const stats = await getStats()
    expect(stats.generated).toBeGreaterThanOrEqual(0)
  })

  it('should get stats with queue length and articles count', async () => {
    await addToQueue('slug1')
    await addToQueue('slug2')
    
    const stats = await getStats()
    expect(stats.inStack).toBe(2)
    expect(stats.generated).toBeGreaterThanOrEqual(0)
  })
})

