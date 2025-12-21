interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}: BadgeProps) {
  return (
    <span className={`badge badge-${variant} badge-${size} ${className}`}>
      {children}
    </span>
  )
}