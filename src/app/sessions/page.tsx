'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Session, Client } from '@/types'
import Navigation from '@/components/Navigation'
import Link from 'next/link'

type SessionWithClient = Session & { client: Client }

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        client:clients(*)
      `)
      .order('scheduled_date', { ascending: false })

    if (error) {
      console.error('Error fetching sessions:', error)
    } else {
      setSessions(data as SessionWithClient[] || [])
    }
    setLoading(false)
  }

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      scheduled: '予定',
      completed: '実施済み',
      cancelled: 'キャンセル',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
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

  const filteredSessions = sessions.filter(session => {
    const matchesType = typeFilter === 'all' || session.type === typeFilter
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter
    
    let matchesDate = true
    if (dateFilter === 'upcoming') {
      matchesDate = new Date(session.scheduled_date) >= new Date()
    } else if (dateFilter === 'past') {
      matchesDate = new Date(session.scheduled_date) < new Date()
    }

    return matchesType && matchesStatus && matchesDate
  })

  const updateSessionStatus = async (sessionId: string, newStatus: 'completed' | 'cancelled') => {
    const { error } = await supabase
      .from('sessions')
      .update({ status: newStatus })
      .eq('id', sessionId)

    if (error) {
      console.error('Error updating session:', error)
      alert('セッションステータスの更新に失敗しました。')
    } else {
      fetchSessions()
      alert('セッションステータスを更新しました。')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="mb-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900">セッション管理</h1>
              <p className="mt-2 text-sm text-gray-700">
                全セッションの予約と実施状況を管理します。
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <Link
                href="/sessions/new"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:w-auto"
              >
                新規予約
              </Link>
            </div>
          </div>

          {/* フィルター */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                セッション種別
              </label>
              <select
                id="type"
                name="type"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">すべて</option>
                <option value="trial">トライアル</option>
                <option value="regular">通常セッション</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                ステータス
              </label>
              <select
                id="status"
                name="status"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">すべて</option>
                <option value="scheduled">予定</option>
                <option value="completed">実施済み</option>
                <option value="cancelled">キャンセル</option>
              </select>
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                期間
              </label>
              <select
                id="date"
                name="date"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">すべて</option>
                <option value="upcoming">今後の予定</option>
                <option value="past">過去のセッション</option>
              </select>
            </div>
          </div>
        </div>

        {/* セッション一覧 */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredSessions.map((session) => (
              <li key={session.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {session.client.name[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {session.client.name}
                          </p>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {getTypeLabel(session.type)}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {new Date(session.scheduled_date).toLocaleString('ja-JP')}
                        </div>
                        {session.meet_link && (
                          <div className="mt-1">
                            <a
                              href={session.meet_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Google Meet リンク
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                        {getStatusLabel(session.status)}
                      </span>
                      {session.status === 'scheduled' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => updateSessionStatus(session.id, 'completed')}
                            className="text-green-600 hover:text-green-900 text-sm font-medium"
                          >
                            完了
                          </button>
                          <button
                            onClick={() => updateSessionStatus(session.id, 'cancelled')}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            キャンセル
                          </button>
                        </div>
                      )}
                      <Link
                        href={`/sessions/${session.id}`}
                        className="text-primary hover:text-primary/90 text-sm font-medium"
                      >
                        詳細
                      </Link>
                    </div>
                  </div>
                  {session.notes && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">{session.notes}</p>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {filteredSessions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">
                条件に合うセッションが見つかりません。
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}