'use client'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function LoadingSpinner({ 
  size = 'md', 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className={`animate-spin rounded-full border-2 border-primary-200 border-t-primary-500 shadow-glow ${sizeClasses[size]} ${className}`}>
      <span className="sr-only">🔄 読み込み中...</span>
    </div>
  )
}