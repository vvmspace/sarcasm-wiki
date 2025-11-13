import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

test.describe('Browser Console Errors', () => {
  test('should not have console errors on home page', async ({ page }) => {
    const consoleErrors: string[] = []
    const consoleWarnings: string[] = []
    
    page.on('console', (msg) => {
      const text = msg.text()
      if (msg.type() === 'error') {
        consoleErrors.push(text)
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(text)
      }
    })
    
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page error: ${error.message}`)
    })
    
    await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    
    await expect(page.locator('h1')).toContainText('Sarcasm Wiki')
    
    if (consoleErrors.length > 0) {
      console.error('Console errors found:')
      consoleErrors.forEach((error, i) => {
        console.error(`  ${i + 1}. ${error}`)
      })
    }
    
    if (consoleWarnings.length > 0) {
      console.warn('Console warnings found:')
      consoleWarnings.forEach((warning, i) => {
        console.warn(`  ${i + 1}. ${warning}`)
      })
    }
    
    expect(consoleErrors.length).toBe(0)
  })
  
  test('should not have console errors on existing article page', async ({ page }) => {
    const consoleErrors: string[] = []
    const consoleWarnings: string[] = []
    
    page.on('console', (msg) => {
      const text = msg.text()
      if (msg.type() === 'error') {
        consoleErrors.push(text)
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(text)
      }
    })
    
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page error: ${error.message}`)
    })
    
    await page.goto(`${BASE_URL}/Blockchain`, { waitUntil: 'networkidle' })
    
    await expect(page.locator('h1')).toContainText('Blockchain')
    
    const article = page.locator('article')
    const articleExists = await article.count() > 0
    console.log('Article exists:', articleExists)
    
    if (articleExists) {
      const articleHtml = await article.innerHTML()
      console.log('Article HTML length:', articleHtml.length)
      
      if (articleHtml.length < 100) {
        console.error('Article content is too short!')
        console.error('Article HTML:', articleHtml)
      }
      
      const links = await article.locator('a').count()
      console.log('Total links:', links)
      
      const internalLinks = await article.locator('a.internal-link').count()
      console.log('Internal links:', internalLinks)
      
      const paragraphs = await article.locator('p').count()
      console.log('Paragraphs:', paragraphs)
      
      expect(articleHtml.length).toBeGreaterThan(100)
    } else {
      console.error('Article element not found!')
    }
    
    if (consoleErrors.length > 0) {
      console.error('Console errors found:')
      consoleErrors.forEach((error, i) => {
        console.error(`  ${i + 1}. ${error}`)
      })
    }
    
    if (consoleWarnings.length > 0) {
      console.warn('Console warnings found:')
      consoleWarnings.forEach((warning, i) => {
        console.warn(`  ${i + 1}. ${warning}`)
      })
    }
    
    expect(consoleErrors.length).toBe(0)
    expect(articleExists).toBe(true)
  })
  
  test('should handle rate limit page without console errors', async ({ page }) => {
    const consoleErrors: string[] = []
    const consoleWarnings: string[] = []
    
    page.on('console', (msg) => {
      const text = msg.text()
      if (msg.type() === 'error') {
        consoleErrors.push(text)
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(text)
      }
    })
    
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page error: ${error.message}`)
    })
    
    await page.goto(`${BASE_URL}/Test_Rate_Limit_Article`, { waitUntil: 'networkidle' })
    
    const pageContent = await page.textContent('body')
    const isRateLimitPage = pageContent?.includes('Page Generation in Progress') || 
                           pageContent?.includes('Generation in Progress')
    
    if (isRateLimitPage) {
      await expect(page.locator('h1')).toContainText(/Generation|Progress/i)
    } else {
      await expect(page.locator('h1')).toBeVisible()
    }
    
    if (consoleErrors.length > 0) {
      console.error('Console errors found:')
      consoleErrors.forEach((error, i) => {
        console.error(`  ${i + 1}. ${error}`)
      })
    }
    
    if (consoleWarnings.length > 0) {
      console.warn('Console warnings found:')
      consoleWarnings.forEach((warning, i) => {
        console.warn(`  ${i + 1}. ${warning}`)
      })
    }
    
    expect(consoleErrors.length).toBe(0)
  })
  
  test('should handle internal links navigation without errors', async ({ page }) => {
    const consoleErrors: string[] = []
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page error: ${error.message}`)
    })
    
    await page.goto(`${BASE_URL}/Blockchain`, { waitUntil: 'networkidle' })
    
    const firstLink = page.locator('a[href^="/"]').first()
    const href = await firstLink.getAttribute('href')
    
    if (href && href.startsWith('/')) {
      await firstLink.click()
      await page.waitForLoadState('networkidle')
      
      if (consoleErrors.length > 0) {
        console.error('Console errors after navigation:')
        consoleErrors.forEach((error, i) => {
          console.error(`  ${i + 1}. ${error}`)
        })
      }
      
      expect(consoleErrors.length).toBe(0)
    }
  })
  
  test('should check for React hydration errors', async ({ page }) => {
    const hydrationErrors: string[] = []
    
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('hydration') || text.includes('Hydration') || 
          text.includes('Text content does not match') ||
          text.includes('Warning: Prop') || text.includes('Warning: Each child')) {
        hydrationErrors.push(text)
      }
    })
    
    await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    
    await page.goto(`${BASE_URL}/Blockchain`, { waitUntil: 'networkidle' })
    
    if (hydrationErrors.length > 0) {
      console.error('Hydration errors/warnings found:')
      hydrationErrors.forEach((error, i) => {
        console.error(`  ${i + 1}. ${error}`)
      })
    }
    
    expect(hydrationErrors.length).toBe(0)
  })
})

