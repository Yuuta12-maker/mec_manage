'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Navigation from '@/components/Navigation'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import Link from 'next/link'
import { Search, User, Calendar, ArrowRight } from 'lucide-react'

interface SearchResults {
  clients: any[]
  sessions: any[]
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams?.get('q') || ''
  const [results, setResults] = useState<SearchResults>({ clients: [], sessions: [] })
  const [totalResults, setTotalResults] = useState(0)
  const { isLoading, error, handleAsync, clearError } = useErrorHandler()

  useEffect(() => {
    if (query) {
      performSearch(query)
    }
  }, [query])

  const performSearch = async (searchQuery: string) => {
    await handleAsync(async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (data.success) {
        setResults(data.results)
        setTotalResults(data.totalResults)
      } else {
        throw new Error(data.error || '検索に失敗しました')
      }
    }, '検索の実行に失敗しました')
  }

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      applied: '申込完了',
      trial_booked: 'トライアル予約済',
      trial_completed: 'トライアル完了',
      active: '継続中',
      completed: '完了',
      inactive: '非アクティブ',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      applied: 'bg-yellow-100 text-yellow-800',
      trial_booked: 'bg-orange-100 text-orange-800',
      trial_completed: 'bg-purple-100 text-purple-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      inactive: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getSessionStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      scheduled: '予定',
      completed: '実施済み',
      cancelled: 'キャンセル',
    }
    return labels[status] || status
  }

  const getSessionStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getTypeLabel = (type: string) => {
    return type === 'trial' ? 'トライアル' : '通常セッション'
  }

  const highlightText = (text: string, searchQuery: string) => {
    if (!text || !searchQuery) return text
    const regex = new RegExp(`(${searchQuery})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
  }

  if (!query) {
    return (
      <div className="min-h-screen bg-background-secondary">
        <Navigation />
        <main className="md:ml-64 p-6">
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">検索キーワードがありません</h3>
            <p className="mt-1 text-sm text-gray-500">左側の検索バーからキーワードを入力してください。</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      <Navigation />

      <main className="md:ml-64 p-6">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Search className="h-6 w-6 text-gray-600" />
            <h1 className="text-2xl font-semibold text-gray-900">検索結果</h1>
          </div>
          
          {error && (
            <ErrorMessage 
              message={error} 
              onRetry={() => performSearch(query)}
              onDismiss={clearError}
              className="mb-6"
            />
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  検索キーワード: <span className="font-medium text-gray-900">"{query}"</span>
                </p>
                {!isLoading && (
                  <p className="text-sm text-gray-500 mt-1">
                    {totalResults}件の結果が見つかりました
                  </p>
                )}
              </div>
              {isLoading && <LoadingSpinner size="sm" />}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-600">検索中...</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* クライアント検索結果 */}
            {results.clients.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <User className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-medium text-gray-900">
                    クライアント ({results.clients.length}件)
                  </h2>
                </div>
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {results.clients.map((client) => (
                      <li key={client.id}>
                        <Link href={`/clients/${client.id}`} className="block hover:bg-gray-50">
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-700">
                                      {client.name[0]}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="flex items-center">
                                    <p 
                                      className="text-sm font-medium text-gray-900 truncate"
                                      dangerouslySetInnerHTML={{ __html: highlightText(client.name, query) }}
                                    />
                                    {client.name_kana && (
                                      <p 
                                        className="ml-2 text-sm text-gray-500"
                                        dangerouslySetInnerHTML={{ __html: `(${highlightText(client.name_kana, query)})` }}
                                      />
                                    )}
                                  </div>
                                  <p 
                                    className="text-sm text-gray-500"
                                    dangerouslySetInnerHTML={{ __html: highlightText(client.email, query) }}
                                  />
                                  {client.notes && (
                                    <p 
                                      className="text-xs text-gray-400 mt-1 truncate"
                                      dangerouslySetInnerHTML={{ __html: highlightText(client.notes, query) }}
                                    />
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                                  {getStatusLabel(client.status)}
                                </span>
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* セッション検索結果 */}
            {results.sessions.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-medium text-gray-900">
                    セッション ({results.sessions.length}件)
                  </h2>
                </div>
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {results.sessions.map((session) => (
                      <li key={session.id}>
                        <Link href={`/sessions/${session.id}`} className="block hover:bg-gray-50">
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <p className="text-sm font-medium text-gray-900">
                                      {session.client.name}
                                    </p>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      {getTypeLabel(session.type)}
                                    </span>
                                    {session.session_number && (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                        {session.session_number}回目
                                      </span>
                                    )}
                                  </div>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSessionStatusColor(session.status)}`}>
                                    {getSessionStatusLabel(session.status)}
                                  </span>
                                </div>
                                <div className="mt-2">
                                  <p className="text-sm text-gray-600">
                                    {new Date(session.scheduled_date).toLocaleString('ja-JP')}
                                  </p>
                                  {session.coach_name && (
                                    <p 
                                      className="text-sm text-gray-500"
                                      dangerouslySetInnerHTML={{ __html: `コーチ: ${highlightText(session.coach_name, query)}` }}
                                    />
                                  )}
                                  {session.notes && (
                                    <p 
                                      className="text-xs text-gray-400 mt-1"
                                      dangerouslySetInnerHTML={{ __html: `メモ: ${highlightText(session.notes, query)}` }}
                                    />
                                  )}
                                  {session.summary && (
                                    <p 
                                      className="text-xs text-gray-400 mt-1"
                                      dangerouslySetInnerHTML={{ __html: `要約: ${highlightText(session.summary, query)}` }}
                                    />
                                  )}
                                </div>
                              </div>
                              <div className="ml-4">
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 検索結果なし */}
            {!isLoading && totalResults === 0 && (
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">検索結果が見つかりません</h3>
                <p className="mt-1 text-sm text-gray-500">
                  「{query}」に一致する結果がありませんでした。<br />
                  別のキーワードで検索してみてください。
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}