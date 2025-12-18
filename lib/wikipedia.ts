function extractLinksFromHTML(html: string): Map<string, string> {
  const links = new Map<string, string>()
  if (!html || typeof html !== 'string') {
    return links
  }

  const linkRegex = /<a[^>]*href=["']([^"']*)["'][^>]*>([^<]*?)<\/a>/gi
  let match
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1]
    const text = match[2].trim()
    if (text && href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      if (href.includes('action=edit') || href.includes('redlink=1') || href.startsWith('https://doi.org') || href.includes('citeseerx') || href.includes('jstor.org')) {
        continue
      }
      
      let url = href.trim()
      if (url.startsWith('/wiki/')) {
        const articleName = url.replace('/wiki/', '').split('#')[0].split('?')[0]
        url = `/${articleName}`
        links.set(text, url)
      } else if (url.startsWith('https://en.wikipedia.org/wiki/')) {
        const articleName = url.replace('https://en.wikipedia.org/wiki/', '').split('#')[0].split('?')[0]
        url = `/${articleName}`
        links.set(text, url)
      }
    }
  }

  return links
}

function extractTextFromHTML(html: string, links?: Map<string, string>): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  if (links) {
    const extractedLinks = extractLinksFromHTML(html)
    extractedLinks.forEach((url, text) => {
      links.set(text, url)
    })
  }

  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')

  text = text
    .replace(/<h[1-6][^>]*>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br[^>]*>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    .replace(/<ul[^>]*>|<\/ul>|<ol[^>]*>|<\/ol>/gi, '\n')
    .replace(/<div[^>]*>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<span[^>]*>/gi, '')
    .replace(/<\/span>/gi, '')
    .replace(/<a[^>]*href=["']([^"']*)["'][^>]*>([^<]*?)<\/a>/gi, (match, href, linkText) => {
      const text = linkText.trim()
      if (text && links && href) {
        let url = href.trim()
        let isInternalWikiLink = false
        
        if (url.includes('action=edit') || url.includes('redlink=1') || url.startsWith('https://doi.org') || url.includes('citeseerx') || url.includes('jstor.org')) {
          return text
        }
        
        if (url.startsWith('/wiki/')) {
          const articleName = url.replace('/wiki/', '').split('#')[0].split('?')[0]
          url = `/${articleName}`
          isInternalWikiLink = true
        } else if (url.startsWith('https://en.wikipedia.org/wiki/')) {
          const articleName = url.replace('https://en.wikipedia.org/wiki/', '').split('#')[0].split('?')[0]
          url = `/${articleName}`
          isInternalWikiLink = true
        } else if (url.startsWith('https://') || url.startsWith('http://')) {
          return text
        } else if (url.startsWith('/')) {
          return text
        } else if (!url.startsWith('#')) {
          return text
        }
        
        if (url && !url.startsWith('#') && !url.startsWith('javascript:') && isInternalWikiLink) {
          links.set(text, url)
          return `[${text}](${url})`
        }
      }
      return text || ''
    })
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '...')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n /g, '\n')
    .replace(/ \n/g, '\n')
    .trim()

  return text
}

export async function fetchWikipediaContent(title: string): Promise<{ content: string; links: Map<string, string> } | null> {
  try {
    const encodedTitle = encodeURIComponent(title.replace(/ /g, '_'))
    const links = new Map<string, string>()
    
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodedTitle}&prop=text&format=json&disableeditsection=true&disabletoc=true`
    const apiResponse = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'SarcasmWiki/1.0 (https://example.com)',
      },
    })

    if (!apiResponse.ok) {
      if (apiResponse.status === 404) {
        return null
      }
      throw new Error(`Wikipedia API error: ${apiResponse.status}`)
    }

    const apiData = await apiResponse.json()
    
    if (!apiData.parse || !apiData.parse.text || !apiData.parse.text['*']) {
      return null
    }

    const htmlContent = apiData.parse.text['*']
    
    if (!htmlContent || htmlContent.trim().length < 100) {
      return null
    }

    const content = extractTextFromHTML(htmlContent, links)

    if (!content || content.trim().length < 100) {
      return null
    }

    return { content, links }
  } catch (error: any) {
    console.error('Error fetching Wikipedia content:', {
      title,
      message: error?.message,
      stack: error?.stack
    })
    return null
  }
}

