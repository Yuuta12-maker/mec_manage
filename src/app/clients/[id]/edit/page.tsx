'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Client } from '@/types'
import Navigation from '@/components/Navigation'
import DangerousDeleteConfirm from '@/components/DangerousDeleteConfirm'
import Link from 'next/link'

export default function EditClientPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [clientName, setClientName] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    name_kana: '',
    email: '',
    gender: '',
    birth_date: '',
    phone: '',
    address: '',
    preferred_session_format: 'online',
    status: 'applied',
    notes: '',
  })

  useEffect(() => {
    if (clientId) {
      fetchClient()
    }
  }, [clientId])

  const fetchClient = async () => {
    setInitialLoading(true)
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (error) {
      console.error('Error fetching client:', error)
      alert('クライアント情報の取得に失敗しました。')
      router.push('/clients')
      return
    }

    if (data) {
      setFormData({
        name: data.name || '',
        name_kana: data.name_kana || '',
        email: data.email || '',
        gender: data.gender || '',
        birth_date: data.birth_date || '',
        phone: data.phone || '',
        address: data.address || '',
        preferred_session_format: data.preferred_session_format || 'online',
        status: data.status || 'applied',
        notes: data.notes || '',
      })
      setClientName(data.name || '')
    }

    setInitialLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)

      if (error) {
        console.error('Error updating client:', error)
        alert('クライアント情報の更新に失敗しました。')
        return
      }

      alert('クライアント情報を更新しました。')
      router.push(`/clients/${clientId}`)
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
    // 名前が変更された場合、削除確認用の名前も更新
    if (name === 'name') {
      setClientName(value)
    }
  }

  const handleDeleteClient = async () => {
    setDeleting(true)
    try {
      const deleteUrl = `/api/clients/${clientId}/delete`
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '削除に失敗しました')
      }

      const result = await response.json()
      alert(`クライアント「${result.deletedClient.name}」とすべての関連データが正常に削除されました。`)
      router.push('/clients')
    } catch (error) {
      console.error('Error deleting client:', error)
      alert(error instanceof Error ? error.message : '削除中にエラーが発生しました。')
    } finally {
      setDeleting(false)
    }
  }

  if (initialLoading) {
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
              <h1 className="text-2xl font-semibold text-gray-900">クライアント情報編集</h1>
              <p className="mt-2 text-sm text-gray-700">
                クライアント情報を更新してください。
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <Link
                href={`/clients/${clientId}`}
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
                {/* 基本情報 */}
                <div className="col-span-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">基本情報</h3>
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    氏名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="name_kana" className="block text-sm font-medium text-gray-700">
                    氏名（カナ）
                  </label>
                  <input
                    type="text"
                    name="name_kana"
                    id="name_kana"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    value={formData.name_kana}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-span-6 sm:col-span-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    メールアドレス <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                    性別
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="">選択してください</option>
                    <option value="male">男性</option>
                    <option value="female">女性</option>
                    <option value="other">その他</option>
                  </select>
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    生年月日
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      name="birth_year"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      value={formData.birth_date ? formData.birth_date.split('-')[0] : ''}
                      onChange={(e) => {
                        const year = e.target.value
                        const month = formData.birth_date ? formData.birth_date.split('-')[1] : ''
                        const day = formData.birth_date ? formData.birth_date.split('-')[2] : ''
                        setFormData(prev => ({
                          ...prev,
                          birth_date: year && month && day ? `${year}-${month}-${day}` : ''
                        }))
                      }}
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
                      value={formData.birth_date ? formData.birth_date.split('-')[1] : ''}
                      onChange={(e) => {
                        const year = formData.birth_date ? formData.birth_date.split('-')[0] : ''
                        const month = e.target.value.padStart(2, '0')
                        const day = formData.birth_date ? formData.birth_date.split('-')[2] : ''
                        setFormData(prev => ({
                          ...prev,
                          birth_date: year && month && day ? `${year}-${month}-${day}` : ''
                        }))
                      }}
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
                      value={formData.birth_date ? formData.birth_date.split('-')[2] : ''}
                      onChange={(e) => {
                        const year = formData.birth_date ? formData.birth_date.split('-')[0] : ''
                        const month = formData.birth_date ? formData.birth_date.split('-')[1] : ''
                        const day = e.target.value.padStart(2, '0')
                        setFormData(prev => ({
                          ...prev,
                          birth_date: year && month && day ? `${year}-${month}-${day}` : ''
                        }))
                      }}
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

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    電話番号
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-span-6">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    住所
                  </label>
                  <input
                    type="text"
                    name="address"
                    id="address"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>

                {/* セッション設定 */}
                <div className="col-span-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4 mt-6">セッション設定</h3>
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="preferred_session_format" className="block text-sm font-medium text-gray-700">
                    希望セッション形式
                  </label>
                  <select
                    id="preferred_session_format"
                    name="preferred_session_format"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    value={formData.preferred_session_format}
                    onChange={handleChange}
                  >
                    <option value="online">オンライン</option>
                    <option value="face-to-face">対面</option>
                  </select>
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    ステータス
                  </label>
                  <select
                    id="status"
                    name="status"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="applied">申込完了</option>
                    <option value="trial_booked">トライアル予約済</option>
                    <option value="trial_completed">トライアル完了</option>
                    <option value="active">継続中</option>
                    <option value="completed">完了</option>
                    <option value="inactive">非アクティブ</option>
                  </select>
                </div>

                <div className="col-span-6">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    備考
                  </label>
                  <textarea
                    name="notes"
                    id="notes"
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="クライアントに関する特記事項、注意点など..."
                  />
                </div>

                {/* 危険な操作セクション */}
                <div className="col-span-6">
                  <div className="border-t border-gray-200 mt-8 pt-8">
                    <h3 className="text-lg font-medium leading-6 text-red-900 mb-4">危険な操作</h3>
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3 flex-1">
                          <h4 className="text-sm font-medium text-red-800">クライアントを完全に削除</h4>
                          <p className="mt-1 text-sm text-red-700">
                            この操作は元に戻すことができません。クライアントと関連するすべてのデータが永久に削除されます。
                          </p>
                          <div className="mt-4">
                            <button
                              type="button"
                              onClick={() => setShowDeleteConfirm(true)}
                              disabled={deleting}
                              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              {deleting ? '削除中...' : 'クライアントを削除'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 text-right sm:px-6 space-x-3">
              <Link
                href={`/clients/${clientId}`}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? '更新中...' : '更新'}
              </button>
            </div>
          </form>
        </div>

        {/* 削除確認モーダル */}
        <DangerousDeleteConfirm
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteClient}
          title={`クライアント「${clientName}」を削除`}
          clientName={clientName}
          clientId={clientId}
          warningMessage="この操作は元に戻すことができません。クライアントと関連するすべてのデータが完全に削除されます。"
        />
      </main>
    </div>
  )
}