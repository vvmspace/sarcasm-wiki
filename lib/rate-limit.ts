import fs from 'fs/promises'
import path from 'path'

const RATE_LIMIT_DIR = path.join(process.cwd(), '.rate-limit')
const RATE_LIMIT_FILE = path.join(RATE_LIMIT_DIR, 'global.json')
const RATE_LIMIT_LOCK_FILE = path.join(RATE_LIMIT_DIR, 'global.lock')
const RATE_LIMIT_DURATION = 60 * 1000
const LOCK_RETRY_DELAY = 10
const LOCK_MAX_RETRIES = 10
const LOCK_TIMEOUT = 5 * 60 * 1000

async function isLockStale(): Promise<boolean> {
  try {
    const stats = await fs.stat(RATE_LIMIT_LOCK_FILE)
    const age = Date.now() - stats.mtimeMs
    return age > LOCK_TIMEOUT
  } catch (error) {
    return false
  }
}

async function forceReleaseLock(): Promise<void> {
  try {
    await fs.unlink(RATE_LIMIT_LOCK_FILE)
    console.log('Force released stale lock file')
  } catch (error) {
    // Lock file might not exist, that's fine
  }
}

async function acquireLock(waitForRelease: boolean = false): Promise<boolean> {
  const maxAttempts = waitForRelease ? 300 : LOCK_MAX_RETRIES
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await fs.mkdir(RATE_LIMIT_DIR, { recursive: true })
      
      if (await isLockStale()) {
        console.log('Lock file is stale, force releasing')
        await forceReleaseLock()
      }
      
      const fd = await fs.open(RATE_LIMIT_LOCK_FILE, 'wx')
      await fd.close()
      return true
    } catch (error: any) {
      if (error.code === 'EEXIST') {
        if (waitForRelease && attempt < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, LOCK_RETRY_DELAY))
          continue
        } else if (!waitForRelease) {
          await new Promise(resolve => setTimeout(resolve, LOCK_RETRY_DELAY))
          continue
        }
        return false
      }
      return false
    }
  }
  return false
}

async function releaseLock(): Promise<void> {
  try {
    await fs.unlink(RATE_LIMIT_LOCK_FILE)
  } catch (error) {
    // Lock file might not exist, that's fine
  }
}

export async function checkAndStartGeneration(slug: string, waitForLock: boolean = false): Promise<boolean> {
  try {
    if (slug.includes('_next') || slug.includes('webpack') || slug.includes('hot-update') || slug.startsWith('.')) {
      return false
    }
    
    await fs.mkdir(RATE_LIMIT_DIR, { recursive: true })
    
    const lockAcquired = await acquireLock(waitForLock)
    if (!lockAcquired) {
      if (waitForLock) {
        console.log(`Rate limit BLOCKED: Could not acquire lock after waiting (timeout)`)
      } else {
        console.log(`Rate limit BLOCKED: Could not acquire lock (another request is processing)`)
      }
      return false
    }
    
    try {
      const now = Date.now()
      let lastGenerationStart = 0
      
      try {
        const data = await fs.readFile(RATE_LIMIT_FILE, 'utf-8')
        const rateLimitData = JSON.parse(data)
        lastGenerationStart = rateLimitData.lastGenerationStart || 0
        
        const elapsed = now - lastGenerationStart
        if (elapsed < RATE_LIMIT_DURATION) {
          const remainingSeconds = Math.ceil((RATE_LIMIT_DURATION - elapsed) / 1000)
          console.log(`Rate limit BLOCKED: ${remainingSeconds} seconds remaining until next AI request`)
          return false
        }
      } catch (error) {
        // File might not exist, or be malformed. Treat as no active rate limit.
      }
      
      // Record the start time immediately before allowing generation
      await fs.writeFile(RATE_LIMIT_FILE, JSON.stringify({ 
        lastGenerationStart: now,
        lastSlug: slug 
      }), 'utf-8')
      console.log(`Rate limit PASSED: Starting AI request for ${slug} at ${new Date(now).toISOString()}`)
      return true
    } finally {
      // Always release lock
      await releaseLock()
    }
  } catch (error) {
    console.error('Error checking rate limit:', error)
    await releaseLock() // Make sure to release lock on error
    return false // Block generation on error
  }
}

export async function checkRateLimit(slug: string): Promise<boolean> {
  try {
    await fs.mkdir(RATE_LIMIT_DIR, { recursive: true })
    
    try {
      const data = await fs.readFile(RATE_LIMIT_FILE, 'utf-8')
      const rateLimitData = JSON.parse(data)
      const lastGenerationStart = rateLimitData.lastGenerationStart || 0
      const now = Date.now()
      
      if (now - lastGenerationStart < RATE_LIMIT_DURATION) {
        return false
      }
    } catch (error) {
      // File doesn't exist, that's fine
    }
    
    return true
  } catch (error) {
    console.error('Error checking rate limit:', error)
    return true
  }
}

export async function getRateLimitInfo(): Promise<{ isActive: boolean; remainingSeconds: number; lastSlug?: string } | null> {
  try {
    await fs.mkdir(RATE_LIMIT_DIR, { recursive: true })
    
    try {
      const data = await fs.readFile(RATE_LIMIT_FILE, 'utf-8')
      const rateLimitData = JSON.parse(data)
      const lastGenerationStart = rateLimitData.lastGenerationStart || 0
      const now = Date.now()
      const elapsed = now - lastGenerationStart
      
      if (elapsed < RATE_LIMIT_DURATION) {
        const remainingSeconds = Math.ceil((RATE_LIMIT_DURATION - elapsed) / 1000)
        return {
          isActive: true,
          remainingSeconds,
          lastSlug: rateLimitData.lastSlug
        }
      }
      
      return {
        isActive: false,
        remainingSeconds: 0
      }
    } catch (error) {
      return {
        isActive: false,
        remainingSeconds: 0
      }
    }
  } catch (error) {
    console.error('Error getting rate limit info:', error)
    return null
  }
}

export async function recordGeneration(slug: string): Promise<void> {
}
