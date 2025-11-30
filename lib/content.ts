import fs from 'fs/promises'
import path from 'path'
import { fetchWikipediaContent } from './wikipedia'
import { rewriteContent, generateMiniArticle } from './rewrite'
import { parseMDC, generateMDC, generateMetadataFromContent, type MDCContent, type ContentMetadata } from './mdc'

const CONTENT_DIR = path.join(process.cwd(), 'content')
const CACHE_DIR = path.join(process.cwd(), '.temp')
const LATEST_ARTICLES_CACHE = path.join(CACHE_DIR, 'latest-articles.json')

function normalizeFileName(slug: string): string {
  return slug.replace(/:/g, '_')
}

export async function getPageContent(slug: string, forceRefresh: boolean = false): Promise<string | null> {
  const mdcContent = await getPageMDC(slug, forceRefresh)
  return mdcContent?.content || null
}

export async function getPageMDC(slug: string, forceRefresh: boolean = false, waitForLock: boolean = false): Promise<MDCContent | null> {
  const fileName = normalizeFileName(slug)
  const filePath = path.join(CONTENT_DIR, `${fileName}.mdc`)

  if (forceRefresh) {
    try {
      await fs.unlink(filePath)
    } catch (error) {
      // File doesn't exist, that's fine
    }
    return await fetchAndSaveContent(slug, waitForLock)
  }

  try {
    const mdcContent = await fs.readFile(filePath, 'utf-8')
    if (mdcContent.trim().length < 50) {
      return null
    }
    
    try {
      return parseMDC(mdcContent)
    } catch (error) {
      console.warn(`Invalid MDC format for ${slug}, will be regenerated via queue`)
      return null
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw error
  }
}

async function fetchAndSaveContent(slug: string, waitForLock: boolean = false): Promise<MDCContent | null> {
  const startTime = Date.now()
  console.log(`[CONTENT] Starting content generation for: ${slug}`)
  
  try {
    console.log(`[CONTENT] Fetching Wikipedia content for: ${slug}`)
    const wikiStartTime = Date.now()
    const wikipediaData = await fetchWikipediaContent(slug)
    const wikiDuration = Date.now() - wikiStartTime
    
    if (!wikipediaData || !wikipediaData.content || wikipediaData.content.trim().length < 50) {
      console.warn(`[CONTENT] No Wikipedia content found for: ${slug} (${wikiDuration}ms)`)
      
      // Check if slug is valid and generate mini article
      // Allow Category: pages and other valid Wikipedia page names
      if (/^[A-Za-z0-9_,:\- ]+$/.test(slug)) {
        console.log(`[CONTENT] Slug is valid, generating mini article for: ${slug}`)
        try {
          const generatedContent = await generateMiniArticle(slug, waitForLock)
          
          if (!generatedContent || generatedContent.trim().length < 200) {
            console.warn(`[CONTENT] Mini article generation failed or returned empty for: ${slug}`)
            return null
          }
          
          console.log(`[CONTENT] Mini article generated for: ${slug} (${generatedContent.length} chars)`)
          
          const finalContent = removeReferencesSection(generatedContent)
          
          let existingMetadata: ContentMetadata | null = null
          const fileName = normalizeFileName(slug)
          const filePath = path.join(CONTENT_DIR, `${fileName}.mdc`)
          try {
            const existingContent = await fs.readFile(filePath, 'utf-8')
            existingMetadata = parseMDC(existingContent).metadata
            console.log(`[CONTENT] Found existing metadata for: ${slug} (created: ${existingMetadata.createdAt})`)
          } catch (error) {
            console.log(`[CONTENT] No existing file for: ${slug}, creating new metadata`)
          }
          
          const metadata = generateMetadataFromContent(slug, finalContent, existingMetadata?.createdAt)
          metadata.contentType = 'created'
          console.log(`[CONTENT] Generated metadata for: ${slug} (title: ${metadata.title}, keywords: ${metadata.keywords.length})`)
          
          console.log(`[CONTENT] Saving generated content for: ${slug} (${finalContent.length} chars)`)
          const saveStartTime = Date.now()
          await saveContent(slug, metadata, finalContent)
          const saveDuration = Date.now() - saveStartTime
          
          const totalDuration = Date.now() - startTime
          console.log(`[CONTENT] Mini article generation completed for: ${slug} (${totalDuration}ms total, save ${saveDuration}ms)`)
          
          return { metadata, content: finalContent }
        } catch (error: any) {
          if (error.message === 'RATE_LIMIT_EXCEEDED') {
            console.log(`[CONTENT] Rate limit exceeded for: ${slug}, throwing error`)
            throw error
          }
          console.error(`[CONTENT] Mini article generation failed for ${slug}:`, error.message)
          return null
        }
      }
      
      return null
    }

    const { content: wikipediaContent, links } = wikipediaData
    console.log(`[CONTENT] Wikipedia content fetched for: ${slug} (${wikipediaContent.length} chars, ${links.size} links, ${wikiDuration}ms)`)

    let rewrittenContent: string | null
    let rewriteDuration = 0
    try {
      console.log(`[CONTENT] Starting rewrite for: ${slug}`)
      const rewriteStartTime = Date.now()
      rewrittenContent = await rewriteContent(wikipediaContent, links, slug, waitForLock)
      rewriteDuration = Date.now() - rewriteStartTime
      
      if (!rewrittenContent || rewrittenContent.trim().length < 50) {
        console.warn(`[CONTENT] Rewriting failed or returned empty for: ${slug} (${rewriteDuration}ms)`)
        return null
      }
      console.log(`[CONTENT] Rewrite completed for: ${slug} (${rewrittenContent.length} chars, ${rewriteDuration}ms)`)
    } catch (error: any) {
      if (error.message === 'RATE_LIMIT_EXCEEDED') {
        console.log(`[CONTENT] Rate limit exceeded for: ${slug}, throwing error`)
        throw error
      }
      console.error(`[CONTENT] Rewriting failed for ${slug}, not saving original content:`, error.message)
      return null
    }
    
    console.log(`[CONTENT] Removing references section for: ${slug}`)
    const finalContent = removeReferencesSection(rewrittenContent)
    const refsRemoved = rewrittenContent.length - finalContent.length
    if (refsRemoved > 0) {
      console.log(`[CONTENT] Removed ${refsRemoved} chars from references section for: ${slug}`)
    }
    
    let existingMetadata: ContentMetadata | null = null
    const fileName = normalizeFileName(slug)
    const filePath = path.join(CONTENT_DIR, `${fileName}.mdc`)
    try {
      const existingContent = await fs.readFile(filePath, 'utf-8')
      existingMetadata = parseMDC(existingContent).metadata
      console.log(`[CONTENT] Found existing metadata for: ${slug} (created: ${existingMetadata.createdAt})`)
    } catch (error) {
      console.log(`[CONTENT] No existing file for: ${slug}, creating new metadata`)
    }
    
    const metadata = generateMetadataFromContent(slug, finalContent, existingMetadata?.createdAt)
    metadata.contentType = 'rewritten'
    console.log(`[CONTENT] Generated metadata for: ${slug} (title: ${metadata.title}, keywords: ${metadata.keywords.length})`)
    
    console.log(`[CONTENT] Saving content for: ${slug} (${finalContent.length} chars, original: ${wikipediaContent.length} chars, links: ${links.size})`)
    const saveStartTime = Date.now()
    await saveContent(slug, metadata, finalContent)
    const saveDuration = Date.now() - saveStartTime
    
    const totalDuration = Date.now() - startTime
    console.log(`[CONTENT] Content generation completed for: ${slug} (${totalDuration}ms total: wiki ${wikiDuration}ms, rewrite ${rewriteDuration}ms, save ${saveDuration}ms)`)
    
    return { metadata, content: finalContent }
  } catch (error: any) {
    const totalDuration = Date.now() - startTime
    if (error.message === 'RATE_LIMIT_EXCEEDED') {
      console.log(`[CONTENT] Rate limit exceeded for: ${slug} (${totalDuration}ms), throwing error`)
      throw error
    }
    console.error(`[CONTENT] Error fetching and saving content for: ${slug} (${totalDuration}ms):`, error?.message || error)
    return null
  }
}

function removeReferencesSection(content: string): string {
  if (!content.includes('## References')) {
    return content
  }
  
  const refsIndex = content.indexOf('## References')
  if (refsIndex === -1) {
    return content
  }
  
  return content.substring(0, refsIndex).trim()
}

async function saveContent(slug: string, metadata: ContentMetadata, content: string): Promise<void> {
  await fs.mkdir(CONTENT_DIR, { recursive: true })
  const fileName = normalizeFileName(slug)
  const filePath = path.join(CONTENT_DIR, `${fileName}.mdc`)
  const mdcContent = generateMDC(metadata, content)
  await fs.writeFile(filePath, mdcContent, 'utf-8')
  
  try {
    await updateLatestArticlesCache(metadata, 7)
  } catch (error) {
    console.error('Error updating latest articles cache:', error)
  }
  
  try {
    const { updateStats } = await import('./queue')
    await updateStats(slug)
  } catch (error) {
    console.error('Error updating stats after save:', error)
  }
}

export async function getAllArticles(): Promise<ContentMetadata[]> {
  try {
    await fs.mkdir(CONTENT_DIR, { recursive: true })
    const files = await fs.readdir(CONTENT_DIR)
    const mdcFiles = files.filter(file => file.endsWith('.mdc'))
    
    const articles: ContentMetadata[] = []
    
    for (const file of mdcFiles) {
      try {
        const filePath = path.join(CONTENT_DIR, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const parsed = parseMDC(content)
        
        if (!parsed.metadata.slug) {
          const fileName = file.replace('.mdc', '')
          if (fileName.startsWith('Category_')) {
            parsed.metadata.slug = fileName.replace(/^Category_/, 'Category:')
          } else {
            parsed.metadata.slug = fileName
          }
        }
        
        articles.push(parsed.metadata)
      } catch (error) {
        console.warn(`Failed to parse ${file}:`, error)
      }
    }
    
    return articles
  } catch (error) {
    console.error('Error getting all articles:', error)
    return []
  }
}

export async function countArticles(): Promise<number> {
  try {
    await fs.mkdir(CONTENT_DIR, { recursive: true })
    const files = await fs.readdir(CONTENT_DIR)
    const mdcFiles = files.filter(file => file.endsWith('.mdc'))
    return mdcFiles.length
  } catch (error) {
    console.error('Error counting articles:', error)
    return 0
  }
}

async function parseMetadataOnly(filePath: string, fileName: string): Promise<ContentMetadata | null> {
  try {
    const fileHandle = await fs.open(filePath, 'r')
    const buffer = Buffer.alloc(2048)
    const { bytesRead } = await fileHandle.read(buffer, 0, 2048, 0)
    await fileHandle.close()
    
    const content = buffer.toString('utf-8', 0, bytesRead)
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/)
    
    if (!frontmatterMatch) {
      return null
    }
    
    const frontmatter = frontmatterMatch[1]
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
      }
    }
    
    if (!metadata.title || !metadata.description) {
      return null
    }
    
    if (!metadata.slug) {
      const baseFileName = fileName.replace('.mdc', '')
      if (baseFileName.startsWith('Category_')) {
        metadata.slug = baseFileName.replace(/^Category_/, 'Category:')
      } else {
        metadata.slug = baseFileName
      }
    }
    
    return metadata as ContentMetadata
  } catch (error) {
    return null
  }
}

