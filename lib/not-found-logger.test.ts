import { logNotFound, getNotFoundLogs, clearNotFoundLogs } from './not-found-logger'
import { unlink, readFile, mkdir } from 'fs/promises'
import { join } from 'path'

const LOG_DIR = join(process.cwd(), '.temp')
const LOG_FILE = join(LOG_DIR, '404-logs.txt')

describe('not-found-logger', () => {
  beforeEach(async () => {
    try {
      await unlink(LOG_FILE)
    } catch {
      // File doesn't exist, ignore
    }
  })

  afterEach(async () => {
    try {
      await unlink(LOG_FILE)
    } catch {
      // File doesn't exist, ignore
    }
  })

  it('should log 404 errors', async () => {
    await logNotFound('test-slug', 'https://example.com', 'test-agent')
    
    const logs = await getNotFoundLogs()
    expect(logs).toBeTruthy()
    expect(logs).toContain('test-slug')
    expect(logs).toContain('https://example.com')
    expect(logs).toContain('test-agent')
  })

  it('should append multiple logs', async () => {
    await logNotFound('slug1')
    await logNotFound('slug2')
    
    const logs = await getNotFoundLogs()
    expect(logs).toBeTruthy()
    expect(logs).toContain('slug1')
    expect(logs).toContain('slug2')
    const lines = logs!.split('\n').filter(l => l.trim())
    expect(lines.length).toBeGreaterThanOrEqual(2)
  })

  it('should return null when no logs exist', async () => {
    const logs = await getNotFoundLogs()
    expect(logs).toBeNull()
  })

  it('should clear logs', async () => {
    await logNotFound('test-slug')
    await clearNotFoundLogs()
    
    const logs = await getNotFoundLogs()
    expect(logs).toBeNull()
  })

  it('should handle missing referer and userAgent', async () => {
    await logNotFound('test-slug')
    
    const logs = await getNotFoundLogs()
    expect(logs).toBeTruthy()
    expect(logs).toContain('test-slug')
    expect(logs).toContain('\t-\t-')
  })
})

