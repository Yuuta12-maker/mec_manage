'use client'

export const dynamic = 'force-dynamic'

import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Client, Session } from '@/types'
import Navigation from '@/components/Navigation'
import Link from 'next/link'

export default function Dashboard() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [todaySessions, setTodaySessions] = useState<(Session & { client: Client })[]>([])
  const [upcomingSessions, setUpcomingSessions] = useState<(Session & { client: Client })[]>([])
  const [stats, setStats] = useState({
    total: 0,
    applied: 0,
    trial_booked: 0,
    trial_completed: 0,
    active: 0,
    completed: 0,
    inactive: 0,
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    // クライアント統計を取得
    const { data: clientData } = await supabase
      .from('clients')
      .select('*')

    if (clientData) {
      setClients(clientData)
      setStats({
        total: clientData.length,
        applied: clientData.filter(c => c.status === 'applied').length,
        trial_booked: clientData.filter(c => c.status === 'trial_booked').length,
        trial_completed: clientData.filter(c => c.status === 'trial_completed').length,
        active: clientData.filter(c => c.status === 'active').length,
        completed: clientData.filter(c => c.status === 'completed').length,
        inactive: clientData.filter(c => c.status === 'inactive').length,
      })
    }

    // 本日のセッションを取得
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

    const { data: todaySessionData } = await supabase
      .from('sessions')
      .select(`
        *,
        client:clients(*)
      `)
      .gte('scheduled_date', startOfDay)
      .lt('scheduled_date', endOfDay)
      .eq('status', 'scheduled')
      .order('scheduled_date', { ascending: true })

    if (todaySessionData) {
      setTodaySessions(todaySessionData as any)
    }

    // 今後7日以内のセッションを取得（本日を除く）
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const { data: sessionData } = await supabase
      .from('sessions')
      .select(`
        *,
        client:clients(*)
      `)
      .gte('scheduled_date', endOfDay)
      .lte('scheduled_date', sevenDaysFromNow.toISOString())
      .eq('status', 'scheduled')
      .order('scheduled_date', { ascending: true })
      .limit(10)

    if (sessionData) {
      setUpcomingSessions(sessionData as any)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">ダッシュボード</h2>
          
          {/* クライアント状況 */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                クライアント状況
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-gray-500">総数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.applied}</div>
                  <div className="text-sm text-gray-500">申込完了</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.trial_booked}</div>
                  <div className="text-sm text-gray-500">トライアル予約済</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.trial_completed}</div>
                  <div className="text-sm text-gray-500">トライアル完了</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                  <div className="text-sm text-gray-500">継続中</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
                  <div className="text-sm text-gray-500">完了</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
                  <div className="text-sm text-gray-500">非アクティブ</div>
                </div>
              </div>
            </div>
          </div>

          {/* 本日のセッション */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
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
                <p className="text-gray-500 text-sm">本日のセッションはありません。</p>
              )}
            </div>
          </div>

          {/* 今後7日以内のセッション */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
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
                <p className="text-gray-500 text-sm">今後7日以内に予定されているセッションはありません。</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}