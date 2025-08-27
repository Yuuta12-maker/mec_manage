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
  const [systemStatus, setSystemStatus] = useState<{
    lastPing?: string
    isActive: boolean
    message?: string
  }>({ isActive: false })
  const [activeClientsProgress, setActiveClientsProgress] = useState<Array<{
    id: string
    name: string
    completedSessions: number
  }>>([])
  const [checkingCompletion, setCheckingCompletion] = useState(false)

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

      // 継続中クライアントの進捗情報を取得
      await fetchActiveClientsProgress()
    }, 'ダッシュボードデータの取得に失敗しました')
  }

  const fetchActiveClientsProgress = async () => {
    try {
      // activeステータスのクライアントを取得
      const { data: activeClients, error: clientError } = await supabase
        .from('clients')
        .select('id, name')
        .eq('status', 'active')

      if (clientError || !activeClients) {
        console.error('継続中クライアント取得エラー:', clientError)
        return
      }

      const progressData = []
      
      // 各activeクライアントの完了セッション数を取得
      for (const client of activeClients) {
        const { data: completedSessions, error: sessionError } = await supabase
          .from('sessions')
          .select('id')
          .eq('client_id', client.id)
          .eq('status', 'completed')

        if (!sessionError && completedSessions) {
          progressData.push({
            id: client.id,
            name: client.name,
            completedSessions: completedSessions.length
          })
        }
      }

      setActiveClientsProgress(progressData)
    } catch (error) {
      console.error('継続中クライアント進捗取得エラー:', error)
    }
  }

  const handleCompletionStatusCheck = async () => {
    setCheckingCompletion(true)
    try {
      const response = await fetch('/api/check-completion-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      
      if (result.success) {
        alert(`✅ 完了ステータスチェックが完了しました！\n\n` +
              `チェック対象: ${result.totalChecked}人\n` +
              `ステータス更新: ${result.updated.length}人\n\n` +
              (result.updated.length > 0 ? 
                `更新されたクライアント:\n${result.updated.map((c: any) => `• ${c.name} (${c.sessionCount}回完了)`).join('\n')}` 
                : '更新が必要なクライアントはいませんでした'))
        
        // データを再取得して画面を更新
        await fetchDashboardData()
      } else {
        alert(`❌ チェック処理に失敗しました: ${result.error}`)
      }
    } catch (error) {
      console.error('完了ステータスチェックエラー:', error)
      alert('❌ システムエラーが発生しました')
    } finally {
      setCheckingCompletion(false)
    }
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

  const performKeepAlive = async () => {
    try {
      const response = await fetch('/api/keep-alive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      
      if (result.success) {
        setSystemStatus({
          isActive: true,
          lastPing: new Date().toISOString(),
          message: 'システム維持完了'
        })
        
        // 3秒後にメッセージを消去
        setTimeout(() => {
          setSystemStatus(prev => ({
            ...prev,
            message: undefined
          }))
        }, 3000)
      } else {
        setSystemStatus({
          isActive: false,
          message: 'システム維持に失敗しました'
        })
      }
    } catch (error) {
      console.error('Keep-alive error:', error)
      setSystemStatus({
        isActive: false,
        message: 'システム維持でエラーが発生しました'
      })
    }
  }

  const checkSystemHealth = async () => {
    try {
      const response = await fetch('/api/health-check')
      const result = await response.json()
      
      if (result.success) {
        setSystemStatus({
          isActive: true,
          lastPing: result.timestamp,
          message: 'システム正常'
        })
        
        setTimeout(() => {
          setSystemStatus(prev => ({
            ...prev,
            message: undefined
          }))
        }, 3000)
      } else {
        setSystemStatus({
          isActive: false,
          message: 'システムヘルスチェックに失敗'
        })
      }
    } catch (error) {
      console.error('Health check error:', error)
      setSystemStatus({
        isActive: false,
        message: 'ヘルスチェックエラー'
      })
    }
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      <Navigation />

      <main className="md:ml-64 p-6">
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
              {/* システム維持機能 */}
              <div className="aws-card-hover overflow-hidden mb-6">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex flex-col space-y-4">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                        システム維持
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Supabase の自動停止を防止
                      </p>
                      {systemStatus.lastPing && (
                        <p className="text-xs text-gray-500 mt-1">
                          最終: {new Date(systemStatus.lastPing).toLocaleString('ja-JP')}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={checkSystemHealth}
                        className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                      >
                        ヘルスチェック
                      </button>
                      <button
                        onClick={performKeepAlive}
                        className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                      >
                        システム維持実行
                      </button>
                    </div>
                  </div>
                  {systemStatus.message && (
                    <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${
                      systemStatus.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {systemStatus.message}
                    </div>
                  )}
                </div>
              </div>

              {/* クライアント状況 */}
              <div className="aws-card-hover overflow-hidden mb-8">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      クライアント状況
                    </h3>
                    <button
                      onClick={handleCompletionStatusCheck}
                      disabled={checkingCompletion}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {checkingCompletion ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          チェック中...
                        </>
                      ) : (
                        '完了ステータス一括チェック'
                      )}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    <div className="text-center">
                      <div className="aws-metric-value text-blue-600">{stats.total}</div>
                      <div className="aws-metric-label">総数</div>
                    </div>
                    <div className="text-center">
                      <div className="aws-metric-value text-yellow-600">{stats.applied}</div>
                      <div className="aws-metric-label">申込完了</div>
                    </div>
                    <div className="text-center">
                      <div className="aws-metric-value text-orange-600">{stats.trial_booked}</div>
                      <div className="aws-metric-label">トライアル予約済</div>
                    </div>
                    <div className="text-center">
                      <div className="aws-metric-value text-purple-600">{stats.trial_completed}</div>
                      <div className="aws-metric-label">トライアル完了</div>
                    </div>
                    <div className="text-center">
                      <div className="aws-metric-value text-green-600">{stats.active}</div>
                      <div className="aws-metric-label">継続中</div>
                    </div>
                    <div className="text-center">
                      <div className="aws-metric-value text-blue-600">{stats.completed}</div>
                      <div className="aws-metric-label">完了</div>
                    </div>
                    <div className="text-center">
                      <div className="aws-metric-value text-gray-600">{stats.inactive}</div>
                      <div className="aws-metric-label">非アクティブ</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 継続中クライアントの進捗 */}
              {activeClientsProgress.length > 0 && (
                <div className="aws-card-hover overflow-hidden mb-8">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                      継続中クライアントの進捗 ({activeClientsProgress.length}人)
                    </h3>
                    <div className="grid gap-4">
                      {activeClientsProgress.map((client) => {
                        const progress = Math.min((client.completedSessions / 6) * 100, 100)
                        const remaining = Math.max(6 - client.completedSessions, 0)
                        const isNearCompletion = client.completedSessions >= 5
                        
                        return (
                          <div key={client.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                            <div className="flex justify-between items-center mb-2">
                              <div className="font-medium text-gray-900 dark:text-white">
                                <Link
                                  href={`/clients/${client.id}`}
                                  className="text-primary hover:underline"
                                >
                                  {client.name}
                                </Link>
                              </div>
                              <div className={`text-sm font-medium ${isNearCompletion ? 'text-orange-600' : 'text-gray-600'}`}>
                                {client.completedSessions}/6回完了
                                {remaining > 0 && (
                                  <span className="ml-2 text-gray-500">
                                    (あと{remaining}回)
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  progress === 100 ? 'bg-green-500' : 
                                  isNearCompletion ? 'bg-orange-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            {client.completedSessions >= 6 && (
                              <div className="mt-2 text-xs text-orange-600 font-medium">
                                ⚠️ 6回完了 - 自動的に「完了」ステータスに移行対象
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 本日のセッション */}
              <div className="aws-card-hover overflow-hidden mb-8">
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
                                      {session.session_number && (
                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                          {session.session_number}回目
                                        </span>
                                      )}
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
              <div className="aws-card-hover overflow-hidden">
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
                                      {session.session_number && (
                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                          {session.session_number}回目
                                        </span>
                                      )}
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