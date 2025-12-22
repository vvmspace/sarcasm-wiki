import Navigation from './components/Navigation'
import Hero from './components/Hero'
import Card from './components/Card'
import Button from './components/Button'
import SimpleQueueFooter from './components/SimpleQueueFooter'
import ServerPerformanceStats from './components/ServerPerformanceStats'
import { getHomeState } from '@/lib/home-state'

export const revalidate = 60

export default async function Home() {
  const examples = [
    'Sarcasm',
    'Wikipedia', 
    'Artificial_intelligence',
    'Machine_learning',
    'Quantum_computing',
    'Blockchain',
    'Neural_network'
  ]

  const state = await getHomeState({ limit: 12 })
  const latestArticles = state.latestArticles

  return (
    <>
      <Navigation />
      
      <Hero
        subtitle="AI-Powered Knowledge"
        title="Sarcasm Wiki"
        description="Wikipedia articles reimagined with artificial intelligence. Discover knowledge with a fresh perspective and modern approach."
        primaryAction={{
          text: "Explore Articles",
          href: "#latest"
        }}
        secondaryAction={{
          text: "View Admin",
          href: "/admin"
        }}
      />

      <main className="container">
        {latestArticles.length > 0 && (
          <section id="latest" style={{ marginBottom: '4rem' }}>
            <h2 style={{ 
              textAlign: 'center', 
              marginBottom: '3rem',
              fontSize: '2.5rem',
              fontWeight: '700'
            }}>
              Latest Articles
            </h2>
            
            <div className="grid grid-3">
              {latestArticles.map((article) => (
                <Card
                  key={article.slug}
                  title={article.title}
                  description={article.description || 'Explore this AI-enhanced article'}
                  href={`/${article.slug}`}
                  variant="default"
                  image={article.image || undefined}
                  icon={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                  }
                />
              ))}
            </div>
          </section>
        )}
        
        <section>
          <h2 style={{ 
            textAlign: 'center', 
            marginBottom: '3rem',
            fontSize: '2.5rem',
            fontWeight: '700'
          }}>
            Popular Topics
          </h2>
          
          <div className="grid grid-2">
            {examples.map((example, index) => (
              <Card
                key={example}
                title={example.replace(/_/g, ' ')}
                description={`Discover the AI-enhanced perspective on ${example.replace(/_/g, ' ').toLowerCase()}`}
                href={`/${example}`}
                variant={index === 0 ? 'featured' : 'default'}
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" />
                  </svg>
                }
              />
            ))}
          </div>
        </section>

        <section style={{ 
          textAlign: 'center', 
          marginTop: '4rem',
          padding: '3rem 0',
          background: 'var(--pearl-white)',
          borderRadius: '16px',
          border: '1px solid var(--silver)'
        }}>
          <h2 style={{ marginBottom: '1rem' }}>Ready to Explore?</h2>
          <p style={{ 
            fontSize: '1.1rem', 
            marginBottom: '2rem',
            color: 'var(--charcoal)'
          }}>
            Start your journey through AI-enhanced knowledge
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="primary" size="lg" href="/Artificial_intelligence">
              Start with AI
            </Button>
            <Button variant="outline" size="lg" href="/admin">
              Admin Panel
            </Button>
          </div>
        </section>
      </main>
      
      <SimpleQueueFooter />
      <ServerPerformanceStats />
    </>
  )
}

