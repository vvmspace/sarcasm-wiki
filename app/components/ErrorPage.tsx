import Navigation from './Navigation'
import Button from './Button'

interface ErrorPageProps {
  title?: string
  message?: string
  statusCode?: number
  showHomeButton?: boolean
}

export default function ErrorPage({
  title = 'Oops! Something went wrong',
  message = 'We encountered an unexpected error. Please try again later.',
  statusCode = 500,
  showHomeButton = true
}: ErrorPageProps) {
  return (
    <>
      <Navigation />
      
      <main className="error-page">
        <div className="error-content">
          <div className="error-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
            </svg>
          </div>
          
          {statusCode && (
            <div className="error-code">{statusCode}</div>
          )}
          
          <h1 className="error-title">{title}</h1>
          <p className="error-message">{message}</p>
          
          {showHomeButton && (
            <div className="error-actions">
              <Button variant="primary" size="lg" href="/">
                Back to Home
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .error-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: var(--gradient);
        }

        .error-content {
          text-align: center;
          max-width: 600px;
          background: var(--white);
          padding: 4rem 3rem;
          border-radius: 16px;
          box-shadow: 0 8px 32px var(--shadow);
          border: 1px solid var(--silver);
        }

        .error-icon {
          color: var(--accent-red);
          margin-bottom: 2rem;
          display: flex;
          justify-content: center;
        }

        .error-code {
          font-size: 6rem;
          font-weight: 800;
          color: var(--m-blue);
          line-height: 1;
          margin-bottom: 1rem;
          opacity: 0.3;
        }

        .error-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--black);
          margin-bottom: 1rem;
        }

        .error-title::after {
          display: none;
        }

        .error-message {
          font-size: 1.1rem;
          color: var(--charcoal);
          margin-bottom: 3rem;
          line-height: 1.6;
        }

        .error-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .error-content {
            padding: 3rem 2rem;
          }

          .error-code {
            font-size: 4rem;
          }

          .error-title {
            font-size: 1.5rem;
          }

          .error-actions {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </>
  )
}