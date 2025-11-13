import { rewriteContent } from './rewrite'

describe('rewrite', () => {
  const originalEnv = process.env.GEMINI_API_KEY

  beforeAll(() => {
    if (!process.env.GEMINI_API_KEY) {
      process.env.GEMINI_API_KEY = 'test-key'
    }
  })

  afterAll(() => {
    process.env.GEMINI_API_KEY = originalEnv
  })

  describe('rewriteContent', () => {
    it('should return original content if API key is not set', async () => {
      const originalKey = process.env.GEMINI_API_KEY
      delete process.env.GEMINI_API_KEY
      
      const testContent = 'This is a test content with [a link](/Test) inside.'
      const result = await rewriteContent(testContent)
      
      expect(result).toBe(testContent)
      
      process.env.GEMINI_API_KEY = originalKey
    })

    it('should return content for short input', async () => {
      const testContent = 'Short content'
      const result = await rewriteContent(testContent)
      
      expect(result).toBe(testContent)
    })

    it('should handle content with links', async () => {
      const testContent = 'This is a test content with [a link](/Test) and [another link](/Another) inside.'
      const links = new Map<string, string>()
      links.set('a link', '/Test')
      links.set('another link', '/Another')
      
      const result = await rewriteContent(testContent, links)
      
      expect(result).not.toBeNull()
      if (result) {
        expect(result.length).toBeGreaterThan(0)
      }
    }, 60000)

    it('should not add References section', async () => {
      const testContent = 'This is a test content with [a link](/Test) inside.'
      const links = new Map<string, string>()
      links.set('a link', '/Test')
      
      const result = await rewriteContent(testContent, links)
      
      expect(result).not.toBeNull()
      if (result) {
        expect(result).not.toContain('## References')
      }
    }, 60000)

    it('should handle chunked content', async () => {
      const longContent = '# Section 1\n\n' + 'Content '.repeat(5000) + '\n\n## Section 2\n\n' + 'More content '.repeat(5000)
      const links = new Map<string, string>()
      links.set('test', '/Test')
      
      const result = await rewriteContent(longContent, links)
      
      expect(result).not.toBeNull()
      if (result) {
        expect(result.length).toBeGreaterThan(0)
      }
    }, 120000)
  })
})

