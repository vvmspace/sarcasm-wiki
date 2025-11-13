import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSystemPrompt, getUserPrompt } from './prompts'
import { checkAndStartGeneration } from './rate-limit'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

async function rewriteChunk(chunk: string, isFirst: boolean = false, chunkIndex?: number, totalChunks?: number): Promise<string> {
  const startTime = Date.now()
  const chunkInfo = totalChunks ? `[${chunkIndex}/${totalChunks}]` : ''
  const chunkType = isFirst ? 'first' : 'subsequent'
  
  console.log(`[REWRITE] Starting chunk rewrite ${chunkInfo} (${chunkType}, ${chunk.length} chars)`)
  
  if (!process.env.GEMINI_API_KEY) {
    console.error('[REWRITE] ERROR: GEMINI_API_KEY not set')
    throw new Error('GEMINI_API_KEY not set')
  }

  try {
    const systemPrompt = await getSystemPrompt(isFirst)
    const userPrompt = await getUserPrompt(chunk, isFirst)
    console.log(`[REWRITE] Prompts loaded ${chunkInfo} (system: ${systemPrompt.length} chars, user: ${userPrompt.length} chars)`)

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 32000,
      },
    })

    console.log(`[REWRITE] Calling Gemini API ${chunkInfo}...`)
    const apiStartTime = Date.now()
    const result = await model.generateContent(userPrompt)
    const apiDuration = Date.now() - apiStartTime
    console.log(`[REWRITE] API response received ${chunkInfo} (${apiDuration}ms)`)

    const response = result.response
    const text = response.text()
    
    if (!text || text.trim().length < 50) {
      console.error(`[REWRITE] ERROR ${chunkInfo}: Empty or too short response (${text?.length || 0} chars)`)
      throw new Error('Empty or too short response from API')
    }
    
    const totalDuration = Date.now() - startTime
    console.log(`[REWRITE] Chunk rewrite completed ${chunkInfo} (${text.length} chars, ${totalDuration}ms total, ${apiDuration}ms API)`)
    return text
  } catch (error: any) {
    const totalDuration = Date.now() - startTime
    console.error(`[REWRITE] ERROR ${chunkInfo} after ${totalDuration}ms:`, error?.status || error?.message || error)
    throw error
  }
}

export async function rewriteContent(content: string, links?: Map<string, string>, slug?: string): Promise<string | null> {
  const startTime = Date.now()
  console.log(`[REWRITE] Starting content rewrite for: ${slug || 'unknown'} (${content.length} chars, ${links?.size || 0} links)`)
  
  if (!process.env.GEMINI_API_KEY) {
    console.error('[REWRITE] ERROR: GEMINI_API_KEY not set')
    throw new Error('GEMINI_API_KEY not set')
  }

  if (!content || content.trim().length < 100) {
    console.error(`[REWRITE] ERROR: Content too short (${content?.length || 0} chars)`)
    throw new Error('Content too short to rewrite')
  }

  if (slug) {
    console.log(`[REWRITE] Checking rate limit for: ${slug}`)
    const canGenerate = await checkAndStartGeneration(slug)
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
      const rewritten = await rewriteChunk(content, true)
      const duration = Date.now() - startTime
      console.log(`[REWRITE] Content rewrite completed for: ${slug || 'unknown'} (${rewritten.length} chars, ${duration}ms)`)
      return rewritten
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
    
    for (let i = 0; i < chunks.length; i++) {
      console.log(`[REWRITE] Processing chunk ${i + 1}/${chunks.length}...`)
      const rewritten = await rewriteChunk(chunks[i], i === 0, i + 1, chunks.length)
      rewrittenChunks.push(rewritten)
    }

    const finalContent = rewrittenChunks.join('\n\n')
    const duration = Date.now() - startTime
    console.log(`[REWRITE] Content rewrite completed for: ${slug || 'unknown'} (${finalContent.length} chars from ${content.length} original, ${chunks.length} chunks, ${duration}ms)`)
    return finalContent
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

