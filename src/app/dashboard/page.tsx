'use client'

export const dynamic = 'force-dynamic'

import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Client, Session, SessionWithClient, DashboardStats } from '@/types'
import Navigation from '@/components/Navigation'
import Calendar from '@/components/Calendar'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import Link from 'next/link'

export default function Dashboard() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [todaySessions, setTodaySessions] = useState<SessionWithClient[]>([])
  const [upcomingSessions, setUpcomingSessions] = useState<SessionWithClient[]>([])
  const [allSessions, setAllSessions] = useState<SessionWithClient[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    applied: 0,
    trial_booked: 0,
    trial_completed: 0,
    active: 0,
    completed: 0,
    inactive: 0,
  })
  
  const { isLoading, error, handleAsync, clearError } = useErrorHandler()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const calculateStats = (clientData: Client[]): DashboardStats => {
    return clientData.reduce((acc, client) => {
      acc.total++
      acc[client.status] = (acc[client.status] || 0) + 1
      return acc
    }, {
      total: 0,
      applied: 0,
      trial_booked: 0,
      trial_completed: 0,
      active: 0,
      completed: 0,
      inactive: 0,
    } as DashboardStats)
  }

  const fetchDashboardData = async () => {
    await handleAsync(async () => {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()
      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

      // 並列でデータを取得
      const [clientResult, todaySessionResult, upcomingSessionResult, allSessionResult] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('sessions')
          .select('*, client:clients(*)')
          .gte('scheduled_date', startOfDay)
          .lt('scheduled_date', endOfDay)
          .in('status', ['scheduled'])
          .order('scheduled_date', { ascending: true }),
        supabase.from('sessions')
          .select('*, client:clients(*)')
          .gte('scheduled_date', endOfDay)
          .lte('scheduled_date', sevenDaysFromNow.toISOString())
          .in('status', ['scheduled'])
          .order('scheduled_date', { ascending: true })
          .limit(10),
        supabase.from('sessions')
          .select('*, client:clients(*)')
          .order('scheduled_date', { ascending: true })
      ])

      // エラーハンドリング
      if (clientResult.error) {
        throw new Error(`クライアントデータの取得に失敗しました: ${clientResult.error.message}`)
      }
      if (todaySessionResult.error) {
        throw new Error(`本日のセッションデータの取得に失敗しました: ${todaySessionResult.error.message}`)
      }
      if (upcomingSessionResult.error) {
        throw new Error(`今後のセッションデータの取得に失敗しました: ${upcomingSessionResult.error.message}`)
      }
      if (allSessionResult.error) {
        throw new Error(`全セッションデータの取得に失敗しました: ${allSessionResult.error.message}`)
      }

      // データの設定
      if (clientResult.data) {
        setClients(clientResult.data)
        setStats(calculateStats(clientResult.data))
      }
      
      if (todaySessionResult.data) {
        setTodaySessions(todaySessionResult.data as SessionWithClient[])
      }
      
      if (upcomingSessionResult.data) {
        setUpcomingSessions(upcomingSessionResult.data as SessionWithClient[])
      }
      
      if (allSessionResult.data) {
        setAllSessions(allSessionResult.data as SessionWithClient[])
      }
    }, 'ダッシュボードデータの取得に失敗しました')
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

  const getTypeLabel = (type: string) => {
    return type === 'trial' ? 'トライアル' : '通常セッション'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">ダッシュボード</h2>
          
          {error && (
            <ErrorMessage 
              message={error} 
              onRetry={fetchDashboardData}
              onDismiss={clearError}
              className="mb-6"
            />
          )}
          
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-gray-600 dark:text-gray-300">データを読み込み中...</span>
            </div>
          )}
          
          {!isLoading && (
            <>
              {/* クライアント状況 */}
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg mb-8 transition-colors">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                    クライアント状況
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">総数</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{stats.applied}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">申込完了</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{stats.trial_booked}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">トライアル予約済</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{stats.trial_completed}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">トライアル完了</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">継続中</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">完了</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">非アクティブ</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 本日のセッション */}
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg mb-8 transition-colors">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                    本日のセッション
                  </h3>
                  {todaySessions.length > 0 ? (
                    <div className="flow-root">
                      <ul className="-mb-8">
                        {todaySessions.map((session, index) => (
                          <li key={session.id}>
                            <div className="relative pb-8">
                              {index !== todaySessions.length - 1 && (
                                <span
                                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                  aria-hidden="true"
                                />
                              )}
                              <div className="relative flex space-x-3">
                                <div>
                                  <span className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center ring-8 ring-white">
                                    <span className="text-white text-sm font-medium">
                                      {getTypeLabel(session.type)[0]}
                                    </span>
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                  <div>
                                    <Link
                                      href={`/sessions/${session.id}`}
                                      className="text-sm text-gray-500 hover:text-gray-700"
                                    >
                                      {session.client.name} - {getTypeLabel(session.type)}
                                    </Link>
                                    <p className="text-sm text-gray-900 font-medium">
                                      {new Date(session.scheduled_date).toLocaleString('ja-JP')}
                                    </p>
                                    <div className="flex space-x-4">
                                      {session.meet_link && (
                                        <a 
                                          href={session.meet_link} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                                        >
                                          Google Meet に参加
                                        </a>
                                      )}
                                      <Link
                                        href={`/sessions/${session.id}`}
                                        className="text-primary hover:text-primary/90 text-sm underline"
                                      >
                                        詳細を見る
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">本日のセッションはありません。</p>
                  )}
                </div>
              </div>

              {/* 今後7日以内のセッション */}
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                    今後7日以内のセッション
                  </h3>
                  {upcomingSessions.length > 0 ? (
                    <div className="flow-root">
                      <ul className="-mb-8">
                        {upcomingSessions.map((session, index) => (
                          <li key={session.id}>
                            <div className="relative pb-8">
                              {index !== upcomingSessions.length - 1 && (
                                <span
                                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                  aria-hidden="true"
                                />
                              )}
                              <div className="relative flex space-x-3">
                                <div>
                                  <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                    <span className="text-white text-sm font-medium">
                                      {getTypeLabel(session.type)[0]}
                                    </span>
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                  <div>
                                    <Link
                                      href={`/sessions/${session.id}`}
                                      className="text-sm text-gray-500 hover:text-gray-700"
                                    >
                                      {session.client.name} - {getTypeLabel(session.type)}
                                    </Link>
                                    <p className="text-sm text-gray-900">
                                      {new Date(session.scheduled_date).toLocaleString('ja-JP')}
                                    </p>
                                    <div className="flex space-x-4">
                                      {session.meet_link && (
                                        <a 
                                          href={session.meet_link} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                                        >
                                          Google Meet リンク
                                        </a>
                                      )}
                                      <Link
                                        href={`/sessions/${session.id}`}
                                        className="text-primary hover:text-primary/90 text-sm underline"
                                      >
                                        詳細を見る
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">今後7日以内に予定されているセッションはありません。</p>
                  )}
                </div>
              </div>

              {/* カレンダービュー */}
              <div className="mt-8">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">セッションカレンダー</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">月間スケジュールの概要</p>
                </div>
                <Calendar sessions={allSessions} />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}