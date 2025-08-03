'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Session, Client } from '@/types'
import Navigation from '@/components/Navigation'
import Link from 'next/link'

type SessionWithClient = Session & { client: Client }

export default function SessionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  const [session, setSession] = useState<SessionWithClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    notes: '',
    summary: '',
    meet_link: '',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled'
  })

  useEffect(() => {
    if (sessionId) {
      fetchSession()
    }
  }, [sessionId])

  const fetchSession = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('id', sessionId)
      .single()

    if (error) {
      console.error('Error fetching session:', error)
      router.push('/sessions')
    } else {
      setSession(data as SessionWithClient)
      setFormData({
        notes: data.notes || '',
        summary: data.summary || '',
        meet_link: data.meet_link || '',
        status: data.status
      })
    }
    setLoading(false)
  }

  const handleSave = async () => {
    const { error } = await supabase
      .from('sessions')
      .update({
        notes: formData.notes,
        summary: formData.summary,
        meet_link: formData.meet_link,
        status: formData.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) {
      console.error('Error updating session:', error)
      alert('セッションの更新に失敗しました。')
    } else {
      setEditing(false)
      fetchSession()
      alert('セッションを更新しました。')
    }
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

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">セッションが見つかりません</h2>
            <Link href="/sessions" className="mt-4 text-primary hover:underline">
              セッション一覧に戻る
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-4xl mx-auto py-6 px-4">
        <div className="mb-6">
          <Link
            href="/sessions"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            ← セッション一覧に戻る
          </Link>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  セッション詳細
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {session.client.name}さんとのセッション情報
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                  {getStatusLabel(session.status)}
                </span>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                  >
                    編集
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false)
                        setFormData({
                          notes: session.notes || '',
                          summary: session.summary || '',
                          meet_link: session.meet_link || '',
                          status: session.status
                        })
                      }}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">クライアント</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <Link
                    href={`/clients/${session.client.id}`}
                    className="text-primary hover:underline"
                  >
                    {session.client.name}
                  </Link>
                  {session.client.name_kana && (
                    <span className="ml-2 text-gray-500">（{session.client.name_kana}）</span>
                  )}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">セッション種別</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {getTypeLabel(session.type)}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">予定日時</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(session.scheduled_date).toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">ステータス</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {editing ? (
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    >
                      <option value="scheduled">予定</option>
                      <option value="completed">実施済み</option>
                      <option value="cancelled">キャンセル</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                      {getStatusLabel(session.status)}
                    </span>
                  )}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Google Meet リンク</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {editing ? (
                    <input
                      type="url"
                      value={formData.meet_link}
                      onChange={(e) => setFormData({ ...formData, meet_link: e.target.value })}
                      placeholder="https://meet.google.com/..."
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  ) : session.meet_link ? (
                    <a
                      href={session.meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Google Meet に参加
                    </a>
                  ) : (
                    <span className="text-gray-500">未設定</span>
                  )}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">コーチ</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {session.coach_name || '未設定'}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">メモ</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {editing ? (
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="セッションに関するメモ..."
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  ) : session.notes ? (
                    <p className="whitespace-pre-wrap">{session.notes}</p>
                  ) : (
                    <span className="text-gray-500">メモはありません</span>
                  )}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">セッション要約</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {editing ? (
                    <textarea
                      rows={4}
                      value={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      placeholder="セッションの内容や成果をまとめてください..."
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  ) : session.summary ? (
                    <p className="whitespace-pre-wrap">{session.summary}</p>
                  ) : (
                    <span className="text-gray-500">要約はありません</span>
                  )}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">作成日時</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(session.created_at).toLocaleString('ja-JP')}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">更新日時</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(session.updated_at).toLocaleString('ja-JP')}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </main>
    </div>
  )
}