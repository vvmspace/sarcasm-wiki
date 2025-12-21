import { rewriteContent } from './rewrite'

describe('rewrite', () => {
  const originalGeminiEnv = process.env.GEMINI_API_KEY
  const originalOpenRouterEnv = process.env.OPENROUTER_API_KEY
  const originalOpenAIEnv = process.env.OPENAI_API_KEY

  beforeAll(() => {
    // Ensure at least one API key is set for tests
    if (!process.env.GEMINI_API_KEY && !process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY) {
      process.env.GEMINI_API_KEY = 'test-key'
    }
  })

  afterAll(() => {
    process.env.GEMINI_API_KEY = originalGeminiEnv
    process.env.OPENROUTER_API_KEY = originalOpenRouterEnv
    process.env.OPENAI_API_KEY = originalOpenAIEnv
  })

  describe('rewriteContent', () => {
    it('should throw error if no API keys are set', async () => {
      const originalGemini = process.env.GEMINI_API_KEY
      const originalOpenRouter = process.env.OPENROUTER_API_KEY
      const originalOpenAI = process.env.OPENAI_API_KEY
      
      delete process.env.GEMINI_API_KEY
      delete process.env.OPENROUTER_API_KEY
      delete process.env.OPENAI_API_KEY
      
      const testContent = 'This is a test content with [a link](/Test) inside.'
      
      await expect(rewriteContent(testContent)).rejects.toThrow()
      
      process.env.GEMINI_API_KEY = originalGemini
      process.env.OPENROUTER_API_KEY = originalOpenRouter
      process.env.OPENAI_API_KEY = originalOpenAI
    })

    it('should handle content too short for rewriting', async () => {
      const testContent = 'Short'
      
      await expect(rewriteContent(testContent)).rejects.toThrow('Content too short to rewrite')
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

