'use client'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

export default function ErrorMessage({ 
  message, 
  onRetry, 
  onDismiss, 
  className = '' 
}: ErrorMessageProps) {
  return (
    <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg 
            className="h-5 w-5 text-red-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-red-800 dark:text-red-200">
            {message}
          </p>
        </div>
        <div className="ml-auto flex space-x-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm text-red-800 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100 font-medium underline"
            >
              再試行
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-sm text-red-400 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400"
            >
              <span className="sr-only">閉じる</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}