async function updateLatestArticlesCache(newArticle: ContentMetadata, limit: number = 7): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true })
    
    let cached: ContentMetadata[] = []
    try {
      const content = await fs.readFile(LATEST_ARTICLES_CACHE, 'utf-8')
      cached = JSON.parse(content)
    } catch {
      // Cache doesn't exist, start fresh
    }
    
    const existingIndex = cached.findIndex(a => a.slug === newArticle.slug)
    if (existingIndex >= 0) {
      cached.splice(existingIndex, 1)
    }
    
    cached.unshift(newArticle)
    cached = cached.slice(0, limit)
    
    await fs.writeFile(LATEST_ARTICLES_CACHE, JSON.stringify(cached, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error updating latest articles cache:', error)
  }
}

export async function getLatestArticles(limit: number = 7): Promise<ContentMetadata[]> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true })
    
    let cached: ContentMetadata[] = []
    try {
      const content = await fs.readFile(LATEST_ARTICLES_CACHE, 'utf-8')
      cached = JSON.parse(content)
    } catch {
      // Cache doesn't exist, need to rebuild
    }
    
    if (cached.length > 0) {
      return cached.slice(0, limit)
    }
    
    // Cache is empty, rebuild from files
    await fs.mkdir(CONTENT_DIR, { recursive: true })
    const files = await fs.readdir(CONTENT_DIR)
    const mdcFiles = files.filter(file => file.endsWith('.mdc'))
    
    const articlesWithDates: Array<{ metadata: ContentMetadata, date: string }> = []
    
    for (const file of mdcFiles) {
      try {
        const filePath = path.join(CONTENT_DIR, file)
        const metadata = await parseMetadataOnly(filePath, file)
        
        if (metadata) {
          const date = metadata.updatedAt || metadata.createdAt || '0'
          articlesWithDates.push({ metadata, date })
        }
      } catch (error) {
        console.warn(`Failed to parse metadata from ${file}:`, error)
      }
    }
    
    articlesWithDates.sort((a, b) => b.date.localeCompare(a.date))
    
    const latest = articlesWithDates.slice(0, limit).map(item => item.metadata)
    
    // Save to cache
    try {
      await fs.writeFile(LATEST_ARTICLES_CACHE, JSON.stringify(latest, null, 2), 'utf-8')
    } catch (error) {
      console.error('Error saving latest articles cache:', error)
    }
    
    return latest
  } catch (error) {
    console.error('Error getting latest articles:', error)
    return []
  }
}

