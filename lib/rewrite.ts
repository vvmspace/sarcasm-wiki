import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSystemPrompt, getUserPrompt } from './prompts'
import { checkAndStartGeneration } from './rate-limit'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

async function rewriteChunk(chunk: string, isFirst: boolean = false, chunkIndex?: number, totalChunks?: number, useFlash: boolean = false): Promise<string> {
  const startTime = Date.now()
  const chunkInfo = totalChunks ? `[${chunkIndex}/${totalChunks}]` : ''
  const chunkType = isFirst ? 'first' : 'subsequent'
  const modelName = useFlash ? 'gemini-2.5-flash' : 'gemini-2.5-flash-lite'
  
  console.log(`[REWRITE] Starting chunk rewrite ${chunkInfo} (${chunkType}, ${chunk.length} chars, model: ${modelName})`)
  
  if (!process.env.GEMINI_API_KEY) {
    console.error('[REWRITE] ERROR: GEMINI_API_KEY not set')
    throw new Error('GEMINI_API_KEY not set')
  }

  try {
    const systemPrompt = await getSystemPrompt(isFirst)
    const userPrompt = await getUserPrompt(chunk, isFirst)
    console.log(`[REWRITE] Prompts loaded ${chunkInfo} (system: ${systemPrompt.length} chars, user: ${userPrompt.length} chars)`)

    const model = genAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 32000,
      },
    })

    console.log(`[REWRITE] Calling Gemini API ${chunkInfo} with ${modelName}...`)
    const apiStartTime = Date.now()
    const result = await model.generateContent(userPrompt)
    const apiDuration = Date.now() - apiStartTime
    console.log(`[REWRITE] API response received ${chunkInfo} from ${modelName} (${apiDuration}ms)`)

    const response = result.response
    const text = response.text()
    
    if (!text || text.trim().length < 50) {
      console.error(`[REWRITE] ERROR ${chunkInfo}: Empty or too short response (${text?.length || 0} chars)`)
      throw new Error('Empty or too short response from API')
    }
    
    const totalDuration = Date.now() - startTime
    console.log(`[REWRITE] Chunk rewrite completed ${chunkInfo} with ${modelName} (${text.length} chars, ${totalDuration}ms total, ${apiDuration}ms API)`)
    return text
  } catch (error: any) {
    const totalDuration = Date.now() - startTime
    console.error(`[REWRITE] ERROR ${chunkInfo} with ${modelName} after ${totalDuration}ms:`, error?.status || error?.message || error)
    
    // If 503 error and we haven't tried flash model yet, retry with flash
    if (error?.status === 503 && !useFlash) {
      console.log(`[REWRITE] 503 error with ${modelName}, retrying with gemini-2.5-flash...`)
      return await rewriteChunk(chunk, isFirst, chunkIndex, totalChunks, true)
    }
    
    throw error
  }
}

function isValidSlug(slug: string): boolean {
  return /^[A-Za-z0-9_,:\- ]+$/.test(slug)
}

export async function generateMiniArticle(slug: string): Promise<string | null> {
  const startTime = Date.now()
  console.log(`[GENERATE] Starting mini article generation for: ${slug}`)
  
  if (!process.env.GEMINI_API_KEY) {
    console.error('[GENERATE] ERROR: GEMINI_API_KEY not set')
    throw new Error('GEMINI_API_KEY not set')
  }

  if (slug) {
    console.log(`[GENERATE] Checking rate limit for: ${slug}`)
    const canGenerate = await checkAndStartGeneration(slug)
    if (!canGenerate) {
      console.log(`[GENERATE] Rate limit exceeded for: ${slug}`)
      throw new Error('RATE_LIMIT_EXCEEDED')
    }
    console.log(`[GENERATE] Rate limit passed for: ${slug}`)
  }

  try {
    const title = slug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    const systemPrompt = await getSystemPrompt(true)
    const userPrompt = `Create a comprehensive Wikipedia-style article about "${title}" in your style. The article should be informative, engaging, and at least 2000-3000 characters long. Include multiple sections with headings (##), detailed explanations, and CRITICAL: Include AT LEAST 5-10 internal links to related topics throughout the article in Markdown format [text](/article_name). Every section should have multiple internal links. Links should be natural and relevant to the content. Examples of linkable terms: related concepts, historical figures, places, technologies, theories, etc. Write in the same sarcastic, witty style as Emma. Make it substantial and well-structured. Return ONLY the article content in Markdown format with internal links.`
    
    console.log(`[GENERATE] Prompts loaded (system: ${systemPrompt.length} chars, user: ${userPrompt.length} chars)`)

    const modelName = 'gemini-2.5-flash-lite'
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 32000,
      },
    })

    console.log(`[GENERATE] Calling Gemini API with ${modelName}...`)
    const apiStartTime = Date.now()
    const result = await model.generateContent(userPrompt)
    const apiDuration = Date.now() - apiStartTime
    console.log(`[GENERATE] API response received from ${modelName} (${apiDuration}ms)`)

    const response = result.response
    const text = response.text()
    
    if (!text || text.trim().length < 200) {
      console.error(`[GENERATE] ERROR: Empty or too short response (${text?.length || 0} chars)`)
      throw new Error('Empty or too short response from API')
    }
    
    const totalDuration = Date.now() - startTime
    console.log(`[GENERATE] Mini article generation completed for: ${slug} (${text.length} chars, ${totalDuration}ms total, ${apiDuration}ms API)`)
    return text
  } catch (error: any) {
    const totalDuration = Date.now() - startTime
    console.error(`[GENERATE] ERROR after ${totalDuration}ms for: ${slug}:`, error?.status || error?.message || error)
    
    // If 503 error, try with flash model
    if (error?.status === 503) {
      console.log(`[GENERATE] 503 error with lite model, retrying with gemini-2.5-flash...`)
      try {
        const title = slug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        const systemPrompt = await getSystemPrompt(true)
        const userPrompt = `Create a comprehensive Wikipedia-style article about "${title}" in your style. The article should be informative, engaging, and at least 2000-3000 characters long. Include multiple sections with headings (##), detailed explanations, and CRITICAL: Include AT LEAST 10-15 internal links to related topics throughout the article in Markdown format [text](/article_name). Every section should have multiple internal links. Links should be natural and relevant to the content. Examples of linkable terms: related concepts, historical figures, places, technologies, theories, etc. Write in the same sarcastic, witty style as Emma. Make it substantial and well-structured. Return ONLY the article content in Markdown format with internal links.`
        
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-2.5-flash',
          systemInstruction: systemPrompt,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 32000,
          },
        })

        const result = await model.generateContent(userPrompt)
        const text = result.response.text()
        
        if (!text || text.trim().length < 200) {
          throw new Error('Empty or too short response from API')
        }
        
        console.log(`[GENERATE] Mini article generation completed with flash model for: ${slug} (${text.length} chars)`)
        return text
      } catch (retryError: any) {
        console.error(`[GENERATE] ERROR on retry:`, retryError?.status || retryError?.message || retryError)
        throw new Error('API_ERROR')
      }
    }
    
    if (error.message === 'RATE_LIMIT_EXCEEDED') {
      throw error
    }
    
    throw new Error('GENERATE_ERROR')
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

