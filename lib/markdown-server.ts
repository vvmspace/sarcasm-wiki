import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'

export async function renderMarkdownToHtml(markdown: string): Promise<string> {
  markdown = markdown.replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, '$1')
  markdown = markdown.replace(/\[([^\]]+)\]\(www\.[^)]+\)/g, '$1')
  markdown = markdown.replace(/https?:\/\/[^\s\)]+/g, (url) => {
    const domain = url.replace(/^https?:\/\//, '').split('/')[0]
    return domain
  })
  markdown = markdown.replace(/www\.[^\s\)]+/g, (url) => {
    return url.replace(/^www\./, '')
  })
  
  const processor = remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })

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

