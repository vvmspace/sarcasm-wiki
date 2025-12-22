import fs from 'fs/promises'
import path from 'path'
import { EventEmitter } from 'events'
import { getMetadataOnlyBySlug } from './content'

export interface HomeStateArticle {
  slug: string
  title: string
  description?: string
  contentType?: string
  aiProvider?: string
  aiModel?: string
  createdAt?: string
  updatedAt?: string
  image?: string
}

export interface HomeState {
  generatedAt: string
  latestArticles: HomeStateArticle[]
}

const HOME_STATE_FILE = path.join(process.cwd(), '.temp', 'home-state.json')
const IMAGES_DIR = path.join(process.cwd(), 'public', 'images')

const emitter = new EventEmitter()

let rebuildScheduled: NodeJS.Timeout | null = null
let rebuildInFlight: Promise<HomeState> | null = null

async function buildHomeStateInternal(limit: number): Promise<HomeState> {
  const imageMap = new Map<string, string>()

  let files: string[] = []
  try {
    files = await fs.readdir(IMAGES_DIR)
  } catch {
    files = []
  }

  const imageFiles = files
    .filter(f => f !== '.gitkeep')
    .filter(f => /\.(jpg|jpeg|png|svg)$/i.test(f))

  const withDates: Array<{ fileName: string, createdAtMs: number }> = []
  for (const fileName of imageFiles) {
    try {
      const stats = await fs.stat(path.join(IMAGES_DIR, fileName))
      const createdAtMs = stats.birthtimeMs || stats.mtimeMs
      withDates.push({ fileName, createdAtMs })
    } catch {
      // ignore
    }
  }

  withDates.sort((a, b) => b.createdAtMs - a.createdAtMs)

  const latestArticles: HomeStateArticle[] = []

  for (const { fileName } of withDates) {
    if (latestArticles.length >= limit) break

    const slug = fileName.replace(/\.(jpg|jpeg|png|svg)$/i, '')
    if (imageMap.has(slug)) continue

    const metadata = await getMetadataOnlyBySlug(slug)
    if (!metadata) continue

    const image = `/images/${fileName}`
    imageMap.set(slug, image)

    latestArticles.push({
      slug: metadata.slug,
      title: metadata.title,
      description: metadata.description,
      contentType: metadata.contentType,
      aiProvider: metadata.aiProvider,
      aiModel: metadata.aiModel,
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
      image,
    })
  }

  const state: HomeState = {
    generatedAt: new Date().toISOString(),
    latestArticles,
  }

  await fs.mkdir(path.dirname(HOME_STATE_FILE), { recursive: true })
  await fs.writeFile(HOME_STATE_FILE, JSON.stringify(state), 'utf-8')

  return state
}

export async function buildHomeState(options?: { limit?: number }): Promise<HomeState> {
  const limit = options?.limit ?? 12

  if (!rebuildInFlight) {
    rebuildInFlight = buildHomeStateInternal(limit).finally(() => {
      rebuildInFlight = null
    })
  }

  return rebuildInFlight
}

export async function getHomeState(options?: { limit?: number }): Promise<HomeState> {
  try {
    const content = await fs.readFile(HOME_STATE_FILE, 'utf-8')
    const parsed = JSON.parse(content) as HomeState
    if (!parsed || !Array.isArray(parsed.latestArticles)) {
      throw new Error('Invalid home state')
    }
    return parsed
  } catch {
    // First run / missing file: build synchronously.
    return await buildHomeState({ limit: options?.limit })
  }
}

export function emitHomeStateRebuild(): void {
  emitter.emit('home_state_rebuild')
}

export function startHomeStateRebuildListener(options?: { debounceMs?: number, limit?: number }): void {
  const debounceMs = options?.debounceMs ?? 2500
  const limit = options?.limit ?? 12

  // Ensure we only subscribe once per process
  if ((globalThis as any).__homeStateListenerStarted) return
  ;(globalThis as any).__homeStateListenerStarted = true

  emitter.on('home_state_rebuild', () => {
    if (rebuildScheduled) {
      clearTimeout(rebuildScheduled)
    }

    rebuildScheduled = setTimeout(() => {
      rebuildScheduled = null
      void buildHomeState({ limit }).catch((error) => {
        console.error('[HOME-STATE] Failed to rebuild home state:', error)
      })
    }, debounceMs)
  })
}
