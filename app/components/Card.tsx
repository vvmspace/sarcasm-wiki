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
        <p className="card-description">{description}</p>
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