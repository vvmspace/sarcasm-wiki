import { getStats } from '@/lib/queue'
import Link from 'next/link'

export default async function SimpleQueueFooter() {
  let stats
  try {
    stats = await getStats()
  } catch (error) {
    // Fallback если не удалось получить статистику
    stats = { inStack: 0, generated: 0 }
  }

  return (
    <footer className="footer" suppressHydrationWarning>
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