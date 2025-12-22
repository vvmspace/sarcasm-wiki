import { GoogleGenerativeAI } from '@google/generative-ai'

export interface AIProvider {
  name: string
  generateContent: (prompt: string, systemPrompt?: string) => Promise<AIGenerationResult>
  models: string[]
}

export interface AIGenerationResult {
  content: string
  provider: string
  model: string
}

export interface AIConfig {
  temperature: number
  maxOutputTokens: number
}

// Collect all API keys from environment
function collectAPIKeys(): {
  gemini: string[]
  openrouter: string[]
  openai: string[]
} {
  const keys = {
    gemini: [] as string[],
    openrouter: [] as string[],
    openai: [] as string[]
  }

  // Collect Gemini keys
  const geminiKeys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(k => k.length > 0)
  keys.gemini.push(...geminiKeys)

  // Collect OpenRouter keys
  const openrouterKeys = (process.env.OPENROUTER_API_KEY || '').split(',').map(k => k.trim()).filter(k => k.length > 0)
  keys.openrouter.push(...openrouterKeys)

  // Collect OpenAI keys
  const openaiKeys = (process.env.OPENAI_API_KEY || '').split(',').map(k => k.trim()).filter(k => k.length > 0)
  keys.openai.push(...openaiKeys)

  console.log(`[AI] Collected keys: Gemini(${keys.gemini.length}), OpenRouter(${keys.openrouter.length}), OpenAI(${keys.openai.length})`)
  return keys
}

// Gemini Provider
class GeminiProvider implements AIProvider {
  name = 'Gemini'
  models = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite', 
    'gemini-2.5-pro'
  ]
  
  private keys: string[]
  
  constructor(keys: string[]) {
    this.keys = keys
  }

  private getRandomKey(): string {
    if (this.keys.length === 0) {
      throw new Error('No Gemini API keys available')
    }
    return this.keys[Math.floor(Math.random() * this.keys.length)]
  }

  private getRandomModel(): string {
    return this.models[Math.floor(Math.random() * this.models.length)]
  }

  async generateContent(prompt: string, systemPrompt?: string): Promise<AIGenerationResult> {
    const key = this.getRandomKey()
    const model = this.getRandomModel()
    
    console.log(`[AI] Using Gemini ${model}`)
    
    const ai = new GoogleGenerativeAI(key)
    const genModel = ai.getGenerativeModel({
      model,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 32000,
      },
    })

    const result = await genModel.generateContent(prompt)
    const response = result.response
    
    // Debug logging
    console.log(`[AI] Gemini response structure:`, {
      hasResponse: !!response,
      hasText: !!response.text,
      textLength: response.text()?.length || 0
    })
    
    const text = response.text()
    
    if (!text) {
      console.error(`[AI] Gemini returned no content. Full response:`, JSON.stringify(response, null, 2))
      throw new Error('No content in Gemini API response')
    }
    
    if (text.trim().length < 50) {
      console.error(`[AI] Gemini returned too short content (${text.length} chars): "${text}"`)
      throw new Error(`Gemini returned too short response: ${text.length} chars`)
    }
    
    console.log(`[AI] Gemini success: ${text.length} chars`)
    return {
      content: text,
      provider: this.name,
      model: model
    }
  }
}

// OpenRouter Provider
class OpenRouterProvider implements AIProvider {
  name = 'OpenRouter'
  models = [
    'openai/gpt-4o-mini',
    'openai/gpt-4o',
    'anthropic/claude-3-haiku',
    'anthropic/claude-3.5-sonnet',
    'google/gemini-2.0-flash-exp',
    'meta-llama/llama-3.1-70b-instruct',
    // Новые бесплатные модели
    'mistralai/devstral-2512:free',
    'nvidia/nemotron-3-nano-30b-a3b:free',
    'allenai/olmo-3.1-32b-think:free',
    'nex-agi/deepseek-v3.1-nex-n1:free',
    'tngtech/deepseek-r1t2-chimera:free'
  ]
  
  private keys: string[]
  
  constructor(keys: string[]) {
    this.keys = keys
  }

  private getRandomKey(): string {
    if (this.keys.length === 0) {
      throw new Error('No OpenRouter API keys available')
    }
    return this.keys[Math.floor(Math.random() * this.keys.length)]
  }

  private getRandomModel(): string {
    return this.models[Math.floor(Math.random() * this.models.length)]
  }

