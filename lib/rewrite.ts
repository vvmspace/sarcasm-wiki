import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSystemPrompt, getUserPrompt } from './prompts'
import { checkAndStartGeneration } from './rate-limit'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

async function rewriteChunk(chunk: string, isFirst: boolean = false): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not set')
    return chunk
  }

  const systemPrompt = await getSystemPrompt(isFirst)
  const userPrompt = await getUserPrompt(chunk, isFirst)

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 32000,
    },
  })

  const result = await model.generateContent(userPrompt)

  const response = result.response
  return response.text() || chunk
}

export async function rewriteContent(content: string, links?: Map<string, string>, slug?: string): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not set, returning original content')
    return content
  }

  if (!content || content.trim().length < 100) {
    return content
  }

  if (slug) {
    const canGenerate = await checkAndStartGeneration(slug)
    if (!canGenerate) {
      throw new Error('RATE_LIMIT_EXCEEDED')
    }
  }

  try {
    const maxChunkLength = 30000
    const chunks: string[] = []
    
    if (content.length <= maxChunkLength) {
      const rewritten = await rewriteChunk(content, true)
      return rewritten || content
    }

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

    const rewrittenChunks: string[] = []
    for (let i = 0; i < chunks.length; i++) {
      const rewritten = await rewriteChunk(chunks[i], i === 0)
      rewrittenChunks.push(rewritten)
    }

    const finalContent = rewrittenChunks.join('\n\n')
    return finalContent
  } catch (error) {
    console.error('Error rewriting content:', error)
    return content
  }
}

