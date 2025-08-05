'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { sendBookingEmails } from '@/lib/email'
import BookingCalendar from '@/components/BookingCalendar'

export default function BookingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [existingSessions, setExistingSessions] = useState<any[]>([])
  const [formData, setFormData] = useState({
    // セッション情報
    type: 'trial' as 'trial' | 'regular',
    notes: '',
    // クライアント照合・新規情報
    client_name: '',
    client_email: '',
    client_name_kana: '',
    client_phone: '',
    preferred_session_format: 'online',
  })

  useEffect(() => {
    if (selectedDate) {
      fetchExistingSessions(selectedDate)
    }
  }, [selectedDate])

  const fetchExistingSessions = async (date: string) => {
    const startDate = new Date(date + 'T00:00:00')
    const endDate = new Date(date + 'T23:59:59')
    
    const { data, error } = await supabase
      .from('sessions')
      .select('scheduled_date')
      .gte('scheduled_date', startDate.toISOString())
      .lte('scheduled_date', endDate.toISOString())
      .eq('status', 'scheduled')

    if (error) {
      console.error('Error fetching sessions:', error)
    } else {
      setExistingSessions(data || [])
    }
  }

  const getAvailableTimeSlots = () => {
    const timeSlots = []
    for (let hour = 12; hour <= 19; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`
      const dateTimeString = selectedDate ? `${selectedDate}T${timeString}:00` : ''
      
      const isBooked = existingSessions.some(session => {
        const sessionTime = new Date(session.scheduled_date)
        const slotTime = new Date(dateTimeString)
        return sessionTime.getTime() === slotTime.getTime()
      })

      timeSlots.push({
        time: timeString,
        displayTime: `${hour}:00`,
        value: dateTimeString,
        isAvailable: !isBooked && selectedDate !== ''
      })
    }
    return timeSlots
  }

  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!selectedDate || !selectedTime) {
      alert('日付と時間を選択してください。')
      setLoading(false)
      return
    }

    try {
      let clientId = null

      // メールアドレスと氏名でクライアントを検索
      const { data: existingClients, error: searchError } = await supabase
        .from('clients')
        .select('*')
        .eq('email', formData.client_email)
        .eq('name', formData.client_name)

      if (searchError) {
        console.error('Error searching client:', searchError)
        alert('クライアント検索に失敗しました。')
        return
      }

      if (existingClients && existingClients.length > 0) {
        // 既存クライアントが見つかった場合
        clientId = existingClients[0].id
        
        // ステータス更新
        await supabase
          .from('clients')
          .update({ status: 'trial_booked' })
          .eq('id', clientId)
      } else {
        // 新規クライアント作成
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert([{
            name: formData.client_name,
            name_kana: formData.client_name_kana,
            email: formData.client_email,
            phone: formData.client_phone,
            preferred_session_format: formData.preferred_session_format,
            status: 'trial_booked',
            notes: 'セッション予約ページから登録'
          }])
          .select()

        if (clientError) {
          console.error('Error creating client:', clientError)
          alert('クライアント登録に失敗しました。')
          return
        }

        if (newClient && newClient[0]) {
          clientId = newClient[0].id
        }
      }

      // セッション作成
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert([{
          client_id: clientId,
          scheduled_date: new Date(selectedTime).toISOString(),
          type: formData.type,
          status: 'scheduled',
          notes: formData.notes,
          coach_name: '森山雄太',
        }])
        .select()

      if (sessionError) {
        console.error('Error creating session:', sessionError)
        alert('セッション予約に失敗しました。')
        return
      }

      if (session && session[0]) {
        console.log('=== Booking Success ===')
        console.log('Session ID:', session[0].id)
        console.log('Starting email send process...')
        
        // セッション予約完了メール送信
        try {
          console.log('Calling sendBookingEmails...')
          const emailResult = await sendBookingEmails(
            formData.client_email,
            formData.client_name,
            selectedTime,
            formData.type,
            undefined,
            session[0].id
          )
          console.log('sendBookingEmails returned:', emailResult)
          
          if (!emailResult.success) {
            console.warn('Email sending failed, but booking was successful')
          } else {
            console.log('Email sending completed successfully')
          }
        } catch (emailError) {
          console.error('Email error in catch block:', emailError)
          console.error('Email error details:', {
            message: emailError instanceof Error ? emailError.message : 'Unknown error',
            stack: emailError instanceof Error ? emailError.stack : undefined
          })
          // メール送信失敗でも予約は完了しているので処理を続行
        }
        
        router.push('/booking/success')
      }
    } catch (err) {
      console.error('Error:', err)
      alert('エラーが発生しました。再度お試しください。')
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



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* ヘッダー */}
      <header className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-700/50 transition-colors">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center transition-colors">
            マインドエンジニアリング・コーチング
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300 text-center transition-colors">
            セッション予約フォーム
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4">
        {/* セッション種別説明 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-700/50 p-6 mb-8 transition-colors">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">セッション種別</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <h3 className="font-medium text-orange-900 mb-2">トライアルセッション</h3>
              <p className="text-orange-800 text-sm mb-2">料金: ¥6,000（税込）</p>
              <p className="text-orange-700 text-sm">
                初回の方向けのお試しセッションです。プログラムの内容や進め方をご体験いただけます。
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">通常セッション</h3>
              <p className="text-blue-800 text-sm mb-2">継続プログラム内</p>
              <p className="text-blue-700 text-sm">
                継続プログラムをお申し込みいただいた方向けのセッションです。
              </p>
            </div>
          </div>
        </div>

        {/* 予約フォーム */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-700/50 transition-colors">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">セッション予約</h2>
            <p className="mt-1 text-sm text-gray-600">
              ご希望の日時とセッション情報をご入力ください。<span className="text-red-500">*</span>は必須項目です。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6">
            <div className="space-y-8">
              {/* セッション情報 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">セッション情報</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      希望日 <span className="text-red-500">*</span>
                    </label>
                    <BookingCalendar
                      selectedDate={selectedDate}
                      onDateSelect={setSelectedDate}
                      minDate={getMinDate()}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      ※ 翌日以降の日付を選択してください
                    </p>
                  </div>

                  {selectedDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        希望時間 <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {getAvailableTimeSlots().map((slot) => (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.isAvailable}
                            onClick={() => setSelectedTime(slot.value)}
                            className={`p-3 text-sm font-medium rounded-md border transition-colors ${
                              selectedTime === slot.value
                                ? 'bg-blue-600 text-white border-blue-600'
                                : slot.isAvailable
                                ? 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            }`}
                          >
                            {slot.displayTime}
                            {!slot.isAvailable && selectedDate && (
                              <div className="text-xs mt-1">予約済</div>
                            )}
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        営業時間: 12:00 〜 20:00（1時間単位）
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    ご希望・ご相談内容
                  </label>
                  <textarea
                    name="notes"
                    id="notes"
                    rows={3}
                    placeholder="セッションでお話ししたいことやご相談内容があればご記入ください"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* 予約者情報 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">予約者情報</h3>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="client_name" className="block text-sm font-medium text-gray-700">
                      お名前 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="client_name"
                      id="client_name"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.client_name}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="client_email" className="block text-sm font-medium text-gray-700">
                      メールアドレス <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="client_email"
                      id="client_email"
                      required
                      placeholder="example@email.com"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.client_email}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="client_name_kana" className="block text-sm font-medium text-gray-700">
                      お名前（カナ）
                    </label>
                    <input
                      type="text"
                      name="client_name_kana"
                      id="client_name_kana"
                      placeholder="ヤマダタロウ"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.client_name_kana}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="client_phone" className="block text-sm font-medium text-gray-700">
                      電話番号
                    </label>
                    <input
                      type="tel"
                      name="client_phone"
                      id="client_phone"
                      placeholder="090-1234-5678"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.client_phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="preferred_session_format" className="block text-sm font-medium text-gray-700">
                      希望セッション形式 <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="preferred_session_format"
                      name="preferred_session_format"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.preferred_session_format}
                      onChange={handleChange}
                    >
                      <option value="online">オンライン（Google Meet）</option>
                      <option value="face-to-face">対面</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 注意事項 */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-yellow-900 mb-2">ご予約にあたって</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• ご予約確定後、担当者よりご連絡させていただきます</li>
                  <li>• セッション開始15分前にGoogle Meetリンクをお送りします（オンラインの場合）</li>
                  <li>• やむを得ずキャンセルされる場合は、24時間前までにご連絡ください</li>
                  <li>• ご不明な点がございましたら、お気軽にお問い合わせください</li>
                </ul>
              </div>

              {/* 送信ボタン */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '予約中...' : 'セッションを予約'}
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