import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      name_kana,
      email,
      phone,
      birth_date,
    } = body

    console.log('=== API Route: Verify Client ===')
    console.log('Request body:', { name, name_kana, email, phone, birth_date })

    if (!name || !name_kana || !email || !phone || !birth_date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // クライアント情報を照合
    // 5つの条件すべてが一致するクライアントを検索
    const { data: clients, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('name', name.trim())
      .eq('name_kana', name_kana.trim())
      .eq('email', email.trim())
      .eq('phone', phone.trim())
      .eq('birth_date', birth_date)
      .in('status', ['trial_booked', 'trial_completed']) // トライアル済みのクライアントのみ

    if (clientError) {
      console.error('Error querying clients:', clientError)
      return NextResponse.json(
        { success: false, error: 'Database query error' },
        { status: 500 }
      )
    }

    if (!clients || clients.length === 0) {
      console.log('No matching client found')
      
      // 部分的に一致するクライアントがいるかチェック（デバッグ用）
      const { data: partialMatches } = await supabaseAdmin
        .from('clients')
        .select('name, email, phone')
        .or(`email.eq.${email.trim()},phone.eq.${phone.trim()}`)
        .limit(3)

      console.log('Partial matches found:', partialMatches)

      return NextResponse.json(
        { 
          success: false, 
          error: 'お客様の情報が見つかりませんでした。入力内容をご確認いただき、正確にご入力ください。'
        },
        { status: 404 }
      )
    }

    if (clients.length > 1) {
      console.warn('Multiple clients found with same information:', clients.length)
      // 複数見つかった場合は最初の1件を使用
    }

    const client = clients[0]
    console.log('Client found:', { id: client.id, name: client.name, email: client.email, status: client.status })

    // トライアルセッション情報を取得（あれば）
    const { data: trialSessions } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('client_id', client.id)
      .eq('type', 'trial')
      .order('created_at', { ascending: false })
      .limit(1)

    let trialSessionId = null
    if (trialSessions && trialSessions.length > 0) {
      trialSessionId = trialSessions[0].id
    }

    return NextResponse.json({
      success: true,
      client: {
        ...client,
        trial_session_id: trialSessionId,
      },
      message: 'Client verified successfully'
    })
  } catch (error) {
    console.error('API Route error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}