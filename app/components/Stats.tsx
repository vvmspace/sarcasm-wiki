interface StatsProps {
  stats: Array<{
    label: string
    value: string | number
    icon?: React.ReactNode
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
  }>
}

export default function Stats({ stats }: StatsProps) {
  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="trend-up">
            <path d="M15,20H9V12H4.16L12,4.16L19.84,12H15V20Z" />
          </svg>
        )
      case 'down':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="trend-down">
            <path d="M9,4H15V12H19.84L12,19.84L4.16,12H9V4Z" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="stats">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          {stat.icon && (
            <div className="stat-icon">
              {stat.icon}
            </div>
          )}
          
          <div className="stat-content">
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
            
            {stat.trend && stat.trendValue && (
              <div className={`stat-trend trend-${stat.trend}`}>
                {getTrendIcon(stat.trend)}
                <span>{stat.trendValue}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}