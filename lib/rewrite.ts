import { getAIManager } from './ai-providers'
import { checkAndStartGeneration } from './rate-limit'
import { getPromptTemplate, getSystemPrompt, getUserPrompt, renderPromptTemplate } from './prompts'

async function rewriteChunk(chunk: string, isFirst: boolean = false, chunkIndex?: number, totalChunks?: number): Promise<{ content: string, provider: string, model: string }> {
  const startTime = Date.now()
  const chunkInfo = totalChunks ? `[${chunkIndex}/${totalChunks}]` : ''
  const chunkType = isFirst ? 'first' : 'subsequent'
  
  console.log(`[REWRITE] Starting chunk rewrite ${chunkInfo} (${chunkType}, ${chunk.length} chars)`)
  
  try {
    const systemPrompt = await getSystemPrompt(isFirst)
    const userPrompt = await getUserPrompt(chunk, isFirst)
    console.log(`[REWRITE] Prompts loaded ${chunkInfo} (system: ${systemPrompt.length} chars, user: ${userPrompt.length} chars)`)

    const aiManager = getAIManager()
    
    console.log(`[REWRITE] Calling AI API ${chunkInfo}...`)
    const apiStartTime = Date.now()
    const result = await aiManager.generateContent(userPrompt, systemPrompt)
    const apiDuration = Date.now() - apiStartTime
    console.log(`[REWRITE] AI response received ${chunkInfo} (${apiDuration}ms)`)
    
    if (!result.content || result.content.trim().length < 50) {
      console.error(`[REWRITE] ERROR ${chunkInfo}: Empty or too short response (${result.content?.length || 0} chars)`)
      throw new Error('Empty or too short response from AI API')
    }
    
    const totalDuration = Date.now() - startTime
    console.log(`[REWRITE] Chunk rewrite completed ${chunkInfo} (${result.content.length} chars, ${totalDuration}ms total, ${apiDuration}ms API)`)
    return {
      content: result.content,
      provider: result.provider,
      model: result.model
    }
  } catch (error: any) {
    const totalDuration = Date.now() - startTime
    console.error(`[REWRITE] ERROR ${chunkInfo} after ${totalDuration}ms:`, error?.status || error?.message || error)
    
    throw error
  }
}

function isValidSlug(slug: string): boolean {
  return /^[A-Za-z0-9_,:\- ]+$/.test(slug)
}

export async function generateMiniArticle(slug: string, waitForLock: boolean = false): Promise<{ content: string, provider: string, model: string } | null> {
  const startTime = Date.now()
  console.log(`[GENERATE] Starting mini article generation for: ${slug}`)
  
  if (slug) {
    console.log(`[GENERATE] Checking rate limit for: ${slug}`)
    const canGenerate = await checkAndStartGeneration(slug, waitForLock)
    if (!canGenerate) {
      console.log(`[GENERATE] Rate limit exceeded for: ${slug}`)
      throw new Error('RATE_LIMIT_EXCEEDED')
    }
    console.log(`[GENERATE] Rate limit passed for: ${slug}`)
  }

  try {
    const title = slug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    const systemPrompt = await getSystemPrompt(true)

    const template = await getPromptTemplate('rewrite-mini-article.md')
    const userPrompt = renderPromptTemplate(template, { title })
    
    console.log(`[GENERATE] Prompts loaded (system: ${systemPrompt.length} chars, user: ${userPrompt.length} chars)`)

    const aiManager = getAIManager()

    console.log(`[GENERATE] Calling AI API...`)
    const apiStartTime = Date.now()
    const result = await aiManager.generateContent(userPrompt, systemPrompt)
    const apiDuration = Date.now() - apiStartTime
    console.log(`[GENERATE] AI response received (${apiDuration}ms)`)
    
    if (!result.content || result.content.trim().length < 1000) {
      console.error(`[GENERATE] ERROR: Empty or too short response (${result.content?.length || 0} chars, minimum 1000 required)`)
      throw new Error('Empty or too short response from AI API')
    }
    
    const totalDuration = Date.now() - startTime
    console.log(`[GENERATE] Mini article generation completed for: ${slug} (${result.content.length} chars, ${totalDuration}ms total, ${apiDuration}ms API)`)
    return {
      content: result.content,
      provider: result.provider,
      model: result.model
    }
  } catch (error: any) {
    const totalDuration = Date.now() - startTime
    console.error(`[GENERATE] ERROR after ${totalDuration}ms for: ${slug}:`, {
      status: error?.status,
      message: error?.message,
      details: error?.response?.data || error?.response || 'No extra details'
    })
    
    if (error.message === 'RATE_LIMIT_EXCEEDED') {
      throw error
    }
    
    throw new Error('GENERATE_ERROR')
  }
}

