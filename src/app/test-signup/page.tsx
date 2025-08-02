'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestSignupPage() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const createTestUser = async () => {
    setLoading(true)
    setMessage('')

    try {
      // まずメール確認設定を無効にする（可能であれば）
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'mindengineeringcoaching@gmail.com',
        password: 'password123',
        options: {
          data: {
            autoConfirm: true
          }
        }
      })

      if (signUpError) {
        setMessage(`サインアップエラー: ${signUpError.message}`)
        console.error('Signup error:', signUpError)
      } else {
        setMessage(`サインアップ成功! User ID: ${signUpData.user?.id}`)
        console.log('Signup success:', signUpData)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setMessage('予期しないエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    setLoading(true)
    setMessage('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'mindengineeringcoaching@gmail.com',
        password: 'password123',
      })

      if (error) {
        setMessage(`ログインエラー: ${error.message}`)
        console.error('Login error:', error)
      } else {
        setMessage(`ログイン成功! User ID: ${data.user?.id}`)
        console.log('Login success:', data)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setMessage('予期しないエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            テストページ
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            デバッグ用のユーザー作成とログインテスト
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={createTestUser}
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md disabled:opacity-50"
          >
            {loading ? '実行中...' : 'テストユーザー作成'}
          </button>
          
          <button
            onClick={testLogin}
            disabled={loading}
            className="w-full py-2 px-4 bg-green-600 text-white rounded-md disabled:opacity-50"
          >
            {loading ? '実行中...' : 'ログインテスト'}
          </button>
        </div>

        {message && (
          <div className="p-4 bg-gray-100 rounded-md">
            <p className="text-sm">{message}</p>
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-gray-500">
            メール: mindengineeringcoaching@gmail.com<br/>
            パスワード: password123
          </p>
        </div>
      </div>
    </div>
  )
}