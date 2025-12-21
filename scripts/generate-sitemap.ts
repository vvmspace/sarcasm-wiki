import fs from 'fs/promises'
import path from 'path'
import { getAllArticles } from '../lib/content'

const SITEMAP_DIR = path.join(process.cwd(), 'public', 'sitemaps')
const URLS_PER_SITEMAP = 1000
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://sarcasm.wiki'

interface SitemapUrl {
  url: string
  lastModified: string
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
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

  // Get all articles
  console.log('[SITEMAP] Fetching all articles...')
  const articles = await getAllArticles()
  console.log(`[SITEMAP] Found ${articles.length} articles`)

  // Sort articles by creation date (newest first)
  const sortedArticles = articles.sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt || '1970-01-01').getTime()
    const dateB = new Date(b.updatedAt || b.createdAt || '1970-01-01').getTime()
    return dateB - dateA // Descending order (newest first)
  })

  console.log(`[SITEMAP] Articles sorted by date (newest first)`)

  // Create array of all URLs
  const allUrls: SitemapUrl[] = [
    {
      url: BASE_URL,
      lastModified: new Date().toISOString(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    ...sortedArticles.map(article => ({
      url: `${BASE_URL}/${article.slug}`,
      lastModified: article.updatedAt || article.createdAt || new Date().toISOString(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))
  ]

  console.log(`[SITEMAP] Total URLs: ${allUrls.length}`)

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
  }
  await fs.writeFile(
    path.join(SITEMAP_DIR, 'metadata.json'),
    JSON.stringify(metadata, null, 2),
    'utf-8'
  )

  const duration = Date.now() - startTime
  console.log(`[SITEMAP] Sitemap generation completed in ${duration}ms`)
  console.log(`[SITEMAP] Generated ${chunks.length} sitemaps with ${allUrls.length} total URLs`)

  return metadata
}

// Run if called directly
if (require.main === module) {
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
