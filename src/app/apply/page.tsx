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
  })

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

    if (!formData.email.trim()) {
      alert('メールアドレスを入力してください。')
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

      const { data, error } = await supabase
        .from('clients')
        .insert([{
          name: formData.name.trim(),
          name_kana: formData.name_kana.trim() || null,
          email: formData.email.trim(),
          gender: formData.gender || null,
          birth_date: birthDate,
          phone: formData.phone.trim() || null,
          address: formData.address.trim() || null,
          preferred_session_format: formData.preferred_session_format,
          status: 'applied',
          notes: formData.notes.trim() || null,
        }])
        .select()

      if (error) {
        console.error('Error creating application:', error)
        
        // エラーの詳細に応じたメッセージ
        if (error.code === '23505') {
          alert('このメールアドレスは既に登録されています。別のメールアドレスをご使用ください。')
        } else if (error.code === '23502') {
          alert('必須項目が入力されていません。すべての必須項目を入力してください。')
        } else if (error.code === '22001') {
          alert('入力内容が長すぎます。文字数を減らしてください。')
        } else {
          alert('申し込みの送信に失敗しました。入力内容をご確認の上、再度お試しください。')
        }
        setLoading(false)
        return
      }

      if (data && data[0]) {
        console.log('=== Application Success ===')
        console.log('Application ID:', data[0].id)
        console.log('Starting email send process...')
        
        // メール送信
        try {
          console.log('Calling sendApplicationEmails...')
          const emailResult = await sendApplicationEmailsWithGmail(
            formData.email,
            formData.name,
            data[0].id
          )
          console.log('sendApplicationEmails returned:', emailResult)
          
          if (!emailResult.success) {
            console.warn('Email sending failed, but application was successful')
          } else {
            console.log('Email sending completed successfully')
          }
        } catch (emailError) {
          console.error('Email error in catch block:', emailError)
          console.error('Email error details:', {
            message: emailError instanceof Error ? emailError.message : 'Unknown error',
            stack: emailError instanceof Error ? emailError.stack : undefined
          })
          // メール送信失敗でも申し込みは完了しているので処理を続行
        }
        
        router.push('/apply/success')
      }
    } catch (err) {
      console.error('Error:', err)
      alert('ネットワークエラーが発生しました。インターネット接続をご確認の上、再度お試しください。')
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
                      お名前（カナ）
                    </label>
                    <input
                      type="text"
                      name="name_kana"
                      id="name_kana"
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
                      電話番号
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      placeholder="090-1234-5678"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                      性別
                    </label>
                    <select
                      id="gender"
                      name="gender"
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
                      生年月日
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
                      住所
                    </label>
                    <input
                      type="text"
                      name="address"
                      id="address"
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

              {/* 送信ボタン */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '送信中...' : '申し込みを送信'}
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