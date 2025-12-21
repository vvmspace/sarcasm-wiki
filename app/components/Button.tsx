import Link from 'next/link'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  href?: string
  onClick?: () => void
  disabled?: boolean
  icon?: React.ReactNode
  className?: string
}

export default function Button({
  children,
  variant = 'secondary',
  size = 'md',
  href,
  onClick,
  disabled = false,
  icon,
  className = ''
}: ButtonProps) {
  const baseClasses = `btn btn-${variant} btn-${size} ${className}`

  const ButtonContent = () => (
    <>
      {icon && <span className="btn-icon">{icon}</span>}
      <span>{children}</span>
    </>
  )

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        <ButtonContent />
      </Link>
    )
  }

  return (
    <button 
      className={baseClasses} 
      onClick={onClick} 
      disabled={disabled}
    >
      <ButtonContent />
    </button>
  )
}