import fs from 'fs/promises'
import path from 'path'

const PROMPTS_DIR = path.join(process.cwd(), 'prompts')

let systemPrompt: string | null = null
let continuePrompt: string | null = null
let userFirstPrompt: string | null = null
let userContinuePrompt: string | null = null

const extraPromptsCache = new Map<string, string>()

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

export async function getPromptTemplate(filename: string): Promise<string> {
  const cached = extraPromptsCache.get(filename)
  if (cached) return cached
  const content = await loadPrompt(filename)
  extraPromptsCache.set(filename, content)
  return content
}

export function renderPromptTemplate(template: string, variables: Record<string, string | number | null | undefined>): string {
  return template.replace(/%([a-zA-Z0-9_]+)(\|([^%]*))?%/g, (_match, varName: string, _pipe: string | undefined, defaultValue: string | undefined) => {
    const raw = variables[varName]
    if (raw === null || raw === undefined || String(raw).length === 0) {
      return defaultValue !== undefined ? defaultValue : ''
    }
    return String(raw)
  })
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
    return `${userFirstPrompt}\n\n${content}\n\nArticle:`
  } else {
    if (!userContinuePrompt) {
      userContinuePrompt = await loadPrompt('user-continue.md')
    }
    return `${userContinuePrompt}\n\n${content}`
  }
}

