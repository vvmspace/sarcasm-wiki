import Link from 'next/link'

export default function Home() {
  const examples = [
    'Artificial_intelligence',
    'Machine_learning',
    'Quantum_computing',
    'Blockchain',
    'Neural_network'
  ]

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Sarcasm Wiki</h1>
      <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: '#666' }}>
        Wikipedia articles rewritten with AI. Enter an article name in the URL or try one of the examples below.
      </p>
      
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

