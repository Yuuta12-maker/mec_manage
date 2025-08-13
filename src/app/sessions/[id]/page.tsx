'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { SessionWithClient } from '@/types'
import Navigation from '@/components/Navigation'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import Link from 'next/link'

export default function SessionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  const [session, setSession] = useState<SessionWithClient | null>(null)
  const [editing, setEditing] = useState(false)
  const { isLoading, error, handleAsync, clearError } = useErrorHandler()
  const [formData, setFormData] = useState({
    notes: '',
    summary: '',
    meet_link: '',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled'
  })
  const [sendingEmail, setSendingEmail] = useState(false)
  const [showEmailPreview, setShowEmailPreview] = useState(false)
  const [emailPreview, setEmailPreview] = useState<{subject: string, content: string} | null>(null)
  const [emailHistory, setEmailHistory] = useState<any[]>([])
  const [loadingEmailHistory, setLoadingEmailHistory] = useState(false)
  const [hasNextSessionPromotionEmail, setHasNextSessionPromotionEmail] = useState(false)

  useEffect(() => {
    if (sessionId) {
      fetchSession()
      fetchEmailHistory()
    }
  }, [sessionId])

  const fetchSession = async () => {
    await handleAsync(async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('id', sessionId)
        .single()

      if (error) {
        throw new Error(`セッションの取得に失敗しました: ${error.message}`)
      }
      
      if (!data) {
        throw new Error('セッションが見つかりません')
      }

      setSession(data as SessionWithClient)
      setFormData({
        notes: data.notes || '',
        summary: data.summary || '',
        meet_link: data.meet_link || '',
        status: data.status
      })
    }, 'セッション情報の取得に失敗しました')
  }

  const fetchEmailHistory = async () => {
    setLoadingEmailHistory(true)
    try {
      console.log('=== Fetching email history ===')
      console.log('Session ID:', sessionId)
      
      // まず全てのメール履歴を取得してデバッグ
      const { data: allData, error: allError } = await supabase
        .from('email_history')
        .select('*')
        .order('created_at', { ascending: false })
      
      console.log('All email history:', allData)
      console.log('All email history error:', allError)

      const { data, error } = await supabase
        .from('email_history')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })

      console.log('Filtered email history query result:', { data, error })

      if (error) {
        console.error('メール送信履歴の取得に失敗:', error)
      } else {
        console.log('Email history data:', data)
        setEmailHistory(data || [])
        // 次回予約促進メールが送信済みかチェック
        const hasPromotionEmail = data?.some(email => 
          email.email_type === 'next_session_promotion' && email.status === 'sent'
        ) || false
        console.log('Has promotion email sent:', hasPromotionEmail)
        setHasNextSessionPromotionEmail(hasPromotionEmail)
      }
    } catch (error) {
      console.error('メール送信履歴取得エラー:', error)
    } finally {
      setLoadingEmailHistory(false)
    }
  }

  const handleSave = async () => {
    // キャンセル変更時の確認
    if (formData.status === 'cancelled' && session?.status !== 'cancelled') {
      const confirmed = window.confirm(
        '⚠️ セッションをキャンセルしますか？\n\n' +
        'この操作により：\n' +
        '• セッションが取り消されます\n' +
        '• クライアントへの連絡が必要になります\n' +
        '• この操作は慎重に行ってください\n\n' +
        '本当にキャンセルしますか？'
      )
      
      if (!confirmed) {
        return
      }
    }

    await handleAsync(async () => {
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
        throw new Error(`セッションの更新に失敗しました: ${error.message}`)
      }

      setEditing(false)
      await fetchSession()
    }, 'セッションの更新に失敗しました')
  }

  const handleCompleteSession = async () => {
    if (!session) return
    
    const confirmed = window.confirm(
      '✅ セッションを完了にしますか？\n\n' +
      'この操作により：\n' +
      '• セッションステータスが「完了」に変更されます\n' +
      '• 次回予約促進メール送信ボタンが表示されます\n' +
      '• メール履歴に記録されます\n\n' +
      'よろしいですか？'
    )
    
    if (!confirmed) return
    
    await handleAsync(async () => {
      const { error } = await supabase
        .from('sessions')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      if (error) {
        throw new Error(`セッションの完了処理に失敗しました: ${error.message}`)
      }

      // セッション情報とメール履歴を再取得
      await fetchSession()
      await fetchEmailHistory()
    }, 'セッションの完了処理に失敗しました')
  }

  const previewNextSessionEmail = async () => {
    if (!session) return

    try {
      const response = await fetch('/api/preview-next-session-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName: session.client.name,
          sessionType: session.type,
          sessionDate: session.scheduled_date,
          clientId: session.client_id,
          clientEmail: session.client.email,
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        setEmailPreview(result.preview)
        setShowEmailPreview(true)
      } else {
        console.error('メールプレビュー取得失敗:', result.error)
        alert(`メールプレビューの取得に失敗しました: ${result.error}`)
      }
    } catch (error) {
      console.error('メールプレビューエラー:', error)
      alert('メールプレビューの取得中にエラーが発生しました')
    }
  }

  const sendNextSessionPromotionEmail = async () => {
    if (!session) return

    setSendingEmail(true)
    try {
      const response = await fetch('/api/send-next-session-promotion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientEmail: session.client.email,
          clientName: session.client.name,
          sessionId: session.id,
          sessionType: session.type,
          sessionDate: session.scheduled_date,
          clientId: session.client_id,
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        alert('次回予約促進メールを送信しました！')
        setShowEmailPreview(false)
        // メール送信履歴を再取得してボタン状態を更新
        await fetchEmailHistory()
      } else {
        console.error('メール送信失敗:', result.error)
        alert(`メール送信に失敗しました: ${result.error}`)
      }
    } catch (error) {
      console.error('メール送信エラー:', error)
      alert('メール送信中にエラーが発生しました')
    } finally {
      setSendingEmail(false)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-secondary transition-colors">
        <Navigation />
        <main className="md:ml-64 p-6">
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-600 dark:text-gray-300">セッション情報を読み込み中...</span>
          </div>
        </main>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-background-secondary transition-colors">
        <Navigation />
        <main className="md:ml-64 p-6">
          {error && (
            <ErrorMessage 
              message={error} 
              onRetry={fetchSession}
              onDismiss={clearError}
              className="mb-6"
            />
          )}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">セッションが見つかりません</h2>
            <Link href="/sessions" className="mt-4 text-primary hover:underline">
              セッション一覧に戻る
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-secondary transition-colors">
      <Navigation />

      <main className="md:ml-64 p-6 max-w-4xl">
        {error && (
          <ErrorMessage 
            message={error} 
            onRetry={fetchSession}
            onDismiss={clearError}
            className="mb-6"
          />
        )}
        
        <div className="mb-6">
          <Link
            href="/sessions"
            className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            ← セッション一覧に戻る
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg transition-colors">
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
                
                {/* 予定状態の場合：完了ボタンを表示 */}
                {session.status === 'scheduled' && !editing && (
                  <button
                    onClick={handleCompleteSession}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    完了
                  </button>
                )}
                
                {/* 完了状態の場合：メール送信ボタンを表示 */}
                {session.status === 'completed' && !hasNextSessionPromotionEmail && (
                  <button
                    onClick={previewNextSessionEmail}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    次回予約促進メール送信
                  </button>
                )}
                {session.status === 'completed' && hasNextSessionPromotionEmail && (
                  <span className="inline-flex items-center px-3 py-2 text-sm text-green-700 bg-green-100 rounded-md">
                    ✓ 次回予約促進メール送信済み
                  </span>
                )}
                
                {/* 編集ボタン */}
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
                  {session.session_number && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {session.session_number}回目
                    </span>
                  )}
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
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
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
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
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
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
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

        {/* メール送信履歴セクション */}
        <div className="mt-6 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg transition-colors">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              メール送信履歴
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              このセッションに関連して送信されたメールの履歴
            </p>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700">
            {loadingEmailHistory ? (
              <div className="px-4 py-8 text-center">
                <div className="inline-flex items-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">読み込み中...</span>
                </div>
              </div>
            ) : emailHistory.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                メール送信履歴はありません
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        送信日時
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        メール種別
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        件名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        宛先
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        ステータス
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {emailHistory.map((email) => (
                      <tr key={email.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {email.sent_at ? 
                            new Date(email.sent_at).toLocaleString('ja-JP', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                            : '未送信'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {email.email_type === 'next_session_promotion' ? '次回予約促進' :
                             email.email_type === 'next_session_reminder' ? '次回予約リマインド' :
                             email.email_type === 'session_confirmation' ? 'セッション確認' :
                             email.email_type === 'booking' ? '予約確認' :
                             email.email_type === 'application' ? '申込み確認' :
                             email.email_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          <div className="max-w-xs truncate" title={email.subject}>
                            {email.subject}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {email.recipient_email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            email.status === 'sent' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            email.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            email.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {email.status === 'sent' ? '送信済み' :
                             email.status === 'failed' ? '送信失敗' :
                             email.status === 'pending' ? '送信待ち' :
                             email.status}
                          </span>
                          {email.error_message && (
                            <div className="mt-1 text-xs text-red-600 dark:text-red-400" title={email.error_message}>
                              エラー詳細を見る
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* メールプレビューモーダル */}
        {showEmailPreview && emailPreview && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    メール内容確認
                  </h3>
                  <button
                    onClick={() => setShowEmailPreview(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      宛先
                    </label>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {session.client.email} ({session.client.name}さん)
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      件名
                    </label>
                    <div className="text-sm text-gray-900 dark:text-white font-medium">
                      {emailPreview.subject}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      本文
                    </label>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded border text-sm text-gray-900 dark:text-white whitespace-pre-wrap font-mono">
                      {emailPreview.content}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowEmailPreview(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={sendNextSessionPromotionEmail}
                    disabled={sendingEmail}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {sendingEmail ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        送信中...
                      </>
                    ) : (
                      'メールを送信する'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}