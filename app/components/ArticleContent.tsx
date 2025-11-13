'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface ArticleContentProps {
  htmlContent: string
}

export default function ArticleContent({ htmlContent }: ArticleContentProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a.internal-link') as HTMLAnchorElement
      
      if (link && link.href) {
        try {
          const url = new URL(link.href, window.location.origin)
          if (url.pathname.startsWith('/') && !url.pathname.startsWith('//') && url.origin === window.location.origin) {
            e.preventDefault()
            router.push(url.pathname)
          }
        } catch (error) {
          // Invalid URL, let browser handle it
        }
      }
    }

    container.addEventListener('click', handleClick)
    return () => {
      container.removeEventListener('click', handleClick)
    }
  }, [router])

  return (
    <div ref={containerRef} dangerouslySetInnerHTML={{ __html: htmlContent }} />
  )
}

