'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Client } from '@/types'
import Navigation from '@/components/Navigation'
import Link from 'next/link'

export default function NewSessionPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    client_id: '',
    scheduled_date: '',
    type: 'trial' as 'trial' | 'regular',
    meet_link: '',
    notes: '',
    coach_name: '森山雄太',
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
      const { data, error } = await supabase
        .from('sessions')
        .insert([{
          ...formData,
          scheduled_date: new Date(formData.scheduled_date).toISOString(),
        }])
        .select()

      if (error) {
        console.error('Error creating session:', error)
        alert('セッションの作成に失敗しました。')
        return
      }

      if (data) {
        alert('セッションを作成しました。')
        router.push(`/sessions/${data[0].id}`)
      }
    } catch (err) {
      console.error('Error:', err)
      alert('エラーが発生しました。')
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

  const generateMeetLink = () => {
    const meetId = Math.random().toString(36).substring(2, 15)
    setFormData(prev => ({
      ...prev,
      meet_link: `https://meet.google.com/${meetId}`
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="mb-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900">新規セッション予約</h1>
              <p className="mt-2 text-sm text-gray-700">
                新しいセッションを予約します。
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <Link
                href="/sessions"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:w-auto"
              >
                戻る
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <form onSubmit={handleSubmit}>
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-6 gap-6">
                {/* セッション基本情報 */}
                <div className="col-span-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">セッション情報</h3>
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
                    クライアント <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="client_id"
                    name="client_id"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
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

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    セッション種別 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="type"
                    name="type"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    value={formData.type}
                    onChange={handleChange}
                  >
                    <option value="trial">トライアルセッション</option>
                    <option value="regular">通常セッション</option>
                  </select>
                </div>

                <div className="col-span-6 sm:col-span-4">
                  <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700">
                    予定日時 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduled_date"
                    id="scheduled_date"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    value={formData.scheduled_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <label htmlFor="coach_name" className="block text-sm font-medium text-gray-700">
                    コーチ名
                  </label>
                  <input
                    type="text"
                    name="coach_name"
                    id="coach_name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    value={formData.coach_name}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-span-6">
                  <label htmlFor="meet_link" className="block text-sm font-medium text-gray-700">
                    Google Meet リンク
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="url"
                      name="meet_link"
                      id="meet_link"
                      className="flex-1 block w-full rounded-none rounded-l-md border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                      placeholder="https://meet.google.com/..."
                      value={formData.meet_link}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={generateMeetLink}
                      className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm hover:bg-gray-100"
                    >
                      自動生成
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    オンラインセッションの場合は Google Meet リンクを設定してください。
                  </p>
                </div>

                <div className="col-span-6">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    備考・メモ
                  </label>
                  <textarea
                    name="notes"
                    id="notes"
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="セッションに関する備考やメモを入力してください"
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? '作成中...' : 'セッションを作成'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}