import { fetchWikipediaContent } from './wikipedia'

describe('wikipedia', () => {
  describe('fetchWikipediaContent', () => {
    it('should fetch content for existing article', async () => {
      const result = await fetchWikipediaContent('Artificial_intelligence')
      
      expect(result).not.toBeNull()
      expect(result?.content).toBeDefined()
      expect(result?.content.length).toBeGreaterThan(100)
      expect(result?.links).toBeInstanceOf(Map)
      expect(result?.links.size).toBeGreaterThan(0)
    }, 30000)

    it('should return null for non-existent article', async () => {
      const result = await fetchWikipediaContent('NonExistentArticle12345')
      
      expect(result).toBeNull()
    }, 30000)

    it('should extract internal links', async () => {
      const result = await fetchWikipediaContent('Machine_learning')
      
      expect(result).not.toBeNull()
      if (result) {
        const internalLinks = Array.from(result.links.entries())
          .filter(([text, url]) => url.startsWith('/') && !url.startsWith('//'))
        
        expect(internalLinks.length).toBeGreaterThan(0)
        
        const markdownLinks = (result.content.match(/\[.*?\]\(\/[^)]+\)/g) || [])
        expect(markdownLinks.length).toBeGreaterThan(0)
      }
    }, 30000)

    it('should convert Wikipedia links to internal format', async () => {
      const result = await fetchWikipediaContent('Blockchain')
      
      expect(result).not.toBeNull()
      if (result) {
        const internalLinks = Array.from(result.links.values())
          .filter(url => url.startsWith('/') && !url.startsWith('//'))
        
        expect(internalLinks.length).toBeGreaterThan(0)
        
        internalLinks.forEach(url => {
          expect(url).toMatch(/^\/[^/]+/)
          expect(url).not.toContain('en.wikipedia.org')
        })
      }
    }, 30000)

    it('should not include References section in content', async () => {
      const result = await fetchWikipediaContent('Neural_network')
      
      expect(result).not.toBeNull()
      if (result) {
        expect(result.content).not.toContain('## References')
      }
    }, 30000)
  })
})

