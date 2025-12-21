import fs from 'fs/promises'
import path from 'path'
import { parseMDC } from '../lib/mdc'

const CONTENT_DIR = path.join(process.cwd(), 'content')

async function cleanupBrokenMDCFiles() {
  console.log('[CLEANUP] Starting cleanup of broken MDC files...')
  
  try {
    const files = await fs.readdir(CONTENT_DIR)
    const mdcFiles = files.filter(file => file.endsWith('.mdc'))
    
    console.log(`[CLEANUP] Found ${mdcFiles.length} MDC files to check`)
    
    let brokenCount = 0
    let fixedCount = 0
    
    for (const file of mdcFiles) {
      const filePath = path.join(CONTENT_DIR, file)
      
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        
        // Try to parse the MDC file
        try {
          parseMDC(content)
          // File is valid, continue
        } catch (parseError) {
          console.log(`[CLEANUP] Found broken file: ${file}`)
          brokenCount++
          
          // Check if file has any content at all
          if (content.trim().length < 50) {
            console.log(`[CLEANUP] Deleting empty/minimal file: ${file}`)
            await fs.unlink(filePath)
            fixedCount++
            continue
          }
          
          // Check if it's missing frontmatter
          if (!content.startsWith('---')) {
            console.log(`[CLEANUP] File missing frontmatter: ${file}`)
            
            // Try to extract title from filename
            const slug = file.replace('.mdc', '').replace(/_/g, ' ')
            const title = slug.replace(/^Category /, 'Category: ')
            
            // Create minimal frontmatter
            const frontmatter = `---
title: "${title}"
description: "Article about ${title}"
slug: "${slug}"
keywords: []
createdAt: "${new Date().toISOString()}"
updatedAt: "${new Date().toISOString()}"
contentType: "created"
---

`
            
            const fixedContent = frontmatter + content
            
            try {
              // Verify the fixed content parses correctly
              parseMDC(fixedContent)
              
              // Save the fixed file
              await fs.writeFile(filePath, fixedContent, 'utf-8')
              console.log(`[CLEANUP] Fixed frontmatter for: ${file}`)
              fixedCount++
            } catch (fixError) {
              console.log(`[CLEANUP] Could not fix ${file}, deleting it`)
              await fs.unlink(filePath)
              fixedCount++
            }
          } else {
            // Has frontmatter but still broken, try to delete
            console.log(`[CLEANUP] Deleting corrupted file: ${file}`)
            await fs.unlink(filePath)
            fixedCount++
          }
        }
      } catch (error) {
        console.error(`[CLEANUP] Error processing ${file}:`, error)
        // If we can't even read the file, try to delete it
        try {
          await fs.unlink(filePath)
          console.log(`[CLEANUP] Deleted unreadable file: ${file}`)
          brokenCount++
          fixedCount++
        } catch (deleteError) {
          console.error(`[CLEANUP] Could not delete ${file}:`, deleteError)
        }
      }
    }
    
    console.log(`[CLEANUP] Cleanup completed:`)
    console.log(`[CLEANUP] - Broken files found: ${brokenCount}`)
    console.log(`[CLEANUP] - Files fixed/removed: ${fixedCount}`)
    
    return { brokenCount, fixedCount }
  } catch (error) {
    console.error('[CLEANUP] Error during cleanup:', error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  cleanupBrokenMDCFiles()
    .then(({ brokenCount, fixedCount }) => {
      console.log(`[CLEANUP] Done! Fixed/removed ${fixedCount} out of ${brokenCount} broken files`)
      process.exit(0)
    })
    .catch(error => {
      console.error('[CLEANUP] Cleanup failed:', error)
      process.exit(1)
    })
}

export { cleanupBrokenMDCFiles }