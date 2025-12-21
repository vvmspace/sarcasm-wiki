import fs from 'fs/promises'
import path from 'path'

const SITEMAP_DIR = path.join(process.cwd(), 'public', 'sitemaps')
const CONTENT_DIR = path.join(process.cwd(), 'content')
const URLS_PER_SITEMAP = 1000
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://sarcasm.wiki'

interface SitemapUrl {
  url: string
  lastModified: string
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
}

interface ArticleInfo {
  slug: string
  fileSize: number
  createdAt: string
  updatedAt: string
}

function normalizeFileName(slug: string): string {
  return slug.replace(/:/g, '_')
}

// Fast function to get article info without parsing MDC content
async function getArticlesForSitemap(): Promise<ArticleInfo[]> {
  try {
    await fs.mkdir(CONTENT_DIR, { recursive: true })
    const files = await fs.readdir(CONTENT_DIR)
    const mdcFiles = files.filter(file => file.endsWith('.mdc'))
    
    const articles: ArticleInfo[] = []
    
    for (const file of mdcFiles) {
      try {
        const filePath = path.join(CONTENT_DIR, file)
        const stats = await fs.stat(filePath)
        
        // Extract slug from filename - keep the same format as the file name
        const fileName = file.replace('.mdc', '')
        let slug: string
        if (fileName.startsWith('Category_')) {
          // For categories, replace Category_ with Category: and keep underscores in the rest
          slug = fileName.replace(/^Category_/, 'Category:')
        } else {
          // For regular articles, keep underscores as they are (URLs use underscores)
          slug = fileName
        }
        
        articles.push({
          slug,
          fileSize: stats.size,
          createdAt: stats.birthtime.toISOString(),
          updatedAt: stats.mtime.toISOString()
        })
      } catch (error) {
        console.warn(`[SITEMAP] Failed to get stats for ${file}:`, error)
        // Skip broken files
      }
    }
    
    return articles
  } catch (error) {
    console.error('[SITEMAP] Error getting articles for sitemap:', error)
    return []
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function generateSitemapXml(urls: SitemapUrl[]): string {
  const urlEntries = urls.map(entry => `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`
}

function generateSitemapIndexXml(sitemapFiles: string[]): string {
  const now = new Date().toISOString()
  const sitemapEntries = sitemapFiles.map(file => `  <sitemap>
    <loc>${BASE_URL}/sitemaps/${file}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`
}

async function generateSitemaps() {
  const startTime = Date.now()
  console.log('[SITEMAP] Starting sitemap generation...')

  // Create sitemap directory
  await fs.mkdir(SITEMAP_DIR, { recursive: true })

  // Get all articles using fast file system approach
  console.log('[SITEMAP] Fetching all articles...')
  let articles
  try {
    articles = await getArticlesForSitemap()
    console.log(`[SITEMAP] Found ${articles.length} articles`)
  } catch (error) {
    console.error('[SITEMAP] Error fetching articles:', error)
    throw new Error(`Failed to fetch articles: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  if (articles.length === 0) {
    console.warn('[SITEMAP] No articles found, generating minimal sitemap')
    // Generate minimal sitemap with just homepage
    const minimalUrls: SitemapUrl[] = [{
      url: BASE_URL,
      lastModified: new Date().toISOString(),
      changeFrequency: 'hourly',
      priority: 1.0,
    }]
    
    const chunks = [minimalUrls]
    const sitemapFiles: string[] = []
    
    const filename = 'sitemap-0.xml'
    const xml = generateSitemapXml(minimalUrls)
    await fs.writeFile(path.join(SITEMAP_DIR, filename), xml, 'utf-8')
    sitemapFiles.push(filename)
    
    const indexXml = generateSitemapIndexXml(sitemapFiles)
    await fs.writeFile(path.join(SITEMAP_DIR, 'sitemap-index.xml'), indexXml, 'utf-8')
    
    const metadata = {
      generatedAt: new Date().toISOString(),
      totalUrls: 1,
      sitemapCount: 1,
      sitemapFiles,
      maxFileSize: 0,
      priorityRange: { min: 1.0, max: 1.0 }
    }
    
    await fs.writeFile(
      path.join(SITEMAP_DIR, 'metadata.json'),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    )
    
    console.log('[SITEMAP] Generated minimal sitemap with homepage only')
    return metadata
  }

  // Calculate file sizes for priority calculation (without reading content)
  console.log('[SITEMAP] Calculating file sizes for priority...')
  
  // Articles already have file sizes from getArticlesForSitemap()
  const validArticles = articles

  if (validArticles.length === 0) {
    console.error('[SITEMAP] No valid articles found after processing')
    throw new Error('No valid articles available for sitemap generation')
  }

  // Find max file size for priority calculation
  const maxFileSize = Math.max(...validArticles.map(a => a.fileSize), 1)
  console.log(`[SITEMAP] Max file size: ${maxFileSize} bytes`)

  // Sort articles by creation date (newest first)
  const sortedArticles = validArticles.sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt || '1970-01-01').getTime()
    const dateB = new Date(b.updatedAt || b.createdAt || '1970-01-01').getTime()
    return dateB - dateA // Descending order (newest first)
  })

  console.log(`[SITEMAP] Articles sorted by date (newest first)`)

  // Create array of all URLs with dynamic priority based on file size
  const allUrls: SitemapUrl[] = [
    {
      url: BASE_URL,
      lastModified: new Date().toISOString(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    ...sortedArticles.map(article => {
      // Calculate priority: 0.6 + 0.3 * (fileSize / maxFileSize)
      const sizeRatio = article.fileSize / maxFileSize
      const calculatedPriority = 0.6 + 0.3 * sizeRatio
      const priority = Math.round(calculatedPriority * 100) / 100 // Round to 2 decimal places
      
      return {
        url: `${BASE_URL}/${article.slug}`,
        lastModified: article.updatedAt || article.createdAt || new Date().toISOString(),
        changeFrequency: 'daily' as const,
        priority: Math.min(priority, 0.9), // Cap at 0.9 to keep homepage priority higher
      }
    })
  ]

  console.log(`[SITEMAP] Total URLs: ${allUrls.length}`)
  console.log(`[SITEMAP] Priority range: ${Math.min(...allUrls.slice(1).map(u => u.priority)).toFixed(2)} - ${Math.max(...allUrls.slice(1).map(u => u.priority)).toFixed(2)}`)

  // Split into chunks of URLS_PER_SITEMAP
  const chunks: SitemapUrl[][] = []
  for (let i = 0; i < allUrls.length; i += URLS_PER_SITEMAP) {
    chunks.push(allUrls.slice(i, i + URLS_PER_SITEMAP))
  }

  console.log(`[SITEMAP] Creating ${chunks.length} sitemap files...`)

  // Generate sitemap files
  const sitemapFiles: string[] = []
  for (let i = 0; i < chunks.length; i++) {
    const filename = `sitemap-${i}.xml`
    const xml = generateSitemapXml(chunks[i])
    await fs.writeFile(path.join(SITEMAP_DIR, filename), xml, 'utf-8')
    sitemapFiles.push(filename)
    console.log(`[SITEMAP] Created ${filename} with ${chunks[i].length} URLs`)
  }

  // Generate index file
  const indexXml = generateSitemapIndexXml(sitemapFiles)
  await fs.writeFile(path.join(SITEMAP_DIR, 'sitemap-index.xml'), indexXml, 'utf-8')
  console.log('[SITEMAP] Created sitemap-index.xml')

  // Save generation metadata
  const metadata = {
    generatedAt: new Date().toISOString(),
    totalUrls: allUrls.length,
    sitemapCount: chunks.length,
    sitemapFiles,
    maxFileSize,
    priorityRange: {
      min: Math.min(...allUrls.slice(1).map(u => u.priority)),
      max: Math.max(...allUrls.slice(1).map(u => u.priority))
    }
  }
  await fs.writeFile(
    path.join(SITEMAP_DIR, 'metadata.json'),
    JSON.stringify(metadata, null, 2),
    'utf-8'
  )

  const duration = Date.now() - startTime
  console.log(`[SITEMAP] Sitemap generation completed in ${duration}ms`)
  console.log(`[SITEMAP] Generated ${chunks.length} sitemaps with ${allUrls.length} total URLs`)
  console.log(`[SITEMAP] Priority calculation: 0.6 + 0.3 * (file_size / ${maxFileSize})`)

  return metadata
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSitemaps()
    .then(() => {
      console.log('[SITEMAP] Done!')
      process.exit(0)
    })
    .catch(error => {
      console.error('[SITEMAP] Error:', error)
      process.exit(1)
    })
}

export { generateSitemaps }
