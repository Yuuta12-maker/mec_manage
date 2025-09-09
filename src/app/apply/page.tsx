'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { sendApplicationEmailsWithGmail } from '@/lib/gmail'

export default function ApplyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    name_kana: '',
    email: '',
    gender: '',
    birth_date: '',
    phone: '',
    address: '',
    preferred_session_format: 'online',
    notes: '',
    payment_method: 'card',
  })
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const [birthYear, setBirthYear] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthDay, setBirthDay] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 必須項目のバリデーション
    if (!formData.name.trim()) {
      alert('お名前を入力してください。')
      setLoading(false)
      return
    }

    if (!formData.name_kana.trim()) {
      alert('お名前（カナ）を入力してください。')
      setLoading(false)
      return
    }

    if (!formData.email.trim()) {
      alert('メールアドレスを入力してください。')
      setLoading(false)
      return
    }

    if (!formData.phone.trim()) {
      alert('電話番号を入力してください。')
      setLoading(false)
      return
    }

    if (!formData.gender) {
      alert('性別を選択してください。')
      setLoading(false)
      return
    }

    if (!birthYear || !birthMonth || !birthDay) {
      alert('生年月日を入力してください。')
      setLoading(false)
      return
    }

    if (!formData.address.trim()) {
      alert('住所を入力してください。')
      setLoading(false)
      return
    }

    // メールアドレス形式のバリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      alert('正しいメールアドレスを入力してください。')
      setLoading(false)
      return
    }

    try {
      // メールアドレス重複チェック
      const { data: existingClient, error: checkError } = await supabase
        .from('clients')
        .select('email')
        .eq('email', formData.email.trim())
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking email:', checkError)
        alert('メールアドレスの確認中にエラーが発生しました。再度お試しください。')
        setLoading(false)
        return
      }

      if (existingClient) {
        alert('このメールアドレスは既に登録されています。別のメールアドレスをご使用ください。')
        setLoading(false)
        return
      }

      // 生年月日データの正規化と妥当性チェック
      let birthDate = null
      if (birthYear && birthMonth && birthDay) {
        const dateStr = `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`
        const dateObj = new Date(dateStr)
        
        // 日付の妥当性チェック
        if (dateObj.getFullYear() == parseInt(birthYear) && 
            (dateObj.getMonth() + 1) == parseInt(birthMonth) && 
            dateObj.getDate() == parseInt(birthDay)) {
          birthDate = dateStr
        } else {
          alert('生年月日が正しくありません。正しい日付を入力してください。')
          setLoading(false)
          return
        }
      }

      // 申し込みデータをAPIに送信
      const response = await fetch('/api/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          birth_date: birthDate,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // カード決済の場合はStripe Checkoutに進む
        if (formData.payment_method === 'card' && result.requiresPayment) {
          await handleStripePayment(result.clientId)
        } else {
          // 銀行振込の場合は成功ページに直接遷移
          router.push('/apply/success')
        }
      } else {
        alert(`申し込みに失敗しました: ${result.error}`)
      }
    } catch (err) {
      console.error('Error:', err)
      alert('ネットワークエラーが発生しました。インターネット接続をご確認の上、再度お試しください。')
      setLoading(false)
    }
  }

  const handleStripePayment = async (clientId: string) => {
    try {
      setIsProcessingPayment(true)
      setPaymentError(null)
      
      console.log('🔄 Initiating Stripe payment for client:', clientId)
      
      const response = await fetch('/api/stripe/create-trial-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          clientId: clientId,
        }),
      })

      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Response not OK:', response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText || 'Network error'}`)
      }
      
      const data = await response.json()
      console.log('✅ Payment session data:', data)

      if (data.error) {
        throw new Error(data.error)
      }
      
      if (!data.url) {
        throw new Error('決済URLが取得できませんでした。')
      }

      console.log('🔗 Redirecting to Stripe checkout:', data.url)
      // Stripe Checkoutページにリダイレクト
      window.location.href = data.url
    } catch (error) {
      console.error('💥 Payment error:', error)
      let errorMessage = '決済処理中にエラーが発生しました。'
      
      if (error instanceof Error) {
        if (error.message.includes('HTTP 406')) {
          errorMessage = 'リクエスト形式エラーが発生しました。ページを再読み込みして再試行してください。'
        } else if (error.message.includes('HTTP 500')) {
          errorMessage = 'サーバーエラーが発生しました。しばらく時間をおいて再試行してください。'
        } else if (error.message.includes('timeout')) {
          errorMessage = 'タイムアウトしました。しばらく時間をおいて再試行してください。'
        } else {
          errorMessage = error.message
        }
      }
      
      setPaymentError(errorMessage)
      setIsProcessingPayment(false)
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* ヘッダー */}
      <header className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-700/50 transition-colors">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center transition-colors">
            マインドエンジニアリング・コーチング
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300 text-center transition-colors">
            プログラム申し込みフォーム
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4">
        {/* プログラム概要 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-700/50 p-6 mb-8 transition-colors">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">プログラム概要</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">期間・回数</h3>
              <p className="text-gray-600">6ヶ月間、月1回×6回（各30分程度）</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">料金</h3>
              <div className="text-gray-600">
                <p>トライアル料金: ¥6,000（税込）</p>
                <p>継続プログラム料金: ¥214,000（税込）</p>
                <p className="font-medium">総額: ¥220,000（税込）</p>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">セッション形式</h3>
              <p className="text-gray-600">オンライン または 対面</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">コーチ</h3>
              <p className="text-gray-600">森山雄太</p>
            </div>
          </div>
        </div>

        {/* 申し込みフォーム */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-700/50 transition-colors">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">申し込み情報</h2>
            <p className="mt-1 text-sm text-gray-600">
              以下の情報をご入力ください。<span className="text-red-500">*</span>は必須項目です。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6">
            <div className="space-y-8">
              {/* 基本情報 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">基本情報</h3>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      お名前 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="name_kana" className="block text-sm font-medium text-gray-700">
                      お名前（カナ） <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name_kana"
                      id="name_kana"
                      required
                      placeholder="ヤマダタロウ"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.name_kana}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      メールアドレス <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      placeholder="example@email.com"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      電話番号 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      required
                      placeholder="090-1234-5678"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                      性別 <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="">選択してください</option>
                      <option value="male">男性</option>
                      <option value="female">女性</option>
                      <option value="other">その他</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      生年月日 <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        name="birth_year"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      住所 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      id="address"
                      required
                      placeholder="東京都渋谷区..."
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* セッション希望 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">セッション希望</h3>
                <div>
                  <label htmlFor="preferred_session_format" className="block text-sm font-medium text-gray-700">
                    希望セッション形式 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="preferred_session_format"
                    name="preferred_session_format"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={formData.preferred_session_format}
                    onChange={handleChange}
                  >
                    <option value="online">オンライン（Google Meet）</option>
                    <option value="face-to-face">対面</option>
                  </select>
                </div>
              </div>

              {/* 支払い方法 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">お支払い方法</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <input
                      id="payment_card"
                      name="payment_method"
                      type="radio"
                      value="card"
                      checked={formData.payment_method === 'card'}
                      onChange={handleChange}
                      className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="payment_card" className="ml-3 block">
                      <span className="text-sm font-medium text-gray-700">
                        クレジットカード決済 🚀
                      </span>
                      <span className="block text-xs text-gray-500 mt-1">
                        即座に決済が完了し、すぐにトライアルセッションの予約が可能になります
                      </span>
                      <span className="block text-sm font-medium text-green-600 mt-1">
                        金額: ¥6,000（税込）
                      </span>
                    </label>
                  </div>
                  <div className="flex items-start">
                    <input
                      id="payment_bank"
                      name="payment_method"
                      type="radio"
                      value="bank_transfer"
                      checked={formData.payment_method === 'bank_transfer'}
                      onChange={handleChange}
                      className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="payment_bank" className="ml-3 block">
                      <span className="text-sm font-medium text-gray-700">
                        銀行振込
                      </span>
                      <span className="block text-xs text-gray-500 mt-1">
                        振込確認後にトライアルセッションの予約が可能になります
                      </span>
                    </label>
                  </div>
                </div>
                
                {formData.payment_method === 'card' && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-md">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="text-sm font-medium text-blue-900">安全な決済システム</span>
                    </div>
                    <p className="text-sm text-blue-800 mt-1">
                      決済はStripeの安全なシステムで処理されます。<br/>
                      カード情報は当サイトに保存されません。
                    </p>
                  </div>
                )}
              </div>

              {/* その他・備考 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">その他</h3>
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    備考・ご質問
                  </label>
                  <textarea
                    name="notes"
                    id="notes"
                    rows={4}
                    placeholder="その他お聞かせいただきたいことやご質問があればご記入ください。"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* 同意事項 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">お申し込みにあたって</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• 申し込み後、担当者よりご連絡させていただきます。</p>
                  <p>• トライアルセッション実施後、継続についてご相談させていただきます。</p>
                  <p>• お預かりした個人情報は、本プログラムの運営目的のみに使用いたします。</p>
                </div>
              </div>

              {paymentError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-red-800">{paymentError}</span>
                  </div>
                </div>
              )}

              {/* 送信ボタン */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={loading || isProcessingPayment}
                  className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingPayment ? '決済画面に移動中...' : 
                   loading ? '送信中...' : 
                   formData.payment_method === 'card' ? '決済に進む' : '申し込みを送信'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-center text-sm text-gray-500">
            マインドエンジニアリング・コーチング管理システム
          </p>
        </div>
      </footer>
    </div>
  )
}