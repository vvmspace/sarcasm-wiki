import Navigation from './Navigation'
import Button from './Button'

interface ArticleProps {
  title: string
  content: string
  backLink?: string
}

export default function Article({ title, content, backLink = '/' }: ArticleProps) {
  return (
    <>
      <Navigation />
      
      <main className="container">
        <div className="article-header">
          <Button 
            variant="ghost" 
            href={backLink}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
              </svg>
            }
          >
            Back to Home
          </Button>
        </div>

        <article className="article">
          <header className="article-title-section">
            <h1>{title}</h1>
          </header>
          
          <div 
            className="article-content"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </article>
      </main>
    </>
  )
}