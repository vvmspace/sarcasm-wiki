import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

const QUEUE_DIR = join(process.cwd(), '.temp')
const QUEUE_FILE = join(QUEUE_DIR, 'generation-queue.json')

export const revalidate = 60

export async function GET() {
  try {
    const content = await readFile(QUEUE_FILE, 'utf-8')
    const queue = JSON.parse(content)
    
    return NextResponse.json(queue, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60',
      },
    })
  } catch (error: any) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json([], {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60',
        },
      })
    }
    
    console.error('Error reading queue file:', error)
    return NextResponse.json(
      { error: 'Failed to read queue' },
      { status: 500 }
    )
  }
}

