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

// Development cache for rendered markdown
const markdownCache = new Map<string, { html: string, timestamp: number }>()
const MARKDOWN_CACHE_TTL = 60000 // 1 minute in dev mode

function getCachedMarkdown(markdown: string): string | null {
  if (process.env.NODE_ENV !== 'development') return null
  
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
  if (process.env.NODE_ENV !== 'development') return
  
  const hash = Buffer.from(markdown).toString('base64').slice(0, 32)
  markdownCache.set(hash, {
    html,
    timestamp: Date.now()
  })
  
  // Cleanup old entries
  if (markdownCache.size > 100) {
    const entries = Array.from(markdownCache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    for (let i = 0; i < 20; i++) {
      markdownCache.delete(entries[i][0])
    }
  }
}

export async function renderMarkdownToHtml(markdown: string): Promise<string> {
  // Check cache first
  const cached = getCachedMarkdown(markdown)
  if (cached) {
    return cached
  }
  
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
  
  // Post-process HTML
  html = html.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*?)<\/a>/gi, (match, href, text) => {
    const cleanHref = href.trim()
    if (cleanHref.startsWith('/') && !cleanHref.startsWith('//')) {
      if (match.includes('class="internal-link"')) {
        return match
      }
      if (match.includes('class=')) {
        return match.replace(/class="([^"]+)"/, 'class="$1 internal-link"')
      }
      return match.replace('>', ' class="internal-link">')
    }
    return text || ''
  })
  
  // Cache the result
  setCachedMarkdown(markdown, html)
  
  return html
}

