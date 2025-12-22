import cron from 'node-cron'
import { generateSitemaps } from '../scripts/generate-sitemap'
import { generateImageForLatestArticle } from './image-generator'

let isSchedulerStarted = false

export function startCronScheduler() {
  if (isSchedulerStarted) {
    console.log('[CRON] Scheduler already started')
    return
  }

  console.log('[CRON] Starting cron scheduler...')

  // Generate sitemaps every 3 hours
  cron.schedule('0 */3 * * *', async () => {
    console.log('[CRON] Starting scheduled sitemap generation...')
    try {
      await generateSitemaps()
      console.log('[CRON] Scheduled sitemap generation completed successfully')
    } catch (error) {
      console.error('[CRON] Scheduled sitemap generation failed:', error)
    }
  }, {
    timezone: "UTC"
  })

  // Generate images for articles every 15 minutes
  cron.schedule('*/7 * * * *', async () => {
    console.log('[CRON] Starting scheduled image generation...')
    try {
      const result = await generateImageForLatestArticle()
      if (result.success) {
        console.log(`[CRON] Scheduled image generation completed: ${result.message}`)
      } else {
        console.log(`[CRON] Scheduled image generation skipped: ${result.message}`)
      }
    } catch (error) {
      console.error('[CRON] Scheduled image generation failed:', error)
    }
  }, {
    timezone: "UTC"
  })

  // Optional: Generate sitemaps on startup if they don't exist or are very old (>6 hours)
  setTimeout(async () => {
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const metadataPath = path.join(process.cwd(), 'public', 'sitemaps', 'metadata.json')
      
      try {
        const content = await fs.readFile(metadataPath, 'utf-8')
        const metadata = JSON.parse(content)
        const generatedAt = new Date(metadata.generatedAt).getTime()
        const now = Date.now()
        const sixHours = 6 * 60 * 60 * 1000
        
        if ((now - generatedAt) > sixHours) {
          console.log('[CRON] Sitemaps are old, generating on startup...')
          await generateSitemaps()
          console.log('[CRON] Startup sitemap generation completed')
        } else {
          console.log('[CRON] Sitemaps are fresh, skipping startup generation')
        }
      } catch {
        console.log('[CRON] No existing sitemaps found, generating on startup...')
        await generateSitemaps()
        console.log('[CRON] Startup sitemap generation completed')
      }
    } catch (error) {
      console.error('[CRON] Startup sitemap generation failed:', error)
    }
  }, 5000) // Wait 5 seconds after startup

  isSchedulerStarted = true
  console.log('[CRON] Cron scheduler started successfully')
}

export function stopCronScheduler() {
  if (!isSchedulerStarted) {
    console.log('[CRON] Scheduler not running')
    return
  }

  cron.getTasks().forEach((task) => {
    task.stop()
  })
  
  isSchedulerStarted = false
  console.log('[CRON] Cron scheduler stopped')
}

// Manual trigger for sitemap generation (can be called via API)
export async function triggerSitemapGeneration() {
  console.log('[CRON] Manual sitemap generation triggered')
  try {
    await generateSitemaps()
    console.log('[CRON] Manual sitemap generation completed successfully')
    return { success: true, message: 'Sitemap generation completed' }
  } catch (error) {
    console.error('[CRON] Manual sitemap generation failed:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Manual trigger for image generation (can be called via API)
export async function triggerImageGeneration() {
  console.log('[CRON] Manual image generation triggered')
  try {
    const result = await generateImageForLatestArticle()
    console.log(`[CRON] Manual image generation result: ${result.message}`)
    return result
  } catch (error) {
    console.error('[CRON] Manual image generation failed:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' }
  }
}