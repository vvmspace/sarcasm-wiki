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
    ? `<p>The Wikipedia article <strong>"${title}"</strong> has been added to the generation queue.</p>
       <div style="margin-top: 2rem; font-style: italic; color: #555; border-left: 2px solid #8b0000; padding-left: 1rem; background: #fffafb; padding-top: 1rem; padding-bottom: 1rem; border-radius: 0 4px 4px 0;">
         "Oh, another one. How delightful. I've tossed your request into the void—I mean, the queue. 
         It's sitting somewhere between 'waiting for a sign from the universe' and 'my genuine lack of interest.' 
         I'll get to it when the prose feels as sharp as your sense of entitlement."
         <br/>
         <span style="display: block; margin-top: 0.5rem; font-weight: bold; font-style: normal; color: #333;">— Emma Monday</span>
       </div>`
    : '<p>The requested page could not be found. Even my cynicism has its limits.</p>'

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
