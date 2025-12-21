interface LoadingProps {
  text?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function Loading({ text = 'Loading...', size = 'md' }: LoadingProps) {
  return (
    <div className={`loading loading-${size}`}>
      <div className="loading-spinner">
        <div className="loading-ring"></div>
        <div className="loading-ring"></div>
        <div className="loading-ring"></div>
      </div>
      
      {text && <p className="loading-text">{text}</p>}
    </div>
  )
}