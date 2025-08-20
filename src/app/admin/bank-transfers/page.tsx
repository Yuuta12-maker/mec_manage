'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import Link from 'next/link'

interface BankTransferPayment {
  id: string
  continuation_application_id: string
  client_id: string
  payment_type: string
  amount: number
  due_date: string
  transfer_deadline: string
  status: string
  confirmed_at: string | null
  confirmation_notes: string | null
  transfer_reported_at: string | null
  reported_amount: number | null
  reported_transfer_date: string | null
  customer_notes: string | null
  bank_info_email_sent: boolean
  confirmation_email_sent: boolean
  created_at: string
  updated_at: string
  clients: {
    name: string
    email: string
    phone: string | null
  } | null
  continuation_applications: {
    program_type: string
    preferred_start_date: string | null
  } | null
}

export default function BankTransfersPage() {
  const [transfers, setTransfers] = useState<BankTransferPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [processingTransfer, setProcessingTransfer] = useState<string | null>(null)
  const [confirmationNotes, setConfirmationNotes] = useState<{[key: string]: string}>({})
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    fetchTransfers()
  }, [])

  const fetchTransfers = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('bank_transfer_payments')
        .select(`
          *,
          clients (name, email, phone),
          continuation_applications (program_type, preferred_start_date)
        `)
        .order('created_at', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching bank transfers:', error)
        alert('振込情報の取得に失敗しました')
      } else {
        setTransfers(data || [])
      }
    } catch (error) {
      console.error('Fetch error:', error)
      alert('振込情報の取得中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const confirmPayment = async (transferId: string) => {
    setProcessingTransfer(transferId)
    try {
      const notes = confirmationNotes[transferId] || ''
      
      const { error } = await supabase
        .from('bank_transfer_payments')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmation_notes: notes,
          confirmation_email_sent: false, // メール送信フラグをリセット
          updated_at: new Date().toISOString()
        })
        .eq('id', transferId)

      if (error) {
        console.error('Error confirming payment:', error)
        alert('入金確認処理に失敗しました')
      } else {
        alert('入金確認が完了しました')
        await fetchTransfers()
        setConfirmationNotes(prev => ({...prev, [transferId]: ''}))
      }
    } catch (error) {
      console.error('Confirm payment error:', error)
      alert('入金確認処理中にエラーが発生しました')
    } finally {
      setProcessingTransfer(null)
    }
  }

  const cancelPayment = async (transferId: string) => {
    if (!confirm('本当にキャンセルしますか？この操作は元に戻せません。')) {
      return
    }

    setProcessingTransfer(transferId)
    try {
      const { error } = await supabase
        .from('bank_transfer_payments')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', transferId)

      if (error) {
        console.error('Error cancelling payment:', error)
        alert('キャンセル処理に失敗しました')
      } else {
        alert('キャンセルが完了しました')
        await fetchTransfers()
      }
    } catch (error) {
      console.error('Cancel payment error:', error)
      alert('キャンセル処理中にエラーが発生しました')
    } finally {
      setProcessingTransfer(null)
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: '入金待ち',
      confirmed: '入金確認済み',
      expired: '期限切れ',
      cancelled: 'キャンセル',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary">
        <Navigation />
        <main className="md:ml-64 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900">振込確認管理</h1>
              <p className="mt-2 text-sm text-gray-700">
                銀行振込での決済状況を管理します。
              </p>
            </div>
          </div>
        </div>

        {/* フィルター */}
        <div className="mb-6 bg-white shadow sm:rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
              ステータス:
            </label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                // フィルター変更時に自動で再取得
                setTimeout(() => fetchTransfers(), 100)
              }}
              className="block rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="all">すべて</option>
              <option value="pending">入金待ち</option>
              <option value="confirmed">入金確認済み</option>
              <option value="expired">期限切れ</option>
              <option value="cancelled">キャンセル</option>
            </select>
            <button
              onClick={fetchTransfers}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary/90"
            >
              更新
            </button>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-sm">待</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">入金待ち</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {transfers.filter(t => t.status === 'pending').length}件
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-sm">完</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">確認済み</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {transfers.filter(t => t.status === 'confirmed').length}件
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-sm">期</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">期限切れ</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {transfers.filter(t => isOverdue(t.due_date) && t.status === 'pending').length}件
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-sm">総</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">総売上</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ¥{transfers.filter(t => t.status === 'confirmed').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 振込一覧 */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">振込一覧</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {transfers.length}件の振込情報があります
            </p>
          </div>
          
          {transfers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">振込情報がありません</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {transfers.map((transfer) => (
                <li key={transfer.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transfer.status)}`}>
                          {getStatusLabel(transfer.status)}
                        </span>
                        {isOverdue(transfer.due_date) && transfer.status === 'pending' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            期限超過
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{transfer.clients?.name}</h4>
                          <p className="text-sm text-gray-500">{transfer.clients?.email}</p>
                          {transfer.clients?.phone && (
                            <p className="text-sm text-gray-500">{transfer.clients.phone}</p>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">振込金額</p>
                          <p className="text-lg font-bold text-gray-900">¥{transfer.amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">
                            期限: {new Date(transfer.due_date).toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">申込日時</p>
                          <p className="text-sm text-gray-900">{new Date(transfer.created_at).toLocaleString('ja-JP')}</p>
                          {transfer.confirmed_at && (
                            <>
                              <p className="text-sm text-gray-500">確認日時</p>
                              <p className="text-sm text-gray-900">{new Date(transfer.confirmed_at).toLocaleString('ja-JP')}</p>
                            </>
                          )}
                        </div>
                      </div>

                      {transfer.confirmation_notes && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">確認メモ</p>
                          <p className="text-sm text-gray-900">{transfer.confirmation_notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      {transfer.status === 'pending' && (
                        <>
                          <div className="mb-2">
                            <textarea
                              placeholder="確認メモ（任意）"
                              className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                              rows={2}
                              value={confirmationNotes[transfer.id] || ''}
                              onChange={(e) => setConfirmationNotes(prev => ({
                                ...prev,
                                [transfer.id]: e.target.value
                              }))}
                            />
                          </div>
                          <button
                            onClick={() => confirmPayment(transfer.id)}
                            disabled={processingTransfer === transfer.id}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingTransfer === transfer.id ? '処理中...' : '入金確認'}
                          </button>
                          <button
                            onClick={() => cancelPayment(transfer.id)}
                            disabled={processingTransfer === transfer.id}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            キャンセル
                          </button>
                        </>
                      )}
                      
                      <Link
                        href={`/clients/${transfer.client_id}`}
                        className="inline-flex items-center px-3 py-2 border border-primary text-sm leading-4 font-medium rounded-md text-primary bg-white hover:bg-primary hover:text-white"
                      >
                        クライアント詳細
                      </Link>
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