import { MetadataRoute } from 'next'
import { getAllArticles } from '@/lib/content'

export const revalidate = 300 // Revalidate every 5 minutes

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sarcasm.wiki'
  
  const articles = await getAllArticles()
  
  const articleUrls: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${baseUrl}/${article.slug}`,
    lastModified: article.updatedAt || article.createdAt || new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 1,
    },
    ...articleUrls,
  ]
}

