'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { useState } from 'react'

export default function Navigation() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const { isDarkMode, toggleDarkMode } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'ダッシュボード', href: '/dashboard' },
    { name: 'クライアント管理', href: '/clients' },
    { name: 'セッション管理', href: '/sessions' },
    { name: '支払い管理', href: '/payments' },
  ]

  const externalLinks = [
    { name: '申し込みページ', href: '/apply', external: true },
    { name: 'セッション予約', href: '/booking', external: true },
  ]

  return (
    <nav className="glass-effect shadow-lg dark:shadow-gray-700/50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent animate-pulse-slow flex items-center">
                🎯 MEC管理システム
              </h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    pathname === item.href
                      ? 'border-primary-500 dark:border-primary-400 text-primary-600 dark:text-primary-400 shadow-glow'
                      : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-primary-300 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 hover:shadow-glow'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300 transform hover:scale-105`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            {/* モバイルメニューボタン */}
            <div className="sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-500 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-300 transform hover:scale-110 hover:shadow-glow"
                aria-label="メニューを開く"
              >
                {isMobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
            <div className="hidden sm:flex sm:items-center sm:space-x-3">
              {/* ダークモードトグル */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-300 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20 focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all duration-300 transform hover:scale-110 hover:shadow-glow-orange animate-bounce-gentle"
                aria-label={isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
              >
                {isDarkMode ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* 外部リンクドロップダウン */}
              <div className="relative group">
                <button className="inline-flex items-center px-3 py-2 btn-secondary text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500">
                  🌐 外部ページ
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-48 glass-effect rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 dark:ring-gray-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform group-hover:scale-105">
                  <div className="py-1">
                    {externalLinks.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-primary-50 hover:to-secondary-50 dark:hover:from-primary-900/20 dark:hover:to-secondary-900/20 hover:text-primary-700 dark:hover:text-primary-300 transition-all duration-300 rounded-md"
                      >
                        {item.name}
                        <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              
              <span className="text-sm text-gray-700 dark:text-gray-300 hidden md:block">
                {user?.email}
              </span>
              <button
                onClick={signOut}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>

        {/* モバイルメニュー */}
        {isMobileMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`${
                    pathname === item.href
                      ? 'bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border-primary-500 dark:border-primary-400 text-primary-700 dark:text-primary-200 shadow-glow'
                      : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gradient-to-r hover:from-primary-50 hover:to-secondary-50 dark:hover:from-primary-900/20 dark:hover:to-secondary-900/20 hover:border-primary-300 dark:hover:border-primary-600 hover:text-primary-700 dark:hover:text-primary-300'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-all duration-300 transform hover:scale-105`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            
            {/* モバイル用外部リンク */}
            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-600">
              <div className="px-3 space-y-1">
                <div className="text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-2 flex items-center">🌐 外部ページ</div>
                {externalLinks.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-gradient-to-r hover:from-primary-50 hover:to-secondary-50 dark:hover:from-primary-900/20 dark:hover:to-secondary-900/20 transition-all duration-300 rounded-md transform hover:scale-105"
                  >
                    {item.name}
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>

            {/* モバイル用アクション */}
            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {user?.email}
                  </span>
                </div>
                <div className="ml-auto flex items-center space-x-2">
                  <button
                    onClick={toggleDarkMode}
                    className="p-2 rounded-lg text-gray-500 dark:text-gray-300 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-all duration-300 transform hover:scale-110 hover:shadow-glow-orange animate-bounce-gentle"
                    aria-label={isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
                  >
                    {isDarkMode ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={signOut}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                  >
                    ログアウト
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}