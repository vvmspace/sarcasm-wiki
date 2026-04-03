import fs from 'fs'
import path from 'path'
import { parseMDC, generateMDC } from '../lib/mdc'

const CONTENT_DIR = path.join(process.cwd(), 'content')

function processDirectory(dir: string) {
  const files = fs.readdirSync(dir)
  let count = 0
  
  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      processDirectory(fullPath)
    } else if (file.endsWith('.mdc')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8')
        const { metadata, content: body } = parseMDC(content)
        
        // Re-generate to apply the new sanitize logic in generateMDC
        const updatedContent = generateMDC(metadata, body)
        
        if (content !== updatedContent) {
          fs.writeFileSync(fullPath, updatedContent, 'utf-8')
          count++
        }
      } catch (e: any) {
        console.error(`Error processing ${file}: ${e.message}`)
      }
    }
    
    if (count > 0 && count % 100 === 0) {
      console.log(`Processed ${count} files...`)
    }
  }
  return count
}

console.log('Starting content quote fix...')
const totalFixed = processDirectory(CONTENT_DIR)
console.log(`Done! Fixed ${totalFixed} files.`)
