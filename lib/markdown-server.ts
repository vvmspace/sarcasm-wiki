// Dynamic imports for ES modules - must be called at runtime, not module load time
let remarkModules: any = null

async function loadRemarkModules() {
  if (remarkModules) return remarkModules
  
  const { unified } = await import('unified')
  const remarkParse = (await import('remark-parse')).default
  const remarkGfm = (await import('remark-gfm')).default
  const remarkMath = (await import('remark-math')).default
  const remarkRehype = (await import('remark-rehype')).default
  const rehypeKatex = (await import('rehype-katex')).default
  const rehypeStringify = (await import('rehype-stringify')).default
  
  remarkModules = {
    unified,
    remarkParse,
    remarkGfm,
    remarkMath,
    remarkRehype,
    rehypeKatex,
    rehypeStringify
  }
  
  return remarkModules
}

// Lightning fast markdown cache ⚡
const markdownCache = new Map<string, { html: string, timestamp: number }>()
const MARKDOWN_CACHE_TTL = process.env.NODE_ENV === 'development' ? 30000 : 300000 // 30s dev, 5min prod
const MAX_MARKDOWN_CACHE_SIZE = 500

function maintainMarkdownCache(): void {
  if (markdownCache.size > MAX_MARKDOWN_CACHE_SIZE) {
    const entries = Array.from(markdownCache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    // Remove oldest 30% for lightning performance
    const toRemove = Math.floor(MAX_MARKDOWN_CACHE_SIZE * 0.3)
    for (let i = 0; i < toRemove; i++) {
      markdownCache.delete(entries[i][0])
    }
  }
}

function getCachedMarkdown(markdown: string): string | null {
  // Lightning cache works in all environments ⚡
  const hash = Buffer.from(markdown).toString('base64').slice(0, 32)
  const cached = markdownCache.get(hash)
  
  if (!cached) return null
  
  if (Date.now() - cached.timestamp > MARKDOWN_CACHE_TTL) {
    markdownCache.delete(hash)
    return null
  }
  
  return cached.html
}

function setCachedMarkdown(markdown: string, html: string): void {
  maintainMarkdownCache() // Lightning cache management ⚡
  
  const hash = Buffer.from(markdown).toString('base64').slice(0, 32)
  markdownCache.set(hash, {
    html,
    timestamp: Date.now()
  })
}

export async function renderMarkdownToHtml(markdown: string): Promise<string> {
  // Check cache first
  const cached = getCachedMarkdown(markdown)
  if (cached) {
    return cached
  }
  
  // Load existing articles for link checking
  const { getExistingArticlesSlugs } = await import('./content')
  const existingArticles = await getExistingArticlesSlugs()
  
  const { unified, remarkParse, remarkGfm, remarkMath, remarkRehype, rehypeKatex, rehypeStringify } = await loadRemarkModules()
  
  // Pre-process markdown for better performance
  let processedMarkdown = markdown
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\(www\.[^)]+\)/g, '$1')
    .replace(/https?:\/\/[^\s\)]+/g, (url) => {
      const domain = url.replace(/^https?:\/\//, '').split('/')[0]
      return domain
    })
    .replace(/www\.[^\s\)]+/g, (url) => {
      return url.replace(/^www\./, '')
    })
  
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeKatex)
    .use(rehypeStringify, { allowDangerousHtml: true })

  const result = await processor.process(processedMarkdown)
  let html = String(result)
  
  // Post-process HTML with link existence checking
  html = html.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*?)<\/a>/gi, (match, href, text) => {
    const cleanHref = href.trim()
    
    if (cleanHref.startsWith('/') && !cleanHref.startsWith('//')) {
      // This is an internal link
      const slug = cleanHref.substring(1) // Remove leading slash
      const decodedSlug = decodeURIComponent(slug)
      
      // Check if article exists
      const exists = existingArticles.has(decodedSlug)
      
      let className = 'internal-link'
      if (!exists) {
        className += ' missing-link'
      }
      
      if (match.includes('class="internal-link"')) {
        return match.replace('class="internal-link"', `class="${className}"`)
      }
      if (match.includes('class=')) {
        return match.replace(/class="([^"]+)"/, `class="$1 ${className}"`)
      }
      return match.replace('>', ` class="${className}">`)
    }
    
    // External link - remove it and return just text
    return text || ''
  })
  
  // Cache the result
  setCachedMarkdown(markdown, html)
  
  return html
}

