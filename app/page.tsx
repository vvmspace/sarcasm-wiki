import Link from 'next/link'
import { getLatestArticles } from '@/lib/content'

export const revalidate = 60

export default async function Home() {
  const examples = [
    'Sarcasm',
    'Wikipedia',
    'Artificial_intelligence',
    'Machine_learning',
    'Quantum_computing',
    'Blockchain',
    'Neural_network',
    'Ebat_kolotit',
    'Hue_moe'
  ]

  const latestArticles = await getLatestArticles(7)

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Sarcasm Wiki</h1>
      <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: '#666' }}>
        Wikipedia articles rewritten with AI. Enter an article name in the URL or try one of the examples below.
      </p>
      
      {latestArticles.length > 0 && (
        <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Latest Articles:</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {latestArticles.map((article) => (
              <li key={article.slug} style={{ marginBottom: '0.75rem' }}>
                <Link 
                  href={`/${article.slug}`}
                  style={{
                    color: '#0066cc',
                    fontSize: '1.1rem',
                    textDecoration: 'none',
                    display: 'block'
                  }}
                >
                  {article.title}
                </Link>
                {article.description && (
                  <p style={{ 
                    fontSize: '0.9rem', 
                    color: '#666', 
                    marginTop: '0.25rem',
                    marginLeft: '0',
                    marginBottom: '0'
                  }}>
                    {article.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Examples:</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {examples.map((example) => (
            <li key={example} style={{ marginBottom: '0.5rem' }}>
              <Link 
                href={`/${example}`}
                style={{
                  color: '#0066cc',
                  fontSize: '1.1rem',
                  textDecoration: 'none'
                }}
              >
                {example.replace(/_/g, ' ')}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}

