'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'

export default function PublicDebugPage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    // ページロード時に環境変数をチェック
    setResult(`=== MEC Management Debug Page ===\n`)
    setResult(prev => prev + `Timestamp: ${new Date().toISOString()}\n\n`)
    
    setResult(prev => prev + `Environment Variables:\n`)
    setResult(prev => prev + `- NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING'}\n`)
    setResult(prev => prev + `- NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'EXISTS' : 'MISSING'}\n`)
    
    // Supabaseクライアント初期化
    const initSupabase = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        if (supabaseUrl && supabaseAnonKey) {
          const client = createClient(supabaseUrl, supabaseAnonKey)
          setSupabase(client)
          setResult(prev => prev + `- Supabase client: CREATED\n`)
        } else {
          setResult(prev => prev + `- Supabase client: FAILED (missing env vars)\n`)
        }
      } catch (err) {
        setResult(prev => prev + `- Supabase client: ERROR - ${err.message}\n`)
      }
    }
    
    initSupabase()
  }, [])

  const testAuth = async () => {
    if (!supabase) {
      setResult(prev => prev + `\nERROR: Supabase client not available\n`)
      return
    }

    setLoading(true)
    setResult(prev => prev + `\n=== Authentication Test ===\n`)

    try {
      setResult(prev => prev + `Testing login with:\n`)
      setResult(prev => prev + `- Email: mindengineeringcoaching@gmail.com\n`)
      setResult(prev => prev + `- Password: password123\n\n`)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'mindengineeringcoaching@gmail.com',
        password: 'password123',
      })

      if (error) {
        setResult(prev => prev + `❌ LOGIN FAILED:\n`)
        setResult(prev => prev + `- Message: ${error.message}\n`)
        setResult(prev => prev + `- Name: ${error.name}\n`)
        setResult(prev => prev + `- Status: ${error.status || 'N/A'}\n`)
        setResult(prev => prev + `- Full error: ${JSON.stringify(error, null, 2)}\n`)
      } else {
        setResult(prev => prev + `✅ LOGIN SUCCESS:\n`)
        setResult(prev => prev + `- User ID: ${data.user?.id}\n`)
        setResult(prev => prev + `- Email: ${data.user?.email}\n`)
        setResult(prev => prev + `- Session: ${!!data.session}\n`)
      }

    } catch (err) {
      setResult(prev => prev + `❌ UNEXPECTED ERROR: ${err.message}\n`)
      setResult(prev => prev + `Stack: ${err.stack}\n`)
    } finally {
      setLoading(false)
    }
  }

  const testSignup = async () => {
    if (!supabase) {
      setResult(prev => prev + `\nERROR: Supabase client not available\n`)
      return
    }

    setLoading(true)
    setResult(prev => prev + `\n=== Signup Test ===\n`)

    const testEmail = `test-${Date.now()}@example.com`
    
    try {
      setResult(prev => prev + `Testing signup with: ${testEmail}\n`)
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'password123',
      })

      if (error) {
        setResult(prev => prev + `❌ SIGNUP FAILED: ${error.message}\n`)
      } else {
        setResult(prev => prev + `✅ SIGNUP SUCCESS: ${data.user?.email}\n`)
        setResult(prev => prev + `- Needs confirmation: ${!data.session}\n`)
      }

    } catch (err) {
      setResult(prev => prev + `❌ SIGNUP ERROR: ${err.message}\n`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-4 bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4 text-red-600">🔍 MEC Management Debug</h1>
          
          <div className="space-x-4 mb-6">
            <button
              onClick={testAuth}
              disabled={loading || !supabase}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              {loading ? '⏳ Testing...' : '🔐 Test Login'}
            </button>
            
            <button
              onClick={testSignup}
              disabled={loading || !supabase}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              {loading ? '⏳ Testing...' : '📝 Test Signup'}
            </button>
          </div>

          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm overflow-auto max-h-96">
            <pre className="whitespace-pre-wrap">{result || 'Loading...'}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}