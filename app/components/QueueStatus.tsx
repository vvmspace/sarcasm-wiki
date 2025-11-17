import { getStats } from '@/lib/queue'
import Link from 'next/link'

export const revalidate = 60

export default async function QueueStatus() {
  const stats = await getStats()

  return (
    <footer style={{
      marginTop: '3rem',
      padding: '1.5rem',
      borderTop: '1px solid #e0e0e0',
      textAlign: 'center',
      fontSize: '0.9rem',
      color: '#666'
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span>
          <strong>In stack:</strong> {stats.inStack}
        </span>
        <span>
          <strong>Generated:</strong> {stats.generated}
        </span>
        {stats.lastGenerated && (
          <span>
            <strong>Last:</strong>{' '}
            <Link
              href={`/${encodeURIComponent(stats.lastGenerated)}`}
              style={{
                color: '#0066cc',
                textDecoration: 'none'
              }}
            >
              {stats.lastGenerated.replace(/_/g, ' ')}
            </Link>
          </span>
        )}
      </div>
    </footer>
  )
}

