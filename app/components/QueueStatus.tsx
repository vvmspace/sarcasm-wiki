import { getStats } from '@/lib/queue'
import Link from 'next/link'

export const revalidate = 60

export default async function QueueStatus() {
  const stats = await getStats()

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-stats">
          <div className="stat">
            <span className="stat-label">In Queue</span>
            <span className="stat-value">{stats.inStack}</span>
          </div>
          
          <div className="stat">
            <span className="stat-label">Generated</span>
            <span className="stat-value">{stats.generated}</span>
          </div>
          
          {stats.lastGenerated && (
            <div className="stat">
              <span className="stat-label">Latest</span>
              <Link
                href={`/${encodeURIComponent(stats.lastGenerated)}`}
                className="stat-link"
              >
                {stats.lastGenerated.replace(/_/g, ' ')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}