export async function rewriteContent(content: string, links?: Map<string, string>, slug?: string, waitForLock: boolean = false): Promise<{ content: string, provider: string, model: string } | null> {
  const startTime = Date.now()
  console.log(`[REWRITE] Starting content rewrite for: ${slug || 'unknown'} (${content.length} chars, ${links?.size || 0} links)`)
  
  if (!content || content.trim().length < 100) {
    console.error(`[REWRITE] ERROR: Content too short (${content?.length || 0} chars)`)
    throw new Error('Content too short to rewrite')
  }

  if (slug) {
    console.log(`[REWRITE] Checking rate limit for: ${slug}`)
    const canGenerate = await checkAndStartGeneration(slug, waitForLock)
    if (!canGenerate) {
      console.log(`[REWRITE] Rate limit exceeded for: ${slug}`)
      throw new Error('RATE_LIMIT_EXCEEDED')
    }
    console.log(`[REWRITE] Rate limit passed for: ${slug}`)
  }

  try {
    const maxChunkLength = 30000
    const chunks: string[] = []
    
    if (content.length <= maxChunkLength) {
      console.log(`[REWRITE] Content fits in single chunk (${content.length} chars), rewriting...`)
      const result = await rewriteChunk(content, true)
      const duration = Date.now() - startTime
      console.log(`[REWRITE] Content rewrite completed for: ${slug || 'unknown'} (${result.content.length} chars, ${duration}ms)`)
      return result
    }

    console.log(`[REWRITE] Content too large (${content.length} chars), splitting into chunks...`)
    const sections = content.split(/\n\n## /)
    let currentChunk = sections[0] || ''
    
    for (let i = 1; i < sections.length; i++) {
      const section = `## ${sections[i]}`
      if ((currentChunk + '\n\n' + section).length > maxChunkLength && currentChunk.length > 0) {
        chunks.push(currentChunk)
        currentChunk = section
      } else {
        currentChunk += '\n\n' + section
      }
    }
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk)
    }

    console.log(`[REWRITE] Split into ${chunks.length} chunks: ${chunks.map(c => c.length).join(', ')} chars`)
    const rewrittenChunks: string[] = []
    let lastResult: any = null
    
    for (let i = 0; i < chunks.length; i++) {
      console.log(`[REWRITE] Processing chunk ${i + 1}/${chunks.length}...`)
      const result = await rewriteChunk(chunks[i], i === 0, i + 1, chunks.length)
      rewrittenChunks.push(result.content)
      lastResult = result // Save information about last provider
    }

    const finalContent = rewrittenChunks.join('\n\n')
    const duration = Date.now() - startTime
    console.log(`[REWRITE] Content rewrite completed for: ${slug || 'unknown'} (${finalContent.length} chars from ${content.length} original, ${chunks.length} chunks, ${duration}ms)`)
    return {
      content: finalContent,
      provider: lastResult?.provider || 'unknown',
      model: lastResult?.model || 'unknown'
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error(`[REWRITE] ERROR after ${duration}ms for: ${slug || 'unknown'}:`, error?.status || error?.message || error)
    
    // Don't return original content on API errors - throw to prevent saving
    if (error?.status === 503 || error?.status === 429 || error?.status === 500) {
      console.error(`[REWRITE] API error detected (status: ${error.status}), throwing API_ERROR`)
      throw new Error('API_ERROR')
    }
    // For other errors, also don't save original
    console.error(`[REWRITE] Other error detected, throwing REWRITE_ERROR`)
    throw new Error('REWRITE_ERROR')
  }
}

