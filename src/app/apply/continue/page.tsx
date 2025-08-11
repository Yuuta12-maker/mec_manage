'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Client, Session } from '@/types'
import { useAuth } from '@/hooks/useAuth'

export default function ContinueApplicationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const clientEmail = searchParams.get('email') || ''
  const trialSessionId = searchParams.get('session') || ''
  const isAdminAccess = !!user && !clientEmail // 管理者でメールパラメータがない場合
  
  const [client, setClient] = useState<Client | null>(null)
  const [trialSession, setTrialSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    program_type: '6sessions',
    preferred_start_date: '',
    payment_method: 'card',
  })
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  useEffect(() => {
    if (clientEmail) {
      fetchClientData()
    }
    if (trialSessionId) {
      fetchTrialSession()
    }
  }, [clientEmail, trialSessionId])

  const fetchClientData = async () => {
    if (!clientEmail) return

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('email', clientEmail)
      .single()

    if (error) {
      console.error('Error fetching client:', error)
    } else {
      setClient(data)
    }
  }

  const fetchTrialSession = async () => {
    if (!trialSessionId) return

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', trialSessionId)
      .single()

    if (error) {
      console.error('Error fetching trial session:', error)
    } else {
      setTrialSession(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isAdminAccess && !client) {
      alert('管理者モードではフォーム送信はできません。実際の申し込みは、メールリンクからアクセスしてください。')
      return
    }
    
    if (!client) {
      alert('クライアント情報が見つかりません。')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/apply/continue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          client_id: client.id,
          trial_session_id: trialSessionId || null,
        }),
      })

      const result = await response.json()

      if (result.success) {
        router.push('/apply/continue/success')
      } else {
        alert(`申し込みに失敗しました: ${result.error}`)
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert('申し込み中にエラーが発生しました。')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // 2週間後の日付をデフォルトに設定
  const getDefaultStartDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 14)
    return date.toISOString().split('T')[0]
  }

  // 管理者アクセスの場合は許可、そうでなければメールパラメータが必要
  if (!isAdminAccess && !clientEmail && !client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">アクセスエラー</h2>
          <p className="text-gray-600 mb-6">このページは直接アクセスできません。</p>
          <p className="text-gray-600">メールのリンクからアクセスしてください。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            継続プログラムお申し込み
          </h1>
          <p className="text-gray-600">
            マインドエンジニアリング・コーチング継続プログラムへのお申し込みフォームです。
          </p>
        </div>

        {client && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">申し込み者情報</h3>
            <p className="text-blue-800">
              {client.name}さん ({client.email})
            </p>
            {trialSession && (
              <p className="text-blue-700 text-sm mt-1">
                トライアルセッション完了: {new Date(trialSession.scheduled_date).toLocaleDateString('ja-JP')}
              </p>
            )}
          </div>
        )}

        {isAdminAccess && !client && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-yellow-900 mb-2">管理者モード</h3>
            <p className="text-yellow-800">
              管理画面からアクセスしています。実際の申し込みには、メールからのリンクが必要です。
            </p>
          </div>
        )}

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-8">
              <div className="space-y-6">
                <div>
                  <div className="block text-sm font-medium text-gray-700 mb-2">
                    プログラムタイプ
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-lg font-medium text-gray-900">6回コース</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      継続プログラムは全6回のセッションで構成されています。
                    </p>
                  </div>
                  <input type="hidden" name="program_type" value="6sessions" />
                </div>

                <div>
                  <label htmlFor="preferred_start_date" className="block text-sm font-medium text-gray-700 mb-2">
                    希望開始日
                  </label>
                  <input
                    type="date"
                    id="preferred_start_date"
                    name="preferred_start_date"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    value={formData.preferred_start_date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    トライアルから2週間後以降の日程をおすすめします。
                  </p>
                </div>

                <div>
                  <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-2">
                    希望支払い方法 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="payment_method"
                    name="payment_method"
                    required
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    value={formData.payment_method}
                    onChange={handleChange}
                  >
                    <option value="">選択してください</option>
                    <option value="bank_transfer">銀行振込（一括）</option>
                    <option value="installment_2">分割払い（2回）</option>
                    <option value="installment_3">分割払い（3回）</option>
                    <option value="credit_card">クレジットカード</option>
                  </select>
                </div>

              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <p>申し込み後、2営業日以内にご連絡いたします。</p>
                </div>
                <button
                  type="submit"
                  disabled={loading || (isAdminAccess && !client)}
                  className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(isAdminAccess && !client) ? '管理者モード（送信不可）' : 
                   loading ? '送信中...' : '継続プログラムに申し込む'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            ご質問がございましたら、お気軽に
            <a href="mailto:mindengineeringcoaching@gmail.com" className="text-primary hover:underline">
              こちら
            </a>
            までお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  )
}