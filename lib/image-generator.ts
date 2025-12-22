import fs from 'fs/promises'
import path from 'path'
import { getLatestArticlesWithImagePriority } from './content'
import { GoogleGenerativeAI } from '@google/generative-ai'

const IMAGES_DIR = path.join(process.cwd(), 'public', 'images')
const IMAGES_METADATA_FILE = path.join(process.cwd(), '.temp', 'images-metadata.json')

interface ImageMetadata {
  slug: string
  title: string
  imagePath: string
  generatedAt: string
  aiProvider: string
  aiModel: string
  prompt: string
}

interface ImagesMetadata {
  images: ImageMetadata[]
  lastGenerated: string
  totalGenerated: number
}

/**
 * Gets image metadata
 */
async function getImagesMetadata(): Promise<ImagesMetadata> {
  try {
    const content = await fs.readFile(IMAGES_METADATA_FILE, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    return {
      images: [],
      lastGenerated: '',
      totalGenerated: 0
    }
  }
}

/**
 * Saves image metadata
 */
async function saveImagesMetadata(metadata: ImagesMetadata): Promise<void> {
  await fs.mkdir(path.dirname(IMAGES_METADATA_FILE), { recursive: true })
  await fs.writeFile(IMAGES_METADATA_FILE, JSON.stringify(metadata, null, 2), 'utf-8')
}

/**
 * Checks if an image exists for an article
 */
async function hasImage(slug: string): Promise<boolean> {
  const metadata = await getImagesMetadata()
  return metadata.images.some(img => img.slug === slug)
}

/**
 * Generates image prompt based on article title in Emma's style
 */
function generateImagePrompt(title: string): string {
  // Create prompt for generating MEMORABLE image in Emma Monday's artistic style
  const cleanTitle = title.replace(/Category:/g, '').replace(/_/g, ' ')
  
  return `Create an UNFORGETTABLE visual interpretation of "${cleanTitle}" in Emma Monday's distinctive artistic style.

Emma's MEMORABLE Visual DNA:
- Sharp, haunting minimalism that stays in your head for days
- Monochromatic palette with SHOCKING cold blue moments (#1976d2, #0066cc) that hit like ice water
- Geometric forms that feel like they're watching you back
- Shadows that suggest hidden meanings and uncomfortable truths
- Clean lines that somehow convey existential dread mixed with dark beauty
- Visual elements that make you do a double-take
- Composition that feels like it knows your secrets

MEMORABILITY FACTORS:
- Include ONE element that doesn't quite belong but feels perfectly right
- Create visual tension that makes viewers slightly uncomfortable but unable to look away
- Add a detail that only makes sense after staring for 30 seconds
- Use negative space to suggest something ominous or profound
- Make the viewer question what they're really looking at
- Include subtle visual "glitches" that feel intentional and unsettling

Psychological Impact:
- Beautiful but disturbing, like finding poetry in a crime scene
- Elegant in a way that makes you feel judged
- Sophisticated but with an undertone of "something's not quite right"
- The kind of image that pops into your head at 3 AM
- Visually sticky - once seen, impossible to unsee
- Makes viewers screenshot it to show friends with "look at this weird thing"

Technical Execution:
- High contrast that burns into retinas
- Lighting that creates impossible shadows
- Surfaces so smooth they feel alien
- Proportions that are almost right but deliberately wrong
- Visual metaphors that work on multiple disturbing levels
- Elements positioned to create maximum psychological impact

The image should haunt viewers in the best possible way - making them think about "${cleanTitle}" differently forever. Emma's art doesn't just inform; it rewires how you see the world.

No text, no safety nets, no comfortable familiarity. Just pure, distilled visual impact that follows you home.`
}

/**
 * Generates image with external AI service
 */
async function generateImageWithAI(prompt: string): Promise<{ imageData: Buffer, provider: string, model: string }> {
  console.log(`[IMAGE-GEN] Generating image with prompt: ${prompt}`)
  
  // First try Pollinations AI (free service)
  try {
    const result = await generateWithPollinations(prompt)
    if (result) return result
  } catch (error: any) {
    console.warn(`[IMAGE-GEN] Pollinations failed: ${error.message}`)
  }
  
  // Fallback to Gemini for SVG
  try {
    const result = await generateWithGemini(prompt)
    if (result) return result
  } catch (error: any) {
    console.warn(`[IMAGE-GEN] Gemini failed: ${error.message}`)
  }
  
  // Last fallback - SVG placeholder
  console.warn('[IMAGE-GEN] All AI services failed, using SVG placeholder')
  return generatePlaceholderSVG()
}

/**
 * Generates image via Pollinations AI in Emma's memorable style
 */
async function generateWithPollinations(prompt: string): Promise<{ imageData: Buffer, provider: string, model: string } | null> {
  try {
    // Extract topic from prompt
    const topicMatch = prompt.match(/interpretation of "([^"]+)"/)
    const topic = topicMatch ? topicMatch[1] : 'unknown topic'
    
    const imagePrompt = `UNFORGETTABLE Emma Monday artistic interpretation of "${topic}": haunting minimalist design, monochromatic with shocking cold blue moments, geometric forms that watch you back, impossible shadows, visual glitches that feel intentional, beautiful but disturbing, elegant judgment, psychological impact, burns into retinas, visually sticky, uncomfortable beauty, existential dread mixed with dark elegance, something not quite right, memorable visual tension, high contrast alien surfaces, rewires perception, follows you home, no text, trending on artstation`
    
    const encodedPrompt = encodeURIComponent(imagePrompt)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=400&model=flux&enhance=true&nologo=true`
    
    console.log(`[IMAGE-GEN] Generating UNFORGETTABLE Emma's artistic style for: ${topic}`)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 seconds
    
    const response = await fetch(imageUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Emma Monday Unforgettable Art Generator - Sarcasm Wiki'
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
    
    console.log(`[IMAGE-GEN] Successfully generated UNFORGETTABLE Emma's artistic interpretation with Pollinations AI (${imageData.length} bytes)`)
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

/**
 * Generates SVG image via Gemini in Emma's memorable artistic style
 */
async function generateWithGemini(prompt: string): Promise<{ imageData: Buffer, provider: string, model: string } | null> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim()
  
  if (!geminiKey) {
    return null
  }
  
  try {
    const genAI = new GoogleGenerativeAI(geminiKey)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.95, // Maximum creativity for unforgettable images
        maxOutputTokens: 4000,
      }
    })
    
    const imagePrompt = `Generate an UNFORGETTABLE SVG illustration based on this description: ${prompt}

Create this in Emma Monday's HAUNTING artistic style:

Technical SVG Requirements:
- Return ONLY the SVG code, nothing else
- Width: 800px, Height: 400px
- Use sharp, unsettling geometric forms with intentional wrongness

Emma's MEMORABLE Visual DNA:
- Monochromatic base with SHOCKING cold blue moments: #1976d2, #0066cc (use like lightning strikes)
- Blacks (#000000), whites (#ffffff), greys that feel alive (#1a1a1a, #4a4a4a, #7a7a7a)
- Negative space that suggests hidden watchers
- Geometric shapes that almost make sense but don't quite
- Shadows that fall in impossible directions
- Visual elements that make you question reality

MEMORABILITY AMPLIFIERS:
- Include ONE element that defies logic but feels essential
- Create visual paradoxes that hurt to think about
- Use asymmetry that feels like a mistake but isn't
- Add details that only become clear after prolonged staring
- Make proportions that are subtly, disturbingly wrong
- Include "glitch" elements that feel intentional and ominous

Psychological Impact Goals:
- Beautiful enough to screenshot, disturbing enough to haunt dreams
- Elegant but with undertones of cosmic horror
- Sophisticated in a way that makes viewers feel watched
- The kind of image that changes how you see the topic forever
- Visually "sticky" - impossible to forget once seen
- Makes people say "I can't stop looking at this"

Composition Directives:
- Use impossible geometry that somehow works
- Create visual tension that makes viewers physically uncomfortable
- Include elements positioned to maximum psychological effect
- Make the viewer feel like they're missing something important
- Suggest depth that goes beyond the screen
- Use lighting that creates more questions than answers

The SVG should be a visual earworm - once seen, it rewires how the viewer thinks about the subject. Emma's art doesn't just illustrate; it infects consciousness.

No text, no comfort, no familiar reference points. Just pure, concentrated visual impact that follows viewers home and whispers in their peripheral vision.`

    console.log(`[IMAGE-GEN] Using Emma's UNFORGETTABLE Gemini model: gemini-2.0-flash-exp`)
    
    const result = await model.generateContent(imagePrompt)
    const response = result.response
    let svgContent = response.text()
    
    if (!svgContent) {
      return null
    }
    
    // Extract SVG from markdown code block if present
    const svgMatch = svgContent.match(/```(?:svg)?\s*([\s\S]*?)```/)
    if (svgMatch) {
      svgContent = svgMatch[1].trim()
    }
    
    // Check that this is valid SVG
    if (!svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
      return null
    }
    
    // Clean SVG from extra characters
    svgContent = svgContent.trim()
    
    const imageData = Buffer.from(svgContent, 'utf-8')
    
    console.log(`[IMAGE-GEN] Successfully generated UNFORGETTABLE Emma's artistic SVG with Gemini (${imageData.length} bytes)`)
    return {
      imageData,
      provider: 'Emma-Haunting-Gemini',
      model: 'gemini-emma-unforgettable'
    }
  } catch (error: any) {
    console.warn(`[IMAGE-GEN] Gemini error: ${error.message}`)
    return null
  }
}

