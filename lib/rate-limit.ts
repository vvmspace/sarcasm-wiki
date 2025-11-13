import fs from 'fs/promises'
import path from 'path'

const RATE_LIMIT_DIR = path.join(process.cwd(), '.rate-limit')
const RATE_LIMIT_FILE = path.join(RATE_LIMIT_DIR, 'global.json')
const RATE_LIMIT_DURATION = 60 * 1000

export async function checkAndStartGeneration(slug: string): Promise<boolean> {
  try {
    if (slug.includes('_next') || slug.includes('webpack') || slug.includes('hot-update') || slug.startsWith('.')) {
      return false
    }
    
    await fs.mkdir(RATE_LIMIT_DIR, { recursive: true })
    
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
    }
    
    await fs.writeFile(RATE_LIMIT_FILE, JSON.stringify({ 
      lastGenerationStart: now,
      lastSlug: slug 
    }), 'utf-8')
    console.log(`Rate limit PASSED: Starting AI request for ${slug} at ${new Date(now).toISOString()}`)
    return true
  } catch (error) {
    console.error('Error checking rate limit:', error)
    return false
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

