import { checkRateLimit, checkAndStartGeneration } from './rate-limit'
import fs from 'fs/promises'
import path from 'path'

const RATE_LIMIT_DIR = path.join(process.cwd(), '.rate-limit')
const RATE_LIMIT_FILE = path.join(RATE_LIMIT_DIR, 'global.json')

describe('rate-limit', () => {
  const testSlug1 = 'test_article_1'
  const testSlug2 = 'test_article_2'

  beforeEach(async () => {
    try {
      await fs.unlink(RATE_LIMIT_FILE)
    } catch (error) {
      // File doesn't exist, that's fine
    }
  })

  afterAll(async () => {
    try {
      await fs.unlink(RATE_LIMIT_FILE)
    } catch (error) {
      // File doesn't exist, that's fine
    }
  })

  describe('checkAndStartGeneration - Global Rate Limit', () => {
    it('should allow generation when no rate limit file exists', async () => {
      const result = await checkAndStartGeneration(testSlug1)
      expect(result).toBe(true)
      
      const exists = await fs.access(RATE_LIMIT_FILE).then(() => true).catch(() => false)
      expect(exists).toBe(true)
    })

    it('should block generation for different article when rate limit is active', async () => {
      await checkAndStartGeneration(testSlug1)
      const result = await checkAndStartGeneration(testSlug2)
      expect(result).toBe(false)
    })

    it('should block generation for same article when rate limit is active', async () => {
      await checkAndStartGeneration(testSlug1)
      const result = await checkAndStartGeneration(testSlug1)
      expect(result).toBe(false)
    })

    it('should record start time immediately', async () => {
      const before = Date.now()
      await checkAndStartGeneration(testSlug1)
      const after = Date.now()
      
      const data = await fs.readFile(RATE_LIMIT_FILE, 'utf-8')
      const rateLimitData = JSON.parse(data)
      
      expect(rateLimitData.lastGenerationStart).toBeGreaterThanOrEqual(before)
      expect(rateLimitData.lastGenerationStart).toBeLessThanOrEqual(after)
      expect(rateLimitData.lastSlug).toBe(testSlug1)
    })

    it('should allow generation after rate limit expires', async () => {
      await checkAndStartGeneration(testSlug1)
      
      const oldTime = Date.now() - 61 * 1000
      await fs.writeFile(RATE_LIMIT_FILE, JSON.stringify({ 
        lastGenerationStart: oldTime,
        lastSlug: testSlug1 
      }), 'utf-8')
      
      const result = await checkAndStartGeneration(testSlug2)
      expect(result).toBe(true)
    })

    it('should be global - blocking any article during active generation', async () => {
      const result1 = await checkAndStartGeneration(testSlug1)
      expect(result1).toBe(true)
      
      const result2 = await checkAndStartGeneration(testSlug2)
      expect(result2).toBe(false)
      
      const result3 = await checkAndStartGeneration('another_article')
      expect(result3).toBe(false)
    })
  })

  describe('checkRateLimit', () => {
    it('should check without starting generation', async () => {
      const result = await checkRateLimit(testSlug1)
      expect(result).toBe(true)
      
      const exists = await fs.access(RATE_LIMIT_FILE).then(() => true).catch(() => false)
      expect(exists).toBe(false)
    })
  })
})

