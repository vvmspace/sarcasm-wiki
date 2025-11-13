import fs from 'fs/promises'
import path from 'path'

const PROMPTS_DIR = path.join(process.cwd(), 'prompts')

let systemPrompt: string | null = null
let continuePrompt: string | null = null
let userFirstPrompt: string | null = null
let userContinuePrompt: string | null = null

async function loadPrompt(filename: string): Promise<string> {
  const filePath = path.join(PROMPTS_DIR, filename)
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return content.trim()
  } catch (error) {
    console.error(`Error loading prompt ${filename}:`, error)
    throw error
  }
}

export async function getSystemPrompt(isFirst: boolean = false): Promise<string> {
  if (isFirst) {
    if (!systemPrompt) {
      systemPrompt = await loadPrompt('system.md')
    }
    return systemPrompt
  } else {
    if (!continuePrompt) {
      continuePrompt = await loadPrompt('continue.md')
    }
    return continuePrompt
  }
}

export async function getUserPrompt(content: string, isFirst: boolean = false): Promise<string> {
  if (isFirst) {
    if (!userFirstPrompt) {
      userFirstPrompt = await loadPrompt('user-first.md')
    }
    return `${userFirstPrompt}\n\n${content}`
  } else {
    if (!userContinuePrompt) {
      userContinuePrompt = await loadPrompt('user-continue.md')
    }
    return `${userContinuePrompt}\n\n${content}`
  }
}

