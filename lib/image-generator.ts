import fs from 'fs/promises'
import path from 'path'
import { getMetadataOnlyBySlug, getPageMDC } from './content'
import { getPromptTemplate, renderPromptTemplate } from './prompts'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { generateImageWithProviders, getImageProviders } from './image-providers'

const IMAGES_DIR = path.join(process.cwd(), 'public', 'images')
const IMAGES_METADATA_FILE = path.join(process.cwd(), '.temp', 'images-metadata.json')
const CONTENT_DIR = path.join(process.cwd(), 'content')

interface ImageMetadata {
  slug: string
  title: string
  imagePath: string
  generatedAt: string
  aiProvider: string
  aiModel: string
  prompt: string
}

function fileNameToSlug(fileName: string): string {
  const base = fileName.replace(/\.mdc$/i, '')
  if (base.startsWith('Category_')) {
    return base.replace(/^Category_/, 'Category:')
  }
  return base
}

async function getRecentArticleSlugsByFileTime(limit: number): Promise<string[]> {
  try {
    const files = await fs.readdir(CONTENT_DIR)
    const mdcFiles = files.filter(f => f.endsWith('.mdc'))

    const withDates: Array<{ fileName: string, modifiedAtMs: number }> = []

    for (const fileName of mdcFiles) {
      try {
        const stats = await fs.stat(path.join(CONTENT_DIR, fileName))
        const modifiedAtMs = stats.mtimeMs || stats.birthtimeMs
        withDates.push({ fileName, modifiedAtMs })
      } catch {
        // ignore broken files
      }
    }

    withDates.sort((a, b) => b.modifiedAtMs - a.modifiedAtMs)

    return withDates.slice(0, limit).map(({ fileName }) => fileNameToSlug(fileName))
  } catch {
    return []
  }
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
function generateImagePrompt(title: string, imageDescription?: string): string {
  // NOTE: Template is loaded at call sites (async). This function remains for backward compatibility.
  // It should not be called directly anymore.
  const cleanTitle = title.replace(/Category:/g, '').replace(/_/g, ' ')
  const cleanedDescription = (imageDescription || '').trim()
  return `Create an UNFORGETTABLE visual interpretation of "${cleanTitle}" in Emma Monday's distinctive artistic style.

IMAGE DESCRIPTION (use as the concrete scene to depict; do not add text):
${cleanedDescription || '(No description available; infer a strong visual scene from the title.)'}`
}

function extractPlainTextFromMarkdown(markdown: string, maxChars: number): string {
  let text = markdown
  text = text.replace(/```[\s\S]*?```/g, ' ')
  text = text.replace(/`[^`]*`/g, ' ')
  text = text.replace(/!\[[^\]]*\]\([^\)]*\)/g, ' ')
  text = text.replace(/\[[^\]]*\]\([^\)]*\)/g, ' ')
  text = text.replace(/^#{1,6}\s+/gm, '')
  text = text.replace(/[*_~>#-]+/g, ' ')
  text = text.replace(/\s+/g, ' ').trim()
  if (text.length > maxChars) {
    text = text.slice(0, maxChars).trim()
  }
  return text
}

async function generateImageDescriptionFromArticle(title: string, articleMarkdown: string): Promise<{ description: string | null, provider?: string, model?: string }> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim()
  if (!geminiKey) {
    return { description: null }
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 256,
      }
    })

    const cleanTitle = title.replace(/Category:/g, '').replace(/_/g, ' ')
    const articleText = extractPlainTextFromMarkdown(articleMarkdown, 2500)

    const template = await getPromptTemplate('image-caption.md')
    const prompt = renderPromptTemplate(template, {
      title_clean: cleanTitle,
      article_text: articleText
    })

    const result = await model.generateContent(prompt)
    const response = result.response
    const raw = response.text()?.trim()
    if (!raw) return { description: null }

    const normalized = raw.replace(/^"|"$/g, '').replace(/\s+/g, ' ').trim()
    if (!normalized) return { description: null }

    return { description: normalized, provider: 'Gemini', model: 'gemini-2.0-flash-exp' }
  } catch (error: any) {
    console.warn(`[IMAGE-GEN] Caption generation failed: ${error.message}`)
    return { description: null }
  }
}

/**
 * Generates image with external AI service
 */
async function generateImageWithAI(prompt: string): Promise<{ imageData: Buffer, provider: string, model: string }> {
  console.log(`[IMAGE-GEN] Generating image with prompt: ${prompt}`)
  const providers = getImageProviders()
  return await generateImageWithProviders(prompt, providers)
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

async function getRecentImageSlugsByFileCreateTime(limit: number): Promise<Set<string>> {
  try {
    const files = await fs.readdir(IMAGES_DIR)
    const imageFiles = files
      .filter(f => f !== '.gitkeep')
      .filter(f => /\.(jpg|jpeg|png|svg)$/i.test(f))

    const withDates: Array<{ fileName: string, createdAtMs: number }> = []

    for (const fileName of imageFiles) {
      try {
        const stats = await fs.stat(path.join(IMAGES_DIR, fileName))
        // IMPORTANT:
        // - On many systems rsync/copy operations can bump ctime for lots of files at once,
        //   making "newest by ctime" meaningless.
        // - birthtime is the best signal when available; otherwise fall back to mtime.
        const createdAtMs = stats.birthtimeMs || stats.mtimeMs
        withDates.push({ fileName, createdAtMs })
      } catch {
        // ignore broken files
      }
    }

    withDates.sort((a, b) => b.createdAtMs - a.createdAtMs)

    const recent = withDates.slice(0, limit)

    if (recent.length > 0) {
      const newest = recent[0]
      console.log(`[IMAGE-GEN] Newest image by fs time: ${newest.fileName} (${new Date(newest.createdAtMs).toISOString()})`)
    }

    return new Set(
      recent.map(({ fileName }) => fileName.replace(/\.(jpg|jpeg|png|svg)$/i, ''))
    )
  } catch {
    return new Set()
  }
}

/**
 * Finds the latest generated article without image (OPTIMIZED VERSION)
 */
async function findLatestArticleWithoutImage(): Promise<{ slug: string, title: string } | null> {
  try {
    console.log('[IMAGE-GEN] Looking for latest article without image (by filesystem time)...')

    // Take 100 newest images by filesystem time
    const recentImageSlugs = await getRecentImageSlugsByFileCreateTime(100)

    // Take 100 newest article files by filesystem time
    const recentArticleSlugs = await getRecentArticleSlugsByFileTime(100)

    console.log(`[IMAGE-GEN] Checking ${recentArticleSlugs.length} latest-by-fs articles against ${recentImageSlugs.size} recent images`)

    for (const slug of recentArticleSlugs) {
      if (recentImageSlugs.has(slug)) continue

      const metadata = await getMetadataOnlyBySlug(slug)
      if (!metadata) continue

      console.log(`[IMAGE-GEN] Found article without image: ${metadata.slug}`)
      return { slug: metadata.slug, title: metadata.title }
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
    
    const page = await getPageMDC(slug, false, false)
    const articleMarkdown = page?.content || ''
    const { description, provider: captionProvider, model: captionModel } = await generateImageDescriptionFromArticle(title, articleMarkdown)
    let finalDescription = description
    if (finalDescription) {
      console.log(`[IMAGE-GEN] Image caption (${captionProvider}/${captionModel}): ${finalDescription}`)
    } else {
      // Fallback: still use article text (not only title) to provide a concrete scene hint.
      // Keep it short so the downstream image models stay focused.
      const fallback = extractPlainTextFromMarkdown(articleMarkdown, 320)
      if (fallback) {
        finalDescription = fallback
        console.log('[IMAGE-GEN] Using fallback caption derived from article text')
      }
    }

    // Generate prompt
    const template = await getPromptTemplate('image-emma.md')
    const prompt = renderPromptTemplate(template, {
      title_clean: title.replace(/Category:/g, '').replace(/_/g, ' '),
      image_description: finalDescription || ''
    })
    
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