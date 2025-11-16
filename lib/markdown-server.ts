// Dynamic imports for ES modules - must be called at runtime, not module load time
async function loadRemarkModules() {
  const { unified } = await import('unified')
  const remarkParse = (await import('remark-parse')).default
  const remarkGfm = (await import('remark-gfm')).default
  const remarkMath = (await import('remark-math')).default
  const remarkRehype = (await import('remark-rehype')).default
  const rehypeKatex = (await import('rehype-katex')).default
  const rehypeStringify = (await import('rehype-stringify')).default
  
  return {
    unified,
    remarkParse,
    remarkGfm,
    remarkMath,
    remarkRehype,
    rehypeKatex,
    rehypeStringify
  }
}

export async function renderMarkdownToHtml(markdown: string): Promise<string> {
  const { unified, remarkParse, remarkGfm, remarkMath, remarkRehype, rehypeKatex, rehypeStringify } = await loadRemarkModules()
  
  markdown = markdown.replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, '$1')
  markdown = markdown.replace(/\[([^\]]+)\]\(www\.[^)]+\)/g, '$1')
  markdown = markdown.replace(/https?:\/\/[^\s\)]+/g, (url) => {
    const domain = url.replace(/^https?:\/\//, '').split('/')[0]
    return domain
  })
  markdown = markdown.replace(/www\.[^\s\)]+/g, (url) => {
    return url.replace(/^www\./, '')
  })
  
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeKatex)
    .use(rehypeStringify, { allowDangerousHtml: true })

  const result = await processor.process(markdown)
  let html = String(result)
  
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
  
  return html
}

