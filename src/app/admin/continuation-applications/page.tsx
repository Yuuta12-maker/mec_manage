'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ContinuationApplicationWithClient } from '@/types'
import Navigation from '@/components/Navigation'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import Link from 'next/link'

export default function ContinuationApplicationsPage() {
  const [applications, setApplications] = useState<ContinuationApplicationWithClient[]>([])
  const { isLoading, error, handleAsync, clearError } = useErrorHandler()
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    await handleAsync(async () => {
      const { data, error } = await supabase
        .from('continuation_applications')
        .select(`
          *,
          client:clients(*),
          trial_session:sessions(*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`継続申し込みの取得に失敗しました: ${error.message}`)
      }

      setApplications(data as ContinuationApplicationWithClient[] || [])
    }, '継続申し込み情報の取得に失敗しました')
  }

  const updateApplicationStatus = async (id: string, status: string, adminNotes?: string) => {
    await handleAsync(async () => {
      const { error } = await supabase
        .from('continuation_applications')
        .update({
          status,
          admin_notes: adminNotes,
          approved_at: status === 'approved' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        throw new Error(`ステータス更新に失敗しました: ${error.message}`)
      }

      await fetchApplications()
    }, 'ステータスの更新に失敗しました')
  }

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: '審査中',
      approved: '承認済み',
      rejected: '却下',
      cancelled: 'キャンセル',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getProgramTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      '6sessions': '6回コース',
      '12sessions': '12回コース',
      'custom': 'カスタムプラン',
    }
    return labels[type] || type
  }

  const filteredApplications = applications.filter(app => {
    if (statusFilter === 'all') return true
    return app.status === statusFilter
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 px-4">
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-600 dark:text-gray-300">継続申し込み情報を読み込み中...</span>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 px-4">
        {error && (
          <ErrorMessage 
            message={error} 
            onRetry={fetchApplications}
            onDismiss={clearError}
            className="mb-6"
          />
        )}

        <div className="mb-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">継続申し込み管理</h1>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                トライアルセッション後の継続プログラム申し込みを管理します。
              </p>
            </div>
          </div>
        </div>

        {/* フィルタ */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-48 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary"
            >
              <option value="all">すべてのステータス</option>
              <option value="pending">審査中</option>
              <option value="approved">承認済み</option>
              <option value="rejected">却下</option>
              <option value="cancelled">キャンセル</option>
            </select>
          </div>
        </div>

        {/* 申し込み一覧 */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md transition-colors">
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">継続申し込みがありません。</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredApplications.map((application) => (
                <li key={application.id}>
                  <div className="px-6 py-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                            {getStatusLabel(application.status)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {application.client.name}
                            </p>
                            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                              ({application.client.email})
                            </span>
                          </div>
                          <div className="mt-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {getProgramTypeLabel(application.program_type)} • 
                              申し込み日: {new Date(application.created_at).toLocaleDateString('ja-JP')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {application.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateApplicationStatus(application.id, 'approved')}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                            >
                              承認
                            </button>
                            <button
                              onClick={() => {
                                const notes = prompt('却下理由を入力してください:')
                                if (notes !== null) {
                                  updateApplicationStatus(application.id, 'rejected', notes)
                                }
                              }}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                            >
                              却下
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 詳細情報 */}
                    <div className="mt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">希望開始日:</span>
                          <span className="ml-2 text-gray-700 dark:text-gray-300">
                            {application.preferred_start_date 
                              ? new Date(application.preferred_start_date).toLocaleDateString('ja-JP')
                              : '未指定'
                            }
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">支払い方法:</span>
                          <span className="ml-2 text-gray-700 dark:text-gray-300">
                            {application.payment_method}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">ID:</span>
                          <span className="ml-2 text-gray-700 dark:text-gray-300 font-mono text-xs">
                            {application.id.substring(0, 8)}...
                          </span>
                        </div>
                      </div>

                      {application.goals && (
                        <div className="mt-3">
                          <span className="font-medium text-gray-900 dark:text-white">目標:</span>
                          <p className="mt-1 text-gray-700 dark:text-gray-300 text-sm">
                            {application.goals}
                          </p>
                        </div>
                      )}

                      {application.schedule_preference && (
                        <div className="mt-2">
                          <span className="font-medium text-gray-900 dark:text-white">希望スケジュール:</span>
                          <p className="mt-1 text-gray-700 dark:text-gray-300 text-sm">
                            {application.schedule_preference}
                          </p>
                        </div>
                      )}

                      {application.special_requests && (
                        <div className="mt-2">
                          <span className="font-medium text-gray-900 dark:text-white">特別な要望:</span>
                          <p className="mt-1 text-gray-700 dark:text-gray-300 text-sm">
                            {application.special_requests}
                          </p>
                        </div>
                      )}

                      {application.admin_notes && (
                        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                          <span className="font-medium text-yellow-800 dark:text-yellow-200">管理者メモ:</span>
                          <p className="mt-1 text-yellow-700 dark:text-yellow-300 text-sm">
                            {application.admin_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}