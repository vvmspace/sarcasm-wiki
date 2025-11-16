import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const LOG_DIR = join(process.cwd(), '.temp')
const LOG_FILE = join(LOG_DIR, '404-logs.txt')

export async function logNotFound(slug: string, referer?: string, userAgent?: string): Promise<void> {
  try {
    await mkdir(LOG_DIR, { recursive: true })
    
    const timestamp = new Date().toISOString()
    const logEntry = `${timestamp}\t${slug}\t${referer || '-'}\t${userAgent || '-'}\n`
    
    await writeFile(LOG_FILE, logEntry, { flag: 'a' })
  } catch (error) {
    console.error('Failed to log 404:', error)
  }
}

export async function getNotFoundLogs(): Promise<string | null> {
  try {
    const { readFile } = await import('fs/promises')
    const content = await readFile(LOG_FILE, 'utf-8')
    return content
  } catch (error) {
    return null
  }
}

export async function clearNotFoundLogs(): Promise<void> {
  try {
    const { unlink } = await import('fs/promises')
    await unlink(LOG_FILE)
  } catch (error) {
    // File doesn't exist, ignore
  }
}

