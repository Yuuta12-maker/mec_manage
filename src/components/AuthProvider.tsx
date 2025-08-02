'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading) {
      // 認証不要なページのリスト
      const publicPaths = ['/login', '/signup', '/debug', '/public-debug', '/test-signup']
      const isPublicPath = publicPaths.includes(pathname)
      
      if (!user && !isPublicPath) {
        router.push('/login')
      } else if (user && pathname === '/login') {
        router.push('/dashboard')
      }
    }
  }, [user, loading, pathname, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <>{children}</>
}