  async generateContent(prompt: string, systemPrompt?: string): Promise<AIGenerationResult> {
    const key = this.getRandomKey()
    const model = this.getRandomModel()
    
    console.log(`[AI] Using OpenRouter ${model}`)
    
    const messages = []
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    messages.push({ role: 'user', content: prompt })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'https://sarcasm.wiki',
          'X-Title': 'Sarcasm Wiki'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 32000,
          stream: false
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[AI] OpenRouter API error (${response.status}):`, errorText)
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      
      // Debug logging
      console.log(`[AI] OpenRouter response structure:`, {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length || 0,
        firstChoice: data.choices?.[0] ? {
          hasMessage: !!data.choices[0].message,
          hasContent: !!data.choices[0].message?.content,
          contentLength: data.choices[0].message?.content?.length || 0
        } : null,
        error: data.error
      })
      
      if (data.error) {
        console.error(`[AI] OpenRouter API returned error:`, data.error)
        throw new Error(`OpenRouter API error: ${data.error.message || JSON.stringify(data.error)}`)
      }
      
      const text = data.choices?.[0]?.message?.content

      if (!text) {
        console.error(`[AI] OpenRouter returned no content. Full response:`, JSON.stringify(data, null, 2))
        throw new Error('No content in OpenRouter API response')
      }
      
      if (text.trim().length < 50) {
        console.error(`[AI] OpenRouter returned too short content (${text.length} chars): "${text}"`)
        throw new Error(`OpenRouter returned too short response: ${text.length} chars`)
      }

      console.log(`[AI] OpenRouter success: ${text.length} chars`)
      return {
        content: text,
        provider: this.name,
        model: model
      }
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('OpenRouter API timeout after 60 seconds')
      }
      throw error
    }
  }
}

// OpenAI Provider (direct)
class OpenAIProvider implements AIProvider {
  name = 'OpenAI'
  models = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo'
  ]
  
  private keys: string[]
  
  constructor(keys: string[]) {
    this.keys = keys
  }

  private getRandomKey(): string {
    if (this.keys.length === 0) {
      throw new Error('No OpenAI API keys available')
    }
    return this.keys[Math.floor(Math.random() * this.keys.length)]
  }

  private getRandomModel(): string {
    return this.models[Math.floor(Math.random() * this.models.length)]
  }

  async generateContent(prompt: string, systemPrompt?: string): Promise<AIGenerationResult> {
    const key = this.getRandomKey()
    const model = this.getRandomModel()
    
    console.log(`[AI] Using OpenAI ${model}`)
    
    const messages = []
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    messages.push({ role: 'user', content: prompt })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 32000,
          stream: false
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[AI] OpenAI API error (${response.status}):`, errorText)
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      
      // Debug logging
      console.log(`[AI] OpenAI response structure:`, {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length || 0,
        firstChoice: data.choices?.[0] ? {
          hasMessage: !!data.choices[0].message,
          hasContent: !!data.choices[0].message?.content,
          contentLength: data.choices[0].message?.content?.length || 0
        } : null,
        error: data.error
      })
      
      if (data.error) {
        console.error(`[AI] OpenAI API returned error:`, data.error)
        throw new Error(`OpenAI API error: ${data.error.message || JSON.stringify(data.error)}`)
      }
      
      const text = data.choices?.[0]?.message?.content

      if (!text) {
        console.error(`[AI] OpenAI returned no content. Full response:`, JSON.stringify(data, null, 2))
        throw new Error('No content in OpenAI API response')
      }
      
      if (text.trim().length < 50) {
        console.error(`[AI] OpenAI returned too short content (${text.length} chars): "${text}"`)
        throw new Error(`OpenAI returned too short response: ${text.length} chars`)
      }

      console.log(`[AI] OpenAI success: ${text.length} chars`)
      return {
        content: text,
        provider: this.name,
        model: model
      }
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('OpenAI API timeout after 60 seconds')
      }
      throw error
    }
  }
}

// Main AI Manager
export class AIManager {
  private providers: AIProvider[] = []
  
  constructor() {
    const keys = collectAPIKeys()
    
    // Initialize providers based on available keys
    if (keys.gemini.length > 0) {
      this.providers.push(new GeminiProvider(keys.gemini))
    }
    
    if (keys.openrouter.length > 0) {
      this.providers.push(new OpenRouterProvider(keys.openrouter))
    }
    
    if (keys.openai.length > 0) {
      this.providers.push(new OpenAIProvider(keys.openai))
    }
    
    if (this.providers.length === 0) {
      throw new Error('No AI providers available. Please set GEMINI_API_KEY, OPENROUTER_API_KEY, or OPENAI_API_KEY')
    }
    
    console.log(`[AI] Initialized ${this.providers.length} providers: ${this.providers.map(p => p.name).join(', ')}`)
  }
  
  getRandomProvider(): AIProvider {
    return this.providers[Math.floor(Math.random() * this.providers.length)]
  }
  
  async generateContent(prompt: string, systemPrompt?: string): Promise<AIGenerationResult> {
    const provider = this.getRandomProvider()
    
    try {
      console.log(`[AI] Using ${provider.name}`)
      const result = await provider.generateContent(prompt, systemPrompt)
      console.log(`[AI] Success with ${provider.name}`)
      return result
    } catch (error: any) {
      console.error(`[AI] Error with ${provider.name}:`, error.message)
      
      // Try with a different provider if available (single fallback only)
      if (this.providers.length > 1) {
        const otherProviders = this.providers.filter(p => p !== provider)
        const fallbackProvider = otherProviders[Math.floor(Math.random() * otherProviders.length)]
        
        console.log(`[AI] Single fallback attempt with ${fallbackProvider.name}`)
        try {
          const result = await fallbackProvider.generateContent(prompt, systemPrompt)
          console.log(`[AI] Fallback success with ${fallbackProvider.name}`)
          return result
        } catch (fallbackError: any) {
          console.error(`[AI] Fallback failed with ${fallbackProvider.name}:`, fallbackError.message)
          throw fallbackError
        }
      }
      
      throw error
    }
  }
  
  getStats(): {
    totalProviders: number
    providers: Array<{ name: string, models: number }>
  } {
    return {
      totalProviders: this.providers.length,
      providers: this.providers.map(p => ({
        name: p.name,
        models: p.models.length
      }))
    }
  }
}

// Singleton instance
let aiManager: AIManager | null = null

export function getAIManager(): AIManager {
  if (!aiManager) {
    aiManager = new AIManager()
  }
  return aiManager
}