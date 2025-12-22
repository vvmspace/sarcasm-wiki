import Link from 'next/link'

interface CardProps {
  title: string
  description: string
  href?: string
  icon?: React.ReactNode
  image?: string // Path to article image
  variant?: 'default' | 'featured' | 'minimal'
  children?: React.ReactNode
}

export default function Card({ 
  title, 
  description, 
  href, 
  icon, 
  image,
  variant = 'default',
  children 
}: CardProps) {
  const normalizeDescription = (input: string): string => {
    const decoded = input
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => {
        try {
          return String.fromCodePoint(parseInt(hex, 16))
        } catch {
          return _m
        }
      })
      .replace(/&#(\d+);/g, (_m, num) => {
        try {
          return String.fromCodePoint(parseInt(num, 10))
        } catch {
          return _m
        }
      })

    const unmarked = decoded
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/`([^`]+)`/g, '$1')

    return unmarked.replace(/\s+/g, ' ').trim()
  }

  const normalizedDescription = normalizeDescription(description)

  const CardContent = () => (
    <div className={`card card-${variant} ${image ? 'card-with-image' : ''}`}>
      {image && (
        <div className="card-image">
          <img 
            src={image} 
            alt={`${title}`}
            title={`${title}`}
            className="card-hero-image"
          />
        </div>
      )}
      
      {!image && icon && (
        <div className="card-icon">
          {icon}
        </div>
      )}
      
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <p className="card-description">{normalizedDescription}</p>
        {children}
      </div>

      {variant === 'featured' && (
        <div className="card-accent"></div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="card-link">
        <CardContent />
      </Link>
    )
  }

  return <CardContent />
}