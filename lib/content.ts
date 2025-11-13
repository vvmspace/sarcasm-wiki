import fs from 'fs/promises'
import path from 'path'
import { fetchWikipediaContent } from './wikipedia'
import { rewriteContent } from './rewrite'
import { parseMDC, generateMDC, generateMetadataFromContent, type MDCContent, type ContentMetadata } from './mdc'

const CONTENT_DIR = path.join(process.cwd(), 'content')

export async function getPageContent(slug: string, forceRefresh: boolean = false): Promise<string | null> {
  const mdcContent = await getPageMDC(slug, forceRefresh)
  return mdcContent?.content || null
}

export async function getPageMDC(slug: string, forceRefresh: boolean = false): Promise<MDCContent | null> {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdc`)

  if (forceRefresh) {
    try {
      await fs.unlink(filePath)
    } catch (error) {
      // File doesn't exist, that's fine
    }
    return await fetchAndSaveContent(slug)
  }

  try {
    const mdcContent = await fs.readFile(filePath, 'utf-8')
    if (mdcContent.trim().length < 50) {
      return await fetchAndSaveContent(slug)
    }
    
    try {
      return parseMDC(mdcContent)
    } catch (error) {
      console.warn(`Invalid MDC format for ${slug}, regenerating...`)
      return await fetchAndSaveContent(slug)
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      try {
        return await fetchAndSaveContent(slug)
      } catch (fetchError: any) {
        if (fetchError.message === 'RATE_LIMIT_EXCEEDED') {
          throw fetchError
        }
        throw error
      }
    }
    throw error
  }
}

async function fetchAndSaveContent(slug: string): Promise<MDCContent | null> {
  const startTime = Date.now()
  console.log(`[CONTENT] Starting content generation for: ${slug}`)
  
  try {
    console.log(`[CONTENT] Fetching Wikipedia content for: ${slug}`)
    const wikiStartTime = Date.now()
    const wikipediaData = await fetchWikipediaContent(slug)
    const wikiDuration = Date.now() - wikiStartTime
    
    if (!wikipediaData || !wikipediaData.content || wikipediaData.content.trim().length < 50) {
      console.warn(`[CONTENT] No content found for: ${slug} (${wikiDuration}ms)`)
      return null
    }

    const { content: wikipediaContent, links } = wikipediaData
    console.log(`[CONTENT] Wikipedia content fetched for: ${slug} (${wikipediaContent.length} chars, ${links.size} links, ${wikiDuration}ms)`)

    let rewrittenContent: string | null
    try {
      console.log(`[CONTENT] Starting rewrite for: ${slug}`)
      const rewriteStartTime = Date.now()
      rewrittenContent = await rewriteContent(wikipediaContent, links, slug)
      const rewriteDuration = Date.now() - rewriteStartTime
      
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
    const filePath = path.join(CONTENT_DIR, `${slug}.mdc`)
    try {
      const existingContent = await fs.readFile(filePath, 'utf-8')
      existingMetadata = parseMDC(existingContent).metadata
      console.log(`[CONTENT] Found existing metadata for: ${slug} (created: ${existingMetadata.createdAt})`)
    } catch (error) {
      console.log(`[CONTENT] No existing file for: ${slug}, creating new metadata`)
    }
    
    const metadata = generateMetadataFromContent(slug, finalContent, existingMetadata?.createdAt)
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
  const filePath = path.join(CONTENT_DIR, `${slug}.mdc`)
  const mdcContent = generateMDC(metadata, content)
  await fs.writeFile(filePath, mdcContent, 'utf-8')
}

