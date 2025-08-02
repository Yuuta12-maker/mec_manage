'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugPage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setResult('')

    try {
      // 1. Supabaseクライアントの基本テスト
      const { data: { user } } = await supabase.auth.getUser()
      setResult(prev => prev + `1. Current user: ${user ? user.email : 'none'}\n`)

      // 2. 環境変数の確認
      setResult(prev => prev + `2. Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}\n`)
      setResult(prev => prev + `3. Anon Key exists: ${!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}\n`)

      // 3. 直接パスワード認証テスト
      setResult(prev => prev + `4. Testing sign in...\n`)
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'mindengineeringcoaching@gmail.com',
        password: 'password123',
      })

      if (signInError) {
        setResult(prev => prev + `5. Sign in ERROR: ${signInError.message}\n`)
        setResult(prev => prev + `   Error code: ${signInError.name}\n`)
        setResult(prev => prev + `   Full error: ${JSON.stringify(signInError, null, 2)}\n`)
      } else {
        setResult(prev => prev + `5. Sign in SUCCESS: ${signInData.user?.email}\n`)
      }

      // 4. Supabaseサービス自体のテスト
      const { data: healthData, error: healthError } = await supabase.from('_supabase_migrations').select('*').limit(1)
      if (healthError) {
        setResult(prev => prev + `6. Health check ERROR: ${healthError.message}\n`)
      } else {
        setResult(prev => prev + `6. Health check OK\n`)
      }

    } catch (err) {
      setResult(prev => prev + `CATCH ERROR: ${err}\n`)
    } finally {
      setLoading(false)
    }
  }

  const testSignUp = async () => {
    setLoading(true)
    setResult('')

    try {
      setResult('Testing signup with new email...\n')
      
      const { data, error } = await supabase.auth.signUp({
        email: 'test123@example.com',
        password: 'password123',
      })

      if (error) {
        setResult(prev => prev + `Signup ERROR: ${error.message}\n`)
      } else {
        setResult(prev => prev + `Signup SUCCESS: ${data.user?.email}\n`)
        setResult(prev => prev + `Confirmation required: ${!data.session}\n`)
      }
    } catch (err) {
      setResult(prev => prev + `CATCH ERROR: ${err}\n`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Supabase Debug Page</h1>
        
        <div className="space-y-4 mb-6">
          <button
            onClick={testConnection}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Connection & Sign In'}
          </button>
          
          <button
            onClick={testSignUp}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50 ml-4"
          >
            {loading ? 'Testing...' : 'Test Signup'}
          </button>
        </div>

        <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
          <pre>{result || 'Click button to start test...'}</pre>
        </div>
      </div>
    </div>
  )
}