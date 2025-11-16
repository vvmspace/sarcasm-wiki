import { NextRequest, NextResponse } from 'next/server'
import { getNotFoundLogs, clearNotFoundLogs } from '@/lib/not-found-logger'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')

  if (action === 'clear') {
    await clearNotFoundLogs()
    return NextResponse.json({ message: 'Logs cleared' })
  }

  const logs = await getNotFoundLogs()
  
  if (!logs) {
    return NextResponse.json({ error: 'No logs found' }, { status: 404 })
  }

  return new NextResponse(logs, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename="404-logs.txt"',
    },
  })
}

