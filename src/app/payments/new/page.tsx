'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Client } from '@/types'
import Navigation from '@/components/Navigation'
import Link from 'next/link'

export default function NewPaymentPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    client_id: '',
    type: 'trial' as 'trial' | 'program',
    amount: 6000,
    due_date: '',
  })

  useEffect(() => {
    fetchClients()
    // デフォルトの期限を7日後に設定
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    setFormData(prev => ({
      ...prev,
      due_date: nextWeek.toISOString().split('T')[0]
    }))
  }, [])

  useEffect(() => {
    // 支払い種別に応じて金額を自動設定
    if (formData.type === 'trial') {
      setFormData(prev => ({ ...prev, amount: 6000 }))
    } else {
      setFormData(prev => ({ ...prev, amount: 214000 }))
    }
  }, [formData.type])

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
        .from('payments')
        .insert([formData])
        .select()

      if (error) {
        console.error('Error creating payment:', error)
        alert('支払い情報の作成に失敗しました。')
        return
      }

      if (data) {
        alert('支払い情報を作成しました。')
        router.push(`/payments/${data[0].id}`)
      }
    } catch (err) {
      console.error('Error:', err)
      alert('エラーが発生しました。')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseInt(value) || 0 : value
    }))
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      <Navigation />

      <main className="md:ml-64 p-6">
        <div className="mb-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900">新規支払い作成</h1>
              <p className="mt-2 text-sm text-gray-700">
                新しい支払い情報を作成します。
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <Link
                href="/payments"
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
                {/* 支払い基本情報 */}
                <div className="col-span-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">支払い情報</h3>
                </div>

                <div className="col-span-6 sm:col-span-4">
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
                        {client.name} ({client.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    支払い種別 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="type"
                    name="type"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    value={formData.type}
                    onChange={handleChange}
                  >
                    <option value="trial">トライアル料金</option>
                    <option value="program">プログラム料金</option>
                  </select>
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                    金額（円） <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">¥</span>
                    </div>
                    <input
                      type="number"
                      name="amount"
                      id="amount"
                      required
                      min="0"
                      step="1"
                      className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      placeholder="0"
                      value={formData.amount}
                      onChange={handleChange}
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.type === 'trial' ? 'トライアル料金: ¥6,000' : 'プログラム料金: ¥214,000'}
                  </p>
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                    支払い期限 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    id="due_date"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    value={formData.due_date}
                    onChange={handleChange}
                  />
                </div>

                {/* 料金説明 */}
                <div className="col-span-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">料金体系</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• トライアル料金: ¥6,000（税込）- 初回トライアルセッション</p>
                      <p>• プログラム料金: ¥214,000（税込）- 継続セッション（2〜6回目）</p>
                      <p>• 総額: ¥220,000（税込）- 6ヶ月間、月1回×6回（各30分程度）</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? '作成中...' : '支払い情報を作成'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}