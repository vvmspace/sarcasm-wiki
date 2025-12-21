import { getStats } from '@/lib/queue'
import { getPerformanceData, type PerformanceData } from '@/lib/performance-data'
import ClientLayout from './ClientLayout'

interface ServerDataProviderProps {
  children: React.ReactNode
}

export default async function ServerDataProvider({ children }: ServerDataProviderProps) {
  // Получаем все данные один раз на сервере
  const [queueStats, performanceData] = await Promise.all([
    getStats(),
    getPerformanceData()
  ])

  return (
    <ClientLayout 
      queueStats={queueStats}
      performanceData={performanceData}
    >
      {children}
    </ClientLayout>
  )
}