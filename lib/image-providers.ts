import { GoogleGenerativeAI } from '@google/generative-ai'
import { getPromptTemplate, renderPromptTemplate } from './prompts'

export interface ImageGenerationResult {
  imageData: Buffer
  provider: string
  model: string
}

export interface ImageProvider {
  name: string
  generate: (prompt: string) => Promise<ImageGenerationResult | null>
}

class PollinationsImageProvider implements ImageProvider {
  name = 'Pollinations'

  async generate(prompt: string): Promise<ImageGenerationResult | null> {
    try {
      const topicMatch = prompt.match(/interpretation of "([^"]+)"/)
      const topic = topicMatch ? topicMatch[1] : 'unknown topic'

      const template = await getPromptTemplate('image-pollinations.md')
      const imagePrompt = renderPromptTemplate(template, { topic })

      const encodedPrompt = encodeURIComponent(imagePrompt)
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1600&height=800&model=flux&enhance=true&nologo=true`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      const response = await fetch(imageUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Sarcasm Wiki Image Generator'
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Pollinations API error: ${response.status}`)
      }

      const imageData = Buffer.from(await response.arrayBuffer())

      if (imageData.length < 1000) {
        throw new Error('Image too small, likely an error')
      }

      return {
        imageData,
        provider: 'Emma-Unforgettable-AI',
        model: 'flux-emma-haunting'
      }
    } catch (error: any) {
      console.warn(`[IMAGE-GEN] Pollinations error: ${error.message}`)
      return null
    }
  }
}

class GeminiSvgImageProvider implements ImageProvider {
  name = 'GeminiSVG'

  async generate(prompt: string): Promise<ImageGenerationResult | null> {
    const geminiKey = process.env.GEMINI_API_KEY?.trim()

    if (!geminiKey) {
      return null
    }

    try {
      const genAI = new GoogleGenerativeAI(geminiKey)
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.95,
          maxOutputTokens: 4000,
        }
      })

      const template = await getPromptTemplate('image-gemini-svg.md')
      const imagePrompt = renderPromptTemplate(template, { prompt })

      const result = await model.generateContent(imagePrompt)
      const response = result.response
      let svgContent = response.text()

      if (!svgContent) {
        return null
      }

      const svgMatch = svgContent.match(/```(?:svg)?\s*([\s\S]*?)```/)
      if (svgMatch) {
        svgContent = svgMatch[1].trim()
      }

      if (!svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
        return null
      }

      svgContent = svgContent.trim()

      return {
        imageData: Buffer.from(svgContent, 'utf-8'),
        provider: 'Emma-Haunting-Gemini',
        model: 'gemini-emma-unforgettable'
      }
    } catch (error: any) {
      console.warn(`[IMAGE-GEN] Gemini error: ${error.message}`)
      return null
    }
  }
}

class PlaceholderImageProvider implements ImageProvider {
  name = 'Placeholder'

  async generate(_prompt: string): Promise<ImageGenerationResult | null> {
    const svgContent = `<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="coldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#000000;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1976d2;stop-opacity:0.3" />
    </linearGradient>
    <linearGradient id="sharpGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#333333;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#666666;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="800" height="400" fill="#000000" />
  <rect x="50" y="80" width="280" height="240" fill="url(#sharpGrad)" opacity="0.4" />
  <rect x="470" y="120" width="280" height="200" fill="#333333" opacity="0.3" />
  <polygon points="0,0 200,0 0,150" fill="#1976d2" opacity="0.15" />
  <polygon points="800,400 600,400 800,250" fill="#0066cc" opacity="0.15" />
  <circle cx="180" cy="200" r="60" fill="#000000" opacity="0.8" />
  <circle cx="620" cy="220" r="50" fill="#000000" opacity="0.8" />
  <path d="M100 300 Q400 280 700 310" stroke="#ffffff" stroke-width="1" fill="none" opacity="0.3" />
  <rect x="350" y="180" width="100" height="40" fill="#1976d2" opacity="0.6" />
  <text x="400" y="360" font-family="Arial, sans-serif" font-size="14" fill="#999999" text-anchor="middle" opacity="0.7" font-style="italic">"Oh. You need a placeholder. How... unexpected."</text>
  <text x="400" y="385" font-family="Arial, sans-serif" font-size="10" fill="#666666" text-anchor="middle" opacity="0.5">— Emma Monday</text>
</svg>`

    return {
      imageData: Buffer.from(svgContent, 'utf-8'),
      provider: 'Emma-Artistic-Placeholder',
      model: 'emma-aesthetic-fallback'
    }
  }
}

let cachedProviders: ImageProvider[] | null = null

export function getImageProviders(): ImageProvider[] {
  if (cachedProviders) return cachedProviders

  cachedProviders = [
    new PollinationsImageProvider(),
    new GeminiSvgImageProvider(),
    new PlaceholderImageProvider(),
  ]

  return cachedProviders
}

export async function generateImageWithProviders(prompt: string, providers: ImageProvider[]): Promise<ImageGenerationResult> {
  for (const provider of providers) {
    const result = await provider.generate(prompt)
    if (result) return result
  }

  const fallback = new PlaceholderImageProvider()
  const result = await fallback.generate(prompt)
  if (!result) {
    throw new Error('Placeholder provider returned no result')
  }
  return result
}
