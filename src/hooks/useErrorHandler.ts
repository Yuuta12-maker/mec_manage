'use client'

import { useState, useCallback } from 'react'
import { LoadingState } from '@/types'

export function useErrorHandler() {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    error: null,
  })

  const handleAsync = useCallback(async <T>(
    asyncFunction: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> => {
    setLoadingState({ isLoading: true, error: null })
    
    try {
      const result = await asyncFunction()
      setLoadingState({ isLoading: false, error: null })
      return result
    } catch (error) {
      const errorMsg = errorMessage || 
        (error instanceof Error ? error.message : 'エラーが発生しました')
      
      console.error('Error in async operation:', error)
      setLoadingState({ isLoading: false, error: errorMsg })
      return null
    }
  }, [])

  const clearError = useCallback(() => {
    setLoadingState(prev => ({ ...prev, error: null }))
  }, [])

  const setLoading = useCallback((isLoading: boolean) => {
    setLoadingState(prev => ({ ...prev, isLoading }))
  }, [])

  return {
    ...loadingState,
    handleAsync,
    clearError,
    setLoading,
  }
}