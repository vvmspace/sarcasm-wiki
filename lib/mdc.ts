export interface ContentMetadata {
  title: string
  description: string
  keywords: string[]
  slug: string
  createdAt?: string
  updatedAt?: string
  contentType?: 'rewritten' | 'created'
  previousArticle?: {
    slug: string
    title: string
  }
}

export interface MDCContent {
  metadata: ContentMetadata
  content: string
}

export function parseMDC(mdcContent: string): MDCContent {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
  const match = mdcContent.match(frontmatterRegex)
  
  if (!match) {
    throw new Error('Invalid MDC format: missing frontmatter')
  }
  
  const frontmatter = match[1]
  const content = match[2]
  
  const metadata: Partial<ContentMetadata> = {}
  const lines = frontmatter.split('\n')
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue
    
    const key = line.substring(0, colonIndex).trim()
    let value = line.substring(colonIndex + 1).trim()
    
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1)
    }
    
    if (key === 'keywords') {
      metadata.keywords = value.split(',').map(k => k.trim()).filter(k => k.length > 0)
    } else if (key === 'title') {
      metadata.title = value
    } else if (key === 'description') {
      metadata.description = value
    } else if (key === 'slug') {
      metadata.slug = value
    } else if (key === 'createdAt') {
      metadata.createdAt = value
    } else if (key === 'updatedAt') {
      metadata.updatedAt = value
    } else if (key === 'contentType') {
      if (value === 'rewritten' || value === 'created') {
        metadata.contentType = value
      }
    } else if (key === 'previousArticleSlug') {
      if (!metadata.previousArticle) {
        metadata.previousArticle = { slug: value, title: '' }
      } else {
        metadata.previousArticle.slug = value
      }
    } else if (key === 'previousArticleTitle') {
      if (!metadata.previousArticle) {
        metadata.previousArticle = { slug: '', title: value }
      } else {
        metadata.previousArticle.title = value
      }
    } else if (key === 'previousArticle') {
      // Legacy format: just slug as string
      try {
        const parsed = JSON.parse(value)
        if (parsed && typeof parsed === 'object' && parsed.slug && parsed.title) {
          metadata.previousArticle = { slug: parsed.slug, title: parsed.title }
        }
      } catch {
        if (value) {
          metadata.previousArticle = { slug: value, title: value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }
        }
      }
    }
  }
  
  if (!metadata.title || !metadata.description || !metadata.slug) {
    throw new Error('Invalid MDC format: missing required metadata')
  }
  
  return {
    metadata: metadata as ContentMetadata,
    content: content.trim()
  }
}

export function generateMDC(metadata: ContentMetadata, content: string): string {
  const lines: string[] = [
    '---',
    `title: "${metadata.title}"`,
    `description: "${metadata.description}"`,
    `keywords: ${metadata.keywords.join(', ')}`,
    `slug: "${metadata.slug}"`
  ]
  
  if (metadata.createdAt) {
    lines.push(`createdAt: "${metadata.createdAt}"`)
  }
  if (metadata.updatedAt) {
    lines.push(`updatedAt: "${metadata.updatedAt}"`)
  }
  if (metadata.contentType) {
    lines.push(`contentType: "${metadata.contentType}"`)
  }
  if (metadata.previousArticle) {
    lines.push(`previousArticleSlug: "${metadata.previousArticle.slug}"`)
    lines.push(`previousArticleTitle: "${metadata.previousArticle.title}"`)
  }
  
  lines.push('---', '', content)
  
  return lines.join('\n')
}

export function generateMetadataFromContent(slug: string, content: string, existingCreatedAt?: string): ContentMetadata {
  const title = slug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  
  const firstParagraph = content
    .split('\n\n')
    .find(p => p.trim().length > 50 && !p.startsWith('#')) || ''
  
  const description = firstParagraph
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n/g, ' ')
    .trim()
    .substring(0, 160)
    .replace(/\s+\S*$/, '') + '...'
  
  const keywords: string[] = []
  const linkMatches = content.match(/\[([^\]]+)\]\(\/([^)]+)\)/g) || []
  const uniqueKeywords = new Set<string>()
  
  linkMatches.slice(0, 10).forEach(link => {
    const textMatch = link.match(/\[([^\]]+)\]/)
    if (textMatch) {
      const keyword = textMatch[1].toLowerCase()
      if (keyword.length > 3 && keyword.length < 30) {
        uniqueKeywords.add(keyword)
      }
    }
  })
  
  keywords.push(...Array.from(uniqueKeywords).slice(0, 10))
  
  if (keywords.length === 0) {
    const words = title.toLowerCase().split(/\s+/)
    keywords.push(...words.filter(w => w.length > 3).slice(0, 5))
  }
  
  const now = new Date().toISOString()
  
  return {
    title,
    description,
    keywords,
    slug,
    createdAt: existingCreatedAt || now,
    updatedAt: now
  }
}

