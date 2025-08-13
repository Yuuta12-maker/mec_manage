import type { Metadata } from 'next'
import { Fira_Sans, Noto_Sans_JP } from 'next/font/google'
import AuthProvider from '@/components/AuthProvider'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ThemeProvider } from '@/contexts/ThemeContext'
import './globals.css'

const firaSans = Fira_Sans({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700']
})

const notoSansJP = Noto_Sans_JP({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700']
})

export const metadata: Metadata = {
  title: 'MEC管理システム',
  description: 'マインドエンジニアリング・コーチング管理システム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={`${firaSans.className} ${notoSansJP.className} gradient-bg text-gray-900 dark:text-white transition-all duration-500`}>
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}