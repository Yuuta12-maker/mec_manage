'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'

export default function DebugPage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  // Supabaseクライアントを動的にインポート
  const [supabase, setSupabase] = useState(null)

  useEffect(() => {
    const initSupabase = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        setResult(prev => prev + `Environment check:\n`)
        setResult(prev => prev + `- URL: ${supabaseUrl || 'MISSING'}\n`)
        setResult(prev => prev + `- Key: ${supabaseAnonKey ? 'EXISTS' : 'MISSING'}\n`)
        
        if (supabaseUrl && supabaseAnonKey) {
          const client = createClient(supabaseUrl, supabaseAnonKey)
          setSupabase(client)
          setResult(prev => prev + `- Client created successfully\n`)
        } else {
          setResult(prev => prev + `- Cannot create client: missing env vars\n`)
        }
      } catch (err) {
        setResult(prev => prev + `- Error creating client: ${err.message}\n`)
      }
    }
    
    initSupabase()
  }, [])

  const testConnection = async () => {
    if (!supabase) {
      setResult(prev => prev + `Cannot test: Supabase client not available\n`)
      return
    }

    setLoading(true)
    setResult(prev => prev + `\nTesting authentication...\n`)

    try {
      // 1. 現在のユーザー確認
      const { data: { user } } = await supabase.auth.getUser()
      setResult(prev => prev + `1. Current user: ${user ? user.email : 'none'}\n`)

      // 2. 直接パスワード認証テスト
      setResult(prev => prev + `2. Testing sign in...\n`)
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'mindengineeringcoaching@gmail.com',
        password: 'password123',
      })

      if (signInError) {
        setResult(prev => prev + `3. Sign in ERROR: ${signInError.message}\n`)
        setResult(prev => prev + `   Error code: ${signInError.name}\n`)
        setResult(prev => prev + `   Status: ${signInError.status}\n`)
      } else {
        setResult(prev => prev + `3. Sign in SUCCESS: ${signInData.user?.email}\n`)
      }

    } catch (err) {
      setResult(prev => prev + `CATCH ERROR: ${err.message}\n`)
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