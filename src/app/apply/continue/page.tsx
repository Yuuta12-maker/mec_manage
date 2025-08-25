'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Client, Session } from '@/types'

export default function ContinueApplicationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientEmail = searchParams.get('email') || ''
  const trialSessionId = searchParams.get('session') || ''
  const applicationId = searchParams.get('application_id') || ''
  
  const [client, setClient] = useState<Client | null>(null)
  const [trialSession, setTrialSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    program_type: '6sessions',
    payment_method: '',
  })
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  // クライアント照合用の状態
  const [showClientVerification, setShowClientVerification] = useState(false)
  const [verificationData, setVerificationData] = useState({
    name: '',
    name_kana: '',
    email: '',
    phone: '',
  })
  const [birthYear, setBirthYear] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthDay, setBirthDay] = useState('')
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  useEffect(() => {
    if (applicationId) {
      fetchExistingApplication()
    } else if (clientEmail) {
      fetchClientData()
      if (trialSessionId) {
        fetchTrialSession()
      }
    } else {
      // URLパラメータがない場合、クライアント照合フォームを表示
      setShowClientVerification(true)
    }
  }, [clientEmail, trialSessionId, applicationId])

  const fetchExistingApplication = async () => {
    if (!applicationId) return

    const { data, error } = await supabase
      .from('continuation_applications')
      .select(`
        *,
        clients (*),
        trial_session:sessions(*)
      `)
      .eq('id', applicationId)
      .single()

    if (error) {
      console.error('Error fetching existing application:', error)
    } else {
      setClient(data.clients)
      if (data.trial_session) {
        setTrialSession(data.trial_session)
      }
      setFormData({
        program_type: data.program_type || '6sessions',
        payment_method: data.payment_method || '',
      })
    }
  }

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

  const handleClientVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setVerificationLoading(true)
    setVerificationError(null)

    // バリデーション
    if (!verificationData.name.trim()) {
      setVerificationError('お名前を入力してください。')
      setVerificationLoading(false)
      return
    }

    if (!verificationData.name_kana.trim()) {
      setVerificationError('お名前（カナ）を入力してください。')
      setVerificationLoading(false)
      return
    }

    if (!verificationData.email.trim()) {
      setVerificationError('メールアドレスを入力してください。')
      setVerificationLoading(false)
      return
    }

    if (!verificationData.phone.trim()) {
      setVerificationError('電話番号を入力してください。')
      setVerificationLoading(false)
      return
    }

    if (!birthYear || !birthMonth || !birthDay) {
      setVerificationError('生年月日を入力してください。')
      setVerificationLoading(false)
      return
    }

    // 生年月日の組み立て
    const birthDate = `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`

    try {
      const response = await fetch('/api/verify-client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...verificationData,
          birth_date: birthDate,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // 照合成功
        setClient(result.client)
        setShowClientVerification(false)
        
        // トライアルセッション情報があれば取得
        if (result.client.trial_session_id) {
          const { data: sessionData } = await supabase
            .from('sessions')
            .select('*')
            .eq('id', result.client.trial_session_id)
            .single()
          
          if (sessionData) {
            setTrialSession(sessionData)
          }
        }
      } else {
        setVerificationError(result.error || 'クライアント情報が見つかりませんでした。入力内容をご確認ください。')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setVerificationError('照合中にエラーが発生しました。しばらく時間をおいてからお試しください。')
    } finally {
      setVerificationLoading(false)
    }
  }

  const handleVerificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setVerificationData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!client) {
      alert('クライアント情報が見つかりません。')
      return
    }

    if (!formData.payment_method) {
      alert('支払い方法を選択してください。')
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
          application_id: applicationId || null,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // 決済が必要な場合（クレジットカード選択時）は決済フローに進む
        if (formData.payment_method === 'credit_card') {
          const targetApplicationId = applicationId || result.data.applicationId
          await handlePayment(targetApplicationId)
        } else {
          router.push('/apply/continue/success')
        }
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

  const handlePayment = async (applicationId: string) => {
    setIsProcessingPayment(true)
    setPaymentError(null)

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          continuationApplicationId: applicationId,
        }),
      })

      const result = await response.json()

      if (result.error) {
        setPaymentError(result.error)
        return
      }

      // Stripe Checkoutページへリダイレクト
      window.location.href = result.url
    } catch (error) {
      console.error('Payment error:', error)
      setPaymentError('決済処理中にエラーが発生しました。')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // クライアント照合フォームを表示
  if (showClientVerification) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              クライアント情報の確認
            </h1>
            <p className="text-gray-600">
              継続プログラムお申し込みのため、トライアル時にご登録いただいた情報をご入力ください。
            </p>
          </div>

          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <form onSubmit={handleClientVerification}>
              <div className="px-6 py-8">
                {verificationError && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-red-800">{verificationError}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      お名前（漢字） <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      placeholder="山田太郎"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      value={verificationData.name}
                      onChange={handleVerificationChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="name_kana" className="block text-sm font-medium text-gray-700 mb-2">
                      お名前（カナ） <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name_kana"
                      id="name_kana"
                      required
                      placeholder="ヤマダタロウ"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      value={verificationData.name_kana}
                      onChange={handleVerificationChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      メールアドレス <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      placeholder="example@email.com"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      value={verificationData.email}
                      onChange={handleVerificationChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      電話番号 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      required
                      placeholder="090-0000-0000"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      value={verificationData.phone}
                      onChange={handleVerificationChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      生年月日 <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        name="birth_year"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        value={birthYear}
                        onChange={(e) => setBirthYear(e.target.value)}
                      >
                        <option value="">年</option>
                        {Array.from({ length: 100 }, (_, i) => {
                          const year = new Date().getFullYear() - i
                          return (
                            <option key={year} value={year}>
                              {year}年
                            </option>
                          )
                        })}
                      </select>
                      <select
                        name="birth_month"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        value={birthMonth}
                        onChange={(e) => setBirthMonth(e.target.value)}
                      >
                        <option value="">月</option>
                        {Array.from({ length: 12 }, (_, i) => {
                          const month = i + 1
                          return (
                            <option key={month} value={month}>
                              {month}月
                            </option>
                          )
                        })}
                      </select>
                      <select
                        name="birth_day"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        value={birthDay}
                        onChange={(e) => setBirthDay(e.target.value)}
                      >
                        <option value="">日</option>
                        {Array.from({ length: 31 }, (_, i) => {
                          const day = i + 1
                          return (
                            <option key={day} value={day}>
                              {day}日
                            </option>
                          )
                        })}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <p>入力いただいた情報でトライアル申込み時の情報と照合いたします。</p>
                  </div>
                  <button
                    type="submit"
                    disabled={verificationLoading}
                    className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verificationLoading ? '確認中...' : '情報を確認する'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              ご質問がございましたら、
              <a href="mailto:mindengineeringcoaching@gmail.com" className="text-primary hover:underline ml-1">
                こちら
              </a>
              までお問い合わせください。
            </p>
          </div>
        </div>
      </div>
    )
  }

  // クライアント照合が必要ない場合は、通常通りフォームを表示

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            継続プログラムお申し込み
          </h1>
          <p className="text-gray-600 mb-4">
            マインドエンジニアリング・コーチング継続プログラムへのお申し込みフォームです。
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">セッション予約について</h4>
                <p className="text-blue-800 text-sm">
                  個別のセッション予約は、お申し込み完了後に別途「セッション予約フォーム」からご予約いただきます。
                </p>
              </div>
            </div>
          </div>
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
                  <div className="block text-sm font-medium text-gray-700 mb-2">
                    希望支払い方法 <span className="text-red-500">*</span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-blue-900 mb-2">継続プログラム料金</h4>
                      <p className="text-2xl font-bold text-blue-800">¥214,000 <span className="text-sm font-normal text-blue-600">（税込）</span></p>
                      <p className="text-sm text-blue-700 mt-1">6ヶ月間・月1回×6回セッション（各30分程度）</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <input
                          type="radio"
                          id="credit_card"
                          name="payment_method"
                          value="credit_card"
                          checked={formData.payment_method === 'credit_card'}
                          onChange={handleChange}
                          className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <div className="ml-3 flex-1">
                          <label htmlFor="credit_card" className="text-sm font-medium text-gray-900 cursor-pointer">
                            クレジットカード（即時決済）
                          </label>
                          <p className="text-sm text-gray-600">
                            Stripe決済を使用してすぐにお支払いが完了します
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <input
                          type="radio"
                          id="bank_transfer"
                          name="payment_method"
                          value="bank_transfer"
                          checked={formData.payment_method === 'bank_transfer'}
                          onChange={handleChange}
                          className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <div className="ml-3 flex-1">
                          <label htmlFor="bank_transfer" className="text-sm font-medium text-gray-900 cursor-pointer">
                            銀行振込（一括払い）
                          </label>
                          <p className="text-sm text-gray-600">
                            お申し込み後、振込先をメールでご案内いたします
                          </p>
                        </div>
                      </div>

                    </div>
                    
                  </div>
                </div>

              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4">
              {paymentError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <svg className="h-4 w-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-red-800">{paymentError}</span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {formData.payment_method === 'credit_card' ? (
                    <p>クレジットカード決済で即座にお申し込み完了します。</p>
                  ) : (
                    <p>申し込み後、2営業日以内にご連絡いたします。</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading || isProcessingPayment}
                  className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '申し込み処理中...' : 
                   isProcessingPayment ? '決済ページへ移動中...' :
                   formData.payment_method === 'credit_card' ? '決済に進む' : '継続プログラムに申し込む'}
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