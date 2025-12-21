import fs from 'fs/promises'
import path from 'path'

const LOGS_DIR = path.join(process.cwd(), 'logs')
const SECURITY_LOG = path.join(LOGS_DIR, 'security.log')

export async function logBlockedRequest(
  path: string,
  userAgent: string | null,
  ip: string | null,
  reason: 'blocked_path' | 'blocked_agent'
): Promise<void> {
  try {
    await fs.mkdir(LOGS_DIR, { recursive: true })
    
    const timestamp = new Date().toISOString()
    const logEntry = `${timestamp} [${reason.toUpperCase()}] ${path} | UA: ${userAgent || 'unknown'} | IP: ${ip || 'unknown'}\n`
    
    await fs.appendFile(SECURITY_LOG, logEntry, 'utf-8')
  } catch (error) {
    console.error('Failed to log blocked request:', error)
  }
}

export async function getSecurityStats(): Promise<{
  blockedPaths: number
  blockedAgents: number
  recentBlocks: Array<{
    timestamp: string
    path: string
    reason: string
    userAgent: string
  }>
}> {
  try {
    const logContent = await fs.readFile(SECURITY_LOG, 'utf-8')
    const lines = logContent.trim().split('\n').filter(line => line.length > 0)
    
    let blockedPaths = 0
    let blockedAgents = 0
    const recentBlocks: Array<{
      timestamp: string
      path: string
      reason: string
      userAgent: string
    }> = []
    
    // Get last 100 entries
    const recentLines = lines.slice(-100)
    
    for (const line of recentLines) {
      const match = line.match(/^(\S+) \[(\w+)\] (.+?) \| UA: (.+?) \| IP:/)
      if (match) {
        const [, timestamp, reason, path, userAgent] = match
        
        if (reason === 'BLOCKED_PATH') blockedPaths++
        if (reason === 'BLOCKED_AGENT') blockedAgents++
        
        recentBlocks.push({
          timestamp,
          path,
          reason,
          userAgent
        })
      }
    }
    
    return {
      blockedPaths,
      blockedAgents,
      recentBlocks: recentBlocks.slice(-20) // Last 20 blocks
    }
  } catch (error) {
    return {
      blockedPaths: 0,
      blockedAgents: 0,
      recentBlocks: []
    }
  }
}