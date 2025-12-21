'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface AIStats {
  success: boolean
  totalProviders: number
  providers: Array<{ name: string, models: number }>
  testGeneration: any
  providerUsage: {
    totalArticlesWithAI: number
    totalArticles: number
    providerCounts: Record<string, number>
    modelCounts: Record<string, number>
    providerModelBreakdown: Record<string, Record<string, number>>
    contentTypeCounts: { rewritten: number, created: number }
    originalContentCounts: { original: number, rewritten: number }
    topProvider: string
    topModel: string
  }
  timestamp: string
}

export default function AdminPage() {
  const [aiStats, setAiStats] = useState<AIStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAIStats = async (rebuild: boolean = false) => {
    try {
      setLoading(true)
      const url = rebuild ? '/api/admin/ai-stats?rebuild=true' : '/api/admin/ai-stats'
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setAiStats(data)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch AI stats')
      }
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAIStats(false)
  }, [])

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0%'
    return `${((value / total) * 100).toFixed(1)}%`
  }

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          marginBottom: '10px',
          color: '#1a1a1a'
        }}>
          Admin Panel
        </h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          System administration and monitoring
        </p>
      </div>

      {/* Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        <Link 
          href="/admin/sitemap" 
          style={{
            padding: '10px 20px',
            backgroundColor: '#f0f0f0',
            borderRadius: '8px',
            textDecoration: 'none',
            color: '#333',
            border: '1px solid #ddd',
            transition: 'all 0.2s'
          }}
        >
          📄 Sitemap Management
        </Link>
        <button
          onClick={() => fetchAIStats(false)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          🔄 Refresh AI Stats
        </button>
        <button
          onClick={() => fetchAIStats(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          🔨 Rebuild Statistics
        </button>
      </div>

      {/* AI Statistics */}
      <div style={{ 
        backgroundColor: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '30px'
      }}>
        <h2 style={{ 
          fontSize: '1.8rem', 
          marginBottom: '20px',
          color: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          🤖 AI Provider Statistics
        </h2>

        {loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: '#666'
          }}>
            Loading AI statistics...
          </div>
        )}

        {error && (
          <div style={{ 
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #f5c6cb'
          }}>
            Error: {error}
          </div>
        )}

        {aiStats && !loading && (
          <div>
            {/* Available Providers */}
            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ 
                fontSize: '1.3rem', 
                marginBottom: '15px',
                color: '#495057'
              }}>
                Available Providers ({aiStats.totalProviders})
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px'
              }}>
                {aiStats.providers.map((provider, index) => (
                  <div key={index} style={{
                    backgroundColor: 'white',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ 
                      fontWeight: 'bold', 
                      fontSize: '1.1rem',
                      marginBottom: '5px',
                      color: '#28a745'
                    }}>
                      {provider.name}
                    </div>
                    <div style={{ color: '#6c757d' }}>
                      {provider.models} models available
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Usage Statistics */}
            {aiStats.providerUsage && (
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ 
                  fontSize: '1.3rem', 
                  marginBottom: '15px',
                  color: '#495057'
                }}>
                  Usage Statistics
                </h3>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '20px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6',
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      fontSize: '2rem', 
                      fontWeight: 'bold', 
                      color: '#007bff',
                      marginBottom: '5px'
                    }}>
                      {aiStats.providerUsage.totalArticlesWithAI}
                    </div>
                    <div style={{ color: '#6c757d' }}>
                      Articles with AI metadata
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#868e96' }}>
                      out of {aiStats.providerUsage.totalArticles} total
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6',
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 'bold', 
                      color: '#28a745',
                      marginBottom: '5px'
                    }}>
                      {aiStats.providerUsage.topProvider}
                    </div>
                    <div style={{ color: '#6c757d' }}>
                      Most used provider
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6',
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      fontSize: '1.2rem', 
                      fontWeight: 'bold', 
                      color: '#6f42c1',
                      marginBottom: '5px'
                    }}>
                      {aiStats.providerUsage.topModel}
                    </div>
                    <div style={{ color: '#6c757d' }}>
                      Most used model
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6',
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 'bold', 
                      color: '#fd7e14',
                      marginBottom: '5px'
                    }}>
                      {aiStats.providerUsage.originalContentCounts.original}
                    </div>
                    <div style={{ color: '#6c757d' }}>
                      Original articles
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#868e96' }}>
                      created without Wikipedia
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6',
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 'bold', 
                      color: '#20c997',
                      marginBottom: '5px'
                    }}>
                      {aiStats.providerUsage.originalContentCounts.rewritten}
                    </div>
                    <div style={{ color: '#6c757d' }}>
                      Rewritten articles
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#868e96' }}>
                      enhanced from Wikipedia
                    </div>
                  </div>
                </div>

                {/* Content Type Breakdown */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '20px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                  }}>
                    <h4 style={{ 
                      marginBottom: '15px',
                      color: '#495057',
                      fontSize: '1.1rem'
                    }}>
                      Content Types
                    </h4>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
                      padding: '8px 0',
                      borderBottom: '1px solid #f1f3f4'
                    }}>
                      <span style={{ fontWeight: '500' }}>Created (Original)</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ 
                          backgroundColor: '#fff3cd',
                          color: '#856404',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.9rem'
                        }}>
                          {aiStats.providerUsage.contentTypeCounts.created}
                        </span>
                        <span style={{ 
                          color: '#6c757d',
                          fontSize: '0.9rem'
                        }}>
                          {formatPercentage(aiStats.providerUsage.contentTypeCounts.created, aiStats.providerUsage.totalArticlesWithAI)}
                        </span>
                      </div>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
                      padding: '8px 0',
                      borderBottom: '1px solid #f1f3f4'
                    }}>
                      <span style={{ fontWeight: '500' }}>Rewritten (Wikipedia)</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ 
                          backgroundColor: '#d1ecf1',
                          color: '#0c5460',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.9rem'
                        }}>
                          {aiStats.providerUsage.contentTypeCounts.rewritten}
                        </span>
                        <span style={{ 
                          color: '#6c757d',
                          fontSize: '0.9rem'
                        }}>
                          {formatPercentage(aiStats.providerUsage.contentTypeCounts.rewritten, aiStats.providerUsage.totalArticlesWithAI)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                  }}>
                    <h4 style={{ 
                      marginBottom: '15px',
                      color: '#495057',
                      fontSize: '1.1rem'
                    }}>
                      Provider Usage
                    </h4>
                    {Object.entries(aiStats.providerUsage.providerCounts).map(([provider, count]) => (
                      <div key={provider} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px',
                        padding: '8px 0',
                        borderBottom: '1px solid #f1f3f4'
                      }}>
                        <span style={{ fontWeight: '500' }}>{provider}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ 
                            backgroundColor: '#e9ecef',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.9rem'
                          }}>
                            {count}
                          </span>
                          <span style={{ 
                            color: '#6c757d',
                            fontSize: '0.9rem'
                          }}>
                            {formatPercentage(count, aiStats.providerUsage.totalArticlesWithAI)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                  }}>
                    <h4 style={{ 
                      marginBottom: '15px',
                      color: '#495057',
                      fontSize: '1.1rem'
                    }}>
                      Model Usage
                    </h4>
                    {Object.entries(aiStats.providerUsage.modelCounts)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 10)
                      .map(([model, count]) => (
                      <div key={model} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                        padding: '6px 0',
                        borderBottom: '1px solid #f1f3f4'
                      }}>
                        <span style={{ 
                          fontWeight: '500',
                          fontSize: '0.9rem',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {model}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            backgroundColor: '#e9ecef',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            fontSize: '0.8rem'
                          }}>
                            {count}
                          </span>
                          <span style={{ 
                            color: '#6c757d',
                            fontSize: '0.8rem'
                          }}>
                            {formatPercentage(count, aiStats.providerUsage.totalArticlesWithAI)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Test Generation */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ 
                fontSize: '1.3rem', 
                marginBottom: '15px',
                color: '#495057'
              }}>
                Provider Test
              </h3>
              <div style={{
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #dee2e6',
                fontFamily: 'monospace',
                fontSize: '0.9rem'
              }}>
                {typeof aiStats.testGeneration === 'string' ? (
                  <div style={{ 
                    color: aiStats.testGeneration.startsWith('Error:') ? '#dc3545' : '#28a745'
                  }}>
                    {aiStats.testGeneration}
                  </div>
                ) : (
                  <div style={{ color: '#28a745' }}>
                    <div><strong>Content:</strong> {aiStats.testGeneration?.content || 'N/A'}</div>
                    <div><strong>Provider:</strong> {aiStats.testGeneration?.provider || 'N/A'}</div>
                    <div><strong>Model:</strong> {aiStats.testGeneration?.model || 'N/A'}</div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ 
              fontSize: '0.9rem', 
              color: '#6c757d',
              textAlign: 'right'
            }}>
              API updated: {new Date(aiStats.timestamp).toLocaleString()}
              {aiStats.providerUsage?.lastUpdated && (
                <>
                  <br />
                  Cache updated: {new Date(aiStats.providerUsage.lastUpdated).toLocaleString()}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}