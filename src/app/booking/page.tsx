'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Client } from '@/types'

export default function BookingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [showClientForm, setShowClientForm] = useState(false)
  const [formData, setFormData] = useState({
    // セッション情報
    client_id: '',
    scheduled_date: '',
    type: 'trial' as 'trial' | 'regular',
    notes: '',
    // 新規クライアント情報
    client_name: '',
    client_name_kana: '',
    client_email: '',
    client_phone: '',
    preferred_session_format: 'online',
  })

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching clients:', error)
    } else {
      setClients(data || [])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let clientId = formData.client_id

      // 新規クライアントの場合
      if (showClientForm) {
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
      } else {
        // 既存クライアントのステータス更新
        await supabase
          .from('clients')
          .update({ status: 'trial_booked' })
          .eq('id', clientId)
      }

      // セッション作成
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert([{
          client_id: clientId,
          scheduled_date: new Date(formData.scheduled_date).toISOString(),
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

      if (session) {
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

  const handleClientTypeChange = (isNewClient: boolean) => {
    setShowClientForm(isNewClient)
    if (isNewClient) {
      setFormData(prev => ({ ...prev, client_id: '' }))
    } else {
      setFormData(prev => ({
        ...prev,
        client_name: '',
        client_name_kana: '',
        client_email: '',
        client_phone: '',
      }))
    }
  }

  // 現在時刻から24時間後を最小時刻として設定
  const getMinDateTime = () => {
    const now = new Date()
    now.setHours(now.getHours() + 24)
    return now.toISOString().slice(0, 16)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            マインドエンジニアリング・コーチング
          </h1>
          <p className="mt-2 text-lg text-gray-600 text-center">
            セッション予約フォーム
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4">
        {/* セッション種別説明 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
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
        <div className="bg-white rounded-lg shadow-sm">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                      セッション種別 <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="type"
                      name="type"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.type}
                      onChange={handleChange}
                    >
                      <option value="trial">トライアルセッション</option>
                      <option value="regular">通常セッション</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700">
                      希望日時 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="scheduled_date"
                      id="scheduled_date"
                      required
                      min={getMinDateTime()}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.scheduled_date}
                      onChange={handleChange}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      ※ 24時間前までにご予約ください
                    </p>
                  </div>
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

              {/* クライアント選択 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">予約者情報</h3>
                
                <div className="mb-6">
                  <fieldset>
                    <legend className="text-sm font-medium text-gray-700 mb-2">予約者の種別</legend>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          id="existing-client"
                          name="client-type"
                          type="radio"
                          checked={!showClientForm}
                          onChange={() => handleClientTypeChange(false)}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                        />
                        <label htmlFor="existing-client" className="ml-3 block text-sm font-medium text-gray-700">
                          既存のクライアント
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="new-client"
                          name="client-type"
                          type="radio"
                          checked={showClientForm}
                          onChange={() => handleClientTypeChange(true)}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                        />
                        <label htmlFor="new-client" className="ml-3 block text-sm font-medium text-gray-700">
                          新規のお客様
                        </label>
                      </div>
                    </div>
                  </fieldset>
                </div>

                {!showClientForm ? (
                  /* 既存クライアント選択 */
                  <div>
                    <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
                      クライアント選択 <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="client_id"
                      name="client_id"
                      required={!showClientForm}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.client_id}
                      onChange={handleChange}
                    >
                      <option value="">選択してください</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}{client.name_kana ? ` (${client.name_kana})` : ''} - {client.email}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  /* 新規クライアント情報入力 */
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="client_name" className="block text-sm font-medium text-gray-700">
                          お名前 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="client_name"
                          id="client_name"
                          required={showClientForm}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={formData.client_name}
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
                        <label htmlFor="client_email" className="block text-sm font-medium text-gray-700">
                          メールアドレス <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="client_email"
                          id="client_email"
                          required={showClientForm}
                          placeholder="example@email.com"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={formData.client_email}
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
                )}
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