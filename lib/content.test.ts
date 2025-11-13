import { getPageContent } from './content'
import fs from 'fs/promises'
import path from 'path'

const CONTENT_DIR = path.join(process.cwd(), 'content')
const RATE_LIMIT_FILE = path.join(process.cwd(), '.rate-limit', 'global.json')

describe('content', () => {
  const testSlug = 'test_content_jest'

  beforeEach(async () => {
    const filePath = path.join(CONTENT_DIR, `${testSlug}.md`)
    try {
      await fs.unlink(filePath)
    } catch (error) {
      // File doesn't exist, that's fine
    }
    try {
      await fs.unlink(RATE_LIMIT_FILE)
    } catch (error) {
      // Rate limit file doesn't exist, that's fine
    }
  })

  afterAll(async () => {
    const filePath = path.join(CONTENT_DIR, `${testSlug}.md`)
    try {
      await fs.unlink(filePath)
    } catch (error) {
      // File doesn't exist, that's fine
    }
  })

  describe('getPageContent', () => {
    it('should fetch and save content for new article', async () => {
      const content = await getPageContent('Quantum_computing', true)
      
      expect(content).not.toBeNull()
      expect(content?.length).toBeGreaterThan(100)
      
      const filePath = path.join(CONTENT_DIR, 'Quantum_computing.md')
      const exists = await fs.access(filePath).then(() => true).catch(() => false)
      expect(exists).toBe(true)
    }, 120000)

    it('should return cached content if file exists', async () => {
      const testContent = '# Test Content\n\nThis is a test.'
      const filePath = path.join(CONTENT_DIR, `${testSlug}.md`)
      await fs.mkdir(CONTENT_DIR, { recursive: true })
      await fs.writeFile(filePath, testContent, 'utf-8')
      
      const content = await getPageContent(testSlug, false)
      
      expect(content).toBe(testContent)
    })

    it('should remove References section from content', async () => {
      const content = await getPageContent('Artificial_intelligence', false)
      
      if (!content) {
        const freshContent = await getPageContent('Artificial_intelligence', true)
        expect(freshContent).not.toBeNull()
        if (freshContent) {
          expect(freshContent).not.toContain('## References')
        }
      } else {
        expect(content).not.toContain('## References')
      }
    }, 180000)

    it('should preserve internal links in content', async () => {
      const content = await getPageContent('Machine_learning', false)
      
      if (!content) {
        const freshContent = await getPageContent('Machine_learning', true)
        expect(freshContent).not.toBeNull()
        if (freshContent) {
          const internalLinks = (freshContent.match(/\[.*?\]\(\/[^)]+\)/g) || [])
          expect(internalLinks.length).toBeGreaterThan(0)
        }
      } else {
        const internalLinks = (content.match(/\[.*?\]\(\/[^)]+\)/g) || [])
        expect(internalLinks.length).toBeGreaterThan(0)
      }
    }, 180000)

    it('should handle forceRefresh parameter', async () => {
      const realSlug = 'Blockchain'
      const existingContent = await getPageContent(realSlug, false)
      
      if (existingContent) {
        const testContent = '# Old Content'
        const filePath = path.join(CONTENT_DIR, `${realSlug}.md`)
        await fs.mkdir(CONTENT_DIR, { recursive: true })
        await fs.writeFile(filePath, testContent, 'utf-8')
        
        const content = await getPageContent(realSlug, true)
        
        expect(content).not.toBe(testContent)
        expect(content?.length).toBeGreaterThan(testContent.length)
      } else {
        console.log('Skipping test - no existing content to refresh')
      }
    }, 180000)
  })
})

