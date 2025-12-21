import Button from './Button'

interface HeroProps {
  title: string
  subtitle?: string
  description: string
  primaryAction?: {
    text: string
    href: string
  }
  secondaryAction?: {
    text: string
    href: string
  }
  backgroundPattern?: boolean
}

export default function Hero({
  title,
  subtitle,
  description,
  primaryAction,
  secondaryAction,
  backgroundPattern = true
}: HeroProps) {
  return (
    <section className="hero">
      {backgroundPattern && <div className="hero-pattern"></div>}
      
      <div className="hero-content">
        {subtitle && (
          <div className="hero-subtitle">{subtitle}</div>
        )}
        
        <h1 className="hero-title">{title}</h1>
        
        <p className="hero-description">{description}</p>
        
        {(primaryAction || secondaryAction) && (
          <div className="hero-actions">
            {primaryAction && (
              <Button 
                variant="primary" 
                size="lg" 
                href={primaryAction.href}
              >
                {primaryAction.text}
              </Button>
            )}
            {secondaryAction && (
              <Button 
                variant="outline" 
                size="lg" 
                href={secondaryAction.href}
              >
                {secondaryAction.text}
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}