import { headers } from 'next/headers'
import WikiLayout from '../components/WikiLayout'

export default async function NotFound() {
  const headersList = await headers()
  const path = headersList.get('x-current-path') || ''
  
  // Extract slug from path (e.g., "/some/slug" -> "some/slug")
  const rawSlug = path.startsWith('/') ? path.slice(1) : path
  const slug = decodeURIComponent(rawSlug)
  
  const title = slug 
    ? slug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : 'Page Not Found'

  const htmlContent = slug
    ? `<p>The Wikipedia article <strong>"${title}"</strong> has been added to our generation queue. 
       Our AI is currently rewriting it with the appropriate amount of sarcasm.</p>`
    : '<p>The requested page could not be found.</p>'

  return (
    <WikiLayout
      title={title}
      htmlContent={htmlContent}
      isFuturePage={!!slug}
      slug={slug}
      rawSlug={rawSlug}
    />
  )
}
