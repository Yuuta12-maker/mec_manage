'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Payment, Client } from '@/types'
import Navigation from '@/components/Navigation'
import Link from 'next/link'

type PaymentWithClient = Payment & { client: Client }

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        client:clients(*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching payments:', error)
    } else {
      setPayments(data as PaymentWithClient[] || [])
    }
    setLoading(false)
  }

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: '未払い',
      completed: '支払い済み',
      overdue: '期限超過',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getTypeLabel = (type: string) => {
    return type === 'trial' ? 'トライアル料金' : 'プログラム料金'
  }

  const filteredPayments = payments.filter(payment => {
    const matchesType = typeFilter === 'all' || payment.type === typeFilter
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    return matchesType && matchesStatus
  })

  const updatePaymentStatus = async (paymentId: string, newStatus: 'completed' | 'overdue') => {
    const updateData: any = { status: newStatus }
    if (newStatus === 'completed') {
      updateData.paid_date = new Date().toISOString().split('T')[0]
    }

    const { error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)

    if (error) {
      console.error('Error updating payment:', error)
      alert('支払いステータスの更新に失敗しました。')
    } else {
      fetchPayments()
      alert('支払いステータスを更新しました。')
    }
  }

  const getTotalAmount = (status?: string) => {
    const targetPayments = status 
      ? filteredPayments.filter(p => p.status === status)
      : filteredPayments
    return targetPayments.reduce((sum, payment) => sum + payment.amount, 0)
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
              <h1 className="text-2xl font-semibold text-gray-900">支払い管理</h1>
              <p className="mt-2 text-sm text-gray-700">
                全支払いの状況を管理します。
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <Link
                href="/payments/new"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:w-auto"
              >
                新規作成
              </Link>
            </div>
          </div>

          {/* 統計情報 */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">全</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">総売上</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        ¥{getTotalAmount().toLocaleString()}
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
                      <span className="text-white text-sm font-medium">済</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">支払い済み</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        ¥{getTotalAmount('completed').toLocaleString()}
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
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">未</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">未払い</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        ¥{getTotalAmount('pending').toLocaleString()}
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
                      <span className="text-white text-sm font-medium">超</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">期限超過</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        ¥{getTotalAmount('overdue').toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* フィルター */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                支払い種別
              </label>
              <select
                id="type"
                name="type"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">すべて</option>
                <option value="trial">トライアル料金</option>
                <option value="program">プログラム料金</option>
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
                <option value="pending">未払い</option>
                <option value="completed">支払い済み</option>
                <option value="overdue">期限超過</option>
              </select>
            </div>
          </div>
        </div>

        {/* 支払い一覧 */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredPayments.map((payment) => (
              <li key={payment.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {payment.client.name[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {payment.client.name}
                          </p>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {getTypeLabel(payment.type)}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          金額: ¥{payment.amount.toLocaleString()} | 
                          期限: {new Date(payment.due_date).toLocaleDateString('ja-JP')}
                          {payment.paid_date && (
                            <> | 支払い日: {new Date(payment.paid_date).toLocaleDateString('ja-JP')}</>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {getStatusLabel(payment.status)}
                      </span>
                      {payment.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => updatePaymentStatus(payment.id, 'completed')}
                            className="text-green-600 hover:text-green-900 text-sm font-medium"
                          >
                            支払い完了
                          </button>
                          {new Date(payment.due_date) < new Date() && (
                            <button
                              onClick={() => updatePaymentStatus(payment.id, 'overdue')}
                              className="text-red-600 hover:text-red-900 text-sm font-medium"
                            >
                              期限超過
                            </button>
                          )}
                        </div>
                      )}
                      <Link
                        href={`/payments/${payment.id}`}
                        className="text-primary hover:text-primary/90 text-sm font-medium"
                      >
                        詳細
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">
                条件に合う支払い情報が見つかりません。
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}