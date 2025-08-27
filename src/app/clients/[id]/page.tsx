'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Client, Session, Payment, TrialPaymentTransaction, PaymentTransaction, ContinuationApplication } from '@/types'
import Navigation from '@/components/Navigation'
import Link from 'next/link'

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [realPayments, setRealPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchClientData(params.id as string)
    }
  }, [params.id])

  const fetchClientData = async (clientId: string) => {
    setLoading(true)

    // クライアント情報を取得
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (clientError) {
      console.error('Error fetching client:', clientError)
      alert('クライアント情報の取得に失敗しました。')
      router.push('/clients')
      return
    }

    setClient(clientData)

    // セッション履歴を取得（古いセッションから新しいセッションの順で表示）
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('*')
      .eq('client_id', clientId)
      .order('session_number', { ascending: true, nullsLast: true })
      .order('scheduled_date', { ascending: true })

    if (sessionData) {
      setSessions(sessionData)
    }

    // 支払い履歴を取得
    const { data: paymentData } = await supabase
      .from('payments')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (paymentData) {
      setPayments(paymentData)
    }

    // 実際の決済履歴を取得
    await fetchRealPayments(clientId)

    setLoading(false)
  }

  const fetchRealPayments = async (clientId: string) => {
    const allPayments: any[] = []

    // 従来のpaymentsテーブルから決済履歴を取得
    const { data: standardPayments } = await supabase
      .from('payments')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (standardPayments) {
      standardPayments.forEach(payment => {
        allPayments.push({
          id: payment.id,
          type: payment.type, // 'trial' or 'program'
          amount: payment.amount,
          status: payment.status,
          created_at: payment.created_at,
          payment_method: 'card',
          due_date: payment.due_date,
          paid_date: payment.paid_date,
        })
      })
    }

    // 銀行振込決済履歴を取得
    const { data: bankTransfers } = await supabase
      .from('bank_transfer_payments')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (bankTransfers) {
      bankTransfers.forEach(payment => {
        allPayments.push({
          id: payment.id,
          type: payment.payment_type, // 'trial' or 'continuation'
          amount: payment.amount,
          status: payment.status,
          created_at: payment.created_at,
          payment_method: 'bank_transfer',
          due_date: payment.due_date,
          confirmed_at: payment.confirmed_at,
        })
      })
    }

    // 作成日時でソート
    allPayments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    setRealPayments(allPayments)
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

  const getPaymentStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: '処理中',
      processing: '処理中',
      succeeded: '決済完了',
      failed: '失敗',
      cancelled: 'キャンセル',
      refunded: '返金済み',
      completed: '支払い済み',
      overdue: '期限超過',
    }
    return labels[status] || status
  }

  const getPaymentTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      trial: 'トライアル決済',
      continuation: '継続プログラム決済',
      program: 'プログラム料金',
    }
    return labels[type] || type
  }

  const getPaymentStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      succeeded: 'bg-green-100 text-green-800',
      processing: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      refunded: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
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

  if (!client) {
    return (
      <div className="min-h-screen bg-background-secondary">
        <Navigation />
        <main className="md:ml-64 p-6">
          <div className="text-center">
            <p className="text-lg text-gray-500">クライアントが見つかりません。</p>
            <Link href="/clients" className="text-primary hover:underline">
              クライアント一覧に戻る
            </Link>
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
              <h1 className="text-2xl font-semibold text-gray-900">{client.name}</h1>
              <p className="mt-2 text-sm text-gray-700">
                クライアント詳細情報
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3">
              <Link
                href={`/clients/${client.id}/edit`}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:w-auto"
              >
                編集
              </Link>
              <Link
                href="/clients"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:w-auto"
              >
                戻る
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* クライアント基本情報 */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">基本情報</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">ステータス</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                        {getStatusLabel(client.status)}
                      </span>
                    </dd>
                  </div>
                  {client.name_kana && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">氏名（カナ）</dt>
                      <dd className="mt-1 text-sm text-gray-900">{client.name_kana}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
                    <dd className="mt-1 text-sm text-gray-900">{client.email}</dd>
                  </div>
                  {client.gender && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">性別</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {client.gender === 'male' ? '男性' : client.gender === 'female' ? '女性' : 'その他'}
                      </dd>
                    </div>
                  )}
                  {client.birth_date && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">生年月日</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(client.birth_date).toLocaleDateString('ja-JP')}
                      </dd>
                    </div>
                  )}
                  {client.phone && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">電話番号</dt>
                      <dd className="mt-1 text-sm text-gray-900">{client.phone}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">住所</dt>
                    <dd className="mt-1 text-sm text-gray-900">{client.address || '未設定'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">希望セッション形式</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {client.preferred_session_format === 'online' ? 'オンライン' : '対面'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">登録日</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(client.created_at).toLocaleDateString('ja-JP')}
                    </dd>
                  </div>
                  {client.notes && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">備考</dt>
                      <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{client.notes}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>

          {/* セッション履歴と支払い履歴 */}
          <div className="lg:col-span-2 space-y-6">
            {/* セッション履歴 */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">セッション履歴</h3>
                {sessions.length > 0 ? (
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            日時
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            種別
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            回数
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ステータス
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sessions.map((session) => (
                          <tr key={session.id} className="hover:bg-gray-50 cursor-pointer">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <Link href={`/sessions/${session.id}`} className="text-primary hover:underline">
                                {new Date(session.scheduled_date).toLocaleString('ja-JP')}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <Link href={`/sessions/${session.id}`} className="text-primary hover:underline">
                                {session.type === 'trial' ? 'トライアル' : '通常セッション'}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {session.session_number ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                  {session.session_number}回目
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <Link href={`/sessions/${session.id}`} className="block">
                                {getSessionStatusLabel(session.status)}
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">セッション履歴がありません。</p>
                )}
              </div>
            </div>

            {/* 支払い履歴 */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">決済履歴</h3>
                {realPayments.length > 0 ? (
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            種別
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            金額
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            決済日時
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ステータス
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            決済方法
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {realPayments.map((payment) => (
                          <tr key={payment.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {getPaymentTypeLabel(payment.type)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ¥{payment.amount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(payment.created_at).toLocaleString('ja-JP')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(payment.status)}`}>
                                {getPaymentStatusLabel(payment.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {payment.payment_method === 'card' ? 'クレジットカード' : 
                               payment.payment_method === 'bank_transfer' ? '銀行振込' : 
                               payment.payment_method}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">決済履歴がありません。</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}