/**
 * Generates SVG placeholder in Emma's artistic style
 */
function generatePlaceholderSVG(): { imageData: Buffer, provider: string, model: string } {
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
    
    <!-- Monochromatic base with cold undertones -->
    <rect width="800" height="400" fill="#000000" />
    
    <!-- Asymmetric geometric forms - intentionally off-center -->
    <rect x="50" y="80" width="280" height="240" fill="url(#sharpGrad)" opacity="0.4" />
    <rect x="470" y="120" width="280" height="200" fill="#333333" opacity="0.3" />
    
    <!-- Sharp diagonal cuts - creating tension -->
    <polygon points="0,0 200,0 0,150" fill="#1976d2" opacity="0.15" />
    <polygon points="800,400 600,400 800,250" fill="#0066cc" opacity="0.15" />
    
    <!-- Negative space circles - what's NOT there matters -->
    <circle cx="180" cy="200" r="60" fill="#000000" opacity="0.8" />
    <circle cx="620" cy="220" r="50" fill="#000000" opacity="0.8" />
    
    <!-- Deliberate imperfection - asymmetric line -->
    <path d="M100 300 Q400 280 700 310" stroke="#ffffff" stroke-width="1" fill="none" opacity="0.3" />
    
    <!-- Cold blue accent - used sparingly like punctuation -->
    <rect x="350" y="180" width="100" height="40" fill="#1976d2" opacity="0.6" />
    
    <!-- Sharp, clean text with Emma's signature weariness -->
    <text x="400" y="360" font-family="Arial, sans-serif" font-size="14" fill="#999999" text-anchor="middle" opacity="0.7" font-style="italic">
      "Oh. You need a placeholder. How... unexpected."
    </text>
    <text x="400" y="385" font-family="Arial, sans-serif" font-size="10" fill="#666666" text-anchor="middle" opacity="0.5">
      — Emma Monday
    </text>
  </svg>`
  
  return {
    imageData: Buffer.from(svgContent, 'utf-8'),
    provider: 'Emma-Artistic-Placeholder',
    model: 'emma-aesthetic-fallback'
  }
}

/**
 * Saves image to filesystem
 */
async function saveImage(slug: string, imageData: Buffer, provider: string): Promise<string> {
  await fs.mkdir(IMAGES_DIR, { recursive: true })
  
  // Determine file extension by content
  let extension = 'jpg' // default
  let fileName = `${slug}.${extension}`
  
  // Check image type by headers
  if (imageData.toString('utf8', 0, 100).includes('<svg')) {
    extension = 'svg'
    fileName = `${slug}.${extension}`
  } else if (imageData[0] === 0x89 && imageData[1] === 0x50 && imageData[2] === 0x4E && imageData[3] === 0x47) {
    extension = 'png'
    fileName = `${slug}.${extension}`
  } else if (imageData[0] === 0xFF && imageData[1] === 0xD8 && imageData[2] === 0xFF) {
    extension = 'jpg'
    fileName = `${slug}.${extension}`
  }
  
  const filePath = path.join(IMAGES_DIR, fileName)
  
  await fs.writeFile(filePath, imageData)
  
  console.log(`[IMAGE-GEN] Saved ${extension.toUpperCase()} image: ${fileName} (${imageData.length} bytes)`)
  
  return `/images/${fileName}`
}

/**
 * Finds the latest generated article without image (OPTIMIZED VERSION)
 */
async function findLatestArticleWithoutImage(): Promise<{ slug: string, title: string } | null> {
  try {
    console.log('[IMAGE-GEN] Looking for latest article without image (optimized)...')
    
    // Use optimized function instead of getAllArticles
    const articles = await getLatestArticlesWithImagePriority(50) // Take more articles for search
    
    if (articles.length === 0) {
      console.log('[IMAGE-GEN] No articles found')
      return null
    }
    
    // Get list of existing images from metadata
    const metadata = await getImagesMetadata()
    const existingImageSlugs = new Set(metadata.images.map(img => img.slug))
    
    console.log(`[IMAGE-GEN] Checking ${articles.length} articles against ${existingImageSlugs.size} existing images`)
    
    // Look for first article without image
    for (const article of articles) {
      if (!existingImageSlugs.has(article.slug)) {
        console.log(`[IMAGE-GEN] Found article without image: ${article.slug}`)
        return {
          slug: article.slug,
          title: article.title
        }
      }
    }
    
    console.log('[IMAGE-GEN] All checked articles already have images')
    return null
  } catch (error) {
    console.error('[IMAGE-GEN] Error finding article without image:', error)
    return null
  }
}

/**
 * Generates image for article
 */
export async function generateImageForArticle(slug: string, title: string): Promise<boolean> {
  try {
    console.log(`[IMAGE-GEN] Starting image generation for: ${slug}`)
    
    // Check if image already exists
    if (await hasImage(slug)) {
      console.log(`[IMAGE-GEN] Image already exists for: ${slug}`)
      return false
    }
    
    // Generate prompt
    const prompt = generateImagePrompt(title)
    
    // Generate image
    const { imageData, provider, model } = await generateImageWithAI(prompt)
    
    // Save image
    const imagePath = await saveImage(slug, imageData, provider)
    
    // Update metadata
    const metadata = await getImagesMetadata()
    metadata.images.push({
      slug,
      title,
      imagePath,
      generatedAt: new Date().toISOString(),
      aiProvider: provider,
      aiModel: model,
      prompt
    })
    metadata.lastGenerated = slug
    metadata.totalGenerated = metadata.images.length
    
    await saveImagesMetadata(metadata)
    
    console.log(`[IMAGE-GEN] Successfully generated image for: ${slug} at ${imagePath}`)
    return true
  } catch (error) {
    console.error(`[IMAGE-GEN] Failed to generate image for ${slug}:`, error)
    return false
  }
}

/**
 * Automatically generates image for latest article without image
 */
export async function generateImageForLatestArticle(): Promise<{ success: boolean, slug?: string, message: string }> {
  try {
    console.log('[IMAGE-GEN] Looking for latest article without image...')
    
    const article = await findLatestArticleWithoutImage()
    
    if (!article) {
      const message = 'No articles found without images'
      console.log(`[IMAGE-GEN] ${message}`)
      return { success: false, message }
    }
    
    console.log(`[IMAGE-GEN] Found article without image: ${article.slug}`)
    
    const success = await generateImageForArticle(article.slug, article.title)
    
    if (success) {
      const message = `Successfully generated image for: ${article.slug}`
      console.log(`[IMAGE-GEN] ${message}`)
      return { success: true, slug: article.slug, message }
    } else {
      const message = `Failed to generate image for: ${article.slug}`
      console.log(`[IMAGE-GEN] ${message}`)
      return { success: false, slug: article.slug, message }
    }
  } catch (error) {
    const message = `Error in automatic image generation: ${error instanceof Error ? error.message : 'Unknown error'}`
    console.error(`[IMAGE-GEN] ${message}`)
    return { success: false, message }
  }
}

/**
 * Gets image statistics
 */
export async function getImageStats(): Promise<ImagesMetadata> {
  return await getImagesMetadata()
}

/**
 * Gets image path for article
 */
export async function getImageForArticle(slug: string): Promise<string | null> {
  const metadata = await getImagesMetadata()
  const image = metadata.images.find(img => img.slug === slug)
  return image ? image.imagePath : null
}