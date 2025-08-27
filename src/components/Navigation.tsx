'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { useState } from 'react'
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CreditCard, 
  Settings,
  ExternalLink,
  Menu,
  X,
  Search
} from 'lucide-react'

export default function Navigation() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const { isDarkMode, toggleDarkMode } = useTheme()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const navigation = [
    { name: 'ダッシュボード', href: '/dashboard', icon: LayoutDashboard },
    { name: 'クライアント管理', href: '/clients', icon: Users },
    { name: 'セッション管理', href: '/sessions', icon: Calendar },
    { name: '支払い管理', href: '/payments', icon: CreditCard },
    { name: '振込確認管理', href: '/admin/bank-transfers', icon: CreditCard },
  ]

  const externalLinks = [
    { name: '申し込みページ', href: '/apply', external: true },
    { name: 'セッション予約', href: '/booking', external: true },
    { name: '継続申し込み（手動入力）', href: '/apply/continue', external: true },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsSidebarOpen(false)
    }
  }

  return (
    <>
      {/* Top Header - Mobile */}
      <div className="md:hidden bg-white shadow-sm border-b border-gray-200">
        <div className="flex justify-between items-center h-16 px-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="bg-brand-red text-white px-3 py-1 rounded text-sm font-semibold">
              MEC
            </div>
            <h1 className="text-lg font-medium text-gray-900">管理システム</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-brand-red rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-center h-16 px-4 bg-brand-red shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-white text-brand-red px-3 py-1 rounded text-sm font-bold shadow-sm">
                MEC
              </div>
              <h1 className="text-lg font-semibold text-white">管理システム</h1>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-4 py-4 bg-gray-50 border-b border-gray-200">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="検索..."
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-2 focus:ring-brand-red focus:border-transparent text-sm shadow-sm transition-all duration-200"
              />
            </form>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-brand-red text-white shadow-sm'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* External Links */}
          <div className="px-3 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
              外部ページ
            </div>
            <div className="space-y-1">
              {externalLinks.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200 group"
                >
                  <ExternalLink className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gray-600" />
                  <span className="flex-1 truncate">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* User Section */}
          <div className="px-3 py-4 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-3 mb-4 p-2 rounded-lg bg-gray-50">
              <div className="w-10 h-10 bg-brand-red rounded-full flex items-center justify-center shadow-sm">
                <span className="text-sm font-medium text-white">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center px-3 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:shadow-sm"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  )
}